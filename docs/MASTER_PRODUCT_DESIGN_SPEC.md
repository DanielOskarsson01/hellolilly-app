# HelloLilly - Master Product & Design Spec

**Date:** 2026-07-02
**Purpose:** One consolidated picture of the whole HelloLilly jobseeker product, for handoff to a design model (claude.ai) that will do the visual build. It merges every existing source - the Jobseeker Product Vision, the Development Plan (A0-A9), the Data Contract, the Education & Re-Skilling area, and the factual code inventory (`PROJECT_INVENTORY.md`) - into a single reference.
**Two lenses on every surface:**
- **BUILT** - real code exists today. The entry names the real API endpoint / case part / submodule the design should **bind to**, so screens can show live data. (Honest caveat: today *no* screen actually calls the HelloLilly backend - every screen reads fixtures, localStorage, or external APIs. "BUILT" means the backend capability + endpoint exist and the design *should* wire to them, not that the current screen does.)
- **PLANNED / CONCEPTUAL** - not built. Spec'd **as-if-real**: an invented but realistic data shape it would read/write, full page structure, and sample content, so it can be designed convincingly.

**One demo persona everywhere:** all sample content uses a single real user - **Daniel Oskarsson**, an iGaming / marketing senior leader (see Section 1). Honesty rules apply (every fact is real; MrGreen = founding team, not CPO; ComeOn = CMO/CPO/COO; ~200 people not 250+). Never the old Amir Hassan / PostNord warehouse fixture.

**One cross-cutting element:** the **crosslinking side-panel** ("organise help by situation") appears on every surface - it surfaces the right coach, peer, template, research, or next action next to whatever the user is doing. Treat it as a standing right-rail on all screens.

---

## Contents

1. **Section 0 - Product orientation** (what HelloLilly is, the tool catalog, the build order)
2. **Section 1 - The demo persona: Daniel Oskarsson**
3. **Section 2 - THE BUILD** (real surfaces + backend wiring - bind the design here)
4. **Section 3 - PLANNED / CONCEPTUAL surfaces** (every vision tool + Re-Skilling, as-if-real)
   - A. Execution · B. Opportunity · C. Preparation · D. Network · E. Coach · F. Learning layer · G. Delivery surfaces · Education & Re-Skilling
5. **Section 4 - Data model reference** (real shapes to bind to + conceptual shapes for planned areas)
6. **Section 5 - Handoff note for the design model**

---

## Section 0 - Product orientation

### HelloLilly — Vision Catalog Reference

*Sources: `HelloLilly_Jobseeker_Product_Vision.docx` (master vision), `DEVELOPMENT_PLAN.md` (interview-prep build A0–A9), `HelloLilly_Education_Reskilling_Area.md` (new area). This is the orientation + roadmap reference.*

---

#### 1. The Pitch + The Core Idea

**One-paragraph pitch.** HelloLilly is Sweden's largest matching-services provider (60+ municipalities, results-based funding, a 2030 goal of matching 10,000 people to work or education). The infrastructure already exists — coaches, employer relationships, and the Workbuster Matcha admin skeleton that stores data, schedules, and documents. What is missing is **the layer above it**: a connected, AI-supported system that meets each jobseeker on their own terms, helps them *act between meetings* (not just receive advice), gives every coach access to the whole organisation's knowledge, and turns every case into learning for the next person. It carries the *formalia* (CV, cover letter, research, outreach, interview nerves) so the jobseeker's energy goes to showing who they really are, and frees coaches for the human work only they can do. "The connected system that turns advice into outcomes."

**The problem it answers.** Everyone who is stuck is stuck for a *different* reason — there is no typical jobseeker — and no single coach can hold the full width of human difference. Today, outcomes depend on which coach you happened to meet and which gifts that one person has; nothing connects across people and nothing accumulates over time.

**The core idea — the crosslinking layer ("organise help by situation").** The most important part of the system is *not any single tool*. It is the way every tool, person, resource, case, discussion, template, video, coach and piece of knowledge is **crosslinked to whatever the jobseeker is doing at that moment**. Most systems organise information *by category*; this one **organises help by situation**. The jobseeker should not need to know whether they need a template, a coach, a video, a discussion, a job search, a research note or an interview exercise — the system reads the context and connects the right support, appearing *next to the work* rather than somewhere the person has to leave the task to find it. The tools are the visible layer; the crosslinking is the system — and it is what makes HelloLilly's advantage hard to copy (individual AI tools are a weekend's work; a crosslinked base built from HelloLilly's own coaches, cases, outcomes and Swedish labour-market knowledge is not).

---

#### 2. The Full Tool Catalog (Categories A–G)

*Every tool with EN + Swedish name and one-line purpose. Six categories in the master vision (A–G) plus the Education area (H, new).*

##### A. Execution tools — *get the actual doing done*
| Tool (EN) | Swedish | Purpose |
|---|---|---|
| CV Builder | CV-byggare | Get past the blank page — a usable first CV, improved and adapted over time. |
| Cover Letter Builder | Personligt brev | Relevant cover letters from the advert + CV + situation; handles concerns (gaps, age, career change, limited Swedish). |
| Application Check | Ansökningskoll | Practical fit check vs the advert — missing keywords, weak requirements, what to fix before sending (not a real ATS). |
| Progress Support | Framstegsstöd | Reminds, motivates, breaks tasks into small steps; logs activity (incl. *My Activity / Min aktivitet*). |
| Interview Trainer | Intervjuträning | Realistic, adjustable interview simulation with follow-ups and AI voices — builds safety, not just better answers. |
| Image Studio | Bildstöd | Help create/choose better profile images for CV, LinkedIn, professional contexts. |

##### B. Opportunity tools — *find work, visible and hidden*
| Tool (EN) | Swedish | Purpose |
|---|---|---|
| Job Search | Jobbsök | Gather jobs from multiple public sources in one place; learns from clicks/saves and improves search terms. |
| Match Analysis | Matchanalys | Explains the match % — why suitable, what's missing, what to highlight, whether it's worth applying now. |
| Job Radar | Jobbradar | Find opportunities *before* they become adverts — monitors news, expansions, tenders, hiring signals. |
| Company List | Företagslista | The jobseeker's own wish-list of employers, manual or system-suggested, with fit/roles/signals/contacts. |
| Blind Applications | Spontanansökningar | Contact companies with no published role — fewer but better, researched, personal, well-timed outreach. |

##### C. Preparation tools — *show up ready*
| Tool (EN) | Swedish | Purpose |
|---|---|---|
| Research Helper | Researchstöd | Do the right research in the right amount — templated by situation; separates signal from noise. |
| Interview Prep | Intervjuförberedelse | Connects research + advert + CV + Interview Trainer into structured prep for a *specific* real interview. |

##### D. Network tools — *activate people, contacts, community*
| Tool (EN) | Swedish | Purpose |
|---|---|---|
| LinkedIn Helper | LinkedIn-stöd | Safety/confidence tool — check and improve LinkedIn communication before sending; not automation. |
| Outreach Plan | Kontaktplan | Plan professional contact (who, why, order, message, follow-up) — esp. for those who struggle with social rules. |
| Network Match | Nätverksmatch | Surface any connection between jobseeker, coaches, HelloLilly's network and a specific company/industry. |

##### E. Coach tools — *support everything outside a coach's own expertise*
| Tool (EN) | Swedish | Purpose |
|---|---|---|
| Case Record | Ärendevy | One living shared picture of the jobseeker's journey — goals, barriers, versions, activity, next steps. |
| Live Support | Mötesstöd | Help during/after meetings — consented recording, transcription, summaries, follow-ups, auto-documentation. |
| Coach Network | Coachnätverk | Make HelloLilly's internal competence searchable — route to the coach with the right background. |
| Coach Review | Coachgranskning | Ask several coaches for constructive feedback on a CV/letter/profile/strategy without starting over. |
| Knowledge Hub | Kunskapshubb | Templates, links, guides, videos, docs, FAQs in one place — coach-approved, with a per-item assistant. |
| Feedback Loop | Återkoppling | Help HelloLilly learn from users/coaches — polls, suggestions, upvotes; spot where many get stuck. |

##### F. Learning layer — *turns experience into intelligence over time*
| Tool (EN) | Swedish | Purpose |
|---|---|---|
| Knowledge Hive | Kunskapssystem | The long-term core — accumulates coach/case/outcome knowledge; the hardest thing to copy. |
| Outcome Engine | Resultatmotor | Connects actions to results — which support/coach/tool/path actually leads to jobs or education. |

##### G. Delivery surfaces — *where the system lives*
| Surface (EN) | Swedish | Purpose |
|---|---|---|
| The hub | *(the hub)* | A calm home — one clear next action, visible progress, quiet entry points to every tool. |
| An app on the phone | *(mobile app)* | The whole suite in the pocket — iOS/Android, reminders/nudges for people who live on a phone. |

##### H. Education & Re-Skilling area — *(new area, not in original A–G)*
*Triggered when a gap cannot be bridged from existing experience. Six tools; 1, 3, 5 are the core MVP, 2 underpins them, 4 & 6 are fast-follows. Swedish UI names not yet assigned in the source.*
| # | Tool (EN) | Purpose |
|---|---|---|
| 1 | Course-Fit Evaluator | Ranks the *few* courses that actually close the decisive gaps for the target role. |
| 2 | Skills-Gap → Skills mapper | Maps decoded requirements + candidate evidence onto an ESCO/O*NET skills frame (gaps named as *skills*). |
| 3 | Demand Signal | Pulls local/role demand so recommendations target real demand, not just available courses. |
| 4 | Validering check | Flags where prior learning could be formally recognised — before recommending a full programme. |
| 5 | Pathway outcomes + honest timeline | Shows evidence (e.g. YH employment rate) + honest ramp time; contrasts "apply now" vs "retrain". |
| 6 | Blended / low-friction mode | Spoken/guided mode + coach hand-off, so the path isn't gated by digital literacy. |

---

#### 3. Build Order

##### A. Vision phases (master vision, four phases)
Each tool ships independently; phases sequence for early real value with the connected layer growing around it.

- **Phase one — Foundation (Grundsystem):** CV Builder, Cover Letter Builder, Application Check, Progress Support, Case Record, Knowledge Hub *(+ simple crosslinking)*. Immediate value, relatively easy to build.
- **Phase two — Matching (Matchning):** Job Search, Match Analysis, Interview Trainer, Research Helper, Interview Prep. Moves from *material* to *direction, selection and practice*.
- **Phase three — Network (Nätverk):** LinkedIn Helper, Outreach Plan, Company List, Blind Applications, Network Match, Coach Network, Coach Review. Activates contacts, timing, trust, introductions.
- **Phase four — Market & learning (Marknad):** Job Radar, Live Support, Feedback Loop, Knowledge Hive, Outcome Engine. System reads the labour market, finds hidden opportunities, improves itself.

**What NOT to build first:** the full Outcome Engine; advanced Live Support beyond a simple summary; full network mapping; a polished native app (responsive web is enough); any fine-tuned models; heavy data integrations beyond public sources; automated employer outreach.

##### B. Interview-prep suite phases (A0–A9, from DEVELOPMENT_PLAN.md)
Two governing rules: **(1)** a skeleton that hosts submodules and brokers every inter-submodule call (the switchboard that can refuse a loop / stop a cascade); each submodule also runs alone. **(2)** built *inside* Hello Lilly, isolated from OnlyiGaming production — reuse the *patterns* (tiered scraping, search-grounding), never couple to its running systems. A1–A4 are independent once A0 exists; recommended order is by value-per-effort and de-risking the hardest pieces (audio) last.

| Phase | Name | One line | Maps to vision tool(s) |
|---|---|---|---|
| A0 | Skeleton + foundations | The host + call-broker, shared DB shape, data contract, writing-rules enforcement. | *(architecture — underpins Knowledge Hive / crosslinking layer)* |
| A1 | Researcher | Five-dossier research (company, product, people, true-job decoder, niche) + reader-driven deep search. | Research Helper / Interview Prep |
| A2 | Decoder + Analyzer | Consume the decoded role profile → two-way fit (capability + preference), each gap bridged; emits the gap set. | Match Analysis / Application Check |
| A3 | Co-op Dialogue | Gap-by-gap elicitation of adjacent experience never on the CV; feeds bridges, paste-suggestions only. | *(CV enrichment — feeds CV Builder / Match Analysis)* |
| A4 | Prep Generator | Three densities (PREP / CHEAT_SHEET / QUICK_REF), the card deck, the CV story slide-set. | Interview Prep |
| A5 | Live Coach | Two-zone call surface — ticker of one-click offers + workspace hotlinks; in-memory audio, no transcript. | *(Interview Trainer, live variant)* |
| A6 | Post-mortem | Distilled record → weakness harvest + new-info harvest, thank-you draft, round-two starting position. | *(feeds Case Record / Outcome Engine)* |
| A7 | The string | All submodules wired through the skeleton; first full end-to-end acceptance run on Curoflow. | *(integration — the connected system)* |
| A8 | Central learning tool | Reads across the whole store — compile / learn / predict / suggest: **the crosslinking layer + Knowledge Hive**, scoped to the interview suite. | Knowledge Hive / Outcome Engine / crosslinking layer |
| A9 | Education & Re-Skilling | Course-fit submodule: unbridgeable gap in → honest, demand-first `learningPlan` out (course / validate / reframe, expected outcome + ramp time, always the "apply now anyway" fork). | Education & Re-Skilling area (H) |

