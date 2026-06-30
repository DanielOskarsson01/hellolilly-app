'use strict';

// buildFilterSet — the ONE-TIME ingestion mapper for candidate_preferences.json.
//
// Maps Daniel's preferences file (+ the two agreed corrections) into the `filterSet/active`
// record that the store owns. job-discovery reads the flat fields (searchTerms / providers /
// maxResults / rejectTitleTerms / badCompanies); the full structured stage_1/stage_2/role_target
// is preserved for the approval, analyzer, and rejection-learning layers. After this runs, the
// store is the source of truth — the file is not re-read (the operability principle). This mapper
// is host/ops-level, not a submodule: it applies the seed once; it is NOT the runtime filter logic.
//
// The two corrections (consolidated sign-off):
//   1. CMO and CPO are EQUAL weight — resolve the file's open question; do not down-weight product.
//   2. Add the POSITIVE conceptual-vs-technical product definition alongside the too_technical
//      reject (same reason_code TOO_TECHNICAL): product/CPO roles are in-scope when conceptual/
//      commercial, out-of-scope when technical. A stage_2 (body) call — title alone can't tell.

const DEFAULT_PROVIDERS = ['jobtech', 'remotive', 'remoteok'];
const DEFAULT_MAX_RESULTS = 25;

// Default body-match patterns per stage_2 reject code (keyed by the prefs stage_2_description key).
// These make the seeded reject codes MACHINE-APPLICABLE while staying STORE-BACKED EDITABLE DATA —
// stage2-filter reads them from the store and applies them; nothing is hardcoded in the submodule
// (the operability principle). Word-boundary matched, multi-word-preferring to avoid false positives.
// Daniel / the rejection-learner refine these as data, never in code.
const STAGE2_MATCH = {
  // US_TIMEZONE — a body that requires US-timezone overlap (the #1 reject); EU-timezone roles pass.
  us_timezone: [
    'us timezone', 'u.s. timezone', 'us time zone', 'pacific time', 'eastern time', 'central time',
    'mountain time', 'pacific standard time', 'eastern standard time', 'us business hours',
    'us working hours', 'us hours', 'work us hours', 'overlap with us hours', 'overlap with the us',
    'overlap with us team', 'est timezone', 'pst timezone', 'est time zone', 'american time zone',
    'based in the united states', 'must reside in the us', 'us work authorization',
    'authorized to work in the us', 'work authorization in the us',
  ],
  // TOO_TECHNICAL — technical product/PM leadership (out of scope). The POSITIVE in-scope definition
  // (conceptual/commercial) lives alongside as product_in_scope_when; flagging keys on the technical
  // signals, which a conceptual/commercial role simply does not carry (title can't tell — it's a body call).
  too_technical: [
    'sprint planning', 'owning sprints', 'running sprints', 'scrum', 'agile ceremonies',
    'backlog grooming', 'backlog refinement', 'lead developers', 'leading developers',
    'manage developers', 'managing developers', 'coaching developers', 'coaching engineers',
    'lead engineers', 'engineering management', 'technical roadmap', 'design-led',
    'technical product manager', 'technical pm', 'jira', 'ci/cd', 'code reviews',
    'software development lifecycle', 'setting project plans',
  ],
  // LANG_REQ — a required language Daniel does NOT hold (he holds Swedish/English/German).
  language_requirement: [
    'native spanish', 'fluent spanish', 'bilingual spanish', 'spanish is required', 'must speak spanish',
    'native french', 'fluent french', 'french is required', 'native italian', 'fluent italian',
    'native portuguese', 'fluent portuguese', 'native dutch', 'native thai', 'native polish',
    'native arabic', 'native mandarin', 'native chinese', 'native japanese', 'native finnish',
  ],
  // SALARY_LOW — numeric salary-vs-floor parsing is a future stage_2 rule type (soft firmness).
  // Seeded WIRED but with no default keyword patterns, to avoid false flags like "70,000 users".
  salary_floor: [],
  // SALES_HEAVY — quota-carrying / deal-closing / physical-retail roles.
  too_sales_operational: [
    'quota', 'sales quota', 'quota-carrying', 'close deals', 'closing deals', 'deal-closing',
    'sales target', 'sales targets', 'on-target earnings', 'cold calling', 'cold outreach',
    'pipeline generation', 'field sales', 'in-store', 'retail floor', 'book of business', 'commission',
  ],
  // INDUSTRY_FIT — clear out-of-fit only (soft; "resists clean keyword rules" — iGaming-adjacent is home turf).
  industry_product_fit: ['email security', 'monetization-only', 'pure sportsbook', 'sportsbook trading'],
};

