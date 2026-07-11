# HelloLilly - Master Plan

**As of:** 2026-07-09. Written after a machine crash wiped the chat windows. This is the single durable picture: what is built, what is being built, what comes next, and every parked decision.

**Repo:** `github.com/DanielOskarsson01/hellolilly-app` · local `Projects/hello lily - app`
**Main:** run `git log --oneline -1` (a stated hash rots — this one already did)
**Stack:** React 19 + Vite frontend, Node backend, SQLite via the local dev-server. Runs locally (`npm run dev`). The public GitHub Pages site is frontend-only by design - it is static hosting, cannot run Node, so `/api/*` 404s there. This is not a bug. Deployment is deferred (see Parked).

---

## The three-thread workflow

Three separate Claude instances. They share no filesystem. Daniel is the only bridge.

| Thread | Does | Never does |
|---|---|---|
| **Planner** (the chat that produced this) | briefs, scope notes, decisions, design specs, merge calls | writes feature code |
| **Claude Code** | builds in the repo, on branches | merges without independent review |
| **Claude Design** | designs screens in a browser canvas | receives a draft; works from the design system, sibling screens, fixtures, and a brief |

**Standing rules.** British English, hyphens only. One build wave at a time. Nothing merges without three review layers: per-task, whole-branch, and an independent fresh-clone pass. Grep the file before trusting any report that says a design handoff is done. Name the project in the first line of any paste (cross-wiring with the content-pipeline project has bitten repeatedly). Commit early and often on branches - uncommitted work survives nothing.

---

## DONE: the Kind-1 spine

The complete personal job-search loop, real and honest on durable data. Merged, on main.

1. **Jobbsök** - 153 stored jobs, live triage, approve/reject with an 8-reason taxonomy. Durable decisions survive restart.
2. **Matchanalys** - fit and gaps against the decoded role, every match cited to a real datafact, a fill-gap loop that mints new facts.
3. **CV-byggaren** - the CV assembled from datafacts, each item carrying its source id.
4. **Personligt brev** - the cover letter, with the Ärlighetskoll panel flagging claims the CV does not support (keep / soften / cut).
5. **Innan du skickar** - the pre-send fit-check. Draft-coverage (does the drafted CV actually evidence each requirement, computed by datafact-id set intersection), CV-only keyword alignment behind a server-side honesty judge, letter checked for requirement-fit only, qualitative readiness with no number, and an explicit disclaimer that it cannot read the employer's real ATS.

**The honesty seams that hold across all five.** No fabricated match percentage. No claim to see inside an employer's ATS. No keyword alignment that turns a true claim false. No fabricated letter-fit - where the system cannot tell, it says so. No readiness score that could read as an employer verdict. Every requirement traces to a real datafact.

---

## NOW: Progress Support, Wave A

**Branch:** `progress-support-wave-a` (off `398c740`, not merged)
**State:** spec (`4d3571e`) and 8-task plan (`db69e7f`) committed and independently re-verified against the code. Three doc nits being fixed. Build has not started.

**Why this is first in Kind-3.** Every week activity is not logged is data the future learning layer loses forever. It cannot be backfilled. This wave starts the clock. It also builds D5, the generic collection mechanism nearly every later tool inherits.

**What Wave A builds.**

- **D5, the reusable foundation.** The storage primitive already exists (`putRecord` / `getRecord` / `listRecords` / `removeRecord`, plus a generic `collection_records` table in SQLite, used today by jobs, jobSources, jobRules, filterSet). A new collection is new rows under a new name - zero DDL. Three thin additions turn it into a product: a `useCollection(name)` hook generalized from the working `useJobs`, generic collection CRUD routes generalized from the jobs routes, and a record convention (`id`, `at`, `caseId`).
- **The `activity` collection** - append-only records `{ id, at, type, caseId?, label, meta }`.
- **Action-level emitters.** One `activity-log.cjs`; each server action handler calls `logActivity(...)` on its success path, after the confirmed store call. Not store-level interception - that mislabels align-vs-generate and gap-fill-vs-analyze (both write the same part), double-emits on bundled actions, and floods the log with seeding noise. A mislabeled log is worse than a slightly riskier emitter, because Wave B and the learning layer consume these labels.
- **A minimal, plainly-labelled verification view** - a chronological list, honest states, nothing designed.

**The mandated test.** A gate-thrown mutation writes NO activity record. The log records what happened, never what was attempted. This is Wave A's correctness point, the equivalent of the draft-coverage test on the last screen.

