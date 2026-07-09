# Progress Support — Wave A: D5 generic-collection mechanism + activity logging — DESIGN

**Status:** proposed — awaiting user review before the implementation plan.
**Date:** 2026-07-09
**Branch:** `progress-support-wave-a` (off `main` @ `398c740`). Not to be merged in this wave — independent review first.
**Scope source:** [`docs/PROGRESS_SUPPORT_WAVE_A_SCOPE.md`](../../PROGRESS_SUPPORT_WAVE_A_SCOPE.md) (this wave) and its parent [`docs/PROGRESS_SUPPORT_BUILD_SCOPE.md`](../../PROGRESS_SUPPORT_BUILD_SCOPE.md) (the full one-wave version Wave A carves down from).

---

## 0. What this wave is, and one correction to the scope note

**Wave A is foundation only.** It ships three things and nothing else:

1. **D5** — the generic named-collection mechanism (a reusable hook + generic CRUD routes + a record convention), generalized from the working `jobs` pattern.
2. **The `activity` collection** — an append-only log of *confirmed* state changes, written server-side at the honest choke point.
3. **A minimal, plainly-labelled verification view** — a plain chronological list over the real collection, with honest states. Not the designed surface.

Everything designed — weekly cadence, a `tasks` collection, next-step/overdue rules, motivational framing, the coach `Ärendevy` going real — is **Wave B**, which will be designed against the *real logged data this wave produces*. This wave exists first because **every week activity is not logged is data the future learning layer loses forever** — it cannot be backfilled.

### 0.1 Correction to the scope note (durable — read this before anything else)

The scope note says: *"Log at the SERVER-SIDE choke point (`store.writePart` / `store.putRecord`)."* **That instruction was wrong, and this section records why so the reasoning survives.**

Raw store-level interception classifies a write by its `(method, part, collection)` — but at that level the signal that says *which user action happened* is already gone:

- **`writePart('cvDraft', …)` is written by BOTH `/generate` (→ "CV generated") AND `/cv/align-keyword` (→ "keyword aligned").** A store-level classifier cannot tell them apart, so it would mislabel every keyword-align as "CV written."
- **`writePart('fit', …)` is written by BOTH `/analyze` (→ "analysis run") AND gap-fill (→ "gap filled").** Same collision.
- **`/research` and `/analyze` each write two parts** (`dossiers`+`decodedRole`; `fit`+`gaps`), so a store-level wrap emits **two** records for **one** logical action.
- **`ingestDatafact` also fires during startup seeding**, and **bulk `putRecord('jobs', …)` + `putRecord('filterSet', …)` fire on every job search** — all pure noise a store-level wrap would have to special-case away.

A **mislabeled log is worse than a slightly riskier emitter**, because Wave B and the learning layer consume these `type`/`label` fields directly. Corrupt labels are expensive to retrofit and silently poison every downstream inference.

**Resolution (user-confirmed 2026-07-09): action-level emit through one module.** A single `activity-log.cjs` exposes `logActivity(store, event)`; each server action handler calls it on its **success path, AFTER the confirmed store mutation returns without throwing**. This is where the action's intent is unambiguous.

**The property the scope note actually cared about is preserved.** Emitting *after* the confirmed store call means a rejected mutation logs nothing: if `writePart`'s gate throws, control never reaches the `logActivity` line. So the wave's correctness test stands **exactly as specified**:

> **A gate-thrown / rejected mutation writes NO activity record.**

The one cost of action-level emit — a future action author could *forget* to emit — is guarded by (a) a documented convention block, (b) a per-action emit test, and (c) an over-logging test that fails if a new noise source appears. See §2.6.

---

## 1. Part 1 — D5: the generic named-collection mechanism

### 1.1 What already exists — do NOT rebuild it

Verified against the code (`server/skeleton/store/`):

