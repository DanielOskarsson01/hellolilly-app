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
test('synthetic pool is fully fabricated: no real employer names or CV claims in any node TEXT', () => {
  const REAL_IN_TEXT = /OnlyiGaming|Coinhero|Betclic|ComeOn|MrGreen|Cherry|Antler|PlayPalz|Getupdated|Telge Energi|Nofrontiere|McCann|NASDAQ|Daniel|Oskarsson/;
  for (const f of SYNTHETIC_FACTS) {
    assert.ok(!REAL_IN_TEXT.test(f.text), `fabricated text only, got: "${f.text}"`);
  }
});
