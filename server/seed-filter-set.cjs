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

  // ── Correction 2: positive conceptual-vs-technical product definition, same reason_code. ──
  const too_technical = {
    reason_code: (s2raw.too_technical && s2raw.too_technical.reason_code) || 'TOO_TECHNICAL',
    firmness: (s2raw.too_technical && s2raw.too_technical.firmness) || 'firm',
    reject_when: (s2raw.too_technical && s2raw.too_technical.value) || '',
    product_in_scope_when: 'Conceptual / commercial product leadership: UX/UI, features, the customer '
      + 'promise, experience quality, solving customer problems, commercial ownership.',
    product_out_of_scope_when: 'Technical product leadership: owning sprints, setting project plans, '
      + 'leading/coaching developers, design-led, heavy technical-PM.',
    note: 'stage_2 (description body) — title alone cannot tell which kind a CPO/Head-of-Product role is.',
  };
  const stage_2 = { ...s2raw, too_technical };

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