| Primitive | Location | Behavior |
|---|---|---|
| `putRecord(name, rec)` | `index.cjs:119` | upsert by `rec.id` (required); detaches on write |
| `getRecord(name, id)` | `index.cjs:124` | detached read or `null` |
| `listRecords(name)` | `index.cjs:128` | detached array (empty if unknown) |
| `removeRecord(name, id)` | `index.cjs:132` | delete by id |
| `collection_records(name, id, data)` | `sqlite.cjs:37-40` | generic durable table, PK `(name, id)` |

**Two store layers, and why they matter here:** `index.cjs` is the in-memory source of truth (runs the writing-rules gate, the detach immutability boundary). `sqlite.cjs` wraps it: every mutating method calls the inner method **first** (which may throw — e.g. the gate), and only **then** writes the row through (`sqlite.cjs:115-119`). **A gate throw therefore persists nothing** — the exact honesty property the activity log inherits by emitting *after* a successful store call. A new collection is **new rows under a new name — zero DDL, zero new store concept** (confirmed: `snapshot`/`hydrate` and all three adapters already round-trip arbitrary collection names).

### 1.2 Generic HTTP surface — generalize the jobs routes

Add three routes to `server/dev-server.cjs`, mirroring the existing job routes, placed **above** the `/api/case/:id` regex catch-all (`dev-server.cjs:156`) so they are not shadowed:

| Route | Handler | Notes |
|---|---|---|
| `GET /api/collection/:name` | `listRecords(name)` → `{ ok, records }` | any name, incl. `activity` (read is always allowed) |
| `POST /api/collection/:name` | require `body.id`; `putRecord(name, body)` → `{ ok, record }` | **rejects `name==='activity'` with 405** — see 1.2.1 |
| `DELETE /api/collection/:name/:id` | `removeRecord(name, id)` → `{ ok, removed }` | **rejects `name==='activity'` with 405** — see 1.2.1 |

#### 1.2.1 The `activity` collection is append-only and server-emitted (integrity guard)

The activity log's trustworthiness depends on it recording only *what the server confirmed happened*. If the generic `POST`/`DELETE` routes let a client forge or delete activity rows, that guarantee is gone. So the generic routes **reject client writes to `activity`** (`405 Method Not Allowed`, body explains it is server-emitted, append-only). `GET /api/collection/activity` is allowed — the verification view reads it. Other collections (e.g. Wave B's `tasks`) use the full CRUD normally. This is a cheap, honest guard, not a new mechanism.

### 1.3 Generic client hook — `useCollection(name)`

New `src/hooks/useCollection.js`, generalized **verbatim in shape** from `src/hooks/useJobs.js` (the working template):

```js
export function useCollection(name) {
  const [records, setRecords] = React.useState([]);
  const [status, setStatus]   = React.useState('pending'); // 'pending' | 'ready' | 'failed'
  const [error, setError]     = React.useState(null);

  const reload = React.useCallback(() => {
    let live = true; setStatus('pending'); setError(null);
    listCollection(name)
      .then((r) => { if (live) { setRecords(r || []); setStatus('ready'); } })
      .catch((e) => { if (live) { setError(e); setStatus('failed'); } });
    return () => { live = false; };
  }, [name]);

  React.useEffect(() => reload(), [reload]);

  React.useEffect(() => {
    const on = (e) => { if (!e.detail?.name || e.detail.name === name) reload(); };
    window.addEventListener('ll:collection:changed', on);
    return () => window.removeEventListener('ll:collection:changed', on);
  }, [reload, name]);

  return { records, status, error, reload };
}
```

Same honest `pending / ready / failed` triad as every hook in the app; empty is `ready` with `records: []` (the view renders the empty state, never conflated with a failure). The `e.detail.name` filter means a change to one collection does not needlessly refetch others.

### 1.4 Generic client API

New `src/api/collectionApi.js` (keeps `caseApi.js` case-focused), using the same `request()` wrapper pattern:

```js
export function listCollection(name)          // GET  → records[]
export function upsertRecord(name, record)    // POST → record, then dispatch ll:collection:changed {name}
export function removeCollectionRecord(name, id) // DELETE → {ok}, then dispatch ll:collection:changed {name}
function dispatchCollectionChanged(name)      // window.dispatchEvent(new CustomEvent('ll:collection:changed', { detail:{name} }))
```

