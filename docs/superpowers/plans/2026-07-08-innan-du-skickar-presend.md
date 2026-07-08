# "Innan du skickar" (pre-send fit-check) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the new sibling screen at hash route `#innan-du-skickar` — an honest pre-send fit-check of a *drafted* CV + cover letter against the ad — from the design package, wired to the real store/API.

**Architecture:** Four pure `.mjs` logic modules (coverage / keywords / readiness / letter-fit) with co-located `node --test` tests; one server-side honesty judge (`keyword-judge.cjs`) + endpoint + client + `useCase` action mirroring the fill-gap loop; one screen (`presend.jsx`) that ports the design markup verbatim onto the real `useCase()`; route/nav/tool-spec/CSS wiring. Built in the `presend-fitcheck` worktree; no merge.

**Tech Stack:** React 19 (hash-routed, no per-screen build test), Node ≥22.9 built-in test runner (`node --test`), plain ESM (`.mjs`) frontend logic + CommonJS (`.cjs`) server.

**Spec:** `docs/superpowers/specs/2026-07-08-innan-du-skickar-presend-design.md` (read it first).

## Global Constraints

- Frontend logic → `.mjs` in `src/lib/` with co-located `.test.mjs`; server → `.cjs` with co-located `.test.cjs`. Tests run via `npm test` (= `node --test "server/**/*.test.cjs" "scripts/**/*.test.cjs" "src/**/*.test.mjs"`). **Baseline: 201 pass / 0 fail on `main` @ `a8f43a3` — must stay green.**
- **No LLM and no fabricated fixtures** anywhere in presend logic (honesty). **Qualitative readiness only — never a % anywhere.**
- **Keyword alignment is CV-only — never keyword-check the letter.**
- **Keyword panel honesty (UX guardrail):** the keyword section copy must frame findings as **"keyword gaps we spotted"** — NOT as the complete or only set of gaps. High-precision extraction (quoted phrases + ALLCAPS acronyms) is deliberately non-exhaustive; the framing must ensure honest under-coverage does not read as false reassurance. A richer keyword-diff source is a logged follow-up, not this build.
- **Honesty guardrail is server-side** in `keyword-judge.cjs`: aligning must **never turn a true claim false**; **no resolvable basis → refuse**; the write preserves `datafactRef` (underlying truth unchanged) and stores `priorText` (reversible).
- **`weight >= 0.8` = high**, one tunable constant `HIGH_WEIGHT`.
- **Leave `#ansokningskoll` (the ComingSoon stub + its `TOOL_SPEC`) untouched.**
- CSS additions are **tokens-only** (no raw hex/px) — reuse existing `.caprow`/`.cite`/`.secrow` atoms.
- Branch `presend-fitcheck`; **do not merge**. Commit after each task. End every commit message with:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
  (If a repo pre-commit hook blocks on a missing decision_log entry, resolve it at commit time — do not disable honesty checks.)
- Real shapes (verified): `cvDraft.data.sections[].items[].datafactRef.id`+`.text`; `fit.data.capability.requirements[].{requirementRef.id,status,evidence,evidenceRef.id}`; `decodedRole.data.requirements[].{id,requirement,weight:Number}`; `coverLetter.data.{paragraphs,unsupported_by_cv}`; part statuses `'absent'|'pending'|'ready'|'failed'`.

---

## File Structure

**Create:**
- `src/lib/presendCoverage.mjs` + `src/lib/presendCoverage.test.mjs` — Part 1 draft-coverage intersection (THE correctness point).
- `src/lib/presendKeywords.mjs` + `.test.mjs` — deterministic ad-term extraction, CV presence scan, basis-finder.
- `src/lib/presendReadiness.mjs` + `.test.mjs` — qualitative readiness tone (no number).
- `src/lib/presendLetterFit.mjs` + `.test.mjs` — contract-only honest letter-fit read.
- `server/skeleton/fill-gap/keyword-judge.cjs` + `server/skeleton/fill-gap/keyword-judge.test.cjs` — the server-side honesty gate + persistence.
- `src/screens/presend.jsx` — the screen (`InnanDuSkickar`), ported from `design/handoff-presend/design/screens-presend.jsx`.

**Modify:**
- `server/dev-server.cjs` — add `POST /api/case/:caseId/cv/align-keyword`.
- `src/api/caseApi.js` — add `alignKeyword(caseId, payload)`.
- `src/hooks/useCase.js` — add the `alignKeyword` action.
- `src/App.jsx` — register the `innan-du-skickar` route.
- `src/components/shell.jsx` — add the nav entry after `ansokningskoll`.
- `src/data/strategyData.js` — add the `innan-du-skickar` `TOOL_SPEC`.
- `src/styles/hello-lily.css` — append the tokens-only `ll-presend` block.

---

## Task 1: DROPPED in pre-flight — term-matcher extraction not needed

> **STATUS: DROPPED — do not dispatch.** The keyword scan is a **client-side** pure `.mjs` module (the approved architecture: four pure `.mjs` modules). Importing a server `.cjs` matcher into the Vite client bundle is a layering break; and with the client inlining its own ~8-line word-boundary matcher (Task 3), the extraction has **no second consumer** (YAGNI). `stage2-filter/execute.cjs` stays **untouched**. Execution begins at **Task 2**. _The original task text below is superseded and retained only for the record._

**Files (SUPERSEDED):**
- Create: `server/skeleton/lib/term-matcher.cjs`
- Modify: `server/submodules/stage2-filter/execute.cjs` (the `compileRules` + `bodyRules` defs, ~lines 21–45)
- Test: `server/skeleton/stage2-filter.test.cjs` (existing — must stay green; add one import-surface test)

