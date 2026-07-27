'use strict';

// INVARIANT 4 + the 3.7 authorship discriminator — deterministic, offline (gate 2:
// numeral grounding).

const { test } = require('node:test');
const assert = require('node:assert');
const { groundingTokens, tokenSupportedBy, classifyGrounding } = require('./skeleton/suggest/grounding.cjs');

test('groundingTokens: digit-bearing tokens only, punctuation trimmed', () => {
  assert.deepStrictEqual(groundingTokens('Grew revenue 40% in 2023 (Q4).'), ['40%', '2023', 'Q4']);
  assert.deepStrictEqual(groundingTokens('No numbers at all here.'), []);
  assert.deepStrictEqual(groundingTokens('A 2019-2023 range and 3x growth.'), ['2019-2023', '3x']);
});

test('tokenSupportedBy: exact digit-run equality, never substring', () => {
  assert.strictEqual(tokenSupportedBy('Grew 40% year on year', '40%'), true);
  assert.strictEqual(tokenSupportedBy('Grew 40 percent year on year', '40%'), true, 'format drift tolerated on equal runs');
  assert.strictEqual(tokenSupportedBy('Joined in 2012', '12'), false, '12 never matches inside 2012');
  assert.strictEqual(tokenSupportedBy('From 2019 to 2023', '2019-2023'), true, 'every run must appear');
  assert.strictEqual(tokenSupportedBy('From 2019 onwards', '2019-2023'), false);
  assert.strictEqual(tokenSupportedBy('Grew 400% once', '40%'), false);
});

test('INV4: all tokens in spans -> span-grounded', () => {
  const r = classifyGrounding({
    finalText: 'Grew revenue 40% and led a team of 12.',
    draftText: 'Grew revenue 40% and led a team of 12.',
    spanTexts: ['Revenue grew 40% under my leadership; my team was 12 people.'],
  });
  assert.strictEqual(r.grounding, 'span-grounded');
  assert.strictEqual(r.ok, true);
});

test('INV4 + discriminator: an unsupported token PRESENT IN THE DRAFT is a defective proposal', () => {
  const r = classifyGrounding({
    finalText: 'Grew revenue 40% across 6 markets.',
    draftText: 'Grew revenue 40% across 6 markets.', // model invented "6 markets"
    spanTexts: ['Revenue grew 40%.'],
  });
  assert.strictEqual(r.grounding, 'defective');
  assert.strictEqual(r.ok, false);
  assert.deepStrictEqual(r.defectiveTokens, ['6']);
});

test('discriminator: an unsupported token ONLY in the person\'s final wording mints person-attested', () => {
  const r = classifyGrounding({
    finalText: 'Grew revenue 40% across 6 markets.', // the person ADDED "6 markets"
    draftText: 'Grew revenue 40%.',
    spanTexts: ['Revenue grew 40%.'],
  });
  assert.strictEqual(r.grounding, 'person-attested');
  assert.strictEqual(r.ok, true, 'person-attested content mints freely (D22)');
  assert.deepStrictEqual(r.personTokens, ['6']);
});

test('discriminator: a model-invented token survives as defective even after a person edit keeps it', () => {
  const r = classifyGrounding({
    finalText: 'Led delivery, grew revenue 40% across 6 markets in my own words.',
    draftText: 'Grew revenue 40% across 6 markets.', // "6" originates in the draft
    spanTexts: ['Revenue grew 40%.'],
  });
  assert.strictEqual(r.grounding, 'defective', 'the model cannot hide an invention behind the person\'s click OR edit');
});

test('pure person-typed entry (no draft, no spans) is person-attested by construction', () => {
  const r = classifyGrounding({ finalText: 'I renegotiated 14 supplier contracts in 2008.', draftText: '', spanTexts: [] });
  assert.strictEqual(r.grounding, 'person-attested');
  assert.strictEqual(r.ok, true);
});

test('no digit tokens at all -> span-grounded (the deterministic core has nothing to refuse)', () => {
  const r = classifyGrounding({ finalText: 'Led the team.', draftText: 'Led the team.', spanTexts: ['I led the team.'] });
  assert.strictEqual(r.grounding, 'span-grounded');
});
