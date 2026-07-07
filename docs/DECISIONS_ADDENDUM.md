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
The contract is multi-user-additive (every case carries an owner field; CV facts are referenced by pointer, not copied into cases), so per-user scoping later changes data, not shape. Nothing in interview-prep, the opportunity tools, or the network tools needs a second real login. The coach-facing surfaces (Case Record coach view, Coach Review, Coach Network, Network Match), Community, and the cross-user learning layer ship as labelled demos with a fixture coach cast until the trigger. TRIGGER: the first pilot coach signs on. Building login/roles/permissions before that is speculative infrastructure for users who don't exist.
**What each stream does with this:** builder ships coach-facing and community surfaces with a fixture coach cast (labelled demo), never a real second login, until the first pilot coach signs on; planner treats every "needs a second real human" area as SIM-tier until that trigger.

## D5 - Generic collection/storage mechanism: BUILD ONE, decided inside the Ansökningskoll wave
Nearly every Kind-3 tool needs "a new kind of record the store has no home for" (application cards, activity events, companies, outreach contacts, market signals, resources, feedback, the coach-competence table). Rather than hand-build storage per tool, define one small generic named-collection mechanism with the same honest loading/error states everything else has. First customer: Ansökningskoll's application card (the current build). Every collection-backed tool after that gets cheaper.
**What each stream does with this:** builder defines the generic named-collection mechanism in the Ansökningskoll wave (application card = first instance), then every later collection-backed tool uses it; planner treats "needs a new kind of record" as solved-by-D5.

## Persona note (already in the seed, restated because it interacts with D3)
New/rebuilt screens use the real persona (Daniel Oskarsson, iGaming/marketing) with real data. The Amir Hassan fixture persona survives ONLY inside labelled demo screens. No new Amir content.

## Order of work (the reconciled priority path)
Stream 2 PR review -> merge -> **D1+D2 work package** (database + served backend + evidence-pool repatriation) -> Jobbsök rebuilt as the approval screen (reads the backend jobs store; kills the browser-direct external calls) -> CSV upload UI -> Ansökningskoll -> honesty pass incl. D3 banners -> then the seed's Stream 3 order (Foundation -> Matching -> Network -> Market/learning), depth over breadth.
