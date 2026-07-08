# REPO FINDINGS SCRATCH — REST OF SITE bridge inspection

**Date:** 2026-07-07 · **Inspected at:** main @ `1d53491` (post core-loop-wave merge `013aae7`)
**Purpose:** survive-session-death record of the repo inspection that feeds
`REST_OF_SITE_RECONCILED_DESIGN.md`, `REST_OF_SITE_DATA_CONTRACT_ADDENDUM.md`, `WAVE_1_BACKEND_BUILD_BRIEF.md`.
Repo reality below WINS over every planning doc for current-state fields.

**Preconditions confirmed:** `docs/HELLOLILLY_REST_OF_SITE_PLAN_v3.md` ✓ · `design/hellolilly_ux_wireframes_v1.html` ✓ (note: `design/` is **untracked** in git, as is `docs/A2_BACKEND_BRIEF.md`).

---

## 1. Backend skeleton — REAL, and ahead of ARCHITECTURE_BUNDLE.md

`server/skeleton/`: host.cjs, broker.cjs (cycle/depth/budget/circuit refusals), registry.cjs,
capabilities.cjs (least-privilege tools injection, scoped store), ids.cjs, utils.cjs,
contract/case.cjs, writing-rules/ (gate + rules), submodule-isolation.cjs (require-guard),
clients/ (anthropic, perplexity — raw fetch, no SDKs), datafacts/ingest-cv.cjs,
fill-gap/bullet-judge.cjs. Tests co-located (`node --test`, incl. `src/**/*.test.mjs`).

**Store (D1 DONE):** `store/index.cjs` (memory) + `store/persistence.cjs` (json) +
`store/sqlite.cjs` (durable, WAL). `server/store-bootstrap.cjs` picks adapter
(default **sqlite**, env `STORE_ADAPTER`/`STORE_PATH`, data dir `server/data/`),
one-time JSON→SQLite migration, **idempotent seeding** (only into an empty pool).
`GET /api/health` reports `{adapter, path, durable, cases, datafacts}` — durable:true verified pattern.

**Store API:** cases (createCase/getCase/listCases/writePart(gated)/setPartStatus),
scratch(ns), datafacts (ingestDatafact host-only/getDatafact/listDatafacts),
**collections** (putRecord/getRecord/listRecords/removeRecord + snapshot/restore).
Collections in use today: **`jobs`, `jobSources`, `filterSet`** (+ 'nope' in tests). No jobRules yet.
Gate note: collections are NOT auto-gated — callers gate authored prose before putRecord (learner carry-forward obligation).

**Case PARTS (contract/case.cjs:14):**
`['dossiers','decodedRole','fit','gaps','cvDraft','coverLetter','coverLetterDraft','prep','cards','liveLog','postMortem']`
(coverLetterDraft added by core-loop wave; prep/cards/liveLog/postMortem exist as envelopes, no producers).

## 2. Submodules — REAL

`server/submodules/`: researcher (A1, 4 dossiers, drill mode, summons decoder), decoder,
gap-analyzer (fit+gaps, cite-by-id), cv-builder (selects datafacts), writer (coverLetter,
unsupported_by_cv), job-discovery, job-ingest (CSV/mojibake), linkedin-job-fetcher (enrich),
stage2-filter (6 reject codes), echo-researcher + echo-analyzer (A0 stubs).

## 3. API endpoints (server/dev-server.cjs — Vite middleware serves the frontend too)

