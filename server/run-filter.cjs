'use strict';

// Full job-search input+filter pipeline, end-to-end in one process (the in-memory store is shared):
//   1. seed filterSet/active from the LOCAL candidate preferences (buildFilterSet — incl. stage_2 patterns)
//   2. ingest the LOCAL LinkedIn CSV → body-less stage-1 jobs
//   3. enrich (linkedin-job-fetcher) → fill the bodies (paced + limited)
//   4. stage2-filter → apply the stage_2 reject codes against the bodies, flag-never-hide
//   5. print the jobs flagged on STAGE-2 (body) grounds, with the reason codes
//
// Local data files stay local (gitignored). Run:  node server/run-filter.cjs   (env: LIMIT=15 DELAY=1300)

const fs = require('node:fs');
const path = require('node:path');
const { createHost } = require('./skeleton/host.cjs');
const { buildFilterSet } = require('./seed-filter-set.cjs');

const PREFS = path.resolve(__dirname, '../docs/candidate_preferences.json');
const CSV = path.resolve(__dirname, '../docs/jobs-2026-06-29.csv');
const LIMIT = Number(process.env.LIMIT || 15);
const DELAY = Number(process.env.DELAY || 1300);

async function main() {
  for (const f of [PREFS, CSV]) if (!fs.existsSync(f)) { console.error(`Missing ${f}`); process.exit(1); }
  const host = createHost();

  host.store.putRecord('filterSet', buildFilterSet(JSON.parse(fs.readFileSync(PREFS, 'utf8'))));
  const { result: ing } = await host.invoke('job-ingest', { csv: fs.readFileSync(CSV, 'utf8') });
  console.log(`ingest: ${ing.added} jobs`);
  const { result: enr } = await host.invoke('linkedin-job-fetcher', { enrich: true, limit: LIMIT, delayMs: DELAY });
  console.log(`enrich (limit ${LIMIT}): ${JSON.stringify(enr.summary)}`);
  const { result: s2 } = await host.invoke('stage2-filter', {});
  console.log(`stage2-filter: scanned ${s2.scanned} bodies, flagged ${s2.flagged}, perCode ${JSON.stringify(s2.perCode)}\n`);

  const flagged = host.store.listRecords('jobs').filter((j) => (j.matchedRules || []).some((r) => r.stage === 2));
  console.log(`jobs down-ranked on STAGE-2 (body) grounds: ${flagged.length}`);
  for (const j of flagged.slice(0, 12)) {
    const reasons = j.matchedRules.filter((r) => r.stage === 2).map((r) => `${r.rule}:"${r.term}"`).join(', ');
    console.log(`- [${j.signal}] ${j.title} — ${j.company} (${j.location})`);
    console.log(`    ${reasons}`);
  }
}

main().catch((err) => { console.error('run-filter failed:', err); process.exit(1); });
