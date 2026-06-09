import React from 'react';
import { Button, Icon, Tag } from './primitives.jsx';
import {
  acceptJob,
  getAcceptedJobs,
  getRemovedJobIds,
  jobKey,
  removeJob,
} from '../utils/jobStore.js';

function JobResultsList({ jobs = [], status = 'success' }) {
  const [removedIds, setRemovedIds] = React.useState(() => getRemovedJobIds());
  const [acceptedIds, setAcceptedIds] = React.useState(() => getAcceptedJobs().map((job) => jobKey(job)));

  React.useEffect(() => {
    const sync = () => {
      setRemovedIds(getRemovedJobIds());
      setAcceptedIds(getAcceptedJobs().map((job) => jobKey(job)));
    };
    window.addEventListener('ll:jobs:changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('ll:jobs:changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const visibleJobs = React.useMemo(
    () => jobs.filter((job) => !removedIds.includes(jobKey(job))),
    [jobs, removedIds],
  );

  const openJob = (job) => {
    window.dispatchEvent(new CustomEvent('ll:helpful:open', { detail: { ...job, kind: 'job' } }));
  };

  const handleRemoveJob = (job) => {
    removeJob(job);
    setRemovedIds(getRemovedJobIds());
  };

  const handleApplyJob = (job) => {
    acceptJob(job);
    setAcceptedIds(getAcceptedJobs().map((item) => jobKey(item)));
  };

  return (
    <React.Fragment>
      <div className="joblist">
        {visibleJobs.map((job) => {
          const accepted = acceptedIds.includes(jobKey(job));
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
