'use strict';

// 3.5/3.6/3.7/5.4 — the suggestion engine against a STUBBED model: INV3 barring,
// Judge B span barring, drafter validation, defective marking, placement evidence,
// nonce binding, rate ceiling, attribution recording, the authorship discriminator at
// accept, the person-typed first-class path, and the gap-driven atomic fit flip.

const { test, beforeEach } = require('node:test');
const assert = require('node:assert');
const { createStore } = require('./skeleton/store/index.cjs');
const { createDocument, storeDocument } = require('./skeleton/documents/index.cjs');
const engine = require('./skeleton/suggest/engine.cjs');

beforeEach(() => engine._resetCeiling(1000));

// The stub model routes by judge/drafter system prompt; each judge is its own invocation
// (Rule 3 separation is visible right here: three distinct calls, three contracts).
function stubLlm({ drafter, judgeB, judgeA } = {}) {
  const calls = [];
  return {
    calls,
    completeJSON: async ({ system, prompt }) => {
      calls.push({ system, prompt });
      if (/claim-addition checker/.test(system)) return judgeA ? judgeA(prompt) : { claims: [] };
      if (/FIRST-PERSON EXPERIENCE CLAIM/.test(system)) {
        if (judgeB) return judgeB(prompt);
        return { isExperienceClaim: true, detectedClass: 'experience', reason: '' };
      }
      return drafter ? drafter(prompt) : { proposals: [] };
    },
  };
}

function seededStore() {
  const store = createStore();
  const cv = createDocument({
    name: 'Old CV',
    text: 'BETCLIC\n\n- Grew casino revenue 40% in one year\n- Do you have SAP experience?',
    attestedClass: 'old_cv', ownership: 'mine',
  });
  storeDocument(store, cv.doc, cv.spans);
  const ad = createDocument({ name: 'An ad', text: 'We need a marketing lead with SAP.', attestedClass: 'job_ad', ownership: 'mine' });
  storeDocument(store, ad.doc, ad.spans);
  return { store, cvSpans: cv.spans, cvDoc: cv.doc, adDoc: ad.doc };
}

test('propose: INV3 bars attested job-ad docs; Judge B bars the interviewer question; drafter output validated; defective drafts flagged', async () => {
  const { store, cvSpans } = seededStore();
  const revenueSpan = cvSpans.find((s) => s.text.includes('40%'));
  const questionSpan = cvSpans.find((s) => s.text.includes('SAP'));
  const llm = stubLlm({
    judgeB: (prompt) => prompt.includes('Do you have')
      ? { isExperienceClaim: false, detectedClass: 'interviewer_question', reason: 'a question, not a claim' }
      : { isExperienceClaim: true, detectedClass: 'experience', reason: '' },
    drafter: () => ({ proposals: [
      { spanId: revenueSpan.id, text: 'Grew casino revenue 40% in one year at Betclic', type: 'job_result', jobKey: 'betclic' },
      { spanId: revenueSpan.id, text: 'Managed 6 teams', type: 'job_result', jobKey: null }, // invented number -> defective
      { spanId: 'span_nonexistent', text: 'Sneaked in', type: 'job_result', jobKey: null }, // out of pool -> dropped
    ] }),
  });
  const r = await engine.propose({ store, llm });
  assert.strictEqual(r.barredDocuments.length, 1, 'the job-ad document is barred deterministically (INV3)');
  assert.strictEqual(r.barredDocuments[0].attestedClass, 'job_ad');
  assert.strictEqual(r.barredSpans.length, 1, 'Judge B barred the interviewer question');
  assert.strictEqual(r.barredSpans[0].spanId, questionSpan.id);
  assert.strictEqual(r.proposals.length, 2, 'out-of-pool spanId dropped');
  const clean = r.proposals.find((p) => p.text.includes('40%'));
  const bad = r.proposals.find((p) => p.text.includes('6 teams'));
  assert.strictEqual(clean.status, 'open');
  assert.strictEqual(clean.jobKey, 'betclic', 'the span names Betclic — placement evidenced');
  assert.strictEqual(clean.placementEvidence, 'span');
  assert.match(clean.placementLabel, /Betclic/);
  assert.strictEqual(bad.status, 'defective', 'unsupported model number = defective proposal (INV4/3.7)');
  assert.deepStrictEqual(bad.grounding.defectiveTokens, ['6']);
});

