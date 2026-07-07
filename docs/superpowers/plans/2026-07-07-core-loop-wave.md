# Core-Loop Wave Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Matchanalys + CV-byggaren + Personligt brev as three template screens bound to the real case parts, with durable cover-letter save-and-resume and a durable Matchanalys decision-unification seam.

**Architecture:** Restyle three already-wired screens from the design package (`design/design/*`) onto the `grid.jsx` templates. A shared foundation (real `PartGate`, `i18n` shim, `caseData→parts` selector) replaces the design's fixture bridge. Two new backend routes add a durable `coverLetterDraft` part and a durable job→case link. Backend is TDD; React screens are ported + wired (no DOM harness) and verified by logic tests + a manual E2E incl. restart-survival.

**Tech Stack:** React 18 + Vite (frontend), hand-rolled `node:http` dev server (`server/dev-server.cjs`), durable SQLite store, `node --test` (backend `server/**/*.test.cjs`, ESM logic `src/**/*.test.mjs`).

**Spec:** `docs/superpowers/specs/2026-07-07-core-loop-wave-design.md` (read it first).

## Global Constraints

- **Branch:** all work on `core-loop-wave` (worktree). **No merge, no deploy** — independent review first.
- **Backend rule:** files under `server/` use `host.store` for all persistence; no direct DB. Skeleton submodules import only `node:` builtins (not relevant to routes, but honor it).
- **Design system:** only `docs/DESIGN_SYSTEM.md` tokens/components. No hardcoded hex/px in screens — everything routes through a token.
- **Persona:** Daniel Oskarsson (iGaming/marketing). **No Amir, no demobar** on these real screens.
- **Honest states:** every part-bound region renders pending/ready/failed/absent via `PartGate`.
- **i18n:** default `sv`, `en` additive via `tr({sv,en})`; generated CV/letter artifacts are English-only for MVP, surfaced honestly ("svenska kommer") — never hidden.
- **Save-and-resume:** durable (SQLite), keyed to the case; decisions keyed by **claim text**.
- **Tests:** new logic → `src/**/*.test.mjs`; backend routes → `server/api.test.cjs`. Full `npm test` green. **Fresh-clone condition holds** (`npm ci` clean, no sibling-repo/worktree deps).
- **Design source is the base:** port from `design/design/screens-*.jsx`; keep markup, swap the fixture bridge for the real path. Diff the port against the source to prove markup fidelity.

---

## Task 0: Worktree setup (execution-time)

**Files:** none (git plumbing).

- [ ] **Step 1:** Create the worktree via the `superpowers:using-git-worktrees` skill, branch `core-loop-wave` off `main`. All subsequent tasks run inside that worktree.
- [ ] **Step 2:** Confirm baseline: `npm ci` clean, `npm test` green (172/1-skip or 173/0 depending on `cv_data.json` presence), `/api/health` → `durable:true` after `npm run dev`.

---

## Task 1: Add `coverLetterDraft` to the case parts contract

**Files:**
- Modify: `server/skeleton/contract/case.cjs` (the `PARTS` array)
- Test: `server/skeleton/contract/case.test.cjs` (create if absent) OR extend `server/api.test.cjs`

**Interfaces:**
- Produces: a new part `coverLetterDraft` present on every case, `status:'absent'` until written.

- [ ] **Step 1: Write the failing test** — a new case exposes `coverLetterDraft` absent.

```js
// server/api.test.cjs — add within the existing suite (mirror the createHost pattern already in the file)
test('a new case exposes coverLetterDraft as an absent part', () => {
  const host = createHost();
  const c = host.store.createCase({ company: 'Acme', role: 'CMO' });
  assert.equal(c.coverLetterDraft.status, 'absent');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test server/api.test.cjs`
Expected: FAIL — `Cannot read properties of undefined (reading 'status')` (part not in contract).

- [ ] **Step 3: Add the part** — in `server/skeleton/contract/case.cjs`, add `'coverLetterDraft'` to the `PARTS` array (place it immediately after `'coverLetter'`).

```js
const PARTS = ['dossiers', 'decodedRole', 'fit', 'gaps', 'cvDraft', 'coverLetter', 'coverLetterDraft', 'prep', 'cards', 'liveLog', 'postMortem'];
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test server/api.test.cjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/skeleton/contract/case.cjs server/api.test.cjs
git commit -m "feat(case): add coverLetterDraft part to the contract"
```

---

## Task 2: `POST /api/case/:id/letter-draft` route (durable save)

**Files:**
- Modify: `server/dev-server.cjs` (add route; mirror the existing `POST /api/case/:id/generate` handler shape)
- Test: `server/api.test.cjs`

**Interfaces:**
- Consumes: `host.store.writePart(caseId, 'coverLetterDraft', data)`, `host.store.getCase(caseId)`.
- Produces: route `POST /api/case/:id/letter-draft` with body `{ language, paragraphs:[string], decisions:{[claimText]:'keep'|'soften'|'cut'} }` → writes the part, returns `{ ok:true, part }`. The part is then visible via `GET /api/case/:id`.

- [ ] **Step 1: Write the failing test** — save a draft, read it back via GET case, confirm it round-trips through the store.

```js
test('POST /api/case/:id/letter-draft writes a durable coverLetterDraft, readable via GET case', async () => {
  const host = createHost();
  const c = host.store.createCase({ company: 'Acme', role: 'CMO' });
  const body = { language: 'en', paragraphs: ['p1', 'p2'], decisions: { 'overclaim X': 'soften' } };
  const res = mockRes();
  await handleRequest(host, makeReq('POST', `/api/case/${c.meta.id}/letter-draft`, body), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.jsonBody.ok, true);
  assert.equal(res.jsonBody.part.status, 'ready');
  // durable round-trip: re-read straight from the store
  const reread = host.store.getCase(c.meta.id);
  assert.deepEqual(reread.coverLetterDraft.data.paragraphs, ['p1', 'p2']);
  assert.equal(reread.coverLetterDraft.data.decisions['overclaim X'], 'soften');
});
```

*(Note: mirror the exact test harness the file already uses — `createHost`, `mockRes`, `makeReq`, and the request dispatcher. Read `server/api.test.cjs` and reuse its existing helpers verbatim; the names above are illustrative — match the file.)*

- [ ] **Step 2: Run to verify it fails**

Run: `node --test server/api.test.cjs`
Expected: FAIL — 404 (route not defined) → assertion on `res.statusCode` fails.

