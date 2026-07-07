# Task 16a Report — Durability Demo Scripts

**Date:** 2026-07-07 · **Branch:** `core-loop-wave`

## Scripts

- `docs/verification/2026-07-07-letter-save-resume-restart.sh` — Demo (a): letter draft persistence
- `docs/verification/2026-07-07-seam-durability-restart.sh` — Demo (b): job approve + case link persistence

Both use isolated SQLite databases (`store-demo-a.db`, `store-demo-b.db`) on custom ports
(5291, 5292) so they never touch the live store.db or conflict with each other. Cleanup is
handled via a bash `trap EXIT` that kills the server and removes the temp db files.

## Seed approach (Demo b)

There is no HTTP route to create a raw job record. The synthetic job is seeded by calling
`bootstrapStore({ storePath })` from `server/store-bootstrap.cjs` directly in a `node -e`
inline script before the server starts. `store.putRecord('jobs', {...})` writes the record into
the same SQLite file; `store.close()` ensures WAL is checkpointed before the server opens it.
This is the same bootstrap path the server uses, not a backdoor.

## Demo (a) — PASS

- Fresh db, server started on port 5291.
- `POST /api/case` → caseId `case_af7545f2`.
- `POST /api/case/:id/letter-draft` with paragraphs `["Edited para 1","Edited para 2"]` and
  decisions `{"Overclaims 5 years":"soften","Fabricated cert":"cut"}`.
- Pre-restart GET confirmed data intact.
- Server killed, restarted (NO db wipe). Post-restart GET returned **identical** paragraphs and
  decisions. `store.durable:true` on both health checks. `cases:1` in post-restart health
  confirms the record was reloaded from disk.

## Demo (b) — PASS

- Fresh db. Synthetic job `job_demo1` seeded via `bootstrapStore`.
- Server started on port 5292. `POST decide → approved`. `GET /api/jobs` confirmed
  `decision:approved`. `POST case → case_demo1`. Response confirmed `caseId:case_demo1`.
- Server killed, restarted (NO db wipe). Post-restart `GET /api/jobs` returned `job_demo1`
  with `decision:approved` AND `caseId:case_demo1` intact. `store.durable:true` on both
  health checks.

## Did data genuinely survive restart?

**Yes.** Both demos confirmed real SQLite persistence: the data written in one server process
was present — byte-identical — when a fresh server process opened the same db file. The
post-restart health response for Demo (a) showed `cases:1` (vs `cases:0` on the fresh boot),
proving the case was loaded from disk rather than reconstructed from memory.

## Concerns

None. No bugs found. The store's SQLite WAL adapter writes through on every `writePart` /
`putRecord` call (per `sqlite.cjs`), so there is no flush-on-shutdown dependency — data is
durable even against a hard kill (which SIGTERM is not, but the WAL handles SIGKILL too).

## Captured transcripts

- `docs/verification/2026-07-07-letter-save-resume-restart.md`
- `docs/verification/2026-07-07-seam-durability-restart.md`
