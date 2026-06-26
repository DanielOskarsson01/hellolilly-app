# decoder (A1)

Stage 2 true-job decoder. Reads the ad (`meta.sourceInput`) together with the research
signals (company stage, ambitions, niche) and emits `decodedRole` — the real requirements
beneath the ad. This is what the A2 analysis maps against, **not** the raw ad.

## Input
`{ caseId }` — reads `meta` + `dossiers` from the case.

## Output (`decodedRole`)
`{ narrative, requirements: [ { id, requirement, rationale, weight } ] }` — 6–12 weighted
requirements (weight 1–5), each with a rationale grounded in the signals.

## Capabilities
`store, logger, llm`. Reads `dossiers`, writes `decodedRole`. Usually summoned by the
`researcher` through the broker, but runs standalone too (given a case with dossiers).

## Notes
Opus 4.8. Writes go through the writing-rules gate with a one-shot rephrase-and-retry on
violation.