**Dependency notes:** A8 comes last (it learns from data A1–A7 produce — nothing to compile until they've run, but the DB must exist from day one so it *can* see everything). A9 is an *adjacent product area*, not a step in the string — depends only on A0, A2 (the gap set) and A3 (the honest "stays a gap" trigger), so it can be built any time after A3, in parallel with A4–A8.

---

#### 4. Why People Engage (in brief)

**For jobseekers** — you're not alone (see others in the same situation); always a clear *next step* (no blank-page paralysis); see people get out (proof + motivation); a real community (forums, not just a portal); help in one place, adapted to you; share contacts and vouch (the startup-incubator mechanic); works whatever your tech comfort (light spoken mode *or* full control); coach-approved content in one place, with an assistant under every item.

**For coaches** — an internal system of their own (shared presentations, every coach's profile visible); help analysing and answering (a Sweden-specific knowledge base the assistant draws on); meeting intelligence (consented transcription/analysis); a living profile for every jobseeker; coaching prompts that grow (flags when support / another coach is needed); more time for the human work (the report writes itself, the tool carries the mechanical load).

**For HelloLilly** — faster, better matches (tied to funding + the 2030 goal); a higher, consistent quality standard across offices; documented activity as an automatic byproduct; durable IP (coaching expertise captured as a company asset, not lost when people leave); easier to attract expertise; a new kind of hire (with AI carrying the baseline, bring in *specialists* — autism, ADHD, age, youth, newcomers, disability — not only generalist coaches).

**The moat:** the tools are easy to copy; the expertise is not. The value is an outcome-weighted knowledge base built from HelloLilly's own coaches' real work — a flywheel (more coaches → richer base → more outcome data → sharper weighting) a rival starting from zero cannot catch. Human relationships still beat generic AI; the system augments the coach, never replaces them.

---

## Section 1 - The demo persona: Daniel Oskarsson

*Use this persona for ALL sample content across every surface. Every fact is real and traces to the CV evidence library; obey the honesty rules.*

### DEMO PERSONA PACK - Daniel Oskarsson

> Reusable persona for sample content across the product design. The persona is the REAL user. Every fact traces to `EVIDENCE.md` and `cv_data.json`. Honesty rules obeyed: ~200 (never 250+), MrGreen = founding team (never CPO), no Reddit/Discord/poker-community or crypto-community-growth claims, hyphens only (no em/en dashes), banned buzzwords avoided.

---

#### 1. Headline + Positioning

**Headline:** iGaming growth and marketing leader - 17 years owning the full funnel, now building AI content tooling by hand.

**Positioning (2 lines):**
Senior marketing and growth leader with 17 years owning the full marketing funnel and 15+ years in iGaming (operator side). Scaled two startups to NASDAQ-listed operators, built BI and retention machines that raised player lifetime value, and currently builds a B2B iGaming AI content platform end to end - so the data-and-AI conversation is first-hand, not borrowed.

---

#### 2. Signature Real Achievements (reuse these verbatim-safe)

Each is sourced. Pull the ones that match the screen.

| # | Achievement | Company / era | Traceable to |
|---|-------------|---------------|--------------|
| A1 | **The retention "defibrillator" experiment.** The industry threw money at reactivating already-churned players. Ran a controlled test (full reactivation treatment vs a control group on normal scheduled emails); the uplift was only ~5%, so killed it. Built predictive risk-scoring models from behavioral signals (declining session frequency, smaller deposits, shorter sessions, big losses in short windows) and shifted to a proactive direct-action team that reached players before they slipped. **Result: active player lifespan rose from ~2.5 to ~3.5 months and LTV rose roughly 10-20% across the base**, at a fraction of the reactivation cost. | MrGreen | EVIDENCE Data/BI bank; `star_stories[1]` |
| A2 | **Channel mix by LTV, not CPA.** Affiliates scaled easily but brought lower-LTV, higher-churn players; TV delivered higher impact and he had BI that measured ROI per TV spot, timeslot and channel (rare in iGaming then). Rebuilt budget allocation around LTV, lowering blended CPA while raising customer quality. | MrGreen / ComeOn | EVIDENCE Data/BI bank; `value_propositions[6]` |
| A3 | **MrGreen founding team - brand and CRM from zero.** One of the founding team; built the brand from a blank page (brand book, CI, communication manual) and initiated the profitable CRM department; increased active players ~400% in one year via a new CRM communication strategy; hit a 2-year target in 6 months as Swedish Country Manager; interim Country Manager for 4 countries at once. **Founding team, not CPO.** 7 to ~200 people, NASDAQ. | MrGreen | EVIDENCE roles + honesty rule; `jobs.mrgreen` |
| A4 | **ComeOn CMO/CPO/COO - built marketing and product from scratch.** 12 to ~200 people, NASDAQ; full P&L; created 5 departments (SEO, BI/Analytics, CRM/VIP, Affiliates, Creatives, Product) plus an innovation department; contributed to ComeOn becoming the world's 2nd fastest-growing listed iGaming company (2015); Best Online Gaming Operator (IGA) 2014-2017. | ComeOn/Cherry | EVIDENCE roles; `jobs.comeon` |
| A5 | **OnlyiGaming AI content platform - building it by hand.** A modular, configurable content pipeline: multi-source scraping, AI generation, validation gates, quality scoring, 11-step workflow with approval gates, multi-agent AI workflows. Stack: Node.js, Express, BullMQ workers, Supabase (PostgreSQL) schema design, Redis, PM2, Docker, Hetzner; Next.js and Strapi. 81 iGaming company categories mapped; self-service profile-claim flow. | OnlyiGaming (2020-now) | EVIDENCE AI bank; `jobs.onlyigaming` |
| A6 | **Built BI from scratch with no board budget** (ComeOn): MVPs first, then scaled; moved BI from after-the-fact reporting to real-time, customer-facing decisions and predictive personalization. Tools: **Tableau** (dashboards/visualization), **Alteryx** (data prep + the predictive models); hired a Swiss head of BI and an Austrian mathematician. | ComeOn | EVIDENCE Data/BI bank; `star_stories[0]` |
| A7 | **Works through AI agents daily** - delegates research, drafting, analysis and code review to AI agents while keeping the judgment calls. | Current operating model | EVIDENCE AI bank; `value_propositions[7]` |

**Honesty guardrails baked into the above:** ~200 (not 250+); MrGreen never labelled CPO; the ~5% figure is the reactivation-test result (kept, not hidden); Tableau/Alteryx/GA/BI are the only named tools - no SQL, Mixpanel, Amplitude, HubSpot, Salesforce.

---

#### 3. Skills List

**Growth and marketing:** full-funnel ownership (TV, digital, affiliates, CRM, SEO); acquisition and retention; channel mix by LTV; brand building and positioning; CRM and lifecycle; media buying; 20+ brands built.

**Data and BI:** business intelligence and predictive analytics; player-behavior analytics; retention cohorts; Tableau; Alteryx; Google Analytics; BI dashboards. KPI ownership: CPA, FTD, registration-to-deposit conversion, LTV, LTV:CAC, ARPU, NRC, NDC, churn.

**Product and platform:** iGaming platform specs and PRDs; UX/UI and gamification; smart CMS; build-vs-buy provider selection.

**AI and engineering (hands-on):** AI / LLM orchestration and multi-agent workflows; Node.js / Express; BullMQ; Supabase / PostgreSQL schema design; Redis, PM2, Docker; Next.js, Strapi.

**Leadership:** scaling startup to NASDAQ (x2); full P&L; org-building; international teams up to 120 people.

**Languages:** Swedish (native), English (fluent), German (professional).

---

#### 4. Target Roles (3 real, with company names from week23)

| Role | Company | Source | Why Daniel fits |
|------|---------|--------|-----------------|
| **Head of Growth** | A5 Labs / QuintAce | LinkedIn 4420117327 | Content-to-distribution engine, funnel and retention experiments, works through AI agents daily, "run experiments and kill what does not work" - matches A1, A5, A7. (Honest gap: no personal Reddit/Discord presence, no poker domain.) |
| **Head of Acquisition** | Duelbits | LinkedIn 4429526797 | Owns full acquisition engine, FTD/CPA/LTV:CAC accountability, budget allocation by LTV, affiliates + creators + paid media - matches A2, A4. (Honest gap: crypto casino built 0-to-1 at Coinhero but no Web3/token-partnership scaling.) |
| **Head of Acquisition** | BettingJobs (start-up crypto casino, confidential client) | LinkedIn 4427319803 | First full-time hire shaping acquisition strategy for a start-up crypto casino; matches founder/0-to-1 (Coinhero), full-funnel acquisition, CRM-to-retention link - A2, A3, A4. |

---

#### 5. Target Companies

iGaming operators and platforms (crypto-native included): A5 Labs / QuintAce, Duelbits, and the BettingJobs confidential crypto-casino start-up. Broader fit set from the real funnel: high-growth iGaming operators, crypto casinos and sportsbooks, and B2B iGaming platforms where a data-and-AI-first growth leader is the differentiator.

---

#### 6. Sample-Content Atom Bank

Reusable atoms other agents thread through screens. All in Daniel's real voice and facts.

##### 6a. CV summary line
> iGaming growth and marketing leader with 17 years owning the full funnel and 15+ years operator-side. Scaled two startups to NASDAQ-listed operators (7 to ~200 and 12 to ~200), built BI and retention systems that raised player lifetime value, and now builds an AI content platform by hand on a Node.js / Supabase / BullMQ stack.

##### 6b. Three CV bullets
- Ran a controlled retention experiment at MrGreen: killed the industry-standard reactivation model after a control test showed only ~5% uplift, built predictive risk-scoring models in Alteryx, and shifted to a proactive direct-action team - active player lifespan rose from ~2.5 to ~3.5 months and LTV rose roughly 10-20% across the base.
- Rebuilt acquisition spend around lifetime value instead of cost-per-acquisition, moving budget off lower-LTV affiliate traffic into channels with BI-tracked ROI per spot, timeslot and channel - lowering blended CPA while raising customer quality.
- Built BI and analytics from scratch at ComeOn with no board budget (MVP first, then scaled), moving BI from after-the-fact reporting to real-time, customer-facing decisions using Tableau and Alteryx.

##### 6c. Sample target job ad (1 iGaming role, short)
> **Head of Acquisition - crypto casino (remote, EU)**
> First full-time marketing hire for a start-up crypto casino. Own the full acquisition strategy across paid media, SEO, content, influencer, affiliates and CRM-led initiatives. Manage the budget against growth targets, optimise funnels and player quality, and build the attribution and reporting frameworks. Work with CRM, product and data to tie acquisition to retention. Build and lead the acquisition team. 5+ years in acquisition or growth within iGaming, casino, sportsbook or crypto; strong grasp of paid media, attribution and acquisition economics; comfortable in a startup.

##### 6d. Sample fit verdict + 2 capability rows + 1 honest gap
> **Fit verdict:** Strong fit. Daniel has owned the full acquisition funnel for 17 years, has founded a crypto casino 0-to-1 (Coinhero), and thinks in LTV and cohorts, not just CPA. The one honest gap is Web3/token-partnership scaling, which he would bridge with founder-level crypto-casino build experience rather than claim.

| Capability | Evidence | Signal |
|------------|----------|--------|
| Full-funnel acquisition owned by LTV | Rebuilt budget allocation around LTV vs CPA; ROI tracked per spot/timeslot/channel (MrGreen/ComeOn) | Strong |
| Startup crypto casino built 0-to-1 | Coinhero CEO/Founder: strategy, licensing, compliance, brand, product, team from zero | Strong |

> **Honest gap:** No large-scale Web3/token-partnership or DeFi-integration acquisition experience. Real crypto-casino founder experience (Coinhero: casino + sportsbook + crypto) is the honest bridge - not a claim of running token-partnership growth at scale.

##### 6e. Sample cover-letter opening
> You want a first acquisition hire who can own the number in a start-up crypto casino, not manage an agency to hit it. I have done exactly that from zero - I founded Coinhero, a crypto casino spanning casino, sportsbook and crypto, and built the strategy, licensing, brand and product myself. Before that I spent 17 years owning full marketing funnels at MrGreen and ComeOn, two startups I helped scale to NASDAQ-listed operators, and I learned to allocate acquisition budget by lifetime value rather than cost-per-acquisition.

---

#### 7. Do-Not-Say List (guardrails for every downstream agent)

- Never write **250+** for team size. Use **~200** or "a NASDAQ-listed company".
- Never label MrGreen a **CPO** role. It is **founding team, Head of Marketing, Brand and Communication**.
- Never claim a **personal Reddit/Discord presence**, **poker/strategy-game domain**, or **community growth on Reddit/Discord**. The 120k community (Austria Tabak, ~2001) is real but early-career and NOT iGaming - do not imply it is recent or a gaming community.
- Never claim **Web3/token-partnership/DeFi acquisition at scale**. Coinhero (crypto casino 0-to-1) is the honest limit.
- Tools you MAY name: Tableau, Alteryx, Google Analytics, BI/predictive analytics, the OnlyiGaming stack (Node.js, Express, BullMQ, Supabase/PostgreSQL, Redis, PM2, Docker, Next.js, Strapi). Tools you may NOT name: SQL, Mixpanel, Amplitude, HubSpot, Salesforce, Make.com, n8n.
- Banned words: leveraged, spearheaded, cutting-edge, robust, passionate, excited, thrilled, resonates, synergy, dynamic, proven track record, perfect fit, hit the ground running, happy to discuss, I am confident that, I believe I would be a great fit.
- No em dashes or en dashes - hyphens only.

---

## Section 2 - THE BUILD (what's real today - bind the design here)

*Everything in this section exists in code on `main`. Where a surface is BUILT, the design should connect to the listed endpoint / case part so it renders live data instead of a fixture.*

### HelloLilly — BUILT REALITY MAP

Reference for a design spec to tag surfaces and wire the design to real data. Grounded in `docs/PROJECT_INVENTORY.md` (repo `hello lily - app`, main). Terse by design.

#### 1. Screen → vision tool → data → backend wiring

"Backend wiring AVAILABLE" = an endpoint/submodule/case-part exists the design *should* connect to. It does NOT mean the screen calls it today (see caveat §4).

| Vision tool | Screen file (`src/screens`) route key | BUILT? | Data source TODAY | Backend wiring AVAILABLE (endpoint · submodule · case part) |
|---|---|---|---|---|
| Home / command center | `home.jsx` `home` | yes | **Live JobTech API direct-from-browser** (job list only, `useLiveJobSearch`→`api/jobSearch.js`) + `strategyData.js` fixtures + localStorage cache. Everything except the job list is fixture. | Job list: `POST /api/jobs/search` (server path, disjoint) · `job-discovery`. Score/actions/tools cards: derive from `GET /api/case/:id` (`meta`, `fit`, `gaps`, `decodedRole`). |
| CV builder | `cvActivity.jsx` (`CVBuilder`) `cv` | yes | Hardcoded fixture only (`strategyData.js` + inline literal CV incl. hardcoded email/phone). Upload = in-memory `useState`, not persisted. | `POST /api/case/:id/generate` (loops cv-builder+writer) · `cv-builder` · case part **`cvDraft`** (`{sections:[{key,heading,items:[{datafactRef,text}]}]}`). Datafacts via `seed:datafacts`. |
| Activity tracker | `cvActivity.jsx` (`ActivityTracker`) `activity` | yes | Hardcoded fixture only (`CASE_RECORD.timeline/activityCount/…`). | None purpose-built. `meta.status` enum (`intake…done`) + case-part statuses could drive it; no activity/timeline collection exists. |
| Cover letter | `coverLetter.jsx` `letter` | yes | Hardcoded fixture (`PIPELINE_RUN` fields; fixed Amir/PostNord letter, zero inputs, no generation). | `POST /api/case/:id/generate` · `writer` · case part **`coverLetter`** (`{language,paragraphs[],unsupported_by_cv[]}`). |
| Interview trainer | `interview.jsx` `interview` | yes | Hardcoded fixtures (inline QSET/feedback + `PIPELINE_RUN.company/.role` labels). No media capture/scoring. | **None built.** Case parts `prep`/`cards`/`liveLog` exist as absent-envelope stubs in the contract but no submodule writes them. |
| Shared library | `library.jsx` `library` | yes | Hardcoded fixture (`KNOWLEDGE_RESOURCES` = 6 items; hero says "320+"). Filter chips decorative. | **None built.** No resources collection/endpoint. |
| Multi-coach review | `review.jsx` `review` | yes | Hardcoded in-file fixture; 100% static, zero wired actions. | Partial fit: `GET /api/case/:id` (`fit`, `gaps`, `coverLetter`) could feed a review surface. Case part `postMortem` exists (absent stub, unwritten). No review/comment backend. |
| Image studio | `studio.jsx` `studio` | yes | Hardcoded inline fixtures (`TEMPLATES`/`SUGGEST`); all controls DEAD, results are static glyphs. | **None built.** No image-generation capability, endpoint, or case part. |
| Coach workspace | `coach.jsx` `coach` | yes | Hardcoded fixtures (`strategyData.js` + inline; same Amir/PostNord as jobseeker). ~8 nav groups → all but `coach` are `ComingSoon`. | Same case parts as jobseeker via `GET /api/case/:id` (contract is single shared case: `meta.owner`, dossiers, fit, gaps…). No coach-specific backend. |
| Job match / analysis | `match.jsx` `match` | yes | **localStorage only** (`jobStore.js` accepted jobs). "Analysera" plays timed animation then renders hardcoded `MATCH_DETAILS` fixture; match % defaults to 76. | `POST /api/case/:id/analyze` · `gap-analyzer` · case parts **`fit`** (per-req match/partial/missing, cite-by-id) + **`gaps`**. Fill-gap loop: `POST /api/case/:id/gap/:gapId/answer` · `fill-gap/bullet-judge`. |
| Calendar | `calendar.jsx` `calendar` | yes | Hardcoded inline fixtures (`EVENTS`/`UPCOMING`; static week, hardcoded dates). | **None built.** `meta.interviewDate`/`round`/`format` exist on the case; no events collection/endpoint. |
| Community | `community.jsx` `community` | yes | Hardcoded inline fixtures; 100% static, all CTAs dead/fake; search never filters. | **None built.** No community backend. |
| Job search (Jobbsök) | `jobSearch.jsx` `jobbsok` | yes | **External job APIs direct-from-browser** (JobTech/RemoteOK/Remotive via `api/jobSearch.js`) + localStorage (`jobStore.js` saved/accepted/removed). Search/toggles/save WORK. Kommunkod input dead (pinned 0180). "Ansök" only saves to localStorage. | `POST /api/jobs/search` (server path, sibling-repo dependent) · `job-discovery` (+ `job-ingest`, `linkedin-job-fetcher`, `stage2-filter` for LinkedIn/enrich/filter). Jobs live in store collection `jobs`. |

Notes: (a) 13 real routes total in `LL_ROUTES` — `coach` is one of them, not a 14th. All other sidebar keys (~25 jobseeker + ~40 `c-*` coach) render `ComingSoon`. (b) "cvActivity=CVBuilder+ActivityTracker" = two screen components in one file, two route keys. (c) Every screen is bespoke JSX; `grid.jsx` `PageTemplate/ContentArea/ContentBox/CrossColumn` exist but NO screen imports them. All UI strings are hardcoded Swedish (no i18n). No `src/**` tests (runner globs `server/**` + `scripts/**` only).

#### 2. The real backend

**11 submodules** (`server/submodules/`, each `manifest.cjs`+`execute.cjs`; never import each other — all peer calls via broker `tools.request`):
- `cv-builder` — REAL. Selects (never authors) datafacts into `cvDraft`. LLM (Opus 4.8).
- `decoder` — REAL. Ad + dossiers → `decodedRole` (6–12 weighted requirements). LLM. Summoned by researcher.
- `gap-analyzer` — REAL. Writes honest `fit` (cite-by-id) + `gaps`. LLM. Core of Matchanalys.
- `writer` — REAL. Authors `coverLetter` prose, gate-checked, one retry. LLM.
- `researcher` — REAL. 4 dossiers (Perplexity + LLM), then brokers `decoder`. Writes `dossiers`.
- `job-discovery` — REAL. Multi-provider (jobtech/remoteok/remotive) search, dedup, stage-1 flag → `jobs` collection.
- `job-ingest` — REAL. LinkedIn CSV → `jobs` collection (dedup, mojibake repair).
- `linkedin-job-fetcher` — REAL. Fetch/enrich LinkedIn guest-endpoint bodies → `jobs`.
- `stage2-filter` — REAL. Body-level reject-code flagging (flags, never drops).
- `echo-analyzer` — **STUB (A0)**. Brokers a peer, writes placeholder gap. Test harness only.
- `echo-researcher` — **STUB (A0)**. Writes hardcoded placeholder dossier. Test harness only.

All 9 real modules are unit-tested with mocked LLM/HTTP; **no live-API validation is confirmed anywhere (all UNVERIFIED)**.

**6 API endpoints** (`server/dev-server.cjs`, hand-rolled `node:http`, no Express; `npm run dev`):
- `GET /api/health` → liveness `{ok:true}`.
- `POST /api/jobs/search` → live job search via **sibling repo** `OnlyiGaming/content-pipeline-modules-v2 .../api-search` (lazy-required; MODULE_NOT_FOUND→500 in clean checkout). Returns `{jobs[],summary,meta,logs}`.
- `GET /api/case/:id` → returns case parts `{meta,decodedRole,fit,gaps,cvDraft,coverLetter}`; 404 if unknown.
- `POST /api/case/:id/analyze` → `host.invoke('gap-analyzer')`; writes `fit`+`gaps`. Needs `ANTHROPIC_API_KEY`.
- `POST /api/case/:id/gap/:gapId/answer` → `applyAnswer` (fill-gap/bullet-judge); mints a datafact + flips requirement to `match`, or `stays_gap`. Needs `answer`+`requirementId`.
- `POST /api/case/:id/generate` → loops `cv-builder`+`writer`; writes `cvDraft`+`coverLetter`; 200 both-ready else 207.

**Store** = `server/skeleton/store/index.cjs`, 100% in-memory JS `Map`s, **nothing survives process exit** (no DB/disk/serialization). Regions: `cases` (shared), `scratch` (private per-submodule), `datafacts` (candidate data-layer, gate-exempt), `collections` (generic keyed). Collections actually written today: **`jobs`, `jobSources`, `filterSet`** (`filterSet` id `active`).

**Case parts** (contract `server/skeleton/contract/case.cjs`, DATA_CONTRACT v0.2): `meta` (plain obj) + enveloped `{status,data}` parts `dossiers`, `decodedRole`, `fit`, `gaps`, `cvDraft`, `coverLetter`, `prep`, `cards`, `liveLog`, `postMortem`. Statuses: `absent|pending|ready|failed`. Written today: `dossiers` (researcher), `decodedRole` (decoder), `fit`/`gaps` (gap-analyzer), `cvDraft` (cv-builder), `coverLetter` (writer). **Never written by any real submodule: `prep`, `cards`, `liveLog`, `postMortem`** (interview/review surfaces have no backend). All `writePart` prose runs the deterministic banned-phrase writing-rules gate.

#### 3. Honest caveat (one line)

**The frontend never calls its own backend today — there is no `/api/...` call anywhere in `src/` (only direct-from-browser external job-API fetches). "Wiring available" means the endpoint/submodule/case-part exists and the design *should* connect to it, not that it does.**

---

## Section 3 - PLANNED / CONCEPTUAL surfaces (spec'd as-if-real)

*Every surface below is either not built or only partially built. Each is spec'd with page structure, tools, CTAs, an as-if-real data shape, Daniel-persona sample content, and its crosslinking rail. Surfaces already tagged BUILT in Section 2 are cross-referenced here with their real wiring; the rest are conceptual.*

### A. Execution tools

Help the jobseeker get the actual doing done. All six surfaces below are BUILT screens (a real route + a bespoke JSX screen ships today), but each renders `strategyData.js` / inline fixtures and calls no `/api/...` endpoint yet. Every "Status" line names the screen file, its route key, and the real endpoint + case part a future `useCase()` bridge should bind to. Where a case part exists in the contract but no producer writes it (Interview Trainer's `prep`/`cards`, Image Studio), that is called out so the designer can design "as if real" without assuming population. Sample content throughout is Daniel Oskarsson (iGaming growth/marketing), never the old Amir Hassan / PostNord warehouse fixture the screens ship with.

---

#### CV Builder (CV-byggare)

- **Name (EN / SV):** CV Builder / CV-byggare
- **Status:** **BUILT.** Screen `src/screens/cvActivity.jsx` (component `CVBuilder`), route key `cv`. **Currently reads a fixture** (a hardcoded inline CV literal with a hardcoded email/phone plus `strategyData.js`; upload is in-memory `useState`, not persisted). **Bind to:** `POST /api/case/:id/generate` (loops the `cv-builder` + `writer` submodules) which writes case part **`cvDraft`**; read the draft back via `GET /api/case/:id` (`cvDraft`). Datafacts (the selectable evidence pool) are seeded host-side (`seed:datafacts`) and read via the `datalayer` capability - `cv-builder` **selects** datafact ids into sections, it never authors prose.
- **Purpose:** Get past the blank page - turn intake answers and imported facts into a usable, sendable first CV that improves over time.
- **Page / screen structure:**
  - **Left intake rail** - guided step-by-step: experience, education, strengths, achievements, goals. Each answer becomes a candidate datafact.
  - **Center: living CV preview** - rendered `cvDraft.sections[]` (heading + items), each item traceable to its `datafactRef` (a small "from your intake" chip on hover). Only sections with at least one resolvable item render.
  - **Improve strip** (below/inline per section) - "improve wording", "add keywords", "adjust structure", "tailor a version for this role".
  - **Version switcher** - different CV versions for different job types (e.g. Head of Growth vs Head of Acquisition), each its own `cvDraft` / `cvVersionRef`.
  - **Crosslinking right-rail** (see Crosslinking below).
- **Key tools / sub-features:** guided intake; datafact-backed bullet builder (only cites facts the person actually gave); keyword and role-fit suggestions; per-role version cloning; import an existing CV (upload); "select, never invent" guarantee surfaced as UI copy so the user trusts nothing is fabricated.
- **CTAs:** Primary **Generera CV / Uppdatera CV** (`POST /api/case/:id/generate`). Secondary: **Skapa version for den har rollen**, **Forbattra formulering**, **Ladda upp befintligt CV**, **Anvand i Personligt brev** (hand off to Cover Letter Builder).
- **Data (real shape - bind to this):**
```json
{
  "cvDraft": {
    "status": "ready",
    "data": {
      "language": "en",
      "sections": [
        {
          "key": "summary",
          "heading": "Summary",
          "items": [
            {
              "datafactRef": { "kind": "datafact", "id": "datafact_9c1a4f0b" },
              "text": "iGaming growth and marketing leader with 17 years owning the full funnel and 15+ years operator-side. Scaled two startups to NASDAQ-listed operators (7 to ~200 and 12 to ~200), built BI and retention systems that raised player lifetime value, and now builds an AI content platform by hand on a Node.js / Supabase / BullMQ stack."
            }
          ]
        },
        {
          "key": "experience",
          "heading": "Selected achievements",
          "items": [
            {
              "datafactRef": { "kind": "datafact", "id": "datafact_2f77ab13" },
              "text": "Ran a controlled retention experiment at MrGreen: killed the industry-standard reactivation model after a control test showed only ~5% uplift, built predictive risk-scoring models in Alteryx, and shifted to a proactive direct-action team - active player lifespan rose from ~2.5 to ~3.5 months and LTV rose roughly 10-20% across the base."
            },
            {
              "datafactRef": { "kind": "datafact", "id": "datafact_5b0e91c2" },
              "text": "Rebuilt acquisition spend around lifetime value instead of cost-per-acquisition, moving budget off lower-LTV affiliate traffic into channels with BI-tracked ROI per spot, timeslot and channel - lowering blended CPA while raising customer quality."
            }
          ]
        }
      ]
    },
    "updatedAt": "2026-07-02T09:14:00Z"
  }
}
```
- **Sample content:** intake answer "I helped start MrGreen and built the CRM department" resolves to a founding-team datafact (never "CPO"); the achievement bullets above; a value-proposition datafact "Built BI from scratch at ComeOn with no board budget - MVP first, then scaled - using Tableau and Alteryx". Contact block reads the real person, not a placeholder.
- **Crosslinking:** right-rail surfaces, for the section in focus: coach-approved achievement-writing template, a short "write results not tasks" guide, the matching requirement from the target role's `decodedRole` (so a bullet can be written toward it), missing keywords for the role, and a coach with iGaming/growth experience. Example anchored on the retention bullet: "This maps to A5 Labs' 'run experiments and kill what does not work' requirement."

---

#### Cover Letter Builder (Personligt brev)

- **Name (EN / SV):** Cover Letter Builder / Personligt brev
- **Status:** **BUILT.** Screen `src/screens/coverLetter.jsx`, route key `letter`. **Currently reads a fixture** (a fixed Amir/PostNord letter, zero inputs, no generation). **Bind to:** `POST /api/case/:id/generate` (the `writer` submodule authors the prose) which writes case part **`coverLetter`**; read it back via `GET /api/case/:id` (`coverLetter`). The `writer` runs the deterministic banned-phrase writing-rules gate (one gate-aware retry), and every claim not directly supported by the CV lands in `unsupported_by_cv[]` for review - that array is the honesty surface this screen must show.
- **Purpose:** Write a role-specific letter grounded in the ad, the CV and the person's real situation - and handle a concern honestly (gap, career change, an honest capability limit) instead of a generic template.
- **Page / screen structure:**
  - **Top context bar** - target company + role (from `meta.company` / `meta.role`), language toggle (`coverLetter.language`).
  - **Center: letter body** - `coverLetter.paragraphs[]` rendered one paragraph per entry, editable.
  - **"Concern to address" chooser** - gap in CV, age, career change, limited Swedish, low confidence; feeds the bridge/middle paragraph.
  - **Honesty panel** - `unsupported_by_cv[]` listed as review flags ("this claim is not backed by your CV - keep, soften, or cut").
  - **Crosslinking right-rail.**
- **Key tools / sub-features:** grounds every paragraph in the ad + CV + `fit`/`gaps`; honest bridge paragraph for a real limit (never a fabricated claim); tone/length control; writing-rules gate blocks buzzword prose; one-click pull of a `gaps[].bridge.oneLiner` into the letter.
- **CTAs:** Primary **Skriv brev** (`POST /api/case/:id/generate`). Secondary: **Adressera en oro** (pick concern), **Byt ton/langd**, **Losa flaggade pastaenden** (resolve `unsupported_by_cv`), **Kopiera** / **Spara version**.
- **Data (real shape - bind to this):**
```json
{
  "coverLetter": {
    "status": "ready",
    "data": {
      "language": "en",
      "paragraphs": [
        "You want a first acquisition hire who can own the number in a start-up crypto casino, not manage an agency to hit it. I have done exactly that from zero - I founded Coinhero, a crypto casino spanning casino, sportsbook and crypto, and built the strategy, licensing, brand and product myself.",
        "Before that I spent 17 years owning full marketing funnels at MrGreen and ComeOn, two startups I helped scale to NASDAQ-listed operators, and I learned to allocate acquisition budget by lifetime value rather than cost-per-acquisition - moving spend off lower-LTV affiliate traffic into channels with BI-tracked ROI per spot, timeslot and channel.",
        "The one honest gap is large-scale Web3 and token-partnership acquisition. I would bridge it with founder-level crypto-casino build experience rather than claim scale I do not have.",
        "I would welcome a conversation about owning your acquisition engine end to end."
      ],
      "unsupported_by_cv": [
        "Implied familiarity with your specific paid-social channel mix - not evidenced in the CV, worth confirming in interview."
      ]
    },
    "updatedAt": "2026-07-02T09:20:00Z"
  }
}
```
- **Sample content:** the opening + bridge above (for BettingJobs' confidential crypto-casino Head of Acquisition role). The bridge paragraph states the real limit (no Web3/token-partnership scale) and bridges with Coinhero founder experience - never claims Web3 scaling, never uses banned words like "excited" / "proven track record".
- **Crosslinking:** right-rail surfaces the exact `gaps[].bridge` for the concern being addressed (so the middle paragraph is drafted from real material), examples of strong openings for this role, company-specific research paragraphs from `dossiers`, and a coach who handles career-change / gap letters. Anchored example: "Bridge for 'no Web3 scale' is ready - pull it into paragraph 3."

---

#### Application Check (Ansokningskoll)

- **Name (EN / SV):** Application Check / Ansokningskoll
- **Status:** **BUILT.** Screen `src/screens/match.jsx`, route key `match` (labelled "Matchanalys" in the nav). **Currently reads a fixture** (localStorage accepted jobs via `jobStore.js`; "Analysera" plays a timed animation then renders a hardcoded `MATCH_DETAILS` fixture with match % defaulted to 76). **Bind to:** `POST /api/case/:id/analyze` (the `gap-analyzer` submodule) which writes case parts **`fit`** (per-requirement match/partial/missing, cited by datafact id) + **`gaps`**; read both via `GET /api/case/:id`. The fill-a-gap loop is wired: `POST /api/case/:id/gap/:gapId/answer` (`fill-gap` + `bullet-judge`) mints a datafact and flips a requirement to `match`, or returns `stays_gap`.
- **Purpose:** An honest, practical fit check - compare the application against the ad and show what matches, what is missing, and what to fix before sending. Explicitly not a promise about how a real employer or ATS will judge it.
- **Page / screen structure:**
  - **Header: fit verdict** - a plain read (`fit.capability` overall + `fit.preference`), honest framing ("practical fit check, not an ATS score").
  - **Requirements table** - one row per `decodedRole` requirement: requirement text, evidence, status chip `match | partial | missing`. `match` rows carry an `evidenceRef` (the cited datafact) and cannot show as matched without one.
  - **Gaps list** - `gaps[]` with `what` / `why` and a `bridge` (reframe / adjacent-proof / honest-ramp) plus a one-liner.
  - **Fill-a-gap co-op dialogue** - inline: answer a question about a missing requirement, watch it resolve to `match` or `stays_gap`.
  - **Crosslinking right-rail.**
- **Key tools / sub-features:** cite-by-id honesty (an unresolvable citation auto-downgrades match to partial); missing-keyword and weakly-answered-requirement callouts; strengths-to-lift list; "improve before sending" checklist; the fill-gap answer flow that turns an interview answer into a real, referenceable datafact.
- **CTAs:** Primary **Analysera ansokan** (`POST /api/case/:id/analyze`). Secondary: **Besvara lucka** (`POST /api/case/:id/gap/:gapId/answer`), **Lyft styrka i CV** (hand to CV Builder), **Anvand bridge i brev** (hand to Cover Letter Builder).
- **Data (real shape - bind to this):**
```json
{
  "fit": {
    "status": "ready",
    "data": {
      "capability": {
        "requirements": [
          {
            "requirementRef": { "kind": "decodedRequirement", "id": "decodedRequirement_a1b2c3d4" },
            "evidence": "Rebuilt acquisition budget allocation around LTV vs CPA; ROI tracked per spot, timeslot and channel at MrGreen and ComeOn.",
            "evidenceRef": { "kind": "datafact", "id": "datafact_5b0e91c2" },
            "status": "match"
          },
          {
            "requirementRef": { "kind": "decodedRequirement", "id": "decodedRequirement_e5f6a7b8" },
            "evidence": "Founded Coinhero, a crypto casino spanning casino, sportsbook and crypto, built 0-to-1.",
            "evidenceRef": { "kind": "datafact", "id": "datafact_77aa11ee" },
            "status": "match"
          },
          {
            "requirementRef": { "kind": "decodedRequirement", "id": "decodedRequirement_c9d0e1f2" },
            "evidence": "No large-scale Web3 / token-partnership acquisition in the record.",
            "status": "missing"
          }
        ]
      },
      "preference": "Direction fits: full-funnel acquisition ownership in a startup crypto casino is what Daniel wants. Comp philosophy and equity/scope are the open terms to probe; culture signal is founder-speed, which suits him."
    },
    "updatedAt": "2026-07-02T09:05:00Z"
  },
  "gaps": {
    "status": "ready",
    "data": {
      "gaps": [
        {
          "id": "gap_4d5e6f70",
          "what": "No large-scale Web3 / token-partnership or DeFi-integration acquisition experience.",
          "why": "The ad emphasises crypto-native growth partnerships at scale.",
          "bridge": {
            "id": "bridge_81a2b3c4",
            "kind": "adjacent-proof",
            "body": "Real crypto-casino founder experience (Coinhero: casino, sportsbook and crypto, built 0-to-1) is the honest adjacent proof - a founder who has shipped a licensed crypto product, not someone claiming token-partnership growth at scale.",
            "oneLiner": "Founded a crypto casino 0-to-1; bridges the Web3 gap without overclaiming.",
            "material": [ { "source": "cv", "ref": { "kind": "datafact", "id": "datafact_77aa11ee" } } ]
          },
          "provenance": "gap-analyzer"
        }
      ]
    },
    "updatedAt": "2026-07-02T09:05:00Z"
  }
}
```
- **Sample content:** Fit verdict "Strong fit. Daniel has owned the full acquisition funnel for 17 years, founded a crypto casino 0-to-1, and thinks in LTV and cohorts, not just CPA. The one honest gap is Web3/token-partnership scaling, which he would bridge with founder-level crypto-casino build experience rather than claim." Match rows: "Full-funnel acquisition owned by LTV" and "Startup crypto casino built 0-to-1". Missing row: Web3/token-partnership scale.
- **Crosslinking:** right-rail surfaces, per selected requirement or gap: the CV bullet that would satisfy it, the `bridge` to use in the letter, common questions for this role, and a coach with iGaming acquisition experience. Anchored example on the Web3 gap: "Bridge ready - founder-level crypto-casino build; do not claim token-partnership scale."

---

#### Progress Support (Framstegsstod)

- **Name (EN / SV):** Progress Support / Framstegsstod (contains "My Activity" / "Min aktivitet")
- **Status:** **BUILT.** Screen `src/screens/cvActivity.jsx` (component `ActivityTracker`), route key `activity`. **Currently reads a fixture** (hardcoded `CASE_RECORD.timeline` / `activityCount`). **Bind to:** no purpose-built activity/timeline collection or endpoint exists in the backend - **there is no activity collection today**. The honest binding path: derive the overview from what real backend state already exists - `meta.status` (enum `intake -> researching -> analyzing -> prep_ready -> live -> post -> done`) plus each case part's status envelope (`absent | pending | ready | failed`), both from `GET /api/case/:id`. A progress strip is literally a render of the parts' statuses. A true activity log (`GET /api/case/:id/activity`) and next-step suggestions are **PLANNED** and would need to be built.
- **Purpose:** A calm support tool - remind, suggest, motivate, and break big tasks into small next steps - with a self-writing activity log that doubles as a report.
- **Page / screen structure:**
  - **"Your next small step" card** - one tiny, doable action derived from case state (supportive tone, never a scolding backlog).
  - **Progress strip** - the pipeline stages rendered from part statuses (Research -> Analysis -> CV -> Letter -> ready), so "done / in progress / not started" is honest to the backend.
  - **My Activity (Min aktivitet) timeline** - reverse-chronological auto-logged events (CV updated, letter drafted, gap answered), each tagged auto vs manual.
  - **Report view** - the same log exported as a plain activity report (for the person and for any external reporting).
  - **Crosslinking right-rail.**
- **Key tools / sub-features:** one-next-step reducer (breaks "apply to jobs" into a single action); gentle reminders/nudges; auto-logging from every tool action; energy-aware tone; report export. Built for low energy, ADHD, autism, anxiety, language barriers, long-term unemployment.
- **CTAs:** Primary **Gor nasta lilla steg** (deep-links to the relevant tool). Secondary: **Se hela tidslinjen**, **Exportera aktivitetsrapport**, **Pausa/aterupplev paminnelser**.
- **Data (as-if-real - PLANNED activity shape layered over the real `meta.status` + part statuses):**
```json
{
  "meta": { "status": "analyzing" },
  "progress": [
    { "stage": "research",  "part": "dossiers",    "status": "ready"   },
    { "stage": "analysis",  "part": "fit",         "status": "ready"   },
    { "stage": "analysis",  "part": "gaps",        "status": "ready"   },
    { "stage": "cv",        "part": "cvDraft",     "status": "pending" },
    { "stage": "letter",    "part": "coverLetter", "status": "absent"  }
  ],
  "nextStep": {
    "id": "step_next_01",
    "label": "Answer one gap question for the Duelbits role",
    "deeplink": "#match",
    "effortMinutes": 4
  },
  "activity": [
    { "id": "act_01", "ic": "target", "title": "Matchanalys klar", "detail": "Duelbits - Head of Acquisition: 2 traffar, 1 lucka (Web3-skala)", "at": "2026-07-02T09:05:00Z", "auto": true },
    { "id": "act_02", "ic": "cv",     "title": "CV uppdaterat",     "detail": "LTV-vs-CPA-bulleten och MrGreen-retentionsforsoket lyftes fram", "at": "2026-07-01T16:40:00Z", "auto": true },
    { "id": "act_03", "ic": "letter", "title": "Brevutkast skapat",  "detail": "Bridge for Web3-luckan (Coinhero 0-to-1)", "at": "2026-07-01T16:05:00Z", "auto": true }
  ]
}
```
- **Sample content:** Next step "Answer one gap question for the Duelbits role (4 min)". Timeline entries reference Daniel's real work - the Duelbits match analysis, the MrGreen retention bullet, the Coinhero bridge - all in a supportive, plain tone. No fabricated numbers, no PostNord.
- **Crosslinking:** right-rail surfaces the tool the next step lives in, a short confidence/motivation exercise, and (when a step stalls) a coach nudge. Anchored example: "Stuck on the Web3 gap for 2 days? Open the bridge, or ask a coach who knows crypto acquisition."

---

#### Interview Trainer (Intervjutraning)

- **Name (EN / SV):** Interview Trainer / Intervjutraning
- **Status:** **BUILT (shell only).** Screen `src/screens/interview.jsx`, route key `interview`. **Currently reads a fixture** (inline `QSET` / feedback, `PIPELINE_RUN.company` / `.role` labels; no media capture, no scoring). **Bind to:** **no backend built.** The contract defines case parts **`prep`**, **`cards`**, and **`liveLog`** as absent-seeded envelopes, but **no submodule writes them** - they are contract-only shapes. So the question source (`decodedRole` requirements + `dossiers`) is real, but interview generation, voice, follow-ups, and scoring are all **PLANNED**. Design against the `prep` / `cards` / `liveLog` shapes; do not assume they populate.
- **Purpose:** A realistic, adjustable interview simulation built from the actual role, company, industry and CV - practising to build safety and confidence, not just reviewing a question list.
- **Page / screen structure:**
  - **Setup panel** - paste the job description; choose style (friendly / formal / detailed / case-based / competency-based / short-and-direct / reflective).
  - **Interview stage** - one question at a time; AI-generated voice option; user answers by voice or text; the interviewer asks follow-ups based on the answer (not a static questionnaire).
  - **Live cards side-panel** - `cards` (category `question-to-ask`, `gap-bridge`, `story`) quietly available during practice.
  - **Debrief** - per-answer feedback, weak spots to redo, a `liveLog.qa[]` summary (rewritten, never a verbatim transcript).
  - **Crosslinking right-rail.**
- **Key tools / sub-features:** ad-to-interview generation from `decodedRole` + `dossiers` + CV; adjustable style; dynamic follow-ups; AI voice (language-learning feel); safe re-do; summary debrief. All of the above beyond question-sourcing is PLANNED.
- **CTAs:** Primary **Starta intervju** (PLANNED generation endpoint). Secondary: **Byt stil**, **Sla pa rost**, **Ova om svaret**, **Se sammanfattning**.
- **Data (as-if-real - the contract `prep` + `cards` + `liveLog` shapes it would read/write):**
```json
{
  "prep": {
    "status": "ready",
    "data": {
      "PREP": { "sections": [
        { "id": "prepSection_01", "heading": "Why crypto-casino acquisition, and why now",
          "full": "Walk through owning the full funnel at MrGreen and ComeOn, then founding Coinhero 0-to-1 - the direct answer to why a first acquisition hire in a crypto startup.",
          "compressed": "17y full funnel + founded a crypto casino 0-to-1." }
      ] },
      "cvStory": { "slides": [
        { "id": "cvSlide_01", "headline": "Killed the reactivation model", "detail": "Control test showed ~5% uplift, so killed it; built Alteryx risk-scoring, lifespan ~2.5 to ~3.5 months, LTV up 10-20%." }
      ] }
    }
  },
  "cards": {
    "status": "ready",
    "data": [
      { "id": "card_01", "category": "gap-bridge", "front": "If they push on Web3 scale",
        "body": "Be honest: no token-partnership acquisition at scale. Bridge with Coinhero - a licensed crypto casino built 0-to-1.",
        "triggers": ["web3", "token", "defi"], "subject": "crypto",
        "sourceRef": { "kind": "gap", "id": "gap_4d5e6f70" } },
      { "id": "card_02", "category": "question-to-ask", "front": "Ask about attribution ownership",
        "body": "Who owns attribution today, and is the acquisition budget accountable to LTV:CAC or just CPA?",
        "triggers": ["attribution", "budget", "ltv"], "subject": "marketing" }
    ]
  },
  "liveLog": {
    "status": "ready",
    "data": {
      "qa": [ { "id": "liveQA_01", "question": "How do you decide where acquisition budget goes?",
                "answer": "Allocated by lifetime value, not CPA - moved spend off lower-LTV affiliate traffic into channels with BI-tracked ROI per spot and timeslot." } ],
      "topicLog": [ { "ref": { "kind": "card", "id": "card_02" }, "at": "2026-07-02T10:12:03Z" } ]
    }
  }
}
```
- **Sample content:** competency-based interview for the Duelbits Head of Acquisition role. Opening question "Walk me through a time you changed how acquisition budget was allocated" - strong-answer card built from the LTV-vs-CPA rebuild. Follow-up if the Web3 gap surfaces - the honest gap-bridge card above (never claims token-partnership scale). Voice option, formal style.
- **Crosslinking:** right-rail surfaces common questions for a Head of Acquisition role, company-specific `dossiers` research on Duelbits, examples of strong answers, follow-up questions targeting weak answers, a confidence exercise, and a coach who knows iGaming/crypto acquisition. This is the "connected environment" example from the vision - practising against the role, the company, the self, and the support around it.

---

#### Image Studio (Bildstod)

- **Name (EN / SV):** Image Studio / Bildstod (nav label "Bildstudio")
- **Status:** **BUILT (dead shell).** Screen `src/screens/studio.jsx`, route key `studio`. **Currently reads a fixture** (inline `TEMPLATES` / `SUGGEST`; all controls dead, results are static glyphs). **Bind to:** **no backend built.** There is no image-generation capability, endpoint, or case part anywhere in the contract or code. Entirely **PLANNED** - invent an as-if-real shape (below). Any binding is future work.
- **Purpose:** Help people create or choose a better profile image and visual material for CV, LinkedIn and professional contexts - clearer and more confident, not a false version of the person.
- **Page / screen structure:**
  - **Template gallery** - safe, professional presets (headshot backgrounds, crop framing, tone).
  - **Upload / capture panel** - bring a photo in; light, honest adjustments only (background, crop, lighting) - no identity-altering edits.
  - **Suggestions rail** - "this framing reads more confident", "neutral background for LinkedIn".
  - **Output set** - CV-sized, LinkedIn-sized, and a plain professional variant.
  - **Crosslinking right-rail.**
- **Key tools / sub-features:** template-driven presets; safe non-deceptive adjustments; per-surface export sizes; a gentle "how recruiters read a profile photo" note. Built especially for people who find self-presentation hard.
- **CTAs:** Primary **Skapa profilbild** (PLANNED generation endpoint). Secondary: **Valj mall**, **Ladda upp foto**, **Exportera for LinkedIn / CV**.
- **Data (as-if-real - invented PLANNED shape it would read/write):**
```json
{
  "imageStudio": {
    "status": "ready",
    "data": {
      "sourceImageRef": { "kind": "upload", "id": "upload_7c19" },
      "template": "professional-neutral",
      "adjustments": { "background": "soft-neutral", "crop": "head-and-shoulders", "lighting": "even" },
      "honestyGuard": "non-deceptive: framing, crop, background and lighting only; no identity-altering edits",
      "outputs": [
        { "id": "img_li",  "target": "linkedin", "width": 400, "height": 400, "url": "as-if-real://outputs/img_li.png" },
        { "id": "img_cv",  "target": "cv",       "width": 300, "height": 300, "url": "as-if-real://outputs/img_cv.png" }
      ]
    },
    "updatedAt": "2026-07-02T11:00:00Z"
  }
}
```
- **Sample content:** Daniel uploads a plain photo; picks "professional-neutral"; the studio suggests a head-and-shoulders crop on a soft-neutral background for LinkedIn, plus a CV-sized variant. Suggestion copy: "Even lighting and a neutral background read as clear and professional for a growth-leader profile." No claim of transforming him into someone else.
- **Crosslinking:** right-rail surfaces a short "how recruiters read a profile photo" guide, LinkedIn Helper (to place the new image), and a coach who can give a quick visual-presentation check. Anchored example: "New LinkedIn photo ready - open LinkedIn Helper to update your profile."

---

### B. Opportunity tools

Find work, both visible and hidden. Two of the five surfaces are BUILT screens (Job Search, Match Analysis); the other three are PLANNED and specced "as-if-real" so the designer can render them convincingly. Where a tool is BUILT, the real backend wiring it *should* connect to is named - but note the reality gate: no screen calls its own backend today (there is no `/api/...` call anywhere in `src/`), so every BUILT surface currently reads a fixture or a browser-direct external API. The right-rail crosslinking panel on every surface here is a *derived query* (`getCrosslinks({caseId, focus})`), not a stored field, and has no endpoint yet - design it as if it resolves live.

---

#### Job Search (Jobbsök)

- **Name (EN / SV):** Job Search / Jobbsök
- **Status:** **BUILT.** Screen `src/screens/jobSearch.jsx` (route key `jobbsok`). This is the most-functional screen in the app: search, provider toggles, and save all WORK today against **external job APIs direct-from-browser** (JobTech / RemoteOK / Remotive via `src/api/jobSearch.js`) plus `localStorage` (`src/utils/jobStore.js` - saved / accepted / removed). **Currently reads no HelloLilly backend of its own.** The real server path it *should* bind to is `POST /api/jobs/search` -> submodule `job-discovery` (multi-provider search, dedup, stage-1 flag) writing the `jobs` collection; LinkedIn/enrich/filter is `job-ingest` + `linkedin-job-fetcher` + `stage2-filter`. Filters read from `filterSet` record id `active`. Known dead spots to fix in the redesign: the Kommunkod input is decorative (pinned to `0180`), and "Ansök" only writes to `localStorage`, it does not start a case.
- **Purpose:** Gather jobs from many public sources into one relevance-sorted feed, and learn the person's taste from what they click, save and reject.
- **Page / screen structure:**
  - **Search bar + source picker** (top): free-text terms, a row of provider toggles (JobTech, RemoteOK, Remotive, LinkedIn), an "add a source" affordance, and a location field (currently dead - make it live against `filterSet.stage_1.location`).
  - **Refine strip:** system-suggested better terms, alternative titles, adjacent industries, and a wider geographic area - fed from the person's click/save/reject history.
  - **Job feed** (main column): one card per job, sortable by relevance / match / location / industry / desired role. Card shows title, company, location, freshness ("igar"), a `signal` chip (neutral / low from `stage2-filter`), and the match badge.
  - **Saved / accepted rail** (secondary): the person's kept jobs, the queue that Match Analysis reads.
  - **Crosslinking right-rail** (see below).
- **Key tools / sub-features:** provider on/off toggles; add-your-own-source; taste-learning term suggestions; flag-never-hide filtering (a low-signal job is dimmed and reason-chipped, never removed); dedup by `externalId`; save / reject / accept per card.
- **CTAs:** primary **Spara jobb** (save to the accepted queue) and **Analysera** (hand the job to Match Analysis). Secondary: **Andra sokning** (refine), **Lagg till kalla** (add source), **Dolj** (reject / down-rank).
- **Data (real, served shape):** search response `POST /api/jobs/search` -> `{ ok, jobs:[normalizeJob], summary, meta:{keywords,sources,municipality}, logs:[] }`. Note the served `normalizeJob` shape is NOT the store `jobs` shape - it adds display fields (`co`, `logo`, `match` 64-96, `when`, `hot`, `tags`) and slices to 40. Canonical store record:
```json
{
  "id": "job_9f2c1a04",
  "externalId": "linkedin-4429526797",
  "source": "linkedin",
  "title": "Head of Acquisition",
  "company": "Duelbits",
  "location": "Remote, EU",
  "url": "https://www.linkedin.com/jobs/view/4429526797",
  "snippet": "Own the full acquisition engine - FTD, CPA, LTV:CAC accountability across paid, affiliates and creators.",
  "text_content": "",
  "postedAt": "2026-06-30",
  "decision": "new",
  "discoveredAt": "2026-07-02T08:14:00Z",
  "signal": "neutral",
  "matchedRules": []
}
```
- **Sample content:** Search terms in the bar: `Head of Growth`, `Head of Acquisition`, `iGaming CRM`, `retention lead`. Feed (from Daniel's real week23 targets): **Head of Growth - A5 Labs / QuintAce** (Remote) `signal neutral`; **Head of Acquisition - Duelbits** (Remote, EU) `signal neutral`; **Head of Acquisition - crypto casino start-up (confidential, via BettingJobs)** `signal neutral`. A dimmed, reason-chipped example (flag-never-hide): **"Junior PPC Executive - iGaming agency"** with a `low signal` chip reading "under din nivakonfig - senior/lead roller". Refine strip suggestions: "Prova aven: VP Growth, CMO, Head of CRM - fler traffar for din profil."
- **Crosslinking (right-rail):** surfaces, for the job in focus, "Foretag redan pa din Foretagslista" (link to Company List), "Signaler for det har bolaget" (link to Job Radar), and "Liknande jobb du sparat" - each row a `{kind, id}` ref with a relevance line. When a saved job maps to a company already on the wish list, the rail says so instead of duplicating it.

---

#### Match Analysis (Matchanalys)

- **Name (EN / SV):** Match Analysis / Matchanalys
- **Status:** **BUILT.** Screen `src/screens/match.jsx` (route key `match`). Today it reads **`localStorage` only** (`getAcceptedJobs` from `jobStore.js`); pressing **Analysera** plays a timed animation and then renders a hardcoded `MATCH_DETAILS` fixture, with the match percentage defaulting to `76`. **The real analysis backend exists and is what this should bind to:** `POST /api/case/:id/analyze` -> submodule `gap-analyzer`, which writes the case parts **`fit`** (per-requirement match / partial / missing, cite-by-id) and **`gaps`**. The co-op fill-gap loop is wired: `POST /api/case/:id/gap/:gapId/answer` -> `fill-gap` / `bullet-judge` mints a datafact and flips a requirement to `match`. Requirements themselves come from `decodedRole` (submodule `decoder`). This is the single most important BUILT-to-real rebind in the category - swap the animation-then-fixture for the honest `fit` shape.
- **Purpose:** Explain *why* a job fits or does not - which requirements are met, which are missing, which CV parts to lift - so job search becomes a learning process, not a number.
- **Page / screen structure:**
  - **Verdict header:** the match percentage (deemphasized) + a one-line honest verdict ("Stark match" / "Delvis" / "Fel mal just nu"), sourced from `fit`.
  - **Requirement ledger** (main panel): one row per decoded requirement, each tagged `match` / `partial` / `missing`, with the evidence line and, for every `match`, a cited datafact (`evidenceRef`). Honesty rule baked in: a `match` whose datafact does not resolve is auto-downgraded to `partial` - the UI must render that downgrade, never a bare green tick.
  - **Gaps + bridges panel:** each gap shows `what` / `why` and a `bridge` (reframe / adjacent-proof / honest-ramp) with a `oneLiner`. Each gap has an inline **co-op dialogue** answer box (the wired write-back).
  - **"Is this worth applying for now?" callout:** direction advice - apply now, or aim at a different title / industry.
  - **Search-optimisation strip:** better keywords, alternative titles, related industries, useful geography, fed back to Job Search.
  - **Crosslinking right-rail** (see below).
- **Key tools / sub-features:** cite-by-id evidence; auto-downgrade of unresolved matches; per-gap co-op dialogue that appends to `bridge.material`; "better target?" re-aim suggestions; push refined terms back to Jobbsok.
- **CTAs:** primary **Analysera** (run gap-analyzer) and **Svara pa lucka** (answer a gap -> mint datafact -> flip to match). Secondary: **Anvand i CV** (lift a strength into the CV draft), **Optimera sokningen** (send terms to Job Search), **Fel mal - hitta battre** (re-aim).
- **Data (real, served shape):** `GET /api/case/:id` serves `fit`, `gaps` (+ `meta`, `decodedRole`). `fit`:
```json
{
  "capability": {
    "requirements": [
      { "requirementRef": {"kind":"decodedRequirement","id":"decodedRequirement_7ab3"},
        "evidence": "Rebuilt acquisition budget around LTV vs CPA; ROI tracked per spot, timeslot and channel at MrGreen and ComeOn.",
        "evidenceRef": {"kind":"datafact","id":"datafact_5c1e"},
        "status": "match" },
      { "requirementRef": {"kind":"decodedRequirement","id":"decodedRequirement_9d02"},
        "evidence": "Founded Coinhero, a crypto casino spanning casino, sportsbook and crypto, built 0-to-1.",
        "evidenceRef": {"kind":"datafact","id":"datafact_a740"},
        "status": "match" },
      { "requirementRef": {"kind":"decodedRequirement","id":"decodedRequirement_1f55"},
        "evidence": "No large-scale Web3 or token-partnership acquisition experience.",
        "status": "missing" }
    ]
  },
  "preference": "Direction fits: startup crypto-casino acquisition ownership matches the last 17 years. Comp/culture read: wants the number, not agency-management. No stated deal-breakers."
}
```
`gaps`:
```json
{ "gaps": [ {
    "id": "gap_c318", "what": "Web3 / token-partnership acquisition at scale",
    "why": "The ad hints at influencer and creator deals in a token economy; Daniel has not run token-partnership growth at scale.",
    "bridge": { "id": "bridge_44a1", "kind": "adjacent-proof",
      "body": "Real crypto-casino founder experience (Coinhero: casino + sportsbook + crypto) is the honest bridge, not a claim of token-partnership scaling.",
      "oneLiner": "Crypto-casino founder, not token-growth operator - bridges by build depth.",
      "material": [ { "source": "cv", "ref": {"kind":"datafact","id":"datafact_a740"} } ] },
    "provenance": "gap-analyzer" } ] }
```
- **Sample content:** Job in focus: **Head of Acquisition - crypto casino start-up (confidential, via BettingJobs)**. Verdict: "Stark match. Daniel har agt hela acquisition-tratten i 17 ar och grundat ett kryptokasino 0-till-1." Ledger rows - `match`: "Full-funnel acquisition styrd av LTV" (evidence: rebuilt budget around LTV vs CPA, ROI per spot/timeslot/channel); `match`: "Startup byggd 0-till-1" (Coinhero CEO/Founder - strategi, licensiering, brand, produkt, team fran noll); `missing`: "Web3/token-partnership i skala". Honest gap card: "Ingen storskalig Web3/token-partnership- eller DeFi-integrationserfarenhet. Riktig kryptokasino-grundarerfarenhet ar den arliga bryggan - inte ett pastaende om token-tillvaxt i skala."
- **Crosslinking (right-rail):** surfaces "Krav harleddes fran annonsen" (link into `decodedRole`), "Bevis kommer fran dina datafakta" (into the CV / datafact pool), and "Foretagsdossier" (into `dossiers` - note: produced by `researcher` but NOT served by `GET /api/case/:id`, so design it as if served). Each row is a `{kind, id}` ref with a relevance line; a gap in focus links to the exact CV bullet its bridge draws on.

---

#### Job Radar (Jobbradar)

- **Name (EN / SV):** Job Radar / Jobbradar
- **Status:** **PLANNED.** No screen (`jobbradar` sidebar key renders `ComingSoon`), no submodule, no case part, no endpoint. Design "as-if-real" against the invented shape below. (Adjacent real infra it would eventually lean on: the `dossiers` producer `researcher` for company signal enrichment, and the `crosslinks` derived query for the network-connection check.)
- **Purpose:** Find opportunities *before* they appear as ordinary job adverts, by reading public hiring signals and turning each into an action path.
- **Page / screen structure:**
  - **Signal feed** (main): reverse-chron cards, one per detected signal (funding, expansion, new office, leadership change, contract win, tender). Each card shows the company, the signal type, the source, a freshness stamp, and a "why this matters for you" line.
  - **Weekly lists panel:** generated collections - "Bolag som vaxer i din region", "Bolag som troligen anstaller inom din nisch", "Nyligen finansierade bolag", "Bra for spontanansokan".
  - **Signal-to-action strip** on each card: buttons to add the company to the Company List, start a blind application, or open Match Analysis on a likely role.
  - **Network-connection badge:** shows whether anyone in the person's network, or any HelloLilly coach, has a connection / prior case with the company.
  - **Crosslinking right-rail** (see below).
- **Key tools / sub-features:** signal-type filters; region + niche scoping; weekly digest generation; a "watch this company" toggle; the coach/network connection check.
- **CTAs:** primary **Lagg till i Foretagslista** and **Starta spontanansokan**. Secondary: **Bevaka bolaget**, **Visa troliga roller** (into Match Analysis).
- **Data (as-if-real JSON):**
```json
{
  "signals": [
    { "id": "signal_3e91", "company": "A5 Labs / QuintAce", "type": "funding",
      "headline": "A5 Labs raises growth round, expanding content-to-distribution team",
      "source": "press-release", "detectedAt": "2026-07-01T09:00:00Z",
      "region": "EU-remote", "niche": "social + real-money iGaming",
      "whyRelevant": "Growth-org expansion in exactly Daniel's lane: content-to-distribution engine plus retention experiments.",
      "networkConnection": { "coach": null, "self": null, "priorCase": null },
      "suggestedActions": ["add_to_company_list", "blind_application"] }
  ],
  "weeklyLists": [
    { "id": "list_grow_eu", "title": "Bolag som vaxer i EU-remote iGaming",
      "companyRefs": [ {"kind":"company","id":"company_a5labs"}, {"kind":"company","id":"company_duelbits"} ] }
  ]
}
```
- **Sample content:** Top signal card: **A5 Labs / QuintAce - Funding** "Ny tillvaxtrunda, utokar content-to-distribution-teamet." Why-line: "Tillvaxtorganisation som vaxer i exakt Daniels bana - content-to-distribution plus retention-experiment. Matchar A5 och A7." Second card: **Duelbits - Expansion** "Nya affiliate- och creator-partnerskap annonserade." Weekly list: "Bra for spontanansokan denna vecka: 3 kryptokasinon som nyligen tog in kapital och saknar utsedd acquisition-lead." Network badge on the confidential crypto-casino start-up: "Ingen direkt koppling annu - men HelloLilly-coach med iGaming-bakgrund finns."
- **Crosslinking (right-rail):** surfaces, per company in focus, "Redan pa din Foretagslista?", "Sparade jobb hos det har bolaget" (into `jobs`), and "Coach- eller natverkskoppling" (the `getCrosslinks` derived query, cross-case refs allowed by shape but unpopulated until later). Turns a market signal into a linked action across Company List and Blind Applications.

---

#### Company List (Foretagslista)

- **Name (EN / SV):** Company List / Foretagslista
- **Status:** **PLANNED.** No screen (`foretagslista` sidebar key renders `ComingSoon`), no collection, no endpoint. Design "as-if-real" against the invented shape below. (It would naturally read `dossiers` for the per-company "why relevant" text and Job Radar `signals` for the recent-signal line.)
- **Purpose:** The jobseeker's own curated wish list of interesting employers - built by hand or suggested by the system - with a reason and an action for each.
- **Page / screen structure:**
  - **Company cards / rows** (main): each shows the company, why it may be relevant, which roles may fit, recent signals, useful contacts, whether HelloLilly has relevant coach knowledge, and whether a blind application suits.
  - **Add / suggest bar:** manual add plus a "suggested for you" row driven by CV, geography, interests, industry, match data and Job Radar signals.
  - **Status column:** per company - watching / researching / blind-app drafted / applied - a lightweight pipeline the person owns.
  - **Detail drawer:** opens a fuller company view (dossier summary, open roles, signals, contact angles).
  - **Crosslinking right-rail** (see below).
- **Key tools / sub-features:** manual add + system suggestions; per-company fit reasoning; recent-signal line; coach-knowledge flag; blind-application-suitability flag; simple status pipeline.
- **CTAs:** primary **Lagg till bolag** and **Skriv spontanansokan** (into Blind Applications). Secondary: **Oppna dossier**, **Visa oppna roller** (into Match Analysis / Job Search), **Markera som bevakad**.
- **Data (as-if-real JSON):**
```json
{
  "companies": [
    { "id": "company_a5labs", "name": "A5 Labs / QuintAce",
      "source": "suggested", "status": "researching",
      "whyRelevant": "Content-to-distribution growth engine, funnel and retention experiments, AI-agent-native way of working - matches Daniel's A1/A5/A7.",
      "fitRoles": ["Head of Growth", "VP Growth"],
      "recentSignals": [ {"kind":"signal","id":"signal_3e91","text":"Tillvaxtrunda, utokar growth-teamet"} ],
      "contacts": [ {"name":"(hiring manager, growth)","angle":"warm - via LinkedIn-post om experimentkultur"} ],
      "coachKnowledge": true,
      "blindApplicationSuitable": true,
      "dossierRef": {"kind":"dossier","id":"dossier_company_a5labs"} },
    { "id": "company_duelbits", "name": "Duelbits",
      "source": "manual", "status": "watching",
      "whyRelevant": "Full acquisition-motor med FTD/CPA/LTV:CAC-ansvar - Daniels karnkompetens.",
      "fitRoles": ["Head of Acquisition"],
      "recentSignals": [], "contacts": [],
      "coachKnowledge": false, "blindApplicationSuitable": false }
  ]
}
```
- **Sample content:** Card 1: **A5 Labs / QuintAce** - status "Researching" - "Content-to-distribution-motor, experimentkultur, arbetar genom AI-agenter dagligen. Matchar Daniels A1/A5/A7. Arlig lucka: ingen egen Reddit/Discord-narvaro, ingen poker-doman." Roles: Head of Growth, VP Growth. Signal: "Tillvaxtrunda denna vecka." Coach-knowledge flag: green. Card 2: **Duelbits** - status "Watching" - "Full acquisition-motor, LTV:CAC-ansvar." Role: Head of Acquisition. Card 3 (suggested): **confidential crypto-casino start-up (via BettingJobs)** - "Forsta heltidsrekrytering inom marknad; forma acquisition-strategin fran noll. Matchar Coinhero-grundarerfarenheten - spontanansokan lampar sig."
- **Crosslinking (right-rail):** surfaces, per company, "Signaler fran Jobbradar", "Sparade och analyserade jobb hos bolaget" (into `jobs` + `fit`), "Foretagsdossier" (into `dossiers`), and "Coach som kanner bolaget" (the `getCrosslinks` derived query). This surface is the natural hub where Job Radar signals, saved jobs, and blind-application drafts converge on a single employer.

---

#### Blind Applications (Spontanansokningar)

- **Name (EN / SV):** Blind Applications / Spontanansokningar
- **Status:** **PLANNED.** No screen (`spontanansokningar` sidebar key renders `ComingSoon`), no submodule, no case part, no endpoint. Design "as-if-real" against the invented shape below. (It would reuse real infra when built: `researcher` / `dossiers` for company research, the `writer` submodule + `coverLetter` case part for the first message, and `meta` for follow-up scheduling.)
- **Purpose:** Contact companies even when no role is published - fewer but better, more personal and better-timed attempts, not generic mass outreach.
- **Page / screen structure:**
  - **Outreach composer** (main): a guided flow - company research -> find a suitable contact -> write the first message -> prepare the CV angle -> plan follow-up.
  - **Contact panel:** the chosen recipient, their role, and a suggested angle (warm vs cold, best channel).
  - **Message draft panel:** the first message with the CV-angle callout beside it; honesty flags for any claim not directly supported by the CV.
  - **Follow-up planner:** what to send, in what order, when - with a lightweight log of what has happened (sent / opened / replied / follow-up due).
  - **Crosslinking right-rail** (see below).
- **Key tools / sub-features:** company research summary; contact finder + angle suggestion; first-message drafting through the writing-rules gate; CV-angle preparation; follow-up sequencing; per-company activity log; `unsupported_by_cv` flagging carried over from the letter writer.
- **CTAs:** primary **Skriv forsta meddelandet** and **Planera uppfoljning**. Secondary: **Hitta kontakt**, **Forbered CV-vinkel**, **Logga handelse**.
- **Data (as-if-real JSON):**
```json
{
  "blindApplications": [
    { "id": "blindapp_71c4",
      "companyRef": {"kind":"company","id":"company_a5labs"},
      "contact": { "name":"(Head of People / hiring manager)", "role":"Growth hiring",
                   "channel":"linkedin", "angle":"warm - referera till deras experimentkultur-post" },
      "cvAngle": "Led med retention-experimentet pa MrGreen och OnlyiGaming-plattformen som byggs for hand - visar bade tillvaxt och AI-hantverk.",
      "firstMessage": { "language":"sv-SE",
        "paragraphs": [
          "Ni bygger en content-to-distribution-motor och testar er fram - det ar exakt sattet jag arbetat pa i 17 ar.",
          "Jag korde ett kontrollerat retention-experiment pa MrGreen, dodade branschens standardmodell nar ett kontrolltest visade bara ~5% lyft, och byggde prediktiva riskmodeller i Alteryx i stallet - aktiv spelartid steg fran ~2,5 till ~3,5 manader och LTV med ungefar 10-20%.",
          "Jag bygger just nu en B2B iGaming AI-content-plattform for hand pa Node.js/Supabase/BullMQ, sa data-och-AI-samtalet ar forstahands, inte lanat.",
          "Om ni oppnar en growth-roll skulle jag garna visa hur jag skulle angripa era forsta experiment."
        ],
        "unsupported_by_cv": [] },
      "followUp": [ {"when":"+5d","action":"mjuk paminnelse om ni oppnar en roll"} ],
      "log": [ {"at":"2026-07-02T10:00:00Z","event":"draft_created"} ] }
  ]
}
```
- **Sample content:** Target: **A5 Labs / QuintAce**, no published role. Contact angle: "Varm - referera till deras post om experimentkultur." CV angle: "Led med retention-experimentet och den handbyggda OnlyiGaming-plattformen." First message opener (Daniel's real voice, honesty rules obeyed): "Ni bygger en content-to-distribution-motor och testar er fram - det ar exakt sattet jag arbetat pa i 17 ar." (No 250+, MrGreen framed as founding-team work not CPO, ~5% reactivation figure kept, hyphens only.) Follow-up: soft reminder at +5 days. Log: "Utkast skapat 2026-07-02."
- **Crosslinking (right-rail):** surfaces, per outreach, "Bolaget pa din Foretagslista" (into Company List), "Jobbradar-signal som utloste detta" (into Job Radar signals), "Foretagsdossier for research" (into `dossiers`), and "Anvander samma CV-datafakta som Matchanalys" (into the datafact pool via `getCrosslinks`). This is the surface where a Job Radar signal completes its journey into a concrete, logged action.

---

### C. Preparation tools

*Vision purpose (Section C): "Help the jobseeker show up ready."* Both tools in this category are **PLANNED**. Neither maps to a built screen (`src/screens` has no research or prep file), and neither is served by the API today. Research Helper has a real backend **producer** (`researcher` writes `dossiers`) that `GET /api/case/:id` does not yet serve; Interview Prep binds to the `prep` case part, which is a contract-only shape with no producer. Both are designed "as if real" below. Sample content follows Daniel Oskarsson applying for the **Head of Acquisition** role at the BettingJobs confidential crypto-casino start-up (LinkedIn 4427319803).

---

#### Research Helper (Researchstöd)

**Status:** PLANNED. No screen file exists. There IS a real backend producer to design toward: the `researcher` submodule (REAL - Perplexity + LLM) writes the `dossiers` case part with four keyed dossiers (`company · product · people · niche`), each `{ title, summary, sources, paragraphs:[{id,text,sources?,appended?}] }`. **Caveat for the designer:** `dossiers` is produced but is NOT one of the six parts `GET /api/case/:id` serves (it returns only `meta, decodedRole, fit, gaps, cvDraft, coverLetter`). Binding this surface to live data needs endpoint work (serve `dossiers`) plus two write-back routes that also do not exist yet: "save a question" (adds a `question` node) and "drill deeper" (appends an `appended` paragraph via researcher's drill mode). Design against the real `dossiers` shape; treat the wire as unbuilt.

**Purpose:** Do research on a target company, role and niche correctly, relevantly and in the right amount - and help the person tell what is relevant from what is just noise.

**Page / screen structure:**
- **Top: research-context bar** - the situation template selector (before applying · before an interview · before a blind application · before a career change · before contacting someone · before choosing between jobs). The chosen template reshapes what the four dossiers emphasise. Shows the target: company name + role + `meta.status` chip (`researching`).
- **Left: dossier navigator** - four fixed tabs matching the `dossiers` keys, in order: **Company · Product · Niche · People** (People deliberately last so a first pass reads the market before the individuals). Each tab shows its `dossier.summary` as a one-line preview and a `status` dot from the envelope (`absent/pending/ready/failed`).
- **Center: dossier reader** - the active dossier as a scroll of `paragraphs[]`. Each paragraph is an addressable block (`paragraph_<hex>`) with inline source chips from `paragraph.sources`. A paragraph marked `appended:true` renders as an indented drill-deeper subsection carrying its originating query. Two per-paragraph micro-actions live in the gutter: **Save as question** and **Drill deeper**.
- **Right rail: crosslinking panel** (the standard right-rail) - surfaces what this research connects to elsewhere in the case (see Crosslinking below).
- **Bottom: relevance shelf** - a "signal vs noise" strip. The person tags paragraphs Relevant / Noise; a live "research budget" meter shows how much reading is enough for the chosen template so research does not run forever.

**Key tools / sub-features:**
- **Situation templates** - the six vision templates; each maps to a preset over which dossier keys and which paragraph subjects (funding, red-flags, competitors, culture, interview-question angles) get prioritised.
- **Save-as-question** - promotes a `paragraph` into a `question` node with a `sourceRef` back to it (feeds Interview Prep and the interview cards later).
- **Drill deeper** - a targeted follow-up search on a `paragraph` ref; researcher appends an `appended` paragraph to that dossier so the deeper answer stays anchored to what triggered it.
- **Source transparency** - every paragraph carries its `sources`; the reader can expand to the raw source list (Perplexity-backed), so nothing is an unattributed assertion.
- **Relevance / noise tagging + research-budget meter** - the "right amount" control.

**CTAs:**
- Primary: **Run research** (invoke `researcher` for the case) · **Drill deeper on this paragraph**.
- Secondary: **Save as question** · **Mark relevant / noise** · **Send to Interview Prep**.

**Data (as-if-real, modeled on the real `dossiers` shape produced by `researcher`):**
```json
{
  "dossiers": {
    "status": "ready",
    "updatedAt": "2026-07-02T09:14:00Z",
    "data": {
      "company": {
        "title": "BettingJobs client - start-up crypto casino (confidential)",
        "summary": "Early-stage crypto-native casino and sportsbook; first full-time marketing hire being brought in to own acquisition from zero.",
        "sources": ["https://www.linkedin.com/jobs/view/4427319803"],
        "paragraphs": [
          { "id": "paragraph_9a2f1c04", "text": "The operator is a pre-scale crypto casino spanning casino and sportsbook, hiring its first dedicated acquisition owner rather than outsourcing to an agency. Signals a build-the-engine mandate, not a manage-the-agency one.", "sources": ["https://www.linkedin.com/jobs/view/4427319803"] },
          { "id": "paragraph_5d70bb18", "text": "No public funding round disclosed; confidential client via BettingJobs. Red flag to probe: runway and whether the acquisition budget is committed or still being argued for.", "sources": ["https://www.bettingjobs.com"] }
        ]
      },
      "product": {
        "title": "Product - crypto casino + sportsbook",
        "summary": "Crypto-native deposits, casino and sportsbook verticals; likely competing on payout speed and bonus mechanics rather than brand.",
        "sources": [],
        "paragraphs": [
          { "id": "paragraph_c1188e6a", "text": "Crypto-first casinos typically differentiate on instant crypto withdrawals and aggressive first-deposit mechanics. Open question for the interview: is the edge product (payout UX) or distribution (affiliates and creators)?", "sources": [], "appended": true }
        ]
      },
      "niche": {
        "title": "Niche - crypto casino acquisition economics",
        "summary": "Acquisition in crypto casino lives on FTD, CPA and LTV:CAC; affiliate-heavy channel mix with volatile player quality.",
        "sources": [],
        "paragraphs": [
          { "id": "paragraph_772ae330", "text": "Daily vocabulary: FTD, CPA, registration-to-deposit conversion, LTV:CAC, ARPU, churn. Affiliates scale fastest but bring lower-LTV, higher-churn players - the exact tension Daniel rebuilt budget around at MrGreen and ComeOn.", "sources": [] }
        ]
      },
      "people": {
        "title": "People - hiring manager and team",
        "summary": "Interviewer role not yet named in the ad; confidential client. Prepare to research the individual once the recruiter shares the name.",
        "sources": [],
        "paragraphs": [
          { "id": "paragraph_04ffab21", "text": "Placeholder: interviewer identity pending recruiter confirmation. Angle when known: whether they come from a growth/performance-marketing background or an operator-founder background changes which of Daniel's stories land.", "sources": [] }
        ]
      }
    }
  }
}
```

**Sample content (Daniel's voice / facts):**
- *Company dossier summary (rendered):* "Early-stage crypto-native casino and sportsbook. They are hiring a first dedicated acquisition owner rather than handing it to an agency - a build-the-engine mandate."
- *Saved question (promoted from paragraph_5d70bb18):* "Is the first-year acquisition budget committed, or am I being hired to argue for it? At MrGreen I built the profitable CRM department and grew active players ~400% in a year, but that assumed a budget existed to allocate."
- *Relevance tag example:* Daniel marks the payout-UX paragraph **Relevant** ("this is where a crypto casino actually wins or loses players") and a generic "history of online gambling" paragraph **Noise**.
- *Drill-deeper query (on the niche paragraph):* "How do crypto-casino affiliates compare to TV and paid media on player LTV?" - anchored back to the affiliate-vs-LTV paragraph, echoing Daniel's A2 channel-mix-by-LTV work.

**Crosslinking (right rail surfaces):** `getCrosslinks({ caseId, focus:{ kind:'paragraph', id } })` for the paragraph currently in the reader (derived query, no stored field). From a Research Helper paragraph it surfaces: (1) `decodedRole` requirements this paragraph informs (e.g. the niche/LTV paragraph -> the "acquisition economics" requirement); (2) `gaps` a red-flag paragraph exposes (the runway paragraph -> a "confirm budget commitment" gap); (3) `cvDraft` datafacts and `fit` capability rows that answer what the research asks for (the affiliate-LTV paragraph -> Daniel's channel-mix-by-LTV evidence); (4) saved `question` nodes derived from this paragraph, ready to hand to Interview Prep. This is the "connected environment" idea from the vision - the person is not reading in isolation, the rail shows what each finding touches in their own case.

---

#### Interview Prep (Intervjuförberedelse)

**Status:** PLANNED. No screen file exists, and this is NOT `interview.jsx` (that screen is the Interview *Trainer* - the live simulation, a separate vision tool). Interview Prep binds to the `prep` case part, which is **contract-only and NOT BUILT**: its envelope is factory-seeded `absent`, no submodule writes it, and `GET /api/case/:id` does not serve it. It DOES pull from four parts that are real: `dossiers` (from Research Helper / `researcher`), `decodedRole` (`decoder`), `fit` + `gaps` (`gap-analyzer`), and `cvDraft` (`cv-builder`). Design toward the contract `prep` shape `{ PREP:{sections:[{id,heading,full,compressed}]}, cvStory:{slides:[{id,headline,detail}]} }`, but treat both the `prep` producer and the wire as unbuilt. The "which answers need more practice" hand-off to Interview Trainer targets the `interview.jsx` screen (also fixture today).

**Purpose:** Connect research, the job advert, the CV and Interview Trainer into structured preparation for one specific meeting - so training is specific, not generic.

**Page / screen structure:**
- **Top: meeting header** - reads `meta`: company, role, `round`, `interviewDate`, `interviewers`, `format`. This is the one meeting being prepped for.
- **Center is four stacked prep panels** (the "makes it specific" spine):
  1. **What the company does + what the role requires** - a synthesis pulling `dossiers` summaries and `decodedRole.requirements` (the 6-12 weighted real requirements beneath the ad), sorted by `weight`.
  2. **Which examples from your CV to use** - the `cvStory.slides[]` view: for each high-weight requirement, the CV story that answers it, pulled from `cvDraft` datafacts and `fit` `match` evidence. Each slide is `{ headline, detail }`.
  3. **Risks / weaknesses to prepare for** - reads `gaps` (each `{what, why, bridge}`) and `fit` `partial`/`missing` rows. Shows the honest bridge for each (`bridge.kind`: reframe · adjacent-proof · honest-ramp) so the person walks in with a prepared, honest answer rather than a fabricated one.
  4. **Questions you can ask them** - `question` nodes saved in Research Helper plus generated role-specific questions.
- **Right rail: crosslinking panel** (standard right-rail) - see Crosslinking.
- **Bottom: practice hand-off strip** - flags "which answers need more practice" and sends those specific requirements into Interview Trainer, rather than practising everything generically.

**Key tools / sub-features:**
- **PREP sections with density** - `PREP.sections[]` each carry `full` and `compressed` text; a per-section `density` tag drives two deterministic projections (no LLM in the step): a **30-minute cheat sheet** (`compressed` of the 30-min subset) and a **5-minute quick ref** (`compressed` of the 5-min subset).
- **CV-story slides** - the `cvStory.slides[]` mapping of requirement -> the exact achievement to tell.
- **Risk / weakness prep** - each `gap` shown with its honest `bridge.oneLiner` for a live-answer-ready form.
- **Questions-to-ask deck** - assembled from saved `question` nodes.
- **Send-to-Trainer** - hands flagged requirements to `interview.jsx` (Interview Trainer).

**CTAs:**
- Primary: **Build prep** (would invoke the `prep` producer - not built) · **Generate 5-min quick ref**.
- Secondary: **Send these to Interview Trainer** · **Add question to ask** · **Mark this answer needs practice**.

**Data (as-if-real, modeled on the contract `prep` shape):**
```json
{
  "prep": {
    "status": "ready",
    "updatedAt": "2026-07-02T10:02:00Z",
    "data": {
      "PREP": {
        "sections": [
          {
            "id": "prepSection_11ab90",
            "heading": "What the role really requires",
            "full": "First full-time acquisition hire for a start-up crypto casino. Under the advert this reads as: own the full funnel across paid media, SEO, content, influencer, affiliates and CRM; be accountable for FTD, CPA and LTV:CAC; build the attribution and reporting frameworks from scratch; tie acquisition to retention; and hire the team. The weighted core is budget-ownership plus attribution-from-zero, not channel execution.",
            "compressed": "Own the full acquisition funnel and the number (FTD, CPA, LTV:CAC), build attribution from zero, tie acquisition to retention, hire the team."
          },
          {
            "id": "prepSection_11ab91",
            "heading": "Risk to prepare for - Web3 scaling",
            "full": "The honest gap is large-scale Web3 / token-partnership acquisition. Do not claim it. The bridge is founder-level crypto-casino build experience: Coinhero, a crypto casino spanning casino, sportsbook and crypto, built 0-to-1 - strategy, licensing, brand, product and team.",
            "compressed": "No token-partnership-at-scale. Bridge with Coinhero: a crypto casino built 0-to-1."
          }
        ]
      },
      "cvStory": {
        "slides": [
          {
            "id": "cvSlide_7c0a12",
            "headline": "Budget by LTV, not CPA",
            "detail": "At MrGreen and ComeOn I rebuilt acquisition spend around lifetime value: affiliates scaled easily but brought lower-LTV, higher-churn players, so I moved budget into channels I could measure ROI on per spot, timeslot and channel. Blended CPA fell while customer quality rose."
          },
          {
            "id": "cvSlide_7c0a13",
            "headline": "Acquisition tied to retention",
            "detail": "At MrGreen I ran a controlled retention test, killed the industry-standard reactivation model when it showed only ~5% uplift, built predictive risk-scoring models in Alteryx and shifted to a proactive team. Active player lifespan went from ~2.5 to ~3.5 months and LTV rose roughly 10-20% across the base."
          }
        ]
      }
    }
  }
}
```

**Sample content (Daniel's voice / facts):**
- *Prep panel 1 (role requirements, from decodedRole):* "The weighted core is budget-ownership and attribution-from-zero, not channel execution. They want someone who owns the number in a start-up, not someone who manages an agency to hit it."
- *CV-story slide (which example to use):* "Budget by LTV, not CPA - at MrGreen and ComeOn I moved spend off lower-LTV affiliate traffic into channels I could measure ROI on per spot, timeslot and channel; blended CPA fell while quality rose."
- *Risk / weakness prep (honest bridge):* "If they push on Web3 and token partnerships at scale, do not bluff. Answer: I have not run token-partnership growth at scale - the honest limit is that I founded Coinhero, a crypto casino spanning casino, sportsbook and crypto, and built it 0-to-1."
- *Question to ask them:* "Is the first-year acquisition budget committed, or is the first job to build the case for it? I want to know whether I am allocating a budget or fighting for one."
- *Needs-more-practice flag:* the Web3-scaling answer is flagged and sent to Interview Trainer so Daniel practises that specific bridge, not the stories he already tells cleanly.

**Crosslinking (right rail surfaces):** `getCrosslinks({ caseId, focus:{ kind:'prepSection', id } })` (or `focus.kind:'cvSlide'`) - a derived within-case query, not a stored part. From an Interview Prep panel it surfaces: (1) the `decodedRole` requirement each PREP section answers, with its `weight`; (2) the `dossiers` paragraphs (from Research Helper) that back a company/role claim, so the person can verify before they say it; (3) the `fit` capability row and `cvDraft` datafact behind each `cvStory` slide (the evidence for the story); (4) the `gaps` and their honest `bridge` behind each risk panel; (5) forward links to Interview Trainer (`prep`/`cards`) for the specific answers flagged as needing practice. The rail is what makes prep "connected" per the vision: every claim traces back to research, every story traces to a real CV datafact, every risk carries its honest bridge.

---

### D. Network tools

> Category-level note (cross-checked against the BUILT REALITY MAP): none of the three Network tools maps to any of the 13 built routes in `LL_ROUTES`. There is no LinkedIn-communication screen, no contact-plan screen, and no network-connection screen; every corresponding sidebar key renders `ComingSoon`. There is also no purpose-built backend: no submodule writes LinkedIn/outreach/network data, no case part holds it, and no endpoint serves it. **All three tools are PLANNED.** Each block below invents an "as-if-real" JSON shape the designer can render against, and each reuses the case-part status envelope (`{status:'absent'|'pending'|'ready'|'failed', data, error?, updatedAt}`) so a PLANNED surface still speaks the same loading/empty/error language as the built ones. Where a PLANNED tool can honestly lean on a real served shape, it is named (e.g. `meta`, `dossiers.people`, `crosslinks` as a derived query).

#### LinkedIn Helper (LinkedIn-stod)

- **Name (EN / SV):** LinkedIn Helper / LinkedIn-stod
- **Status:** **PLANNED.** No built screen (not in `LL_ROUTES`; sidebar key renders `ComingSoon`). No backend: no submodule authors LinkedIn communication, no case part holds it, no endpoint serves it. The closest real primitives it would eventually reuse: the `writer` submodule pattern (LLM prose behind the deterministic banned-phrase writing-rules gate) and the `researcher` output `dossiers.people` (interviewer/contact background) for recipient-fit. Design it as-if-real against the invented `linkedinHelper` shape below.
- **Purpose:** Check, improve and de-risk any LinkedIn text (profile, connection request, first message, follow-up, comment, post idea) before it is sent or published, so the fear of "writing the wrong thing" stops blocking the person.
- **Page / screen structure:**
  - **Left rail - piece picker:** the six communication types (Profile, Connection request, First message, Follow-up, Comment, Post idea) as selectable modes; each shows a last-checked timestamp and a small green "checked" state once run.
  - **Center - the workbench (two panes):** a *Draft* pane (the person's own text, or a from-scratch prompt) and a *Checked* pane showing the improved version with inline change markers. Between them a compact scorecard: Tone, Clarity, Pushiness, Industry fit, Recipient fit - each a plain label with a one-line reason, never a bare number.
  - **Below the panes - "Why this is fine" reassurance strip:** short plain-language verdict ("This is reasonable. This is professional. This has been checked.") plus the specific things that were adjusted.
  - **Right rail - crosslinking panel (see Crosslinking).**
- **Key tools / sub-features:**
  - Six mode-specific checkers (profile headline/about; connection-request note; first message; follow-up; comment; post idea) each with its own length and tone target.
  - Recipient-fit read: when a target person is known (from Outreach Plan or a pasted profile), tunes tone to seniority and relationship distance.
  - Pushiness meter with a concrete rewrite when a message reads as too eager.
  - Writing-rules gate: every generated line passes the same deterministic banned-phrase gate the `writer` uses, so buzzwords ("passionate", "excited", "synergy") cannot ship.
  - "Explain the change" toggle so the person learns the rule, not just the fix.
- **CTAs:** **Check my text** (primary) · Improve for me · Copy to LinkedIn · Save as template · Ask a coach to look.
- **Data (as-if-real, PLANNED):**
```json
{
  "linkedinHelper": {
    "status": "ready",
    "data": {
      "caseId": "case_9f2a71c0",
      "piece": {
        "id": "liPiece_5c1d",
        "type": "first_message",
        "recipientRef": { "kind": "paragraph", "id": "paragraph_a91b" },
        "draft": "Hi, saw you lead growth at A5 Labs. I have spent 17 years owning full marketing funnels in iGaming, and I built an AI content platform myself. Would love to connect and maybe chat.",
        "checked": "Hi - I saw you lead growth at A5 Labs / QuintAce. I have spent 17 years owning full marketing funnels operator-side in iGaming, and I currently build a B2B iGaming AI content platform by hand. Keen to connect - I follow the content-to-distribution problem you are hiring around.",
        "scores": [
          { "label": "Tone", "signal": "good", "reason": "Warm and direct, no over-familiarity." },
          { "label": "Clarity", "signal": "good", "reason": "One clear reason for reaching out." },
          { "label": "Pushiness", "signal": "good", "reason": "Removed 'maybe chat' - reads calmer, not eager." },
          { "label": "Industry fit", "signal": "good", "reason": "Names the operator-side / B2B distinction correctly." },
          { "label": "Recipient fit", "signal": "partial", "reason": "Could reference the specific role they are hiring for." }
        ],
        "changes": [
          { "kind": "buzzword_removed", "before": "love to connect", "after": "keen to connect" },
          { "kind": "specificity_added", "note": "Added the content-to-distribution hook from the role." }
        ],
        "gatePassed": true,
        "reassurance": "This is reasonable and professional. It has been checked - nothing here reads as pushy or off.",
        "updatedAt": "2026-07-02T09:12:00Z"
      }
    }
  }
}
```
- **Sample content (Daniel):**
  - *Profile About (checked):* "iGaming growth and marketing leader - 17 years owning the full funnel, 15+ years operator-side. Helped scale MrGreen (founding team) and ComeOn from small startups to NASDAQ-listed operators, built BI and retention systems that raised player lifetime value, and now build a B2B iGaming AI content platform by hand on a Node.js / Supabase / BullMQ stack."
  - *Connection request note (checked):* "Hi - I saw the Head of Acquisition role at Duelbits. I have owned full acquisition funnels operator-side for 17 years and founded a crypto casino 0-to-1 (Coinhero). Happy to connect either way."
  - *"Why this is fine" strip:* "Checked. The note is short, names one real reason, and does not oversell. The founder line is accurate - Coinhero was a real 0-to-1 crypto casino, so it is a fact, not a claim."
- **Crosslinking (right-rail surfaces here):** a coach-approved connection-note template; the target person's background pulled from `dossiers.people` (who they are, what they lead); a short video "how recruiters read LinkedIn outreach"; the company research note (`dossiers.company`); a coach with iGaming/marketing background; and, where consent exists, an anonymised example of a message that landed a reply for a similar role. Surfaced via the derived `getCrosslinks({caseId, focus:{kind:'paragraph', id}})` query, not a stored field.

#### Outreach Plan (Kontaktplan)

- **Name (EN / SV):** Outreach Plan / Kontaktplan
- **Status:** **PLANNED.** No built screen (not in `LL_ROUTES`; `ComingSoon`). No backend: no `contacts` / `outreach` collection is written today (collections actually written are `jobs`, `jobSources`, `filterSet`), no case part holds a contact sequence, no endpoint serves it. It would reuse `meta` (company, role, interviewers) and `dossiers.people` for real target data, and reference the same LLM-prose-through-gate pattern for drafts. Design as-if-real against the invented `outreachPlan` shape.
- **Purpose:** Turn "I know I should reach out but I don't know who, in what order, or what to say" into a concrete, ordered contact plan with drafted messages, timing and follow-up rules.
- **Page / screen structure:**
  - **Header - the target:** company + role from `meta`, plus a one-line "why this company" pulled from research.
  - **Main - the contact sequence (ordered list / kanban):** each contact is a card in priority order showing who, relationship, why-them, the drafted opener, planned channel, "send by" date, and a follow-up rule. Cards move through states: To draft -> Ready -> Sent -> Followed up -> Replied / No reply.
  - **Per-card detail drawer:** the full drafted message, the "what to avoid" note for that recipient, and a natural-follow-up suggestion.
  - **"Do's and don'ts" strip:** unwritten-social-rules guidance for people who find outreach etiquette hard (spacing, not double-messaging, how to keep it human).
  - **Right rail - crosslinking panel (see Crosslinking).**
- **Key tools / sub-features:**
  - Contact ordering by relationship strength and likely influence (former colleagues and warm intros first, cold recruiters later).
  - Per-contact message drafts (opener, follow-up 1, follow-up 2) each gate-checked.
  - Timing engine: "send by" dates and follow-up spacing so nothing is sent too fast or forgotten.
  - "What to avoid" per recipient (e.g. do not lead with the ask on a cold connection).
  - Handoffs: sends a chosen message into **LinkedIn Helper** for a final check; pulls targets from **Network Match**; reads the **Company List** and **Job Radar**.
- **CTAs:** **Build my outreach plan** (primary) · Draft this message · Check in LinkedIn Helper · Mark as sent · Set a follow-up reminder.
- **Data (as-if-real, PLANNED):**
```json
{
  "outreachPlan": {
    "status": "ready",
    "data": {
      "caseId": "case_9f2a71c0",
      "target": { "company": "A5 Labs / QuintAce", "role": "Head of Growth", "sourceInput": "LinkedIn 4420117327" },
      "contacts": [
        {
          "id": "contact_1a2b",
          "name": "Former ComeOn colleague",
          "relationship": "warm",
          "role": "now at a peer operator",
          "whyThem": "Can give a read on the growth team and possibly a warm intro.",
          "priority": 1,
          "channel": "linkedin",
          "state": "ready",
          "sendBy": "2026-07-04",
          "opener": "Hi - it has been a while since ComeOn days. I am looking at growth leadership roles in iGaming again and A5 Labs is on my list. Would you be open to a short call?",
          "avoid": "Do not open with the ask for an intro - reconnect first.",
          "followUp": { "afterDays": 5, "note": "One gentle nudge only, then leave it." }
        },
        {
          "id": "contact_3c4d",
          "name": "Head of Growth (hiring manager)",
          "relationship": "cold",
          "role": "target hiring manager",
          "whyThem": "The person who owns the number this role reports into.",
          "priority": 2,
          "channel": "linkedin",
          "state": "to_draft",
          "sendBy": "2026-07-07",
          "opener": null,
          "avoid": "No pitch in the connection note - one line of relevance, that is all.",
          "followUp": { "afterDays": 7, "note": "Follow up once with a concrete, specific line." }
        }
      ],
      "dosAndDonts": [
        "Space messages out - never double-message before a reply.",
        "Warm contacts before cold ones.",
        "Keep it human - one real reason per message."
      ],
      "updatedAt": "2026-07-02T09:20:00Z"
    }
  }
}
```
- **Sample content (Daniel):**
  - *Contact 1 (warm, former ComeOn colleague):* opener above - reconnect first, ask second.
  - *Contact 2 (cold, hiring manager at Duelbits for the Head of Acquisition role):* "Hi - I saw the Head of Acquisition role. I have owned full acquisition funnels operator-side for 17 years, allocate budget by lifetime value rather than CPA, and founded a crypto casino 0-to-1 (Coinhero). Keen to connect."
  - *"What to avoid" note:* "On the crypto-casino start-up (BettingJobs confidential client), do not overstate Web3 scaling - lead with the founder-level 0-to-1 build, which is the honest strength."
- **Crosslinking (right-rail surfaces here):** the target company research (`dossiers.company`) and interviewer/people background (`dossiers.people`); coach-approved outreach templates; a **Network Match** result showing whether any of these contacts are reachable through the person's own network or a coach; a short guide on cold-outreach etiquette; and the person's Company List and any live **Job Radar** signal on this company, turning a signal into an action path. Derived via `getCrosslinks` on the contact / company refs.

#### Network Match (Natverksmatch)

- **Name (EN / SV):** Network Match / Natverksmatch
- **Status:** **PLANNED.** No built screen (not in `LL_ROUTES`; `ComingSoon`). No backend: there is no network graph, no consent store, no coach-experience index, and no cross-case connection data (cross-case `caseId` refs are allowed by the addressing scheme but unpopulated until A8). This is the most backend-dependent Network tool - it needs data HelloLilly has organisationally (coaches, consented cases, network) that the current single-user in-memory store does not hold. Design as-if-real against the invented `networkMatch` shape, and treat consent state as first-class.
- **Purpose:** Show a person who feels alone that there is a real path in - whether their own network, a coach, or a consented peer case connects to a specific company or industry.
- **Page / screen structure:**
  - **Header - "Do we have a way in?":** company/industry in focus (from `meta` or a searched company) with a single honest headline: a warm path exists, or it does not.
  - **Main - four connection lanes (cards, only shown when a real match exists):**
    1. **Your own network** - someone the person is connected to who is linked to the company.
    2. **A coach** - a coach who knows the company or has placed others into similar roles.
    3. **A peer case** - another jobseeker with experience there, shown only where explicit consent was given.
    4. **Material** - relevant templates, examples or tips tied to this company/industry.
  - **Empty-but-honest state:** when there is no connection, it says so plainly and hands off to Outreach Plan for a cold path, rather than inventing a match.
  - **Consent + boundaries strip:** every peer/person card shows how the connection may be used and its consent basis; nothing contactable is exposed without it.
  - **Right rail - crosslinking panel (see Crosslinking).**
- **Key tools / sub-features:**
  - Connection finder across the four lanes (own network, coaches, consented peer cases, material).
  - Consent gating: a peer-case lane appears only with explicit consent; a "request an intro" action routes through the coach/consent boundary, never a direct exposed contact.
  - Coach-experience match: surfaces the coach whose background fits the company/industry (mirrors the Coach Network idea from the coach side).
  - Strength read per match ("close / mutual / same-industry") as a plain label, not a score.
  - Handoff into **Outreach Plan** (adds a found contact as a target) and **LinkedIn Helper** (checks the intro message).
- **CTAs:** **Find a way in** (primary) · Request an introduction · Add to Outreach Plan · Ask this coach · View the shared example.
- **Data (as-if-real, PLANNED):**
```json
{
  "networkMatch": {
    "status": "ready",
    "data": {
      "caseId": "case_9f2a71c0",
      "focus": { "company": "Duelbits", "industry": "crypto casino / iGaming" },
      "hasWayIn": true,
      "lanes": {
        "ownNetwork": [
          { "id": "nm_own_1", "who": "Ex-ComeOn colleague", "link": "now works at a Duelbits partner",
            "strength": "mutual", "consent": "self", "action": "request_intro" }
        ],
        "coaches": [
          { "id": "nm_coach_1", "coach": "iGaming/marketing coach", "basis": "placed two growth leads into crypto-casino operators",
            "strength": "same-industry", "action": "ask_coach" }
        ],
        "peerCases": [
          { "id": "nm_peer_1", "summary": "A peer worked acquisition at a crypto sportsbook and shared their approach",
            "consent": "explicit", "caseRef": { "kind": "case", "id": "case_be14", "caseId": "case_be14" },
            "action": "view_shared_example" }
        ],
        "material": [
          { "id": "nm_mat_1", "kind": "template", "title": "Cold intro to a crypto-casino hiring manager" }
        ]
      },
      "boundaries": "Peer cases shown only with explicit consent. Introductions are requested through a coach, never by exposing a direct contact.",
      "updatedAt": "2026-07-02T09:28:00Z"
    }
  }
}
```
- **Sample content (Daniel):**
  - *Own-network lane:* "An ex-ComeOn colleague now works at a Duelbits partner - a possible warm route to the Head of Acquisition team."
  - *Coach lane:* "One coach has an iGaming and marketing background and has helped others into crypto-casino operators - worth a second opinion on the acquisition-economics angle."
  - *Peer-case lane (consented):* "A peer who ran acquisition at a crypto sportsbook has shared, with consent, how they framed a founder-level 0-to-1 background - close to Daniel's Coinhero story."
  - *Empty-state honesty (for A5 Labs / QuintAce, no match):* "No warm connection to A5 Labs yet - neither in your network nor among coaches. The honest path here is a well-checked cold outreach. Open Outreach Plan?"
- **Crosslinking (right-rail surfaces here):** the coach whose background matches the company/industry (the human path in); consented anonymised peer examples for the same company or role; relevant intro templates; the company research note (`dossiers.company`) so the person knows what to say once connected; and a handoff to Outreach Plan / LinkedIn Helper to act on any found path. All surfaced through the derived `getCrosslinks({caseId, focus:{kind:'case'|'company', id}})` query with consent applied before anything person-level is shown.

---

### E. Coach tools

Support the coaches with everything outside their own personal expertise. This category is the coach-facing mirror of the jobseeker product: the same shared case, viewed and acted on from the coach side. In the shipped app there is exactly one built coach screen, `coach.jsx` (route key `coach`), and it renders only the "Dagens moten" (today's meetings) workspace with the old Amir/PostNord fixture. Every one of the six tools below lives behind a coach-sidebar nav key (the `c-*` keys in `COACH_NAV_GROUPS`) that currently renders `ComingSoon`. None calls a backend. Because the data contract defines a single shared case (`meta.owner`, one set of case parts), coach surfaces that show a jobseeker's journey bind to the SAME real case parts the jobseeker surfaces bind to (`GET /api/case/:id`) - the coach view is a different render of one case, not a separate data store.

A note the designer must honor across all six: the reality map confirms the frontend never calls its own backend today, and there is no coach-specific backend anywhere. So even the tool that maps cleanly to `GET /api/case/:id` is BUILT-as-screen-only and reads a fixture; "bind to" means "the endpoint/part the design should wire to," not "the screen that already reads it."

---

#### Case Record (Arendevy)

- **Status:** BUILT (screen-only, reads a fixture; needs wiring). Screen: `coach.jsx`, coach nav key **`c-arendevy`** (group "Arenden"), currently renders `ComingSoon`; the built `coach` default workspace shows the Amir/PostNord `CASE_RECORD` fixture from `strategyData.js`. Real binding: **`GET /api/case/:id`** -> `{ meta, decodedRole, fit, gaps, cvDraft, coverLetter }`. This is the coach-side render of the exact same single shared case (`meta.owner`) the jobseeker screens read. Activity/timeline is NOT servable as a real shape (no activity collection exists; the fixture's `timeline`/`activityCount` have no producer) - drive the "activity history" strip off case-part `status` transitions and `meta.status` only, and mark the richer timeline PLANNED.
- **Purpose:** One living shared picture of a jobseeker's journey - the current situation, goals, barriers, activities and next steps - that both coach and jobseeker see, instead of a journey scattered across meetings, emails and systems.
- **Page / screen structure:**
  - **Header band** - jobseeker name, target role/company, `meta.status` chip (intake -> researching -> analyzing -> prep_ready -> live -> post -> done), assigned coach, results-based match-progress marker.
  - **Left: the journey spine** - a vertical progress rail rendering each case part's envelope `status` (absent / pending / ready / failed) as its own state: Research (dossiers), Decoded role, Fit and gaps, CV draft, Cover letter. A `failed` envelope surfaces its `error` string inline.
  - **Center: the working panels** (tabbed): Goals and barriers (from intake + `decodedRole.narrative`) · CV versions and applications (`cvDraft.sections`) · Job matches and saved jobs (the `jobs` collection) · Fit and gaps (`fit.capability.requirements` + `gaps.gaps`) · Coach notes (PLANNED - no notes part exists) · Documents and summaries (PLANNED).
  - **Right rail: crosslinking panel** (see Crosslinking).
- **Key tools / sub-features:** part-status progress spine; goals-and-barriers view; CV-versions and applications list; fit/gaps drill-in with cite-by-id evidence; agreed-next-steps list (PLANNED store); coach-notes panel (PLANNED); document and summary vault (PLANNED).
- **CTAs:** Open fit and gaps · Trigger analysis (`POST /api/case/:id/analyze`) · Regenerate CV and letter (`POST /api/case/:id/generate`) · Add next step (PLANNED) · Add coach note (PLANNED).
- **Data (real, served):**
```json
{
  "meta": {
    "id": "case_9f2a71c4",
    "company": "Duelbits",
    "role": "Head of Acquisition",
    "sourceInput": "LinkedIn 4429526797",
    "owner": "self",
    "status": "analyzing",
    "cvVersionRef": { "kind": "datafact", "id": "datafact_1a2b3c4d" },
    "createdAt": "2026-06-30T09:12:00Z",
    "updatedAt": "2026-07-02T08:40:00Z"
  },
  "decodedRole": {
    "status": "ready",
    "data": {
      "narrative": "This is a full-funnel acquisition owner role for a crypto casino, accountable for FTD, CPA and LTV:CAC across paid media, affiliates, creators and CRM-linked retention.",
      "requirements": [
        { "id": "decodedRequirement_7c1", "requirement": "Own acquisition economics end to end (CPA, FTD, LTV:CAC)", "rationale": "The number sits with this hire, not an agency.", "weight": 5 }
      ]
    }
  },
  "fit": {
    "status": "ready",
    "data": {
      "capability": {
        "requirements": [
          { "requirementRef": { "kind": "decodedRequirement", "id": "decodedRequirement_7c1" }, "evidence": "Rebuilt budget allocation around LTV rather than CPA at MrGreen and ComeOn, tracking ROI per TV spot, timeslot and channel.", "evidenceRef": { "kind": "datafact", "id": "datafact_a2" }, "status": "match" }
        ]
      },
      "preference": "Direction fits: a startup crypto casino where owning the number from zero is the job. No comp deal-breaker signalled."
    }
  }
}
```
- **Sample content:** Case header - "Daniel Oskarsson - Head of Acquisition at Duelbits - status: Analyzing." Journey spine: Research READY, Decoded role READY, Fit and gaps READY, CV draft READY, Cover letter PENDING. Goals-and-barriers panel: "Goal: land a full-funnel acquisition lead role at a crypto casino or high-growth operator. Barrier named honestly: no large-scale Web3 or token-partnership acquisition experience - bridged by real crypto-casino founder work at Coinhero, not claimed." Next steps (as-if): "Finish the cover-letter draft, then rehearse the LTV-vs-CPA budget story for the second-round panel."
- **Crosslinking (right rail):** `getCrosslinks({ caseId, focus:{ kind:'decodedRequirement', id } })` - a within-case derived query (not a stored part, no endpoint yet, so PLANNED wiring). Surfaces here: for the focused requirement, the matching `fit` evidence, the datafact behind it, related `gaps`, and the dossier paragraphs that motivated the requirement. Example: focus the "acquisition economics" requirement -> rail shows the LTV-vs-CPA datafact, the open Web3 gap, and the Duelbits company dossier paragraph on crypto-native player quality.

---

#### Live Support (Motesstod)

- **Status:** PLANNED. No screen, no backend. Coach nav key **`c-motesstod`** (group "Moten") renders `ComingSoon`; sibling keys `c-motesforberedelse`, `c-sammanfattningar`, `c-uppfoljning` also `ComingSoon`. The contract parts nearest in spirit - `liveLog`, `prep` - exist only as absent-seeded envelopes with no producer and are not served by `GET /api/case/:id`. Design against the invented shape below; do not assume it populates.
- **Purpose:** Help the coach during and after a meeting - with consent, capture and summarize the session, offer follow-up questions, similar past cases and next steps, then document what was agreed and update the Case Record.
- **Page / screen structure:**
  - **Consent gate (blocking first panel)** - explicit record-consent toggle, retention window, who can see the transcript. Nothing captures until this is set.
  - **Left: live session pane** - running transcript with speaker turns; a "rewritten summary, never verbatim" banner (matches the `liveLog` intent).
  - **Center: coach assistant** - live suggestion cards: follow-up questions to ask, a relevant tip, similar previous cases, links and tools, suggested next steps.
  - **Right rail: crosslinking panel** into this jobseeker's case parts and the Coach Network.
  - **Post-meeting drawer** - agreed-actions list, "send these resources," and a one-click "update Case Record."
- **Key tools / sub-features:** consent-and-access control; live transcription; rewritten-summary generation; assistant suggestion cards; similar-past-cases lookup; auto-drafted meeting summary; resource-send; human-oversight banner (never replaces coach judgement).
- **CTAs:** Start recording (consent-gated) · End and summarize · Send resources to jobseeker · Update Case Record (writes agreed next steps back to the case).
- **Data (as-if-real, PLANNED - shaped to the `liveLog` contract):**
```json
{
  "liveLog": {
    "status": "ready",
    "data": {
      "qa": [
        { "id": "liveQA_31a", "question": "How do you tie acquisition to retention in practice?", "answer": "Summary form: Daniel described building predictive risk-scoring at MrGreen so a direct-action team reached players before they churned, lifting active lifespan from ~2.5 to ~3.5 months." }
      ],
      "topicLog": [
        { "ref": { "kind": "card", "id": "card_ltv" }, "at": "2026-07-02T10:14:00Z" }
      ]
    }
  },
  "agreedActions": [
    { "id": "action_1", "text": "Draft the Duelbits cover letter this week", "owner": "self", "due": "2026-07-05" }
  ],
  "consent": { "recording": true, "retentionDays": 30, "visibleTo": ["coach", "jobseeker"] }
}
```
- **Sample content:** Consent banner - "Daniel har samtyckt till inspelning. Sparas 30 dagar. Synligt for coach och deltagare." Assistant card - "Similar past case: another participant owned full-funnel acquisition and froze on the numbers question. What unblocked them was rehearsing one concrete story - here, Daniel's LTV-not-CPA budget rebuild. Suggest he lead with that." Post-meeting summary - "Agreed: finish the Duelbits cover letter this week; rehearse the retention-experiment story (killed the reactivation model at ~5% uplift, built predictive scoring instead) for round two."
- **Crosslinking (right rail):** During the meeting, focus follows what is being discussed; the rail surfaces the relevant `fit` evidence, open `gaps`, the dossier paragraph on the target company, and - via the Coach Network query - a coach with matching specialist background if the topic sits outside this coach's expertise.

---

#### Coach Network (Coachnatverk)

- **Status:** PLANNED. No screen, no backend. Coach nav group "Coachnatverk" - keys **`c-hitta-coach`**, `c-specialistkunskap`, `c-branschkunskap`, `c-second-opinion-n`, `c-coachprofiler` - all render `ComingSoon`. No coach-profile or competence collection exists in the store (only `jobs`, `jobSources`, `filterSet` are written today). Fully invented shape below.
- **Purpose:** Make HelloLilly's internal competence searchable so any coach can pull the whole organisation's expertise into a case that sits outside their own background - and suggest a second-opinion coach with the right domain.
- **Page / screen structure:**
  - **Top: competence search bar** - free-text plus filters (industry, target group, specialist skill).
  - **Left: matched-coach list** - ranked coach cards (name, specialism, target-group strengths, availability), each with a "why this coach for this case" line derived from the current jobseeker's `decodedRole` and `dossiers.niche`.
  - **Center: coach profile** - background, domains, sample cases, second-opinion availability.
  - **Right rail: crosslinking panel** anchoring the search to the open case.
- **Key tools / sub-features:** competence search; industry and target-group filters; ranked coach match; second-opinion request; coach profiles; case-anchored "why this coach" reasoning.
- **CTAs:** Request second opinion · Message coach · Attach to case (links the consulted coach to `case_<id>`).
- **Data (as-if-real, PLANNED):**
```json
{
  "query": { "caseId": "case_9f2a71c4", "need": "iGaming acquisition and BI", "targetGroup": "senior-career-change" },
  "matches": [
    {
      "coachId": "coach_44b1",
      "name": "Sara Lind",
      "specialisms": ["iGaming and gaming operators", "senior commercial roles", "BI and analytics"],
      "targetGroups": ["career-change 45+"],
      "availability": "second-opinion open",
      "why": "Daniel's case is a senior iGaming acquisition profile with a BI backbone; Sara has placed commercial leaders in gaming and can pressure-test the LTV story.",
      "score": 0.91
    }
  ]
}
```
- **Sample content:** Search - "iGaming acquisition, senior commercial, BI." Result card - "Sara Lind - strong in gaming operators and BI. Why: Daniel's profile is a full-funnel iGaming acquisition lead with 15+ years operator-side and BI built from scratch at ComeOn; Sara can second-opinion whether the Web3 gap is a real blocker for crypto-casino roles or a bridgeable one." Second-opinion note - "Assigned coach has limited gaming background; pulling Sara in for one review, not a handover."
- **Crosslinking (right rail):** Anchored to the open case's `decodedRole` and `dossiers.niche` (the iGaming vertical context). Surfaces: coaches whose specialisms match the decoded requirements, and - reciprocally - the case's open `gaps` so the second-opinion coach sees exactly where help is needed (here, the Web3/token-partnership gap).

---

#### Coach Review (Coachgranskning)

- **Status:** PLANNED (with a partial real feed). No dedicated review backend. Coach nav group "Granskningar" - keys **`c-cv-granskning`**, `c-brev-granskning`, `c-ansoknings-granskning`, `c-linkedin-granskning`, `c-bild-granskning`, `c-second-opinion-g` - all render `ComingSoon`; overview key `c-vantande-granskningar` ("Vantande granskningar") also `ComingSoon`. Partial real feed available to seed a review: `GET /api/case/:id` gives the artifacts to review - `cvDraft`, `coverLetter`, `fit`, `gaps`. The contract part `postMortem` exists as an absent stub but has no producer and is not served. The review/comment layer itself (multiple coaches commenting) is invented below.
- **Purpose:** Let several coaches give supportive, constructive feedback on a CV, cover letter, LinkedIn profile, image, application or strategy - more perspectives without forcing the jobseeker to restart with a new contact.
- **Page / screen structure:**
  - **Left: the artifact** - the CV (`cvDraft.sections`) or cover letter (`coverLetter.paragraphs`) rendered read-only with anchor points per section/paragraph.
  - **Center: review thread** - per-anchor comments from each reviewing coach, tagged supportive / suggestion / specialist-flag.
  - **Right: reviewers panel** - who has been asked, who has responded, plus a "request another perspective" that reaches into the Coach Network.
  - **Right rail (shared): crosslinking** into the case parts the comment refers to.
- **Key tools / sub-features:** artifact anchors; multi-coach comment threads; comment-type tags; unsupported-claim flags surfaced straight from `coverLetter.unsupported_by_cv`; request-more-reviewers; resolve/accept a suggestion.
- **CTAs:** Request review · Add comment · Flag unsupported claim · Accept suggestion (routes an accepted change back into the artifact) · Ask another coach.
- **Data (real to review + invented review layer):**
```json
{
  "artifact": { "kind": "coverLetter", "caseId": "case_9f2a71c4" },
  "servedFrom": "GET /api/case/case_9f2a71c4  ->  coverLetter",
  "coverLetter": {
    "paragraphs": [
      "You want a first acquisition hire who can own the number in a start-up crypto casino, not manage an agency to hit it. I have done exactly that from zero - I founded Coinhero, a crypto casino spanning casino, sportsbook and crypto, and built the strategy, licensing, brand and product myself."
    ],
    "unsupported_by_cv": ["Specific FTD figures for Coinhero"]
  },
  "reviews": [
    { "id": "review_7", "coachId": "coach_44b1", "anchor": { "kind": "paragraph", "index": 0 }, "type": "suggestion", "body": "Strong open. Add one number he can defend - the ~10-20% LTV lift at MrGreen - so 'own the number' lands with evidence." },
    { "id": "review_8", "coachId": "coach_09c", "anchor": { "kind": "unsupported_by_cv", "index": 0 }, "type": "specialist-flag", "body": "Do not add Coinhero FTD figures - flagged as unsupported. Keep the founder framing, drop the number." }
  ]
}
```
- **Sample content:** Reviewer 1 (supportive) - "Opening is direct and honest - it names owning the number without buzzwords. Good." Reviewer 2 (suggestion) - "Bridge the Web3 gap explicitly rather than hoping it passes: one line that Coinhero founder experience is the honest limit reads stronger than silence." Unsupported-claim flag (straight from `unsupported_by_cv`) - "Specific Coinhero FTD figures are not in the CV - remove or mark for the candidate to confirm before sending."
- **Crosslinking (right rail):** A comment on the "own the number" paragraph surfaces the supporting `fit` evidence rows and the underlying datafacts, so a reviewing coach can check a claim against real evidence in one click. Flags on `unsupported_by_cv` items crosslink to the datafact pool to show nothing backs them.

---

#### Knowledge Hub (Kunskapshubb)

- **Status:** PLANNED. No screen, no backend. Coach nav group "Kunskap" - keys **`c-kunskapshubb`**, `c-mallar`, `c-guider`, `c-presentationer`, `c-videos`, `c-best-practice`, `c-interna-tips` - all render `ComingSoon`. This is the coach-side twin of the jobseeker Shared library (`library.jsx`), which is itself a hardcoded 6-item fixture with no resources collection or endpoint. No resource store exists; the shape below is invented. (The generic store `collections` region could back a `resources` collection later, but none is written today.)
- **Purpose:** One place for templates, links, presentations, guides, videos, documents, FAQs, coach experience and user tips - with a per-resource assistant that summarizes and explains so nobody has to read or watch everything.
- **Page / screen structure:**
  - **Top: search and filter chips** - type (template, guide, video, presentation, FAQ, tip), domain, target group. (In the jobseeker twin these chips are decorative; here they should filter for real.)
  - **Left: resource grid** - cards with type icon, title, contributor, approval state (suggested / approved).
  - **Center: resource detail** - the material plus an assistant panel: "summarize this," "explain for a beginner," "how do I use this for my case."
  - **Right: contribution and moderation rail** - jobseekers suggest, coaches approve and organize.
- **Key tools / sub-features:** typed resource cards; real filtering; per-resource summarize/explain assistant; suggest-a-resource (jobseeker) and approve/organize (coach) moderation; usage-in-my-case helper.
- **CTAs:** Open resource · Ask the assistant · Suggest resource · Approve and file (coach).
- **Data (as-if-real, PLANNED - would live in a `resources` collection via `putRecord`):**
```json
{
  "id": "resource_2f10",
  "type": "template",
  "title": "Acquisition budget-by-LTV planner",
  "domain": "iGaming growth",
  "targetGroup": "senior commercial",
  "contributor": { "role": "jobseeker", "name": "Daniel Oskarsson" },
  "status": "approved",
  "assist": { "summary": "A worksheet for allocating acquisition budget by lifetime value instead of cost-per-acquisition, with fields for ROI per channel, timeslot and spot.", "explainForBeginner": "It helps you spend where the good long-term players come from, not just where signups are cheapest." },
  "body": "Sections: channel, blended CPA, LTV:CAC, quality signal, reallocation note."
}
```
- **Sample content:** Resource card - "Template: Budget-by-LTV planner. Contributed by Daniel Oskarsson (approved). Assistant summary: allocate spend by lifetime value, not CPA - the same shift that lowered blended CPA while raising player quality at MrGreen and ComeOn." Assistant answer to "how do I use this for my case" - "Fill the channel rows with your own numbers, then in an interview you can defend a real reallocation decision instead of a generic 'we optimised the funnel.'" Moderation note - "Suggested by a participant, filed under iGaming growth by the coach."
- **Crosslinking (right rail):** From a resource, crosslink to the cases and `gaps` it can help close - e.g. the budget-by-LTV planner links to any case whose `decodedRole` requires acquisition-economics ownership, and to the participant's `fit` row that this template strengthens.

---

#### Feedback Loop (Aterkoppling)

- **Status:** PLANNED. No screen, no backend. Coach nav group "Insikter" - keys **`c-feedback`**, `c-vanliga-hinder`, `c-vad-fungerar`, `c-aktivitetsmonster`, `c-utfall`, `c-forbattringsforslag` - all render `ComingSoon`. No feedback, poll or aggregation collection exists in the store. This is the near-term, coach-facing feeder into the (separately specced) Learning-layer tools; the aggregate shape below is invented. Any per-case QA signals it could eventually draw on (part-status transitions, `gaps` recurrence) are real but not yet collected anywhere.
- **Purpose:** Help HelloLilly learn from users and coaches - polls, questions, suggestions, upvoted resources, improvement ideas, post-interview and post-seminar feedback - so the system develops from real needs, and when many people get stuck at the same point the organisation can see it and fix it.
- **Page / screen structure:**
  - **Top: signal summary** - open polls, new suggestions, top-upvoted resources, and "shared sticking points" (where many jobseekers stall).
  - **Left: feedback stream** - individual items: poll responses, comments, improvement ideas, post-interview notes, tagged by stage.
  - **Center: aggregated pattern view** - "N participants stuck at the same step," ranked, each expandable to the underlying items.
  - **Right: action panel** - route a pattern to the Knowledge Hub (add a resource) or to product (improvement idea).
- **Key tools / sub-features:** polls and surveys; suggestion and comment intake; resource upvotes; post-interview/seminar feedback capture; sticking-point aggregation; route-to-fix (Knowledge Hub or backlog).
- **CTAs:** Run poll · Submit improvement idea · Upvote resource · Route pattern to Knowledge Hub · Mark addressed.
- **Data (as-if-real, PLANNED):**
```json
{
  "period": "2026-Q2",
  "stickingPoints": [
    { "stage": "cover-letter", "count": 41, "note": "Participants freeze on the opening line; many default to mission-echoing openers.", "suggestedFix": { "kind": "resource", "id": "resource_open_line" } }
  ],
  "feedbackItems": [
    { "id": "fb_88", "from": { "role": "jobseeker", "name": "Daniel Oskarsson" }, "stage": "interview-practice", "type": "improvement-idea", "body": "Let me rehearse the same numbers question three times and compare my answers - one clean take is not enough to feel ready." }
  ],
  "topResources": [ { "id": "resource_2f10", "upvotes": 27 } ]
}
```
- **Sample content:** Sticking-point row - "41 participants stalled at the cover-letter opening this quarter. Common failure: mission-echoing openers. Suggested fix: promote the 'direct-open' template to the Knowledge Hub." Feedback item - "Daniel (interview practice): 'I want to rehearse the LTV-vs-CPA answer a few times and compare takes - one attempt does not tell me if I am ready.'" Top resource - "Budget-by-LTV planner, 27 upvotes." Action - "Route the cover-letter sticking point to the Knowledge Hub as a new guide."
- **Crosslinking (right rail):** An aggregated sticking-point crosslinks down to the individual cases and `gaps` behind it (so a coach can see the real examples), and across to the Knowledge Hub resource or improvement idea that would address it - the loop from a pattern to a concrete fix.

---

### F. Learning layer

The learning layer sits above every other surface in the product. It does not serve the individual jobseeker a next action - it is the org-level intelligence that turns thousands of real cases, coach interventions and outcomes into a compounding asset. Both tools here are **PLANNED**. Neither maps to any of the 13 built routes in `LL_ROUTES`, and both are explicitly deferred: the vision's build order places them in Phase four (Market and learning), and "the full Outcome Engine" is named under "What not to build first." No screen file, endpoint, submodule or case part exists for either today. They are cross-case and cross-user by nature, which means they read shapes that the current single-user in-memory store (`owner:'self'`, nothing survives process exit) cannot yet produce. The designer should render these "as if real" - a coach-facing and org-facing analytics surface, not a jobseeker tool - while knowing the wire, the persistence layer, and the cross-case `caseId` references they depend on (allowed by the addressing scheme but "unpopulated until A8") are all absent.

A framing note the designer should hold: the vision is emphatic that this layer is "not reducing people to statistics." The visual language should feel like accumulated craft knowledge and honest evidence, not a KPI cockpit. Daniel's own persona is the perfect stress test - a 17-year iGaming growth leader who killed a reactivation model when a controlled test showed only ~5% uplift. The learning layer should read the way he thinks: what actually moved the number, measured honestly, with the failures kept visible.

---

#### Knowledge Hive (Kunskapssystem)

- **Name (EN / SV):** Knowledge Hive (Kunskapssystem)

- **Status:** **PLANNED.** No mapping in the BUILT REALITY MAP. Do not confuse with the built **Shared library** (`library.jsx`, route `library`) - that is a flat 6-item resource list of learning materials for a single jobseeker. The Knowledge Hive is a different, org-level surface: it accumulates *what worked* across all coaches, cases and outcomes, not a shelf of documents. It has no screen file, no endpoint, and no case part. Its inputs are cross-case and cross-user, so it depends on a persistent data layer and populated cross-case `{kind, id, caseId}` references that do not exist yet (the store is 100% in-memory today; cross-case refs are "unpopulated until A8"). The nearest real fuel is the `postMortem` case part (contract-only, **NOT BUILT** - no producer writes it) plus the outcome/decision fields that would need to be recorded per case. Design against the invented shape below.

- **Purpose:** The long-term memory of HelloLilly - accumulates which advice, tools, contact paths and strategies actually lead to real progress, so the system gets smarter with every case instead of starting cold each time.

- **Page / screen structure:**
  - **Hero / posture bar** - a calm statement of scale ("Learning from 1,842 cases across 34 coaches"), not a dense metric wall. One headline insight surfaced, e.g. the highest-confidence pattern this month.
  - **Knowledge entries feed (main panel)** - the core. Each entry is a distilled pattern: a claim ("For senior growth roles, leading with a killed experiment out-converts leading with a scaled win"), an evidence count, a confidence band, and the coaches/cases it was drawn from. Filterable by target group, role family, and knowledge kind (advice / tool / contact-path / strategy).
  - **Provenance drawer** - opens on any entry to show the underlying cases (anonymised refs), the coach notes, and the outcomes that support or contradict it. Honest by construction: contradicting evidence is shown, never hidden.
  - **Contribute panel** - where a coach promotes a case learning or a resource into the Hive, with a required "what outcome supports this" field.
  - **Crosslinking right-rail** (see below).

- **Key tools / sub-features:**
  - Pattern distillation - clusters similar case learnings into a single durable entry with an evidence count.
  - Confidence banding - each entry carries high / emerging / contested, driven by how consistent the supporting outcomes are.
  - Contradiction surfacing - entries that outcomes are starting to argue against get flagged for coach review rather than silently decaying.
  - Contribution flow - coach-authored promotion of a case insight, gated on citing the outcome it rests on.
  - Search across the accumulated knowledge, scoped by target group and role family.

- **CTAs:**
  - Primary: **Open provenance** (see the cases and outcomes behind an entry).
  - Secondary: **Promote to Hive** (coach contributes a case learning), **Flag as contested** (mark an entry the evidence no longer supports).

- **Data (invented "as-if-real" shape - PLANNED):**
```json
{
  "hive": {
    "generatedAt": "2026-06-30T09:00:00Z",
    "scope": { "cases": 1842, "coaches": 34 },
    "entries": [
      {
        "id": "hiveEntry_7c1a4e02",
        "kind": "advice",
        "subject": "senior-growth",
        "claim": "For senior growth and marketing candidates, opening the fit story with a killed experiment converts better than opening with a scaled win.",
        "confidence": "high",
        "evidenceCount": 41,
        "supportingOutcomes": { "interviews": 29, "offers": 11 },
        "contradictingOutcomes": { "interviews": 3, "offers": 0 },
        "derivedFrom": [
          { "ref": { "kind": "case", "id": "case_9f22", "caseId": "case_9f22" }, "outcome": "offer" },
          { "ref": { "kind": "postMortem", "id": "postMortem_be31", "caseId": "case_9f22" }, "outcome": "offer" }
        ],
        "contributedBy": { "kind": "coach", "id": "coach_04" },
        "updatedAt": "2026-06-28T14:12:00Z"
      }
    ]
  }
}
```

- **Sample content (Daniel persona):**
  > **Entry hiveEntry_7c1a4e02 - Advice - Confidence: High (41 cases)**
  > For senior iGaming growth and marketing candidates, opening the fit story with a controlled experiment that was *killed* out-converts opening with a scaled win.
  >
  > **Provenance drawer, one supporting case:** Daniel Oskarsson, applying for Head of Acquisition at a start-up crypto casino. His interview prep led on the MrGreen retention "defibrillator" test - he ran a controlled reactivation treatment against a control group, saw only ~5% uplift, killed it, and built predictive risk-scoring models in Alteryx instead, which moved active player lifespan from ~2.5 to ~3.5 months. Coach note: "Leading with the kill, not the 400% CRM growth, is what made the interviewer lean in - it reads as judgement, not a highlight reel." Outcome: advanced to final round.
  >
  > **Contradicting evidence (3 cases):** for junior candidates the same opener landed flat - reviewers wanted the scaled result first. The entry is scoped to senior growth roles for that reason.

- **Crosslinking (right-rail):** From a Hive entry, the rail surfaces (a) the specific case learnings and `postMortem` weakness items it was distilled from, (b) related library resources tagged to the same subject, and (c) sibling Hive entries for the same role family or target group. Rendered via the derived `getCrosslinks({ caseId, focus:{kind:'hiveEntry', id} })` query pattern - computed, never a stored part - so a coach reading the "kill-the-experiment" advice can jump straight to the three cases that prove it and the two that qualify it.

---

#### Outcome Engine (Resultatmotor)

- **Name (EN / SV):** Outcome Engine (Resultatmotor)

- **Status:** **PLANNED.** No mapping in the BUILT REALITY MAP, and explicitly the most deferred item in the vision - "the full Outcome Engine" is listed first under "What not to build first." No screen file, no endpoint, no case part. It is the analytics layer that links actions to results across the whole population of cases, so it depends on outcome data being recorded per case (which case did what, with which support, and what happened - interview, offer, hire, or nothing). That recording does not exist today: `meta.status` has a lifecycle enum (`intake` -> `done`) but no terminal-outcome field, no activity/timeline collection exists (the built Activity tracker is a hardcoded fixture), and nothing is persisted across process exit. Design against the invented shape below; treat it as a coach/org-manager surface, not a jobseeker one.

- **Purpose:** Connects support to results across all cases - which activities lead to interviews, which coach interventions create momentum, which tools get used, which paths lead to jobs - so the organisation learns systematically from work it already does every day.

- **Page / screen structure:**
  - **Outcome overview (main panel, top)** - the honest scoreboard: for a chosen cohort, what share reached interview / offer / hire, and how that compares to baseline. Presented as an evidence read, not a vanity dashboard.
  - **Driver panel** - the heart of the engine. Ranks activities and interventions by their measured association with reaching the next stage (e.g. "cases where the retention story was rehearsed in the Interview trainer reached final round more often"). Each driver carries an effect read and an honest sample size, so weak signals are visibly weak.
  - **Cohort segmenter** - slices the population by target group, role family, seniority, or coach, so "which support helps which people" is answerable, not averaged into mush.
  - **Tool usage strip** - which tools (CV builder, Match analysis, Interview trainer, Research helper) are actually used, and whether use correlates with progress.
  - **Advice ledger** - flags which pieces of advice should be repeated (consistent positive outcomes) and which should be improved (flat or negative), feeding directly back into the Knowledge Hive.
  - **Crosslinking right-rail** (see below).

- **Key tools / sub-features:**
  - Stage-conversion tracking per cohort (application -> interview -> offer -> hire), with baseline comparison.
  - Driver ranking - associates activities and coach interventions with stage progression, always paired with sample size so thin signals read as thin.
  - Cohort segmentation by target group, role family, seniority and coach.
  - Tool-usage-vs-outcome correlation.
  - Advice ledger that promotes "repeat" and "improve" verdicts back to the Knowledge Hive.
  - Honesty guardrails on the read itself - associations are labelled association, not causation, and low-n segments are shown with wide uncertainty rather than a confident number.

- **CTAs:**
  - Primary: **Open cohort** (drill into a jobseeker group's outcomes and drivers).
  - Secondary: **Send to Hive** (promote a driver finding into durable knowledge), **Flag advice to improve** (mark a piece of guidance the outcomes do not support).

- **Data (invented "as-if-real" shape - PLANNED):**
```json
{
  "outcomeEngine": {
    "window": { "from": "2026-01-01", "to": "2026-06-30" },
    "cohort": { "key": "senior-igaming-growth", "label": "Senior iGaming growth and marketing", "n": 58 },
    "funnel": {
      "applied": 58,
      "interview": 31,
      "offer": 9,
      "hire": 6,
      "baselineInterviewRate": 0.42,
      "cohortInterviewRate": 0.53
    },
    "drivers": [
      {
        "id": "driver_a1",
        "activity": "rehearsed-signature-story-in-interview-trainer",
        "stage": "interview->final",
        "effectRead": "positive",
        "supportN": 22,
        "note": "Cases that rehearsed a controlled-experiment story reached final round more often. Association, not proof."
      },
      {
        "id": "driver_a2",
        "activity": "opened-cover-letter-with-employer-need",
        "stage": "applied->interview",
        "effectRead": "positive",
        "supportN": 34
      },
      {
        "id": "driver_a3",
        "activity": "listed-tools-not-in-cv",
        "stage": "applied->interview",
        "effectRead": "negative",
        "supportN": 17,
        "note": "Cases that claimed tools unsupported by the CV converted worse. Feeds the advice ledger."
      }
    ],
    "adviceLedger": [
      { "adviceRef": { "kind": "hiveEntry", "id": "hiveEntry_7c1a4e02" }, "verdict": "repeat" },
      { "adviceRef": { "kind": "hiveEntry", "id": "hiveEntry_3d90" }, "verdict": "improve" }
    ]
  }
}
```

- **Sample content (Daniel persona):**
  > **Cohort: Senior iGaming growth and marketing (n=58) - Jan to Jun 2026**
  > Interview rate 53% vs a 42% baseline. Offer 9, hire 6.
  >
  > **Top driver (positive, 22 cases):** cases that rehearsed a controlled-experiment story in the Interview trainer reached final round more often than cases that did not. Daniel Oskarsson sits in this cohort - his rehearsed story was the MrGreen reactivation test he killed at ~5% uplift before building predictive risk-scoring in Alteryx, which lifted active player lifespan from ~2.5 to ~3.5 months. His case advanced to a final round for a Head of Acquisition role at a start-up crypto casino. The engine labels this an association, not proof: 22 cases is a real signal but not a law.
  >
  > **Negative driver (17 cases):** cases whose cover letter or CV claimed tools not actually supported by the candidate's CV converted worse at the application stage. This maps directly to the `coverLetter.unsupported_by_cv` flag - Daniel's own letter flagged a Web3/token-partnership claim as unsupported and dropped it, keeping the honest limit (real crypto-casino founder experience at Coinhero) instead. The advice ledger verdict: **repeat** "flag and drop unsupported claims."
  >
  > **Advice to improve:** a generic "always open with your biggest number" tip shows a flat outcome for this cohort and is flagged for revision - consistent with the Hive finding that senior candidates convert better opening with a judgement story than a headline metric.

- **Crosslinking (right-rail):** From a driver or a cohort, the rail surfaces (a) the individual cases behind the number (anonymised refs) so a coach can inspect the real evidence, (b) the Knowledge Hive entries this driver supports or contradicts, and (c) the specific tools named in the driver (Interview trainer, CV builder) so the manager can trace usage. The advice ledger's "repeat / improve" verdicts crosslink straight into the corresponding `hiveEntry`, closing the loop between measured outcome and accumulated knowledge - the two tools are two faces of one system: the Outcome Engine measures what worked, the Knowledge Hive remembers it.

---

### G. Delivery surfaces

Where the whole system lives. This category is not "more tools" - it is the shell every other tool sits inside. Three surfaces: the calm home that shows one next action, the phone app that keeps the suite in the pocket, and the two cross-cutting pieces that every screen inherits - the crosslinking side-panel and the global navigation shell.

---

#### The hub / Command center (Startsida / Hubben)

**Status:** BUILT. Screen `src/screens/home.jsx`, route key `home` (in `LL_ROUTES`). Today it renders a mix: the job list is live (`useLiveJobSearch` -> `api/jobSearch.js`, direct-from-browser JobTech fetch), and everything else (score card, next-action card, tool cards, progress) is `strategyData.js` fixture + localStorage. **Bind to bind:** the score / next-action / tool-status cards should derive from `GET /api/case/:id` (case parts `meta`, `fit`, `gaps`, `decodedRole`) - not the current fixtures. The job-list block can keep its browser-direct feed or move to `POST /api/jobs/search` (`job-discovery`). Honest caveat: no `/api/case/:id` call exists in `src/` yet - the wire is what a future `useCase()` will carry; the shape below is what the endpoint already serves.

**Purpose:** A warm home that shows one clear next action and quiet progress, never a wall of tasks.

**Page / screen structure:**
- **Greeting band** (top): first-name greeting + one-line status read (from `meta.status` enum: `intake -> researching -> analyzing -> prep_ready -> live -> post -> done`).
- **The one next action** (hero card, single, large): the single most valuable thing to do now, derived from which case parts are `absent` / `pending` / `ready`. Exactly one at a time.
- **Progress strip** (calm, motivating): a horizontal render of case-part `status` envelopes (a part at `ready` = a filled segment). Literally a render of the status enum.
- **Tool entry points** (quiet grid): low-key cards for CV Builder, Cover Letter, Match Analysis, Interview Trainer, Job Search - each showing its case part's status, not a red badge count.
- **Live job list** (secondary panel): a few fresh matches from the browser-direct feed, each a one-tap into Job Search / Match Analysis.
- **Right-rail crosslinking panel** (shared shell): see the crosslinking surface below.

**Key tools / sub-features:** single-next-action selector (reads which parts are unfinished); progress render from status envelopes; per-tool status chips; a "pick up where you left off" resume from the most recently `pending`/`ready` part; conversational nudge line ("Your CV is ready - want the cover letter next?").

**CTAs:** primary - **the one next action button** (e.g. "Finish your CV" / "Slutfor ditt CV"). Secondary - "Open [tool]" quiet links; "See new jobs" / "Visa nya jobb".

**Data (real served shape - `GET /api/case/:id`):**
```json
{
  "ok": true,
  "case": {
    "meta": {
      "id": "case_9f2a3b71",
      "company": "Duelbits",
      "role": "Head of Acquisition",
      "status": "analyzing",
      "sourceInput": "LinkedIn 4429526797",
      "cvVersionRef": { "kind": "datafact", "id": "datafact_1a4c" },
      "owner": "self",
      "updatedAt": "2026-07-02T08:14:00Z"
    },
    "decodedRole": {
      "status": "ready",
      "data": {
        "narrative": "Beneath the ad this is a first-owner acquisition role for a crypto casino: own FTD and CPA end to end, and prove you can allocate budget by lifetime value rather than volume.",
        "requirements": [
          { "id": "decodedRequirement_7c1", "requirement": "Own full acquisition economics (CPA, FTD, LTV:CAC)", "weight": 5 }
        ]
      }
    },
    "fit":  { "status": "pending", "data": null },
    "gaps": { "status": "pending", "data": null },
    "cvDraft":     { "status": "ready", "data": { "language": "en", "sections": [] } },
    "coverLetter": { "status": "absent", "data": null }
  }
}
```
The hub reads only the envelope `status` of each part to build the progress strip and to pick the one next action - it does not need the full part bodies until the user opens a tool.

**Sample content:**
> **God morgon, Daniel.**
> Your role decode for **Head of Acquisition at Duelbits** is ready. Match analysis is running now.
>
> **Your one next step:** Finish your CV so the cover letter has something to pull from.
> [ Slutfor ditt CV ]
>
> Progress: Role decoded - done. CV - ready. Match analysis - in progress. Cover letter - not started.
>
> 2 new matching jobs in your target set (crypto casino acquisition, remote EU). [ Visa nya jobb ]

**Crosslinking (right-rail surfaces here):** for a hub in `analyzing` state, the panel surfaces: the Duelbits company research note being built, the two fresh crypto-casino acquisition ads, a coach with iGaming acquisition background, and one motivational note. When the next action is "Finish your CV", it swaps to CV-writing help (see the crosslinking surface for the exact query).

---

#### The phone app (Mobilappen)

**Status:** PLANNED. No screen, route, or backend in the BUILT REALITY MAP. The vision explicitly parks a "polished native mobile app" to a later phase ("a responsive web app is enough to start"), so design this as-if-real: the same 13-route web shell wrapped for the pocket, plus a push/reminder layer and offline-read cache that do not exist yet.

**Purpose:** Keep the whole suite in the pocket and quietly nudge the person at the right moment, for people who live more on a phone than at a desk.

**Page / screen structure:**
- **Bottom tab bar** (mobile nav shell): Home / Jobb / Analys / Ova (Interview) / Mer - a collapsed mapping of the desktop sidebar's real routes.
- **Home tab**: the hub, reflowed to a single column - greeting, the one next action, progress strip.
- **Notification center**: a chronological feed of reminders (new matching jobs, unfinished applications, scheduled coach calls, seminars).
- **Quick-capture**: voice-to-text answer for a fill-gap prompt on the go (writes back via the existing `POST /api/case/:id/gap/:gapId/answer`).
- **Offline read cache**: last-served case parts + saved jobs readable without signal.
- **Right-rail becomes a bottom sheet**: the crosslinking panel collapses to a swipe-up "Relevant now" sheet on mobile.

**Key tools / sub-features:** push reminders (new matches, applications that need finishing, coach calls, seminars, guidance sessions); voice fill-gap capture; offline read of the case; deep-links from a push straight into the relevant tool; biometric unlock.

**CTAs:** primary - **"Open [what the nudge is about]"** from a push (e.g. "Finish your Duelbits application"). Secondary - "Answer by voice" / "Svara med rost"; "Save this job" / "Spara jobbet".

**Data (as-if-real - a notification/reminder record the app would read; invented, no backend today):**
```json
{
  "notifications": [
    {
      "id": "notif_3d2e",
      "kind": "unfinished_application",
      "caseId": "case_9f2a3b71",
      "title": "Your cover letter for Duelbits is still open",
      "body": "The CV is done - the letter just needs a first pass.",
      "deepLink": "/letter?case=case_9f2a3b71",
      "createdAt": "2026-07-02T18:30:00Z",
      "read": false
    },
    {
      "id": "notif_5a91",
      "kind": "new_matches",
      "title": "2 new crypto-casino acquisition roles",
      "body": "Remote EU, first-owner acquisition - matches your target set.",
      "deepLink": "/jobbsok",
      "createdAt": "2026-07-02T07:05:00Z",
      "read": false
    },
    {
      "id": "notif_7c40",
      "kind": "coach_call",
      "title": "Coach call tomorrow 10:00",
      "body": "With Petra - bring the Duelbits match analysis.",
      "deepLink": "/calendar",
      "createdAt": "2026-07-01T16:00:00Z",
      "read": true
    }
  ]
}
```
A real build would need a `notifications` collection (none exists) plus a push service; the `deepLink` targets map to the real `LL_ROUTES` keys.

**Sample content:**
> **HelloLilly** - now
> Your cover letter for **Head of Acquisition at Duelbits** is still open. The CV is done, so the letter has your MrGreen and ComeOn history and the Coinhero founder line to pull from. Two minutes to a first pass.
> [ Open letter ]
>
> **HelloLilly** - 07:05
> 2 new crypto-casino acquisition roles, remote EU, matching your target set. [ See jobs ]

**Crosslinking (surfaced here):** a push is itself a crosslink - it connects a market signal or an unfinished part to the exact tool that acts on it. In-app, the bottom-sheet "Relevant now" mirrors the desktop right-rail for whatever tool the person opened from the notification.

---

#### Crosslinking side-panel (Sidopanel / Relevant nu)

**Status:** PLANNED as a wired feature, though a shell primitive exists. `grid.jsx` exports a `CrossColumn` component, but **no screen imports it** today, and the data behind it - `getCrosslinks({ caseId, focus:{kind,id} })` - is a **derived query, not a stored part and not a served endpoint** (no `/api/.../crosslinks` route). Design it as-if-real against the documented query shape; know that v0 is within-case, rule-based, and nothing populates cross-case (`caseId`) refs until a later phase.

**Purpose:** Put the right help next to the work, so the person never leaves the task to go find it - the layer that turns a set of tools into a living system.

**Page / screen structure:**
- **Right rail, persistent across every tool** (collapses to a bottom sheet on mobile).
- **"Relevant now" header** naming what it is reading (the current focus: a CV bullet, a decoded requirement, a gap, a dossier paragraph).
- **Grouped result blocks**, ordered by relevance score: Templates - Examples from similar roles - Short videos - Coach for this situation - Company / role research - Anonymised cases (consent only) - Discussions - Motivational notes.
- **Each result is a typed reference** (`{ kind, id }`) with a one-line reason it surfaced.
- **Empty / thin state**: honest ("Nothing strongly relevant yet - keep going") rather than padded filler.

**Key tools / sub-features:** context reader (detects the focused node and its `kind`); relevance scoring (score-ranked list); consent gate on anonymised cases; "why this surfaced" reason line; pin-a-result; the mix shifts by problem type (Execution -> templates/examples; Confidence -> exercises/coach; Relevance -> research/match).

**CTAs:** primary - **"Use this"** on a template/example (drops it into the active tool). Secondary - "Ask this coach" / "Fraga den har coachen"; "Save as question" (adds a `question` node - note: the write-back endpoint is NOT built); "Drill deeper" on a research paragraph (also not yet an endpoint).

**Data (documented query shape - `getCrosslinks`, derived, not served):**
```json
{
  "caseId": "case_9f2a3b71",
  "focus": { "kind": "decodedRequirement", "id": "decodedRequirement_7c1" },
  "results": [
    {
      "ref": { "kind": "datafact", "id": "datafact_1a4c" },
      "relevance": "Your MrGreen budget-by-LTV story is direct evidence for this requirement",
      "score": 0.94
    },
    {
      "ref": { "kind": "dossier", "id": "dossier_comp_duel" },
      "relevance": "Company research: how Duelbits acquires today",
      "score": 0.81
    },
    {
      "ref": { "kind": "card", "id": "card_ltv_talk" },
      "relevance": "Coach with iGaming acquisition background",
      "score": 0.72
    }
  ]
}
```
`getCrosslinks` returns `[{ ref:{kind,id,caseId?}, relevance, score? }]` and is a brokered/derived call - a designer binds to this shape, not to a stored `case.crosslinks` field (there is none).

**Sample content (focus = the CV bullet Daniel is writing about acquisition):**
> **Relevant nu** - you are describing acquisition budget allocation.
>
> **Template** - "Growth achievement, result-first" (coach-approved). [ Use this ]
> **Example from a similar role** - how a Head of Acquisition phrased an LTV:CAC win.
> **Your evidence** - Rebuilt acquisition spend around lifetime value at MrGreen and ComeOn, tracking ROI per spot, timeslot and channel. Cite this. [ Use this ]
> **Short video** - "How recruiters read a growth CV" (3 min).
> **Coach** - Petra has placed marketing leaders in iGaming. [ Fraga den har coachen ]
> **Honest note** - no Web3/token-partnership scaling here; keep the Coinhero founder line as the honest bridge, do not overclaim.

**Crosslinking (this IS the crosslinking surface):** it reads whatever node is focused in any tool and surfaces the situation-matched mix. On CV Builder it surfaces writing help + evidence datafacts; on Interview Trainer it surfaces role questions + company research + coaches who know the industry; on Match Analysis it surfaces the fit rows + the gap bridges. The mix is driven by the problem type behind the task, not by category.

---

#### Global navigation shell (Navigeringsram / App-skalet)

**Status:** BUILT (partly). The router + sidebar shell is real: `LL_ROUTES` defines 13 real routes (home, cv, activity, letter, interview, library, review, studio, coach, match, calendar, community, jobbsok). The sidebar renders ~25 jobseeker keys + ~40 `c-*` coach keys, but **every key not in those 13 renders a `ComingSoon` placeholder**. All UI strings are hardcoded Swedish (no i18n). The `coach` route is one of the 13 (a workspace, not a 14th surface). No `PageTemplate`/`ContentArea` from `grid.jsx` is used by any screen - every screen is bespoke JSX. **Bind to bind:** the shell needs no new endpoint; the per-item badges/state should later read the same `GET /api/case/:id` status envelopes.

**Purpose:** The persistent frame - top bar, sidebar, and route switcher - that holds every tool and lets the person move between them without losing context.

**Page / screen structure:**
- **Left sidebar** (grouped): tool groups (Foundation, Matching, Network, Market) with the 13 live routes active and the rest visibly present but marked "Coming soon".
- **Top bar**: current case context (company + role + `meta.status`), a case switcher, search, and profile.
- **Main content region**: the active screen (bespoke per tool).
- **Right rail slot**: reserved for the crosslinking panel (shared across screens).
- **Role-aware shell**: same shell for jobseeker vs coach; coach exposes the `c-*` groups (mostly `ComingSoon` today).

**Key tools / sub-features:** route registry (`LL_ROUTES`); case-context header (reads `meta`); case switcher (multiple `cases` in the store); `ComingSoon` placeholder for unbuilt routes (honest, not hidden); active-route highlighting; Swedish-only labels today (i18n is a later concern).

**CTAs:** primary - **route selection** (open a tool). Secondary - "Switch case" / "Byt arende"; "New application" / "Ny ansokan" (would `createCase`); global search.

**Data (real - `meta` drives the shell header; route table is code):**
```json
{
  "activeRoute": "match",
  "caseHeader": {
    "id": "case_9f2a3b71",
    "company": "Duelbits",
    "role": "Head of Acquisition",
    "status": "analyzing"
  },
  "routes": [
    { "key": "home", "label": "Startsida", "built": true },
    { "key": "cv", "label": "CV-byggare", "built": true },
    { "key": "match", "label": "Matchanalys", "built": true },
    { "key": "interview", "label": "Intervjutraning", "built": true },
    { "key": "jobbsok", "label": "Jobbsok", "built": true },
    { "key": "radar", "label": "Jobbradar", "built": false }
  ]
}
```
`built:false` items render the `ComingSoon` component; the header binds to the real `meta` object from `GET /api/case/:id`.

**Sample content (sidebar, jobseeker view):**
> **Daniel Oskarsson** - Head of Acquisition @ Duelbits - Analyserar
>
> **Grund:** CV-byggare - Personligt brev - Ansokningskoll - Framstegsstod - Arendevy - Kunskapshubb
> **Matchning:** Jobbsok - Matchanalys - Intervjutraning - Researchstod
> **Natverk:** LinkedIn-stod - Kontaktplan - Foretagslista *(Kommer snart)*
> **Marknad:** Jobbradar - Motesstod *(Kommer snart)*
>
> [ Byt arende ]  [ Ny ansokan ]

**Crosslinking (surfaced in the shell):** the shell hosts the right-rail slot and the case-context header, so crosslinking is always one glance away regardless of which tool is open. The case switcher is itself a crosslink axis - moving between Daniel's Duelbits, A5 Labs and BettingJobs cases re-scopes every tool and the right rail to the selected case.

---

### Education & Re-Skilling (Kompetenslyft) - PLANNED

> This whole area is **PLANNED**. Nothing in the BUILT REALITY MAP maps to it, and the `learningPlan` case part **does not exist** in the data model today (the DATA MODEL explicitly says "learningPlan - DOES NOT EXIST"). It is the fourth move in the candidate journey: Decode (A1) -> Analyse fit + name gaps (A2) -> Fill gaps from experience (A3 loop) -> when a gap **stays a gap** (no honest reframe or adjacent-proof covers it), this area turns that dead end into an action path. Everything below is designed "as if real" against an invented `learningPlan` shape, written by a planned `course-fit` submodule that reads `meta` / `decodedRole` / `gaps`. The designer should render it as a first-class surface, honest and demand-first, with the "apply now anyway" route always on the table.

---

#### Surface: Close this gap with learning (EN) / Stäng luckan med kompetens (SV)

**Status:** PLANNED. No built screen, no route key in `LL_ROUTES`, no endpoint. When built, it binds to a planned `course-fit` submodule (cloned from the `decoder` scaffold) writing a new enveloped case part `learningPlan`, served by a planned `GET /api/case/:id/learning-plan` (or folded into `GET /api/case/:id`). It is **reached from two existing surfaces**: the Matchanalys / Application Check screen (`match.jsx`, which today renders the `fit`/`gaps` shapes from `gap-analyzer`) and the A3 gap-fill loop (`POST /api/case/:id/gap/:gapId/answer`) at the moment an answer returns `outcome:'stays_gap'`. Design it against the invented shape below; the wire does not exist yet.

**Purpose:** For one honest, unbridgeable gap, tell the person whether a course actually closes it, which course, whether it is worth it, and - loudly - whether they should just apply now anyway.

**Page / screen structure (main panels):**

1. **Gap header (the thing we are closing).** Restates the single unbridgeable requirement in plain terms: the requirement text from `decodedRole`, the `what`/`why` from the `gaps` part, its weight, and a one-line "why experience could not bridge it" (the honest provenance from the A3 loop). This is the anchor - the whole screen is scoped to one gap, not a catalogue.

2. **The fork (top, unmissable): Apply now anyway vs Retrain.** The evidence forces this to be the visual centre, not a footnote. Two side-by-side cards:
   - **Apply now anyway (fast, lower fit)** - fit % as-is, the honest bridge line to use in the application, expected time-to-outcome measured in weeks.
   - **Retrain (slow, higher fit)** - fit % after the course, the honest ramp time measured in months/years, the demand caveat. For a senior candidate this card must never be pre-selected or styled as "recommended" by default; the recommendation comes from the data, and for Daniel it points to "apply now."

3. **Recommended pathways (1-3, never a catalogue).** Below the fork, the ranked `learningPlan` recommendations. Each is a row/card carrying: `recommendation` kind (`course` | `validate` | `reframe-instead` | `apply-anyway`), course + provider, **expected outcome + honest timeline**, **demand level**, and the **validering shortcut** ("your experience may already cover this - get it recognised instead of sitting the course"). Empty state when the honest answer is "no course is worth it here" - that is a valid, first-class result, not a failure.

4. **Evidence + honesty strip.** A always-visible note that pathway numbers are population outcomes with lag (YH employment rate, expected 2y+ effect, near-zero short-run), and that this augments the coach, it does not replace them. No pathway renders without a demand signal behind it.

5. **Crosslinking right-rail** (see Crosslinking below).

**Key tools / sub-features (the six, as panels/actions within this screen):**

- **1. Course-Fit Evaluator (core).** Purpose: "I have an unbridgeable gap - do I need a course, and which one?" Shows: the ranked 1-3 pathways scoped to *this* gap and *this* target role, each with the projected fit lift if completed. It ranks the few courses that actually close the decisive gap - never a browsable list. Drives the "Recommended pathways" panel.
- **2. Skills-Gap -> Skills mapper (underpins the rest).** Purpose: "what exactly am I missing, in real terms?" Shows: the vague requirement re-expressed as named skills on an ESCO/O*NET frame (e.g. "programmatic media buying", "DSP campaign setup", "attribution modelling"), with a tick against the ones Daniel's datafacts already prove and a cross against the one that stays open. Turns "you are missing X" into "you are missing this one skill inside X."
- **3. Demand Signal (gate).** Purpose: "is this worth retraining for?" Shows: local/role vacancy volume and whether the target sits on a bottleneck-occupation (bristyrke) list. This is a **gate**: no pathway is recommended without a demand signal behind it. Reuses the existing job-fetch infra (the week-22 LinkedIn/JobTech pipeline) plus an occupation-outlook feed.
- **4. Validering check.** Purpose: "do I even need the course, or can my experience be recognised?" Shows: a flag on any skill where prior-learning recognition could shorten or skip the programme, with the recognition route. Runs **before** any full-course recommendation - the point is to avoid redundant training a senior person does not need.
- **5. Pathway outcomes + honest timeline.** Purpose: "will this pay off, and when?" Shows: the route's hard outcome evidence (e.g. YH ~81-90% employed one year out on a good course-job match; labour-market training shorter and better aligned) and an **honest ramp** - effects appear at 2y+, near-zero short-run - explicitly contrasted against the "apply now" weeks-not-years timeline. This panel is what makes the fork honest.
- **6. Blended / low-friction mode.** Purpose: "I am not comfortable with digital systems / forms." Shows: a spoken/guided walkthrough of the same flow plus a one-tap coach hand-off, so the education path is not gated by digital literacy. A mode toggle, not a separate screen. (For Daniel this is off - he builds AI tooling by hand - but it must exist so the area is not digital-first for everyone.)

**CTAs (primary actions):**
- **"Apply now anyway"** (primary for a strong-fit senior like Daniel) -> returns to the application flow with the honest bridge line pre-filled.
- **"Recognise this instead"** (validering) -> opens the recognition-route detail for the flagged skill.
- **"See this pathway"** -> expands a single recommendation (provider, outcome, timeline, demand).
- **"Talk to a coach about this"** -> coach hand-off (also the low-friction fallback).
- Secondary: **"Not worth it - mark this gap accepted"** (dismiss retraining honestly and keep the gap on record).

**Data (invented "as-if-real" shape - `learningPlan` written by the planned `course-fit` submodule):**

The submodule `reads: ['meta','decodedRole','gaps']` and `writes: ['learningPlan']`. Following the case contract, `learningPlan` is an enveloped part `{status, data, updatedAt}` with `data` shaped:

```json
{
  "gapRef": { "kind": "gap", "id": "gap_9c1f4a2b" },
  "requirementRef": { "kind": "decodedRequirement", "id": "decodedRequirement_7e33a1" },
  "skillsFrame": {
    "source": "ESCO",
    "skills": [
      { "label": "programmatic media buying", "escoId": "esco:0a1b...", "status": "missing" },
      { "label": "DSP campaign setup and optimisation", "escoId": "esco:0a1c...", "status": "missing" },
      { "label": "attribution modelling", "escoId": "esco:0a1d...", "status": "match", "evidenceRef": { "kind": "datafact", "id": "datafact_bi01" } }
    ]
  },
  "demandSignal": {
    "level": "moderate",
    "vacancyCount": 41,
    "bottleneckOccupation": false,
    "region": "Stockholm / remote-EU",
    "source": "jobtech + occupation-outlook",
    "asOf": "2026-06-30"
  },
  "fork": {
    "applyNow":  { "fitNow": 82, "timeToOutcome": "2-4 weeks", "bridgeLine": "..." },
    "retrain":   { "fitAfter": 90, "rampTime": "9-18 months to a hired outcome; measurable pay-off at 2y+", "demandCaveat": "moderate demand only - not a bottleneck occupation" }
  },
  "recommendations": [
    {
      "id": "learningPlanItem_01",
      "gapRef": { "kind": "gap", "id": "gap_9c1f4a2b" },
      "recommendation": "validate",
      "course": null,
      "provider": "MYH / validering route",
      "expectedOutcome": "prior-learning recognition may cover the attribution and BI portions - shortens or removes any need for a full course",
      "rampTime": "weeks (recognition, not training)",
      "demandLevel": "moderate",
      "evidenceNote": "17y full-funnel + BI built from scratch (Tableau/Alteryx) already proves 2 of 3 named skills; only hands-on DSP/programmatic buying is genuinely missing",
      "alternatives": ["apply-anyway", "course"]
    },
    {
      "id": "learningPlanItem_02",
      "gapRef": { "kind": "gap", "id": "gap_9c1f4a2b" },
      "recommendation": "course",
      "course": "Programmatic & DSP media buying (short vocational / labour-market aligned)",
      "provider": "YH-aligned short course / Arbetsformedlingen labour-market training",
      "expectedOutcome": "closes the one hands-on DSP-execution skill; good course-job match cohorts ~81-90% employed one year out",
      "rampTime": "3-5 months part-time; hiring effect measurable at 2y+, near-zero short-run",
      "demandLevel": "moderate",
      "evidenceNote": "only recommended because a demand signal exists (41 open roles name programmatic); NOT a bottleneck occupation, so weigh against apply-now",
      "alternatives": ["apply-anyway", "validate"]
    }
  ],
  "headline": "apply-anyway",
  "honestNote": "You are a strong fit already (82%). The one true gap is hands-on programmatic/DSP execution - one skill inside 'paid media at scale', not the whole thing. Recommendation: apply now and, if you want the last 8 points, validate first and only sit a short course if validation does not cover it. A full retrain is not your best move here."
}
```

Notes on shape: `recommendation` enum is `'course' | 'validate' | 'reframe-instead' | 'apply-anyway'`; every item **must** carry `evidenceNote` (the honesty guardrail - why this gap, why this demand, why this evidence) and `alternatives` including `apply-anyway`; `headline` is the plan-level fork verdict so the UI can pre-weight the fork honestly (here: apply-anyway, never retrain-by-default). Write-backs the screen would need but which **do not exist yet**: accept/dismiss a pathway (mirrors the `postMortem` decision pattern), and "mark gap accepted" (would flip the source `gap`). Both PLANNED.

**Sample content (Daniel Oskarsson - honest reskilling case):**

- **Target role / gap context.** Head of Acquisition, crypto casino (BettingJobs confidential client, LinkedIn 4427319803). Decoded requirement that stayed a gap after the A3 loop: *"Hands-on programmatic / DSP media buying at scale (self-serve DSPs, real-time bidding setup)."*
- **Gap header.** "Requirement (weight 3): run programmatic/DSP paid media directly, not via an agency. Why it stays a gap: your 17 years own the full funnel and the LTV-vs-CPA budget model, but the evidence shows agency-and-TV-led buying and BI attribution - not hands-on DSP execution. No reframe covers sitting in the DSP itself."
- **Skills-Gap -> Skills mapper.** "Paid media at scale" breaks into three named skills: **attribution modelling** (match - proven by BI built from scratch at ComeOn with Tableau and Alteryx, ROI tracked per spot/timeslot/channel), **channel-mix allocation by LTV** (match - rebuilt budget allocation around lifetime value at MrGreen/ComeOn), **hands-on DSP campaign setup** (missing - the one genuinely open skill). So the honest gap is one skill inside three, not "you cannot do paid media."
- **Demand Signal.** Moderate: 41 open acquisition roles in the target set name programmatic/DSP; the occupation is not on a bottleneck list. Verdict shown plainly: "demand exists, but this is not a shortage occupation - that alone argues against a slow retrain."
- **The fork.** *Apply now anyway (fast):* fit 82%, outcome in 2-4 weeks, honest bridge line - "I have owned full acquisition funnels for 17 years and allocate budget by lifetime value, not CPA; hands-on DSP execution is the one area I would ramp on the job." *Retrain (slow):* fit ~90% after a short programmatic course, but 9-18 months to a hired outcome and pay-off measurable only at 2y+, on moderate (not bottleneck) demand. The screen's headline verdict: **apply now anyway.**
- **Validering check.** Flagged: "Your attribution and BI work (Tableau, Alteryx, ROI per channel) likely satisfies the analytics portion of any programmatic course through prior-learning recognition. Get that recognised before enrolling - you would only need the hands-on DSP module, if anything."
- **Pathway outcomes + honest timeline (if he did retrain).** "A short YH-aligned or Arbetsförmedlingen labour-market programmatic course: good course-job-match cohorts run ~81-90% employed one year out, but the hiring effect for someone already senior appears at 2y+ and is near-zero short-run. For you this is a top-up skill, not a career pivot - which is exactly why the fast route wins."
- **Honest note (plan headline).** "You are a strong fit at 82%. The real gap is one execution skill - hands-on DSP buying - not paid media as a whole. Apply now, offer to ramp on the DSP on the job, and validate your analytics experience rather than sit a redundant course. A full retrain is not your best move here."

This obeys the persona honesty rules: ~200 (never 250+), MrGreen framed as founding team not CPO, Tableau/Alteryx/GA/BI only (no SQL/Mixpanel/etc.), no Web3/token-scaling claim, no Reddit/Discord/community claim, hyphens only, no banned buzzwords - and it leads with "apply now anyway" because retraining is honestly the wrong move for a senior candidate with a single adjacent-skill gap.

**Crosslinking (right-rail - what the side-panel surfaces here):**

Per the vision's central crosslinking idea, and consistent with the DATA MODEL's `getCrosslinks({caseId, focus:{kind,id}})` derived query (a computed query, never a stored part; PLANNED as an endpoint). Focus for this screen = the current `gap` / `learningPlan` item. The rail surfaces:
- **Coaches with relevant field knowledge** - a growth/acquisition or martech coach for this exact gap; primary "augments the coach" hand-off.
- **Peers who took the same path** - people who validated prior learning or sat the programmatic course, and what happened next.
- **Course reviews** - honest reviews of the 1-3 recommended pathways (outcome, real duration, whether it was worth it).
- **The person's Company / Job list** - the target roles that named this skill (the BettingJobs, Duelbits, A5 Labs / QuintAce acquisition roles), so the demand is concrete and next to the decision, not abstract.
- **Back-links into the case** - the source `gap`, the `decodedRole` requirement, and the datafacts that already proved the adjacent skills - so the person can see exactly what they have vs the one thing they lack.

Help appears next to the decision, and the rail deliberately keeps the coach one tap away - this area feeds the coach conversation rather than replacing it.

---

## Section 4 - Data model reference (real + conceptual)

*Real shapes are what BUILT surfaces bind to. Use the same conventions for the invented shapes in Section 3.*

### REAL DATA MODEL — HelloLilly (binding-reference for designers)

Sourced from `docs/DATA_CONTRACT.md` (v0.3) + the store/skeleton/API sections of `docs/PROJECT_INVENTORY.md` (2026-07-02). "CONTRACT" = defined in the data contract. "CODE" = confirmed present in the case factory / store / API code. **UNVERIFIED / NOT BUILT** flags anything a designer would otherwise assume exists.

> **Reality gate before you bind anything.** No frontend surface reads any of these shapes today. `PROJECT_INVENTORY` seam A confirms: **no `useCase()` exists, no `/api/...` call exists anywhere in `src/`.** Every screen renders `strategyData.js` fixtures / localStorage / browser-direct job APIs. The shapes below are what the *backend produces and the API serves* — the thing a future `useCase()` will bind to. Bind BUILT surfaces to these shapes knowing the wire between them is not yet built.

---

#### 1. The case object — top level

`meta` is a plain object. **Every other part is a status envelope**, not the raw data.

##### Status envelope (wraps every part except `meta`) — CODE (`contract/case.cjs`)
```
{ status: 'absent' | 'pending' | 'ready' | 'failed',   // closed enum
  data:   <the part, or null>,
  error:  <reason string, present ONLY when status === 'failed'>,
  updatedAt: <timestamp> }
```
- `absent` not started · `pending` a submodule is producing it · `ready` usable · `failed` errored (`error` says why).
- The frontend loading/empty/error scaffolding maps 1:1 to this enum. A progress strip is literally a render of parts' `status`.
- `createCase` initializes **every** enveloped part to `envelope('absent')` with `data: null`.

##### meta — plain object (NOT enveloped) — CODE
```
{ id, company, role, round, interviewDate, interviewers, format,
  sourceInput,                       // the ad / recruiter mail / company name
  cvVersionRef: { kind:'datafact', id },   // reference, never a copy
  owner: 'self',                     // single-user today; field exists so multi-user is additive
  status: 'intake'|'researching'|'analyzing'|'prep_ready'|'live'|'post'|'done',  // default 'intake'
  createdAt, updatedAt }
```

##### The enveloped parts that EXIST in code (`PARTS` in `contract/case.cjs`)
`dossiers · decodedRole · fit · gaps · cvDraft · coverLetter · prep · cards · liveLog · postMortem`

**Build status of each part (what actually populates it):**

| Part | Envelope exists (factory) | A producer writes it today | Notes |
|---|---|---|---|
| dossiers | yes | yes — `researcher` | real (Perplexity+LLM) |
| decodedRole | yes | yes — `decoder` | real |
| fit | yes | yes — `gap-analyzer`; mutated by fill-gap | real |
| gaps | yes | yes — `gap-analyzer` | real |
| cvDraft | yes | yes — `cv-builder` | real |
| coverLetter | yes | yes — `writer` | real |
| **cards** | **yes (absent-seeded)** | **NO producer in code** | contract-only shape; **NOT BUILT** |
| prep | yes (absent-seeded) | **NO producer in code** | contract-only shape; **NOT BUILT** |
| liveLog | yes (absent-seeded) | **NO producer in code** | contract-only; **NOT BUILT** |
| postMortem | yes (absent-seeded) | **NO producer in code** | contract-only; **NOT BUILT** |

> `GET /api/case/:id` returns only `{ meta, decodedRole, fit, gaps, cvDraft, coverLetter }` — it does **not** serve `dossiers`, `prep`, `cards`, `liveLog`, or `postMortem` (§6 below). Bind those five only if you also plan the endpoint work.

---

#### 2. Part shapes, exactly as defined

##### `dossiers` — CONTRACT + CODE (produced by `researcher`)
Four dossiers, keyed `company · product · people · niche`. Each dossier:
```
{ title, summary, sources, paragraphs: [ { id, text, sources?, appended? } ] }
```
- `paragraphs[].id` is the anchor for save-as-question and drill-deeper.
- `appended` marks a drill-deeper subsection (carries its originating query).
- Content per key: **company** (why it exists, mission, funding/footprint/news/red-flags) · **product** (history/current/future, USPs, competitors, open challenges) · **people** (interviewer(s) first, then colleagues/reports; per person who/role/background) · **niche** (industry orienting → vertical context → exact niche depth: competitors, daily vocabulary, regulatory/integration reality, 12-month pressures).

##### `decodedRole` — CONTRACT + CODE (produced by `decoder`)
```
{ narrative: <string>,
  requirements: [ { id: 'decodedRequirement_<hex>', requirement, rationale,
                    weight: 1..5 | null } ] }
```
- 6–12 weighted "real requirements beneath the ad." Empty-`requirement` entries are filtered out.
- `requirements[].id` is what `fit.capability` maps against.
- **Contract note:** the contract §4 also mentions an optional short narrative + calls the item `decodedRequirement {id, requirement, rationale, weight?}`. Code names the container field `requirements` and always emits `narrative`.

##### `fit` — CONTRACT + CODE (produced by `gap-analyzer`; `capability` rows mutated by fill-gap)
```
{ capability: {
    requirements: [ {
      requirementRef: { kind:'decodedRequirement', id },
      evidence: <string>,
      evidenceRef?: { kind:'datafact', id },   // present when evidence is a cited datafact; EVERY 'match' has one
      status: 'match' | 'partial' | 'missing'
    } ],
    <overall capability read>                  // CONTRACT: "plus an overall capability read"
  },
  preference: <the "do you want it, on what terms" read: direction, deal-breakers,
               comp philosophy, culture signals, growth — a read, not a score>
}
```
- **Honesty enforcement (CODE):** a `match` whose `datafactId` doesn't resolve is downgraded to `partial` and its `evidenceRef` dropped; out-of-enum status clamps to `missing`.
- **Contract vs code field name — VERIFY BEFORE BINDING:** the contract lists `fit.capability` as a per-requirement array directly. Code nests them under `capability.requirements` (confirmed by `cv-builder` reading `fit.data.capability.requirements` and fill-gap guarding on `fit.capability.requirements`). The exact shape of the "overall capability read" field is **UNVERIFIED** (contract says it exists; no field name confirmed in the inventory).

##### `gaps` — CONTRACT + CODE (produced by `gap-analyzer`)
```
{ gaps: [ {                                    // (contract calls the part "a list")
    id: 'gap_<hex>',
    what, why,
    bridge: {
      id: 'bridge_<hex>',
      kind: 'reframe' | 'adjacent-proof' | 'honest-ramp',
      body, oneLiner,                          // oneLiner = compressed form for live cards / compression
      material: [ { source: 'cv' | 'coop-dialogue', ref? } ]   // REQUIRED, ≥1 item
    },
    provenance                                 // REQUIRED: how the gap surfaced
  } ]
}
```
- Co-op dialogue answers attach to a gap by ref and **append** to `bridge.material`.
- **VERIFY:** contract describes the part as a bare list of gap objects; the writing convention `provenance: 'gap-analyzer'` seen in tests. Whether the served part is a raw array or `{ gaps:[...] }`-wrapped is **UNVERIFIED** — the contract phrasing is "A list."

##### `cvDraft` — CONTRACT + CODE (produced by `cv-builder`, SELECTS datafacts, never authors)
```
{ language,                                    // 'en' default; e.g. 'en-US', 'sv-SE'
  sections: [ {
    key, heading,
    items: [ { datafactRef: { kind:'datafact', id }, text } ]   // text is verbatim resolved datafact text
  } ] }
```
- LLM is constrained to output only datafact ids `{ sections:[{ key, heading, datafactIds:[] }] }`; code resolves ids → verbatim datafact text and **drops any id not in the pool**. Only sections with ≥1 resolvable item are kept.

##### `coverLetter` — CONTRACT + CODE (produced by `writer`, authored prose, gate-checked)
```
{ language,                                    // 'en' default
  paragraphs: [ <string> ],                    // body, one paragraph per entry (≥4 in practice)
  unsupported_by_cv: [ <string> ]              // claims not directly supported by the CV, flagged for review
}
```
- Written through the writing-rules gate — a banned phrase throws `WritingRuleError` and the part goes `failed` (one gate-aware retry first).

##### `cards` — CONTRACT ONLY · **NOT BUILT (no producer)**
Shape defined in the contract; the envelope is seeded `absent` and never populated in code.
```
{ id, category, front, body, triggers, subject?, sourceRef? }
  category: 'gap-bridge' | 'story' | 'technical-move' | 'question-to-ask'
          | 'fact' | 'comp-posture' | 'dont' | 'domain-fact'
  front:    readable in ~5s
  body:     revealed on tap
  triggers: string[]   // OPAQUE in v0 — internal form (keywords/phrases/embeddings) deferred to A5
  subject?: domain tag (marketing / BI / AI / leadership / CRM / VIP / gamification / …)
  sourceRef?: reference to the node this card was derived from (gap / question / dossier paragraph)
```
- The deck is one structure rendered three ways: dashboard grid · panic card (filtered to top priority) · live workspace (navigated by audio match). Cards are a **projection** over other parts (`sourceRef` keeps traceability). **A designer can design against this shape, but nothing produces it yet.**

##### `prep` — CONTRACT ONLY · **NOT BUILT**
```
{ PREP:    { sections: [ { id, heading, full, compressed } ] },
  cvStory: { slides:   [ { id, headline, detail } ] } }
```
- CHEAT_SHEET = `compressed` of the 30-min subset; QUICK_REF = `compressed` of the 5-min subset — both a **deterministic projection** over `sections` (subset by a per-section `density` tag), no LLM in the step.

##### `liveLog` — CONTRACT ONLY · **NOT BUILT**
```
{ qa:       [ { id, question, answer } ],   // rewritten SUMMARY form — never verbatim transcript
  topicLog: [ { ref, at } ] }               // which cards/topics fired, when (metadata, not speech)
```

##### `postMortem` — CONTRACT ONLY · **NOT BUILT**
```
{ weaknessItems: [ { id, where, draftedAnswer, proposalRef?,
                     decision: 'pending'|'accepted'|'dismissed' } ],
  newInfoItems:  [ { id, claim, proposesDatafact,
                     decision: 'pending'|'accepted'|'dismissed' } ],
  // plus a thank-you draft and a round-two starting note (shape UNVERIFIED)
}
```
- Accepted `newInfoItem` flows toward the data-layer as a `datafact` (never silent auto-write).

##### `learningPlan` — **DOES NOT EXIST**
No `learningPlan` in the data contract or the code (`grep` confirmed zero matches in both docs). Do not bind to it.

---

#### 3. The datafact pool (candidate data-layer) — CODE

Datafacts are the **referenced, never embedded** candidate facts. Stored in the `datafacts` region, written only via host-level `ingestDatafact` (NOT exposed to submodules). Read via the `datalayer` capability (`listDatafacts`, `getDatafact`).

##### datafact shape (`datafacts/ingest-cv.cjs`)
```
{ id: 'datafact_<hex>',
  kind: 'datafact',
  type: <see enum below>,
  text: <verbatim, trimmed>,
  tags: [ ... ],           // falsy-filtered; job facts carry company_short; every fact carries language
  language: 'en' | ... }
```
`type` enum: `professional_summary · identity_positioning · value_proposition · skill · competency · job_summary · job_result · other_work · education · award · star_story · star_action · leadership`. (fill-gap also mints `type:'fill-gap'` datafacts with tags `addresses:<reqId>` + `fill-gap`.)

- **Not detached / not gate-checked** — datafacts are imported evidence; reads return live refs.
- A cited datafact's verbatim text is **gate-exempt** when a case part references it via `evidenceRef`/`datafactRef` (whole-string exact match only).

---

#### 4. The store — CODE (`server/skeleton/store/index.cjs`)

`createStore()` — four in-memory JS `Map`s. **100% in-memory: no disk, no DB, no serialization. Nothing survives process exit.** A real DB is future/UNVERIFIED.

| Region | Backing | What it holds | Access |
|---|---|---|---|
| **cases** (SHARED) | `Map` | the case objects (§1) | `getCase`, `listCases`, `writePart` (gate-checked), `setPartStatus` |
| **scratch** (PRIVATE) | `Map<ns, Map>` | per-submodule scratch, namespaced to `manifest.id` | `scratch(ns).get/set/all` — NOT detached, NOT gated |
| **datafacts** (DATA-LAYER) | `Map` | candidate facts (§3) | read via `datalayer`; write only host-level `ingestDatafact` |
| **collections** (non-case) | `Map<name, Map<id, record>>` | generic keyed records, upsert by `id` | `putRecord / getRecord / listRecords / removeRecord` |

- **Immutability:** cases + collections are `structuredClone`-detached on both read and write. datafacts + scratch are not.
- **Gate:** only `writePart` runs the banned-phrase writing-rules gate. `putRecord` and `ingestDatafact` are exempt (imported records/evidence).

##### Store collections — the job-side data model

Collections have **no fixed schema** (any string name lazily creates a `Map`). Names **actually written in code today: `jobs`, `jobSources`, `filterSet`.** (`jobRules`, `cases` appear only in comments — UNVERIFIED that any `jobRules` collection is ever populated.)

###### `jobs` — CODE (written by job-discovery, job-ingest, linkedin-job-fetcher, stage2-filter)
Canonical job record (union of the fields these producers write):
```
{ id: 'job_<hex>',
  externalId,          // provider-prefixed, e.g. 'linkedin-<id>', dedup key
  source,              // 'jobtech'|'remoteok'|'remotive'|'linkedin'|'csv-linkedin'
  title, company, location, url,
  snippet, text_content,        // text_content = full body (may be '' until enriched)
  postedAt,
  decision: 'new',              // job-ingest may carry existing decisions
  discoveredAt,
  signal,                       // 'neutral' | 'low'  (set by stage2-filter)
  matchedRules,                 // [{ stage, ... }] flag records (never hides the job)
  // enrichment cursor fields (linkedin-job-fetcher):
  needs_body,                   // retry cursor
  body_status,                  // 'expired'|'rate_limited'|'error'|'thin'|'no_id'|...
  // job-ingest extras:
  rejectReason, found_in, locFit
}
```
Flag-never-hide model: filters set `signal`/`matchedRules`; jobs are never dropped.

###### `filterSet` — CODE (record id `active`, seeded from `candidate_preferences.json` each run)
```
getRecord('filterSet','active') -> {
  id: 'active',
  searchTerms: [ ... ],
  providers: [ ... ],
  maxResults,
  rejectTitleTerms: [ ... ],
  badCompanies: [ ... ],
  stage_1: { location: { good:[], maybe:[], out:[] } },
  stage_2: [ { reason_code, match } ]     // body-level reject patterns
}
```

###### `jobSources` — CODE (name written in code, e.g. `run-discovery.cjs`)
Written as a collection but its **record shape is UNVERIFIED** — the inventory confirms the collection name is used via `putRecord` but does not enumerate its fields.

---

#### 5. Identity & references (addressing scheme) — CONTRACT + CODE (`ids.cjs`)

Every addressable node carries a stable `id` minted once: `mintId(kind) -> '<kind>_<8-hex>'`. A **reference** is a typed pointer:
```
{ kind, id }              // within the current case
{ kind, id, caseId }      // cross-case (learning tool, later — shape allowed, unpopulated until A8)
{ kind:'datafact', id }   // into the candidate data-layer (referenced, not embedded)
```
16 valid kinds (`ids.cjs`): `case · dossier · paragraph · decodedRequirement · gap · bridge · card · question · prepSection · cvSlide · liveQA · harvestItem · datafact · job` (Set literally lists these; contract §2.1 lists the same set less `job`). Dangling refs are reported, never silently dropped.

##### Crosslinks — DERIVED QUERY, not a stored part
`getCrosslinks({ caseId, focus:{kind,id} }) -> [ { ref:{kind,id,caseId?}, relevance, score? } ]`. Computed, never stored. **CONTRACT-defined; a brokered query, not a served endpoint today** (no `/api/.../crosslinks` route exists — see §6). v0 is within-case rule-based.

---

#### 6. The 6 API endpoints — CODE (`server/dev-server.cjs`, hand-rolled `node:http`, no Express)

Booted by `npm run dev` (default `PORT` 5173). All responses `application/json; charset=utf-8`, `cache-control: no-store`. Request bodies > 100 KB rejected. **No frontend calls any of these.** LLM-backed routes need `ANTHROPIC_API_KEY` (else `llm=null` and they fail at invoke time via their error paths).

| # | Method + path | Request body | Success response | Error / notes |
|---|---|---|---|---|
| 1 | `GET /api/health` | none | `200 { ok:true, service:'hello-lilly-dev-server' }` | matched inline in `start()`, not in the case handler |
| 2 | `POST /api/jobs/search` | `{ keywords[≤8], excludeKeywords[≤20], sources[≤5], maxResults(5–50), municipality }` | `200 { ok:true, jobs:[<normalizeJob>], summary, meta{keywords,sources,municipality,…}, logs:[] }` | `500 { ok:false, error }`. **Depends on SIBLING repo** `OnlyiGaming/content-pipeline-modules-v2/.../api-search/execute.js` (lazy-required); MODULE_NOT_FOUND → 500 in a clean checkout. No providers selected → `{ok:true, jobs:[]}`. **UNVERIFIED** (no test covers this path). Note: `normalizeJob` output ≠ the store `jobs` shape — it adds `co`, `logo`, `match`(64–96), `when`, `hot`, `tags`, sliced to 40. |
| 3 | `GET /api/case/:id` | none | `200 { ok:true, case:{ meta, decodedRole, fit, gaps, cvDraft, coverLetter } }` | unknown case → `404 { ok:false, error:'no such case' }`. **Serves only these 6 parts** — NOT dossiers/prep/cards/liveLog/postMortem. |
| 4 | `POST /api/case/:id/analyze` | none (preferences read server-side from `docs/candidate_preferences.json`, optional) | `200 { ok:true, fit, gaps, summary }` | `500 { ok:false, error }`. Runs `gap-analyzer`. |
| 5 | `POST /api/case/:id/gap/:gapId/answer` | `{ answer, requirementId }` (both required) | `200 { ok:true, outcome:'accepted'|'stays_gap', newDatafactId?, … }` | missing fields → `400 { ok:false, error:'answer and requirementId are required' }`; `500` on error. On accept: mints a `fill-gap` datafact + flips the requirement to `status:'match'`. |
| 6 | `POST /api/case/:id/generate` | none | `200` when BOTH ready, else `207`: `{ ok, cvDraft, coverLetter, cvDraftStatus, coverLetterStatus, [<id>_error] }` | no such case → `404`. Loops `['cv-builder','writer']`; `ok:true` only if both parts `status==='ready'`. |

##### Write-backs the frontend is allowed (CONTRACT §6) → API mapping
- **save a question** → adds a `question` node (optional `sourceRef` to source paragraph). **No endpoint exists yet — NOT BUILT.**
- **drill deeper** → targeted search on a `paragraph` ref, appends an `appended` paragraph to the dossier. **No endpoint — NOT BUILT** (researcher has a drill mode but no HTTP route).
- **accept/dismiss post-mortem item** → sets `decision`. **No endpoint — NOT BUILT.**
- **co-op dialogue answer** → attaches to a gap, appends to `bridge.material`. **Served by endpoint #5** (`/gap/:gapId/answer`) — this is the one write-back that is wired.

---

#### Designer's bottom line

- **Bind confidently to real, served shapes:** `meta`, `decodedRole`, `fit`, `gaps`, `cvDraft`, `coverLetter` (endpoint #3), the fill-gap answer flow (#5), the two generators (#6), and the `jobs`/`filterSet` collections behind the job pipeline.
- **Design against but do NOT assume they populate:** `dossiers` (produced but not served by #3), `cards`, `prep`, `liveLog`, `postMortem` (contract shapes with envelopes but no producer and no endpoint).
- **Do not bind:** `learningPlan` (does not exist), `crosslinks` as a stored field (it's a derived query, no endpoint), cross-case `caseId` refs (allowed by shape, unpopulated until A8).
- **The whole wire is missing:** no `useCase()`, no `/api/*` call in the frontend. These shapes describe the backend contract a future data-bridge will expose — not anything a shipped screen reads today.

---

## Section 5 - Handoff note for the design model

This document is the **substance**; the visual build is yours. Concretely:

1. **Bind BUILT surfaces to real data.** For each surface tagged BUILT (Section 2), render it against the real endpoint + case-part shape (Section 4) - e.g. Matchanalys binds to `POST /api/case/:id/analyze` → `fit` + `gaps`; the CV builder to `POST /api/case/:id/generate` → `cvDraft`; job search to the `jobs` collection. Show live data, not the current fixtures.
2. **Design PLANNED surfaces as-if-real.** For each surface in Section 3, use its invented data shape + sample content so it looks and behaves like a shipping feature, even though no backend exists yet.
3. **Keep the persona consistent.** Daniel Oskarsson (iGaming / marketing) threads through every screen - same person, same roles, same achievements, everywhere. Honesty rules hold even in mockups.
4. **Put the crosslinking rail on every surface.** The right-rail that surfaces the relevant coach / peer / template / research / next action is the product's core idea - it is present on all screens, jobseeker and coach.
5. **Unify on the design system.** `grid.jsx` already defines `PageTemplate / ContentArea / ContentBox / CrossColumn`, but no screen imports them today (every screen is bespoke). Build the design on these primitives so the system is consistent.
6. **Two audiences, one shared case.** The same case record powers the jobseeker view and the coach view (the contract is a single shared `case`); design both, reading the same data.

**Status of this spec:** the vision, the persona, and the data model are grounded in real docs + code; the PLANNED surfaces are deliberate conceptual invention (flagged as such). Nothing here changes code - it is a design reference only.
