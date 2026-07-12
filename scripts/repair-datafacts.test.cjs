'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { createStore } = require('../server/skeleton/store/index.cjs');
const { repair, danglingRefs } = require('./repair-datafacts.cjs');

// A tmp cv_data.json whose buggy seed order is [job_summary, job_result].
function fixture() {
  const tmp = path.join(os.tmpdir(), `cv-repair-${process.pid}-${Math.floor(process.hrtime()[1])}.json`);
  fs.writeFileSync(tmp, JSON.stringify({
    jobs: [{ company_short: 'Acme', role: 'X', tags: ['t'], tasks_summary: 'Ran things.', results: [{ text: 'Shipped v1.', tags: ['ship'] }] }],
  }));
  return tmp;
}

// Reproduce a store as the BUGGY ingest left it: same ids the seed minted, but the
// job_result fact holding the literal "[object Object]".
function buggyStore() {
  const store = createStore();
  store.ingestDatafact({ id: 'datafact_sum', kind: 'datafact', type: 'job_summary', text: 'Ran things.', tags: ['job', 'Acme', 'X'], language: 'en' });
  store.ingestDatafact({ id: 'datafact_res', kind: 'datafact', type: 'job_result', text: '[object Object]', tags: ['job-result', 'Acme'], language: 'en' });
  return store;
}

test('repairs "[object Object]" in place, keeps the id, so a case reference still resolves', () => {
  const tmp = fixture();
  try {
    const store = buggyStore();
    // A case whose cvDraft cites the corrupted fact by id — the exact thing the first
    // re-seed severed by re-minting ids.
    const c = store.createCase({ company: 'Acme' });
    store.writePart(c.meta.id, 'cvDraft', { sections: [{ heading: 'Experience', refs: [{ kind: 'datafact', id: 'datafact_res' }] }] });
    assert.equal(danglingRefs(store), 0, 'reference resolves before repair (fact exists, just corrupt)');

    const { fixed } = repair(store, { jsonPath: tmp });

    assert.equal(fixed, 1, 'one fact repaired');
    assert.ok(store.getDatafact('datafact_res'), 'the fact id is unchanged (in-place, not re-minted)');
    assert.equal(store.getDatafact('datafact_res').text, 'Shipped v1.', 'text healed to the real bullet');
    assert.ok(store.getDatafact('datafact_res').tags.includes('ship'), 'the result\'s own tags are carried');
    assert.equal(store.listDatafacts().filter((f) => f.text === '[object Object]').length, 0, 'no corruption remains');
    assert.equal(danglingRefs(store), 0, 'the case reference STILL resolves after repair — the regression guard');
  } finally {
    fs.unlinkSync(tmp);
  }
});

test('preserves fill-gap answers and is idempotent', () => {
  const tmp = fixture();
  try {
    const store = buggyStore();
    store.ingestDatafact({ id: 'datafact_gap', kind: 'datafact', type: 'fill-gap', text: 'A gap answer.', tags: ['fill-gap'], language: 'en' });
    repair(store, { jsonPath: tmp });
    assert.ok(store.getDatafact('datafact_gap'), 'gap answer preserved');
    // Re-running finds nothing to fix.
    const second = repair(store, { jsonPath: tmp });
    assert.equal(second.fixed, 0, 'idempotent: a clean store is left untouched');
  } finally {
    fs.unlinkSync(tmp);
  }
});

test('aborts rather than guess when the store does not align with cv_data.json', () => {
  const tmp = fixture();
  try {
    const store = createStore();
    // Wrong shape at index 0: a non-corrupt fact whose text will not match the fixture.
    store.ingestDatafact({ id: 'datafact_x', kind: 'datafact', type: 'job_summary', text: 'Different summary.', tags: [], language: 'en' });
    store.ingestDatafact({ id: 'datafact_y', kind: 'datafact', type: 'job_result', text: '[object Object]', tags: [], language: 'en' });
    assert.throws(() => repair(store, { jsonPath: tmp }), /alignment/, 'refuses to repair a misaligned store');
  } finally {
    fs.unlinkSync(tmp);
  }
});
