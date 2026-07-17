'use strict';

// Valvet slice 1 — the vault store is a SEPARATE local SQLite file (server/data/vault.db),
// never the main store (brief hard rule 1). These lock its two load-bearing properties:
// a re-upload REPLACES the vault wholesale (slice 1 has no merge), and list() returns
// contacts newest-first with undatable rows last.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createVaultStore } = require('./vault-store.cjs');

function tmpVault() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-test-'));
  const store = createVaultStore({ path: path.join(dir, 'vault.db') });
  return { store, cleanup: () => { store.close(); fs.rmSync(dir, { recursive: true, force: true }); } };
}

test('replaceAll stores rows and count() reports them', () => {
  const { store, cleanup } = tmpVault();
  try {
    const n = store.replaceAll([
      { id: 'a', name: 'Anna', connectedAt: 100 },
      { id: 'b', name: 'Peter', connectedAt: 200 },
    ]);
    assert.equal(n, 2);
    assert.equal(store.count(), 2);
  } finally { cleanup(); }
});

test('list() returns contacts newest-first, undatable rows last', () => {
  const { store, cleanup } = tmpVault();
  try {
    store.replaceAll([
      { id: 'old', name: 'Old', connectedAt: 100 },
      { id: 'nodate', name: 'NoDate', connectedAt: null },
      { id: 'new', name: 'New', connectedAt: 300 },
      { id: 'mid', name: 'Mid', connectedAt: 200 },
    ]);
    assert.deepEqual(store.list().map((r) => r.id), ['new', 'mid', 'old', 'nodate']);
  } finally { cleanup(); }
});

test('re-upload REPLACES the vault wholesale — no merge, no leftovers', () => {
  const { store, cleanup } = tmpVault();
  try {
    store.replaceAll([{ id: 'a', name: 'Anna', connectedAt: 1 }, { id: 'b', name: 'Peter', connectedAt: 2 }]);
    const n = store.replaceAll([{ id: 'c', name: 'Sofia', connectedAt: 3 }]);
    assert.equal(n, 1);
    assert.equal(store.count(), 1);
    assert.deepEqual(store.list().map((r) => r.name), ['Sofia'], 'the old rows are gone, not merged');
  } finally { cleanup(); }
});

test('list() round-trips the full row object (raw + provenance survive)', () => {
  const { store, cleanup } = tmpVault();
  try {
    store.replaceAll([{ id: 'a', name: 'Anna', connectedAt: 1, raw: { Tags: 'vip' }, provenance: 'untrusted-derived' }]);
    const [row] = store.list();
    assert.equal(row.raw.Tags, 'vip');
    assert.equal(row.provenance, 'untrusted-derived');
  } finally { cleanup(); }
});
