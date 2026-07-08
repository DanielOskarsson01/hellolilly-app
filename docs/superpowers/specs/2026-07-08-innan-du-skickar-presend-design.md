# "Innan du skickar" (pre-send fit-check) — build design spec

**Date:** 2026-07-08
**Branch / worktree:** `presend-fitcheck` at `.claude/worktrees/presend-fitcheck` (off `main` @ `a8f43a3`)
**Design package:** `design/handoff-presend/` (`PRESEND_DESIGN_HANDOFF.md` + `PRESEND_BUILD_SCOPE.md` + `design/screens-presend.jsx` + `design/ll-presend.css`)
**Status:** design approved (2026-07-08); implementation plan follows; **no code until the plan is approved.**

---

## 1. What we are building (one line)

A **new sibling screen** at hash route `#innan-du-skickar`: the user has already **drafted** a CV + cover letter for a specific job; **before they send**, this screen shows how well the *finished draft* fits the ad and flags what to improve. It is an **honest check against the ad + general ATS best-practice** — it does **not** track sent applications and does **not** read the employer's real ATS, and it says so.

It is deliberately distinct from two neighbours (design §0 — preserved):
- **NOT Matchanalys** (`src/screens/match.jsx`, `JobMatchReview`): Matchanalys *explores* the **evidence bank** ("what could my background support"), runs the fill-gap loop, shows a match-% ring. This screen *reports* the **finished draft** ("what my draft actually says"), **withholds the number**, and **never mutates the case** except the one explicit keyword-align write the user requests. Every fix affordance links **out** to `#match`.
- **NOT Ansökningskoll** (`#ansokningskoll`): the delivery/tracking surface (currently a `ComingSoon` stub — not in `LL_ROUTES`; only a `TOOL_SPEC` at `src/data/strategyData.js:151`). **We leave it entirely untouched** and take a brand-new route.

---

## 2. Decisions locked (2026-07-08)

1. **Keyword-align write PERSISTS server-side (reversible).** `keywordJudge` is a server-side sibling of `bulletJudge`; the align is the user's real edit and must survive save/resume (the session-only option would silently revert their edit next day — the save-and-resume failure already fixed on the letter). The honesty guardrail ("never turn a true claim false"; no basis → refuse) is enforced **in the server judge, where it cannot be bypassed**, exactly like `bulletJudge`. The write edits the **existing** `cvDraft` part (no new part, no new schema), is reversible/re-checkable, and preserves `datafactRef` so the underlying truth is unchanged. New endpoint + server tests are in scope.
2. **Letter-fit (Part 2b) is CONTRACT-ONLY and honest.** No fabricated fixture, no LLM. Surface the **real** `coverLetter.unsupported_by_cv[]` flag + the "we don't keyword-check the letter" note; show per-requirement "addressed" **only where derivable from case data**, and where we cannot tell, **say so** rather than guess. A lighter-but-true right column. A **real letter-fit read is logged as a follow-up** (§10).
3. **"High-priority" requirement = `weight >= 0.8`,** a single tunable constant (`decodedRole.requirements[].weight` is a number 0–1 in the real contract, not `high|medium|low`).
4. **Isolation:** built in the `presend-fitcheck` worktree/branch, clear of the ~33 unrelated dirty files on `main`. **No merge — independent review first.**

---

## 3. Real data contract (verified against the store, not the preview bridge)

The screen reads the **active case** via the real `useCase()` (`src/hooks/useCase.js`) → `{ caseData, loading, error, refresh, running, actions }`, flattened through `casePartsView(caseData)` (`src/hooks/casePartsView.mjs`). Every part is a `{ status, data }` envelope; `status ∈ 'absent'|'pending'|'ready'|'failed'`.

