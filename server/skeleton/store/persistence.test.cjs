'use strict';

// Stream 2 persistence — snapshot()/hydrate() on the store, and the JSON-file
// persistence wrapper. The store stays in-memory; persistence is a bolt-on that
// serializes the three durable regions (cases, datafacts, collections) and
// deliberately EXCLUDES scratch (private working state, rebuilt per run).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createStore } = require('./index.cjs');

function seedStore(store) {
  const c = store.createCase({ company: 'Acme', role: 'PM' });
  store.writePart(c.meta.id, 'decodedRole', {
    narrative: 'A plain narrative.',
    requirements: [{ id: 'decodedRequirement_1', requirement: 'Ship things', rationale: 'They ship weekly', weight: 3 }],
  });
  store.ingestDatafact({ id: 'datafact_1', kind: 'datafact', type: 'cv', text: 'Led a team of five.', tags: [], language: 'en' });
  store.putRecord('jobs', { id: 'job_1', title: 'Head of Product' });
  store.scratch('some-submodule').set('k', 'private working value');
  return c.meta.id;
}

test('snapshot -> hydrate round-trips cases, datafacts and collections', () => {
  const a = createStore();
  const caseId = seedStore(a);

  // JSON round-trip proves the snapshot is JSON-safe (what the file wrapper writes).
  const snap = JSON.parse(JSON.stringify(a.snapshot()));

  const b = createStore();
  b.hydrate(snap);

  assert.deepEqual(b.getCase(caseId), a.getCase(caseId));
  assert.deepEqual(b.getDatafact('datafact_1'), a.getDatafact('datafact_1'));
  assert.deepEqual(b.getRecord('jobs', 'job_1'), a.getRecord('jobs', 'job_1'));
  assert.equal(b.getCase(caseId).decodedRole.status, 'ready');
});

test('scratch is NOT part of the snapshot', () => {
  const a = createStore();
  seedStore(a);
  const snap = a.snapshot();
  assert.equal(JSON.stringify(snap).includes('private working value'), false);

  const b = createStore();
  b.hydrate(snap);
  assert.equal(b.scratch('some-submodule').get('k'), undefined);
});

test('hydrate detaches: mutating the snapshot afterwards does not reach the store', () => {
  const a = createStore();
  const caseId = seedStore(a);
  const snap = a.snapshot();

  const b = createStore();
  b.hydrate(snap);
  // mutate the snapshot object after hydrate
  for (const [, c] of snap.cases) c.meta.company = 'MUTATED';
  assert.equal(b.getCase(caseId).meta.company, 'Acme');
});

test('hydrate rejects an unversioned snapshot', () => {
  const b = createStore();
  assert.throws(() => b.hydrate({ cases: [] }), /snapshot/);
});
