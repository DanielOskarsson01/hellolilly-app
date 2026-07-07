# Wave 1 — Backend Build Brief (Claude Code)

**Date:** 2026-07-07 · **Scope:** the backend slice of Wave 1 ("wire what is built, log what happens") from `REST_OF_SITE_RECONCILED_DESIGN.md` §5. Frontend screens are a separate brief (the A2 two-brief pattern).
**Source of truth:** `REST_OF_SITE_RECONCILED_DESIGN.md` + `REST_OF_SITE_DATA_CONTRACT_ADDENDUM.md`. Where this brief and those disagree, they win.
**Runs FROM the Ansökningskoll merge (amended — decided by Daniel, 2026-07-08):** this backend slice no longer waits for the whole frontier. It starts as soon as the Ansökningskoll work merges and runs IN PARALLEL with CSV upload and the honesty pass (it is deterministic, LLM-free and frontier-untouching — it touches nothing they touch). It cannot start before Ansökningskoll merges — both edit the same server file. The Wave-1 SCREENS keep the original precondition (they follow the honesty pass, after the frontier completes). Nothing here blocks that work; every week without the activity collection is learning-layer data lost forever.
**Discipline:** TDD throughout (`node --test`, patterns in `server/api.test.cjs` / `server/skeleton/collections.test.cjs`); scope-and-report on anything larger than scoped; commit a run-artifact note per live verification (`docs/verification/`).

## The one paragraph to internalise

Wave 1's backend is **LLM-free and deterministic**. Research Helper and Interview Prep intake turned out (repo inspection) to need almost no backend — their endpoints exist and already serve everything their screens read. The real work is the logging-and-reading layer: two small collections (`activity`, `planner`), one emission helper at the API chokepoint, two derived read models (`homeSummary`, `caseRecord`), and the shared conventions they ride on. Build order below puts the collections first so the D1/D2 screens emit events from the day they ship.

## D1 dependency — one statement for the whole brief

**D1 (durable store) has LANDED on main**: SQLite adapter behind unchanged `createStore()` signatures, `store-bootstrap.cjs` (default `sqlite`), idempotent seeding, `/api/health` reporting durability. Therefore no Wave-1 item waits on a D1 work package. The standing obligation is the inverse: **every item below is built store-agnostic through the `createStore()` interface signatures** — no code may assume in-memory (no reseed-on-boot logic, no "it'll be empty at start" shortcuts) and none may assume SQLite specifically (talk to the store interface, never to the adapter). Collections persist through the adapter's existing snapshot/record machinery; every new collection gets a restart-survival test (the Jobbsök durability-proof pattern).

## Build order

1. Shared status-envelope API conventions (item G)
2. `activity` + `planner` collections + shared activity logging (items C + F)
3. `homeSummary` read model (item E)
4. `caseRecord` read model (item D)
5. Research Helper wiring support (item A)
6. Interview Prep intake wiring support (item B)

---

## Item A — Research Helper UI backend wiring support

**What inspection found:** `POST /api/case` + `POST /api/case/:id/research` + `GET /api/case/:id` (which **does** serve `dossiers` incl. drill-appended paragraphs) already cover the tool. Missing: the intake record that makes research a user-visible, listable tool with purpose presets, and one convenience route.