// Best-effort term extraction from a free-text rule. Flagging only (never drops), so minor noise
// is harmless; the authoritative nuanced rules stay in the structured stage_1/stage_2 below for
// the learner to refine. Splits on punctuation/parens, lowercases, drops the slashed/over-long
// nuanced fragments and a stray leading "currently".
function splitTerms(text) {
  return String(text || '')
    .replace(/[()]/g, ',')
    .split(/[,.;]/)
    .map((t) => t.trim().toLowerCase().replace(/^currently\s+/, ''))
    .filter((t) => t && t.length <= 35 && !t.includes('/'));
}

function buildFilterSet(prefs) {
  const roleTarget = prefs.role_target || {};
  const s1 = (prefs.hard_filters && prefs.hard_filters.stage_1_metadata) || {};
  const s2raw = (prefs.hard_filters && prefs.hard_filters.stage_2_description) || {};

  // ── Correction 1: CMO and CPO equal weight; resolve the open question. ──
  const role_target = {
    boosted_titles: roleTarget.boosted_titles || [],
    altitude: roleTarget.altitude || null,
    firmness: roleTarget.firmness || 'soft',
    weighting: 'CMO and CPO are EQUAL weight (open question resolved 2026 — the product-skewed '
      + 'interview-prep work was for one specific job and does not generalize to the search).',
  };

  // Every stage_2 reject code gets its store-backed body-match patterns (editable data).
  const stage_2 = {};
  for (const [key, entry] of Object.entries(s2raw)) {
    stage_2[key] = { ...entry, match: STAGE2_MATCH[key] || [] };
  }

  // ── Correction 2: positive conceptual-vs-technical product definition, same reason_code. ──
  stage_2.too_technical = {
    ...(stage_2.too_technical || {}),
    reason_code: (s2raw.too_technical && s2raw.too_technical.reason_code) || 'TOO_TECHNICAL',
    firmness: (s2raw.too_technical && s2raw.too_technical.firmness) || 'firm',
    reject_when: (s2raw.too_technical && s2raw.too_technical.value) || '',
    product_in_scope_when: 'Conceptual / commercial product leadership: UX/UI, features, the customer '
      + 'promise, experience quality, solving customer problems, commercial ownership.',
    product_out_of_scope_when: 'Technical product leadership: owning sprints, setting project plans, '
      + 'leading/coaching developers, design-led, heavy technical-PM.',
    note: 'stage_2 (description body) — title alone cannot tell which kind a CPO/Head-of-Product role is.',
    match: STAGE2_MATCH.too_technical,
  };

  const reason_codes = [...new Set(
    Object.values(stage_2).map((r) => r && r.reason_code).filter(Boolean),
  )];

  return {
    id: 'active',
    version: 1,
    source: 'candidate_preferences.json + 2026 corrections (CMO/CPO equal; conceptual-product scope)',
    // flat fields job-discovery consumes (editable data in the store):
    searchTerms: [...new Set(roleTarget.boosted_titles || [])],
    providers: DEFAULT_PROVIDERS.slice(),
    maxResults: DEFAULT_MAX_RESULTS,
    rejectTitleTerms: splitTerms(s1.reject_titles && s1.reject_titles.value),
    badCompanies: splitTerms(s1.bad_companies && s1.bad_companies.value),
    // full structured filter set for the approval / analyzer / learner layers:
    role_target,
    stage_1: s1,
    stage_2,
    profile_basis: prefs.profile_basis || null,
    reason_codes,
  };
}

module.exports = { buildFilterSet, splitTerms, DEFAULT_PROVIDERS, DEFAULT_MAX_RESULTS };
