# HelloLilly - Kind-3 Roadmap (the not-yet-built areas)

Companion to `docs/MASTER_STATE.md`. The Kind-1 spine (Jobbsök, Matchanalys, CV-byggaren, Personligt brev) is complete on main. This is the dependency-ordered map for everything after it. Plain-language, honestly tiered.

**Tiers:** NOW = executable now · SIM = simulate now, real later · NOT-YET.

---

## Interview-prep, stage by stage

In Jobbradar style: researches the company and the people, decodes what the job really is behind the ad, compares that against what the person has actually done and actually wants, interviews them to surface experience that never made the CV, compresses it all into three reading densities plus a card deck, stands beside them during the call, and harvests the call afterwards so round two starts ahead of round one.

**Why it's the most native area:** every stage writes into a slot that already exists in the case record - the shared file the whole app keeps per job application. Research fills the dossier shelves, the decoder fills the true-job shelf, analysis fills the fit and gaps shelves, the prep package and card deck have their own shelves, and the call record and post-mortem have theirs. No new storage design is needed for any of it. That's rare - nearly every other unbuilt area needs a storage decision first.

**Stage 1 - Intake. Executable now. Small.**
What it does: the person pastes whatever they have (ad, recruiter mail, company name), picks which CV version they sent, and the system echoes back its understanding - company, role, people, date - for confirmation before spending research money. What's missing: only the screen and a "create a prep case" endpoint plus one cheap parse step. Everything it writes to already exists.

**Stage 2 - Research. Executable now, but honestly sized: the heaviest orchestration job yet. Medium-to-large.**
What it does: researches five fronts at once - the company's story, the specific product the person would work with, the people they'll meet, the true job behind the ad, and the exact niche three levels down. The core engine is built and live-verified (the researcher produced real dossiers for Curoflow). But what exists is a one-shot run. The concept asks for more: five fronts running in parallel with a per-front progress line, results landing as each finishes rather than all at once, and a reader where any paragraph can spawn a deeper follow-up search whose results append in place. That's real orchestration work - managing several long-running research jobs, streaming partial results into the case, and a drill-deeper loop - even though no new research capability needs inventing. The thin version (run the existing researcher, render the four dossiers plus the decoded role) is cheap; the full concept version is the big lift of the prep side.

**Stage 3 - Analysis. Executable now. Small-to-medium.**
What it does: maps the decoded job (not the raw ad) against the person two ways - can you do it, and do you actually want it - then interviews the person gap by gap to surface experience that never reached the CV. Nearly all of this shipped in the core-loop wave under another name: Matchanalys is this exact machinery with its honest citations and the gap-by-gap dialogue, currently pointed at job ads. The interview flavour repoints it at the decoded role profile and adds the preference-fit notes. Mostly wiring, with one thing to verify during the build: whether the analyzer accepts a decoded role as input today or needs a small adaptation.

**Stage 4 - Prep package. Executable now. Medium.**
What it does: compresses everything into three reading densities (full read, 30-minute review, 5-minute glance), a card deck, and the "tell me about yourself" story deck. The clever part is already designed into the data shape: the full document is written with every section carrying its own compressed form inline, so the shorter versions are mechanical extraction - no AI in the compression step, same input always yields the same output. What's missing: one new generator (following the same guardrail discipline as the letter writer) and the prep dashboard screen. This is the same kind of build as the core-loop wave screens.

**Stage 5 - Live call. NOT-YET for the real thing; simulate-now-real-later for the screen. The single hardest piece in the whole vision.**
What it does: listens to the call (audio in memory only, never stored), streams one-line offers as the conversation flows - each a one-click accept - and keeps everything prepared one tap away, promoting the best-matching card automatically. Why it's different in kind, not degree: everything built so far is ask-wait-answer - a request goes out, seconds pass, a result comes back. The live call is continuous: audio streaming in constantly, speech recognized as it happens, prepared cards matched against the conversation in under a second, generation on demand mid-sentence. The current stack (request/response server, database store) has none of that; it needs a streaming runtime, an audio pipeline, and a latency budget nothing else in the app has ever had. The honest intermediate step - which the data contract itself anticipates - is a replay harness: build the real two-zone screen and drive it from a scripted, pre-recorded session. That demos the concept perfectly, lets card-matching be tuned offline, and defers only the genuinely hard part. One more reason not to rush it: the concept itself flags that a live answer-suggesting surface is a brand-sensitive thing that should stay behind controlled access until its framing is settled.