test('propose: a model-claimed jobKey the span does NOT evidence is stripped — placement falls to the person (3.6)', async () => {
  const { store, cvSpans } = seededStore();
  const revenueSpan = cvSpans.find((s) => s.text.includes('40%'));
  const llm = stubLlm({
    drafter: () => ({ proposals: [{ spanId: revenueSpan.id, text: 'Grew casino revenue 40% in one year', type: 'job_result', jobKey: 'mrgreen' }] }),
    judgeB: () => ({ isExperienceClaim: true, detectedClass: 'experience', reason: '' }),
  });
  const r = await engine.propose({ store, llm });
  const p = r.proposals[0];
  assert.strictEqual(p.jobKey, null, 'MrGreen is not evidenced by a Betclic-sectioned span');
  assert.strictEqual(p.placementEvidence, 'none');
});

async function proposeOne(extra = {}) {
  const { store, cvSpans } = seededStore();
  const revenueSpan = cvSpans.find((s) => s.text.includes('40%'));
  const llm = stubLlm({
    drafter: () => ({ proposals: [{ spanId: revenueSpan.id, text: extra.draftText || 'Grew casino revenue 40% in one year at Betclic', type: 'job_result', jobKey: extra.jobKey === undefined ? 'betclic' : extra.jobKey }] }),
    judgeB: () => ({ isExperienceClaim: true, detectedClass: 'experience', reason: '' }),
    judgeA: extra.judgeA,
  });
  const r = await engine.propose({ store, llm });
  const served = engine.serveProposals({ store });
  return { store, llm, proposal: served.proposals.find((p) => p.status !== 'rejected'), served };
}

test('serve mints a nonce; accept REQUIRES that nonce (5.4 — bound to a served review)', async () => {
  const { store, llm, proposal } = await proposeOne();
  assert.ok(proposal.nonce && proposal.nonce.length === 32, 'render minted a nonce');
  let out = await engine.accept({ store, llm, proposalId: proposal.id, nonce: null, finalText: proposal.text, attribution: { type: 'job_result', jobKey: 'betclic' } });
  assert.strictEqual(out.outcome, 'refused');
  out = await engine.accept({ store, llm, proposalId: proposal.id, nonce: 'wrong', finalText: proposal.text, attribution: { type: 'job_result', jobKey: 'betclic' } });
  assert.strictEqual(out.outcome, 'refused');
  out = await engine.accept({ store, llm, proposalId: proposal.id, nonce: proposal.nonce, finalText: proposal.text, attribution: { type: 'job_result', jobKey: 'betclic' }, session: { sessionId: 's1', device: 'test' } });
  assert.strictEqual(out.outcome, 'accepted');
  // single-use: the same nonce cannot accept twice
  const again = await engine.accept({ store, llm, proposalId: proposal.id, nonce: proposal.nonce, finalText: proposal.text, attribution: { type: 'job_result', jobKey: 'betclic' } });
  assert.strictEqual(again.outcome, 'refused');
});

test('acceptance records the REVIEWED attribution + wording; the fact is verified, enveloped-provenance, span-snapshotted', async () => {
  const { store, llm, proposal } = await proposeOne();
  const out = await engine.accept({ store, llm, proposalId: proposal.id, nonce: proposal.nonce, finalText: proposal.text, attribution: { type: 'job_result', jobKey: 'betclic' }, session: { sessionId: 's1', device: 'test' } });
  const fact = store.getDatafact(out.fact.id);
  assert.ok(fact, 'the minted fact is VERIFIED (visible to default reads) — INV1 via the acceptance event');
  assert.strictEqual(fact.provenance, 'person-approved-derived', '3.5: prompt provenance never converts');
  assert.strictEqual(fact.grounding, 'span-grounded');
  assert.strictEqual(fact.acceptance.reviewedWording, proposal.text);
  assert.deepStrictEqual(fact.acceptance.reviewedAttribution.jobKey, 'betclic');
  assert.match(fact.acceptance.reviewedAttribution.placementLabel, /Betclic/);
  assert.strictEqual(fact.acceptance.attested, true);
  assert.strictEqual(fact.acceptance.authenticated, false, 'D23: attested, not authenticated');
  assert.strictEqual(fact.spanSnapshot.text, proposal.span.text, 'the snapshot lives ON the fact');
  assert.ok(fact.tags.includes('Betclic'), 'attribution routes the fact to its job');
  // missing attribution refuses
  const { store: s2, llm: l2, proposal: p2 } = await proposeOne();
  const r2 = await engine.accept({ store: s2, llm: l2, proposalId: p2.id, nonce: p2.nonce, finalText: p2.text, attribution: null });
  assert.strictEqual(r2.outcome, 'refused');
  assert.match(r2.reason, /attribution/);
});

