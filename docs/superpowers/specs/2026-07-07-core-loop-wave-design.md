# Core-Loop Wave — design spec

**Date:** 2026-07-07 · **Status:** approved (brainstorm), plan pending review · **Branch (build):** `core-loop-wave` (worktree, no merge — independent review first, same as Jobbsök)

## Goal

Ship the three "core-loop" screens — **Matchanalys**, **CV-byggaren**, **Personligt brev** — as one unit, rebuilt on the `grid.jsx` templates from the design package (`design/design/*`), bound to the **real** backend case parts. This is the CURRENT build in `docs/MASTER_STATE.md` (Kind-1 items 5/6); it moves these three from the FAKE/demo tier to **wired-real** (no demo banner). It is a **restyle of already-wired screens**: preserve the real data path, swap the design's fixture bridge for the real store/API, keep the markup.

They remain **three separate screens / three menu points** (`#match`, `#cv`, `#letter`) — not merged into one page.

## Non-goals (deferred, flagged — do not build)

- The letter "concern-to-address" chooser (gap/age/career-change/language/confidence → bridge paragraph). The strengths-vs-rewards framing ships instead. (§7)
- Real PDF/print export — the client-side HTML-blob download stays as-is, noted as known. (§7)
- Multi-application letter list (A8).
- CV "improve" wording tools + multi-version-per-role switcher — stay disabled ("Kommer"). (§7)
- `ActivityTracker` (`#activity`) restyle — left untouched this wave.
- A frontend DOM test harness (vitest+jsdom) — still the standing follow-up; not built here.

## Approved decisions

1. **Full durable decision-unification** of the Matchanalys queue (see §Seam), with **queue-only** pre-authorized as the fallback *iff* the job→case durability surfaces more than "a small route + a field" during detailed planning.
2. **Real `PartGate` component** + a **`caseData → parts` selector** (the design screens read a flat `parts.X`; the real `useCase` returns `{status,data}` envelopes).
3. **`coverLetterDraft` case part** for save-and-resume, with per-claim keep/soften/cut **decisions keyed by claim text** (not index), so a regeneration can't silently mis-map them.
4. All §7 resolutions below.

## Architecture

### Template screens (App.jsx)
`#match`, `#cv`, `#letter` become `template: true` routes — each renders `PageTemplate` (own `Sidebar` nav + `CrossColumn` rail); global chrome is suppressed for template routes (the existing Jobbsök pattern in `App.jsx`). D3: these are real screens → **no demo banner**.

### Shared foundation (built once)
- **`src/components/partGate.jsx`** — reusable `PartGate` taking a part envelope `{status,data}`; renders slots for `pending` (skeleton), `failed` (error + retry), `absent` (the generate CTA), and `children` on `ready`. All three screens + the layover review-content use it, so the honest pending/ready/failed/absent matrix is one implementation.
- **`src/lib/i18n.js`** — port of `design/design/ll-i18n.js`: `tr({sv,en})`, `useLang()`, `setLang()`, `getLang()`, plus a `LangToggle` component. Default `sv`; `en` additive. Generated artifacts (CV/letter) are English-only for MVP — surfaced honestly ("svenska kommer"), not hidden.
- **`casePartsView(caseData)`** (small helper, in `src/hooks/useCase.js` or a sibling) — maps the real envelope shape (`caseData.fit.status/.data`, …) to the flat `parts` shape the design screens read (`parts.fit`, `parts.meta`, `parts._pool`, …), so the ported screens stay close to their design source and are easy to diff against `design/design/`.
- **CSS merge** — `design/design/ll-apply.css` (Matchanalys) + `ll-build.css` (CV+letter, incl. `.flag` honesty styles) fold into `src/styles/hello-lily.css`, token-only. **Verify the `.improve` class-name collision** against the existing home/expanded CSS before merging (§7).

### Data-path preservation (the "restyle, don't rewire" rule)
Every screen keeps its real path through `useCase`/`caseApi`. The design's fixture bridge (`ll-case.jsx`, its own `useCase`/`PartGate`/`resolveDatafact`) is **replaced** by the real `src/hooks/useCase.js` + the new `PartGate` + the real datafact pool from the case. No screen reads `strategyData.js` fixtures or the old localStorage decision path afterward.

## Screen 1 — Matchanalys (`#match`)