### 1.5 Record + scoping convention

Every collection record carries a stable `id` (required by `putRecord`), plus — where relevant — a `caseId` tag and an `at` ISO timestamp. **"Scope to a case" is a filter, not a mechanism:** `listRecords('activity').filter(r => r.caseId === X)`. Collections are global with `caseId` tags — exactly how `jobs` already works. This convention is the template every later collection tool inherits (Company List, Job Radar signals, Outreach contacts, the tracking screen).

---

## 2. Part 2 — the `activity` collection + honest logging

### 2.1 The record shape (serves TWO audiences without a migration)

This ONE collection is the single source of truth for **both** the jobseeker's "Min aktivitet" (built real in Wave B) **and** the coach-facing "Ärendevy" (a labelled demo until the D4 pilot-coach trigger). The shape is designed so a coach view can render meaningfully later with **no migration**:

```js
{
  id:     "activity_1a2b3c4d",          // mintId('activity') — stable, never reused
  at:     "2026-07-09T09:22:11.031Z",   // ISO-8601; the SINGLE source of time (all display derives from it)
  type:   "keyword_aligned",            // machine event type — the stable vocabulary both views branch on
  caseId: "case_9f8e7d6c" | null,        // scoping tag; coach Ärendevy filters by it; null for case-less events
  label:  "Nyckelord infört: WMS",       // human, audience-neutral one-line summary (both views show it as-is)
  meta:   { term: "WMS", datafactId: "datafact_…" }, // STRUCTURED context — never a pre-rendered string
  source: "system"                       // 'system' (auto, Wave A) | 'manual' (coach-entered, later) = CASE_RECORD `auto`
}
```

**Why this maps to the `CASE_RECORD` fixture (`strategyData.js:68-88`) with no migration:** a fixture timeline item is `{ ic, tint, t, m, time, auto }`.

- `t` (title) ← `label`
- `time` ← derived from `at`
- `auto` ← `source === 'system'`
- `ic`/`tint` (icon + colour) ← **derived in the VIEW from `type`**, *not* stored on the record
- `m` (detail line) ← **derived in the VIEW from `type` + `meta`** (e.g. `job_rejected` → `"${meta.company} — ${meta.reason}"`)

**The load-bearing decision:** presentation (icons, colours, rendered detail strings) lives in a **view-side map keyed by `type`**, never in the record. A new audience (the coach view) supplies its own map over the same `type` + `caseId` + `label` + `meta` + `at`. If icons or rendered strings were baked into records, adding the coach view would require rewriting every historical row — the migration this shape exists to avoid. `meta` is therefore **structured data, never a formatted sentence**.

### 2.2 The `activity-log.cjs` module

New `server/activity-log.cjs` — a thin, testable helper over the store:

```js
const { mintId } = require('./skeleton/ids.cjs');

// Append one CONFIRMED state-change record. Called by server action handlers on
// their success path, AFTER the store mutation returned without throwing.
// `now`/`id` are injectable for deterministic tests.
function logActivity(store, { type, caseId = null, label, meta = {}, source = 'system' }, { now, id } = {}) {
  if (!type || !label) throw new Error('logActivity: type and label are required');
  const record = {
    id: id || mintId('activity'),
    at: now || new Date().toISOString(),
    type, caseId, label, meta, source,
  };
  return store.putRecord('activity', record); // durable via whichever adapter; detached; append-only
}
module.exports = { logActivity };
```

