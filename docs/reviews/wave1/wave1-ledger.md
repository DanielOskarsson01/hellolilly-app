# Wave 1 — Ledger (recorded, not repaired)

Standing record of Wave 1 items that are **acknowledged and accepted as-is**, distinct from the
review findings that were fixed. Fixed findings live in the commit history on
`wave1-phase0-baseline`; this file holds what we chose to record rather than change.

Created alongside the review-#2 fix round, 2026-07-17.

## L1 — Metric-freeze process breach (recorded, not repaired)
The Phase-0 freeze requirement was that the parity metric be frozen *before* capture. The **formula**
was frozen in the brief (docs/WAVE_1_BRIEF_honest-tailor_v3.4.md §P3) and the implementation
(`harness/phase0/parity-metric.cjs`) matches it exactly. But the **executable** arrived together with
the results rather than ahead of them — a process breach of the "committed in Phase 0, before capture"
rule. Nothing to repair in code (formula == brief == implementation); recorded so the process gap is
not silently forgotten. If a future wave re-freezes a metric, commit the executable before the run.

## L2 — Route B exposes only five competency categories (MEDIUM limitation)
The id-stable Route B enrichment surfaces **five** competency categories. It cannot reproduce the
captured reference CVs' *Operations* or *Digital* categories, which the reference oracle could compose.
Consequence: the tailor selects from five categories, not the reference's full palette. Accepted for
Wave 1 (selection-only); revisit if P4 relevance/structural-fidelity scoring shows the missing
categories materially weaken the primary or second ad. Tracked, not fixed.

## L3 — Sampling divergences between HelloLilly and the reference oracle (recorded divergence)
Same model across the chain (claude-sonnet-4-6, finding 7), but sampling differs by call:
- **HelloLilly**: decoder passes no temperature (maxTokens 3000); tailor temperature 0 (maxTokens 2000).
- **Reference oracle**: a single generate call at temperature 0.2 / maxTokens 8000.

These are recorded truthfully in `harness/phase0/MANIFEST.json` (`run_config.sampling`). They are a
deliberate, disclosed divergence — not an error. The brief's backstop for output-quality divergence is
**P4** (human parity judgement of the first HelloLilly generation vs the captured reference). Recorded;
P4 is the gate that speaks to whether the divergence matters.
