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

## Persona note (already in the seed, restated because it interacts with D3)
New/rebuilt screens use the real persona (Daniel Oskarsson, iGaming/marketing) with real data. The Amir Hassan fixture persona survives ONLY inside labelled demo screens. No new Amir content.

## Order of work (the reconciled priority path)
Stream 2 PR review -> merge -> **D1+D2 work package** (database + served backend + evidence-pool repatriation) -> Jobbsök rebuilt as the approval screen (reads the backend jobs store; kills the browser-direct external calls) -> CSV upload UI -> Ansökningskoll -> honesty pass incl. D3 banners -> then the seed's Stream 3 order (Foundation -> Matching -> Network -> Market/learning), depth over breadth.
