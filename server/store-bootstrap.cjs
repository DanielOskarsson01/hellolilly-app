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
    const store = createSqliteStore({ path: p });
    let migrated = false;
    // One-time migration: an EMPTY db next to a Stream 2 JSON snapshot inherits it.
    // Emptiness (not file existence) is the guard, so a crash between db creation
    // and hydrate cannot silently suppress the migration on the next boot; a
    // populated db is never re-migrated.
    const snap = store.snapshot();
    const dbEmpty = snap.cases.length === 0 && snap.datafacts.length === 0 && snap.collections.length === 0;
    if (dbEmpty && fs.existsSync(legacyJson)) {
      let legacySnap = null;
      try {
        legacySnap = JSON.parse(fs.readFileSync(legacyJson, 'utf8'));
      } catch (err) {
        // Unreadable snapshot: memory and disk are BOTH empty — consistent, warn and go on.
        console.warn(`[store] legacy snapshot at ${legacyJson} unreadable (${err.message}) — starting empty`);
      }
      if (legacySnap) {
        // hydrate() loads memory then rewrites the db transactionally. If the disk
        // write fails we must NOT serve legacy data that will not persist — fail the
        // boot loudly instead (store.json is untouched on disk; a retry is safe).
        try {
          store.hydrate(legacySnap);
          migrated = true;
        } catch (err) {
          store.close();
          throw new Error(`[store] migration of ${legacyJson} into ${p} failed mid-write: ${err.message} — boot aborted (legacy snapshot preserved; retry after fixing disk state)`);
        }
      }
    }
    return { store, adapter: 'sqlite', path: p, migrated };
  }
  throw new Error(`unknown STORE_ADAPTER: ${adapter} (expected sqlite | json | memory)`);
}

// Seed the datafact pool ONLY when it is empty. Returns { seeded, skipped }.
// RAW emptiness guard (INVARIANT 1): default reads exclude non-verified facts, so a
// pool holding only unverified facts would look empty and re-seed duplicates.
function seedDatafactsIfEmpty(store, opts) {
  const count = (store.listDatafactsRaw ? store.listDatafactsRaw() : store.listDatafacts()).length;
  if (count > 0) return { seeded: 0, skipped: true };
  const facts = seedDatafacts(store, opts);
  return { seeded: facts.length, skipped: false };
}

module.exports = { bootstrapStore, seedDatafactsIfEmpty };