test('3.6: unevidenced placement demands the person\'s explicit choice; wrong-type placement refused', async () => {
  const { store, llm, proposal } = await proposeOne({ jobKey: null });
  assert.strictEqual(proposal.placementEvidence, 'none');
  let out = await engine.accept({ store, llm, proposalId: proposal.id, nonce: proposal.nonce, finalText: proposal.text, attribution: { type: 'job_result', jobKey: 'betclic' } });
  assert.strictEqual(out.outcome, 'refused', 'model-assigned placement is not enough where the span shows no employer');
  const served = engine.serveProposals({ store });
  const p2 = served.proposals[0];
  out = await engine.accept({ store, llm, proposalId: p2.id, nonce: p2.nonce, finalText: p2.text, attribution: { type: 'job_result', jobKey: 'betclic', personPlaced: true } });
  assert.strictEqual(out.outcome, 'accepted', 'the person\'s explicit choice is recorded as person-attested placement');
  assert.strictEqual(out.fact.acceptance.reviewedAttribution.personPlaced, true);
  // a job placement with a non-job type can never route — refused deterministically
  const { store: s3, llm: l3, proposal: p3 } = await proposeOne();
  const r3 = await engine.accept({ store: s3, llm: l3, proposalId: p3.id, nonce: p3.nonce, finalText: p3.text, attribution: { type: 'value_proposition', jobKey: 'betclic' } });
  assert.strictEqual(r3.outcome, 'refused');
});

test('3.7 discriminator at accept: person-added content mints PERSON-ATTESTED; model-originated unsupported tokens refuse even after edit', async () => {
  const { store, llm, proposal } = await proposeOne();
  const edited = `${proposal.text}, personally closing 3 launch partners`;
  const out = await engine.accept({ store, llm, proposalId: proposal.id, nonce: proposal.nonce, finalText: edited, attribution: { type: 'job_result', jobKey: 'betclic' } });
  assert.strictEqual(out.outcome, 'accepted', 'D22: what the person types mints without friction');
  assert.strictEqual(out.fact.grounding, 'person-attested', 'the record states what it is');

  // a defective draft (model invented "6") stays refused while the token survives...
  const { store: s2, llm: l2 } = await proposeOne({ draftText: 'Managed 6 teams at Betclic' });
  const served = engine.serveProposals({ store: s2 });
  const dp = served.proposals[0];
  assert.strictEqual(dp.status, 'defective');
  let r = await engine.accept({ store: s2, llm: l2, proposalId: dp.id, nonce: dp.nonce, finalText: 'Managed 6 teams at Betclic', attribution: { type: 'job_result', jobKey: 'betclic' } });
  assert.strictEqual(r.outcome, 'refused');
  assert.deepStrictEqual(r.defectiveTokens, ['6']);
  // ...and mints once the person rewrites it WITHOUT the invented token
  const served2 = engine.serveProposals({ store: s2 });
  const dp2 = served2.proposals[0];
  r = await engine.accept({ store: s2, llm: l2, proposalId: dp2.id, nonce: dp2.nonce, finalText: 'Managed several delivery teams at Betclic', attribution: { type: 'job_result', jobKey: 'betclic' } });
  assert.strictEqual(r.outcome, 'accepted');
});

test('5.4: the server-side rate ceiling refuses beyond the window limit', async () => {
  engine._resetCeiling(2);
  const { store, llm } = await proposeOne(); // propose/serve don't consume the ceiling
  const att = { type: 'skill' };
  await engine.personMint({ store, llm, text: 'Built partner network', attribution: att });
  await engine.personMint({ store, llm, text: 'Ran vendor selection', attribution: att });
  const r = await engine.personMint({ store, llm, text: 'One more', attribution: att });
  assert.strictEqual(r.outcome, 'refused');
  assert.strictEqual(r.rateLimited, true);
  engine._resetCeiling(1000);
});

test('3.7 person-typed path: mints person-attested, first-class, visible to the tailor pool, gate advisory only', async () => {
  const store = createStore();
  const out = await engine.personMint({
    store, llm: null,
    text: 'Spearheaded the 2008 Malta market entry', // contains a banned writing-rules phrase — must still mint
    attribution: { type: 'job_result', jobKey: 'mrgreen' },
    session: { sessionId: 's1', device: 'test' },
  });
  assert.strictEqual(out.outcome, 'accepted', 'no blocking, no friction (D22)');
  const fact = store.getDatafact(out.fact.id);
  assert.ok(fact, 'verified via its acceptance event');
  assert.strictEqual(fact.origin, 'person-attested');
  assert.strictEqual(fact.grounding, 'person-attested');
  assert.strictEqual(fact.authorship, 'person');
  assert.strictEqual(fact.provenance, undefined, 'D22: SAME trust class as the curated source files — no envelope');
  assert.ok(fact.acceptance.gateWarnings.length >= 1, 'the gate warns, recorded honestly — it never audits the person');
  assert.ok(fact.tags.includes('MrGreen'), 'routes to its chosen job');
});

