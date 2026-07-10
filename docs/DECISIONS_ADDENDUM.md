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
The contract is multi-user-additive (every case carries an owner field; CV facts are referenced by pointer, not copied into cases), so per-user scoping later changes data, not shape. Nothing in interview-prep, the opportunity tools, or the network tools needs a second real login. The coach-facing surfaces (Case Record coach view, Coach Review, Coach Network, Network Match), Community, and the cross-user learning layer ship as labelled demos with a fixture coach cast until the trigger. TRIGGER (refined by D9): identity — login, roles, permissions — is built when a pilot coach needs the **in-app** coach surface, not merely when a pilot coach signs on. The messaging bridge introduced in D9 exists precisely to defer that: Daniel acts as pilot coach through an external messenger with no in-app login. Building identity infrastructure before an in-app coach surface is actually needed is speculative infrastructure for users who don't exist. **Carve-out (D9):** Coach Review flips real *via the messaging bridge* without waiting for this trigger — its responses are real human judgment attributed to "Daniel (pilotcoach)"; the Coach Network directory and every other coach-facing surface stay labelled demos until the in-app trigger.
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

## Persona note (already in the seed, restated because it interacts with D3)
New/rebuilt screens use the real persona (Daniel Oskarsson, iGaming/marketing) with real data. The Amir Hassan fixture persona survives ONLY inside labelled demo screens. No new Amir content.

## Order of work (the reconciled priority path)
Stream 2 PR review -> merge -> **D1+D2 work package** (database + served backend + evidence-pool repatriation) -> Jobbsök rebuilt as the approval screen (reads the backend jobs store; kills the browser-direct external calls) -> CSV upload UI -> Ansökningskoll -> honesty pass incl. D3 banners -> then the seed's Stream 3 order (Foundation -> Matching -> Network -> Market/learning), depth over breadth.
