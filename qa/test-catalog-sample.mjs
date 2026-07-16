// Tier-3 QA: random sample of the full hts_catalog through simulate-tariff.
// Deterministic spread: one product from every Nth position ordered by hts8.
// Run: node qa/test-catalog-sample.mjs [count]
import { readFileSync, writeFileSync, existsSync } from "fs";

const KEY = readFileSync(new URL("../.env", import.meta.url), "utf8").match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim();
const BASE = "https://qszregcopfbiavgwvfip.supabase.co";
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const count = parseInt(process.argv[2] ?? "25");
const TOTAL = 12788;
const step = Math.floor(TOTAL / count);

const path = new URL("./catalog-sample-results.json", import.meta.url);
const results = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};

for (let i = 0; i < count; i++) {
  const offset = i * step;
  const [row] = await (await fetch(
    `${BASE}/rest/v1/hts_catalog?select=hts8,description,mfn_rate&order=hts8&limit=1&offset=${offset}`,
    { headers: H }
  )).json();
  if (!row) continue;
  if (results[row.hts8] && !results[row.hts8].issues.length) { console.log(`· ${row.hts8} cached ok`); continue; }

  const t0 = Date.now();
  let r, err = null;
  try {
    const resp = await fetch(`${BASE}/functions/v1/simulate-tariff`, {
      method: "POST", headers: H,
      body: JSON.stringify({
        hs_code: row.hts8, destination_country: "United States", origin_country: "India",
        shipment_value: 100000, product_name: row.description?.slice(0, 60), trade_mode: "exporter",
      }),
    });
    r = await resp.json();
    if (!resp.ok) err = `HTTP ${resp.status}: ${JSON.stringify(r).slice(0, 100)}`;
  } catch (e) { err = String(e); }
  const secs = ((Date.now() - t0) / 1000).toFixed(1);

  const issues = [];
  if (err) issues.push(`ERROR: ${err}`);
  else {
    const catalogPct = (row.mfn_rate ?? 0) * 100;
    const isSentinel = catalogPct > 200;
    if (isSentinel && !r.specific_duty_note) issues.push("sentinel rate but no specific_duty_note");
    if (!isSentinel && r.effective_rate === null) issues.push("effective_rate null");
    if (!isSentinel && catalogPct > 0.05 && (r.effective_rate ?? 0) === 0 && (r.mfn_rate ?? 0) === 0)
      issues.push(`catalog says ${catalogPct.toFixed(1)}% but sim returned 0%`);
    if (!r.regulatory_flags?.length) issues.push("zero regulatory flags");
    if ((r.rate_history ?? []).length === 0) issues.push("no rate history");
    const vs = r.volatility_stats, hist = r.rate_history ?? [];
    const histMax = hist.length ? Math.max(...hist.map((h) => h.rate)) : 0;
    if (vs && histMax > 0.5 && (vs.max_rate ?? 0) === 0) issues.push("avg/peak zero despite history");
    if (/reroute|ship(ping)? through|transship/i.test(r?.recommendation ?? "")) issues.push("transshipment recommendation");
  }

  results[row.hts8] = { description: row.description?.slice(0, 60), catalog_pct: Number(((row.mfn_rate ?? 0) * 100).toFixed(2)), effective: r?.effective_rate ?? null, seconds: Number(secs), issues };
  console.log(`${issues.length ? "✗" : "✓"} ${row.hts8} ${row.description?.slice(0, 45)} (${secs}s) ${issues.join(" | ")}`);
}

writeFileSync(path, JSON.stringify(results, null, 2));
const all = Object.values(results);
console.log(`\nCatalog sample: ${all.length} tested · ${all.filter((x) => x.issues.length).length} with issues`);
