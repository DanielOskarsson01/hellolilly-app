# HelloLilly - MASTER STATE (the reconciliation)

**Date:** 2026-07-02
**What this is:** The single source of truth reconciling three layers: what is BUILT (from `docs/PROJECT_INVENTORY.md`, the factual code inventory of main @ `16a0451`), what is PLANNED (the strategy paper, DEVELOPMENT_PLAN, JOB_SEARCH_SIGNOFF, A2_RECONCILED_DESIGN, FRONTEND_BUILD_BRIEF, INTERVIEW_PREP_CONCEPT_FINAL), and what is SHOWN (the 13 frontend screens as coded). Where these disagree, this document names the gap. It supersedes nothing in the plan docs; it tells you where reality stands against them.
**How to use it:** the truth table for orientation; the three-kind gap list for what work exists; the priority path for what order. All threads reference this before building.

---

## 0. The four structural findings

1. **Two products in one repo, never connected.** The frontend is the HelloLilly DEMO (persona Amir Hassan, warehouse/PostNord, coach Sara - the Rusta och matcha pitch). The backend is DANIEL'S REAL TOOL (executive CMO/CPO search, his preferences, his datafacts). Zero `/api/` calls exist in `src/` - the halves have never touched. Both products are legitimate per the strategy paper; they must stop masquerading as one app. Decision required (§4, D3).
2. **The design-system template layer is orphaned.** `grid.jsx` (PageTemplate/ContentArea/ContentBox/CrossColumn) has zero importers; all 13 screens are bespoke markup; App.jsx duplicates PageTemplate's mobile chrome; two crosslinking-column components exist (HelpfulNow wired, CrossColumn not). Rule going forward: every screen touched is rebuilt on the templates.
3. **The evidence-pool source is outside the repo and ambiguous.** `seed:datafacts` reads `../../JobSearch/CVs/cv-source/en/cv_data.json` (sibling folder, not in this repo/git). The two English copies are NOT content-identical (md5 differ) despite the seed script's comment claiming they are. The recent 133-datafact enrichment went into the sibling file. Rule-2-adjacent breach + data-integrity risk. Decision required (§4, D2).
4. **Live validation happened but left no committed evidence.** All live runs (77-job discovery, 14/15 LinkedIn fetches, the A2 smoke that caught the gate-crash bug) are documented only in chat threads. The inventory correctly marks everything UNVERIFIED-from-repo. Process fix: commit a short run-artifact note per live verification (`docs/verification/`).

---

## 1. The truth table

Status codes: **BUILT** (tested, on main) · **PARTIAL** · **STUB** · **MISSING** · **WRONG-WIRED** (exists but connected to the wrong source) · **FAKE** (renders fixtures as if real) · **ORPHANED** (built, unused)

### The application workflow (Daniel's real tool)

| Capability | Backend | Frontend | Plan says | The gap |
|---|---|---|---|---|
| Job discovery (API search, store-backed filters, stage-1 flags) | BUILT (`job-discovery`, live-run 77 jobs) | WRONG-WIRED - `jobSearch.jsx` calls JobTech directly from the browser, warehouse-persona defaults (`lager/logistik/truck`, municipality pinned `0180`), localStorage | Signoff: discovery through the store, operability principle | Repoint the screen to the backend jobs store; kill the browser-direct path |
| LinkedIn CSV ingest | BUILT (`job-ingest`, mojibake repair, locFit carried) | MISSING - no CSV upload surface anywhere | FRONTEND_BUILD_BRIEF Area 1 | Build the upload UI onto the built backend |
| Body enrichment (guest endpoint) | BUILT (`linkedin-job-fetcher`, enrich mode, retry cursor) | n/a (background by design) | Signoff | None - wired via `npm run enrich`/`filter` |
| Stage-2 body filtering (6 reject codes, flag-never-hide) | BUILT (`stage2-filter`; SALARY_LOW honestly empty) | MISSING - nothing displays `signal`/`matchedRules` | Signoff: down-ranked always-visible sections | The approval screen must render the flags |
| Job approval / triage (approve/reject + reason capture) | READY (jobs carry `decision`/`signal`/`matchedRules`/`locFit`) | PARTIAL+WRONG - accept/remove exist but write localStorage, no reject-reason taxonomy, no down-ranked section, "Ansök" doesn't apply | Signoff: JobApprovalScreen, 8-reason taxonomy, reversible | The first real screen: rebuild Jobbsök on the backend + templates |
| Rejection-learning (propose rules, operator feedback) | MISSING - `jobRules` collection named in comments, never written | MISSING | Signoff §D: safety-critical, propose-show-approve-reversible, brutal-critic review gate | Roadmap. GATED on spend limit for the multi-agent review |
| Fit/gap analysis (Matchanalys) | BUILT (`gap-analyzer`, cite-by-id honesty, gate-aware retry; smoke-validated) | FAKE - `match.jsx` reads localStorage, "Analysera" plays a timed animation then a hardcoded fixture, match % defaults to literal 76 | A2_RECONCILED_DESIGN: verdict from `fit`, citation chips, fill-gap loop | Rebuild the screen on `GET /api/case/:id` + `POST /analyze` |
| Fill-gap loop (bullet-judge, compounding pool) | BUILT (endpoint + `applyAnswer`; judge refuses off-topic answers - smoke-proven) | MISSING | Reconciled design: one gap at a time, honest-failure visible | Build the loop UI in Matchanalys |
| CV generation | BUILT (`cv-builder`, selects-never-authors, language param) | FAKE + misleading - `cvActivity.jsx` is an Amir-persona mockup ("spara automatiskt" saves nothing) | Background generation, NO builder screen; output surfaces in Ansökningskoll | No screen to build; the fixture screen misleads (honesty pass / demo decision) |
| Cover letter | BUILT (`writer`, guardrails, `unsupported_by_cv`; smoke-proven honest) | FAKE - `coverLetter.jsx` renders a fixed Amir letter | Background generation; output in Ansökningskoll | Same as CV |
| Ansökningskoll (delivery + tracking, two views, inert comments) | PARTIAL - `cvDraft`/`coverLetter` parts + `/generate` exist; no application-card/tracking data model | MISSING - nav key `ansokningskoll` → ComingSoon | Reconciled design: delivery cards (download+visualize+saving comment box+apply link) + manual tracking view | Define the small card/tracking record, build the screen |
| Doc-to-datafacts extractor + interview-style gap-fill | SPECCED only (A2_FEATURE_ADDENDUM, routed to A2 thread) | MISSING | The addendum (honesty boundary: polish, never add claims) | Roadmap - A2 thread builds |
| Filter editing in-tool / feedback-driven adjustment | Foundation BUILT (filters are store data, proven zero-hardcode) | MISSING | Signoff: named next-phase | Roadmap - additive on the store foundation |

