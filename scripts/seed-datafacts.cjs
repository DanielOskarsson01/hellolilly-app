'use strict';

// Seed the candidate datafact pool from the canonical English cv_data.json.
// Repeatable + idempotent-by-content (ingestDatafact upserts by id; re-running re-mints
// fresh ids, so for the in-memory MVP this is "load once at boot" — the API host calls
// seedDatafacts() at startup). CLI: `node scripts/seed-datafacts.cjs --print`.

const fs = require('node:fs');
const path = require('node:path');
const { cvDataToDatafacts } = require('../server/skeleton/datafacts/ingest-cv.cjs');

// Canonical source — resolved in the plan's pre-flight (cv-source/en is content-identical to
// the top-level copy, newer, and language-partitioned for the deferred Swedish step).
// scripts/ -> hello lily - app -> Projects -> JobSearch (TWO levels up, verified).
const DEFAULT_JSON = path.resolve(
  __dirname,
  '../../JobSearch/CVs/cv-source/en/cv_data.json',
);

function seedDatafacts(store, { jsonPath = DEFAULT_JSON, language = 'en' } = {}) {
  const cv = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const facts = cvDataToDatafacts(cv, language);
  for (const f of facts) store.ingestDatafact(f);
  return facts;
}

module.exports = { seedDatafacts, DEFAULT_JSON };

if (require.main === module) {
  const { createStore } = require('../server/skeleton/store/index.cjs');
  const store = createStore();
  const facts = seedDatafacts(store);
  const byType = facts.reduce((m, f) => ((m[f.type] = (m[f.type] || 0) + 1), m), {});
  console.log(`Seeded ${facts.length} datafacts (language=en) from\n  ${DEFAULT_JSON}`);
  console.log('By type:', JSON.stringify(byType, null, 2));
  if (process.argv.includes('--print')) console.log(JSON.stringify(facts, null, 2));
}
