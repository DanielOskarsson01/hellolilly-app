'use strict';

// job-discovery — scheduled multi-provider job search, rewrapped from the pipeline's step-1
// ("copy freely, call never"). The load-bearing requirement (the operability principle): it
// reads its filter set FROM THE STORE (seeded from candidate_preferences), never hardcoded —
// so the same code keeps working when Daniel edits the filters as data. Output is the canonical
// job shape, written into the `jobs` collection, deduped by externalId, NOTHING silently dropped.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createStore } = require('./store/index.cjs');
const { runStandalone } = require('./host.cjs');

const manifest = require('../submodules/job-discovery/manifest.cjs');
const execute = require('../submodules/job-discovery/execute.cjs');

// A fake http capability returning provider-shaped payloads. Records every URL it was called
// with, so a test can prove the query carried a STORE-BACKED search term (not a hardcoded one).
function makeFakeHttp() {
  const calls = [];
  return {
    calls,
    get: async (url) => {
      calls.push(url);
      if (url.includes('jobtechdev.se')) {
        const q = new URL(url).searchParams.get('q') || '';
        return { status: 200, body: JSON.stringify({ hits: [
          { id: 'jt1', headline: `${q} at Acme`, employer: { name: 'Acme' }, workplace_address: { municipality: 'Stockholm' }, description: { text: 'A great <b>leadership</b> role.' }, webpage_url: 'https://jobs/jt1', publication_date: '2026-06-01' },
        ] }) };
      }
      if (url.includes('remotive.com')) {
        return { status: 200, body: JSON.stringify({ jobs: [
          { id: 'rm1', title: 'Head of Product', company_name: 'Beta', candidate_required_location: 'EU', description: 'Own the product vision.', url: 'https://jobs/rm1', publication_date: '2026-06-02' },
          { id: 'rm2', title: 'Sales Representative', company_name: 'Gamma', candidate_required_location: 'US', description: 'Close deals and hit quota.', url: 'https://jobs/rm2', publication_date: '2026-06-03' },
        ] }) };
      }
      return { status: 200, body: '[]' };
    },
  };
}

function seedFilterSet(store, overrides = {}) {
  store.putRecord('filterSet', {
    id: 'active',
    searchTerms: ['CMO', 'Head of Product'],
    providers: ['jobtech', 'remotive'],
    maxResults: 10,
    rejectTitleTerms: [],
    badCompanies: [],
    ...overrides,
  });
}

test('job-discovery fails loud when no filter set is in the store', async () => {
  const store = createStore();
  await assert.rejects(
    () => runStandalone(manifest, execute, {}, { store, http: makeFakeHttp() }),
    /filter set/i,
  );
});

test('searches each provider using the STORE-BACKED search terms and writes canonical jobs', async () => {
  const store = createStore();
  seedFilterSet(store, { searchTerms: ['CMO'], providers: ['jobtech'] });
  const http = makeFakeHttp();

  const result = await runStandalone(manifest, execute, {}, { store, http });

  // the query carried the store term, not a hardcoded keyword
  assert.ok(http.calls.some((u) => u.includes('jobtechdev.se') && u.includes('CMO')), 'jobtech was queried with the store term CMO');
  assert.ok(!http.calls.some((u) => u.includes('lager') || u.includes('logistik')), 'no hardcoded default keywords leaked into the query');

  const jobs = store.listRecords('jobs');
  assert.equal(jobs.length, 1);
  const j = jobs[0];
  assert.match(j.id, /^job_[0-9a-f]{8}$/);
  assert.equal(j.externalId, 'jobtech-jt1');
  assert.equal(j.source, 'jobtech');
  assert.equal(j.company, 'Acme');
  assert.equal(j.location, 'Stockholm');
  assert.equal(j.url, 'https://jobs/jt1');
  assert.equal(j.decision, 'new');
  assert.ok(typeof j.text_content === 'string' && !j.text_content.includes('<b>'), 'text_content is HTML-stripped full text');
  assert.ok(j.discoveredAt, 'discoveredAt set');
  assert.ok(result.added >= 1);
});

test('feed-mode provider filters client-side by the store-backed terms', async () => {
  const store = createStore();
  seedFilterSet(store, { searchTerms: ['Head of Product'], providers: ['remotive'] });
  await runStandalone(manifest, execute, {}, { store, http: makeFakeHttp() });

  const titles = store.listRecords('jobs').map((j) => j.title);
  assert.ok(titles.includes('Head of Product'), 'the matching feed item is kept');
  assert.ok(!titles.includes('Sales Representative'), 'a feed item not matching any search term is not relevant (search, not a hidden hard-filter)');
});

test('dedups by externalId against jobs already in the store (decisions are not clobbered)', async () => {
  const store = createStore();
  seedFilterSet(store, { searchTerms: ['CMO'], providers: ['jobtech'] });
  // a prior run already stored jobtech-jt1 and Daniel rejected it
  store.putRecord('jobs', { id: 'job_existing', externalId: 'jobtech-jt1', decision: 'rejected', title: 'old' });

  await runStandalone(manifest, execute, {}, { store, http: makeFakeHttp() });

  const jt1 = store.listRecords('jobs').filter((j) => j.externalId === 'jobtech-jt1');
  assert.equal(jt1.length, 1, 'no duplicate for an already-known externalId');
  assert.equal(jt1[0].decision, 'rejected', 'the existing decision is preserved, not reset to new');
});

