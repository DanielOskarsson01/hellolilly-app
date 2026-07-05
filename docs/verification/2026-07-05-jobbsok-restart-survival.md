# Jobbsök unit — restart-survival triage demo (verification)

**Date:** 2026-07-05 · **Branch:** `jobbsok-unit` · **What this proves:** the top correctness
criterion — **one job, one decision record** that **survives a server restart**. The result row and
the ad layover write the SAME durable store record (keyed on `job.id`) through the ONE served decide
route; a re-discovery keeps the decision (dedup on `externalId`).

There are two halves. The **API half is pre-verified** below (browser-free, recorded output). The
**UI half was run live by Daniel on 2026-07-05 — PASS** (recorded outcome under Half 2); the browser
step is deliberately not automated.

---

## Half 1 — API-level persistence (PRE-VERIFIED 2026-07-05, browser-free)

Run against an isolated temp store + port so nothing real is touched:

```bash
cd "<repo>/.claude/worktrees/jobbsok-unit"

# seed two jobs into an isolated SQLite store (no live API needed)
node -e '
const { bootstrapStore } = require("./server/store-bootstrap.cjs");
const { store } = bootstrapStore({ storePath: "/tmp/jobbsok-verify.db" });
store.putRecord("jobs", { id:"job_v1", externalId:"jobtech-v1", source:"jobtech", title:"CMO", company:"Acme", location:"Stockholm", url:"https://example.com/v1", snippet:"Lead marketing", decision:"new", signal:"neutral", matchedRules:[] });
store.putRecord("jobs", { id:"job_v2", externalId:"rok-v2", source:"remoteok", title:"VP US", company:"Playline", location:"Remote US", url:"https://example.com/v2", snippet:"US hours", decision:"new", signal:"low", matchedRules:[{rule:"location_out",term:"US"},{rule:"US_TIMEZONE",term:"us hours",stage:2}] });
'

# start the server on the temp store
STORE_PATH=/tmp/jobbsok-verify.db PORT=5199 node server/dev-server.cjs &

# decide (approve + reject-with-reason)
curl -s -X POST 127.0.0.1:5199/api/job/job_v1/decide -H 'content-type: application/json' -d '{"decision":"approved"}'
curl -s -X POST 127.0.0.1:5199/api/job/job_v2/decide -H 'content-type: application/json' -d '{"decision":"rejected","reason":"LOCATION","note":"kräver USA-tider"}'

# kill the server, then RESTART against the same DB, then read back
kill %1 ; STORE_PATH=/tmp/jobbsok-verify.db PORT=5199 node server/dev-server.cjs &
curl -s 127.0.0.1:5199/api/jobs      # <-- decisions must still be present
```

**Recorded outcome (2026-07-05):**

- Before decisions: `GET /api/jobs` → `job_v1 = new (signal neutral)`, `job_v2 = new (signal low)`.
- `POST decide job_v1 → approved` → `200 { ok:true, decision:"approved", title:"CMO" (untouched) }`.
- `POST decide job_v2 → rejected` → `200 { ok:true, decision:"rejected", rejectReason:"LOCATION", rejectNote:"kräver USA-tider", matchedRules untouched }`.
- Same running server: `job_v1 → approved`, `job_v2 → rejected · LOCATION`.
- **After `kill` + restart against the same SQLite DB:** `job_v1 → approved`, `job_v2 → rejected · LOCATION · "kräver USA-tider"`. **RESTART-SURVIVAL: PASS** — both decisions persisted.

Only `decision` / `rejectReason` / `rejectNote` change; `title`, `signal`, `matchedRules` are untouched
(the decide route is a targeted upsert by `id`). Dedup-preserves-decision (a re-discovery keeping an
existing decision) is covered by the route test `decide survives a re-discovery dedup pass` in
`server/api.test.cjs`.

---

## Half 2 — UI row ⇄ layover reflection + restart (RUN LIVE 2026-07-05 — PASS)

The correctness criterion's UI half — a decision made on the **row** reflects in the **layover** and
vice-versa (same record), and both survive a restart. Run this in a browser (not automated):

1. **Start the app:** `npm run dev` in `.claude/worktrees/jobbsok-unit`, open `http://127.0.0.1:5173/#jobbsok`.
   - Fresh clone / empty store → the screen shows the honest empty state ("Inga jobb ännu"), NOT fixtures.