**Interfaces:**
- Produces: `module.exports = { compileRules, bodyRules, escapeRegex }`
  - `compileRules(groups)` → `[{ code, regexes:[{pattern, re}] }]` (word-boundary, case-insensitive)
  - `bodyRules(text, compiled)` → `[{ rule, term, stage }]`

- [ ] **Step 1: Read the current defs** in `server/submodules/stage2-filter/execute.cjs` (functions `compileRules`, `bodyRules`, and the `escapeRegex` helper). Confirm exact source so the move is byte-faithful.

- [ ] **Step 2: Write a failing test** that the shared module exists and matches literally.

```js
// append to server/skeleton/stage2-filter.test.cjs
const { test } = require('node:test');
const assert = require('node:assert');
const tm = require('../skeleton/lib/term-matcher.cjs'); // adjust relative path to repo layout

test('term-matcher: exported compileRules/bodyRules do word-boundary literal matching', () => {
  const compiled = tm.compileRules({ kw: { reason_code: 'KW', match: ['affiliate marketing', 'CAC'] } });
  assert.deepEqual(tm.bodyRules('we ran affiliate marketing and tracked CAC', compiled).map(r => r.term).sort(),
    ['CAC', 'affiliate marketing']);
  assert.equal(tm.bodyRules('quotas and campus life', compiled).length, 0, 'word boundaries respected');
});
```

- [ ] **Step 3: Run it, verify it fails** — Run: `npm test 2>&1 | grep -i term-matcher` — Expected: FAIL (Cannot find module `term-matcher.cjs`).

- [ ] **Step 4: Create `server/skeleton/lib/term-matcher.cjs`** by moving the three functions verbatim from `stage2-filter/execute.cjs`, then exporting them:

```js
'use strict';
function escapeRegex(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
// Build { code, regexes } for each code from its literal `match` patterns.
// Word-boundary, case-insensitive — multi-word phrases and single tokens both match safely.
function compileRules(groups) {
  const compiled = [];
  for (const entry of Object.values(groups || {})) {
    if (!entry || !Array.isArray(entry.match) || !entry.match.length) continue;
    const code = entry.reason_code;
    if (!code) continue;
    const regexes = entry.match.map((p) => String(p).trim()).filter(Boolean)
      .map((p) => ({ pattern: p, re: new RegExp(`\\b${escapeRegex(p.toLowerCase())}\\b`, 'i') }));
    if (regexes.length) compiled.push({ code, regexes });
  }
  return compiled;
}
// At most one rule per code (first matching pattern).
function bodyRules(text, compiled) {
  const hay = String(text || '').toLowerCase();
  const rules = [];
  for (const { code, regexes } of compiled) {
    const hit = regexes.find((r) => r.re.test(hay));
    if (hit) rules.push({ rule: code, term: hit.pattern, stage: 2 });
  }
  return rules;
}
module.exports = { compileRules, bodyRules, escapeRegex };
```

- [ ] **Step 5: Update `stage2-filter/execute.cjs`** — delete the local `compileRules`/`bodyRules`/`escapeRegex` defs and add at the top: `const { compileRules, bodyRules } = require('../../skeleton/lib/term-matcher.cjs');` (fix the relative path to match the real tree; keep any `stage`-value nuance if stage2 sets `stage:2` vs `3` — if it does, preserve that by keeping a thin local wrapper rather than changing term-matcher).

- [ ] **Step 6: Run the FULL suite** — Run: `npm test 2>&1 | tail -8` — Expected: **202 pass / 0 fail** (201 + the new import test); `stage2-filter.test.cjs` still green.

- [ ] **Step 7: Commit**

```bash
git add server/skeleton/lib/term-matcher.cjs server/submodules/stage2-filter/execute.cjs server/skeleton/stage2-filter.test.cjs
git commit -m "refactor(server): extract shared word-boundary term-matcher from stage2-filter

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Part 1 — draft-coverage intersection (THE correctness point)

**Files:**
- Create: `src/lib/presendCoverage.mjs`
- Test: `src/lib/presendCoverage.test.mjs`

**Interfaces:**
- Produces: `export function computeDraftCoverage({ fit, cvDraft, decodedRole })`
  - inputs are the flattened part **data** objects (or `null`): `fit={capability:{requirements}}`, `cvDraft={sections}`, `decodedRole={requirements}`
  - returns `{ rows:[{ reqId, requirement, weight, status:'answered'|'weak'|'missing', tracedText:String|null, evidenceRefId:String|null }], counts:{ answered, weak, missing, total } }`

- [ ] **Step 1: Write the failing test** (encodes the correctness contract, incl. the provably-different-from-Matchanalys case):

```js
import { test } from 'node:test';
import assert from 'node:assert';
import { computeDraftCoverage } from './presendCoverage.mjs';

const decodedRole = { requirements: [
  { id: 'r1', requirement: 'Own the acquisition funnel', weight: 0.9 },
  { id: 'r2', requirement: 'LTV-based budgeting', weight: 0.8 },
  { id: 'r3', requirement: 'Web3 token scale', weight: 0.6 },
  { id: 'r4', requirement: 'Team leadership', weight: 0.5 },
]};
const fit = { capability: { requirements: [
  { requirementRef: { id: 'r1' }, status: 'match',   evidence: 'Owned funnels 17y', evidenceRef: { id: 'df_funnel' } },
  { requirementRef: { id: 'r2' }, status: 'match',   evidence: 'LTV budgeting',     evidenceRef: { id: 'df_ltv' } },   // in bank, NOT in draft
  { requirementRef: { id: 'r3' }, status: 'missing' },
  { requirementRef: { id: 'r4' }, status: 'partial', evidence: 'Led a team', evidenceRef: { id: 'df_team' } },
]}};
const cvDraft = { sections: [
  { key: 'exp', items: [ { datafactRef: { id: 'df_funnel' }, text: 'Owned full marketing funnels for 17 years.' } ] },
]}; // df_ltv is deliberately absent from the draft

