'use strict';

// One-time data repair — heal the "[object Object]" job-result datafacts the old ingest
// bug wrote into the live store (ingest-cv.cjs, fixed in the same branch), WITHOUT
// changing any fact id.
//
// Why not delete-and-re-seed: the seed re-mints fresh ids every run. Five existing cases
// already referenced the seeded fact ids in their cvDraft and fit fields, so re-issuing
// ids severed 108 references (the first re-seed attempt did exactly this — id churn, not
// corruption, was the harm). So we repair IN PLACE: keep each corrupted fact's id and
// only replace its text (and tags) with what the fixed mapper produces. No id changes =>
// no reference can dangle.
//
// Mapping: the seed and a fresh ingest both iterate cv_data.json in the same order, so the
// store's seeded facts (everything except the minted `fill-gap` answers) line up 1:1, in
// order, with cvDataToDatafacts(cv_data.json). We assert that every NON-corrupted position
// already matches by text before touching anything — if the alignment is off, we abort
// rather than guess. Then each "[object Object]" position takes the fixed mapper's real
// text and tags, under its original id.
//
// RUN WITH THE SERVER STOPPED, against a store that still has the ORIGINAL seed ids (the
// pre-reseed backup, if the first re-seed already ran). Idempotent: a store with zero
// "[object Object]" facts is left untouched.
//
//   node scripts/repair-datafacts.cjs
//   STORE_PATH=/path/to/store.db node scripts/repair-datafacts.cjs

const path = require('node:path');
const fs = require('node:fs');
const { createSqliteStore } = require('../server/skeleton/store/sqlite.cjs');
const { cvDataToDatafacts } = require('../server/skeleton/datafacts/ingest-cv.cjs');
const { DEFAULT_JSON } = require('./seed-datafacts.cjs');

const DB_PATH = process.env.STORE_PATH || path.resolve(__dirname, '../server/data/store.db');
const CORRUPT = '[object Object]';
const isGapAnswer = (f) => f.type === 'fill-gap';

// Walk any value for { kind:'datafact', id } refs — same shape the store's gate uses.
function collectRefs(v, out = []) {
  if (Array.isArray(v)) v.forEach((x) => collectRefs(x, out));
  else if (v && typeof v === 'object') {
    if (v.kind === 'datafact' && v.id) out.push(v.id);
    for (const x of Object.values(v)) collectRefs(x, out);
  }
  return out;
}

// Count references to a non-existent fact id across every case's cvDraft and fit.
function danglingRefs(store) {
  const factIds = new Set(store.listDatafacts().map((f) => f.id));
  let n = 0;
  for (const c of store.listCases()) {
    for (const part of ['cvDraft', 'fit']) {
      const data = c[part] && c[part].data;
      if (data) for (const id of collectRefs(data)) if (!factIds.has(id)) n++;
    }
  }
  return n;
}

// Repair in place. Returns { fixed } — how many "[object Object]" facts were healed.
function repair(store, { jsonPath = DEFAULT_JSON } = {}) {
  const cv = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const fresh = cvDataToDatafacts(cv, 'en'); // fixed mapper => real text + tags, in seed order
  const seeded = store.listDatafacts().filter((f) => !isGapAnswer(f)); // original ids, in order

  if (seeded.length !== fresh.length) {
    throw new Error(`alignment: store has ${seeded.length} seeded facts, cv_data.json yields ${fresh.length} — cannot map by position`);
  }

  // Build the whole repair plan BEFORE writing (so writes never disturb the alignment).
  const plan = [];
  for (let i = 0; i < seeded.length; i++) {
    const s = seeded[i];
    const f = fresh[i];
    if (s.text === f.text) continue; // already correct at this position
    if (s.text !== CORRUPT) {
      throw new Error(`alignment broken at index ${i}: expected "${CORRUPT}" or a match, got type=${s.type} text=${JSON.stringify(s.text).slice(0, 60)}`);
    }
    plan.push({ ...s, text: f.text, tags: f.tags }); // same id => in-place overwrite
  }

  for (const fact of plan) store.ingestDatafact(fact);

  const remaining = store.listDatafacts().filter((f) => f.text === CORRUPT).length;
  if (remaining !== 0) throw new Error(`repair left ${remaining} "[object Object]" facts`);
  return { fixed: plan.length };
}

function report(label, store) {
  const facts = store.listDatafacts();
  console.log(
    `${label}: total=${facts.length}  "[object Object]"=${facts.filter((f) => f.text === CORRUPT).length}` +
    `  fill-gap=${facts.filter(isGapAnswer).length}  cases=${store.listCases().length}  danglingRefs=${danglingRefs(store)}`,
  );
}

if (require.main === module) {
  const store = createSqliteStore({ path: DB_PATH });
  try {
    console.log(`Repairing datafacts in ${DB_PATH}\n`);
    report('BEFORE', store);
    const gapBefore = store.listDatafacts().filter(isGapAnswer).length;
    const { fixed } = repair(store);
    report('AFTER ', store);
    console.log(`  repaired ${fixed} facts in place (ids unchanged)`);

    // Hard checks — the review's mandated end state.
    const facts = store.listDatafacts();
    if (facts.filter((f) => f.text === CORRUPT).length !== 0) throw new Error('non-zero "[object Object]"');
    if (facts.filter(isGapAnswer).length !== gapBefore) throw new Error('gap answers changed');
    if (danglingRefs(store) !== 0) throw new Error('store has dangling fact references');
    console.log('OK — zero "[object Object]", gap answers preserved, ids stable, zero dangling references.');
  } finally {
    store.close();
  }
}

module.exports = { repair, danglingRefs };