**Two decisions locked into the record shape.**
- **One collection, two audiences.** The same activity collection feeds the jobseeker's "Min aktivitet" (real, Wave B) and the coach-facing "Ärendevy" (a labelled demo until the D4 trigger fires). One source of truth, so the two views cannot drift, and when the coach view goes real it reads history that has been accumulating since Wave A. `CASE_RECORD` in `src/data/strategyData.js` is the target shape.
- **Local-backend.** D5 storage is SQLite via the dev-server. No client-side adapter for the static build.

**One open verification for the build.** `research_run`: it is unconfirmed whether dossiers persist before a decoder failure. If they do not, `research_run` must not emit on partial failure. This is the one place the confirmed-not-attempted property could leak. Verify, do not assume.

---

## NEXT: Progress Support, Wave B

Design pass (Claude Design), then build, against the real logged data Wave A produces. That is the point of the split - the designer sees the actual activity stream rather than an invented fixture.

The fuller surface: the activity timeline proper, weekly cadence, task-breakdown (a second `tasks` collection, proving D5 generalizes), next-step and overdue rules derived from state, and the motivational framing. Tone matters here and is a correctness property, not polish: the strategy paper says activity logging exists "to help the person remember, restart, and recover. It is not a monitoring tool." This surface is aimed at people with low energy, ADHD, anxiety, where the next small step is the difference between progress and paralysis.

Claude Design will work from the design system, four sibling screens, the `CASE_RECORD` and `NEXT_ACTIONS` fixtures, `TOOL_SPECS.activity`, and Wave A's real data. It has never needed a draft and does not need one here.

---

## THEN: interview-prep, the main Kind-3 thrust

The most native area: its stages map onto contract slots that already exist (`prep`, `cards`, `liveLog`, `postMortem`), so no new storage design is needed. Full map in `docs/KIND3_ROADMAP.md`.

- **Stage 1 Intake** - small. Paste the ad, pick the CV version, confirm the system's understanding before spending research money.
- **Stage 2 Research** - the heavy orchestration lift. The engine exists and is live-verified; the concept asks for five fronts in parallel, streaming partial results, and a drill-deeper loop. Thin version cheap; full version is the big lift.
- **Stage 3 Analysis** - largely Matchanalys reuse, repointed at the decoded role, plus preference-fit.
- **Stage 4 Prep package** - three reading densities plus a card deck. The compression is mechanical, not AI, because each section carries its own compressed form inline.
- **Stage 5 Live call** - the summit. Different runtime entirely: streaming audio, sub-second card matching. Replay harness first, driven by a scripted session. Live audio last of all.
- **Stage 6 Post-mortem** - works genuinely on day one with a manually written record; becomes automatic once Stage 5 exists.

**Order within the area:** 1 → 2-thin → 3 → 4 → 6-manual, then 2-full, then the Stage-5 replay harness, then live audio.

---

## The rest of Kind-3, dependency-ordered

**Pure wiring over built backends (no new storage, no identity):** Research Helper (best value-per-day on the board), Interview Trainer as text, jobseeker-facing Case Record, Home rebuilt, scheduled discovery.

**Collection-backed, after D5 lands:** Company List (cheapest real tool in the suite), Blind Applications, Outreach Plan, LinkedIn Helper (walks you to the send button and stops - your finger does the posting), Knowledge Hub, Feedback Loop, Image Studio (same face, better photograph; never alters identity).

**Split-tier and demo:** Jobbradar (two signal sources real today, the rest labelled concept cards), rejection-learning (buildable, deliberately gated on a review budget because it is safety-critical), the Omställning re-skilling area (own build plan, free public data), Network Match (simulated - the demo defines the contract the real version needs), the coach tools (fixture cast until a pilot coach), Knowledge Hive and Outcome Engine (require accumulated real usage; faking them functionally is the one dishonesty the project forbids), Community.

**Not yet:** Stage 5 live, Live Support meeting intelligence, a native phone app, fine-tuned models.

---

## Decisions of record

In `docs/DECISIONS_ADDENDUM.md`.

| # | Decision |
|---|---|
| D1 | Durable SQLite via `node:sqlite` |
| D2 | `cv_data.json` lives in the repo |
| D3 | The nine demo screens carry a "Demo - exempeldata" banner |
| D4 | **Multi-user identity: defer.** The contract is multi-user-additive, so scoping later changes data, not shape. Coach surfaces, community, and the learning layer ship as labelled demos with a fixture cast. **Trigger: the first pilot coach signs on.** |
| D5 | **Generic named-collection mechanism: build one.** First customer is Progress Support's activity events. Every collection-backed tool after that gets cheaper. |
| D9 | Daniel as first pilot coach, messaging-bridge model. **Confirm consciously** - this refines the D4 trigger, which is the biggest structural decision on the board, and it arrived during a docs-hygiene session rather than a deliberate one. |

---