test('answered requires evidenceRef in the CV draft datafact set', () => {
  const { rows } = computeDraftCoverage({ fit, cvDraft, decodedRole });
  const r1 = rows.find(r => r.reqId === 'r1');
  assert.equal(r1.status, 'answered');
  assert.equal(r1.tracedText, 'Owned full marketing funnels for 17 years.');
});

test('a match whose evidenceRef is NOT in the draft is WEAK (differs from evidence-bank verdict)', () => {
  const { rows } = computeDraftCoverage({ fit, cvDraft, decodedRole });
  const r2 = rows.find(r => r.reqId === 'r2');
  assert.equal(r2.status, 'weak', 'evidence-bank says match; the DRAFT did not use it → weak');
});

test('partial → weak, missing → missing, and counts are honest', () => {
  const { rows, counts } = computeDraftCoverage({ fit, cvDraft, decodedRole });
  assert.equal(rows.find(r => r.reqId === 'r3').status, 'missing');
  assert.equal(rows.find(r => r.reqId === 'r4').status, 'weak');
  assert.deepEqual(counts, { answered: 1, weak: 2, missing: 1, total: 4 });
});

test('missing parts do not throw', () => {
  assert.deepEqual(computeDraftCoverage({ fit: null, cvDraft: null, decodedRole: null }),
    { rows: [], counts: { answered: 0, weak: 0, missing: 0, total: 0 } });
});
```

- [ ] **Step 2: Run it, verify it fails** — Run: `npm test 2>&1 | grep -iE "presendCoverage|fail"` — Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/presendCoverage.mjs`:**

```js
// Part 1: the DRAFT-coverage read. A requirement is "answered" only if the datafact
// satisfying it (fit evidenceRef.id) is among the datafacts the CV actually included
// (cvDraft datafactRef.ids). Set intersection over ids already on the case — no LLM.
// This is deliberately NOT Matchanalys's evidence-bank read.
export function computeDraftCoverage({ fit, cvDraft, decodedRole }) {
  const reqs = (fit && fit.capability && fit.capability.requirements) || [];
  const reqById = new Map(((decodedRole && decodedRole.requirements) || []).map(r => [r.id, r]));
  const cvItems = ((cvDraft && cvDraft.sections) || []).flatMap(s => s.items || []);
  const cvIds = new Set(cvItems.map(i => i.datafactRef && i.datafactRef.id).filter(Boolean));

  const rows = reqs.map(r => {
    const reqId = r.requirementRef && r.requirementRef.id;
    const meta = reqById.get(reqId) || {};
    const evId = r.evidenceRef && r.evidenceRef.id;
    let status;
    if (r.status === 'match' && evId && cvIds.has(evId)) status = 'answered';
    else if (r.status === 'match') status = 'weak';        // in the bank, not used by the draft
    else if (r.status === 'partial') status = 'weak';
    else status = 'missing';
    const traced = status === 'answered' ? cvItems.find(i => i.datafactRef && i.datafactRef.id === evId) : null;
    return {
      reqId,
      requirement: meta.requirement || reqId,
      weight: typeof meta.weight === 'number' ? meta.weight : null,
      status,
      tracedText: traced ? traced.text : null,
      evidenceRefId: evId || null,
    };
  });
  const counts = {
    answered: rows.filter(r => r.status === 'answered').length,
    weak: rows.filter(r => r.status === 'weak').length,
    missing: rows.filter(r => r.status === 'missing').length,
    total: rows.length,
  };
  return { rows, counts };
}
```

- [ ] **Step 4: Run it, verify pass** — Run: `npm test 2>&1 | grep -iE "presendCoverage|tests |fail"` — Expected: the 4 new tests PASS, suite fail=0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/presendCoverage.mjs src/lib/presendCoverage.test.mjs
git commit -m "feat(presend): draft-coverage intersection (answered iff evidenceRef in CV draft)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Keyword scan + basis-finder (deterministic, gap-f-bounded)

**Files:**
- Create: `src/lib/presendKeywords.mjs`, `src/lib/presendKeywords.test.mjs`

**Interfaces:**
- Consumes: nothing from other tasks (pure). (The server judge in Task 6 mirrors the `basisDatafactId` concept.)
- Produces:
  - `export function extractAdTerms(decodedRole)` → `[String]` (deterministic, high-precision: quoted phrases + ALLCAPS acronyms)
  - `export function scanCvKeywords({ decodedRole, cvDraft })` → `{ present:[String], missing:[{ term, cvWording:String|null, basisDatafactId:String|null, alignable:Boolean }] }`

> **Term-source note (gap f, for the reviewer):** term extraction is high-precision-only (quoted phrases + acronyms) to avoid a fuzzy extractor or a fabricated term list. Domain phrases not surfaced this way are honest under-coverage; a richer real keyword-diff read is a logged follow-up. This keeps the scan true, not complete.

- [ ] **Step 1: Write the failing test:**

