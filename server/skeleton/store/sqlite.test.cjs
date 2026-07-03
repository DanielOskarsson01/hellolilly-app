'use strict';

// D1 — the durable store adapter (SQLite via node:sqlite, no external deps).
// The adapter must be signature-compatible with createStore() and preserve the two
// contracts the suite enforces elsewhere: the detach/immutability boundary and the
// writing-rules gate on authored case prose. Strategy under test: inner in-memory
// store as source of truth (all semantics inherited), row-level write-through to
// SQLite, full load at open.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createSqliteStore } = require('./sqlite.cjs');

function tmpDbPath() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'll-sqlite-')), 'store.db');
}

function seedStore(store) {
  const c = store.createCase({ company: 'Acme', role: 'PM' });
  store.writePart(c.meta.id, 'decodedRole', {
    narrative: 'A plain narrative.',
    requirements: [{ id: 'decodedRequirement_1', requirement: 'Ship things', rationale: 'They ship weekly', weight: 3 }],
  });
  store.ingestDatafact({ id: 'datafact_1', kind: 'datafact', type: 'cv', text: 'Led a team of five.', tags: [], language: 'en' });
  store.putRecord('jobs', { id: 'job_1', externalId: 'jobtech-1', title: 'Head of Product', decision: 'rejected' });
  return c.meta.id;
}

test('sqlite store survives close + reopen with identical content (no duplication)', () => {
  const p = tmpDbPath();
  const a = createSqliteStore({ path: p });
  const caseId = seedStore(a);
  const before = { cases: a.listCases().length, facts: a.listDatafacts().length, jobs: a.listRecords('jobs').length };
  a.close();

  const b = createSqliteStore({ path: p });
  assert.equal(b.getCase(caseId).meta.company, 'Acme');
  assert.equal(b.getCase(caseId).decodedRole.status, 'ready');
  assert.equal(b.getCase(caseId).decodedRole.data.requirements[0].requirement, 'Ship things');
  assert.equal(b.getDatafact('datafact_1').text, 'Led a team of five.');
  assert.equal(b.getRecord('jobs', 'job_1').decision, 'rejected', 'job decisions survive');
  assert.deepEqual(
    { cases: b.listCases().length, facts: b.listDatafacts().length, jobs: b.listRecords('jobs').length },
    before,
    'reopen does not duplicate anything',
  );
  b.close();
});

test('detach/immutability boundary holds through the adapter', () => {
  const p = tmpDbPath();
  const store = createSqliteStore({ path: p });
  const rec = { id: 'job_x', tags: ['a'] };
  store.putRecord('jobs', rec);
  rec.tags.push('mutated-after-put');
  assert.deepEqual(store.getRecord('jobs', 'job_x').tags, ['a']);
  const got = store.getRecord('jobs', 'job_x');
  got.tags.push('mutated-after-read');
  assert.deepEqual(store.getRecord('jobs', 'job_x').tags, ['a']);
  store.close();
});

test('the writing-rules gate still throws and persists NOTHING', () => {
  const p = tmpDbPath();
  const a = createSqliteStore({ path: p });
  const c = a.createCase({ company: 'Acme', role: 'PM' });
  assert.throws(() => a.writePart(c.meta.id, 'decodedRole', { narrative: 'A robust dynamic synergy.', requirements: [] }), /Writing-rule/i);
  a.close();

  const b = createSqliteStore({ path: p });
  assert.equal(b.getCase(c.meta.id).decodedRole.status, 'absent', 'gate-rejected write left no trace on disk');
  b.close();
});

test('removeRecord persists the deletion', () => {
  const p = tmpDbPath();
  const a = createSqliteStore({ path: p });
  a.putRecord('jobs', { id: 'job_gone', title: 'X' });
  assert.equal(a.removeRecord('jobs', 'job_gone'), true);
  a.close();
  const b = createSqliteStore({ path: p });
  assert.equal(b.getRecord('jobs', 'job_gone'), null);
  b.close();
});

test('hydrate() rewrites the database (the JSON-snapshot migration path)', () => {
  const { createStore } = require('./index.cjs');
  const legacy = createStore();
  const caseId = seedStore(legacy);
  const snap = legacy.snapshot();

  const p = tmpDbPath();
  const a = createSqliteStore({ path: p });
  a.hydrate(snap);
  a.close();

  const b = createSqliteStore({ path: p });
  assert.equal(b.getCase(caseId).meta.company, 'Acme');
  assert.equal(b.listDatafacts().length, 1);
  assert.equal(b.getRecord('jobs', 'job_1').decision, 'rejected');
  b.close();
});

test('adapter self-describes for the health route', () => {
  const p = tmpDbPath();
  const store = createSqliteStore({ path: p });
  assert.equal(store.adapter, 'sqlite');
  assert.equal(store.path, p);
  store.close();
});
