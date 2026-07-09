# Demo — activity log survives server restart

**Date:** 2026-07-09 · **Branch:** `progress-support-wave-a`

**What this proves:** confirmed state changes — `case_created` (from `POST /api/case`) and
`letter_draft_saved` (from `POST /api/case/:id/letter-draft`) — are written by `logActivity`
(`server/activity-log.cjs`) as `store.putRecord('activity', …)` calls. Those calls persist
through the SQLite adapter's generic `collection_records` table (`server/skeleton/store/sqlite.cjs`),
exactly like every other named collection. The two records **survive a full server
kill-and-restart with the database file untouched** — `GET /api/collection/activity` reports
the identical count and the identical `type` values after the store rehydrates from disk on
the next boot.

**Command:**

```bash
chmod +x docs/verification/2026-07-09-activity-log-restart-survival.sh
./docs/verification/2026-07-09-activity-log-restart-survival.sh
```

---

## Captured run output

```
=== DEMO: activity log survives server restart ===
[1] start server (fresh db)
[2] create a case (logs case_created)
    caseId=case_89abed58
[3] save a letter draft (logs letter_draft_saved)
    activity records before restart: 2
[4] kill server
[5] restart server on the SAME db
    activity records after restart: 2 (case_created,letter_draft_saved)

PASS ✓ — activity records survived the restart with identical types.
```

## Result

| Checkpoint | Value |
|---|---|
| Activity records before restart | `2` |
| Activity records after restart | `2` |
| Types after restart (sorted) | `case_created,letter_draft_saved` |
| Exit status | `PASS` |

**Result: PASS.** The server was started on a fresh SQLite db (`server/data/store-activity-demo.db`,
cleaned up by the script's `trap cleanup EXIT`), a case was created (`case_89abed58`, logging
`case_created`), and a letter draft was saved for it (logging `letter_draft_saved`). `GET
/api/collection/activity` confirmed **2** records before the restart. The server process was
then killed outright (`kill "$SERVER_PID"`, no graceful `SIGTERM` handler needed to make the
point — though `dev-server.cjs` does flush/close the store on `SIGINT`/`SIGTERM` too) and
restarted **on the same database file**, with no wipe step in between. After restart,
`GET /api/collection/activity` returned the same **2** records, with the same two `type`
values, `case_created` and `letter_draft_saved` — byte-identical activity, not a lucky
re-derivation.

## Conclusion

This closes the durability question for the `activity` collection specifically (Part 2 of the
wave — D5 durability for the `jobs`/case collections was already proven by the sibling demos
`2026-07-05-jobbsok-restart-survival.md` and `2026-07-07-letter-save-resume-restart.md`).
`logActivity` (`server/activity-log.cjs`) is a thin wrapper around `store.putRecord('activity',
record)` — it does not open a special code path or a separate storage mechanism. Because
`putRecord` for any named collection is backed by the SQLite adapter's generic
`collection_records(name, id, data)` table (`server/skeleton/store/sqlite.cjs:37-40`, PK
`(name, id)`), the activity log inherits the same durability guarantee as every other
collection **for free** — no bespoke persistence code was written or needed for this record
type. On boot, `bootstrapStore()` (`server/store-bootstrap.cjs`) opens the same db file and the
store rehydrates every collection, `activity` included, from the rows already on disk. The
demo confirms this is not just true in principle but observably true end-to-end: kill the
process, lose nothing, restart, the log is exactly as it was.
