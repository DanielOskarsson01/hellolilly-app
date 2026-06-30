'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { applyAnswer } = require('./bullet-judge.cjs');
const { createStore } = require('../store/index.cjs');

function fixtureStore() {
  const store = createStore();
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
  const fact = store.getDatafact(res.newDatafactId);
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

test('an unknown requirementId mints nothing and stays_gap', async () => {
  const llm = { completeJSON: async () => ({ canFill: true, bulletText: 'Built a clean feature store for 12 models.', reason: 'ok' }) };
  const { store, caseId } = fixtureStore();
  const before = store.listDatafacts().length;
  const res = await applyAnswer(store, llm, { caseId, gapId: 'gap_1', answer: 'x', requirementId: 'decodedRequirement_DOES_NOT_EXIST' });
  assert.equal(res.outcome, 'stays_gap');
  assert.equal(store.listDatafacts().length, before, 'nothing minted for unknown requirement');
});
