import { test } from 'node:test';
import assert from 'node:assert';
import { listCollection, upsertRecord, removeCollectionRecord } from './collectionApi.js';

function withMocks(run) {
  const events = [];
  const origFetch = globalThis.fetch;
  const origWindow = globalThis.window;
  globalThis.window = { dispatchEvent: (e) => events.push(e) };
  globalThis.fetch = async (url, opts) => ({
    ok: true, status: 200,
    json: async () => ({ ok: true, records: [{ id: 'r1' }], record: { id: 'r1' }, removed: true }),
    _url: url, _opts: opts,
  });
  return run(events).finally(() => { globalThis.fetch = origFetch; globalThis.window = origWindow; });
}

test('listCollection GETs the collection and returns records', async () => {
  await withMocks(async () => {
    const rows = await listCollection('activity');
    assert.deepEqual(rows, [{ id: 'r1' }]);
  });
});

test('upsertRecord POSTs and dispatches ll:collection:changed with the name', async () => {
  await withMocks(async (events) => {
    const rec = await upsertRecord('tasks', { id: 'r1' });
    assert.equal(rec.id, 'r1');
    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'll:collection:changed');
    assert.equal(events[0].detail.name, 'tasks');
  });
});

test('removeCollectionRecord DELETEs and dispatches the event', async () => {
  await withMocks(async (events) => {
    const out = await removeCollectionRecord('tasks', 'r1');
    assert.equal(out.ok, true);
    assert.equal(events[0].detail.name, 'tasks');
  });
});
