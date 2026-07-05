# Jobbsök unit — build report (Tasks 1–8)

**Branch:** `jobbsok-unit` (off `main @ 9ae5a69`) · **Date:** 2026-07-05
**Suite:** 172 tests, **171 pass / 0 fail / 1 skip** · **Build:** `npm run build` green · **Review:** PASS (fresh-eyes, adversarial on the load-bearing rule) · **Nothing merged to main.**

Rebuilt Jobbsök as ONE screen on the design-system grid templates where discovery results ARE the
approval surface. Daniel triages the durable stored jobs (approve / reject-with-reason / reopen);
decisions persist through the served API and survive restart; the result row and the ad layover write
ONE shared record.

## Commits (this session, Tasks 3–8 — Tasks 1–2 landed earlier)

| Task | Commit | What |
|---|---|---|
| 3 | `d3f28f1` | pure tiering/evidence logic `src/lib/jobTriage.mjs` + node:test + `src/**/*.test.mjs` glob |
| 4 | `7735a46` | `useJobs` hook + `caseApi.listJobs/decideJob` — the single decision path |
| 5 | `e5ea356` | layover `kind:'jobpreview'` decision surface (writes the one record) |
| 6 | `a2b1e24` | Jobbsök screen on grid templates — results are the approval surface |
| 7 | `fbeb62b` | token-only screen styles (curated de-dupe) |
| 8 | *(this)* | restart-survival verification + build report + PROJECT_INVENTORY errata |

## The two backend routes (Tasks 1–2, already reviewed)

- `GET /api/jobs` → `{ ok, jobs: [<raw canonical records>] }` (`decision`/`signal`/`matchedRules` preserved).
- `POST /api/job/:jobId/decide` `{ decision:'approved'|'rejected'|'new', reason?, note? }` → targeted upsert by `id`, changes ONLY `decision`/`rejectReason`/`rejectNote`; `new` = reopen (clears reason/note); 404 unknown, 400 invalid / rejected-without-reason. Dedup-preserves-decision covered by a route test.

## The single decision path (the load-bearing rule)

`useJobs()` reads `/api/jobs` and exposes `approve/reject/reopen`, all funnelling through
`caseApi.decideJob(job.id, …)`. The ad layover's `JobPreviewContent` calls the SAME `decideJob(job.id, …)`.
`decideJob` dispatches `ll:jobs:changed`; `useJobs` subscribes and refetches — so a decision made on the
row OR in the layover reflects on the other immediately, and both read the same durable record keyed on
`job.id`. **There is NO component-local decision state and NO localStorage decision write in either new
surface** (only transient reject-picker UI is local). Proven: route tests + the API restart demo +
the code review verified this against the real backend, not just the tests.

## grid.jsx template changes: NONE

The screen is the **first importer** of `PageTemplate` / `ContentArea` / `ContentBox` / `CrossColumn`
(`grid.jsx`). They served the screen as-is — **no additive template change was needed, no bespoke fork**.
`PROJECT_INVENTORY.md`'s "grid.jsx … orphaned / zero importers" note is now false (errata added).

## Design → real adaptations (deltas from the prototype design package)

