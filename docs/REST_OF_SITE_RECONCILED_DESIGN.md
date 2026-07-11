# REST OF SITE — Reconciled Design

**Date:** 2026-07-07 · **Status:** reconciled source of truth for the REST OF SITE MVP.
**What this is:** the implementation bridge between `HELLOLILLY_REST_OF_SITE_PLAN_v3.md` (the product plan), `design/hellolilly_ux_wireframes_v1.html` (the flow decisions), and the repo as it actually stands (main @ `1d53491`, inspected 2026-07-07 — see `REPO_FINDINGS_SCRATCH.md`). Same role for the rest of the site that `A2_RECONCILED_DESIGN.md` plays for the application workflow.
**Rules used:** repo reality wins for every current-state field; the product plan wins for every target-state field; conflicts are logged, never silently redesigned.
**Reads with:** `REST_OF_SITE_DATA_CONTRACT_ADDENDUM.md` (the shapes), `WAVE_1_BACKEND_BUILD_BRIEF.md` (the first build slice), `MASTER_STATE.md`, `DECISIONS_ADDENDUM.md` (D1/D2/D3), `DATA_CONTRACT.md` v0.4.

---

## 0. What the inspection changed (read this first)

The plan was written against MASTER_STATE's 2026-07-02 reconciliation. The repo has since moved. Five inspection facts reshape the bridge; nothing reshapes the product decisions:

1. **D1 is DONE.** Durable SQLite store behind the unchanged `createStore()` signatures; `store-bootstrap.cjs` defaults to sqlite, seeds idempotently; `/api/health` reports durability. Every "depends on D1" clause in the plan is already satisfied — the standing rule that remains is *build store-agnostic, assume nothing about in-memory*.
2. **The bridge pattern is proven.** `useCase()` + `caseApi.js` exist, envelope-mapped, with polling and actions. Four screens (Jobbsök, Matchanalys, CV-byggaren, Personligt brev) run on `grid.jsx` templates against the real backend. Rest-of-site screens copy this pattern; nobody invents a second one.
3. **Progress Support has a real precursor.** `useActivityRows()` (in `cvActivity.jsx`) already derives activity rows from case-part status transitions via `listCases()`. But there is **no `activity` collection**: events from non-case tools (job decisions, future company/outreach actions) are invisible, nothing supports per-event hide, and the derivation dies when a case is deleted. The plan's stored-events model stands; the derivation retires when A1 ships (§4 A1).
4. **`GET /api/case/:id` already serves `dossiers`, `decodedRole` and `coverLetterDraft`** (the master spec's contrary claim is stale). Research Helper UI and Interview Prep intake are therefore even purer wiring than the plan assumed — near-zero new backend (§4 D1/D2).
5. **The D3 banner exists only at pane level.** `DemoBar` (primitives.jsx) is real and used on Home's fixture panes. There is **no screen-level demo banner** and **no "Koncept — kommande" (T5) label component** anywhere. Both are new frontend work, batched in Wave 4 where every T4/T5 surface lands (§5).

**Standing rules carried unchanged** from the plan §2 and the non-negotiables: grid.jsx templates on every screen; Daniel persona everywhere except bannered T4 screens (no new Amir content); all data through the backend API (no new localStorage, no browser-direct external calls); the `absent|pending|ready|failed` status envelope; cite-or-refuse honesty on every AI claim about the person; i18n-ready strings via `src/lib/i18n.mjs` on every touched screen; every control works, is visibly disabled with a label, or does not exist.

---

## 1. Current-state vocabulary

Per tool, **current repo state** is one of:
- **real** — works against the backend on main
- **partial** — some real machinery exists (backend, hook, or hybrid screen), the tool as designed does not
- **fixture** — a screen exists but renders fixture data (Amir-era or hardcoded)
- **absent** — nothing but (at most) a nav key rendering `ComingSoon`
- **unknown** — could not be established (none needed it; nothing below is unknown)

---

## 2. The reuse catalogue, verified

Every asset the plan's reuse catalogue names was confirmed real on main:

| Asset | Repo location | Verified state |
|---|---|---|
| `writer` skeleton | `server/submodules/writer/` | real (coverLetter producer, `unsupported_by_cv`) |
| `gap-analyzer` | `server/submodules/gap-analyzer/` | real (fit/gaps, cite-by-id) |
| A1 researcher + decoder | `server/submodules/researcher/`, `decoder/` | real (4 dossiers, drill mode; decoder summoned via broker) |
| `job-discovery` + jobs store | `server/submodules/job-discovery/`, collections `jobs`/`jobSources`/`filterSet` | real (decide route, 8-reason taxonomy in `src/lib/jobTriage.mjs`) |
| Case parts + status envelope | `server/skeleton/contract/case.cjs` (11 parts incl. `coverLetterDraft`) | real |
| `useCase()` + grid templates | `src/hooks/useCase.js`, `src/components/grid.jsx` | real, adopted by 4 screens |
| Datafacts pool + selects-never-authors | `scripts/seed-datafacts.cjs` → in-repo `data/cv_data.json` (D2 done), `fill-gap/bullet-judge.cjs` | real |
| HelpfulNow panel | `src/components/helpfulNow.jsx` + `helpfulLayover.jsx` | real component, **fixture-fed** (strategyData) |
| 8-reason taxonomy pattern | `REJECT_REASONS` in `src/lib/jobTriage.mjs` | real |
| Store collections mechanism | `putRecord/getRecord/listRecords/removeRecord` + snapshot/restore | real — every new "collection" in this document is this mechanism |
| Writing-rules gate | `writePart()` chokepoint; collections NOT auto-gated (callers gate authored prose before `putRecord`) | real — carry the learner-rule: gate authored prose before any collection write |

---

## 3. Cross-cutting build decisions (bridge-level, not product-level)

- **B-1. Activity is a stored collection, not a derivation.** The plan's wording ("events logged automatically… the person can hide any logged item") requires stored records: hide-state, display text, and non-case sources (job decisions, companies, outreach) cannot hang off case-part envelopes. The existing `useActivityRows()` derivation retires when A1 lands. Emission happens at the **API/host layer** (the single chokepoint, mirroring `ingestDatafact`'s host-only pattern) — submodules stay least-privilege and never write activity themselves.
- **B-2. T4 fixture data moves server-side.** Every T4 screen reads its fixture content from the `demoFixtures` collection through the API, not from a frontend fixture file. This is what makes "flips real by changing data, not code" (F3/E3) literally true, and it honours "no new disconnected mock screens": the screen is wired; only the rows are placeholders. The fixture coach cast was **Karin, Jonas, Amina, Peter Platshållare** (wireframe-encoded, from the paper's own examples); **as of D9 the fourth slot (Peter's headhunting/executive archetype) is replaced by Daniel's real `coachCompetence` row** (iGaming / digital product leadership / C-level hiring, `placeholder:false`). The three remaining placeholders + Daniel's real row live in `coachCompetence` seed rows, one place, reused by every coach screen; `demoFixtures` holds only genuinely-fixture content (graphs, threads, panels), never a stand-in for Daniel.
- **B-3. Two label components ship once, in Wave 4's first slice.** A screen-level `DemoBanner` ("Demo — exempeldata") and a `KonceptLabel` ("Koncept — kommande"), plus the existing pane-level `DemoBar` for labelled-per-section screens (Job Radar, Coach Review, Network Match's real seam). Nav entry cards to T4/T5 tools carry the same styling (wireframe 'hem' note: the nav never promises more than the page holds).
- **B-4. New id kinds extend `ids.cjs` KINDS.** The addendum's id patterns (`activity_…`, `company_…`, …) are minted through the existing `mintId()`; the KINDS set grows accordingly. References stay `{kind, id}`.
- **B-5. i18n from day one, and one debt logged.** New screens use `tr()`/`useLang()` from `src/lib/i18n.mjs`. Debt: `jobSearch.jsx` — already rebuilt — does not import i18n (violates the standing rule). Logged here; fixed opportunistically, not silently inside this plan's waves.
- **B-6. The current frontier is untouched.** Ansökningskoll (delivery cards + tracking), CSV upload, and the honesty pass run BEFORE these waves, per the plan §5 and MASTER_STATE §5. Nothing below builds or blocks them. (Cross-ref: per the §5 dated resolution of 2026-07-08, the Wave-1 BACKEND slice overlaps CSV upload and the honesty pass — it starts on the Ansökningskoll merge — but the "nothing below builds or blocks them" half stands unchanged, because the backend slice touches nothing they touch.) The `applications` record Ansökningskoll needs is *not* defined in this bridge (it belongs to the frontier work), but the activity taxonomy reserves its event names (addendum §T).

