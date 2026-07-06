import React from 'react';
import { Icon, Button, SectionHeader } from '../components/primitives.jsx';
import { Sidebar } from '../components/shell.jsx';
import { PageTemplate, ContentArea, ContentBox, CrossColumn } from '../components/grid.jsx';
import { DEFAULT_QUERY, FIXED_MUNICIPALITY } from '../api/jobSearch.js';
import { useLiveJobSearch } from '../hooks/useLiveJobSearch.js';
import { useJobs } from '../hooks/useJobs.js';
import { tierize, evidenceChips, jobFlagged, REJECT_REASONS } from '../lib/jobTriage.mjs';
import { getSavedSearches, saveSearch, removeSavedSearch } from '../utils/jobStore.js';

// HelloLilly — Jobbsök (ONE screen on the design-system grid templates). Discovery results ARE the
// approval surface: Daniel triages the durable stored jobs — approve / reject-with-reason / reopen.
// The tiers come from tierize(useJobs().jobs); every decision is written through the ONE decide route
// (useJobs.approve/reject/reopen → caseApi.decideJob), and the ad layover writes the SAME record.
// There is NO component-local decision state and NO localStorage decision path in this screen.

const SOURCE_OPTIONS = [
  { id: 'jobtech', label: 'Platsbanken' },
  { id: 'remoteok', label: 'RemoteOK' },
  { id: 'remotive', label: 'Remotive' },
];
const EMP_TYPES = ['Heltid', 'Deltid', 'Projekt', 'Timanställd'];
const WORK_MODES = ['På plats', 'Distans', 'Hybrid'];

const JOBBSOK_CROSS = [
  { kind: 'Tips', icon: 'filter', title: 'Varför filtrerades ett jobb?', nav: 'Filter', why: 'Så läser du nedrankade träffar' },
  { kind: 'Mall', icon: 'doc', title: 'Checklista innan du söker', nav: 'Checklista', why: 'Fem snabba kontroller' },
  { kind: 'Coach', icon: 'users', title: 'Osäker på en träff?', nav: 'Sara', why: 'Sara kan dubbelkolla' },
];

// A build-a-list-one-at-a-time field: type a word, "Spara" (or Enter) adds it as a chip.
function TokenField({ placeholder, tokens, onAdd, onRemove }) {
  const [val, setVal] = React.useState('');
  const add = () => { const t = val.trim(); if (t && !tokens.includes(t)) { onAdd(t); setVal(''); } };
  return (
    <div className="tokenfield">
      <div className="tokenfield__row">
        <input value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <Button variant="secondary" size="sm" icon="plus" type="button" onClick={add}>Spara</Button>
      </div>
      {tokens.length > 0 && (
        <div className="tokenfield__chips">
          {tokens.map((t) => (
            <span key={t} className="token">{t}<button type="button" aria-label={`Ta bort ${t}`} onClick={() => onRemove(t)}>×</button></span>
          ))}
        </div>
      )}
    </div>
  );
}

function ChipRow({ options, value, onToggle }) {
  return (
    <div className="filterchips">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button key={o} type="button" className={`srcchip ${on ? 'srcchip--on' : ''}`} aria-pressed={on} onClick={() => onToggle(o)}>
            {on && <Icon name="check" size={13} />}{o}
          </button>
        );
      })}
    </div>
  );
}

// Evidence chips — the pipeline's judgment on every row (operability). Derived ONLY from the real
// matchedRules via the pure module; never from fixture fields, never fabricated. `pin` is not in the
// icon set, so stage-1 (location/title/company) uses `target`, stage-2 (body signals) uses `filter`.
function EvidenceChips({ job }) {
  const chips = evidenceChips(job);
  return (
    <div className="jobc__evi" aria-label="Underlag">
      {chips.map((c, i) => (
        <span key={i} className={`evi evi--${c.tone}`}>
          {c.tone === 'src' ? c.label : (<><Icon name={c.stage === 2 ? 'filter' : 'target'} size={11} sw={2.4} />{c.label}</>)}
        </span>
      ))}
    </div>
  );
}

