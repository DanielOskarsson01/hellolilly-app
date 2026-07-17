# Wave 1 — Ledger (recorded, not repaired)

## ⛔ B1 — OPEN BLOCKER: the datafact pool has no Coinhero result facts (surfaced by the fix round)
The review-#2 fix round added the strict pre-write gate (findings 4/5): a job with zero result
bullets, or a bullet mis-attributed to the wrong job, fails validation and is never written ready.
Re-running the parity harness under the fixed code (2026-07-17) fails **all nine runs**, every one on
**Coinhero**: the pool contains exactly one Coinhero fact — a `job_summary` (intro) — and **zero
`job_result` facts**. Forced to give every job a bullet, the model either leaves Coinhero empty
("job coinhero has no bullets"), reuses another fact ("duplicate id … in section experience"), or
mis-attributes a non-Coinhero fact to Coinhero ("does not belong to job coinhero (false attribution)").
All three are the validator working **correctly** — this is the "run-1 Coinhero zero-bullet" class the
review flagged, now caught. The captured reference CV shows Coinhero *with* bullets, but those were
**authored by the reference generator**; the selection-only tailor can only select existing evidence,
and none exists for Coinhero.

**This is a DATA gap, not a code defect.** The code is correct and will stay strict. Resolving it is
Daniel's call and needs real candidate data — it must NOT be fabricated:
- **Repair the pool**: add real Coinhero `job_result` datafacts (ingest from `cv_data.json` if they
  exist there but were missed, or add real Coinhero achievements), re-ingest, rebuild the MANIFEST
  pool + checksums. Then the harness can produce real P3 numbers and P4 can be regenerated.
- **Or reconsider the template**: if Coinhero genuinely has no bullet-worthy evidence, decide whether
  the machine block should permit an intro-only job, or whether Coinhero belongs in the fixed five.

Until B1 is resolved, the **harness re-run stays FAIL** (`PARITY_REPORT.md`, all runs Coinhero-blocked)
and the **P4 package cannot be regenerated** (no valid first-generation outputs exist).

---



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