**Stage 6 - Post-mortem. Executable now with one honest caveat. Small-to-medium.**
What it does: takes the distilled record of what was asked and answered, finds where answers stumbled and drafts better ones, and finds things the person said that their CV data doesn't yet contain - proposing each as an accept-or-dismiss addition. The machinery is all familiar: two AI passes plus the same accept/reject decision pattern the job-triage screen already uses. The caveat: its automatic input only exists once Stage 5 does. But it works genuinely - not as simulation - with a manually written record: the person types in afterwards what was asked and roughly what they answered. That's a real, useful tool on day one, and it becomes automatic later. One dependency to note: the "feed new facts back into the CV data" half connects to the already-logged CV-intake/datafact-mint follow-up - they should land as one thought.

**Build order within the area:** 1 -> 2-thin -> 3 -> 4 -> 6-manual, then 2-full (the drill loop), then the Stage-5 replay harness, and live audio last of all.

---

## The two structural decisions

**Multi-user identity: defer, with a named trigger.** The data contract was deliberately written so multi-user is additive - every case already carries an owner field, and the person's CV facts are referenced by pointer rather than copied into cases, so scoping per-user later changes data, not shape. Nothing in interview-prep, the opportunity tools, or the network tools needs a second real login. The areas that do need real second humans - coach-facing Case Record, Coach Network, Network Match, Community, and the cross-user learning layer - ship as labelled demos with the fixture coach cast until then. The trigger to build identity, refined by D9: **identity (login, roles, permissions) is built when a pilot coach needs the *in-app* coach surface** - not merely when a pilot coach signs on. Building login, roles, and permissions before an in-app coach surface is actually needed is speculative infrastructure for users who don't exist. (Recorded as D4, refined by D9.) **D9 carve-out:** Daniel has signed on as the first pilot coach through a **messaging bridge** (Telegram first) rather than an in-app surface, so **Coach Review flips real now** - request and response both real, responses attributed "Daniel (pilotcoach)", no in-app login required. Coach Network's directory, the coach-facing Case Record, Network Match, Community and the learning layer stay labelled demos until the in-app trigger.

**The generic collection/storage region: needed soon, and by most of the map.** Interview-prep needs it not at all - that's exactly why it's the most native area. But nearly everything else does: each of these tools is, in storage terms, "a new kind of record the store doesn't have a home for yet" - activity events (Progress Support), companies (Company List), blind-application records, outreach contacts, resources (Knowledge Hub), feedback items, market signals (Job Radar), the coach-competence table, and - immediately - the application card that Ansökningskoll needs defined this week. The decision is whether to hand-build each one or define one small generic mechanism ("create a named collection, with the same honest loading/error states everything else has") once. Recommendation: make the decision as part of defining Ansökningskoll's application card - it's the first customer, and it's already the current work item. Every collection-backed tool after that gets cheaper. (Recorded as D5.)

---

## The dependency-ordered map of the Kind-3 areas

Ordered so nothing appears before what it needs.

### First, because time is data:

**Progress Support** - quietly logs everything the person already does in the tool (job approved, CV generated, letter saved), and turns it into one clear next step and a gentle weekly view. Needs: the generic storage decision (it's the activity log's home). Tier: NOW. Ordering rationale: every week it isn't logging is data the future learning layer loses forever - and it feeds the rebuilt Home.

**Scheduled discovery** - runs the job search on a timer instead of by hand. Its blocker (a database that survives restarts) is already resolved. Tier: NOW.

### Pure wiring over built backends (no new storage, no identity):

**Research Helper** - an intake form and a reader over the already-live company researcher: "should I even apply?" before investing effort. Tier: NOW, and the best value-per-day item on the board.

