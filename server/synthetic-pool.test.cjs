'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const tailor = require('./submodules/cv-tailor/execute.cjs');
const M = require('../harness/phase0/parity-metric.cjs');
const { SYNTHETIC_FACTS, SYNTHETIC_GOOD_SELECTION } = require('../harness/phase0/synthetic-pool.cjs');

const BLOCK = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'harness', 'phase0', 'TEMPLATE_DEFINITION.md'), 'utf8').match(/```json\s*([\s\S]*?)```/)[1]);
const byId = new Map(SYNTHETIC_FACTS.map((f) => [f.id, f]));

// Finding 6b: the committed synthetic pool must let the tailor build a fully valid draft with NO
// gitignored file — so the live zero-tolerance eval runs from a clean checkout. This is that proof.
test('synthetic pool + good selection -> a valid full draft (pre-write gate + P1 + P2 all clean)', () => {
  const draft = tailor.assembleDraft(SYNTHETIC_GOOD_SELECTION, byId, SYNTHETIC_FACTS, 'en');
  assert.deepStrictEqual(tailor.validateDraftPreWrite(draft, byId).errors, [], 'pre-write gate clean');
  assert.deepStrictEqual(M.validateStructure(draft, BLOCK).errors, [], 'P1 clean');
  const poolIds = new Set(SYNTHETIC_FACTS.map((f) => f.id));
  const sourceText = new Map(SYNTHETIC_FACTS.map((f) => [f.id, f.text]));
  const structuralText = M.buildStructuralText(BLOCK, SYNTHETIC_FACTS);
  assert.deepStrictEqual(M.validateProvenance(draft, poolIds, sourceText, structuralText).errors, [], 'P2 clean');
});

// Finding 10: fixture hygiene — no real employer history or CV-derived claim TEXT. The only real
// strings permitted are the structural constants: taxonomy titles + the frozen job-routing tags.
const REAL_IN_TEXT = /OnlyiGaming|Coinhero|Betclic|ComeOn|MrGreen|Cherry|Antler|PlayPalz|Getupdated|Telge Energi|Nofrontiere|McCann|NASDAQ|Daniel|Oskarsson/;
test('synthetic pool is fully fabricated: no real employer names or CV claims in any node TEXT', () => {
  for (const f of SYNTHETIC_FACTS) {
    assert.ok(!REAL_IN_TEXT.test(f.text), `fabricated text only, got: "${f.text}"`);
  }
});

// Finding 10 / D13 — extend the hygiene guard from ONE pool to EVERY eval/test datafact pool, so a
// real-employer string in fact TEXT cannot regress silently anywhere. Scans the fact-TEXT positions
// of each pool-bearing source: object `text:` fields and DF(id, type, TEXT, ...) positional args.
// Structural constants stay allowed — the frozen job-routing TAGS (e.g. tags: ['ComeOn']) and the
// committed persona name (name_contact.name) are NOT fact text, so they are not scanned here.
const POOL_FILES = [
  'harness/phase0/synthetic-pool.cjs',
  'server/api.test.cjs',
  'server/eval-gate.test.cjs',
  'server/cv-tailor.test.cjs',
  'server/skeleton/fill-gap/keyword-judge.test.cjs',
  'server/skeleton/datafacts/ingest-cv.test.cjs',
];
test('finding 10 (D13): no real employer history in any eval/test datafact-pool TEXT', () => {
  const HL = path.join(__dirname, '..');
  const offenders = [];
  const textField = /\btext\s*:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g;
  const dfArg = /\bDF\(\s*'(?:[^'\\]|\\.)*'\s*,\s*'(?:[^'\\]|\\.)*'\s*,\s*'((?:[^'\\]|\\.)*)'/g;
  for (const rel of POOL_FILES) {
    const src = fs.readFileSync(path.join(HL, rel), 'utf8');
    for (const m of src.matchAll(textField)) {
      const t = m[1] != null ? m[1] : m[2];
      if (REAL_IN_TEXT.test(t)) offenders.push(`${rel}: text "${t}"`);
    }
    for (const m of src.matchAll(dfArg)) {
      if (REAL_IN_TEXT.test(m[1])) offenders.push(`${rel}: DF text "${m[1]}"`);
    }
  }
  assert.deepStrictEqual(offenders, [], `eval/test pool TEXT must be fully synthetic (tags + persona name are the only allowed real strings):\n  ${offenders.join('\n  ')}`);
});