test('gap-driven proposal: accept flips fit + gap resolution atomically and reports it', async () => {
  const store = createStore();
  const c = store.createCase({ company: 'Wrknest', role: 'Marketing Lead' });
  store.writePart(c.meta.id, 'decodedRole', { requirements: [{ id: 'req_1', requirement: 'Hands-on delivery', weight: 5 }] });
  store.writePart(c.meta.id, 'gaps', [{ id: 'gap_1', what: 'No hands-on delivery evidence', why: 'ad wants it' }]);
  store.writePart(c.meta.id, 'fit', { capability: { requirements: [{ requirementRef: { kind: 'decodedRequirement', id: 'req_1' }, status: 'missing', evidence: '' }], overall: '' }, preference: { narrative: '' } });
  // the retained gap answer document (3.1) carries the case context the engine threads through
  const gapDoc = createDocument({
    name: 'Gap answer', text: 'I personally ran the launch of our casino product in 2019.',
    attestedClass: 'gap_answer', ownership: 'mine',
    context: { caseId: c.meta.id, gapId: 'gap_1', requirementId: 'req_1', requirement: 'Hands-on delivery' },
  });
  storeDocument(store, gapDoc.doc, gapDoc.spans);
  const llm = stubLlm({
    drafter: () => ({ proposals: [{ spanId: gapDoc.spans[0].id, text: 'Personally ran the 2019 casino product launch', type: 'job_result', jobKey: null, requirementId: 'req_1' }] }),
    judgeB: () => ({ isExperienceClaim: true, detectedClass: 'experience', reason: '' }),
  });
  const r = await engine.propose({ store, llm, documentIds: [gapDoc.doc.id] });
  assert.strictEqual(r.proposals.length, 1);
  assert.deepStrictEqual(r.proposals[0].caseContext, { caseId: c.meta.id, gapId: 'gap_1', requirementId: 'req_1' });
  const served = engine.serveProposals({ store });
  const p = served.proposals[0];
  const out = await engine.accept({ store, llm, proposalId: p.id, nonce: p.nonce, finalText: p.text, attribution: { type: 'job_result', jobKey: 'betclic', personPlaced: true } });
  assert.strictEqual(out.outcome, 'accepted');
  assert.strictEqual(out.fitFlipped, true);
  const after = store.getCase(c.meta.id);
  const req = after.fit.data.capability.requirements[0];
  assert.strictEqual(req.status, 'match');
  assert.strictEqual(req.evidenceRef.id, out.fact.id);
  assert.strictEqual(after.gaps.data[0].resolution, 'accepted');
});

test('explicit spanIds re-draft: an accepted proposal on a multi-fact span does not block; open/defective still do', async () => {
  const { store, llm, proposal } = await proposeOne();
  // accept the existing proposal -> its span now holds an accepted proposal + a minted fact
  const out = await engine.accept({ store, llm, proposalId: proposal.id, nonce: proposal.nonce, finalText: proposal.text, attribution: { type: 'job_result', jobKey: 'betclic' } });
  assert.strictEqual(out.outcome, 'accepted');
  const spanId = proposal.span.spanId;
  // default propose still refuses the taken span…
  const r1 = await engine.propose({ store, llm });
  assert.ok(!r1.proposals.some((p) => p.span.spanId === spanId), 'default path: accepted blocks');
  // …but the operator's explicit spanIds path re-drafts it (the minted fact is untouched)
  const r2 = await engine.propose({ store, llm, spanIds: [spanId] });
  assert.strictEqual(r2.proposals.length, 1, 'explicit path: re-drafted');
  assert.ok(store.getDatafact(out.fact.id), 'the previously minted fact is untouched');
  // an OPEN proposal now exists on the span — even the explicit path refuses a duplicate
  const r3 = await engine.propose({ store, llm, spanIds: [spanId] });
  assert.strictEqual(r3.proposals.length, 0, 'open proposals always block');
});

test('reject closes a proposal and burns its nonce', async () => {
  const { store, proposal } = await proposeOne();
  const out = engine.reject({ store, proposalId: proposal.id, reason: 'not mine' });
  assert.strictEqual(out.outcome, 'rejected');
  const rec = store.getRecord('proposals', proposal.id);
  assert.strictEqual(rec.status, 'rejected');
  assert.strictEqual(rec.nonce, null);
});
