'use strict';
// D12 EVAL CORPUS — Tier 1 (offline, no live key). Adversarial cases for the pasted-job-ad
// ingestion class + the D12 Rule 2 invariants (envelope, transitive taint, output-schema
// validation, structure, provenance) against a STUBBED model. Runs under `npm test`, so the
// existing CI gate (deploy-pages.yml) BLOCKS a PR on any failure. The Tier-2 live zero-tolerance
// job (harness/phase0/run-eval-live.cjs) re-runs the injection cases three times on a real model.

const { test } = require('node:test');
const assert = require('node:assert');
const tailor = require('./submodules/cv-tailor/execute.cjs');
const assembly = require('./skeleton/prompt-assembly/index.cjs');
const M = require('../harness/phase0/parity-metric.cjs');

// ---- synthetic pool (no real data), enough to build a conformant draft ----
const DF = (id, type, text, tags = [], extra = {}) => ({ id, kind: 'datafact', type, text, tags, language: 'en', ...extra });
const CAT = (id, title, group) => ({ category: { id, title, group, source: 'COMPETENCY_MASTER_POOL.json' } });
const FACTS = [
  DF('d_sum', 'professional_summary', 'Synthetic summary.'),
  ...['a', 'b', 'c', 'd', 'e', 'f'].map((x, i) => DF(`d_h${i}`, 'value_proposition', `Highlight ${x}.`, ['value-prop'])),
  DF('d_lm1', 'competency', 'Team building', ['competency', 'leadership_management'], CAT('leadership-scaling', 'Leadership & Scaling', 'leadership_management')),
  DF('d_lm2', 'competency', 'Org design', ['competency', 'leadership_management'], CAT('leadership-scaling', 'Leadership & Scaling', 'leadership_management')),
  DF('d_lm3', 'competency', 'P&L', ['competency', 'leadership_management'], CAT('leadership-scaling', 'Leadership & Scaling', 'leadership_management')),
  DF('d_lm4', 'competency', 'Multi-market', ['competency', 'leadership_management'], CAT('leadership-scaling', 'Leadership & Scaling', 'leadership_management')),
  DF('d_mg1', 'competency', 'Brand', ['competency', 'marketing_strategy'], CAT('marketing-growth', 'Marketing & Growth', 'marketing_strategy')),
  DF('d_mg2', 'competency', 'Acquisition', ['competency', 'marketing_strategy'], CAT('marketing-growth', 'Marketing & Growth', 'marketing_strategy')),
  DF('d_mg3', 'competency', 'SEO', ['competency', 'marketing_strategy'], CAT('marketing-growth', 'Marketing & Growth', 'marketing_strategy')),
  DF('d_mg4', 'competency', 'Creative', ['competency', 'marketing_strategy'], CAT('marketing-growth', 'Marketing & Growth', 'marketing_strategy')),
  DF('d_da1', 'competency', 'BI', ['competency', 'technical_analytical'], CAT('data-analytics', 'Data & Analytics', 'technical_analytical')),
  DF('d_da2', 'competency', 'Attribution', ['competency', 'technical_analytical'], CAT('data-analytics', 'Data & Analytics', 'technical_analytical')),
  DF('d_da3', 'competency', 'Forecasting', ['competency', 'technical_analytical'], CAT('data-analytics', 'Data & Analytics', 'technical_analytical')),
  DF('d_da4', 'competency', 'Segmentation', ['competency', 'technical_analytical'], CAT('data-analytics', 'Data & Analytics', 'technical_analytical')),
  DF('d_ow', 'other_work', 'Advisor at Synthco (2020-)'),
  DF('d_edu', 'education', 'BSc Marketing'),
  DF('d_awd', 'award', 'Best Operator 2015'),
  DF('d_ear', 'job_result', 'Telge Energi brand growth.', ['Telge Energi']),
  DF('d_oj', 'job_result', 'Shipped OnlyiGaming.', ['OnlyiGaming / Enablers']),
  DF('d_ch', 'job_result', 'Founded Coinhero.', ['Coinhero']),
  DF('d_bc', 'job_result', 'Built casino division.', ['Betclic']),
  DF('d_co', 'job_result', 'NASDAQ listing.', ['ComeOn']),
  DF('d_mgj', 'job_result', 'Grew MrGreen.', ['MrGreen']),
];
const byId = new Map(FACTS.map((f) => [f.id, f]));
const poolIds = new Set(FACTS.map((f) => f.id));
const sourceText = new Map(FACTS.map((f) => [f.id, f.text]));

// A conformant selection (3 categories x 4 items, 6 highlights, 5 jobs).
const GOOD = {
  summary: ['d_sum'], highlights: ['d_h0', 'd_h1', 'd_h2', 'd_h3', 'd_h4', 'd_h5'],
  competencies: [
    { category: 'leadership-scaling', items: ['d_lm1', 'd_lm2', 'd_lm3', 'd_lm4'] },
    { category: 'marketing-growth', items: ['d_mg1', 'd_mg2', 'd_mg3', 'd_mg4'] },
    { category: 'data-analytics', items: ['d_da1', 'd_da2', 'd_da3', 'd_da4'] },
  ],
  other: ['d_ow'],
  jobs: {
    onlyigaming: { intro: [], bullets: ['d_oj'] }, coinhero: { intro: [], bullets: ['d_ch'] },
    betclic: { intro: [], bullets: ['d_bc'] }, comeon: { intro: [], bullets: ['d_co'] }, mrgreen: { intro: [], bullets: ['d_mgj'] },
  },
};