```js
import { test } from 'node:test';
import assert from 'node:assert';
import { extractAdTerms, scanCvKeywords } from './presendKeywords.mjs';

const decodedRole = { requirements: [
  { id: 'r1', requirement: 'Track "affiliate marketing" spend and CAC', weight: 0.9 },
  { id: 'r2', requirement: 'Own SEO', weight: 0.7 },
]};
const cvDraft = { sections: [{ key: 'exp', items: [
  { datafactRef: { id: 'df_aff' }, text: 'Built the affiliates department; owned SEO and paid.' },
  { datafactRef: { id: 'df_kpi' }, text: 'KPI ownership: CPA, LTV:CAC, churn.' },
]}]};

test('extractAdTerms: quoted phrases + ALLCAPS acronyms, deduped', () => {
  assert.deepEqual(extractAdTerms(decodedRole).sort(), ['CAC', 'SEO', 'affiliate marketing'].sort());
});

test('scan: SEO present in CV, affiliate marketing missing but has a lexical basis (df_aff)', () => {
  const { present, missing } = scanCvKeywords({ decodedRole, cvDraft });
  assert.ok(present.includes('SEO'));
  const aff = missing.find(m => m.term === 'affiliate marketing');
  assert.ok(aff && aff.alignable === true && aff.basisDatafactId === 'df_aff', 'affiliates ⊂ term → basis found');
});

test('scan: a term with no lexical basis is NOT alignable (refusable later)', () => {
  const role = { requirements: [{ id: 'r', requirement: 'Large-scale "token partnerships"', weight: 0.8 }] };
  const cv = { sections: [{ items: [{ datafactRef: { id: 'df1' }, text: 'Marketing funnels and CRM.' }] }] };
  const aff = scanCvKeywords({ decodedRole: role, cvDraft: cv }).missing.find(m => m.term === 'token partnerships');
  assert.ok(aff && aff.alignable === false && aff.basisDatafactId === null);
});
```

- [ ] **Step 2: Run, verify fail** — Run: `npm test 2>&1 | grep -i presendKeywords` — Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/presendKeywords.mjs`:**

```js
// Word-boundary literal matcher — inlined on purpose. It mirrors the logic in
// server/submodules/stage2-filter/execute.cjs (compileRules/bodyRules), but this module runs
// in the browser bundle and must not import server .cjs code across the client/server boundary.
// It is ~8 trivial lines; independently tested here.
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function termPresent(text, term) {
  return new RegExp(`\\b${escapeRegex(String(term).toLowerCase())}\\b`, 'i').test(String(text || '').toLowerCase());
}

const STOP = new Set(['THE','AND','FOR','WITH','A','AN','OF']);

export function extractAdTerms(decodedRole) {
  const terms = new Set();
  for (const r of (decodedRole && decodedRole.requirements) || []) {
    const s = String(r.requirement || '');
    for (const m of s.matchAll(/["“'"]([^"“'"]{2,40})["”'"]/g)) terms.add(m[1].trim());   // quoted phrases
    for (const m of s.matchAll(/\b([A-Z]{2,6})\b/g)) if (!STOP.has(m[1])) terms.add(m[1]); // ALLCAPS acronyms
  }
  return [...terms];
}

function cvText(cvDraft) {
  return ((cvDraft && cvDraft.sections) || []).flatMap(s => s.items || []).map(i => i.text || '').join('\n');
}

// A basis is a CV datafact whose text lexically overlaps the term (shared token/substring),
// i.e. the fact already expresses the concept — aligning only relabels wording. No overlap → not alignable.
function findBasis(term, cvDraft) {
  const items = ((cvDraft && cvDraft.sections) || []).flatMap(s => s.items || []);
  const toks = term.toLowerCase().split(/\W+/).filter(t => t.length >= 3);
  for (const it of items) {
    const t = String(it.text || '').toLowerCase();
    if (toks.some(tok => t.includes(tok))) return { id: it.datafactRef && it.datafactRef.id, wording: it.text };
  }
  return null;
}

export function scanCvKeywords({ decodedRole, cvDraft }) {
  const terms = extractAdTerms(decodedRole);
  const text = cvText(cvDraft);
  const present = terms.filter(t => termPresent(text, t));
  const missing = terms.filter(t => !termPresent(text, t)).map(term => {
    const basis = findBasis(term, cvDraft);
    return { term, cvWording: basis ? basis.wording : null, basisDatafactId: basis ? basis.id : null, alignable: !!(basis && basis.id) };
  });
  return { present, missing };
}
```

- [ ] **Step 4: Run, verify pass** — Run: `npm test 2>&1 | grep -iE "presendKeywords|fail"` — Expected: 3 new PASS, fail=0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/presendKeywords.mjs src/lib/presendKeywords.test.mjs
git commit -m "feat(presend): deterministic CV keyword scan + lexical basis-finder (gap-f bounded)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Readiness (qualitative, no number)

**Files:** Create `src/lib/presendReadiness.mjs`, `src/lib/presendReadiness.test.mjs`

**Interfaces:**
- Consumes: `coverage` (Task 2 output), `keyword` (Task 3 `scanCvKeywords` output), `letter` (Task 5 output — `{ rows, honestyFlags }`).
- Produces: `export const HIGH_WEIGHT = 0.8;` and `export function computeReadiness({ coverage, keyword, letter })` → `{ tone:'ready'|'almost'|'work' }`.

- [ ] **Step 1: Write the failing test:**

```js
import { test } from 'node:test';
import assert from 'node:assert';
import { computeReadiness, HIGH_WEIGHT } from './presendReadiness.mjs';

const clean = { coverage: { rows: [{ status:'answered', weight:0.9 }], counts:{ weak:0, missing:0 } },
                keyword: { missing: [] }, letter: { rows: [], honestyFlags: [] } };

test('HIGH_WEIGHT is 0.8', () => assert.equal(HIGH_WEIGHT, 0.8));
test('all answered + no gaps → ready', () => assert.equal(computeReadiness(clean).tone, 'ready'));
test('a high-weight (>=0.8) requirement not answered → work', () => {
  const c = { ...clean, coverage: { rows: [{ status:'missing', weight:0.85 }], counts:{ weak:0, missing:1 } } };
  assert.equal(computeReadiness(c).tone, 'work');
});
test('only low-weight gap or alignable keyword → almost (never a number)', () => {
  const c = { ...clean, coverage: { rows: [{ status:'weak', weight:0.5 }], counts:{ weak:1, missing:0 } } };
  assert.equal(computeReadiness(c).tone, 'almost');
  const k = { ...clean, keyword: { missing: [{ alignable:true }] } };
  assert.equal(computeReadiness(k).tone, 'almost');
});
```

- [ ] **Step 2: Run, verify fail** — Run: `npm test 2>&1 | grep -i presendReadiness` — Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/presendReadiness.mjs`:**

