// QA harness: calls simulate-tariff for each US-destination product row and
// checks the output for the failure modes we know about. Run in batches:
//   node qa/test-products.mjs <startIndex> <count>
// Appends results to qa/results.json (keyed by hs_code|origin so reruns overwrite).
import { readFileSync, writeFileSync, existsSync } from "fs";

const KEY = readFileSync(new URL("../.env", import.meta.url), "utf8").match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim();
const BASE = "https://qszregcopfbiavgwvfip.supabase.co";
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const start = parseInt(process.argv[2] ?? "0");
const count = parseInt(process.argv[3] ?? "10");

const rows = await (await fetch(
  `${BASE}/rest/v1/tariff_rates?select=hs_code,product_name,origin_country,retaliation_rate&destination_country=eq.United%20States&order=hs_code`,
  { headers: H }
)).json();

const resultsPath = new URL("./results.json", import.meta.url);
const results = existsSync(resultsPath) ? JSON.parse(readFileSync(resultsPath, "utf8")) : {};

const batch = rows.slice(start, start + count);
console.log(`Testing rows ${start}–${start + batch.length - 1} of ${rows.length}`);

for (const row of batch) {
  const key = `${row.hs_code}|${row.origin_country ?? "all"}`;
  const origin = row.origin_country && row.origin_country !== "United States" ? row.origin_country : "India";
  const body = {
    hs_code: row.hs_code.padEnd(8, "0"),
    destination_country: "United States",
    origin_country: origin,
    shipment_value: 100000,
    product_name: row.product_name,
    trade_mode: "exporter",
  };
  const t0 = Date.now();
  let r, err = null;
  try {
    const resp = await fetch(`${BASE}/functions/v1/simulate-tariff`, { method: "POST", headers: H, body: JSON.stringify(body) });
    r = await resp.json();
    if (!resp.ok) err = `HTTP ${resp.status}: ${JSON.stringify(r).slice(0, 120)}`;
  } catch (e) { err = String(e); }
  const secs = ((Date.now() - t0) / 1000).toFixed(1);

  const issues = [];
  if (err) issues.push(`ERROR: ${err}`);
  else {
    if (r.mfn_rate === null) issues.push("mfn_rate null (no USITC/WTO rate found)");
    if (row.retaliation_rate > 0 && (r.retaliation_rate ?? 0) === 0 && (r.origin_specific_rate ?? 0) === 0)
      issues.push(`DB row has ${row.retaliation_rate}% duty but simulation returned 0 extra duty`);
    const vs = r.volatility_stats;
    const hist = r.rate_history ?? [];
    const histMax = hist.length ? Math.max(...hist.map((h) => h.rate)) : 0;
    if (vs && histMax > 0.5 && (vs.max_rate ?? 0) === 0) issues.push(`sparkline peak ${histMax.toFixed(1)}% but volatility_stats.max_rate=0 (avg/peak header bug)`);
    if (hist.length === 0) issues.push("no rate history");
    if (!r.regulatory_flags || r.regulatory_flags.length === 0) issues.push("zero regulatory flags");
    if (/reroute|ship(ping)? through|transship/i.test(r.recommendation ?? "")) issues.push(`transshipment-style recommendation: "${(r.recommendation ?? "").slice(0, 100)}"`);
    if (!r.recommendation) issues.push("no AI recommendation (Groq failed?)");
  }

  results[key] = {
    product: row.product_name,
    origin,
    tested_hs: body.hs_code,
    seconds: Number(secs),
    effective_rate: r?.effective_rate ?? null,
    extra_duty: (r?.retaliation_rate ?? 0) + (r?.origin_specific_rate ?? 0),
    flags: (r?.regulatory_flags ?? []).map((f) => f.title.split("—")[0].trim()),
    issues,
  };
  console.log(`${issues.length ? "✗" : "✓"} ${key} (${secs}s) ${issues.join(" | ")}`);
}

writeFileSync(resultsPath, JSON.stringify(results, null, 2));
const all = Object.values(results);
console.log(`\nProgress: ${all.length}/${rows.length} tested · ${all.filter((x) => x.issues.length).length} with issues`);
