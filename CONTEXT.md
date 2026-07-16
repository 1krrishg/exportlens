# ExportLens — Full Build Context & Recovery Document

> If everything breaks, this file is enough to understand, rebuild, or hand off the entire product.
> Last updated: July 16, 2026.

---

## 1. What this product is

**ExportLens** — a pre-shipment US customs check for Indian exporters.
Type a product (or upload a commercial invoice) → get on one page:

1. HS code (GRI-classified against the real USITC catalog, CBP-ruling-backed)
2. The real US duty — MFN + AD/CVD orders + Section 301/232 stacked
3. Landed cost to the dollar — duty + MPF + HMF per 19 CFR 24
4. Every US agency requirement (FDA/CPSC/USDA/EPA/FWS/NOAA/DOT/FTC) with .gov links
5. Documents checklist for the entry
6. Detention risks — FDA import alerts and the actual refusal reasons for that category

Positioning: "Your CHA gets you out of India — ExportLens gets you into America."
Target user: Indian SMB exporter shipping to the US. Priced-for-India SaaS (₹2-5k/mo idea).
Free-tier top-of-funnel = duty calculator; paid value = compliance intelligence.

**History:** Bootstrapped July 14-16, 2026 from the TariffLens hackathon codebase
(`/Users/1krrishgoel/Downloads/tariff and that`, github.com/1krrishg/tariff-lens). TariffLens
(US importer/exporter tariff simulator) remains untouched as its own product. A separate
brainstorm doc ("TradeTerminal", Runpod hackathon) contributed the two-panel results layout
and the margin/landed-cost thinking.

## 2. URLs & infrastructure

| Thing | Value |
|---|---|
| Live site | https://exportlens.vercel.app (Vercel, auto-deploys on push to main) |
| GitHub | https://github.com/1krrishg/exportlens |
| Local folder | /Users/1krrishgoel/Downloads/exportlens |
| Supabase project | qszregcopfbiavgwvfip (SHARED with TariffLens — same DB, same edge functions) |
| Analytics | Vercel Analytics, `<Analytics/>` in src/main.tsx, enabled in dashboard |
| Old product (do not break) | tariff-lens.onrender.com, folder "tariff and that" |

**⚠️ Shared Supabase:** deploying an edge function from this repo overwrites the function
TariffLens uses. All changes so far were additive (safe for both). Long-term: split projects.

## 3. Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind + shadcn/ui. Deploy: Vercel
  (vercel.json has the SPA rewrite → all routes serve index.html; react-router needs it).
- **Backend:** Supabase Edge Functions (Deno): `classify-hs`, `simulate-tariff`,
  `extract-shipment`, `scrape-tariffs`, `send-alert`. Deploy:
  `npx supabase functions deploy <name> --project-ref qszregcopfbiavgwvfip`
- **AI:** Groq `llama-3.3-70b-versatile` (classification ranking, risk analysis, doc-field
  extraction); Mistral `mistral-ocr-latest` + `pixtral-12b-2409` (invoice OCR / photo reading).
- **Env:** frontend uses VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY (in committed .env —
  anon key, safe). Edge secrets (Supabase dashboard → Edge Functions → Secrets): GROQ_API_KEY,
  GROQ_API_KEY_2 (same org as key 1 — shares quota), GROQ_API_KEY_3 (DIFFERENT org — real
  fallback), MISTRAL_API_KEY, WTO_API_KEY, COMPOSIO_API_KEY. Never commit these.

## 4. Database (Supabase Postgres)

- **hts_catalog** — 12,788 products, the full USITC HTS schedule. `hts8`, `description`,
  `mfn_rate` stored as DECIMAL FRACTION (0.105 = 10.5%) → always ×100 to display.
  Sentinel: mfn_rate 10000 (=1,000,000%) means SPECIFIC duty (¢/kg, per unit) — 558 rows.
  Anything >200% after ×100 is treated as sentinel, shown with a specific-duty warning.
- **rate_history** — USITC MFN by year 1998–2026 (~262k rows). Source of the sparkline.
- **hts_volatility** — precomputed avg/max/jump stats. ⚠️ Many rows zeroed/corrupt (keys like
  "29035100|1"). simulate-tariff falls back to computing avg/peak from rate_history when
  volatility max is 0 — keeps header consistent with the chart.