- [ ] **Step 3: Add the route** — in `server/dev-server.cjs`, alongside the other `POST /api/case/:id/...` handlers (e.g. next to `/generate`). Match the file's real `sendJson`/`readJson` helpers and its case-id extraction.

```js
// inside the case-route block, after the /generate handler
if (method === 'POST' && (m = pathname.match(/^\/api\/case\/([^/]+)\/letter-draft$/))) {
  const caseId = decodeURIComponent(m[1]);
  const existing = host.store.getCase(caseId);
  if (!existing) return sendJson(res, 404, { ok: false, error: 'case not found' });
  const body = await readJson(req);
  const draft = {
    language: body.language || 'en',
    paragraphs: Array.isArray(body.paragraphs) ? body.paragraphs : [],
    decisions: (body.decisions && typeof body.decisions === 'object') ? body.decisions : {},
    editedAt: new Date().toISOString(),
  };
  const part = host.store.writePart(caseId, 'coverLetterDraft', draft);
  return sendJson(res, 200, { ok: true, part });
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test server/api.test.cjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/dev-server.cjs server/api.test.cjs
git commit -m "feat(api): POST /api/case/:id/letter-draft — durable cover-letter draft"
```

---

## Task 3: `POST /api/job/:id/case` route (durable job→case link)

**Files:**
- Modify: `server/dev-server.cjs` — **place ABOVE the `/api/case/:id` regex guard**, next to `POST /api/job/:jobId/decide` (the decide route already sits above the case guard for exactly this reason — a job route must not be shadowed by the case matcher).
- Test: `server/api.test.cjs`

**Interfaces:**
- Consumes: `host.store.getRecord('jobs', jobId)`, `host.store.putRecord('jobs', record)`.
- Produces: route `POST /api/job/:id/case` body `{ caseId }` → upserts `caseId` onto the durable job record, returns `{ ok:true, job }`. Idempotent (re-linking the same caseId is a no-op success).

- [ ] **Step 1: Write the failing test**

```js
test('POST /api/job/:id/case links a caseId onto the durable job record (idempotent)', async () => {
  const host = createHost();
  host.store.putRecord('jobs', { id: 'job_x', externalId: 'e1', title: 'Head of Acq', company: 'BettingJobs', decision: 'approved' });
  const res1 = mockRes();
  await handleRequest(host, makeReq('POST', '/api/job/job_x/case', { caseId: 'case_1' }), res1);
  assert.equal(res1.statusCode, 200);
  assert.equal(res1.jsonBody.job.caseId, 'case_1');
  // durable + idempotent
  assert.equal(host.store.getRecord('jobs', 'job_x').caseId, 'case_1');
  const res2 = mockRes();
  await handleRequest(host, makeReq('POST', '/api/job/job_x/case', { caseId: 'case_1' }), res2);
  assert.equal(res2.jsonBody.job.caseId, 'case_1'); // unchanged, still 200
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test server/api.test.cjs`
Expected: FAIL — 404 (route not defined).

- [ ] **Step 3: Add the route** — ABOVE the `/api/case/:id` guard, next to the decide route.

```js
if (method === 'POST' && (m = pathname.match(/^\/api\/job\/([^/]+)\/case$/))) {
  const jobId = decodeURIComponent(m[1]);
  const job = host.store.getRecord('jobs', jobId);
  if (!job) return sendJson(res, 404, { ok: false, error: 'job not found' });
  const body = await readJson(req);
  if (!body.caseId) return sendJson(res, 400, { ok: false, error: 'caseId required' });
  const updated = { ...job, caseId: body.caseId };
  host.store.putRecord('jobs', updated);
  return sendJson(res, 200, { ok: true, job: updated });
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test server/api.test.cjs`
Expected: PASS.

- [ ] **Step 5: Verify no route shadowing** — add a regression assertion that `POST /api/job/job_x/case` does NOT hit the case handler (the decide-route ordering test pattern already in the file). Confirm `GET /api/case/:id` still works.

Run: `node --test server/api.test.cjs`
Expected: PASS (all).

- [ ] **Step 6: Commit**

```bash
git add server/dev-server.cjs server/api.test.cjs
git commit -m "feat(api): POST /api/job/:id/case — durable job→case link (above case guard)"
```

---

## Task 4: `letterDraft.mjs` — claim-keyed decision logic (pure)

**Files:**
- Create: `src/lib/letterDraft.mjs`
- Test: `src/lib/letterDraft.test.mjs`

**Interfaces:**
- Produces:
  - `remapDecisions(oldDecisions: {[claim]:choice}, newClaims: string[]) → {[claim]:choice}` — keeps decisions whose claim text is still present, drops stale keys, leaves new claims unset.
  - `seedEditor(draft, coverLetter) → { paragraphs: string[], decisions: {[claim]:choice}, source:'draft'|'letter' }` — if `draft` present use its paragraphs + remapped decisions against the live letter's claims; else seed paragraphs from `coverLetter.paragraphs` with empty decisions.
  - `unresolvedCount(claims: string[], decisions) → number`.

- [ ] **Step 1: Write the failing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { remapDecisions, seedEditor, unresolvedCount } from './letterDraft.mjs';

test('remapDecisions keeps matching claims, drops stale, leaves new unset', () => {
  const old = { 'claim A': 'keep', 'claim B': 'cut' };
  const out = remapDecisions(old, ['claim A', 'claim C']);
  assert.deepEqual(out, { 'claim A': 'keep' }); // B dropped (gone), C unset
});

test('seedEditor prefers the draft when present, remapping decisions to live claims', () => {
  const draft = { paragraphs: ['d1'], decisions: { 'x': 'soften', 'gone': 'cut' } };
  const letter = { paragraphs: ['l1'], unsupported_by_cv: ['x', 'y'] };
  const out = seedEditor(draft, letter);
  assert.equal(out.source, 'draft');
  assert.deepEqual(out.paragraphs, ['d1']);
  assert.deepEqual(out.decisions, { 'x': 'soften' }); // 'gone' dropped, 'y' unset
});

test('seedEditor falls back to the letter when no draft', () => {
  const letter = { paragraphs: ['l1', 'l2'], unsupported_by_cv: ['x'] };
  const out = seedEditor(null, letter);
  assert.equal(out.source, 'letter');
  assert.deepEqual(out.paragraphs, ['l1', 'l2']);
  assert.deepEqual(out.decisions, {});
});

