'use strict';

// linkedin-job-fetcher ENRICH mode — fills the body of jobs already in the store (the body-less
// CSV-ingested LinkedIn jobs, needs_body:true). Design = enrich-existing (workflow-confirmed): the
// record is born from the authoritative source (job-ingest), and enrich ADDS ONLY the body
// (text_content + needs_body:false + body_status) in place by the SAME record.id — never touching
// the CSV's metadata or Daniel's decision. needs_body is the retry cursor (404 terminal, 429/error
// retryable, thin-body retryable). Fixture mirrors the real LinkedIn guest markup.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createStore } = require('./store/index.cjs');
const { createHost, runStandalone } = require('./host.cjs');

const manifest = require('../submodules/linkedin-job-fetcher/manifest.cjs');
const execute = require('../submodules/linkedin-job-fetcher/execute.cjs');

// Faithful to the live guest response: top-card title/company/location, then the description
// markup div bounded by show-more-less-html__button, then trailing chrome (criteria + referrals).
const SAMPLE = `
<section class="top-card-layout">
  <a class="topcard__link"><h2 class="top-card-layout__title font-sans font-bold topcard__title">Chief Marketing Officer / CMO</h2></a>
  <span class="topcard__flavor"><a class="topcard__org-name-link topcard__flavor--black-link" href="https://se.linkedin.com/company/acme">Acme Guest AB</a></span>
  <span class="topcard__flavor topcard__flavor--bullet"> Stockholm, Stockholm County, Sweden </span>
</section>
<div class="show-more-less-html__markup show-more-less-html__markup--clamp-after-5 relative overflow-hidden">
  <p>We lead growth across the EU timezone. Salary competitive. You will own the commercial roadmap and the brand.</p>
</div>
<button class="show-more-less-html__button show-more-less-html__button--more">Show more</button>
<ul class="description__job-criteria-list"><li>Seniority level Executive</li></ul>
Referrals increase your chances of interviewing at Acme by 2x. See who you know.`;

const EMPTY_SAMPLE = '<div class="show-more-less-html__markup"></div><button class="show-more-less-html__button">Show more</button>';

function makeFakeHttp(overrides = {}) {
  const calls = [];
  const map = {
    404000: { status: 404, body: '' },
    429000: { status: 429, body: '' },
    500000: { status: 500, body: '' },
    111111: { status: 200, body: EMPTY_SAMPLE },
    ...overrides,
  };
  return {
    calls,
    get: async (url, o = {}) => {
      calls.push({ url, headers: o.headers || {} });
      const id = (url.match(/jobPosting\/(\d+)/) || [])[1];
      const r = map[id];
      if (r === 'THROW') throw new Error('network boom');
      if (r) return r;
      return { status: 200, body: SAMPLE };
    },
    countFor: (id) => calls.filter((c) => c.url.includes(`jobPosting/${id}`)).length,
  };
}

const SWE_LOC = 'Stockholm, Stockholms län, Sverige (På plats)';

function seedNeedsBody(store, externalId, extra = {}) {
  const num = externalId.replace('linkedin-', '');
  const id = `job_seed_${num}`;
  store.putRecord('jobs', {
    id,
    externalId,
    source: 'csv-linkedin',
    title: 'Head of Growth',
    company: 'A5 Labs',
    location: SWE_LOC,
    url: `https://www.linkedin.com/jobs/view/${num}/`,
    snippet: '',
    text_content: '',
    needs_body: true,
    decision: 'new',
    found_in: 'PT:marketing',
    locFit: 'GOOD',
    rejectReason: null,
    postedAt: '2026-06-29',
    discoveredAt: '2026-06-29T00:00:00Z',
    ...extra,
  });
  return id;
}

const enrich = (store, http, input = {}) =>
  runStandalone(manifest, execute, { enrich: true, ...input }, { store, http });

test('happy path: fills the body in place, flips needs_body, marks body_status ok, no duplicate', async () => {
  const store = createStore();
  const seededId = seedNeedsBody(store, 'linkedin-100');
  const http = makeFakeHttp();

  const res = await enrich(store, http);

  const rows = store.listRecords('jobs').filter((j) => j.externalId === 'linkedin-100');
  assert.equal(rows.length, 1, 'in-place update — no duplicate record');
  const j = rows[0];
  assert.equal(j.id, seededId, 'same record id (not a fresh mintId)');
  assert.ok(j.text_content.includes('commercial roadmap'), 'body filled from the guest description');
  assert.ok(!j.text_content.includes('Referrals increase'), 'trailing chrome bounded out');
  assert.ok(!j.text_content.includes('Seniority level'), 'criteria list bounded out');
  assert.equal(j.needs_body, false);
  assert.equal(j.body_status, 'ok');
  assert.equal(res.summary.ok, 1);
  assert.equal(res.ok, true);
});

test('preserves the CSV Swedish location — does NOT overwrite with the guest English string', async () => {
  const store = createStore();
  seedNeedsBody(store, 'linkedin-100');
  await enrich(store, makeFakeHttp());
  const j = store.listRecords('jobs')[0];
  assert.equal(j.location, SWE_LOC, 'CSV location is authoritative; guest "Stockholm, Stockholm County, Sweden" discarded');
});

