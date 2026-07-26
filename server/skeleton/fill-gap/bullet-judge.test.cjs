'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { applyAnswer, setGapResolution } = require('./bullet-judge.cjs');
const { createStore } = require('../store/index.cjs');
const { createSqliteStore } = require('../store/sqlite.cjs');

function fixtureStore(store = createStore()) {
  const c = store.createCase({ company: 'Acme', role: 'Head of Product' });
  store.writePart(c.meta.id, 'decodedRole', { narrative: '', requirements: [{ id: 'decodedRequirement_2', requirement: 'ML platform engineering', rationale: '', weight: 0.8 }] });
  store.writePart(c.meta.id, 'fit', { capability: { requirements: [{ requirementRef: { kind: 'decodedRequirement', id: 'decodedRequirement_2' }, evidence: '', status: 'missing' }], overall: '' }, preference: { narrative: '' } });
  store.writePart(c.meta.id, 'gaps', [{ id: 'gap_1', what: 'No ML platform', why: '', bridge: { id: 'bridge_1', kind: 'honest-ramp', body: '', oneLiner: '', material: [{ source: 'cv' }] }, provenance: 'gap-analyzer' }]);
  return { store, caseId: c.meta.id };
}

test('accepted answer mints a datafact and flips the requirement to match', async () => {
  const llm = { completeJSON: async () => ({ canFill: true, bulletText: 'Built the ML feature store serving 12 models in production.', reason: 'Concrete, truthful, CV-worthy.' }) };
  const { store, caseId } = fixtureStore();
  const res = await applyAnswer(store, llm, { caseId, gapId: 'gap_1', answer: 'I built our feature store for 12 models', requirementId: 'decodedRequirement_2' });
  assert.equal(res.outcome, 'accepted');
  assert.ok(res.newDatafactId.startsWith('datafact_'));
  // RAW read: the legacy auto-mint carries no acceptance event, so under INVARIANT 1 the
  // fact is (correctly) unverified until the Wave 2 proposal-review rewire of this path.
  const fact = store.getDatafactRaw(res.newDatafactId);
  assert.ok(fact.tags.includes('addresses:decodedRequirement_2'));
  assert.equal(fact.language, 'en');
  const req = store.getCase(caseId).fit.data.capability.requirements.find((r) => r.requirementRef.id === 'decodedRequirement_2');
  assert.equal(req.status, 'match');
  assert.equal(req.evidence, 'Built the ML feature store serving 12 models in production.');
  assert.equal(req.evidenceRef.kind, 'datafact');
  assert.equal(req.evidenceRef.id, res.newDatafactId);
});

test('rejected answer leaves the gap open and mints nothing (honest-failure path)', async () => {
  const llm = { completeJSON: async () => ({ canFill: false, bulletText: null, reason: 'Cannot be made truthful from the answer.' }) };
  const { store, caseId } = fixtureStore();
  const before = store.listDatafacts().length;
  const res = await applyAnswer(store, llm, { caseId, gapId: 'gap_1', answer: 'um maybe', requirementId: 'decodedRequirement_2' });
  assert.equal(res.outcome, 'stays_gap');
  assert.equal(store.listDatafacts().length, before, 'no datafact minted');
  const req = store.getCase(caseId).fit.data.capability.requirements.find((r) => r.requirementRef.id === 'decodedRequirement_2');
  assert.equal(req.status, 'missing', 'requirement stays missing');
});

test('a judge-approved bullet with a banned phrase is rejected pre-mint (stays_gap, nothing minted)', async () => {
  const llm = { completeJSON: async () => ({ canFill: true, bulletText: 'Spearheaded the entire ML platform single-handedly.', reason: 'ok' }) };
  const { store, caseId } = fixtureStore();
  const before = store.listDatafacts().length;
  const res = await applyAnswer(store, llm, { caseId, gapId: 'gap_1', answer: 'I led the ML platform work', requirementId: 'decodedRequirement_2' });
  assert.equal(res.outcome, 'stays_gap');
  assert.match(res.reason, /spearheaded/);
  assert.equal(store.listDatafacts().length, before, 'no banned-word datafact minted');
  assert.equal(store.getCase(caseId).fit.data.capability.requirements.find((r) => r.requirementRef.id === 'decodedRequirement_2').status, 'missing');
});

