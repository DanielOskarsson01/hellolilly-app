# HelloLilly - THE REST OF THE SITE (MVP plan)

**Date:** 2026-07-07 · **Status:** proposal for Daniel's decision
**What this is:** The plan for everything the existing plans do NOT cover. It picks up exactly where MASTER_STATE, the Omställning build plan (M0-M8) and INTERVIEW_PREP_CONCEPT_FINAL end, and takes every remaining tool in the strategy paper's Full Vision (Section 8) to a defined MVP level: real where cheap, connected where possible, shortcut where sensible, honestly-labelled demo where not.
**Reads with:** `MASTER_STATE.md`, `DECISIONS_ADDENDUM.md`, `HelloLilly_Jobseeker_Product_Vision_INTEGRATED`, `HelloLilly_Omstallning_Build_Plan.md`, `INTERVIEW_PREP_CONCEPT_FINAL`.

---

## 1. Where the existing plans end (the frontier)

Everything above this line is already planned, built, or in flight. Nothing in this document touches it.

**Covered by the existing priority path (MASTER_STATE §5):**
- Jobbsök (approval screen) - DONE
- Matchanalys, CV-byggaren, Personligt brev - CURRENT core-loop wave
- Ansökningskoll (delivery cards + tracking) - next in path
- CSV upload surface - deferred but planned
- Honesty pass + D3 banners - planned
- Rejection-learning, A2 addendum, filter editing, scheduled discovery, comment-regeneration, docx export - Kind-3 roadmap

**Covered by the interview-prep concept:**
- Research + decoder (stages 1-3) - backend BUILT, UI missing (this plan claims the UI, see D. Research Helper / Interview Prep, because it is a pure wiring win)
- Prep package, cards, live ticker, post-mortem (stages 4-6) - concept exists, roadmapped

**Covered by the Omställning build plan (M0-M8):**
- Transition Compass, Direction Explorer, Funding Navigator, Education Matcher, Test-Before-Invest, Transition Economics, Transition View

**NOT covered anywhere - the subject of this document:**

| Category | Tools without a plan |
|---|---|
| A. Execution | Progress Support, Interview Trainer, Image Studio |
| B. Opportunity | Job Radar, Company List, Blind Applications |
| D. Preparation | Research Helper UI, Interview Prep intake UI |
| E. Network | LinkedIn Helper, Outreach Plan, Network Match |
| F. Coach | Case Record (jobseeker-facing), Live Support, Coach Network, Coach Review, Knowledge Hub, Feedback Loop |
| G. Learning | Knowledge Hive, Outcome Engine |
| H. Delivery | The hub (home) rebuilt real, phone presence |
| Community | The forums / peer layer promised in Section 4 |

---

## 2. The four MVP tiers

Every tool below is assigned exactly one tier. This is the decision language for the whole document, and it maps 1:1 onto D3: tiers 1-3 end without a banner, tier 4 always carries the "Demo - exempeldata" banner, tier 5 carries the "Koncept - kommande" label.

- **T1 REAL.** Fully functional on the existing backend architecture (store, case parts, status envelope, honesty gate, LLM skeletons). No new infrastructure. These are cheap because the machine already exists; the tool is mostly a new case part + a screen on the grid.jsx templates.
- **T2 WIRED-THIN.** Real function, thin scope. Connects to a free external source (open public data, RSS, browser-native APIs) or reuses a built backend capability for a narrower job than the full vision describes. Works for real, but the ambition is deliberately capped.
- **T3 SHORTCUT.** Real-looking and genuinely useful, powered by an open-source component or a small subscription rather than owned code. The seam is hidden behind our UI; the data it produces still lands in the store like everything else.
- **T4 LABELLED DEMO.** The screen exists, looks finished, demonstrates the interaction perfectly, and carries the D3 banner. Fixture data only, honest about it. A T4 screen is a promise rendered, not a lie - because the banner makes it one.
- **T5 CONCEPT PANEL.** Not a screen - a picture of one. A static, non-interactive frame showing what the tool does when properly built: the tool mid-use, with 2-4 short callout notes explaining what is happening in the picture, and one line on when it becomes real. Built the cheap on-brand way: compose the frame from the design system's own components rendered inert, then capture it as an image - it looks exactly like the product because it IS the product's components, just frozen. Carries its own label, **"Koncept - kommande"**, deliberately distinct from the demo banner, because a T5 panel does not even pretend to hold data. Its job is to replace bare ComingSoon pages so the nav hints at something real instead of a blank wall.

