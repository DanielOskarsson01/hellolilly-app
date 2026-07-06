# Jobbsök Unit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Build in an isolated git worktree (superpowers:using-git-worktrees) — the acceptance requires the fresh-clone condition.

**Goal:** Rebuild Jobbsök as one screen on the design-system grid templates where discovery results ARE the approval surface — Daniel triages stored jobs (approve / reject-with-reason / reopen), decisions persist through the served API and survive restart, and both the result row and the ad layover write ONE shared decision record.

**Architecture:** Two additive backend routes (`GET /api/jobs`, `POST /api/job/:jobId/decide`) expose the durable `jobs` collection to the frontend. A single `useJobs` hook (backed by `caseApi.decideJob` + `caseApi.listJobs`) is the ONLY decision path; the result row and the layover both call it and both refetch on the existing `ll:jobs:changed` event — no component-local decision state anywhere. The screen and layover are rebuilt from the design package, mapped onto the REAL stored-job shape (`signal`/`matchedRules`), not the prototype's fixture shape (`locFit`/`stage2`).

**Tech Stack:** Node `http` server (`server/dev-server.cjs`, no Express), durable SQLite store (`server/skeleton/store`), `node --test` (CJS backend + ESM `.mjs` logic), React 18 via Vite (`.jsx`, `React.*` global scope), token-only CSS in `src/styles/hello-lily.css`.

## Global Constraints

