'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { createStore } = require('../server/skeleton/store/index.cjs');
const { createSqliteStore } = require('../server/skeleton/store/sqlite.cjs');
const { cvDataToDatafacts } = require('../server/skeleton/datafacts/ingest-cv.cjs');
const { repair, danglingRefs } = require('./repair-datafacts.cjs');

const CORRUPT = '[object Object]';

function tmpJson(obj) {
  const p = path.join(os.tmpdir(), `cv-repair-${process.pid}-${Math.floor(process.hrtime()[1])}.json`);
  fs.writeFileSync(p, JSON.stringify(obj));
  return p;
}

// Seed a store exactly as the BUGGY ingest left it: real text for everything except each
// job_result, which holds the literal "[object Object]" and only the JOB-LEVEL tags the
// old mapper wrote (['job-result', company, ...j.tags] — the result's OWN tags were lost
// with its text). Facts go in in true seed order (interleaved), so it mirrors the real
// store. `swapCorrupt` swaps the first two ADJACENT corrupt facts before insertion — the
// exact "two adjacent corrupted positions reordered" the review used to break the repair.
// Returns the corrupt facts' ids keyed by the fresh bullet text they SHOULD heal to, so a
// test can assert which id each bullet lands on.
function seedBuggy(store, cv, { swapCorrupt = false } = {}) {
  const fresh = cvDataToDatafacts(cv, 'en');
  const jobTagsFor = (company) => {
    const j = cv.jobs.find((x) => x.company_short === company);
    return ['job-result', j.company_short, ...(j.tags || [])].filter(Boolean);
  };
  const buggy = fresh.map((f) =>
    f.type === 'job_result' ? { ...f, _freshText: f.text, text: CORRUPT, tags: jobTagsFor(f.tags[1]) } : f);
  if (swapCorrupt) {
    const i = buggy.findIndex((f, k) => f.text === CORRUPT && buggy[k + 1] && buggy[k + 1].text === CORRUPT);
    if (i < 0) throw new Error('seedBuggy: fixture has no two adjacent corrupt facts to swap');
    [buggy[i], buggy[i + 1]] = [buggy[i + 1], buggy[i]];
  }
  const idByFreshText = {};
  for (const f of buggy) {
    const { _freshText, ...df } = f;
    store.ingestDatafact(df);
    if (_freshText) idByFreshText[_freshText] = df.id;
  }
  return idByFreshText;
}

// A tmp cv_data.json whose buggy seed order is [job_summary, job_result].
function fixture() {
  const tmp = path.join(os.tmpdir(), `cv-repair-${process.pid}-${Math.floor(process.hrtime()[1])}.json`);
  fs.writeFileSync(tmp, JSON.stringify({
    jobs: [{ company_short: 'Acme', role: 'X', tags: ['t'], tasks_summary: 'Ran things.', results: [{ text: 'Shipped v1.', tags: ['ship'] }] }],
  }));
  return tmp;
}

// Reproduce a store as the BUGGY ingest left it: same ids the seed minted, but the
// job_result fact holding the literal "[object Object]".
function buggyStore() {
  const store = createStore();
  store.ingestDatafact({ id: 'datafact_sum', kind: 'datafact', origin: 'curated', type: 'job_summary', text: 'Ran things.', tags: ['job', 'Acme', 'X'], language: 'en' });
  store.ingestDatafact({ id: 'datafact_res', kind: 'datafact', origin: 'curated', type: 'job_result', text: '[object Object]', tags: ['job-result', 'Acme'], language: 'en' });
  return store;
}

test('repairs "[object Object]" in place, keeps the id, so a case reference still resolves', () => {
  const tmp = fixture();
  try {
    const store = buggyStore();
    // A case whose cvDraft cites the corrupted fact by id — the exact thing the first
    // re-seed severed by re-minting ids.
    const c = store.createCase({ company: 'Acme' });
    store.writePart(c.meta.id, 'cvDraft', { sections: [{ heading: 'Experience', refs: [{ kind: 'datafact', id: 'datafact_res' }] }] });
    assert.equal(danglingRefs(store), 0, 'reference resolves before repair (fact exists, just corrupt)');

    const { fixed } = repair(store, { jsonPath: tmp });

    assert.equal(fixed, 1, 'one fact repaired');
    assert.ok(store.getDatafact('datafact_res'), 'the fact id is unchanged (in-place, not re-minted)');
    assert.equal(store.getDatafact('datafact_res').text, 'Shipped v1.', 'text healed to the real bullet');
    assert.ok(store.getDatafact('datafact_res').tags.includes('ship'), 'the result\'s own tags are carried');
    assert.equal(store.listDatafacts().filter((f) => f.text === '[object Object]').length, 0, 'no corruption remains');
    assert.equal(danglingRefs(store), 0, 'the case reference STILL resolves after repair — the regression guard');
  } finally {
    fs.unlinkSync(tmp);
  }
});

