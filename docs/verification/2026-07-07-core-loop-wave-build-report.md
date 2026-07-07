# Core-Loop Wave — build report

**Date:** 2026-07-07 · **Branch:** `core-loop-wave` (worktree) · **Status:** review-ready — **NOT merged** (independent review first, same as Jobbsök).
**Suite:** 200 pass / 1 skip / 0 fail (the skip is the CV-data-gated seed test — correct on a bare clone). **Build:** clean.
**Spec:** `docs/superpowers/specs/2026-07-07-core-loop-wave-design.md` · **Plan:** `docs/superpowers/plans/2026-07-07-core-loop-wave.md`.

## What shipped

Three core-loop screens rebuilt on the `grid.jsx` templates, bound to the real case parts — moved from the FAKE/demo tier to **wired-real** (no demo banner). Three screens, three menu points (`#match`, `#cv`, `#letter`).

- **Matchanalys** (`#match`) → `fit` + `gaps`; verdict + matched requirements (CitationChip) + the fill-gap loop with its three honest outcomes (accepted / stays_gap / save_failed); served `fit.score`; `PartGate` on `fit`.
- **CV-byggaren** (`#cv`) → `cvDraft`; living CV, every line traceable to a datafact; intake rail ships **disabled ("Kommer")**; `PartGate` on `cvDraft`. `ActivityTracker` untouched.
- **Personligt brev** (`#letter`) → `coverLetter`; editable paragraphs; the **Ärlighetskoll** honesty panel (`LetterFlag` keep/soften/cut per `unsupported_by_cv`, keyed by claim TEXT); **durable save-and-resume**; `PartGate` on `coverLetter`.
- **Layover review-content** — `LetterReviewContent` + `CvReviewContent` on the real parts (reusing the real `LetterFlag`), with their `ll-helpful.css` styles merged in.

## New backend surface (+ tests)

- **`coverLetterDraft`** case part in the contract (`server/skeleton/contract/case.cjs`).
- **`POST /api/case/:id/letter-draft`** — durable draft save via `writePart` → SQLite.
- **`POST /api/job/:id/case`** — durable job→case link (`putRecord`), placed above the `/api/case/:id` guard to avoid shadowing.
- **GET `/api/case/:id`** now exposes `coverLetterDraft` (was omitted — a real gap caught out-of-band; the resume flow depends on it).
- All three routes are TDD-covered in `server/api.test.cjs` (incl. durable round-trips + a route-shadowing regression).

## Shared foundation (built once)

`PartGate` + `PartState` + `PartSkeleton` + `STATUS` (`src/components/partGate.jsx`, pure `partSlot.mjs` tested) · `casePartsView` (envelope→parts) · `caseMetaView` + `profile.mjs` (identity adapter) · `i18n.mjs` (`tr`/`trFor`/`useLang`/`LangToggle`) · `letterDraft.mjs` (claim-keyed remap/seed) · `caseApi` wrappers (`saveCoverLetterDraft`, `linkJobCase`) + a `useCase` `saveLetterDraft` action. Pure logic is unit-tested (`src/**/*.test.mjs`).

## The two hard requirements — both proven durable

### 1. Cover-letter save-and-resume (durable)
New `coverLetterDraft` part `{language, paragraphs[], decisions:{claimText→keep|soften|cut}, editedAt}`, saved via `POST /api/case/:id/letter-draft`, seeded on open (draft wins over the fresh letter) with a "Uppdatera från nytt brev" affordance so a stale draft never hides a regenerated letter. Decisions keyed by **claim text** (survive regeneration). Two actions: **Spara utkast** (always enabled — this is what enables resume) vs **Klar/Granska** (gated on all flags resolved).

**Evidence:** `docs/verification/2026-07-07-letter-save-resume-restart.{sh,md}` — a scripted demo that writes a draft, **kills the server, restarts (no wipe)**, and confirms the paragraphs AND flag decisions are byte-intact, `durable:true`, `cases:1` reloaded from disk. **PASS** (independently re-run by the controller).

### 2. Decision-unification seam — FULL durable unification
Matchanalys queue = `listJobs().filter(decision==='approved')`, refetched on `ll:jobs:changed`; the `ANALYZED_JOBS` fixture is gone. `handleOpenJob` does the durable link: `createCase` → `linkJobCase` (`POST /api/job/:id/case`) → `setActiveCaseId` → open. "Analysera" (unlinked) vs "Snabbkoll" (linked).

**Fallback threshold — HELD, full unification shipped.** The concrete trigger was: drop to queue-only ONLY IF the seam needs a contract change beyond the single `caseId` field, OR touches a wired screen besides `match.jsx`, OR migrates existing `acceptedJobs` data. **None fired** — the change is `match.jsx`-only, reuses the existing `linkJobCase`/`createCase`/`setActiveCaseId` (no new backend), and does not migrate `acceptedJobs`. Full unification was therefore the required outcome and shipped.

**Evidence:** `docs/verification/2026-07-07-seam-durability-restart.{sh,md}` — approve a job → it enters the queue → link a caseId → **kill + restart (no wipe)** → the job is still `approved` AND `caseId` still linked. **PASS** (independently re-run by the controller).

