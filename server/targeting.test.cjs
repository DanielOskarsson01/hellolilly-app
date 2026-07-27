'use strict';

// Section 4 — both graceful-failure faces, deterministic and offline.

const { test } = require('node:test');
const assert = require('node:assert');
const { assessPool, assessDraftThinness } = require('./skeleton/targeting/index.cjs');

const FACTS = [
  { id: 'f1', text: 'Led hands-on campaign delivery across markets', tags: ['ComeOn'] },
  { id: 'f2', text: 'Built the casino platform team', tags: ['Betclic'] },
  { id: 'f3', text: 'Brand strategy and positioning work', tags: [] },
];

test('assessPool: top-weighted requirement with no pool support is THIN; null weight handled explicitly', () => {
  const decoded = { requirements: [
    { id: 'r1', requirement: 'Hands-on campaign delivery', weight: 5 },
    { id: 'r2', requirement: 'SAP implementation background', weight: 5 },
    { id: 'r3', requirement: 'Brand strategy', weight: 2 },
    { id: 'r4', requirement: 'Coordinate sales and product' }, // weight missing
  ] };
  const r = assessPool(decoded, FACTS);
  const byId = Object.fromEntries(r.requirements.map((x) => [x.id, x]));
  assert.strictEqual(byId.r1.thin, false, 'supported top requirement is not thin');
  assert.ok(byId.r1.supportingFactIds.includes('f1'));
  assert.strictEqual(byId.r2.thin, true, 'SAP has nothing in the pool');
  assert.strictEqual(byId.r2.supportCount, 0);
  assert.strictEqual(byId.r3.thin, false);
  assert.strictEqual(byId.r4.weight, null, 'null weight is surfaced as null, never invented');
  assert.strictEqual(byId.r4.topWeighted, false);
  assert.deepStrictEqual(r.thinTop.map((x) => x.id), ['r2'], 'the thin TOP-WEIGHTED list drives face A');
  // null-weight items sort last
  assert.strictEqual(r.requirements[r.requirements.length - 1].id, 'r4');
});

test('assessDraftThinness: jobs under their fixed ceiling are reported, never silent', () => {
  const draft = { sections: [{ key: 'experience', jobs: [
    { key: 'betclic', company: 'Betclic', bullets: [{}, {}] },        // ceiling 5 -> underfilled
    { key: 'comeon', company: 'ComeOn', bullets: [{}, {}, {}, {}, {}, {}] }, // ceiling 6 -> full
  ] }] };
  const r = assessDraftThinness(draft);
  assert.strictEqual(r.thin, true);
  assert.deepStrictEqual(r.underfilled.map((j) => j.key), ['betclic']);
  assert.strictEqual(r.jobs.find((j) => j.key === 'betclic').ceiling, 5);
  const full = assessDraftThinness({ sections: [{ key: 'experience', jobs: [{ key: 'comeon', company: 'C', bullets: [{}, {}, {}, {}, {}, {}] }] }] });
  assert.strictEqual(full.thin, false);
});