test('unresolvedCount counts claims with no decision', () => {
  assert.equal(unresolvedCount(['x', 'y', 'z'], { 'x': 'keep' }), 2);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test src/lib/letterDraft.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```js
// src/lib/letterDraft.mjs — pure, no React/DOM/fetch
export function remapDecisions(oldDecisions = {}, newClaims = []) {
  const keep = {};
  for (const claim of newClaims) {
    if (oldDecisions[claim]) keep[claim] = oldDecisions[claim];
  }
  return keep;
}

export function seedEditor(draft, coverLetter) {
  const claims = (coverLetter && coverLetter.unsupported_by_cv) || [];
  if (draft && Array.isArray(draft.paragraphs)) {
    return {
      paragraphs: draft.paragraphs.slice(),
      decisions: remapDecisions(draft.decisions || {}, claims),
      source: 'draft',
    };
  }
  return {
    paragraphs: ((coverLetter && coverLetter.paragraphs) || []).slice(),
    decisions: {},
    source: 'letter',
  };
}

export function unresolvedCount(claims = [], decisions = {}) {
  return claims.filter((c) => !decisions[c]).length;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test src/lib/letterDraft.test.mjs`
Expected: PASS (4).

- [ ] **Step 5: Commit**

```bash
git add src/lib/letterDraft.mjs src/lib/letterDraft.test.mjs
git commit -m "feat(letter): claim-keyed draft decision logic (remap/seed/unresolved)"
```

---

## Task 5: `casePartsView` selector + `caseMetaView`/`profile` identity adapter (pure)

**Files:**
- Create: `src/hooks/casePartsView.js`
- Create: `src/lib/profile.js` (single person-identity source — Daniel's real name/headline/contact; the user's OWN identity per §6 persona, not fabricated content; `owner:'self'`)
- Create: `src/hooks/caseMetaView.js` (real-meta → design-meta adapter)
- Test: `src/hooks/casePartsView.test.mjs`, `src/hooks/caseMetaView.test.mjs`

**Why this task carries the identity adapter:** the design screens read `meta.person`/`meta.jobTitle`/`meta.location`/`meta.employment`/`meta.logo`, but the real case `meta` only has `company`/`role`/`owner`/… (verified). Without an adapter the CV paper header, letter signature, and ctxbar render `undefined`. This is the **`meta.person` identity source** the spec §Identity + datafact resolution requires — resolved frontend-only, nothing fabricated.

**Interfaces:**
- Produces: `casePartsView(caseData) → { meta, _pool, statusOf(part), dataOf(part), fit, gaps, cvDraft, coverLetter, coverLetterDraft, decodedRole }` where `fit`/`gaps`/etc. are the `.data` payloads (or `null` if not ready), and `statusOf(part)` returns the envelope status. Lets a ported design screen read `parts.fit` (data) and gate on `parts.statusOf('fit')` without touching envelope internals. **`_pool` is `[]` this wave** (the case GET does not expose datafacts) — so `resolveDatafact` degrades to the honest generic chip; do NOT treat empty-pool as "all citations unresolvable" alarms.
- Produces: `caseMetaView(caseData, job?) → { company, jobTitle, location, employment?, logo, url, person, companyNote? }` — `jobTitle←meta.role`, `company←meta.company`, `logo←company initials`, `location`/`url`←the linked `job` record when passed, `person←profile`. **Unknown fields (e.g. `employment`) are omitted, never invented.**
- Produces: `profile` (default export of `src/lib/profile.js`) — `{ name, headline, contact }` for the current single user.

- [ ] **Step 1: Write the failing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { casePartsView } from './casePartsView.js';

const CASE = {
  meta: { id: 'c1', company: 'BettingJobs', role: 'Head of Acquisition' },
  fit: { status: 'ready', data: { score: 72, capability: { overall: 'ok', requirements: [] } } },
  gaps: { status: 'pending' },
  coverLetter: { status: 'absent' },
};

test('dataOf returns the payload for ready parts, null otherwise', () => {
  const p = casePartsView(CASE);
  assert.equal(p.fit.score, 72);
  assert.equal(p.gaps, null);       // pending → no data
  assert.equal(p.coverLetter, null); // absent → no data
});

test('statusOf returns the envelope status, "absent" when missing', () => {
  const p = casePartsView(CASE);
  assert.equal(p.statusOf('fit'), 'ready');
  assert.equal(p.statusOf('gaps'), 'pending');
  assert.equal(p.statusOf('coverLetterDraft'), 'absent'); // not on this case
});

test('null caseData yields an all-absent view (no throw)', () => {
  const p = casePartsView(null);
  assert.equal(p.statusOf('fit'), 'absent');
  assert.equal(p.fit, null);
  assert.equal(p.meta, null);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test src/hooks/casePartsView.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```js
// src/hooks/casePartsView.js
const DATA_PARTS = ['decodedRole', 'fit', 'gaps', 'cvDraft', 'coverLetter', 'coverLetterDraft'];

export function casePartsView(caseData) {
  const statusOf = (part) => (caseData && caseData[part] && caseData[part].status) || 'absent';
  const dataOf = (part) => (statusOf(part) === 'ready' && caseData[part].data) || null;
  const view = {
    meta: (caseData && caseData.meta) || null,
    _pool: (caseData && caseData._pool) || [],
    statusOf,
    dataOf,
  };
  for (const part of DATA_PARTS) view[part] = dataOf(part);
  return view;
}
```

- [ ] **Step 3b: Implement `profile.js` + `caseMetaView.js` (identity adapter) — test-first**

Write the failing test (`src/hooks/caseMetaView.test.mjs`): `jobTitle←role`, `company←company`, `person←profile`, `location←job.location` when a job is passed, and **`employment` absent when unknown** (asserts the field is `undefined`, not a fabricated string). Then implement:

```js
// src/lib/profile.js — the single person-identity source (single-user MVP; the user's own identity, not content)
const profile = { name: 'Daniel Oskarsson', headline: 'iGaming growth and marketing leader', contact: 'Stockholm · daniel.oskarsson@…' };
export default profile;

// src/hooks/caseMetaView.js
import profile from '../lib/profile.js';
export function caseMetaView(caseData, job) {
  const meta = (caseData && caseData.meta) || {};
  const company = meta.company || (job && job.company) || null;
  return {
    company,
    jobTitle: meta.role || (job && job.title) || null,
    logo: company ? company.slice(0, 2).toUpperCase() : null,
    location: (job && job.location) || null, // omitted → null when no linked job
    url: (job && job.url) || null,
    person: profile,
    // employment intentionally NOT set — unknown fields are omitted, never fabricated
  };
}
```

*(Contact string: use Daniel's real contact from `docs/MASTER_PRODUCT_DESIGN_SPEC.md` / `candidate_preferences.json` when wiring — the placeholder above is illustrative.)*

- [ ] **Step 4: Run to verify it passes**

Run: `node --test src/hooks/casePartsView.test.mjs src/hooks/caseMetaView.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/casePartsView.js src/hooks/casePartsView.test.mjs src/lib/profile.js src/hooks/caseMetaView.js src/hooks/caseMetaView.test.mjs
git commit -m "feat(case): casePartsView selector + caseMetaView/profile identity adapter"
```

---

## Task 6: `i18n.js` shim (`tr` / `useLang` / `LangToggle`)

**Files:**
- Create: `src/lib/i18n.js` (port of `design/design/ll-i18n.js`, plus a `LangToggle` component matching the design usage)
- Test: `src/lib/i18n.test.mjs` (the pure `tr` fallback only — the hook/DOM parts are not unit-tested)

**Interfaces:**
- Produces: `tr({sv,en}|string) → string`, `getLang()`, `setLang(next)`, `useLang() → {lang,setLang}`, `LangToggle` (React component).

- [ ] **Step 1: Write the failing test** (pure `tr` fallback)

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { trFor } from './i18n.js'; // pure, lang-injected variant for testing

test('trFor resolves active language, falls back to sv then empty', () => {
  assert.equal(trFor('en', { sv: 'Hej', en: 'Hi' }), 'Hi');
  assert.equal(trFor('en', { sv: 'Hej' }), 'Hej');   // no en → sv
  assert.equal(trFor('sv', 'literal'), 'literal');   // string passthrough
  assert.equal(trFor('en', null), '');               // null → ''
});
```

- [ ] **Step 2: Run to verify it fails** — module/function not found.

Run: `node --test src/lib/i18n.test.mjs`

- [ ] **Step 3: Implement** — port `ll-i18n.js` verbatim (localStorage key `ll.lang`, subscriber broadcast, `useLang` React hook), and factor the pure resolution into `trFor(lang, obj)` so `tr(obj)=trFor(getLang(),obj)` and the test can inject lang. Add a `LangToggle` component using design-system tokens (mirror the design screens' toggle markup). Import React for `useLang`/`LangToggle`.

*(Full port: copy `design/design/ll-i18n.js` into `src/lib/i18n.js`; expose `trFor(lang,obj)`; keep `tr`, `getLang`, `setLang`, `useLang`; add `LangToggle`. The generated-artifact "svenska kommer" note stays UI copy in the screens, not here.)*

- [ ] **Step 4: Run to verify it passes** — PASS (1).

Run: `node --test src/lib/i18n.test.mjs`

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n.js src/lib/i18n.test.mjs
git commit -m "feat(i18n): port tr/useLang/setLang + LangToggle from the design shim"
```

---

## Task 7: `caseApi` additions (draft save, job→case link)

**Files:**
- Modify: `src/api/caseApi.js`
- Modify: `src/hooks/useCase.js` (expose the new writes as actions, mirroring `answerGap`/`generate`)

**Interfaces:**
- Produces:
  - `saveCoverLetterDraft(caseId, { paragraphs, decisions, language }) → Promise<part>` → `POST /api/case/:id/letter-draft`; dispatches `ll:case:changed`.
  - `linkJobCase(jobId, caseId) → Promise<job>` → `POST /api/job/:id/case`; dispatches `ll:jobs:changed`.
  - `useCase(...).actions.saveLetterDraft({paragraphs,decisions,language})` — wraps the above for the active case.

- [ ] **Step 1: Write the failing test** — a thin logic test that the wrappers build the right request. Add a request-capture test in `src/api/caseApi.test.mjs` (mock `fetch` via `globalThis.fetch`).

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { saveCoverLetterDraft, linkJobCase } from './caseApi.js';

test('saveCoverLetterDraft POSTs to the letter-draft route with the draft body', async () => {
  const calls = [];
  globalThis.fetch = async (path, opts) => { calls.push({ path, opts }); return { ok: true, status: 200, json: async () => ({ ok: true, part: {} }) }; };
  await saveCoverLetterDraft('c1', { paragraphs: ['p'], decisions: { x: 'keep' }, language: 'en' });
  assert.equal(calls[0].path, '/api/case/c1/letter-draft');
  assert.equal(calls[0].opts.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].opts.body), { language: 'en', paragraphs: ['p'], decisions: { x: 'keep' } });
});

test('linkJobCase POSTs the caseId to the job-case route', async () => {
  const calls = [];
  globalThis.fetch = async (path, opts) => { calls.push({ path, opts }); return { ok: true, status: 200, json: async () => ({ ok: true, job: {} }) }; };
  await linkJobCase('job_x', 'c1');
  assert.equal(calls[0].path, '/api/job/job_x/case');
  assert.deepEqual(JSON.parse(calls[0].opts.body), { caseId: 'c1' });
});
```

- [ ] **Step 2: Run to verify it fails** — exports not found.

Run: `node --test src/api/caseApi.test.mjs`

- [ ] **Step 3: Implement** in `src/api/caseApi.js` (mirror the existing `decideJob`/`answerGap` wrappers + their `ll:*:changed` dispatch):

```js
export function saveCoverLetterDraft(caseId, { paragraphs, decisions, language = 'en' }) {
  return request(`/api/case/${encodeURIComponent(caseId)}/letter-draft`, {
    method: 'POST',
    body: JSON.stringify({ language, paragraphs, decisions }),
  }).then((b) => {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('ll:case:changed'));
    return b.part;
  });
}

export function linkJobCase(jobId, caseId) {
  return request(`/api/job/${encodeURIComponent(jobId)}/case`, {
    method: 'POST',
    body: JSON.stringify({ caseId }),
  }).then((b) => {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('ll:jobs:changed'));
    return b.job;
  });
}
```

Then in `src/hooks/useCase.js`, add `saveLetterDraft` to the `actions` object (mirroring `generate`), calling `saveCoverLetterDraft(caseId, ...)` then `refresh()`.

- [ ] **Step 4: Run to verify it passes** — PASS (2). Then `node --test` (full) to confirm no regressions.

- [ ] **Step 5: Commit**

```bash
git add src/api/caseApi.js src/api/caseApi.test.mjs src/hooks/useCase.js
git commit -m "feat(api): saveCoverLetterDraft + linkJobCase client wrappers + useCase action"
```

---

## Task 8: `PartGate` + `PartState` + `PartSkeleton` + `STATUS` (honest-state module)

**Files:**
- Create: `src/components/partGate.jsx`
- Create: `src/components/partSlot.mjs` (pure slot-picker, testable) + `src/components/partSlot.test.mjs`

**Interfaces:**
- Produces:
  - `pickSlot(status, { busy }) → 'pending'|'failed'|'absent'|'ready'` (pure).
  - `<PartGate status={...} busy={bool} pending={jsx} failed={jsx} absent={jsx}>{ready children}</PartGate>`.
  - `PartState` (icon + title + body block, ported from `design/design/ll-case.jsx` — used by the screens for `failed`/`absent`/empty CTAs, e.g. `<PartState tone="fail" …>`), `PartSkeleton` (the `pending` bars, `<PartSkeleton lines={n}/>`), and a `STATUS = {PENDING:'pending',READY:'ready',FAILED:'failed',ABSENT:'absent'}` constant. These three are generic UI in the design bridge (not fixtures); the ported screens reference them directly, so `partGate.jsx` **must export them** (or the ports won't compile).

- [ ] **Step 1: Write the failing test** (pure slot logic)

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { pickSlot } from './partSlot.mjs';

test('pickSlot maps status→slot; busy forces pending', () => {
  assert.equal(pickSlot('ready', {}), 'ready');
  assert.equal(pickSlot('pending', {}), 'pending');
  assert.equal(pickSlot('failed', {}), 'failed');
  assert.equal(pickSlot('absent', {}), 'absent');
  assert.equal(pickSlot('ready', { busy: true }), 'pending'); // in-flight action
});
```

- [ ] **Step 2: Run to verify it fails** — module not found.

Run: `node --test src/components/partSlot.test.mjs`

- [ ] **Step 3: Implement** `partSlot.mjs`:

```js
export function pickSlot(status, { busy } = {}) {
  if (busy) return 'pending';
  if (status === 'ready') return 'ready';
  if (status === 'failed') return 'failed';
  if (status === 'pending') return 'pending';
  return 'absent';
}
```

Then `partGate.jsx` (React, uses `pickSlot`; renders the chosen slot; `ready`→children). Use design-system classes for the default skeleton/error; the `absent`/`failed` slots are passed in by each screen (so the "generate" CTA copy is screen-specific).

```jsx
import React from 'react';
import { pickSlot } from './partSlot.mjs';
export function PartGate({ status, busy, pending, failed, absent, children }) {
  const slot = pickSlot(status, { busy });
  if (slot === 'ready') return <>{children}</>;
  if (slot === 'pending') return pending || <div className="ll-skel" aria-busy="true"><div className="ll-skel__bar" /></div>;
  if (slot === 'failed') return failed || null;
  return absent || null;
}
```

Also in `partGate.jsx`: port `PartState` and `PartSkeleton` from `design/design/ll-case.jsx` (keep their markup/classes) and export `STATUS`. Export all four (`PartGate`, `PartState`, `PartSkeleton`, `STATUS`) so the ported screens' `<PartState>`/`<PartSkeleton>`/`STATUS.*` references resolve.

- [ ] **Step 4: Run to verify it passes** — PASS (1).

Run: `node --test src/components/partSlot.test.mjs`

- [ ] **Step 5: Commit**

```bash
git add src/components/partGate.jsx src/components/partSlot.mjs src/components/partSlot.test.mjs
git commit -m "feat(ui): PartGate component + pure slot-picker (honest part states)"
```

---

## Task 9: Merge the design CSS (with `.improve` collision check)

**Files:**
- Modify: `src/styles/hello-lily.css` (append `ll-apply.css` + `ll-build.css`, token-only)

- [ ] **Step 1: Collision check** — before merging, grep both sides for overlapping class names, `.improve` first.

Run: `grep -n "\.improve" src/styles/hello-lily.css design/design/ll-build.css`
Expected: identify whether `.improve` exists in both. If it does, namespace the design one (e.g. `.cvb-improve`) in both the CSS and `screens-cv2.jsx` before merge; record the rename.

- [ ] **Step 2: Append the design CSS** — paste `design/design/ll-apply.css` then `design/design/ll-build.css` into `src/styles/hello-lily.css` under a clear `/* ===== core-loop wave ===== */` banner. Confirm every value references a token (no raw hex/px); fix any stragglers to tokens.

- [ ] **Step 3: Verify build** — `npm run build` (or `npm run dev` boot) with no CSS parse error; grep for any duplicate selector that would override existing rules unexpectedly.

Run: `npm run build`
Expected: builds clean.

- [ ] **Step 4: Commit**

```bash
git add src/styles/hello-lily.css
git commit -m "style(core-loop): merge ll-apply + ll-build design CSS (token-only, .improve namespaced)"
```

---

## Task 10: Make `#match` / `#cv` / `#letter` template routes

**Files:**
- Modify: `src/App.jsx` (add `template: true` to the three routes; they render via the existing template branch)

- [ ] **Step 1:** In `LL_ROUTES`, set `template: true` on `match`, `cv`, and `letter` (as `jobbsok` already is). Confirm the `isTemplate` branch renders them with `<CloverDefs/>` + screen + `<HelpfulLayover/>` and suppresses the global chrome + `HelpfulNow`; the body-class effect toggles `ll-site` off / `ll-template` on for these routes (already generic per the Jobbsök fix).
- [ ] **Step 2: Manual boot check** — `npm run dev`, visit each of `#match`, `#cv`, `#letter`; confirm one left nav (Sidebar), one right rail (CrossColumn), full-bleed cream, no blue slab, no double chrome. (These will still render the ported screens once Tasks 11-13 land; at this task they render the current screens inside the template shell — expect layout, not final content.)
- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat(routes): match/cv/letter become template screens (own nav + cross rail)"
```

---

## Task 11: Personligt brev — port + wire + save-and-resume

**Files:**
- Modify: `src/screens/coverLetter.jsx` (replace the body with the port of `design/design/screens-letter2.jsx`)
- Uses: `useCase`, `casePartsView`, `PartGate`, `i18n`, `letterDraft.mjs`, `caseApi.saveCoverLetterDraft`

**Interfaces:**
- Consumes: `parts.coverLetter`, `parts.coverLetterDraft`, `parts.fit`, `parts.decodedRole`, `caseMetaView(caseData)`; `seedEditor`, `remapDecisions`, `unresolvedCount`; `actions.generate`, `actions.saveLetterDraft`.

- [ ] **Step 1: Port the markup** — copy `screens-letter2.jsx` into `coverLetter.jsx`, swapping the design's fixture bridge for the real one: `import { useActiveCase } from '../hooks/useCase.js'`, `casePartsView`, `caseMetaView`, `PartGate`, `tr/useLang/LangToggle` from `src/lib/i18n.js`, `LetterFlag`/`Para`/`ParaInsert` kept. Replace design `parts.X` reads with `const parts = casePartsView(caseData)`; the letter header/ctxbar (`company`, `jobTitle`) and the **signature (`person.name`) + download contact** come from `caseMetaView` (not the missing `meta.person`).
- [ ] **Step 2: Wire the part gate** — wrap the letter body in `<PartGate status={parts.statusOf('coverLetter')} busy={running.generate} absent={<GenerateCTA onClick={actions.generate} label={tr({sv:'Skriv brev',en:'Write letter'})}/>} failed={<RetryCTA .../>}>`.
- [ ] **Step 3: Resume-on-open** — seed editor state from the durable draft or the letter:

```jsx
const cl = parts.coverLetter;                       // {paragraphs, unsupported_by_cv} | null
const draft = parts.coverLetterDraft;               // {paragraphs, decisions} | null
const seedKey = (cl ? cl.paragraphs.join('') : '') + '::' + (draft ? draft.editedAt : '');
React.useEffect(() => {
  if (!cl && !draft) { setParas(null); return; }
  const seed = seedEditor(draft, cl);               // draft wins if present
  setParas(seed.paragraphs.map((t) => ({ text: t, seed: t })));
  setFlagDec(seed.decisions);
}, [seedKey]);
```

- [ ] **Step 4: Save-and-resume actions** —
  - **"Spara utkast"** (always enabled): `actions.saveLetterDraft({ paragraphs: paras.map(p=>p.text), decisions: flagDec, language })` → persists; toast "Utkast sparat". This is what makes resume work.
  - **"Klar / Granska"** (disabled while `unresolvedCount(cl.unsupported_by_cv, flagDec) > 0`): keeps the existing `letterReviewed` flag behavior.
  - **Regenerate affordance:** when a draft exists AND `cl` is newer/different, show an explicit "Uppdatera från nytt brev" control that discards the draft seed and reseeds from `cl` (never silently hide a regenerated letter — spec §save-and-resume).
- [ ] **Step 5: Ärlighetskoll** — render `cl.unsupported_by_cv.map((claim,i)=> <LetterFlag claim={claim} decision={flagDec[claim]} onDecide={v=>decide(claim,v)}/>)` — **key decisions by `claim` text**, not index (so save/remap stay stable). `decide(claim,v)` updates `flagDec[claim]`.
- [ ] **Step 6: Persona/i18n** — confirm no Amir, no demobar; all copy via `tr({sv,en})`; "svenska kommer" note stays where the design has it.
- [ ] **Step 7: Manual verify** — `npm run dev` with a case that has a `coverLetter`: edit paragraphs, resolve some flags, **Spara utkast**, reload `#letter` → editor resumes from the draft (paragraphs + decisions). Confirm absent-state generate CTA when no letter.
- [ ] **Step 8: Diff-fidelity check** — `diff` the ported markup against `screens-letter2.jsx` to confirm only the bridge/wiring changed, not the design.
- [ ] **Step 9: Commit**

```bash
git add src/screens/coverLetter.jsx
git commit -m "feat(letter): Personligt brev on templates — coverLetter bound + Ärlighetskoll + durable save-and-resume"
```

---

## Task 12: CV-byggaren — port + wire

**Files:**
- Modify: `src/screens/cvActivity.jsx` (replace the `CVBuilder` component with the port of `design/design/screens-cv2.jsx`; **keep `ActivityTracker` unchanged**)

**Interfaces:**
- Consumes: `parts.cvDraft`, `parts._pool`, `caseMetaView(caseData)`; `PartGate`; `actions.generate`.

- [ ] **Step 1: Port** `screens-cv2.jsx` `CVBuilderDS` into `cvActivity.jsx`'s `CVBuilder`, swapping the fixture bridge for `useActiveCase` + `casePartsView` + `PartGate` + i18n. Person/role header from `caseMetaView` (`meta.person.name`, `jobTitle`, `company`). `resolveDatafact(id)` reads `parts._pool` — **empty this wave**, so `CvItem` chips render the honest generic "Från din intake"/"Från ditt CV" form (design's built-in fallback); do not fake a type. The **intake rail renders as a visible disabled "Kommer" strip** (living-CV-now / intake-deferred decision) — no `addFact`, no datafact-mint call.
- [ ] **Step 2: Gate** on `cvDraft` — `<PartGate status={parts.statusOf('cvDraft')} busy={running.generate} absent={<GenerateCTA .../>}>` → `CvLive`.
- [ ] **Step 3: Honest surfaces** — only sections with ≥1 renderable item render; every `CvItem` shows its (possibly generic) datafact chip; keep the "Lilly väljer, hittar aldrig på" guarantee; Improve-strip + version-switcher + intake rail stay disabled ("Kommer"). No CV text authored in the UI.
- [ ] **Step 4: Manual verify** — `#cv` renders the living CV from a ready `cvDraft`; absent-state generate CTA otherwise. `ActivityTracker` (`#activity`) still works unchanged.
- [ ] **Step 5: Diff-fidelity check** vs `screens-cv2.jsx`.
- [ ] **Step 6: Commit**

