'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { createStore } = require('../server/skeleton/store/index.cjs');
const { createSqliteStore } = require('../server/skeleton/store/sqlite.cjs');
const { enrich, danglingRefs, CROSSWALK, slug } = require('./enrich-competency-categories.cjs');

// The approved pool titles (as COMPETENCY_MASTER_POOL.json.categories keys), injected so the
// test needs no machine-local reference dir. Superset of the crosswalk targets.
const POOL = [
  'Leadership & Scaling', 'Strategy & Business Development', 'Marketing & Growth',
  'Product & Technology', 'Digital & Innovation', 'Data & Analytics',
  'Operations & Execution', 'Compliance & Regulatory', 'iGaming & Entertainment',
];

// Seed a store shaped like the real one: competency facts carrying their cv_data group as
// tags[1] (ingest-cv.cjs:31), plus a flat skill fact and an unrelated fact.
function seed(store) {
  store.ingestDatafact({ id: 'df_c1', kind: 'datafact', type: 'competency', text: 'Built teams up to 120.', tags: ['competency', 'leadership_management'], language: 'en' });
  store.ingestDatafact({ id: 'df_c2', kind: 'datafact', type: 'competency', text: 'Brand development.', tags: ['competency', 'marketing_strategy'], language: 'en' });
  store.ingestDatafact({ id: 'df_c3', kind: 'datafact', type: 'competency', text: 'iGaming (casino, sportsbook).', tags: ['competency', 'industry_knowledge'], language: 'en' });
  store.ingestDatafact({ id: 'df_sk', kind: 'datafact', type: 'skill', text: 'Node.js / Express', tags: ['skill', 'engineering'], language: 'en' });
  store.ingestDatafact({ id: 'df_job', kind: 'datafact', type: 'job_result', text: 'Shipped v1.', tags: ['job-result', 'Acme'], language: 'en' });
}

test('imports category (id+title+source) onto competency facts, keeps ids, case ref still resolves', () => {
  const store = createStore();
  seed(store);
  // a case that cites a competency fact by id — the thing an id churn would sever
  const c = store.createCase({ company: 'Acme' });
  store.writePart(c.meta.id, 'cvDraft', { sections: [{ heading: 'Core Competencies', refs: [{ kind: 'datafact', id: 'df_c1' }] }] });
  assert.equal(danglingRefs(store), 0, 'reference resolves before enrichment');

  const { enriched, categories } = enrich(store, { poolCategories: POOL });

  assert.equal(enriched, 3, 'three competency facts enriched');
  const c1 = store.getDatafact('df_c1');
  assert.ok(c1, 'id unchanged (in-place, not re-minted)');
  assert.deepStrictEqual(c1.category, { id: 'leadership-scaling', title: 'Leadership & Scaling', group: 'leadership_management', source: 'COMPETENCY_MASTER_POOL.json' });
  assert.equal(store.getDatafact('df_c3').category.title, 'iGaming & Entertainment', 'industry_knowledge -> iGaming & Entertainment');
  assert.ok(categories.some((k) => k.id === 'marketing-growth'), 'taxonomy reports the applied categories');
  assert.equal(danglingRefs(store), 0, 'the case reference STILL resolves after enrichment');
});

test('skill facts and non-competency facts are left untouched', () => {
  const store = createStore();
  seed(store);
  enrich(store, { poolCategories: POOL });
  assert.equal(store.getDatafact('df_sk').category, undefined, 'flat skill fact gets no category');
  assert.equal(store.getDatafact('df_job').category, undefined, 'job_result untouched');
});

test('fail-closed: a crosswalk target missing from the pool throws (never authors a title)', () => {
  const store = createStore();
  seed(store);
  const shortPool = POOL.filter((t) => t !== 'iGaming & Entertainment');
  assert.throws(() => enrich(store, { poolCategories: shortPool }), /not a category in the approved pool/);
});

test('fail-closed: a competency fact with an unknown group throws rather than guess', () => {
  const store = createStore();
  seed(store);
  store.ingestDatafact({ id: 'df_x', kind: 'datafact', type: 'competency', text: 'Mystery.', tags: ['competency', 'not_a_group'], language: 'en' });
  assert.throws(() => enrich(store, { poolCategories: POOL }), /no crosswalk entry/);
});

test('crosswalk targets are all real pool categories, and slugs are stable', () => {
  for (const title of Object.values(CROSSWALK)) assert.ok(POOL.includes(title), `${title} is an approved pool category`);
  assert.equal(slug('Leadership & Scaling'), 'leadership-scaling');
  assert.equal(slug('iGaming & Entertainment'), 'igaming-entertainment');
});

test('real SQLite store: enrich, reopen, re-run is a genuine no-op (idempotent)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'enrich-sqlite-'));
  const dbPath = path.join(dir, 'store.db');
  try {
    const a = createSqliteStore({ path: dbPath });
    seed(a);
    enrich(a, { poolCategories: POOL });
    const snap1 = JSON.stringify(a.listDatafacts().filter((f) => f.type === 'competency').map((f) => [f.id, f.category]).sort());
    a.close();

    const b = createSqliteStore({ path: dbPath });
    const second = enrich(b, { poolCategories: POOL });
    const snap2 = JSON.stringify(b.listDatafacts().filter((f) => f.type === 'competency').map((f) => [f.id, f.category]).sort());
    assert.equal(second.enriched, 3, 're-run still applies deterministically');
    assert.equal(snap1, snap2, 'idempotent: reopen + re-run leaves identical category state');
    b.close();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
