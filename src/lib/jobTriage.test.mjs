import { test } from 'node:test';
import assert from 'node:assert';
import { jobFlagged, tierize, evidenceChips, REJECT_REASONS } from './jobTriage.mjs';

test('jobFlagged keys on signal==="low"', () => {
  assert.equal(jobFlagged({ signal: 'low' }), true);
  assert.equal(jobFlagged({ signal: 'neutral' }), false);
  assert.equal(jobFlagged({}), false);
});

test('tierize splits new by flag, and by decision', () => {
  const jobs = [
    { id: 'a', decision: 'new', signal: 'neutral' },
    { id: 'b', decision: 'new', signal: 'low' },
    { id: 'c', decision: 'approved', signal: 'neutral' },
    { id: 'd', decision: 'rejected', signal: 'low' },
  ];
  const t = tierize(jobs);
  assert.deepEqual(t.toReview.map((j) => j.id), ['a']);
  assert.deepEqual(t.flagged.map((j) => j.id), ['b']);
  assert.deepEqual(t.approved.map((j) => j.id), ['c']);
  assert.deepEqual(t.rejected.map((j) => j.id), ['d']);
});

test('evidenceChips never fabricates a stage-2 chip; empty matchedRules → source only', () => {
  const chips = evidenceChips({ matchedRules: [], source: 'jobtech' });
  assert.equal(chips.filter((c) => c.tone !== 'src').length, 0);
  const chips2 = evidenceChips({ matchedRules: [{ rule: 'location_out', term: 'US', stage: 1 }, { rule: 'US_TIMEZONE', term: 'est', stage: 2 }], source: 'remoteok' });
  assert.ok(chips2.some((c) => c.stage === 1));
  assert.ok(chips2.some((c) => c.stage === 2));
});

test('evidenceChips keys stage-1 off real matchedRules that carry NO stage field (reject_title/location_*)', () => {
  // Real backend stage-1 rules do not carry a `stage` — only stage-2 rules do.
  const chips = evidenceChips({ matchedRules: [{ rule: 'reject_title', term: 'junior' }, { rule: 'location_off_target', term: 'Malmö' }], source: 'jobtech' });
  assert.equal(chips.filter((c) => c.stage === 1).length, 2);
  assert.equal(chips.filter((c) => c.stage === 2).length, 0);
  assert.equal(chips.filter((c) => c.tone === 'src').length, 1);
});

test('evidenceChips maps a real stage-2 code to its label and falls back to the raw code when unmapped', () => {
  const chips = evidenceChips({ matchedRules: [{ rule: 'US_TIMEZONE', term: 'us hours', stage: 2 }, { rule: 'SOME_NEW_CODE', term: 'x', stage: 2 }], source: 'remotive' });
  assert.ok(chips.some((c) => c.stage === 2 && c.label === 'Kräver USA-tider'));
  assert.ok(chips.some((c) => c.stage === 2 && c.label === 'SOME_NEW_CODE'));
});

test('REJECT_REASONS has the 8 taxonomy codes incl. OTHER with note', () => {
  assert.equal(REJECT_REASONS.length, 8);
  assert.ok(REJECT_REASONS.find((r) => r.code === 'OTHER').note);
});
