'use strict';

// stage2-filter — applies the seeded stage_2 reject codes against the job BODY (text_content),
// the ~70% of filtering that needs the description. Same flag-never-hide discipline as stage-1:
// store + signal:'low' + matchedRules (tagged stage:2), never drop or hide. Patterns come FROM THE
// STORE (filterSet.stage_2[*].match) — nothing hardcoded in the submodule (operability principle).
// Merges with stage-1 flags (preserved); idempotent (re-run replaces only the stage:2 rules).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createStore } = require('./store/index.cjs');
const { runStandalone } = require('./host.cjs');

const manifest = require('../submodules/stage2-filter/manifest.cjs');
const execute = require('../submodules/stage2-filter/execute.cjs');

const DEFAULT_STAGE2 = {
  us_timezone: { reason_code: 'US_TIMEZONE', match: ['us timezone', 'pacific time', 'overlap with us hours'] },
  too_technical: { reason_code: 'TOO_TECHNICAL', match: ['sprint planning', 'lead developers', 'scrum'] },
  language_requirement: { reason_code: 'LANG_REQ', match: ['native spanish', 'fluent french'] },
  too_sales_operational: { reason_code: 'SALES_HEAVY', match: ['quota', 'close deals'] },
  salary_floor: { reason_code: 'SALARY_LOW', match: [] }, // wired, no patterns
};

function setup(stage2 = DEFAULT_STAGE2) {
  const store = createStore();
  store.putRecord('filterSet', { id: 'active', stage_2: stage2 });
  return store;
}

function seedJob(store, externalId, text, extra = {}) {
  store.putRecord('jobs', {
    id: `job_${externalId}`, externalId, source: 'csv-linkedin', title: 'Role', company: 'Co',
    location: 'EU', url: `https://x/${externalId}`, text_content: text, needs_body: false, decision: 'new', ...extra,
  });
  return `job_${externalId}`;
}

const run = (store) => runStandalone(manifest, execute, {}, { store });
const ruleNames = (j) => (j.matchedRules || []).map((r) => r.rule);

test('flags a US-timezone body on stage-2 grounds (signal low, matchedRule stage:2)', async () => {
  const store = setup();
  seedJob(store, 'a', 'Fully remote, but you must overlap with US hours and work Pacific time.');
  await run(store);
  const j = store.listRecords('jobs')[0];
  assert.equal(j.signal, 'low');
  const rule = (j.matchedRules || []).find((r) => r.rule === 'US_TIMEZONE');
  assert.ok(rule, 'US_TIMEZONE flagged');
  assert.equal(rule.stage, 2);
  assert.ok(rule.term, 'the matched pattern is recorded for transparency');
});

test('flags a technically-scoped product body (too_technical), but NOT a conceptual one (the boundary)', async () => {
  const store = setup();
  seedJob(store, 'tech', 'As CPO you will own sprint planning and lead developers across squads.');
  seedJob(store, 'concept', 'As CPO you own the customer promise, UX, features and commercial roadmap.');
  await run(store);
  const byExt = Object.fromEntries(store.listRecords('jobs').map((j) => [j.externalId, j]));
  assert.ok(ruleNames(byExt.tech).includes('TOO_TECHNICAL'), 'technical product role flagged');
  assert.ok(!ruleNames(byExt.concept).includes('TOO_TECHNICAL'), 'conceptual/commercial product role NOT flagged — title cannot tell, the body does');
  assert.equal(byExt.concept.signal, 'neutral');
});

test('flags a language-requirement and a sales-heavy body', async () => {
  const store = setup();
  seedJob(store, 'lang', 'You should be a native Spanish speaker based in Madrid.');
  seedJob(store, 'sales', 'Carry a quota and close deals with enterprise accounts.');
  await run(store);
  const byExt = Object.fromEntries(store.listRecords('jobs').map((j) => [j.externalId, j]));
  assert.ok(ruleNames(byExt.lang).includes('LANG_REQ'));
  assert.ok(ruleNames(byExt.sales).includes('SALES_HEAVY'));
});

