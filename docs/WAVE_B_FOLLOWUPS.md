# Wave B hardening — follow-ups

Deferred items surfaced during **Progress Support Wave A** (merged to `main` in `d603511`, via an independent whole-branch review). Neither is a Wave A blocker; both are Wave B hardening. Tracked here in-repo because the GitHub issue tracker was not used for these.

## #3 — Replace the `activity` denylist with a server-owned-collection write policy  (OPEN)

**Where:** `server/dev-server.cjs` — the generic collection route `POST` / `DELETE /api/collection/:name`.

**Issue:** the route is write-open for **every** collection except `activity`, which is guarded only by a hardcoded `name === 'activity'` denylist. A client can upsert/delete rows in `jobs`, `filterSet`, `jobSources`, `jobRules`, and any future Wave-B collection.

**Severity: low.**
- The scary version — forge a `datafact` row to fake a keyword-align basis — is **confirmed impossible**: datafacts live in a separate Map (`server/skeleton/store/index.cjs`, not `collection_records`), and `applyAlign`'s guard reads `store.getDatafact`. A `POST /api/collection/datafact` row is never read by the align path.
- Real exposure is limited to the user's own local `jobs` / `filterSet` / etc. on an unauthenticated, local-only dev server.

**Proposed fix (Wave B):** replace the single-name denylist with an explicit per-collection **write policy** — an allowlist of client-writable collections, or a "server-owned" set (`activity` + any future derived / server-emitted collections) the generic route refuses client writes to. Scales as collections multiply, instead of adding a name to a denylist each time.

## #2 — `/letter-draft` hung-socket hardening  (being handled separately)

`/letter-draft` had no try/catch, so a gate-thrown draft threw unhandled and hung the socket (no HTTP response). Being hardened to return a 500 on its own branch off this merge; the mandated no-false-positive test is being decoupled from throw-propagation to assert only the zero-record invariant. Remove this note once that branch merges.

## #4 — Port the Matchanalys LIST-view design (`.matchrow` / `.matchlist` / `.matchqueue` CSS)  (OPEN)

**Where:** `src/styles/hello-lily.css`. The classes `.matchrow`, `.matchlist`, `.matchqueue`, `.matcharch` are referenced by `src/screens/match.jsx` but have **zero rules** — the detail-view classes (`.verdictblk`, `.caprow`, `.gapcard`) were ported, the list-view ones never were. Result: the approved-jobs list renders as unstyled flat rows instead of the carded design.

**Reference:** the design this screen was ported from — `design/design/screens-match2.jsx` (see the header comment in `match.jsx`).

**Deliberately NOT folded into the `fix-matchanalys-analyse` bug fix,** which restored function only. Presentation-only; can land independently.

## Process — every wave ends with a scripted real-data walkthrough of the user path

`fix-matchanalys-analyse` repaired a Matchanalys "Analysera" button that had **never once worked**: the store shape is `{ company, title, location }` but the screen read `{ co, t, city }`, so `createCase` got `company: undefined` → HTTP 400 → a swallowed `console.error` on a button that appeared to do nothing; and the detail CTA called `analyze()` without the `research()` it hard-requires (`gap-analyzer` throws "decodedRole missing"). It passed **three review layers and the full 246-test suite** anyway — because **reviews verify code against spec, and only usage verifies the product.** Green suite + compiling build is necessary, not sufficient.

**Adopt:** each wave closes with a scripted walkthrough of the actual user path on real data (approve → research → analyze → fill gap → generate → align → activity log), not just `npm run verify`. The script that verified this fix: `createCase` for a real approved job → `POST /research` → `POST /analyze` → assert `fit`+`gaps` are `ready` → assert `case_created`/`research_run`/`analysis_run` rows appended to the activity collection. Codify it as `npm run walkthrough` so it runs every wave.

## #5 — Min aktivitet: wire (or honestly disable) the report action buttons  (OPEN)

**Where:** `src/screens/cvActivity.jsx:368-380` — "Dela med Sara", "Exportera rapport", "Hämta som PDF".

**Issue:** three primary/secondary buttons with **no `onClick`** — inert, but presented as working commands (same lie-class as the review-layover accept no-ops fixed in the honest-surfaces pass). Surfaced during the integration audit; left for Wave B because the "Min aktivitet" surface is being rebuilt in the Wave B surface work — fold the fix into that build rather than bolting handlers onto the current placeholder. Until then, either wire real share/export/PDF actions or give them the disabled "Kommer" treatment used elsewhere in the app.

## #6 — Matchanalys detail-view fill-gap is missing the `canAnswer` guard  (OPEN)

**Where:** `src/screens/match.jsx` (detail-view gap submit, ~L377-381) vs the reference guard in `helpfulLayover.jsx`'s (now-deleted) `GapFillForm` which returned `null` when `!(gap.requirementRef && gap.requirementRef.id)`.

**Issue:** the detail-view `submit` calls `actions.answerGap(gap.id, { answer, requirementId })` with `requirementId = gap.requirementRef && gap.requirementRef.id` — when a gap has no `requirementRef`, it still submits with `requirementId: undefined` instead of suppressing the answer box. Add the same `canAnswer` guard so gaps that can't be answered don't render an answer affordance.

## #7 — Inert filter chips on Matchanalys  (OPEN)

**Where:** `src/screens/match.jsx` filter chips.

**Issue:** filter chips render but don't filter — decorative, not wired to the queue's filtering. Surfaced in the integration audit; deferred to the Wave B `filterSet` routes work (where the real filter state lands) rather than wiring throwaway local state now.
