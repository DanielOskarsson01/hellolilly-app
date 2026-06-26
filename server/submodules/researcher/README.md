# researcher (A1)

Stage 2 research. Produces the four dossiers — `company`, `product`, `people`, `niche` —
to **niche depth**, then summons the `decoder` through the skeleton.

## Input
- Full research: `{ caseId }`
- Reader drill: `{ caseId, drill: { dossierKey, query } }` — appends a marked paragraph to a dossier.

## How it works
Each front runs a **Perplexity Sonar** grounding pass (real facts + sources) then an
**Opus 4.8** synthesis into the contract dossier shape. The four fronts run in parallel.
The niche front is prompted for the three-level ladder (industry → vertical → exact niche),
weighted to the bottom — competitors that matter, daily vocabulary, regulatory/integration
reality, 12-month pressures. After writing `dossiers`, it requests `decoder` via the broker.

## Capabilities
`store, logger, llm, search, request`. Writes `dossiers`.

## Notes
- Writes go through the store's writing-rules gate; on a violation the researcher asks Opus
  to rephrase the offending phrases once, then retries (protects the paid run).
- Standalone (no broker): drills and dossiers work; the decoder summon is skipped.
- Verify live: `npm run verify:a1 -- "Company" "Role"` (needs `.env` keys).
