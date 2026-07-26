'use strict';

// A0-hardening tests: gate non-bypassable (no skipGate), imported-facts exempt,
// manifest writes-scope + caseId binding enforced.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createStore } = require('./store/index.cjs');
const { createHost } = require('./host.cjs');

test('writePart has NO skipGate opt-out — authored prose is always gated', () => {
  const store = createStore();
  const c = store.createCase({});
  // passing the old skipGate flag does nothing now: the gate still fires
  assert.throws(
    () => store.writePart(c.meta.id, 'prep', { note: 'we leveraged synergy' }, { skipGate: true }),
    (e) => e.name === 'WritingRuleError',
  );
  assert.equal(store.getCase(c.meta.id).prep.status, 'absent');
});

test('imported facts ingest intact — a real CV with banned phrases is exempt from the gate', () => {
  const store = createStore();
  const cvText = 'Proven track record of scaling. Built for synergy. Driven by passion. Ran dynamic pricing.';
  store.ingestDatafact({ id: 'datafact_cv1', kind: 'datafact', origin: 'curated', type: 'achievement', text: cvText });
  assert.equal(store.getDatafact('datafact_cv1').text, cvText, 'CV text stored verbatim, ungated');
});

test('ingestDatafact is NOT on the submodule-facing store (no back-door for prose)', async () => {
  const host = createHost({ llm: null, search: null });
  host.registry.register(
    { id: 'sneaky', reads: [], writes: ['dossiers'], capabilities: ['store'] },
    async (_i, _o, tools) => ({ hasIngest: typeof tools.store.ingestDatafact === 'function' }),
  );
  const c = host.store.createCase({});
  const { result } = await host.invoke('sneaky', { caseId: c.meta.id });
  assert.equal(result.hasIngest, false);
});

test('out-of-scope PART write is rejected', async () => {
  const host = createHost({ llm: null, search: null });
  host.registry.register(
    { id: 'rogue', reads: [], writes: ['dossiers'], capabilities: ['store'] },
    async (input, _o, tools) => tools.store.writePart(input.caseId, 'gaps', { x: 1 }),
  );
  const c = host.store.createCase({});
  await assert.rejects(() => host.invoke('rogue', { caseId: c.meta.id }), /\[scope\] rogue may not write part 'gaps'/);
});

test('out-of-scope CASE write (a different case) is rejected', async () => {
  const host = createHost({ llm: null, search: null });
  host.registry.register(
    { id: 'rogue2', reads: [], writes: ['dossiers'], capabilities: ['store'] },
    async (_i, _o, tools) => tools.store.writePart('case_someone_else', 'dossiers', { company: { paragraphs: [] } }),
  );
  const c = host.store.createCase({});
  await assert.rejects(() => host.invoke('rogue2', { caseId: c.meta.id }), /\[scope\] rogue2 may only write its invoked case/);
});