```bash
git add src/screens/cvActivity.jsx
git commit -m "feat(cv): CV-byggaren on templates — cvDraft bound, traceable lines, PartGate"
```

---

## Task 13: Matchanalys — port + wire the per-job analysis

**Files:**
- Modify: `src/screens/match.jsx` (replace with the port of `design/design/screens-match2.jsx`; queue wiring lands in Task 15)

**Interfaces:**
- Consumes: `parts.fit`, `parts.gaps`, `parts.decodedRole`, `caseMetaView(caseData, job)`, `parts._pool`; `PartGate`; `actions.analyze`, `actions.answerGap`.

- [ ] **Step 1: Port** `screens-match2.jsx` into `match.jsx`, swapping the fixture bridge for `useCase`/`casePartsView`/`PartGate`/i18n. Verdict header (`company`/`jobTitle`/`location`/`logo`) from `caseMetaView(caseData, job)` (the linked approved-job supplies `location`/`url`). Reuse the analysis rendering already proven in `helpfulLayover.jsx` `MatchAnalysisContent` (verdict, "Det du har" with `CitationChip`, "Luckor att fylla" with the fill-gap loop). `resolveDatafact` reads `parts._pool` — empty this wave → `CitationChip` degrades to the honest generic form (no false "unresolvable" alarm on every row).
- [ ] **Step 2: Gate** the analysis on `parts.statusOf('fit')`; the fill-gap loop uses `actions.answerGap(gap.id,{answer,requirementId})` with the three honest outcomes (accepted/stays_gap/save_failed) exactly as `GapFillForm` does today.
- [ ] **Step 3: Served score** — match % = `parts.fit.score` (never a fixture). Repoint the dead `#triage` link → `#jobbsok`.
- [ ] **Step 4: Manual verify** — for a case with `fit`/`gaps` ready, `#match` shows the verdict + requirements + working fill-gap loop; pending/failed/absent states honest.
- [ ] **Step 5: Diff-fidelity check** vs `screens-match2.jsx`.
- [ ] **Step 6: Commit**

