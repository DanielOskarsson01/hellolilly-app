# Application Workflow - Frontend Build Brief (Claude Design)

**From:** Daniel (via planning)
**Source of truth:** `A2_RECONCILED_DESIGN.md` (read it first - this is the frontend half). Build on the delivered design system (tokens, grid, `PageTemplate`/`ContentArea`/`ContentBox`, the load-bearing crosslinking column).
**Parallel build:** the backend (Claude Code) is building the submodules + API at the same time. You meet at the data shapes + API in the reconciled design (§4, §7) - build to those. Screens render on fixtures where the backend isn't live yet, and get wired to real data as each endpoint lands.

## The foundation to build first: the data bridge
Everything reads through it. Build the async data layer (the `useCase()`-style layer the frontend assessment flagged as missing) that reads case parts from the backend API, with proper **loading / error / empty states mapped 1:1 to the data-contract status envelope** (`pending`/`ready`/`failed`/`absent`) - reuse the contract, don't invent ad-hoc states. This is the frontend equivalent of the skeleton; the screens compose on it.

## The screens (use Daniel's naming - reconciliation 2)

Two screens in this workflow (Jobbsök is the separate job-search build):

### Matchanalys - analysis + the fill-gap loop
Adapt `src/screens/match.jsx` onto the design system; the mockup is the look, the data contract is the structure.

- **Verdict block** ← the `fit` part: match ring, one-line verdict, 2-3 line plain summary (capability `overall` + the hard-filter fit read - NOT a desirability read), "Granskad av Lilly" provenance.
- **"Det du har" (what you have)** ← `fit.capability[]` rows with status `match`: requirement, one-line evidence, and a **citation chip** ("From your CV · {type}") - the resolvable-datafact honesty bar made visible. No uncited matches, ever.
- **"Luckor att fylla" (gaps to fill)** ← `gaps[]`: each gap's title, why it matters, and the AI move (`bridge.kind`: suggested-bullet or question/action), with an action button.
- **The fill-gap loop** (the interactive core): one gap at a time. Suggestion mode (editable prefilled bullet) or question mode (prompt + empty box). Choices: accept / edit & save / write my own / skip. On submit → the bullet-judge → **accepted** ("added to your CV and saved for future jobs", requirement flips to match, citation chip appears) or **stays a gap** ("doesn't fully cover it yet" - never fake a match). Save failure keeps the user's typed text. End-of-loop summary + back to the verdict.
- **Honesty visible throughout:** gaps that can't be truthfully filled stay visibly open; the "saved for future jobs" compounding message appears on save (it's the product's core value).
- States per the status envelope; `failed` shows the error, no stale partial render.

### Ansökningskoll - delivery + tracking (two views)
This is the payoff surface. CV and cover letter are generated in the **background** after Matchanalys (no builder screen) and surface here.

- **Delivery view:** per application, a card with: the job description + company, the **downloadable** CV and cover letter, a **visualization** of both (rendered on-screen), an **inert comment surface** (see below), a download action, and an **apply-directly link**.
- **Tracking view (second view):** what's been applied to, interview status, etc. Manual entry for now (Daniel updates status himself).
- The crosslinking column does real work here: surfacing the gap analysis / the job's research alongside the artifacts as context.

### The inert comment surface (important - build it honestly)
Daniel wants the review/feedback loop **visually present but not backend-connected yet** (the regeneration loop is a fast-follow). Build it the honest way, NOT a fake button:
- The **preview/visualization is real** (shows the actual generated CV + letter).
- A **comment box that SAVES what Daniel types** (his note is captured + stored - it's not a dead box), clearly labelled that revision-from-comments is coming in a later version.
- The "send for revision" control is **present but visibly inactive** (disabled / "coming soon") - never a button that pretends to work. When the backend loop is built later, these activate; because they're designed in now, that's a wiring job, not a redesign.

## What's deferred (stub or hide, don't build)
- The comment→regeneration backend behavior (the surface is present + saving; regeneration is the fast-follow).
- A dedicated CV-builder screen - there isn't one; CV is background-generated, shown in Ansökningskoll.
- `.docx` export · Swedish UI · Sara/human-review · course/calendar launchers · the other bottom-launcher actions. Render disabled or hidden.

## Cross-cutting
- Citations everywhere a match is shown - no uncited matches.
- Loading/error/empty map 1:1 to the part status; don't invent states.
- All strings through i18n (the app supports SV/EN; mockup is Swedish). The UI being multilingual-ready matters - the backend is being built multilingual-ready too.
- Compose from the design-system templates/atoms; don't hand-roll. This workflow is the first real proof of the design system on live feature screens - protect the crosslinking column, don't reduce it to a sidebar.

## Report
Report when the data bridge lands, when Matchanalys renders real data + the fill-gap loop works, and when Ansökningskoll's two views are up. Keep to the shapes/API in the reconciled design so the two threads converge.