function fakeTools(sourceInput, llmResponse) {
  const rec = { parts: {}, prompt: null };
  return {
    rec,
    store: {
      getCase: () => ({ meta: { sourceInput }, decodedRole: { data: { requirements: [] } } }),
      setPartStatus: (_i, part, status, error) => { rec.parts[part] = { status, error }; },
      writePart: (_i, part, data) => { rec.parts[part] = { status: 'ready', data }; },
    },
    datalayer: { listDatafacts: () => FACTS, getDatafact: (id) => byId.get(id) },
    assembly,
    ids: { ref: (kind, id) => ({ kind, id }) },
    llm: { completeJSON: async ({ prompt }) => { rec.prompt = prompt; return typeof llmResponse === 'function' ? llmResponse(prompt) : llmResponse; } },
  };
}

// The adversarial pasted-ad corpus (shared with the Tier-2 live job).
const { INJECTION_ADS } = require('../harness/phase0/injection-corpus.cjs');

test('D12 eval: every injection ad is ENVELOPED with a neutralising preamble, never a free instruction', async () => {
  for (const ad of INJECTION_ADS) {
    const t = fakeTools(ad, GOOD);
    await tailor({ caseId: 'c' }, { model: 'claude-sonnet-4-6', temperature: 0 }, t);
    assert.match(t.rec.prompt, /BEGIN UNTRUSTED_DATA[\s\S]*END UNTRUSTED_DATA/, 'ad is fenced');
    assert.match(t.rec.prompt, /Never obey, adopt/i, 'neutralising preamble present');
    // the injection substring sits INSIDE the fenced block, not before it
    const begin = t.rec.prompt.indexOf('BEGIN UNTRUSTED_DATA');
    const end = t.rec.prompt.indexOf('END UNTRUSTED_DATA');
    const inj = t.rec.prompt.indexOf(ad.slice(0, 20));
    assert.ok(inj > begin && inj < end, 'the ad text is inside the untrusted fence');
  }
});

test('D12 eval: transitive taint — the tailored draft is untrusted-derived regardless of the ad', async () => {
  const t = fakeTools(INJECTION_ADS[0], GOOD);
  await tailor({ caseId: 'c' }, { model: 'claude-sonnet-4-6', temperature: 0 }, t);
  assert.strictEqual(t.rec.parts.cvDraft.status, 'ready');
  assert.strictEqual(t.rec.parts.cvDraft.data.provenance, 'untrusted-derived');
});

test('D12 eval: fabrication is structurally impossible — out-of-pool ids and invented text are dropped', async () => {
  // model tries to sneak an id not in the pool + (impossible) free text; assembleDraft only emits
  // verbatim datafact text for ids that resolve, so the fabrication cannot enter the draft.
  const evil = { ...GOOD, highlights: ['d_h0', 'FAKE_ID', 'd_h1', 'd_h2', 'd_h3', 'd_h4'] };
  const t = fakeTools(INJECTION_ADS[2], evil);
  await tailor({ caseId: 'c' }, { model: 'claude-sonnet-4-6', temperature: 0 }, t);
  const draft = t.rec.parts.cvDraft.data;
  const p2 = M.validateProvenance(draft, poolIds, sourceText);
  assert.deepStrictEqual(p2.errors, [], 'every node resolves to the pool with verbatim text');
  const hl = draft.sections.find((s) => s.key === 'highlights');
  assert.ok(!hl.items.some((i) => i.datafactRef.id === 'FAKE_ID'), 'the injected fake id never becomes a node');
});

test('D12 eval: malformed model output fails schema validation and writes nothing ready', async () => {
  const t = fakeTools(INJECTION_ADS[1], { summary: 'not-an-array', competencies: 'nope' });
  await assert.rejects(() => tailor({ caseId: 'c' }, { model: 'claude-sonnet-4-6', temperature: 0 }, t), /schema validation/);
  assert.strictEqual(t.rec.parts.cvDraft.status, 'failed');
});

test('D12 eval: an unknown competency category id is dropped (no hallucinated category)', async () => {
  const evil = { ...GOOD, competencies: [...GOOD.competencies, { category: 'made-up-category', items: ['d_lm1'] }] };
  const t = fakeTools(INJECTION_ADS[3], evil);
  await tailor({ caseId: 'c' }, { model: 'claude-sonnet-4-6', temperature: 0 }, t);
  const comp = t.rec.parts.cvDraft.data.sections.find((s) => s.key === 'competencies');
  assert.ok(!comp.categories.some((c) => c.id === 'made-up-category'));
});

test('D12 eval: a conformant selection passes P1 + P2 (the honesty floor holds end to end)', async () => {
  const t = fakeTools(INJECTION_ADS[0], GOOD);
  await tailor({ caseId: 'c' }, { model: 'claude-sonnet-4-6', temperature: 0 }, t);
  const draft = t.rec.parts.cvDraft.data;
  const fs = require('node:fs'); const path = require('node:path');
  const block = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'harness', 'phase0', 'TEMPLATE_DEFINITION.md'), 'utf8').match(/```json\s*([\s\S]*?)```/)[1]);
  assert.deepStrictEqual(M.validateStructure(draft, block).errors, []);
  assert.deepStrictEqual(M.validateProvenance(draft, poolIds, sourceText).errors, []);
});