- `GET /api/health`
- `GET /api/jobs` · `POST /api/jobs/search` · `POST /api/job/clear`
- `POST /api/job/:id/decide` (decision stored ON the job record; 8-reason taxonomy in `src/lib/jobTriage.mjs` REJECT_REASONS)
- `POST /api/job/:id/case` (writes `caseId` onto the job record — the durable job→case link)
- `POST /api/case` (create) · `GET /api/cases`
- `GET /api/case/:id` → serves `{meta, dossiers, decodedRole, fit, gaps, cvDraft, coverLetter, coverLetterDraft}`
  (**dossiers ARE served** — MASTER_PRODUCT_DESIGN_SPEC's "dossiers not served" claim is STALE)
- `POST /api/case/:id/research` · `/analyze` · `/gap/:gapId/answer` · `/letter-draft` · `/generate`

## 4. Frontend screens (13 routes in App.jsx LL_ROUTES; everything else → ComingSoon)

**Rebuilt on grid.jsx templates + useCase (template:true):**
- `jobbsok` → jobSearch.jsx (approval screen, backend jobs store, triage, NO i18n import — gap)
- `match` → match.jsx (Matchanalys real: fit/gaps/fill-gap loop; i18n ✓)
- `cv` → cvActivity.jsx `CVBuilder` (real cvDraft + intake rail disabled "Kommer"; i18n ✓)
- `letter` → coverLetter.jsx (real coverLetter + Ärlighetskoll + durable letter-draft; i18n ✓)

**Fixture/demo screens (old shell.jsx Sidebar + bespoke markup):**
- `home` → home.jsx **HYBRID**: old shell, 6× pane-level `<DemoBar />`, but uses `useLiveJobSearch()` (real jobs) + `useActiveCase()`
- `activity` → cvActivity.jsx `ActivityTracker` **HYBRID**: `useActivityRows()` derives REAL rows from
  `listCases()` part-status transitions (PART_ACTIVITY map) — but old shell, dead CTAs ("Dela med Sara", "Exportera rapport"), no activity collection
- `interview` → interview.jsx — FAKE trainer (PostNord/warehouse QSET fixture, fake RecWave recording UI)
- `library` → library.jsx — 6-item fixture; `review` → review.jsx (Sara-era fixture); `studio` → studio.jsx (dead controls);
  `coach` → coach.jsx (fixture CoachWorkspace + COACH_NAV_INDEX); `calendar` → calendar.jsx; `community` → community.jsx
- Nav (shell.jsx NAV_GROUPS) advertises ~35 jobseeker keys incl. jobbradar, foretagslista, spontanansokningar,
  linkedin, kontaktplan, natverksmatch, kunskapshubb, researchstod, intervjuforberedelse, ansokningskoll,
  uppgifter, paminnelser, arendevy-plan/coach, sparade-jobb, kontakter, videos/guider/kurser/diskussioner,
  meddelanden/moten/delade-dokument/nastasteg — all ComingSoon. `ansokningskoll` route NOT in LL_ROUTES yet.

## 5. useCase() bridge — EXISTS

`src/hooks/useCase.js` (+ `useActiveCase`), `src/api/caseApi.js`. Envelope-mapped, polls while pending,
actions research/analyze/generate/answerGap, `ll:case:changed` CustomEvent sync.
Frontend PARTS const: 6 (dossiers…coverLetter). Also `src/hooks/useJobs.js`, `useLiveJobSearch.js`,
`src/components/partGate.jsx`, `partSlot.mjs`, `src/hooks/casePartsView.mjs`, `caseMetaView.mjs` (tested).

## 6. grid.jsx adoption

Importers: match.jsx, cvActivity.jsx, jobSearch.jsx, coverLetter.jsx, App.jsx. All other screens bespoke.
grid.jsx exports PageTemplate (nav|content|cross), ContentArea (single/split), ContentBox, CrossColumn, atoms.

## 7. Fixture data locations

- `src/data/strategyData.js` (316 lines): CASE_PROFILE, PIPELINE_RUN, LIVE_JOBS, CASE_RECORD,
  KNOWLEDGE_RESOURCES (6), DISCUSSIONS, LEARNING_RESOURCES, COMMUNITY_WINS, OUTCOME_METRICS, TOOL_SPECS, COACH_TOOL_SPECS.
- In-screen fixtures: interview.jsx QSET etc., review.jsx, community.jsx, coach.jsx, calendar.jsx, studio.jsx, library.jsx.
- `src/components/helpfulNow.jsx` + `helpfulLayover.jsx`: HELP_DEFAULT/HELP_BY_ROUTE fixture crosslinks fed by strategyData.
- `helpfulLayover.jsx` still renders `JobAnalysisContent` (line 67/404) — the logged orphan-removal follow-up is NOT yet done.

## 8. localStorage — still present (bounded)

- `src/utils/jobStore.js` keys: `hellolilly:saved-searches`, `accepted-jobs`, `removed-jobs`,
  `latest-job-search`, `active-case`. Live uses: jobSearch.jsx saved searches; useCase.js reads
  `getActiveCaseId()`; match.jsx `setActiveCaseId()`.
- coverLetter.jsx `LETTER_REVIEWED_KEY` ("letter reviewed" per-case flag map).
- `src/lib/i18n.mjs` stores lang pref.
- Decisions/jobs NO LONGER via localStorage (backend decide route). Rule for new work: no NEW localStorage.

## 9. Amir persona — still present in

community.jsx, review.jsx, coach.jsx, home.jsx, strategyData.js, helpfulLayover.jsx, shell.jsx,
helpfulNow.jsx. (coverLetter.jsx mentions Amir only in a "no Amir" comment.) None of these screens
currently carries a full-screen D3 banner except home's pane-level DemoBars.

## 10. D3 banner / koncept labels

- `DemoBar` EXISTS: `src/components/primitives.jsx:181` — pane-level amber "DEMO — EXEMPELDATA" (D3 rule in comment). Used ONLY in home.jsx (6 panes).
- NO screen-level demo banner component; NO "Koncept — kommande" (T5) label component exists anywhere.
- `ComingSoon` exists in shell.jsx (honest placeholder for unrouted nav keys).

## 11. i18n

`src/lib/i18n.mjs`: trFor/tr/getLang/setLang/useLang/LangToggle (sv default, localStorage pref, tested).
Adopted by match.jsx, cvActivity.jsx, coverLetter.jsx ONLY. jobSearch.jsx does NOT import it (gap vs "every touched screen i18n-ready" rule). Fixture screens: hardcoded Swedish.

## 12. Misc

- Datafacts seeding: `scripts/seed-datafacts.cjs` → **in-repo** `data/cv_data.json` (gitignored) — D2 DONE.
- `npm test` = `node --test server/** scripts/** src/**/*.test.mjs` — src tests exist (.mjs libs/hooks), no jsdom component harness yet (vitest+jsdom is a logged follow-up).
- package.json has NO `type:module` decision yet (logged follow-up).
- Uncommitted at inspection: 2 deletions in docs/product-vision (earlier archive move), untracked `design/` + `docs/A2_BACKEND_BRIEF.md`.
- RESUME.md line-11 note "MASTER_STATE.md / DECISIONS_ADDENDUM.md do not exist" is STALE — both exist in docs/.
- MASTER_PRODUCT_DESIGN_SPEC (2026-07-02) predates bridge/core-loop: its "no /api calls in src, no useCase, grid.jsx unused" claims are STALE. Its Section 3/4 conceptual shapes (companies, blindApplications, signals, outreachPlan contacts, resources, feedback, coach matches, hive, outcomeEngine, imageStudio, notifications) are the seed material for the data-contract addendum.
- Wireframes encode: fixture coach cast **Karin/Jonas/Amina/Peter Platshållare**; per-screen crosslink flows; per-screen MVP notes; Hem=T1, Framstegsstöd=T1, Intervjuträning=T1, Bildstöd=T3, Företagslista=T1, Spontan=T1, Radar=T2(+T5 sections), Research=T1, Prep-intake=T1(+T5 panel for st.4-6), LinkedIn=T1, Kontaktplan=T1, Nätverksmatch=T4(banner), Ärendevy=T1, Kunskapshubb=T2, Coachnätverk=T4(banner), Coachgranskning=T4 (**wireframe shows per-section demo label, no screen banner — plan says banner ON: log as open question**), Mötesstöd=T5(banner konc), Återkoppling=T1, Hive=T4(banner)+one real count row, Resultatmotor=T4(banner), Community=T4(banner), PWA=T2.

## Conflicts logged (repo vs plan/docs)

1. **Coachgranskning banner form**: plan §4 F4 "banner ON" vs wireframe per-section DEMO label with real request flow. Not silently redesigned — logged.
2. **Progress Support powers**: plan says "an `activity` collection… events logged automatically". Repo has NO activity collection; it has part-status-derived rows (useActivityRows). Feasible either way; addendum must decide STORED activity events vs DERIVED — plan's wording (log events, user can hide) implies STORED; derivation alone can't support hide/per-event text. → design decision recorded in reconciled doc, not a conflict per se.
3. **jobSearch.jsx not i18n-adopted** — violates the standing i18n rule on an already-rebuilt screen. Log as debt; don't fix silently within this bridge task.
4. **JobAnalysisContent orphan still referenced** in helpfulLayover (follow-up #1 from core-loop report still open).
5. **`ansokningskoll` route missing** (known logged follow-up #2 — Ansökningskoll is the CURRENT frontier item, NOT part of rest-of-site waves).
6. **prep/cards/liveLog/postMortem** parts exist as absent envelopes with no producers — interview-prep stages 4-6 remain concept-owned (matches plan).
7. localStorage remnants (saved searches, active-case pointer, letter-reviewed flags, lang pref) predate the rule; "no NEW localStorage" holds; migration of remnants is NOT in rest-of-site scope unless a wave touches that surface (active-case pointer is touched by Wave 1 home/case-record work — flag in brief).