- **tariff_rates** — the EXTRA-duties overlay (~281 rows): Section 301, Section 232, AD/CVD,
  safeguards. Unique on (hs_code, destination_country, origin_country) NULLS NOT DISTINCT.
  `origin_country = NULL` → global duty (e.g. 232 steel); `= "India"` → origin-specific
  (e.g. shrimp ADD A-533-840). `retaliation_rate` = the additional duty %.
  ⚠️ `effective_rate` column is legacy/broken — never use it (computed at scrape time with mfn=0).
  Rows are seeded by `scrape-tariffs` (KNOWN_RETALIATIONS hardcoded list + WTO fetches).
  India-origin US AD/CVD rows: shrimp 0306, steel 7208, pipe 7306, flanges 7307 (78%),
  quartz 6810, aluminum sheet 7606 (49%), OTR tires 4011, PET resin 3907.
- **scrape_log**, **regulatory_alerts** — pipeline log + Federal Register items (landing feed).

## 5. Edge functions — key logic

### classify-hs (retrieve-then-rank; NO hallucinated codes)
1. `DIRECT_LOOKUP` — ~380 product-word → HS4 keys (incl. Indian staples: basmati, haldi,
   cardamom, jeera, masala, saree, durrie, brass statue, steel pipe, flanges, brake pads,
   t-shirts, guar gum…). Longest-key-first; `EXACT_ONLY` set guards ambiguous bare words
   (oil, gas, pipe, pipes, yarn, brass, ginger, pepper, chip…) to exact-full-query matches only.
2. No lookup hit → LLM suggests headings (wrapped in try/catch → empty on failure).
3. `fetchUsitcCandidates` — real 8-digit rows for candidate headings + stopword-filtered
   keyword fallback when headings found nothing.
4. `rankCandidates` — LLM picks/ranks only from the actual catalog list (wrapped: on Groq
   failure returns [], degraded path continues).
5. Degraded fallback ordering: keyword-overlap scoring against query (so "frozen shrimp"
   picks the shrimp line, not crabmeat), confidence 60/40, GRI 1.
6. Enrichment: CBP CROSS ruling search per candidate (rulings.cbp.gov API).
Input: `{description}`. Output: `{candidates:[{hts8,heading,description,gri_rule,reasoning,
confidence,disqualified,mfn_rate,usitc_validated,cbp_ruling}]}`.

### simulate-tariff (the core engine)
Input: `{hs_code, destination_country, origin_country, shipment_value, product_name,
trade_mode, incoterms?, quantity?}`. Pipeline:
- Validation (400 on bad input / origin==destination), IP rate limiting, sanctions gate
  (OFAC dict → early return), Section 232 exemption dict.
