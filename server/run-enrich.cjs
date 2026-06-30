'use strict';

// Manual end-to-end body-enrichment run (proves the input layer completes):
//   1. ingest the LOCAL LinkedIn CSV → body-less canonical stage-1 jobs (needs_body:true)
//   2. enrich (linkedin-job-fetcher enrich mode) → fetch each guest posting, fill text_content IN
//      PLACE, leaving the CSV's metadata + decision untouched. Paced + limited to be a good citizen.
//   3. show one job going body-less → full-bodied, and that the body is now stage-2 filterable.
//
// One process (the in-memory store is shared between ingest and enrich). LinkedIn CSV stays local.
// Run:  node server/run-enrich.cjs        (env: LIMIT=12 DELAY=1200)

const fs = require('node:fs');
const path = require('node:path');
const { createHost } = require('./skeleton/host.cjs');

const CSV_PATH = path.resolve(__dirname, '../docs/jobs-2026-06-29.csv');
const LIMIT = Number(process.env.LIMIT || 12);
const DELAY = Number(process.env.DELAY || 1200);

async function main() {
  if (!fs.existsSync(CSV_PATH)) { console.error(`Missing ${CSV_PATH}`); process.exit(1); }
  const csv = fs.readFileSync(CSV_PATH, 'utf8');
  const host = createHost();

  const { result: ing } = await host.invoke('job-ingest', { csv });
  console.log(`ingest: ${ing.rows} rows → ${ing.added} jobs`);
  const before = host.store.listRecords('jobs');
  const sampleExt = (before.find((j) => j.needs_body) || {}).externalId;
  console.log(`body-less (needs_body) before enrich: ${before.filter((j) => j.needs_body).length}\n`);

  const { result: enr } = await host.invoke('linkedin-job-fetcher', { enrich: true, limit: LIMIT, delayMs: DELAY });
  console.log(`enrich (limit ${LIMIT}, delay ${DELAY}ms): ${JSON.stringify(enr.summary)} | ok=${enr.ok}\n`);

  const after = host.store.listRecords('jobs');
  const s = after.find((j) => j.externalId === sampleExt);
  if (s) {
    console.log(`SAMPLE job ${sampleExt}:`);
    console.log(`  ${s.title} — ${s.company} | ${s.location} | decision=${s.decision} | locFit=${s.locFit}`);
    console.log(`  needs_body: ${s.needs_body} | body_status: ${s.body_status} | body chars: ${s.text_content.length}`);
    console.log(`  body head: ${s.text_content.slice(0, 220).replace(/\s+/g, ' ').trim()}\n`);
  }

  const enriched = after.filter((j) => !j.needs_body && j.text_content && j.text_content.length > 40);
  console.log(`full-bodied (stage-2-ready): ${enriched.length}`);
  console.log('stage-2 signal scan over the enriched bodies (proves the body unlocks stage-2 filtering):');
  console.log(`  EU/timezone mentioned:        ${enriched.filter((j) => /\b(EU|timezone|CET|GMT|remote)\b/i.test(j.text_content)).length}`);
  console.log(`  developers/sprints (technical): ${enriched.filter((j) => /\b(sprint|developers?|engineering team|roadmap)\b/i.test(j.text_content)).length}`);
  console.log(`  language requirement:         ${enriched.filter((j) => /\b(native|fluent|bilingual)\b/i.test(j.text_content)).length}`);
}

main().catch((err) => { console.error('run-enrich failed:', err); process.exit(1); });