**Interview-prep stages 1-4 + 6** - as sized above. Tier: NOW (Stage 2's full version is the one heavy lift).

**Interview Trainer (text)** - a realistic practice interview grounded in the real job, real CV, real gaps and real research, with honest feedback that cites what the person actually said. Needs: nothing new - it's the existing generation and analysis machinery in a chat shape. The spoken layer rides free browser voice APIs after. Tier: NOW. Kills the fake recording screen.

**Case Record (jobseeker-facing)** - one chronological reading view over everything the case already holds. Tier: NOW. The coach-facing variant waits for the in-app coach surface (the identity trigger, D4/D9) - the messaging bridge that makes Coach Review real does not provide it.

**Home rebuilt** - one next action, honest counts, quiet entries; every dead button dies. Needs Progress Support. Tier: NOW.

### Collection-backed tools (after the storage decision):

**Company List** - the person's own employer wish-list; add a company, one click researches it, live ads crosslink. Cheapest real tool in the suite. Tier: NOW.

**Blind Applications** - pick a company with no published role, research it, choose the CV angle that fits, draft a guardrailed first message, plan the follow-up, log the outcome. Person types the recipient; no scraping people, permanently. Tier: NOW. Needs Company List.

**Outreach Plan** - who to contact, why, in what order, with drafts and follow-up dates, on a simple kanban. Tier: NOW.

**LinkedIn Helper** - checks and improves what the person was going to post or send anyway, then walks them to the send button and stops; their finger does the posting. Tier: NOW.

**Knowledge Hub** - a small, honestly-counted library of genuinely useful resources with an assistant under every item. Tier: NOW (small and honest beats big and fake).

**Feedback Loop** - suggestions, upvotes, one real poll (results only after voting). Tier: NOW.

**Image Studio** - same face, better photograph: enhance the real photo's quality, light and background; never alter identity. Rides open-source components. Tier: NOW.

### Split-tier and demo areas:

**Jobbradar** - watches market signals, builds weekly target lists, checks them against the person's field, turns a signal into an action. Two signal sources are real today (hiring-volume changes computed from job data already pulled, plus a curated news digest): NOW. The rest of the vision - tenders, investments, leadership changes - is paid-data: SIM as labelled concept cards inside the otherwise-real screen.

**Rejection-learning** - learns from why the person rejects jobs and proposes filter rules, always shown before applied, always reversible. Machinery-wise buildable, but deliberately gated: it's safety-critical and waits on the spend limit that lets the multi-agent adversarial review run. Tier: NOW-but-gated - the gate is a review budget, not missing tech.

**Doc-to-datafacts extractor + CV intake** - turns the person's existing documents into verified CV facts (and gives citation chips their teeth). Tier: NOW; pairs with interview-prep Stage 6's harvest.

**Omställning / re-skilling area** - the career-change fork: find a new direction, fund it, test it, always with "apply now anyway" beside it. Has its own build plan on its own track; runs on free open public data. Tier: NOW per that plan.

**Network Match** - finds any human connection between the person and a target company. Needs data that doesn't exist (coach-skills graph, consented histories). Tier: SIM - the demo defines the data contract the real version will need.

**Coach tools (Coach Network, Coach Review, coach-facing Case Record, Transition View)** - the human-anchoring surfaces. All frontends buildable now; each flips real by changing data, not code when a real coach replaces a placeholder. **Split by D9:** **Coach Review is now real-via-bridge** (NOT SIM) - Daniel is the first pilot coach, reachable through a Telegram-first messaging bridge, so its request and responses are real and it carries no banner. The **Coach Network directory stays SIM** (one real row - Daniel - among three placeholders; a single coach is not a searchable network, so the directory keeps its banner). The **coach-facing Case Record and Transition View stay SIM** - they need the in-app coach surface (the identity trigger), which the messaging bridge deliberately defers. So this cluster is no longer uniformly SIM, and the identity trigger point now means "needs the in-app coach surface," not "a pilot coach exists."

**Knowledge Hive + Outcome Engine** - the learning layer that sees across everything and learns which help actually works. It requires accumulated real usage to exist; faking it functionally is the one dishonesty the project forbids. Tier: SIM (with the one real row of true store counts), real last - but it's fed by Progress Support starting now.

**Community** - the peer layer. A real product in itself. Tier: SIM now; the self-host-vs-build decision is deliberately later.

### Not-yet:

**Interview-prep Stage 5, live** - as flagged: different runtime, hardest piece, replay harness first, controlled access when real.

**Live Support (coach meeting intelligence)** - building meeting intelligence before a single real meeting exists in the system is effort in the wrong order. Concept panel until the coach pilot.

**Native phone app** - the PWA covers it; pay the native tax only if real usage proves the PWA can't do something. Not-yet by design.

**Fine-tuned models** - parked invisibly; nothing to picture.

---

**The one-sentence shape of the whole map:** make the storage decision inside Ansökningskoll's current work, start Progress Support logging immediately, build interview-prep's five cheap stages while the coach side stays honestly fixture-cast, and treat the live call as the summit - approached via replay, attempted last.
