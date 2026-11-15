// Abuse guard shared by the public edge functions.
//
// - Per-IP and global rate limits, counted in Postgres via public.rl_hit()
//   (service-role only; see migrations/20261115120000_rate_limits.sql).
// - Request body size cap.
// Fails OPEN if the limiter itself errors, so a limiter outage never takes
// the product down — it only removes the protection until it recovers.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type Limit = { scope: "ip" | "global"; max: number; windowSeconds: number };

const corsBase = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

let client: ReturnType<typeof createClient> | null = null;
function db() {
  if (!client) {
    client = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
  }
  return client;
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  return (
    xff.split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Consume one hit from a named bucket. Returns true if allowed. */
export async function hit(bucket: string, max: number, windowSeconds: number): Promise<boolean> {
  try {
    const { data, error } = await db().rpc("rl_hit", {
      p_bucket: bucket,
      p_window_seconds: windowSeconds,
      p_max: max,
    });
    if (error) {
      console.error("rate limiter error (failing open):", error.message);
      return true;
    }
    return data !== false;
  } catch (err) {
    console.error("rate limiter exception (failing open):", err);
    return true;
  }
}

export function tooMany(message: string, retryAfterSeconds: number): Response {
  return new Response(JSON.stringify({ error: message, rate_limited: true }), {
    status: 429,
    headers: { ...corsBase, "Retry-After": String(retryAfterSeconds) },
  });
}

/**
 * Run all limits for a function. Returns a 429/413 Response to send back,
 * or null if the request may proceed.
 */
export async function guard(
  req: Request,
  fn: string,
  limits: Limit[],
  opts: { maxBodyBytes?: number } = {},
): Promise<Response | null> {
  if (opts.maxBodyBytes) {
    const len = Number(req.headers.get("content-length") ?? "0");
    if (len > opts.maxBodyBytes) {
      return new Response(
        JSON.stringify({ error: `Upload too large (max ${Math.round(opts.maxBodyBytes / 1e6)} MB).` }),
        { status: 413, headers: corsBase },
      );
    }
  }

  const ip = clientIp(req);
  // Check per-IP limits first so one abuser can't eat the global budget.
  const ordered = [...limits].sort((a, b) => (a.scope === b.scope ? 0 : a.scope === "ip" ? -1 : 1));
  for (const l of ordered) {
    const bucket = l.scope === "ip" ? `${fn}:ip:${ip}:${l.windowSeconds}` : `${fn}:global:${l.windowSeconds}`;
    const ok = await hit(bucket, l.max, l.windowSeconds);
    if (!ok) {
      return l.scope === "ip"
        ? tooMany("You're going a bit fast — please wait a few minutes and try again.", Math.min(l.windowSeconds, 3600))
        : tooMany("This free demo is very busy right now — please try again later.", Math.min(l.windowSeconds, 3600));
    }
  }
  return null;
}
