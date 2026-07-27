'use strict';

// The Wave 2 fill-gap contract: the typed answer is RETAINED (3.1) and comes back as a
// PROPOSAL for review; minting + the fit flip happen only at engine.accept behind the
// INV5 recorded-acceptance gate. The Wave 1 honesty tests (no durable claim on a failed
// write, honest-failure path) are ported onto the new mechanism, not deleted.

const { test, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { applyAnswer, setGapResolution } = require('./bullet-judge.cjs');
const engine = require('../suggest/engine.cjs');
const { createStore } = require('../store/index.cjs');
const { createSqliteStore } = require('../store/sqlite.cjs');

beforeEach(() => engine._resetCeiling(1000));

function fixtureStore(store = createStore()) {
  const c = store.createCase({ company: 'Acme', role: 'Head of Product' });
  store.writePart(c.meta.id, 'decodedRole', { narrative: '', requirements: [{ id: 'decodedRequirement_2', requirement: 'ML platform engineering', rationale: '', weight: 0.8 }] });
  store.writePart(c.meta.id, 'fit', { capability: { requirements: [{ requirementRef: { kind: 'decodedRequirement', id: 'decodedRequirement_2' }, evidence: '', status: 'missing' }], overall: '' }, preference: { narrative: '' } });
  store.writePart(c.meta.id, 'gaps', [{ id: 'gap_1', what: 'No ML platform', why: '', bridge: { id: 'bridge_1', kind: 'honest-ramp', body: '', oneLiner: '', material: [{ source: 'cv' }] }, provenance: 'gap-analyzer' }]);
  return { store, caseId: c.meta.id };
}

// Stub model speaking the engine's three contracts (drafter, Judge B, Judge A).
function stubLlm({ drafter, judgeB } = {}) {
  return {
    completeJSON: async ({ system, prompt }) => {
      if (/claim-addition checker/.test(system)) return { claims: [] };
      if (/FIRST-PERSON EXPERIENCE CLAIM/.test(system)) return judgeB ? judgeB(prompt) : { isExperienceClaim: true, detectedClass: 'experience', reason: '' };
      return drafter ? drafter(prompt) : { proposals: [] };
    },
  };
}
const draftFromSpan = (text) => (prompt) => {
  const m = prompt.match(/(span_[a-z0-9]+) ::/);
  return { proposals: [{ spanId: m ? m[1] : 'span_none', text, type: 'job_result', jobKey: null, requirementId: 'decodedRequirement_2' }] };
};

async function answerToProposal(overrides = {}) {
  const { store, caseId } = fixtureStore(overrides.store);
  const llm = stubLlm({ drafter: draftFromSpan('Built the ML feature store serving 12 models in production'), ...overrides.stub });
  const out = await applyAnswer(store, llm, { caseId, gapId: 'gap_1', answer: 'I built our feature store for 12 models in production', requirementId: 'decodedRequirement_2' });
  return { store, caseId, llm, out };
}

test('answer -> PROPOSAL: retained as gap-answer document, nothing minted, fit untouched, case context threaded', async () => {
  const { store, caseId, out } = await answerToProposal();
  assert.equal(out.outcome, 'proposal');
  assert.equal(out.proposals.length, 1);
  assert.deepStrictEqual(out.proposals[0].caseContext, { caseId, gapId: 'gap_1', requirementId: 'decodedRequirement_2' });
  const docs = store.listRecords('documents');
  assert.equal(docs.length, 1, 'the raw answer is retained (3.1)');
  assert.equal(docs[0].attestedClass, 'gap_answer');
  assert.equal(store.listDatafactsRaw().length, 0, 'NO datafact minted before the reviewed accept (INV5)');
  assert.equal(store.getCase(caseId).fit.data.capability.requirements[0].status, 'missing', 'fit untouched');
});

test('a barred answer (not an experience claim) stays_gap with the honest reason — and is still retained', async () => {
  const { store, out } = await answerToProposal({ stub: { judgeB: () => ({ isExperienceClaim: false, detectedClass: 'negation', reason: 'operative meaning is a negation' }) } });
  assert.equal(out.outcome, 'stays_gap');
  assert.match(out.reason, /negation/);
  assert.equal(store.listRecords('documents').length, 1, 'retention is independent of the verdict');
  assert.equal(store.listDatafactsRaw().length, 0);
});

test('a drafter that finds nothing truthful stays_gap (honest-failure path)', async () => {
  const { out } = await answerToProposal({ stub: { drafter: () => ({ proposals: [] }) } });
  assert.equal(out.outcome, 'stays_gap');
  assert.match(out.reason, /no truthful bullet/);
});

test('accepting the gap proposal mints a VERIFIED fact, flips fit and marks the gap terminal', async () => {
  const { store, caseId, llm, out } = await answerToProposal();
  const served = engine.serveProposals({ store });
  const p = served.proposals.find((x) => x.id === out.proposals[0].id);
  const r = await engine.accept({ store, llm, proposalId: p.id, nonce: p.nonce, finalText: p.text, attribution: { type: 'job_result', jobKey: 'betclic', personPlaced: true } });
  assert.equal(r.outcome, 'accepted');
  assert.equal(r.fitFlipped, true);
  assert.ok(store.getDatafact(r.fact.id), 'minted fact is verified via its acceptance event');
  const req = store.getCase(caseId).fit.data.capability.requirements[0];
  assert.equal(req.status, 'match');
  assert.equal(req.evidence, p.text);
  assert.equal(req.evidenceRef.id, r.fact.id);
  assert.equal(store.getCase(caseId).gaps.data[0].resolution, 'accepted');
});

test('a failed resolution write at accept leaves NO durable claim: fit unflipped, gap open, fact unminted', async () => {
  const { store, caseId, llm, out } = await answerToProposal();
  const served = engine.serveProposals({ store });
  const p = served.proposals.find((x) => x.id === out.proposals[0].id);
  const failing = { ...store, writeParts: () => { throw new Error('simulated write failure'); } };
  await assert.rejects(
    () => engine.accept({ store: failing, llm, proposalId: p.id, nonce: p.nonce, finalText: p.text, attribution: { type: 'job_result', jobKey: 'betclic', personPlaced: true } }),
    /simulated write failure/,
  );
  assert.equal(store.getCase(caseId).fit.data.capability.requirements[0].status, 'missing', 'fit does not claim match');
  assert.equal(store.getCase(caseId).gaps.data[0].resolution, undefined, 'gap stays unresolved');
  assert.equal(store.listDatafactsRaw().length, 0, 'the minted fact was compensated away');
});

// Ordering proven at the REAL adapter layer: a SQLite trigger aborts the cases-row write
// AFTER the inner store mutated; the live store must not keep serving a match disk refused.
test('a failed SQLite case write at accept leaves the LIVE store honest, and a restart agrees', async () => {
  const dbPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'll-fillgap-')), 'store.db');
  const { store, caseId, llm, out } = await answerToProposal({ store: createSqliteStore({ path: dbPath }) });
  const served = engine.serveProposals({ store });
  const p = served.proposals.find((x) => x.id === out.proposals[0].id);

  const saboteur = new DatabaseSync(dbPath);
  saboteur.exec(`CREATE TRIGGER fail_case_writes BEFORE INSERT ON cases
                 BEGIN SELECT RAISE(ABORT, 'simulated disk failure'); END;`);
  saboteur.close();

  await assert.rejects(
    () => engine.accept({ store, llm, proposalId: p.id, nonce: p.nonce, finalText: p.text, attribution: { type: 'job_result', jobKey: 'betclic', personPlaced: true } }),
    /simulated disk failure/,
  );
  const served2 = store.getCase(caseId);
  assert.equal(served2.fit.data.capability.requirements[0].status, 'missing', 'live fit does not claim match');
  assert.equal(served2.gaps.data[0].resolution, undefined, 'live gap stays unresolved');
  assert.equal(store.listDatafactsRaw().filter((f) => f.acceptance).length, 0, 'minted fact compensated away in the live store');
  store.close();

  const reopened = createSqliteStore({ path: dbPath });
  assert.equal(reopened.getCase(caseId).fit.data.capability.requirements[0].status, 'missing');
  assert.equal(reopened.getCase(caseId).gaps.data[0].resolution, undefined);
  assert.equal(reopened.listDatafactsRaw().filter((f) => f.acceptance).length, 0);
  reopened.close();
});

