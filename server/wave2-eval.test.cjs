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
const { VOICE_TRAPS, THIRD_PARTY_CV, INJECTION_DOCS, NUMERAL_TRAP, COHERENCE_TRAP, JUDGE_A_ADDITIONS, MISATTRIBUTION_TRIALS } = require('../harness/wave2/trap-corpus.cjs');

beforeEach(() => engine._resetCeiling(1000));

function seed(store, fixture) {
  const { doc, spans } = createDocument({ name: fixture.name, text: fixture.text, attestedClass: fixture.attestedClass, ownership: fixture.ownership || 'mine' });
  storeDocument(store, doc, spans);
  return { doc, spans };
}

function stubLlm({ drafter, judgeB } = {}) {
  const rec = { drafterPrompts: [], drafterSystems: [], judgeBPrompts: [] };
  return {
    rec,
    completeJSON: async ({ system, prompt }) => {
      if (/claim-addition checker/.test(system)) return { claims: [] };
      if (/FIRST-PERSON EXPERIENCE CLAIM/.test(system)) { rec.judgeBPrompts.push(prompt); return judgeB ? judgeB(prompt) : { isExperienceClaim: true, detectedClass: 'experience', reason: '' }; }
      rec.drafterPrompts.push(prompt);
      rec.drafterSystems.push(system);
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
      judgeB: () => ({ isExperienceClaim: false, detectedClass: trap.detectedClass, reason: 'trap detected' }),
      drafter: () => { throw new Error('drafter must not run when every span is barred'); },
    });
    const r = await engine.propose({ store, llm });
    assert.strictEqual(r.proposals.length, 0, trap.id);
    assert.ok(r.barredSpans.length >= 1, `${trap.id}: barred`);
  }
});

test('eval (drafter quality, 2026-08-04): the coherence rule + house voice ride in the drafter prompt; curated voice examples are injected', async () => {
  const store = createStore();
  seed(store, COHERENCE_TRAP);
  // a curated job_result in the pool -> becomes a voice example in the task block
  store.ingestDatafact({ id: 'df_voice1', kind: 'datafact', origin: 'curated', type: 'job_result', text: 'Built brand from ground up including brand strategy and CI', tags: [], language: 'en' });
  const llm = stubLlm({});
  await engine.propose({ store, llm });
  assert.strictEqual(llm.rec.drafterPrompts.length, 1);
  const prompt = llm.rec.drafterPrompts[0];
  const system = llm.rec.drafterSystems[0];
  // the coherence rule and the render-context voice are standing system instructions
  assert.match(system, /never combine disagreeing figures/i, 'coherence rule present');
  assert.match(system, /NEVER prefix the bullet with the employer name/i, 'render context present');
  assert.match(system, /strong past-tense verb/i, 'house voice present');
  // curated voice examples are mirrored from the pool into the trusted task block
  const trusted = prompt.slice(0, prompt.indexOf('BEGIN UNTRUSTED_DATA'));
  assert.ok(trusted.includes('VOICE EXAMPLES'), 'voice examples block present');
  assert.ok(trusted.includes('Built brand from ground up'), 'curated bullet mirrored as register reference');
  // and the (synthetic) coherence span with its disagreeing figures is what travels enveloped
  assert.ok(COHERENCE_TRAP.disagreeingRuns.every((r) => prompt.includes(r)), 'the disagreeing-figures span is the drafted material');
});

test('eval (findings 1+2): each Judge-A worded-addition class blocks a BARE accept and mints nothing (the digit core alone would miss it)', async () => {
  for (const a of JUDGE_A_ADDITIONS) {
    const store = createStore();
    const doc = createDocument({ name: 'src', text: `NOTES\n\n${a.spanText}`, attestedClass: 'old_cv', ownership: 'mine' });
    storeDocument(store, doc.doc, doc.spans);
    const span = doc.spans[0];
    const llm = stubLlm({
      judgeB: () => ({ isExperienceClaim: true, detectedClass: 'experience', reason: '' }),
      drafter: () => ({ proposals: [{ spanId: span.id, text: a.draftText, type: 'value_proposition', jobKey: null }] }),
    });
    // Judge A returns the worded addition as model-originated ('draft'), of the contracted type
    const judgeALlm = { completeJSON: async ({ system, prompt }) => {
      if (/claim-addition checker/.test(system)) return { claims: [{ text: a.additionText || 'added claim', type: a.additionType, origin: 'draft' }] };
      return llm.completeJSON({ system, prompt });
    } };
    await engine.propose({ store, llm: judgeALlm });
    const p = engine.serveProposals({ store }).proposals[0];
    assert.strictEqual(p.grounding.classification, 'span-grounded', `${a.id}: no digit -> the DIGIT core sees nothing`);
    const r = await engine.accept({ store, llm: judgeALlm, proposalId: p.id, nonce: p.nonce, finalText: p.text, attribution: { type: 'value_proposition' } });
    assert.strictEqual(r.outcome, 'refused', `${a.id}: bare accept of the model's worded addition must be refused`);
    assert.strictEqual(store.listDatafactsRaw().length, 0, `${a.id}: nothing minted`);
  }
});

test('eval (finding 4b): misattribution trials — reviewed placement == recorded placement (tags cannot smuggle a job)', async () => {
  for (const t of MISATTRIBUTION_TRIALS) {
    const store = createStore();
    const doc = createDocument({ name: 'src', text: 'BETCLIC\n\n- Grew casino revenue', attestedClass: 'old_cv', ownership: 'mine' });
    storeDocument(store, doc.doc, doc.spans);
    const span = doc.spans.find((s) => s.text.includes('Grew'));
    const llm = stubLlm({
      judgeB: () => ({ isExperienceClaim: true, detectedClass: 'experience', reason: '' }),
      drafter: () => ({ proposals: [{ spanId: span.id, text: 'Grew casino revenue', type: 'job_result', jobKey: 'betclic' }] }),
    });
    await engine.propose({ store, llm });
    const p = engine.serveProposals({ store }).proposals[0];
    const r = await engine.accept({ store, llm, proposalId: p.id, nonce: p.nonce, finalText: p.text, attribution: t.attribution });
    if (t.expectRefused) {
      assert.strictEqual(r.outcome, 'refused', `${t.id}: ${t.note}`);
    } else {
      assert.strictEqual(r.outcome, 'accepted', `${t.id}: ${t.note}`);
      const rec = r.fact.acceptance.reviewedAttribution;
      assert.deepStrictEqual(rec.tags, [], `${t.id}: no smuggled routing tag is recorded`);
      assert.strictEqual(rec.placementLabel, 'Professional Experience (job not yet chosen)', `${t.id}: recorded label matches jobKey=null`);
    }
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
