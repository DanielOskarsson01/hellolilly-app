# Stream 2 Data Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One real case flows end-to-end through the UI on live backend data — no fixtures — with the store surviving restarts.

**Architecture:** Add the two missing HTTP capabilities (case creation, research/decode) to the existing `node:http` dev server; add JSON-file snapshot persistence behind the store's existing method signatures; build a `useCase()` fetch/hook layer in `src/`; then rebind six BUILT screens (Matchanalys, CV builder, Cover letter, Jobbsök, Home, Activity) from fixtures/localStorage to the real case parts (`fit`, `gaps`, `cvDraft`, `coverLetter`, part-status envelopes). Jobbsök's backend route is rewired from the OnlyiGaming sibling repo to the in-repo `job-discovery` submodule (removes seam B5).

**Tech Stack:** Node >=22 (`node:http`, `node --test`), React 19 JSX (no TS), Vite 5 middleware mode, localStorage + CustomEvent sync (existing pattern).

## Context

The HelloLilly backend core loop is BUILT (researcher → decoder → gap-analyzer → cv-builder/writer, 6 API routes, in-memory store) but **no frontend screen calls it** — every screen renders `strategyData.js` fixtures, localStorage, or browser-direct external APIs (PROJECT_INVENTORY seam A). This plan is Stream 2 of the build kickoff: the data bridge. Decisions already made by Daniel: persistence = **JSON file snapshot**; scope = **all six BUILT surfaces**.

## Global Constraints

- Screens keep their existing markup/CSS classes — this stream **wires data, it does not redesign** (Stream 1 owns design). Minimal-diff JSX edits.
- Every `match` in fit cites a resolvable datafact; the fill-gap loop's honest "stays_gap" path must be surfaced in UI, never hidden.
- No coupling to OnlyiGaming production repos (DEVELOPMENT_PLAN Rule 2). The `/api/jobs/search` sibling-repo require is *removed*, not extended.
- Part envelope everywhere: `{ status: 'absent'|'pending'|'ready'|'failed', data, error?, updatedAt }`. UI loading/empty/error maps 1:1 to it.
- Backend changes are TDD'd via `npm test` (`node --test "server/**/*.test.cjs" "scripts/**/*.test.cjs"`), all LLM/search/http mocked. Frontend has no test harness — verify via the running app (Preview tools) instead; do not add a test framework this stream.
- Store snapshot file `server/data/store.json` is local state: gitignore `server/data/`.
- Commit per task. Swedish UI strings, matching each screen's existing tone.

---

### Task 1: Store `snapshot()` / `hydrate()`

**Files:**
- Modify: `server/skeleton/store/index.cjs` (add two methods to the returned store object)
- Test: `server/skeleton/store/persistence.test.cjs` (new; also used by Task 2)

**Interfaces:**
- Produces: `store.snapshot() -> { version: 1, cases: [[id, case]], datafacts: [[id, fact]], collections: { name: [[id, record]] } }` (plain JSON-safe data, detached). `store.hydrate(snap)` replaces the three maps' contents (scratch is deliberately NOT persisted — private working state).

**Steps:**
- [ ] Write failing tests: snapshot→hydrate round-trip preserves a created case (with written part), ingested datafacts, and collection records; hydrated store returns detached copies; scratch excluded.
- [ ] Run `npm test` — expect FAIL (method not defined).
- [ ] Implement `snapshot()`/`hydrate()` inside `createStore()` using the existing `detach` helper. Keep every existing signature untouched.
- [ ] Run `npm test` — PASS. Commit `feat(store): snapshot/hydrate for persistence`.

### Task 2: JSON-file persistence wrapper + host `store` option

**Files:**
- Create: `server/skeleton/store/persistence.cjs`
- Modify: `server/skeleton/host.cjs` (accept `opts.store`, default `createStore()`)
- Modify: `.gitignore` (add `server/data/`)
- Test: `server/skeleton/store/persistence.test.cjs`

**Interfaces:**
- Produces: `createPersistentStore({ path, debounceMs = 300 }) -> store` — a `createStore()` hydrated from `path` when the file exists, whose mutating methods (`createCase, writePart, setPartStatus, ingestDatafact, putRecord, removeRecord`) schedule a debounced atomic snapshot write (tmp file + `fs.renameSync`); plus `store.flush()` (synchronous save-now, used at process exit and in tests). Corrupt/unreadable snapshot → warn loudly and start empty (never crash the server), keeping a `.corrupt` backup of the bad file.
- `createHost({ ..., store })` — additive option; all existing callers unchanged.

