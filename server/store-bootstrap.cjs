'use strict';

// D1 — store bootstrap for the served backend. One place decides which adapter
// backs the host store, migrates the Stream 2 JSON snapshot into SQLite once,
// and makes seeding idempotent (seed only into an empty pool — reseed-on-boot
// against a durable store would otherwise duplicate the evidence pool under
// fresh datafact ids and make every gap-analysis citation ambiguous).

const fs = require('node:fs');
const path = require('node:path');
const { createStore } = require('./skeleton/store/index.cjs');
const { createPersistentStore } = require('./skeleton/store/persistence.cjs');
const { createSqliteStore } = require('./skeleton/store/sqlite.cjs');
const { seedDatafacts } = require('../scripts/seed-datafacts.cjs');

const DEFAULT_DATA_DIR = path.resolve(__dirname, 'data');

// adapter: 'sqlite' (default — durable, atomic row writes, WAL) | 'json' (the
// Stream 2 snapshot wrapper) | 'memory' (tests / ephemeral runs).
function bootstrapStore({
  adapter = process.env.STORE_ADAPTER || 'sqlite',
  dataDir = DEFAULT_DATA_DIR,
  storePath = process.env.STORE_PATH,
} = {}) {
  if (adapter === 'memory') {
    return { store: createStore(), adapter: 'memory', path: null, migrated: false };
  }
  if (adapter === 'json') {
    const p = storePath || path.join(dataDir, 'store.json');
    return { store: createPersistentStore({ path: p }), adapter: 'json', path: p, migrated: false };
  }
  if (adapter === 'sqlite') {
    const p = storePath || path.join(dataDir, 'store.db');
    const legacyJson = path.join(dataDir, 'store.json');
    const dbExisted = fs.existsSync(p);
    const store = createSqliteStore({ path: p });
    let migrated = false;
    // One-time migration: a fresh db next to a Stream 2 JSON snapshot inherits it.
    // Once the db exists the snapshot is never consulted again (no re-migration).
    if (!dbExisted && fs.existsSync(legacyJson)) {
      try {
        store.hydrate(JSON.parse(fs.readFileSync(legacyJson, 'utf8')));
        migrated = true;
      } catch (err) {
        console.warn(`[store] legacy snapshot at ${legacyJson} unreadable (${err.message}) — starting empty`);
      }
    }
    return { store, adapter: 'sqlite', path: p, migrated };
  }
  throw new Error(`unknown STORE_ADAPTER: ${adapter} (expected sqlite | json | memory)`);
}

// Seed the datafact pool ONLY when it is empty. Returns { seeded, skipped }.
function seedDatafactsIfEmpty(store, opts) {
  if (store.listDatafacts().length > 0) return { seeded: 0, skipped: true };
  const facts = seedDatafacts(store, opts);
  return { seeded: facts.length, skipped: false };
}

module.exports = { bootstrapStore, seedDatafactsIfEmpty };
