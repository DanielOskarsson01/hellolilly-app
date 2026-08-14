'use strict';

// 3.4 — the document intake API: dedicated constrained routes, explicit parse failure,
// span lifecycle over HTTP, and the generic collection path CLOSED for documents/spans/
// proposals (all three verbs).

const { test } = require('node:test');
const assert = require('node:assert');
const { createApiHandler } = require('./dev-server.cjs');
const { createHost } = require('./skeleton/host.cjs');

function mockRes() {
  return {
    _status: 0, _body: null,
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
const fixture = () => {
  const host = createHost({ llm: { completeJSON: async () => ({}) } });
  return { host, handle: createApiHandler(host, { preferencesPath: null, llm: null }) };
};

test('POST /api/documents ingests, attests, spanises; GET lists with span counts; activity logged', async () => {
  const { host, handle } = fixture();
  let res = mockRes();
  await handle(makeReq('POST', '/api/documents', {
    name: 'My old CV', text: 'EXPERIENCE\n\n- Built a casino brand from scratch\n- Grew revenue 40%',
    attestedClass: 'old_cv', ownership: 'mine',
  }), res);
  assert.equal(res._status, 201);
  assert.equal(res._body.ok, true);
  const docId = res._body.document.id;
  assert.equal(res._body.document.attestedClass, 'old_cv');
  assert.equal(res._body.spans.length, 2);
  assert.ok(res._body.spans.every((s) => s.section === 'EXPERIENCE'));
  assert.equal(host.store.listRecords('activity').filter((a) => a.type === 'document_uploaded').length, 1);

  res = mockRes();
  await handle(makeReq('GET', '/api/documents'), res);
  assert.equal(res._body.documents.length, 1);
  assert.equal(res._body.documents[0].id, docId);
  assert.equal(res._body.documents[0].spanCount, 2);
  assert.equal(res._body.documents[0].factCount, 0, 'library view: facts minted from this document');
});

test('finding 7: blank / heading-only content is the explicit 422 parse_failed envelope, nothing stored', async () => {
  const { host, handle } = fixture();
  for (const text of ['', '   \n\t ', 'SUMMARY']) {
    const res = mockRes();
    await handle(makeReq('POST', '/api/documents', { name: 'x', text, attestedClass: 'other' }), res);
    assert.equal(res._status, 422, `blank ${JSON.stringify(text)}`);
    assert.equal(res._body.failure, 'parse_failed', 'a zero-span extraction fails explicitly');
  }
  assert.equal(host.store.listRecords('documents').length, 0, 'nothing stored for blank content');
});

test('finding 7: DELETE /api/documents/:id INVALIDATES the document\'s open proposals (deleted source text cannot mint)', async () => {
  const { host, handle } = fixture();
  let res = mockRes();
  await handle(makeReq('POST', '/api/documents', { name: 'A', text: 'BETCLIC\n\n- Grew casino revenue', attestedClass: 'old_cv' }), res);
  const docId = res._body.document.id;
  const spanId = res._body.spans[0].id;
  // a server-minted proposal referencing that document (host-level putRecord — the client route is closed)
  host.store.putRecord('proposals', { id: 'proposal_x', kind: 'proposal', status: 'open', nonce: 'n', span: { spanId, documentId: docId, text: 'Grew casino revenue' } });
  res = mockRes();
  await handle(makeReq('DELETE', `/api/documents/${docId}`), res);
  assert.equal(res._status, 200);
  assert.equal(host.store.getRecord('proposals', 'proposal_x').status, 'invalidated');
  assert.equal(host.store.getRecord('proposals', 'proposal_x').nonce, null);
});

test('POST /api/documents: bad attestation and non-text content fail with an explicit envelope, nothing stored', async () => {
  const { host, handle } = fixture();
  let res = mockRes();
  await handle(makeReq('POST', '/api/documents', { name: 'x', text: 'fine', attestedClass: 'not_a_class' }), res);
  assert.equal(res._status, 422);
  assert.equal(res._body.ok, false);
  res = mockRes();
  await handle(makeReq('POST', '/api/documents', { name: 'x', text: 'bad\u0000binary', attestedClass: 'other' }), res);
  assert.equal(res._status, 422);
  assert.equal(res._body.failure, 'parse_failed', 'parse failure is explicit, never a silent empty span set');
  assert.equal(host.store.listRecords('documents').length, 0);
  assert.equal(host.store.listRecords('spans').length, 0);
  assert.equal(host.store.listRecords('activity').length, 0, 'no activity for a rejected intake');
});

test('DELETE /api/documents/:id purges the document AND its spans; 404 on unknown', async () => {
  const { host, handle } = fixture();
  let res = mockRes();
  await handle(makeReq('POST', '/api/documents', { name: 'A', text: 'One line.\n\nTwo line.', attestedClass: 'qa_notes' }), res);
  const docId = res._body.document.id;
  assert.equal(host.store.listRecords('spans').length, 2);
  res = mockRes();
  await handle(makeReq('DELETE', `/api/documents/${docId}`), res);
  assert.equal(res._status, 200);
  assert.equal(host.store.listRecords('documents').length, 0);
  assert.equal(host.store.listRecords('spans').length, 0, 'unminted spans purged with the document');
  res = mockRes();
  await handle(makeReq('DELETE', '/api/documents/nope'), res);
  assert.equal(res._status, 404);
});

test('3.4: the generic collection path is CLOSED for documents, spans and proposals — POST, GET and DELETE', async () => {
  const { handle } = fixture();
  for (const name of ['documents', 'spans', 'proposals']) {
    for (const [method, url, body] of [
      ['GET', `/api/collection/${name}`, null],
      ['POST', `/api/collection/${name}`, { id: 'sneak_1', text: 'smuggled' }],
      ['DELETE', `/api/collection/${name}/some_id`, null],
    ]) {
      const res = mockRes();
      await handle(makeReq(method, url, body), res);
      assert.equal(res._status, 405, `${method} ${url} must be refused`);
    }
  }
});

test('the generic collection path still works for unconstrained collections', async () => {
  const { handle } = fixture();
  let res = mockRes();
  await handle(makeReq('POST', '/api/collection/notes', { id: 'n1', text: 'hello' }), res);
  assert.equal(res._status, 200);
  res = mockRes();
  await handle(makeReq('GET', '/api/collection/notes'), res);
  assert.equal(res._body.records.length, 1);
});