**Steps:**
- [ ] Failing tests: mutation triggers save (debounceMs 0 or `flush()`); "restart" (new `createPersistentStore` on same path) recovers cases/datafacts/collections; corrupt file → empty store, no throw.
- [ ] Implement wrapper + host option. Run `npm test` — PASS.
- [ ] Commit `feat(store): JSON-file snapshot persistence`.

### Task 3: New case routes — create, list, research

**Files:**
- Modify: `server/dev-server.cjs` (extend `createApiHandler` regex/dispatch; wire persistent store; seed datafacts only when pool empty; `--env-file-if-exists=.env` in the `dev` script)
- Modify: `package.json` (`"dev": "node --env-file-if-exists=.env server/dev-server.cjs"`)
- Test: `server/api.test.cjs` (extend, same mock style)

**Interfaces (produces):**
- `POST /api/case` body `{ company, role, sourceInput?, url? }` → `201 { ok:true, case:{ ...meta } }`; missing company/role → `400 { ok:false, error }`. Uses `host.store.createCase({ company, role, sourceInput })`.
- `GET /api/cases` → `200 { ok:true, cases:[{ meta, parts:{ dossiers, decodedRole, fit, gaps, cvDraft, coverLetter } }] }` where each `parts.x` is that part's `status` string. Uses `host.store.listCases()`.
- `POST /api/case/:id/research` → `host.invoke('researcher', { caseId })` → `200 { ok:true, fronts, decoded }`; researcher partial (`ok:false, partial:true`) → `207` with body; no case → `404`; thrown → `500`.
- Dev server boots: `createPersistentStore({ path: process.env.STORE_PATH || 'server/data/store.json' })` → `createHost({ store, llm })`; `seedDatafacts(host.store)` only if `listDatafacts().length === 0`; `flush()` on SIGINT/SIGTERM/exit.

**Steps:**
- [ ] Failing tests: create (201 + meta echo, 400 on missing fields), list (statuses reflect written parts), research (mock llm+search through `createHost` injection → decodedRole ready; researcher-partial → 207).
- [ ] Extend the case-route regex `^/api/case/([^/]+)(\/analyze|\/generate|\/gap\/([^/]+)\/answer|\/research)?$` + exact-match `POST /api/case` and `GET /api/cases`; implement handlers; wire persistence + conditional seeding.
- [ ] `npm test` — PASS. Commit `feat(api): case create/list/research routes + persistent store`.

### Task 4: `/api/jobs/search` → in-repo `job-discovery` (seam B5 removed)

**Files:**
- Modify: `server/submodules/job-discovery/execute.cjs` (additive: return `items[]` — the canonical records seen this run, new + dedup-hit — alongside existing counts)
- Modify: `server/dev-server.cjs` (drop `PIPELINE_MODULES_DIR` + lazy sibling require; `runJobSearch` now: build `filterSet/active` from request body — searchTerms/providers/maxResults/municipality, preserving reject rules from `docs/candidate_preferences.json` when present — `putRecord`, `host.invoke('job-discovery', {})`, normalize `items` to the UI job shape with the existing `normalizeJob`-style mapper; move the route into `createApiHandler` so tests can reach it)
- Test: `server/skeleton/job-discovery.test.cjs` (extend: `items` returned), `server/api.test.cjs` (new: route with fake `http` via `createHost({ http })`)

**Interfaces:**
- Consumes: request body `{ keywords, sources, maxResults, municipality }` (what `src/api/jobSearch.js` already sends conceptually).
- Produces: `200 { ok:true, jobs:[{ id, co, t, city, type, source, url, snippet, tags, match, when, hot, logo }], summary, meta }` — the exact shape `jobResultsList.jsx`/`jobStore.js` already consume.

**Steps:**
- [ ] Failing tests (submodule `items`; route happy path + provider-error path with fake http).
- [ ] Implement; delete the sibling-repo path entirely. `npm test` — PASS.
- [ ] Commit `feat(api): jobs/search via in-repo job-discovery, drop sibling-repo dependency`.

