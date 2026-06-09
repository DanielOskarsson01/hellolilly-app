import React from 'react';
import { Icon, Button, SectionHeader } from '../components/primitives.jsx';
import { JobResultsList } from '../components/jobResultsList.jsx';
import { Sidebar, Topbar } from '../components/shell.jsx';
import { DEFAULT_QUERY, FIXED_MUNICIPALITY, normalizeJobQuery } from '../api/jobSearch.js';
import { useLiveJobSearch } from '../hooks/useLiveJobSearch.js';
import {
  getLatestJobSearch,
  getSavedSearches,
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
  const initialQuery = normalizeJobQuery(latestSearch?.query || DEFAULT_QUERY);
  const [terms, setTerms] = React.useState((initialQuery.keywords || DEFAULT_QUERY.keywords).join(', '));
  const [sources, setSources] = React.useState(initialQuery.sources || DEFAULT_QUERY.sources);
  const municipality = FIXED_MUNICIPALITY;
  const [savedSearches, setSavedSearches] = React.useState(() => getSavedSearches());
  const [savedNotice, setSavedNotice] = React.useState('');
  const { jobs, meta, summary, status, error, runSearch } = useLiveJobSearch(initialQuery);

  React.useEffect(() => {
    const sync = () => {
      setSavedSearches(getSavedSearches());
    };
    window.addEventListener('ll:jobs:changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('ll:jobs:changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

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
      municipality: FIXED_MUNICIPALITY,
      maxResults: 20,
    });
  };

  const currentSearch = () => ({
    keywords: parseTerms(terms),
    sources,
    municipality: FIXED_MUNICIPALITY,
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
    runSearch({
      keywords: search.keywords,
      sources: search.sources,
      municipality: FIXED_MUNICIPALITY,
      maxResults: 20,
    });
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
                    readOnly
                    placeholder="0180"
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
              <JobResultsList jobs={jobs} status={status} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export { JobSearch };