1. **i18n dropped** — the design used `tr({sv,en})` + `useLang`/`LangToggle`; the real app is Swedish-only, so Swedish string literals are used throughout (matches every wired screen).
2. **React** — ES-module `import React from 'react'` + `React.*` (not the prototype's shared-babel global).
3. **caseApi** — `listJobs`/`decideJob` use the file's existing `request()` helper (not the plan snippet's raw `fetch`).
4. **Evidence chips rewired to the REAL shape** — derived from `job.matchedRules` (`{rule, term, stage?}`) + `job.signal`, never the fixture `locFit`/`stage2`. `STAGE2_LABELS` extended to the real reject codes (`US_TIMEZONE, TOO_TECHNICAL, LANG_REQ, SALARY_LOW, SALES_HEAVY, INDUSTRY_FIT`) with a raw-code fallback; stage-1 rules (which carry NO `stage`) render as stage-1 chips, stage-2 as body-signal chips; empty `matchedRules` → source chip only (no fabrication).
5. **Decisions keyed on `job.id`** (the store id the decide route uses), not the prototype's `externalId`.
6. **Icon `pin` doesn't exist** in the real `ICONS` set (Icon falls back to a house) → stage-1 location chips use `target`, stage-2 use `filter`.
7. **`Button` clobbers `className`** (spreads `...rest` over its own class) → the stroked reject action uses a raw `<button className="btn btn--sm btn--reject">`, never `<Button className=…>`.
8. **No auto-search on mount** — `useLiveJobSearch(…, { auto:false })`. The durable store is triaged first; a discovery run is the explicit "Sök jobb" action (matches "new discovery runs from the UI = reload from the store" and avoids a live-API hit on every open).
9. **jobpreview decision bar** — 2-col grid (Godkänn / Välj bort) + a full-width "Till annonsen" reusing the existing `.jobdesc__external` (the design's 3-in-a-row would wrap awkwardly in the shared `.lay-match__actions` grid).
10. **Approved card** omits the design's "Öppna matchanalys" link (Option A seam — see follow-ups); it shows Köad + Ångra + Till annonsen.

## The five reconciliation points (resolved)

1. **New filters (emp-type / work-mode / salary).** Stored jobs carry none of these fields. Keyword drives the search request; **anti-keywords are the only hard client-side exclude** (on `title`+`company`+`snippet`). Emp-type/work-mode/salary filter **client-side only where the ad carries the field, keeping unknowns** ("Ta med annonser utan löneuppgift" ON by default) — so they are **inert today** (no ad has the field) and never silently drop an unknown-value ad. The single unknown-drop path (salary) fires ONLY when the user explicitly unchecks the default-on include toggle — a labeled, user-driven exclusion.
   - **Ort nuance:** `jobSearch.js:normalizeJobQuery` **fixes `municipality` to `0180` (Stockholm)** by design (Stream 2). Presenting a free Ort selector would fake a control the backend ignores, so Ort ships as a **read-only indicator** ("Stockholm (0180)") with a one-line note — honest-disabled. Making Ort selectable is a small `jobSearch.js` change, out of this unit's scope.
2. **Saved keyword chips → filterSet.** The search is request-driven (keywords in the POST body); there is no filterSet read/write route. Saved searches persist at the **UI layer** (`jobStore.getSavedSearches/saveSearch`, localStorage) — the existing behaviour, preserved. In-tool filterSet editing is **deferred and reported**.
3. **Stage-2 chips at discovery.** Chips derive from `job.matchedRules`. Freshly-discovered jobs carry stage-1 rules (location/title/company, no `stage`); stage-2 chips appear only once the body is enriched and `matchedRules` carries a `stage:2` entry. `jobFlagged(job) = job.signal === 'low'`. **No empty/fabricated stage-2 chips** — verified in tests and review.
4. **Re-flag after approve.** The decision **stays** (matches the store's dedup-preserves-decision). `tierize` splits `approved`/`rejected` by `decision` regardless of `signal`, and the approved slim row still renders its current `matchedRules`-derived context if reopened. A later run does not silently un-approve.
5. **DemoBar.** Jobbsök omits it; not duplicated into `grid.jsx`. The `primitives.jsx` DemoBar is left untouched.

## Scope — Option A (confirmed by Daniel)

The plan's "remove the localStorage decision path from `jobStore.js` and migrate wired screens" collided
with the hard "zero diffs to the six wired screens" acceptance: `acceptJob`/`removeJob`/`getAcceptedJobs`
feed the **existing accept→Matchanalys flow** used by `home.jsx` (via `JobResultsList`), `match.jsx` (the
whole Matchanalys queue), and the `kind:'job'` layover — so `jobResultsList.jsx` is **not** orphaned.
**Option A:** the NEW surfaces (screen + jobpreview layover) write **exclusively** through the decide
route; the legacy localStorage accept→Matchanalys flow is **left untouched** (zero diffs to wired screens).
`jobStore`'s accept/remove functions remain (still used by those wired screens) — but **no new surface
calls them**, so there is no dead fallback the new UI can slip into, and the single-decision-record rule
holds. Verified: the diff touches none of `jobStore.js` / `home.jsx` / `match.jsx` / `JobDescriptionContent`.

## Deferred / known gaps (flagged, not built)

- CSV ingest wiring (card ships visibly disabled, "Kopplas snart"); custom-source URL (ships disabled, v2).
- Bulk approve/reject (per-row only); decided-history beyond last-10; reject-reason read-back surface; conflicting-evidence reconciliation (chips show the machine's raw read verbatim, by design).
- Matchanalys restyle (separate design-pass wave).

## Follow-ups (durable record — no BACKLOG.md exists in this repo)

1. **Frontend test harness (vitest + jsdom) — its own future unit.** Per Daniel's 2026-07-05 test-coverage decision, this unit uses logic tests + route tests + the live restart-survival demo; DOM-render screen tests are deferred. Standing up vitest/jsdom is the named follow-up.
2. **Unify the triage `decision` with the `acceptedJobs`/Matchanalys flow — belongs to the Matchanalys wave.** Today, approving in Jobbsök writes the backend `decision` but does NOT populate the legacy `#match` queue (which still reads localStorage `acceptedJobs`). That wave already touches `match.jsx`, so the unification (approved ⇒ Matchanalys queue; retire `jobStore`'s accept/remove once migrated) belongs there, with its own test pass. This is the deliberate Option-A seam.
3. **Selectable Ort** — a small `jobSearch.js:normalizeJobQuery` change to pass a chosen municipality instead of the fixed `0180`. Out of this unit's scope; currently shipped as an honest read-only indicator.

## Acceptance

- ✅ One screen renders through the `grid.jsx` templates (first importer; "zero importers" now false).
- ✅ One-decision-record: row + layover write one backend record via the decide route; decisions survive
  a real server kill+restart (**API half pre-verified 2026-07-05, PASS**; UI half staged for a live run in
  `2026-07-05-jobbsok-restart-survival.md`). Reviewer verified it first, against the real backend.
- ✅ Flagged jobs down-ranked, never hidden; every flag explains itself via `matchedRules`-derived chips.
- ✅ Real Stream-2 backend data path preserved; **zero diffs to the six wired screens** (Option A).
- ✅ Everything unwired is honestly disabled (CSV ingest, custom-URL, unbacked filters, empty stage-2 chips), never faked.
- ✅ Full suite green incl. new route + `.mjs` logic tests; token-only CSS (only sanctioned warm/amber + status hexes). Fresh-clone empty-state holds by construction (no fixtures in the screen; empty store → honest empty state). *Note:* the worktree shares `node_modules`; a literal `npm ci` fresh-clone run is left for a clean checkout to avoid disturbing the main worktree.
- ⏳ CI: nothing pushed/merged (kept on `jobbsok-unit` per instruction) — CI runs when Daniel opens/pushes.