- **Append-only:** every call mints a fresh `id` → a new row. Nothing ever `removeRecord`s from `activity`.
- **Durable:** `store.putRecord('activity', …)` writes through to `collection_records` under the sqlite adapter — the same path `jobs` already survives restarts on.
- **`ids.cjs` change:** add `'activity'` to the `KINDS` set (`ids.cjs:12-16`) so `mintId('activity')` yields `activity_<8hex>`, consistent with `job_`, `datafact_`, `gap_`.
- **Emit failures surface loudly, never swallowed.** `logActivity` runs after the real mutation already succeeded, so it does not gate the state change; but if the `putRecord('activity', …)` itself were to throw, that error propagates rather than being silently caught — consistent with the repo's explicit "never swallow silently" rule (`dev-server.cjs:62`). Risk is near-zero (a trivial `putRecord` of a validated object); the point is honesty — a missing log should be a visible bug, not a silent gap.

### 2.3 The action → activity map (the heart of the wave)

Each row is one `logActivity` call added to `server/dev-server.cjs`, on the handler's success path. `caseId` is the case in scope (or the job's linked case where applicable).

| Handler (dev-server.cjs) | Emit condition | `type` | `label` (sv) | `meta` |
|---|---|---|---|---|
| `POST /api/case` (`:96`) | on 201 | `case_created` | `Ärende skapat: {company} · {role}` | `{ company, role }` |
| `POST /api/case/:id/research` (`:169`) | 200 or 207 (dossiers persisted) | `research_run` | `Research körd` | `{ partial: bool }` |
| `POST /api/case/:id/analyze` (`:186`) | on 200 | `analysis_run` | `Matchanalys körd` | `{ gapsFound, fitOverall? }` |
| `POST /api/case/:id/generate` (`:246`) | per part that reached `ready` | `cv_generated` / `letter_generated` | `CV genererat` / `Personligt brev genererat` | `{ status: 'ready' }` |
| `POST /api/case/:id/gap/:gapId/answer` (`:197`) | accepted outcome only | `gap_filled` | `Lucka fylld` | `{ gapId, requirementId, datafactId? }` |
| `POST /api/case/:id/cv/align-keyword` (`:218`) | `result.outcome === 'aligned'` | `keyword_aligned` | `Nyckelord infört: {term}` | `{ term, datafactId }` |
| `POST /api/case/:id/letter-draft` (`:231`) | on 200 | `letter_draft_saved` | `Brevutkast sparat` | `{ paragraphCount, language }` |
| `POST /api/job/:id/decide` (`:123`) | decision ∈ {approved,rejected,new} | `job_approved` / `job_rejected` / `job_reopened` | `Jobb godkänt/avvisat/återöppnat: {title}` | `{ jobId, title, company, reason? }` |
| `POST /api/job/:id/case` (`:143`) | on 200 | `job_linked` | `Jobb kopplat till ärende: {title}` | `{ jobId, caseId, title }` |

**`type` vocabulary (Wave A, frozen for the log — additions are deliberate):** `case_created`, `research_run`, `analysis_run`, `cv_generated`, `letter_generated`, `gap_filled`, `letter_draft_saved`, `keyword_aligned`, `job_approved`, `job_rejected`, `job_reopened`, `job_linked`.

Notes carrying real decisions:
- **`generate` emits per-produced part.** On a 200 both parts reached `ready` → two records. On a 207 only the ready one emits — honest: it logs the CV or letter that *actually* got written, never a phantom.
- **`research` on 207** (dossiers written, decoder failed) still logs — the dossiers are a confirmed state change — with `meta.partial: true`. On a 500 (nothing written) nothing is logged.
- **`gap_filled` only on the accepted outcome** (a datafact minted + the requirement flipped to match). A `stays_gap` answer changed no state → no record. (Exact accepted-outcome field confirmed against `applyAnswer` during the plan.)

### 2.4 The `createCase` hook

The scope's "one gap to close." With action-level emit it is simply a `logActivity(host.store, { type:'case_created', caseId:c.meta.id, … })` on the `POST /api/case` success path (`dev-server.cjs:96-97`). Cases created inside scripts/tests (not via HTTP) do not emit — correct: those are not user actions.

### 2.5 The keyword-align emit

