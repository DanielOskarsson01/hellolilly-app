'use strict';

// INVARIANT 1 — verified status, enforced at the datalayer ROOT (brief §5, HIGH 2), plus
// gate 4: no submodule can observe a quarantined fact. Deterministic, offline.

const { test } = require('node:test');
const assert = require('node:assert');
const { createStore, isVerifiedFact } = require('./skeleton/store/index.cjs');
const { buildTools } = require('./skeleton/capabilities.cjs');

const CURATED = { id: 'df_cur', kind: 'datafact', type: 'job_result', text: 'Curated line.', tags: [], language: 'en', origin: 'curated' };
const ACCEPTED = { id: 'df_acc', kind: 'datafact', type: 'job_result', text: 'Accepted line.', tags: [], language: 'en', acceptance: { id: 'acceptance_1', at: 't', reviewedWording: 'Accepted line.', reviewedAttribution: { type: 'job_result', tags: [] } } };
const LEGACY = { id: 'df_leg', kind: 'datafact', type: 'fill-gap', text: 'Legacy model bullet.', tags: [], language: 'en', origin: 'legacy-model-authored' };
const NAKED = { id: 'df_nak', kind: 'datafact', type: 'skill', text: 'No provenance at all.', tags: [], language: 'en' };
const QUARANTINED = { id: 'df_qua', kind: 'datafact', type: 'skill', text: 'Unclassified line.', tags: [], language: 'en', origin: 'unclassified', originDetail: { quarantined: true } };

function seeded() {
  const store = createStore();
  for (const f of [CURATED, ACCEPTED, LEGACY, NAKED, QUARANTINED]) store.ingestDatafact(f);
  return store;
}

test('INV1: verified iff curated-origin OR recorded acceptance event — nothing else', () => {
  assert.strictEqual(isVerifiedFact(CURATED), true);
  assert.strictEqual(isVerifiedFact(ACCEPTED), true);
  assert.strictEqual(isVerifiedFact(LEGACY), false);
  assert.strictEqual(isVerifiedFact(NAKED), false, 'missing provenance is UNVERIFIED, never trusted');
  assert.strictEqual(isVerifiedFact(QUARANTINED), false);
});

test('INV1: default reads exclude non-verified at the store root', () => {
  const store = seeded();
  const seen = store.listDatafacts().map((f) => f.id).sort();
  assert.deepStrictEqual(seen, ['df_acc', 'df_cur']);
  assert.strictEqual(store.getDatafact('df_leg'), null);
  assert.strictEqual(store.getDatafact('df_nak'), null);
  assert.strictEqual(store.getDatafact('df_cur').id, 'df_cur');
});

test('INV1: the explicit host-level raw accessor sees everything', () => {
  const store = seeded();
  assert.strictEqual(store.listDatafactsRaw().length, 5);
  assert.strictEqual(store.getDatafactRaw('df_nak').id, 'df_nak');
});

test('GATE 4 (accessor root): no submodule can observe a quarantined fact', () => {
  const store = seeded();
  const manifest = { id: 'probe', reads: [], writes: [], capabilities: ['store', 'datalayer'] };
  const tools = buildTools({ manifest, callContext: { chain: ['probe'], depth: 0 }, store, logSink: () => {}, dispatch: () => {} });
  // the datalayer view is the gated root read
  const ids = tools.datalayer.listDatafacts().map((f) => f.id).sort();
  assert.deepStrictEqual(ids, ['df_acc', 'df_cur'], 'quarantined/legacy/naked facts are invisible');
  for (const id of ['df_leg', 'df_nak', 'df_qua']) assert.strictEqual(tools.datalayer.getDatafact(id), null);
  // no raw accessor leaks onto ANY submodule-facing tool surface
  for (const surface of [tools.datalayer, tools.store]) {
    for (const k of Object.keys(surface)) {
      assert.ok(!/raw/i.test(k), `submodule surface leaks raw accessor: ${k}`);
    }
  }
  assert.strictEqual(tools.store.listDatafactsRaw, undefined);
  assert.strictEqual(tools.store.ingestDatafact, undefined, 'mint path stays host-level');
});

test('INV1: sqlite adapter persists unverified facts as ingested (raw write-through), and they stay hidden after reload', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const os = require('node:os');
  const { createSqliteStore } = require('./skeleton/store/sqlite.cjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'inv1-'));
  const dbPath = path.join(dir, 'store.db');
  const s1 = createSqliteStore({ path: dbPath });
  s1.ingestDatafact(NAKED);
  s1.ingestDatafact(CURATED);
  s1.close();
  const s2 = createSqliteStore({ path: dbPath });
  assert.strictEqual(s2.listDatafactsRaw().length, 2, 'unverified fact persisted, not nulled');
  assert.deepStrictEqual(s2.listDatafacts().map((f) => f.id), ['df_cur']);
  s2.close();
  fs.rmSync(dir, { recursive: true, force: true });
});