### Task 5: Frontend bridge — `caseApi.js`, `useCase()`, job↔case linkage

**Files:**
- Create: `src/api/caseApi.js` — `createCase(payload)`, `listCases()`, `getCase(id)`, `research(id)`, `analyze(id)`, `answerGap(id, gapId, { answer, requirementId, tags })`, `generate(id)`. Plain `fetch('/api/...')`, JSON in/out, non-2xx → throw `Error(body.error)` (207 returns body with `ok:false`, not a throw).
- Create: `src/hooks/useCase.js` — `useCase(caseId)` → `{ caseData, loading, error, refresh, running, actions }`. Fetches on mount/caseId change; re-fetches on `ll:case:changed` CustomEvent + polls every 2.5s while any part is `pending` (research/analyze POSTs are synchronous server-side, polling animates part-status progress). Each `actions.x()` wraps the caseApi call, dispatches `ll:case:changed` after, tracks `running.research|analyze|generate|answerGap` booleans.
- Modify: `src/utils/jobStore.js` — new key `hellolilly:active-case`; helpers `getActiveCaseId()/setActiveCaseId(id)`; `setJobCase(jobId, caseId)` + `caseId` field surviving `compactJob`; all writes keep dispatching `ll:jobs:changed`.

**Interfaces:**
- Produces (later tasks rely on): `useCase(caseId)` return shape above; `getActiveCaseId()`; `setJobCase`. Case parts read as envelopes: `caseData.fit.status`, `caseData.fit.data`, etc.

**Steps:**
- [ ] Implement the three files (no test harness — verified through Tasks 6-10 in the browser).
- [ ] Commit `feat(bridge): caseApi + useCase hook + job-case linkage`.

### Task 6: Matchanalys wired (the core rebind)

**Files:**
- Modify: `src/screens/match.jsx` — "Analysera" flow: if job lacks `caseId` → `createCase({ company: job.co, role: job.t, sourceInput: job.snippet, url: job.url })` → `setJobCase` + `setActiveCaseId`; open the analysis layover with `{ kind:'job-analysis', job, caseId }`. Match badge: real `%` = matched/total from `fit` when ready, else "—" (drop the hardcoded 76 fallback for case-linked jobs).
- Modify: `src/components/helpfulLayover.jsx` — `JobAnalysisContent`: replace the setTimeout fake with the real sequence (research if `decodedRole` absent → analyze), step indicators driven by real part statuses from `useCase(caseId)`; `MatchAnalysisContent`: render real `fit.data.capability.requirements` (match/partial/missing rows + evidence) + `gaps.data` instead of `MATCH_DETAILS`; delete the fixture. **Fill-gap UI per gap:** bridge `oneLiner`/`body` + textarea + "Skicka svar" → `answerGap(caseId, gap.id, { answer, requirementId })`; outcome `accepted` → show minted-datafact confirmation + refreshed fit; `stays_gap` → honest "kvarstår som lucka" message, gap stays visible. After analyze completes, fire `generate()` in the background (per A2 reconciled design) — errors surfaced, not swallowed.

**Interfaces:**
- Consumes: Task 5's `useCase`, `caseApi`; Task 3's routes. `fit.data.capability.requirements[]` = `{ requirementRef, evidence, evidenceRef?, status }`; `gaps.data[]` = `{ id, what, why, bridge:{ oneLiner, body, kind }, provenance }`. The gap→requirement link needed by `answerGap` comes from matching the gap to its `missing`/`partial` requirement (gap-analyzer output; confirm exact field at implementation and pass `requirementId` accordingly).

**Steps:**
- [ ] Implement; verify in the running app with a seeded/mocked-llm path first if keys are absent, then live.
- [ ] Commit `feat(match): Matchanalys runs real research/analyze/fill-gap`.

### Task 7: CV builder wired