test('preserves fill-gap answers and is idempotent', () => {
  const tmp = fixture();
  try {
    const store = buggyStore();
    store.ingestDatafact({ id: 'datafact_gap', kind: 'datafact', origin: 'curated', type: 'fill-gap', text: 'A gap answer.', tags: ['fill-gap'], language: 'en' });
    repair(store, { jsonPath: tmp });
    assert.ok(store.getDatafact('datafact_gap'), 'gap answer preserved');
    // Re-running finds nothing to fix.
    const second = repair(store, { jsonPath: tmp });
    assert.equal(second.fixed, 0, 'idempotent: a clean store is left untouched');
  } finally {
    fs.unlinkSync(tmp);
  }
});

test('aborts rather than guess when the store does not align with cv_data.json', () => {
  const tmp = fixture();
  try {
    const store = createStore();
    // Wrong shape at index 0: a non-corrupt fact whose text will not match the fixture.
    store.ingestDatafact({ id: 'datafact_x', kind: 'datafact', origin: 'curated', type: 'job_summary', text: 'Different summary.', tags: [], language: 'en' });
    store.ingestDatafact({ id: 'datafact_y', kind: 'datafact', origin: 'curated', type: 'job_result', text: '[object Object]', tags: [], language: 'en' });
    assert.throws(() => repair(store, { jsonPath: tmp }), /alignment/, 'refuses to repair a misaligned store');
  } finally {
    fs.unlinkSync(tmp);
  }
});

// Two jobs, one achievement each, and the SECOND job has no tasks_summary so its result
// sits directly after the first job's result — two corrupt job_results adjacent in seed
// order but from DIFFERENT companies. That is the case the destroyed text cannot verify
// and the job-level tags can.
// The trailing education entry maps to a NON-corrupt fact that sits AFTER the job_results
// in seed order — so healing the corrupt rows (INSERT OR REPLACE moved them to the end)
// displaces it on reopen, the exact churn that made the old re-run abort mid-scan.
const TWO_JOB_CV = {
  jobs: [
    { company_short: 'Acme', role: 'X', tags: ['saas'], tasks_summary: 'Ran Acme.', results: [{ text: 'Acme achievement.', tags: ['a'] }] },
    { company_short: 'Beta', role: 'Y', tags: ['fin'], results: [{ text: 'Beta achievement.', tags: ['b'] }] },
  ],
  education: [{ degrees: ['BSc'], institution: 'Uni', years: '2000' }],
};

test('corrupt-to-corrupt reorder across jobs is caught by tags, not trusted by position', () => {
  const tmp = tmpJson(TWO_JOB_CV);
  try {
    // In seed order the repair binds each id to its OWN company's bullet.
    const ok = createStore();
    const ids = seedBuggy(ok, TWO_JOB_CV);
    repair(ok, { jsonPath: tmp });
    assert.equal(ok.getDatafact(ids['Acme achievement.']).text, 'Acme achievement.', 'aligned: Acme id → Acme bullet');
    assert.equal(ok.getDatafact(ids['Beta achievement.']).text, 'Beta achievement.', 'aligned: Beta id → Beta bullet');

    // Now swap the two adjacent corrupt positions. The old repair trusted position and
    // wrote each id the OTHER company's bullet while reporting success; the fix verifies
    // each corrupt position by its job tags and ABORTS instead of binding wrong evidence.
    const swapped = createStore();
    seedBuggy(swapped, TWO_JOB_CV, { swapCorrupt: true });
    assert.throws(() => repair(swapped, { jsonPath: tmp }), /alignment/, 'aborts on a cross-job corrupt reorder');
  } finally {
    fs.unlinkSync(tmp);
  }
});

test('real SQLite store: heal, reopen, re-run is a genuine no-op (idempotent)', () => {
  const tmp = tmpJson(TWO_JOB_CV);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'repair-sqlite-'));
  const dbPath = path.join(dir, 'store.db');
  try {
    // Heal against the real durable adapter — the write path whose INSERT OR REPLACE
    // reordered rows and made the old re-run abort.
    const a = createSqliteStore({ path: dbPath });
    seedBuggy(a, TWO_JOB_CV);
    const first = repair(a, { jsonPath: tmp });
    assert.ok(first.fixed > 0, 'first run heals the corrupt facts');
    assert.equal(a.listDatafacts().filter((f) => f.text === CORRUPT).length, 0, 'nothing corrupt left');
    a.close();

    // Reopen from disk (rows re-read in the adapter's load order) and run again.
    const b = createSqliteStore({ path: dbPath });
    const second = repair(b, { jsonPath: tmp });
    assert.equal(second.fixed, 0, 'idempotent: reopen + re-run touches nothing, does not abort');
    b.close();
  } finally {
    fs.unlinkSync(tmp);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
