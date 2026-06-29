'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { createStore } = require('./index.cjs');

test('writePart: authored prose is gated even when a fact contains the banned word as substring', () => {
  const store = createStore();
  store.ingestDatafact({ id: 'datafact_d', kind: 'datafact', type: 'job_result', text: 'Market dynamics shifted every quarter.', tags: [], language: 'en' });
  const c = store.createCase({});
  // decodedRole carries NO datafact ref -> full gate; "dynamic" must still throw.
  assert.throws(() => store.writePart(c.meta.id, 'decodedRole', { narrative: 'A dynamic team.', requirements: [] }), /Writing-rule/);
});

test('writePart: evidence that cites a fact (by ref) and equals its text is exempt', () => {
  const store = createStore();
  const text = 'Led the team that spearheaded the 2019 platform rebuild.';
  store.ingestDatafact({ id: 'datafact_e', kind: 'datafact', type: 'job_result', text, tags: [], language: 'en' });
  const c = store.createCase({});
  const fit = { capability: { requirements: [{ requirementRef: { kind: 'decodedRequirement', id: 'decodedRequirement_1' }, evidence: text, evidenceRef: { kind: 'datafact', id: 'datafact_e' }, status: 'match' }], overall: '' }, preference: { narrative: '' } };
  assert.doesNotThrow(() => store.writePart(c.meta.id, 'fit', fit));
});
