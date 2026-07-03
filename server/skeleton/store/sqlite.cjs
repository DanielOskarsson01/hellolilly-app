'use strict';

// D1 — the durable store adapter. SQLite via Node's built-in node:sqlite
// (DatabaseSync): local file, zero dependencies, zero ops, nothing else alive.
//
// Strategy: the plain in-memory createStore() stays the source of truth for ALL
// reads and semantics — the detach/immutability boundary and the writing-rules
// gate are inherited, not reimplemented. SQLite is the durability shadow: every
// mutating method writes through to a row AFTER the inner store accepted it (a
// gate throw therefore persists nothing). The whole database is loaded into the
// inner store at open via the same snapshot()/hydrate() seam the JSON wrapper
// uses. Row-level writes keep amplification low (one case row per writePart, not
// the whole store), and WAL keeps a crash from corrupting the file.
//
// Durability scope (build decision, per the D1 brief): cases, datafacts and
// collections persist. Scratch stays EPHEMERAL — it is per-submodule working
// memory for a single run; persisting it would resurrect half-finished private
// state into runs it doesn't belong to. The broker audit log is out of scope.

const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const { createStore } = require('./index.cjs');

const SCHEMA_VERSION = 1;

function createSqliteStore({ path: dbPath } = {}) {
  if (!dbPath) throw new Error('createSqliteStore: a path is required');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS cases (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS datafacts (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS collection_records (
      name TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL,
      PRIMARY KEY (name, id)
    );
  `);
  db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)').run('schema_version', String(SCHEMA_VERSION));

  const stmt = {
    putCase: db.prepare('INSERT OR REPLACE INTO cases (id, data) VALUES (?, ?)'),
    putFact: db.prepare('INSERT OR REPLACE INTO datafacts (id, data) VALUES (?, ?)'),
    putRecord: db.prepare('INSERT OR REPLACE INTO collection_records (name, id, data) VALUES (?, ?, ?)'),
    delRecord: db.prepare('DELETE FROM collection_records WHERE name = ? AND id = ?'),
    allCases: db.prepare('SELECT id, data FROM cases'),
    allFacts: db.prepare('SELECT id, data FROM datafacts'),
    allRecords: db.prepare('SELECT name, id, data FROM collection_records'),
  };

  // Load everything into a fresh in-memory store through the existing seam.
  const inner = createStore();
  const collections = new Map();
  for (const row of stmt.allRecords.all()) {
    if (!collections.has(row.name)) collections.set(row.name, []);
    collections.get(row.name).push([row.id, JSON.parse(row.data)]);
  }
  inner.hydrate({
    version: 1,
    cases: stmt.allCases.all().map((r) => [r.id, JSON.parse(r.data)]),
    datafacts: stmt.allFacts.all().map((r) => [r.id, JSON.parse(r.data)]),
    collections: [...collections.entries()],
  });

  const saveCase = (caseId) => stmt.putCase.run(caseId, JSON.stringify(inner.getCase(caseId)));

  function rewriteAll() {
    // Full rewrite inside one transaction — the migration/hydrate path only.
    db.exec('BEGIN');
    try {
      db.exec('DELETE FROM cases; DELETE FROM datafacts; DELETE FROM collection_records;');
      const snap = inner.snapshot();
      for (const [id, c] of snap.cases) stmt.putCase.run(id, JSON.stringify(c));
      for (const [id, f] of snap.datafacts) stmt.putFact.run(id, JSON.stringify(f));
      for (const [name, entries] of snap.collections) {
        for (const [id, rec] of entries) stmt.putRecord.run(name, id, JSON.stringify(rec));
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }

  return {
    ...inner,
    adapter: 'sqlite',
    path: dbPath,

    createCase(meta) {
      const c = inner.createCase(meta); // may throw (invalid status) — nothing persisted then
      saveCase(c.meta.id);
      return c;
    },
    writePart(caseId, part, data) {
      const out = inner.writePart(caseId, part, data); // gate runs here; a throw persists nothing
      saveCase(caseId);
      return out;
    },
    setPartStatus(caseId, part, status, error) {
      const out = inner.setPartStatus(caseId, part, status, error);
      saveCase(caseId);
      return out;
    },
    ingestDatafact(df) {
      const out = inner.ingestDatafact(df);
      stmt.putFact.run(df.id, JSON.stringify(df));
      return out;
    },
    putRecord(collection, record) {
      const out = inner.putRecord(collection, record);
      stmt.putRecord.run(collection, record.id, JSON.stringify(out));
      return out;
    },
    removeRecord(collection, id) {
      const out = inner.removeRecord(collection, id);
      stmt.delRecord.run(collection, id);
      return out;
    },
    hydrate(snap) {
      inner.hydrate(snap);
      rewriteAll();
    },

    close() {
      db.close();
    },
  };
}

module.exports = { createSqliteStore };
