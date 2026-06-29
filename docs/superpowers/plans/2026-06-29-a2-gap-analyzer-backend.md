# A2 + Background Generators Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the A2 backend — a real `gap-analyzer` submodule (fit + gaps), a compounding datafact pool, the fill-gap loop with a bullet-judge, and background `cv-builder` + `writer` generators, all surfaced through a thin HTTP API.

**Architecture:** Each new submodule is a clone of the live `decoder` submodule (framework-correct, key-wired, isolated by the require-guard). Submodules read the candidate datafact pool through a new read-only `datalayer` capability and write case parts through the gated store. The fill-gap loop's bullet-judge is a host-level function (not a submodule) because it writes datafacts (the host-only ingest path). A thin Node `http` API layer (extending `server/dev-server.cjs`) invokes submodules via `host.broker`/`host.invoke`.

**Tech Stack:** Node.js 22 (`.nvmrc`), CommonJS (`.cjs`), `node --test`, in-memory store, Anthropic via `tools.llm.completeJSON`, Vite dev server for the host.

## Global Constraints

- **Node 22**, CI-green required (suite currently 60/60 — every task keeps it green).
- **File extension is `.cjs`** for all server code (`manifest.cjs`, `execute.cjs`, tests `*.test.cjs`). NOT `.js`. The brief said `.js`; the skeleton is `.cjs`.
- **Submodule isolation (require-guard):** files under `server/submodules/` may `require()` ONLY `node:` builtins, as string literals. No relative/peer/skeleton imports, no dynamic require. Enforced fail-closed at load. (`server/skeleton/submodule-isolation.cjs`)
- **Submodules reach peers ONLY via `tools.request(id, input)`** — never by import.
- **Capabilities are least-privilege:** only manifest-declared capabilities are injected.
- **The writing-rules gate is non-negotiable** and runs at `writePart` time. Authored prose passes it; verbatim datafact evidence is exempt (Task 3 implements the exemption). A submodule cannot self-opt-out.
- **Honesty bar (design §6):** every `match` cites a resolvable datafact **by id** (`datafactId`, validated against the pool — NOT free-text string matching); unsupported → `missing`/`partial`, never a fabricated match. Every bridge carries `material[]`. The bullet-judge MUST be able to return "cannot truthfully fill" and leave the gap open, and a fill-gap bullet MUST pass the writing-rules gate BEFORE it is minted (it is freshly authored, not lifted from the real CV).
- **Multilingual-ready (design §5):** every datafact carries `language:'en'`; `cv-builder` and `writer` take a `language` parameter hardcoded `'en'`. Do NOT build Swedish; do NOT hardcode language so Swedish is additive.
- **id kinds:** all required kinds (`datafact`, `gap`, `bridge`, `decodedRequirement`, `case`) already exist in `server/skeleton/ids.cjs`. No new id kinds. `mintId` uses a random suffix (NOT deterministic — the design's word "deterministically" does not match the skeleton; ids are random-suffixed and that is fine).
- **Canonical CV source:** `JobSearch/CVs/cv-source/en/cv_data.json` (resolved — see "Pre-flight findings"). Absolute path: `/Users/danieloskarsson/Library/CloudStorage/Dropbox/Projects/JobSearch/CVs/cv-source/en/cv_data.json`.
- **Tests run with:** `npm test` → `node --test "server/**/*.test.cjs"`.
- **Commit, do not deploy.** This repo deploys via CI on push to `main`. Keep work on a branch; merge/deploy is the user's call.

---

## Pre-flight findings (resolved before this plan; carried as context)

These five deltas between the A2 brief and the actual skeleton are already resolved and baked into the tasks below:

1. **`.cjs` not `.js`** — all server files. (Global Constraint above.)
2. **`datalayer` capability does not exist yet** — Task 2 adds it (read-only: `listDatafacts`, `getDatafact`).
3. **The gate exemption for verbatim datafact evidence is NOT implemented** — only anticipated in `store/index.cjs:21-22`. Task 3 implements it as **ref-scoped exact-equality**: a collected string is exempt only if it *exactly equals* the `.text` of a datafact the written value references by `{kind:'datafact', id}`. NOT substring-of-pool — that laundered authored prose (the exemption's `.includes()` is broader than the rules' `\b` word boundaries, so a fact containing "dynamics" would exempt an authored "dynamic") AND regressed the decoder's anti-cliché gate once the pool was seeded. **[Brutal-critic correction, 2026-06-29.]**
4. **`cvDraft` + `coverLetter` are NOT existing case parts** — current `PARTS` = `dossiers, decodedRole, fit, gaps, prep, cards, liveLog, postMortem`. Task 1 adds the two new parts + bumps DATA_CONTRACT to v0.3.
5. **The fill-gap bullet-judge writes datafacts**, and `ingestDatafact` is host-level only (not on `tools.store`). So the bullet-judge + write-back is a **host-level module** invoked by the API route (Task 7/11), not a submodule. This matches the brief ("a function in the fill-gap endpoint").

**Ported-prompt sources (real files to port from — not placeholders):**
- 5-layer analyzer prompt: `OnlyiGaming/content-pipeline-modules-v2/modules/step-5-generation/pipeline-job-search/job_analyzer_prompt.md` and `OnlyiGaming/content-pipeline-modules-v2/modules/_archive/job-analyzer/execute.js`.
- Cover-letter system prompt (banned-words list, ComeOn=CMO/CPO/COO, MrGreen=founding-team-not-CPO, `unsupported_by_cv[]`, no-overstate, 4–5 paragraph structure): `JobSearch/CVs/generate-cover-letter.js` (SYSTEM_PROMPT) and snapshot `OnlyiGaming/content-pipeline-modules-v2/modules/step-5-generation/pipeline-job-search/cover_letter_prompt.md`.

**Architectural-review checkpoint:** Phase 0 (Tasks 1–3) changes the contract, adds a capability, and changes gate behavior. Per project discipline (review cycles for architectural changes), get a brutal-critic/CTO pass on Phase 0 BEFORE Phase 1 begins. Phases 1–5 are non-architectural (new submodules + routes following established patterns).

**Adversarial review applied (2026-06-29).** A brutal-critic pass ran against this plan + the real skeleton before any build. Corrections folded in (do NOT regress them):
- **Gate exemption → ref-scoped exact-equality** (Task 3), not substring-of-pool. Closes the laundering door AND removes the decoder anti-cliché regression on a seeded pool.
- **Evidence is cited by `datafactId`** (Task 6), validated against the pool — not free-text string matching (which was both brittle and irrelevance-blind). `fit` requirements gain an `evidenceRef`.
- **Fill-gap bullets are gate-checked BEFORE minting** (Task 7), and the `fit` re-write attaches `evidenceRef` so it survives the exact-equality gate. Prevents orphan/banned-word "facts."
- **`host.llm` does not exist** → the API threads `llm` explicitly into `createApiHandler(host, { preferencesPath, llm })` (Tasks 10–12). No skeleton change.
- **Seeder path is `../../`** (two levels, scripts→app→Projects→JobSearch), not `../../../`; mapper pinned to the real `cv_data.json` shape with a min-count fixture test (Tasks 4–5).
- **Preferences read warns, never silently swallows** (Task 10); confirmed at `docs/candidate_preferences.json`.
- **`reads` is currently UNENFORCED** (only `writes` is scope-checked in `makeScopedStore`). New manifests still list every part their execute touches, but treat `reads` as documentation, not a guarantee.
- Minor: drop unused `utils` capability from the 3 new manifests; `/generate` returns `ok` only when BOTH generators succeed; malformed gap route → 400; add an env-gated live smoke test (Task 13).

---

## File Structure

**Skeleton (modified — architectural, Phase 0):**
- `server/skeleton/contract/case.cjs` — add `cvDraft`, `coverLetter` to `PARTS`.
- `server/skeleton/registry.cjs` — add `'datalayer'` to `VALID_CAPABILITIES`.
- `server/skeleton/capabilities.cjs` — inject `tools.datalayer` when declared.
- `server/skeleton/writing-rules/gate.cjs` — `check`/`enforce` accept `exemptTexts`; exempt verbatim-datafact strings.
- `server/skeleton/store/index.cjs` — `writePart` passes datafact texts to `enforce`.
- `docs/DATA_CONTRACT.md` — bump to v0.3; document new parts + datalayer + gate exemption.

**Seed pool (new, Phase 1):**
- `server/skeleton/datafacts/ingest-cv.cjs` — pure mapper `cvDataToDatafacts(cvData, language)` → `datafact[]`.
- `server/skeleton/datafacts/ingest-cv.test.cjs` — mapper tests.
- `scripts/seed-datafacts.cjs` — seed runner (reads canonical JSON, ingests into a host store; supports a `--print` dry-run).
- `package.json` — add `"seed:datafacts"` script.

**Submodules (new, Phases 2 & 4 — each a `decoder` clone):**
- `server/submodules/gap-analyzer/{manifest.cjs,execute.cjs}`
- `server/submodules/cv-builder/{manifest.cjs,execute.cjs}`
- `server/submodules/writer/{manifest.cjs,execute.cjs}`
- `server/skeleton/a2.test.cjs` — host-level integration tests for all three (mock LLM).

**Fill-gap (new, Phase 3 — host-level, NOT a submodule):**
- `server/skeleton/fill-gap/bullet-judge.cjs` — `judgeAnswer({...}, llm)` + `applyAnswer(host, caseId, gapId, answer, llm)`.
- `server/skeleton/fill-gap/bullet-judge.test.cjs` — unit tests (mock LLM).

**API (modified, Phase 5):**
- `server/dev-server.cjs` — add the four `/api/case/...` routes.
- `server/api.test.cjs` — route tests (in-process host + mock LLM).

---

### Task 1: Add `cvDraft` + `coverLetter` case parts

**Files:**
- Modify: `server/skeleton/contract/case.cjs:14`
- Modify: `docs/DATA_CONTRACT.md` (version header + parts list)
- Test: `server/skeleton/contract/case.test.cjs` (create if absent)

**Interfaces:**
- Produces: two new enveloped case parts `cvDraft` and `coverLetter`, both reachable via `writePart(caseId, 'cvDraft'|'coverLetter', data)` and `setPartStatus`. `createCase()` seeds them as `envelope('absent')`.

- [ ] **Step 1: Write the failing test**

Create/extend `server/skeleton/contract/case.test.cjs`:

```javascript
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { createCase, PARTS } = require('./contract/case.cjs');

test('new case seeds cvDraft and coverLetter as absent envelopes', () => {
  assert.ok(PARTS.includes('cvDraft'), 'cvDraft is a registered part');
  assert.ok(PARTS.includes('coverLetter'), 'coverLetter is a registered part');
  const c = createCase({ company: 'Acme', role: 'Head of Product' });
  assert.deepEqual(c.cvDraft, { status: 'absent', data: null, updatedAt: c.cvDraft.updatedAt });
  assert.deepEqual(c.coverLetter, { status: 'absent', data: null, updatedAt: c.coverLetter.updatedAt });
});
```

Note: if the test lives at `server/skeleton/contract/case.test.cjs`, adjust the require path to `'./case.cjs'`. Place the test next to the file under test and fix the relative path accordingly.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `cvDraft is a registered part` assertion fails (part not in `PARTS`).

- [ ] **Step 3: Add the parts**

In `server/skeleton/contract/case.cjs:14`, change:

```javascript
const PARTS = ['dossiers', 'decodedRole', 'fit', 'gaps', 'prep', 'cards', 'liveLog', 'postMortem'];
```
to:
```javascript
const PARTS = ['dossiers', 'decodedRole', 'fit', 'gaps', 'cvDraft', 'coverLetter', 'prep', 'cards', 'liveLog', 'postMortem'];
```

- [ ] **Step 4: Update DATA_CONTRACT.md**

In `docs/DATA_CONTRACT.md`: bump the version header to `v0.3` with date `2026-06-29`; add `cvDraft` and `coverLetter` to the part-kinds list (§ part list, currently `dossiers · decodedRole · fit · gaps · prep · cards · liveLog · postMortem`); add a short section documenting each:
- `cvDraft` — a tailored CV assembled by `cv-builder` by SELECTING datafacts (never authoring). Shape: `{ language, sections: [{ key, heading, items: [{ datafactRef: { kind:'datafact', id }, text }] }] }`.
- `coverLetter` — a cover letter authored by `writer`. Shape: `{ language, paragraphs: [string], unsupported_by_cv: [string] }`.

Also amend the existing `fit` shape (v0.2 → v0.3): each capability requirement gains an OPTIONAL `evidenceRef: { kind:'datafact', id } | null` — present when the evidence is a cited datafact (every `match` has one). This is what makes the verbatim evidence gate-exempt under Task 3's ref-scoped exemption. New shape: `capability.requirements: [{ requirementRef, evidence, evidenceRef, status }]`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (full suite still green, now including the new part assertions).

- [ ] **Step 6: Commit**

```bash
git add server/skeleton/contract/case.cjs server/skeleton/contract/case.test.cjs docs/DATA_CONTRACT.md
git commit -m "feat(contract): add cvDraft + coverLetter case parts (DATA_CONTRACT v0.3)"
```

---

### Task 2: Add the `datalayer` read capability

**Files:**
- Modify: `server/skeleton/registry.cjs:8`
- Modify: `server/skeleton/capabilities.cjs` (after line 76)
- Test: `server/skeleton/capabilities.test.cjs` (create if absent)

**Interfaces:**
- Produces: when a manifest declares `'datalayer'`, `tools.datalayer = { listDatafacts(): datafact[], getDatafact(id): datafact|null }` (read-only; no write path — datafacts are written host-side only).

- [ ] **Step 1: Write the failing test**

Create `server/skeleton/capabilities.test.cjs`:

```javascript
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { buildTools } = require('./capabilities.cjs');
const { createStore } = require('./store/index.cjs');

test('datalayer capability exposes read-only datafact access', () => {
  const store = createStore();
  store.ingestDatafact({ id: 'datafact_a', kind: 'datafact', type: 'summary', text: 'Real CV text.', tags: [], language: 'en' });
  const manifest = { id: 'tester', reads: [], writes: [], capabilities: ['datalayer'] };
  const tools = buildTools({ manifest, callContext: {}, store });
  assert.equal(typeof tools.datalayer.listDatafacts, 'function');
  assert.equal(typeof tools.datalayer.getDatafact, 'function');
  assert.equal(tools.datalayer.listDatafacts().length, 1);
  assert.equal(tools.datalayer.getDatafact('datafact_a').text, 'Real CV text.');
  assert.equal(tools.datalayer.getDatafact('nope'), null);
  assert.equal(tools.datalayer.ingestDatafact, undefined, 'datalayer is read-only — no ingest');
});

test('datalayer is not injected unless declared', () => {
  const store = createStore();
  const manifest = { id: 'tester2', reads: [], writes: [], capabilities: [] };
  const tools = buildTools({ manifest, callContext: {}, store });
  assert.equal(tools.datalayer, undefined);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `unknown capability: datalayer` thrown by `validateManifest`, OR `tools.datalayer` is undefined.

- [ ] **Step 3: Register the capability**

In `server/skeleton/registry.cjs:8`, change:
```javascript
const VALID_CAPABILITIES = new Set(['http', 'logger', 'store', 'request', 'llm', 'search', 'utils']);
```
to:
```javascript
const VALID_CAPABILITIES = new Set(['http', 'logger', 'store', 'request', 'llm', 'search', 'utils', 'datalayer']);
```

- [ ] **Step 4: Inject the capability**

In `server/skeleton/capabilities.cjs`, after the `search` block (line 76, before the `request` block at line 78), add:

```javascript
  // Read-only view of the candidate data-layer (imported datafacts). WRITE is host-level
  // only (store.ingestDatafact) — submodules read evidence, they never mint datafacts.
  if (caps.has('datalayer')) {
    tools.datalayer = {
      listDatafacts: () => store.listDatafacts(),
      getDatafact: (id) => store.getDatafact(id),
    };
  }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/skeleton/registry.cjs server/skeleton/capabilities.cjs server/skeleton/capabilities.test.cjs
git commit -m "feat(skeleton): add read-only datalayer capability for submodules"
```

---

### Task 3: Gate exemption for verbatim datafact evidence

**Files:**
- Modify: `server/skeleton/writing-rules/gate.cjs` (`check`, `enforce`)
- Modify: `server/skeleton/store/index.cjs:67-71` (`writePart` passes datafact texts)
- Test: `server/skeleton/writing-rules/gate.test.cjs` (create/extend)

**Design (ref-scoped exact-equality — brutal-critic corrected).** A collected string is exempt iff it **exactly equals** the `.text` of a datafact that the written value **references** via a `{ kind:'datafact', id }` ref (e.g. `cvDraft.sections[].items[].datafactRef`, `fit.capability.requirements[].evidenceRef`). NOT substring, NOT pool-wide. Why:
- **Exact equality, not substring:** the banned-phrase rules use `\b` word boundaries; a substring exemption (`.includes`) is *broader* than the rule, so a fact containing "dynamics" would exempt an authored "dynamic". Exact whole-string equality is collision-proof.
- **Ref-scoped, not pool-wide:** only facts the value actually cites are exempt. This (a) preserves the design's "verbatim substring of a *cited* datafact" intent, and (b) means authored parts with NO datafact refs (decoder's `decodedRole`, writer's `coverLetter` paragraphs) get the FULL gate — so the existing anti-cliché enforcement does NOT regress once the pool is seeded.
- `writePart` signature is UNCHANGED; the store walks the written value for datafact refs, resolves them to texts, and passes that small set to `enforce`.

**Interfaces:**
- Produces: `check(value, exemptTexts = [])` and `enforce(value, exemptTexts = [])` — `exemptTexts` is an array of strings; a collected string is skipped only on **exact equality** (`new Set(exemptTexts).has(text)`). The store builds `exemptTexts` from `collectRefdFactTexts(data, datafacts)` (texts of the datafacts the value references by id).

- [ ] **Step 1: Write the failing test**

Create/extend `server/skeleton/writing-rules/gate.test.cjs`:

```javascript
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { check, enforce, WritingRuleError } = require('./gate.cjs');

test('authored prose with a banned phrase is still rejected', () => {
  const { ok, violations } = check({ body: 'We spearheaded the launch.' });
  assert.equal(ok, false);
  assert.equal(violations[0].phrase, 'spearheaded');
});

test('a string that EXACTLY equals a referenced datafact text is exempt', () => {
  // Real CV text legitimately containing a banned word, cited verbatim as evidence:
  const datafactText = 'Led the team that spearheaded the 2019 platform rebuild.';
  const { ok } = check({ evidence: datafactText }, [datafactText]);
  assert.equal(ok, true, 'exact-equal verbatim evidence is exempt');
});

test('a substring (not exact) of a datafact is NOT exempt — no laundering', () => {
  const datafactText = 'Led the team that spearheaded the 2019 platform rebuild.';
  // a shorter fragment is NOT exact-equal -> still gated
  const { ok, violations } = check({ evidence: 'spearheaded the rebuild' }, [datafactText]);
  assert.equal(ok, false, 'substring fragments are not exempt');
  assert.equal(violations[0].phrase, 'spearheaded');
});

test('word-boundary mismatch cannot launder (fact has "dynamics", authored "dynamic")', () => {
  const datafactText = 'Market dynamics shifted every quarter.';
  const { ok, violations } = check({ evidence: 'dynamic' }, [datafactText]);
  assert.equal(ok, false, '"dynamic" is not exempted by a fact containing "dynamics"');
  assert.equal(violations[0].phrase, 'dynamic');
});

test('authored prose with no exempt text is still gated', () => {
  const { ok, violations } = check({ body: 'I spearheaded everything single-handedly.' });
  assert.equal(ok, false);
  assert.equal(violations[0].phrase, 'spearheaded');
});

test('enforce throws on un-exempted violations', () => {
  assert.throws(() => enforce({ body: 'robust synergy' }), WritingRuleError);
});
```

Also add a `writePart` integration regression in `server/skeleton/store/index.test.cjs` (create if absent) — this is the seeded-pool regression the review demanded (authored prose must NOT be exempted by an unrelated seeded fact):

```javascript
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { createStore } = require('./index.cjs');

test('writePart: authored prose is gated even when a fact contains the banned word as substring', () => {
  const store = createStore();
  store.ingestDatafact({ id: 'datafact_d', kind: 'datafact', type: 'job_result', text: 'Market dynamics shifted every quarter.', tags: [], language: 'en' });
  const c = store.createCase({});
  // decodedRole carries NO datafact ref -> full gate; "dynamic" must still throw.
  assert.throws(() => store.writePart(c.meta.id, 'decodedRole', { narrative: 'A dynamic team.', requirements: [] }), /Writing-rule/);
});

test('writePart: evidence that cites a fact (by ref) and equals its text is exempt', () => {
  const store = createStore();
  const text = 'Led the team that spearheaded the 2019 platform rebuild.';
  store.ingestDatafact({ id: 'datafact_e', kind: 'datafact', type: 'job_result', text, tags: [], language: 'en' });
  const c = store.createCase({});
  const fit = { capability: { requirements: [{ requirementRef: { kind: 'decodedRequirement', id: 'decodedRequirement_1' }, evidence: text, evidenceRef: { kind: 'datafact', id: 'datafact_e' }, status: 'match' }], overall: '' }, preference: { narrative: '' } };
  assert.doesNotThrow(() => store.writePart(c.meta.id, 'fit', fit));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `check` does not accept `exemptTexts` (exact-equality + boundary tests fail); the `writePart` exemption test fails (cited evidence still flagged because the ref-scoped exemption isn't wired yet).

- [ ] **Step 3: Implement the exemption in the gate**

In `server/skeleton/writing-rules/gate.cjs`, replace `check` (lines 24-33) and `enforce` (lines 43-47) with:

```javascript
function check(value, exemptTexts = []) {
  // Exact whole-string equality only. A collected string is exempt iff it EXACTLY equals
  // the verbatim text of a datafact the value cited (built ref-scoped in store.writePart).
  // No substring/.includes — that would be broader than the \b-bounded rules and launder prose.
  const exempt = new Set(exemptTexts);
  const violations = [];
  for (const text of collectStrings(value)) {
    if (exempt.has(text)) continue;
    for (const { phrase, re } of PATTERNS) {
      const m = re.exec(text);
      if (m) violations.push({ phrase, snippet: snippetAround(text, m.index) });
    }
  }
  return { ok: violations.length === 0, violations };
}
```

```javascript
function enforce(value, exemptTexts = []) {
  const { ok, violations } = check(value, exemptTexts);
  if (!ok) throw new WritingRuleError(violations);
  return true;
}
```

- [ ] **Step 4: Wire ref-scoped datafact texts through `writePart`**

In `server/skeleton/store/index.cjs`, add a helper near the top of `createStore` (after `requireCase`) that walks a value for datafact refs and resolves them to texts:

```javascript
  // Collect the verbatim texts of the datafacts that THIS value references (by a
  // { kind:'datafact', id } ref anywhere in the tree). Only these are gate-exempt — the
  // value must cite a fact to keep its banned-word-bearing real CV text exact.
  function collectRefdFactTexts(value, out = new Set()) {
    if (Array.isArray(value)) { for (const v of value) collectRefdFactTexts(v, out); }
    else if (value && typeof value === 'object') {
      if (value.kind === 'datafact' && value.id) {
        const f = datafacts.get(value.id);
        if (f && typeof f.text === 'string') out.add(f.text);
      }
      for (const v of Object.values(value)) collectRefdFactTexts(v, out);
    }
    return out;
  }
```

Then change `writePart` (lines 67-71) from:

```javascript
  function writePart(caseId, part, data) {
    const c = requireCase(caseId);
    enforce(data);
    return detach(setPartData(c, part, detach(data)));
  }
```
to:
```javascript
  function writePart(caseId, part, data) {
    const c = requireCase(caseId);
    // Ref-scoped verbatim-evidence exemption: only the texts of datafacts this value
    // cites are exempt, by EXACT equality (store/index.cjs header; gate.cjs check()).
    const exemptTexts = [...collectRefdFactTexts(data)];
    enforce(data, exemptTexts);
    return detach(setPartData(c, part, detach(data)));
  }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (full suite green — the existing gate behavior for authored prose is unchanged; only verbatim-evidence strings are newly exempt).

- [ ] **Step 6: Commit**

```bash
git add server/skeleton/writing-rules/gate.cjs server/skeleton/store/index.cjs server/skeleton/writing-rules/gate.test.cjs server/skeleton/store/index.test.cjs
git commit -m "feat(gate): ref-scoped exact-equality exemption for verbatim datafact evidence"
```

> **CHECKPOINT — Phase 0 complete (architectural).** Request brutal-critic/CTO review of Tasks 1–3 before Phase 1. Confirm: the gate exemption cannot launder authored prose, the datalayer is genuinely read-only, the contract bump is documented.

---

### Task 4: CV-data → datafact ingestion mapper (pure function)

**Files:**
- Create: `server/skeleton/datafacts/ingest-cv.cjs`
- Test: `server/skeleton/datafacts/ingest-cv.test.cjs`

**Context — canonical source shape** (`cv-source/en/cv_data.json`): top-level keys `meta, contact, professional_summary {default, tags}, identity_positioning [{label, description, tags}]×7, value_propositions [{text, tags}]×7, skills [{name, tags}], competencies {group: [strings]}, jobs [{id, company, role, date_display, location, tags, tasks_summary, results}], other_work, education, awards, languages, key_metrics, star_stories [{title, company, tags, situation, task, action[]}], digital_expertise, leadership_philosophy`. The 7 `identity_positioning` entries are the "variants" — they become tag groupings, not slots.

**Interfaces:**
- Produces: `cvDataToDatafacts(cvData, language = 'en') -> Array<{ id, kind:'datafact', type, text, tags:string[], language }>`. `id` is minted with the injected `mintId` (pass `tools.ids.mintId` or `require('../ids.cjs').mintId` — this file is skeleton, NOT a submodule, so it MAY require the skeleton). `text` is the verbatim atomic fact. `type` is the source section. `tags` = the item's own tags plus derived tags (`identity`, `value-prop`, the job's `company_short`, etc.). Every datafact carries `language`.

- [ ] **Step 1: Write the failing test**

Create `server/skeleton/datafacts/ingest-cv.test.cjs`:

```javascript
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { cvDataToDatafacts } = require('./ingest-cv.cjs');

const SAMPLE = {
  professional_summary: { default: 'Twenty years building products.', tags: ['product', 'leadership'] },
  identity_positioning: [
    { label: 'C-level executive', description: 'Builds and runs commercial orgs.', tags: ['c-level', 'commercial'] },
  ],
  value_propositions: [{ text: 'Scaled a team from 7 to 40.', tags: ['scaling'] }],
  competencies: { leadership_management: ['Hiring', 'Mentoring'] },
  jobs: [{ id: 'comeon', company_short: 'ComeOn', role: 'CMO', date_display: '2016-2019', location: 'Malta', tags: ['igaming', 'cmo'], tasks_summary: 'Ran marketing.', results: ['Grew revenue 3x.'] }],
  star_stories: [{ title: 'Turnaround', company: 'X', tags: ['leadership'], situation: 'S', task: 'T', action: ['A1', 'A2'] }],
};

test('maps each atomic fact to a datafact with language and tags', () => {
  const facts = cvDataToDatafacts(SAMPLE, 'en');
  assert.ok(facts.length >= 7, `expected >=7 datafacts, got ${facts.length}`);
  for (const f of facts) {
    assert.equal(f.kind, 'datafact');
    assert.equal(f.language, 'en');
    assert.ok(f.id.startsWith('datafact_'), 'id is a datafact id');
    assert.ok(typeof f.text === 'string' && f.text.length > 0, 'has verbatim text');
    assert.ok(Array.isArray(f.tags), 'has tags');
  }
  const summary = facts.find((f) => f.type === 'professional_summary');
  assert.equal(summary.text, 'Twenty years building products.');
  const idp = facts.find((f) => f.type === 'identity_positioning');
  assert.ok(idp.tags.includes('c-level'), 'identity tags carried through');
  const jobResult = facts.find((f) => f.text === 'Grew revenue 3x.');
  assert.ok(jobResult.tags.includes('ComeOn'), 'job result tagged with company_short');
});

test('language parameter is honoured', () => {
  const facts = cvDataToDatafacts(SAMPLE, 'sv');
  assert.ok(facts.every((f) => f.language === 'sv'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './ingest-cv.cjs'`.

- [ ] **Step 3: Implement the mapper**

Create `server/skeleton/datafacts/ingest-cv.cjs`:

```javascript
'use strict';

// Pure mapper: candidate cv_data.json -> a flat, tagged datafact pool. Every fact is a
// verbatim atomic unit of the candidate's real CV (evidence, never authored prose), so it
// is ingested via store.ingestDatafact (gate-exempt) and carries a `language` tag from day
// one (multilingual-ready — Swedish is a later 'sv' ingest, design §5).

const { mintId } = require('../ids.cjs');

function df(type, text, tags, language) {
  return { id: mintId('datafact'), kind: 'datafact', type, text: String(text).trim(), tags: tags.filter(Boolean), language };
}

function cvDataToDatafacts(cv = {}, language = 'en') {
  const out = [];
  const push = (type, text, tags = []) => { if (text && String(text).trim()) out.push(df(type, text, tags, language)); };

  // professional_summary
  if (cv.professional_summary) push('professional_summary', cv.professional_summary.default, cv.professional_summary.tags || []);

  // identity_positioning (the 7 "variants" -> tag groupings, not slots)
  for (const ip of cv.identity_positioning || []) push('identity_positioning', `${ip.label}: ${ip.description}`, ['identity', ...(ip.tags || [])]);

  // value_propositions
  for (const vp of cv.value_propositions || []) push('value_proposition', vp.text, ['value-prop', ...(vp.tags || [])]);

  // skills
  for (const s of cv.skills || []) push('skill', s.name, ['skill', ...(s.tags || [])]);

  // competencies (group -> each line)
  for (const [group, lines] of Object.entries(cv.competencies || {})) for (const line of lines || []) push('competency', line, ['competency', group]);

  // jobs: tasks_summary + each result bullet, tagged with the job + company_short
  for (const j of cv.jobs || []) {
    const jobTags = [j.company_short, ...(j.tags || [])].filter(Boolean);
    push('job_summary', j.tasks_summary, ['job', ...jobTags, j.role].filter(Boolean));
    for (const r of j.results || []) push('job_result', r, ['job-result', ...jobTags]);
  }

  // other_work
  for (const w of cv.other_work || []) push('other_work', `${w.role} at ${w.company} (${w.years})`, ['other-work', ...(w.tags || [])]);

  // education
  for (const e of cv.education || []) push('education', `${(e.degrees || []).join(', ')} — ${e.institution} (${e.years})`, ['education']);

  // awards
  for (const a of cv.awards || []) push('award', `${a.award} (${a.org}, ${a.years})`, ['award']);

  // star_stories: title + situation/task + each action
  for (const st of cv.star_stories || []) {
    const stTags = ['star-story', ...(st.tags || [])];
    push('star_story', `${st.title}: ${st.situation} ${st.task}`.trim(), stTags);
    for (const a of st.action || []) push('star_action', a, stTags);
  }

  // leadership_philosophy
  if (cv.leadership_philosophy) for (const [k, v] of Object.entries(cv.leadership_philosophy)) push('leadership', `${k}: ${v}`, ['leadership']);

  return out;
}

module.exports = { cvDataToDatafacts };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/skeleton/datafacts/ingest-cv.cjs server/skeleton/datafacts/ingest-cv.test.cjs
git commit -m "feat(datafacts): pure cv_data.json -> tagged datafact pool mapper (language-tagged)"
```

---

### Task 5: Seed runner script

**Files:**
- Create: `scripts/seed-datafacts.cjs`
- Modify: `package.json` (scripts)

**Context:** Mirror the existing `npm run discover` seeder pattern (the filter-set seeder). The runner reads the canonical JSON, maps it via Task 4, and ingests into a host store. Because the store is in-memory, the runner's primary MVP use is `--print` (dry-run, prints the pool so it can be inspected / wired into the API host at boot). The API host (Phase 5) will call the same mapper at startup to populate its store.

**Interfaces:**
- Consumes: `cvDataToDatafacts` (Task 4); `store.ingestDatafact` (host store).
- Produces: `seedDatafacts(store, { jsonPath, language }) -> datafact[]` (exported for reuse by the API host), plus a CLI entry that prints a summary.

- [ ] **Step 1: Write the failing test**

Create `scripts/seed-datafacts.test.cjs`:

```javascript
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { seedDatafacts, DEFAULT_JSON } = require('./seed-datafacts.cjs');
const { createStore } = require('../server/skeleton/store/index.cjs');

test('seedDatafacts ingests datafacts from a json file into a store', () => {
  const tmp = path.join(os.tmpdir(), `cv-${process.pid}.json`);
  fs.writeFileSync(tmp, JSON.stringify({ professional_summary: { default: 'Real summary.', tags: ['x'] } }));
  const store = createStore();
  const facts = seedDatafacts(store, { jsonPath: tmp, language: 'en' });
  assert.ok(facts.length >= 1);
  assert.equal(store.listDatafacts().length, facts.length);
  assert.equal(store.listDatafacts()[0].language, 'en');
  fs.unlinkSync(tmp);
});

// Real-shape contract test. JobSearch is a sibling tree, not in this repo's git, so it may be
// absent in CI — skip when missing rather than fail. Locally it asserts the mapper matches the
// REAL cv_data.json (guards against the shape drift the review flagged).
test('seedDatafacts on the REAL canonical cv_data.json yields a substantial, typed pool', { skip: !fs.existsSync(DEFAULT_JSON) }, () => {
  const store = createStore();
  const facts = seedDatafacts(store);
  assert.ok(facts.length >= 60, `expected >=60 real datafacts, got ${facts.length}`);
  const types = new Set(facts.map((f) => f.type));
  for (const t of ['professional_summary', 'identity_positioning', 'value_proposition', 'job_result', 'competency']) {
    assert.ok(types.has(t), `expected datafacts of type ${t}`);
  }
  assert.ok(facts.every((f) => f.language === 'en'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './seed-datafacts.cjs'`.

- [ ] **Step 3: Implement the runner**

Create `scripts/seed-datafacts.cjs`:

```javascript
'use strict';

// Seed the candidate datafact pool from the canonical English cv_data.json.
// Repeatable + idempotent-by-content (ingestDatafact upserts by id; re-running re-mints
// fresh ids, so for the in-memory MVP this is "load once at boot" — the API host calls
// seedDatafacts() at startup). CLI: `node scripts/seed-datafacts.cjs --print`.

const fs = require('node:fs');
const path = require('node:path');
const { cvDataToDatafacts } = require('../server/skeleton/datafacts/ingest-cv.cjs');

// Canonical source — resolved in the plan's pre-flight (cv-source/en is content-identical to
// the top-level copy, newer, and language-partitioned for the deferred Swedish step).
// scripts/ -> hello lily - app -> Projects -> JobSearch (TWO levels up, verified).
const DEFAULT_JSON = path.resolve(
  __dirname,
  '../../JobSearch/CVs/cv-source/en/cv_data.json',
);

function seedDatafacts(store, { jsonPath = DEFAULT_JSON, language = 'en' } = {}) {
  const cv = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const facts = cvDataToDatafacts(cv, language);
  for (const f of facts) store.ingestDatafact(f);
  return facts;
}

module.exports = { seedDatafacts, DEFAULT_JSON };

if (require.main === module) {
  const { createStore } = require('../server/skeleton/store/index.cjs');
  const store = createStore();
  const facts = seedDatafacts(store);
  const byType = facts.reduce((m, f) => ((m[f.type] = (m[f.type] || 0) + 1), m), {});
  console.log(`Seeded ${facts.length} datafacts (language=en) from\n  ${DEFAULT_JSON}`);
  console.log('By type:', JSON.stringify(byType, null, 2));
  if (process.argv.includes('--print')) console.log(JSON.stringify(facts, null, 2));
}
```

Note: the relative path is `../../JobSearch/...` — TWO `..` (scripts → `hello lily - app` → `Projects` → `JobSearch`). `path.resolve` is lexical so it resolves correctly at runtime regardless of cwd. Run the CLI in Step 5 to confirm the file is found.

- [ ] **Step 4: Add the npm script**

In `package.json`, add to `"scripts"`:
```json
"seed:datafacts": "node scripts/seed-datafacts.cjs"
```

- [ ] **Step 5: Run tests + the live seeder to verify**

Run: `npm test`
Expected: PASS.

Run: `npm run seed:datafacts`
Expected: prints `Seeded N datafacts (language=en) ...` with N in the low hundreds and a by-type breakdown. If the path fails to resolve, fix `DEFAULT_JSON` and re-run.

- [ ] **Step 6: Commit**

```bash
git add scripts/seed-datafacts.cjs scripts/seed-datafacts.test.cjs package.json
git commit -m "feat(seed): datafact seed runner from canonical cv-source/en (npm run seed:datafacts)"
```

---

### Task 6: `gap-analyzer` submodule (A2 core — fit + gaps)

**Files:**
- Create: `server/submodules/gap-analyzer/manifest.cjs`
- Create: `server/submodules/gap-analyzer/execute.cjs`
- Test: `server/skeleton/a2.test.cjs`

**Context — ported prompt:** port the 5-layer analysis prompt from `OnlyiGaming/content-pipeline-modules-v2/modules/step-5-generation/pipeline-job-search/job_analyzer_prompt.md` (+ `_archive/job-analyzer/execute.js`). Adapt its output to the `fit`/`gaps` shapes (design §4). The candidate preferences read is **hard-filter FIT only** (can he credibly meet the needs / does it clear deal-breakers) — NOT desirability (reconciliation 4). `candidate_preferences.json` is local + uncommitted; read it via the API host (pass its parsed content in `input`, OR read it from the datafact pool if present) — do NOT require it from the submodule (require-guard). Recommended: the API route reads `candidate_preferences.json` and passes `input.preferences`; the submodule treats it as optional.

**Interfaces:**
- Consumes: `tools.store.getCase`, `tools.datalayer.listDatafacts`, `tools.llm.completeJSON`, `tools.ids.mintId`, optional `input.preferences`.
- Produces: writes `fit` (shape: `{ capability: { requirements: [{ requirementRef:{kind:'decodedRequirement',id}, evidence, status:'match'|'partial'|'missing' }], overall }, preference: { narrative } }`) and `gaps` (shape: `[{ id:'gap_…', what, why, bridge:{ id:'bridge_…', kind, body, oneLiner, material:[{source, ref?}] }, provenance }]`). Returns `{ ok:true, requirements, matched, gaps }`.

- [ ] **Step 1: Write the failing test**

Create `server/skeleton/a2.test.cjs`:

```javascript
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { createHost } = require('./host.cjs'); // adjust to the real host factory export

const DECODED = {
  narrative: 'They need a commercial product leader.',
  requirements: [
    { id: 'decodedRequirement_1', requirement: 'Scale a commercial org', rationale: '', weight: 0.9 },
    { id: 'decodedRequirement_2', requirement: 'Deep ML platform engineering', rationale: '', weight: 0.8 },
  ],
};

function mockLlm(jsonByMarker) {
  return {
    completeJSON: async ({ prompt }) => {
      for (const [marker, val] of Object.entries(jsonByMarker)) if (prompt.includes(marker)) return val;
      throw new Error('mockLlm: no match');
    },
  };
}

test('gap-analyzer writes honest fit + gaps citing datafacts', async () => {
  const llm = mockLlm({
    'Scale a commercial org': {
      capability: {
        requirements: [
          // cite-by-id: the model returns a datafactId, not free-text evidence
          { requirementId: 'decodedRequirement_1', datafactId: 'datafact_x', status: 'match' },
          { requirementId: 'decodedRequirement_2', datafactId: null, status: 'missing' },
          // a HALLUCINATED id with status match must be downgraded to partial (no valid cite)
          { requirementId: 'decodedRequirement_1', datafactId: 'datafact_nope', status: 'match' },
        ],
        overall: 'Strong commercial fit; ML platform depth is the gap.',
      },
      preference: { narrative: 'Clears deal-breakers; within fit constraints.' },
      gaps: [
        { what: 'No hands-on ML platform engineering', why: 'Role expects deep ML infra', bridgeKind: 'honest-ramp', bridgeBody: 'Has led ML-adjacent teams; can ramp on infra.', bridgeOneLiner: 'Led ML-adjacent delivery.', material: [{ source: 'cv' }] },
      ],
    },
  });
  const host = createHost({ llm });
  host.store.ingestDatafact({ id: 'datafact_x', kind: 'datafact', type: 'job_result', text: 'Grew revenue 3x.', tags: [], language: 'en' });
  const c = host.store.createCase({ company: 'Acme', role: 'Head of Product' });
  host.store.writePart(c.meta.id, 'decodedRole', DECODED);

  const { result } = await host.invoke('gap-analyzer', { caseId: c.meta.id });
  assert.equal(result.ok, true);

  const updated = host.store.getCase(c.meta.id);
  assert.equal(updated.fit.status, 'ready');
  assert.equal(updated.gaps.status, 'ready');
  const reqs = updated.fit.data.capability.requirements;
  const matched = reqs.find((r) => r.requirementRef.id === 'decodedRequirement_1' && r.status === 'match');
  assert.ok(matched, 'req1 has a valid match');
  assert.equal(matched.evidence, 'Grew revenue 3x.', 'evidence resolved from the cited datafact');
  assert.equal(matched.evidenceRef.id, 'datafact_x', 'evidenceRef points at the cited datafact');
  assert.equal(reqs.find((r) => r.requirementRef.id === 'decodedRequirement_2').status, 'missing');
  // the hallucinated-id "match" was downgraded to partial with no evidenceRef
  const downgraded = reqs.find((r) => r.requirementRef.id === 'decodedRequirement_1' && r.status !== 'match');
  assert.equal(downgraded.status, 'partial', 'unverifiable cite downgraded to partial');
  assert.ok(!downgraded.evidenceRef, 'no evidenceRef when the cite is invalid');
  assert.ok(updated.gaps.data[0].id.startsWith('gap_'));
  assert.ok(updated.gaps.data[0].bridge.id.startsWith('bridge_'));
  assert.ok(updated.gaps.data[0].bridge.material.length >= 1, 'bridge has material');
});
```

Adjust `createHost` import + `host.invoke` to the real API (per the explore map: `createHost({ llm, search })` → `host.store`, `host.invoke(id, input)` → `{ result, log }`). Confirm against `server/skeleton/a1.test.cjs`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — submodule `gap-analyzer` not registered (`createHost`'s loaded list lacks it).

- [ ] **Step 3: Write the manifest**

Create `server/submodules/gap-analyzer/manifest.cjs`:

```javascript
'use strict';

// A2 core. Reads the decoded role + the candidate datafact pool, produces an HONEST
// fit (every match cites a real datafact) and gaps (each with a bridge carrying material).
module.exports = {
  id: 'gap-analyzer',
  description: 'A2: reads decodedRole + datafact pool (+ optional preferences) and writes an honest fit (match/partial/missing, each match cited) and gaps (each with a bridge + material).',
  reads: ['meta', 'decodedRole'],
  writes: ['fit', 'gaps'],
  capabilities: ['store', 'logger', 'llm', 'datalayer'],
  options: { model: 'claude-opus-4-8' },
};
```
(`utils` dropped — least privilege; the execute uses `completeJSON` which parses internally.)

- [ ] **Step 4: Write the execute (clone decoder's shape)**

Create `server/submodules/gap-analyzer/execute.cjs`. Clone `server/submodules/decoder/execute.cjs`'s structure (caseId → getCase → setPartStatus pending → completeJSON → map → writePart → return / catch→setPartStatus failed→throw). Key logic:

```javascript
'use strict';

const SYSTEM = `You are an interview-prep analyst. Output STRICT JSON only.
[PORT the 5-layer analysis prompt from pipeline-job-search/job_analyzer_prompt.md here,
 adapted to the output schema below. Hold the honesty bar: a requirement is "match" ONLY
 if a REAL datafact from the provided pool supports it — and you MUST cite that datafact by
 its exact id (datafactId). If nothing in the pool supports it, status is "partial" or
 "missing" and datafactId is null. NEVER invent a datafactId or evidence. Preferences are a
 HARD-FILTER FIT read only — does the role clear deal-breakers / can the candidate credibly
 meet the needs — NOT whether the candidate would enjoy it.]
Schema: { capability: { requirements: [{ requirementId, datafactId: string|null, status: "match"|"partial"|"missing" }], overall },
          preference: { narrative },
          gaps: [{ what, why, bridgeKind: "reframe"|"adjacent-proof"|"honest-ramp", bridgeBody, bridgeOneLiner, material: [{ source: "cv"|"coop-dialogue", ref? }] }] }`;

module.exports = async function execute(input, options, tools) {
  const { caseId, preferences } = input;
  const theCase = tools.store.getCase(caseId);
  if (!theCase) throw new Error(`gap-analyzer: no such case ${caseId}`);
  const decoded = theCase.decodedRole && theCase.decodedRole.data;
  if (!decoded || !Array.isArray(decoded.requirements)) throw new Error('gap-analyzer: decodedRole missing or has no requirements');

  tools.store.setPartStatus(caseId, 'fit', 'pending');
  tools.store.setPartStatus(caseId, 'gaps', 'pending');
  if (tools.logger) tools.logger.info(`analyzing fit for ${theCase.meta.role || 'role'} @ ${theCase.meta.company}`);

  const pool = tools.datalayer.listDatafacts();
  const factById = new Map(pool.map((f) => [f.id, f]));

  try {
    const result = await tools.llm.completeJSON({
      system: SYSTEM,
      model: options.model,
      maxTokens: 4000,
      prompt: [
        `ROLE NARRATIVE: ${decoded.narrative || ''}`,
        `REQUIREMENTS:\n${decoded.requirements.map((r) => `- (${r.id}) ${r.requirement}`).join('\n')}`,
        `CANDIDATE DATAFACTS (evidence pool — cite the supporting one by its id):\n${pool.map((f) => `- (${f.id}) ${f.text}`).join('\n')}`,
        preferences ? `CANDIDATE PREFERENCES (hard-filter fit only):\n${JSON.stringify(preferences)}` : 'CANDIDATE PREFERENCES: (none provided)',
      ].join('\n\n'),
    });

    const reqIds = new Set(decoded.requirements.map((r) => r.id));
    const fit = {
      capability: {
        requirements: (result?.capability?.requirements || [])
          .filter((r) => reqIds.has(r.requirementId))
          .map((r) => {
            // Cite-by-id honesty: a "match" needs a datafactId that resolves in the pool.
            // An unverifiable cite (hallucinated/absent id) downgrades match -> partial.
            const cited = r.datafactId ? factById.get(r.datafactId) : null;
            const status = r.status === 'match' && !cited ? 'partial' : (r.status || 'missing');
            const base = { requirementRef: tools.ids.ref('decodedRequirement', r.requirementId), evidence: cited ? cited.text : '', status };
            return cited ? { ...base, evidenceRef: tools.ids.ref('datafact', cited.id) } : base;
          }),
        overall: result?.capability?.overall || '',
      },
      preference: { narrative: result?.preference?.narrative || '' },
    };

    const gaps = (result?.gaps || []).map((g) => ({
      id: tools.ids.mintId('gap'),
      what: g.what || '',
      why: g.why || '',
      bridge: {
        id: tools.ids.mintId('bridge'),
        kind: ['reframe', 'adjacent-proof', 'honest-ramp'].includes(g.bridgeKind) ? g.bridgeKind : 'reframe',
        body: g.bridgeBody || '',
        oneLiner: g.bridgeOneLiner || '',
        material: Array.isArray(g.material) && g.material.length ? g.material : [{ source: 'cv' }], // material REQUIRED (design §4)
      },
      provenance: 'gap-analyzer',
    })).filter((g) => g.what);

    tools.store.writePart(caseId, 'fit', fit);
    tools.store.writePart(caseId, 'gaps', gaps);
    return { ok: true, requirements: fit.capability.requirements.length, matched: fit.capability.requirements.filter((r) => r.status === 'match').length, gaps: gaps.length };
  } catch (err) {
    tools.store.setPartStatus(caseId, 'fit', 'failed', err.message);
    tools.store.setPartStatus(caseId, 'gaps', 'failed', err.message);
    throw err;
  }
};
```

Note: `tools.ids.ref('decodedRequirement', id)` requires `meta` not to be read-scoped — `reads` is advisory; only `writes` is enforced. `fit`/`gaps` are declared writes. Good.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — fit has match/missing per the mock; gaps minted with bridge + material.

- [ ] **Step 6: Commit**

```bash
git add server/submodules/gap-analyzer/ server/skeleton/a2.test.cjs
git commit -m "feat(gap-analyzer): A2 honest fit + gaps from decodedRole + datafact pool"
```

---

### Task 7: bullet-judge + fill-gap write-back (host-level)

**Files:**
- Create: `server/skeleton/fill-gap/bullet-judge.cjs`
- Test: `server/skeleton/fill-gap/bullet-judge.test.cjs`

**Context:** This is host-level (NOT a submodule) because resolving a gap MINTS a datafact (`store.ingestDatafact`, host-only). `judgeAnswer` asks the LLM whether the user's answer can become a truthful, CV-worthy bullet. `applyAnswer` orchestrates: judge → on accept, ingest a datafact (tagged `addresses:<requirementId>`, `language:'en'`), flip the matching requirement in `fit` to `match` with the new evidence, and re-write `fit`; on reject, leave the gap open (the mandatory honest-failure path).

**Interfaces:**
- Consumes: a host `store` (with `getCase`, `writePart`, `ingestDatafact`, `getDatafact`), an `llm` with `completeJSON`, `mintId` (from `../ids.cjs`).
- Produces:
  - `judgeAnswer({ requirement, gap, answer }, llm) -> { canFill: boolean, bulletText: string|null, reason: string }`.
  - `applyAnswer(store, llm, { caseId, gapId, answer, requirementId, tags = [] }) -> { outcome: 'accepted'|'stays_gap', newDatafactId?: string, updatedFit?: object, reason: string }`.

- [ ] **Step 1: Write the failing test**

Create `server/skeleton/fill-gap/bullet-judge.test.cjs`:

```javascript
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { applyAnswer } = require('./bullet-judge.cjs');
const { createStore } = require('../store/index.cjs');

function fixtureStore() {
  const store = createStore();
  const c = store.createCase({ company: 'Acme', role: 'Head of Product' });
  store.writePart(c.meta.id, 'decodedRole', { narrative: '', requirements: [{ id: 'decodedRequirement_2', requirement: 'ML platform engineering', rationale: '', weight: 0.8 }] });
  store.writePart(c.meta.id, 'fit', { capability: { requirements: [{ requirementRef: { kind: 'decodedRequirement', id: 'decodedRequirement_2' }, evidence: '', status: 'missing' }], overall: '' }, preference: { narrative: '' } });
  store.writePart(c.meta.id, 'gaps', [{ id: 'gap_1', what: 'No ML platform', why: '', bridge: { id: 'bridge_1', kind: 'honest-ramp', body: '', oneLiner: '', material: [{ source: 'cv' }] }, provenance: 'gap-analyzer' }]);
  return { store, caseId: c.meta.id };
}

test('accepted answer mints a datafact and flips the requirement to match', async () => {
  const llm = { completeJSON: async () => ({ canFill: true, bulletText: 'Built the ML feature store serving 12 models in production.', reason: 'Concrete, truthful, CV-worthy.' }) };
  const { store, caseId } = fixtureStore();
  const res = await applyAnswer(store, llm, { caseId, gapId: 'gap_1', answer: 'I built our feature store for 12 models', requirementId: 'decodedRequirement_2' });
  assert.equal(res.outcome, 'accepted');
  assert.ok(res.newDatafactId.startsWith('datafact_'));
  const fact = store.getDatafact(res.newDatafactId);
  assert.ok(fact.tags.includes('addresses:decodedRequirement_2'));
  assert.equal(fact.language, 'en');
  const req = store.getCase(caseId).fit.data.capability.requirements.find((r) => r.requirementRef.id === 'decodedRequirement_2');
  assert.equal(req.status, 'match');
  assert.equal(req.evidence, 'Built the ML feature store serving 12 models in production.');
});

test('rejected answer leaves the gap open and mints nothing (honest-failure path)', async () => {
  const llm = { completeJSON: async () => ({ canFill: false, bulletText: null, reason: 'Cannot be made truthful from the answer.' }) };
  const { store, caseId } = fixtureStore();
  const before = store.listDatafacts().length;
  const res = await applyAnswer(store, llm, { caseId, gapId: 'gap_1', answer: 'um maybe', requirementId: 'decodedRequirement_2' });
  assert.equal(res.outcome, 'stays_gap');
  assert.equal(store.listDatafacts().length, before, 'no datafact minted');
  const req = store.getCase(caseId).fit.data.capability.requirements.find((r) => r.requirementRef.id === 'decodedRequirement_2');
  assert.equal(req.status, 'missing', 'requirement stays missing');
});

test('a judge-approved bullet with a banned phrase is rejected pre-mint (stays_gap, nothing minted)', async () => {
  const llm = { completeJSON: async () => ({ canFill: true, bulletText: 'Spearheaded the entire ML platform single-handedly.', reason: 'ok' }) };
  const { store, caseId } = fixtureStore();
  const before = store.listDatafacts().length;
  const res = await applyAnswer(store, llm, { caseId, gapId: 'gap_1', answer: 'I led the ML platform work', requirementId: 'decodedRequirement_2' });
  assert.equal(res.outcome, 'stays_gap');
  assert.match(res.reason, /spearheaded/);
  assert.equal(store.listDatafacts().length, before, 'no banned-word datafact minted');
  assert.equal(store.getCase(caseId).fit.data.capability.requirements.find((r) => r.requirementRef.id === 'decodedRequirement_2').status, 'missing');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './bullet-judge.cjs'`.

- [ ] **Step 3: Implement bullet-judge + applyAnswer**

Create `server/skeleton/fill-gap/bullet-judge.cjs`:

```javascript
'use strict';

// The fill-gap mechanism (host-level — minting datafacts is host-only). The bullet-judge
// decides whether a user's answer can become a TRUTHFUL, CV-worthy bullet. Accept -> mint a
// datafact + flip the requirement to match. Reject -> the gap STAYS open (honest-failure
// path, mandatory: no fabrication to satisfy a gap). Design §2 step 3, §6.

const { mintId } = require('../ids.cjs');
const { check } = require('../writing-rules/gate.cjs'); // host-level file MAY require the skeleton

const JUDGE_SYSTEM = `You decide whether a candidate's answer can become a single truthful, specific, CV-worthy bullet.
Rules: do NOT invent facts, numbers, titles, or scope beyond the answer. If the answer is vague, hedged,
or cannot be made truthful without inventing, return canFill:false. If it can, write ONE concrete bullet
using ONLY what the answer states. Output STRICT JSON: { "canFill": boolean, "bulletText": string|null, "reason": string }.`;

async function judgeAnswer({ requirement, gap, answer }, llm) {
  const out = await llm.completeJSON({
    system: JUDGE_SYSTEM,
    model: 'claude-opus-4-8',
    maxTokens: 600,
    prompt: [
      `REQUIREMENT: ${requirement || ''}`,
      `GAP: ${gap ? gap.what : ''}`,
      `CANDIDATE ANSWER: ${answer || ''}`,
    ].join('\n\n'),
  });
  return { canFill: !!out.canFill, bulletText: out.canFill ? (out.bulletText || '').trim() : null, reason: out.reason || '' };
}

async function applyAnswer(store, llm, { caseId, gapId, answer, requirementId, tags = [] }) {
  const theCase = store.getCase(caseId);
  if (!theCase) throw new Error(`applyAnswer: no such case ${caseId}`);
  const gaps = (theCase.gaps && theCase.gaps.data) || [];
  const gap = gaps.find((g) => g.id === gapId) || null;
  const reqs = ((theCase.decodedRole && theCase.decodedRole.data && theCase.decodedRole.data.requirements) || []);
  const requirement = (reqs.find((r) => r.id === requirementId) || {}).requirement || '';

  const verdict = await judgeAnswer({ requirement, gap, answer }, llm);
  if (!verdict.canFill || !verdict.bulletText) {
    return { outcome: 'stays_gap', reason: verdict.reason };
  }

  // The bullet is freshly AUTHORED (not lifted from the real CV), so it MUST pass the
  // writing-rules gate BEFORE it becomes a permanent, gate-exempt datafact. Reject -> stays_gap.
  // (No exemption arg: a fill-gap bullet is authored prose, not cited evidence.)
  const gate = check({ text: verdict.bulletText });
  if (!gate.ok) {
    return { outcome: 'stays_gap', reason: `bullet rejected by writing-rules: ${gate.violations.map((v) => v.phrase).join(', ')}` };
  }

  // Mint the new datafact (now gate-clean, kept verbatim, tagged + language).
  const fact = {
    id: mintId('datafact'),
    kind: 'datafact',
    type: 'fill-gap',
    text: verdict.bulletText,
    tags: [`addresses:${requirementId}`, 'fill-gap', ...tags].filter(Boolean),
    language: 'en',
  };
  store.ingestDatafact(fact);

  // Flip the requirement to match; attach evidenceRef so the re-write survives the
  // ref-scoped exact-equality gate (Task 3) — fact.text is exempt only via its ref.
  const fit = (theCase.fit && theCase.fit.data) || { capability: { requirements: [], overall: '' }, preference: { narrative: '' } };
  fit.capability.requirements = (fit.capability.requirements || []).map((r) =>
    r.requirementRef && r.requirementRef.id === requirementId
      ? { ...r, status: 'match', evidence: fact.text, evidenceRef: { kind: 'datafact', id: fact.id } }
      : r,
  );
  store.writePart(caseId, 'fit', fit); // gate runs; fact.text exempt via evidenceRef

  return { outcome: 'accepted', newDatafactId: fact.id, updatedFit: store.getCase(caseId).fit.data, reason: verdict.reason };
}

module.exports = { judgeAnswer, applyAnswer };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — accepted path mints + flips; rejected path leaves gap open + mints nothing.

- [ ] **Step 5: Commit**

```bash
git add server/skeleton/fill-gap/
git commit -m "feat(fill-gap): bullet-judge + write-back (compounding pool, honest-failure path)"
```

---

### Task 8: `cv-builder` submodule (background, no UI)

**Files:**
- Create: `server/submodules/cv-builder/{manifest.cjs,execute.cjs}`
- Test: extend `server/skeleton/a2.test.cjs`

**Context:** Selects (never authors) the best datafacts per CV section by relevance to the decoded requirements + the `match` evidence in `fit`. Writes a `cvDraft` part. Takes `options.language` hardcoded `'en'`. Since it only SELECTS verbatim datafacts, its output is evidence — but it writes via `writePart` (a case part), so the gate runs; selected datafact text is exempt (Task 3). Any connective text the builder adds (section headings) must be neutral (no banned phrases).

**Interfaces:**
- Consumes: `tools.store.getCase`, `tools.datalayer.listDatafacts`, `tools.llm.completeJSON` (for relevance selection), `tools.ids.ref`.
- Produces: writes `cvDraft` = `{ language, sections: [{ key, heading, items: [{ datafactRef:{kind:'datafact',id}, text }] }] }`. Returns `{ ok:true, sections, items }`.

- [ ] **Step 1: Write the failing test** (extend `a2.test.cjs`)

```javascript
test('cv-builder selects datafacts into a cvDraft (selects, never authors)', async () => {
  const llm = {
    completeJSON: async ({ prompt }) =>
      prompt.includes('SELECT') ? { sections: [{ key: 'experience', heading: 'Experience', datafactIds: ['datafact_x'] }] } : {},
  };
  const host = createHost({ llm });
  host.store.ingestDatafact({ id: 'datafact_x', kind: 'datafact', type: 'job_result', text: 'Grew revenue 3x.', tags: ['ComeOn'], language: 'en' });
  const c = host.store.createCase({ company: 'Acme', role: 'Head of Product' });
  host.store.writePart(c.meta.id, 'decodedRole', { narrative: '', requirements: [{ id: 'decodedRequirement_1', requirement: 'Scale a commercial org', rationale: '', weight: 0.9 }] });
  host.store.writePart(c.meta.id, 'fit', { capability: { requirements: [{ requirementRef: { kind: 'decodedRequirement', id: 'decodedRequirement_1' }, evidence: 'Grew revenue 3x.', status: 'match' }], overall: '' }, preference: { narrative: '' } });

  const { result } = await host.invoke('cv-builder', { caseId: c.meta.id });
  assert.equal(result.ok, true);
  const draft = host.store.getCase(c.meta.id).cvDraft;
  assert.equal(draft.status, 'ready');
  assert.equal(draft.data.language, 'en');
  const item = draft.data.sections[0].items[0];
  assert.equal(item.text, 'Grew revenue 3x.', 'selected datafact text is verbatim');
  assert.equal(item.datafactRef.id, 'datafact_x');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `cv-builder` not registered.

- [ ] **Step 3: Write manifest**

Create `server/submodules/cv-builder/manifest.cjs`:

```javascript
'use strict';
module.exports = {
  id: 'cv-builder',
  description: 'Background: assembles a tailored cvDraft by SELECTING (never authoring) the best datafacts per section by relevance to decodedRole + fit. Language-parameterised.',
  reads: ['meta', 'decodedRole', 'fit'],
  writes: ['cvDraft'],
  capabilities: ['store', 'logger', 'llm', 'datalayer'],
  options: { model: 'claude-opus-4-8', language: 'en' },
};
```

- [ ] **Step 4: Write execute**

Create `server/submodules/cv-builder/execute.cjs` (clone decoder shape). Logic: list datafacts, ask the LLM to SELECT (return datafact ids per section — selection only, no authoring), then resolve ids → `{ datafactRef, text }` using the pool (drop any id not in the pool — guard against hallucinated ids). Use `options.language`. Connective text limited to section headings (neutral). Write `cvDraft`. The selection prompt must include the marker `SELECT` and instruct: "Return ONLY datafact ids; do not write or paraphrase any CV text."

```javascript
'use strict';

const SYSTEM = `You assemble a tailored CV by SELECTING which candidate datafacts belong in each section.
You do NOT write, paraphrase, or invent any CV text — you only choose ids. Output STRICT JSON:
{ "sections": [{ "key": string, "heading": string, "datafactIds": [string] }] }. The word SELECT appears so the host can route. Prefer datafacts whose tags/text match the role's requirements and the matched evidence.`;

module.exports = async function execute(input, options, tools) {
  const { caseId } = input;
  const language = options.language || 'en';
  const theCase = tools.store.getCase(caseId);
  if (!theCase) throw new Error(`cv-builder: no such case ${caseId}`);
  tools.store.setPartStatus(caseId, 'cvDraft', 'pending');

  const pool = tools.datalayer.listDatafacts().filter((f) => f.language === language);
  const byId = new Map(pool.map((f) => [f.id, f]));
  const decoded = (theCase.decodedRole && theCase.decodedRole.data) || { requirements: [] };
  const fit = (theCase.fit && theCase.fit.data) || null;

  try {
    const result = await tools.llm.completeJSON({
      system: SYSTEM,
      model: options.model,
      maxTokens: 2000,
      prompt: [
        'TASK: SELECT datafacts per CV section for this role.',
        `ROLE: ${theCase.meta.role || ''} @ ${theCase.meta.company || ''}`,
        `REQUIREMENTS:\n${decoded.requirements.map((r) => `- ${r.requirement}`).join('\n')}`,
        fit ? `MATCHED EVIDENCE:\n${fit.capability.requirements.filter((r) => r.status === 'match').map((r) => `- ${r.evidence}`).join('\n')}` : '',
        `DATAFACTS (id :: text :: tags):\n${pool.map((f) => `${f.id} :: ${f.text} :: ${(f.tags || []).join(',')}`).join('\n')}`,
      ].join('\n\n'),
    });

    const sections = (result?.sections || []).map((s) => ({
      key: s.key || 'section',
      heading: s.heading || '',
      items: (s.datafactIds || []).filter((id) => byId.has(id)).map((id) => ({ datafactRef: tools.ids.ref('datafact', id), text: byId.get(id).text })),
    })).filter((s) => s.items.length);

    const cvDraft = { language, sections };
    tools.store.writePart(caseId, 'cvDraft', cvDraft);
    return { ok: true, sections: sections.length, items: sections.reduce((n, s) => n + s.items.length, 0) };
  } catch (err) {
    tools.store.setPartStatus(caseId, 'cvDraft', 'failed', err.message);
    throw err;
  }
};
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/submodules/cv-builder/ server/skeleton/a2.test.cjs
git commit -m "feat(cv-builder): background tailored cvDraft by datafact selection (language-param)"
```

---

### Task 9: `writer` submodule (cover letter, background, no UI)

**Files:**
- Create: `server/submodules/writer/{manifest.cjs,execute.cjs}`
- Test: extend `server/skeleton/a2.test.cjs`

**Context — ported prompt:** port the cover-letter SYSTEM_PROMPT from `JobSearch/CVs/generate-cover-letter.js` (+ snapshot `pipeline-job-search/cover_letter_prompt.md`): the banned-AI-words list (the writing-gate already enforces the overlap; keep the prompt's list anyway), the 4–5 paragraph Open/Middle/Bridge/Close structure (~250–320 words), the accuracy guardrails (ComeOn = CMO/CPO/COO; MrGreen = founding team, NOT CPO), the `unsupported_by_cv[]` field, and the no-overstate rule. Uses `fit` (must-haves lead) + `gaps` (the honest bridge paragraph). Writes a `coverLetter` part. **The gate runs on this authored prose** — the prompt's banned-word discipline must hold or `writePart` throws (that's the safety net working). Takes `options.language` = `'en'`.

**Interfaces:**
- Consumes: `tools.store.getCase`, `tools.datalayer.listDatafacts`, `tools.llm.completeJSON`.
- Produces: writes `coverLetter` = `{ language, paragraphs: [string], unsupported_by_cv: [string] }`. Returns `{ ok:true, paragraphs, unsupported }`.

- [ ] **Step 1: Write the failing test** (extend `a2.test.cjs`)

```javascript
test('writer produces a coverLetter that passes the writing gate', async () => {
  const llm = { completeJSON: async () => ({
    paragraphs: [
      'Your search for a commercial product leader maps closely to what I have done.',
      'At ComeOn I ran the commercial org as CMO and grew revenue threefold.',
      'I have led ML-adjacent delivery and would ramp on the infra side quickly.',
      'I would welcome a conversation about the role.',
    ],
    unsupported_by_cv: ['Direct hands-on ML platform engineering'],
  }) };
  const host = createHost({ llm });
  const c = host.store.createCase({ company: 'Acme', role: 'Head of Product' });
  host.store.writePart(c.meta.id, 'fit', { capability: { requirements: [], overall: 'Strong commercial fit.' }, preference: { narrative: '' } });
  host.store.writePart(c.meta.id, 'gaps', []);

  const { result } = await host.invoke('writer', { caseId: c.meta.id });
  assert.equal(result.ok, true);
  const cl = host.store.getCase(c.meta.id).coverLetter;
  assert.equal(cl.status, 'ready');
  assert.equal(cl.data.language, 'en');
  assert.ok(cl.data.paragraphs.length >= 4);
  assert.ok(Array.isArray(cl.data.unsupported_by_cv));
});

test('writer that emits a banned phrase is rejected by the gate (safety net)', async () => {
  const llm = { completeJSON: async () => ({ paragraphs: ['I am a perfect fit and would hit the ground running.'], unsupported_by_cv: [] }) };
  const host = createHost({ llm });
  const c = host.store.createCase({ company: 'Acme', role: 'X' });
  host.store.writePart(c.meta.id, 'fit', { capability: { requirements: [], overall: '' }, preference: { narrative: '' } });
  host.store.writePart(c.meta.id, 'gaps', []);
  await assert.rejects(() => host.invoke('writer', { caseId: c.meta.id }), /Writing-rule violation|WritingRuleError/);
  assert.equal(host.store.getCase(c.meta.id).coverLetter.status, 'failed');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `writer` not registered.

- [ ] **Step 3: Write manifest**

Create `server/submodules/writer/manifest.cjs`:

```javascript
'use strict';
module.exports = {
  id: 'writer',
  description: 'Background: writes a cover letter from fit + gaps + the datafact pool. Must-haves lead; gaps drive the honest bridge paragraph. Carries accuracy guardrails + no-overstate. Language-parameterised.',
  reads: ['meta', 'fit', 'gaps'],
  writes: ['coverLetter'],
  capabilities: ['store', 'logger', 'llm', 'datalayer'],
  options: { model: 'claude-opus-4-8', language: 'en' },
};
```

- [ ] **Step 4: Write execute**

Create `server/submodules/writer/execute.cjs` (clone decoder shape). Port the cover-letter prompt into `SYSTEM`. On catch, `setPartStatus('coverLetter','failed', err.message)` then rethrow — so a gate rejection surfaces as a failed part (test 2). Map the LLM JSON to `{ language, paragraphs, unsupported_by_cv }` and `writePart`.

```javascript
'use strict';

const SYSTEM = `[PORT the cover-letter SYSTEM_PROMPT from JobSearch/CVs/generate-cover-letter.js verbatim:
 banned AI-speak words, 4-5 paragraph Open/Middle/Bridge/Close (~250-320 words), accuracy facts
 (ComeOn = CMO/CPO/COO; MrGreen = founding team, NOT CPO), use ONLY datafact facts, no invented/rounded
 numbers, no overstating to satisfy a gap.]
Output STRICT JSON: { "paragraphs": [string], "unsupported_by_cv": [string] }.`;

module.exports = async function execute(input, options, tools) {
  const { caseId } = input;
  const language = options.language || 'en';
  const theCase = tools.store.getCase(caseId);
  if (!theCase) throw new Error(`writer: no such case ${caseId}`);
  tools.store.setPartStatus(caseId, 'coverLetter', 'pending');

  const fit = (theCase.fit && theCase.fit.data) || null;
  const gaps = (theCase.gaps && theCase.gaps.data) || [];
  const pool = tools.datalayer.listDatafacts().filter((f) => f.language === language);

  try {
    const result = await tools.llm.completeJSON({
      system: SYSTEM,
      model: options.model,
      maxTokens: 1500,
      prompt: [
        `ROLE: ${theCase.meta.role || ''} @ ${theCase.meta.company || ''}`,
        fit ? `FIT OVERALL: ${fit.capability.overall}\nMATCHED:\n${fit.capability.requirements.filter((r) => r.status === 'match').map((r) => `- ${r.evidence}`).join('\n')}` : '',
        gaps.length ? `GAPS (drive the honest bridge paragraph):\n${gaps.map((g) => `- ${g.what}: ${g.bridge.oneLiner}`).join('\n')}` : '',
        `CANDIDATE FACTS (use ONLY these):\n${pool.map((f) => `- ${f.text}`).join('\n')}`,
      ].join('\n\n'),
    });

    const coverLetter = {
      language,
      paragraphs: (result?.paragraphs || []).map((p) => String(p)),
      unsupported_by_cv: (result?.unsupported_by_cv || []).map((s) => String(s)),
    };
    tools.store.writePart(caseId, 'coverLetter', coverLetter); // gate runs on authored prose
    return { ok: true, paragraphs: coverLetter.paragraphs.length, unsupported: coverLetter.unsupported_by_cv.length };
  } catch (err) {
    tools.store.setPartStatus(caseId, 'coverLetter', 'failed', err.message);
    throw err;
  }
};
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — clean letter ready; banned-phrase letter fails the part (gate safety net).

- [ ] **Step 6: Commit**

```bash
git add server/submodules/writer/ server/skeleton/a2.test.cjs
git commit -m "feat(writer): background cover-letter (fit+gaps, week-22 guardrails, gated)"
```

---

### Task 10: API — case read + analyze routes

**Files:**
- Modify: `server/dev-server.cjs` (add routes + seed datafacts at boot)
- Test: `server/api.test.cjs`

**Context:** Extend the existing Node `http` server. At boot, build the host (`createHost({ llm, search })`) and seed datafacts via `seedDatafacts(host.store)` (Task 5). The analyze route reads `candidate_preferences.json` (local, optional) and passes it as `input.preferences`. Routes return JSON via the existing `sendJson`/`readJson` helpers. For testability, factor the route logic into a `createApiHandler(host, { preferencesPath })` function the test can call without binding a socket.

**Interfaces:**
- Consumes: `host.invoke`, `host.store`, `seedDatafacts`, `applyAnswer` (Task 7).
- Produces:
  - `GET /api/case/:id` → `{ ok, case: { meta, decodedRole, fit, gaps, cvDraft, coverLetter } }` (404 if absent).
  - `POST /api/case/:id/analyze` → invoke `gap-analyzer` with `{ caseId, preferences }` → `{ ok, fit, gaps }`.
  - `createApiHandler(host, opts) -> async (req, res) -> boolean` (returns true if it handled the request; false to fall through to Vite).

- [ ] **Step 1: Write the failing test**

Create `server/api.test.cjs`:

```javascript
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { createApiHandler } = require('./dev-server.cjs');
const { createHost } = require('./skeleton/host.cjs');

function mockRes() {
  return { _status: 0, _body: null, writeHead(s) { this._status = s; }, end(b) { this._body = b ? JSON.parse(b) : null; } };
}
function makeReq(method, url, body) {
  const handlers = {};
  const req = { method, url, on(ev, cb) { handlers[ev] = cb; return req; } };
  process.nextTick(() => { if (body) handlers.data && handlers.data(JSON.stringify(body)); handlers.end && handlers.end(); });
  return req;
}

test('GET /api/case/:id returns the case parts; analyze writes fit+gaps', async () => {
  const llm = { completeJSON: async () => ({ capability: { requirements: [], overall: 'ok' }, preference: { narrative: '' }, gaps: [] }) };
  const host = createHost({ llm });
  const c = host.store.createCase({ company: 'Acme', role: 'PM' });
  host.store.writePart(c.meta.id, 'decodedRole', { narrative: '', requirements: [{ id: 'decodedRequirement_1', requirement: 'X', rationale: '', weight: 1 }] });
  const handle = createApiHandler(host, { preferencesPath: null });

  let res = mockRes();
  assert.equal(await handle(makeReq('GET', `/api/case/${c.meta.id}`), res), true);
  assert.equal(res._status, 200);
  assert.equal(res._body.case.meta.company, 'Acme');

  res = mockRes();
  await handle(makeReq('POST', `/api/case/${c.meta.id}/analyze`), res);
  assert.equal(res._status, 200);
  assert.equal(res._body.ok, true);
  assert.equal(host.store.getCase(c.meta.id).fit.status, 'ready');
});

test('GET unknown case is 404', async () => {
  const host = createHost({ llm: { completeJSON: async () => ({}) } });
  const handle = createApiHandler(host, { preferencesPath: null });
  const res = mockRes();
  await handle(makeReq('GET', '/api/case/nope'), res);
  assert.equal(res._status, 404);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `createApiHandler` is not exported.

- [ ] **Step 3: Implement `createApiHandler` + wire routes**

In `server/dev-server.cjs`: add `const { seedDatafacts } = require('../scripts/seed-datafacts.cjs');`, `const { applyAnswer } = require('./skeleton/fill-gap/bullet-judge.cjs');`, and `const { createHost } = require('./skeleton/host.cjs');`. Build the host + handler ONCE at server start, passing the SAME llm to both (so the fill-gap route has an llm — `host.llm` does not exist):

```javascript
const host = createHost();                 // uses defaultLlm() from env (ANTHROPIC_API_KEY)
seedDatafacts(host.store);                  // load the candidate datafact pool at boot
const preferencesPath = path.resolve(__dirname, '../docs/candidate_preferences.json'); // confirmed: exists, local + uncommitted
const llm = host.broker && host.broker.llm ? host.broker.llm : require('./skeleton/host.cjs'); // see note
const handle = createApiHandler(host, { preferencesPath, llm: /* the llm passed to createHost */ undefined });
```

**Resolve the llm wiring cleanly (don't ship the hack above):** pass an explicit llm to BOTH — `const { createAnthropicClient } = require('./skeleton/clients/anthropic.cjs'); const llm = process.env.ANTHROPIC_API_KEY ? createAnthropicClient({ apiKey: process.env.ANTHROPIC_API_KEY }) : null; const host = createHost({ llm }); const handle = createApiHandler(host, { preferencesPath, llm });`. Then `if (await handle(req, res)) return;` before `vite.middlewares`. Export `createApiHandler`. Use existing `readJson`/`sendJson`. (`candidate_preferences.json` lives at `docs/candidate_preferences.json` — confirmed; keys: candidate, purpose, role_target, hard_filters, profile_basis, decision_note.)

```javascript
function createApiHandler(host, { preferencesPath, llm } = {}) {
  // `llm` is threaded explicitly because createHost does NOT expose its llm (host.cjs:79
  // returns { store, registry, broker, loaded, invoke } — the llm is captured inside the
  // broker only). The live server passes the SAME llm it gave createHost.
  function readPreferences() {
    if (!preferencesPath) return undefined;
    try {
      if (!fs.existsSync(preferencesPath)) { console.warn(`[api] preferences not found at ${preferencesPath} — analyzing WITHOUT hard-filter preferences`); return undefined; }
      return JSON.parse(fs.readFileSync(preferencesPath, 'utf8'));
    } catch (err) {
      console.warn(`[api] preferences unreadable (${err.message}) — analyzing WITHOUT them`); // never swallow silently
      return undefined;
    }
  }
  return async function handle(req, res) {
    const m = req.url.match(/^\/api\/case\/([^/]+)(\/analyze|\/generate|\/gap\/([^/]+)\/answer)?$/);
    if (!m) return false;
    const caseId = decodeURIComponent(m[1]);
    const action = m[2];

    if (req.method === 'GET' && !action) {
      const c = host.store.getCase(caseId);
      if (!c) { sendJson(res, 404, { ok: false, error: 'no such case' }); return true; }
      const { meta, decodedRole, fit, gaps, cvDraft, coverLetter } = c;
      sendJson(res, 200, { ok: true, case: { meta, decodedRole, fit, gaps, cvDraft, coverLetter } });
      return true;
    }
    if (req.method === 'POST' && action === '/analyze') {
      try {
        const { result } = await host.invoke('gap-analyzer', { caseId, preferences: readPreferences() });
        const c = host.store.getCase(caseId);
        sendJson(res, 200, { ok: true, fit: c.fit.data, gaps: c.gaps.data, summary: result });
      } catch (err) { sendJson(res, 500, { ok: false, error: err.message }); }
      return true;
    }
    // /gap/:id/answer and /generate handled in Tasks 11 & 12.
    return false;
  };
}
module.exports = { createApiHandler /*, ...existing exports */ };
```

Ensure `fs` + `path` are required at the top of `dev-server.cjs` (they are, per the explore map). Keep any existing `module.exports`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/dev-server.cjs server/api.test.cjs
git commit -m "feat(api): GET /api/case/:id + POST analyze; seed datafacts at boot"
```

---

### Task 11: API — fill-gap answer route

**Files:**
- Modify: `server/dev-server.cjs` (`createApiHandler` — add the answer branch)
- Test: extend `server/api.test.cjs`

**Interfaces:**
- Consumes: `applyAnswer` (Task 7).
- Produces: `POST /api/case/:id/gap/:gapId/answer` body `{ answer, requirementId, tags? }` → `{ ok, outcome:'accepted'|'stays_gap', newDatafactId?, updatedFit?, reason }`.

- [ ] **Step 1: Write the failing test** (extend `server/api.test.cjs`)

```javascript
test('POST /gap/:id/answer accepted flips fit; rejected leaves gap', async () => {
  let canFill = true;
  const llm = { completeJSON: async () => (canFill ? { canFill: true, bulletText: 'Built the feature store for 12 models.', reason: 'ok' } : { canFill: false, bulletText: null, reason: 'no' }) };
  const host = createHost({ llm });
  const c = host.store.createCase({ company: 'Acme', role: 'PM' });
  host.store.writePart(c.meta.id, 'decodedRole', { narrative: '', requirements: [{ id: 'decodedRequirement_1', requirement: 'ML infra', rationale: '', weight: 1 }] });
  host.store.writePart(c.meta.id, 'fit', { capability: { requirements: [{ requirementRef: { kind: 'decodedRequirement', id: 'decodedRequirement_1' }, evidence: '', status: 'missing' }], overall: '' }, preference: { narrative: '' } });
  host.store.writePart(c.meta.id, 'gaps', [{ id: 'gap_1', what: 'No ML infra', why: '', bridge: { id: 'bridge_1', kind: 'honest-ramp', body: '', oneLiner: '', material: [{ source: 'cv' }] }, provenance: 'gap-analyzer' }]);
  const handle = createApiHandler(host, { preferencesPath: null, llm }); // llm threaded — host.llm does not exist

  const res = mockRes();
  await handle(makeReq('POST', `/api/case/${c.meta.id}/gap/gap_1/answer`, { answer: 'I built our feature store for 12 models', requirementId: 'decodedRequirement_1' }), res);
  assert.equal(res._status, 200);
  assert.equal(res._body.outcome, 'accepted');
  assert.equal(host.store.getCase(c.meta.id).fit.data.capability.requirements[0].status, 'match');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — the answer route returns `false` (unhandled) → no 200.

- [ ] **Step 3: Add the answer branch**

In `createApiHandler`, before the final `return false;`, add:

```javascript
    if (req.method === 'POST' && m[3]) { // /gap/:gapId/answer
      const gapId = decodeURIComponent(m[3]);
      try {
        const body = await readJson(req);
        if (!body.answer || !body.requirementId) { sendJson(res, 400, { ok: false, error: 'answer and requirementId are required' }); return true; }
        const out = await applyAnswer(host.store, llm, { caseId, gapId, answer: body.answer, requirementId: body.requirementId, tags: body.tags || [] });
        sendJson(res, 200, { ok: true, ...out });
      } catch (err) { sendJson(res, 500, { ok: false, error: err.message }); }
      return true;
    }
```

Uses the threaded `llm` (NOT `host.llm`, which does not exist). The regex's `[^/]+` requires a non-empty gapId, so `/gap//answer` falls through to Vite; the explicit 400 above covers the missing-body case.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/dev-server.cjs server/api.test.cjs
git commit -m "feat(api): POST /api/case/:id/gap/:gapId/answer (fill-gap write-back)"
```

---

### Task 12: API — generate route (cv-builder + writer)

**Files:**
- Modify: `server/dev-server.cjs` (`createApiHandler` — add the generate branch)
- Test: extend `server/api.test.cjs`

**Interfaces:**
- Consumes: `host.invoke('cv-builder')`, `host.invoke('writer')`.
- Produces: `POST /api/case/:id/generate` → runs both background generators → `{ ok, cvDraft, coverLetter }`. Errors from one generator are reported but do not abort the other (run both, collect statuses).

- [ ] **Step 1: Write the failing test** (extend `server/api.test.cjs`)

```javascript
test('POST /generate runs cv-builder + writer and returns both parts', async () => {
  const llm = { completeJSON: async ({ prompt }) => {
    if (prompt.includes('SELECT')) return { sections: [{ key: 'experience', heading: 'Experience', datafactIds: ['datafact_x'] }] };
    return { paragraphs: ['A clear opening line.', 'A solid middle.', 'An honest bridge.', 'A close.'], unsupported_by_cv: [] };
  } };
  const host = createHost({ llm });
  host.store.ingestDatafact({ id: 'datafact_x', kind: 'datafact', type: 'job_result', text: 'Grew revenue 3x.', tags: ['ComeOn'], language: 'en' });
  const c = host.store.createCase({ company: 'Acme', role: 'PM' });
  host.store.writePart(c.meta.id, 'decodedRole', { narrative: '', requirements: [{ id: 'decodedRequirement_1', requirement: 'X', rationale: '', weight: 1 }] });
  host.store.writePart(c.meta.id, 'fit', { capability: { requirements: [{ requirementRef: { kind: 'decodedRequirement', id: 'decodedRequirement_1' }, evidence: 'Grew revenue 3x.', status: 'match' }], overall: '' }, preference: { narrative: '' } });
  host.store.writePart(c.meta.id, 'gaps', []);
  const handle = createApiHandler(host, { preferencesPath: null });

  const res = mockRes();
  await handle(makeReq('POST', `/api/case/${c.meta.id}/generate`), res);
  assert.equal(res._status, 200);
  assert.equal(res._body.ok, true);
  assert.equal(host.store.getCase(c.meta.id).cvDraft.status, 'ready');
  assert.equal(host.store.getCase(c.meta.id).coverLetter.status, 'ready');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — generate route unhandled.

- [ ] **Step 3: Add the generate branch**

In `createApiHandler`, add before the final `return false;`:

```javascript
    if (req.method === 'POST' && action === '/generate') {
      const out = {};
      for (const id of ['cv-builder', 'writer']) {
        try { await host.invoke(id, { caseId }); } catch (err) { out[`${id}_error`] = err.message; }
      }
      const c = host.store.getCase(caseId);
      out.cvDraft = c.cvDraft.data; out.coverLetter = c.coverLetter.data;
      out.cvDraftStatus = c.cvDraft.status; out.coverLetterStatus = c.coverLetter.status;
      // ok only when BOTH generators produced a ready part — don't render a phantom-complete card.
      out.ok = c.cvDraft.status === 'ready' && c.coverLetter.status === 'ready';
      sendJson(res, out.ok ? 200 : 207, out);
      return true;
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (full suite green — all A2 backend tasks complete).

- [ ] **Step 5: Final review + commit**

Run `/code-review` on the full diff (all 12 tasks) before the final commit. Fix anything it flags.

```bash
git add server/dev-server.cjs server/api.test.cjs
git commit -m "feat(api): POST /api/case/:id/generate (cv-builder + writer)"
```

---

### Task 13: Live smoke test (env-gated, NOT in CI)

**Why:** every test above injects a mock LLM, so a green suite proves the WIRING works, not that the PORTED prompts (the `[PORT …]` blocks in Tasks 6 & 9) produce the target JSON from a real model. This task runs one real end-to-end pass and eyeballs the output. It is manual/local only — gated on `ANTHROPIC_API_KEY` so CI never calls the API.

**Files:**
- Create: `scripts/smoke-a2.cjs`

**Interfaces:**
- Consumes: `createHost`, `seedDatafacts`, a real decodedRole (build a small one inline, or run the real `decoder` if a dossier exists).

- [ ] **Step 1: Write the smoke script**

Create `scripts/smoke-a2.cjs`:

```javascript
'use strict';
// Live end-to-end A2 smoke. Run: ANTHROPIC_API_KEY=... node scripts/smoke-a2.cjs
// NOT a CI test — it makes real Anthropic calls.
const { createHost } = require('../server/skeleton/host.cjs');
const { seedDatafacts } = require('./seed-datafacts.cjs');

(async () => {
  if (!process.env.ANTHROPIC_API_KEY) { console.error('set ANTHROPIC_API_KEY'); process.exit(1); }
  const host = createHost();
  const n = seedDatafacts(host.store).length;
  console.log(`seeded ${n} datafacts`);
  const c = host.store.createCase({ company: 'Example Co', role: 'Head of Product' });
  host.store.writePart(c.meta.id, 'decodedRole', {
    narrative: 'A commercial product leader who can scale an org.',
    requirements: [
      { id: host.store /* placeholder */ ? 'decodedRequirement_1' : 'x', requirement: 'Scale a commercial org', rationale: '', weight: 0.9 },
      { id: 'decodedRequirement_2', requirement: 'Hands-on ML platform engineering', rationale: '', weight: 0.7 },
    ],
  });
  await host.invoke('gap-analyzer', { caseId: c.meta.id });
  await host.invoke('cv-builder', { caseId: c.meta.id });
  await host.invoke('writer', { caseId: c.meta.id });
  const out = host.store.getCase(c.meta.id);
  console.log('FIT:', JSON.stringify(out.fit.data, null, 2));
  console.log('GAPS:', JSON.stringify(out.gaps.data, null, 2));
  console.log('CV DRAFT sections:', (out.cvDraft.data.sections || []).length);
  console.log('COVER LETTER paragraphs:', (out.coverLetter.data.paragraphs || []).length);
  console.log('statuses:', out.fit.status, out.gaps.status, out.cvDraft.status, out.coverLetter.status);
})().catch((e) => { console.error(e); process.exit(1); });
```

Note: fix the requirement-id literals to plain strings (`'decodedRequirement_1'`, `'decodedRequirement_2'`) — the ternary above is a placeholder reminder, not real logic.

- [ ] **Step 2: Run it (manual, local)**

Run: `ANTHROPIC_API_KEY=<key> node scripts/smoke-a2.cjs`
Expected: all four statuses `ready`; FIT cites real datafact evidence; the cover letter passes the gate (if it throws on a banned phrase, tighten the ported prompt — that's the smoke test doing its job). EYEBALL the fit/gaps/letter for honesty + quality.

- [ ] **Step 3: Commit**

```bash
git add scripts/smoke-a2.cjs
git commit -m "chore(smoke): env-gated live A2 end-to-end smoke script (not CI)"
```

---

## Self-Review (against the reconciled design + backend brief)

**Spec coverage:**
- Design §2 gap-analyzer → Task 6 ✓ · cv-builder → Task 8 ✓ · writer → Task 9 ✓ · fill-gap loop + bullet-judge → Task 7 ✓
- Design §3 seed-pool ingestion → Tasks 4–5 ✓ · datalayer read capability → Task 2 ✓ · write-back → Task 7 ✓
- Design §4 data shapes (fit, gaps, datafact) → Tasks 6–7 ✓ · cvDraft/coverLetter parts → Task 1 ✓
- Design §5 multilingual-ready (language tag + language param + language-agnostic analyzer) → Tasks 4, 8, 9 ✓
- Design §6 honesty bar (cited matches, material[], honest-failure) → Tasks 6, 7 ✓; gate exemption → Task 3 ✓
- Design §7 API (GET case, analyze, answer, generate) → Tasks 10–12 ✓
- Design §8 MVP boundary (no docx, no Swedish output, no comment→regeneration loop) → respected (deferred, not built) ✓
- Backend brief build order (seed→analyzer→write-back→fill-gap→API→generators) → Tasks 4→5→6→7→10→11→8→9→12; note: generators (8/9) are placed before their `/generate` route (12) but after the analyzer they depend on — order is sound ✓

**Placeholder scan:** The only intentional "[PORT ...]" markers are in the two LLM SYSTEM prompts (Tasks 6, 9), pointing at exact source files to copy from — prompt text is content to port, not logic to invent. All logic, manifests, shapes, and tests are concrete.

**Type consistency:** `fit` shape (`capability.requirements[].requirementRef/evidence/status`, `preference.narrative`) consistent across Tasks 6, 7, 8, 10, 11. `gaps` shape (`id/what/why/bridge{id,kind,body,oneLiner,material}/provenance`) consistent across Tasks 6, 7, 9. `datafact` shape (`id/kind/type/text/tags/language`) consistent across Tasks 4, 5, 7, 8. `cvDraft`/`coverLetter` shapes consistent across Tasks 1, 8, 9, 12. `createApiHandler(host, opts) -> handle(req,res) -> bool` consistent across Tasks 10, 11, 12.

**Verification items — RESOLVED during the adversarial review (no longer open):**
1. ~~`host.llm` accessible?~~ NO — `createHost` (host.cjs:80) returns `{ store, registry, broker, loaded, invoke }`; llm is captured in the broker only. The API threads `llm` explicitly (Tasks 10–12). ✓
2. ~~`candidate_preferences.json` location?~~ Confirmed `docs/candidate_preferences.json` (keys: candidate, purpose, role_target, hard_filters, profile_basis, decision_note). ✓
3. ~~Seeder relative path?~~ `../../` (two levels), verified. ✓
4. Host invoke API: `host.invoke(id, input) -> { result, log }`, mock injected via `createHost({ llm, search })` — confirmed against `a1.test.cjs` (the explore map). The Task 6/8/9 tests use this shape.

**Type consistency (re-checked after corrections):** `fit.capability.requirements[]` now carries `{ requirementRef, evidence, evidenceRef?, status }` consistently across Tasks 1 (contract), 6 (analyzer writes it), 7 (fill-gap attaches evidenceRef), 8/9/10/11 (read it). `datafactId` (LLM input) vs `evidenceRef`/`datafactRef` (stored `{kind:'datafact',id}`) are distinct and used consistently. The gate's `exemptTexts` (Task 3) is fed only by `collectRefdFactTexts` walking `{kind:'datafact',id}` refs — so any stored part that cites a datafact by ref gets its verbatim text exempted, and nothing else.