---

## 4. Tool-by-tool reconciliation

Format per tool — **Tier** · **Current repo state** · Existing files · Delete/reuse/migrate/build · Reads · Writes · Reuses (skeleton/submodule) · New backend? · New frontend? · New prompt discipline? · **Banner at end** · MVP boundary · Deferred · Risks/open questions.

### A. Execution

#### A1. Progress Support (Framstegsstöd) — **T1 REAL** · M
- **Current repo state:** partial. `ActivityTracker` (route `activity`, in `cvActivity.jsx`) derives real rows from case-part statuses via `listCases()`; old shell; dead CTAs ("Dela med Sara", "Exportera rapport"); no collection, no hide, no planner, no next-step logic.
- **Existing files:** `src/screens/cvActivity.jsx` (`ActivityTracker`, `useActivityRows`, `WeekRing`), nav keys `activity`, `home` (consumes the next-step card), `uppgifter`/`paminnelser` (ComingSoon).
- **Delete/reuse/migrate/build:** DELETE the dead CTAs and the old-shell ActivityTracker markup; RETIRE `useActivityRows()` (superseded by the collection); REUSE the screen's layout ideas (plan: "the existing Aktivitet demo screen's layout is close to right") rebuilt on `PageTemplate`; BUILD the `activity` + `planner` collections, host-layer emission, and the new screen.
- **Reads:** `activity`, `planner` collections; cases (for thread names).
- **Writes:** `activity` (system, at API layer), `planner` (system suggests; user snoozes/completes), `activity.hidden` (user).
- **Reuses:** store collections, status-envelope conventions, `useCase()`-style hook (`useActivity()`), grid templates.
- **New backend?** YES — the Wave-1 core (see brief): collections, emission hook at existing endpoints, `GET /api/activity`, hide/snooze routes, rule-based next-step ("oldest unfinished thread wins" — deterministic, no ML, no LLM).
- **New frontend?** YES — rebuilt screen on templates: next-step card (max one/day), auto-log list with per-event hide, week view, during-study cadence chip (reads the same collection; the Omställning M-phases get it free).
- **New prompt discipline?** NO (no LLM in the tool).
- **Banner at end:** OFF. Replaces the Amir activity demo entirely.
- **MVP boundary:** automatic log + one-next-step + weekly view + streak-free display + in-app reminders only. Tone: supportive, never surveillance; every item hideable.
- **Deferred:** push notifications (H2's later story), ML prioritisation, coach visibility of activity (F1 coach variant), export/report.
- **Risks/open questions:** backfill — pre-A1 case history exists (part `updatedAt`s); decide whether to one-time backfill synthetic events or start logging from ship date (recommendation: start clean; the derived history was never event-grade). Every week unlogged is data lost — this is why A1 sits in Wave 1.

#### A2. Interview Trainer (Intervjuträning) — **T1 REAL (text)** then **T3 voice** · M then S
- **Current repo state:** fixture. `interview.jsx` is the PostNord-era fake trainer (hardcoded QSET, fake `RecWave` recording UI, warehouse persona).
- **Existing files:** `src/screens/interview.jsx`, nav keys `interview` (badge:1 hardcoded), `ovningshistorik` (ComingSoon).
- **Delete/reuse/migrate/build:** DELETE `interview.jsx` wholesale including the fake recording UI ("the fake one dies unreplaced"); BUILD the chat-shaped trainer on templates; BUILD session/answer storage.
- **Reads:** case (`meta`, `decodedRole`, `fit`, `gaps`, `dossiers`), datafacts pool, `interviewSessions`/`interviewAnswers`.
- **Writes:** `interviewSessions`, `interviewAnswers`; activity events; weak answers marked to feed Interview Prep (D2) later.
- **Reuses:** `writer` skeleton (session persona + feedback under guardrails), `gap-analyzer` output (question targeting), A1-researcher dossiers (company grounding), the fill-gap loop's one-at-a-time interaction pattern.
- **New backend?** YES — an `interview-trainer` submodule (clone-the-decoder scaffold discipline) + session endpoints; the 7 styles are ONE prompt parameter.
- **New frontend?** YES — chat UI, one question at a time; visible "this is practice, nothing is judged or shared without you" line; feedback screen split strong/weak/one-thing-to-practise.
- **New prompt discipline?** YES — two: (1) question generation grounded ONLY in the four case sources; (2) feedback that **cites the person's actual answer text and never invents** (same cite-or-refuse family as the gate; answers are the person's words — verbatim, gate-exempt like datafacts; the authored feedback prose IS gated).
- **Banner at end:** OFF.
- **MVP boundary (text):** pick job from store → pick style → 8–12 questions with follow-ups → kind + specific feedback → session saved to case.
- **Voice layer (T3, after):** browser-native Web Speech API (sv-SE) as "spoken mode"; if quality disappoints, a realtime-voice API behind the same session — UI unchanged. Browser speech APIs are user-agent features, not browser-direct *external service* calls — allowed.
- **Deferred:** recording/playback (never), video, scoring/analytics, Interview Prep stages 4–6 consumption (concept-owned).
- **Risks/open questions:** Web Speech sv-SE quality is unproven on target devices — that is exactly why voice is a separate T3 slice after text ships.

#### A3. Image Studio (Bildstöd) — **T3 SHORTCUT** · M
- **Current repo state:** fixture. `studio.jsx` is a dead-control mockup.
- **Existing files:** `src/screens/studio.jsx`, nav key `studio`.
- **Delete/reuse/migrate/build:** DELETE the mockup; BUILD the three-step wizard on templates; BUILD a server-side enhancement pipeline (self-hosted open source: Real-ESRGAN upscale, CodeFormer/GFPGAN conservative face restore, denoise/relight, rembg background removal) invoked through the backend API.
- **Reads:** `imageAssets`.
- **Writes:** `imageAssets` (upload → variants → approved exports); activity events.
- **Reuses:** store collections; the status envelope maps 1:1 onto long-running enhancement jobs (pending/ready/failed).
- **New backend?** YES — upload handling (multipart), binary storage under `server/data/uploads/` (paths in the record, binaries out of git), an enhancement runner. This is the ONE rest-of-site tool with a new infrastructure seam (Python/native deps for the models) — isolate it behind one internal interface so a hosted-API fallback stays a swap, not a rewrite.
- **New frontend?** YES — 3-step wizard, big preview, **mandatory before/after approval** ("Det är fortfarande jag — godkänn"), strength slider hard-capped below the uncanny zone, template picker (LinkedIn/CV/neutral) with honest guidance text.
- **New prompt discipline?** N/A for LLM; the equivalent is the **parameter discipline**: identity-altering settings do not exist in the API surface (the constraint is the brand: same face, better photograph). Any caption text later = datafacts rules.
- **Banner at end:** OFF.
- **MVP boundary:** upload → enhance → background replace → crop to template → export correct sizes.
- **Deferred:** generative headshots and face synthesis (REFUSED, never — no concept panel either), batch processing, gallery management.
- **Risks/open questions:** model hosting weight on the current host (CPU inference may be slow — acceptable for single-user; measure before optimising). Upload size limits + EXIF stripping to decide at build time.

