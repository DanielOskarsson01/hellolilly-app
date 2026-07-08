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