### The interview-prep workflow

| Capability | Backend | Frontend | Plan says | The gap |
|---|---|---|---|---|
| Research (4 dossiers, niche depth) + decoder (true requirements) | BUILT (A1; live-verified on Curoflow in-session) | MISSING | Concept stages 1-3 | No intake/research UI |
| Prep package, cards, live ticker, post-mortem | MISSING | interview.jsx is a FAKE trainer mockup (unrelated to the concept) | Concept stages 4-6 | Roadmap - after the application tool |
| Central learning tool / crosslinking (Knowledge Hive) | MISSING | HelpfulNow exists but serves fixtures | A8, built last | Roadmap |

### Platform

| Capability | State | The gap |
|---|---|---|
| The data bridge (`useCase()` async layer) | MISSING - zero `/api/` calls in `src/`; only a comment in grid.jsx anticipates it | THE blocker between the halves. Build first |
| Persistence | In-memory Maps only; nothing survives exit. Hit from THREE sides: cron scheduling, frontend serving, run-to-run survival | THE infrastructure decision (§4, D1) |
| API layer | 6 routes on dev-server; case routes BUILT+tested; `/api/jobs/search` depends on the OnlyiGaming sibling repo (lazy-required) | Retire the sibling route - `job-discovery` replaces it (kills the long-deferred Rule-2 breach) |
| Design-system templates | ORPHANED (zero importers) | Adopt on every touched screen, starting with Jobbsök |
| i18n | None - all strings hardcoded Swedish | Introduce with the first rebuilt screen |
| Frontend tests | None (`npm test` structurally excludes `src/`) | Add harness when the bridge lands (test the bridge first) |
| Repo self-containment | `cv_data.json` + `api-search` live in sibling folders | Bring cv_data in (D2); retire api-search |
| The demo persona layer | 9 screens of Amir-fixture theatre with dead/fake CTAs and over-claiming copy ("320+ resurser" over 6 items, fake recording, "spara automatiskt") | Decision D3 + the honesty pass |

---

## 2. The gap list, in three kinds

