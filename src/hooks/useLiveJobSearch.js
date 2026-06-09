import React from 'react';
import { DEFAULT_QUERY, searchJobs } from '../api/jobSearch.js';
import { LIVE_JOBS } from '../data/strategyData.js';

function useLiveJobSearch(initialQuery = DEFAULT_QUERY, options = {}) {
  const [query, setQuery] = React.useState(initialQuery);
  const [jobs, setJobs] = React.useState(LIVE_JOBS);
  const [summary, setSummary] = React.useState(null);
  const [meta, setMeta] = React.useState(null);
  const [status, setStatus] = React.useState(options.auto === false ? 'idle' : 'loading');
  const [error, setError] = React.useState('');

  const runSearch = React.useCallback(async (nextQuery = query) => {
    setStatus('loading');
    setError('');
    setQuery(nextQuery);
    try {
      const payload = await searchJobs(nextQuery);
      setJobs(payload.jobs?.length ? payload.jobs : []);
      setSummary(payload.summary || null);
      setMeta(payload.meta || null);
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
    searchJobs(initialQuery)
      .then((payload) => {
        if (!alive) return;
        setJobs(payload.jobs?.length ? payload.jobs : []);
        setSummary(payload.summary || null);
        setMeta(payload.meta || null);
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
