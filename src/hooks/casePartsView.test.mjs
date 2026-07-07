import test from 'node:test';
import assert from 'node:assert/strict';
import { casePartsView } from './casePartsView.js';

const CASE = {
  meta: { id: 'c1', company: 'BettingJobs', role: 'Head of Acquisition' },
  fit: { status: 'ready', data: { score: 72, capability: { overall: 'ok', requirements: [] } } },
  gaps: { status: 'pending' },
  coverLetter: { status: 'absent' },
};

test('dataOf returns the payload for ready parts, null otherwise', () => {
  const p = casePartsView(CASE);
  assert.equal(p.fit.score, 72);
  assert.equal(p.gaps, null);       // pending → no data
  assert.equal(p.coverLetter, null); // absent → no data
});

test('statusOf returns the envelope status, "absent" when missing', () => {
  const p = casePartsView(CASE);
  assert.equal(p.statusOf('fit'), 'ready');
  assert.equal(p.statusOf('gaps'), 'pending');
  assert.equal(p.statusOf('coverLetterDraft'), 'absent'); // not on this case
});

test('null caseData yields an all-absent view (no throw)', () => {
  const p = casePartsView(null);
  assert.equal(p.statusOf('fit'), 'absent');
  assert.equal(p.fit, null);
  assert.equal(p.meta, null);
});
