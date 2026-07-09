# Progress-Support Wave A — build report

**Date:** 2026-07-09 · **Branch:** `progress-support-wave-a` (off `main` @ `398c740`) · **Status:** review-ready — **NOT merged, NOT pushed** (independent review first, same discipline as `core-loop-wave` / `jobbsok-unit`).
**Suite:** 244 pass / 0 fail (local checkout). Fresh-clone checkout: 243 pass / 1 skip / 0 fail — the skip is the CV-data-gated seed test (`seedDatafacts on the REAL canonical cv_data.json …`), correct on a bare clone where the real `cv_data.json` is not checked in.
**Build:** `npm run build` succeeds (`vite build`, 57 modules, `built in 119ms`).
**Spec:** `docs/superpowers/specs/2026-07-09-progress-support-wave-a-design.md` · **Plan:** `docs/superpowers/plans/2026-07-09-progress-support-wave-a.md` · **Scope:** `docs/PROGRESS_SUPPORT_WAVE_A_SCOPE.md`.

## What shipped

Wave A is **foundation only** — three things, nothing else:

1. **D5 — the generic named-collection mechanism.** A reusable `useCollection` hook + generic
   `GET/POST/DELETE /api/collection/:name[/:id]` routes, generalized from the working `jobs`
   pattern. Zero new store concept: a new collection is new rows under a new name in the
   SQLite adapter's existing `collection_records(name, id, data)` table — no DDL, no migration.
2. **The `activity` collection.** An append-only log of *confirmed* state changes, written
   server-side, one emitter (`server/activity-log.cjs`, `logActivity`), called from 9 action
   handlers in `server/dev-server.cjs` on their success path.
3. **A minimal, plainly-labelled verification view** (`src/screens/activityLog.jsx`, route
   `#activity-log`) — a raw chronological list over the real collection, honest
   pending/failed/empty/list states, explicitly labelled "not the designed surface" (Wave B
   ships the real "Min aktivitet" / coach `Ärendevy`).

Everything designed on top of this — weekly cadence, a `tasks` collection, next-step/overdue
rules, motivational framing, the coach `Ärendevy` going real — is **Wave B**, deliberately
deferred so it can be designed against real logged data rather than assumptions.

## Acceptance requirement — the activity shape serves both audiences without a migration

**The record shape:**

```
{ id, at, type, caseId, label, meta, source }
```

written by `logActivity(store, { type, caseId, label, meta, source }, { now, id })`
(`server/activity-log.cjs`) and persisted via `store.putRecord('activity', record)` into the
SQLite adapter's generic `collection_records` table.

**Why this shape needs no migration to serve a second audience.** The record carries **zero
presentational fields** — no icon, no color, no per-audience wording. Every field is either
identity (`id`, `at`), the append-only log's own bookkeeping (`source`), or raw signal
(`type`, `caseId`, `label`, `meta`). Presentation is derived **view-side**, keyed off `type`,
in the component that renders the record — never stored on it. The Wave A verification view
proves this concretely (`src/screens/activityLog.jsx:9-22`):

```js
// Presentation is VIEW-SIDE, keyed by `type` — never stored on the record. This is
// what lets a later coach view render the SAME collection with no migration (spec §2.1).
const TYPE_PRESENTATION = {
  case_created:       { ic: 'briefcase', tint: 'ic-blue' },
  research_run:       { ic: 'search',    tint: 'ic-blue' },
  analysis_run:       { ic: 'target',    tint: 'ic-green' },
  cv_generated:       { ic: 'cv',        tint: 'ic-blue' },
  letter_generated:   { ic: 'letter',    tint: 'ic-lilac' },
  gap_filled:         { ic: 'bulb',      tint: 'ic-amber' },
  letter_draft_saved: { ic: 'letter',    tint: 'ic-lilac' },
  keyword_aligned:    { ic: 'sparkle',   tint: 'ic-green' },
  job_approved:       { ic: 'briefcase', tint: 'ic-green' },
  job_rejected:       { ic: 'briefcase', tint: 'ic-coral' },
  job_reopened:       { ic: 'briefcase', tint: 'ic-amber' },
  job_linked:         { ic: 'target',    tint: 'ic-blue' },
};
```