### B. Opportunity

#### B1. Company List (Företagslista) — **T1 REAL** · S
- **Current repo state:** absent (nav `foretagslista` → ComingSoon).
- **Existing files:** none (jobs rows in `jobSearch.jsx` gain an "add company" action).
- **Delete/reuse/migrate/build:** BUILD `companies` collection + CRUD endpoints + card-grid screen; add "add from job row" to Jobbsök (i18n debt B-5 gets fixed in the same touch).
- **Reads:** `companies`, `companyResearch` links, jobs collection (open-roles crosslink filtered on company name), case dossiers (why-relevant line).
- **Writes:** `companies` (user CRUD + status), `researchRequests` (research-on-demand), activity events.
- **Reuses:** A1 researcher (one-click 4-dossier research via the existing case + `/research` machinery), job-discovery.
- **New backend?** YES, small — the collection + endpoints; research-on-demand orchestration reuses D1's (Research Helper's) request path.
- **New frontend?** YES — card grid on templates; each card: why-relevant, open-roles count, last activity, status chip (interested/contacted/waiting/closed); **card actions designed now for B2/E2** ("Undersök · Spontanansökan · Kontaktplan") — the card is their launchpad (wireframe: "kortet är avfyrningsrampen").
- **New prompt discipline?** NO (why-relevant is selected from dossier content with source refs, not authored fresh).
- **Banner at end:** OFF.
- **MVP boundary:** manual add + add-from-job, research-on-demand, notes, status.
- **Deferred:** system-suggested companies (arrive later from Job Radar signals).
- **Risks/open questions:** company↔job matching is by name string at MVP (honest limitation; jobs carry no org id from all sources) — surface as "adverts matching this name".

#### B2. Blind Applications (Spontanansökningar) — **T1 REAL** · M
- **Current repo state:** absent (nav → ComingSoon).
- **Delete/reuse/migrate/build:** BUILD `blindApplications` collection + the five-step guided flow launched from a Company List card.
- **Reads:** `companies`, company research (dossiers), case fit/gaps (angle selection), datafacts pool.
- **Writes:** `blindApplications` (step state persists — same save-and-resume pattern as `coverLetterDraft`), activity events; follow-up date surfaces in E2/A1.
- **Reuses:** researcher (company context), gap-analyzer (which CV angle fits), writer (the first message, guardrailed, `unsupported_by_cv` surfaced with the same honesty affordances as Personligt brev).
- **New backend?** YES — collection + step endpoints + a message-draft call through `writer`.
- **New frontend?** YES — 5 steps (Research → Vinkel → Mottagare → Meddelande → Uppföljning), each completable in one sitting, resumable.
- **New prompt discipline?** YES, one — the blind-application message prompt: company-grounded (cites dossier), person-grounded (selects datafacts), refuses unsupported claims. Wireframe-encoded boundary: **step 3 recipient is typed by the person; the system never looks people up** ("du anger, systemet letar aldrig upp personer") — permanent, not deferred.
- **Intake before compose (D10):** at the message step — when the person has a draft or a clear stated direction, the existing review/improve posture stands unchanged. When the person is frozen (no draft, no clear direction) the tool must NOT compose from scratch, because that would decide the person's position for them. Instead a short intake runs first: current capacity (full reply / two lines / buy time / not today), what is holding you back, what you want to happen, and your own words — messy is fine. Only then is ONE draft built from those answers. Capacity constraints are hard: two lines means two lines, and "not today" is a legitimate, closable outcome, never rendered as failure. One draft per pass, never variants, same verdict discipline as E1. Rationale: the tool's job is getting the person to write, not writing for them — intent comes out of the person first, which is what makes B2's promise that this is "possible even for people who would normally be too uncertain to try" true rather than decorative.
- **Banner at end:** OFF.
- **MVP boundary:** full checklist flow EXCEPT contact-person discovery (refused permanently — privacy/ToS).
- **Deferred:** send-tracking integration (outcome is manually logged), templates per industry.
- **Risks/open questions:** none beyond writer-guardrail reuse; the flow is composition, not invention.

