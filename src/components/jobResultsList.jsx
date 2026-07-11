import React from 'react';
import { Button, Icon, Tag } from './primitives.jsx';
import { useJobs } from '../hooks/useJobs.js';
import { findServerJob } from '../lib/jobRecordBridge.mjs';

function JobResultsList({ jobs = [], status = 'success' }) {
  // Decisions go through the ONE server record (decideJob), same as Jobbsök — no localStorage.
  // useJobs refetches on ll:jobs:changed (a fresh search fires it via saveLatestJobSearch),
  // so `records` reflects the jobs job-discovery just persisted.
  const { jobs: records, approve, reject } = useJobs();
  const [errIds, setErrIds] = React.useState({}); // homeJob.id -> honest error message

  const decisionOf = (job) => { const r = findServerJob(records, job); return r ? r.decision : null; };
  const setErr = (id, msg) => setErrIds((e) => ({ ...e, [id]: msg }));
  const clearErr = (id) => setErrIds((e) => { const n = { ...e }; delete n[id]; return n; });

  // Rejected jobs (incl. Home "Ta bort") drop from view; approved stay, shown "Sparad".
  const visibleJobs = React.useMemo(
    () => jobs.filter((job) => decisionOf(job) !== 'rejected'),
    [jobs, records],
  );

  const openJob = (job) => {
    window.dispatchEvent(new CustomEvent('ll:helpful:open', { detail: { ...job, kind: 'job' } }));
  };

  const handleRemoveJob = async (job) => {
    const rec = findServerJob(records, job);
    if (!rec) { setErr(job.id, 'Kunde inte ta bort – jobbet finns inte i systemet ännu.'); return; }
    clearErr(job.id);
    // A removal is data: reject with a note that marks it a home-feed cull, so the future
    // rejection-learning layer can tell it apart from a considered rejection.
    try { await reject(rec.id, 'OTHER', 'Borttagen från hemflödet'); }
    catch (err) { setErr(job.id, err.message || 'Kunde inte ta bort jobbet.'); }
  };

  const handleApplyJob = async (job) => {
    const rec = findServerJob(records, job);
    if (!rec) { setErr(job.id, 'Kunde inte spara – jobbet finns inte i systemet ännu.'); return; }
    clearErr(job.id);
    try { await approve(rec.id); }  // decideJob approved → ll:jobs:changed → refetch → "Sparad"
    catch (err) { setErr(job.id, err.message || 'Kunde inte spara jobbet.'); }
  };

  return (
    <React.Fragment>
      <div className="joblist">
        {visibleJobs.map((job) => {
          const accepted = decisionOf(job) === 'approved';
          const err = errIds[job.id];
          return (
            <div
              className="jobrow"
              key={job.id || job.url || `${job.co}-${job.t}`}
              onClick={() => openJob(job)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openJob(job);
                }
              }}
            >
              <div className="joblogo" style={{ background: job.logo }}>{(job.co || 'JO').slice(0, 2).toUpperCase()}</div>
              <div className="jobrow__main">
                <div className="jobrow__t">{job.t}{job.hot && <span style={{ color:'var(--ll-coral)', fontSize:12, fontWeight:800, marginLeft:8 }}>● Het</span>}</div>
                <div className="jobrow__sub">{job.co}<span className="sep" />{job.city}<span className="sep" />{job.type}</div>
                {job.snippet && <p className="livejob-snippet">{job.snippet}</p>}
                <div className="jobrow__tags">{(job.tags || []).map((tag) => <Tag key={tag} variant="tag--ghost">{tag}</Tag>)}</div>
              </div>
              <div className="jobrow__right">
                <div className="matchbadge"><div className="n">{job.match}%</div><div className="l">match</div></div>
                <span className="jobrow__when">{job.when}</span>
                <div className="jobrow__act">
                  <Button variant="secondary" size="sm" icon="search" onClick={(event) => { event.stopPropagation(); openJob(job); }}>Läs</Button>
                  <Button variant="ghost" size="sm" icon="plus" onClick={(event) => { event.stopPropagation(); handleRemoveJob(job); }}>Ta bort</Button>
                  <Button variant="primary" size="sm" icon="check" onClick={(event) => { event.stopPropagation(); handleApplyJob(job); }}>{accepted ? 'Sparad' : 'Ansök'}</Button>
                </div>
                {err && <p className="livejob-error" role="alert" style={{ margin: '6px 0 0', color: 'var(--ll-coral)', fontSize: 12, fontWeight: 600 }}>{err}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {status !== 'loading' && visibleJobs.length === 0 && (
        <div className="livejob-empty">
          <Icon name="search" size={22} />
          Inga träffar just nu. Prova färre sökord eller slå på fler källor.
        </div>
      )}
    </React.Fragment>
  );
}

export { JobResultsList };