// One triage card. Decisions go through the injected handlers (useJobs.approve/reject/reopen),
// keyed on the store id (job.id) — the same record the layover writes. The reject picker's open/
// selection/note are transient UI state; the decision itself is never held locally.
function JobTriageCard({ job, onApprove, onReject, onReset }) {
  const [picking, setPicking] = React.useState(false);
  const [sel, setSel] = React.useState(job.rejectReason || null);
  const [note, setNote] = React.useState('');
  const decided = job.decision === 'approved' || job.decision === 'rejected';
  const flagged = jobFlagged(job);
  const rr = REJECT_REASONS.find((r) => r.code === job.rejectReason);
  const reasonLabel = rr ? rr.label.sv : job.rejectReason;
  const selIsOther = sel === 'OTHER';
  const canSaveReject = !!sel && (!selIsOther || note.trim().length >= 3);

  const openJob = () => window.dispatchEvent(new CustomEvent('ll:helpful:open', { detail: { ...job, kind: 'jobpreview' } }));
  const openPicker = () => { setSel(job.rejectReason || null); setNote(job.rejectNote || ''); setPicking(true); };
  const saveReject = () => { if (canSaveReject) { onReject(job.id, sel, note.trim() || null); setPicking(false); } };

  return (
    <article className={`jobc ${flagged && !decided ? 'jobc--flagged' : ''} ${job.decision === 'rejected' ? 'jobc--rejected' : ''}`}>
      <div className="jobc__top" role="button" tabIndex={0} style={{ cursor: 'pointer' }}
        onClick={openJob} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openJob(); } }}>
        <span className="jobc__logo">{(job.company || 'J').slice(0, 2).toUpperCase()}</span>
        <div className="jobc__b">
          <div className="jobc__t">{job.title}</div>
          <div className="jobc__meta">
            {job.company && <span>{job.company}</span>}
            {job.location && <><span>·</span><span>{job.location}</span></>}
            {job.source && <span className={`src-pill src-pill--${job.source}`}>{job.source}</span>}
            {job.postedAt && <span>{job.postedAt}</span>}
          </div>
        </div>
        {job.decision === 'approved' && <span className="decided decided--approved"><Icon name="check" size={13} sw={3} />Köad</span>}
        {job.decision === 'rejected' && <span className="decided decided--rejected">Bortvald{reasonLabel ? ' · ' + reasonLabel : ''}</span>}
      </div>

      {job.snippet && <p className="jobc__snippet">{job.snippet}</p>}

      <EvidenceChips job={job} />

      {job.decision === 'rejected' && job.rejectNote && !picking && <p className="jobc__rnote">”{job.rejectNote}”</p>}

      {!picking && !decided && (
        <div className="jobc__acts">
          <Button variant="primary" size="sm" icon="check" onClick={() => onApprove(job.id)}>Godkänn</Button>
          <button type="button" className="btn btn--sm btn--reject" onClick={openPicker}>Välj bort</button>
          {job.url && (
            <a className="jobc__push" href={job.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="sm" icon="arrow">Till annonsen</Button>
            </a>
          )}
        </div>
      )}

      {picking && (
        <div className="reject-pick">
          <div className="reject-pick__h">{decided ? 'Byt anledning — ditt val sparas om' : 'Varför passar den inte? (hjälper Lilly lära)'}</div>
          <div className="reject-pick__opts">
            {REJECT_REASONS.map((r) => (
              <button key={r.code} type="button" className={`reason-chip ${sel === r.code ? 'reason-chip--on' : ''}`} onClick={() => setSel(r.code)}>{r.label.sv}</button>
            ))}
          </div>
          <label className="reject-pick__note">
            <span>{selIsOther ? 'Beskriv kort varför (krävs)' : 'Beskriv gärna varför (frivilligt)'}</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
              placeholder="T.ex. kräver flytt utomlands, lönen för låg …" />
          </label>
          <div className="reject-pick__row">
            <Button variant="primary" size="sm" icon="check" disabled={!canSaveReject} onClick={saveReject}>Spara — välj bort</Button>
            <button type="button" className="linkbtn" onClick={() => setPicking(false)}>Avbryt</button>
          </div>
        </div>
      )}

      {!picking && decided && (
        <div className="jobc__acts">
          {job.decision === 'rejected' && <button type="button" className="linkbtn" onClick={openPicker}>Ändra anledning</button>}
          {job.url && (
            <a className="jobc__push" href={job.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="sm" icon="arrow">Till annonsen</Button>
            </a>
          )}
          <button type="button" className="linkbtn" onClick={() => onReset(job.id)}>Ångra</button>
        </div>
      )}
    </article>
  );
}