```js
// Qualitative send-readiness — NEVER a number. work if a high-weight requirement isn't
// answered; else almost if any weak/missing/alignable-keyword/letter-gap/honesty-flag; else ready.
export const HIGH_WEIGHT = 0.8;

export function computeReadiness({ coverage, keyword, letter }) {
  const rows = (coverage && coverage.rows) || [];
  const counts = (coverage && coverage.counts) || { weak: 0, missing: 0 };
  const highUnmet = rows.some(r => r.status !== 'answered' && typeof r.weight === 'number' && r.weight >= HIGH_WEIGHT);
  if (highUnmet) return { tone: 'work' };
  const gaps = (counts.weak || 0) + (counts.missing || 0);
  const anyKeyword = ((keyword && keyword.missing) || []).some(m => m.alignable);
  const letterGaps = ((letter && letter.rows) || []).filter(r => r.addressed === false).length;
  const honesty = ((letter && letter.honestyFlags) || []).length;
  if (gaps > 0 || anyKeyword || letterGaps > 0 || honesty > 0) return { tone: 'almost' };
  return { tone: 'ready' };
}
```

- [ ] **Step 4: Run, verify pass** — Run: `npm test 2>&1 | grep -iE "presendReadiness|fail"` — Expected: PASS, fail=0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/presendReadiness.mjs src/lib/presendReadiness.test.mjs
git commit -m "feat(presend): qualitative readiness tone (weight>=0.8 high; never a number)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Letter-fit (contract-only, honest)

**Files:** Create `src/lib/presendLetterFit.mjs`, `src/lib/presendLetterFit.test.mjs`

**Interfaces:**
- Produces: `export function computeLetterFit({ coverLetter, decodedRole })` → `{ rows:[{ reqId, requirement, addressed: true|false|null, quote:String|null }], honestyFlags:[String] }`
- **Contract:** `honestyFlags` come from the real `coverLetter.unsupported_by_cv`. `addressed` is `null` ("cannot auto-determine") unless a real derivable signal exists — **never guessed**. (First honest build: all `null` + the real flags; a real paragraph→requirement read is a logged follow-up.)

- [ ] **Step 1: Write the failing test:**

```js
import { test } from 'node:test';
import assert from 'node:assert';
import { computeLetterFit } from './presendLetterFit.mjs';

const decodedRole = { requirements: [{ id:'r1', requirement:'Own the funnel', weight:0.9 }] };

test('unsupported_by_cv surfaces as honesty flags (real)', () => {
  const { honestyFlags } = computeLetterFit({ coverLetter: { unsupported_by_cv: ['Web3 scale'] }, decodedRole });
  assert.deepEqual(honestyFlags, ['Web3 scale']);
});
test('addressed is null when not derivable — never guessed', () => {
  const { rows } = computeLetterFit({ coverLetter: { paragraphs: ['Hi'], unsupported_by_cv: [] }, decodedRole });
  assert.equal(rows[0].addressed, null);
  assert.equal(rows[0].reqId, 'r1');
});
test('no coverLetter → empty flags, rows still list requirements as unknown', () => {
  const { rows, honestyFlags } = computeLetterFit({ coverLetter: null, decodedRole });
  assert.deepEqual(honestyFlags, []);
  assert.equal(rows[0].addressed, null);
});
```

- [ ] **Step 2: Run, verify fail** — Run: `npm test 2>&1 | grep -i presendLetterFit` — Expected: FAIL.

- [ ] **Step 3: Implement `src/lib/presendLetterFit.mjs`:**

```js
// Contract-only, honest. Surfaces the REAL unsupported_by_cv flag. Per-requirement "addressed"
// is null (cannot auto-determine) unless a real signal exists — never fabricated, never LLM.
// A real paragraph->requirement read is a logged follow-up.
export function computeLetterFit({ coverLetter, decodedRole }) {
  const honestyFlags = (coverLetter && coverLetter.unsupported_by_cv) || [];
  const rows = ((decodedRole && decodedRole.requirements) || []).map(r => ({
    reqId: r.id, requirement: r.requirement, addressed: null, quote: null,
  }));
  return { rows, honestyFlags };
}
```

- [ ] **Step 4: Run, verify pass** — Run: `npm test 2>&1 | grep -iE "presendLetterFit|fail"` — Expected: PASS, fail=0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/presendLetterFit.mjs src/lib/presendLetterFit.test.mjs
git commit -m "feat(presend): contract-only honest letter-fit (real unsupported flag; addressed=null when unknown)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Server keyword-judge (the honesty gate + reversible persistence)

**Files:**
- Create: `server/skeleton/fill-gap/keyword-judge.cjs`, `server/skeleton/fill-gap/keyword-judge.test.cjs`

**Interfaces:**
- Consumes: the store interface used by `bullet-judge.cjs` — **confirm at build** by reading `server/skeleton/fill-gap/bullet-judge.cjs`: `store.getCase(caseId)` → `{ cvDraft:{ data:{ sections } }, ... }`, `store.getDatafact(id)` (or the datafact is reachable via the case), `store.writePart(caseId, part, data)`, and the writing-rules gate `require('../writing-rules/gate.cjs').check({ text })`.
- Produces: `async function applyAlign(store, { caseId, term, basisDatafactId })` → `{ outcome:'aligned'|'refused', reason?, term, datafactId? }`. `module.exports = { applyAlign };`

- [ ] **Step 1: Read `bullet-judge.cjs` + `writing-rules/gate.cjs`** and its test's `fixtureStore()` to confirm the exact `store.*` method names and the `check()` return shape. Adjust the code below to match verbatim.