```bash
git add src/screens/match.jsx
git commit -m "feat(match): Matchanalys analysis on templates — fit/gaps bound, fill-gap loop, served score"
```

---

## Task 14: Layover review-content (letter + cv)

**Files:**
- Modify: `src/components/helpfulLayover.jsx` (port `LetterReviewContent` + `CvReviewContent` from `design/design/helpful-layover.jsx`; reuse the exported `LetterFlag`)

- [ ] **Step 1: Port** the `LetterReviewContent` (Ärlighetskoll rail reusing `LetterFlag`, claim-keyed) and `CvReviewContent` into the real `helpfulLayover.jsx`, wiring them to `useCase`/`casePartsView`. Register their `kind`s in `HelpfulLayoverContent` (like `jobpreview`/`job-analysis`).
- [ ] **Step 2: Manual verify** — opening the letter/cv review layover shows the same real data + honesty controls as the screen.
- [ ] **Step 3: Commit**

```bash
git add src/components/helpfulLayover.jsx
git commit -m "feat(layover): letter + cv review content on real parts (reuse LetterFlag)"
```

---

## Task 15: The decision-unification seam (durable queue + job→case link)

**Files:**
- Modify: `src/screens/match.jsx` (queue)
- Possibly modify: `src/utils/jobStore.js` (only if grep proves nothing else uses `acceptJob`/`getAcceptedJobs`)