test('an unknown gapId throws BEFORE anything durable happens (no retention, no proposal)', async () => {
  const { store, caseId } = fixtureStore();
  const llm = stubLlm({});
  await assert.rejects(
    () => applyAnswer(store, llm, { caseId, gapId: 'gap_NOPE', answer: 'x', requirementId: 'decodedRequirement_2' }),
    /no such gap/,
  );
  assert.equal(store.listRecords('documents').length, 0);
  assert.equal(store.listRecords('proposals').length, 0);
});

test('an unknown requirementId: the material still mints on accept, but the fit is NOT flipped and the gap stays open', async () => {
  const { store, caseId } = fixtureStore();
  const llm = stubLlm({ drafter: draftFromSpan('Built the ML feature store serving 12 models in production') });
  const out = await applyAnswer(store, llm, { caseId, gapId: 'gap_1', answer: 'I built our feature store for 12 models in production', requirementId: 'decodedRequirement_NOPE' });
  assert.equal(out.outcome, 'proposal');
  const served = engine.serveProposals({ store });
  const p = served.proposals[0];
  const r = await engine.accept({ store, llm, proposalId: p.id, nonce: p.nonce, finalText: p.text, attribution: { type: 'job_result', jobKey: 'betclic', personPlaced: true } });
  assert.equal(r.outcome, 'accepted', 'real reviewed material is still worth keeping in the drawer');
  assert.equal(r.fitFlipped, false, 'no false match claim against a requirement fit does not hold');
  assert.equal(store.getCase(caseId).gaps.data[0].resolution, undefined, 'the gap stays honestly open');
});

test('setGapResolution persists a skip that survives a re-read', () => {
  const { store, caseId } = fixtureStore();
  setGapResolution(store, caseId, 'gap_1', 'skipped');
  const gap = store.getCase(caseId).gaps.data.find((g) => g.id === 'gap_1');
  assert.equal(gap.resolution, 'skipped', '"consciously not filled" is stored like any other resolution');
});

test('setGapResolution on an unknown gap throws and persists nothing', () => {
  const { store, caseId } = fixtureStore();
  assert.throws(() => setGapResolution(store, caseId, 'gap_NOPE', 'skipped'), /no such gap/);
  assert.equal(store.getCase(caseId).gaps.data[0].resolution, undefined);
});