- [ ] **Step 2: Write the failing test** (the mandated honesty verdict — mirrors `bullet-judge.test.cjs` with an in-memory store):

```js
const { test } = require('node:test');
const assert = require('node:assert');
const { applyAlign } = require('./keyword-judge.cjs');

// minimal in-memory store; align to the real interface confirmed in Step 1
function fixtureStore() {
  const cvDraft = { data: { language: 'en', sections: [ { key:'exp', items: [
    { datafactRef: { kind:'datafact', id:'df_aff' }, text: 'Built the affiliates department at ComeOn.' },
  ] } ] } };
  const datafacts = { df_aff: { id:'df_aff', kind:'datafact', type:'job_result', text:'Built the affiliates department at ComeOn.' } };
  const caseObj = { meta: { id:'c1' }, cvDraft };
  return {
    caseId: 'c1',
    getCase: () => caseObj,
    getDatafact: (id) => datafacts[id] || null,
    writePart: (_c, part, data) => { caseObj[part] = { status:'ready', data }; },
    _read: () => caseObj.cvDraft.data.sections[0].items[0],
  };
}

test('valid basis → aligned: term now present, datafactRef unchanged, priorText stored', async () => {
  const s = fixtureStore();
  const res = await applyAlign(s, { caseId: 'c1', term: 'affiliate marketing', basisDatafactId: 'df_aff' });
  assert.equal(res.outcome, 'aligned');
  const item = s._read();
  assert.match(item.text.toLowerCase(), /affiliate marketing/, 'ad term written into the draft');
  assert.equal(item.datafactRef.id, 'df_aff', 'underlying truth (datafactRef) unchanged');
  assert.ok(item.priorText, 'reversible: prior text stored');
});

test('no resolvable basis → refused, NOTHING written (the guardrail)', async () => {
  const s = fixtureStore();
  const before = s._read().text;
  const res = await applyAlign(s, { caseId: 'c1', term: 'token partnerships', basisDatafactId: null });
  assert.equal(res.outcome, 'refused');
  assert.match(res.reason, /support|basis|fact/i);
  assert.equal(s._read().text, before, 'no write on refuse');
});

test('a false "alignable" pointing at a non-existent datafact → refused (cannot be bypassed)', async () => {
  const s = fixtureStore();
  const res = await applyAlign(s, { caseId: 'c1', term: 'anything', basisDatafactId: 'df_does_not_exist' });
  assert.equal(res.outcome, 'refused');
});
```

- [ ] **Step 3: Run, verify fail** — Run: `npm test 2>&1 | grep -i keyword-judge` — Expected: FAIL (module not found).

- [ ] **Step 4: Implement `server/skeleton/fill-gap/keyword-judge.cjs`:**

```js
'use strict';
const { check } = require('../writing-rules/gate.cjs'); // confirm path/return shape in Step 1

function hasTerm(text, term) { return new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text); }

// The literal-string sibling of bullet-judge. Aligns wording ONLY where a real fact backs it;
// refuses otherwise. The write relabels the CV item that cites the basis datafact — datafactRef
// (the truth) is preserved; priorText makes it reversible.
async function applyAlign(store, { caseId, term, basisDatafactId }) {
  const refuse = (reason) => ({ outcome: 'refused', reason, term });
  if (!term || !basisDatafactId) return refuse('No supporting fact for this term — we don’t add words the CV can’t back.');
  const basis = store.getDatafact ? store.getDatafact(basisDatafactId) : null;
  if (!basis) return refuse('The supporting fact could not be found on this case.');

  const caseObj = store.getCase(caseId);
  const data = caseObj && caseObj.cvDraft && caseObj.cvDraft.data;
  if (!data) return refuse('No CV draft to align.');

  let target = null;
  for (const sec of data.sections || []) for (const it of sec.items || [])
    if (it.datafactRef && it.datafactRef.id === basisDatafactId) { target = it; break; }
  if (!target) return refuse('The supporting fact is not in the current draft.');

  if (hasTerm(target.text, term)) return { outcome: 'aligned', term, datafactId: basisDatafactId }; // idempotent

  const aligned = `${target.text} (${term})`;                 // conservative, deterministic, no LLM
  const gate = check({ text: aligned });                      // writing-rules honesty gate
  if (gate && gate.ok === false) return refuse(gate.reason || 'The aligned wording failed the honesty gate.');

  if (target.priorText === undefined) target.priorText = target.text; // reversible
  target.text = aligned;
  target.alignedTerm = term;
  store.writePart(caseId, 'cvDraft', data);
  return { outcome: 'aligned', term, datafactId: basisDatafactId };
}

module.exports = { applyAlign };
```

- [ ] **Step 5: Run, verify pass** — Run: `npm test 2>&1 | grep -iE "keyword-judge|fail"` — Expected: 3 new PASS, fail=0. (Adjust `check()`’s return-shape handling to the real gate confirmed in Step 1.)

- [ ] **Step 6: Commit**