## §7 resolutions — each confirmed landed

| §7 item | Task | Confirmed |
|---|---|---|
| Matchanalys list was a fixture | T15 | ✅ replaced by durable approved-jobs queue (`listJobs().filter(approved)`) |
| Dead `#triage` link | T13 | ✅ repointed → `#jobbsok` (2 sites) |
| Match score must be served | T13 | ✅ uses `parts.fit.score`, never a fixture |
| Inline "Ändra" evidence edit local-only | T13 | ✅ left local (not persisted) — logged follow-up |
| Letter "concern-to-address" chooser | T11 | ✅ deferred; strengths-vs-rewards framing ships |
| Keep/soften/cut not persisted | T11 | ✅ **now persisted** via `coverLetterDraft` (proven by demo a) |
| PDF export is an HTML blob | T11 | ✅ left as-is, noted known |
| Multi-application letters | T11 | ✅ deferred (A8) |
| CV improve-strip + version switcher | T12 | ✅ stay disabled ("Kommer") — intake rail too |
| `.improve` class collision on CSS merge | T9 | ✅ namespaced `.cvb-improve`/`.cvb-improve__btn` (+ `.cvb-intake` — a second real collision) |
| i18n `tr`/`useLang` shim | T6 | ✅ ported to `src/lib/i18n.mjs` |
| Generated artifacts English-only | T11/T12 | ✅ surfaced honestly ("svenska kommer"), not hidden |

## Design→real adaptations (no fabrication)

- **`caseMetaView` + `profile.mjs`** supply person/role identity the real `meta` lacks (`meta.person`/`jobTitle`/`location`). Unknown fields (e.g. `employment`) are **omitted, never fabricated**.
- **Citation chips degrade honestly:** `GET /api/case/:id` does not expose the datafact pool this wave (`_pool = []`), so chips render the generic "Från ditt CV" form — a truthful attribution without a fabricated type, and no false "unresolvable" alarm.
- **`PartGate`** standardizes pending/ready/failed/absent across all three screens + the review layover.

## Logged follow-ups (deferred — honestly tracked, not permanent)

1. **CV intake → datafact-mint + datafact exposure surface** (its own unit): (a) a write path so the intake rail mints datafacts; (b) a read exposure surface on `GET /api/case/:id` so citation chips resolve the datafact **type** and the "unresolvable = honesty hook" fires as a real signal. Until then the intake rail is disabled ("Kommer") and chips show the honest generic form.
2. **Multi-user profile** — `profile.mjs` is single-user (`owner:'self'`); moves to a per-user source when multi-user lands.
3. **Inline "Ändra" evidence write-back** (Matchanalys) — edits stay local; decide whether to persist.
4. **Real PDF/print export** for the letter (currently an HTML-blob download).
5. **Letter "concern-to-address" chooser** (strengths-vs-rewards ships instead).
6. **Multi-application letter list** (A8) + per-role CV versions.
7. **Frontend DOM test harness** (vitest+jsdom) — logic is unit-tested; layout/cross-surface is manual + the two scripted durability demos this wave.
8. **OWNER DECISION — module system:** one `MODULE_TYPELESS_PACKAGE_JSON` warning remains in `npm test` because `caseApi.test.mjs` (`.mjs`) imports `caseApi.js` (`.js`, ~10 importers). Options: (a) add `"type":"module"` to `package.json` (clean, verified safe — no CommonJS `.js` anywhere, backend is `.cjs`, `npm run build` works) — needs ratification; (b) accept the one warning; (c) rename `caseApi.js`→`.mjs` + update importers (disproportionate). Pure new modules already went `.mjs`; this is the only remaining case.

## Reconciliation note (two sessions interleaved)

Two Claude sessions interleaved commits on this branch before sole ownership was established. A reconciliation audit (per instruction) found: **no duplicate route definitions** (`letter-draft` is one route via the case-regex alternation + an `action` branch; `job/:id/case` is one route above the case guard), **no test-name collisions**, `coverLetterDraft` applied **once** in `PARTS`, **ledger↔git coherent**. One real defect surfaced and was fixed: two build-breaking unescaped apostrophes in single-quoted `en:` strings (`match.jsx:237` `didn't`, `:442` `You've`/`they'll`) left by the other session's smart-quote→ASCII pass. Build + suite green afterward.

## Known-gap / Minor findings carried to the final review

Accumulated Minors (none blocking): T3 (idempotency test omits an `ok` assert; null-body edge untested) · T6 (`getLang()` init doesn't coerce a stored lang to sv/en) · T8 + T9 (a few raw brand-hex values ported verbatim from the design source where no token exists) · T12 (dead imports in `cvActivity.jsx`) · T14 (CSS cascade notes not provable from the diff — `cvpaper__name`) · T15 (silent `listJobs()` cold-mount swallow; `createCase` role field smoke-test; a one-frame "Klar för analys" badge duplication before the first link). The final whole-branch review triages these.

## Verdict

All 16 plan tasks complete; both hard requirements proven durable by committed, independently-re-run demos; the seam shipped full durable unification within the concrete threshold; every §7 resolution confirmed landed. **No merge — ready for independent review.**
