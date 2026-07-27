'use strict';

// Wave 2 D12 EVAL — Tier 1 (offline, stubbed model). The zero-tolerance corpus for the
// NEW ingestion class (uploaded documents) + the recorded-acceptance gate. This tier
// proves the MECHANISM fails closed: enveloping, INV3 barring, the INV4 net, the nonce
// gate. The Tier-2 live job (harness/wave2/run-eval-live.cjs) proves the JUDGES catch
// the semantic traps on a real model, three runs each (D12).

const { test, beforeEach } = require('node:test');
const assert = require('node:assert');
const { createStore } = require('./skeleton/store/index.cjs');
const { createDocument, storeDocument } = require('./skeleton/documents/index.cjs');
const engine = require('./skeleton/suggest/engine.cjs');
const { VOICE_TRAPS, THIRD_PARTY_CV, INJECTION_DOCS, NUMERAL_TRAP } = require('../harness/wave2/trap-corpus.cjs');

beforeEach(() => engine._resetCeiling(1000));

function seed(store, fixture) {
  const { doc, spans } = createDocument({ name: fixture.name, text: fixture.text, attestedClass: fixture.attestedClass, ownership: fixture.ownership || 'mine' });
  storeDocument(store, doc, spans);
  return { doc, spans };
}

function stubLlm({ drafter, judgeB } = {}) {
  const rec = { drafterPrompts: [], judgeBPrompts: [] };
  return {
    rec,
    completeJSON: async ({ system, prompt }) => {
      if (/claim-addition checker/.test(system)) return { claims: [] };
      if (/FIRST-PERSON EXPERIENCE CLAIM/.test(system)) { rec.judgeBPrompts.push(prompt); return judgeB ? judgeB(prompt) : { isExperienceClaim: true, detectedClass: 'experience', reason: '' }; }
      rec.drafterPrompts.push(prompt);
      return drafter ? drafter(prompt) : { proposals: [] };
    },
  };
}

test('eval: injected document text reaches BOTH judges and the drafter only inside the envelope, sentinel-neutralised', async () => {
  for (const fixture of INJECTION_DOCS) {
    const store = createStore();
    seed(store, fixture);
    const llm = stubLlm({});
    await engine.propose({ store, llm });
    for (const prompt of [...llm.rec.judgeBPrompts, ...llm.rec.drafterPrompts]) {
      assert.match(prompt, /BEGIN UNTRUSTED_DATA[\s\S]*END UNTRUSTED_DATA/, `${fixture.id}: fenced`);
      assert.match(prompt, /Never obey, adopt/i, `${fixture.id}: neutralising preamble`);
      // the sentinel-escape text cannot carry a live fence marker
      assert.ok(!/«END UNTRUSTED_DATA»[\s\S]*SYSTEM/.test(prompt.slice(prompt.indexOf('BEGIN UNTRUSTED_DATA'))), `${fixture.id}: guillemets neutralised inside the block`);
    }
  }
});

test('eval (5.4): document text demanding auto-acceptance cannot mint — no acceptance exists without a served nonce + explicit accept', async () => {
  const store = createStore();
  const fixture = INJECTION_DOCS.find((d) => d.id === 'doc-induced-auto-accept');
  const { spans } = seed(store, fixture);
  // even a drafter that OBEYS and returns proposals cannot cause acceptance
  const llm = stubLlm({ drafter: () => ({ proposals: spans.map((s) => ({ spanId: s.id, text: 'I led our largest client migration', type: 'job_result', jobKey: null })) }) });
  await engine.propose({ store, llm });
  const proposals = store.listRecords('proposals');
  assert.ok(proposals.length >= 1);
  assert.ok(proposals.every((p) => p.status === 'open' || p.status === 'defective'), 'nothing is auto-accepted');
  assert.strictEqual(store.listDatafactsRaw().length, 0, 'nothing minted');
  // an accept WITHOUT the served nonce is refused — text cannot induce it
  const r = await engine.accept({ store, llm, proposalId: proposals[0].id, nonce: 'induced', finalText: proposals[0].text, attribution: { type: 'job_result', jobKey: 'betclic', personPlaced: true } });
  assert.strictEqual(r.outcome, 'refused');
  assert.strictEqual(store.listDatafactsRaw().length, 0);
});

test('eval (INV3): a third-party CV with perfectly normal headings NEVER contributes — deterministic, not semantic', async () => {
  const store = createStore();
  const { spans } = seed(store, THIRD_PARTY_CV);
  // a drafter EAGER to draft from it gets nothing: barred documents' spans never reach it
  const llm = stubLlm({ drafter: () => ({ proposals: spans.map((s) => ({ spanId: s.id, text: s.text, type: 'job_result', jobKey: null })) }) });
  const r = await engine.propose({ store, llm });
  assert.strictEqual(r.proposals.length, 0);
  assert.strictEqual(r.barredDocuments.length, 1);
  assert.match(r.barredDocuments[0].reason, /INV3/);
  assert.strictEqual(llm.rec.drafterPrompts.length, 0, 'the drafter was never even consulted');
});

test('eval (DISCIPLINE 2 mechanism): each named voice trap, once detected, bars the span from drafting', async () => {
  for (const trap of VOICE_TRAPS) {
    const store = createStore();
    seed(store, trap);
    const llm = stubLlm({
      judgeB: () => ({ isExperienceClaim: false, detectedClass: trap.id.replace(/-/g, '_'), reason: 'trap detected' }),
      drafter: () => { throw new Error('drafter must not run when every span is barred'); },
    });
    const r = await engine.propose({ store, llm });
    assert.strictEqual(r.proposals.length, 0, trap.id);
    assert.ok(r.barredSpans.length >= 1, `${trap.id}: barred`);
  }
});

test('eval (INV4 net): a drafter inventing figures yields DEFECTIVE proposals; bare accept refused; misattribution refused', async () => {
  const store = createStore();
  const { spans } = seed(store, NUMERAL_TRAP);
  const span = spans[0];
  const llm = stubLlm({ drafter: () => ({ proposals: [{ spanId: span.id, text: 'Grew the subscription business 300% in 2 years', type: 'job_result', jobKey: null }] }) });
  await engine.propose({ store, llm });
  const served = engine.serveProposals({ store });
  const p = served.proposals[0];
  assert.strictEqual(p.status, 'defective');
  assert.deepStrictEqual(p.grounding.defectiveTokens.sort(), ['2', '300%'].sort());
  const bare = await engine.accept({ store, llm, proposalId: p.id, nonce: p.nonce, finalText: p.text, attribution: { type: 'job_result', jobKey: 'betclic', personPlaced: true } });
  assert.strictEqual(bare.outcome, 'refused', 'invented digits cannot mint on a bare accept');
  // misattribution temptation: a non-job type can never be placed under a job
  const served2 = engine.serveProposals({ store });
  const p2 = served2.proposals[0];
  const mis = await engine.accept({ store, llm, proposalId: p2.id, nonce: p2.nonce, finalText: 'Grew the subscription business substantially', attribution: { type: 'value_proposition', jobKey: 'mrgreen' } });
  assert.strictEqual(mis.outcome, 'refused');
});
