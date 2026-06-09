import React from 'react';
import { DEFAULT_QUERY, normalizeJobQuery, searchJobs } from '../api/jobSearch.js';
import { getLatestJobSearch, saveLatestJobSearch } from '../utils/jobStore.js';

function useLiveJobSearch(initialQuery = DEFAULT_QUERY, options = {}) {
  const latest = React.useMemo(() => getLatestJobSearch(), []);
  const firstQuery = normalizeJobQuery(latest?.query || initialQuery);
  const [query, setQuery] = React.useState(firstQuery);
  const [jobs, setJobs] = React.useState(latest?.jobs || []);
  const [summary, setSummary] = React.useState(latest?.summary || null);
  const [meta, setMeta] = React.useState(latest?.meta || null);
  const [status, setStatus] = React.useState(options.auto === false ? 'idle' : 'loading');
  const [error, setError] = React.useState('');

  const runSearch = React.useCallback(async (nextQuery = query) => {
    const normalizedQuery = normalizeJobQuery(nextQuery);
    setStatus('loading');
    setError('');
    setQuery(normalizedQuery);
    try {
      const payload = await searchJobs(normalizedQuery);
      setJobs(payload.jobs?.length ? payload.jobs : []);
      setSummary(payload.summary || null);
      setMeta(payload.meta || null);
      saveLatestJobSearch(normalizedQuery, payload);
      setStatus('success');
      return payload;
    } catch (err) {
      setError(err.message || 'Jobbsokningen misslyckades');
      setStatus('error');
      return null;
    }
  }, [query]);

  React.useEffect(() => {
    if (options.auto === false) return undefined;
    let alive = true;
    setStatus('loading');
    searchJobs(firstQuery)
      .then((payload) => {
        if (!alive) return;
        setJobs(payload.jobs?.length ? payload.jobs : []);
        setSummary(payload.summary || null);
        setMeta(payload.meta || null);
        saveLatestJobSearch(firstQuery, payload);
        setStatus('success');
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || 'Jobbsokningen misslyckades');
        setStatus('error');
      });
    return () => { alive = false; };
  }, []);

  return {
    error,
    jobs,
    meta,
    query,
    runSearch,
    setQuery,
    status,
    summary,
  };
}

export { useLiveJobSearch };
