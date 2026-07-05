import React from 'react';
import { listJobs, decideJob } from '../api/caseApi.js';

// useJobs — the SINGLE decision path for the Jobbsök unit.
//
// Reads the stored jobs collection through the served API, and exposes approve / reject / reopen
// that all write through the ONE decide route (caseApi.decideJob). It subscribes to ll:jobs:changed
// so ANY writer — the result row OR the ad layover, which both call decideJob — triggers a refetch.
// That is what makes "one job, one decision record" true at the UI layer: both surfaces read the
// same backend record, and a decision made on one reflects on the other immediately. There is NO
// component-local decision state and NO localStorage decision fallback anywhere in this path.
export function useJobs() {
  const [jobs, setJobs] = React.useState([]);
  const [status, setStatus] = React.useState('pending'); // 'pending' | 'ready' | 'failed'
  const [error, setError] = React.useState(null);

  const reload = React.useCallback(() => {
    let live = true;
    setStatus('pending');
    setError(null);
    listJobs()
      .then((j) => { if (live) { setJobs(j || []); setStatus('ready'); } })
      .catch((e) => { if (live) { setError(e); setStatus('failed'); } });
    return () => { live = false; };
  }, []);

  React.useEffect(() => reload(), [reload]);

  React.useEffect(() => {
    const on = () => reload();
    window.addEventListener('ll:jobs:changed', on);
    return () => window.removeEventListener('ll:jobs:changed', on);
  }, [reload]);

  const approve = React.useCallback((id) => decideJob(id, { decision: 'approved' }), []);
  const reject = React.useCallback((id, reason, note) => decideJob(id, { decision: 'rejected', reason, note }), []);
  const reopen = React.useCallback((id) => decideJob(id, { decision: 'new' }), []);

  return { jobs, status, error, reload, approve, reject, reopen };
}
