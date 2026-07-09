# Progress Support — Wave A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the D5 generic named-collection mechanism and an append-only `activity` collection that logs *confirmed* server-side state changes, plus a minimal plainly-labelled verification view — the foundation Wave B designs the real surface against.

**Architecture:** Reuse the existing store primitive (`putRecord`/`getRecord`/`listRecords`/`removeRecord` + the durable `collection_records` table). Add generic collection CRUD routes and a `useCollection` hook generalized from the working jobs pattern. Log activity **action-level** through one `logActivity(store, event)` module, called on each handler's success path *after* the confirmed store mutation — so a rejected/gate-thrown mutation logs nothing.

**Tech Stack:** Node.js ≥ 22.9 (`node:sqlite`, `node --test`), React 19 + Vite, CommonJS on the server (`.cjs`), ESM on the client (`.js`/`.jsx`/`.mjs`).

**Spec:** [`docs/superpowers/specs/2026-07-09-progress-support-wave-a-design.md`](../specs/2026-07-09-progress-support-wave-a-design.md).

## Global Constraints

- **Branch:** `progress-support-wave-a` (off `main` @ `398c740`). **Do NOT merge; do NOT push to main.** Independent review first.
- **No new storage primitive.** A new collection is new rows under a new name — use the existing `store.putRecord`/`listRecords`/etc.
- **Emitter is action-level, on the success path AFTER the confirmed store call.** Never before (that logs an attempt). Never for bulk/seed/derived writes. This corrects the scope note's "store-level choke point" (spec §0).
- **MANDATED correctness test (must stay exactly):** a gate-thrown / rejected mutation writes **NO** activity record.
- **Honest states everywhere:** `pending | ready | failed`; empty is `ready` with `[]`, never conflated with failure.
- **App language is Swedish (sv-SE).** User-facing labels/copy in Swedish, matching existing screens.
- **Every commit message ends with:** `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- **Ship gate:** full suite green (`npm test`) and a fresh clone (`clone → npm install → npm test`) holds.

---

## File Structure

**New files**
- `server/activity-log.cjs` — `logActivity(store, event, opts?)`. The single emitter.
- `server/activity-log.test.cjs` — unit tests for `logActivity`.
- `src/api/collectionApi.js` — client CRUD for generic collections + `ll:collection:changed` dispatch.
- `src/api/collectionApi.test.mjs` — client request-shaping + dispatch tests.
- `src/hooks/useCollection.js` — generic collection hook (generalized from `useJobs`).
- `src/screens/activityLog.jsx` — `ActivityLog` minimal verification view.
- `docs/verification/2026-07-09-activity-log-restart-survival.sh` + `.md` — durability demo + report.
- `docs/verification/2026-07-09-wave-a-build-report.md` — build report (records the two-audience shape decision).

**Modified files**
- `server/skeleton/ids.cjs` — add `'activity'` to `KINDS`.
- `server/dev-server.cjs` — 3 generic collection routes + `logActivity` calls on 9 action handlers + convention comment.
- `server/api.test.cjs` — collection-route, per-action-emit, mandated no-false-positive, and over-logging tests.
- `src/api/caseApi.js` — dispatch `ll:collection:changed {name:'activity'}` on the 9 activity-producing helpers.
- `src/App.jsx` — register `#activity-log` → `ActivityLog` in `LL_ROUTES`.
- `src/components/shell.jsx` — add a plainly-labelled `activity-log` item to the "plan" nav group.

---

## Task 1: `activity` id kind + `logActivity` module

**Files:**
- Modify: `server/skeleton/ids.cjs:12-16` (add `'activity'` to `KINDS`)
- Create: `server/activity-log.cjs`
- Test: `server/activity-log.test.cjs`

**Interfaces:**
- Consumes: `mintId(kind)` from `server/skeleton/ids.cjs`; `store.putRecord(name, record)` from the store.
- Produces: `logActivity(store, { type, caseId?, label, meta?, source? }, { now?, id? }?) → record`. The returned record is `{ id, at, type, caseId, label, meta, source }`. Every later task calls `logActivity`.

- [ ] **Step 1: Add `'activity'` to the id KINDS set**

In `server/skeleton/ids.cjs`, add `'activity'` to the `KINDS` set (the line after `'job',`):

```js
const KINDS = new Set([
  'case', 'dossier', 'paragraph', 'decodedRequirement', 'gap', 'bridge', 'card',
  'question', 'prepSection', 'cvSlide', 'liveQA', 'harvestItem', 'datafact',
  'job', // job-search: a discovered/ingested job posting (lives in the `jobs` store collection, not a case)
  'activity', // progress support: one confirmed state-change record (lives in the `activity` collection)
]);
```

- [ ] **Step 2: Write the failing test** — `server/activity-log.test.cjs`

```js
'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { createStore } = require('./skeleton/store/index.cjs');
const { logActivity } = require('./activity-log.cjs');

test('logActivity appends a well-formed record to the activity collection', () => {
  const store = createStore();
  const rec = logActivity(store, { type: 'case_created', caseId: 'case_1', label: 'Ärende skapat' },
    { now: '2026-07-09T00:00:00.000Z', id: 'activity_test1' });
  assert.equal(rec.id, 'activity_test1');
  assert.equal(rec.at, '2026-07-09T00:00:00.000Z');
  assert.equal(rec.type, 'case_created');
  assert.equal(rec.caseId, 'case_1');
  assert.equal(rec.label, 'Ärende skapat');
  assert.deepEqual(rec.meta, {});
  assert.equal(rec.source, 'system');
  const rows = store.listRecords('activity');
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], rec);
});

test('logActivity is append-only — two calls make two rows', () => {
  const store = createStore();
  logActivity(store, { type: 'analysis_run', caseId: 'case_1', label: 'A' }, { id: 'a1', now: 't1' });
  logActivity(store, { type: 'analysis_run', caseId: 'case_1', label: 'B' }, { id: 'a2', now: 't2' });
  assert.equal(store.listRecords('activity').length, 2);
});

test('logActivity defaults caseId=null, mints an id, stamps an ISO time', () => {
  const store = createStore();
  const rec = logActivity(store, { type: 'job_approved', label: 'Jobb godkänt' });
  assert.equal(rec.caseId, null);
  assert.match(rec.id, /^activity_[0-9a-f]{8}$/);
  assert.match(rec.at, /^\d{4}-\d{2}-\d{2}T/);
});

test('logActivity requires type and label', () => {
  const store = createStore();
  assert.throws(() => logActivity(store, { type: 'x' }), /type and label are required/);
  assert.throws(() => logActivity(store, { label: 'y' }), /type and label are required/);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --test server/activity-log.test.cjs`