## Documents of record

The plan indexes itself here (a prior gap: it never did). All paths under `docs/` unless noted.

| Document | What it is |
|---|---|
| `product-vision/` (the strategy paper set) | The vision and strategy corpus — the source every tool traces back to. |
| `HELLOLILLY_REST_OF_SITE_PLAN_v3.md` | The rest-of-site build plan (the tools after the Kind-1 spine). |
| `design/hellolilly_ux_wireframes_v1.html` | The wireframes (every screen, including the "Hjälp just nu" panel on the work screens). |
| `REST_OF_SITE_RECONCILED_DESIGN.md` | The tool-by-tool reconciliation of plan against repo — tiers, build waves, the Help Layer cross-cutting entry. |
| `REST_OF_SITE_DATA_CONTRACT_ADDENDUM.md` | The noun vocabulary — every stored shape, read model, the non-shapes (§21), and the activity taxonomy (§T). |
| `WAVE_1_BACKEND_BUILD_BRIEF.md` | The Wave 1 backend-slice brief (activity/planner collections, read models, host-layer emission). |
| `KIND3_ROADMAP.md` | The dependency-ordered map of everything after the Kind-1 spine. |
| `DECISIONS_ADDENDUM.md` | The decisions of record (D1–D11). |
| `HELLOLILLY_BACKLOG.md` | The parked backlog — deferred features, docs corrections, engineering follow-ups. |
| `HELLOLILLY_HELP_LAYER_CONCEPT.md` | **(new, D11)** The Help Layer spec of record — the crosslink panel + Lilly the assistant. |
| `KNOWLEDGE_HUB_SEED_LIST.md` | **(new, D11)** The Knowledge Hub seed — ~28 real resources, the F2 approval flow's first content. |
| `COMMUNITY_FIXTURE_BRIEF.md` | **(new, D11)** The Community fixture brief — demo personas and content, all `demoFixtures`, never migrated. |
| `HELLOLILLY_ARCH_RULES.md` | **(new, D12)** The Architecture Rules Addendum — standing law extending the four non-negotiables: anti-blame gate, injection envelope + transitive provenance, maker/checker separation, eval corpus, and the inference-surface registry + real-persons gate. |
| `RETROFIT_LEDGER.md` | **(new, D12)** The shipped paths predating the rules (letter writer, presend judges, Matchanalys prose, A1 researcher); retrofit at next touch, must be empty before any real-jobseeker use. |
| `inference-surface-registry.json` | **(new, D12)** The single machine-readable inference-surface registry (Section 5) — three registered members, membership declared ahead of build. |

---

## Parked, in `docs/HELLOLILLY_BACKLOG.md`

**Deferred features.** Hosted deployment (shortest path is the existing Hetzner box, PM2, serving SPA and `/api/*` same-origin - do not let it become a frontend rewrite). Actively-delivered push reminders (infrastructure-blocked: no push, service worker, email, cron, or queue anywhere, and nowhere for a background nudge to fire from). A client-side storage adapter for the static build.

**Docs corrections.** The D4/D5 numbering collision between the addendum and the Omställning area doc. The naming split: "Innan du skickar" is the shipped pre-send fit-check; "Ansökningskoll" is the not-yet-built post-send tracking screen, and D5's first customer is now Progress Support's activity events, not Ansökningskoll's application card. RESUME.md refresh.

**Engineering follow-ups.** Real semantic letter-fit read. Richer keyword basis source (currently high-precision only: quoted phrases and ALLCAPS acronyms). Aligned-keyword undo UI (reversible in data via `priorText`, not yet surfaced). Refusal-reason attribution (a conservative "could not verify" refusal currently renders identically to a judged-unrelated one). A vitest + jsdom frontend harness. The CV-intake datafact-mint engine. Delete orphaned `JobAnalysisContent`. Point-and-build the `#ansokningskoll` route - three shipped screens link to it and dead-end. Delete merged branches and stale worktrees after each merge.

---

## Recurring hazards, learned the hard way

**Multi-window collisions.** Two sessions on one worktree, or `git push origin main` from a window that does not know what else is on local main. Dropbox syncing `.git` between windows makes it worse. Keep one active build window. Have one window own main.

**Stale files and stale reports.** A design handoff came through as the pre-pass fixture three or four times while the report said "done". Grep the file before building on it.

**Chat-only artifacts.** MASTER_STATE, the decisions addendum, and the Kind-3 roadmap each nearly died as chat output. Claude Code correctly refused to reconstruct them. Everything canonical now lives in `docs/`. Write it to a file the moment it is canonical.

**Uncommitted work.** The crash that wiped the chat windows cost nothing, because the spec and plan had been committed. Commit early, commit often.