// Slim one-row job for the approved / rejected history tiers.
function JobSlimRow({ job, onReset }) {
  const rr = REJECT_REASONS.find((r) => r.code === job.rejectReason);
  const reasonLabel = rr ? rr.label.sv : job.rejectReason;
  return (
    <div className={`jobslim jobslim--${job.decision}`}>
      <span className="jobslim__logo">{(job.company || 'J').slice(0, 2).toUpperCase()}</span>
      <div className="jobslim__b">
        <div className="jobslim__t">{job.title}</div>
        <div className="jobslim__m">
          {job.company && <span>{job.company}</span>}
          {job.location && <><span className="dot" /><span>{job.location}</span></>}
          {reasonLabel && <><span className="dot" /><span className="jobslim__reason">{reasonLabel}</span></>}
        </div>
      </div>
      {job.postedAt && <span className="jobslim__date">{job.postedAt}</span>}
      {job.url && (
        <a className="jobslim__link" href={job.url} target="_blank" rel="noreferrer" aria-label="Till annonsen" title="Till annonsen"><Icon name="arrow" size={15} /></a>
      )}
      <button type="button" className="linkbtn" onClick={() => onReset(job.id)}>Ångra</button>
    </div>
  );
}

// Collapsible section for the down-ranked / decided tiers (flagged is open by default, never hidden).
function TriSection({ title, count, note, defaultOpen = false, children }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="tri-sec">
      <button type="button" className="tri-sec__head" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Icon name="chevron" size={16} className="chev" />
        <span>{title}</span>
        <span className="tri-sec__count">{count}</span>
      </button>
      {open && (
        <React.Fragment>
          {note && <p className="tri-sec__note">{note}</p>}
          <div className="tri-list">{children}</div>
        </React.Fragment>
      )}
    </div>
  );
}

// CSV upload — SHIPS but honestly disabled ("Kopplas snart"). The LinkedIn-export ingest chain is a
// separate follow-up; nothing is parsed or saved here, and the card says so plainly.
function CsvUpload() {
  return (
    <div className="csv">
      <div className="notice-soon">
        <Icon name="lock" size={18} />
        <div>
          <b>Importen är inte kopplad ännu</b>
          <p>Exportera dina sparade LinkedIn-jobb som CSV så dyker de upp bland träffarna att gå igenom. Den riktiga importen (som hämtar hela annonstexten) kopplas på när formatet är klart — tills dess sparas inget.</p>
        </div>
      </div>
      <div className="csv__drop" aria-disabled="true" style={{ cursor: 'not-allowed', opacity: 0.7 }}>
        <span className="csv__drop-ic"><Icon name="download" size={28} /></span>
        <span className="csv__drop-t">Släpp din LinkedIn-CSV här</span>
        <span className="csv__drop-m">Kopplas snart · .csv</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
        <Button variant="primary" icon="check" disabled aria-disabled="true">Importera till listan</Button>
        <span className="soon-tag">Kopplas snart</span>
      </div>
    </div>
  );
}