### Kind 1 - BUILT BUT INVISIBLE (wiring work; the highest-value list)
The backend is ~one full product ahead of the frontend. In dependency order:
1. **Persistence + a running backend** (D1) - the store must survive and be servable before a frontend can read it. The store interface was built for a single-adapter swap.
2. **The data bridge** - the `useCase()`/API layer with states mapped 1:1 to the status envelope (`pending/ready/failed/absent`).
3. **Jobbsök rebuilt as the approval screen** - reads the backend `jobs` collection; clean jobs ranked up, flagged jobs in a labelled always-expandable down-ranked section; approve/reject with the 8-reason taxonomy (reasons stored - the learner's future food); "apply" opens the real job URL. Built ON the grid.jsx templates (un-orphans the design system). Retires the browser-direct external calls AND the warehouse persona on this screen.
4. **CSV upload surface** - onto the built job-ingest→enrich chain, per-row status, honest about progress.
5. **Matchanalys real** - verdict from `fit`, citation chips, the fill-gap loop with the visible honest-failure path.
6. **Ansökningskoll** - the delivery cards (visualized+downloadable cvDraft/coverLetter, the SAVING-but-inert comment box, apply link) + the manual tracking view. Needs the small application-card record defined first.
7. **Retire `/api/jobs/search`** (the sibling-repo route) - point anything that needs search at `job-discovery`. The last OnlyiGaming runtime dependency dies.

### Kind 2 - SHOWN BUT NOT BUILT (the honesty pass; cheap, do alongside)
Per the project's own inert-but-honest principle: every control either works, is visibly disabled with a label, or is removed. The inventory's per-screen CTA tables (Part 2) are the checklist. Highlights: the dead hero buttons and thumbs on Home; "spara automatiskt"/"Ladda ner PDF"/"Spara" on CV-byggaren; the fake recording UI on Intervjuträning; "320+ delade resurser" over a 6-item fixture; the "Ansök" button that doesn't apply; the fake poll voting; the ~52 nav destinations that render ComingSoon (ComingSoon itself is an honest pattern - keep it, but stop advertising breadth the sidebar can't honour, or label the group). Scope depends on D3: demo screens get a one-line demo banner instead of per-CTA surgery.

### Kind 3 - PLANNED BUT NEITHER (the real roadmap, in rough order)
1. Rejection-learning (safety-critical; gated on the spend limit so the multi-agent adversarial review can run; the ungated-rationale-prose carry-forward is its first check).
2. The A2 addendum features (doc-to-datafacts extractor; interview-style gap-fill) - A2 thread.
3. In-tool filter editing + operator-feedback adjustment (additive on the store foundation).
4. Scheduled discovery (cron) - unlocked by the same D1 persistence decision.
5. Comment→regeneration loop (activates the inert surface), `.docx` export, Swedish output (the pool is language-tagged, generators language-parameterized - additive).
6. Interview-prep stages 4-6 + screens; then A8, the crosslinking/learning layer, last.
7. Frontend test harness; opportunistic design-system migration of remaining screens; numeric SALARY_LOW rule; repost-dedup.

---

## 3. Standing corrections (from the inventory's seams)
- **Docs:** DATA_CONTRACT v0.3 still carries the stale `cvStory` part (no code backing) next to `cvDraft` - remove it. Skeleton README says A2 is "Next" and omits the `datalayer` capability - update. researcher README's standalone claim is wrong (summon surfaces `ok:false/partial`, not "skipped") - fix. job-ingest README's "enrich mode not built" is stale vs the shipped enrich mode - fix. Delete `.bak2`/`.md.md`/duplicate research copies; mark A2_GAP_ANALYZER_DESIGN + A2_FRONTEND_BRIEF superseded-by-RECONCILED in their headers; the untracked docs should be committed (they're the plan of record).
- **Config:** the municipality mismatch (frontend `0180` vs backend `1980`) and the decorative read-only Kommunkod field die with the Jobbsök rebuild - don't pre-fix.
- **Manifests:** the `reads:[]/writes:[]`-vs-collections mismatch is a documented MVP decision, not a bug; add one line to each manifest noting collection access, or leave until per-collection scoping.
- **Store honesty note:** the gate covers authored CASE prose only; collections and datafacts sit outside gate+detach by design - the learner carry-forward (gate rationale prose before putRecord) remains the live obligation.
- **Anthropic client:** the dead `temperature` param - remove when next touched.

## 4. The three decisions in front of Daniel
- **D1 - Persistence.** In-memory has been hit from three independent directions (cron, frontend serving, survival). Recommendation: pull the real-DB swap forward NOW - the store interface was built for exactly this single-adapter swap, and it unlocks Kind-1 items 1-6 and Kind-3 item 4 at once. (A long-running host with in-memory store is the weaker alternative: it serves the frontend but still loses everything on restart.)
- **D2 - The evidence pool.** Diff the two English cv_data.json copies, pick the true canonical (the sibling `cv-source/en` copy is the recently-enriched one - likely the winner), and BRING IT INTO THIS REPO (gitignored is fine; outside-the-repo is not). Update `seed:datafacts` to the in-repo path and delete its false "content-identical" comment.
- **D3 - The demo layer.** The 9 Amir-persona screens: (a) keep as an honestly-labelled demo mode (one banner: "Demo - example data"), or (b) park them out of the nav until each is rebuilt on real data. Either is defensible; what's not is fixture theatre presenting as live. This decision sizes the Kind-2 honesty pass.

## 5. The priority path (Daniel as user #1 of his real tool)
D1+D2 decided → persistence lands + backend runs as a served host → data bridge → Jobbsök-as-approval-screen (on templates) → CSV upload → Matchanalys real → Ansökningskoll → honesty pass / D3 applied → then Kind 3 in order.
One thread rule stands: job-search/frontend work in the jobsearch worktree on main; A2 features on the A2 branch; nobody specs or codes in the other's domain; this document is the shared reference.
