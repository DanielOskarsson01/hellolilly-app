'use strict';

// Seed the candidate datafact pool from the canonical English cv_data.json.
// Repeatable + idempotent-by-content (ingestDatafact upserts by id; re-running re-mints
// fresh ids, so for the in-memory MVP this is "load once at boot" — the API host calls
// seedDatafacts() at startup). CLI: `node scripts/seed-datafacts.cjs --print`.

const fs = require('node:fs');
const path = require('node:path');
const { cvDataToDatafacts } = require('../server/skeleton/datafacts/ingest-cv.cjs');

// Canonical source — IN-REPO since D2 (2026-07-03): data/cv_data.json, gitignored
// (personal data stays out of git, but the file lives inside the project boundary).
// Copied from JobSearch/CVs/cv-source/en/cv_data.json, verified a strict superset of
// the older top-level copy (structural diff in the D1+D2 build report). The sibling
// JobSearch folder is no longer a runtime dependency of this repo.
const DEFAULT_JSON = path.resolve(__dirname, '../data/cv_data.json');

function seedDatafacts(store, { jsonPath = DEFAULT_JSON, language = 'en' } = {}) {
  if (!fs.existsSync(jsonPath)) {
    throw new Error(
      `Candidate CV data not found at ${jsonPath}. ` +
      'Copy your cv_data.json to data/cv_data.json (personal data, gitignored — see data/README.md), ' +
      'or pass { jsonPath } / set CV_DATA_PATH.',
    );
  }
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const cv = JSON.parse(raw);
  // Wave 2 (3.2): stamp curated origin WITH the source file's sha, so every seeded fact's
  // provenance is auditable against the exact cv_data.json bytes it came from.
  const originDetail = {
    method: 'cv_data-ingest',
    file: path.basename(jsonPath),
    cvDataSha256: require('node:crypto').createHash('sha256').update(raw).digest('hex'),
    ingestedAt: new Date().toISOString(),
  };
  const facts = cvDataToDatafacts(cv, language, originDetail);
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