**Standing rules (apply to every tool below, no exceptions):**
1. Every new/rebuilt screen is built on the grid.jsx templates. The design system stays un-orphaned.
2. New screens use the real persona (Daniel). Amir survives only inside T4 screens, per the addendum.
3. Every control works, is visibly disabled with a label, or does not exist. T4 screens satisfy this via the banner; T5 panels satisfy it by containing no controls at all - a picture cannot lie about being clickable.
4. Everything reads and writes through the API. No new localStorage, no browser-direct external calls.
5. Every LLM output that makes a claim about the person goes through the same honesty pattern as the core loop: cite-or-refuse, never author facts.
6. i18n-ready strings from day one on every touched screen (the rule already set for rebuilds).

---

## 3. The reuse catalogue (what we already own)

The single biggest cost saver in this plan is that six of the "new" tools are the SAME three backend skeletons wearing different clothes. Before costing anything, name the assets:

| Asset (built, on main) | What it is | Reused by |
|---|---|---|
| `writer` skeleton | Guardrailed generation with `unsupported_by_cv` honesty | Interview Trainer, LinkedIn Helper, Outreach Plan, Blind Applications |
| `gap-analyzer` | Fit/gap verdicts with cite-by-id | Interview Trainer (question targeting), Blind Applications (angle selection) |
| A1 researcher | 4-dossier company research, live-verified | Research Helper UI, Company List, Blind Applications, Job Radar summaries |
| `job-discovery` + jobs store | API search, filters, flags | Job Radar (signal source), Company List (advert crosslink) |
| Case-part architecture + status envelope | pending/ready/failed/absent, detach at store boundary | Every single new tool - each is just new case parts |
| `useCase()` bridge + grid.jsx templates | The wired frontend pattern proven on Jobbsök | Every screen |
| Datafacts pool + selects-never-authors | The content profile creator's core discipline | Interview Trainer answers, LinkedIn Helper profile text, Image Studio captions |
| HelpfulNow panel | The crosslinking side panel (currently fixture-fed) | Becomes real incrementally: each shipped tool registers what it can offer the panel |
| 8-reason taxonomy pattern | Structured decision capture | Feedback Loop, Coach Review verdicts, Outreach Plan outcomes |

The pattern to internalise: **a "tool" in the strategy paper is, in build terms, a case part + a prompt discipline + a templated screen.** That is why the rest of the site is cheaper than it reads.

---

## 4. Tool-by-tool plan

Effort sizing: **S** = 1-2 build days, **M** = 3-5, **L** = 1-2 weeks. Sizes assume the current agent-assisted workflow and the reuse catalogue above. Each entry: tier, what powers it, the MVP boundary, UI/UX, and the banner state it ends in.

### A. Execution tools

#### A1. Progress Support (Framstegsstöd) - T1 REAL - M
The highest-leverage unbuilt tool, because it is what makes the hub feel alive and it costs almost nothing: it is 90 percent data you already produce.
- **Powers it:** an `activity` collection in the store. Every existing real action already emits a decision or a generation event (job approved, CV generated, letter saved, analysis run). Progress Support is those events, logged automatically, plus a small planner record (next actions, one per day max).
- **MVP boundary:** automatic activity log + "one next step" logic (rule-based, not ML: oldest unfinished thread wins) + weekly view + gentle streak-free progress display. NO push notifications yet (that is the phone story, H2). Reminders are in-app only.
- **During-study mode:** the one-light-market-action-a-week cadence from the Omställning plan reads from the same collection - build the collection here, and M-phase work gets it free.
- **UI/UX:** the existing Aktivitet demo screen's layout is close to right - rebuild it on templates with real events. Tone rules from the paper: supportive, never surveillance; the person can hide any logged item. One next step rendered as a single large card on Home, not a list.
- **Ends:** banner OFF. Replaces the Amir activity demo screen entirely.

