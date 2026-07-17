'use strict';

// Valvet slice 1 — the /api/vault handler end-to-end, and the SEPARATION invariant
// (brief hard rule 1): vault rows go to the dedicated vault store and are UNREACHABLE
// through any main-store endpoint. Also locks all-or-nothing ingest: a failed parse
// writes nothing and leaves the existing vault intact.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Readable } = require('node:stream');
const { createApiHandler } = require('../dev-server.cjs');
const { createStore } = require('../skeleton/store/index.cjs');
const { createVaultStore } = require('./vault-store.cjs');

const SAMPLE = fs.readFileSync(path.join(__dirname, '__fixtures__', 'connections-sample.csv'), 'utf8');

function harness() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-api-'));
  const vault = createVaultStore({ path: path.join(dir, 'vault.db') });
  const host = { store: createStore(), invoke: async () => ({ result: {} }) };
  const handle = createApiHandler(host, { vault });
  return { handle, host, vault, cleanup: () => { vault.close(); fs.rmSync(dir, { recursive: true, force: true }); } };
}

async function call(handle, { method, url, body, contentType }) {
  const req = Readable.from([body == null ? '' : body]);
  req.method = method;
  req.url = url;
  req.headers = { 'content-type': contentType || 'text/csv' };
  const res = {
    statusCode: null, payload: null,
    writeHead(s) { this.statusCode = s; },
    end(b) { this.payload = b ? JSON.parse(b) : null; },
  };
  const handled = await handle(req, res);
  return { handled, status: res.statusCode, body: res.payload };
}

test('POST /api/vault parses the export, stores it, returns READY (count + skipped, newest-first)', async () => {
  const { handle, vault, cleanup } = harness();
  try {
    const r = await call(handle, { method: 'POST', url: '/api/vault', body: SAMPLE });
    assert.equal(r.handled, true);
    assert.equal(r.status, 200);
    assert.equal(r.body.ok, true);
    assert.equal(r.body.count, 5);
    assert.equal(r.body.skipped, 1);
    assert.equal(r.body.rows[0].lastName, 'Lind', 'newest (02 Feb 2024) is first');
    assert.equal(vault.count(), 5);
  } finally { cleanup(); }
});

test('SEPARATION: vault rows never enter the main store or its collection endpoint', async () => {
  const { handle, host, cleanup } = harness();
  try {
    await call(handle, { method: 'POST', url: '/api/vault', body: SAMPLE });
    // The main store's own API: the vault contacts must be invisible here.
    assert.deepEqual(host.store.listRecords('contacts'), [], 'main store holds no vault rows');
    const viaCollection = await call(handle, { method: 'GET', url: '/api/collection/contacts' });
    assert.deepEqual(viaCollection.body.records, [], 'the main-store collection route returns no vault rows');
  } finally { cleanup(); }
});

test('GET /api/vault returns the stored contacts', async () => {
  const { handle, cleanup } = harness();
  try {
    await call(handle, { method: 'POST', url: '/api/vault', body: SAMPLE });
    const r = await call(handle, { method: 'GET', url: '/api/vault' });
    assert.equal(r.status, 200);
    assert.equal(r.body.count, 5);
    assert.equal(r.body.rows.length, 5);
  } finally { cleanup(); }
});

test('all-or-nothing: a failed parse returns FAILED (422), writes nothing, leaves the vault intact', async () => {
  const { handle, vault, cleanup } = harness();
  try {
    await call(handle, { method: 'POST', url: '/api/vault', body: SAMPLE }); // vault now has 5
    const bad = await call(handle, { method: 'POST', url: '/api/vault', body: 'not a csv at all\njust prose' });
    assert.equal(bad.status, 422);
    assert.equal(bad.body.ok, false);
    assert.match(bad.body.error, /Connections|header/i);
    assert.equal(vault.count(), 5, 'the previous vault survives a failed re-upload');
  } finally { cleanup(); }
});
