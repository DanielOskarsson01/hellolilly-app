'use strict';

// A0 acceptance tests (DEVELOPMENT_PLAN §2 "Done when"). Run: `npm test`.
//   1. a submodule registers, is invoked through the skeleton, reads/writes the store
//   2. one submodule requests another VIA THE SKELETON (brokered, not direct)
//   3. the broker REFUSES a loop (cycle) and STOPS a cascade (budget)
//   4. a generated paragraph that breaks a writing rule is caught before it is written
//   5. each submodule runs ALONE
//   6. the registry is fail-closed on bad manifests

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { createHost, runStandalone } = require('./host.cjs');
const { createStore } = require('./store/index.cjs');
const { createRegistry } = require('./registry.cjs');

const passthru = (capabilities) => ({ reads: [], writes: [], capabilities });

test('brokered flow: analyzer summons researcher through the skeleton, both write the case', async () => {
  const host = createHost();
  assert.deepEqual([...host.loaded].sort(), ['echo-analyzer', 'echo-researcher']);

  const c = host.store.createCase({ company: 'Acme', role: 'Head of X' });
  const { result, log } = await host.invoke('echo-analyzer', { caseId: c.meta.id });

  assert.equal(result.ok, true);
  assert.equal(result.dossiersReadyFirst, true, 'researcher ran (via broker) before analyzer read dossiers');

  const updated = host.store.getCase(c.meta.id);
  assert.equal(updated.dossiers.status, 'ready');
  assert.equal(updated.gaps.status, 'ready');

  // the researcher call was brokered — it carries the analyzer in its ancestor chain
  const researcherCall = log.find((e) => e.event === 'call' && e.target === 'echo-researcher');
  assert.ok(researcherCall, 'researcher was dispatched by the broker');
  assert.deepEqual(researcherCall.chain, ['echo-analyzer']);
});

test('broker refuses a cycle (A -> B -> A)', async () => {
  const host = createHost();
  host.registry.register({ id: 'loop-a', ...passthru(['request']) }, async (input, _o, tools) => tools.request('loop-b', input));
  host.registry.register({ id: 'loop-b', ...passthru(['request']) }, async (input, _o, tools) => tools.request('loop-a', input));

  await assert.rejects(
    () => host.invoke('loop-a', {}),
    (err) => err.name === 'BrokerRefusal' && err.detail.kind === 'cycle',
  );
});

test('broker stops a cascade when the call budget is exhausted', async () => {
  const host = createHost({ limits: { maxCalls: 5 } });
  host.registry.register({ id: 'leaf', ...passthru([]) }, async () => ({ ok: true }));
  host.registry.register({ id: 'fanout', ...passthru(['request']) }, async (_i, _o, tools) => {
    for (let i = 0; i < 20; i++) await tools.request('leaf', {});
    return { ok: true };
  });

  await assert.rejects(
    () => host.invoke('fanout', {}),
    (err) => err.name === 'BrokerRefusal' && err.detail.kind === 'budget',
  );
});

test('writing-rules gate catches a banned phrase before it is written', () => {
  const store = createStore();
  const c = store.createCase({});

  assert.throws(
    () => store.writePart(c.meta.id, 'prep', { note: 'we leveraged synergy to deliver' }),
    (err) => err.name === 'WritingRuleError' && err.violations.some((v) => v.phrase === 'leveraged'),
  );
  // nothing was persisted — the part is still absent
  assert.equal(store.getCase(c.meta.id).prep.status, 'absent');

  // a clean write succeeds
  const env = store.writePart(c.meta.id, 'prep', { note: 'a clear, honest sentence' });
  assert.equal(env.status, 'ready');
});

test('each submodule runs alone (no broker); peer requests are unavailable standalone', async () => {
  const rManifest = require('../submodules/echo-researcher/manifest.cjs');
  const rExec = require('../submodules/echo-researcher/execute.cjs');
  const aManifest = require('../submodules/echo-analyzer/manifest.cjs');
  const aExec = require('../submodules/echo-analyzer/execute.cjs');

  const store = createStore();
  const c = store.createCase({});

  await runStandalone(rManifest, rExec, { caseId: c.meta.id }, { store });
  assert.equal(store.getCase(c.meta.id).dossiers.status, 'ready', 'researcher works standalone');

  // analyzer needs a peer; standalone it has no broker, so request must throw
  await assert.rejects(
    () => runStandalone(aManifest, aExec, { caseId: c.meta.id }, { store }),
    /standalone mode/,
  );
});

test('registry is fail-closed on bad manifests', () => {
  const reg = createRegistry();
  assert.throws(() => reg.register({ id: 'bad', reads: [], writes: [], capabilities: ['bogus'] }, () => {}), /unknown capability/);
  assert.throws(() => reg.register({ id: 'bad2', writes: [], capabilities: [] }, () => {}), /reads must be an array/);
  assert.throws(() => reg.register({ reads: [], writes: [], capabilities: [] }, () => {}), /manifest.id/);
});
