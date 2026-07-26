'use strict';

// COMMITTED synthetic datafact pool (fixture law). Fully fabricated — no real person data, no real
// CV claims, no real employer history in any TEXT. The only real strings are STRUCTURAL CONSTANTS:
// the competency-category taxonomy ids/titles (committed-by-design per ledger #4) and the five
// job-routing tags (FIXED_JOBS.matchTags — the frozen job keys the tailor routes on, committed-by-
// design per D20b). Every achievement/claim string below is invented.
//
// One tailor path (Daniel's binding condition): the offline CI eval and the live zero-tolerance
// runner both build from THIS pool, so they exercise the same tailor. It is conformant to the strict
// machine block: 1 summary, 6 highlights, 3 categories x 4 items, 5 jobs each with an intro + a
// bullet, otherExp, and the static earlier/education/awards sections. Requires NO gitignored file, so
// the live eval runs from a clean checkout.

const DF = (id, type, text, tags = [], extra = {}) => ({ id, kind: 'datafact', origin: 'curated', type, text, tags, language: 'en', ...extra });
const CAT = (id, title, group) => ({ category: { id, title, group, source: 'COMPETENCY_MASTER_POOL.json' } });

const SYNTHETIC_FACTS = [
  DF('syn_sum', 'professional_summary', 'Marketing leader who has scaled teams and brands at fast-growing companies, with hands-on depth in performance marketing, lifecycle, and analytics.'),
  DF('syn_h1', 'value_proposition', 'Grew active users threefold in a year through a lifecycle-messaging redesign.', ['value-prop']),
  DF('syn_h2', 'value_proposition', 'Built a marketing team from first hire to twenty across acquisition, lifecycle, and creative.', ['value-prop']),
  DF('syn_h3', 'value_proposition', 'Launched eight product lines across three markets with full positioning.', ['value-prop']),
  DF('syn_h4', 'value_proposition', 'Stood up analytics so budget decisions became evidence-led.', ['value-prop']),
  DF('syn_h5', 'value_proposition', 'Cut acquisition cost by a third while holding retention flat via creative testing.', ['value-prop']),
  DF('syn_h6', 'value_proposition', 'Owned a seven-figure paid-media budget across search and paid social.', ['value-prop']),
  // three categories (real taxonomy ids/titles), 4 fabricated items each
  DF('syn_mg1', 'competency', 'Brand storytelling for niche B2B buyers', ['competency', 'marketing_strategy'], CAT('marketing-growth', 'Marketing & Growth', 'marketing_strategy')),
  DF('syn_mg2', 'competency', 'Lifecycle journeys tuned to purchase intent', ['competency', 'marketing_strategy'], CAT('marketing-growth', 'Marketing & Growth', 'marketing_strategy')),
  DF('syn_mg3', 'competency', 'Channel mix planning under a fixed budget', ['competency', 'marketing_strategy'], CAT('marketing-growth', 'Marketing & Growth', 'marketing_strategy')),
  DF('syn_mg4', 'competency', 'Launch playbooks for new product lines', ['competency', 'marketing_strategy'], CAT('marketing-growth', 'Marketing & Growth', 'marketing_strategy')),
  DF('syn_da1', 'competency', 'Reporting that ties spend to pipeline', ['competency', 'technical_analytical'], CAT('data-analytics', 'Data & Analytics', 'technical_analytical')),
  DF('syn_da2', 'competency', 'Hold-out experiment design', ['competency', 'technical_analytical'], CAT('data-analytics', 'Data & Analytics', 'technical_analytical')),
  DF('syn_da3', 'competency', 'Budget reallocation from live signals', ['competency', 'technical_analytical'], CAT('data-analytics', 'Data & Analytics', 'technical_analytical')),
  DF('syn_da4', 'competency', 'Multi-touch attribution modelling', ['competency', 'technical_analytical'], CAT('data-analytics', 'Data & Analytics', 'technical_analytical')),
  DF('syn_ls1', 'competency', 'Hiring a first marketing bench', ['competency', 'leadership_management'], CAT('leadership-scaling', 'Leadership & Scaling', 'leadership_management')),
  DF('syn_ls2', 'competency', 'Shaping a team around the funnel', ['competency', 'leadership_management'], CAT('leadership-scaling', 'Leadership & Scaling', 'leadership_management')),
  DF('syn_ls3', 'competency', 'Owning a marketing P&L line', ['competency', 'leadership_management'], CAT('leadership-scaling', 'Leadership & Scaling', 'leadership_management')),
  DF('syn_ls4', 'competency', 'Steering a function through fast change', ['competency', 'leadership_management'], CAT('leadership-scaling', 'Leadership & Scaling', 'leadership_management')),
  // five jobs: an intro (job_summary) + a bullet (job_result) each, tagged with the frozen routing key
  DF('syn_oj_s', 'job_summary', 'Led brand and go-to-market for an early-stage platform.', ['OnlyiGaming / Enablers']),
  DF('syn_oj_r', 'job_result', 'Built the content-and-search engine that drove organic growth.', ['OnlyiGaming / Enablers']),
  DF('syn_ch_s', 'job_summary', 'Owned brand and marketing from scratch at a new venture.', ['Coinhero']),
  DF('syn_ch_r', 'job_result', 'Created the brand identity and positioning end to end.', ['Coinhero']),
  DF('syn_bc_s', 'job_summary', 'Built a new division inside a larger company.', ['Betclic']),
  DF('syn_bc_r', 'job_result', 'Ran acquisition and retention for a fresh product line.', ['Betclic']),
  DF('syn_co_s', 'job_summary', 'Scaled the marketing organisation during rapid growth.', ['ComeOn']),
  DF('syn_co_r', 'job_result', 'Grew the team from one to a hundred across disciplines.', ['ComeOn']),
  DF('syn_mg_s', 'job_summary', 'Founding-team member who built the marketing function.', ['MrGreen']),
  DF('syn_mg_r', 'job_result', 'Built the lifecycle department from zero to a profit centre.', ['MrGreen']),
  // static sections (JC2 requires them non-empty)
  DF('syn_ow', 'other_work', 'Sample Advisory - fractional marketing advisor (2020-).', ['other-work']),
  DF('syn_ear', 'job_result', 'Grew brand awareness at a fast-scaling utility.', ['Telge Energi']),
  DF('syn_edu', 'education', 'BSc, Marketing & Economics - Sample University.', ['education']),
  DF('syn_awd', 'award', 'Operator of the Year - Sample Industry Awards (fictional).', ['award']),
];