**Interfaces:**
- Consumes: `caseApi.listJobs()`, `caseApi.linkJobCase(jobId, caseId)`, `caseApi.createCase(...)`.

- [ ] **Step 1: Grep first (Option-1 discipline)** — `grep -rn "acceptJob\|getAcceptedJobs\|removeAcceptedJob\|setJobCase" src/` — list every caller. The Matchanalys queue stops using `getAcceptedJobs`; leave the functions in place if any OTHER wired screen still uses them, retire them only if nothing does. Record the finding.
- [ ] **Step 2: Queue from durable approved jobs** — in `match.jsx`, replace `getAcceptedJobs()` with `listJobs().filter(j => j.decision === 'approved')`, refetched on `ll:jobs:changed`. An approved job with no `caseId`/`fit` shows an **"Analysera"** CTA (no score); analyzed jobs show `fit.score` + open the analysis.
- [ ] **Step 3: Durable job→case link** — "Analysera" flow: if the job has no `caseId`, `createCase({company:job.company, role:job.title, sourceInput:job.snippet+job.url})` → `linkJobCase(job.id, caseId)` (durable) → `setActiveCaseId(caseId)` → open the analysis. Subsequent opens read `job.caseId`.
- [ ] **Step 4: Verify durability** — approve a job in `#jobbsok`, open `#match`, click Analysera, then **restart the server without wiping** → the job still shows as approved AND still linked to its case (caseId persisted on the durable job record).
- [ ] **Step 5: Fallback trigger (pre-authorized — CONCRETE, not judgment).** Full unification is defined as EXACTLY: **(1)** one new field on the job record (`caseId`) + **(2)** the one `POST /api/job/:id/case` route (T3) + **(3)** relocating the queue read in `match.jsx`. **Complete full unification** unless closing the seam requires ANY ONE of these — then STOP, switch to **queue-only**, and report which fired:
  - a **contract/schema change beyond that single `caseId` field** (a new part, a new collection, or a changed job-record contract), OR
  - a change to **any wired screen besides `match.jsx`** (home, `jobResultsList`, the layover, `jobSearch`, …), OR
  - **migrating existing `acceptedJobs` data** (a backfill/migration of the old localStorage list into the durable store).
  Queue-only = Step 2 stays (durable approved-jobs queue), but the `caseId` link stays on the existing `setJobCase`/active-case mechanism, flagged as a follow-up. Absent any of the three triggers, full unification is the required outcome. Record which path shipped in the build report.
