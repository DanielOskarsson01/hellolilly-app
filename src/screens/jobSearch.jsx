import React from 'react';
import { Icon, Tag, Button, SectionHeader } from '../components/primitives.jsx';
import { Sidebar, Topbar } from '../components/shell.jsx';
import { DEFAULT_QUERY } from '../api/jobSearch.js';
import { useLiveJobSearch } from '../hooks/useLiveJobSearch.js';
import {
  acceptJob,
  getAcceptedJobs,
  getLatestJobSearch,
  getRemovedJobIds,
  getSavedSearches,
  jobKey,
  removeJob,
  removeSavedSearch,
  saveSearch,
} from '../utils/jobStore.js';

const SOURCE_OPTIONS = [
  { id: 'jobtech', label: 'Platsbanken' },
  { id: 'remoteok', label: 'RemoteOK' },
  { id: 'remotive', label: 'Remotive' },
];

function parseTerms(value) {
  return value.split(',').map((term) => term.trim()).filter(Boolean);
}

function JobSearch() {
  const latestSearch = React.useMemo(() => getLatestJobSearch(), []);
  const initialQuery = latestSearch?.query || DEFAULT_QUERY;
  const [terms, setTerms] = React.useState((initialQuery.keywords || DEFAULT_QUERY.keywords).join(', '));
  const [sources, setSources] = React.useState(initialQuery.sources || DEFAULT_QUERY.sources);
  const [municipality, setMunicipality] = React.useState(initialQuery.municipality || DEFAULT_QUERY.municipality);
  const [savedSearches, setSavedSearches] = React.useState(() => getSavedSearches());
  const [removedIds, setRemovedIds] = React.useState(() => getRemovedJobIds());
  const [acceptedIds, setAcceptedIds] = React.useState(() => getAcceptedJobs().map((job) => jobKey(job)));
  const [savedNotice, setSavedNotice] = React.useState('');
  const { jobs, meta, summary, status, error, runSearch } = useLiveJobSearch(initialQuery);

  React.useEffect(() => {
    const sync = () => {
      setSavedSearches(getSavedSearches());
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

  const toggleSource = (id) => {
    setSources((current) => current.includes(id)
      ? current.filter((source) => source !== id)
      : [...current, id]);
  };

  const submit = (event) => {
    event.preventDefault();
    runSearch({
      keywords: parseTerms(terms),
      sources,
      municipality,
      maxResults: 20,
    });
  };

  const currentSearch = () => ({
    keywords: parseTerms(terms),
    sources,
    municipality,
  });

  const handleSaveSearch = () => {
    const saved = saveSearch(currentSearch());
    setSavedSearches(getSavedSearches());
    setSavedNotice(`Sparad: ${saved.label}`);
    window.setTimeout(() => setSavedNotice(''), 2200);
  };

  const applySavedSearch = (search) => {
    setTerms(search.keywords.join(', '));
    setSources(search.sources);
    setMunicipality(search.municipality || '');
    runSearch({
      keywords: search.keywords,
      sources: search.sources,
      municipality: search.municipality,
      maxResults: 20,
    });
  };

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
    <div className="ll app app--lively" data-screen-label="Jobbsok">
      <Sidebar active="jobbsok" />
      <div className="main">
        <Topbar />
        <div className="content content--narrow home2" style={{ paddingTop:14 }}>
          <section>
            <div className="hero-greet">
              <div>
                <span className="cap" style={{ fontWeight:700, color:'var(--ll-blue)' }}>Live API-sökning</span>
                <h1>Jobbsök</h1>
                <p className="muted" style={{ fontSize:15.5, marginTop:6 }}>
                  Söker direkt i Platsbanken/JobTech, RemoteOK och Remotive och sparar de jobb du vill gå vidare med.
                </p>
              </div>
              <span className="date">{status === 'loading' ? 'Söker...' : `${jobs.length} träffar`}</span>
            </div>
          </section>

          <section>
            <div className="card card--pad jobsearch jobsearch-live">
              <form className="livejob-form" onSubmit={submit}>
                <label>
                  <span>Sökord</span>
                  <input
                    value={terms}
                    onChange={(event) => setTerms(event.target.value)}
                    placeholder="lager, logistik, truck"
                  />
                </label>
                <label>
                  <span>Kommunkod</span>
                  <input
                    value={municipality}
                    onChange={(event) => setMunicipality(event.target.value)}
                    placeholder="1980"
                  />
                </label>
                <div className="livejob-sources" aria-label="Källor">
                  {SOURCE_OPTIONS.map((source) => (
                    <button
                      key={source.id}
                      type="button"
                      className={`term ${sources.includes(source.id) ? '' : 'term--add'}`}
                      onClick={() => toggleSource(source.id)}
                    >
                      {sources.includes(source.id) && <Icon name="check" size={13} />}
                      {source.label}
                    </button>
                  ))}
                </div>
                <Button variant="secondary" icon="heart" type="button" onClick={handleSaveSearch}>
                  Spara sökning
                </Button>
                <Button variant="primary" icon="search" disabled={status === 'loading'}>
                  {status === 'loading' ? 'Söker...' : 'Sök jobb'}
                </Button>
              </form>

              {(savedSearches.length > 0 || savedNotice) && (
                <div className="saved-searches">
                  <div className="saved-searches__head">
                    <b>Sparade sökningar</b>
                    {savedNotice && <span>{savedNotice}</span>}
                  </div>
                  <div className="saved-searches__list">
                    {savedSearches.map((search) => (
                      <div className="saved-search" key={search.id}>
                        <button type="button" onClick={() => applySavedSearch(search)}>
                          <Icon name="search" size={14} />
                          <span>{search.label}</span>
                        </button>
                        <button
                          type="button"
                          aria-label={`Ta bort ${search.label}`}
                          onClick={() => removeSavedSearch(search.id)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="feedbackline livejob-summary">
                <Icon name={status === 'error' ? 'lock' : 'sparkle'} size={18} style={{ color: status === 'error' ? 'var(--ll-coral)' : 'var(--ll-blue)' }} />
                {status === 'error'
                  ? error
                  : summary?.description || 'Live API-resultat laddas från de valda jobbkällorna.'}
                {meta && <span className="cap">{meta.api_calls || 0} API-anrop · {meta.sources?.join(', ')}</span>}
              </div>

              <SectionHeader title="Live-resultat" sub="Klicka på ett jobb för att läsa annonsen" seeAll={null} />
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
                    <div className="joblogo" style={{ background:job.logo }}>{job.co.slice(0,2).toUpperCase()}</div>
                    <div className="jobrow__main">
                      <div className="jobrow__t">{job.t}{job.hot && <span style={{ color:'var(--ll-coral)', fontSize:12, fontWeight:800, marginLeft:8 }}>● Het</span>}</div>
                      <div className="jobrow__sub">{job.co}<span className="sep" />{job.city}<span className="sep" />{job.type}</div>
                      {job.snippet && <p className="livejob-snippet">{job.snippet}</p>}
                      <div className="jobrow__tags">{job.tags.map((tag) => <Tag key={tag} variant="tag--ghost">{tag}</Tag>)}</div>
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
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export { JobSearch };
