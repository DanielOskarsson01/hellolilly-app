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
