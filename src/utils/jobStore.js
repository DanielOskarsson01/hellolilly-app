const KEYS = {
  savedSearches: 'hellolilly:saved-searches',
  acceptedJobs: 'hellolilly:accepted-jobs',
  removedJobs: 'hellolilly:removed-jobs',
  latestSearch: 'hellolilly:latest-job-search',
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
  };
}

function jobKey(job = {}) {
  return String(job.id || job.originalId || job.url || `${job.co || 'job'}-${job.t || 'role'}-${job.city || ''}`);
}

function getSavedSearches() {
  return readJson(KEYS.savedSearches, []);
}

function saveSearch(search) {
  const current = getSavedSearches();
  const keywords = Array.isArray(search.keywords) ? search.keywords : [];
  const sources = Array.isArray(search.sources) ? search.sources : [];
  const fingerprint = `${keywords.join('|')}::${sources.join('|')}::${search.municipality || ''}`;
  const nextSearch = {
    id: search.id || `search-${Date.now()}`,
    label: search.label || `${keywords.join(', ') || 'Alla jobb'} · ${search.municipality || 'alla orter'}`,
    keywords,
    sources,
    municipality: search.municipality || '',
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

function getAcceptedJobs() {
  return readJson(KEYS.acceptedJobs, []);
}

function acceptJob(job) {
  const nextJob = { ...compactJob(job), acceptedAt: new Date().toISOString() };
  const current = getAcceptedJobs();
  writeJson(KEYS.acceptedJobs, [nextJob, ...current.filter((item) => jobKey(item) !== nextJob.id)].slice(0, 30));
  return nextJob;
}

function removeAcceptedJob(jobOrId) {
  const id = typeof jobOrId === 'string' ? jobOrId : jobKey(jobOrId);
  writeJson(KEYS.acceptedJobs, getAcceptedJobs().filter((job) => jobKey(job) !== id));
}

function getRemovedJobIds() {
  return readJson(KEYS.removedJobs, []);
}

function getLatestJobSearch() {
  return readJson(KEYS.latestSearch, null);
}

function saveLatestJobSearch(query, payload) {
  const next = {
    query,
    jobs: Array.isArray(payload?.jobs) ? payload.jobs.map(compactJob) : [],
    summary: payload?.summary || null,
    meta: payload?.meta || null,
    searchedAt: new Date().toISOString(),
  };
  writeJson(KEYS.latestSearch, next);
  return next;
}

function removeJob(job) {
  const id = jobKey(job);
  const removed = new Set(getRemovedJobIds());
  removed.add(id);
  writeJson(KEYS.removedJobs, Array.from(removed).slice(-200));
  removeAcceptedJob(id);
}

function isJobRemoved(job) {
  return getRemovedJobIds().includes(jobKey(job));
}

export {
  acceptJob,
  getAcceptedJobs,
  getLatestJobSearch,
  getRemovedJobIds,
  getSavedSearches,
  isJobRemoved,
  jobKey,
  removeAcceptedJob,
  removeJob,
  removeSavedSearch,
  saveLatestJobSearch,
  saveSearch,
};