test('preserves an existing decision (approved / rejected)', async () => {
  for (const decision of ['approved', 'rejected']) {
    const store = createStore();
    seedNeedsBody(store, 'linkedin-100', { decision });
    await enrich(store, makeFakeHttp());
    assert.equal(store.listRecords('jobs')[0].decision, decision, `decision ${decision} survives enrich`);
  }
});

test('preserves ALL CSV metadata — only text_content/needs_body/body_status change', async () => {
  const store = createStore();
  const before = { ...store.getRecord('jobs', seedNeedsBody(store, 'linkedin-100')) };
  await enrich(store, makeFakeHttp());
  const after = store.listRecords('jobs')[0];
  for (const f of ['id', 'externalId', 'source', 'title', 'company', 'location', 'url', 'snippet', 'found_in', 'locFit', 'rejectReason', 'postedAt', 'discoveredAt']) {
    assert.deepEqual(after[f], before[f], `${f} unchanged by enrich`);
  }
});

test('404 is terminal: marked expired, needs_body cleared, body stays empty, record visible', async () => {
  const store = createStore();
  seedNeedsBody(store, 'linkedin-404000');
  const res = await enrich(store, makeFakeHttp());
  const j = store.listRecords('jobs')[0];
  assert.equal(j.body_status, 'expired');
  assert.equal(j.needs_body, false, '404 is terminal — not retried forever');
  assert.equal(j.text_content, '');
  assert.equal(res.summary.expired, 1);
  assert.ok(res.results.some((r) => r.externalId === 'linkedin-404000' && r.status === 'expired'));
});

test('429 is retryable: rate_limited, needs_body stays true, a second run re-attempts it', async () => {
  const store = createStore();
  seedNeedsBody(store, 'linkedin-429000');
  const http = makeFakeHttp();
  const res = await enrich(store, http);
  const j = store.listRecords('jobs')[0];
  assert.equal(j.body_status, 'rate_limited');
  assert.equal(j.needs_body, true, 'stays in the retry set');
  assert.equal(res.ok, false, 'a rate-limited batch is not a clean success');
  await enrich(store, http);
  assert.equal(http.countFor('429000'), 2, 'second run retried the same job');
});

test('network error and non-200 are retryable (needs_body stays true), no garbage body', async () => {
  const store = createStore();
  seedNeedsBody(store, 'linkedin-222');
  seedNeedsBody(store, 'linkedin-500000');
  const res = await enrich(store, makeFakeHttp({ 222: 'THROW' }));
  const byExt = Object.fromEntries(store.listRecords('jobs').map((j) => [j.externalId, j]));
  assert.equal(byExt['linkedin-222'].body_status, 'error');
  assert.equal(byExt['linkedin-222'].needs_body, true);
  assert.equal(byExt['linkedin-222'].text_content, '');
  assert.equal(byExt['linkedin-500000'].body_status, 'error');
  assert.equal(byExt['linkedin-500000'].needs_body, true);
  assert.equal(res.ok, false);
});

test('a needs_body job with no extractable LinkedIn id makes NO request and is kept visible', async () => {
  const store = createStore();
  seedNeedsBody(store, 'csvonly-x', { externalId: 'csvonly-x', url: 'https://example.com/not-a-job' });
  const http = makeFakeHttp();
  await enrich(store, http);
  assert.equal(http.calls.length, 0, 'no phantom fetch');
  const j = store.listRecords('jobs')[0];
  assert.equal(j.needs_body, true, 'kept needs_body, not lost');
  assert.match(j.body_status, /no_id|error/);
});

test('id is resolved from the externalId even when the url is blank', async () => {
  const store = createStore();
  seedNeedsBody(store, 'linkedin-100', { url: '' });
  const http = makeFakeHttp();
  await enrich(store, http);
  assert.equal(http.countFor('100'), 1, 'fetched jobPosting/100 from externalId linkedin-100');
  assert.equal(store.listRecords('jobs')[0].needs_body, false);
});

test('already body-full jobs are skipped — no refetch', async () => {
  const store = createStore();
  seedNeedsBody(store, 'linkedin-100', { needs_body: false, text_content: 'already has a body', body_status: 'ok' });
  const http = makeFakeHttp();
  const res = await enrich(store, http);
  assert.equal(http.calls.length, 0);
  assert.equal(store.listRecords('jobs')[0].text_content, 'already has a body');
  assert.equal(res.summary.ok, 0);
});

test('empty/thin guest body on a 200 does NOT falsely advance to stage-2', async () => {
  const store = createStore();
  seedNeedsBody(store, 'linkedin-111111'); // fake returns EMPTY_SAMPLE
  const res = await enrich(store, makeFakeHttp());
  const j = store.listRecords('jobs')[0];
  assert.equal(j.body_status, 'thin');
  assert.equal(j.needs_body, true, 'thin body stays retryable, never marked done with an empty body');
  assert.equal(j.text_content, '');
  assert.equal(res.ok, false);
});