Expected: FAIL — cannot find module `./activity-log.cjs`.

- [ ] **Step 4: Write minimal implementation** — `server/activity-log.cjs`

```js
'use strict';

// Progress Support — the SINGLE activity emitter (Wave A).
//
// CONVENTION — activity logging. Every server action that produces a CONFIRMED,
// user-meaningful state change MUST call logActivity(store, {…}) on its SUCCESS
// path, AFTER the store mutation returned without throwing — never before (that
// logs an attempt), never for bulk/seed/derived writes (search results, filterSet,
// datafact seeding). Adding a new action ⇒ add a logActivity call, a row to the
// design-doc table (spec §2.3), and an emit test.
//
// This is action-level by a deliberate correction to the original scope note:
// store-level interception cannot distinguish align-vs-generate (both write
// cvDraft) or gap-fill-vs-analyze (both write fit). See the design doc §0.

const { mintId } = require('./skeleton/ids.cjs');

// Append one confirmed state-change record to the `activity` collection.
// `now`/`id` are injectable for deterministic tests. Returns the stored record.
function logActivity(store, { type, caseId = null, label, meta = {}, source = 'system' }, { now, id } = {}) {
  if (!type || !label) throw new Error('logActivity: type and label are required');
  const record = {
    id: id || mintId('activity'),
    at: now || new Date().toISOString(),
    type,
    caseId,
    label,
    meta,
    source,
  };
  return store.putRecord('activity', record); // durable via the sqlite adapter; detached; append-only
}

module.exports = { logActivity };
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test server/activity-log.test.cjs`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add server/skeleton/ids.cjs server/activity-log.cjs server/activity-log.test.cjs
git commit -m "feat(wave-a): logActivity emitter + activity id kind

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Generic collection CRUD routes (+ activity write-guard)

**Files:**
- Modify: `server/dev-server.cjs` (insert routes after the `GET /api/cases` block, ~line 114, before `POST /api/job/clear`)
- Test: `server/api.test.cjs` (append tests; reuse its existing `mockRes`/`makeReq`)

**Interfaces:**
- Consumes: `host.store.listRecords/putRecord/removeRecord`; the in-scope `sendJson`, `readJson`, `host`.
- Produces: `GET /api/collection/:name` → `{ ok, records }`; `POST /api/collection/:name` (body is the record, needs `id`) → `{ ok, record }`, **405 for `name==='activity'`**; `DELETE /api/collection/:name/:id` → `{ ok, removed }`, **405 for `name==='activity'`**.

- [ ] **Step 1: Write the failing tests** — append to `server/api.test.cjs`

```js
test('generic collection CRUD round-trips; activity rejects client writes', async () => {
  const host = createHost({});
  const handle = createApiHandler(host, {});

  // POST upsert into an arbitrary collection
  let res = mockRes();
  await handle(makeReq('POST', '/api/collection/tasks', { id: 'task_1', label: 'Do X' }), res);
  assert.equal(res._status, 200);
  assert.equal(res._body.record.id, 'task_1');

  // GET lists it
  res = mockRes();
  await handle(makeReq('GET', '/api/collection/tasks'), res);
  assert.equal(res._status, 200);
  assert.equal(res._body.records.length, 1);
  assert.equal(res._body.records[0].label, 'Do X');

  // DELETE removes it
  res = mockRes();
  await handle(makeReq('DELETE', '/api/collection/tasks/task_1'), res);
  assert.equal(res._status, 200);
  assert.equal(res._body.removed, true);

  // POST without id is a 400
  res = mockRes();
  await handle(makeReq('POST', '/api/collection/tasks', { label: 'no id' }), res);
  assert.equal(res._status, 400);

  // POST to activity is rejected (append-only, server-emitted)
  res = mockRes();
  await handle(makeReq('POST', '/api/collection/activity', { id: 'x', type: 'fake', label: 'forged' }), res);
  assert.equal(res._status, 405);
  assert.equal(host.store.listRecords('activity').length, 0);

  // DELETE on activity is rejected
  res = mockRes();
  await handle(makeReq('DELETE', '/api/collection/activity/anything'), res);
  assert.equal(res._status, 405);

  // GET activity is allowed
  res = mockRes();
  await handle(makeReq('GET', '/api/collection/activity'), res);
  assert.equal(res._status, 200);
  assert.deepEqual(res._body.records, []);
});
```

