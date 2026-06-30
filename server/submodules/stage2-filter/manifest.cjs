'use strict';

// stage2-filter — applies the seeded stage_2 reject codes (US_TIMEZONE / TOO_TECHNICAL / LANG_REQ /
// SALARY_LOW / SALES_HEAVY / INDUSTRY_FIT) against the job BODY (text_content): the ~70% of filtering
// that needs the description, not just the card. Reads its detection patterns FROM THE STORE
// (filterSet.stage_2[*].match) — nothing hardcoded (operability principle). Same flag-never-hide
// discipline as stage-1: store + signal:'low' + matchedRules (tagged stage:2), never drop or hide.
// Merges with stage-1 flags (preserved); idempotent (re-run replaces only the stage:2 rules).
module.exports = {
  id: 'stage2-filter',
  description: 'Applies store-backed stage_2 reject codes against each job\'s text_content body; flags matches (signal:low + matchedRules stage:2), merges with stage-1, never drops. Skips body-less jobs.',
  reads: [],
  writes: [],
  capabilities: ['store', 'logger'],
  options: {},
};
