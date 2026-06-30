'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { createApiHandler } = require('./dev-server.cjs');
const { createHost } = require('./skeleton/host.cjs');

function mockRes() {
  return {
    _status: 0,
    _body: null,
    writeHead(s) { this._status = s; },
    end(b) { this._body = b ? JSON.parse(b) : null; },
  };
}

function makeReq(method, url, body) {
  const handlers = {};
  const req = { method, url, on(ev, cb) { handlers[ev] = cb; return req; } };
  process.nextTick(() => {
    if (body) handlers.data && handlers.data(JSON.stringify(body));
    handlers.end && handlers.end();
  });
  return req;
}

test('GET /api/case/:id returns the case parts; analyze writes fit+gaps', async () => {
  const llm = { completeJSON: async () => ({ capability: { requirements: [], overall: 'ok' }, preference: { narrative: '' }, gaps: [] }) };
  const host = createHost({ llm });
  const c = host.store.createCase({ company: 'Acme', role: 'PM' });
  host.store.writePart(c.meta.id, 'decodedRole', { narrative: '', requirements: [{ id: 'decodedRequirement_1', requirement: 'X', rationale: '', weight: 1 }] });
  const handle = createApiHandler(host, { preferencesPath: null, llm });

  let res = mockRes();
  assert.equal(await handle(makeReq('GET', `/api/case/${c.meta.id}`), res), true);
  assert.equal(res._status, 200);
  assert.equal(res._body.case.meta.company, 'Acme');
  assert.equal(res._body.case.decodedRole.status, 'ready');

  res = mockRes();
  await handle(makeReq('POST', `/api/case/${c.meta.id}/analyze`), res);
  assert.equal(res._status, 200);
  assert.equal(res._body.ok, true);
  assert.equal(host.store.getCase(c.meta.id).fit.status, 'ready');
  assert.equal(host.store.getCase(c.meta.id).gaps.status, 'ready');
});

test('GET unknown case is 404', async () => {
  const host = createHost({ llm: { completeJSON: async () => ({}) } });
  const handle = createApiHandler(host, { preferencesPath: null, llm: null });
  const res = mockRes();
  assert.equal(await handle(makeReq('GET', '/api/case/nope'), res), true);
  assert.equal(res._status, 404);
  assert.equal(res._body.ok, false);
});

test('a non-case URL falls through (handler returns false)', async () => {
  const host = createHost({ llm: { completeJSON: async () => ({}) } });
  const handle = createApiHandler(host, { preferencesPath: null });
  const res = mockRes();
  assert.equal(await handle(makeReq('GET', '/api/health'), res), false);
  assert.equal(res._status, 0, 'handler did not write a response for an unmatched route');
});