If `createHost` / `createApiHandler` / `mockRes` / `makeReq` are not already imported/defined at the top of `api.test.cjs`, they are (see its head, lines 1-28) — reuse them.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/api.test.cjs`
Expected: FAIL — collection routes 404 / return `false` (no handler), assertions fail.

- [ ] **Step 3: Implement the routes** in `server/dev-server.cjs`

Insert this block immediately after the `GET /api/cases` handler's `return true;` (~line 114), before `POST /api/job/clear`:

```js
    // Generic named-collection CRUD (D5) — the reusable surface every later collection
    // tool inherits. Mirrors the jobs routes. `activity` is append-only + server-emitted:
    // GET allowed, client POST/DELETE rejected so the log records only confirmed server
    // state changes (see server/activity-log.cjs).
    {
      const collGet = req.method === 'GET' && req.url.match(/^\/api\/collection\/([^/]+)$/);
      if (collGet) {
        sendJson(res, 200, { ok: true, records: host.store.listRecords(decodeURIComponent(collGet[1])) });
        return true;
      }
      const collPost = req.method === 'POST' && req.url.match(/^\/api\/collection\/([^/]+)$/);
      if (collPost) {
        const name = decodeURIComponent(collPost[1]);
        if (name === 'activity') { sendJson(res, 405, { ok: false, error: 'activity is append-only and server-emitted; client writes are not accepted' }); return true; }
        const body = await readJson(req);
        if (!body || !body.id) { sendJson(res, 400, { ok: false, error: 'a record with an id is required' }); return true; }
        sendJson(res, 200, { ok: true, record: host.store.putRecord(name, body) });
        return true;
      }
      const collDel = req.method === 'DELETE' && req.url.match(/^\/api\/collection\/([^/]+)\/([^/]+)$/);
      if (collDel) {
        const name = decodeURIComponent(collDel[1]);
        if (name === 'activity') { sendJson(res, 405, { ok: false, error: 'activity is append-only; deletes are not accepted' }); return true; }
        sendJson(res, 200, { ok: true, removed: host.store.removeRecord(name, decodeURIComponent(collDel[2])) });
        return true;
      }
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test server/api.test.cjs`
Expected: PASS (existing tests + the new one).

- [ ] **Step 5: Commit**

```bash
git add server/dev-server.cjs server/api.test.cjs
git commit -m "feat(wave-a): generic collection CRUD routes + activity write-guard

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: `collectionApi` client + `useCollection` hook

**Files:**
- Create: `src/api/collectionApi.js`
- Create: `src/hooks/useCollection.js`
- Test: `src/api/collectionApi.test.mjs`

**Interfaces:**
- Consumes: the collection routes from Task 2.
- Produces: `listCollection(name) → Promise<record[]>`; `upsertRecord(name, record) → Promise<record>`; `removeCollectionRecord(name, id) → Promise<{ok}>`; the `ll:collection:changed` event contract (`detail: { name }`). `useCollection(name) → { records, status, error, reload }`.

- [ ] **Step 1: Write the failing test** — `src/api/collectionApi.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert';
import { listCollection, upsertRecord, removeCollectionRecord } from './collectionApi.js';

function withMocks(run) {
  const events = [];
  const origFetch = globalThis.fetch;
  const origWindow = globalThis.window;
  globalThis.window = { dispatchEvent: (e) => events.push(e) };
  globalThis.fetch = async (url, opts) => ({
    ok: true, status: 200,
    json: async () => ({ ok: true, records: [{ id: 'r1' }], record: { id: 'r1' }, removed: true }),
    _url: url, _opts: opts,
  });
  return run(events).finally(() => { globalThis.fetch = origFetch; globalThis.window = origWindow; });
}

test('listCollection GETs the collection and returns records', async () => {
  await withMocks(async () => {
    const rows = await listCollection('activity');
    assert.deepEqual(rows, [{ id: 'r1' }]);
  });
});

test('upsertRecord POSTs and dispatches ll:collection:changed with the name', async () => {
  await withMocks(async (events) => {
    const rec = await upsertRecord('tasks', { id: 'r1' });
    assert.equal(rec.id, 'r1');
    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'll:collection:changed');
    assert.equal(events[0].detail.name, 'tasks');
  });
});

test('removeCollectionRecord DELETEs and dispatches the event', async () => {
  await withMocks(async (events) => {
    const out = await removeCollectionRecord('tasks', 'r1');
    assert.equal(out.ok, true);
    assert.equal(events[0].detail.name, 'tasks');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/api/collectionApi.test.mjs`
Expected: FAIL — cannot find module `./collectionApi.js`.

- [ ] **Step 3: Implement the client** — `src/api/collectionApi.js`

```js
// Generic named-collection client (D5). Thin same-origin fetch wrappers over the
// dev server's /api/collection routes, mirroring caseApi.js. On a successful write
// it dispatches ll:collection:changed { name } so every mounted useCollection(name)
// refetches. `activity` is read-only from the client (the server emits it).

async function request(path, opts = {}) {
  const res = await fetch(path, { headers: { 'content-type': 'application/json' }, ...opts });
  let body = null;
  try { body = await res.json(); } catch { /* non-JSON error page — fall through */ }
  if (!res.ok && res.status !== 207) throw new Error((body && body.error) || `HTTP ${res.status}`);
  return body;
}

function dispatchCollectionChanged(name) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ll:collection:changed', { detail: { name } }));
  }
}

export function listCollection(name) {
  return request(`/api/collection/${encodeURIComponent(name)}`).then((b) => b.records);
}

export function upsertRecord(name, record) {
  return request(`/api/collection/${encodeURIComponent(name)}`, { method: 'POST', body: JSON.stringify(record) })
    .then((b) => { dispatchCollectionChanged(name); return b.record; });
}

export function removeCollectionRecord(name, id) {
  return request(`/api/collection/${encodeURIComponent(name)}/${encodeURIComponent(id)}`, { method: 'DELETE' })
    .then((b) => { dispatchCollectionChanged(name); return b; });
}

export { dispatchCollectionChanged };
```

- [ ] **Step 4: Implement the hook** — `src/hooks/useCollection.js`

```js
import React from 'react';
import { listCollection } from '../api/collectionApi.js';

// useCollection — the generic client hook for any named collection. Generalized
// verbatim in shape from useJobs: honest pending/ready/failed states, empty is
// `ready` with []. Refetches on ll:collection:changed for this collection name.
export function useCollection(name) {
  const [records, setRecords] = React.useState([]);
  const [status, setStatus] = React.useState('pending'); // 'pending' | 'ready' | 'failed'
  const [error, setError] = React.useState(null);

  const reload = React.useCallback(() => {
    let live = true;
    setStatus('pending');
    setError(null);
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

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test src/api/collectionApi.test.mjs`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/api/collectionApi.js src/api/collectionApi.test.mjs src/hooks/useCollection.js
git commit -m "feat(wave-a): useCollection hook + generic collection client API

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Wire `logActivity` into the action handlers (the action → activity map)

**Files:**
- Modify: `server/dev-server.cjs` (add `require` + 9 emit calls on the handlers)
- Test: `server/api.test.cjs` (per-action emit tests)

**Interfaces:**
- Consumes: `logActivity` (Task 1); the handlers' existing success paths.
- Produces: on success, exactly one activity record per logical action, per the table below. `generate` may emit two (cv + letter); `decide` maps decision→type.

**The map (each is one `logActivity` call on the handler's success path):**

| Handler | Emit condition | type | label (sv) | meta |
|---|---|---|---|---|
| `POST /api/case` (~:96) | on success | `case_created` | `Ärende skapat: ${company} · ${role}` | `{ company, role }` |
| `POST …/research` (~:178) | after `invoke` returns | `research_run` | `Research körd` | `{ partial: !result.ok }` |
| `POST …/analyze` (~:188) | on success | `analysis_run` | `Matchanalys körd` | `{ gapsFound, fitOverall }` |
| `POST …/generate` (~:257) | per part `=== 'ready'` | `cv_generated` / `letter_generated` | `CV genererat` / `Personligt brev genererat` | `{ status: 'ready' }` |
| `POST …/gap/:id/answer` (~:206) | `out.outcome === 'accepted'` | `gap_filled` | `Lucka fylld` | `{ gapId, requirementId, datafactId }` |
| `POST …/cv/align-keyword` (~:223) | `result.outcome === 'aligned'` | `keyword_aligned` | `Nyckelord infört: ${term}` | `{ term, datafactId }` |
| `POST …/letter-draft` (~:241) | on success | `letter_draft_saved` | `Brevutkast sparat` | `{ paragraphCount, language }` |
| `POST /api/job/:id/decide` (~:135) | decision ∈ {approved,rejected,new} | `job_approved` / `job_rejected` / `job_reopened` | `Jobb ${verb}: ${title}` | `{ jobId, title, company, reason? }` |
| `POST /api/job/:id/case` (~:151) | on success | `job_linked` | `Jobb kopplat till ärende: ${title}` | `{ jobId, caseId, title }` |

- [ ] **Step 1: Write the failing tests** — append to `server/api.test.cjs`

```js
test('case_created emits one activity record with company/role meta', async () => {
  const host = createHost({});
  const handle = createApiHandler(host, {});
  const res = mockRes();
  await handle(makeReq('POST', '/api/case', { company: 'Acme', role: 'PM' }), res);
  assert.equal(res._status, 201);
  const acts = host.store.listRecords('activity');
  assert.equal(acts.length, 1);
  assert.equal(acts[0].type, 'case_created');
  assert.equal(acts[0].caseId, res._body.case.meta.id);
  assert.match(acts[0].label, /Ärende skapat: Acme · PM/);
  assert.deepEqual(acts[0].meta, { company: 'Acme', role: 'PM' });
});

test('job decide emits job_approved / job_rejected / job_reopened', async () => {
  const host = createHost({});
  const handle = createApiHandler(host, {});
  host.store.putRecord('jobs', { id: 'job_1', title: 'CMO', company: 'Acme', decision: 'new' });

  let res = mockRes();
  await handle(makeReq('POST', '/api/job/job_1/decide', { decision: 'approved' }), res);
  res = mockRes();
  await handle(makeReq('POST', '/api/job/job_1/decide', { decision: 'rejected', reason: 'location' }), res);
  res = mockRes();
  await handle(makeReq('POST', '/api/job/job_1/decide', { decision: 'new' }), res);

  const types = host.store.listRecords('activity').map((a) => a.type);
  assert.deepEqual(types, ['job_approved', 'job_rejected', 'job_reopened']);
  const rejected = host.store.listRecords('activity').find((a) => a.type === 'job_rejected');
  assert.equal(rejected.meta.reason, 'location');
  assert.equal(rejected.meta.company, 'Acme');
});

test('job link emits job_linked scoped to the case', async () => {
  const host = createHost({});
  const handle = createApiHandler(host, {});
  const c = host.store.createCase({ company: 'Acme', role: 'PM' }); // direct store call: no emit (emits live in handlers)
  host.store.putRecord('jobs', { id: 'job_1', title: 'CMO', decision: 'approved' }); // bulk upsert: no emit
  const res = mockRes();
  await handle(makeReq('POST', '/api/job/job_1/case', { caseId: c.meta.id }), res);
  const links = host.store.listRecords('activity').filter((a) => a.type === 'job_linked');
  assert.equal(links.length, 1);
  assert.equal(links[0].caseId, c.meta.id);
  assert.equal(links[0].meta.jobId, 'job_1');
});

test('letter-draft emits letter_draft_saved with paragraph count', async () => {
  const host = createHost({});
  const handle = createApiHandler(host, {});
  const c = host.store.createCase({ company: 'Acme', role: 'PM' });
  const res = mockRes();
  await handle(makeReq('POST', `/api/case/${c.meta.id}/letter-draft`,
    { language: 'sv', paragraphs: ['Para ett.', 'Para tva.'], decisions: {} }), res);
  assert.equal(res._status, 200);
  const acts = host.store.listRecords('activity').filter((a) => a.type === 'letter_draft_saved');
  assert.equal(acts.length, 1);
  assert.deepEqual(acts[0].meta, { paragraphCount: 2, language: 'sv' });
});

test('analyze emits one analysis_run with gapsFound', async () => {
  const llm = { completeJSON: async () => ({ capability: { requirements: [], overall: 'ok' }, preference: { narrative: '' }, gaps: [] }) };
  const host = createHost({ llm });
  const handle = createApiHandler(host, { llm });
  const c = host.store.createCase({ company: 'Acme', role: 'PM' });
  host.store.writePart(c.meta.id, 'decodedRole', { narrative: '', requirements: [{ id: 'decodedRequirement_1', requirement: 'X', rationale: '', weight: 1 }] });
  const res = mockRes();
  await handle(makeReq('POST', `/api/case/${c.meta.id}/analyze`), res);
  assert.equal(res._status, 200);
  const acts = host.store.listRecords('activity').filter((a) => a.type === 'analysis_run');
  assert.equal(acts.length, 1);
  assert.equal(typeof acts[0].meta.gapsFound, 'number');
});
```

> **Note on coverage (honest gap):** these tests cover the *deterministic* handlers plus `analysis_run` (llm mock). `research_run`, `cv_generated`/`letter_generated`, `gap_filled` (accepted), and `keyword_aligned` (aligned) are wired identically in Step 3 and are exercised end-to-end by the restart/E2E demo (Task 8) rather than unit-mocked, to avoid reproducing heavy submodule/LLM harnesses. The *refused/rejected* branches of align and gap-fill are covered by the mandated test (Task 5).

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/api.test.cjs`
Expected: FAIL — no `logActivity` calls yet; `activity` empty.

- [ ] **Step 3: Wire the emits** in `server/dev-server.cjs`

**3a.** At the top of the file, alongside the other requires (near `require('./skeleton/fill-gap/keyword-judge.cjs')`), add:

```js
const { logActivity } = require('./activity-log.cjs');
```

**3b.** `POST /api/case` — after `const c = host.store.createCase(...)` (~:96), before `sendJson(res, 201, ...)`:

```js
        logActivity(host.store, { type: 'case_created', caseId: c.meta.id, label: `Ärende skapat: ${company} · ${role}`, meta: { company, role } });
```

**3c.** `POST …/research` — after `const { result } = await host.invoke('researcher', { caseId });` (~:178), before its `sendJson`:

```js
        logActivity(host.store, { type: 'research_run', caseId, label: 'Research körd', meta: { partial: !result.ok } });
```

**3d.** `POST …/analyze` — after `const c = host.store.getCase(caseId);` (~:189), before its `sendJson`:

```js
        logActivity(host.store, { type: 'analysis_run', caseId, label: 'Matchanalys körd',
          meta: { gapsFound: (c.gaps.data || []).length, fitOverall: c.fit?.data?.capability?.overall ?? null } });
```

**3e.** `POST …/gap/:id/answer` — after `const out = await applyAnswer(...)` (~:206), before its `sendJson`:

```js
        if (out.outcome === 'accepted') {
          logActivity(host.store, { type: 'gap_filled', caseId, label: 'Lucka fylld',
            meta: { gapId, requirementId: body.requirementId, datafactId: out.newDatafactId } });
        }
```

**3f.** `POST …/cv/align-keyword` — after `const result = await applyAlign(...)` (~:223), before its `sendJson`:

```js
        if (result.outcome === 'aligned') {
          logActivity(host.store, { type: 'keyword_aligned', caseId, label: `Nyckelord infört: ${result.term}`,
            meta: { term: result.term, datafactId: result.datafactId } });
        }
```

**3g.** `POST …/letter-draft` — after `const part = host.store.writePart(caseId, 'coverLetterDraft', draft);` (~:241), before its `sendJson`:

```js
        logActivity(host.store, { type: 'letter_draft_saved', caseId, label: 'Brevutkast sparat',
          meta: { paragraphCount: draft.paragraphs.length, language: draft.language } });
```

**3h.** `POST …/generate` — after `out.ok = c.cvDraft.status === 'ready' && c.coverLetter.status === 'ready';` (~:258), before its `sendJson`:

```js
        if (c.cvDraft.status === 'ready') logActivity(host.store, { type: 'cv_generated', caseId, label: 'CV genererat', meta: { status: 'ready' } });
        if (c.coverLetter.status === 'ready') logActivity(host.store, { type: 'letter_generated', caseId, label: 'Personligt brev genererat', meta: { status: 'ready' } });
```

**3i.** `POST /api/job/:id/decide` — after `host.store.putRecord('jobs', updated);` (~:135), before its `sendJson`:

```js
      const DECIDE_TYPE = { approved: 'job_approved', rejected: 'job_rejected', new: 'job_reopened' };
      const DECIDE_VERB = { approved: 'godkänt', rejected: 'avvisat', new: 'återöppnat' };
      logActivity(host.store, { type: DECIDE_TYPE[decision], caseId: job.caseId || null,
        label: `Jobb ${DECIDE_VERB[decision]}: ${job.title || job.id}`,
        meta: { jobId, title: job.title || null, company: job.company || null, ...(decision === 'rejected' ? { reason: body.reason } : {}) } });
```

**3j.** `POST /api/job/:id/case` — after `host.store.putRecord('jobs', updated);` (~:151), before its `sendJson`:

```js
      logActivity(host.store, { type: 'job_linked', caseId: body.caseId,
        label: `Jobb kopplat till ärende: ${job.title || job.id}`, meta: { jobId, caseId: body.caseId, title: job.title || null } });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test server/api.test.cjs`
Expected: PASS (all, including the 5 new emit tests).

- [ ] **Step 5: Commit**

```bash
git add server/dev-server.cjs server/api.test.cjs
git commit -m "feat(wave-a): emit activity on confirmed state changes (9 action handlers)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: The mandated no-false-positive test + over-logging guard

**Files:**
- Test: `server/api.test.cjs` (append; no production code changes)

**Interfaces:**
- Consumes: the emits wired in Task 4; the writing-rules gate (bans `synergy`, `robust`, `passionate`, …); `applyAlign`'s refuse-on-no-basis-fact path (no llm needed).

- [ ] **Step 1: Write the tests** — append to `server/api.test.cjs`

```js
test('MANDATED: a gate-thrown mutation writes NO activity record', async () => {
  const host = createHost({});
  const handle = createApiHandler(host, {});
  // Create the case via the HANDLER so case_created is emitted (before = 1).
  let res = mockRes();
  await handle(makeReq('POST', '/api/case', { company: 'Acme', role: 'PM' }), res);
  const caseId = res._body.case.meta.id;
  const before = host.store.listRecords('activity').length; // 1 (case_created)

  // A letter draft containing a banned phrase ('synergy') makes writePart's gate throw.
  // The letter_draft_saved emit sits AFTER writePart, so it is never reached.
  res = mockRes();
  await assert.rejects(
    handle(makeReq('POST', `/api/case/${caseId}/letter-draft`,
      { language: 'sv', paragraphs: ['We have great synergy here.'], decisions: {} }), res),
  );
  const after = host.store.listRecords('activity');
  assert.equal(after.length, before); // unchanged — still just case_created
  assert.equal(after.filter((a) => a.type === 'letter_draft_saved').length, 0);
});

test('MANDATED: a refused keyword-align writes NO activity record', async () => {
  const host = createHost({});
  const handle = createApiHandler(host, {});
  let res = mockRes();
  await handle(makeReq('POST', '/api/case', { company: 'Acme', role: 'PM' }), res);
  const caseId = res._body.case.meta.id;
  const before = host.store.listRecords('activity').length; // 1 (case_created)

  // No supporting datafact => applyAlign refuses BEFORE any writePart (no llm needed).
  res = mockRes();
  await handle(makeReq('POST', `/api/case/${caseId}/cv/align-keyword`,
    { term: 'WMS', basisDatafactId: 'datafact_missing' }), res);
  assert.equal(res._body.ok, false); // refused
  const after = host.store.listRecords('activity');
  assert.equal(after.length, before); // unchanged
  assert.equal(after.filter((a) => a.type === 'keyword_aligned').length, 0);
});

test('over-logging guard: datafact ingest + bulk job/filterSet upserts emit NO activity', async () => {
  const host = createHost({});
  // These are exactly the non-action writes (seeding, job-search bulk, filter set).
  // None go through logActivity (which lives only in action handlers), so none log.
  host.store.ingestDatafact({ id: 'datafact_x', kind: 'datafact', type: 'cv', text: 'Some CV text.', tags: [], language: 'sv' });
  host.store.putRecord('jobs', { id: 'job_a', decision: 'new' });
  host.store.putRecord('jobs', { id: 'job_b', decision: 'new' });
  host.store.putRecord('filterSet', { id: 'filterSet', searchTerms: [] });

  assert.equal(host.store.listRecords('activity').length, 0);
});
```

- [ ] **Step 2: Run to verify they pass** (Task 4 already makes them green — these guard the invariant against regressions)

Run: `node --test server/api.test.cjs`
Expected: PASS. If the gate-throw test fails to reject, verify the banned phrase (`synergy`) is still in `server/skeleton/writing-rules/rules.cjs`; if the over-logging test fails, a noise source is emitting — find and remove that `logActivity` call.

- [ ] **Step 3: Commit**

```bash
git add server/api.test.cjs
git commit -m "test(wave-a): mandated no-false-positive + over-logging guards

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Live-update wiring — dispatch `ll:collection:changed` from the action helpers

**Files:**
- Modify: `src/api/caseApi.js` (add one dispatch line to 9 helpers)

**Interfaces:**
- Consumes: the `ll:collection:changed` contract from Task 3.
- Produces: after each activity-producing action succeeds, the client dispatches `ll:collection:changed { name: 'activity' }` so a mounted `useCollection('activity')` refetches.

- [ ] **Step 1: Add a shared dispatch helper** near the top of `src/api/caseApi.js` (after the `request` function):

```js
// After an action that the server logs to the activity collection, tell any mounted
// useCollection('activity') to refetch. One generic event; see collectionApi.js.
function notifyActivityChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ll:collection:changed', { detail: { name: 'activity' } }));
  }
}
```

- [ ] **Step 2: Call it on the 9 activity-producing helpers.** In each `.then(...)`, add `notifyActivityChanged();` alongside the existing dispatch/return. Exact edits:

- `createCase` (~:26): `.then((b) => b.case)` → `.then((b) => { notifyActivityChanged(); return b.case; })`
- `research` (~:43): `return request(...)` → `return request(...).then((b) => { notifyActivityChanged(); return b; })`
- `analyze` (~:48): same pattern as `research`
- `generate` (~:53): same pattern as `research`
- `answerGap` (~:59): same pattern as `research`
- `decideJob` (~:84): inside the existing `.then`, add `notifyActivityChanged();` after the `ll:jobs:changed` dispatch
- `linkJobCase` (~:115): inside the existing `.then`, add `notifyActivityChanged();` after the `ll:jobs:changed` dispatch
- `saveCoverLetterDraft` (~:104): inside the existing `.then`, add `notifyActivityChanged();` after the `ll:case:changed` dispatch
- `alignKeyword` (~:128): inside the existing `.then`, add `if (b.ok) notifyActivityChanged();` next to the existing `b.ok` guard

- [ ] **Step 3: Verify the suite still passes** (these helpers have no dedicated test; the guard is that nothing else breaks)

Run: `npm test`
Expected: PASS (no regressions).

- [ ] **Step 4: Commit**

```bash
git add src/api/caseApi.js
git commit -m "feat(wave-a): dispatch ll:collection:changed{activity} on logged actions

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: The minimal verification view (`ActivityLog`) + route + nav

