# Wave 1 — Ledger (recorded, not repaired)

## ✅ B1 — RESOLVED: Coinhero ingest gap repaired (was a blocker, now fixed)
The review-#2 strict pre-write gate (findings 4/5) surfaced that the datafact pool held exactly one
Coinhero fact — a `job_summary` (intro) — and **zero `job_result` facts**, so no valid Coinhero job
could be built and the first re-run failed all nine generations on Coinhero (empty / duplicate /
false-attribution — the validator working correctly). Root cause: an **ingest gap** — Coinhero's
result bullets live in the reference variants source (`JobSearch/CVs/generate_core_cvs.js`,
`VARIANTS.*.jobs.coinhero.bullets`), which the original `cv_data.json` ingest never read.

**Resolution (2026-07-17, approved by Daniel):** imported the **39 distinct** pre-approved Coinhero
result bullets from that source — the SAME class as the Route B category import (curated, pre-approved
text, not fabrication). `scripts/ingest-coinhero-results.cjs` added them as new `job_result`
datafacts, **ADDITIVE ONLY**: new content-hash ids, the previous 144 facts byte-for-byte untouched,
each tagged `['job-result','Coinhero']` with `source` recording the exact origin file.
`harness/phase0/amend-pool-coinhero.py` recorded the manifest amendment (pool **144→183**, new
`pool_sha256`; captures/ads/run_config/corpus_version untouched). Bucket membership verified: all 39
route to `coinhero` and nothing else. Harness re-run: **OVERALL PASS** (P1+P2 all nine runs; P3
minCross 0.1771 > maxWithin 0.1633). P4 package regenerated with Coinhero rendering real bullets.

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

## L4 — Named offline gate lists a fixed test file set that omits newer regression files (recorded, HIGH 7)
The Tier-1 offline gate (`.github/workflows/wave1-eval.yml`) runs a **hard-coded** `node --test` file
list — currently five files: `prompt-assembly/index.test.cjs`, `eval-gate.test.cjs`,
`parity-metric.test.cjs`, `cv-tailor.test.cjs`, `synthetic-corpus.test.cjs`. Newer regression files are
**not** in that named list: `server/decoder.test.cjs`, `server/skeleton/store/index.test.cjs`
(store-taint), `server/adoption-corpus.test.cjs`, `server/synthetic-pool.test.cjs` (clean-pool guard),
and — added in this review-#2 fix round — `server/cv-draft-client-parity.test.cjs` (client==server leaf
parity, the BLOCKER guard). **Coverage exists**: the separate `deploy-pages.yml` workflow runs the full
`npm test` on every push and PR, so nothing is unguarded in CI. What is owed is bookkeeping — the *named*
targeted gate should enumerate the new files (or, better, run the same `npm test` glob so it cannot drift
again). Recorded, not repaired (a workflow-list edit, deliberately out of scope for this code round).

## L5 — P3 pass margin is thin and load-bearing on tailor temperature=0 (recorded, HIGH 7)
The committed P3 pass is `minCross 0.1771 > maxWithin 0.1633` (Δ ≈ 0.0138). This is thin and depends on
the tailor running at **temperature=0** (stable selection). At a non-zero temperature the within-ad
distances would rise and could flip the result, so any re-run must hold temperature=0 for the result to
stand. (Review #2's bullet-ceiling fix re-runs the harness; the new numbers are reported with the run and
this margin item stands until P4.) Recorded, not repaired.

## L6 — Branch protection on `wave1-phase0-baseline` is owed as a GitHub setting (not code, HIGH 7)
The workflow mechanics are in place; enforcing them (required status checks / protected branch) is a
repository **setting Daniel owns** on GitHub, not something this branch can commit. Owed, not code.
