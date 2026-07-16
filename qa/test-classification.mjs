// Tier-2 QA: does a real exporter query classify into the curated compliance category?
// Run: node qa/test-classification.mjs [startIndex] [count]
import { readFileSync, writeFileSync, existsSync } from "fs";

const KEY = readFileSync(new URL("../.env", import.meta.url), "utf8").match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim();
const BASE = "https://qszregcopfbiavgwvfip.supabase.co";
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

// query → acceptable HS4s (from the curated profile set)
const CASES = [
  ["turmeric powder", ["0910"]],
  ["red chilli powder", ["0904"]],
  ["cumin seeds", ["0909"]],
  ["green cardamom", ["0908"]],
  ["basmati rice", ["1006"]],
  ["frozen shrimp", ["0306"]],
  ["black tea", ["0902"]],
  ["cashew nuts", ["0801"]],
  ["guar gum powder", ["1302"]],
  ["mens cotton t-shirts", ["6109"]],
  ["ladies woven dresses", ["6204"]],
  ["cotton bed sheets", ["6302"]],
  ["hand knotted wool carpet", ["5701", "5703"]],
  ["cotton yarn", ["5205"]],
  ["mens leather shoes", ["6403"]],
  ["leather handbags", ["4202"]],
  ["gold jewelry", ["7113"]],
  ["pharmaceutical tablets", ["3004"]],
  ["ayurvedic herbal supplement", ["3004", "2106"]],
  ["welded steel pipes", ["7306"]],
  ["stainless steel flanges", ["7307"]],
  ["brake pads auto parts", ["8708"]],
  ["ceramic floor tiles", ["6907"]],
  ["wooden handicrafts", ["4420"]],
  ["brass statue handicrafts", ["8306"]],
];

const start = parseInt(process.argv[2] ?? "0");
const count = parseInt(process.argv[3] ?? CASES.length);
const path = new URL("./classification-results.json", import.meta.url);
const results = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};

for (const [query, expected] of CASES.slice(start, start + count)) {
  const t0 = Date.now();
  let issues = [], top = null;
  try {
    const resp = await fetch(`${BASE}/functions/v1/classify-hs`, {
      method: "POST", headers: H, body: JSON.stringify({ description: query }),
    });
    const r = await resp.json();
    if (!resp.ok) issues.push(`HTTP ${resp.status}`);
    const cands = r.candidates ?? [];
    top = cands[0] ?? null;
    if (!top) issues.push("no candidates returned");
    else {
      const hs4 = String(top.hts8 ?? "").slice(0, 4);
      if (!expected.includes(hs4)) issues.push(`top candidate ${top.hts8} (${(top.description ?? "").slice(0, 40)}) not in expected ${expected.join("/")}`);
      if (!top.usitc_validated) issues.push("top candidate not USITC-validated");
    }
  } catch (e) { issues.push(String(e)); }
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  results[query] = { expected, got: top?.hts8 ?? null, confidence: top?.confidence ?? null, seconds: Number(secs), issues };
  console.log(`${issues.length ? "✗" : "✓"} "${query}" → ${top?.hts8 ?? "none"} (${secs}s) ${issues.join(" | ")}`);
}

writeFileSync(path, JSON.stringify(results, null, 2));
const all = Object.values(results);
console.log(`\nClassification: ${all.length}/${CASES.length} tested · ${all.filter((x) => x.issues.length).length} failing`);
