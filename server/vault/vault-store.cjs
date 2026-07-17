'use strict';

// Valvet slice 1 — the Coach Vault store (D21). A dedicated, PHYSICALLY SEPARATE local
// SQLite file (server/data/vault.db), never the main store: different data category,
// different lifecycle, later per-coach (brief hard rule 1). The main store must never be
// able to reach these rows, so they live in their own file behind their own tiny adapter.
//
// Mirrors the main adapter's node:sqlite + WAL choice (server/skeleton/store/sqlite.cjs)
// but is deliberately dumb: one table, whole-vault replace (slice 1 has no merge), and a
// newest-first list. Encryption is DEBT recorded in docs/RETROFIT_LEDGER.md, not silence:
// the file is unencrypted, safe ONLY because coach #1 is Daniel on his own disk-encrypted
// machine — a HARD GATE before any other coach has a vault.

const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

function createVaultStore({ path: dbPath } = {}) {
  if (!dbPath) throw new Error('createVaultStore: a path is required');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec(`CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    connected_at INTEGER,   -- sort key; NULL for undatable rows (sorted last)
    ord INTEGER NOT NULL    -- ingest order; stable tie-break within equal dates
  )`);

  const stmt = {
    del: db.prepare('DELETE FROM contacts'),
    ins: db.prepare('INSERT OR REPLACE INTO contacts (id, data, connected_at, ord) VALUES (?, ?, ?, ?)'),
    // Newest first: dated rows by connected_at desc, undatable rows last, ingest order breaks ties.
    all: db.prepare('SELECT data FROM contacts ORDER BY connected_at IS NULL, connected_at DESC, ord ASC'),
    count: db.prepare('SELECT COUNT(*) AS n FROM contacts'),
  };

  return {
    path: dbPath,

    // Wholesale replace: the whole vault is swapped inside one transaction — the new
    // network lands complete or the old one is untouched (all-or-nothing at the store too).
    replaceAll(rows) {
      const list = Array.isArray(rows) ? rows : [];
      db.exec('BEGIN');
      try {
        stmt.del.run();
        list.forEach((row, i) => {
          const connectedAt = Number.isFinite(row.connectedAt) ? row.connectedAt : null;
          stmt.ins.run(String(row.id), JSON.stringify(row), connectedAt, i);
        });
        db.exec('COMMIT');
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
      return list.length;
    },

    list() {
      return stmt.all.all().map((r) => JSON.parse(r.data));
    },

    count() {
      return stmt.count.get().n;
    },

    close() {
      db.close();
    },
  };
}

module.exports = { createVaultStore };