| Part | Real shape (path) | Source |
|------|-------------------|--------|
| `meta` | `{ company, role, … }` (design's `jobTitle`→`role`, `company`; `url` — see note) | `server/skeleton/contract/case.cjs:31` |
| `decodedRole.data` | `{ requirements: [{ id, requirement, rationale, weight:Number(0–1) }] }` | `server/skeleton/a2.test.cjs:8` |
| `fit.data` | `{ capability: { overall, requirements: [{ requirementRef:{kind,id}, evidence, status:'match'\|'partial'\|'missing', evidenceRef:{kind,id} }] }, preference }` — `evidenceRef` present only when a datafact was cited | `server/submodules/gap-analyzer/execute.cjs:101,117` |
| `cvDraft.data` | `{ language, sections: [{ key, heading, items: [{ datafactRef:{kind,id}, text }] }] }` | `server/submodules/cv-builder/execute.cjs:33` |
| `coverLetter.data` | `{ language, paragraphs:[String], unsupported_by_cv:[String] }` | `server/submodules/writer/execute.cjs:104` |
| datafact | `{ id, kind:'datafact', type, text, tags:[], language }` | `server/skeleton/datafacts/ingest-cv.cjs:10` |

**Bridge deltas the port must handle (design fixture → real):**
- Design's `useCase()` returned `{ parts, status, error, reload }` with `parts.X.data/.status` and a `STATUS` enum. Real is `useCase()` → `caseData` + `casePartsView`. **The screen swaps to `useActiveCase()` + `casePartsView`; markup/classes/semantics stay identical.**
- Design `fit.…requirements[].citation.id` → real `evidenceRef.id`. Design `WEIGHT_LBL[high|medium|low]` → derived from numeric weight (`>=0.8` high, `>=0.5` medium, else low — display only).
- `meta.jobTitle` → `meta.role`. **`meta.url`:** confirm the field name on the real `meta` during build; if absent, the "Till annonsen" button falls back to the linked job's url or is hidden (honest — no dead link).
- **`_pool` / citation type label:** `casePartsView` exposes `_pool` (= `caseData._pool || []`), but the case GET does not populate it today, so `_pool` is `[]`. **Traceability does not depend on it:** an answered requirement's `evidenceRef.id` resolves to the matching `cvDraft` item (same id) and we show that item's real `text` as the traced line + a generic "Från ditt CV" chip. The `· <type>` suffix renders only if `_pool` is populated. (Optional, additive, read-only follow-up: include `_pool` in GET case — §10. Not required for correctness.)

---

## 4. Architecture — isolated, testable units

### 4.1 Pure frontend logic (`.mjs`, co-located `.test.mjs`, no React/jsdom)

1. **`src/lib/presendCoverage.mjs`** — `computeDraftCoverage(caseData)` → the DRAFT-coverage read (**THE correctness point**).
2. **`src/lib/presendKeywords.mjs`** — the deterministic CV keyword scan + basis-finder (reuses the extracted term-matcher).
3. **`src/lib/presendReadiness.mjs`** — `computeReadiness(...)` → `'ready'|'almost'|'work'` (qualitative, **no number**).
4. **`src/lib/presendLetterFit.mjs`** — the contract-only letter-fit read (honest; only what's derivable).

### 4.2 Server (mirrors the fill-gap loop)

5. **`server/skeleton/lib/term-matcher.cjs`** — extract `compileRules` / `bodyRules` from `server/submodules/stage2-filter/execute.cjs:21` into a shared, exported, pure module; stage2-filter re-imports it (behaviour-preserving refactor, its existing tests must stay green).
6. **`server/skeleton/fill-gap/keyword-judge.cjs`** — `judgeAlign(...)` + `applyAlign(store, { caseId, ... })`, the literal-string sibling of `bullet-judge.cjs`. **Deterministic honesty gate** (§6).
7. **Endpoint** in `server/dev-server.cjs`: `POST /api/case/:caseId/cv/align-keyword` → `applyAlign(...)`; returns `{ outcome:'aligned'|'refused', reason, … }` (like the gap-answer route at `:196`).
8. **Client** `src/api/caseApi.js`: `alignKeyword(caseId, payload)`; **action** `alignKeyword` in `useCase()`'s `actions` (wraps + dispatches `ll:case:changed`).

### 4.3 Screen + wiring

9. **`src/screens/presend.jsx`** (`InnanDuSkickar`) — ports `design/screens-presend.jsx` verbatim in markup, swaps the data bridge, imports the four `.mjs` modules + the `alignKeyword` action. Uses `PageTemplate` / `ContentArea` (incl. `mode="split"`) / `ContentBox` / `CrossColumn` / `Sidebar` / `Button` / `Icon` / `PartGate` (real equivalents of the design's `PartSkeleton`/`PartState`) / `tr`/`useLang`.
10. **Route** `src/App.jsx`: import `InnanDuSkickar`; add `'innan-du-skickar': { c: () => <InnanDuSkickar />, title: 'Innan du skickar', template: true }` to `LL_ROUTES`.
11. **Nav** `src/components/shell.jsx:28`: add `{ id:'innan-du-skickar', label:'Innan du skickar' }` **directly after** `{ id:'ansokningskoll', … }` in the `ansok` group (`NAV_INDEX` derives automatically).
12. **`TOOL_SPEC`** `src/data/strategyData.js`: add an `'innan-du-skickar'` entry (mirroring the `ansokningskoll` spec shape) so the ComingSoon/tool metadata is coherent.
13. **CSS** `src/styles/hello-lily.css`: append the `ll-presend.css` block (tokens-only, no raw hex/px), reusing existing `.caprow`/`.cite`/`.secrow` atoms.

**Data flow:** `useActiveCase()` → `casePartsView` → the four `.mjs` reads → the screen renders. The only write path: user clicks "Använd annonsens ord" → `actions.alignKeyword` → `POST …/cv/align-keyword` → server `keywordJudge` gate → `writePart('cvDraft')` → `ll:case:changed` → refetch → row shows `aligned`/`refused`.

---

## 5. Part 1 — Requirement coverage (THE correctness point)

`computeDraftCoverage(caseData)` — **set intersection over datafact ids already on the case; no LLM.**

```
cvIds       = new Set(cvDraft.data.sections.flatMap(s => s.items).map(i => i.datafactRef?.id).filter(Boolean))
for each req in fit.data.capability.requirements:
  evId = req.evidenceRef?.id
  if req.status === 'match' && evId && cvIds.has(evId)   -> 'answered'   (traceable: the cvDraft item with id evId)
  else if req.status === 'match' && (!evId || !cvIds.has(evId)) -> 'weak'  ("your background supports it, your draft didn't use it")
  else if req.status === 'partial'                        -> 'weak'
  else /* missing */                                      -> 'missing'
```

Output: `{ rows: [{ reqId, requirement, weight, status, tracedText, evidenceRefId }], counts: { answered, weak, missing, total } }`. Header shows the **honest count** ("6 av 8") + segmented bar; each answered row traces to the real CV line; weak/missing carry the draft-vs-background framing + a link **out** to `#match`.

**Acceptance (design gap c answered):** the answered/weak/missing counts reflect **the draft**, and are **provably different** from Matchanalys's evidence-bank verdict for a case where a `status:'match'` requirement's `evidenceRef.id` is *not* in the CV's datafact set (Matchanalys → "you cover this"; this screen → **weak**). This is the mandated test.

---

## 6. Part 2 — Keyword alignment (CV only; server-gated honesty)

### 6.1 The scan (deterministic, real)
`presendKeywords.mjs`: take the ad's literal terms from `decodedRole.requirements[]` (tokenised phrases), compile with the shared term-matcher, run `bodyRules` over the **CV draft text** (concatenated `cvDraft` item texts) → **present** vs **missing** terms. Missing terms are the alignment candidates.

### 6.2 The basis-finder (deterministic, conservative — honesty boundary, gap f)
For each missing term, find a **basis**: a `cvDraft` datafact whose text shares a stem/token with the term (e.g. ad `affiliate marketing` ↔ CV `affiliates`; ad `CAC` ↔ CV `LTV:CAC`). **No lexical basis found → not alignable** (e.g. `token partnerships` → basis `null` → the align will refuse). Genuine synonyms with *no* lexical overlap are **not** auto-aligned — that is honest **under-coverage**, never over-claim (documented gap f; a semantic basis source is the logged follow-up).

### 6.3 `keywordJudge` — the server-side gate (never bypassable)
`server/skeleton/fill-gap/keyword-judge.cjs`, mirroring `bullet-judge.cjs`'s applyAnswer:

```
applyAlign(store, { caseId, term, basisDatafactId, targetDatafactId }):
  1. basis MUST resolve to a real datafact on the case      -> else { outcome:'refused', reason:'no supporting fact' }   (THE guardrail)
  2. locate the cvDraft item(s) referencing basis/target
  3. produce alignedText: ensure the ad's literal `term` is present in that item's wording (controlled, reversible; datafactRef preserved)
  4. alignedText MUST pass the writing-rules gate  (reuse check() from server/skeleton/writing-rules/gate.cjs)  -> else refuse
  5. persist: item.priorText = item.text; item.text = alignedText; item.alignedTerm = term; store.writePart(caseId,'cvDraft',…)
  6. return { outcome:'aligned', … }   (reversible: priorText enables undo; re-checkable: re-scan reflects it)
```

- **Guardrail "never turn a true claim false":** the write only relabels wording of a datafact that already backs it (basis present) and keeps `datafactRef` — the *claim* (and its truth) is unchanged; a term with no backing fact is **refused** at step 1, server-side, where the client cannot bypass it. A false "alignable" from the read is caught by step 1 (no basis) or step 4 (writing-rules) → **refused**. This is the mandated honesty test.
- **CV only** — there is no letter equivalent, by design.
- **`coverLetter.unsupported_by_cv[]`** surfaces free as a `.lflag` "phrase to double-check"; `decodedRole.weight` ranks which weak/missing requirements matter most.

---

## 7. Part 2b — Cover-letter requirement-fit (contract-only, honest)

`presendLetterFit.mjs`: rendered side-by-side (`ContentArea mode="split"`) with the prominent **"Vi nyckelordskollar inte brevet"** note. Per the locked decision:
- Surface the **real** `coverLetter.unsupported_by_cv[]` as the honesty flag (`.lflag`).
- Show per-requirement "addressed" **only where derivable from case data** (e.g. the letter draft's stored per-paragraph `decisions` if present — `saveCoverLetterDraft` stores `decisions`; `casePartsView` exposes `coverLetterDraft`). Where addressed/not is **not** determinable, render an honest "not analysed" state for that row rather than a guessed verdict.
- **No fabricated fixture, no LLM.** A real letter-fit read (paragraph→requirement) is logged as a follow-up (§10). The right column is intentionally lighter than the mock — true over complete.

---

## 8. Part 3 — Send-readiness (qualitative, NO number)

`presendReadiness.mjs`: `'work'` if any requirement with `weight >= 0.8` is not `answered`; else `'almost'` if any weak/missing/keyword-gap/letter-gap/honesty-flag; else `'ready'` → **Redo / Nästan redo / Behöver arbete**. The `.honestline` disclaimer is unmissable (checks against the ad + general ATS best-practice, **not** the employer's real ATS). An honest **count** ("6 av 8 krav") may appear in detail; a **readiness-% never**. Format/parseability check is **cut** (the CV is a generated structured object — no upload path); optional one-line reassurance only.

---

## 9. Honest states (PartGate)

- `pending` → skeleton in a feature box.
- `failed` / no case → fail + retry (`refresh`); no stale data.
- **absent (no draft)** → the empty state: if `cvDraft` **or** `coverLetter` is `absent`, "Ingen ansökan att kolla ännu" → **Bygg CV** (`#cv`) / **Skriv personligt brev** (`#letter`), and name the Ansökningskoll-vs-this distinction. The pre-send dependency is designed **honestly** — never fake a check with no draft.
- `ready` (drafts exist) → the checked state (the main event).

---

## 10. Gaps answered + follow-ups logged

- **(c) fit semantics** → resolved by §5 (draft-coverage intersection; not Matchanalys's evidence-bank read).
- **(d) align persistence** → resolved by §6.3 (real, reversible, server-gated cvDraft edit).
- **(e) readiness thresholds** → `weight >= 0.8` tunable constant (§8); confirm with product later.
- **(f) keyword-diff quality** → the honesty boundary lives in the basis-finder (§6.2): conservative lexical basis → honest under-coverage, never over-claim.
- **Follow-ups (logged, not built now):** (1) real semantic letter-fit read (paragraph→requirement); (2) real semantic keyword basis source (beyond lexical overlap); (3) optional `_pool` in GET case for citation type labels; (4) the three dead `#ansokningskoll` links (separate concern per build scope); (5) real per-item undo UI for an aligned keyword (the reverse of §6.3, data already stored via `priorText`).

---

## 11. Testing (acceptance)

Mandated:
- **`src/lib/presendCoverage.test.mjs`** — the intersection: answered requires `evidenceRef.id ∈ cvIds`; a `status:'match'` whose `evidenceRef.id ∉ cvIds` → **weak** (provably ≠ evidence-bank verdict); partial→weak; missing→missing; counts correct.
- **`server/skeleton/fill-gap/keyword-judge.test.cjs`** — the honesty verdict: valid basis → **aligned** (cvDraft item text now contains the term, `datafactRef` unchanged, `priorText` stored); no basis → **refused** (nothing written); writing-rules failure → **refused**; a false "alignable" with no basis → **refused** (guardrail).

Supporting: `presendKeywords.test.mjs` (scan present/missing + basis-finder), `presendReadiness.test.mjs` (tone incl. weight≥0.8 boundary + never a number), `presendLetterFit.test.mjs` (derivable-only, honest "unknown"), term-matcher extraction keeps `stage2-filter.test.cjs` green, endpoint smoke (aligned + refused round-trips through `dev-server`).

**Bar:** full suite green (baseline **201 pass / 0 fail** on `main` @ `a8f43a3`); fresh-clone holds; build report answers gaps (c)/(d)/(e)/(f).

---

## 12. Out of scope
Ansökningskoll tracking/delivery + the D5 storage decision; letter-side keyword checking (forbidden); parseability/upload check (cut); any readiness-%; merging to main (independent review first).