2. **Populate the store:** type a keyword, click **Sök jobb**. Discovered jobs appear in the triage tiers
   (clean jobs in "Träffar att gå igenom"; flagged jobs in "Filtrerade / nedrankade", open, never hidden).
3. **Approve on the ROW:** click **Godkänn** on a card → it moves to "Köade att söka".
4. **Reject in the LAYOVER:** click a *different* card's body (or "Till annonsen"'s neighbour) to open the
   ad layover (`kind:'jobpreview'` — our stored copy, "Ingen analys än", NOT an iframe). Click **Välj bort**,
   pick a reason (e.g. *Fel ort / för långt*), optionally add a motivation, **Spara — välj bort**.
   - **Check:** the layover closes and that card immediately shows "Bortvald · <reason>" on the ROW.
     (The layover wrote the same record; `ll:jobs:changed` refetched the row.)
5. **Reverse direction:** open a queued job's preview in the layover — it reflects "Köad" state (same record).
   Reopen one via **Ångra** on the row → it returns to "att gå igenom", and the layover reflects that too.
6. **Restart:** stop the server (Ctrl-C), `npm run dev` again, reload `#jobbsok`.
   - **Check:** every decision from steps 3–5 is still present, on both the row and the layover.
7. **Dedup:** run the SAME search again ("Sök jobb"). Already-decided jobs keep their decision (dedup on
   `externalId`) — approved stays "Köad", rejected stays "Bortvald".

**Pass criteria:** a layover decision reflects on the row (and vice-versa) with no page reload; all
decisions survive the kill+restart; a re-run keeps decisions. This is the single-decision-record contract
end to end — the reviewer checks it first.

### Recorded live outcome (2026-07-05, Daniel at the browser · Claude verified the store via the API)

Build under test: through `afa61c7` (layout scope fix) on the `jobbsok-unit` branch. Real JobTech
marketing roles (marknadschef / Head of … / Marketing Manager) — the Daniel Oskarsson iGaming/marketing
persona, not the warehouse fixture.

1. **Clean slate:** store wiped, server restarted → `/api/health` `durable:true`, `0 jobs`;
   `POST /api/job/clear` → `{ok:true,cleared:0}` (fixed clear route live).
2. **Search (real terms):** marketing keywords (not the old `lager/logistik/truck` defaults) → Daniel
   triaged on the rows to a baseline of **18 jobs — new:10 · approved:3 · rejected:5**.
3. **Cross-surface reflection:** opened **"Head of Paid Acquisition"** (a `new` job) via its title →
   **layover** → **Välj bort** → reason → **Spara**. The row immediately moved to **Bortvalda** with its
   reason (Daniel confirmed). Store: **new:9 · approved:3 · rejected:6**.
4. **Kill + restart WITHOUT wiping:** `Ctrl+C`, `npm run dev`, `store.db` untouched. (`.env not found`
   and the CV-seed skip are expected — personal data gitignored; neither touches the jobs store.)
5. **Persistence:** `/api/health` `durable:true`; `/api/jobs` → **18 jobs — new:9 · approved:3 ·
   rejected:6** (identical to pre-restart); **Head of Paid Acquisition → `rejected · reason=SENIORITY`**
   — the *layover* decision survived the restart. Browser refresh on `#jobbsok` matched (Daniel confirmed).

**RESTART-SURVIVAL (UI): PASS** — a decision made in the layover reflected on the row and persisted
across a full server restart. One job, one durable decision record.

**Bug found + fixed during this run:** `#jobbsok` (first real-app render of `PageTemplate`) inherited the
old `.ll-site` shell → floating nav, blue slab, off-center page. Root-caused via systematic debugging and
fixed in `afa61c7` (toggle `ll-site` off + `ll-template` cream background on template routes). Re-verified
live. No automated DOM test caught it — the project has no jsdom/vitest harness; **adding a vitest+jsdom
frontend harness is the logged follow-up** so cross-surface reflection and template-scope regressions get
an automated guard. Suite at verification: **172 pass / 1 skip / 0 fail**.

> Note (Matchanalys seam, by design — Option A): approving here writes the backend `decision` but does
> NOT populate the legacy `#match` (Matchanalys) queue, which still reads the older localStorage
> `acceptedJobs`. Unifying the two is the logged follow-up for the Matchanalys wave (see the build report).
