'use strict';

// 3.2 — the provenance backfill's classification core (pure; the runner adds Route B
// backup + byte-identity checks around it).

const { test } = require('node:test');
const assert = require('node:assert');
const { classifyFacts, stampFact, COINHERO_SOURCE, stripOrigin } = require('./backfill-provenance.cjs');

const F = (id, type, text, extra = {}) => ({ id, kind: 'datafact', type, text, tags: [], language: 'en', ...extra });

const LIVE = [
  F('df_1', 'professional_summary', 'Twenty years building products.'),
  F('df_2', 'job_result', 'Grew revenue 3x.'),
  F('df_3', 'job_result', 'Launched a casino brand.', { source: COINHERO_SOURCE }),
  F('df_4', 'fill-gap', 'Configured SAP for a retail client.'),
  F('df_5', 'job_result', 'A fact the mapper never produced.'),
];
// the mapper replay reproduces df_1 and df_2 exactly, plus one entry live does not hold
const REPLAY = [
  F('r_1', 'professional_summary', 'Twenty years building products.'),
  F('r_2', 'job_result', 'Grew revenue 3x.'),
  F('r_3', 'skill', 'A drifted-cv_data line never seeded.'),
];

test('classifyFacts: coinhero source, mapper-replay, fill-gap segregation, unclassified quarantine', () => {
  const { classes, replayNotInLive } = classifyFacts(LIVE, REPLAY);
  assert.strictEqual(classes.get('df_1'), 'curated-mapper-replay');
  assert.strictEqual(classes.get('df_2'), 'curated-mapper-replay');
  assert.strictEqual(classes.get('df_3'), 'curated-coinhero');
  assert.strictEqual(classes.get('df_4'), 'legacy-model-authored');
  assert.strictEqual(classes.get('df_5'), 'unclassified');
  // the other direction is measured, not assumed
  assert.strictEqual(replayNotInLive.length, 1);
  assert.strictEqual(replayNotInLive[0].id, 'r_3');
});

test('classifyFacts: replay match is on type+text, never substring', () => {
  const live = [F('a', 'job_result', 'Grew revenue')]; // substring of a replay text
  const { classes } = classifyFacts(live, [F('r', 'job_result', 'Grew revenue 3x.')]);
  assert.strictEqual(classes.get('a'), 'unclassified');
  // same text under a different type does not match either
  const { classes: c2 } = classifyFacts([F('b', 'skill', 'Grew revenue 3x.')], [F('r', 'job_result', 'Grew revenue 3x.')]);
  assert.strictEqual(c2.get('b'), 'unclassified');
});

test('stampFact: only origin/originDetail are added; every prior field is byte-identical', () => {
  for (const [fact, cls] of [[LIVE[0], 'curated-mapper-replay'], [LIVE[2], 'curated-coinhero'], [LIVE[3], 'legacy-model-authored'], [LIVE[4], 'unclassified']]) {
    const stamped = stampFact(fact, cls, { cvDataSha256: 'sha', classifiedAt: 't' });
    assert.strictEqual(stamped.id, fact.id, 'id-stable');
    assert.strictEqual(JSON.stringify(stripOrigin(stamped)), JSON.stringify(stripOrigin(fact)), 'untouched fields byte-identical');
    assert.ok(stamped.origin, 'origin stamped');
  }
  // mapper-replay curated origin carries the pending re-attestation flag (MEDIUM 1)
  const s = stampFact(LIVE[0], 'curated-mapper-replay', { cvDataSha256: 'sha', classifiedAt: 't' });
  assert.strictEqual(s.origin, 'curated');
  assert.strictEqual(s.originDetail.attestation, 'pending-daniel-reattestation');
  // the legacy class is never curated (3.3: recreation, not promotion)
  const l = stampFact(LIVE[3], 'legacy-model-authored', { cvDataSha256: 'sha', classifiedAt: 't' });
  assert.notStrictEqual(l.origin, 'curated');
});
