'use strict';

// linkedin-job-fetcher — enriches LinkedIn jobs (which can't be API-searched) with their full
// body, via the UNAUTHENTICATED guest endpoint. No login / Voyager / headless browser / account,
// so zero risk to any LinkedIn session and no entanglement with the production scraper. Plain
// native fetch (tools.http) — no new dependency. LinkedIn-specific ONLY at the id-extract +
// HTML-parse layer; the output is the generic canonical job shape, so downstream never learns
// LinkedIn internals. Statuses (ok/expired/rate_limited/error) are surfaced, never silently dropped.
module.exports = {
  id: 'linkedin-job-fetcher',
  description: 'Fetches full LinkedIn job postings via the unauthenticated guest endpoint (browser UA, no auth). Input: LinkedIn URLs or bare ids. Output: canonical job records into the jobs collection, with explicit per-id status (ok/expired/rate_limited/error).',
  reads: [],
  writes: [],
  capabilities: ['http', 'store', 'logger', 'utils'],
  options: {},
};
