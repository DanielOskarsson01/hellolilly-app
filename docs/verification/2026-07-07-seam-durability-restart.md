# Demo (b) — seam durability: approve + job→case link survive server restart

**Date:** 2026-07-07 · **Branch:** `core-loop-wave`

**What this proves:** the `jobs` collection in SQLite is fully durable across server restarts.
Specifically: (1) a job decision set to `approved` via `POST /api/job/:id/decide` survives a
kill+restart; (2) a `caseId` link written via `POST /api/job/:id/case` survives the same
restart. Both are confirmed via `GET /api/jobs` post-restart. `GET /api/health` reports
`store.durable:true` on both boots.

**Seed approach:** there is no HTTP route to create a raw job, so the synthetic job is seeded
directly into SQLite before the server starts, using `bootstrapStore({ storePath })` from
`server/store-bootstrap.cjs` and `store.putRecord('jobs', {...})`. The server then reads the
same `store.db` file via the `STORE_PATH` env var. This is the same bootstrap path the server
itself uses, so the seed is structurally identical to a job arriving from job discovery.

---

## Captured run output

```
=== DEMO (b): seam durability — approve + job→case link survive restart ===

[1] Seeding synthetic job 'job_demo1' directly into the SQLite store …
Seeded job_demo1 into /Users/danieloskarsson/Library/CloudStorage/Dropbox/Projects/hello lily - app/.claude/worktrees/core-loop-wave/server/data/store-demo-b.db
    Job seeded ✓

[2] Starting server on port 5292 …
    health: {"ok":true,"service":"hello-lilly-dev-server","store":{"adapter":"sqlite","path":"/Users/danieloskarsson/Library/CloudStorage/Dropbox/Projects/hello lily - app/.claude/worktrees/core-loop-wave/server/data/store-demo-b.db","durable":true,"cases":0,"datafacts":0}}
    store.durable=true ✓

[3] POST /api/job/job_demo1/decide {decision:'approved'} …
    {"ok":true,"job":{"id":"job_demo1","externalId":"ext1","source":"demo","title":"Head of Acquisition","company":"BettingJobs","location":"Remote","url":"https://example.com/job1","snippet":"Lead acquisition strategy across key iGaming markets","decision":"approved","signal":"neutral","matchedRules":[],"rejectReason":null,"rejectNote":null}}
    GET /api/jobs → job_demo1.decision=approved
    job is approved ✓

[4] POST /api/job/job_demo1/case {caseId:'case_demo1'} …
    {"ok":true,"job":{"id":"job_demo1","externalId":"ext1","source":"demo","title":"Head of Acquisition","company":"BettingJobs","location":"Remote","url":"https://example.com/job1","snippet":"Lead acquisition strategy across key iGaming markets","decision":"approved","signal":"neutral","matchedRules":[],"rejectReason":null,"rejectNote":null,"caseId":"case_demo1"}}
    caseId=case_demo1 ✓

[5] Killing server (pid=57449) …
    Server stopped. DB NOT wiped.
    Restarting …
    health (post-restart): {"ok":true,"service":"hello-lilly-dev-server","store":{"adapter":"sqlite","path":"/Users/danieloskarsson/Library/CloudStorage/Dropbox/Projects/hello lily - app/.claude/worktrees/core-loop-wave/server/data/store-demo-b.db","durable":true,"cases":0,"datafacts":0}}
    store.durable=true (post-restart) ✓

[6] GET /api/jobs (post-restart) — decision and caseId must still be present …
    job entry: {
  "id": "job_demo1",
  "externalId": "ext1",
  "source": "demo",
  "title": "Head of Acquisition",
  "company": "BettingJobs",
  "location": "Remote",
  "url": "https://example.com/job1",
  "snippet": "Lead acquisition strategy across key iGaming markets",
  "decision": "approved",
  "signal": "neutral",
  "matchedRules": [],
  "rejectReason": null,
  "rejectNote": null,
  "caseId": "case_demo1"
}
    decision=approved
    caseId=case_demo1

DEMO (b) PASS — job decision (approved) and caseId link survived server restart; store.durable=true
```

**Result: PASS.** Job `job_demo1` was seeded with `decision:'new'`. After `POST decide →
approved` and `POST case → case_demo1`, a full server kill + restart was performed with
the SQLite db untouched. `GET /api/jobs` post-restart returned the job with
`decision:'approved'` and `caseId:'case_demo1'` intact — byte-identical to what was written
before the restart. `store.durable:true` on both health calls.