with a matching `detailLine(r)` switch that produces per-`type` detail text (e.g.
`case_created` → `"${company} · ${role}"`, `analysis_run` → `"${gapsFound} luckor"`) from the
`meta` payload. This is the **jobseeker "Min aktivitet"** consumer, today, in the minimal
verification tier.

**The coach `Ärendevy` (Wave B) is the same collection, filtered.** Every record already
carries `caseId` — the field that scopes a case-level view. A coach-facing "Ärendevy" reads
`GET /api/collection/activity` (or a case-scoped variant of the same generic route) and
filters/groups by `caseId`, exactly as the jobseeker view filters/sorts by `at`. It needs its
own `TYPE_PRESENTATION`-equivalent map (coach-appropriate icons/copy/tint, and likely different
`meta`-driven detail lines — a coach wants to see *what the candidate did*, not necessarily the
same phrasing a candidate sees about themselves) but **reads the identical rows, unmodified**.
No new column, no backfill, no dual-write. The two-audience requirement is satisfied
**structurally** by keeping the record schema free of anything view-specific — proven, not
just asserted, by the fact that Wave A's own verification view is already a second,
independent renderer of the same rows the design anticipates a coach view rendering later.

## The scope-note correction — action-level emit, not store-level

The original scope note read: *"Log at the SERVER-SIDE choke point (`store.writePart` /
`store.putRecord`)."* This was corrected during design (spec §0, `docs/superpowers/specs/2026-07-09-progress-support-wave-a-design.md`)
and the correction is recorded in the emitter module itself (`server/activity-log.cjs`, top-of-file
comment): **action-level emit through one module (`logActivity`), called by each action handler
on its success path — not a store-level interceptor.**

**Why store-level was wrong:** at the `(method, part, collection)` level the signal that
identifies *which user action happened* is already gone —

- `writePart('cvDraft', …)` is written by **both** `/generate` ("CV generated") **and**
  `/cv/align-keyword` ("keyword aligned"). A store-level classifier cannot tell them apart and
  would mislabel every keyword-align as "CV written."
- `writePart('fit', …)` is written by **both** `/analyze` ("analysis run") **and** gap-fill
  ("gap filled"). Same collision.
- `/research` and `/analyze` each write **two** parts (`dossiers`+`decodedRole`;
  `fit`+`gaps`), so a store-level wrap would emit **two** records for **one** logical user
  action.
- Startup seeding (`ingestDatafact` ×N) and bulk job-search writes
  (`putRecord('jobs', …)` / `putRecord('filterSet', …)`) would all need special-casing away as
  noise.

A mislabeled log is worse than a marginally riskier emitter, because Wave B and any future
learning layer consume `type`/`label` directly — corrupt labels are expensive to retrofit and
silently poison every downstream inference. **Resolution (user-confirmed 2026-07-09):**
action-level emit, one shared module, called after the confirmed mutation succeeds. The
property the original scope note actually cared about — *a rejected mutation must not log* —
is preserved exactly, because `logActivity` is called strictly **after** the store call that
could throw; see the mandated-test result below for the proof.

## Mandated-test result — the honesty invariant, tested

The wave's non-negotiable correctness property: **a gate-thrown / refused mutation writes NO
activity record.** Two tests in `server/api.test.cjs` (lines 624–661) exercise this directly,
plus a third that locks in the non-emitting bulk/seed paths:

- `MANDATED: a gate-thrown mutation writes NO activity record` — a letter-draft save
  containing a banned phrase ("synergy") makes `writePart`'s writing-rule gate throw; the
  `letter_draft_saved` emit sits *after* the `writePart` call in the handler, so it is never
  reached. Asserted: the request `assert.rejects`, the activity count is unchanged (still just
  the earlier `case_created`), and there are **zero** `letter_draft_saved` records.
- `MANDATED: a refused keyword-align writes NO activity record` — a keyword align with no
  supporting datafact makes `applyAlign` refuse *before* any `writePart` call (no LLM needed to
  reach the refusal). Asserted: `ok:false`, activity count unchanged, **zero**
  `keyword_aligned` records.
