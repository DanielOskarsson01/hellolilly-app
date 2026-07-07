import { test } from 'node:test';
import assert from 'node:assert';
import { computeDraftCoverage } from './presendCoverage.mjs';

const decodedRole = { requirements: [
  { id: 'r1', requirement: 'Own the acquisition funnel', weight: 0.9 },
  { id: 'r2', requirement: 'LTV-based budgeting', weight: 0.8 },
  { id: 'r3', requirement: 'Web3 token scale', weight: 0.6 },
  { id: 'r4', requirement: 'Team leadership', weight: 0.5 },
]};
const fit = { capability: { requirements: [
  { requirementRef: { id: 'r1' }, status: 'match',   evidence: 'Owned funnels 17y', evidenceRef: { id: 'df_funnel' } },
  { requirementRef: { id: 'r2' }, status: 'match',   evidence: 'LTV budgeting',     evidenceRef: { id: 'df_ltv' } },   // in bank, NOT in draft
  { requirementRef: { id: 'r3' }, status: 'missing' },
  { requirementRef: { id: 'r4' }, status: 'partial', evidence: 'Led a team', evidenceRef: { id: 'df_team' } },
]}};
const cvDraft = { sections: [
  { key: 'exp', items: [ { datafactRef: { id: 'df_funnel' }, text: 'Owned full marketing funnels for 17 years.' } ] },
]}; // df_ltv is deliberately absent from the draft

test('answered requires evidenceRef in the CV draft datafact set', () => {
  const { rows } = computeDraftCoverage({ fit, cvDraft, decodedRole });
  const r1 = rows.find(r => r.reqId === 'r1');
  assert.equal(r1.status, 'answered');
  assert.equal(r1.tracedText, 'Owned full marketing funnels for 17 years.');
});

test('a match whose evidenceRef is NOT in the draft is WEAK (differs from evidence-bank verdict)', () => {
  const { rows } = computeDraftCoverage({ fit, cvDraft, decodedRole });
  const r2 = rows.find(r => r.reqId === 'r2');
  assert.equal(r2.status, 'weak', 'evidence-bank says match; the DRAFT did not use it → weak');
});

test('partial → weak, missing → missing, and counts are honest', () => {
  const { rows, counts } = computeDraftCoverage({ fit, cvDraft, decodedRole });
  assert.equal(rows.find(r => r.reqId === 'r3').status, 'missing');
  assert.equal(rows.find(r => r.reqId === 'r4').status, 'weak');
  assert.deepEqual(counts, { answered: 1, weak: 2, missing: 1, total: 4 });
});

test('missing parts do not throw', () => {
  assert.deepEqual(computeDraftCoverage({ fit: null, cvDraft: null, decodedRole: null }),
    { rows: [], counts: { answered: 0, weak: 0, missing: 0, total: 0 } });
});
