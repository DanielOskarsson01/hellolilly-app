'use strict';
const test = require('node:test');
const assert = require('node:assert');
const tailor = require('./submodules/cv-tailor/execute.cjs');
const { SYNTHETIC_FACTS, SYNTHETIC_GOOD_SELECTION } = require('../harness/phase0/synthetic-pool.cjs');

const byId = new Map(SYNTHETIC_FACTS.map((f) => [f.id, f]));

// BLOCKER (review #2): the server emits experience as jobs[].role/intro/bullets, but the client
// leaf enumeration (src/lib/cvDraftItems.mjs) must MIRROR the server's sectionItems() — otherwise
// the CV screen drops all five Professional Experience jobs and the coverage/keyword logic loses
// every experience leaf. This asserts client-visible leaves == server-produced leaves: the review's
// 33-vs-23 gap must close to parity.
test('client cvDraftItems sees every server-produced experience leaf (client == server parity)', async () => {
  const draft = tailor.assembleDraft(SYNTHETIC_GOOD_SELECTION, byId, SYNTHETIC_FACTS, 'en');

  const serverLeafIds = draft.sections
    .flatMap((s) => tailor.sectionItems(s))
    .map((i) => i.datafactRef.id);

  const { cvDraftItems } = await import('../src/lib/cvDraftItems.mjs');
  const clientLeafIds = cvDraftItems(draft).map((i) => i.datafactRef.id);

  assert.deepStrictEqual(clientLeafIds, serverLeafIds, 'client leaves must equal server leaves (id + order)');

  // and specifically: every one of the five experience jobs' intro+bullets is client-visible
  const expIds = draft.sections
    .find((s) => s.key === 'experience')
    .jobs.flatMap((j) => [...j.intro, ...j.bullets])
    .map((i) => i.datafactRef.id);
  assert.strictEqual(expIds.length, 10, 'synthetic draft has 10 experience leaves (5 jobs x intro+bullet)');
  for (const id of expIds) assert.ok(clientLeafIds.includes(id), `experience leaf ${id} must be client-visible`);
});
