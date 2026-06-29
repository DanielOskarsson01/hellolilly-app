'use strict';

// linkedin-job-fetcher — enriches LinkedIn jobs that can't be API-searched, via the
// UNAUTHENTICATED guest endpoint (jobs-guest/jobs/api/jobPosting/{id}) with a browser UA.
// No login, no Voyager, no headless browser → zero risk to any LinkedIn session, no new dep.
// LinkedIn-specific ONLY at id-extraction + HTML-parse; output is the generic canonical job shape.
// Statuses (ok / expired / rate_limited / error) are surfaced explicitly — never silently dropped.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createStore } = require('./store/index.cjs');
const { runStandalone } = require('./host.cjs');

const manifest = require('../submodules/linkedin-job-fetcher/manifest.cjs');
const execute = require('../submodules/linkedin-job-fetcher/execute.cjs');

const SAMPLE = `
<div class="top-card-layout__entity-info">
  <h2 class="top-card-layout__title">Chief Marketing Officer</h2>
  <a class="topcard__org-name-link" href="https://www.linkedin.com/company/acme">Acme AB</a>
  <span class="topcard__flavor topcard__flavor--bullet">Stockholm, Sweden</span>
</div>
<div class="show-more-less-html__markup">
  <p>We are looking for a CMO to lead growth. EU timezone, salary competitive.</p>
</div>`;

function makeFakeHttp() {
  const calls = [];
  return {
    calls,
    get: async (url, opts = {}) => {
      calls.push({ url, headers: opts.headers || {} });
      const id = (url.match(/jobPosting\/(\d+)/) || [])[1];
      if (id === '404000') return { status: 404, body: '' };
      if (id === '429000') return { status: 429, body: '' };
      return { status: 200, body: SAMPLE };
    },
  };
}

test('extracts the job id from a full LinkedIn URL (ignoring tracking params) and calls the guest endpoint with a browser UA', async () => {
  const store = createStore();
  const http = makeFakeHttp();
  const res = await runStandalone(manifest, execute, { urls: ['https://www.linkedin.com/jobs/view/3911223344/?refId=abc&trackingId=xyz'] }, { store, http });

  assert.equal(http.calls.length, 1);
  assert.ok(http.calls[0].url.includes('jobs-guest/jobs/api/jobPosting/3911223344'), 'guest endpoint with the extracted id');
  const ua = http.calls[0].headers['user-agent'] || http.calls[0].headers['User-Agent'] || '';
  assert.match(ua, /Mozilla/, 'a browser User-Agent was sent');
  assert.equal(res.results[0].status, 'ok');
});

test('parses the guest HTML into the canonical job shape and writes it to the jobs collection', async () => {
  const store = createStore();
  await runStandalone(manifest, execute, { ids: ['100'] }, { store, http: makeFakeHttp() });

  const jobs = store.listRecords('jobs');
  assert.equal(jobs.length, 1);
  const j = jobs[0];
  assert.equal(j.externalId, 'linkedin-100');
  assert.equal(j.source, 'linkedin');
  assert.equal(j.title, 'Chief Marketing Officer');
  assert.equal(j.company, 'Acme AB');
  assert.match(j.location, /Stockholm/);
  assert.ok(j.text_content.includes('CMO to lead growth'), 'full description body captured as text_content');
  assert.equal(j.decision, 'new');
  assert.match(j.url, /jobs\/view\/100/);
});

test('surfaces expired (404) and rate_limited (429) explicitly — never silently dropped', async () => {
  const store = createStore();
  const res = await runStandalone(manifest, execute, { ids: ['100', '404000', '429000'] }, { store, http: makeFakeHttp() });

  const byId = Object.fromEntries(res.results.map((r) => [r.jobId, r.status]));
  assert.equal(byId['100'], 'ok');
  assert.equal(byId['404000'], 'expired');
  assert.equal(byId['429000'], 'rate_limited');
  assert.equal(res.summary.ok, 1);
  assert.equal(res.summary.expired, 1);
  assert.equal(res.summary.rate_limited, 1);
  assert.equal(store.listRecords('jobs').length, 1, 'only the ok one is stored; the others stay visible in results, not lost');
});

test('an input with no extractable LinkedIn id is reported as an error, not dropped', async () => {
  const store = createStore();
  const res = await runStandalone(manifest, execute, { urls: ['https://example.com/not-a-job'] }, { store, http: makeFakeHttp() });
  assert.equal(res.results.length, 1);
  assert.equal(res.results[0].status, 'error');
  assert.match(res.results[0].error || '', /id/i);
});

test('rejects a non-LinkedIn URL even if it carries a long digit run (no phantom fetch)', async () => {
  const store = createStore();
  const http = makeFakeHttp();
  const res = await runStandalone(manifest, execute, { urls: ['https://example.com/x?ref=12345678'] }, { store, http });
  assert.equal(res.results[0].status, 'error');
  assert.match(res.results[0].error || '', /id/i);
  assert.equal(http.calls.length, 0, 'no request was made for a non-LinkedIn URL');
});

test('dedups by externalId — re-fetching an already-stored job does not duplicate it', async () => {
  const store = createStore();
  store.putRecord('jobs', { id: 'job_old', externalId: 'linkedin-100', decision: 'approved' });
  await runStandalone(manifest, execute, { ids: ['100'] }, { store, http: makeFakeHttp() });
  const ln100 = store.listRecords('jobs').filter((j) => j.externalId === 'linkedin-100');
  assert.equal(ln100.length, 1, 'not duplicated');
  assert.equal(ln100[0].decision, 'approved', 'existing decision preserved');
});
