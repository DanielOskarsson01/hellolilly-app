'use strict';

// Manual end-to-end discovery run (the first working loop):
//   1. read candidate_preferences.json (LOCAL, uncommitted personal data)
//   2. buildFilterSet(prefs) — apply the two corrections — and seed it into the store as filterSet/active
//   3. invoke job-discovery THROUGH the broker — it reads the filter set from the store and queries
//      the real provider APIs (jobtech / remotive / remoteok — public, no auth)
//   4. print the summary + a sample of real jobs that landed in the `jobs` collection
//
// One process, so the in-memory store is shared between the seed and the run. (A scheduled/cron run
// needs a long-running host or the deferred real DB — see RESUME; not relevant to this manual run.)
//
// Run:  node server/run-discovery.cjs

const fs = require('node:fs');
const path = require('node:path');
const { createHost } = require('./skeleton/host.cjs');
const { buildFilterSet } = require('./seed-filter-set.cjs');

const PREFS_PATH = path.resolve(__dirname, '../docs/candidate_preferences.json');

async function main() {
  if (!fs.existsSync(PREFS_PATH)) {
    console.error(`Missing ${PREFS_PATH} — the local candidate preferences file is required to seed the filter set.`);
    process.exit(1);
  }
  const prefs = JSON.parse(fs.readFileSync(PREFS_PATH, 'utf8'));
  const filterSet = buildFilterSet(prefs);

  const host = createHost(); // real http; llm/search may be null (discovery needs neither)
  host.store.putRecord('filterSet', filterSet);
  console.log(`seeded filterSet/active — searchTerms: ${filterSet.searchTerms.join(', ')}`);
  console.log(`providers: ${filterSet.providers.join(', ')} | maxResults: ${filterSet.maxResults}`);
  console.log(`reject terms: ${filterSet.rejectTitleTerms.length} | bad companies: ${filterSet.badCompanies.length}\n`);

  const { result } = await host.invoke('job-discovery', {});
  console.log('discovery result:', JSON.stringify(result, null, 2));

  const jobs = host.store.listRecords('jobs');
  console.log(`\n${jobs.length} jobs in the store. Sample:`);
  for (const j of jobs.slice(0, 8)) {
    const flag = j.signal === 'low' ? `  [flagged: ${j.matchedRules.map((r) => r.term).join(', ')}]` : '';
    console.log(`- [${j.source}] ${j.title} — ${j.company} (${j.location || 'n/a'})${flag}`);
    console.log(`    ${j.url}`);
  }
}

main().catch((err) => { console.error('run-discovery failed:', err); process.exit(1); });
