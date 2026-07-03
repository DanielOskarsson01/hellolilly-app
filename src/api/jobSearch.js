// Job search — through the HelloLilly backend (Stream 2 rewire).
// The browser no longer calls JobTech/RemoteOK/Remotive directly: POST /api/jobs/search
// runs the in-repo `job-discovery` submodule, which writes canonical records into the
// persistent `jobs` collection and returns UI-shaped jobs (normalization, scoring and
// flag-down-ranking live server-side now).

import { searchJobs as apiSearchJobs } from './caseApi.js';

const FIXED_MUNICIPALITY = '0180';

const DEFAULT_QUERY = {
  keywords: ['lager', 'logistik', 'truck'],
  sources: ['jobtech'],
  municipality: FIXED_MUNICIPALITY,
  maxResults: 20,
};

const PROVIDER_LABELS = {
  jobtech: 'Platsbanken',
  remoteok: 'RemoteOK',
  remotive: 'Remotive',
};

function cleanList(value, fallback, max = 10) {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : fallback;
  const seen = new Set();
  return raw
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, max);
}

function normalizeJobQuery(query = {}) {
  const merged = { ...DEFAULT_QUERY, ...query };
  return {
    keywords: cleanList(merged.keywords, DEFAULT_QUERY.keywords, 8),
    sources: cleanList(merged.sources, DEFAULT_QUERY.sources, 5),
    maxResults: Math.max(5, Math.min(Number(merged.maxResults || DEFAULT_QUERY.maxResults), 50)),
    municipality: FIXED_MUNICIPALITY,
  };
}

async function searchJobs(query = {}) {
  const normalized = normalizeJobQuery(query);
  const payload = await apiSearchJobs(normalized);
  const jobs = payload.jobs || [];
  const errors = (payload.summary && payload.summary.errors) || [];
  const sourceLabels = normalized.sources.map((s) => PROVIDER_LABELS[s] || s);

  // Same return contract useLiveJobSearch has always consumed.
  return {
    ok: true,
    jobs,
    summary: {
      total_items: jobs.length,
      description: `${jobs.length} livejobb från ${sourceLabels.join(', ')} via HelloLilly-backend`,
      errors,
    },
    meta: {
      ...(payload.meta || {}),
      total_found: jobs.length,
      errors: errors.length,
    },
  };
}

export { DEFAULT_QUERY, FIXED_MUNICIPALITY, normalizeJobQuery, searchJobs };
