# D1+D2 build report + verification run (2026-07-03)

Branch `claude/d1d2-durable-store` off main @ `243124b`. Everything sits below the API boundary: **zero diffs under `src/`** (verified: `git diff --name-only origin/main..HEAD -- src/` → empty).

## The four decisions the brief asked me to state

**1. Adapter chosen: SQLite via Node's built-in `node:sqlite` (`DatabaseSync`) — confirming the brief's recommendation.** Verified available on this machine (node v26) before building. Why over extending the JSON snapshot: row-level write-through instead of whole-file rewrites (a `writePart` writes one case row, not 36 KB+), WAL journaling instead of corruption-on-crash risk, transactions for the migration/hydrate path — and still zero dependencies, zero ops, one local file, nothing else alive. The JSON wrapper (`createPersistentStore`) remains available as `STORE_ADAPTER=json`; plain in-memory as `STORE_ADAPTER=memory`.
   *Implementation shape:* the plain in-memory `createStore()` stays the source of truth for all reads and semantics — the detach/immutability boundary and the writing-rules gate are **inherited, not reimplemented** (both re-proven against the adapter in `server/skeleton/store/sqlite.test.cjs`, including "gate throw persists nothing on disk"). SQLite is the durability shadow, loaded at open through the existing `snapshot()/hydrate()` seam. Signatures unchanged.

**2. Durability scope per region:** `cases`, `datafacts`, and `collections` (jobs / filterSet / jobSources) **persist**. `scratch` stays **ephemeral** — per-submodule working memory for a single run; persisting it would resurrect half-finished private state into runs it doesn't belong to. Broker audit log untouched (out of scope per brief).

**3. Seeding mechanism: seed-only-into-empty.** `seedDatafactsIfEmpty()` in `server/store-bootstrap.cjs` — the pool seeds only when `listDatafacts()` is empty; a populated durable store is never reseeded (no duplicate ids, no ambiguous citations). Refreshing the pool is a deliberate act (delete `server/data/store.db`, reboot). The legacy Stream 2 JSON snapshot migrates into SQLite **exactly once** (only when the db file does not yet exist); after that the snapshot is never consulted.

**4. cv_data diff outcome (verified, not assumed):** the two English copies differ (md5 `c20b70…` top-level, 33,179 B, Jun 30 vs `ba5cc6…` cv-source/en, 37,707 B, Jul 1). Structural diff: identical top-level key sets; flattened to string atoms, **0 atoms exist only in the top-level copy** and 33 exist only in cv-source/en (the datafact-enrichment content). `cv-source/en` is a strict superset → canonical, no stop-condition. The old "content-identical" comment was false and is deleted. Canonical file copied to `data/cv_data.json` (gitignored; `data/README.md` committed documents the boundary). The sibling `JobSearch` folder is no longer a runtime dependency of this repo.

## Acceptance evidence (all held)

- **Restart survival, demonstrated with the live case:** first boot on this branch logged `[store] migrated legacy JSON snapshot into …/server/data/store.db` and `/api/health` reported `{adapter: "sqlite", durable: true, cases: 1, datafacts: 133}`; `case_39ca4173` (Brightsales) served with fit/cvDraft/coverLetter all `ready`. Server killed and restarted: **no migration log (one-time proven), identical counts (1 case / 133 datafacts), case intact — 8 CV sections, 5 letter paragraphs.**
- **Boot twice / seed twice: counts unchanged** — proven live (above) and by unit test (`store-bootstrap.test.cjs`: second boot seeds 0, pool count identical). Discovery dedup-by-externalId preserving `decision` fields re-proven against the sqlite adapter (`sqlite.test.cjs`: a `rejected` job survives close/reopen; the existing job-discovery dedup tests still pass).
- **Suite:** with the in-repo evidence file: **156 pass / 0 fail / 0 skip**. Fresh-clone condition (cv_data.json removed; no sibling folders resolvable from this worktree — the Stream 2 trick): **155 pass / 0 fail / 1 skip** (the real-shape contract test's guard, by design). `vite build` clean.
- **Zero `src/` diffs** — no wired screen changed; they just talk to a backend whose data now survives.
- **Health route:** `GET /api/health` → `{ ok, service, store: { adapter, path, durable, cases, datafacts } }` — "is it durable?" is checkable, not assumed. Long-lived start remains the documented `npm run dev` (API + frontend, one process, durable store injected).
- CI-after-push: checkable at merge time (the welded test+publish workflow republishes the frontend — accepted in the brief).

## Independent review outcome

A fresh adversarial review verified all seven brief items with evidence and reproduced both test-count claims independently (156/0/0 with the evidence file; 155/0/1 fresh-clone). Its two migration-edge findings were fixed on the branch (`68ec791`): the migration guard is now db **emptiness**, not file existence (a crash between db creation and hydrate can no longer silently suppress migration), and a mid-write hydrate failure aborts the boot loudly with the legacy snapshot preserved instead of serving data that would never persist. Post-fix suite: **158 pass / 0 fail / 0 skip**. Logged as a known pre-existing gap (not this branch's change, made observable by durability): the base store's `ingestDatafact`/`getDatafact` don't detach, so post-ingest mutation of a datafact object diverges memory from disk — candidate for the next store pass.

## Fold-in

`docs/PROJECT_INVENTORY.md` got a dated errata block at the top (seam A closed for six surfaces, OnlyiGaming route deleted, store no longer memory-only, sibling seed path gone) pointing at `docs/STREAM2_BRIDGE.md` and this report. The stocktake body is untouched.