**Files:**
- Create: `src/screens/activityLog.jsx`
- Modify: `src/App.jsx` (import + `LL_ROUTES['activity-log']`)
- Modify: `src/components/shell.jsx` (nav item in the "plan" group)

**Interfaces:**
- Consumes: `useCollection('activity')` (Task 3); `Sidebar` (from `../components/shell.jsx`), `ToolHeader` (from `./cvActivity.jsx`), `Icon` (from `../components/primitives.jsx`).
- Produces: the `ActivityLog` component; reachable at `#activity-log`.

- [ ] **Step 1: Create the view** — `src/screens/activityLog.jsx`

```jsx
import React from 'react';
import { Icon } from '../components/primitives.jsx';
import { Sidebar } from '../components/shell.jsx';
import { ToolHeader } from './cvActivity.jsx';
import { useCollection } from '../hooks/useCollection.js';

// Presentation is VIEW-SIDE, keyed by `type` — never stored on the record. This is
// what lets a later coach view render the SAME collection with no migration (spec §2.1).
const TYPE_PRESENTATION = {
  case_created:       { ic: 'briefcase', tint: 'ic-blue' },
  research_run:       { ic: 'search',    tint: 'ic-blue' },
  analysis_run:       { ic: 'target',    tint: 'ic-green' },
  cv_generated:       { ic: 'cv',        tint: 'ic-blue' },
  letter_generated:   { ic: 'letter',    tint: 'ic-lilac' },
  gap_filled:         { ic: 'bulb',      tint: 'ic-amber' },
  letter_draft_saved: { ic: 'letter',    tint: 'ic-lilac' },
  keyword_aligned:    { ic: 'sparkle',   tint: 'ic-green' },
  job_approved:       { ic: 'briefcase', tint: 'ic-green' },
  job_rejected:       { ic: 'briefcase', tint: 'ic-coral' },
  job_reopened:       { ic: 'briefcase', tint: 'ic-amber' },
  job_linked:         { ic: 'target',    tint: 'ic-blue' },
};
const FALLBACK = { ic: 'target', tint: 'ic-blue' };

function detailLine(r) {
  const m = r.meta || {};
  switch (r.type) {
    case 'case_created':       return `${m.company ?? ''} · ${m.role ?? ''}`;
    case 'analysis_run':       return `${m.gapsFound ?? 0} luckor`;
    case 'keyword_aligned':    return `Term: ${m.term ?? ''}`;
    case 'letter_draft_saved': return `${m.paragraphCount ?? 0} stycken`;
    case 'research_run':       return m.partial ? 'Delvis (avkodaren misslyckades)' : '';
    case 'job_rejected':       return `${m.company ?? ''}${m.reason ? ` — ${m.reason}` : ''}`;
    case 'job_approved':
    case 'job_reopened':
    case 'job_linked':         return `${m.company ?? m.title ?? ''}`;
    default:                   return '';
  }
}

function ActivityLog() {
  const { records, status, error } = useCollection('activity');
  const rows = [...records].sort((a, b) => new Date(b.at) - new Date(a.at));
  return (
    <div className="ll app app--warm" data-screen-label="Aktivitetslogg (verifiering)">
      <Sidebar active="activity-log" />
      <div className="main">
        <ToolHeader title="Aktivitetslogg (verifiering)" />
        <div className="content content--narrow" style={{ paddingTop: 18, maxWidth: 820, margin: '0 auto', width: '100%' }}>
          <div className="card card--pad" style={{ marginBottom: 16, borderLeft: '3px solid var(--ll-amber)' }}>
            <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>
              Verifieringsvy — en rå kronologisk lista över den riktiga aktivitetsloggen.
              Detta är <b>inte</b> den färdiga Min aktivitet-vyn (den designas i Wave B).
            </p>
          </div>

          {status === 'pending' && <p className="muted">Hämtar aktivitet…</p>}

          {status === 'failed' && (
            <div className="feedbackline">
              <Icon name="lock" size={18} style={{ color: 'var(--ll-coral)' }} />
              Kunde inte hämta aktiviteten: {error?.message || String(error)}
            </div>
          )}

          {status === 'ready' && rows.length === 0 && (
            <div className="card card--pad" style={{ textAlign: 'center' }}>
              <Icon name="target" size={26} />
              <h3 style={{ marginTop: 8 }}>Ingen aktivitet än</h3>
              <p className="muted" style={{ marginTop: 6 }}>
                Loggen fylls på när du kör verktygen — varje bekräftad åtgärd loggas automatiskt server-side.
              </p>
            </div>
          )}

          {status === 'ready' && rows.length > 0 && (
            <div className="atimeline">
              {rows.map((r) => {
                const p = TYPE_PRESENTATION[r.type] || FALLBACK;
                const detail = detailLine(r);
                return (
                  <div className="aitem" key={r.id}>
                    <div className="aitem__rail"><div className={`aitem__ic ${p.tint}`}><Icon name={p.ic} size={20} /></div></div>
                    <div className="aitem__card">
                      <div className="aitem__top">
                        <span className="aitem__t">{r.label}</span>
                        <span className="aitem__time">{new Date(r.at).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      {detail && <p className="aitem__m">{detail}</p>}
                      <div style={{ marginTop: 10 }}>
                        <span className="aitem__auto"><Icon name="sparkle" size={12} />{r.source === 'system' ? 'Loggades automatiskt' : 'Manuell'}</span>
                        <span className="cap" style={{ marginLeft: 8, opacity: 0.6 }}>{r.type}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { ActivityLog };
```

