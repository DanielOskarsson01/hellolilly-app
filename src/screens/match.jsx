import React from 'react';
import { Icon, Clover, Button, Tag, SectionHeader } from '../components/primitives.jsx';
import { Sidebar } from '../components/shell.jsx';
import { ToolHeader } from './cvActivity.jsx';
import { getAcceptedJobs, jobKey, removeAcceptedJob } from '../utils/jobStore.js';

// HelloLilly — Matchanalys
// Shows only jobs the user accepted from Jobbsök, then opens the analysis flow.

function JobMatchReview() {
  const [acceptedJobs, setAcceptedJobs] = React.useState(() => getAcceptedJobs());

  React.useEffect(() => {
    const sync = () => setAcceptedJobs(getAcceptedJobs());
    window.addEventListener('ll:jobs:changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('ll:jobs:changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const openAnalysis = (job) => {
    window.dispatchEvent(new CustomEvent('ll:helpful:open', { detail: { kind: 'job-analysis', job } }));
  };

  const removeJob = (job) => {
    removeAcceptedJob(job);
    setAcceptedJobs(getAcceptedJobs());
  };

  return (
    <div className="ll app app--warm" data-screen-label="Matchanalys">
      <Sidebar active="match" />
      <div className="main">
        <ToolHeader title="Matchanalys">
          <a className="btn btn--secondary btn--sm" href="#jobbsok">
            <Icon name="search" size={16} />
            Till Jobbsök
          </a>
        </ToolHeader>

        <div className="content content--narrow" style={{ paddingTop:18, maxWidth:980, margin:'0 auto', width:'100%' }}>
          <section className="match-queue-hero">
            <div className="match-queue-hero__mark"><Clover size={36} color="#fff" /></div>
            <div>
              <span className="cap" style={{ fontWeight:800, color:'var(--ll-blue)' }}>Ansökningar från Jobbsök</span>
              <h1>Analysera de jobb du valt att gå vidare med</h1>
              <p>
                Den här listan fylls bara av jobb där du klickat Ansök i Jobbsök. När du klickar Analysera öppnas annonsen i Lillys analysflöde mot CV-byggarens sektioner.
              </p>
            </div>
            <span className="date">{acceptedJobs.length} sparade jobb</span>
          </section>

          {acceptedJobs.length === 0 ? (
            <div className="card card--pad match-empty">
              <Icon name="target" size={30} />
              <h2>Inga jobb redo för analys än</h2>
              <p>Gå till Jobbsök, läs annonserna och klicka Ansök på de roller du vill granska mot CV:t.</p>
              <a className="btn btn--primary btn--lg" href="#jobbsok">
                <Icon name="search" size={19} />
                Sök jobb
              </a>
            </div>
          ) : (
            <div className="card card--pad match-queue">
              <SectionHeader title="Jobb att analysera" sub="Endast accepterade jobb från Jobbsök" seeAll={null} />
              <div className="accepted-jobs">
                {acceptedJobs.map((job) => (
                  <article className="accepted-job" key={jobKey(job)}>
                    <div className="joblogo" style={{ background: job.logo || '#2B6CF0' }}>{(job.co || 'JO').slice(0,2).toUpperCase()}</div>
                    <div className="accepted-job__body">
                      <div className="accepted-job__top">
                        <h2>{job.t}</h2>
                        {/* Search-signal score from Jobbsök — the real match % comes from the analysis. */}
                        <span className="matchbadge"><span className="n">{job.match ? `${job.match}%` : '—'}</span><span className="l">signal</span></span>
                      </div>
                      <div className="jobrow__sub">{job.co}<span className="sep" />{job.city}<span className="sep" />{job.type}</div>
                      {job.snippet && <p>{job.snippet}</p>}
                      <div className="jobrow__tags">
                        {job.caseId && <Tag variant="tag--green">Analyserad</Tag>}
                        {(job.tags || []).slice(0, 4).map((tag) => <Tag key={tag} variant="tag--ghost">{tag}</Tag>)}
                      </div>
                    </div>
                    <div className="accepted-job__actions">
                      <Button variant="primary" size="sm" icon="target" onClick={() => openAnalysis(job)}>{job.caseId ? 'Öppna analys' : 'Analysera'}</Button>
                      <Button variant="ghost" size="sm" icon="plus" onClick={() => removeJob(job)}>Ta bort</Button>
                      {job.url && (
                        <a className="btn btn--secondary btn--sm" href={job.url} target="_blank" rel="noreferrer">
                          Original
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { JobMatchReview };
