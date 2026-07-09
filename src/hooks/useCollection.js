import React from 'react';
import { listCollection } from '../api/collectionApi.js';

// useCollection — the generic client hook for any named collection. Generalized
// verbatim in shape from useJobs: honest pending/ready/failed states, empty is
// `ready` with []. Refetches on ll:collection:changed for this collection name.
export function useCollection(name) {
  const [records, setRecords] = React.useState([]);
  const [status, setStatus] = React.useState('pending'); // 'pending' | 'ready' | 'failed'
  const [error, setError] = React.useState(null);

  const reload = React.useCallback(() => {
    let live = true;
    setStatus('pending');
    setError(null);
    listCollection(name)
      .then((r) => { if (live) { setRecords(r || []); setStatus('ready'); } })
      .catch((e) => { if (live) { setError(e); setStatus('failed'); } });
    return () => { live = false; };
  }, [name]);

  React.useEffect(() => reload(), [reload]);

  React.useEffect(() => {
    const on = (e) => { if (!e.detail?.name || e.detail.name === name) reload(); };
    window.addEventListener('ll:collection:changed', on);
    return () => window.removeEventListener('ll:collection:changed', on);
  }, [reload, name]);

  return { records, status, error, reload };
}