- [ ] **Step 2: Register the route** in `src/App.jsx`. Add the import after the `cvActivity` import (line 5):

```js
import { ActivityLog } from './screens/activityLog.jsx';
```

Add to `LL_ROUTES` (after the `activity:` entry, ~line 25):

```js
  'activity-log': { c: () => <ActivityLog />, title: 'Aktivitetslogg (verifiering)' },
```

- [ ] **Step 3: Add the nav item** in `src/components/shell.jsx`. In `NAV_GROUPS`, inside the `plan` group's `items`, right after the `activity` item (~line 12):

```js
    { id:'activity-log',   label:'Aktivitetslogg (verifiering)' },
```

- [ ] **Step 4: Verify the build resolves** (no DOM unit test for the view; the build + route resolution is the check)

Run: `npm run build`
Expected: build succeeds (Vite bundles `activityLog.jsx` and its imports with no unresolved-module or syntax errors).

- [ ] **Step 5: Commit**

```bash
git add src/screens/activityLog.jsx src/App.jsx src/components/shell.jsx
git commit -m "feat(wave-a): minimal activity-log verification view + route + nav

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Durability restart demo + build report + ship verification

**Files:**
- Create: `docs/verification/2026-07-09-activity-log-restart-survival.sh`
- Create: `docs/verification/2026-07-09-activity-log-restart-survival.md`
- Create: `docs/verification/2026-07-09-wave-a-build-report.md`

**Interfaces:**
- Consumes: `POST /api/case` (emits `case_created`), `POST /api/case/:id/letter-draft` (emits `letter_draft_saved`), `GET /api/collection/activity` — all no-LLM.

- [ ] **Step 1: Create the restart demo script** — `docs/verification/2026-07-09-activity-log-restart-survival.sh`

```bash
#!/usr/bin/env bash
# Durability demo — activity records survive a full server restart.
# Proves: confirmed state changes (case_created, letter_draft_saved) are logged to
# the `activity` collection in SQLite and survive a server kill-and-restart, no wipe.

