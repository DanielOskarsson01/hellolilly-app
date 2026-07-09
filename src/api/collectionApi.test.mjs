import { test } from 'node:test';
import assert from 'node:assert';
import { listCollection, upsertRecord, removeCollectionRecord } from './collectionApi.js';

function withMocks(run) {
  const events = [];
  const calls = [];
  const origFetch = globalThis.fetch;
  const origWindow = globalThis.window;
  globalThis.window = { dispatchEvent: (e) => events.push(e) };
  globalThis.fetch = async (url, opts) => {
    calls.push({ url, opts });
    return {
      ok: true, status: 200,
      json: async () => ({ ok: true, records: [{ id: 'r1' }], record: { id: 'r1' }, removed: true }),
    };
  };
  return run(events, calls).finally(() => { globalThis.fetch = origFetch; globalThis.window = origWindow; });
}

test('listCollection GETs the collection and returns records', async () => {
  await withMocks(async (events, calls) => {
    const rows = await listCollection('activity');
    assert.deepEqual(rows, [{ id: 'r1' }]);
    assert.equal(calls[0].url, '/api/collection/activity');
    assert.equal(calls[0].opts.method, undefined, 'GET is the default method, should not be explicitly set');
  });
});

test('upsertRecord POSTs and dispatches ll:collection:changed with the name', async () => {
  await withMocks(async (events, calls) => {
    const rec = await upsertRecord('tasks', { id: 'r1' });
    assert.equal(rec.id, 'r1');
    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'll:collection:changed');
    assert.equal(events[0].detail.name, 'tasks');
    assert.equal(calls[0].url, '/api/collection/tasks');
    assert.equal(calls[0].opts.method, 'POST');
    assert.deepEqual(JSON.parse(calls[0].opts.body), { id: 'r1' });
  });
});

test('removeCollectionRecord DELETEs and dispatches the event', async () => {
  await withMocks(async (events, calls) => {
    const out = await removeCollectionRecord('tasks', 'r1');
    assert.equal(out.ok, true);
    assert.equal(events[0].detail.name, 'tasks');
    assert.equal(calls[0].url, '/api/collection/tasks/r1');
    assert.equal(calls[0].opts.method, 'DELETE');
  });
});
