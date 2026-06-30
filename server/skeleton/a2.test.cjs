'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { createHost } = require('./host.cjs'); // adjust to the real host factory export

const DECODED = {
  narrative: 'They need a commercial product leader.',
  requirements: [
    { id: 'decodedRequirement_1', requirement: 'Scale a commercial org', rationale: '', weight: 0.9 },
    { id: 'decodedRequirement_2', requirement: 'Deep ML platform engineering', rationale: '', weight: 0.8 },
  ],
};

function mockLlm(jsonByMarker) {
  return {
    completeJSON: async ({ prompt }) => {
      for (const [marker, val] of Object.entries(jsonByMarker)) if (prompt.includes(marker)) return val;
      throw new Error('mockLlm: no match');
    },
  };
}

test('gap-analyzer writes honest fit + gaps citing datafacts', async () => {
  const llm = mockLlm({
    'Scale a commercial org': {
      capability: {
        requirements: [
          // cite-by-id: the model returns a datafactId, not free-text evidence
          { requirementId: 'decodedRequirement_1', datafactId: 'datafact_x', status: 'match' },
          { requirementId: 'decodedRequirement_2', datafactId: null, status: 'missing' },
          // a HALLUCINATED id with status match must be downgraded to partial (no valid cite)
          { requirementId: 'decodedRequirement_1', datafactId: 'datafact_nope', status: 'match' },
        ],
        overall: 'Strong commercial fit; ML platform depth is the gap.',
      },
      preference: { narrative: 'Clears deal-breakers; within fit constraints.' },
      gaps: [
        { what: 'No hands-on ML platform engineering', why: 'Role expects deep ML infra', bridgeKind: 'honest-ramp', bridgeBody: 'Has led ML-adjacent teams; can ramp on infra.', bridgeOneLiner: 'Led ML-adjacent delivery.', material: [{ source: 'cv' }] },
      ],
    },
  });
  const host = createHost({ llm });
  host.store.ingestDatafact({ id: 'datafact_x', kind: 'datafact', type: 'job_result', text: 'Grew revenue 3x.', tags: [], language: 'en' });
  const c = host.store.createCase({ company: 'Acme', role: 'Head of Product' });
  host.store.writePart(c.meta.id, 'decodedRole', DECODED);

  const { result } = await host.invoke('gap-analyzer', { caseId: c.meta.id });
  assert.equal(result.ok, true);

  const updated = host.store.getCase(c.meta.id);
  assert.equal(updated.fit.status, 'ready');
  assert.equal(updated.gaps.status, 'ready');
  const reqs = updated.fit.data.capability.requirements;
  const matched = reqs.find((r) => r.requirementRef.id === 'decodedRequirement_1' && r.status === 'match');
  assert.ok(matched, 'req1 has a valid match');
  assert.equal(matched.evidence, 'Grew revenue 3x.', 'evidence resolved from the cited datafact');
  assert.equal(matched.evidenceRef.id, 'datafact_x', 'evidenceRef points at the cited datafact');
  assert.equal(reqs.find((r) => r.requirementRef.id === 'decodedRequirement_2').status, 'missing');
  // the hallucinated-id "match" was downgraded to partial with no evidenceRef
  const downgraded = reqs.find((r) => r.requirementRef.id === 'decodedRequirement_1' && r.status !== 'match');
  assert.equal(downgraded.status, 'partial', 'unverifiable cite downgraded to partial');
  assert.ok(!downgraded.evidenceRef, 'no evidenceRef when the cite is invalid');
  assert.ok(updated.gaps.data[0].id.startsWith('gap_'));
  assert.ok(updated.gaps.data[0].bridge.id.startsWith('bridge_'));
  assert.ok(updated.gaps.data[0].bridge.material.length >= 1, 'bridge has material');
});

test('cv-builder selects datafacts into a cvDraft (selects, never authors)', async () => {
  const llm = {
    completeJSON: async ({ prompt }) =>
      prompt.includes('SELECT') ? { sections: [{ key: 'experience', heading: 'Experience', datafactIds: ['datafact_x'] }] } : {},
  };
  const host = createHost({ llm });
  host.store.ingestDatafact({ id: 'datafact_x', kind: 'datafact', type: 'job_result', text: 'Grew revenue 3x.', tags: ['ComeOn'], language: 'en' });
  const c = host.store.createCase({ company: 'Acme', role: 'Head of Product' });
  host.store.writePart(c.meta.id, 'decodedRole', { narrative: '', requirements: [{ id: 'decodedRequirement_1', requirement: 'Scale a commercial org', rationale: '', weight: 0.9 }] });
  host.store.writePart(c.meta.id, 'fit', { capability: { requirements: [{ requirementRef: { kind: 'decodedRequirement', id: 'decodedRequirement_1' }, evidence: 'Grew revenue 3x.', status: 'match' }], overall: '' }, preference: { narrative: '' } });

  const { result } = await host.invoke('cv-builder', { caseId: c.meta.id });
  assert.equal(result.ok, true);
  const draft = host.store.getCase(c.meta.id).cvDraft;
  assert.equal(draft.status, 'ready');
  assert.equal(draft.data.language, 'en');
  const item = draft.data.sections[0].items[0];
  assert.equal(item.text, 'Grew revenue 3x.', 'selected datafact text is verbatim');
  assert.equal(item.datafactRef.id, 'datafact_x');
});
