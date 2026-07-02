# Stream 2 — The Data Bridge (built 2026-07-03)

**What this is:** the wiring layer between the React frontend and the HelloLilly backend, built per `docs/superpowers/plans/2026-07-03-stream2-data-bridge.md`. One real case has flowed end-to-end through the UI on live backend data (Brightsales Marknadschef, 2026-07-03: search → accept → research → decode → analyze 58%/12 krav → stays_gap fill answer → cvDraft 8 sections + coverLetter 5 paragraphs + honesty panel → server restart → everything still there). This doc is the map for Stream 1 (design) and Stream 3 (new tools).

## The pattern every new tool follows

```
screen -> useCase()/useActiveCase() (src/hooks/useCase.js)
       -> caseApi (src/api/caseApi.js, plain fetch, same origin)
       -> dev-server route (server/dev-server.cjs createApiHandler)
       -> host.invoke('<submodule>') through the skeleton broker
       -> case parts as status envelopes { status: absent|pending|ready|failed, data, error?, updatedAt }
```

- UI loading/empty/error scaffolding maps 1:1 to the envelope status. Render `absent` as an honest empty state, never a fixture.
- Cross-screen sync: actions dispatch `ll:case:changed` (CustomEvent, same pattern as jobStore's `ll:jobs:changed`). `useCase` polls every 2.5 s while a part is `pending` or one of its own POSTs is in flight — that is what animates long server-side runs.
- The job ↔ case link: `acceptJob()` in Jobbsök, then Matchanalys creates the case once and stores `caseId` on the accepted job (`setJobCase`); `hellolilly:active-case` (localStorage) is the case the CV/letter/home screens follow (`setActiveCaseId` / `useActiveCaseId`).

## HTTP surface (all served by `npm run dev`, port 5173)

| Route | Does |
|---|---|
| `POST /api/case` `{company, role, sourceInput?}` | create case → `201 {ok, case}` (new in Stream 2) |
| `GET /api/cases` | all cases: `{meta, parts: {p: {status, updatedAt}}}` (new) |
| `GET /api/case/:id` | `{meta, dossiers, decodedRole, fit, gaps, cvDraft, coverLetter}` (now incl. dossiers) |
| `POST /api/case/:id/research` | researcher → dossiers + brokered decoder → decodedRole; partial = 207 (new) |
| `POST /api/case/:id/analyze` | gap-analyzer → fit + gaps (gaps now carry `requirementRef`) |
| `POST /api/case/:id/gap/:gapId/answer` | bullet-judge → `accepted` (mints datafact, flips fit) or `stays_gap` |
| `POST /api/case/:id/generate` | cv-builder + writer → cvDraft + coverLetter (one fails = 207) |
| `POST /api/jobs/search` | in-repo `job-discovery` via the broker (OnlyiGaming sibling-repo dependency REMOVED); writes the persistent `jobs` collection and returns UI-shaped jobs |

## Persistence

`server/skeleton/store/persistence.cjs` — `createPersistentStore({path})`: the in-memory store hydrated from a JSON snapshot at boot, debounced atomic writes on mutation, `flush()` on SIGINT/SIGTERM. Snapshot = cases + datafacts + collections (scratch excluded). File: `server/data/store.json` (gitignored; `STORE_PATH` overrides). Datafacts seed only into an empty pool. Store gained additive `snapshot()`/`hydrate()`; a real DB later still means "same signatures".

## Env

`.env` (loaded by `npm run dev` via `--env-file-if-exists`): `ANTHROPIC_API_KEY`, `PERPLEXITY_API_KEY` (research/analyze/generate need them; routes fail loud without), optional `STORE_PATH`, `PORT`, `CV_DATA_PATH` (overrides the sibling `../../JobSearch/.../cv_data.json` seed path — needed in git worktrees).

## Wired screens (and what they bind to)

- **Jobbsök** → `POST /api/jobs/search`; accept/save still localStorage.
- **Matchanalys** (`match.jsx` + the analysis layover in `helpfulLayover.jsx`) → create → research → analyze, honest fit (every match cites a datafact id), partials, gaps with bridges, the fill-gap loop with both outcomes surfaced; auto-fires `generate` in the background when analysis is ready.
- **CV-byggaren** preview → `cvDraft` (selected datafacts, verbatim).
- **Personligt brev** preview → `coverLetter` + `unsupported_by_cv[]` as a visible review panel.
- **Hem** hero/next-step/CV/letter cards → derived from the active case's part statuses; honest zero state.
- **Min aktivitet** → literally a render of part envelopes across `GET /api/cases` with real timestamps.

**Still fixture** (Stream 1/Stream 3 surfaces, unchanged): interview, library, review, studio, community, calendar, coach, the intake-chat columns in CV/letter, Helpful Now rail content.
