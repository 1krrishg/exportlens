# ExportLens — Ship to the US with zero surprises

> US import compliance for Indian exporters. Duty, documents, and detention risks — before you commit to a shipment.

**GitHub:** https://github.com/1krrishg/exportlens

---

## What it does

An Indian exporter types their product (or uploads a commercial invoice) and gets everything standing between them and cleared US customs, on one page:

1. **HS code** — retrieve-then-rank classification against the real USITC catalog, with CBP ruling citations
2. **The real US duty** — USITC MFN rate + AD/CVD orders + Section 232/301 actions stacked on top
3. **Landed cost** — duty + merchandise processing fee + harbor maintenance fee against the exact shipment value (19 CFR 24)
4. **US agency checklist** — FDA prior notice, FSVP, CPSC certificates, USDA phytosanitary, Lacey Act, SIMP — curated per product with official .gov links
5. **Documents list** — every paper the entry needs, corridor-specific
6. **Detention risks** — FDA import alerts and the actual refusal reasons for goods like yours ("spices from India detained without exam for Salmonella — Import Alert 99-08")

## The problem

India ships $87B+ of goods to the US every year — its largest export market and the strictest border to clear. Thousands of Indian shipments are refused annually, most for preventable paperwork: a missing FDA prior notice, an unlisted facility, a label without fiber content, an unknown anti-dumping order.

Enterprise exporters have compliance teams. Small exporters have a customs house agent who tells them the problem after the goods have sailed. ExportLens is the pre-shipment check nobody sells them.

## Curated compliance coverage

17 hand-curated product categories covering India's top exports to the US: spices, basmati rice, frozen shrimp, tea, cashews, guar gum, apparel, home textiles, carpets, cotton yarn, leather footwear & goods, gems & jewelry, pharmaceuticals & ayurvedic products, steel, auto parts, ceramic tiles, and wood/metal handicrafts. Products outside the curated set still get classification, duty, and landed cost via the generic pipeline.

## Architecture

```
User types product / uploads invoice
           │
           ▼
  Mistral OCR (extract-shipment)         — reads the PDF, pulls product/value/parties
           │
           ▼
  classify-hs                            — direct lookup + LLM rank over real USITC rows,
           │                               CBP CROSS ruling citations
           ▼
  simulate-tariff                        — USITC duty + AD/CVD/301/232 stacking,
           │                               UN Comtrade trade flows, Groq risk analysis
           ▼
  Results page
  Duty · landed cost (MPF/HMF) · agency checklist · documents ·
  detention risks (FDA import alerts) · one recommendation
```

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Supabase Edge Functions (Deno) |
| AI reasoning | Groq llama-3.3-70b-versatile |
| Document extraction | Mistral pixtral-12b-2409 |
| Duty data | USITC HTS catalog · 262k records · 1998–2026 |
| Compliance data | Curated per-category profiles (`src/data/us-compliance.ts`) with .gov sources |
| Classification | Direct lookup + retrieve-then-rank over USITC + CBP CROSS |

## Run it

```bash
npm install
npm run dev
```

Edge functions live in `supabase/functions/` and need `GROQ_API_KEY` and `MISTRAL_API_KEY` set as Supabase secrets.

## Key files

```
src/
  pages/
    Index.tsx                — landing page
    SimulatorPage.tsx        — shipment check form (India → US default)
    ResultsPage.tsx          — duty, landed cost, compliance panel
  components/results/
    UsCompliancePanel.tsx    — agency checklist, documents, detention risks, AD/CVD
  data/
    us-compliance.ts         — 17 curated India→US compliance profiles
    us-import-fees.ts        — MPF/HMF landed-cost math (19 CFR 24)
    compliance-types.ts      — dataset schema

supabase/functions/
  classify-hs/               — HS classification (direct lookup + LLM rank)
  simulate-tariff/           — duty stack + Groq analysis
  extract-shipment/          — Mistral OCR invoice extraction
  scrape-tariffs/            — duty data refresh
  send-alert/                — email the report
```