set -euo pipefail
WORKTREE="$(cd "$(dirname "$0")/../.." && pwd)"
PORT=5293
BASE="http://127.0.0.1:$PORT"
DB="$WORKTREE/server/data/store-activity-demo.db"

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]]; then kill "$SERVER_PID" 2>/dev/null || true; wait "$SERVER_PID" 2>/dev/null || true; fi
  rm -f "$DB" "${DB}-wal" "${DB}-shm"
}
trap cleanup EXIT

start_server() {
  STORE_PATH="$DB" PORT=$PORT node "$WORKTREE/server/dev-server.cjs" > /tmp/activity-demo-server.log 2>&1 &
  SERVER_PID=$!
  curl -s --retry 40 --retry-delay 1 --retry-connrefused "$BASE/api/health" > /dev/null
}

echo "=== DEMO: activity log survives server restart ==="
rm -f "$DB" "${DB}-wal" "${DB}-shm"

echo "[1] start server (fresh db)"; start_server

echo "[2] create a case (logs case_created)"
CASE_ID=$(curl -s -X POST "$BASE/api/case" -H 'content-type: application/json' \
  -d '{"company":"BettingCo","role":"Head of Acquisition"}' | jq -r '.case.meta.id')
echo "    caseId=$CASE_ID"

echo "[3] save a letter draft (logs letter_draft_saved)"
curl -s -X POST "$BASE/api/case/$CASE_ID/letter-draft" -H 'content-type: application/json' \
  -d '{"language":"sv","paragraphs":["Stycke ett.","Stycke tva."],"decisions":{}}' > /dev/null

