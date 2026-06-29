'use strict';

// job-discovery — scheduled multi-provider job search (Step 1 of the job-search cluster).
// Rewrapped from the OnlyiGaming pipeline's step-1 api-search ("copy freely, call never"):
// the provider abstraction + field-map + search/feed modes are owned here, not require()'d
// across repos. Reads its filter set FROM THE STORE (collection `filterSet`, id `active`,
// seeded from candidate_preferences) — search terms / providers / reject rules are editable
// DATA, never hardcoded. Writes canonical jobs into the `jobs` collection; nothing dropped.
module.exports = {
  id: 'job-discovery',
  description: 'Scheduled multi-provider job search. Reads its filter set from the store (never hardcoded), queries the configured providers, writes canonical jobs into the jobs collection (deduped by externalId), and flags — never hides — jobs matching reject rules.',
  reads: [],
  writes: [],
  capabilities: ['http', 'store', 'logger', 'utils'],
  options: {},
};
