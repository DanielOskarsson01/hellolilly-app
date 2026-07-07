# Demo (a) — letter save-and-resume across server restart

**Date:** 2026-07-07 · **Branch:** `core-loop-wave`

**What this proves:** `POST /api/case/:id/letter-draft` persists edited paragraphs and
decision-overrides in SQLite. Both fields survive a full server kill-and-restart with the
database file untouched — the durable SQLite WAL store reloads them identically on the next
boot. `GET /api/health` reports `store.durable:true` both before and after the restart.

---

## Captured run output

```
=== DEMO (a): letter save-and-resume across server restart ===

[1] Starting server on port 5291 with fresh db …
    health: {"ok":true,"service":"hello-lilly-dev-server","store":{"adapter":"sqlite","path":"/Users/danieloskarsson/Library/CloudStorage/Dropbox/Projects/hello lily - app/.claude/worktrees/core-loop-wave/server/data/store-demo-a.db","durable":true,"cases":0,"datafacts":0}}
    store.durable=true ✓

[2] Creating case …
    {"ok":true,"case":{"meta":{"id":"case_af7545f2","company":"BettingCo","role":"Head of Acquisition","round":1,"interviewDate":null,"interviewers":[],"format":null,"sourceInput":"Job ad text here","cvVersionRef":null,"owner":"self","status":"intake","createdAt":"2026-07-07T13:18:49.363Z","updatedAt":"2026-07-07T13:18:49.363Z"},"dossiers":{"status":"absent","data":null,"updatedAt":"2026-07-07T13:18:49.363Z"},"decodedRole":{"status":"absent","data":null,"updatedAt":"2026-07-07T13:18:49.363Z"},"fit":{"status":"absent","data":null,"updatedAt":"2026-07-07T13:18:49.363Z"},"gaps":{"status":"absent","data":null,"updatedAt":"2026-07-07T13:18:49.363Z"},"cvDraft":{"status":"absent","data":null,"updatedAt":"2026-07-07T13:18:49.363Z"},"coverLetter":{"status":"absent","data":null,"updatedAt":"2026-07-07T13:18:49.363Z"},"coverLetterDraft":{"status":"absent","data":null,"updatedAt":"2026-07-07T13:18:49.363Z"},"prep":{"status":"absent","data":null,"updatedAt":"2026-07-07T13:18:49.363Z"},"cards":{"status":"absent","data":null,"updatedAt":"2026-07-07T13:18:49.363Z"},"liveLog":{"status":"absent","data":null,"updatedAt":"2026-07-07T13:18:49.363Z"},"postMortem":{"status":"absent","data":null,"updatedAt":"2026-07-07T13:18:49.363Z"}}}
    caseId=case_af7545f2 ✓

[3] Writing letter-draft (paragraphs + decisions) …
    {"ok":true,"part":{"status":"ready","data":{"language":"en","paragraphs":["Edited para 1","Edited para 2"],"decisions":{"Overclaims 5 years":"soften","Fabricated cert":"cut"},"editedAt":"2026-07-07T13:18:49.387Z"},"updatedAt":"2026-07-07T13:18:49.388Z"}}

[4] GET /api/case/:id (pre-restart sanity) …
    paragraphs[0]=Edited para 1
    paragraphs[1]=Edited para 2
    decisions[Overclaims 5 years]=soften
    decisions[Fabricated cert]=cut
    pre-restart data intact ✓

[5] Killing server (pid=57351) …
    Server stopped. DB NOT wiped.
    Restarting …
    health (post-restart): {"ok":true,"service":"hello-lilly-dev-server","store":{"adapter":"sqlite","path":"/Users/danieloskarsson/Library/CloudStorage/Dropbox/Projects/hello lily - app/.claude/worktrees/core-loop-wave/server/data/store-demo-a.db","durable":true,"cases":1,"datafacts":0}}
    store.durable=true (post-restart) ✓

[6] GET /api/case/:id (post-restart — must still have data) …
    paragraphs[0]=Edited para 1
    paragraphs[1]=Edited para 2
    decisions[Overclaims 5 years]=soften
    decisions[Fabricated cert]=cut

DEMO (a) PASS — paragraphs and decisions survived server restart; store.durable=true
```

**Result: PASS.** Paragraphs `["Edited para 1","Edited para 2"]` and decisions
`{"Overclaims 5 years":"soften","Fabricated cert":"cut"}` were written via
`POST /api/case/:id/letter-draft`, confirmed present via `GET /api/case/:id` pre-restart,
and were **byte-identical after a full server kill + restart**. The case count in the
post-restart health response (`cases:1`) confirms the SQLite store reloaded the record from
disk. `store.durable:true` on both health calls.
