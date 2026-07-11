import { normalizeJobQuery } from '../api/jobSearch.js';

// Job accept/reject decisions live in the server 'jobs' collection (decideJob) — NOT
// localStorage. The keys here are for genuinely client-local state only: saved searches,
// the last search payload (for instant Home rehydrate), and the active case pointer.
const KEYS = {
  savedSearches: 'hellolilly:saved-searches',
  latestSearch: 'hellolilly:latest-job-search',
  activeCase: 'hellolilly:active-case',
};

function canStore() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readJson(key, fallback) {
  if (!canStore()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (!canStore()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('ll:jobs:changed'));
}

function compactJob(job = {}) {
  return {
    id: jobKey(job),
    originalId: job.id,
    co: job.co || 'Okänt företag',
    t: job.t || job.title || 'Roll utan titel',
    city: job.city || 'Sverige',
    type: job.type || job.source || 'Jobb',
    source: job.source,
    url: job.url,
    snippet: job.snippet || job.description || '',
    tags: Array.isArray(job.tags) ? job.tags : [],
    match: job.match || 76,
    when: job.when || 'nyligen',
    logo: job.logo || '#2B6CF0',
    hot: Boolean(job.hot),
    acceptedAt: job.acceptedAt,
    caseId: job.caseId || null, // the backend case this job's analysis lives in
  };
}

function jobKey(job = {}) {
  return String(job.id || job.originalId || job.url || `${job.co || 'job'}-${job.t || 'role'}-${job.city || ''}`);
}

function normalizeSavedSearch(search = {}) {
  const normalized = normalizeJobQuery(search);
  const fingerprint = `${normalized.keywords.join('|')}::${normalized.sources.join('|')}::${normalized.municipality}`;
  return {
    ...search,
    label: `${normalized.keywords.join(', ') || 'Alla jobb'} · ${normalized.municipality}`,
    keywords: normalized.keywords,
    sources: normalized.sources,
    municipality: normalized.municipality,
    fingerprint,
  };
}

function getSavedSearches() {
  return readJson(KEYS.savedSearches, []).map(normalizeSavedSearch);
}

function saveSearch(search) {
  const current = getSavedSearches();
  const normalizedSearch = normalizeJobQuery(search);
  const keywords = normalizedSearch.keywords;
  const sources = normalizedSearch.sources;
  const municipality = normalizedSearch.municipality;
  const fingerprint = `${keywords.join('|')}::${sources.join('|')}::${municipality}`;
  const nextSearch = {
    id: search.id || `search-${Date.now()}`,
    label: search.label || `${keywords.join(', ') || 'Alla jobb'} · ${municipality}`,
    keywords,
    sources,
    municipality,
    createdAt: search.createdAt || new Date().toISOString(),
    fingerprint,
  };
  const next = [nextSearch, ...current.filter((item) => item.fingerprint !== fingerprint && item.id !== nextSearch.id)].slice(0, 8);
  writeJson(KEYS.savedSearches, next);
  return nextSearch;
}

function removeSavedSearch(id) {
  writeJson(KEYS.savedSearches, getSavedSearches().filter((search) => search.id !== id));
}

function getLatestJobSearch() {
  const latest = readJson(KEYS.latestSearch, null);
  return latest ? { ...latest, query: normalizeJobQuery(latest.query || {}) } : null;
}

function saveLatestJobSearch(query, payload) {
  const normalizedQuery = normalizeJobQuery(query);
  const next = {
    query: normalizedQuery,
    jobs: Array.isArray(payload?.jobs) ? payload.jobs.map(compactJob) : [],
    summary: payload?.summary || null,
    meta: payload?.meta || null,
    searchedAt: new Date().toISOString(),
  };
  writeJson(KEYS.latestSearch, next);
  return next;
}

// The case the CV / cover-letter / home screens render. Set when an analysis starts.
function getActiveCaseId() {
  return readJson(KEYS.activeCase, null);
}

function setActiveCaseId(caseId) {
  writeJson(KEYS.activeCase, caseId || null);
  if (canStore()) window.dispatchEvent(new CustomEvent('ll:case:changed'));
}

export {
  getActiveCaseId,
  getLatestJobSearch,
  getSavedSearches,
  jobKey,
  removeSavedSearch,
  saveLatestJobSearch,
  saveSearch,
  setActiveCaseId,
};