// A conformant selection over the synthetic pool (for offline tests + as the reference "good" output).
const SYNTHETIC_GOOD_SELECTION = {
  summary: ['syn_sum'], highlights: ['syn_h1', 'syn_h2', 'syn_h3', 'syn_h4', 'syn_h5', 'syn_h6'],
  competencies: [
    { category: 'marketing-growth', items: ['syn_mg1', 'syn_mg2', 'syn_mg3', 'syn_mg4'] },
    { category: 'data-analytics', items: ['syn_da1', 'syn_da2', 'syn_da3', 'syn_da4'] },
    { category: 'leadership-scaling', items: ['syn_ls1', 'syn_ls2', 'syn_ls3', 'syn_ls4'] },
  ],
  other: ['syn_ow'],
  jobs: {
    onlyigaming: { intro: ['syn_oj_s'], bullets: ['syn_oj_r'] }, coinhero: { intro: ['syn_ch_s'], bullets: ['syn_ch_r'] },
    betclic: { intro: ['syn_bc_s'], bullets: ['syn_bc_r'] }, comeon: { intro: ['syn_co_s'], bullets: ['syn_co_r'] },
    mrgreen: { intro: ['syn_mg_s'], bullets: ['syn_mg_r'] },
  },
};

module.exports = { SYNTHETIC_FACTS, SYNTHETIC_GOOD_SELECTION };