`applyAlign` (`server/skeleton/fill-gap/keyword-judge.cjs`) calls `store.writePart('cvDraft', …)` **only** on the aligned path (`:132-134`), after passing five guards including the honesty gate; every refusal returns `{ outcome:'refused' }` with **no write**. The handler therefore emits `keyword_aligned` **only when `result.outcome === 'aligned'`** — a refused align (no supporting fact, term unrelated, or aligned wording fails the gate) writes neither the CV nor an activity record. This is the second face of the mandated test (§2.6).

### 2.6 The honesty invariant, the convention, and the "remember to emit" guard

**Invariant:** an activity record exists ⇔ a user-meaningful state change was confirmed persisted. Two directions, both tested:

- *No false positives* — a rejected/gate-thrown mutation logs nothing (the mandated test).
- *No noise* — bulk/seed/derived writes log nothing (the over-logging test).

**Convention block** (copied into `activity-log.cjs` and referenced at the top of the dev-server route section):

> **CONVENTION — activity logging (Wave A).** Every server action that produces a CONFIRMED, user-meaningful state change MUST call `logActivity(store, {…})` on its SUCCESS path, AFTER the store mutation returns without throwing — never before (that logs an attempt), never for bulk/seed/derived writes (search results, `filterSet`, datafact seeding). Adding a new action ⇒ add a `logActivity` call, a row to the design-doc table (§2.3), and an emit test. The emitter is action-level by a deliberate correction to the original scope note — store-level cannot distinguish align/generate or gap-fill/analyze (design doc §0).

**The "forgot to emit" risk** cannot be fully unit-tested (you can't test code that isn't written), but it is guarded three ways: the convention above, a per-action emit test (§6) that documents the expected vocabulary, and the over-logging test that fails loudly if a *new* store write starts producing — or a noise source starts leaking — activity. That converts "silent drift" into "a visible, tested step."

### 2.7 What is deliberately NOT logged

`POST /api/jobs/search` (bulk `putRecord('jobs')` + `putRecord('filterSet')`), `POST /api/job/clear`, and startup `seedDatafactsIfEmpty` (`ingestDatafact` ×N) call **no** `logActivity`. Under action-level emit this requires no special-casing — those paths simply don't emit. The over-logging test (§6) locks it in.

---

## 3. Part 3 — the minimal verification view

### 3.1 A new plain view, not a repoint (builder's call, per scope)

The scope allows either a minimal new view or repointing the existing `ActivityTracker` (`cvActivity.jsx:315-480`). **Decision: a new minimal view.** Rationale, grounded in the code:

- The existing `ActivityTracker` does **not** read a real log — `useActivityRows` *derives* pseudo-activity from six case-part `updatedAt` snapshots (`PART_ACTIVITY` map, `cvActivity.jsx:306-359`) and structurally misses job decisions, aligns, draft saves, gap answers, and case-created.
- It also already carries **Wave-B chrome** the scope defers: day grouping, a `WeekRing`, "Din vecka i siffror", motivational copy. Repointing means gutting `useActivityRows` **and** stripping that chrome — a large, messy diff that half-converts a component Wave B will redesign against the real data anyway.
- A fresh, plain component is smaller, cleaner, and unmistakably "not the finished surface." The existing demo `ActivityTracker` stays untouched.

### 3.2 Shape of the new view

New `src/screens/activityLog.jsx` — `ActivityLog` component:

