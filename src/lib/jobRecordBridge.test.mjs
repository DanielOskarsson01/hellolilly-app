import test from 'node:test';
import assert from 'node:assert';
import { findServerJob } from './jobRecordBridge.mjs';

const records = [
  { id: 'job_a1', externalId: 'jobtech-1', decision: 'new' },
  { id: 'job_b2', externalId: 'remotive-9', decision: 'approved' },
];

test('matches a Home job (id = externalId) to its canonical record → real id', () => {
  const rec = findServerJob(records, { id: 'jobtech-1', co: 'Acme' });
  assert.equal(rec.id, 'job_a1');
});

test('MISS returns null so the caller can fail honestly (no localStorage fallback)', () => {
  assert.equal(findServerJob(records, { id: 'url-only-job', co: 'X' }), null);
});

test('defensive: null job, null externalId, empty records all → null', () => {
  assert.equal(findServerJob(records, null), null);
  assert.equal(findServerJob(records, { co: 'no id' }), null);
  assert.equal(findServerJob([], { id: 'jobtech-1' }), null);
  assert.equal(findServerJob(undefined, { id: 'jobtech-1' }), null);
});
