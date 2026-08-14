'use strict';

// 3.5 — section eligibility loosens on the recorded gate; prompt provenance never
// converts. A minted (person-approved-derived) job fact is offered for ITS JOB, id-only
// in the trusted block, text enveloped. A person-attested fact (D22) is offered plainly.

const { test } = require('node:test');
const assert = require('node:assert');
const tailor = require('./submodules/cv-tailor/execute.cjs');
const assembly = require('./skeleton/prompt-assembly/index.cjs');

const MINTED = {
  id: 'df_minted', kind: 'datafact', type: 'job_result',
  text: 'Personally closed the first 3 launch partners', tags: ['Betclic'], language: 'en',
  origin: 'accepted', provenance: 'person-approved-derived', grounding: 'span-grounded',
  acceptance: { id: 'acceptance_1', at: 't', reviewedWording: 'Personally closed the first 3 launch partners', reviewedAttribution: { type: 'job_result', jobKey: 'betclic' } },
};
const PERSON = {
  id: 'df_person', kind: 'datafact', type: 'job_result',
  text: 'Renegotiated all supplier contracts', tags: ['MrGreen'], language: 'en',
  origin: 'person-attested', grounding: 'person-attested', authorship: 'person',
  acceptance: { id: 'acceptance_2', at: 't', reviewedWording: 'Renegotiated all supplier contracts', reviewedAttribution: { type: 'job_result', jobKey: 'mrgreen' } },
};
const CURATED = { id: 'df_cur', kind: 'datafact', type: 'job_result', text: 'Grew the brand from scratch.', tags: ['MrGreen'], language: 'en', origin: 'curated' };

test('candidatePool: a minted job fact is ELIGIBLE for its job (3.5) and flagged derived; person-attested is offered plainly', () => {
  const pool = tailor.candidatePool([MINTED, PERSON, CURATED]);
  const betclic = pool.jobs.betclic.results;
  assert.deepStrictEqual(betclic.map((b) => b.id), ['df_minted'], 'job-section eligibility, not highlights-only');
  assert.strictEqual(betclic[0].derived, true);
  const mrgreen = pool.jobs.mrgreen.results;
  assert.deepStrictEqual(mrgreen.map((b) => b.id).sort(), ['df_cur', 'df_person']);
  assert.ok(!mrgreen.find((b) => b.id === 'df_person').derived, 'D22: same trust class as curated source files');
  const derived = tailor.collectDerived(pool);
  assert.deepStrictEqual(derived.map((b) => b.id), ['df_minted']);
});

test('the trusted block withholds minted text; the enveloped block carries it (provenance never converts)', async () => {
  const rec = { parts: {}, prompt: null };
  const facts = [MINTED, PERSON, CURATED];
  const byId = new Map(facts.map((f) => [f.id, f]));
  const tools = {
    store: { getCase: () => ({ meta: { sourceInput: 'an ad' }, decodedRole: { data: { requirements: [] } } }), setPartStatus: () => {}, writePart: (_i, part, data) => { rec.parts[part] = data; } },
    datalayer: { listDatafacts: () => facts, getDatafact: (id) => byId.get(id) },
    assembly,
    utils: require('./skeleton/utils.cjs'),
    ids: { ref: (kind, id) => ({ kind, id }) },
    llm: { completeJSON: async ({ prompt }) => { rec.prompt = prompt; return { summary: [], highlights: [], competencies: [], other: [], jobs: {} }; } },
  };
  // the run fails pre-write validation on this tiny pool — irrelevant; we only need the prompt
  await tailor({ caseId: 'c' }, { model: 'claude-sonnet-4-6' }, tools).catch(() => {});
  const prompt = rec.prompt;
  const fenceStart = prompt.indexOf('minted (person-approved-derived) candidate texts');
  assert.ok(fenceStart > -1, 'the enveloped minted-candidates source exists');
  const trustedPart = prompt.slice(0, prompt.indexOf('BEGIN UNTRUSTED_DATA'));
  assert.ok(!trustedPart.includes(MINTED.text), 'minted text NEVER appears in the trusted instruction block');
  assert.ok(trustedPart.includes(`${MINTED.id} :: [minted candidate`), 'the id stays selectable in place');
  assert.ok(prompt.includes(`${MINTED.id} :: ${MINTED.text}`), 'the text travels in the enveloped block');
  assert.ok(trustedPart.includes(PERSON.text), 'person-attested text is offered plainly (D22)');
});

test('finding 4: every mintable fact type reaches the tailor pool — none (competency/skill included) silently vanishes', () => {
  const CAT = { id: 'cat_ops', title: 'Operations', source: 'master' };
  let n = 0;
  const mint = (type, text, { tags = [], jobKey = null, category = null } = {}) => ({
    id: `df_${type}`, kind: 'datafact', type, text, tags, language: 'en',
    origin: 'accepted', provenance: 'person-approved-derived', grounding: 'span-grounded',
    ...(category ? { category } : {}),
    acceptance: { id: `acc_${++n}`, at: 't', reviewedWording: text, reviewedAttribution: { type, jobKey, ...(category ? { category } : {}) } },
  });
  const facts = [
    mint('job_result', 'Closed the first 3 launch partners', { tags: ['Betclic'], jobKey: 'betclic' }),
    mint('value_proposition', 'Built two businesses from zero', {}),
    mint('competency', 'Cross-functional leadership', { category: CAT }),
    mint('skill', 'SAP implementation', { category: CAT }),
    mint('other_work', 'Advisor at a fintech startup', {}),
  ];
  const pool = tailor.candidatePool(facts);
  const ids = new Set();
  for (const b of [...pool.summary, ...pool.highlights, ...pool.derivedHighlights, ...pool.other]) ids.add(b.id);
  for (const c of pool.competencyCategories) for (const b of c.items) ids.add(b.id);
  for (const j of Object.values(pool.jobs)) for (const b of [...j.summary, ...j.results]) ids.add(b.id);
  for (const f of facts) assert.ok(ids.has(f.id), `${f.type} must reach the pool (finding: no silent schema drop)`);
  const catItems = pool.competencyCategories.flatMap((c) => c.items).map((b) => b.id);
  assert.ok(catItems.includes('df_competency') && catItems.includes('df_skill'), 'competency AND skill land in Core Competencies via their category');
});

test('assembleDraft renders a selected minted id with its verbatim text and datafact ref', () => {
  const facts = [MINTED, PERSON, CURATED];
  const byId = new Map(facts.map((f) => [f.id, f]));
  const sel = { summary: [], highlights: [], competencies: [], other: [], jobs: { betclic: { intro: [], bullets: ['df_minted'] }, mrgreen: { intro: [], bullets: ['df_person', 'df_cur'] } } };
  const draft = tailor.assembleDraft(sel, byId, facts, 'en');
  const exp = draft.sections.find((s) => s.key === 'experience');
  const betclic = exp.jobs.find((j) => j.key === 'betclic');
  assert.deepStrictEqual(betclic.bullets.map((b) => b.text), [MINTED.text]);
  assert.deepStrictEqual(betclic.bullets[0].datafactRef, { kind: 'datafact', id: 'df_minted' });
});