- **Queue** = durable **approved** jobs: `listJobs().filter(j => j.decision === 'approved')` (via `caseApi.listJobs()`), refetched on `ll:jobs:changed`. Replaces both the localStorage `acceptedJobs` list *and* the design's `ANALYZED_JOBS` fixture. An approved job that has **not been analyzed yet** (no linked case / `fit` absent) shows an "Analysera" CTA — **no score, no gaps**; once its case is analyzed it shows the served `fit.score` and opens the full analysis. The design's fixture list assumed all-analyzed; the real queue is honest about the pre-analysis state.
- **Per-job analysis** bound to real `fit` + `gaps` via `useCase(job.caseId)`. Reuse the already-built pattern in `helpfulLayover.jsx` (`MatchAnalysisContent` + `GapFillForm`): verdict from `fit.capability.overall`, matched requirements with `CitationChip` (resolve datafact by id), the fill-gap loop with its three honest outcomes — **accepted** (mints a datafact, requirement flips to match), **stays_gap** (gap remains, honest reason shown), **save_failed** (user text preserved). `PartGate` on `fit`.
- **Match %** = served `fit.score` (never a fixture number). (§7)
- **Durable job→case link** (the seam — see below): each approved job carries a durable `caseId`; the case is created on first "Analysera".
- Repoint the dead `#triage` link → `#jobbsok`. (§7) Inline "Ändra" evidence edits stay local-only (not persisted) — noted deferred. (§7)

## Screen 2 — CV-byggaren (`#cv`)

- Bound to `cvDraft` `{language, sections:[{key, heading, items:[{datafactRef, text}]}]}` via `useCase`. Split layout: `IntakeRail` (guided intake → `addFact`) | `CvLive` (the living CV). Every line traceable to its datafact via the `CvItem` hover chip; only sections with ≥1 resolvable item render. `PartGate` on `cvDraft` (absent → generate CTA). The "Lilly väljer, hittar aldrig på" guarantee line stays.
- **Surfaces/reviews** the draft — does **not** author CV text in the UI. Improve-strip + version-switcher stay disabled ("Kommer"). `ActivityTracker` untouched.

## Screen 3 — Personligt brev (`#letter`) + save-and-resume

- Bound to `coverLetter` `{language, paragraphs[], unsupported_by_cv[]}` via `useCase`. Single column; editable paragraphs (`Para`/`ParaInsert`). `PartGate` on `coverLetter` (absent → "Skriv brev" generate CTA).
- **Ärlighetskoll honesty panel (load-bearing, non-negotiable):** the `LetterFlag` control per `unsupported_by_cv` claim — **Behåll / Mjuka upp / Ta bort** (keep/soften/cut). A letter that showed generated text without surfacing these flags would ship unbacked claims looking supported; the panel prevents that. `soften`/`cut` guide the user's own edit (no auto-rewrite — noted). The finalize CTA is gated on all flags resolved.
- **Save-and-resume (durable, real product requirement):**
  - New case part **`coverLetterDraft`**: `{ language, paragraphs: string[], decisions: { [claimText]: 'keep'|'soften'|'cut' }, editedAt }`. Decisions keyed by **claim text** so a `coverLetter` regeneration re-maps cleanly (unmatched keys are dropped, new claims start unresolved).
  - New route **`POST /api/case/:id/letter-draft`** → `host.store.writePart(caseId, 'coverLetterDraft', draft)` → SQLite (durable). Read via the existing `GET /api/case/:id` (already returns all parts).
  - **Resume flow:** on screen open, if `coverLetterDraft` is present, seed the editor (paragraphs + flag decisions) **from the draft**; else seed from the fresh `coverLetter`. So Daniel can leave, return in two days, open Personligt brev for that application, and resume — because the draft persisted in the durable store, keyed to the case.
  - **Two distinct actions:** **"Spara utkast"** persists the unfinished draft (always allowed — this is what makes resume work) · **"Klar / Granska"** (finalize + `letterReviewed`) stays gated on all flags resolved.
  - **Regenerate vs draft:** regenerating the letter (`generate`) overwrites the `coverLetter` part; the `coverLetterDraft` persists independently. On open the draft takes precedence — so the plan MUST define an explicit affordance ("uppdatera från nytt brev" / discard-draft) so a stale draft never silently hides a freshly regenerated letter.
  - Survives process restart (SQLite; `/api/health` → `durable:true`). Keyed to the case (= one application).

## The decision-unification seam (full durable)

**Today:** `match.jsx` reads localStorage `acceptedJobs` (`jobStore.acceptJob`/`getAcceptedJobs`); the design list is a fixture. **Target:** the Matchanalys queue is driven by the durable approved-jobs store from Jobbsök, and the per-job `caseId` link is durable too.

- **Queue read:** `match.jsx` → `listJobs().filter(decision==='approved')` (durable), refetch on `ll:jobs:changed`. Removes the localStorage `acceptedJobs` dependency from the Matchanalys queue.
- **Durable job→case link:** new **`POST /api/job/:id/case`** stores `caseId` on the durable job record (`putRecord('jobs', {...job, caseId})`). Case created on first "Analysera" (via `createCase`), then linked. `getActiveCaseId` continues to drive which case the CV/letter screens show, but the job→case source of truth moves to the durable record.
- **Display fields:** the durable job record carries `title`/`company`/`location`/`snippet` — enough for a queue row; the match % comes from the linked case's `fit.score` once analyzed.
- **`jobStore.acceptJob`/`removeAcceptedJob`/`getAcceptedJobs`** are left in place if any *other* wired screen still uses them (grep at plan time — same Option-1 discipline as Jobbsök); the Matchanalys queue simply stops using them. If nothing else uses them, they can be retired — decided at plan time.
- **Pre-authorized fallback (queue-only):** if the durable job→case link turns out to need more than the one route + one field (e.g. the analyze flow, case dedup, or display-field backfill balloons), fall back to: **queue from durable approved jobs (still replaces the acceptedJobs list), but keep the `caseId` link on the existing `setJobCase`/active-case mechanism**, flagged as a small follow-up. Reported either way.