#### A2. Interview Trainer (Intervjuträning) - T1 REAL (text) with a T3 voice layer - M, then S
The current interview.jsx is fixture theatre with a fake recording UI. Kill it; the real thing is cheap because everything it needs is already in the case.
- **Powers it:** writer skeleton + gap-analyzer. The case already holds the job ad, the CV draft, the fit/gaps verdict, and (via A1 researcher) the company dossier. A realistic interview is an LLM session grounded in exactly those four things, with follow-ups conditioned on the answer - which is precisely the fill-gap loop interaction pattern, reused.
- **MVP boundary (text):** pick a job from the store, pick a style (the seven styles from the paper are a prompt parameter, not seven features), 8-12 question session with follow-ups, then a kind + specific feedback summary written under the same honesty rules (feedback cites the person's actual answer, never invents). Session saved to the case; weak answers feed Interview Prep.
- **Voice layer (T3, after):** browser-native Web Speech API costs nothing and handles sv-SE speech synthesis and recognition acceptably - ship that first as the "spoken mode". If quality disappoints, the subscription shortcut is a realtime voice API behind the same session; the UI does not change. Do NOT build a recording/playback feature - the fake one dies unreplaced.
- **UI/UX:** chat-shaped, one question visible at a time (matches the paper's "one clear step" principle and the language-app comparison). A visible "this is practice, nothing is judged or shared without you" line. Feedback screen separates: strong moments / weak moments / one thing to practise.
- **Ends:** banner OFF.

#### A3. Image Studio (Bildstöd) - T3 SHORTCUT - M
The one tool where owning the tech is a mistake - but the AI enhancement layer is in scope, because people cannot afford studio shots and a phone photo made studio-grade is levelling, not faking.
- **Powers it:** an open-source, self-hosted enhancement stack (no per-image fees): Real-ESRGAN for quality upscaling, CodeFormer or GFPGAN at conservative settings for face restoration and sharpening, denoise and relight passes, plus rembg for background removal/replacement, plus client-side crop/rotate and 4-6 fixed professional framing templates (plain background colours, correct head ratio, LinkedIn/CV export sizes).
- **The identity line (the tool's whole ethic):** same face, better photograph. Enhancement of the person's real photo - quality, light, sharpness, background - YES. Identity-altering edits - younger, thinner, changed features, a synthetic person - NO, heavily restricted at the prompt/parameter level. Every export requires the person to approve a before/after comparison, so the person always confirms "that is still me".
- **MVP boundary:** upload photo, enhance, remove/replace background, crop to template, export in correct sizes. NO generative headshots and no face synthesis (the paper's "not a false version of the person" - the constraint is the brand).
- **UI/UX:** a three-step wizard, big preview, mandatory before/after toggle, an enhancement strength slider that tops out well before the uncanny zone. Template picker with honest guidance text ("a plain background and good light matter more than the camera").
- **Ends:** banner OFF. Small tool, disproportionate demo impact - image tools always read as "real product".

### B. Opportunity tools

#### B1. Company List (Företagslista) - T1 REAL - S
The cheapest real tool in the entire remaining suite.
- **Powers it:** a `companies` collection + A1 researcher. Add a company manually or from any job row; one click runs the existing 4-dossier research against it; live adverts crosslink via job-discovery filtered on the company name.
- **MVP boundary:** manual add + add-from-job, research-on-demand, notes, status (interested / contacted / waiting / closed). System-suggested companies come later from Job Radar.
- **UI/UX:** card grid on templates; each card shows why-relevant (from the dossier), open roles count, last activity. This screen is also the natural home surface for Blind Applications and Outreach Plan - design the card actions with those two in mind now.
- **Ends:** banner OFF.

#### B2. Blind Applications (Spontanansökningar) - T1 REAL - M
- **Powers it:** researcher (company context) + gap-analyzer (which CV angle fits this company) + writer (the first message, guardrailed). A `blindApplication` record ties it together: company, angle, message draft, sent-date, follow-up date, outcome.
- **MVP boundary:** full checklist flow from the paper (research, contact angle, message, CV angle, follow-up plan, log) EXCEPT automatic contact-person discovery - the person pastes or types the recipient. Scraping people is a privacy and ToS swamp; skip it permanently at MVP.
- **UI/UX:** a guided five-step flow launched from a Company List card. Each step completable in one sitting; progress persists (same save-and-resume pattern as the cover letter). The message editor shows the same honesty affordances as Personligt brev.
- **Ends:** banner OFF.

#### B3. Job Radar (Jobbradar) - T2 WIRED-THIN first, T4 for the rest - M
The full vision (press releases, tenders, investments, leadership changes) is a paid-data product. The thin real core is still genuinely useful.
- **Powers it (thin real):** two free signal sources. (1) Hiring-volume deltas from job-discovery: which companies in the person's region/field posted noticeably more adverts this month than their trailing average - that is a real, honest hiring signal computed from data we already pull. (2) A small curated RSS set (national + regional business press) filtered by the person's target field, summarised by the LLM into a weekly list with source links.
- **MVP boundary:** one weekly generated list, each item crosslinked to add-to-Company-List and to live adverts. NO tender/investment/leadership tracking - those four list types render as T5 concept cards INSIDE the otherwise-real screen: a frozen picture of the future signal list with the Koncept label and a callout per card. Cheaper and more honest than interactive fixtures (per-section labels are allowed; per-control fakery is not).
- **UI/UX:** a weekly digest page, newest on top, each signal card carrying: what was observed, the source, and one suggested action. The signal-to-action-path idea from the paper is the design centrepiece; even two signal types demonstrate it completely.
- **Ends:** banner OFF on the two real signal sections; the preview sections carry the Koncept label.

### D. Preparation tools

#### D1. Research Helper (Researchstöd) - T1 REAL - S
Flagged in MASTER_STATE as built-but-invisible; this plan claims it because it is the single best value-per-day item on the board.
- **Powers it:** the A1 researcher, already live-verified. This is pure wiring: an intake form (company, role, purpose template) and a dossier-rendering screen.
- **MVP boundary:** the 4 dossiers + the paper's purpose templates (before applying / before interview / before blind application / before career change) as presets that select which dossier sections to surface first. Career-change preset crosslinks into the Omställning tools when they land.
- **UI/UX:** dossiers as collapsible sections with citation links; a "what matters here" summary on top; save-to-case so Interview Prep and Blind Applications can pull it.
- **Ends:** banner OFF.

#### D2. Interview Prep intake (stages 1-3 UI) - T1 REAL - S
Same story: backend built, UI missing, and the interview-prep concept owns stages 4-6 later. Ship the intake + decoder + research view now so the built capability is visible and Interview Trainer can consume its output.
- **Ends:** banner OFF.

### E. Network tools

#### E1. LinkedIn Helper (LinkedIn-stöd) - T1 REAL - S/M
- **Powers it:** writer skeleton with a checking posture instead of a generating one. The tool's promise in the paper is emotional safety ("this is not wrong, this is reasonable, this has been checked") - that is a review pass, not an integration.
- **MVP boundary:** paste-in review + improvement for profiles, messages, comments, posts; post-idea generation grounded in the person's datafacts; tone/recipient-fit presets; and a **manual publish step** that closes the loop - a copy button, where to paste it, when to post it, what response to expect and how to follow up. The tool walks the person to the send button and stops there; the person's own finger does the posting. NO LinkedIn API and NO software posting on the person's behalf (automation is against LinkedIn's terms; a restricted account mid-job-search is a catastrophe; and the paper already says "not automation"). For the same reason, the tool does not guide people to wire up third-party auto-posting agents - one step removed is the same account risk.
- **UI/UX:** two panes, theirs and the suggestion, with a plain-language "why this reads better" note per change and a big it-is-fine state when nothing needs fixing - the reassurance IS the product.
- **Ends:** banner OFF.

#### E2. Outreach Plan (Kontaktplan) - T1 REAL - S
- **Powers it:** a `outreach` record (who, why, order, message, follow-up date, what-to-avoid note) + writer for drafts. Connects to Company List and LinkedIn Helper by reading the same store.
- **MVP boundary:** manual contact entry only. Sequencing suggestions are rule-based (warm before cold, follow-up at 7 days) with the LLM writing the messages, not choosing the humans.
- **UI/UX:** a simple kanban (planned / sent / replied / done) - the mental model jobseekers already have from the job list. Unwritten-social-rules guidance appears inline at the moment of drafting, not as a separate guide page.
- **Ends:** banner OFF.

#### E3. Network Match (Nätverksmatch) - T4 LABELLED DEMO - S
The one Network tool that cannot be real without data that does not exist yet (a populated coach-skills graph, consented jobseeker histories, connection data).
- **MVP:** a beautiful, fully-interactive fixture: type a company, see the demo graph resolve (a coach who knows it, a peer who worked there, a template that fits), with the banner on. The screen's job is to sell the concept to HelloLilly and to define the data contract the real version will need.
- **One real seam:** if a small hand-entered coach-competence table exists by then (see F3), the "does a coach know this field" row can go real inside the demo screen, labelled per-section like Job Radar.
- **Ends:** banner ON.

### F. Coach tools

Reality check that shapes this whole category: there are no real coaches in the system yet. Daniel is user #1 on the jobseeker side; nobody is user #1 on the coach side. So Coach tools split into (a) the shared record, which is real because the jobseeker side generates it, and (b) coach-interactive tools, which are demo until a pilot coach exists.

**The fixture coach cast (a convention for every T4 coach screen).** All coach frontends GET BUILT - that is the whole point of the MVP, showing the human anchoring. What stays honest is the label. To make the demos tell one coherent story, define a fixed cast of 3-4 named fixture coaches with distinct gifts, straight from the paper's own examples: the coach who has placed forty nurses, the one who understands autism and ADHD, the one whose gift is restoring confidence, the one who knows headhunting cold. Same names, same faces, same fields on every coach screen (Coach Network, Coach Review, Network Match, Transition View demos), each profile marked as a placeholder. The moment a real pilot coach signs on, one cast member is replaced by a real row and that screen's banner comes off - data changes, not code.

#### F1. Case Record (Ärendevy) - T1 REAL - M
- **Powers it:** it already exists - it is the case. This tool is a reading view over the case parts and collections: intake, goals, CV versions, applications, saved jobs, company list, research, activity, next steps. The Omställning plan adds study/funding plans to the same record.
- **MVP boundary:** the jobseeker-facing view only. The coach-facing variant is the same screen with a role flag, shipped when a pilot coach exists. Coach notes render as a visibly-empty labelled section until then.
- **UI/UX:** one page, chronological spine, filter chips by kind. This is the "one living shared picture" - resist the dashboard urge; it is a record, not a cockpit.
- **Ends:** banner OFF.

#### F2. Knowledge Hub (Kunskapshubb) - T2 WIRED-THIN - M
- **Powers it:** a `resources` collection (links, PDFs, videos, notes; tags; suggested-by; approved flag) + the assistant-under-every-item, which is the researcher summarisation pattern pointed at a URL or document instead of a company.
- **MVP boundary:** real CRUD, real search, real per-item assistant. Seeded with the honest count of genuinely useful resources (the "320+ resurser over 6 items" over-claim dies here). Coach approval renders as a visible state on each item; until a coach exists, items sit honestly at "föreslagen" (suggested).
- **UI/UX:** library grid + the assistant drawer per item ("what does this say / how do I use it"), which is the paper's whole differentiator for this tool.
- **Ends:** banner OFF (the content is real, just small - small and honest beats big and fake, which is the entire HelloLilly voice).

#### F3. Coach Network (Coachnätverk) - T4 shell with one real table - S
- **MVP:** the searchable coach-competence directory as a demo screen, PLUS a real, hand-entered competence table structure underneath (name, fields, gift, languages). The moment two pilot coaches fill in a row each, the screen flips real by changing data, not code.
- **Ends:** banner ON (flips off with real rows).

#### F4. Coach Review (Coachgranskning) - T4 LABELLED DEMO - S
- **MVP:** the request-review flow works for real (pick artifact, add question, submit - it lands in the store as a real request record), the responses are fixture and bannered. Same flip-to-real property as F3.
- **Ends:** banner ON.

#### F5. Live Support (Mötesstöd) - T3 SHORTCUT, later - M/L
- **Powers it (when built):** open-source Whisper for transcription (self-hosted on the existing host, sv model) + the writer for summaries + consent captured as a record before anything is processed. Upload-a-recording first; live transcription later.
- **Recommendation:** park behind the coach pilot. Building meeting intelligence before a single real meeting exists in the system is effort in the wrong order. Represent it as a T5 concept panel instead of a bare ComingSoon: the meeting view mid-session, pictured - live transcript running, the consent step visible, the after-meeting summary and Case Record update shown as callouts. One image sells the whole tool.
- **Ends:** Koncept panel for MVP.

#### F6. Feedback Loop (Återkoppling) - T1 REAL - S
- **Powers it:** a `feedback` collection: suggestions, upvotes, short polls. Pure CRUD on the store, half a day of backend.
- **Note:** the fake poll voting on the current demo dies here, replaced by one real poll. Given the Pulse critique history, the design rule is set now: results shown only after voting, never live-anchored.
- **Ends:** banner OFF.

### G. Learning layer

#### G1. Knowledge Hive + G2. Outcome Engine - T4 LABELLED DEMO - S each
The strategy paper itself orders these last (A8), and the honest position is that they REQUIRE accumulated real usage to exist. Faking them functionally would be the exact dishonesty the whole project forbids.
- **MVP:** two demo screens that visualise what the layer WILL see: which advice preceded placements, which support helps which barrier groups, the flywheel. Fixture data, banner on, and one real element each - the Hive screen shows the true current counts of real records in the store (cases, activities, decisions), presented as "what the hive is already collecting". That single real number row makes the promise credible.
- **Ends:** banner ON.

### H. Delivery surfaces

#### H1. The hub (Home) rebuilt - T1 REAL - S/M
- **Powers it:** Progress Support (the one-next-step card), the jobs store (new matches count), the case (in-flight applications). Every dead hero button and thumb dies.
- **MVP boundary:** one next action + quiet entries to the real tools + honest counts. Nothing on Home may reference a T4 tool without its banner styling carried onto the entry card - the nav stops advertising breadth it cannot honour, per the honesty pass.
- **Ends:** banner OFF.

#### H2. Phone presence - T2 WIRED-THIN - S
- **MVP:** PWA, not a native app (the paper's own build-order says responsive web is enough to start). Manifest + installability + the responsive pass the templates already give. In-app reminder surface from Progress Support; push notifications deferred.
- **Ends:** banner OFF.

### Community layer - T4 now, decision later - S now
The forums/peers/vouching promise from Section 4 is a real product in itself, and OnlyiGaming experience says exactly how much work a community layer is.
- **MVP now:** one T4 screen showing the community concept (a thread, a peer story, a vouch), bannered. It exists so the vision demos coherently.
- **The later decision (not now):** self-host an open-source forum (Discourse or NodeBB) skinned into the design system vs building native community on the store. Do not decide this inside the MVP; the demo screen buys the time.
- **Ends:** banner ON.

---

## 5. The build waves (after the current priority path completes)

The existing path runs to its end first: core-loop wave, then Ansökningskoll, then CSV upload, then the honesty pass with D3 banners. The Omställning M-phases run on their own track per its build plan. THEN:

**Wave 1 - "wire what is built, log what happens" (all T1, ~2 weeks)**
Research Helper UI (D1) → Interview Prep intake (D2) → Progress Support (A1) → Case Record view (F1) → Home rebuilt (H1).
Rationale: three of five are pure wiring over built backends; Progress Support starts accumulating the data every later tool and the eventual learning layer feeds on - every week it is not logging is data lost forever.

**Wave 2 - "the proactive jobseeker" (~2-3 weeks)**
Company List (B1) → Blind Applications (B2) → Outreach Plan (E2) → LinkedIn Helper (E1).
Rationale: one connected story (find a company, research it, approach it, communicate safely) built almost entirely on the three reused skeletons. Demos as a single narrative.

**Wave 3 - "confidence and polish" (~2 weeks)**
Interview Trainer text (A2) → spoken mode via browser APIs → Image Studio (A3) → Feedback Loop (F6) → Knowledge Hub (F2).

**Wave 4 - "the horizon screens" (~1 week)**
Job Radar thin-real + concept preview cards (B3) → Network Match demo (E3) → Coach Network shell (F3) → Coach Review demo (F4) → Hive + Outcome Engine demos (G1/G2) → Community demo → the T5 concept-panel batch (Live Support, the phone app, the radar preview cards, plus a panel for any remaining ComingSoon nav destination worth keeping) → PWA (H2).
Rationale: batched because T4 screens and T5 panels share one fixture-and-label discipline; producing every panel in a single pass keeps the visual language identical across the whole site.

**Parked, represented as T5 concept panels:** Live Support, the native app, tender/investment/leadership radar sources.
**Parked invisibly (nothing to picture):** fine-tuned models.
**Refused on principle (no panel either - see §6):** LinkedIn API automation, automated outreach to employers (the paper already excludes it).

**End state:** every tool in Section 8 of the strategy paper is visitable. Roughly 17 tools function for real, 2 function thinly with labelled preview sections, 6 are honest labelled demos, and everything parked shows a Koncept panel instead of a blank ComingSoon - so nothing in the nav is a dead end, and nothing is fixture theatre. Total new spend: zero mandatory subscriptions (Whisper, rembg, Web Speech are free/self-hosted; LLM usage rides the existing API relationship). The only future paid decision is realtime voice, and only if browser voices disappoint.

---

## 6. What this plan refuses (so nobody relitigates it mid-build)

Each line names what is banned AND the allowed version standing right beside it, because the shorthand version of this list read as bigger prohibitions than intended.

- **LinkedIn.** Banned: the LinkedIn API, software posting on the person's behalf, and scraping people or profiles (automation and scraping are against LinkedIn's terms, and a restricted account mid-job-search is a catastrophe for a jobseeker) *(amended by D21, 2026-07-16: coach's own network via coach's own tooling - see D21)*. Allowed and in scope: everything up to the send button - what to post, where, when, how, and the follow-up. The person's own finger does the posting (E1).
- **Image Studio.** Banned: synthetic faces and identity-altering edits (younger, thinner, different features, a generated person). Allowed and in scope: AI enhancement of the person's real photo - quality, light, sharpness, background - the studio shot without the studio (A3). Same face, better photograph, always approved by the person against a before/after.
- **Learning layer.** Banned: fake analytics presented as if computed from real usage. Allowed and shipping: obviously-labelled placeholder dashboards - G1/G2 are exactly that, fixture content with the banner on plus one real row of true store counts. The ban is on the missing label, never on the fixture.
- **Polls.** Banned: showing results BEFORE the person votes (visible results anchor and bias the vote - the standing rule from the Pulse critique). Allowed: results after voting in the real Feedback Loop, and fixture polls with fixture results on any bannered demo screen.
- **Native app.** Banned for now: an app-store native build (developer accounts, review queues, separate builds, a permanent maintenance tax). Allowed and shipping: the PWA - the same responsive app made installable on the phone with a home-screen icon and app feel. "Proves the need" means: only pay the native tax if real usage later demands something the PWA cannot do. This is the paper's own build order.
- **Coach tools.** Banned: removing the demo banner before a real coach exists behind the screen. Allowed and required: building EVERY coach frontend, fully interactive, populated with the fixture coach cast (F, intro). The frontends are the MVP's proof of human anchoring; the banner is what keeps them honest until a pilot coach replaces a placeholder.
- **The architecture rule.** Every new tool goes through the four shared mechanisms, never around them: the **store** (all data through the backend API - no localStorage side-channels, no browser calling external services directly), the **templates** (every screen on grid.jsx), the **status envelope** (every piece of data is pending, ready, failed or absent, so loading/error/empty states are honest and consistent), and the **honesty gate** (any AI claim about the person cites their real datafacts or refuses). Non-negotiable because the first 13 screens bypassed all four, and the price of that was the entire MASTER_STATE reconciliation. The tools are copyable weekend work; the connected honest system is the product.

**One boundary on the concept panels:** T5 panels exist only for PARKED items - things this plan defers. The banned halves above never get a panel. A picture of auto-posting, scraped contact lists, synthetic faces or pre-vote poll results would be advertising a capability the plan has decided is wrong, and the vision must not promise what the product will refuse to do. Not-yet gets a picture; not-ever gets nothing.