test('limit caps the batch; the rest stay needs_body (deferred) for the next run', async () => {
  const store = createStore();
  seedNeedsBody(store, 'linkedin-100');
  seedNeedsBody(store, 'linkedin-200');
  seedNeedsBody(store, 'linkedin-300');
  const http = makeFakeHttp();
  const res = await enrich(store, http, { limit: 1 });
  assert.equal(res.summary.ok, 1, 'only one enriched');
  assert.equal(res.summary.deferred, 2, 'the other two deferred to the next run');
  assert.equal(http.calls.length, 1, 'only one fetch made');
  assert.equal(store.listRecords('jobs').filter((j) => j.needs_body).length, 2, 'two still need a body');
});

test('no needs_body jobs is a clean no-op', async () => {
  const store = createStore();
  seedNeedsBody(store, 'linkedin-100', { needs_body: false, text_content: 'body', body_status: 'ok' });
  const http = makeFakeHttp();
  const res = await enrich(store, http);
  assert.equal(http.calls.length, 0);
  assert.equal(res.ok, true);
  assert.equal(res.summary.ok, 0);
});

test('idempotent: a second run does not refetch succeeded/expired jobs and creates no duplicates', async () => {
  const store = createStore();
  seedNeedsBody(store, 'linkedin-100');
  seedNeedsBody(store, 'linkedin-404000');
  const http = makeFakeHttp();
  await enrich(store, http);
  await enrich(store, http);
  assert.equal(http.countFor('100'), 1, 'succeeded job not refetched');
  assert.equal(http.countFor('404000'), 1, 'expired job not refetched');
  assert.equal(store.listRecords('jobs').length, 2, 'no duplicate records');
});

test('partial progress is durable: records processed before a mid-batch throw are persisted + in _partialItems', async () => {
  const store = createStore();
  seedNeedsBody(store, 'linkedin-100');
  seedNeedsBody(store, 'linkedin-200');
  // 200 throws; 100 should already be persisted regardless of order — assert at least the non-throwing one landed
  const http = makeFakeHttp({ 200: 'THROW' });
  const res = await enrich(store, http);
  const ok = store.listRecords('jobs').find((j) => j.externalId === 'linkedin-100');
  assert.equal(ok.needs_body, false, 'the successful one is persisted (not all-or-nothing)');
  assert.ok(res.results.length === 2, 'both rows reported');
});

test('mixed batch: correct per-record status + exact summary; only the ok one gains a body', async () => {
  const store = createStore();
  seedNeedsBody(store, 'linkedin-100'); // ok
  seedNeedsBody(store, 'linkedin-404000'); // expired
  seedNeedsBody(store, 'linkedin-429000'); // rate_limited
  seedNeedsBody(store, 'linkedin-111111'); // thin
  seedNeedsBody(store, 'linkedin-900', { needs_body: false, text_content: 'pre', body_status: 'ok' }); // body-full, skipped
  const res = await enrich(store, makeFakeHttp());
  assert.equal(res.summary.ok, 1);
  assert.equal(res.summary.expired, 1);
  assert.equal(res.summary.rate_limited, 1);
  assert.equal(res.summary.thin, 1);
  const bodied = store.listRecords('jobs').filter((j) => j.text_content && j.text_content.length > 0);
  assert.deepEqual(bodied.map((j) => j.externalId).sort(), ['linkedin-100', 'linkedin-900'], 'only the ok one newly gained a body (900 already had one)');
});

test('integration: ingest CSV then enrich in one process → bodies filled, metadata + decisions intact', async () => {
  const csvManifest = require('../submodules/job-ingest/manifest.cjs');
  const csvExecute = require('../submodules/job-ingest/execute.cjs');
  const store = createStore();
  const http = makeFakeHttp();
  const CSV = [
    'title,company,location,url,approve',
    `CMO,Acme,"${SWE_LOC}",https://www.linkedin.com/jobs/view/100/,y`,
    `Head of Product,Beta,Göteborg,https://www.linkedin.com/jobs/view/404000/,`,
  ].join('\n');

  await runStandalone(csvManifest, csvExecute, { csv: CSV }, { store });
  // both body-less now
  assert.ok(store.listRecords('jobs').every((j) => j.needs_body === true));

  await runStandalone(manifest, execute, { enrich: true }, { store, http });

  const byExt = Object.fromEntries(store.listRecords('jobs').map((j) => [j.externalId, j]));
  assert.ok(byExt['linkedin-100'].text_content.includes('commercial roadmap'), 'CSV job is now full-bodied');
  assert.equal(byExt['linkedin-100'].needs_body, false);
  assert.equal(byExt['linkedin-100'].decision, 'approved', 'CSV approve=y decision preserved');
  assert.equal(byExt['linkedin-100'].location, SWE_LOC, 'CSV metadata intact');
  assert.equal(byExt['linkedin-404000'].body_status, 'expired', '404 job surfaced, not lost');
});
