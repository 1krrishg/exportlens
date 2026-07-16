# ExportLens QA sweep — July 16, 2026

## Coverage
- **Tier 1 — 61/61 special-duty rows** (tariff_rates, US-bound): duty stacking (301/232/AD-CVD),
  regulatory flags, recommendations. All pass.
- **Tier 2 — 25/25 curated-category queries** through classify-hs: every query lands in the
  correct curated HS4 so the compliance panel attaches. All pass (verified in Groq-degraded mode).
- **Tier 3 — 36 random products** sampled evenly across the full 12,788-row hts_catalog through
  simulate-tariff: rates, history, flags, sentinel handling. All pass.
- **Data sweep — all 12,788 catalog rows** checked via SQL: 0 null rates; 558 sentinel
  (specific-duty) rows identified and now surfaced honestly.

## Bugs found and fixed during the sweep
1. Rate-history header showed Average/Peak 0.0% while the chart showed real rates
   (hts_volatility table has zeroed rows) → header now derives from rate_history.
2. Chemicals returned zero regulations → EPA TSCA certification flag added (ch. 28/29/32/34/38/39).
3. Tires returned zero regulations → DOT FMVSS 139 / TIN marking flag added (4011-4013).
4. Adult apparel returned zero regulations → CPSC flammability + FTC labeling flag (ch. 61/62/63).
5. 558 specific-duty products silently showed 0% → explicit "specific duty" warning added.
6. Products with no agency gate showed an empty regulations section → honest CBP-basics baseline flag.
7. classify-hs returned 500 during Groq outage (ranking phase) → lookup-order fallback.
8. classify-hs returned 500 during Groq outage (heading phase) → keyword-search fallback.
9. Material words hijacked classification (cotton t-shirts→raw cotton, steel pipes→flat steel,
   flanges, brake pads, brass statues) → specific product keys added, ambiguous bare words guarded.

## Open items (not bugs, decisions)
- **Groq free tier: 100k tokens/day ≈ 60-100 simulations.** Upgrade to Dev tier before launch.
- Two WTO/Comtrade calls observed at 68-76s (external API stalls) — consider tightening timeouts.
- Degraded-mode classification returns correct heading but sometimes imperfect 8-digit line
  (expected without LLM ranking).
