'use strict';

// job-ingest — CSV upload (LinkedIn jobs that can't be API-searched) → canonical stage-1 jobs in
// the store. Parses Daniel's annotated tracking export: quoted-comma fields + UTF-8-read-as-Latin-1
// mojibake (PÃ¥→På, lÃ¤n→län). Maps to the same canonical shape as discovery/fetcher, dedups by
// externalId without clobbering an existing decision, and marks each needs_body (the description
// body is enriched later by linkedin-job-fetcher — a separate step).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createStore } = require('./store/index.cjs');
const { runStandalone } = require('./host.cjs');

const manifest = require('../submodules/job-ingest/manifest.cjs');
const execute = require('../submodules/job-ingest/execute.cjs');

// Fixture mirrors the real file: header + rows with mojibake and quoted-comma fields.
const CSV = [
  'approve,reason,placement,priority,title,company,location,loc_fit,lang_flag,found_in,url,posted_date,snippet',
  ',,Remote,â,Head of Growth,A5 Labs,Europeiska unionen (PÃ¥ distans),GOOD,,PT:marketing,https://www.linkedin.com/jobs/view/4420117327/,2026-06-29,',
  ',,Remote,â,Chief Marketing Officer,Career Group,"Miami, FL (PÃ¥ distans)",GOOD,,REMOTE:CMO,https://www.linkedin.com/jobs/view/4431412101/,2026-06-29,',
  ',,Remote,â,Head of Growth,"Syndesus, Inc.",Kanada (PÃ¥ distans),GOOD,,REMOTE:marketing,https://www.linkedin.com/jobs/view/4424729584/,2026-06-29,',
  ',,Stockholm,,VD,Solvalla,"Stockholms lÃ¤n, Sverige (PÃ¥ plats)",GOOD,,SE:marknadschef,https://www.linkedin.com/jobs/view/4426746470/,2026-06-29,',
].join('\n');

test('parses the CSV, repairs mojibake, and stores canonical stage-1 jobs', async () => {
  const store = createStore();
  const res = await runStandalone(manifest, execute, { csv: CSV }, { store });

  const jobs = store.listRecords('jobs');
  assert.equal(jobs.length, 4, 'one job per data row');

  const a5 = jobs.find((j) => j.externalId === 'linkedin-4420117327');
  assert.ok(a5, 'externalId derived from the LinkedIn url');
  assert.equal(a5.source, 'csv-linkedin');
  assert.equal(a5.title, 'Head of Growth');
  assert.equal(a5.company, 'A5 Labs');
  assert.equal(a5.location, 'Europeiska unionen (På distans)', 'mojibake repaired (PÃ¥ → På)');
  assert.equal(a5.url, 'https://www.linkedin.com/jobs/view/4420117327/');
  assert.equal(a5.decision, 'new', 'blank approve → new');
  assert.equal(a5.found_in, 'PT:marketing');
  assert.equal(a5.text_content, '', 'body empty — needs enrichment');
  assert.equal(a5.needs_body, true);
  assert.ok(a5.discoveredAt);
});

test('handles quoted fields containing commas', async () => {
  const store = createStore();
  await runStandalone(manifest, execute, { csv: CSV }, { store });
  const jobs = store.listRecords('jobs');
  assert.equal(jobs.find((j) => j.externalId === 'linkedin-4431412101').location, 'Miami, FL (På distans)');
  assert.equal(jobs.find((j) => j.externalId === 'linkedin-4424729584').company, 'Syndesus, Inc.');
  assert.equal(jobs.find((j) => j.externalId === 'linkedin-4426746470').location, 'Stockholms län, Sverige (På plats)');
});

test('dedups by externalId and does not clobber an existing decision', async () => {
  const store = createStore();
  store.putRecord('jobs', { id: 'job_old', externalId: 'linkedin-4420117327', decision: 'rejected', title: 'old' });
  const res = await runStandalone(manifest, execute, { csv: CSV }, { store });

  const a5 = store.listRecords('jobs').filter((j) => j.externalId === 'linkedin-4420117327');
  assert.equal(a5.length, 1, 'no duplicate');
  assert.equal(a5[0].decision, 'rejected', 'existing decision preserved');
  assert.equal(res.added, 3, 'only the three new rows were added');
  assert.equal(res.skipped, 1);
});

test('returns a summary with the LinkedIn urls for downstream body enrichment', async () => {
  const store = createStore();
  const res = await runStandalone(manifest, execute, { csv: CSV }, { store });
  assert.equal(res.rows, 4);
  assert.equal(res.added, 4);
  assert.equal(res.urls.length, 4);
  assert.ok(res.urls.every((u) => u.includes('linkedin.com/jobs/view/')));
});

test('a row without an extractable LinkedIn id is reported, not silently dropped', async () => {
  const store = createStore();
  const bad = [
    'title,company,location,url',
    'Some Role,Some Co,Somewhere,https://example.com/not-a-job',
  ].join('\n');
  const res = await runStandalone(manifest, execute, { csv: bad }, { store });
  assert.equal(res.added, 0);
  assert.equal(res.errors.length, 1);
  assert.match(res.errors[0], /id/i);
});
