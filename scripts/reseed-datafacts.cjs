'use strict';

// One-time data repair — re-seed the candidate datafact pool in the live store so the
// 33 "[object Object]" facts poisoned by the old ingest bug (ingest-cv.cjs, fixed in the
// same branch) become their real bullet text.
//
// The seed re-mints fresh ids every run, so we cannot just "add" a clean pool — that
// would duplicate everything. We also must NOT wipe the whole pool: answering a gap
// mints a `type: 'fill-gap'` datafact into this same pool (bullet-judge.cjs), and those
// are real user answers, not seed data. So: remove every SEEDED fact (everything except
// the fill-gap answers) and re-seed. Preserves cases, collections, and gap answers;
// replaces only the CV-derived evidence pool. Idempotent — safe to re-run.
//
// RUN WITH THE SERVER STOPPED. A live server holds its own in-memory copy of the pool
// and would serve the stale (corrupt) facts until restart, and a second writer risks a
// lock. Stop `npm run dev`, run this, then restart.
//
//   node scripts/reseed-datafacts.cjs            # repairs server/data/store.db
//   STORE_PATH=/path/to/store.db node scripts/reseed-datafacts.cjs

const path = require('node:path');
const { createSqliteStore } = require('../server/skeleton/store/sqlite.cjs');
const { seedDatafacts } = require('./seed-datafacts.cjs');

const DB_PATH = process.env.STORE_PATH || path.resolve(__dirname, '../server/data/store.db');

const isGapAnswer = (f) => f.type === 'fill-gap'; // the only non-seed datafacts
const objObj = (facts) => facts.filter((f) => f.text === '[object Object]').length;
const report = (label, facts) =>
  console.log(`${label}: total=${facts.length}  "[object Object]"=${objObj(facts)}  fill-gap(preserved)=${facts.filter(isGapAnswer).length}`);

function reseed(store) {
  const before = store.listDatafacts();
  report('BEFORE', before);

  // Drop only the seeded facts; keep the gap answers.
  const removed = before.filter((f) => !isGapAnswer(f));
  for (const f of removed) store.removeDatafact(f.id);

  const seeded = seedDatafacts(store); // fresh, clean facts (new ids)

  const after = store.listDatafacts();
  report('AFTER ', after);
  console.log(`  removed ${removed.length} seeded facts, ingested ${seeded.length} fresh facts`);

  // Hard checks — the brief's mandated end state.
  const gapBefore = before.filter(isGapAnswer).length;
  const gapAfter = after.filter(isGapAnswer).length;
  if (objObj(after) !== 0) throw new Error(`re-seed left ${objObj(after)} "[object Object]" facts`);
  if (gapAfter !== gapBefore) throw new Error(`gap answers changed: ${gapBefore} -> ${gapAfter} (must be preserved)`);
  if (after.length !== gapAfter + seeded.length) throw new Error(`unexpected total ${after.length} (expected ${gapAfter} gap + ${seeded.length} seeded)`);
  console.log('OK — zero "[object Object]", gap answers preserved, no duplicates.');
}

if (require.main === module) {
  const store = createSqliteStore({ path: DB_PATH });
  try {
    console.log(`Re-seeding datafacts in ${DB_PATH}\n`);
    reseed(store);
  } finally {
    store.close(); // checkpoints WAL into the main db file
  }
}

module.exports = { reseed };