BEFORE=$(curl -s "$BASE/api/collection/activity" | jq '.records | length')
echo "    activity records before restart: $BEFORE"
if [[ "$BEFORE" != "2" ]]; then echo "FAIL: expected 2 activity records, got $BEFORE"; exit 1; fi

echo "[4] kill server"
kill "$SERVER_PID"; wait "$SERVER_PID" 2>/dev/null || true; SERVER_PID=""

echo "[5] restart server on the SAME db"; start_server

AFTER=$(curl -s "$BASE/api/collection/activity" | jq '.records | length')
TYPES=$(curl -s "$BASE/api/collection/activity" | jq -r '[.records[].type] | sort | join(",")')
echo "    activity records after restart: $AFTER ($TYPES)"
if [[ "$AFTER" != "2" ]]; then echo "FAIL: activity did not survive restart ($AFTER)"; exit 1; fi
if [[ "$TYPES" != "case_created,letter_draft_saved" ]]; then echo "FAIL: unexpected types after restart: $TYPES"; exit 1; fi

echo
echo "PASS ✓ — activity records survived the restart with identical types."
```

- [ ] **Step 2: Run the demo** (requires `jq`)

Run: `chmod +x docs/verification/2026-07-09-activity-log-restart-survival.sh && ./docs/verification/2026-07-09-activity-log-restart-survival.sh`
Expected: ends with `PASS ✓ — activity records survived the restart with identical types.`

- [ ] **Step 3: Write the demo report** — `docs/verification/2026-07-09-activity-log-restart-survival.md`

Record: the command run, the captured output (before=2, after=2, types `case_created,letter_draft_saved`), and the conclusion that `store.putRecord('activity', …)` persists through the sqlite adapter's `collection_records` table and rehydrates on boot. Mirror the structure of `2026-07-07-letter-save-resume-restart.md`.

- [ ] **Step 4: Write the build report** — `docs/verification/2026-07-09-wave-a-build-report.md`

Must document (acceptance requirement): **the activity record shape serves both jobseeker and coach views without a migration.** State the shape (`{ id, at, type, caseId, label, meta, source }`), that presentation (icon/tint/detail) is view-side keyed by `type`, and that the coach `Ärendevy` will read the same collection filtered by `caseId`. Also record the scope-note correction (action-level emit; spec §0) and the mandated-test result.

- [ ] **Step 5: Full-suite + fresh-clone verification**

Run: `npm test`
Expected: entire suite green.

Then a fresh-clone check (adjust the temp path as needed):
```bash
TMP=$(mktemp -d) && git clone -b progress-support-wave-a "$WORKTREE" "$TMP/clone" && cd "$TMP/clone" && npm install && npm test
```
Expected: green from a clean checkout. (Note: this clones the local branch; it does not push.)

- [ ] **Step 6: Commit**

```bash
git add docs/verification/2026-07-09-activity-log-restart-survival.sh docs/verification/2026-07-09-activity-log-restart-survival.md docs/verification/2026-07-09-wave-a-build-report.md
git commit -m "docs(wave-a): activity-log restart-survival demo + build report

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Final state

At the end of Task 8: on branch `progress-support-wave-a`, full suite green, restart demo passing, **not merged, not pushed** — ready for independent review. `RESUME.md` should be refreshed to point here (and to close the `presend-fitcheck` cleanup already done this session).

## Post-plan self-review

- **Spec coverage:** Part 1 (D5) → Tasks 2+3; Part 2 (activity + honest logging) → Tasks 1+4; the two-audience shape → Task 1 record + Task 8 build report; mandated test → Task 5; Part 3 (verification view) → Task 7; event propagation → Tasks 3+6; durability → Task 8; out-of-scope items → untouched. All spec sections map to a task.
- **Placeholder scan:** every code step contains real code; the one acknowledged coverage gap (LLM-heavy emits) is stated explicitly in Task 4 with the mitigation (demo + convention), not hidden.
- **Type consistency:** `logActivity(store, {type,caseId,label,meta,source}, {now,id})` is defined in Task 1 and called with that exact shape in Tasks 4/5; `useCollection`/`listCollection`/`upsertRecord`/`removeCollectionRecord` names match across Tasks 3/6/7; `ll:collection:changed { detail:{ name } }` is consistent in Tasks 3/6/7; route paths `/api/collection/:name[/:id]` match across Tasks 2/3/8.