- Reads `useCollection('activity')`; renders records sorted by `at` descending as a **flat chronological list** (no day/week grouping — that's Wave B).
- **Honest states, same pattern as every screen:** `pending` → "Hämtar aktivitet…"; `failed` → the error surfaced, never masked as empty; `ready && empty` → a plain empty state; `ready && records` → the list.
- Each row: `label`, a time from `at`, and a small view-side `type → { icon, tint }` map plus a `type` + `meta → detail` renderer (the presentation map that proves §2.1's no-migration claim — it lives here, not on the record).
- **Plainly labelled** at the top: e.g. *"Aktivitetslogg — verifieringsvy (inte den färdiga Min aktivitet-vyn)."* so nobody mistakes it for the finished surface.
- Route: a new hash route `#activity-log`, reachable via a plainly-labelled entry added to the existing "Plan" nav group in `shell.jsx` next to "Min aktivitet" (mechanical insertion mirrors the existing entry). The finished "Min aktivitet" (`#activity`) is Wave B's.

---

## 4. Data flow (one action, end to end)

```
User clicks "Infoga nyckelord"
  → alignKeyword(caseId,{term,basisDatafactId})           [src/api/caseApi.js]
    → POST /api/case/:id/cv/align-keyword                  [dev-server.cjs:218]
      → applyAlign(store, llm, {…})                        [keyword-judge.cjs]
          guards + honesty gate → store.writePart('cvDraft', …)   ← durable; a gate throw stops here (no emit)
        outcome === 'aligned'
          → logActivity(store,{type:'keyword_aligned',caseId,label,meta})   [activity-log.cjs]
            → store.putRecord('activity', {id,at,…})       → collection_records row  (survives restart)
      → 200 { ok:true, result }
  → alignKeyword dispatches  ll:collection:changed {name:'activity'}
    → useCollection('activity').reload()                   [useCollection.js]
      → GET /api/collection/activity                       → view re-renders
```

A refused align stops at `applyAlign` (no `writePart`, no `logActivity`, no row). A gate-thrown `writePart` (e.g. banned content on `/letter-draft`) throws before its handler's `logActivity` line — 500, no row.

---

## 5. Event propagation

`useCollection` refetches on `ll:collection:changed` (filtered by `detail.name`). Two dispatch sources:

1. The **generic** collection client helpers (`upsertRecord`/`removeCollectionRecord`) — for future tools (`tasks`, etc.).
2. The **existing action helpers** that trigger server-side activity — each also dispatches `ll:collection:changed {name:'activity'}` (one line, alongside its current domain event): `createCase`, `research`, `analyze`, `generate`, `answerGap`, `alignKeyword`, `saveCoverLetterDraft`, `decideJob`, `linkJobCase`. This keeps `useCollection` generic (one event) and makes the verification view update live. (Minor decision; the restart demo — the wave's durability proof — relies only on reload-on-mount, so this is convenience, not correctness.)

---

## 6. Testing strategy

All `node --test`, matching the repo's existing harnesses.

| Test | File | Asserts |
|---|---|---|
| `logActivity` unit | `server/activity-log.test.cjs` | well-formed record (`id`/`at`/`type`/`label`/`meta`/`source`); append-only (two calls → two rows); determinism via injected `now`/`id` |
| Collection routes | `server/api.test.cjs` (extend) | GET/POST/DELETE round-trip on a test collection; **POST and DELETE reject `activity` (405)**; GET `activity` allowed |
| Per-action emit | `server/api.test.cjs` (extend) | each mapped action emits exactly one correct record (right `type`/`label`/`meta`): `case_created`, `analysis_run`, `keyword_aligned`(aligned), `job_approved`/`rejected`/`reopened`, `job_linked`, `letter_draft_saved`, `cv_generated`+`letter_generated`, `gap_filled`(accepted), `research_run` |
| **MANDATED — no false positives** | `server/api.test.cjs` (extend) | **(a)** `/letter-draft` with gate-banned content → `writePart` throws → 500 → **0 activity records**. **(b)** refused `/cv/align-keyword` → `ok:false` → **0 activity records**. |
| Over-logging guard | `server/api.test.cjs` (extend) | after a `/jobs/search` (bulk `putRecord`) **and** datafact seeding → **0 activity records** |
| Client API | `src/api/collectionApi.test.mjs` | `listCollection`/`upsertRecord`/`removeCollectionRecord` request shaping + `ll:collection:changed` dispatch (mocked `fetch`) |
| Durability restart demo | `docs/verification/2026-07-09-activity-log-restart-survival.sh` + `.md` | sqlite store → run a real logging action → **restart process from the same db file** → the activity record survives. Mirrors `2026-07-07-letter-save-resume-restart.sh`. |

`useCollection` itself is a thin structural copy of the already-working, in-production `useJobs`; its behavior is covered by the client-API test + the view + the manual restart demo (hook rendering without a DOM is out of the repo's test harness — same as `useJobs`, which has no unit test). **Full suite green; a fresh clone (`clone → npm install → test`) must hold.**

---

## 7. Out of scope (Wave A) — explicit

- The **fuller designed surface** — activity view proper, weekly cadence, `tasks` collection + task-breakdown, next-step/overdue rules, motivational framing. **All Wave B**, after a Claude Design pass against the real data this wave produces.
- **Actively-delivered push/scheduled reminders** — infrastructure-blocked; `Påminnelser` stays a ComingSoon stub.
- **The coach `Ärendevy` going real** — a labelled demo reading the same collection until D4.
- **A client-side storage adapter for the hosted static build** — backlog. D5 storage is SQLite via the local dev-server; the static build has no server.

---

## 8. Design decisions

1. **Emitter placement: action-level, one module (`activity-log.cjs`).** Corrects the scope note's "store-level choke point" — store-level mislabels align/generate and gap-fill/analyze and over-logs (§0). Emit on the success path *after* the confirmed store call, so the mandated gate-throw test holds. User-confirmed 2026-07-09.
2. **Record shape carries structured `meta` + `type`; presentation is view-side.** Guarantees the coach `Ärendevy` renders the same collection later with no migration (§2.1).
3. **`activity` is append-only + server-emitted; generic `POST`/`DELETE` reject it (405).** The log's trustworthiness depends on the client being unable to forge/delete rows (§1.2.1).
4. **A new minimal verification view, not a repoint of `ActivityTracker`.** Smaller, cleaner, and doesn't half-convert a component Wave B will redesign (§3.1).
5. **Reuse the existing storage primitive, `ids.cjs`, and honest-state pattern verbatim.** The only new storage-adjacent line is adding `'activity'` to `KINDS`. No new store concept.

---

## 9. File-by-file change list

**New:**
- `server/activity-log.cjs` — `logActivity`
- `server/activity-log.test.cjs`
- `src/hooks/useCollection.js`
- `src/api/collectionApi.js`
- `src/api/collectionApi.test.mjs`
- `src/screens/activityLog.jsx` — `ActivityLog` view
- `docs/verification/2026-07-09-activity-log-restart-survival.sh` + `.md`

**Modified:**
- `server/skeleton/ids.cjs` — add `'activity'` to `KINDS`
- `server/dev-server.cjs` — 3 generic collection routes; `logActivity` calls on the 9 action handlers (incl. the new `createCase` hook, which is one of the 9); convention comment
- `src/api/caseApi.js` — `ll:collection:changed {activity}` dispatch on the 9 activity-producing helpers
- `src/screens/shell.jsx` — plainly-labelled `#activity-log` nav entry in the "Plan" group
- `server/api.test.cjs` — collection routes, per-action emit, mandated no-false-positive, over-logging tests
- (app router/screen registry) — register the `#activity-log` route → `ActivityLog`
- `docs/PROGRESS_SUPPORT_WAVE_A_SCOPE.md` acceptance is satisfied by the above; the scope-note correction lives in this design doc (§0), referenced from the build report

---

## 10. Acceptance criteria (from the scope)

- [ ] `useCollection(name)` + `ll:collection:changed` + generic collection CRUD routes, modeled on `useJobs`/jobs-routes. Honest states throughout. No new storage primitive invented.
- [ ] The `activity` collection logs **confirmed** state changes at the action-level choke point, covering all listed actions incl. the new `createCase` hook.
- [ ] **MANDATED: a gate-thrown / rejected mutation writes NO activity record.**
- [ ] The record shape serves both jobseeker and coach views without a later migration — documented (§2.1) and to be restated in the build report.
- [ ] **Durability proven by a committed restart demo** — activity records survive a server restart.
- [ ] The minimal verification view reads the real collection with honest states, plainly labelled as not-the-finished-surface.
- [ ] Full suite green; fresh clone holds. Feature branch, NOT main. Do NOT merge — independent review first.
