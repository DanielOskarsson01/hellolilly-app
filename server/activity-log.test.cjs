'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { createStore } = require('./skeleton/store/index.cjs');
const { logActivity } = require('./activity-log.cjs');

test('logActivity appends a well-formed record to the activity collection', () => {
  const store = createStore();
  const rec = logActivity(store, { type: 'case_created', caseId: 'case_1', label: 'Ärende skapat' },
    { now: '2026-07-09T00:00:00.000Z', id: 'activity_test1' });
  assert.equal(rec.id, 'activity_test1');
  assert.equal(rec.at, '2026-07-09T00:00:00.000Z');
  assert.equal(rec.type, 'case_created');
  assert.equal(rec.caseId, 'case_1');
  assert.equal(rec.label, 'Ärende skapat');
  assert.deepEqual(rec.meta, {});
  assert.equal(rec.source, 'system');
  const rows = store.listRecords('activity');
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], rec);
});

test('logActivity is append-only — two calls make two rows', () => {
  const store = createStore();
  logActivity(store, { type: 'analysis_run', caseId: 'case_1', label: 'A' }, { id: 'a1', now: 't1' });
  logActivity(store, { type: 'analysis_run', caseId: 'case_1', label: 'B' }, { id: 'a2', now: 't2' });
  assert.equal(store.listRecords('activity').length, 2);
});

test('logActivity defaults caseId=null, mints an id, stamps an ISO time', () => {
  const store = createStore();
  const rec = logActivity(store, { type: 'job_approved', label: 'Jobb godkänt' });
  assert.equal(rec.caseId, null);
  assert.match(rec.id, /^activity_[0-9a-f]{8}$/);
  assert.match(rec.at, /^\d{4}-\d{2}-\d{2}T/);
});

test('logActivity requires type and label', () => {
  const store = createStore();
  assert.throws(() => logActivity(store, { type: 'x' }), /type and label are required/);
  assert.throws(() => logActivity(store, { label: 'y' }), /type and label are required/);
});