test('accepted answer marks the resolved gap terminal in the persisted gaps part', async () => {
  const llm = { completeJSON: async () => ({ canFill: true, bulletText: 'Built the ML feature store serving 12 models in production.', reason: 'ok' }) };
  const { store, caseId } = fixtureStore();
  await applyAnswer(store, llm, { caseId, gapId: 'gap_1', answer: 'I built our feature store for 12 models', requirementId: 'decodedRequirement_2' });
  const gap = store.getCase(caseId).gaps.data.find((g) => g.id === 'gap_1');
  assert.equal(gap.resolution, 'accepted', 'the accepted gap is marked terminal so it stops showing as open');
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

test('an unknown gapId throws BEFORE anything durable happens (no mint, no fit flip)', async () => {
  const llm = { completeJSON: async () => ({ canFill: true, bulletText: 'Built a clean feature store for 12 models.', reason: 'ok' }) };
  const { store, caseId } = fixtureStore();
  const before = store.listDatafacts().length;
  await assert.rejects(
    () => applyAnswer(store, llm, { caseId, gapId: 'gap_NOPE', answer: 'x', requirementId: 'decodedRequirement_2' }),
    /no such gap/,
  );
  assert.equal(store.listDatafacts().length, before, 'nothing minted for an unknown gap');
  assert.equal(store.getCase(caseId).fit.data.capability.requirements[0].status, 'missing', 'fit untouched');
});

test('a failed resolution write leaves NO durable claim: fit unflipped, gap open, fact unminted', async () => {
  const llm = { completeJSON: async () => ({ canFill: true, bulletText: 'Built the ML feature store serving 12 models in production.', reason: 'ok' }) };
  const { store, caseId } = fixtureStore();
  const before = store.listDatafacts().length;
  // Same store, but the atomic fit+gaps write fails (e.g. disk error at persist time).
  const failing = { ...store, writeParts: () => { throw new Error('simulated write failure'); } };
  await assert.rejects(
    () => applyAnswer(failing, llm, { caseId, gapId: 'gap_1', answer: 'I built our feature store', requirementId: 'decodedRequirement_2' }),
    /simulated write failure/,
  );
  assert.equal(store.getCase(caseId).fit.data.capability.requirements[0].status, 'missing', 'fit does not claim match');
  assert.equal(store.getCase(caseId).gaps.data[0].resolution, undefined, 'gap stays unresolved');
  assert.equal(store.listDatafacts().length, before, 'the minted fact was compensated away — nothing for the cv-builder to mine');
});

// The stub test above proves the compensation logic; this one proves the ORDERING. The
// failure is forced at the real adapter layer — a SQLite trigger aborts the cases-row
// write itself, AFTER the inner store has already mutated — and the assertions read
// through store.getCase, the same call the API routes serve case state with. A live
// server must not keep reporting fit 'match' / resolution 'accepted' that disk refused.
test('a failed SQLite case write leaves the LIVE store honest: gap unresolved, fit unmigrated, fact unminted', async () => {
  const llm = { completeJSON: async () => ({ canFill: true, bulletText: 'Built the ML feature store serving 12 models in production.', reason: 'ok' }) };
  const dbPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'll-fillgap-')), 'store.db');
  const { store, caseId } = fixtureStore(createSqliteStore({ path: dbPath }));
  const before = store.listDatafacts().length;

  const saboteur = new DatabaseSync(dbPath);
  saboteur.exec(`CREATE TRIGGER fail_case_writes BEFORE INSERT ON cases
                 BEGIN SELECT RAISE(ABORT, 'simulated disk failure'); END;`);
  saboteur.close();

  await assert.rejects(
    () => applyAnswer(store, llm, { caseId, gapId: 'gap_1', answer: 'I built our feature store', requirementId: 'decodedRequirement_2' }),
    /simulated disk failure/,
  );
  const served = store.getCase(caseId); // the API's read path
  assert.equal(served.fit.data.capability.requirements[0].status, 'missing', 'live fit does not claim match');
  assert.equal(served.gaps.data.find((g) => g.id === 'gap_1').resolution, undefined, 'live gap stays unresolved');
  assert.equal(store.listDatafacts().length, before, 'minted fact compensated away in the live store');
  store.close();

  // A restart changes nothing — durable and served state already agreed.
  const reopened = createSqliteStore({ path: dbPath });
  assert.equal(reopened.getCase(caseId).fit.data.capability.requirements[0].status, 'missing');
  assert.equal(reopened.getCase(caseId).gaps.data[0].resolution, undefined);
  assert.equal(reopened.listDatafacts().length, before);
  reopened.close();
});

test('an unknown requirementId mints nothing and stays_gap', async () => {
  const llm = { completeJSON: async () => ({ canFill: true, bulletText: 'Built a clean feature store for 12 models.', reason: 'ok' }) };
  const { store, caseId } = fixtureStore();
  const before = store.listDatafacts().length;
  const res = await applyAnswer(store, llm, { caseId, gapId: 'gap_1', answer: 'x', requirementId: 'decodedRequirement_DOES_NOT_EXIST' });
  assert.equal(res.outcome, 'stays_gap');
  assert.equal(store.listDatafacts().length, before, 'nothing minted for unknown requirement');
});
