# HelloLilly - Master Plan

**As of:** 2026-07-14 (first written 2026-07-09, after a machine crash wiped the chat windows). This is the single durable picture: what is built, what is being built, what comes next, and every parked decision.

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

## DONE: Progress Support Wave A, the first real-user walkthrough, and two data-integrity fixes

**Progress Support Wave A - merged, on main.** The reusable D5 collection mechanism (`useCollection`, generic collection CRUD routes, the `id`/`at`/`caseId` record convention), the append-only `activity` collection, action-level emitters (`activity-log.cjs`, emitting on the confirmed success path only), and the plainly-labelled verification view. The mandated correctness test holds: a gate-thrown mutation writes NO activity record. Build record: `docs/verification/2026-07-09-wave-a-build-report.md`.

**The first real-user walkthrough - complete.** Daniel's first genuine end-to-end run of the full pipeline. It now completes end to end (it never did before); the problem is no longer that it breaks but the QUALITY and STANCE of the output, concentrated in the CV surface and the tool's voice. Durable record: `WALKTHROUGH_FINDINGS_COMPLETE.md`. The principle it surfaced - advocate, do not audit - is now D14; the CV decisions it deferred are dissolved by `HELLOLILLY_NORTH_STAR.md` (D15-D17).

**Two data-integrity fixes - merged.** The three-layer gap-persistence fix (accepted answers can no longer half-persist; fit + resolution land atomically) and the cv-ingest "[object Object]" corruption fix with its verify-by-identity in-place repair (merged `b48d6eb`; live store clean - pool 143, every reference resolves to the correct source bullet).

---

## NOW: sequencing pending - to be decided against `HELLOLILLY_NORTH_STAR.md`

With Wave A done and the walkthrough in, the next wave is **not yet chosen**. The candidates below are recorded **without an order**; each will be judged against founding intent (`HELLOLILLY_NORTH_STAR.md` §3 and §7: does it translate a proven step of the original system into the product, at outcome parity, as a reusable module?). No sequence is set here.

- **CV-tailoring correction** - bring the live "Skapa anpassad CV" step in line with D15/D16: content adaptation against assumed templates under the outcome-parity standard, not improvised whole-CV structure. (`HELLOLILLY_NORTH_STAR.md` §2, §5b.)
- **Gap-drafting plus the intake engine** - the advocacy-shaped gap-fill drafting (D14) together with the CV-intake datafact-mint engine that turns uploaded documents into verified facts.
- **#8 background analysis** - the background-analysis surface raised as finding #8 in `WALKTHROUGH_FINDINGS_COMPLETE.md`.
- **Progress Support Wave B (demoted)** - deprioritised per the first real-user activity-log read (D18); detail below, now a candidate rather than the automatic next.

---

## CANDIDATE (demoted): Progress Support, Wave B

**Deprioritised 2026-07-14 (D18)** per the first real-user activity-log read - no longer the automatic next, now one of the undecided candidates in NOW. Detail preserved here for when it is picked up. Design pass (Claude Design), then build, against the real logged data Wave A produces. That is the point of the split - the designer sees the actual activity stream rather than an invented fixture.

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

The full set (D1–D18, with D6–D8 deliberately skipped) lives in `docs/DECISIONS_ADDENDUM.md` — the single source of truth. This plan no longer mirrors the decisions here: the mirrored table went stale twice (it stopped at D9 and still carried D4's pre-refinement trigger), so the mirror is retired in favour of this pointer.

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
| `DECISIONS_ADDENDUM.md` | The decisions of record (D1–D18; D6–D8 deliberately skipped). |
| `HELLOLILLY_BACKLOG.md` | The parked backlog — deferred features, docs corrections, engineering follow-ups. |
| `HELLOLILLY_HELP_LAYER_CONCEPT.md` | **(new, D11)** The Help Layer spec of record — the crosslink panel + Lilly the assistant. |
| `KNOWLEDGE_HUB_SEED_LIST.md` | **(new, D11)** The Knowledge Hub seed — ~28 real resources, the F2 approval flow's first content. |
| `COMMUNITY_FIXTURE_BRIEF.md` | **(new, D11)** The Community fixture brief — demo personas and content, all `demoFixtures`, never migrated. |
| `HELLOLILLY_ARCH_RULES.md` | **(new, D12)** The Architecture Rules Addendum — standing law extending the four non-negotiables: anti-blame gate, injection envelope + transitive provenance, maker/checker separation, eval corpus, and the inference-surface registry + real-persons gate. |
| `RETROFIT_LEDGER.md` | **(new, D12)** The shipped paths predating the rules (letter writer, presend judges, Matchanalys prose, A1 researcher); retrofit at next touch, must be empty before any real-jobseeker use. |
| `inference-surface-registry.json` | **(new, D12)** The single machine-readable inference-surface registry (Section 5) — three registered members, membership declared ahead of build. |
| `HELLOLILLY_PHASE_AFTER_PLAN.md` | **(new, D13)** The Phase-After Plan — doc of record for the governance review the real-persons gate waits on, the second human's two paths, the k ≥ 5 learning-layer floor, the padlock rule, and the pilot's smallest honest version. |
| `HELLOLILLY_NORTH_STAR.md` | **(new)** Founding intent + the CV decision — dissolves the CV architecture fork, sets the outcome-parity standard, and holds the full reasoning behind D14–D18. |
| `WALKTHROUGH_FINDINGS_COMPLETE.md` | **(new)** The first real-user end-to-end walkthrough — findings by surface, the advocate-not-audit principle, the CV-machinery orientation, and the deferred CV decisions. |
| `COACH_VAULT_ENRICHMENT_BRIEF.md` | **(new, D21)** External evidence for D21 (coach network reach) — another project's implementation brief for the cookie-free LinkedIn enrichment route, committed unmodified as proof of feasibility (~$4/1000 profiles, proven 2026-07-16). Its repo conventions (tools.http, Rule 3/10, pipeline pool, Supabase) are that project's, **not** this repo's — see the file's header. |

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
