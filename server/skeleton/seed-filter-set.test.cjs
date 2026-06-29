'use strict';

// buildFilterSet — the one-time ingestion mapper: candidate_preferences.json (+ the two agreed
// corrections) → the `filterSet/active` record the store owns. After ingestion the store is the
// source of truth and the file is not re-read (operability principle). Tested against an INLINE
// fixture so it never depends on the (uncommitted, personal) real file — CI-safe.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildFilterSet } = require('../seed-filter-set.cjs');

const PREFS = {
  candidate: 'Test Person',
  role_target: {
    boosted_titles: ['CMO', 'CCO', 'Head of Marketing', 'CPO', 'Head of Product'],
    altitude: 'Exec / Head-of level.',
    open_question: 'Confirm whether product (CPO) is equal-weight or secondary.',
    firmness: 'soft',
  },
  hard_filters: {
    stage_1_metadata: {
      seniority_floor: { value: 'Cut deputy / associate level.', firmness: 'firm' },
      reject_titles: { value: 'sales, developer, analyst. specialist / consultant only if strategic.', firmness: 'firm' },
      bad_companies: { value: 'visa, google (currently spotify, glovo).', firmness: 'firm' },
      location: { good: ['stockholm'], out: ['goteborg'], firmness: 'firm' },
    },
    stage_2_description: {
      too_technical: { value: 'Cut if planning sprints for developers, or design-led.', reason_code: 'TOO_TECHNICAL', firmness: 'firm' },
      salary_floor: { value: 'Above 85000 EUR.', reason_code: 'SALARY_LOW', firmness: 'soft' },
    },
  },
  profile_basis: { summary: '~25y experience.' },
};

test('produces a filterSet/active record with the flat fields job-discovery reads', () => {
  const fs = buildFilterSet(PREFS);
  assert.equal(fs.id, 'active');
  assert.ok(Array.isArray(fs.providers) && fs.providers.length > 0, 'providers set');
  assert.ok(typeof fs.maxResults === 'number' && fs.maxResults > 0, 'maxResults set');
  assert.ok(Array.isArray(fs.searchTerms) && fs.searchTerms.length > 0, 'searchTerms set');
});

test('correction 1: CMO and CPO are equal weight (open question resolved, product not down-weighted)', () => {
  const fs = buildFilterSet(PREFS);
  assert.ok(fs.searchTerms.includes('CMO'), 'CMO is a search term');
  assert.ok(fs.searchTerms.includes('CPO'), 'CPO is a search term');
  assert.ok(fs.searchTerms.includes('Head of Product'), 'Head of Product is a search term');
  assert.match(fs.role_target.weighting || '', /equal/i, 'weighting records CMO/CPO equal');
  assert.ok(!fs.role_target.open_question, 'the open question is resolved, not left dangling');
});

test('correction 2: the positive conceptual-vs-technical product definition sits alongside too_technical (same reason code)', () => {
  const fs = buildFilterSet(PREFS);
  const tt = fs.stage_2.too_technical;
  assert.equal(tt.reason_code, 'TOO_TECHNICAL', 'same reason code, not a new one');
  assert.match(tt.product_in_scope_when || '', /conceptual|ux|customer|commercial/i, 'positive in-scope definition encoded');
  assert.match(tt.product_out_of_scope_when || '', /sprint|developer|design-led|project plan/i, 'technical out-of-scope definition encoded');
  assert.ok(tt.reject_when, 'the original too_technical reject text is preserved');
});

test('derives reject-title and bad-company term lists, dropping noise', () => {
  const fs = buildFilterSet(PREFS);
  for (const t of ['sales', 'developer', 'analyst']) assert.ok(fs.rejectTitleTerms.includes(t), `reject term ${t}`);
  assert.ok(!fs.rejectTitleTerms.some((t) => t.includes('/')), 'the slashed nuanced fragment is dropped');
  for (const c of ['visa', 'google', 'spotify', 'glovo']) assert.ok(fs.badCompanies.includes(c), `bad company ${c}`);
});

test('preserves the full structured filter set for the downstream approval / analyzer / learner layers', () => {
  const fs = buildFilterSet(PREFS);
  assert.ok(fs.stage_1.seniority_floor, 'stage_1 preserved');
  assert.ok(fs.stage_2.salary_floor, 'stage_2 preserved');
  assert.ok(fs.profile_basis, 'profile basis preserved (for the analyzer)');
  assert.ok(Array.isArray(fs.reason_codes) && fs.reason_codes.includes('TOO_TECHNICAL'), 'reason codes collected');
});
