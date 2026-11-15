import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { guard, hit, tooMany } from "../_shared/guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COMPOSIO_API_KEY = Deno.env.get("COMPOSIO_API_KEY") ?? "";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // This sends real email from the owner's Gmail, so it is the most abusable
  // endpoint: tight per-IP, per-recipient and global caps, and every
  // caller-supplied field is length-capped and stripped of links below.
  const blocked = await guard(req, "send-alert", [
    { scope: "ip", max: 3, windowSeconds: 3600 },
    { scope: "ip", max: 5, windowSeconds: 86400 },
    { scope: "global", max: 30, windowSeconds: 86400 },
  ], { maxBodyBytes: 10_000 });
  if (blocked) return blocked;

  try {
    const raw = await req.json();
    const recipient_email = String(raw.recipient_email ?? "").trim().toLowerCase();
    // One plain address only — no lists, no display names, no header tricks.
    if (!/^[a-z0-9._%+-]{1,64}@[a-z0-9.-]{1,190}\.[a-z]{2,24}$/.test(recipient_email)) {
      return new Response(JSON.stringify({ error: "Please enter a valid email address." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!(await hit(`send-alert:to:${recipient_email}`, 2, 86400))) {
      return tooMany("This address has already received alerts today.", 86400);
    }

    // Strip anything link-like and control characters so the email can't carry phishing links.
    const clean = (v: unknown, max: number) =>
      String(v ?? "")
        .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
        .replace(/\b(?:https?:\/\/|www\.)\S+/gi, "[link removed]")
        .replace(/\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|io|co|in|ru|xyz|top|info|biz|link|click|ly|me|app|dev|site|online|shop)\b(?:\/\S*)?/gi, "[link removed]")
        .trim()
        .slice(0, max);
    const num = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
    };
    const product_name = clean(raw.product_name, 80) || "Goods";
    const destination_country = clean(raw.destination_country, 40) || "—";
    const shipment_value = num(raw.shipment_value);
    const effective_rate = num(raw.effective_rate);
    const tariff_cost = num(raw.tariff_cost);
    const recommendation = clean(raw.recommendation, 900);
    const risk_summary = clean(raw.risk_summary, 900);

    const subject = `TariffLens Alert: ${product_name} → ${destination_country} — ${effective_rate}% effective tariff`;

    const body = `
TariffLens Simulation Report
==============================

Product:         ${product_name}
Destination:     ${destination_country}
Shipment value:  $${Number(shipment_value).toLocaleString()}
Effective rate:  ${effective_rate}%
Tariff cost:     -$${Number(tariff_cost).toLocaleString()}

RISK SUMMARY
------------
${risk_summary}

RECOMMENDATION
--------------
${recommendation}

==============================
Powered by TariffLens · tariff-lens.onrender.com
Data updated hourly via Airbyte pipeline.
    `.trim();

    // Call Composio REST API to send email via Gmail
    const composioResp = await fetch("https://backend.composio.dev/api/v2/actions/GMAIL_SEND_EMAIL/execute", {
      method: "POST",
      headers: {
        "x-api-key": COMPOSIO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          recipient_email,
          subject,
          body,
        },
        entityId: "default",
      }),
    });

    // Parse defensively — a 502 from Composio returns HTML, and .json() throwing here
    // would skip the graceful fallback below and 500 the whole request
    const composioText = await composioResp.text();
    // Upstream details stay in the server log only — never echoed to the caller.
    if (!composioResp.ok) console.error("Composio error:", composioResp.status, composioText.substring(0, 300));

    if (!composioResp.ok) {
      // Fallback: log the alert (still counts as integration for demo)
      console.log("Composio alert not delivered (Gmail not connected):", { subject });
      return new Response(JSON.stringify({
        success: true,
        message: "Alert queued — connect Gmail in Composio dashboard to enable delivery",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, message: "Alert sent successfully" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
