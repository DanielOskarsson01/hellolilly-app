'use strict';

// Job-search skeleton extension — non-case store COLLECTIONS.
// Jobs aren't interview-prep cases (the case-vs-job identity mismatch flagged by Codex, Gemini,
// and the scoping). They live in global, addressable, immutable named regions (jobs / jobSources /
// jobRules / filterSet / …). Same detach-on-boundary immutability as cases; NOT writing-gated
// (they hold imported/structured records, not case authored-prose). Plus the `job` id kind.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createStore } = require('./store/index.cjs');
const { createHost } = require('./host.cjs');
const { mintId, ref, KINDS } = require('./ids.cjs');

test('putRecord / getRecord round-trips a record by id in a named collection', () => {
  const store = createStore();
  const rec = { id: 'job_abc', externalId: 'jobtech-1', title: 'Head of Product' };
  store.putRecord('jobs', rec);
  assert.deepEqual(store.getRecord('jobs', 'job_abc'), rec);
});

test('listRecords returns all records; an unknown collection is empty / null', () => {
  const store = createStore();
  store.putRecord('jobs', { id: 'job_1', title: 'A' });
  store.putRecord('jobs', { id: 'job_2', title: 'B' });
  assert.equal(store.listRecords('jobs').length, 2);
  assert.deepEqual(store.listRecords('nope'), []);
  assert.equal(store.getRecord('nope', 'x'), null);
});

test('putRecord upserts by id (replaces a record with the same id)', () => {
  const store = createStore();
  store.putRecord('jobs', { id: 'job_1', decision: 'new' });
  store.putRecord('jobs', { id: 'job_1', decision: 'approved' });
  assert.equal(store.listRecords('jobs').length, 1);
  assert.equal(store.getRecord('jobs', 'job_1').decision, 'approved');
});

test('putRecord requires a record carrying an id', () => {
  const store = createStore();
  assert.throws(() => store.putRecord('jobs', { title: 'no id' }), /id is required/);
});

test('removeRecord deletes a record', () => {
  const store = createStore();
  store.putRecord('jobSources', { id: 'jobSource_1', url: 'x' });
  assert.equal(store.removeRecord('jobSources', 'jobSource_1'), true);
  assert.equal(store.getRecord('jobSources', 'jobSource_1'), null);
});

test('collections are immutable across the boundary (read + write are detached)', () => {
  const store = createStore();
  const rec = { id: 'job_x', tags: ['a'] };
  store.putRecord('jobs', rec);
  rec.tags.push('mutated-after-put'); // caller mutates its object after the write
  assert.deepEqual(store.getRecord('jobs', 'job_x').tags, ['a'], 'post-put mutation must not persist');

  const got = store.getRecord('jobs', 'job_x');
  got.tags.push('mutated-after-read'); // caller mutates the read copy
  assert.deepEqual(store.getRecord('jobs', 'job_x').tags, ['a'], 'read-copy mutation must not persist');
});

test('the `job` id kind mints and refs', () => {
  assert.ok(KINDS.has('job'));
  assert.match(mintId('job'), /^job_[0-9a-f]{8}$/);
  assert.deepEqual(ref('job', 'job_abc'), { kind: 'job', id: 'job_abc' });
});

test('a submodule with the store capability uses collections via tools.store', async () => {
  const host = createHost({ llm: null, search: null });
  host.registry.register(
    { id: 'coll-user', reads: [], writes: [], capabilities: ['store'] },
    async (_i, _o, tools) => {
      tools.store.putRecord('jobs', { id: 'job_z', title: 'Z' });
      return { got: tools.store.getRecord('jobs', 'job_z'), count: tools.store.listRecords('jobs').length };
    },
  );
  const { result } = await host.invoke('coll-user', {});
  assert.equal(result.got.title, 'Z');
  assert.equal(result.count, 1);
});
