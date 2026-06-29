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