- Rates: USITC catalog (fraction ×100, sentinel→`specific_duty_note`), tariff_rates global row
  + origin-specific row (base + originSpecific stacked; never double-count via liveEntry),
  WTO MFN via API (HS_A_0010, the ONLY working product-level indicator), WTO bound = hardcoded
  `WTO_BOUND_AVG` country averages (HS_A_0030 is NOT bound rate — it's % duty-free lines;
  HS_A_0020 is NOT preferential — it's max duty; both were removed after live verification).
- FTA: `FTA_AGREEMENTS` dict (USMCA, KORUS, CPTPP, India-UAE CEPA, India-Australia ECTA,
  Japan-India CEPA, CECA…) → preferential 0% + rules-of-origin caveat.
- Trade flow: UN Comtrade public API (comtradeapi.un.org/public/v1/preview/C/A/HS) — WTO has
  no bilateral product-level values (TP_A_0010 doesn't exist; learned the hard way).
- Regulatory flags engine (`computeRegulatoryFlags`): UFLPA (China+listed HS4s), USMCA RoO,
  EAR/ITAR, and for destination US: FDA FSMA (food ch. 01–24), FDA drugs (30), medical devices
  (9018–22), CPSC (toys/children + listed HS4s), CPSC/FTC apparel flammability+labeling
  (ch. 61/62/63), FCC (RF electronics), EPA vehicles, EPA TSCA chemicals (28/29/32/34/38/39),
  DOT tires (4011–13), USDA APHIS (plants ch. 06–14), USDA FSIS (meat 02/05/16), and a
  baseline CBP-basics flag when nothing else fires (never an empty section).
- Scenarios: Today / Escalation (max(historical jump, country adder)) / "Sell to X instead"
  (alt market framed as different buyers — NEVER transshipment).
- Alt markets: for each candidate country, global row + origin-specific row + WTO MFN, stacked.
- Groq analysis with HARD RULES: no transshipment advice ever; duty <2% of value → recommend
  compliance actions not duty savings. Groq failure → simulation returns without narrative.
- volatility_stats: falls back to rate_history-derived avg/peak when volRow is zeroed.

### extract-shipment
Images → Mistral pixtral directly. PDFs → Mistral OCR → Groq field extraction (keys rotation);
OCR empty → pixtral document fallback. Returns product/hs/origin/destination/value/incoterms/
quantity/parties/notes JSON. (Deliberate decision: no pdf.js text-layer tier — Indian trade
docs are mostly scans/photos; revisit at scale for cost.)

### scrape-tariffs
Seeds/refreshes tariff_rates from KNOWN_RETALIATIONS (the curated duty-action list) + WTO +
Federal Register regulatory alerts. Run manually: POST with anon key. Last run: 281 upserted.
"Runs daily" claim on landing → needs a cron (pg_cron or scheduled trigger) — NOT yet set up.

### send-alert
Emails report via Composio Gmail (account ac_i5MjjqgDRGZU). Reads response as text first
(Composio sometimes returns non-JSON).

### Groq key rotation (all 3 AI functions)
Try GROQ_API_KEY → on 429/401/403 try GROQ_API_KEY_2 → GROQ_API_KEY_3. Keys 1+2 = same org
(shared 100k tokens/day pool — verified live: org_01k5xvmr9ke5t8j721m0q44fb7). Key 3 =
different account = real extra 100k/day. **Before launch: Groq Dev tier.** ~1.5k tokens per
simulation ⇒ free tier ≈ 60–100 sims/day/org.

## 6. Frontend map

```
src/pages/Index.tsx          landing: NavBar, LiveTicker, Hero, ImpactCounter, DemoStages,
                             RiskGallery, LiveFeed, DataSources, Quote, RegulationPreview,
                             FinalCTA, Footer
src/pages/SimulatorPage.tsx  entry form. Defaults India → United States. Exporter/US-importer
                             toggle. Document upload (extract-shipment) OR manual: product
                             search (hts_catalog synonym search) + quick-pick chips (8 Indian
                             staples — chips only prefill the search box; classification flow
                             is UNCHANGED and still required) + Classify → GRI candidate cards
                             → value/incoterms/quantity → simulate → navigate("/results",{state})
src/pages/ResultsPage.tsx    TWO-PANEL layout (TradeTerminal-inspired), compliance-first for
                             BOTH modes: Verdict strip (detention-list warning / "clear after
                             N steps") → grid: LEFT ComplianceChecklist (agencies, documents,
                             detention risks, AD/CVD, labeling), RIGHT money (LandedCostCard,
                             tariff big number + specific_duty_note, AI recommendation, FTA
                             banner) → below full-width: classification card, breakdown, trade
                             flow (UN Comtrade), rate history sparkline, scenarios, alt markets,
                             risk analysis, regulatory flags, prediction, email. max-w-6xl.
src/components/results/UsCompliancePanel.tsx  exports useComplianceProfile, ComplianceVerdict,
                             LandedCostCard, ComplianceChecklist (renders curated profile;
                             honest "no curated profile yet" card otherwise)
src/data/us-compliance.ts    THE CURATED DATASET — 17 categories / 30 HS4s: spices(0904/08/09/10),
                             shrimp(0306), basmati(1006), tea(0902), cashews(0801), guar(1302),
                             apparel(6109/6110/6203/6204), bed linen(6302), carpets(5701/5703),
                             cotton yarn(5205), leather(6403/4202), gems/jewelry(7113/7102),
                             pharma/ayurvedic(3004/2106), steel(7306/7326), auto parts(8708),
                             ceramic tiles(6907), handicrafts(4420/8306). Each: agencies[],
                             documents[], certifications[], detention_risks[] (FDA import
                             alerts 99-08 spices, 16-35 shrimp, 66-40 drugs), adcvd[],
                             special_duties[], labeling[]. Hand-curated from my knowledge with
                             stable .gov links — SPOT-CHECK against sources before charging money.
src/data/us-import-fees.ts   MPF 0.3464% (min $33.58 / max $651.50), HMF 0.125% ocean —
                             19 CFR 24.23/24.24. computeLandedCost().
src/data/compliance-types.ts schema + findProfile(hs4)
```

Landing copy identity: "Ship to the US with zero surprises." Hero mock = turmeric→US with
Import Alert 99-08. RiskGallery = India→US exposure map (real AD/CVD + import-alert notes).
Quote testimonials are FICTIONAL placeholders — replace with real quotes before launch.
ImpactCounter "$87B+ / thousands refused" claims — verify before serious marketing.
LiveFeed/LiveTicker query tariff_rates filtered destination_country="United States" only,
ordered by retaliation_rate, origin-aware display. Never use effective_rate from DB.

## 7. QA state (see qa/QA-SUMMARY.md for detail)

All green as of July 16: 61/61 special-duty rows, 25/25 curated classification queries,
85 random catalog samples, full-table SQL sweep. 11 bugs found & fixed during the sweep
(avg/peak header, TSCA/tires/apparel/baseline flags, specific-duty sentinels, 2× Groq-outage
500s, material-word hijacking, crabmeat fallback, key rotation). Harnesses:
`node qa/test-products.mjs <start> <count>`, `qa/test-classification.mjs`,
`qa/test-catalog-sample.mjs <count>` — ⚠️ these burn Groq tokens; spot-check, don't bulk-run.

## 8. Known issues / open decisions

- **Groq Dev tier before launch** (hard daily cap otherwise). Key rotation is a bridge.
- WTO/Comtrade calls occasionally stall 60-80s → consider tighter AbortSignal timeouts.
- scrape-tariffs needs a daily cron for the "updated daily" claim to be true.
- hts_volatility table is partly corrupt (fallback handles it; could rebuild the table).
- Fictional testimonials + unverified stat claims on landing.
- Curated dataset rate-ranges/current-actions need periodic re-verification (AD/CVD rates are
  company-specific and change with DOC reviews; 2026 tariff actions move fast).
- Groq degraded mode returns right heading but sometimes imperfect 8-digit line (by design).
- Roadmap next: shareable result links (/r/:id via a results table — WhatsApp growth loop),
  live FDA refusal counts from FDA import refusal database, India-side export requirements
  (IEC, AD code, GST LUT, e-BRC) as phase 2, corridor #2 = UAE, #3 = UK/EU.

## 9. Rebuild-from-zero checklist

1. Clone github.com/1krrishg/exportlens → `npm install` → `npm run dev` (localhost:5173+).
2. Supabase project with the 6 tables above (schema inferable from code; hts_catalog/
   rate_history load from USITC HTS CSV exports — TariffLens repo has the original pipeline).
3. Set edge secrets (section 3), deploy the 5 functions with npx supabase functions deploy.
4. POST scrape-tariffs once to seed tariff_rates.
5. Vercel: import repo, framework Vite, no env vars needed, enable Analytics.
6. Verify: type "turmeric powder" → classify (expect 0910.30, 99%) → simulate $50k India→US →
   expect ~0.7% duty, $50,586 total, FDA prior-notice checklist, Import Alert 99-08 detention
   warning, compliance-first recommendation.

## 10. Hard-won lessons (do not relearn these)

- WTO API: HS_A_0010 works; HS_A_0030 ≠ bound rate; HS_A_0020 ≠ preferential; TP_A_0010
  doesn't exist. Bilateral trade → UN Comtrade public preview API.
- hts_catalog mfn_rate is a fraction; >200% after ×100 = specific-duty sentinel, don't show 0%.
- Groq quota is per-ORG not per-key; every LLM path needs a graceful degrade.
- Duty follows country of origin — never suggest "shipping through" another country (the AI
  did; hard rules now prevent it).
- Generic material words (cotton/steel/brass) hijack classification without specific product
  keys + EXACT_ONLY guards.
- .maybeSingle() without the origin filter errors silently when multiple rows match → always
  query global (origin IS NULL) and origin-specific rows separately.