function JobSearch() {
  // The durable stored jobs = the triage source, read through the SINGLE decision path.
  const { jobs, status: jobsStatus, error: jobsError, reload, approve, reject, reopen, clear } = useJobs();

  // Search runner (runs discovery into the store). auto:false — we triage the stored jobs first;
  // a new discovery run is an explicit user action ("Sök jobb"), not something that fires on mount.
  const { status: searchStatus, error: searchError, runSearch } = useLiveJobSearch(DEFAULT_QUERY, { auto: false });

  const [keywords, setKeywords] = React.useState(DEFAULT_QUERY.keywords.slice());
  const [sources, setSources] = React.useState(DEFAULT_QUERY.sources.slice());
  const [savedSearches, setSavedSearches] = React.useState(() => getSavedSearches());
  const [savedNotice, setSavedNotice] = React.useState('');

  // Extra filters — applied client-side where the ad carries the field; unknowns are kept
  // (never silently dropped). Only anti-keywords are a hard client-side exclude on matched text.
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [empTypes, setEmpTypes] = React.useState([]);
  const [workModes, setWorkModes] = React.useState([]);
  const [minSalary, setMinSalary] = React.useState(0);
  const [includeNoSalary, setIncludeNoSalary] = React.useState(true);
  const [excludeList, setExcludeList] = React.useState([]);
  const [addSrcOpen, setAddSrcOpen] = React.useState(false);
  const [newSrcUrl, setNewSrcUrl] = React.useState('');
  // After a search runs, collapse the search + CSV boxes to thin bars so the triage list rises.
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    const sync = () => setSavedSearches(getSavedSearches());
    window.addEventListener('ll:jobs:changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('ll:jobs:changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const toggleSource = (id) => setSources((cur) => (cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]));
  const toggleIn = (setter) => (v) => setter((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));

  const doSearch = (query) => {
    // runSearch writes discovered jobs into the store server-side; refetch the tiers when it lands.
    runSearch(query).then((payload) => { if (payload) reload(); });
    setCollapsed(true);
  };

  const submit = (e) => {
    e.preventDefault();
    doSearch({ keywords, sources, municipality: FIXED_MUNICIPALITY, maxResults: 20 });
  };

  const handleSaveSearch = () => {
    const s = saveSearch({ keywords, sources, municipality: FIXED_MUNICIPALITY });
    setSavedSearches(getSavedSearches());
    setSavedNotice(`Sparad: ${s.label}`);
    window.setTimeout(() => setSavedNotice(''), 2200);
  };

  const applySaved = (s) => {
    setKeywords(s.keywords.slice());
    setSources(s.sources.slice());
    doSearch({ keywords: s.keywords, sources: s.sources, municipality: FIXED_MUNICIPALITY, maxResults: 20 });
  };

  // Client-side filters. Anti-keywords hard-exclude on matched text; the rest are best-effort and
  // keep unknowns (stored jobs carry no employment/workplace/salary fields yet — so these are inert
  // until ads carry the data, never dropping an ad whose value is unknown).
  const excl = excludeList.map((t) => t.toLowerCase());
  const filtered = React.useMemo(() => (jobs || []).filter((j) => {
    const hay = `${j.title || ''} ${j.company || ''} ${j.snippet || ''}`.toLowerCase();
    if (excl.some((t) => hay.includes(t))) return false;
    if (empTypes.length && j.employmentType && !empTypes.includes(j.employmentType)) return false;
    if (workModes.length && j.workplaceMode && !workModes.includes(j.workplaceMode)) return false;
    if (minSalary > 0 && typeof j.salaryMax === 'number' && j.salaryMax < minSalary) return false;
    if (!includeNoSalary && minSalary > 0 && j.salaryMax == null) return false;
    return true;
  }), [jobs, excl.join('|'), empTypes, workModes, minSalary, includeNoSalary]);

  const { toReview, flagged, approved, rejected } = tierize(filtered);
  const activeFilterCount = empTypes.length + workModes.length + (minSalary > 0 ? 1 : 0) + excludeList.length;
  const salaryLabel = minSalary === 0 ? 'ingen gräns' : (minSalary >= 300000 ? '300k+ kr/mån' : `${Math.round(minSalary / 1000)}k kr/mån`);
  const decidedTotal = approved.length + rejected.length;

  const cross = <CrossColumn title="Efter sökningen" sub="Det som gör träffarna användbara." items={JOBBSOK_CROSS} />;

  const head = (
    <div className="ll-pagehead">
      <div className="ll-pagehead__b">
        <span className="cap" style={{ fontWeight: 700, color: 'var(--ll-blue)' }}>Triage · lagrade jobb</span>
        <h1>Jobbsök</h1>
        <p className="ll-pagehead__sub">Gå igenom hittade jobb ett i taget. Godkänn det som passar, välj bort resten med en anledning — Lilly lär sig av dina val. Kör en ny sökning för att hämta fler.</p>
      </div>
      <div className="ll-pagehead__actions">
        <span className="date">{jobsStatus === 'ready' ? `${filtered.length} jobb` : (jobsStatus === 'pending' ? 'Laddar…' : '')}</span>
      </div>
    </div>
  );

  // The triage tiers, always from tierize(useJobs().jobs) — never from local decision state.
  let tiers;
  if (jobsStatus === 'pending') {
    tiers = <div className="ll-skel" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="ll-skel__bar" style={{ width: `${90 - i * 12}%` }} />)}</div>;
  } else if (jobsStatus === 'failed') {
    tiers = (
      <div className="ll-partstate ll-partstate--fail">
        <h3>Kunde inte hämta jobben</h3>
        <p>{(jobsError && jobsError.message) || 'Försök igen om en stund.'}</p>
        <Button variant="secondary" size="sm" icon="refresh" onClick={reload}>Försök igen</Button>
      </div>
    );
  } else if ((jobs || []).length === 0) {
    tiers = (
      <div className="ll-partstate">
        <h3>Inga jobb ännu</h3>
        <p>Kör en sökning så dyker träffarna upp här att gå igenom. Inget laddas förrän du söker.</p>
        <Button variant="primary" size="sm" icon="search" onClick={() => setCollapsed(false)}>Sök jobb</Button>
      </div>
    );
  } else {
    tiers = (
      <React.Fragment>
        <div className="tri-bar">
          <span className="tri-count"><b>{toReview.length}</b> att gå igenom</span>
          {flagged.length > 0 && <span className="tri-count"><b>{flagged.length}</b> nedrankade</span>}
          {approved.length > 0 && <span className="tri-count tri-count--ok"><b>{approved.length}</b> köade</span>}
          {rejected.length > 0 && <span className="tri-count tri-count--muted"><b>{rejected.length}</b> bortvalda</span>}
          <button type="button" className="linkbtn tri-bar__clear"
            onClick={() => { if (window.confirm('Rensa alla jobb i listan?')) clear(); }}>
            Rensa listan
          </button>
        </div>

        <div className="tri-list">
          {toReview.map((j) => <JobTriageCard key={j.id} job={j} onApprove={approve} onReject={reject} onReset={reopen} />)}
          {toReview.length === 0 && decidedTotal + flagged.length > 0 && <p className="tri-sec__note">Allt genomgånget här uppe — bra jobbat.</p>}
        </div>

        {flagged.length > 0 && (
          <TriSection title="Filtrerade / nedrankade" count={flagged.length} defaultOpen note="Nedrankade men aldrig dolda — chipparna visar varför. Godkänn ändå om flaggan är fel.">
            {flagged.map((j) => <JobTriageCard key={j.id} job={j} onApprove={approve} onReject={reject} onReset={reopen} />)}
          </TriSection>
        )}

        {approved.length > 0 && (
          <TriSection title="Köade att söka" count={approved.length} defaultOpen note="Senaste 10 — slimmad vy.">
            <div className="jobslim-list">{approved.slice(0, 10).map((j) => <JobSlimRow key={j.id} job={j} onReset={reopen} />)}</div>
          </TriSection>
        )}

        {rejected.length > 0 && (
          <TriSection title="Bortvalda" count={rejected.length} note="Sparade med din anledning — senaste 10, du kan ångra.">
            <div className="jobslim-list">{rejected.slice(0, 10).map((j) => <JobSlimRow key={j.id} job={j} onReset={reopen} />)}</div>
          </TriSection>
        )}
      </React.Fragment>
    );
  }

  return (
    <PageTemplate
      label="Jobbsök · sök"
      nav={<Sidebar active="jobbsok" />}
      cross={cross}
      content={<ContentArea>
        {head}

        {/* Collapsed: thin bars so the triage list is at the top; click to expand */}
        {collapsed && (
          <div className="jobsearch-thin">
            <button type="button" className="thincard" onClick={() => setCollapsed(false)}>
              <span className="thincard__ic"><Icon name="search" size={17} /></span>
              <span className="thincard__t">Sök</span>
              <span className="thincard__meta">{keywords.join(', ') || 'alla ord'} · Stockholm</span>
              <span className="thincard__edit"><Icon name="pen" size={13} />Ändra</span>
            </button>
            <button type="button" className="thincard thincard--csv" onClick={() => setCollapsed(false)}>
              <span className="thincard__ic thincard__ic--csv"><Icon name="download" size={17} /></span>
              <span className="thincard__t">Ladda upp CSV</span>
            </button>
          </div>
        )}

        {/* Expanded: search box (wide) beside the CSV upload (narrow) */}
        {!collapsed && (
          <div className="jobsearch-top">
            <ContentBox className="jobsearch jobsearch-controls">
              <form onSubmit={submit} className="jobsearch-form">
                <div className="jobsearch-field">
                  <span className="livejob-lbl">Sökord — lägg till ett i taget</span>
                  <TokenField placeholder="t.ex. head of acquisition" tokens={keywords}
                    onAdd={(t) => setKeywords((cur) => [...cur, t])} onRemove={(t) => setKeywords((cur) => cur.filter((x) => x !== t))} />
                </div>

                <div className="jobsearch-field jobsearch-field--ort">
                  <span className="livejob-lbl">Ort</span>
                  <input className="livejob-select" value="Stockholm (0180)" readOnly aria-label="Ort — fast till Stockholm" />
                  <span className="cap" style={{ marginTop: 6 }}>Orten är fast till Stockholm i denna version.</span>
                </div>

                <div className="jobsearch-field">
                  <span className="livejob-lbl">Källor</span>
                  <div className="livejob-sources" aria-label="Källor">
                    {SOURCE_OPTIONS.map((s) => {
                      const on = sources.includes(s.id);
                      return (
                        <button key={s.id} type="button" className={`srcchip ${on ? 'srcchip--on' : ''}`} aria-pressed={on} onClick={() => toggleSource(s.id)}>
                          {on && <Icon name="check" size={13} />}{s.label}
                        </button>
                      );
                    })}
                    <button type="button" className="srcchip srcchip--add" aria-expanded={addSrcOpen} onClick={() => setAddSrcOpen((o) => !o)}>
                      <Icon name="plus" size={13} />Lägg till källa
                    </button>
                  </div>
                </div>

                {addSrcOpen && (
                  <div className="addsrc">
                    <input value={newSrcUrl} onChange={(e) => setNewSrcUrl(e.target.value)} placeholder="Klistra in en URL till en jobbsida…" />
                    <Button variant="secondary" size="sm" icon="search" type="button" disabled>Kolla källan</Button>
                    <span className="soon-tag">Kollas i bakgrunden · v2</span>
                  </div>
                )}

                <button type="button" className="morefilters__toggle" aria-expanded={moreOpen} onClick={() => setMoreOpen((o) => !o)}>
                  <Icon name="filter" size={15} />Fler filter{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
                  <Icon name="chevron" size={15} className="morefilters__chev" style={{ transform: moreOpen ? 'rotate(90deg)' : 'none' }} />
                </button>

                {moreOpen && (
                  <div className="morefilters">
                    <div className="morefilters__grp">
                      <div className="morefilters__lbl">Anställningsform</div>
                      <ChipRow options={EMP_TYPES} value={empTypes} onToggle={toggleIn(setEmpTypes)} />
                    </div>
                    <div className="morefilters__grp">
                      <div className="morefilters__lbl">Var du jobbar</div>
                      <ChipRow options={WORK_MODES} value={workModes} onToggle={toggleIn(setWorkModes)} />
                    </div>
                    <div className="morefilters__grp">
                      <div className="morefilters__lbl">Lägsta lön <span className="morefilters__val">{salaryLabel}</span></div>
                      <input type="range" className="salslider" min={0} max={300000} step={5000} value={minSalary} onChange={(e) => setMinSalary(Number(e.target.value))} />
                      <label className="morefilters__toggle-row">
                        <input type="checkbox" checked={includeNoSalary} onChange={(e) => setIncludeNoSalary(e.target.checked)} />
                        <span>Ta med annonser utan löneuppgift</span>
                      </label>
                    </div>
                    <div className="morefilters__grp">
                      <div className="morefilters__lbl">Uteslut sökord — ett i taget</div>
                      <TokenField placeholder="t.ex. junior" tokens={excludeList}
                        onAdd={(t) => setExcludeList((cur) => [...cur, t])} onRemove={(t) => setExcludeList((cur) => cur.filter((x) => x !== t))} />
                    </div>
                    <p className="morefilters__note"><Icon name="bulb" size={13} />Filtren används där uppgiften finns i annonsen — annars tas annonsen med ändå.</p>
                  </div>
                )}

                {(savedSearches.length > 0 || savedNotice) && (
                  <div className="saved-searches">
                    <div className="saved-searches__head">
                      <b>Sparade sökningar</b>
                      {savedNotice && <span>{savedNotice}</span>}
                    </div>
                    <div className="saved-searches__list">
                      {savedSearches.map((s) => (
                        <div className="saved-search" key={s.id}>
                          <button type="button" onClick={() => applySaved(s)}><Icon name="search" size={14} /><span>{s.label}</span></button>
                          <button type="button" aria-label={`Ta bort ${s.label}`} onClick={() => { removeSavedSearch(s.id); setSavedSearches(getSavedSearches()); }}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="jobsearch-cta">
                  <Button variant="secondary" icon="heart" type="button" onClick={handleSaveSearch}>Spara sökning</Button>
                  <Button variant="primary" icon="search" disabled={searchStatus === 'loading'}>
                    {searchStatus === 'loading' ? 'Söker…' : 'Sök jobb'}
                  </Button>
                </div>
              </form>
            </ContentBox>

            <ContentBox className="jobsearch-csv ll-box--csv">
              <div className="csvcard__head">
                <div className="csvcard__ic"><Icon name="download" size={20} /></div>
                <div>
                  <h3>Lägg till från LinkedIn</h3>
                  <p>Sparade jobb på LinkedIn? Exportera dem som CSV — de dyker upp bland träffarna att gå igenom.</p>
                </div>
              </div>
              <CsvUpload />
            </ContentBox>
          </div>
        )}

        {/* Results (full width) — triage right here: approve / reject / reopen, no separate page */}
        <ContentBox className="jobsearch jobsearch-live">
          <div className="feedbackline livejob-summary">
            <Icon name={searchStatus === 'error' ? 'lock' : 'sparkle'} size={18} style={{ color: searchStatus === 'error' ? 'var(--ll-coral)' : 'var(--ll-blue)' }} />
            {searchStatus === 'error'
              ? searchError
              : (searchStatus === 'loading' ? 'Söker live via HelloLilly-backend…' : 'Triagera de lagrade jobben nedan. Kör en ny sökning för att hämta fler.')}
          </div>

          <SectionHeader title="Träffar att gå igenom" sub="Godkänn det som passar, välj bort resten — matchanalysen kommer efter" seeAll={null} />

          {tiers}
        </ContentBox>
      </ContentArea>}
    />
  );
}

export { JobSearch };
