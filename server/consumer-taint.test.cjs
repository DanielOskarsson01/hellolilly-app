'use strict';

// Finding 3 (taint across ALL consumers): a person-approved-derived fact is model-authored,
// so its TEXT must enter writer / cv-builder / gap-analyzer prompts ONLY through the named
// assembly module (enveloped, untrusted-derived) — never as raw trusted text. Curated /
// person-attested facts are trusted evidence and sit inline. Mirrors tailor-eligibility.

const { test } = require('node:test');
const assert = require('node:assert');
const assembly = require('./skeleton/prompt-assembly/index.cjs');
const writer = require('./submodules/writer/execute.cjs');
const cvBuilder = require('./submodules/cv-builder/execute.cjs');
const gapAnalyzer = require('./submodules/gap-analyzer/execute.cjs');

const DERIVED = {
  id: 'df_minted', kind: 'datafact', type: 'job_result', text: 'DERIVED minted line about SAP rollout',
  tags: [], language: 'en', origin: 'accepted', provenance: 'person-approved-derived',
  acceptance: { id: 'a1', reviewedWording: 'x', reviewedAttribution: { type: 'job_result' } },
};
const CURATED = { id: 'df_cur', kind: 'datafact', type: 'job_result', text: 'CURATED trusted line about casino growth', tags: [], language: 'en', origin: 'curated' };

function toolsFor(theCase, capture) {
  return {
    store: { getCase: () => theCase, setPartStatus: () => {}, writePart: () => {} },
    datalayer: { listDatafacts: () => [DERIVED, CURATED] },
    assembly,
    ids: { ref: (kind, id) => ({ kind, id }) },
    logger: null,
    llm: { completeJSON: async ({ prompt }) => { capture.prompt = prompt; return { paragraphs: [], unsupported_by_cv: [], sections: [], requirements: [], gaps: [] }; } },
  };
}

function assertEnveloped(prompt, label) {
  const cut = prompt.indexOf('BEGIN UNTRUSTED_DATA');
  assert.ok(cut > -1, `${label}: an enveloped block exists for the derived fact`);
  const trusted = prompt.slice(0, cut);
  assert.ok(!trusted.includes(DERIVED.text), `${label}: derived text is NOT in the trusted instruction block`);
  assert.ok(prompt.includes(DERIVED.text), `${label}: derived text travels inside the enveloped block`);
  assert.ok(trusted.includes(CURATED.text), `${label}: curated text is offered plainly (trusted)`);
}

test('writer envelopes derived facts, trusts curated', async () => {
  const cap = {};
  const theCase = { meta: { role: 'R', company: 'C' }, fit: { data: { capability: { overall: 'ok', requirements: [] } } }, gaps: { data: [] } };
  await writer({ caseId: 'c' }, { language: 'en', model: 'm' }, toolsFor(theCase, cap)).catch(() => {});
  assertEnveloped(cap.prompt, 'writer');
});

test('cv-builder envelopes derived facts (id-only in trusted), trusts curated', async () => {
  const cap = {};
  const theCase = { meta: {}, decodedRole: { data: { requirements: [] } }, fit: null };
  await cvBuilder({ caseId: 'c' }, { language: 'en', model: 'm' }, toolsFor(theCase, cap)).catch(() => {});
  assertEnveloped(cap.prompt, 'cv-builder');
  const trusted = cap.prompt.slice(0, cap.prompt.indexOf('BEGIN UNTRUSTED_DATA'));
  assert.ok(trusted.includes(`${DERIVED.id} :: [minted candidate`), 'cv-builder: derived id stays selectable in place');
});

test('gap-analyzer envelopes derived facts (id-only in trusted), trusts curated', async () => {
  const cap = {};
  const theCase = { meta: {}, decodedRole: { data: { narrative: '', requirements: [{ id: 'r1', requirement: 'SAP' }] } } };
  await gapAnalyzer({ caseId: 'c' }, { language: 'en', model: 'm' }, toolsFor(theCase, cap)).catch(() => {});
  assertEnveloped(cap.prompt, 'gap-analyzer');
});
