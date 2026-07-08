import { test } from 'node:test';
import assert from 'node:assert';
import { computeLetterFit } from './presendLetterFit.mjs';

const decodedRole = { requirements: [{ id:'r1', requirement:'Own the funnel', weight:0.9 }] };

test('unsupported_by_cv surfaces as honesty flags (real)', () => {
  const { honestyFlags } = computeLetterFit({ coverLetter: { unsupported_by_cv: ['Web3 scale'] }, decodedRole });
  assert.deepEqual(honestyFlags, ['Web3 scale']);
});
test('addressed is null when not derivable — never guessed', () => {
  const { rows } = computeLetterFit({ coverLetter: { paragraphs: ['Hi'], unsupported_by_cv: [] }, decodedRole });
  assert.equal(rows[0].addressed, null);
  assert.equal(rows[0].reqId, 'r1');
});
test('no coverLetter → empty flags, rows still list requirements as unknown', () => {
  const { rows, honestyFlags } = computeLetterFit({ coverLetter: null, decodedRole });
  assert.deepEqual(honestyFlags, []);
  assert.equal(rows[0].addressed, null);
});
