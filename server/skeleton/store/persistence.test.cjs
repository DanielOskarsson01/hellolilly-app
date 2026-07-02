'use strict';

// Stream 2 persistence — snapshot()/hydrate() on the store, and the JSON-file
// persistence wrapper. The store stays in-memory; persistence is a bolt-on that
// serializes the three durable regions (cases, datafacts, collections) and
// deliberately EXCLUDES scratch (private working state, rebuilt per run).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const { createStore } = require('./index.cjs');
const { createPersistentStore } = require('./persistence.cjs');
const { createHost } = require('../host.cjs');

function tmpSnapshotPath() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'll-store-')), 'store.json');
}

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

// --- the JSON-file wrapper ---

test('a persistent store survives a "restart" (same path, new instance)', () => {
  const p = tmpSnapshotPath();
  const a = createPersistentStore({ path: p, debounceMs: 0 });
  const caseId = seedStore(a);
  a.flush();

  const b = createPersistentStore({ path: p });
  assert.equal(b.getCase(caseId).meta.company, 'Acme');
  assert.equal(b.getCase(caseId).decodedRole.status, 'ready');
  assert.equal(b.getDatafact('datafact_1').text, 'Led a team of five.');
  assert.equal(b.getRecord('jobs', 'job_1').title, 'Head of Product');
});

test('mutations trigger a debounced save without an explicit flush', async () => {
  const p = tmpSnapshotPath();
  const a = createPersistentStore({ path: p, debounceMs: 1 });
  a.putRecord('jobs', { id: 'job_auto', title: 'Auto-saved' });
  await delay(40);
  const snap = JSON.parse(fs.readFileSync(p, 'utf8'));
  const b = createStore();
  b.hydrate(snap);
  assert.equal(b.getRecord('jobs', 'job_auto').title, 'Auto-saved');
});

test('a corrupt snapshot file starts empty (no throw) and is kept as .corrupt', () => {
  const p = tmpSnapshotPath();
  fs.writeFileSync(p, '{not json');
  const a = createPersistentStore({ path: p });
  assert.deepEqual(a.listCases(), []);
  assert.ok(fs.existsSync(`${p}.corrupt`));
});

test('createHost accepts an injected store', () => {
  const mine = createStore();
  const host = createHost({ llm: null, search: null, store: mine });
  assert.equal(host.store, mine);
  // and the host actually uses it
  const c = host.store.createCase({ company: 'X', role: 'Y' });
  assert.equal(mine.getCase(c.meta.id).meta.company, 'X');
});
