# DECISIONS ADDENDUM - reconciling the kickoff seed with the master state

**Date:** 2026-07-03. **Status:** decided by Daniel. This addendum sits alongside `BUILD_KICKOFF_SEED.md` and `MASTER_PRODUCT_DESIGN_SPEC.md`; where they are silent or say "decide later," this document is the decision. All streams (Design, Bridge, Build) read this.

## D1 - Persistence: a real database, NOW (not later)
The seed said "decide persistence" and Stream 2 was advised to keep in-memory for the first bridge pass. That was correct for the bridge - and the decision is now made: the real-DB swap is the next work item after the Stream 2 PR merges. The store interface (`createStore()` signatures) was built for a single-adapter swap; nothing above the store changes.
**What each stream does with this:** Bridge/Build - do not add any new code that assumes in-memory (no "reseed on every boot" logic beyond what exists; everything goes through the API). Design - nothing; invisible to design.

## D2 - The evidence pool comes INTO the repo
The canonical `cv_data.json` currently lives in the sibling `JobSearch/` folder, outside this repo, and the two English copies differ (the seed script's "content-identical" comment is false). Decision: diff the two copies, the enriched `cv-source/en` copy is expected canonical, bring the file into this repo (gitignored is acceptable; outside-the-repo is not), point `scripts/seed-datafacts.cjs` at the in-repo path, delete the false comment. This lands with the D1 work.
**What each stream does with this:** nothing yet - do not "fix" the seed path independently; it is part of the D1/D2 work package.

## D3 - The demo screens stay, LABELLED
The 9 Amir-persona demo screens (home, cv, letter, interview, activity, library, review, studio, community - and the coach view's fixture content) remain in the app and in the nav, each with a small visible banner: **"Demo - exempeldata"**. The ComingSoon tier stays as-is (already honest). A screen loses its banner only when it is rebuilt on real data.
**What each stream does with this:** Design - the banner is a design element; include it in the design system usage (one consistent placement/style) and show it on any demo-tier screen you design. Build - when touching a screen, it must end in exactly one state: wired-real (no banner) or labelled-demo (banner). Never in between, never unlabelled fixture data.

## D4 - Multi-user identity: DEFER with a named trigger
The contract is multi-user-additive (every case carries an owner field; CV facts are referenced by pointer, not copied into cases), so per-user scoping later changes data, not shape. Nothing in interview-prep, the opportunity tools, or the network tools needs a second real login. The coach-facing surfaces (Case Record coach view, Coach Review, Coach Network, Network Match), Community, and the cross-user learning layer ship as labelled demos with a fixture coach cast until the trigger. TRIGGER (first refinement, D9 — superseded, kept as history): identity — login, roles, permissions — is built when a pilot coach needs the **in-app** coach surface, not merely when a pilot coach signs on. TRIGGER (second refinement, per D13, 2026-07-11, current): identity (login, roles, per-person data isolation) is built before the first real case that is not Daniel's exists, whichever path fires first, or when a pilot coach needs the in-app coach surface, whichever comes first. The messaging bridge introduced in D9 exists precisely to defer that: Daniel acts as pilot coach through an external messenger with no in-app login. Building identity infrastructure before an in-app coach surface is actually needed is speculative infrastructure for users who don't exist. **Carve-out (D9):** Coach Review flips real *via the messaging bridge* without waiting for this trigger — its responses are real human judgment attributed to "Daniel (pilotcoach)"; the Coach Network directory and every other coach-facing surface stay labelled demos until the in-app trigger.
**What each stream does with this:** builder ships coach-facing and community surfaces with a fixture coach cast (labelled demo), never a real second login, until a pilot coach needs the in-app surface; planner treats every "needs a second real human, in-app" area as SIM-tier until that trigger. (D9 updates this: Coach Review is real-via-bridge, not SIM; Coach Network directory and the other coach-facing surfaces remain SIM until the in-app identity trigger.)

## D5 - Generic collection/storage mechanism: BUILD ONE, decided inside the Ansökningskoll wave
Nearly every Kind-3 tool needs "a new kind of record the store has no home for" (application cards, activity events, companies, outreach contacts, market signals, resources, feedback, the coach-competence table). Rather than hand-build storage per tool, define one small generic named-collection mechanism with the same honest loading/error states everything else has. First customer: Ansökningskoll's application card (the current build). Every collection-backed tool after that gets cheaper.
**What each stream does with this:** builder defines the generic named-collection mechanism in the Ansökningskoll wave (application card = first instance), then every later collection-backed tool uses it; planner treats "needs a new kind of record" as solved-by-D5.

## D9 - Daniel signs on as the first pilot coach (the messaging-bridge model)

**Numbering note (read before citing this number):** D6-D8 are skipped deliberately. This addendum's own reconciliation decisions run D1-D5, but the Omställning area design doc (`HelloLilly_Omstallning_Area_v2.md`, referenced from `docs/product-vision/HelloLilly_Integration_Breakdown.md` as holding "decisions D4-D8") claims D4-D8 in its own scope. To never collide with that range, this decision takes the next number clear of both schemes: **D9**. (The pre-existing D4/D5 overlap between this addendum and the Omställning area is a real, prior numbering collision — flagged as a ripple effect, not resolved here.)

**The decision.** Daniel signs on as HelloLilly's first pilot coach. This fires the D4 trigger — and it is **not simulation**. Review responses are real human judgment from a real person with 25 years of hiring and product leadership, attributed as **"Daniel (pilotcoach)"**, never as a fixture persona and never as the Amir-era "Sara" cast.

**The coach interface is a messaging bridge, not an in-app coach surface.** When a review request is created, a notification reaches the coach's messaging channel; the coach's reply returns and is stored as the review response. The channel is **pluggable**. First channel: **Telegram** (bot API — lightest setup, no tenant admin). Teams is an acceptable later swap. WhatsApp only via the official business route, and only if it is ever needed.

**Why the bridge, not an in-app surface.** It exercises the flip-to-real mechanism exactly as designed — data changes, not code — resolves the F4 banner-placement question (see `REST_OF_SITE_RECONCILED_DESIGN.md` §6, item 1), and deliberately avoids building login, roles and permissions for users who do not exist. This sharpens the D4 trigger: identity infrastructure is built when a pilot coach needs the *in-app* coach surface; the messaging bridge exists precisely to defer that.

**Privacy flag (must be revisited).** A review request carries CV content through a third-party messenger (Telegram first). This is acceptable **only while the only jobseeker data in the system is Daniel's own** — his data crossing a channel he controls. It **must be revisited before any second real jobseeker exists**: another jobseeker's CV must not transit a third-party messenger without an explicit data-handling decision.

**What each stream does with this:**
- **Build** — Coach Review's request flow AND its responses are real via the bridge; the banner comes OFF that flow. The coach-channel adapter is a small work item alongside Wave 2 (notification out on a new review request, reply in becomes the stored response, channel pluggable, Telegram first) — product-level only this session, no adapter code. Coach Network's *directory* keeps its demo banner (one real coach is not a searchable network); one fixture cast member is replaced by Daniel's real row (iGaming, digital product leadership, C-level hiring).
- **Design** — "Daniel (pilotcoach)" is a real-data attribution, not a demo state; the Coach Review response section loses its demo label.
- **Planner** — Coach Review moves from SIM to real-via-bridge; the Coach Network directory stays SIM.

## D10 - Reuse review of an external outbound-communication design (five adopted, one rejected, five parked)

**Date:** 2026-07-09. **Status:** decided by Daniel. (D10 is the next decision number after D9, clear of both this addendum's D1-D5 line and the Omställning area's D4-D8 range.)

**Amendment pointer (added with D21, 2026-07-16):** D21 narrowly amends the standing "no scraping of people or LinkedIn" refusal — cookie-free enrichment of a coach's own network, run by/for the coach on her own data, is permitted; the refusal stands for everything else. (The refusal itself is stated in `HELLOLILLY_REST_OF_SITE_PLAN_v3.md` §6 and the reconciled design's refused-on-principle list, not verbatim in this D10 entry — pointer placed here per the D21 instruction, which treats it as D10's reaffirmed refusal.)

Daniel reviewed an external outbound-communication design of his own — a separate product, a separate repo — for reusable ideas. This decision records what transferred. Nothing here touches work in progress (Wave A, Wave B, interview-prep); every adoption lands on the still-unbuilt Wave 2+ tools. The external project is referenced only at this level — no name, no file paths.

**Adopted (five; specced in `REST_OF_SITE_RECONCILED_DESIGN.md` and `REST_OF_SITE_DATA_CONTRACT_ADDENDUM.md`):**
1. **E1 verdict discipline** — every LinkedIn Helper check ends in exactly one verdict (SEND / SEND WITH ONE REVISION / HOLD); when it is SEND the tool offers nothing further, because permission to stop IS the product; one revised version per pass, never a menu; Pass 3 is hard-coded affirmation, never a model call; low-stakes honesty is mandatory.
2. **Intake before compose (B2 + E2)** — when the person is frozen (no draft, no clear direction) a short capacity/intent intake runs before ONE draft is built; capacity constraints are hard and "not today" is a legitimate, closable outcome, never rendered as failure; the tool gets the person to write rather than writing for them.
3. **E2 social rule named per fix** — every revision names, in one sentence and at the moment of the fix, the unwritten social rule it applied ("first messages ask for advice, not jobs"); a per-person pattern library is deferred, not built now.
4. **voiceProfile (STORED, addendum §18b)** — a user-editable record of how the person *sounds* (register, formality, phrases, language mix), consumed only by drafting paths and never by checkers (input-separation rule, normative).
5. **outreach contact-class register (addendum §6, also available to B2's recipient step)** — an optional recruiter / former-colleague / cold-senior / referral hint informing register and which social rules apply; honest default in its copy: toward recruiters the person is senior talent, not a supplicant, and not replying to low-effort outreach is a valid choice.

**Rejected (one):** a landed-outcome track record ("your last N messages landed fine") is REFUSED for outbound. Cold outreach mostly receives no reply and that is normal; a landed-statistics surface would render normal silence as failure feedback to exactly the population these tools protect. The mechanism works for inbound reply-checking products; it does not port here. (Also recorded in E1's refused list.)

**Parked, not lost (five; inputs to the later architecture-rules work, one line each):**
1. An **anti-blame output gate** as a tested requirement — prose-producing tools speak in mechanism-language, never trait attributions.
2. An **injection envelope** for untrusted pasted/fetched text entering prompts.
3. **Maker/checker context separation** named as a standing invariant (the voiceProfile input-separation rule is its first local instance).
4. An **eval corpus with zero-tolerance classes** for prose-producing tools.
5. An **AI Act governance review** of the coach-facing surfaces.

**What each stream does with this:**
- **Build** — nothing new in flight; the five adoptions land when the Wave 2+ tools (E1, E2, B2) and their data shapes are built; the parked five are inputs to the architecture-rules session, not this build.
- **Design** — E1's single-verdict UX, the frozen-person intake, and the per-fix social-rule line are design commitments now.
- **Planner** — treat the parked five as named work items for the architecture-rules wave.

## D11 - The Help Layer (right column): the crosslink panel + the assistant, Lilly

**Date:** 2026-07-09. **Status:** decided by Daniel. (D11 is the next decision number after D10, clear of both this addendum's D1-D5 line and the Omställning area's D4-D8 range.)

The right-hand column — the situation-aware help panel and the conversational assistant above it — is approved as one design object and wired into the docs of record. **Spec of record: `docs/HELLOLILLY_HELP_LAYER_CONCEPT.md`.** The decision core, one paragraph each:

**Two layers, one object.** The deterministic **crosslink panel** is the floor — no LLM, rule-based, tier **T1**: it reads screen + case state + active part and resolves a small set of slots against content other tools already produce. The **conversational assistant** is the layer above it — tier **T2, deliberately thin at v1**: LLM via API plus retrieval over the tool registry (`TOOL_SPECS`), the case read models (`homeSummary`, `caseRecord`) and the library. The Knowledge Hub's per-item assistant is NOT a separate thing — it is this same assistant opened with a resource in context. Unified.

**The model decision: API LLM plus retrieval; no bespoke local model at MVP.** The strategy paper already decided this (Section 7: an off-the-shelf model made better by the crosslinked knowledge base; selective fine-tuning only later where it clearly earns its place), and the master plan parks fine-tuned models as not-yet. A local model would multiply the Image Studio hosting question and deliver worse Swedish; the API-privacy dimension belongs to the parked AI Act / governance review, not to this decision.

**The panel resolution rule (normative).** A slot renders only if it resolves to real content — no placeholder slots on real screens. Fixture slots exist only under a T4 demo banner. The panel is honest by construction: it can never promise help that is not there.

**Posture rules — the full set lives in the concept doc (§5); two are named here because they are system-wide law.** (a) **The assistant never re-litigates another tool's verdict or refusal** — when E1 has said SEND and the person asks "but is it really okay?", Lilly does not offer a fresh review; the pass ceiling is system-wide or it is nothing, and the same holds for every tool's honesty gate. (b) **Suggestions, not actions** — Lilly navigates, prefills and drafts handoffs; the person confirms every write and every send, always. No autonomous writes, ever.

**The assistant's name: Lilly.** Confirmed by Daniel, 2026-07-10. The product is HelloLilly; the assistant is the Lilly you say hello to — the brand becomes a person you can talk to, the spoken-mode promise made literal. Reflected in the concept doc itself.

**Open items (recorded here, not silently resolved):**
- **Conversation persistence** — transient at v1; durable conversational memory is learning-layer territory and waits for it. (Confirm.)
- **Mobile collapse pattern** — the panel's behaviour on mobile is Design's call in its wave.

**What each stream does with this:**
- **Build** — the panel builds **with the Wave 1 frontend screens** (it is already drawn on every work-screen wireframe; its rules registry is small, code/config not AI). **Lilly is her own small wave after Progress Support Wave B**, because she needs Progress Support's next-step rules (Wave B) and the read models (`homeSummary`, `caseRecord`) to exist first. No Help-Layer code this session — product-level integration only. (Two ◇ instrumentation rows the concept proposed for §T — `help.opened`, `help.item_used` — were evaluated against §T's emission philosophy and **NOT** added; see `REST_OF_SITE_DATA_CONTRACT_ADDENDUM.md` §T.)
- **Design** — the panel ("Hjälp just nu") is a first-class surface on every work screen, not decoration; Lilly's posture rules (quiet by default, one suggestion at a time, the honesty gate, anti-blame, suggestions-not-actions, upholds-verdicts) are design commitments now.
- **Planner** — the panel is a Wave 1 build item (it had none before — the most important part of the system had no spec until the concept); Lilly is sequenced after Wave B with her dependencies named.

## D12 - The Architecture Rules Addendum adopted as standing law

**Date:** 2026-07-11. **Status:** decided by Daniel. **Spec of record: `docs/HELLOLILLY_ARCH_RULES.md`.** (D12 is the next decision number after D11, clear of both this addendum's D1-D5 line and the Omställning area's D4-D8 range.)

The Architecture Rules Addendum is adopted as standing law, extending the four architecture non-negotiables (store, templates, status envelope, honesty gate). It is a spec of record, not machinery: this decision commits the law; the pre-commit hook and the eval harness it names are future build items. The addendum, one line per part:

- **Section 0 - enforcement vocabulary (binds every rule).** INVARIANT (deterministic, code/schema/CI-enforced) vs DISCIPLINE (semantic, judge- and regression-enforced, never described as a guarantee); the universal failure disposition - when any runtime gate fails or cannot run, the status envelope goes to **failed** with honest error copy, never to a result and never to a refusal (the presend transport-vs-refusal split, generalized); enforcement tiers stated per path, and claiming the wrong tier is itself a violation.
- **Rule 1 - the anti-blame gate.** Prose locates defects in the artifact, the gap or the market mechanism, never in the person's character; a named non-exhaustive list of banned channels, each carrying eval cases. The truth clauses bound it: evidence-backed positive traits are required work, verified conduct may be stated neutrally with its citation paired to a mechanism next-step, hard market truths are stated as mechanisms, and self-blame is never mirrored back as trait confirmation.
- **Rule 2 - the injection envelope and transitive provenance.** INVARIANT: every stored record carries provenance, untrusted-derived taint is transitive and permanent, one named module owns prompt assembly and envelopes untrusted/untrusted-derived content by provenance, and model output is schema-validated before it renders/writes/relays. DISCIPLINE: adversarial eval cases per ingestion class. No inertness guarantee is implied.
- **Rule 3 - maker/checker separation.** INVARIANT: generation and judgment are separate calls with an enumerated prohibited shared state and a written input contract per judge. The artifact clause closes the reviewers' gap - the checker's input artifact is model-written, therefore untrusted-derived under Rule 2, therefore enveloped inside the checker's prompt. The checker never sees voice; a smaller checker model is allowed.
- **Rule 4 - the eval corpus, corpus integrity, the lightened frozen zone.** Deterministic workflow properties are proven by ordinary integration tests; the corpus covers model-invoking behavior only and is a regression tripwire, never certification. Zero-tolerance classes (fabrication, banned blame channel, compliance with enveloped instructions, verdict-discipline violation) run three-run minimums. Corpus-integrity INVARIANT: a change passes the UNCHANGED prior corpus plus approved additions; weakening a case is its own logged event; a failing baseline is fixed forward, never by deletion. The frozen zone is lightened: the RUN is automated (a pre-commit/CI hook blocks prompt/eval changes unless the eval passes), the EDIT gate stays human (Daniel plus a strong model).
- **Section 5 - inference surfaces and the real-persons gate.** The inference-surface registry (INVARIANT) is ONE machine-readable file listing every path that writes/renders an interpretation of the person's state; known members are the Transition Compass confidence capture, Transition View coach prompts, and the Outcome Engine per-group analyses. The real-persons gate (REFUSAL) bars any non-demo use by any real jobseeker other than Daniel of any inference surface or ledgered legacy path until the governance review is recorded done AND the retrofit ledger is empty; demo use continues freely.

**Provenance.** D10 parked five architecture inputs (anti-blame gate, injection envelope, maker/checker separation, eval corpus with zero-tolerance classes, AI Act governance review) -> a v1 draft -> two independent adversarial reviews (two reviewers) -> reconciliation by the planner (2026-07-11) -> this adoption. Both reviewers independently found the same structural fault (semantic goals declared as invariants without deterministic enforcement); v2's INVARIANT/DISCIPLINE split is the reconciled cure.

**The three confirmed calls (Daniel, 2026-07-11).** (1) Two-tier enforcement: runtime gates only where a judge already sits in the path, regression evals elsewhere, tiers stated per path - no universal runtime frame-judge at MVP. (2) The real-persons gate: no real jobseeker beyond Daniel touches inference surfaces or ledgered legacy paths until the governance review is recorded and the retrofit ledger is empty. (3) Synthetic-only eval fixtures, binding immediately.

**Artifacts created with this decision.** `docs/RETROFIT_LEDGER.md` (the shipped paths predating the rules: the letter writer, the presend judges, Matchanalys prose, the A1 researcher prompts) and the machine-readable inference-surface registry (`docs/inference-surface-registry.json`).

**What each stream does with this:**
- **Build** - every NEW prose or prompt path binds from adoption; enforcement-tier marking is required in new/edited design entries; the pre-commit hook and the eval harness are named future build items, not yet built.
- **Design** - the banned blame channels (Rule 1) are copy commitments, including fixture content.
- **Planner** - the retrofit ledger is consulted at every wave brief; the real-persons gate is a standing precondition for any pilot planning.

## D13 - The Phase-After Plan adopted as the doc of record for the governance review

**Date:** 2026-07-11. **Status:** decided by Daniel. **Spec of record: `docs/HELLOLILLY_PHASE_AFTER_PLAN.md`.** (D13 is the next decision number after D12, clear of both this addendum's D1-D5 line and the Omställning area's D4-D8 range.)

The Phase-After Plan is adopted as the doc of record defining the governance review that D12 §5's real-persons gate waits on, sequencing the second human's arrival, setting the learning-layer threshold, and shaping the pilot. The binding content, one line each:

- **Provenance.** A v1 draft -> two independent adversarial reviews (two reviewers) -> reconciliation by the planner (2026-07-11) -> Daniel's three calls the same day: the padlock rule, the identity-trigger refinement (see D4 below), and a pilot-agreement precondition reviewed and **DROPPED as premature** - recorded here so the review finding stays traceable; it binds nothing.
- **The review's hardened done-when.** Every section carries an affirmative per-surface disposition; the gate opens only with zero unresolved blocking conditions and every blocking mitigation implemented and tested; the legal sections carry sign-off by a named, funded professional qualified in EU data/AI law.
- **The binding non-demo definitions.** Non-demo use begins the moment any real person other than Daniel has data entered, a case created, or an output applied; "applied" means any output that selects, changes, prioritises or communicates an action for an identifiable person; real-derived (pseudonymised, composite, LLM-recast) is real, never synthetic.
- **The fixture-sandbox rule (Path A).** A pilot coach interacts with fixture jobseekers only - never Daniel's real inferred state, never a pasted real CV - until Path B's preconditions are met; demo-tier tools are role-inaccessible to coach accounts.
- **The k >= 5 floor.** INVARIANT once built: no real-data aggregate visible to anyone other than the data's own person may describe a cohort or cell of fewer than five people.
- **The padlock rule.** Daniel's personal deployed instance runs real data behind HTTPS plus an access lock plus tested 2c basics; unattended demo URLs are synthetic-only; demos Daniel runs from his own screen use real data.
- **The stop conditions (fail-closed).** A data incident, a rights-request failure, a harmful unsupported output reaching a real person, or any gate-invalidating change pauses all non-demo use; restart requires recorded approval.

**What each stream does with this:**
- **Build** - the real-persons gate's consumer is now defined; no non-demo use before the review is done and the retrofit ledger empty; the plan's definitions of non-demo, "applied" and real-derived bind every demo and deployment.
- **Design** - "compliant by design" is banned from all surfaces and documents until the review exists to back it.
- **Planner** - the plan's §2 review sections, path preconditions and stop conditions are standing preconditions for any pilot planning; the D4 trigger reads as refined below.

## D14 - The advocacy principle: advocate, do not audit

**Date:** 2026-07-14. **Status:** decided by Daniel. **Full reasoning: `HELLOLILLY_NORTH_STAR.md` §6 and `WALKTHROUGH_FINDINGS_COMPLETE.md` §2 (not duplicated here — mirror-goes-stale).** (D14 is the next decision number after D13, clear of both this addendum's D1-D5 line and the Omställning area's D4-D8 range; D15-D18 continue from it.)

The tool advocates FOR the jobseeker; it does not audit them. Three commitments: maximum truthful strength, warn-do-not-block (never censor the user's own judgement in honesty's name), and end-to-end honesty with the interview-prep tools sharing one state. This reframes the walkthrough's central failure — a tool performing honesty AT the user in a compliance-auditor voice. It governs HOW content is adapted and gaps are filled, operating inside the CV handoff boundary D15 sets.

## D15 - The CV builder: in scope, built as a separate side project, then integrated

**Date:** 2026-07-14. **Status:** decided by Daniel. **Full reasoning: `HELLOLILLY_NORTH_STAR.md` §2 and §7.**

There MUST be a CV builder in HelloLilly (the strategy paper lists it as a first-class Execution tool) — but it is built as a SEPARATE SIDE PROJECT, after the current work, then integrated soon (not someday). Its spec comes from accumulated material via another agent (see the accumulation brief, `HELLOLILLY_BACKLOG.md`). Until it lands, the working assumption stands: the CV builder and templates EXIST (the original machinery is the stand-in), and HelloLilly's job is to hold the content base, create adapted content, fill gaps, and hand off to the templates. Supersedes the CV-architecture fork (findings doc, Decision 1), now dissolved.

## D16 - Build doctrine: replace, do not repair

**Date:** 2026-07-14. **Status:** decided by Daniel. **Full reasoning: `HELLOLILLY_NORTH_STAR.md` §5b.**

Cheap reimplementations of proven tools (the live "Skapa anpassad CV" step is the clear case) are NOT patched — a tool wrong at birth is an endless negotiation with a broken architecture. Instead: proven engines behind, Claude Design screens in front, disposable plumbing between. Reuse a proven original where it can be called; where architecture forces a rebuild, judge it by the outcome-parity standard (same input, same outcome as the original). Boundary: this governs REIMPLEMENTED tools only; new-ground capability (datafact pool, gap-fill loop, honesty gates, store) is evolved, not replaced.

## D17 - Information architecture: the two CV tools get two menu items

**Date:** 2026-07-14. **Status:** decided by Daniel. **Full reasoning: `HELLOLILLY_NORTH_STAR.md` §5c.**

The builder/tailor split becomes visible in the nav. CV-BYGGAREN = the job-independent builder (the D15 side project); until it lands its menu item sits in the honest-disabled "Kommer" state, reserving the slot. ANPASSAD CV = the job-bound tailor (content-only adaptation within a locked template). Near-free first move: the current "CV-byggaren" menu item is mislabelled — it opens the per-case tailored draft — so rename it to Anpassad CV (the nav then tells the truth) and add CV-byggaren as the reserved "Kommer" item. Standing boundary: the tailor never gains structural powers; the builder never becomes job-aware.

## D18 - Progress Support Wave B deprioritised

**Date:** 2026-07-14. **Status:** decided by Daniel. **Full reasoning: `WALKTHROUGH_FINDINGS_COMPLETE.md` and `HELLOLILLY_NORTH_STAR.md` §7.**

Off the back of the first real-user run reading the real activity log, Wave B (the fuller Progress Support surface) is deprioritised: it is no longer the automatic next wave but one undecided candidate among several, to be sequenced against `HELLOLILLY_NORTH_STAR.md` (see the master plan's NOW section). No new order is chosen here. Wave A — the activity collection it depends on — remains merged and done.

## D19 - Adversarial-review regime for build briefs

Large waves and doctrine documents get hostile external review before build; Wave 1 passed FIT TO BUILD after six rounds (40 -> 27 -> 11 -> 4 -> 2 -> 0 findings). Records: `docs/reviews/wave1/`.

## D20 - Daniel's ratifications of 2026-07-16

**Date:** 2026-07-16. Three parts: (a) real-content parity material is a LOCAL PARITY REFERENCE, not a fixture - D12's synthetic-only fixture invariant stands untouched; (b) career biography remains committed-by-design per the standing persona decision, while contact PII, the evidence pool, and captured CV artefacts never enter the repo; (c) the Wave 1 tailor is selection/reordering only - the suggestion engine (AI-drafted bullets from cover letters, interview Q&A and prior answers, human accept-and-mint, bridging under the HIGH-RISK machinery) is the immediate next wave. Full reasoning: `HELLOLILLY_NORTH_STAR.md`.

## D21 - Coach network reach: local vault, edge judge, binary verdicts

**Date:** 2026-07-16. **Status:** decided by Daniel. (D21 is the next decision number after D20, clear of this addendum's D1-D5 line and the Omställning area's D4-D8 range.)

Daniel decided the architecture for coach network reach — **Network Match (E3)** and **Coach Network (F3)** — after a multi-turn design iteration that killed three earlier versions (a contact database; a human-readable coarse index; a centrally-held vault). This is v5. The enrichment route's evidence is attached as a document of record: `docs/COACH_VAULT_ENRICHMENT_BRIEF.md` (an external project's implementation brief, committed unmodified; its conventions are another repo's — see its header).

**The architecture (binding):**
- Each coach exports her OWN LinkedIn connections (the official export) and may optionally enrich them with full career histories via the cookie-free third-party route documented in `docs/COACH_VAULT_ENRICHMENT_BRIEF.md` (proven 2026-07-16, ~$4 per 1000 profiles). Enrichment runs on the coach's own behalf, never on coaches' LinkedIn accounts (no logged-in scraping, ever).
- The full vault (names, URLs, histories) lives encrypted on the coach's own machine ONLY. HelloLilly never receives, stores, queries or has access to vault rows. The vault is the coach's personal professional equity — local ownership is both the legal posture and the adoption story.
- Matching runs at the edge, on the coach's side, with vault content entering the judge inside the injection envelope (D12 Rule 2: profile text is untrusted-derived).
- Only binary verdicts (JA/NEJ) plus opaque row IDs ever transit to HelloLilly. No names, no rows, no descriptive text crosses the boundary. The judge is contracted per D12 Rule 3: it answers yes or no, nothing else.
- On JA the owner coach resolves the opaque IDs locally to her real rows — names and all — judges them, and makes the intro herself from her own LinkedIn. The precision exists in the system but is visible only to its owner.
- Everyone else sees only a uniform sentence ("en förfrågan har gått till en coach" / "ingen träff just nu"). No free-text query interface exists; matching runs only on a case's real need. Both rules guard against probing leakage.
- Enrichment-at-resolution is demoted to an optional note field; nothing depends on it (Daniel's verdict: coverage math kills it as a mechanism at 1000 contacts).

**The refusal amendment.** D10's reaffirmed refusal "no scraping of people or LinkedIn" is AMENDED by D21: cookie-free third-party enrichment of a coach's own network, run by/for the coach on her own data, is permitted per the evidence brief. Named plainly, not hidden: this remains against LinkedIn's platform ToS; the account risk sits with the third-party provider, never on coaches' accounts. The refusal stands unchanged for everything else: no scraping into HelloLilly's own systems, no enrichment of anyone outside a coach's own network, no logged-in automation.

**The legal working hypothesis (for the §2 governance review, per D13's hypothesis discipline — asserted by no one until counsel rules).** The coach acts as independent controller of her local vault (professional activity, not household exemption — stated honestly); HelloLilly is a tool provider processing only verdicts and opaque IDs. Counsel confirms or refutes before any real vault touches the product.

**The gates.** Anything central runs on synthetic vaults only until the governance review; real coach uploads are Path A territory (D13). A new data category = D13 material-change trigger, review scope before reality. Daniel's personal prototyping on his own export, on his own machine, is his own activity outside the product's gates.

**One disposition for traceability.** The evidence brief's acceptance test uses a real person's public profile; Daniel ruled it stays as-is — it lives in the external pipeline's own verification, outside this repo, so HelloLilly's synthetic-fixtures rules (D12/D13) are untouched.

**What each stream does with this:**
- **Build** — nothing now; the vault/judge tooling is post-Path-A work and enters the roadmap when coaches exist.
- **Design** — the E3/F3 screens keep demo tier; the uniform-sentence rule is a copy commitment.
- **Planner** — the §2 review scope gains the controller/tool-provider hypothesis and the enrichment-route question; E3/F3 briefs inherit this architecture.

## D22 - Person-typed material is a first-class source of record

**Date:** 2026-07-21 (ratified by Daniel; recorded 2026-07-25). **Status:** decided by Daniel. **Full text and binding consequences: `docs/WAVE_2_BRIEF_suggestion-engine_v3.2.md` §3.7.** (D22 is the next decision number after D21, clear of this addendum's D1-D5 line and the Omställning area's D4-D8 range.)

What the person types is saved as truth — the SAME trust class as his curated source files, minting without friction (D14 advocate-not-audit). The record states its class honestly: span-grounded or person-attested. The authorship discriminator (a deterministic diff of unsupported tokens against the model's draft) prevents a model invention minting on a bare accept: the model's draft must be span-grounded; only content originating in the person's own wording mints as person-attested.

## D23 - "Who accepted" is attested, not authenticated, until D13 identity fires

**Date:** 2026-07-21 (ratified by Daniel; recorded 2026-07-25). **Status:** decided by Daniel. **Detail: `docs/WAVE_2_BRIEF_suggestion-engine_v3.2.md` §5.4.** (D23 is the next decision number after D22, clear of this addendum's D1-D5 line and the Omställning area's D4-D8 range.)

Accepted as a stated residual for the single-user local product: acceptance events carry nonce binding (accept bound to a served review) and a server-side rate ceiling, but the recorded "who" is attested, not authenticated, until the D13 identity trigger fires. Re-opened the moment a second person or a hosted surface exists.

## D24 - CV-byggaren re-scope (building-only) plus the reconciliation's DECISION 1/2/3

Recorded 2026-08-23 by folding docs/reviews/cv-byggaren/D19_CV_BYGGAREN_RECONCILIATION.md into this log. The reconciliation doc proposed this as 'D23' (2026-07-27) without visibility of the D23 recorded here 2026-07-25; renumbered on folding, per the D14→D21 precedent. The reconciliation doc is preserved as written; this entry is canonical for the number.

## Persona note (already in the seed, restated because it interacts with D3)
New/rebuilt screens use the real persona (Daniel Oskarsson, iGaming/marketing) with real data. The Amir Hassan fixture persona survives ONLY inside labelled demo screens. No new Amir content.

## Order of work (the reconciled priority path)
Stream 2 PR review -> merge -> **D1+D2 work package** (database + served backend + evidence-pool repatriation) -> Jobbsök rebuilt as the approval screen (reads the backend jobs store; kills the browser-direct external calls) -> CSV upload UI -> Ansökningskoll -> honesty pass incl. D3 banners -> then the seed's Stream 3 order (Foundation -> Matching -> Network -> Market/learning), depth over breadth.