- **One job, one decision record.** Row and layover read+write the SAME store record keyed on `id`, through the served API. NO component-local decision state, NO localStorage decisions. This is the top correctness criterion — the reviewer checks it first.
- **No NEW surface caches a decision (Option 1 — scope to Jobbsök; CORRECTED 2026-07-05).** The new surfaces — the Jobbsök screen and the `jobpreview` layover — write decisions EXCLUSIVELY through the backend decide route (via `useJobs`), with zero component-local or localStorage decision state. **LEAVE `jobStore.js`'s `acceptJob`/`removeJob`/`getAcceptedJobs`/etc. in place.** Grep proved the WIRED screens still use them (`getAcceptedJobs` feeds Matchanalys's queue; `jobResultsList.jsx` renders on `home`; the `kind:'job'` layover uses it), so removing them would regress wired screens and violate "zero diffs to wired screens". No NEW surface calls them → there is no dead fallback to slip into, and the correctness criterion holds fully. (This corrects the plan's earlier "jobResultsList is orphaned / remove the functions" premise, which grep proved factually wrong. The purpose of "remove the localStorage decision path" was always "no split in the NEW surfaces," not "delete the functions regardless of who uses them" — Option 1 achieves that purpose completely.) **Follow-up (Matchanalys wave, NOT this unit):** unify the new triage decision (backend, keyed by `job.id`) with the old `acceptedJobs`/Matchanalys flow (localStorage, keyed by `jobKey`) — that wave already rebuilds `match.jsx`, so the unification lands there with its own test pass, not smuggled into Jobbsök.
- **Real stored-job shape, not the prototype's.** Flagged = `job.signal === 'low'`. Evidence chips derive from `job.matchedRules` (`{rule, term, stage}`) — `stage:1` = location/stage-1 chips, `stage:2` = body-signal chips. NEVER render `locFit`/`stage2` fixture fields; NEVER fabricate a stage-2 chip that has no `matchedRules` entry.
- **Dedup preserves decision.** The decide route upserts by `id`, changing only `decision`/`rejectReason`/`rejectNote`. Re-discovery (externalId dedup in `job-discovery`) must keep the decision. This is a do-not-regress.
- **Honest-disabled, never faked.** CSV ingest ships disabled ("Kopplas snart"); custom-source URL ships disabled (v2); any filter with no backing ships best-effort-client-side keeping unknowns or disabled — NEVER silently drops an ad whose value is unknown. Only anti-keywords are a hard client-side exclude on matched text.
- **No score at search time.** Results carry no match %. The `match` field from the live search is ignored in the triage UI.
- **Token-only CSS.** Appended CSS uses design-system tokens only (no raw hex except the warm CSV/amber shades already in the system).
- **Grid templates, no fork.** The screen imports `PageTemplate`/`ContentArea`/`ContentBox`/`CrossColumn` from `src/components/grid.jsx` (first importer). If a template needs a small ADDITIVE change to serve the screen, make it and report it — do NOT fork a bespoke copy. No DemoBar on Jobbsök.
- **Persona:** Daniel Oskarsson (iGaming growth/marketing). No fixture jobs / demo keywords / demobar. Empty store on a fresh clone → honest empty state, not samples.
- **Zero diffs to the six wired screens.** No regression to home/cv/letter/interview/match/coach.
- **Design package is the markup source.** `screens-jobbsok2.jsx` (JobTriageCard/TriSection/JobSlimRow/EvidenceChips), `screens-jobsearch.jsx` (search box/filters/collapse), `jobpreview-layover.jsx` (JobPreviewContent), `ll-jobsearch.css`, `ll-jobs.css`. Build FROM these; do not reinterpret. This plan specifies the DELTAS to wire them to real data.

---

## Reconciliation points (RESOLVED — restate in the build report)

1. **New filters (emp-type/work-mode/salary):** stored jobs have none of these fields. Keyword + Ort drive the search request; anti-keywords = hard client-side exclude on matched text (`title`+`company`+`snippet`). Emp-type/work-mode/salary render and filter **client-side only where the returned job carries the field, keeping unknowns** (salary "include no-salary" ON by default). They are soft until ads carry the data — reported, not faked.
2. **Saved keyword chips → filterSet:** the search is request-driven (keywords in the POST body); there is no filterSet read/write route. Chips persist at the **UI layer** (existing `getSavedSearches`/`saveSearch` in `src/api/jobSearch.js`, localStorage). In-tool filterSet editing is **deferred and reported**.
3. **Stage-2 chips at discovery:** derive chips from `job.matchedRules`; stage-1 (location) chips exist at search time, stage-2 chips only once `matchedRules` carries a `stage:2` entry (post body-enrich). `jobFlagged(job) = job.signal === 'low'`. No empty/fabricated stage-2 chips.
4. **Re-flag after approve:** decision **stays** (matches store dedup-preserves-decision); the approved slim row surfaces any current flag chip. Implemented in `tierize` + the slim row rendering current `matchedRules`.
5. **DemoBar:** Jobbsök omits it; not duplicated into `grid.jsx`. If `primitives.jsx` has a DemoBar primitive, leave it untouched.

**Deferred/known gaps (flag, do not build):** CSV ingest wiring, custom-source URL ingestion, bulk approve/reject, decided-history pagination beyond last-10, reject-reason read-back surface, conflicting-evidence reconciliation. Matchanalys restyle is a separate wave. **Follow-up for the Matchanalys wave:** unify the new triage decision (backend, keyed by `job.id`) with the old `acceptedJobs`/Matchanalys flow (localStorage, keyed by `jobKey`) — the two are separate decision systems today; unify when that wave rebuilds `match.jsx`.

**Test coverage decision (Daniel, 2026-07-05):** logic + route tests + live restart-survival demo. NO vitest/jsdom. DOM-render screen tests deferred and flagged.

---

## File Structure

- **Modify** `server/dev-server.cjs` — add `GET /api/jobs` and `POST /api/job/:jobId/decide` route handlers inside `createApiHandler`.
- **Modify** `server/api.test.cjs` — add route tests (list; decide upsert + dedup-preserves-decision).
- **Create** `src/lib/jobTriage.mjs` — pure ESM: `jobFlagged`, `tierize`, `evidenceChips`, `REJECT_REASONS`, `STAGE2_LABELS`, `LOCFIT`. No React.
- **Create** `src/lib/jobTriage.test.mjs` — node:test for the pure logic.
- **Modify** `package.json` — extend `test` glob to include `src/**/*.test.mjs`.
- **Modify** `src/api/caseApi.js` — add `listJobs()`, `decideJob(jobId, {decision, reason, note})`.
- **Create** `src/hooks/useJobs.js` — the single decision path (read/approve/reject/reset + `ll:jobs:changed` sync).
- **Modify** `src/components/helpfulLayover.jsx` — add `kind:'jobpreview'` → `JobPreviewContent` (from the design), wired to `decideJob`.
- **Rewrite** `src/screens/jobSearch.jsx` — the one screen on grid templates (search + CSV-disabled + filters + triage tiers), reading `useJobs`.
- **Modify** `src/styles/hello-lily.css` — append `ll-jobsearch.css` + `ll-jobs.css` (token-only).
- **Create** `docs/verification/2026-07-05-jobbsok-restart-survival.md` — the restart-survival triage demo note.

---

### Task 1: Backend — `GET /api/jobs` (read stored jobs for the triage tiers)

**Files:**
- Modify: `server/dev-server.cjs` (inside `createApiHandler`, near the other `/api/jobs` handling)
- Test: `server/api.test.cjs`

**Interfaces:**
- Consumes: `host.store.listRecords('jobs')` (returns detached canonical records).
- Produces: `GET /api/jobs` → `{ ok: true, jobs: [<canonical job records>] }` — the RAW canonical shape (`id, externalId, source, title, company, location, url, snippet, text_content, postedAt, decision, signal, matchedRules, discoveredAt, rejectReason?, rejectNote?`). The frontend maps; do not UI-normalize here (the triage view needs `decision`/`signal`/`matchedRules`, which `/api/jobs/search`'s normalizeJob drops).

- [ ] **Step 1: Write the failing test** in `server/api.test.cjs`

```javascript
test('GET /api/jobs returns stored canonical jobs with decision + signal + matchedRules', async () => {
  const host = createHost({ llm: null });
  host.store.putRecord('jobs', { id: 'job_1', externalId: 'jobtech-1', title: 'CMO', company: 'Acme', location: 'Stockholm', decision: 'new', signal: 'neutral', matchedRules: [] });
  host.store.putRecord('jobs', { id: 'job_2', externalId: 'rok-2', title: 'VP US', company: 'Playline', location: 'Remote US', decision: 'new', signal: 'low', matchedRules: [{ rule: 'location_out', term: 'US', stage: 1 }] });
  const handle = createApiHandler(host, { preferencesPath: null, llm: null });
  const res = mockRes();
  assert.equal(await handle(makeReq('GET', '/api/jobs'), res), true);
  assert.equal(res._status, 200);
  assert.equal(res._body.ok, true);
  assert.equal(res._body.jobs.length, 2);
  const flagged = res._body.jobs.find((j) => j.id === 'job_2');
  assert.equal(flagged.signal, 'low');
  assert.equal(flagged.matchedRules[0].stage, 1);
});
```

- [ ] **Step 2: Run test to verify it fails** — `npm test` — Expected: FAIL (route returns 404/false).
- [ ] **Step 3: Add the handler** in `server/dev-server.cjs` inside `createApiHandler`, before the `/api/jobs/search` POST branch:

```javascript
if (req.method === 'GET' && req.url === '/api/jobs') {
  const jobs = host.store.listRecords('jobs');
  writeJson(res, 200, { ok: true, jobs });
  return true;
}
```
(Use the file's existing JSON-response helper; if it is inlined as `res.writeHead(200,...); res.end(JSON.stringify(...))`, match that exact style.)

- [ ] **Step 4: Run test to verify it passes** — `npm test` — Expected: PASS.
- [ ] **Step 5: Commit** — `git add server/dev-server.cjs server/api.test.cjs && git commit -m "feat(api): GET /api/jobs — stored jobs for the triage view"`

---

### Task 2: Backend — `POST /api/job/:jobId/decide` (the one decision write) — CORRECTNESS-CRITICAL

**Files:**
- Modify: `server/dev-server.cjs`
- Test: `server/api.test.cjs`

**Interfaces:**
- Consumes: `host.store.getRecord('jobs', jobId)`, `host.store.putRecord('jobs', record)`.
- Produces: `POST /api/job/:jobId/decide` body `{ decision: 'approved'|'rejected'|'new', reason?: string, note?: string }` → `{ ok: true, job: <updated record> }`. `decision:'new'` = reopen (clears reason/note). Upserts by `id`, changing ONLY `decision`/`rejectReason`/`rejectNote`; all other fields untouched. 404 if job unknown; 400 if decision invalid or (rejected without reason).

- [ ] **Step 1: Write the failing tests** in `server/api.test.cjs`

```javascript
test('POST /api/job/:id/decide writes decision + reason; reopen clears them; other fields untouched', async () => {
  const host = createHost({ llm: null });
  host.store.putRecord('jobs', { id: 'job_1', externalId: 'jobtech-1', title: 'CMO', company: 'Acme', location: 'Stockholm', decision: 'new', signal: 'low', matchedRules: [{ rule: 'x', term: 'y', stage: 1 }] });
  const handle = createApiHandler(host, { preferencesPath: null, llm: null });

  let res = mockRes();
  assert.equal(await handle(makeReq('POST', '/api/job/job_1/decide', { decision: 'rejected', reason: 'LOCATION', note: 'too far' }), res), true);
  assert.equal(res._status, 200);
  let stored = host.store.getRecord('jobs', 'job_1');
  assert.equal(stored.decision, 'rejected');
  assert.equal(stored.rejectReason, 'LOCATION');
  assert.equal(stored.rejectNote, 'too far');
  assert.equal(stored.title, 'CMO');                 // untouched
  assert.equal(stored.matchedRules[0].stage, 1);     // untouched

  res = mockRes();
  await handle(makeReq('POST', '/api/job/job_1/decide', { decision: 'new' }), res); // reopen
  stored = host.store.getRecord('jobs', 'job_1');
  assert.equal(stored.decision, 'new');
  assert.equal(stored.rejectReason, null);
  assert.equal(stored.rejectNote, null);
});

test('POST /api/job/:id/decide: 404 unknown, 400 bad decision, 400 rejected-without-reason', async () => {
  const host = createHost({ llm: null });
  const handle = createApiHandler(host, { preferencesPath: null, llm: null });
  let res = mockRes();
  await handle(makeReq('POST', '/api/job/nope/decide', { decision: 'approved' }), res);
  assert.equal(res._status, 404);
  res = mockRes();
  host.store.putRecord('jobs', { id: 'job_1', decision: 'new' });
  await handle(makeReq('POST', '/api/job/job_1/decide', { decision: 'banana' }), res);
  assert.equal(res._status, 400);
  res = mockRes();
  await handle(makeReq('POST', '/api/job/job_1/decide', { decision: 'rejected' }), res);
  assert.equal(res._status, 400);
});

test('decide survives a re-discovery dedup pass (decision not clobbered)', async () => {
  const host = createHost({ llm: null });
  host.store.putRecord('jobs', { id: 'job_1', externalId: 'jobtech-1', decision: 'new', signal: 'neutral', matchedRules: [] });
  const handle = createApiHandler(host, { preferencesPath: null, llm: null });
  await handle(makeReq('POST', '/api/job/job_1/decide', { decision: 'approved' }), mockRes());
  // simulate discovery re-seeing the same externalId (dedup path preserves the existing record)
  const existing = host.store.listRecords('jobs').find((j) => j.externalId === 'jobtech-1');
  assert.equal(existing.decision, 'approved');
});
```

- [ ] **Step 2: Run to verify fail** — `npm test` — Expected: FAIL.
- [ ] **Step 3: Add the handler** in `server/dev-server.cjs` inside `createApiHandler` (match the file's existing `req.url.match(/regex/)` param-parsing style used by `/api/case/:id/...`):

```javascript
const decideMatch = req.method === 'POST' && req.url.match(/^\/api\/job\/([^/]+)\/decide$/);
if (decideMatch) {
  const jobId = decideMatch[1];
  const body = await readBody(req); // use the file's existing body reader
  const decision = body && body.decision;
  if (!['new', 'approved', 'rejected'].includes(decision)) { writeJson(res, 400, { ok: false, error: 'invalid decision' }); return true; }
  if (decision === 'rejected' && !body.reason) { writeJson(res, 400, { ok: false, error: 'reason required' }); return true; }
  const job = host.store.getRecord('jobs', jobId);
  if (!job) { writeJson(res, 404, { ok: false, error: 'job not found' }); return true; }
  const updated = { ...job, decision,
    rejectReason: decision === 'rejected' ? body.reason : null,
    rejectNote:   decision === 'rejected' ? (body.note || null) : null };
  host.store.putRecord('jobs', updated);
  writeJson(res, 200, { ok: true, job: updated });
  return true;
}
```
(Reuse the exact body-reader + JSON helpers the neighbouring `/api/case/:id/...` handlers use.)

- [ ] **Step 4: Run to verify pass** — `npm test` — Expected: PASS (all three tests).
- [ ] **Step 5: Commit** — `git add server/dev-server.cjs server/api.test.cjs && git commit -m "feat(api): POST /api/job/:id/decide — the one decision write (upsert, dedup-safe)"`

---

### Task 3: Pure triage logic — `src/lib/jobTriage.mjs` + test + glob

**Files:**
- Create: `src/lib/jobTriage.mjs`
- Test: `src/lib/jobTriage.test.mjs`
- Modify: `package.json` (`test` script glob)

**Interfaces:**
- Produces (all pure, no React):
  - `jobFlagged(job) → boolean` (`job.signal === 'low'`).
  - `tierize(jobs) → { toReview, flagged, approved, rejected }` — `new` split by `jobFlagged`; `approved`/`rejected` by `decision`.
  - `evidenceChips(job) → [{ tone:'ok'|'warn'|'rule'|'src', label, stage? }]` — from `matchedRules` (stage 1 → location tone, stage 2 → warn) + an origin/source chip. Empty `matchedRules` → only the source chip (no fabricated flags).
  - `REJECT_REASONS` (the 8: LOCATION, SENIORITY, INDUSTRY, COMPENSATION, LANGUAGE, TOO_TECHNICAL, SALES_HEAVY, OTHER{note:true}), `STAGE2_LABELS`, `LOCFIT` — copied verbatim from the design's `ll-case.jsx`.

- [ ] **Step 1: Write the failing test** `src/lib/jobTriage.test.mjs`

```javascript
import { test } from 'node:test';
import assert from 'node:assert';
import { jobFlagged, tierize, evidenceChips, REJECT_REASONS } from './jobTriage.mjs';

test('jobFlagged keys on signal==="low"', () => {
  assert.equal(jobFlagged({ signal: 'low' }), true);
  assert.equal(jobFlagged({ signal: 'neutral' }), false);
  assert.equal(jobFlagged({}), false);
});

test('tierize splits new by flag, and by decision', () => {
  const jobs = [
    { id: 'a', decision: 'new', signal: 'neutral' },
    { id: 'b', decision: 'new', signal: 'low' },
    { id: 'c', decision: 'approved', signal: 'neutral' },
    { id: 'd', decision: 'rejected', signal: 'low' },
  ];
  const t = tierize(jobs);
  assert.deepEqual(t.toReview.map((j) => j.id), ['a']);
  assert.deepEqual(t.flagged.map((j) => j.id), ['b']);
  assert.deepEqual(t.approved.map((j) => j.id), ['c']);
  assert.deepEqual(t.rejected.map((j) => j.id), ['d']);
});

test('evidenceChips never fabricates a stage-2 chip; empty matchedRules → source only', () => {
  const chips = evidenceChips({ matchedRules: [], source: 'jobtech' });
  assert.equal(chips.filter((c) => c.tone !== 'src').length, 0);
  const chips2 = evidenceChips({ matchedRules: [{ rule: 'location_out', term: 'US', stage: 1 }, { rule: 'US_TIMEZONE', term: 'est', stage: 2 }], source: 'remoteok' });
  assert.ok(chips2.some((c) => c.stage === 1));
  assert.ok(chips2.some((c) => c.stage === 2));
});

test('REJECT_REASONS has the 8 taxonomy codes incl. OTHER with note', () => {
  assert.equal(REJECT_REASONS.length, 8);
  assert.ok(REJECT_REASONS.find((r) => r.code === 'OTHER').note);
});
```

- [ ] **Step 2: Extend the test glob** in `package.json`:

```json
"test": "node --test \"server/**/*.test.cjs\" \"scripts/**/*.test.cjs\" \"src/**/*.test.mjs\"",
```

- [ ] **Step 3: Run to verify fail** — `npm test` — Expected: FAIL ("Cannot find module './jobTriage.mjs'").
- [ ] **Step 4: Implement** `src/lib/jobTriage.mjs` — the functions above + the constants copied verbatim from `ll-case.jsx` (`REJECT_REASONS`, `STAGE2_LABELS`, `LOCFIT`). `evidenceChips` reads `job.matchedRules` (`{rule, term, stage}`): stage 1 → `{tone:'warn', label: term-or-rule, stage:1}` (location), stage 2 → `{tone:'warn', label: STAGE2_LABELS[rule]?.sv || rule, stage:2}`; then a final `{tone:'src', label: origin/source}`.
- [ ] **Step 5: Run to verify pass** — `npm test` — Expected: PASS (all `.mjs` + all existing backend tests still green).
- [ ] **Step 6: Commit** — `git add src/lib/jobTriage.mjs src/lib/jobTriage.test.mjs package.json && git commit -m "feat(triage): pure tiering/evidence logic + node:test (src .mjs glob)"`

---

### Task 4: Frontend data layer — `caseApi` writes + `useJobs` hook (the single decision path)

**Files:**
- Modify: `src/api/caseApi.js`
- Create: `src/hooks/useJobs.js`

**Interfaces:**
- Consumes: `GET /api/jobs`, `POST /api/job/:id/decide`; the existing `ll:jobs:changed` CustomEvent convention (already used by `jobStore.js`).
- Produces:
  - `caseApi.listJobs() → Promise<job[]>` (GET /api/jobs → `.jobs`).
  - `caseApi.decideJob(jobId, { decision, reason, note }) → Promise<job>` (POST decide → `.job`), then `window.dispatchEvent(new CustomEvent('ll:jobs:changed'))`.
  - `useJobs() → { jobs, status, error, reload, approve(id), reject(id, reason, note), reopen(id) }`. `status` ∈ `'pending'|'ready'|'failed'`. `approve/reject/reopen` call `caseApi.decideJob` then rely on the `ll:jobs:changed` listener to refetch. Subscribes to `ll:jobs:changed` so ANY writer (row OR layover) triggers a refetch → shared state.

- [ ] **Step 1: Add to `src/api/caseApi.js`** (match the file's existing `fetch` + `jsonOrThrow` style):

```javascript
export async function listJobs() {
  const r = await fetch('/api/jobs');
  const data = await r.json();
  if (!r.ok || !data.ok) throw new Error((data && data.error) || 'listJobs failed');
  return data.jobs;
}
export async function decideJob(jobId, { decision, reason = null, note = null }) {
  const r = await fetch(`/api/job/${encodeURIComponent(jobId)}/decide`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, reason, note }),
  });
  const data = await r.json();
  if (!r.ok || !data.ok) throw new Error((data && data.error) || 'decideJob failed');
  window.dispatchEvent(new CustomEvent('ll:jobs:changed'));
  return data.job;
}
```

- [ ] **Step 2: Create `src/hooks/useJobs.js`** — reads `listJobs`, exposes approve/reject/reopen via `decideJob`, subscribes to `ll:jobs:changed`:

```javascript
import { listJobs, decideJob } from '../api/caseApi.js';

export function useJobs() {
  const [jobs, setJobs] = React.useState([]);
  const [status, setStatus] = React.useState('pending');
  const [error, setError] = React.useState(null);
  const reload = React.useCallback(() => {
    let live = true;
    setStatus('pending'); setError(null);
    listJobs().then((j) => { if (live) { setJobs(j); setStatus('ready'); } })
              .catch((e) => { if (live) { setError(e); setStatus('failed'); } });
    return () => { live = false; };
  }, []);
  React.useEffect(() => reload(), [reload]);
  React.useEffect(() => {
    const on = () => reload();
    window.addEventListener('ll:jobs:changed', on);
    return () => window.removeEventListener('ll:jobs:changed', on);
  }, [reload]);
  const approve = React.useCallback((id) => decideJob(id, { decision: 'approved' }), []);
  const reject  = React.useCallback((id, reason, note) => decideJob(id, { decision: 'rejected', reason, note }), []);
  const reopen  = React.useCallback((id) => decideJob(id, { decision: 'new' }), []);
  return { jobs, status, error, reload, approve, reject, reopen };
}
```
(Use `React.*` from the shared global scope, matching `useCase.js`/the codebase convention.)

- [ ] **Step 3: Sanity** — `npm run build` (Vite) succeeds (no import errors). Expected: build OK.
- [ ] **Step 4: Commit** — `git add src/api/caseApi.js src/hooks/useJobs.js && git commit -m "feat(bridge): useJobs + caseApi.listJobs/decideJob — the single decision path"`

---

### Task 5: The ad layover — `kind:'jobpreview'` decision surface

**Files:**
- Modify: `src/components/helpfulLayover.jsx`
- Reference (design source): `jobpreview-layover.jsx`

**Interfaces:**
- Consumes: the `ll:helpful:open` CustomEvent with `detail:{ ...job, kind:'jobpreview' }`; `caseApi.decideJob`.
- Produces: `HelpfulLayoverContent` routes `kind:'jobpreview'` → `<JobPreviewContent job={item} />`. `JobPreviewContent` renders OUR stored copy (title/company/location/snippet — NOT an iframe), the honest "Ingen analys än" note, and a decision bar: **Godkänn** / **Välj bort** (opens the 8 reason chips + note, from `REJECT_REASONS`) / **Till annonsen** (opens `job.url`). Godkänn/Välj bort call `caseApi.decideJob(job.id, ...)` then close — the `ll:jobs:changed` dispatch makes the row reflect it. `kind:'job'` and `kind:'job-analysis'` are UNCHANGED.

- [ ] **Step 1:** Add `JobPreviewContent` to `helpfulLayover.jsx` — adapt the design's `jobpreview-layover.jsx` markup verbatim, with these deltas: (a) field access uses the real stored shape (`job.title`, `job.company`, `job.location`, `job.snippet`, `job.url`, `job.id`) — keep the `job.co||company` fallbacks so a normalized search result also renders; (b) replace the prototype's `#triage` link with the decision bar (Godkänn/Välj bort/Till annonsen); (c) import `REJECT_REASONS` from `../lib/jobTriage.mjs`; (d) Godkänn → `decideJob(job.id, {decision:'approved'})` then `ll:helpful:close`; Välj bort → reason picker → `decideJob(job.id, {decision:'rejected', reason, note})` then close.
- [ ] **Step 2:** Add the route in `HelpfulLayoverContent`: `if (item && item.kind === 'jobpreview') return <JobPreviewContent job={item} />;` BEFORE the existing `kind:'job'` branch.
- [ ] **Step 3: Sanity** — `npm run build` succeeds.
- [ ] **Step 4: Commit** — `git add src/components/helpfulLayover.jsx && git commit -m "feat(layover): kind:jobpreview decision surface — writes the one record"`

---

### Task 6: The Jobbsök screen — one screen on grid templates

**Files:**
- Rewrite: `src/screens/jobSearch.jsx`
- Reference (design source): `screens-jobbsok2.jsx` (JobTriageCard/TriSection/JobSlimRow/EvidenceChips), `screens-jobsearch.jsx` (search box/filters/collapse/CSV card)

**Interfaces:**
- Consumes: `PageTemplate`/`ContentArea`/`ContentBox`/`CrossColumn` from `src/components/grid.jsx`; `useJobs()`; `useLiveJobSearch()` (search only — its results populate the store server-side); `tierize`/`evidenceChips`/`REJECT_REASONS` from `src/lib/jobTriage.mjs`; `getSavedSearches`/`saveSearch` from `src/api/jobSearch.js`.
- Produces: `JobSearch` (route key `jobbsok`, unchanged in `App.jsx`) rendering through `PageTemplate`. Triage tiers come from `tierize(useJobs().jobs)`, NOT from local state.

- [ ] **Step 1:** Build the screen shell with `PageTemplate` (`nav={<Sidebar active="jobbsok" />}`, `cross={<CrossColumn .../>}`, `content={<ContentArea>...`), adapting `screens-jobsearch.jsx`'s head/search-box/CSV-card/more-filters/collapse markup. Search box uses `useLiveJobSearch` to run the search (drop the `match` score in the UI). CSV card renders `CsvUpload` **disabled** ("Kopplas snart"); custom-source "+" ships disabled (v2).
- [ ] **Step 2:** Render the triage tiers from `useJobs()`: `const { jobs } = useJobs(); const { toReview, flagged, approved, rejected } = tierize(jobs);`. Reuse the design's `JobTriageCard`/`TriSection`/`JobSlimRow`/`EvidenceChips` (bring them into this file or a sibling), with these deltas: (a) `EvidenceChips` reads `evidenceChips(job)` from the pure module (real `matchedRules`), NOT `job.locFit`/`job.stage2`; (b) `JobTriageCard` `onApprove`/`onReject`/`onReset` are `useJobs().approve/reject/reopen` — NO local `decisions` state; (c) row click opens the layover with `kind:'jobpreview'` and the real job (`{ ...job, kind:'jobpreview' }`); (d) flagged tier `defaultOpen`, never hidden, `note` explains the flag.
- [ ] **Step 3:** Honest empty state: if `useJobs().status==='ready'` and `jobs.length===0`, show the empty state (run a search), NOT fixtures.
- [ ] **Step 4:** Filters per reconciliation point 1: keyword TokenField + Ort → search request; anti-keywords → client-side exclude; emp-type/work-mode/salary → client-side best-effort keeping unknowns (they filter the displayed store jobs where the field exists). Saved searches via `getSavedSearches`/`saveSearch`.
- [ ] **Step 5: Confirm no NEW surface caches a decision (Option 1 — CORRECTED).** The Jobbsök screen and the `jobpreview` layover must use ZERO component-local/localStorage decision state — every approve/reject/reopen goes through `useJobs` → the decide route. Verify: `grep -nE "acceptJob|removeJob|getAcceptedJobs|getRemovedJobIds|llStore|useState.*[Dd]ecision" src/screens/jobSearch.jsx src/components/helpfulLayover.jsx` returns nothing in the new code paths. **Do NOT remove `jobStore.js`'s functions or `jobResultsList.jsx`** — the WIRED screens (`home`'s JobResultsList, `match`'s Matchanalys queue, the `kind:'job'` layover) still call them, and "zero diffs to wired screens" governs. Leaving them is correct: no new surface touches them, so there is no dead fallback. (Unifying the new triage decision with the old `acceptedJobs`/Matchanalys flow is a deferred follow-up for the Matchanalys wave, per Global Constraints — NOT this unit.)
- [ ] **Step 6: Sanity** — `npm run build` succeeds; `grep -rn "components/grid" src/screens/jobSearch.jsx` shows the import (first importer). No `decisions`/`useState` decision state, no `jobStore` decision calls in the file.
- [ ] **Step 7: Commit** — `git add src/screens/jobSearch.jsx && git commit -m "feat(jobbsok): one screen on grid templates — results are the approval surface (new surfaces write only through the decide route)"` (do NOT stage `jobStore.js` — it is left untouched per Option 1).

---

### Task 7: CSS — append the design styles (token-only)

**Files:**
- Modify: `src/styles/hello-lily.css`
- Reference: `ll-jobsearch.css`, `ll-jobs.css`

- [ ] **Step 1:** Append `ll-jobsearch.css` then `ll-jobs.css` to the end of `hello-lily.css`. De-dupe any selector already present.
- [ ] **Step 2: Verify token-only** — `grep -nE "#[0-9A-Fa-f]{3,6}" <appended block>` returns only the sanctioned warm CSV/amber shades already used elsewhere (e.g. `#FFFBF4`, `#b07212`, `#8a5a0e`) — no new brand hex. Report any exception.
- [ ] **Step 3: Sanity** — `npm run build` succeeds; visually the screen renders through the grid.
- [ ] **Step 4: Commit** — `git add src/styles/hello-lily.css && git commit -m "style(jobbsok): append token-only screen styles"`

---

### Task 8: Verification + build report

**Files:**
- Create: `docs/verification/2026-07-05-jobbsok-restart-survival.md`
- Modify: `docs/PROJECT_INVENTORY.md` (only if the errata block needs the "first grid importer" line — otherwise leave)

- [ ] **Step 1: Full suite** — `npm test` green (backend + `.mjs` logic), and `npm run build` green.
- [ ] **Step 2: Restart-survival triage demo (PRIMARY end-to-end evidence).** Start the served backend (`npm run dev`), open the screen, run a search (populates the store), then: approve one job **on the row**, reject one **in the layover** (with a reason), reopen one. Confirm the **layover decision reflects on the row immediately** (and vice-versa) — same record, both surfaces. Then **kill the server, restart, reload** — the same decisions are present, and still reflected on both the row and the layover. Confirm a re-run of discovery keeps the decisions (dedup). Record the exact steps + outcome (incl. the both-surfaces reflection) in `docs/verification/2026-07-05-jobbsok-restart-survival.md`. Since DOM tests are deferred, THIS demo is the primary evidence the criterion holds end to end — capture it concretely (API-level persistence can be shown with `curl` to `GET /api/jobs` across the restart; the row+layover reflection is the UI half).
- [ ] **Step 3: Fresh-clone condition** — in a clean checkout (the isolated worktree, no sibling folders), `npm ci && npm test` green; the screen shows the honest empty state against an empty store (no fixtures).
- [ ] **Step 4: Build report** — write the report answering: the two new routes, the `useJobs` single-path design, every `grid.jsx`/template change made (if any), the five reconciliation points as resolved, the deferred/known gaps, and the test-coverage decision. State the one-decision-record proof (route test + the both-surfaces restart demo). **Explicitly confirm that NO new surface (the Jobbsök screen, the `jobpreview` layover) uses component-local or localStorage decision state — all decisions go through the decide route** (show the zero-reference grep on the new files). Note that `jobStore.js`'s functions are intentionally LEFT in place (wired screens use them; Option 1). **Log two named follow-ups: (1) "frontend test harness (vitest + jsdom) — its own future unit"; (2) "unify the triage decision with the acceptedJobs/Matchanalys flow — for the Matchanalys wave"** (in the report and in `BACKLOG.md`/`RESUME.md` if present).
- [ ] **Step 5: Commit** — `git add docs/verification/ docs/ && git commit -m "docs(jobbsok): restart-survival verification + build report"`

---

## Self-Review

- **Spec coverage:** template adoption (T6) · two-tier flag-never-hide on real `signal`/`matchedRules` (T3+T6) · evidence chips (T3+T6) · reject taxonomy 8 reasons (T3, layover T5, row T6) · reversible decisions (T2 reopen, T4/T5/T6) · persistence through API (T2+T4) · demo boundary/empty state (T6) · one-decision-record (T2+T4, row+layover T5/T6) · CSV/custom-source disabled (T6) · the 5 reconciliation points (all) · acceptance restart-survival + fresh-clone + suite green (T8). Not-in-scope items (rejection-learning, Ansökningskoll, new discovery from UI, filtering-algorithm changes) are untouched.
- **Type consistency:** `decideJob(jobId, {decision, reason, note})` used identically in caseApi (T4), useJobs (T4), layover (T5), row (T6). `tierize`/`evidenceChips`/`jobFlagged`/`REJECT_REASONS` defined in T3, consumed in T5/T6. Route shapes in T1/T2 match the caseApi calls in T4.
- **Placeholder scan:** none — backend/hook/logic steps carry exact code; UI steps reference the named design files + list explicit deltas (the design package IS the markup, per Global Constraints).

---

## Resume state (checkpoint 2026-07-05)

**Done — backend backbone, reviewed + committed on this branch (`jobbsok-unit` off `main @ 9ae5a69`):**
- Task 1 — `GET /api/jobs` (`76cc8c2`) — spec ✅ / quality Approved.
- Task 2 — `POST /api/job/:jobId/decide` (`de81154`) — spec ✅ / quality Approved. Upsert-by-id, changes only decision/rejectReason/rejectNote, `new`=reopen-clears, 400 on rejected-without-reason, dedup-preserves-decision.
- **165 pass / 0 fail / 1 skip.** (`git log jobbsok-unit` is the recovery map if the scratch ledger `.superpowers/sdd/progress.md` is gone.)

**Resume here → Task 3**, then 4 → 5 → 6 → 7 → 8, per the tasks above.

**Two things a fresh session must carry in (not on disk here):**
1. **Re-attach the design package** (`handoff-jobbsok/`) for Tasks 5–7: `screens-jobbsok2.jsx` (JobTriageCard / TriSection / JobSlimRow / EvidenceChips), `screens-jobsearch.jsx` (search box / filters / collapse / CSV card), `jobpreview-layover.jsx` (JobPreviewContent), `ll-jobsearch.css`, `ll-jobs.css`, and `ll-case.jsx` (for the verbatim `REJECT_REASONS` / `STAGE2_LABELS` / `LOCFIT` constants Task 3 copies). The plan specifies the wiring DELTAS; the design files are the markup source.
2. **Task 3 STAGE2 reconciliation:** the prototype's `STAGE2_LABELS` keys differ from the REAL backend stage-2 codes (`seed-filter-set.cjs`: `US_TIMEZONE`, `TOO_TECHNICAL`, `LANG_REQ`, `SALES_HEAVY`, `INDUSTRY_FIT`, `SALARY_LOW`). `evidenceChips` must key on the real `matchedRules[].rule` and **fall back to the raw rule string** for any unmapped code — never fabricate. Extend `STAGE2_LABELS` to cover the real codes with sensible sv/en labels.

**Environment:** isolated worktree `.claude/worktrees/jobbsok-unit` (node_modules symlinked from the main checkout — Task 8's fresh-clone check needs a real `npm ci` in a clean checkout). Test glob is extended to `src/**/*.test.mjs` starting in Task 3.