- `over-logging guard: datafact ingest + bulk job/filterSet upserts emit NO activity` — startup
  seeding (`ingestDatafact`) and bulk job-search writes (`putRecord('jobs', …)`,
  `putRecord('filterSet', …)`) never call `logActivity` (it lives only inside action handlers),
  so the activity collection stays at **zero** records after these operations, with no
  special-casing required.

All three pass as part of the 244-test suite (see Ship Gate below). This is the concrete,
executable form of the honesty property the scope-note correction preserved: **the log records
only confirmed, successful, user-triggered state changes — never attempts, never bulk/derived
writes.**

## `research_run` finding — dossiers persist before the decoder step (verified)

`POST /api/case/:id/research` can return `200` (full success) or `207` (dossiers written,
decoder failed) — and `research_run` is logged on **both**, with `meta.partial` recording which
happened. This is correct only if the dossiers write is a genuinely confirmed, durable state
change *before* the decoder is even summoned — otherwise a 207 emit would be logging an
attempt, not a result.

**Verified against `server/submodules/researcher/execute.cjs`:** the module's exported
`execute()` function calls `writeDossiersGated(caseId, dossiers, options, tools)` — which calls
`tools.store.writePart(caseId, 'dossiers', dossiers)` (with a rephrase-and-retry loop on a
writing-rule violation, but still a `writePart` either way) — and only *after* that call
returns without throwing does it proceed to:

```js
// summon the decoder THROUGH the skeleton (never a direct import). A failed or refused
// summon is SURFACED, not swallowed: dossiers succeeded (partial), but the run is NOT ok,
// so a broker refusal or decoder error can never masquerade as success.
const decoded = await tools.request('decoder', { caseId });
```

i.e. `host.invoke('researcher')` writes the dossiers to the store **before** it ever calls into
the decoder. If the dossier write itself throws (e.g. an unresolvable writing-rule violation),
the `catch` block marks the part `failed` and rethrows — the request surfaces as a `500` in
`dev-server.cjs`, and (because the exception propagates before `dev-server.cjs` reaches its
`logActivity` line) **nothing is logged**, consistent with the mandated-test invariant above. If
the dossier write succeeds but the subsequent decoder summon fails or is refused, the function
returns `{ ok: false, partial: true, … }`, which `dev-server.cjs` maps to HTTP `207` — and
**logs `research_run` with `meta.partial: true`**, because the dossiers really are sitting in
the SQLite store at that point; a coach or the future learning layer reading this activity row
sees a true statement ("research ran, partially"), not a false negative. **Confirmed: emitting
on a 207 partial is a confirmed state change, not an attempt.** (Independently verified by the
Task 4 implementer, the Task 4 reviewer, and re-confirmed here against the actual submodule
source — no placement change was ever needed.)

## Pre-existing main build break — found and fixed on this branch

While running the ship gate for Task 7, `npm run build` failed on `progress-support-wave-a`.
Root cause: three `en:` translation strings in `src/screens/presend.jsx` used single-quoted JS
string literals containing an unescaped apostrophe — `'Use the ad's word'`,
`'it isn't clearly supported…'`, `'Couldn't load the application'` — which breaks JS/JSX
parsing for the entire app, not just that file. This code came from **`main`**, commit
`551bad6` (a smart-quote→ASCII normalization pass), **not from any Wave A commit** — Wave A
never touched `presend.jsx`. It went unnoticed on `main` because `node --test` (the suite
`npm test` runs) never invokes Vite, so the 228/228-green baseline on `main` fully masked a
build-breaking syntax error; only `npm run build` (or ESLint parsing the file) would have
caught it.

**Fixed on this branch:** commit `1da6964` — `fix(presend): escape unescaped apostrophes in EN
strings breaking the build`. The fix is **syntax-only**: the three literals were switched from
single-quoted to double-quoted (`"Use the ad's word"`, etc.) with no change to the English
copy, no change to the Swedish copy, no behavior change. Diff: `src/screens/presend.jsx`, 3
lines changed (6 lines: 3 removed, 3 added).