- **Files likely to touch:** `server/dev-server.cjs` (routes; follow the existing inline-handler pattern — extract to `server/api/*.cjs` only if the file's growth demands it, scope-and-report), `server/skeleton/ids.cjs` (KINDS + `researchRequest`, `companyResearch`), `server/api.test.cjs` or a new `server/research-request.test.cjs`.
- **Endpoints:**
  - ADD `POST /api/research-request` — body `{ company, role?, purpose, sourceInput? }` → creates the `researchRequest` record, creates the case (`meta.company/role/sourceInput`), kicks the researcher (same invocation path `/research` uses), returns `{ ok, request, caseId }`. Purpose is stored; it selects nothing server-side (presets are presentation).
  - ADD `GET /api/research-requests` — list for the intake screen's history.
  - MODIFY nothing on the existing case routes.
- **Collections/case parts to add:** `researchRequests` (addendum §7), `companyResearch` (addendum §4 — created here as a shape + write path; first consumer is B1 in Wave 2). No case-part changes.
- **Submodules to call:** `researcher` (which summons `decoder` itself, existing behaviour). No new submodules.
- **Data shapes:** addendum §7, §4.
- **Tests:** request→case→dossiers-ready happy path (mock llm/search, as `a1.test.cjs` does); **null-role research** (create with `role` absent — assert `createCase` and the researcher path handle it; reconciled-design D1 risk); request `status` mirror follows the case envelopes (`running`→`done`, and `failed` carries `error`); restart-survival of `researchRequests`.
- **Fixtures to remove/quarantine:** none backend-side. (The ComingSoon at nav `researchstod` is replaced by the frontend brief, not this one.)
- **Acceptance criteria:** a research request created through the API alone produces a case whose `dossiers`/`decodedRole` envelopes a screen can poll via existing `useCase()`; the request record lists with an honest status; `research.completed` activity emits on success (item F); everything survives a server restart.
- **What NOT to build:** no dossier-section-selection server-side (presets are frontend presentation); no scheduled/refresh research; no company entity resolution; no UI.
- **D1 dependency:** satisfied (see header); store-agnostic build mandatory.

## Item B — Interview Prep intake backend wiring support

**What inspection found:** stages 1–3 are fully served: `POST /api/case` (paste-ad intake via `meta.sourceInput`), `POST /api/job/:id/case` (pick-a-job link, stamps `caseId` on the job record), `/research` produces `dossiers` + `decodedRole`, `GET /api/case/:id` serves both, `GET /api/cases` + `GET /api/jobs` feed pickers. `prep`/`cards`/`liveLog`/`postMortem` parts exist as absent envelopes with no producers — correct: stages 4–6 belong to the interview-prep concept's own plan.

- **Files likely to touch:** `server/api.test.cjs` (tests only, most likely). Possibly `server/dev-server.cjs` if the shared intake convenience of Item A is generalised (`source: 'prep-intake'` param) — builder's judgment, scope-and-report.
- **Endpoints:** none to add. MODIFY only if generalising Item A's route.
- **Collections/case parts to add:** none.
- **Submodules to call:** existing (`researcher`→`decoder`).
- **Data shapes:** DATA_CONTRACT v0.4 (`decodedRole`, `dossiers`) unchanged.
- **Tests:** the full intake path as the screen will drive it: pick job → link case → research → `decodedRole.data.requirements[]` non-empty and served; paste-ad path (no job) equivalent; job record carries `caseId` after link (already partly covered — extend, don't duplicate).
- **Fixtures to remove/quarantine:** none backend-side (killing `interview.jsx`'s fake trainer is Wave 3's A2; the prep-intake ComingSoon is the frontend brief's).
- **Acceptance criteria:** both intake paths (job-pick, paste) produce a case a screen can render stages 1–3 from using only existing endpoints + `useCase()`; `prep.intake_created` activity emits on intake-case creation (item F).
- **What NOT to build:** ANY stage 4–6 producer (`prep`, `cards`, `liveLog`, `postMortem` stay absent envelopes); no decoder-view-specific endpoint (the screen reads `decodedRole` as served); no T5 panel plumbing (Wave 4).
- **D1 dependency:** satisfied; store-agnostic build mandatory.

## Item C — Progress Support backend

**What inspection found:** no `activity` collection exists. `useActivityRows()` (frontend) derives rows from case-part statuses — insufficient for the tool (no non-case events, no hide, no planner) and it retires when A1's screen ships (frontend brief). The stored-events decision is design-doc B-1.

- **Files likely to touch:** `server/dev-server.cjs`, `server/skeleton/ids.cjs` (KINDS: `activity`, `plannerItem`), new `server/activity.cjs` + `server/planner.cjs` (pure helpers: emission, next-step rule) with co-located tests, `server/api.test.cjs`.
- **Endpoints:**
  - ADD `GET /api/activity` — query `week?` (ISO week) and `includeHidden?` (default false); returns records newest-first.
  - ADD `POST /api/activity/:id/hide` and `POST /api/activity/:id/unhide`.
  - ADD `GET /api/planner/today` — returns today's `plannerItem`, **suggest-on-read**: if none exists for today, run the deterministic rule (oldest unfinished thread wins — precedence: overdue `followUpOn` (reserved, Wave 2) → case with `fit` ready but letter not generated → case with gaps unanswered → research done but never opened (activity-based) → fallback: none), persist the suggestion, return it. Max one `suggested` per day, enforced at write.
  - ADD `POST /api/planner/:id/done` · `/snooze` (body `{until}`) · `/dismiss`. `done` emits `nextstep.completed`.
- **Collections/case parts to add:** `activity` (addendum §1), `planner` (addendum §2). No case-part changes.
- **Submodules to call:** none. **No LLM anywhere in this item.**
- **Data shapes:** addendum §1, §2, taxonomy §T.
- **Tests:** emission writes exactly the taxonomy fields (event/params/target, no prose); hide round-trip; one-suggestion-per-day invariant (double GET → same record); each next-step precedence rule with fixture store states; snooze moves `forDay`; restart-survival for both collections; hidden events excluded from default GET but present with `includeHidden`.
- **Fixtures to remove/quarantine:** none created — and the acceptance inverse: NO seed/backfill of synthetic history unless Daniel opts in (open question 2 in the design doc; default = start clean).
- **Acceptance criteria:** after one triage decision + one analyze + one generate through the API, `GET /api/activity` shows the three taxonomy events with correct params; a fresh server restart preserves them; `GET /api/planner/today` returns one defensible suggestion and repeats it idempotently all day.
- **What NOT to build:** push notifications, streaks, ML/LLM prioritisation, weekly email, coach visibility, an activity-authoring API (system-emit only), backfill.
- **D1 dependency:** satisfied; store-agnostic; the restart-survival tests are the proof.

## Item D — Case Record backend read model

- **Files likely to touch:** `server/dev-server.cjs`, new `server/case-record.cjs` (the merge/derive function, pure over store reads) + test.
- **Endpoints:** ADD `GET /api/case-record` — owner-scoped; optional `kind?` filter (chip: `cv|ansokningar|jobb|research|studieplan|aktivitet`).
- **Collections/case parts to add:** none — DERIVED (addendum §19b). It merges: case-part transitions (from part `updatedAt` + status), non-hidden `activity`, and (as they come to exist in later waves) collection milestones. Wave 1 sources: cases + activity + jobs decisions only — the merge function takes a source list so Wave 2/3 collections plug in without reshaping.
- **Submodules to call:** none.
- **Data shapes:** addendum §19b — envelope-per-block; `coachNotes` block hard-coded `{status:'absent'}` (the honest empty section) until a real coach exists.
- **Tests:** chronological ordering across sources; kind-filtering; hidden activity excluded; `coachNotes` absent; a store with zero cases yields an honest empty spine (not an error).
- **Fixtures to remove/quarantine:** `coach.jsx`'s fixture CoachWorkspace is NOT touched here (D3-bannered fate, Wave 4 / honesty pass) — noted so nobody "helpfully" wires it to this endpoint: the coach VARIANT ships only with a pilot coach.
- **Acceptance criteria:** the endpoint alone can back the wireframe's Ärendevy (spine + chips + honest coach-notes emptiness) with no frontend fixture.
- **What NOT to build:** any stored record; coach-notes storage; sharing/permissions; pagination beyond a simple `limit` (single-user volumes).
- **D1 dependency:** satisfied; derived endpoints read through the same store interface.

## Item E — Home summary backend

- **Files likely to touch:** `server/dev-server.cjs`, new `server/home-summary.cjs` + test.
- **Endpoints:** ADD `GET /api/home` (addendum §19): blocks `nextStep` (reads item C's planner), `counts` (`newMatchingJobs` from the jobs collection [undecided, current filterSet], `awaitingReply` [0 in Wave 1 — sources arrive with Wave 2 collections; the block computes from what exists and says so via params, never hardcodes], `practiceThisWeek` [0 until Wave 3]), `entries` (the tool registry with tier/state per design-doc B-3 labelling), `activeCase`.
- **Collections/case parts to add:** none — DERIVED. The `entries` registry is a small server-side constant module (`server/tool-registry.cjs`) so tier labels have one honest source.
- **Submodules to call:** none.
- **Data shapes:** addendum §19.
- **Tests:** envelope-per-block degradation (force one source to throw → that block `failed`, others `ready`); counts recomputable (insert records → counts move); `activeCase` derivation.
- **Active-case note (flagged decision):** the current pointer is client-side localStorage (`hellolilly:active-case`, a pre-rule remnant). RECOMMENDED: derive `activeCase` server-side as the most-recently-updated non-done case, accept an optional `?caseId=` override during transition, and let the frontend brief retire the localStorage pointer. Do not ADD any new client-side state (non-negotiable).
- **Fixtures to remove/quarantine:** none backend-side; Home's six `DemoBar` fixture panes die in the frontend rebuild (H1), which this endpoint enables.
- **Acceptance criteria:** every number the endpoint returns is recomputed from real records at read time; a screen bound to it can render the wireframe's "Ärliga siffror (bara riktiga)" panel with zero frontend-invented values.
- **What NOT to build:** stored summaries/caches; per-tool badge counts; anything that renders a number it cannot recompute on demand.
- **D1 dependency:** satisfied; store-agnostic.

## Item F — Shared activity logging (the emission mechanism)

- **Files likely to touch:** new `server/activity.cjs` (`emitActivity(store, { owner, event, sourceTool, target, params, caseRef? })` — validates against the §T taxonomy, stamps id/`dayKey`/`createdAt`, `putRecord`) + instrumentation inside `server/dev-server.cjs` handlers.
- **Instrumentation points (Wave 1 set):**
  - `POST /api/job/:id/decide` → `job.approved` / `job.rejected` (+ reasonCode param)
  - `POST /api/case/:id/research` (and Item A's route) → `research.completed` on success
  - researcher drill path → `research.drilled`
  - `POST /api/case/:id/analyze` → `case.analyzed`
  - `POST /api/case/:id/gap/:gapId/answer` → `gap.answered` (outcome param)
  - `POST /api/case/:id/generate` → `cv.generated` + `letter.generated`
  - `POST /api/case/:id/letter-draft` → `letter.draft_saved`
  - intake case creation (Items A/B) → `prep.intake_created` (prep source only)
  - planner `done` → `nextstep.completed`
- **Emission rules (normative, from the addendum):** host/API layer ONLY, after success, never speculative; **submodules never emit** (least-privilege stands; no new capability); events carry i18n params, never prose (no gate exposure by construction); failures to emit must not fail the parent operation (log + continue — the action's success is the user's truth; but test that emission normally happens).
- **Tests:** one test per instrumentation point (operation → exactly-one correctly-shaped event); taxonomy validation rejects unknown event names; emission failure does not break the parent handler.
- **Fixtures to remove/quarantine:** n/a.
- **Acceptance criteria:** running the existing core-loop demo flow end-to-end produces the full expected event trail, restart-durable.
- **What NOT to build:** a submodule capability for activity; batching/queues; event schemas beyond §T (reserved ◇ rows are NOT emitted yet).
- **D1 dependency:** satisfied; store-agnostic.

## Item G — Shared status-envelope API behavior

- **Files likely to touch:** new `server/api-conventions.cjs` (or extend existing helpers in `dev-server.cjs`): `deriveBlock(fn)` → `{status:'ready',data}` / `{status:'failed',error}` (never throws through), list-response helper `{ok:true,records}`, error helper `{ok:false,error}` (both already implicit in dev-server — make them explicit and shared), plus doc comments tying them to DATA_CONTRACT §2.2.
- **Behaviors (normative):**
  1. Case parts pass through as stored envelopes, untouched (existing behaviour, keep).
  2. DERIVED endpoints (`/api/home`, `/api/case-record`) return **envelope-per-block**; a failing block is `failed` with `error`, siblings still `ready` — no all-or-nothing 500s for partial derivations.
  3. Collection list/mutation endpoints use the shared `{ok,…}` shapes; a mutation returns the updated record.
  4. Long-running sub-payloads inside records (addendum convention (a): `message`, `draft`, `assist`, `feedback`, image `variant`) reuse the envelope shape verbatim — the frontend's `partGate`/`partSlot` scaffolding then works on collections too. (Wave 1 defines the helper; Wave 2/3 shapes consume it.)
- **Tests:** `deriveBlock` isolates failures; response-shape conformance for every new Wave-1 endpoint (assert against a tiny shared schema-check util, not by hand per test).
- **Acceptance criteria:** every new endpoint in this brief passes the conformance tests; `useCase()`'s envelope mapping needs zero special-casing for the new endpoints.
- **What NOT to build:** a general middleware framework; OpenAPI; versioning. Small helpers, used everywhere, nothing clever.
- **D1 dependency:** satisfied; conventions are storage-independent by definition.

---

## Cross-cutting acceptance for the whole wave

1. `npm test` green; every new module has co-located tests; restart-survival proven for `activity`, `planner`, `researchRequests`.
2. No new localStorage anywhere; no browser-direct external calls introduced (Wave 1 backend makes zero external calls at all beyond the existing researcher path).
3. No LLM invocations added by this wave's backend; no authored prose enters any collection (i18n keys + params only) — the writing-rules gate is therefore never bypassed because it is never needed; any deviation = scope-and-report.
4. Nothing assumes in-memory persistence; nothing assumes SQLite; all store access through the `createStore()` interface signatures.
5. No Amir/fixture data enters any new collection; `demoFixtures`/`conceptPanels` are NOT built in this wave (Wave 4).
6. The current frontier (Ansökningskoll, CSV upload, honesty pass) is untouched; the reserved ◇ taxonomy rows are not emitted.
7. Scope expansions reported before implementation (non-negotiable).
