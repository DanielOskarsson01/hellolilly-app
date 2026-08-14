'use strict';

// Review finding 1 (fabrication path) + finding 2 (enum validation). The authorship
// discriminator was digit-only: a model-invented job title carries no digit, so grounding
// passed it and a bare accept minted the fabrication. Judge A's semantic verdict is now a
// SECOND, independent accept-time gate — a model-originated ('draft') unsupported addition,
// or an out-of-vocab origin that evades the gate, blocks the bare accept. The person edits
// (person-attested, D22) or rejects.

const { test, beforeEach } = require('node:test');
const assert = require('node:assert');
const { createStore } = require('./skeleton/store/index.cjs');
const { createDocument, storeDocument, deleteDocument } = require('./skeleton/documents/index.cjs');
const engine = require('./skeleton/suggest/engine.cjs');

beforeEach(() => engine._resetCeiling(1000));

const cleanLlm = (span, text) => ({
  completeJSON: async ({ system }) => {
    if (/claim-addition checker/.test(system)) return { claims: [] };
    if (/FIRST-PERSON EXPERIENCE CLAIM/.test(system)) return { isExperienceClaim: true, detectedClass: 'experience', reason: '' };
    return { proposals: [{ spanId: span.id, text, type: 'value_proposition', jobKey: null }] };
  },
});

test('finding 7 (lifecycle): after its source document is deleted, an open proposal cannot be accepted — the deleted text mints nothing', async () => {
  const store = createStore();
  const span = seedSpan(store, 'CAMPAIGNS\n\nRan launch campaigns');
  const llm = cleanLlm(span, 'Ran launch campaigns');
  await engine.propose({ store, llm });
  const p = engine.serveProposals({ store }).proposals[0];
  // find the document id via the proposal's span snapshot, then delete it
  deleteDocument(store, p.span.documentId);
  assert.strictEqual(store.getRecord('proposals', p.id).status, 'invalidated');
  const r = await engine.accept({ store, llm, proposalId: p.id, nonce: p.nonce, finalText: p.text, attribution: { type: 'value_proposition' } });
  assert.strictEqual(r.outcome, 'refused');
  assert.match(r.reason, /invalidated|not open/);
  assert.strictEqual(store.listDatafactsRaw().length, 0, 'the deleted document\'s text minted nothing');
});

function seedSpan(store, text) {
  const cv = createDocument({ name: 'CV', text, attestedClass: 'old_cv', ownership: 'mine' });
  storeDocument(store, cv.doc, cv.spans);
  return cv.spans[0];
}

test('finding 1: a model-invented title (no digit) cannot mint on a BARE accept; editing it makes it person-attested and mints', async () => {
  const store = createStore();
  const span = seedSpan(store, 'CAMPAIGNS\n\nRan campaigns'); // the span states no title
  const CMO = { text: 'Chief Marketing Officer', type: 'seniority', origin: 'draft' }; // model-originated addition
  const llm = {
    completeJSON: async ({ system }) => {
      if (/claim-addition checker/.test(system)) return { claims: [CMO] };
      if (/FIRST-PERSON EXPERIENCE CLAIM/.test(system)) return { isExperienceClaim: true, detectedClass: 'experience', reason: '' };
      return { proposals: [{ spanId: span.id, text: 'Ran campaigns as Chief Marketing Officer', type: 'value_proposition', jobKey: null }] };
    },
  };
  await engine.propose({ store, llm });
  const p = engine.serveProposals({ store }).proposals[0];
  assert.strictEqual(p.grounding.classification, 'span-grounded', 'the DIGIT core sees nothing wrong — the whole point of the finding');

  // BARE accept of the model's exact fabricated wording -> refused by Judge A's verdict.
  const bare = await engine.accept({ store, llm, proposalId: p.id, nonce: p.nonce, finalText: p.text, attribution: { type: 'value_proposition' } });
  assert.strictEqual(bare.outcome, 'refused', 'the invented title must not mint on a bare accept');
  assert.match(bare.reason, /Chief Marketing Officer|does not support/);
  assert.strictEqual(store.listDatafactsRaw().length, 0, 'nothing minted');

  // The person EDITS it into their own words -> person-authored, mints (D22). The nonce was
  // not burned by the refusal.
  const edited = await engine.accept({ store, llm, proposalId: p.id, nonce: p.nonce, finalText: 'Ran marketing campaigns myself', attribution: { type: 'value_proposition' } });
  assert.strictEqual(edited.outcome, 'accepted', 'edited wording is the person\'s own statement and mints');
  assert.strictEqual(store.listDatafactsRaw().length, 1);
});

test('finding 2: an out-of-vocab Judge-A origin ("model") is a schema failure and cannot mint on a bare accept', async () => {
  const store = createStore();
  const span = seedSpan(store, 'CAMPAIGNS\n\nRan campaigns');
  let judgeACalls = 0;
  const llm = {
    completeJSON: async ({ system }) => {
      if (/claim-addition checker/.test(system)) {
        judgeACalls += 1;
        // clean at propose; at accept it returns origin "model" — outside {draft, person}
        return judgeACalls === 1 ? { claims: [] } : { claims: [{ text: 'Chief Marketing Officer', type: 'seniority', origin: 'model' }] };
      }
      if (/FIRST-PERSON EXPERIENCE CLAIM/.test(system)) return { isExperienceClaim: true, detectedClass: 'experience', reason: '' };
      return { proposals: [{ spanId: span.id, text: 'Ran campaigns', type: 'value_proposition', jobKey: null }] };
    },
  };
  await engine.propose({ store, llm });
  const p = engine.serveProposals({ store }).proposals[0];
  const r = await engine.accept({ store, llm, proposalId: p.id, nonce: p.nonce, finalText: p.text, attribution: { type: 'value_proposition' } });
  assert.strictEqual(r.outcome, 'refused', 'a verdict that fails schema validation must not be treated as a clean pass');
  assert.match(r.reason, /could not be verified/);
  assert.strictEqual(store.listDatafactsRaw().length, 0, 'the out-of-vocab origin minted nothing');
});
