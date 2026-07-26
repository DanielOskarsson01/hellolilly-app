'use strict';

// D1 — the served backend's store bootstrap: adapter selection, one-time legacy
// JSON-snapshot migration, and idempotent seeding. The brief's acceptance is
// literal: boot twice, the pool count is identical — proven here, not asserted.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { bootstrapStore, seedDatafactsIfEmpty } = require('./store-bootstrap.cjs');
const { createStore } = require('./skeleton/store/index.cjs');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'll-boot-'));
}

// Minimal cv_data-shaped fixture (see skeleton/datafacts/ingest-cv.cjs).
function writeCvFixture(dir) {
  const p = path.join(dir, 'cv_fixture.json');
  fs.writeFileSync(p, JSON.stringify({ skills: [{ name: 'Marketing analytics', tags: [] }, { name: 'BI systems', tags: [] }] }));
  return p;
}

test('boot twice: datafact count identical (seed only into an empty pool)', () => {
  const dir = tmpDir();
  const cvPath = writeCvFixture(dir);

  const first = bootstrapStore({ adapter: 'sqlite', dataDir: dir });
  const r1 = seedDatafactsIfEmpty(first.store, { jsonPath: cvPath });
  assert.equal(r1.seeded, 2);
  const countAfterFirstBoot = first.store.listDatafacts().length;
  first.store.close();

  const second = bootstrapStore({ adapter: 'sqlite', dataDir: dir });
  const r2 = seedDatafactsIfEmpty(second.store, { jsonPath: cvPath });
  assert.equal(r2.seeded, 0, 'second boot seeds nothing');
  assert.equal(r2.skipped, true);
  assert.equal(second.store.listDatafacts().length, countAfterFirstBoot, 'pool count unchanged across boots');
  second.store.close();
});

test('one-time migration: a legacy JSON snapshot is loaded into the new sqlite db', () => {
  const dir = tmpDir();
  // a legacy store.json as the Stream 2 JSON wrapper would have written it
  const legacy = createStore();
  const c = legacy.createCase({ company: 'Brightsales', role: 'Marknadschef' });
  legacy.ingestDatafact({ id: 'datafact_legacy', kind: 'datafact', origin: 'curated', type: 'cv', text: 'Kept across the migration.', tags: [], language: 'en' });
  fs.writeFileSync(path.join(dir, 'store.json'), JSON.stringify(legacy.snapshot()));

  const boot = bootstrapStore({ adapter: 'sqlite', dataDir: dir });
  assert.equal(boot.migrated, true, 'migration reported');
  assert.equal(boot.store.getCase(c.meta.id).meta.company, 'Brightsales');
  assert.equal(boot.store.getDatafact('datafact_legacy').text, 'Kept across the migration.');
  boot.store.close();

  // second boot: db exists now — no re-migration, no duplication
  const again = bootstrapStore({ adapter: 'sqlite', dataDir: dir });
  assert.equal(again.migrated, false);
  assert.equal(again.store.listCases().length, 1);
  assert.equal(again.store.listDatafacts().length, 1);
  again.store.close();
});

test('migration also runs into an EMPTY pre-existing db (crash-window recovery)', () => {
  const dir = tmpDir();
  // simulate a first boot that crashed after creating the db but before migrating:
  // an empty database file already exists next to the legacy snapshot
  const empty = bootstrapStore({ adapter: 'sqlite', dataDir: dir });
  empty.store.close();

  const legacy = createStore();
  const c = legacy.createCase({ company: 'Acme', role: 'PM' });
  fs.writeFileSync(path.join(dir, 'store.json'), JSON.stringify(legacy.snapshot()));

  const boot = bootstrapStore({ adapter: 'sqlite', dataDir: dir });
  assert.equal(boot.migrated, true, 'an empty db does not suppress the migration');
  assert.equal(boot.store.getCase(c.meta.id).meta.company, 'Acme');
  boot.store.close();
});

test('a corrupt legacy snapshot warns and starts empty; memory and disk stay consistent', () => {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, 'store.json'), '{not json');
  const boot = bootstrapStore({ adapter: 'sqlite', dataDir: dir });
  assert.equal(boot.migrated, false);
  assert.deepEqual(boot.store.listCases(), []);
  boot.store.close();
  // and the next boot is equally empty — nothing half-loaded anywhere
  const again = bootstrapStore({ adapter: 'sqlite', dataDir: dir });
  assert.deepEqual(again.store.listCases(), []);
  again.store.close();
});

test('adapter selection: sqlite (default), json, memory — each self-describes', () => {
  const dir = tmpDir();
  delete process.env.STORE_ADAPTER; // the default must not depend on the test runner's env
  const s = bootstrapStore({ dataDir: dir });
  assert.equal(s.adapter, 'sqlite');
  assert.equal(s.path, path.join(dir, 'store.db'));
  s.store.close();

  const j = bootstrapStore({ adapter: 'json', dataDir: dir });
  assert.equal(j.adapter, 'json');
  assert.ok(j.store.flush, 'json wrapper exposed');

  const m = bootstrapStore({ adapter: 'memory', dataDir: dir });
  assert.equal(m.adapter, 'memory');
  assert.equal(m.path, null);

  assert.throws(() => bootstrapStore({ adapter: 'postgres', dataDir: dir }), /unknown STORE_ADAPTER/i);
});