- [ ] **Step 6: Commit**

```bash
git add src/screens/match.jsx
git commit -m "feat(match): decision-unification seam — durable approved-jobs queue + job→case link"
```

---

## Task 16: Integration verification + build report

**Files:**
- Create: `docs/verification/2026-07-07-letter-save-resume-restart.sh` + `.md` (durability demo a)
- Create: `docs/verification/2026-07-07-seam-durability-restart.sh` + `.md` (durability demo b)
- Create: `docs/verification/2026-07-07-core-loop-wave-build-report.md`

- [ ] **Step 1: Full suite** — `npm test` green (backend routes + all `src/**/*.test.mjs` logic). Record counts.
- [ ] **Step 2: Fresh-clone condition** — clone the branch to `/tmp`, `npm ci`, `npm test` green; portability scan (no sibling-repo/worktree/absolute paths in `src/`+`server/`).
- [ ] **Step 3: Script + COMMIT two durability demos to `docs/verification/` — these ARE the primary durability evidence (NOT "verify manually").** Each is a runnable script driving the served API (curl) across a real server restart, plus a committed transcript of its PASS output.
  - **(a) `docs/verification/2026-07-07-letter-save-resume-restart.{sh,md}`:** create a case → seed/`generate` a `coverLetter` → `POST /api/case/:id/letter-draft` with edited paragraphs + flag decisions → **`kill` the server, `npm run dev` (NO store wipe)** → `GET /api/case/:id` → assert `coverLetterDraft.data.paragraphs` AND `.decisions` are byte-intact (draft + flag decisions resume). Commit the `.sh` + the captured transcript showing `durable:true` and the intact draft.
  - **(b) `docs/verification/2026-07-07-seam-durability-restart.{sh,md}`:** `POST /api/job/:id/decide {decision:'approved'}` → `GET /api/jobs` shows it approved (→ enters the `#match` queue) → `POST /api/job/:id/case {caseId}` → **`kill` + restart (NO wipe)** → `GET /api/jobs` → assert the job is still `approved` AND `caseId` still linked (job→case durable). Commit the `.sh` + the captured PASS transcript.
  - **(c) Manual UI smoke (SECONDARY, supplements the scripts):** each screen renders its real part with honest pending/ready/failed/absent via `PartGate`; Ärlighetskoll surfaces every `unsupported_by_cv` claim with keep/soften/cut; the `#letter` editor visibly resumes from the durable draft after the (a) restart. Not the evidence of record — the committed scripts in (a)/(b) are.