This is a **pre-existing defect inherited from `main`**, not introduced by this wave, and its
fix is a prerequisite for this wave's own ship gate (`npm run build` must succeed — see below).
It is flagged here so a reviewer does not mistake it for wave-scope creep, and so it is visible
that **`main` itself is still broken** until this fix (or an equivalent one) lands there
independently, or this branch is merged.

## Ship gate — this branch (local checkout)

| Check | Result |
|---|---|
| `npm test` | **244 pass / 0 fail** |
| `npm run build` | **succeeds** — `vite build`, 57 modules transformed, `built in 119ms` |

## Ship gate — fresh clone (independent of local working tree)

```bash
TMP=$(mktemp -d) && git clone -b progress-support-wave-a "$WORKTREE" "$TMP/clone" && cd "$TMP/clone" && npm install && npm test
```

`npm install`: 20 packages added, 0 vulnerabilities. `npm test`:

| Metric | Value |
|---|---|
| tests | 244 |
| pass | 243 |
| fail | 0 |
| skipped | 1 — `seedDatafacts on the REAL canonical cv_data.json yields a substantial, typed pool` (correctly skipped: the real candidate CV JSON is not checked into the repo, so this test is gated off on a bare clone — the same, expected skip pattern documented in `2026-07-07-core-loop-wave-build-report.md`) |

Temp directory removed after the run. **Green from a clean checkout**, confirming the suite's
pass count is not an artifact of local `server/data/` state, node_modules drift, or anything
else specific to the working tree this wave was built in.

## Durability

`docs/verification/2026-07-09-activity-log-restart-survival.{sh,md}` — a scripted demo that
creates a case (`case_created`) and saves a letter draft (`letter_draft_saved`), confirms **2**
activity records via `GET /api/collection/activity`, **kills the server outright**, restarts it
on the **same** SQLite db file with no wipe, and re-confirms **2** records with **identical**
`type` values (`case_created,letter_draft_saved`). **PASS** on first run — captured output in
the linked `.md`. This closes Part 2's durability requirement for the `activity` collection the
same way the sibling demos (`2026-07-05-jobbsok-restart-survival.md`,
`2026-07-07-letter-save-resume-restart.md`, `2026-07-07-seam-durability-restart.md`) closed it
for `jobs`/case parts — the activity log rides the same SQLite `collection_records` mechanism,
so it inherits the same guarantee with zero new persistence code.

## Task ledger — Wave A, complete

| Task | Commit(s) | Result |
|---|---|---|
| T1 — `logActivity` emitter + activity id kind | `5bba459` | 232/232 |
| T2 — generic collection CRUD routes + write-guard | `33fcfad` | 233/233 |
| T3 — `useCollection` hook + client API (+ shaping fix) | `50f5f20` + `1c5df13` | 236/236 |
| T4 — 9 action-level emits wired | `aad7214` | 241/241 |
| T5 — mandated no-false-positive + over-logging tests | `71ece55` | 244/244 |
| T6 — `ll:collection:changed{activity}` event dispatch | `f2121d4` | 244/244 |
| T7 — presend build fix + minimal verification view/route/nav | `1da6964` + `e88a42b` | build succeeds, 244/244 |
| T8 — restart demo + this build report + ship verification | (this doc) | 244/244 local, 243/1skip/0fail fresh clone, build succeeds |

Every task reviewed clean (Spec ✅ / quality Approved) before the next task started; see
`.superpowers/sdd/progress.md` for the per-task review notes.

## Verdict

Both Wave A deliverables — the D5 generic-collection mechanism and the honestly-logged
`activity` collection — are built, tested (including the mandated honesty invariant), and
proven durable end-to-end. The activity record shape is confirmed to serve both the jobseeker
verification view (today) and a future coach `Ärendevy` (Wave B) without a migration, because
presentation is view-side and every record already carries `caseId`. The scope-note correction
from store-level to action-level emit is documented at its source (`activity-log.cjs`) and
re-justified here. A pre-existing `main` build break was found and fixed
(syntax-only) as a ship-gate prerequisite. Full suite green both locally (244/244) and from a
fresh clone (243/1-skip/0-fail — the expected CV-data-gated skip). Build succeeds. **No merge —
ready for independent review**, same discipline as every prior wave on this repo.