## §7 resolutions

| §7 item | Resolution |
|---|---|
| Matchanalys list is a fixture (`ANALYZED_JOBS`) | Replaced by durable approved-jobs queue (the seam). |
| Dead `#triage` link | Repoint → `#jobbsok`. |
| Match score must be served, not fixture | Use `fit.score`. |
| Inline "Ändra" evidence edit is local-only | Leave local (not persisted) — deferred, noted. |
| Letter "concern-to-address" chooser not built | Deferred; strengths-vs-rewards ships. |
| Keep/soften/cut not persisted | **Now persisted** via `coverLetterDraft` (save-and-resume requirement). soften/cut still guide the user's edit (no auto-rewrite). |
| PDF export is an HTML blob | Left as-is, noted known. |
| Multi-application letters | Deferred (A8). |
| CV improve-strip + version switcher disabled | Stay disabled ("Kommer"). |
| `.improve` class-name collision on CSS merge | Verify + namespace if it collides, before merging CSS. |
| i18n `tr`/`useLang` shim | Port to `src/lib/i18n.js`. |
| Generated artifacts English-only | Surfaced honestly ("svenska kommer"); not hidden. |

## Data shapes (reference)

- **Case part envelope:** `caseData[part] = { status:'absent'|'pending'|'ready'|'failed', data, updatedAt, error? }`.
- **fit.data:** `{ capability:{ overall, requirements:[{status:'match'|'partial'|..., requirementRef:{id}, evidence, evidenceRef:{id}}] }, preference:{narrative}, score }`.
- **gaps.data:** `[{ id, what, why, bridge:{kind, oneLiner?, body}, requirementRef?, fillable? }]`.
- **cvDraft.data:** `{ language, sections:[{key, heading, items:[{datafactRef:{id}, text}]}] }`.
- **coverLetter.data:** `{ language, paragraphs:[string], unsupported_by_cv:[string] }`.
- **coverLetterDraft.data (NEW):** `{ language, paragraphs:[string], decisions:{[claimText]:'keep'|'soften'|'cut'}, editedAt }`.
- **job record:** `{ id, externalId, source, title, company, location, url, snippet, decision:'new'|'approved'|'rejected', signal, matchedRules[], caseId? (NEW) }`.

## Testing

- **Backend route tests** (`server/api.test.cjs`): `POST /api/case/:id/letter-draft` (writes+reads back the draft, survives a store round-trip, writing-rules gate runs); `POST /api/job/:id/case` (writes `caseId` onto the durable job record, idempotent). Add `coverLetterDraft` to the parts contract + its test.
- **Pure-logic tests** (`src/**/*.test.mjs`, the glob Jobbsök added): the `casePartsView` adapter (envelope → parts, incl. absent/failed); the claim-keyed decision re-map (regeneration drops stale keys, keeps matching ones, new claims start unresolved); the approved-jobs queue filter.
- **Fresh-clone condition holds** (like Jobbsök): `npm ci` clean, full `node --test` suite green, no sibling-repo/worktree dependencies.
- **Known gap (unchanged):** no DOM/layout test harness — cross-surface + rendered-layout behavior is covered by a manual verification pass, and the vitest+jsdom harness remains the logged follow-up.

## Process / non-negotiables

- Feature branch `core-loop-wave` (worktree), **not** main. **No merge, no deploy** — goes to independent review first, same as Jobbsök.
- Honest states throughout via `PartGate` (pending/ready/failed/absent). Daniel Oskarsson persona, no Amir, no demobar on these real screens. Everything on the design-system tokens/components (`docs/DESIGN_SYSTEM.md`).
- Report per the handoff's acceptance criteria on completion; save-and-resume durability and the seam outcome (full vs the queue-only fallback) reported explicitly.

## Acceptance criteria

1. Three screens on the templates, three menu points, each bound to its real part (`fit`+`gaps` / `cvDraft` / `coverLetter`), honest states via `PartGate`.
2. Ärlighetskoll panel surfaces every `unsupported_by_cv` claim with keep/soften/cut.
3. Cover-letter save-and-resume **persists in the durable store** across a restart, keyed to the case — verified, not in-session only.
4. Matchanalys queue driven by durable approved jobs; job→case link durable (or the queue-only fallback, reported).
5. Full suite green incl. new tests; fresh-clone holds.
6. No merge — review-ready.
