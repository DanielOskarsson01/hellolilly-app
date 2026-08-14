'use strict';

// INVARIANT 5 — the recorded gate (brief §8 gate 3; it LICENSES 3.5's eligibility
// loosening). Scope: newly minted and non-curated facts. For those, NO path reaches
// verified without a recorded acceptance event carrying reviewed wording AND reviewed
// attribution. Curated-origin facts are verified by origin, outside this scope.

const { test, beforeEach } = require('node:test');
const assert = require('node:assert');
const { createStore, isVerifiedFact } = require('./skeleton/store/index.cjs');
const { createDocument, storeDocument } = require('./skeleton/documents/index.cjs');
const engine = require('./skeleton/suggest/engine.cjs');

beforeEach(() => engine._resetCeiling(1000));

test('INV5: a non-curated fact is verified ONLY via a COMPLETE recorded acceptance event — faked/partial fields do not count', () => {
  assert.strictEqual(isVerifiedFact({ id: 'a', origin: 'accepted' }), false, 'an origin label alone is not an event');
  assert.strictEqual(isVerifiedFact({ id: 'b', origin: 'accepted', acceptance: {} }), false, 'an empty acceptance object is not an event');
  // an acceptance.id ALONE is NOT proof a human reviewed anything (the data-layer root fix):
  assert.strictEqual(isVerifiedFact({ id: 'c', acceptance: { id: 'acceptance_x' } }), false, 'an id without reviewed wording+attribution is not the event');
  assert.strictEqual(isVerifiedFact({ id: 'c2', acceptance: { id: 'acceptance_x', reviewedWording: 'w' } }), false, 'reviewed attribution is also required');
  assert.strictEqual(isVerifiedFact({ id: 'c3', acceptance: { id: 'acceptance_x', reviewedAttribution: { type: 'skill' } } }), false, 'reviewed wording is also required');
  assert.strictEqual(isVerifiedFact({ id: 'c4', acceptance: { id: 'acceptance_x', reviewedWording: 'w', reviewedAttribution: { type: 'skill' } } }), true, 'the COMPLETE event verifies');
  assert.strictEqual(isVerifiedFact({ id: 'd', origin: 'curated' }), true, 'curated origin is the OTHER disjunct (outside INV5 scope)');
  // curated but with attestation still PENDING (3.2 backfill against a drifted source) is NOT verified:
  assert.strictEqual(isVerifiedFact({ id: 'e', origin: 'curated', originDetail: { attestation: 'pending-daniel-reattestation' } }), false, 'curated-while-pending must not read as verified');
});

test('INV5: both mint paths attach the acceptance event with reviewed wording AND reviewed attribution', async () => {
  const store = createStore();
  const cv = createDocument({ name: 'CV', text: 'BETCLIC\n\n- Grew casino revenue 40% in one year', attestedClass: 'old_cv', ownership: 'mine' });
  storeDocument(store, cv.doc, cv.spans);
  const llm = {
    completeJSON: async ({ system }) => {
      if (/claim-addition checker/.test(system)) return { claims: [] };
      if (/FIRST-PERSON EXPERIENCE CLAIM/.test(system)) return { isExperienceClaim: true, detectedClass: 'experience', reason: '' };
      return { proposals: [{ spanId: cv.spans.find((s) => s.text.includes('40%')).id, text: 'Grew casino revenue 40% in one year at Betclic', type: 'job_result', jobKey: 'betclic' }] };
    },
  };
  await engine.propose({ store, llm });
  const p = engine.serveProposals({ store }).proposals[0];
  const a = await engine.accept({ store, llm, proposalId: p.id, nonce: p.nonce, finalText: p.text, attribution: { type: 'job_result', jobKey: 'betclic' } });
  const minted = store.getDatafact(a.fact.id);
  assert.ok(minted.acceptance.id && minted.acceptance.reviewedWording && minted.acceptance.reviewedAttribution, 'engine.accept records the full event');
  assert.strictEqual(minted.acceptance.reviewedWording, p.text);
  assert.strictEqual(minted.acceptance.reviewedAttribution.type, 'job_result');

  const m = await engine.personMint({ store, llm: null, text: 'Ran the vendor selection end to end', attribution: { type: 'skill', category: { id: 'general', title: 'General' } } });
  const pf = store.getDatafact(m.fact.id);
  assert.ok(pf.acceptance.id && pf.acceptance.reviewedWording && pf.acceptance.reviewedAttribution, 'personMint records the full event');
});

test('INV5: every refusal path mints NOTHING (nonce, attribution, defective, ceiling)', async () => {
  const store = createStore();
  const cv = createDocument({ name: 'CV', text: 'BETCLIC\n\n- Grew casino revenue 40% in one year', attestedClass: 'old_cv', ownership: 'mine' });
  storeDocument(store, cv.doc, cv.spans);
  const llm = {
    completeJSON: async ({ system }) => {
      if (/claim-addition checker/.test(system)) return { claims: [] };
      if (/FIRST-PERSON EXPERIENCE CLAIM/.test(system)) return { isExperienceClaim: true, detectedClass: 'experience', reason: '' };
      return { proposals: [{ spanId: cv.spans.find((s) => s.text.includes('40%')).id, text: 'Grew casino revenue 40% across 6 markets at Betclic', type: 'job_result', jobKey: 'betclic' }] };
    },
  };
  await engine.propose({ store, llm }); // "6 markets" invented -> defective
  const p = engine.serveProposals({ store }).proposals[0];
  const attempts = [
    () => engine.accept({ store, llm, proposalId: p.id, nonce: null, finalText: p.text, attribution: { type: 'job_result', jobKey: 'betclic' } }),
    () => engine.accept({ store, llm, proposalId: p.id, nonce: p.nonce, finalText: p.text, attribution: null }),
    () => engine.accept({ store, llm, proposalId: p.id, nonce: p.nonce, finalText: p.text, attribution: { type: 'job_result', jobKey: 'betclic' } }), // defective tokens survive
  ];
  for (const go of attempts) {
    const r = await go();
    assert.strictEqual(r.outcome, 'refused');
  }
  engine._resetCeiling(1); // one slot; the (refused) nonce attempt below consumes it
  await engine.accept({ store, llm, proposalId: p.id, nonce: null, finalText: p.text, attribution: { type: 'job_result', jobKey: 'betclic' } });
  const r = await engine.personMint({ store, llm: null, text: 'Legit line', attribution: { type: 'skill', category: { id: 'general', title: 'General' } } });
  assert.strictEqual(r.outcome, 'refused');
  assert.strictEqual(r.rateLimited, true);
  engine._resetCeiling(1000);
  assert.strictEqual(store.listDatafactsRaw().length, 0, 'no refusal path left a fact behind');
});
