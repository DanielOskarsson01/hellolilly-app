'use strict';

// Foundation pass — store immutability + gate non-bypass (the one real structural gap).
// store.getCase() must return a DETACHED copy, and writePart must persist a detached copy,
// so the only way to change persisted state is through the store's own methods (which gate).
// Regression coverage for the researcher drill mutate-then-write leak (researcher:142).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createStore } = require('./store/index.cjs');
const { runStandalone } = require('./host.cjs');

const rManifest = require('../submodules/researcher/manifest.cjs');
const rExec = require('../submodules/researcher/execute.cjs');

test('getCase returns a detached copy — mutating it does not change persisted state', () => {
  const store = createStore();
  const c = store.createCase({});
  store.writePart(c.meta.id, 'dossiers', { company: { paragraphs: [{ id: 'p1', text: 'a clean fact' }] } });

  const fetched = store.getCase(c.meta.id);
  fetched.dossiers.data.company.paragraphs.push({ id: 'p2', text: 'we leveraged synergy' });
  fetched.meta.company = 'HACKED';

  const reread = store.getCase(c.meta.id);
  assert.equal(reread.dossiers.data.company.paragraphs.length, 1, 'fetched-object mutation must not persist');
  assert.equal(reread.meta.company, null, 'fetched meta mutation must not persist');
});

test('writePart persists a detached copy — mutating the written object afterward does not change state', () => {
  const store = createStore();
  const c = store.createCase({});
  const data = { company: { paragraphs: [{ id: 'p1', text: 'a clean fact' }] } };
  store.writePart(c.meta.id, 'dossiers', data);

  data.company.paragraphs.push({ id: 'p2', text: 'we leveraged synergy' }); // mutate caller's object after the write

  const reread = store.getCase(c.meta.id);
  assert.equal(reread.dossiers.data.company.paragraphs.length, 1, 'post-write mutation of the caller object must not persist');
});

test('a gate-violating paragraph cannot reach store via the mutate-then-write path', () => {
  const store = createStore();
  const c = store.createCase({});
  store.writePart(c.meta.id, 'dossiers', { company: { paragraphs: [{ id: 'p1', text: 'a clean fact' }] } });

  // emulate the leaky pattern: read a case, append a banned-phrase paragraph to the read object, then write
  const fetched = store.getCase(c.meta.id);
  fetched.dossiers.data.company.paragraphs.push({ id: 'p2', text: 'we leveraged synergy to deliver' });

  assert.throws(
    () => store.writePart(c.meta.id, 'dossiers', fetched.dossiers.data),
    (e) => e.name === 'WritingRuleError',
  );

  const reread = store.getCase(c.meta.id);
  assert.equal(reread.dossiers.data.company.paragraphs.length, 1, 'the banned paragraph must never reach store state');
  assert.ok(!JSON.stringify(reread).includes('leveraged'), 'no banned content leaked into the store');
});

test('researcher drill path does not leak a gate-violating paragraph into the store', async () => {
  const store = createStore();
  const c = store.createCase({ company: 'Acme' });
  store.writePart(c.meta.id, 'dossiers', {
    company: { title: 'Company', summary: 's', sources: [], paragraphs: [{ id: 'p1', text: 'a clean grounded fact' }] },
    product: null, people: null, niche: null,
  });

  const fakeSearch = { grounded: async () => ({ text: 'grounded research text', citations: [] }) };
  const fakeLlm = { completeJSON: async () => ({ text: 'we leveraged synergy to deliver' }) }; // banned phrase

  await assert.rejects(
    () => runStandalone(rManifest, rExec, { caseId: c.meta.id, drill: { dossierKey: 'company', query: 'tell me more' } }, { store, llm: fakeLlm, search: fakeSearch }),
    (e) => e.name === 'WritingRuleError',
  );

  const reread = store.getCase(c.meta.id);
  assert.equal(reread.dossiers.data.company.paragraphs.length, 1, 'the drilled banned paragraph must not leak into the store');
});
