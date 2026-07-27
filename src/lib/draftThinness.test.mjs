import { test } from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'node:module';
import { BULLETS_PER_JOB, assessDraftThinness } from './draftThinness.mjs';

const require = createRequire(import.meta.url);

test('client ceilings mirror the frozen server constant (drift guard)', () => {
  const tailor = require('../../server/submodules/cv-tailor/execute.cjs');
  assert.deepStrictEqual(BULLETS_PER_JOB, tailor.BULLETS_PER_JOB);
});

test('client thinness matches the server assessment on the same draft', () => {
  const targeting = require('../../server/skeleton/targeting/index.cjs');
  const draft = { sections: [{ key: 'experience', jobs: [
    { key: 'betclic', company: 'Betclic', bullets: [{}, {}] },
    { key: 'mrgreen', company: 'MrGreen', bullets: [{}, {}, {}, {}, {}, {}, {}, {}] },
  ] }] };
  assert.deepStrictEqual(assessDraftThinness(draft), targeting.assessDraftThinness(draft));
});
