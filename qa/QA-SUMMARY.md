# ExportLens QA sweep — July 16, 2026

## Coverage
- Tier 1 — 61/61 special-duty rows (tariff_rates, US-bound): duty stacking (301/232/AD-CVD),
  regulatory flags, recommendations. All pass.
- Tier 2 — 25/25 curated-category queries through classify-hs: every query lands in the correct
  curated HS4 so the compliance panel attaches. Spot-checked at 99% confidence with LLM ranking.
- Tier 3 — 85 products sampled evenly across the full 12,788-row hts_catalog through
  simulate-tariff: rates, history, flags, sentinel handling. All pass.
- Data sweep — all 12,788 catalog rows via SQL: 0 null rates; 558 sentinel (specific-duty) rows
  identified and now surfaced honestly.

## Bugs found and fixed
1. Rate-history header showed Average/Peak 0.0% while the chart showed real rates → header now
   derives from rate_history (hts_volatility has zeroed rows).
2. Chemicals had zero regulations → EPA TSCA flag (ch. 28/29/32/34/38/39).
3. Tires had zero regulations → DOT FMVSS 139 / TIN marking flag (4011–4013).
4. Adult apparel had zero regulations → CPSC flammability + FTC labeling flag (ch. 61/62/63).
5. 558 specific-duty products silently showed 0% → explicit per-kg/unit duty warning.
6. Empty regulations section for no-gate products → honest CBP-basics baseline flag.
7. classify-hs 500 during Groq outage (ranking phase) → lookup-order fallback.
8. classify-hs 500 during Groq outage (heading phase) → keyword-search fallback.
9. Material words hijacked classification (cotton t-shirts→raw cotton, steel pipes→flat steel,
   flanges, brake pads, brass statues) → specific keys added, ambiguous words guarded.
10. Degraded fallback returned DB-order candidates (frozen shrimp→crabmeat) → keyword-overlap scoring.
11. Groq key rotation in all three AI functions; GROQ_API_KEY_3 (different org) verified live.

## Open items
- Groq quota is per-organization (100k tokens/day ≈ 60–100 simulations). Two orgs now in
  rotation (~200k/day). Dev tier still recommended before launch. Use tokens sparingly.
- Two WTO/Comtrade calls observed at 68–76s (external API stalls) — consider tighter timeouts.
- Degraded-mode classification returns correct heading but sometimes an imperfect 8-digit line.