- [ ] **Step 4: Write the build report** — the two new routes, the shared foundation, the seam outcome (full vs queue-only fallback + which T15-Step-5 trigger fired, if any), save-and-resume mechanism, the design→real adaptations (incl. the `caseMetaView`/`profile` identity adapter + the honest citation-chip degradation), the known DOM-test gap, and links to the two committed durability demos (Step 3a/3b).
  - **§7 confirmation table (required — each item confirmed LANDED, not just "as resolved"), one row per resolution with its task + a one-line proof:** `#triage`→`#jobbsok` repoint (T13) · served `fit.score` not fixture (T13) · `.improve` collision handled/namespaced (T9) · i18n `tr/useLang` ported (T6/T9) · keep/soften/cut **persisted** via `coverLetterDraft` (T11) · inline-"Ändra" left local, logged (T13) · concern-chooser deferred (T11) · PDF-as-HTML-blob noted known (T11) · CV improve/version/**intake** disabled "Kommer" (T12) · multi-application deferred (T11) · generated artifacts English-only surfaced honestly (T11/T12).
  - **Logged follow-ups (§Logged follow-ups)** — record the named **"CV intake → datafact-mint + datafact exposure surface"** item explicitly (its own unit) so "Kommer" is tracked, not permanent; plus the other §Logged-follow-ups items.
- [ ] **Step 5: Commit + STOP** — do NOT merge. Ready for independent review (same as Jobbsök).

```bash
git add docs/verification/2026-07-07-letter-save-resume-restart.sh docs/verification/2026-07-07-letter-save-resume-restart.md docs/verification/2026-07-07-seam-durability-restart.sh docs/verification/2026-07-07-seam-durability-restart.md docs/verification/2026-07-07-core-loop-wave-build-report.md
git commit -m "docs(verification): core-loop wave build report + two durability demos — review-ready, no merge"
```

---

## Logged follow-ups (deferred this wave — honestly tracked, not permanent)

These are OUT of scope for this wave but recorded here + in the build report so nothing "Kommer" quietly becomes forever:

1. **CV intake → datafact-mint + datafact exposure surface** (a new backend engine, its own unit). Two coupled pieces: (a) a **write** path (`addFact`/mint an intake answer into the datafact pool, gate-checked before minting) so the CV intake rail becomes functional; (b) a **read** exposure surface (referenced datafacts on `GET /api/case/:id`) so citation chips resolve the datafact **type** and the "unresolvable citation = honesty hook" fires as a real signal. Until then: intake rail disabled ("Kommer"); chips show the honest generic form.
2. **Multi-user profile** — `src/lib/profile.js` is single-user (`owner:'self'`) this wave; moves to a per-user profile source when multi-user lands.
3. **Inline "Ändra" evidence write-back** (Matchanalys) — edits to a matched requirement's evidence stay local-only; decide whether an edited evidence line should persist to a part.
4. **Real PDF/print export** for the letter (currently a client-side HTML-blob download).
5. **Letter "concern-to-address" chooser** (strengths-vs-rewards ships instead).
6. **Multi-application letter list** (A8) and per-role CV versions.
7. **Frontend DOM test harness** (vitest+jsdom) — the standing follow-up; logic is unit-tested, layout/cross-surface is manual this wave.

## Self-review notes (plan vs spec)

- **Spec coverage:** three screens (T11-13), shared foundation PartGate/**PartState/PartSkeleton/STATUS**/i18n/selector (T5,6,8), **identity adapter `caseMetaView`+`profile`** (T5, consumed T11-13), **datafact resolver + honest empty-pool degradation** (T5,12,13), coverLetterDraft part+route+save/resume (T1,2,4,7,11), job→case route+seam (T3,15), CSS merge + `.improve` (T9), template routes (T10), layover (T14), §7 resolutions (T13 triage-link/score; T9 `.improve`/i18n; T11 keep-soften-cut persistence), logged follow-ups (§Logged follow-ups + T16), fresh-clone + verification (T16). ✅
- **The four "resolve in the plan" asks (from review):** PartGate/PartState/STATUS module → T8; `caseData→parts` selector → T5; datafact-citation resolver → T5 (+ honest degradation, exposure surface logged follow-up); `meta.person` identity source → T5 `caseMetaView`/`profile`. All landed.
- **Deferred (spec non-goals):** CV intake datafact-mint + exposure surface, concern-chooser, real PDF, multi-application, CV improve/version tools, inline-Ändra write-back, ActivityTracker restyle, DOM harness — none given tasks (correct); all in §Logged follow-ups.
- **Type consistency:** `casePartsView` returns `.data` payloads + `statusOf`/`dataOf` (used by T11-14); `seedEditor`/`remapDecisions`/`unresolvedCount` (T4) consumed in T11; `saveCoverLetterDraft`/`linkJobCase` (T7) consumed in T11/T15; `pickSlot`/`PartGate` (T8) consumed in T11-14. Names consistent across tasks.
- **Fallback:** the pre-authorized queue-only path is explicit at T15 Step 5.