test('location: out and off-target jobs are FLAGGED (down-ranked), good locations are not — nothing hidden', async () => {
  const store = createStore();
  // stage_1 location preferences seeded (good/maybe/out) — discovery reads them
  store.putRecord('filterSet', {
    id: 'active', searchTerms: ['CMO'], providers: ['jobtech'], maxResults: 10,
    stage_1: { location: { good: ['stockholm', 'remote'], maybe: ['sweden-other'], out: ['göteborg', 'goteborg'] } },
  });
  const cities = [
    { id: 's1', municipality: 'Stockholm' },
    { id: 'g1', municipality: 'Göteborg' },
    { id: 'b1', municipality: 'Borås' },
  ];
  const http = {
    get: async () => ({ status: 200, body: JSON.stringify({ hits: cities.map((c) => ({
      id: c.id, headline: 'CMO', employer: { name: 'Co' }, workplace_address: { municipality: c.municipality },
      description: { text: 'role' }, webpage_url: `https://jobs/${c.id}`, publication_date: '2026-06-01',
    })) }) }),
  };

  await runStandalone(manifest, execute, {}, { store, http });

  const jobs = store.listRecords('jobs');
  assert.equal(jobs.length, 3, 'all three stored — out-of-area jobs are down-ranked, never hidden');
  const byCity = Object.fromEntries(jobs.map((j) => [j.location, j]));

  assert.equal(byCity['Stockholm'].signal, 'neutral', 'a good location is not flagged');
  assert.equal(byCity['Göteborg'].signal, 'low', 'an explicitly-out location is flagged');
  assert.ok(byCity['Göteborg'].matchedRules.some((r) => r.rule === 'location_out'), 'out reason recorded');
  assert.equal(byCity['Borås'].signal, 'low', 'a location not on good/maybe is flagged off-target');
  assert.ok(byCity['Borås'].matchedRules.some((r) => r.rule === 'location_off_target'), 'off-target reason recorded');
});

test('returns the items it saw this run: new canonical records AND dedup-hit existing records', async () => {
  const store = createStore();
  seedFilterSet(store, { searchTerms: ['CMO', 'Head of Product'], providers: ['jobtech', 'remotive'] });
  // jobtech-jt1 is already known and was rejected — the run must surface the EXISTING record
  store.putRecord('jobs', { id: 'job_existing', externalId: 'jobtech-jt1', decision: 'rejected', title: 'old title' });

  const result = await runStandalone(manifest, execute, {}, { store, http: makeFakeHttp() });

  assert.ok(Array.isArray(result.items), 'items[] returned');
  const byExternalId = Object.fromEntries(result.items.map((i) => [i.externalId, i]));
  assert.equal(byExternalId['jobtech-jt1'].decision, 'rejected', 'dedup hit returns the stored record (with its decision), not a fresh one');
  assert.equal(byExternalId['jobtech-jt1'].id, 'job_existing');
  assert.ok(byExternalId['remotive-rm1'], 'a newly-added job is in items too');
  assert.equal(byExternalId['remotive-rm1'].decision, 'new');
});

test('items[] holds each job once even when several search terms return it', async () => {
  const store = createStore();
  // both terms hit the jobtech fixture, which returns an item with the SAME id (jt1)
  seedFilterSet(store, { searchTerms: ['CMO', 'Head of Marketing'], providers: ['jobtech'] });

  const result = await runStandalone(manifest, execute, {}, { store, http: makeFakeHttp() });

  const ids = result.items.map((i) => i.externalId);
  assert.equal(ids.filter((id) => id === 'jobtech-jt1').length, 1, 'no duplicate items for the same externalId in one run');
});

test('jobtech search carries the filterSet municipality when set', async () => {
  const store = createStore();
  seedFilterSet(store, { searchTerms: ['CMO'], providers: ['jobtech'], municipality: '0180' });
  const http = makeFakeHttp();
  await runStandalone(manifest, execute, {}, { store, http });
  assert.ok(http.calls.some((u) => u.includes('jobtechdev.se') && u.includes('municipality=0180')), 'municipality param appended');
});

test('never drops: a job matching a store-backed reject term is stored and FLAGGED, not hidden', async () => {
  const store = createStore();
  seedFilterSet(store, { searchTerms: ['CMO'], providers: ['jobtech'], rejectTitleTerms: ['acme'], badCompanies: ['acme'] });
  await runStandalone(manifest, execute, {}, { store, http: makeFakeHttp() });

  const jobs = store.listRecords('jobs');
  assert.equal(jobs.length, 1, 'the reject-matching job is still stored, never silently dropped');
  const j = jobs[0];
  assert.equal(j.decision, 'new');
  assert.equal(j.signal, 'low', 'flagged low by the store-backed reject rule');
  assert.ok(Array.isArray(j.matchedRules) && j.matchedRules.length >= 1, 'the matched reject rule is recorded for transparency');
});
