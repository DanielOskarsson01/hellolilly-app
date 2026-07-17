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

test('transitive taint (finding 3): once a part is untrusted-derived, a later write may not omit or downgrade provenance', () => {
  const store = createStore();
  const c = store.createCase({});
  const id = c.meta.id;
  // first write stamps the draft untrusted-derived
  store.writePart(id, 'cvDraft', { provenance: 'untrusted-derived', sections: [] });
  // a later write that DROPS provenance is rejected at the write boundary
  assert.throws(() => store.writePart(id, 'cvDraft', { sections: [] }), /taint|untrusted-derived|provenance/i, 'omitting provenance is a downgrade');
  // a later write that DOWNGRADES to trusted is rejected
  assert.throws(() => store.writePart(id, 'cvDraft', { provenance: 'trusted', sections: [] }), /taint|untrusted-derived|provenance/i, 'downgrade to trusted rejected');
  // re-writing at the SAME taint level is allowed (not a downgrade)
  assert.doesNotThrow(() => store.writePart(id, 'cvDraft', { provenance: 'untrusted-derived', sections: [{ key: 'summary' }] }));
});

test('datafacts are detached at the boundary: post-ingest mutation does not persist', () => {
  const store = createStore();
  const df = { id: 'datafact_m', kind: 'datafact', type: 'cv', text: 'Original verbatim text.', tags: ['a'], language: 'en' };
  store.ingestDatafact(df);
  df.text = 'MUTATED after ingest';
  df.tags.push('mutated');
  assert.equal(store.getDatafact('datafact_m').text, 'Original verbatim text.', 'ingest stored a copy');
  assert.deepEqual(store.getDatafact('datafact_m').tags, ['a']);
});

test('datafacts are detached at the boundary: mutating a read copy does not persist', () => {
  const store = createStore();
  store.ingestDatafact({ id: 'datafact_r', kind: 'datafact', type: 'cv', text: 'Stays exact.', tags: [], language: 'en' });
  store.getDatafact('datafact_r').text = 'MUTATED via getDatafact';
  store.listDatafacts()[0].text = 'MUTATED via listDatafacts';
  assert.equal(store.getDatafact('datafact_r').text, 'Stays exact.');
});

test('the ref-scoped gate exemption still works against the DETACHED internal fact', () => {
  // The gate exempts evidence that exactly equals a cited fact's text. Detaching must
  // not break that: the internal map's copy is the truth the exemption compares against,
  // and a caller mutating their own object cannot launder new text into the exemption.
  const store = createStore();
  const df = { id: 'datafact_g', kind: 'datafact', type: 'job_result', text: 'Led the team that spearheaded the rebuild.', tags: [], language: 'en' };
  store.ingestDatafact(df);
  df.text = 'A dynamic robust synergy.'; // caller-side mutation must NOT become exempt
  const c = store.createCase({});
  const fit = (evidence) => ({ capability: { requirements: [{ requirementRef: { kind: 'decodedRequirement', id: 'decodedRequirement_1' }, evidence, evidenceRef: { kind: 'datafact', id: 'datafact_g' }, status: 'match' }], overall: '' }, preference: { narrative: '' } });
  assert.doesNotThrow(() => store.writePart(c.meta.id, 'fit', fit('Led the team that spearheaded the rebuild.')), 'the ORIGINAL text stays exempt');
  assert.throws(() => store.writePart(c.meta.id, 'fit', fit('A dynamic robust synergy.')), /Writing-rule/, 'the mutated text is NOT exempt');
});

test('writePart: evidence that cites a fact (by ref) and equals its text is exempt', () => {
  const store = createStore();
  const text = 'Led the team that spearheaded the 2019 platform rebuild.';
  store.ingestDatafact({ id: 'datafact_e', kind: 'datafact', type: 'job_result', text, tags: [], language: 'en' });
  const c = store.createCase({});
  const fit = { capability: { requirements: [{ requirementRef: { kind: 'decodedRequirement', id: 'decodedRequirement_1' }, evidence: text, evidenceRef: { kind: 'datafact', id: 'datafact_e' }, status: 'match' }], overall: '' }, preference: { narrative: '' } };
  assert.doesNotThrow(() => store.writePart(c.meta.id, 'fit', fit));
});