**Files:**
- Modify: `src/screens/cvActivity.jsx` (`CVBuilder` component only) — right-hand CV paper renders `cvDraft.data.sections[].items[].text` grouped by `heading` for the active case (`useCase(getActiveCaseId())`); header name/contact from `meta` (fall back to current static contact block where the draft has no such section). Part-status states: `absent` → empty state "Kör en matchanalys först" linking `#match`; `pending` → existing typing/wave indicator; `failed` → error + "Försök igen" → `actions.generate()`; `ready` → sections. Remove the `CV_SECTIONS`/`CASE_PROFILE`/`PIPELINE_RUN` reads from the preview pane (intake chat column keeps its current static content — it is Stream 1's redesign surface).

**Steps:**
- [ ] Implement, verify in app (all four envelope states). Commit `feat(cv): CV preview renders real cvDraft`.

### Task 8: Cover letter wired

**Files:**
- Modify: `src/screens/coverLetter.jsx` — letter preview renders `coverLetter.data.paragraphs[]`; recipient/role from `meta`; **`unsupported_by_cv[]` rendered as a visible honesty panel** ("Påståenden att granska innan du skickar") when non-empty; same four envelope states; "Försök igen"/regenerate → `actions.generate()`.

**Steps:**
- [ ] Implement, verify in app. Commit `feat(letter): cover letter renders real coverLetter + honesty panel`.

### Task 9: Jobbsök on the backend route

**Files:**
- Modify: `src/api/jobSearch.js` — `searchJobs(query)` now POSTs `/api/jobs/search` (Task 4) and returns its `jobs/summary/meta`; delete the browser-direct provider fetch/normalize/score code paths it replaces. Keep the exported query-normalization helpers that `jobStore`/screens use.
- Modify (only if needed): `src/hooks/useLiveJobSearch.js`, `src/screens/jobSearch.jsx` — signatures should be unchanged.

**Steps:**
- [ ] Implement; verify search + save + accept flows in app (jobs now also land in the backend `jobs` collection, persisted). Commit `feat(jobbsok): search through the HelloLilly backend`.

### Task 10: Home + Activity derive from real case state

**Files:**
- Modify: `src/screens/home.jsx` — score card = real match % when active case has `fit` ready (else honest empty); next-action card derived from part statuses (no case → "Sök & acceptera ett jobb"; no fit → "Analysera"; open gaps → "Fyll luckor i Matchanalys"; drafts ready → "Granska CV & brev"); tool cards keep layout, status badges from part envelopes. Fixture-driven blocks with no real counterpart keep rendering but must not fake case-specific numbers.
- Modify: `src/screens/cvActivity.jsx` (`ActivityTracker`) — replace `CASE_RECORD.timeline` with a derived strip: one row per case part with status ≠ absent (`updatedAt`, part label, status), newest first, across `listCases()`; `activityCount` = count of ready parts. No invented timestamps.

**Steps:**
- [ ] Implement, verify in app. Commit `feat(home,activity): derive from real case-part statuses`.

### Task 11: End-to-end acceptance + docs

**Steps:**
- [ ] `npm test` fully green.
- [ ] Live run (needs `ANTHROPIC_API_KEY` + `PERPLEXITY_API_KEY` in `.env`): `npm run dev` → Jobbsök search (real backend) → accept a job → Matchanalys → Analysera (real research + analyze) → answer one gap (both outcomes if possible) → background generate → CV + Letter screens show real drafts → **restart the server** → case still there (persistence proven).
- [ ] Update `RESUME.md` (## Now / detours / notes) and add a short `docs/STREAM2_BRIDGE.md`: the bridge surface (`useCase`, events, routes incl. the new ones) for the Stream 1 design model + Stream 3.
- [ ] Final review (code-review skill), then finishing-a-development-branch (merge/PR decision with Daniel).

## Verification

- Backend: `npm test` (all mocked; new tests in `persistence.test.cjs`, `api.test.cjs`, `job-discovery.test.cjs`).
- Frontend: run `npm run dev`, drive the six screens via the preview browser; check each part-envelope state renders (absent/pending/failed/ready).
- Acceptance: the Task 11 live case + restart-survival check — this is the stream's "done when".

## Open items carried from the handoff (resolved here)

- Canonical CV seed: `scripts/seed-datafacts.cjs` already reads `JobSearch/CVs/cv-source/en/cv_data.json` (the A2 design's open item #9 — cv-source/en is what the code uses; keep it; sibling-file absence already warn-skips in tests).
- `preferences` for analyze come from `docs/candidate_preferences.json` (gitignored, present on this machine) — unchanged.