#### B3. Job Radar (Jobbradar) — **T2 WIRED-THIN + T5 sections** · M
- **Current repo state:** absent (nav → ComingSoon).
- **Delete/reuse/migrate/build:** BUILD `radarSignals` collection, two server-side signal producers, weekly digest screen with per-section labels.
- **Reads:** jobs collection (hiring-volume deltas: postings this month vs trailing average, per company in the person's region/field — computed from data already pulled), a small curated RSS set fetched **server-side** (non-negotiable: no browser-direct external calls), `radarSignals`.
- **Writes:** `radarSignals` (system, weekly), activity events on user actions (add-to-company-list).
- **Reuses:** job-discovery data; the LLM summarisation pattern (researcher-style) for RSS items with source links.
- **New backend?** YES — the delta computation (pure code over the jobs collection), the RSS fetch+summarise producer (new `radar` submodule or host-level job; decide at build — host-level is simpler and needs no new capability), weekly scheduling (D1's durable store makes cron viable; MVP = generate-on-demand with a "this week" cache, cron later).
- **New frontend?** YES — weekly digest, newest first; each signal card: what was observed, the source, one suggested action (the signal-to-action-path is the design centrepiece). The four future signal types (tenders, investments, leadership, spontaneous-fit) render as **T5 concept cards inside the screen** with the Koncept label and one callout each.
- **New prompt discipline?** YES, light — RSS summarisation: summarise-with-source-link, never editorialise about the person (no person-claims at all, so the honesty gate question does not arise; the writing-rules gate still applies to the authored summary prose before `putRecord`).
- **Banner at end:** OFF on the two real signal sections; **Koncept label** on the preview sections (per-section labels allowed; per-control fakery never).
- **MVP boundary:** one weekly generated list; every item crosslinks to add-to-Company-List and to live adverts.
- **Deferred (as T5 cards):** tender/investment/leadership tracking, spontaneous-fit list.
- **Risks/open questions:** hiring-delta needs enough jobs-collection history to have a trailing average — the metric is honest only once ~2 months of discovery data exist; ship with an explicit "signalen mognar" empty state until then (envelope `absent` with honest copy). RSS source list curation is a content decision for Daniel (log: which national + regional feeds).

### D. Preparation

#### D1. Research Helper (Researchstöd) — **T1 REAL** · S
- **Current repo state:** partial — backend real and live-verified (researcher + drill; dossiers **served** by `GET /api/case/:id`); UI absent (nav `researchstod` → ComingSoon).
- **Delete/reuse/migrate/build:** BUILD intake form + dossier-reading screen; BUILD the thin `researchRequests`/`companyResearch` records that make research addressable outside a job context.
- **Reads:** case `dossiers` (via `useCase()`), `researchRequests`.
- **Writes:** `researchRequests` (intake: company, role?, purpose preset), case `dossiers` via existing `POST /api/case/:id/research`; save-to-case is inherent (the dossiers live on a case); `companyResearch` link when launched from B1; activity events.
- **Reuses:** the ENTIRE existing pipeline — create case (`POST /api/case`) → `/research` → poll envelopes → render. Purpose presets (before applying / before interview / before blind application / before career change) only select **which dossier sections surface first** — presentation, not pipeline.
- **New backend?** Barely — the `researchRequests` record + (optional) a convenience route that creates case+research in one call. Nothing else; this is the "best value-per-day item on the board" confirmed.
- **New frontend?** YES — intake (company, role, purpose chips) + collapsible dossier sections with citation links + "what matters here" summary on top + drill-deeper (backend `drill` mode exists).
- **New prompt discipline?** NO (researcher's discipline ships as-is).
- **Banner at end:** OFF.
- **MVP boundary:** 4 dossiers + 4 purpose presets; career-change preset crosslinks to Omställning tools when they land (dead-end-free: until then the crosslink chip points at the Omställning plan's surface or is absent — never a fake link).
- **Deferred:** cross-research comparison, scheduled refresh.
- **Risks/open questions:** research without a job creates a case with `meta.role` null — verify `createCase` handles null role cleanly end-to-end (it does structurally; test it in the brief).

#### D2. Interview Prep intake (stages 1–3 UI) — **T1 REAL** · S
- **Current repo state:** partial — decoder real (summoned by researcher; `decodedRole` served); intake UI absent (nav `intervjuforberedelse` → ComingSoon). `prep`/`cards`/`liveLog`/`postMortem` parts exist as absent envelopes with **no producers** (stages 4–6 stay concept-owned).
- **Delete/reuse/migrate/build:** BUILD the intake screen (pick job from store / paste ad → case) + decoder view ("annonsen säger… betyder troligen") + research view entry; REUSE everything backend.
- **Reads:** case `meta`, `decodedRole`, `dossiers`; jobs collection (pick-a-job).
- **Writes:** case creation + job→case link (`POST /api/job/:id/case` exists); activity events.
- **Reuses:** decoder, researcher, useCase, the job→case link machinery from the core-loop wave.
- **New backend?** Essentially none (tests + possibly an intake convenience route shared with D1's).
- **New frontend?** YES — intake + decoded-requirements view; a **T5 concept panel** for stages 4–6 pointing at the interview-prep plan's own order (wireframe-encoded).
- **New prompt discipline?** NO.
- **Banner at end:** OFF (the stages 4–6 panel carries the Koncept label).
- **MVP boundary:** stages 1–3 visible and usable; output feeds Interview Trainer (A2 reads `decodedRole`/`gaps`).
- **Deferred:** stages 4–6 (prep package, cards, ticker, post-mortem) — owned by `INTERVIEW_PREP_CONCEPT_FINAL.md`, not this plan.
- **Risks/open questions:** none — pure wiring.

### E. Network

#### E1. LinkedIn Helper (LinkedIn-stöd) — **T1 REAL** · S/M
- **Current repo state:** absent (nav `linkedin` → ComingSoon).
- **Delete/reuse/migrate/build:** BUILD two-pane review screen + a checking-posture writer call; no storage beyond activity (drafts are ephemeral paste-ins at MVP; post-ideas ground in datafacts).
- **Reads:** datafacts pool (post-idea generation), the pasted text (request-scoped, not persisted at MVP).
- **Writes:** activity events only (event on "checked", not the content — the content is the person's draft, not ours to keep at MVP).
- **Reuses:** `writer` skeleton with a **checking posture** — review/improve, not generate-from-nothing; tone/recipient presets are prompt parameters.
- **New backend?** YES, one endpoint — `POST /api/linkedin/check` (paste-in → suggestion + per-change "why this reads better" + the it-is-fine state). Server-side LLM call; nothing browser-direct.
- **New frontend?** YES — two panes (theirs/suggestion), preset chips, the big warm it-is-fine state ("Detta är inte fel. Detta är rimligt. Detta är kollat." — the reassurance IS the product), and the **manual publish step**: copy button, where/when to paste, what response to expect, follow-up guidance. The tool walks to the send button and stops.
- **New prompt discipline?** YES — the checking posture: never rewrite voice into AI-speak (gate applies to suggestions), never add claims the person's datafacts don't support (post ideas cite datafacts; profile claims flagged like `unsupported_by_cv`), explain every change in plain language.
- **Verdict discipline (D10):** every check ends in exactly ONE verdict — **SEND**, **SEND WITH ONE REVISION**, or **HOLD** (rare; genuine risk only; one-sentence reason). When the verdict is SEND the tool offers NOTHING further — no improvement list beside the reassurance; permission to stop IS the product for a population prone to rewrite spirals (the paper's own Confidence Problem). Each pass produces at most one revised version with its explanations, never a menu of variants. Pass 2 is final except for a genuinely new risk the revision itself introduced. Pass 3 never reaches a model: the outcome is hard-coded affirmation ("this is done — send it"), because a spiral ceiling that depends on a model call is not a ceiling. Low-stakes honesty is mandatory: a message that barely matters gets SEND with copy that says so.
- **Banner at end:** OFF.
- **MVP boundary:** paste-in review for profiles/messages/comments/posts; post-idea generation grounded in datafacts; presets; manual publish walk-through.
- **Deferred:** saved drafts library (would add a collection later).
- **Refused (permanent, no panel):** LinkedIn API, software posting, scraping, guiding users to third-party auto-posting agents (one step removed is the same account risk). **A landed-outcome track record ("your last N messages landed fine") is REFUSED for outbound (D10):** cold outreach mostly receives no reply and that is normal; a landed-statistics surface would render normal silence as failure feedback to exactly the population these tools protect. This mechanism works for inbound reply-checking products; it does not port here.
- **Risks/open questions:** none structural.

#### E2. Outreach Plan (Kontaktplan) — **T1 REAL** · S
- **Current repo state:** absent (nav `kontaktplan`, `kontakter` → ComingSoon).
- **Delete/reuse/migrate/build:** BUILD `outreach` collection + kanban screen (planned/sent/replied/done) + draft assistance via writer.
- **Reads:** `outreach`, `companies` (link), datafacts (message grounding).
- **Writes:** `outreach` (user CRUD + lane moves), activity events; follow-up dates feed A1's next-step ("uppföljningsdatum blir nästa steg" — wireframe flow).
- **Reuses:** writer (drafts), Company List cards (entry point), the kanban mental model from the job list.
- **New backend?** YES, small — collection + CRUD.
- **New frontend?** YES — kanban on templates; unwritten-social-rules guidance **inline at drafting moment** (warm before cold, day-7 follow-up), never a separate guide page.
- **New prompt discipline?** Light — outreach message drafts under writer guardrails; **rule-based sequencing only** (the LLM writes messages, never chooses the humans).
- **Intake before compose (D10):** at the message-drafting step — when the person has a draft or a clear stated direction, the existing review/improve posture stands unchanged. When the person is frozen (no draft, no clear direction) the tool must NOT compose from scratch, because that would decide the person's position for them. Instead a short intake runs first: current capacity (full reply / two lines / buy time / not today), what is holding you back, what you want to happen, and your own words — messy is fine. Only then is ONE draft built from those answers. Capacity constraints are hard: two lines means two lines, and "not today" is a legitimate, closable outcome, never rendered as failure. One draft per pass, never variants, same verdict discipline as E1. Same rationale as B2: the tool's job is getting the person to write, not writing for them — intent comes out of the person first.
- **Social rule named per fix (D10):** the inline social-rules guidance above gets its mechanism — every revision names the social rule it applied, in one sentence, at the moment of the fix ("first messages ask for advice, not jobs"). Deferred, not built now: accumulated rules can later form a per-person pattern library.
- **Banner at end:** OFF.
- **MVP boundary:** manual contact entry only; rule-based ordering; LLM drafts.
- **Deferred:** import from anywhere, automated reminders beyond in-app (A1 handles surfacing).
- **Risks/open questions:** none.

#### E3. Network Match (Nätverksmatch) — **T4 LABELLED DEMO** · S
- **Current repo state:** absent (nav `natverksmatch` → ComingSoon).
- **Delete/reuse/migrate/build:** BUILD a fully interactive demo screen fed from `demoFixtures` (B-2), with the demo banner ON; the coach row reads `coachCompetence` for its **one real seam** (labelled per-section) — **now live for one row (D9):** when the searched field matches Daniel's real `coachCompetence` row (iGaming / digital product leadership / C-level hiring), the "coach who knows the field" lane renders that real row, labelled per-section; every other lane stays fixture behind the screen banner.
- **Reads:** `demoFixtures` (graph resolution fixture), `coachCompetence` (real seam — Daniel's real row + three placeholders).
- **Writes:** nothing real (a demo query is not logged as activity — activity is for real actions only).
- **Reuses:** the design system; Daniel's real `coachCompetence` row (D9) plus the three remaining fixture cast members (Karin/Jonas/Amina Platshållare — same names/faces/fields on every coach screen; Daniel's real row takes the fourth slot, formerly Peter Platshållare's headhunting/executive archetype).
- **New backend?** Only the `demoFixtures` rows + the generic fixtures route (shared with F3/G1/G2/Community — built once; F4 dropped off this list per D9, its responses are real, not fixture).
- **New frontend?** YES — search box → graph "resolves" (coach who knows it, peer who worked there, template that fits).
- **New prompt discipline?** NO.
- **Banner at end:** ON (flips per-section as data becomes real, starting with the coach row).
- **MVP boundary:** the demo interaction + defining the data contract the real version needs (the addendum's coachCompetence + future graph shapes).
- **Deferred:** everything real (needs consented histories + connection data that do not exist).
- **Risks/open questions:** none — the screen's job is to sell the concept and pin the contract.

### F. Coach

*Category reality (updated by D9, 2026-07-07): exactly one real coach now exists — **Daniel, as the first pilot coach**, reachable through a messaging bridge (not an in-app coach surface). This fires the D4 flip-to-real mechanism for the one surface a single coach can honestly serve: **Coach Review flips real** (request + response both real; responses attributed "Daniel (pilotcoach)"; no banner). Every other coach frontend still GETS BUILT with the fixture cast and keeps its label, because one coach is not yet a network, a coach-facing Case Record, or a live-meeting surface — they flip real by data replacement, not code, when the in-app identity trigger fires (D4/D9).*

#### F1. Case Record (Ärendevy) — **T1 REAL** · M
- **Current repo state:** partial. The case data is real and served; `coach.jsx` renders a fixture CoachWorkspace (Amir/Sara-era); the jobseeker-facing Ärendevy does not exist (nav `arendevy-plan`/`arendevy-coach` → ComingSoon).
- **Existing files:** `src/screens/coach.jsx` (fixture; stays as a D3-bannered demo until the coach variant ships), nav keys above.
- **Delete/reuse/migrate/build:** BUILD the jobseeker-facing read view on templates + a backend **derived read model** (`caseRecord`) that merges case-part transitions, activity events, and collection milestones into one chronological spine with kind-filters. KEEP `coach.jsx` under D3 banner (Wave 4 applies the banner) until the role-flagged variant replaces it.
- **Reads:** the `caseRecord` derived read model (`GET /api/case-record`): cases (all parts' statuses + timestamps), `activity`, `companies`, `outreach`, `blindApplications`, `interviewSessions`, `researchRequests`; later study/funding plans (Omställning lands into the same record).
- **Writes:** nothing (a record, not a cockpit). Coach notes render as a **visibly-empty labelled section** ("Tom tills en riktig coach finns") — honest, never fixture.
- **Reuses:** activity collection (A1 — same events), envelope conventions.
- **New backend?** YES — the derived read-model endpoint (compute-on-read; DERIVED, not stored — repo supports this cheaply over SQLite; see addendum).
- **New frontend?** YES — one page, chronological spine, filter chips (Allt/CV/Ansökningar/Jobb/Research/Studieplan/Aktivitet — wireframe set).
- **New prompt discipline?** NO.
- **Banner at end:** OFF (jobseeker view). The coach-facing variant = same screen + role flag, built when a pilot coach needs the **in-app** coach surface (the identity trigger, D4/D9) — Daniel-as-pilot-coach works through the messaging bridge today without it, so this variant is not unlocked by his sign-on alone.
- **MVP boundary:** jobseeker-facing only; resist the dashboard urge.
- **Deferred:** coach variant, coach notes (the section exists, empty, labelled), sharing/permissions.
- **Risks/open questions:** none — it already exists as data; this is a reading view.

#### F2. Knowledge Hub (Kunskapshubb) — **T2 WIRED-THIN** · M
- **Current repo state:** fixture. `library.jsx` = 6-item hardcoded fixture ("Mallar"); nav `kunskapshubb` → ComingSoon.
- **Delete/reuse/migrate/build:** DELETE the library fixture (its 6 honest items become the SEED of the real collection); BUILD `resources` collection + CRUD + search + the per-item assistant.
- **Reads:** `resources`; the assistant reads one resource (URL/document) per query.
- **Writes:** `resources` (user suggest; approval state visible — "föreslagen" until a coach exists), activity events.
- **Reuses:** the researcher summarisation pattern pointed at a URL/document instead of a company (server-side fetch — no browser-direct calls); grid templates.
- **New backend?** YES — collection + endpoints + the assistant route (summarise/how-do-I-use-this, request-scoped).
- **New frontend?** YES — library grid + assistant drawer per item ("what does this say / how do I use it" — the differentiator).
- **New prompt discipline?** Light — resource summarisation: grounded in the fetched content, cite the item, no person-claims.
- **Banner at end:** OFF ("the content is real, just small — small and honest beats big and fake"). The "320+ resurser" over-claim dies here.
- **MVP boundary:** real CRUD, real search, real per-item assistant, honest seed count.
- **Seed content source + approval (D11):** `docs/KNOWLEDGE_HUB_SEED_LIST.md` — ~28 real resources, links verified at seed time; these become the collection's first rows. The seed items are approved **out-of-band by Daniel at seed time** and recorded with real attribution (`approvedBy` "Daniel (pilotcoach)", D9) — an editorial act, not a workflow. User-suggested resources after that remain **"Föreslagen"** (an honest waiting state) until the in-app coach surface exists, per the **Deferred** note below, which stands unchanged.
- **Deferred:** coach approval workflow beyond the visible state (needs the **in-app** coach surface, D4/D9 — a pilot coach exists via the messaging bridge, but approving resources is an in-app action, not a review-reply, so it waits for the identity trigger), upload of binary docs (links + notes first; PDFs ride imageAssets-style storage later).
- **Risks/open questions:** fetching arbitrary user-suggested URLs server-side needs the usual SSRF hygiene (allow http/https only, no internal ranges) — note for the build.

#### F3. Coach Network (Coachnätverk) — **T4 shell + one real row (D9)** · S
- **Current repo state:** absent (coach-side nav keys → ComingSoon).
- **Delete/reuse/migrate/build:** BUILD the searchable directory screen (**banner stays ON**) + the REAL `coachCompetence` table structure underneath, seeded with **three** placeholder cast rows (`placeholder: true`) and **one real row (D9): Daniel (pilotcoach)** — fields: iGaming, digital product leadership, C-level hiring; `placeholder: false`.
- **Reads:** `coachCompetence` (+ `demoFixtures` for any decorative content).
- **Writes:** `coachCompetence` (hand-entered rows; admin-ish edit path can be a seed script at MVP — no coach self-serve yet).
- **Reuses:** fixture cast convention (B-2) for the three placeholders, design system.
- **New backend?** YES, tiny — the collection + list/search endpoint.
- **New frontend?** YES — search by field/gift/language; cast cards. Daniel's real row renders honestly (unlabelled per-row per the coachCompetence display rule); the three placeholder rows stay labelled.
- **New prompt discipline?** NO.
- **Banner at end:** **ON (directory-level), by decision.** One real coach is not a searchable network, so the *directory* keeps its demo banner even though one row is real (D9). The banner comes off only when the directory is genuinely populated with real coaches. This is deliberately unlike F4, where a single real coach fully serves the *review* interaction.
- **MVP boundary:** directory + real table structure (name, fields, gift, languages, placeholder flag); one real row (Daniel), three placeholder.
- **Deferred:** availability/booking, coach self-service, banner removal (waits for a real network, not merely one row).
- **Risks/open questions:** none.

#### F4. Coach Review (Coachgranskning) — **T1 REAL via the coach messaging bridge (D9)** · S
- **Current repo state:** fixture. `review.jsx` (`MultiCoachReview`) is an Amir/Sara-era comment-thread mockup; nav `review` reachable.
- **Delete/reuse/migrate/build:** DELETE the fixture thread; BUILD the whole loop **real** (D9): request flow REAL (pick artifact from the case — cvDraft/coverLetter versions; add question; submit → a real `coachReviewRequests` record, visible in Ärendevy), and responses REAL — the request notifies the coach's messaging channel via the **coach-channel adapter** (Wave 2 companion, below), the coach's reply returns and is stored as the response (which emits a `review.response_received` activity event), attributed **"Daniel (pilotcoach)"**. **No fixture responses on this screen** — `demoFixtures` no longer supplies Coach Review.
- **Reads:** case artifacts (picker), `coachReviewRequests` (now including the real `responses`).
- **Writes:** `coachReviewRequests` — the person writes the request; the system stores the inbound channel reply as the response (a real human's verbatim words, gate-exempt like the person's own words); activity event (`review.requested`).
- **Reuses:** `useCase` for artifact picking; the **coach-channel adapter** (new, small — see the Wave 2 companion item in §5); `coachCompetence` (Daniel's real row, F3) for the responder identity.
- **New backend?** YES, tiny — the collection + submit/list endpoints + the inbound-response store path fed by the adapter. (The adapter itself — outbound notification, inbound reply capture, channel pluggability — is the separate small work item; this screen consumes its result.)
- **New frontend?** YES — request form + response list rendering **real** responses (no demo label).
- **New prompt discipline?** NO — and emphatically so: responses are a real person's judgment, never generated. No LLM authors a coach voice; the words are stored verbatim.
- **Banner at end:** **OFF.** Resolves unresolved question #1 (§6): the request flow and the responses are both real, so there is no demo state to place a banner on. "Daniel (pilotcoach)" is a real-data attribution.
- **MVP boundary:** working request pipeline + real responses via the bridge, one coach (Daniel), Telegram-first channel.
- **Deferred:** multiple reviewers, an in-app coach surface for composing responses (waits for the D4/D9 in-app identity trigger; the bridge defers it), richer response threading.
- **Risks/open questions:** **privacy (D9 flag)** — a review request carries CV content out through a third-party messenger (Telegram first). Acceptable while Daniel is the only jobseeker (his data on a channel he controls); **must be revisited before any second real jobseeker exists**. Channel is pluggable (Teams an acceptable later swap; WhatsApp only via the official business route if ever needed).

#### F5. Live Support (Mötesstöd) — **T5 CONCEPT PANEL** · S (panel only)
- **Current repo state:** absent (nav `c-motesstod`/`moten` → ComingSoon).
- **Delete/reuse/migrate/build:** BUILD one T5 concept panel (frozen frame composed from design-system components, captured as an image): consent step visible FIRST, live transcript mid-meeting, after-meeting summary + Ärendevy update as callouts.
- **Reads:** `conceptPanels`. **Writes:** nothing.
- **New backend?** Only the panel record. **New frontend?** The shared T5 panel renderer (built once, Wave 4).
- **New prompt discipline?** NO.
- **Banner at end:** Koncept label (a picture cannot lie about being clickable).
- **MVP boundary:** the panel. **When real (parked behind the coach pilot):** self-hosted Whisper (sv) + writer summaries + consent captured as a record BEFORE any processing; upload-a-recording before live.
- **Risks/open questions:** none now (parked by design — meeting intelligence before a single real meeting exists is effort in the wrong order).

#### F6. Feedback Loop (Återkoppling) — **T1 REAL** · S
- **Current repo state:** absent as a tool; the FAKE poll lives in the `community.jsx` fixture (dies with this tool's arrival + Community's banner).
- **Delete/reuse/migrate/build:** BUILD `feedback` + `polls` collections + the screen: suggestions with upvotes, ONE real poll.
- **Reads:** `feedback`, `polls` (results **only after own vote** — enforced at the API, not just the UI).
- **Writes:** `feedback` (user suggestions, votes), `polls` votes; activity events.
- **Reuses:** store CRUD ("half a day of backend" — confirmed realistic), 8-reason-taxonomy pattern for structured feedback categories.
- **New backend?** YES, tiny. **New frontend?** YES, small screen on templates.
- **New prompt discipline?** NO.
- **Banner at end:** OFF.
- **MVP boundary:** suggestions + upvotes + one real poll; results-after-voting (the Pulse rule, standing).
- **Deferred:** admin analytics, poll authoring UI (seed polls via script).
- **Risks/open questions:** none.

### G. Learning layer

#### G1. Knowledge Hive + G2. Outcome Engine — **T4 LABELLED DEMO** · S each
- **Current repo state:** absent (no screens, no nav routes beyond concept mentions).
- **Delete/reuse/migrate/build:** BUILD two demo screens (banner ON) fed from `demoFixtures`, each with **one real element**: the Hive screen's true-counts row — real counts of cases, activities, decisions, research runs read live from the store ("what the hive is already collecting").
- **Reads:** `demoFixtures` + a real `GET /api/hive-counts` (or homeSummary-style counts endpoint).
- **Writes:** nothing.
- **Reuses:** demoFixtures route; design system.
- **New backend?** The counts endpoint (trivial, honest aggregates only).
- **New frontend?** Two screens.
- **New prompt discipline?** NO. **Refused:** fake analytics presented as computed from real usage — the fixture content is visually obviously placeholder + bannered.
- **Banner at end:** ON (both).
- **MVP boundary:** visualise what the layer WILL see; one true number row each.
- **Deferred:** everything real (REQUIRES accumulated usage; the paper's own order builds these last).
- **Risks/open questions:** none.

### H. Delivery surfaces

#### H1. Home (the hub) rebuilt — **T1 REAL** · S/M
- **Current repo state:** partial/hybrid. `home.jsx`: old shell, six pane-level `DemoBar`s, but real `useLiveJobSearch()` + `useActiveCase()` reads. Dead hero buttons/thumbs still present.
- **Delete/reuse/migrate/build:** DELETE the fixture panes, dead heroes, and thumbs ("every dead hero button and thumb dies"); REBUILD on `PageTemplate`; BIND to the `homeSummary` derived read model.
- **Reads:** `homeSummary` (DERIVED — one `GET /api/home`: the one-next-step card from A1's planner, honest counts [new matching jobs from the jobs store, in-flight items from cases/collections], quiet tool entries with per-tool tier labelling).
- **Writes:** next-step interactions proxy to planner (done/snooze), activity view-through only (Home itself logs nothing).
- **Reuses:** A1 planner (the single large next-step card), jobs store, cases.
- **New backend?** YES — the `homeSummary` endpoint (Wave 1; compute-on-read, envelope-per-block so a failing block degrades honestly instead of faking a number).
- **New frontend?** YES — the calm hub: ONE next action, honest counts, grouped-by-need quiet entries (wireframe chips: Sök & matcha / Skapa material / Förbered dig / Ta kontakt / Ny riktning / Min coach); **entries to T4/T5 tools carry their label styling on the card** (the nav stops advertising breadth it cannot honour).
- **New prompt discipline?** NO.
- **Banner at end:** OFF.
- **MVP boundary:** one next action + honest counts + quiet entries. Never a dashboard.
- **Deferred:** personalised ordering, coach presence.
- **Risks/open questions:** Home depends on A1's planner for its centrepiece — Home ships after A1 within Wave 1 (already the plan's order).

#### H2. Phone presence (PWA) — **T2 WIRED-THIN** · S
- **Current repo state:** absent — no manifest, no service worker, no `public/` dir (verified).
- **Delete/reuse/migrate/build:** BUILD manifest + icons + installability + minimal service worker (app-shell cache only, no offline data promises); the responsive pass is already inherited from the templates.
- **Reads/Writes:** none of its own; the in-app reminder surface is A1's.
- **New backend?** NO. **New frontend?** The PWA plumbing.
- **New prompt discipline?** NO.
- **Banner at end:** OFF.
- **MVP boundary:** installable, home-screen icon, app feel. Push notifications deferred; in-app reminders only.
- **Deferred/refused:** native app (only if real usage later demands what the PWA cannot do — the paper's own build order).
- **Risks/open questions:** none.

### Community layer — **T4 now, decision later** · S
- **Current repo state:** fixture. `community.jsx` = full Amir-era fixture incl. the fake poll voting.
- **Delete/reuse/migrate/build:** REBUILD as ONE bannered demo screen (thread, peer story, vouch) fed from `demoFixtures`; the fake poll dies (F6 owns the real one); fixture polls with fixture results are allowed here because the screen is bannered.
- **Reads:** `demoFixtures`. **Writes:** nothing.
- **New backend?** Fixture rows only. **New frontend?** The rebuilt demo screen on templates.
- **New prompt discipline?** NO.
- **Banner at end:** ON.
- **MVP boundary:** the concept demo; it exists so the vision demos coherently and buys time.
- **Fixture content source (D11):** `docs/COMMUNITY_FIXTURE_BRIEF.md` — personas mirror the strategy paper's montage; all content is `demoFixtures`, deleted wholesale if a real community ships, never migrated.
- **Deferred (deliberately not decided now):** self-hosted Discourse/NodeBB skinned vs native-on-store.
- **Risks/open questions:** none (OnlyiGaming lesson stands: a community layer is its own product).

---

### Cross-cutting — The Help Layer (right column): crosslink panel + Lilly — **panel T1 REAL · assistant T2** · M (D11)

Not a category A–H tool — a cross-cutting surface present on every work screen, added here the same way the **coach-channel adapter** (§5) is a cross-cutting companion rather than a tool. One design object, two layers. **Spec of record: `docs/HELLOLILLY_HELP_LAYER_CONCEPT.md` (D11).**

**Component 1 — the crosslink panel (the floor) — T1, no banner.**
- **Current repo state:** the wireframes carry the panel ("Hjälp just nu") on every work screen; no document of record gave it a build item until D11.
- **Delete/reuse/migrate/build:** BUILD a small static rules registry (code/config, not AI) mapping context → candidate slots, plus the panel renderer and its slot components.
- **Reads:** whatever already exists — templates, Hub resources, community discussions, `coachCompetence`, Progress Support's next step, existing dossiers. **Writes:** nothing (a floor, not a tool).
- **Reuses:** every tool's real output; the design system.
- **New backend?** No new shape — the rules registry is code/config, not a store collection (see `REST_OF_SITE_DATA_CONTRACT_ADDENDUM.md` §21). **New frontend?** The panel + slot components.
- **New prompt discipline?** None — no LLM in the panel.
- **Banner at end:** OFF (it only ever links to real content). Fixture slots live only under a T4 screen's existing banner.
- **MVP boundary (concept §3):** the slot types (template · example · video/resource · discussion · coach · next step · research · encouragement) and the **resolution rule (normative): a slot renders only if it resolves to real content**.
- **Deferred:** mobile collapse pattern (Design's call); the two ◇ instrumentation rows the concept proposed for §T were NOT adopted (see the data-contract §T decision).
- **Risks/open questions:** none — it grows richer automatically as later tools ship real content into its slots.

**Component 2 — Lilly, the assistant (the voice above the floor) — T2, no banner.**
- **Current repo state:** absent; the Knowledge Hub per-item assistant (F2) is the *same* assistant, to be unified here, not built twice.
- **Delete/reuse/migrate/build:** BUILD the assistant route (LLM via API + retrieval) grounded in the tool registry (`TOOL_SPECS`), the read models (`homeSummary`, `caseRecord`) and the library (`resources`).
- **Reads:** `TOOL_SPECS` (static, safe), the read models (cited), the library. **Writes:** nothing directly — she navigates, prefills and drafts; the person confirms every write.
- **Reuses:** the same LLM-via-API pattern as the rest of the app; F2's per-item assistant role, absorbed.
- **New backend?** The assistant route (request-scoped). **New frontend?** The collapsed-by-default drawer.
- **New prompt discipline?** YES — the honesty gate applies to any claim about the person (cite datafacts / case parts or refuse); her knowledge of the tools is static and safe.
- **Banner at end:** OFF.
- **MVP boundary (concept §4 — the five v1 capabilities, and ONLY these):** explain any tool (what it does / needs / will not do, grounded in `TOOL_SPECS`); navigate and hand off (deep links with context, person confirms); "what next" (delegated to Progress Support's next-step rules — Lilly never invents her own priorities); explain a resource (the Hub assistant role); answer questions about the person's own state by citing it (from the read models) or not saying it. **Explicitly NOT at v1:** emotional coaching, tone-reading of the person, proactive interruptions, an anticipation engine, long-term conversational memory (conversations are transient at v1).
- **Deferred:** conversation persistence (learning-layer territory); voice via browser speech APIs (after, per the A2 decision).
- **Risks/open questions:** none beyond the D11 open items.

**Refusals (copied verbatim from concept §8 — so nobody relitigates mid-build):**
- No always-on chatter, no proactive interruptions, no engagement mechanics. Banned: streaks, nudges-for-nudging's-sake, "just checking in".
- No bespoke local model at MVP (see 6).
- No autonomous actions - the person confirms every write and every send, always.
- No emotional-state inference presented as fact. Lilly does not do tone-reads of the person at v1, at all.
- No panel slot that does not resolve to real content on a real screen (fixture slots live only under T4 banners).
- No second opinion against another tool's verdict or refusal - the ceiling holds everywhere.

---

## 5. Build waves — reconciled

**Precondition (amended — decided by Daniel, 2026-07-08).** The wave SCREENS still start only after the current priority path completes — Ansökningskoll → CSV upload → honesty pass incl. D3 banners (MASTER_STATE §5). What changed: the Wave-1 **backend slice** no longer waits for the whole frontier. It starts as soon as the **Ansökningskoll work merges** and runs **in parallel with CSV upload and the honesty pass** — the backend slice is deterministic, LLM-free and frontier-untouching (it touches nothing they touch, per `WAVE_1_BACKEND_BUILD_BRIEF.md`). It cannot start *before* Ansökningskoll merges — both edit the same server file. Rationale: every week without the activity collection is learning-layer data lost forever, so the one slice that can safely run early does. Omställning M-phases run on their own track. The waves below then start — screens after the frontier completes, the backend slice on the Ansökningskoll merge.

Repo inspection **confirms the plan's wave order**; nothing proved a different order safer. Two intra-wave sequencing facts (refinements inside waves, not reordering of them):

- **Wave 1 backend builds activity/planner FIRST** even though Research Helper and Prep intake ship to users first. What proved it: inspection showed D1/D2 need almost zero backend (the endpoints already exist and already serve everything their screens need), so Wave 1's backend effort is dominated by Progress Support — and if the activity collection lands before the D1/D2 screens ship, those screens emit events from day one instead of being retrofitted. The user-visible shipping order stays the plan's.
- **Home ships last inside Wave 1** (it consumes A1's planner) — already the plan's order, now with the dependency named.

**Wave 1 — "wire what is built, log what happens" (all T1, ~2 weeks)**
Backend slice first (see `WAVE_1_BACKEND_BUILD_BRIEF.md`): activity + planner collections, host-layer event emission, homeSummary + caseRecord read models, shared envelope conventions. Then: Research Helper UI (D1) → Interview Prep intake (D2) → Progress Support screen (A1) → Case Record view (F1) → Home rebuilt (H1).

**Wave 2 — "the proactive jobseeker" (~2–3 weeks)**
Company List (B1) → Blind Applications (B2) → Outreach Plan (E2) → LinkedIn Helper (E1). One connected story on the three reused skeletons; B1's card actions are designed for B2/E2 from the start.

**Wave 2 companion — coach-channel adapter (small, D9).** A standalone infrastructure item built alongside Wave 2, independent of the jobseeker story. Product-level shape: on a new `coachReviewRequests` record, the adapter sends a notification **out** to the coach's messaging channel (the request + the artifact to review); the coach's reply comes **in** and is stored as the review response (emitting a `review.response_received` activity event), attributed "Daniel (pilotcoach)". The channel is **pluggable** behind one internal interface — **Telegram first** (bot API, no tenant admin); Teams an acceptable later swap; WhatsApp only via the official business route if ever needed. This adapter is what lets Coach Review (F4) ship real; the F4 *screen* itself builds in Wave 4 with the other coach surfaces, consuming the already-landed adapter. (Not built this session — product decision only; see D9.)

**Help Layer placement (D11).** The **crosslink panel (Layer 1)** builds **with the Wave 1 frontend screens** above — it is already drawn on every work-screen wireframe and its rules registry is small and LLM-free, so it rides the frontend work rather than taking a wave of its own, and it grows richer automatically as later tools ship real content into its slots. **Lilly, the assistant (Layer 2),** is her **own small wave after Progress Support Wave B**, because she needs Progress Support's next-step rules (Wave B) to delegate "what next" to, and the Wave 1 read models (`homeSummary`, `caseRecord`) to answer state questions by citation; voice via browser speech APIs comes after that (per the A2 decision). (Not built this session — product decision only; spec of record `docs/HELLOLILLY_HELP_LAYER_CONCEPT.md`, D11.)

**Wave 3 — "confidence and polish" (~2 weeks)**
Interview Trainer text (A2) → spoken mode via browser voice → Image Studio (A3) → Feedback Loop (F6) → Knowledge Hub (F2).

**Wave 4 — "the horizon screens" (~1 week)**
First slice: the label components (screen-level DemoBanner + KonceptLabel + T5 panel renderer) and the `demoFixtures`/`conceptPanels` plumbing — everything after shares them. Then: Job Radar thin-real + concept cards (B3) → Network Match demo (E3, with Daniel's real coach-lane seam per D9) → Coach Network shell (F3, one real row per D9, directory banner stays) → **Coach Review real via the coach bridge (F4 — no banner; consumes the Wave-2 coach-channel adapter; responses attributed "Daniel (pilotcoach)")** → Hive + Outcome Engine demos (G1/G2) → Community demo → the T5 panel batch (Live Support, native-app panel, radar preview cards, any remaining worth-keeping ComingSoon destination) → PWA (H2). One pass keeps the fixture-and-label visual language identical site-wide (F4 is the one screen in this pass that ends real, not labelled — its adapter dependency landed in Wave 2).

**Parked as T5 panels:** Live Support, the native app, tender/investment/leadership radar sources. **Parked invisibly:** fine-tuned models. **Refused on principle (no panel — not-ever gets nothing):** LinkedIn API automation, automated outreach, scraping people, synthetic faces/identity edits, pre-vote poll results, fake analytics presented as computed.

**End state (shifted by one from the plan, per D9):** every Section-8 tool visitable; **~18 real** (Coach Review joined the real column via the D9 coach bridge), 2 thin with labelled previews, **5 honest labelled demos** (Coach Network directory, Network Match, Hive, Outcome Engine, Community); T5 panels instead of blank ComingSoon; zero mandatory new subscriptions.

---

## 6. Unresolved questions (logged, not redesigned)

1. **F4 banner placement — RESOLVED (D9, 2026-07-07).** The question is moot: Daniel signs on as the first pilot coach and Coach Review responses arrive as real human judgment through the messaging bridge, so **both** the request flow and the responses are real. There is no demo state left to banner — the banner comes OFF entirely; responses are attributed "Daniel (pilotcoach)". The only residual is the D9 privacy flag (CV content over a third-party messenger, acceptable while Daniel is the sole jobseeker; revisit before a second). See `DECISIONS_ADDENDUM.md` D9 and §4 F4.
2. **A1 backfill** — synthesize activity events from pre-A1 case history or start clean? Recommendation: start clean. (§4 A1)
3. **Job Radar RSS source list** — which national + regional business feeds; a content decision for Daniel before B3 builds. (§4 B3)
4. **Hiring-delta maturity** — the trailing-average signal is honest only after ~2 months of discovery history; ships behind an honest "signalen mognar" empty state. Accepted? (§4 B3)
5. **Image Studio hosting weight** — CPU inference for ESRGAN/CodeFormer on the current host is unmeasured; the seam is isolated so a paid-API fallback is a swap, but the plan says zero mandatory subscriptions — if local inference is unusably slow, that promise needs a Daniel decision. (§4 A3)
6. **i18n debt on jobSearch.jsx** — an already-rebuilt screen violating the i18n rule; fix opportunistically (B1 touches Jobbsök for add-from-job). (§3 B-5)
7. **localStorage remnants** — saved searches, active-case pointer, letter-reviewed flags, language pref predate the rule. "No NEW localStorage" holds for all wave work; migrating the active-case pointer to the backend is flagged in the Wave 1 brief because Home/Case Record touch it. The rest migrate opportunistically. 
8. **Coach note in `coach.jsx`** — stays as-is until Wave 4 banners it; it is today an unlabelled fixture reachable from nav (`coach` route) — the honesty pass (frontier work, before these waves) is expected to banner it; if it doesn't, Wave 4's first slice must.