```bash
git add server/skeleton/fill-gap/keyword-judge.cjs server/skeleton/fill-gap/keyword-judge.test.cjs
git commit -m "feat(server): keyword-judge honesty gate — align only with a basis, reversible, refuse otherwise

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Endpoint + client + useCase action

**Files:**
- Modify: `server/dev-server.cjs` (add route near the gap-answer route ~`:196`), `src/api/caseApi.js`, `src/hooks/useCase.js`

**Interfaces:**
- Consumes: `applyAlign` (Task 6).
- Produces: `POST /api/case/:caseId/cv/align-keyword` `{ term, basisDatafactId }` → `{ ok, result }`; `caseApi.alignKeyword(caseId, { term, basisDatafactId })`; `actions.alignKeyword(payload)`.

- [ ] **Step 1: Read the gap-answer route** (`server/dev-server.cjs` ~196–213) for the exact request-parsing + response helpers used, so the new route matches house style.

- [ ] **Step 2: Add the route** (adapt to the real router/parse helpers):

```js
// POST /api/case/:caseId/cv/align-keyword  — honesty-gated keyword align (reversible cvDraft edit)
const { applyAlign } = require('./skeleton/fill-gap/keyword-judge.cjs'); // fix relative path
// inside the case-router, mirroring the gap/answer handler:
router.post('/api/case/:caseId/cv/align-keyword', async (req, res) => {
  try {
    const { term, basisDatafactId } = req.body || {};
    const result = await applyAlign(store, { caseId: req.params.caseId, term, basisDatafactId });
    res.json({ ok: result.outcome === 'aligned', result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
```

- [ ] **Step 3: Add the client** in `src/api/caseApi.js` (mirror `answerGap`, dispatch `ll:case:changed`):

```js
export function alignKeyword(caseId, { term, basisDatafactId }) {
  return request(`/api/case/${encodeURIComponent(caseId)}/cv/align-keyword`, {
    method: 'POST', body: JSON.stringify({ term, basisDatafactId }),
  }).then((b) => {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('ll:case:changed'));
    return b.result;
  });
}
```

- [ ] **Step 4: Add the action** in `src/hooks/useCase.js` `actions` memo (mirrors `answerGap`):

```js
alignKeyword: wrap('alignKeyword', (payload) => caseApi.alignKeyword(caseId, payload)),
```

- [ ] **Step 5: Endpoint smoke test** — add to `server/api.test.cjs` (or a new `server/skeleton/fill-gap/keyword-align-route.test.cjs`) a test that POSTs an aligned case and a refuse case through the server, asserting `ok:true`/`ok:false` and that the refuse path wrote nothing. Run: `npm test 2>&1 | tail -8` — Expected: fail=0.

- [ ] **Step 6: Commit**

```bash
git add server/dev-server.cjs src/api/caseApi.js src/hooks/useCase.js server/api.test.cjs
git commit -m "feat: align-keyword endpoint + client + useCase action (honesty-gated cvDraft write)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: The screen — port `screens-presend.jsx` onto the real bridge + CSS + wiring

**Files:**
- Create: `src/screens/presend.jsx`
- Modify: `src/App.jsx`, `src/components/shell.jsx`, `src/data/strategyData.js`, `src/styles/hello-lily.css`

**Interfaces:**
- Consumes: `computeDraftCoverage`, `scanCvKeywords`, `computeReadiness`, `computeLetterFit`, `actions.alignKeyword`, and the real UI atoms.
- Produces: the `InnanDuSkickar` screen at route `innan-du-skickar`.

> No unit test (screens aren’t rendered under `node --test`). Verification = the full suite stays green + manual render in the running app. Port the **markup/classes/copy verbatim** from `design/handoff-presend/design/screens-presend.jsx`; swap only the data bridge and the align write.

- [ ] **Step 1: Read the real atoms** so imports are correct: how `src/screens/match.jsx` imports `PageTemplate`/`ContentArea`(+`mode="split"`)/`ContentBox`/`CrossColumn`/`Sidebar`/`Button`/`Icon`/`tr`/`useLang`, how it uses `PartGate`/`partSlot` for pending/failed/absent, and how it renders a `.cite` chip. Mirror those imports exactly.

- [ ] **Step 2: Create `src/screens/presend.jsx`** — port `CheckedState` + `InnanDuSkickar` markup verbatim, with these bridge swaps:
  - Data: `const { caseData, actions } = useActiveCase();` then `const parts = casePartsView(caseData);`.
  - Statuses: replace design `STATUS.PENDING/FAILED/ABSENT` with the real strings via `parts.statusOf('cvDraft')` / `loading` / `error` (mirror match.jsx’s gate).
  - Part 1: `const coverage = computeDraftCoverage({ fit: parts.fit, cvDraft: parts.cvDraft, decodedRole: parts.decodedRole });` — render rows from `coverage.rows` (status/tracedText), header from `coverage.counts`. The traceable chip uses `row.tracedText` (real CV line) + a generic "Från ditt CV" label (append `· <type>` only if `parts._pool` has the datafact).
  - Part 2: `const kw = scanCvKeywords({ decodedRole: parts.decodedRole, cvDraft: parts.cvDraft });` — render `kw.missing`; the align button calls `actions.alignKeyword({ term: m.term, basisDatafactId: m.basisDatafactId })`, sets per-row state to the returned `outcome` (`aligned`/`refused`), shows the refuse copy + `#match` bridge link on refuse. `alignable:false` rows show the secondary/refuse affordance. **UX guardrail (Flag 1):** the section scope note (`.kw-scope`) must frame these as **"keyword gaps we spotted"** — e.g. sv: "Nyckelordsluckor vi hittade — inte en fullständig lista" / en: "Keyword gaps we spotted — not an exhaustive list", so the deliberately non-exhaustive scan does not read as "these are the only gaps." Do NOT keep the design’s "Här är annonsens exakta termer som saknas" wording, which implies completeness.
  - Part 2b: `const letter = computeLetterFit({ coverLetter: parts.coverLetter, decodedRole: parts.decodedRole });` — render `letter.rows` (addressed `true`/`false`/`null`; `null` → honest "läs själv, vi avgör inte automatiskt"), and the `.lflag` from `letter.honestyFlags[0]`. Keep the "Vi nyckelordskollar inte brevet" note.
  - Part 3: `const readiness = computeReadiness({ coverage, keyword: kw, letter });` — `.rband--${readiness.tone}`, the glance mini-checklist from the four reads, `.honestline` verbatim. **No number.**
  - `meta`: `parts.meta.role` / `parts.meta.company`; the "Till annonsen" button uses a real url if present on meta, else hide it (no dead link).
  - **Do NOT** port the `.presend-harness` review toggle (design-review only).
  - Keep the `.presubj` strip + every out-link to `#match` (the §0 distinction).

- [ ] **Step 3: Register the route** in `src/App.jsx` — add the import and the `LL_ROUTES` entry:

```js
import { InnanDuSkickar } from './screens/presend.jsx';
// in LL_ROUTES:
'innan-du-skickar': { c: () => <InnanDuSkickar />, title: 'Innan du skickar', template: true },
```

- [ ] **Step 4: Add the nav entry** in `src/components/shell.jsx` — directly after `{ id:'ansokningskoll', label:'Ansökningskoll' }` in the `ansok` group:

```js
{ id:'ansokningskoll', label:'Ansökningskoll' },
{ id:'innan-du-skickar', label:'Innan du skickar' },
```

- [ ] **Step 5: Add the `TOOL_SPEC`** in `src/data/strategyData.js` — an `'innan-du-skickar'` entry mirroring the `ansokningskoll` spec’s field shape (title/blurb/icon), so `Sidebar`/`ComingSoon` metadata is coherent. Do not modify the `ansokningskoll` entry.

- [ ] **Step 6: Append the CSS** — paste `design/handoff-presend/design/ll-presend.css` (the `.presubj`/`.rband`/`.honestline`/`.cov`/`.caprow__ic--*`/`.reqtag--*`/`.kw`/`.lfit`/`.lflag`/`.presend-foot` blocks) into `src/styles/hello-lily.css`, tokens-only. **Omit** the `.presend-harness` block. Confirm every referenced token (`--ll-blue-tint-2`, `--ll-amber-soft`, `--ll-lilac-soft`, `--ll-coral`, etc.) exists in the real token set; if any is missing, map to the nearest existing token (note it in the report) — do not introduce raw hex.

- [ ] **Step 7: Manual render verification** — run the dev server (`npm run dev`), open `#innan-du-skickar`:
  - drafts exist → checked state renders; counts honest; a keyword align writes (persists across reload) or refuses with the bridge; readiness is a word, no %.
  - no draft (a case without cvDraft/coverLetter) → empty state → Bygg CV / Skriv brev, Ansökningskoll distinction named.
  - `#ansokningskoll` still resolves to its ComingSoon stub, unchanged.

- [ ] **Step 8: Full suite green** — Run: `npm test 2>&1 | tail -8` — Expected: **fail=0** (baseline 201 + all new tests).

- [ ] **Step 9: Commit**

```bash
git add src/screens/presend.jsx src/App.jsx src/components/shell.jsx src/data/strategyData.js src/styles/hello-lily.css
git commit -m "feat(presend): Innan du skickar screen + route/nav/tool-spec/CSS wiring

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Fresh-clone verify + build report (no merge)

**Files:** Create `docs/superpowers/reports/2026-07-08-innan-du-skickar-build-report.md`

- [ ] **Step 1: Full suite from a clean tree** — Run: `git status` (confirm all intended files committed) then `npm test 2>&1 | tail -8`. Expected: fail=0.
- [ ] **Step 2: Fresh-clone/worktree sanity** — from a clean checkout of the branch, `npm ci || npm i` then `npm test`; confirm green (no reliance on uncommitted state).
- [ ] **Step 3: Write the build report** answering design gaps **(c)/(d)/(e)/(f)**, listing: the two mandated tests + results, the keyword-align endpoint behaviour (aligned + refused), the honest under-coverage boundaries (letter-fit all-`null`, keyword term-source high-precision-only), the logged follow-ups, and any token mappings from Task 8 Step 6. State the baseline→final test counts.
- [ ] **Step 4: Do NOT merge.** Push the branch for independent review; report the branch name + report path. Leave `main` untouched.

```bash
git add docs/superpowers/reports/2026-07-08-innan-du-skickar-build-report.md
git commit -m "docs(presend): build report — gaps c/d/e/f, tests, follow-ups (no merge)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review (author checklist — done)

**Spec coverage:** §5 Part 1 → Task 2; §6 keyword scan+judge → Tasks 1,3,6,7; §7 letter-fit → Task 5; §8 readiness → Task 4; §9 honest states + §3 bridge swap + wiring → Task 8; gaps c/d/e/f + follow-ups → Task 9 report. ✅ All spec sections map to a task.

**Placeholder scan:** No TBD/TODO. The three "confirm at build" steps (Task 6 Step 1 store interface, Task 7 Step 1 route house-style, Task 8 Step 1 real atoms) are explicit verification steps against named files, not deferred design — acceptable and necessary for a faithful port.

**Type consistency:** `computeDraftCoverage({fit,cvDraft,decodedRole})→{rows,counts}`, `scanCvKeywords(...)→{present,missing:[{term,basisDatafactId,alignable,cvWording}]}`, `computeReadiness({coverage,keyword,letter})→{tone}`, `computeLetterFit(...)→{rows,honestyFlags}`, `applyAlign(store,{caseId,term,basisDatafactId})→{outcome,...}` — names/shapes are consistent across the tasks that produce and consume them.

**Known build-time confirmations (honest):** `store.*` method names + `check()` return shape (Task 6, read from `bullet-judge.cjs`), the real UI atom imports + `PartGate` API (Task 8 Step 1), token names (Task 8 Step 6), `meta.url` presence (Task 8 Step 2). Each has a named fallback so no task is blocked.

**Pre-flight correction (2026-07-08):** original Task 1 (extract a shared server term-matcher) was DROPPED — the keyword scan is client-side, so the matcher is inlined in `presendKeywords.mjs` (Task 3) rather than imported across the client/server bundle boundary; `stage2-filter` is left untouched. Execution starts at Task 2.
