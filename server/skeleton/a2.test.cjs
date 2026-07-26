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
        { requirementId: 'decodedRequirement_2', what: 'No hands-on ML platform engineering', why: 'Role expects deep ML infra', bridgeKind: 'honest-ramp', bridgeBody: 'Has led ML-adjacent teams; can ramp on infra.', bridgeOneLiner: 'Led ML-adjacent delivery.', material: [{ source: 'cv' }] },
        // a hallucinated requirementId must NOT become a requirementRef
        { requirementId: 'decodedRequirement_nope', what: 'A second gap', why: 'y', bridgeKind: 'reframe', bridgeBody: 'b', bridgeOneLiner: 'o', material: [{ source: 'cv' }] },
      ],
    },
  });
  const host = createHost({ llm });
  host.store.ingestDatafact({ id: 'datafact_x', kind: 'datafact', origin: 'curated', type: 'job_result', text: 'Grew revenue 3x.', tags: [], language: 'en' });
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
  // the gap -> requirement link the fill-gap loop answers against
  assert.deepEqual(updated.gaps.data[0].requirementRef, { kind: 'decodedRequirement', id: 'decodedRequirement_2' });
  assert.ok(!updated.gaps.data[1].requirementRef, 'a hallucinated requirementId does not become a ref');
});

test('gap-analyzer regenerates once when its authored prose trips the writing gate', async () => {
  let calls = 0;
  const llm = {
    completeJSON: async () => {
      calls += 1;
      // First answer uses a banned word in authored prose; the regeneration is clean.
      const overall = calls === 1 ? 'A dynamic commercial leader.' : 'A strong commercial leader.';
      return { capability: { requirements: [], overall }, preference: { narrative: '' }, gaps: [] };
    },
  };
  const host = createHost({ llm });
  const c = host.store.createCase({ company: 'Acme', role: 'PM' });
  host.store.writePart(c.meta.id, 'decodedRole', { narrative: '', requirements: [{ id: 'decodedRequirement_1', requirement: 'X', rationale: '', weight: 1 }] });

  const { result } = await host.invoke('gap-analyzer', { caseId: c.meta.id });
  assert.equal(result.ok, true);
  assert.equal(calls, 2, 'regenerated exactly once after the gate rejected "dynamic"');
  const updated = host.store.getCase(c.meta.id);
  assert.equal(updated.fit.status, 'ready');
  assert.equal(updated.fit.data.capability.overall, 'A strong commercial leader.');
});

test('cv-builder selects datafacts into a cvDraft (selects, never authors)', async () => {
  const llm = {
    completeJSON: async ({ prompt }) =>
      prompt.includes('SELECT') ? { sections: [{ key: 'experience', heading: 'Experience', datafactIds: ['datafact_x'] }] } : {},
  };
  const host = createHost({ llm });
  host.store.ingestDatafact({ id: 'datafact_x', kind: 'datafact', origin: 'curated', type: 'job_result', text: 'Grew revenue 3x.', tags: ['ComeOn'], language: 'en' });
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

test('cv-builder drops hallucinated ids and empty sections', async () => {
  const llm = {
    completeJSON: async ({ prompt }) =>
      prompt.includes('SELECT')
        ? { sections: [
            { key: 'experience', heading: 'Experience', datafactIds: ['datafact_x', 'datafact_ghost'] },
            { key: 'empty', heading: 'All Ghosts', datafactIds: ['datafact_ghost2', 'datafact_ghost3'] },
          ] }
        : {},
  };
  const host = createHost({ llm });
  host.store.ingestDatafact({ id: 'datafact_x', kind: 'datafact', origin: 'curated', type: 'job_result', text: 'Grew revenue 3x.', tags: ['ComeOn'], language: 'en' });
  const c = host.store.createCase({ company: 'Acme', role: 'Head of Product' });
  host.store.writePart(c.meta.id, 'decodedRole', { narrative: '', requirements: [{ id: 'decodedRequirement_1', requirement: 'Scale', rationale: '', weight: 1 }] });
  host.store.writePart(c.meta.id, 'fit', { capability: { requirements: [], overall: '' }, preference: { narrative: '' } });

  await host.invoke('cv-builder', { caseId: c.meta.id });
  const draft = host.store.getCase(c.meta.id).cvDraft.data;
  assert.equal(draft.sections.length, 1, 'the all-ghost section is dropped (empty-section drop)');
  assert.equal(draft.sections[0].items.length, 1, 'the hallucinated id is dropped from the experience section');
  assert.equal(draft.sections[0].items[0].datafactRef.id, 'datafact_x');
});

test('writer produces a coverLetter that passes the writing gate', async () => {
  const llm = { completeJSON: async () => ({
    paragraphs: [
      'Your search for a commercial product leader maps closely to what I have done.',
      'At a previous operator I ran the commercial org as CMO and grew revenue threefold.',
      'I have led ML-adjacent delivery and would ramp on the infra side quickly.',
      'I would welcome a conversation about the role.',
    ],
    unsupported_by_cv: ['Direct hands-on ML platform engineering'],
  }) };
  const host = createHost({ llm });
  const c = host.store.createCase({ company: 'Acme', role: 'Head of Product' });
  host.store.writePart(c.meta.id, 'fit', { capability: { requirements: [], overall: 'Strong commercial fit.' }, preference: { narrative: '' } });
  host.store.writePart(c.meta.id, 'gaps', []);

  const { result } = await host.invoke('writer', { caseId: c.meta.id });
  assert.equal(result.ok, true);
  const cl = host.store.getCase(c.meta.id).coverLetter;
  assert.equal(cl.status, 'ready');
  assert.equal(cl.data.language, 'en');
  assert.ok(cl.data.paragraphs.length >= 4);
  assert.ok(Array.isArray(cl.data.unsupported_by_cv));
});

test('writer that emits a banned phrase is rejected by the gate (safety net)', async () => {
  const llm = { completeJSON: async () => ({ paragraphs: ['I am a perfect fit and would hit the ground running.'], unsupported_by_cv: [] }) };
  const host = createHost({ llm });
  const c = host.store.createCase({ company: 'Acme', role: 'X' });
  host.store.writePart(c.meta.id, 'fit', { capability: { requirements: [], overall: '' }, preference: { narrative: '' } });
  host.store.writePart(c.meta.id, 'gaps', []);
  await assert.rejects(() => host.invoke('writer', { caseId: c.meta.id }), /Writing-rule violation|WritingRuleError/);
  assert.equal(host.store.getCase(c.meta.id).coverLetter.status, 'failed');
});