test('a clean body is not flagged (neutral, no matchedRules)', async () => {
  const store = setup();
  seedJob(store, 'clean', 'Lead brand and growth marketing for an EU-based consumer product. Swedish a plus.');
  await run(store);
  const j = store.listRecords('jobs')[0];
  assert.equal(j.signal, 'neutral');
  assert.equal((j.matchedRules || []).length, 0);
});

test('merges with stage-1 flags — preserves them, adds stage:2', async () => {
  const store = setup();
  // a discovery-style job already carries a stage-1 location flag (no stage field)
  seedJob(store, 'm', 'Remote role requiring Pacific time overlap.', {
    matchedRules: [{ rule: 'location_out', term: 'göteborg' }], signal: 'low',
  });
  await run(store);
  const j = store.listRecords('jobs')[0];
  assert.ok(ruleNames(j).includes('location_out'), 'stage-1 rule preserved');
  assert.ok(ruleNames(j).includes('US_TIMEZONE'), 'stage-2 rule added');
  assert.equal(j.signal, 'low');
});

test('idempotent: re-running does not duplicate stage:2 rules', async () => {
  const store = setup();
  seedJob(store, 'i', 'Work US timezone hours.');
  await run(store);
  await run(store);
  const j = store.listRecords('jobs')[0];
  assert.equal((j.matchedRules || []).filter((r) => r.rule === 'US_TIMEZONE').length, 1, 'no duplicate stage:2 rule');
});

test('never drops or hides — all jobs remain; summary counts the flagged', async () => {
  const store = setup();
  seedJob(store, '1', 'Pacific time overlap required.');
  seedJob(store, '2', 'Clean EU marketing role.');
  seedJob(store, '3', 'Carry a quota.');
  const res = await run(store);
  assert.equal(store.listRecords('jobs').length, 3, 'nothing removed');
  assert.equal(res.flagged, 2);
  assert.equal(res.scanned, 3);
});

test('skips body-less jobs (needs_body / empty text_content)', async () => {
  const store = setup();
  seedJob(store, 'nobody', '', { needs_body: true });
  const res = await run(store);
  const j = store.listRecords('jobs')[0];
  assert.equal(j.signal, undefined, 'a body-less job is not stage-2 flagged');
  assert.equal(res.scanned, 0);
  assert.ok(res.skipped >= 1);
});

test('patterns are STORE-BACKED, not hardcoded: removing a code from the filterSet stops flagging it', async () => {
  const store = setup();
  seedJob(store, 'sb', 'Work Pacific time.');
  await run(store);
  assert.ok(ruleNames(store.listRecords('jobs')[0]).includes('US_TIMEZONE'), 'flagged with the seeded patterns');
  // operator edits the filter set (data): drop the us_timezone patterns
  store.putRecord('filterSet', { id: 'active', stage_2: { us_timezone: { reason_code: 'US_TIMEZONE', match: [] } } });
  await run(store);
  assert.ok(!ruleNames(store.listRecords('jobs')[0]).includes('US_TIMEZONE'), 'no longer flagged — patterns came from the store, not code');
});

test('no filter set (or no stage_2) is a clean no-op', async () => {
  const store = createStore();
  seedJob(store, 'x', 'Pacific time overlap.');
  const res = await run(store);
  assert.equal(res.ok, true);
  assert.equal(res.flagged, 0);
  assert.equal((store.listRecords('jobs')[0].matchedRules || []).length, 0, 'no flags applied without a filter set');
});

test('returns a per-code summary', async () => {
  const store = setup();
  seedJob(store, 'a', 'Pacific time overlap.');
  seedJob(store, 'b', 'native Spanish required.');
  seedJob(store, 'c', 'Work US timezone, native Spanish.');
  const res = await run(store);
  assert.equal(res.perCode.US_TIMEZONE, 2);
  assert.equal(res.perCode.LANG_REQ, 2);
});
