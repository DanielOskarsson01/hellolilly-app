import React from 'react';
import { Icon, Clover, Photo, Avatar, Button, Tag, SectionHeader } from './primitives.jsx';
import { acceptJob, getAcceptedJobs, jobKey, removeJob, setJobCase, setActiveCaseId } from '../utils/jobStore.js';
import { createCase, decideJob } from '../api/caseApi.js';
import { useCase } from '../hooks/useCase.js';
import { REJECT_REASONS } from '../lib/jobTriage.mjs';

// HelloLilly — Helpful Now layover
// Opens when a Helpful Now item is clicked (custom event `ll:helpful:open`).
// One fully-detailed example (the "Skriv ett CV som tål en lucka" video) shows
// the eventual pattern: media + author + body + comments + deep links to tools.
// Other items fall back to a small placeholder ("content kommer snart").

const RICH_CONTENT = {
  'cv-gap-video': {
    kind: 'Video',
    title: 'Skriv ett CV som tål en lucka',
    duration: '4:12',
    coach: { name: 'Sara Lind', role: 'Karriärcoach · HelloLilly', tone: 'av-c3' },
    eyebrow: 'Video från din coach',
    summary:
      'Ett glapp i CV:t är inget fel — det är ett kapitel som behöver rätt ram. Sara visar tre enkla sätt att skriva om luckan så att den känns trygg för dig och tydlig för rekryteraren.',
    learn: [
      'Hur du nämner ett glapp utan att be om ursäkt',
      'Tre fraser som vänder oro till styrka',
      'Vad du faktiskt gjorde under tiden — och varför det räknas',
    ],
    deeplinks: [
      { ic:'cv',     tint:'ic-blue',  href:'#cv',      t:'Öppna CV-byggaren',     m:'Använd fraserna direkt i ditt CV' },
      { ic:'letter', tint:'ic-lilac', href:'#letter',  t:'Skriv personligt brev', m:'Vänd luckan till en styrka i brevet' },
      { ic:'users',  tint:'ic-green', href:'#review',  t:'Be Sara granska',       m:'Hon svarar oftast samma dag' },
      { ic:'library',tint:'ic-amber', href:'#library', t:'Mallar och exempel',    m:'Färdiga formuleringar att kopiera' },
    ],
    templates: [
      { t:'Formulering: studier på egen hand', m:'En mening som funkar nästan alltid' },
      { t:'Formulering: hand om familj eller hälsa', m:'Varmt och tydligt – utan detaljer' },
      { t:'Formulering: tid mellan jobb', m:'Visar vad du faktiskt tog med dig' },
    ],
    comments: [
      { who:'Linnea', tone:'av-c2', when:'2 dgr sedan', text:'Den här gjorde mig så mycket lugnare. Jag testade fras nr 2 i går och fick napp i morse 💙' },
      { who:'Omar',   tone:'av-c1', when:'1 vecka sedan', text:'Bra påminnelse om att skriva vad jag GJORDE under glappet, inte bara att det fanns. Tack Sara!' },
      { who:'Eva',    tone:'av-c4', when:'2 veckor sedan', text:'Kan ni göra en motsvarande för någon som har två kortare luckor? Mitt CV ser lite hackigt ut.' },
    ],
    related: [
      { kind:'Mall',       title:'Erfarenhetssektion till CV',     why:'Strukturen Sara använder' },
      { kind:'Diskussion', title:'Förklara en lucka i CV:t',       why:'12 jobbsökare delar tips' },
      { kind:'Video',      title:'Så läser en rekryterare ett CV', why:'Vad de tittar på först' },
    ],
  },
};

function HelpfulLayoverContent({ item }) {
  // A search-result row opens the light preview + decision surface (NOT the full analysis and
  // NOT an iframe of the posting). Placed before kind:'job' so it never falls through to it.
  if (item && item.kind === 'jobpreview') return <JobPreviewContent job={item} />;
  if (item && item.kind === 'job') return <JobDescriptionContent job={item} />;
  if (item && item.kind === 'job-analysis') {
    const job = item.job || item;
    // Keyed by job so switching items never reuses another job's caseId/pipeline state.
    return <JobAnalysisContent key={jobKey(job)} job={job} />;
  }

  const rich = item && item.id && RICH_CONTENT[item.id];
  if (!rich) {
    // Stub view for items we haven't authored full content for yet.
    return (
      <div className="lay__stub">
        <Clover size={42} color="#2B6CF0" />
        <h2>{item ? item.title : ''}</h2>
        <p>{item && item.why}</p>
        <p className="cap" style={{ marginTop:14 }}>Det här innehållet är på väg. Kom snart tillbaka — eller säg till Sara om du vill att vi prioriterar det.</p>
        <Button variant="secondary" icon="letter">Skriv till Sara</Button>
      </div>
    );
  }

  return (
    <React.Fragment>
      {/* Hero: video player placeholder */}
      <div className="lay__media">
        <Photo tone="ph--sky" clover person label={null} />
        <span className="lay__media-len">{rich.duration}</span>
        <div className="lay__media-play"><span><Icon name="play" size={26} /></span></div>
      </div>

      <div className="lay__body">

        <span className="helpitem__kind helpitem__kind--video" style={{ alignSelf:'flex-start' }}>{rich.eyebrow || rich.kind}</span>
        <h1 className="lay__title">{rich.title}</h1>

        {/* Coach byline */}
        <div className="lay__byline">
          <Avatar name={rich.coach.name} size="sm" tone={rich.coach.tone} clover />
          <div>
            <div className="lay__byline-nm">{rich.coach.name}</div>
            <div className="lay__byline-rl">{rich.coach.role}</div>
          </div>
          <span className="coach__status" style={{ marginLeft:'auto' }}><span className="dot" />Online</span>
        </div>

        {/* Summary */}
        <p className="lay__summary">{rich.summary}</p>

        {/* What you'll learn */}
        <div className="lay__learn">
          <div className="lay__learn-h">Du tar med dig</div>
          {rich.learn.map((l, i) => (
            <div className="lay__learn-li" key={i}><Icon name="check" size={16} sw={2.6} />{l}</div>
          ))}
        </div>

        {/* Deep links to tools */}
        <SectionHeader title="Använd det här direkt" sub="Hopp till verktyget eller mallen" />
        <div className="lay__deeps">
          {rich.deeplinks.map((d, i) => (
            <a key={i} href={d.href} className="lay__deep" onClick={() => window.dispatchEvent(new CustomEvent('ll:helpful:close'))}>
              <div className={`lay__deep-ic ${d.tint}`}><Icon name={d.ic} size={20} /></div>
              <div className="lay__deep-b">
                <div className="lay__deep-t">{d.t}</div>
                <div className="lay__deep-m">{d.m}</div>
              </div>
              <Icon name="arrow" size={16} className="lay__deep-go" />
            </a>
          ))}
        </div>

        {/* Templates */}
        <SectionHeader title="Färdiga formuleringar" sub="Tre korta meningar du kan kopiera" />
        <div className="lay__tpls">
          {rich.templates.map((t, i) => (
            <div key={i} className="lay__tpl">
              <div className="lay__tpl-ic"><Icon name="doc" size={18} /></div>
              <div className="lay__tpl-b">
                <div className="lay__tpl-t">{t.t}</div>
                <div className="lay__tpl-m">{t.m}</div>
              </div>
              <button className="lay__tpl-go">Kopiera</button>
            </div>
          ))}
        </div>

        {/* Comments */}
        <SectionHeader title="Vad andra säger" sub={`${rich.comments.length} kommentarer`} />
        <div className="lay__comments">
          {rich.comments.map((c, i) => (
            <div key={i} className="lay__comment">
              <Avatar name={c.who} size="sm" tone={c.tone} />
              <div className="lay__comment-b">
                <div className="lay__comment-h">
                  <strong>{c.who}</strong>
                  <span className="cap">{c.when}</span>
                </div>
                <p>{c.text}</p>
              </div>
            </div>
          ))}
          <div className="lay__composer">
            <Avatar name="Amir" size="sm" tone="av-c1" />
            <input type="text" placeholder="Skriv något snällt eller fråga om något…" />
            <button className="lay__composer-send" aria-label="Skicka"><Icon name="send" size={17} /></button>
          </div>
        </div>

        {/* Related items */}
        <SectionHeader title="Relaterat" sub="Mer som hör ihop med det här" />
        <div className="lay__related">
          {rich.related.map((r, i) => {
            const kindClass = r.kind.toLowerCase().replace('ö','o');
            return (
              <button key={i} className="helpitem">
                <span className={`helpitem__kind helpitem__kind--${kindClass}`}>{r.kind}</span>
                <div className="helpitem__title">{r.title}</div>
                {r.why && <div className="helpitem__why">{r.why}</div>}
              </button>
            );
          })}
        </div>

      </div>
    </React.Fragment>
  );
}

function HelpfulLayover() {
  const [item, setItem] = React.useState(null);
  const open = item !== null;

  React.useEffect(() => {
    const onOpen  = (e) => setItem(e.detail);
    const onClose = () => setItem(null);
    const onKey   = (e) => { if (e.key === 'Escape') setItem(null); };
    const onHash  = () => setItem(null);
    window.addEventListener('ll:helpful:open', onOpen);
    window.addEventListener('ll:helpful:close', onClose);
    window.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', onHash);
    return () => {
      window.removeEventListener('ll:helpful:open', onOpen);
      window.removeEventListener('ll:helpful:close', onClose);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('hashchange', onHash);
    };
  }, []);

  // Body scroll lock while open
  React.useEffect(() => {
    if (open) document.body.classList.add('lay-open');
    else document.body.classList.remove('lay-open');
  }, [open]);

  return (
    <React.Fragment>
      <div className={`lay-scrim ${open ? 'lay-scrim--open' : ''}`} onClick={() => setItem(null)} aria-hidden={!open} />
      <div className={`lay ${open ? 'lay--open' : ''}`} role="dialog" aria-modal="true" aria-hidden={!open}>
        <button className="lay__close" onClick={() => setItem(null)} aria-label="Stäng">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
        <div className="lay__scroll">
          {open && <HelpfulLayoverContent item={item} />}
        </div>
      </div>
    </React.Fragment>
  );
}

/* ============================================================
   Job description + match-analysis content
   Jobbsök opens a plain job description. Matchanalys opens the
   analysis flow for an accepted job.
   ============================================================ */

// The ad layover as a DECISION surface (kind:'jobpreview'). Shows OUR stored copy of the ad
// (title/company/location/our snippet — NOT an <iframe>, which job boards block), the honest
// "no analysis yet" note, and a decision bar: Godkänn / Välj bort (8-reason taxonomy + note) /
// Till annonsen. Godkänn/Välj bort write the ONE record via caseApi.decideJob(job.id, ...), which
// dispatches ll:jobs:changed — so the screen row reflects the decision immediately. The picker's
// open/sel/note are transient UI state only; the decision itself is never held locally.
function JobPreviewContent({ job }) {
  const close = () => window.dispatchEvent(new CustomEvent('ll:helpful:close'));
  const [picking, setPicking] = React.useState(false);
  const [sel, setSel] = React.useState(job.rejectReason || null);
  const [note, setNote] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState(null);

  const selIsOther = sel === 'OTHER';
  const canSaveReject = !!sel && (!selIsOther || note.trim().length >= 3);

  const write = async (fn) => {
    setBusy(true);
    setErr(null);
    try { await fn(); close(); }
    catch (e) { setErr(e.message || 'Kunde inte spara beslutet'); setBusy(false); }
  };
  const approve = () => write(() => decideJob(job.id, { decision: 'approved' }));
  const saveReject = () => { if (canSaveReject) write(() => decideJob(job.id, { decision: 'rejected', reason: sel, note: note.trim() || null })); };

  const company = job.co || job.company;
  const city = job.city || job.location;
  const title = job.t || job.title;

  return (
    <div className="lay__body">
      <span className="helpitem__kind helpitem__kind--tips" style={{ alignSelf: 'flex-start' }}>Sökträff</span>

      {/* our stored header copy — company / location / provider / posted */}
      <div className="lay-match__co" style={{ marginTop: 4 }}>
        <div className="lay-match__logo" style={{ background: '#fff', color: job.logo || '#2B6CF0' }}>
          {(company || 'CO').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="lay-match__co-nm">{company}</div>
          <div className="lay-match__co-meta">
            {city}{job.source ? ' · ' + job.source : ''}{job.postedAt ? ' · ' + job.postedAt : ''}
          </div>
        </div>
      </div>
      <h1 className="lay-match__title" style={{ marginTop: 10 }}>{title}</h1>

      {/* our stored ad body (snippet) — NOT an iframe of the posting */}
      {job.snippet && <p className="lay__summary">{job.snippet}</p>}

      {/* honest: no match analysis yet — that happens after triage + scrape */}
      <div className="jobprev-note">
        <Icon name="bulb" size={17} />
        <div>
          <b>Ingen analys än</b>
          <p>Annonsen laddas ner och matchas mot ditt CV först när den gått igenom triage. Då får du full matchanalys med poäng och luckor.</p>
        </div>
      </div>

      {/* decision bar: Godkänn / Välj bort (2-col grid) + Till annonsen. Both decisions write the
          ONE record via decideJob; the reject picker (8-reason taxonomy + note) replaces the bar. */}
      {!picking ? (
        <React.Fragment>
          <div className="lay-match__actions">
            <Button variant="primary" size="sm" icon="check" disabled={busy} onClick={approve}>Godkänn</Button>
            <button type="button" className="btn btn--sm btn--reject" disabled={busy}
              onClick={() => { setSel(job.rejectReason || null); setNote(job.rejectNote || ''); setPicking(true); }}>Välj bort</button>
          </div>
          {job.url && (
            <a className="jobdesc__external" href={job.url} target="_blank" rel="noopener noreferrer">
              Till annonsen <Icon name="arrow" size={16} />
            </a>
          )}
        </React.Fragment>
      ) : (
        <div className="reject-pick" style={{ margin: '4px 28px 20px' }}>
          <div className="reject-pick__h">Varför passar den inte? (hjälper Lilly lära)</div>
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
            <Button variant="primary" size="sm" icon="check" disabled={!canSaveReject || busy} onClick={saveReject}>Spara — välj bort</Button>
            <button type="button" className="linkbtn" onClick={() => setPicking(false)}>Avbryt</button>
          </div>
        </div>
      )}

      {err && <p className="cap" style={{ color: 'var(--ll-coral)', margin: '4px 28px 16px' }}>{err}</p>}
    </div>
  );
}

function JobDescriptionContent({ job }) {
  const [accepted, setAccepted] = React.useState(() => getAcceptedJobs().some((item) => jobKey(item) === jobKey(job)));

  const onApply = () => {
    acceptJob(job);
    setAccepted(true);
  };

  const onRemove = () => {
    removeJob(job);
    window.dispatchEvent(new CustomEvent('ll:helpful:close'));
  };

  return (
    <React.Fragment>
      <div className="jobdesc__head">
        <div className="jobdesc__logo" style={{ background: job.logo || '#2B6CF0' }}>{(job.co || 'JO').slice(0, 2).toUpperCase()}</div>
        <div>
          <span className="helpitem__kind">Jobbannons</span>
          <h1 className="jobdesc__title">{job.t}</h1>
          <div className="jobdesc__meta">{job.co} · {job.city} · {job.type}{job.when ? ` · ${job.when}` : ''}</div>
        </div>
      </div>

      <div className="jobdesc__actions">
        <Button variant="ghost" size="sm" icon="plus" onClick={onRemove}>Ta bort</Button>
        <Button variant="primary" size="sm" icon="check" onClick={onApply}>{accepted ? 'Sparad till Matchanalys' : 'Ansök'}</Button>
      </div>

      {Array.isArray(job.tags) && job.tags.length > 0 && (
        <div className="jobdesc__tags">
          {job.tags.map((tag) => <Tag key={tag} variant="tag--ghost">{tag}</Tag>)}
        </div>
      )}

      <div className="jobdesc__body">
        <h2>Jobbeskrivning</h2>
        <p>{job.snippet || 'Ingen beskrivning fanns i sökresultatet. Öppna originalannonsen för full text.'}</p>
      </div>

      <div className="jobdesc__note">
        <Icon name="doc" size={18} />
        <span>Den här vyn visar bara annonsens text. För analys: lägg jobbet som ansökan och öppna det från Matchanalys.</span>
      </div>

      {job.url && (
        <a className="jobdesc__external" href={job.url} target="_blank" rel="noreferrer">
          Öppna originalannons <Icon name="arrow" size={16} />
        </a>
      )}
    </React.Fragment>
  );
}

// The real analysis pipeline, driven by CASE PART STATUSES — not a timed animation.
// create case -> POST /research (dossiers + decodedRole) -> POST /analyze (fit + gaps)
// -> render the honest fit. CV + cover letter generation kicks off in the background
// once analysis is ready (the reconciled A2 design: background generation, no screen).
const ANALYSIS_STEPS = [
  { part: 'case', label: 'Skapar ärende' },
  { part: 'dossiers', label: 'Research: företag, produkt, människor, nisch' },
  { part: 'decodedRole', label: 'Avkodar det verkliga jobbet bakom annonsen' },
  { part: 'fit', label: 'Analyserar matchning mot dina datafakta' },
];

function JobAnalysisContent({ job }) {
  const [caseId, setCaseId] = React.useState(job.caseId || null);
  const [setupError, setSetupError] = React.useState(null);
  const [runError, setRunError] = React.useState(null);
  const started = React.useRef({});
  const { caseData, error, running, actions } = useCase(caseId);

  // 1. Ensure the accepted job has a backend case (created once, then remembered on the job).
  React.useEffect(() => {
    if (caseId || started.current.create) return;
    started.current.create = true;
    const sourceInput = [job.snippet, job.url ? `Annons: ${job.url}` : ''].filter(Boolean).join('\n\n');
    createCase({ company: job.co, role: job.t, sourceInput })
      .then((c) => {
        setJobCase(job, c.meta.id);
        setActiveCaseId(c.meta.id); // CV / brev / hem follows this case from now on
        setCaseId(c.meta.id);
      })
      .catch((err) => setSetupError(err.message));
  }, [caseId, job]);

  // 2. Drive the pipeline forward off the real part statuses.
  React.useEffect(() => {
    if (!caseData) return;
    const s = (p) => (caseData[p] && caseData[p].status) || 'absent';
    if (s('dossiers') === 'absent' && s('decodedRole') === 'absent' && !started.current.research) {
      started.current.research = true;
      actions.research().catch((err) => setRunError(err.message)); // part status also flips to failed
    } else if (s('decodedRole') === 'ready' && s('fit') === 'absent' && !started.current.analyze) {
      started.current.analyze = true;
      actions.analyze().catch((err) => setRunError(err.message));
    } else if (s('fit') === 'ready' && s('cvDraft') === 'absent' && !started.current.generate) {
      started.current.generate = true; // background CV + cover letter
      actions.generate().catch(() => { /* surfaced on the CV / letter screens */ });
    }
  }, [caseData, actions]);

  const retry = (name) => {
    setRunError(null);
    started.current[name] = false;
    started.current.analyze = name === 'research' ? false : started.current.analyze;
    if (name === 'research') actions.research().catch((err) => setRunError(err.message));
    else actions.analyze().catch((err) => setRunError(err.message));
  };

  const partStatus = (p) => {
    if (p === 'case') return caseId ? 'ready' : setupError ? 'failed' : 'pending';
    if (!caseData) return 'absent';
    return (caseData[p] && caseData[p].status) || 'absent';
  };
  const firstNotReady = ANALYSIS_STEPS.find((s) => partStatus(s.part) !== 'ready');
  const stepState = (p) => {
    const st = partStatus(p);
    if (st === 'ready') return 'is-done';
    if (st === 'failed') return 'is-failed';
    if (st === 'pending') return 'is-now';
    // While a request is in flight, light only the first step that is not done yet.
    if ((running.research || running.analyze) && firstNotReady && firstNotReady.part === p) return 'is-now';
    return '';
  };

  if (partStatus('fit') === 'ready' && caseData) {
    return <MatchAnalysisContent job={job} caseData={caseData} actions={actions} running={running} />;
  }

  const failedStep = ANALYSIS_STEPS.find((s) => partStatus(s.part) === 'failed');
  const failureText = setupError
    || (failedStep && caseData && caseData[failedStep.part] && caseData[failedStep.part].error)
    || runError
    || error;

  return (
    <div className="lay-analysis-loading">
      <Clover size={44} color="#2B6CF0" />
      <span className="helpitem__kind">Matchanalys</span>
      <h1>{job.t}</h1>
      <p>Lilly kör den riktiga analysen: research om {job.co || 'företaget'}, avkodning av det verkliga jobbet och en ärlig matchning mot dina datafakta. Research-steget tar ett par minuter.</p>
      <div className="analysis-steps">
        {ANALYSIS_STEPS.map((s, index) => (
          <div key={s.part} className={`analysis-step ${stepState(s.part)}`}>
            <span>{partStatus(s.part) === 'ready' ? <Icon name="check" size={14} sw={3} /> : index + 1}</span>
            <b>{s.label}</b>
          </div>
        ))}
      </div>
      {failedStep || setupError || runError ? (
        <div className="lay-analysis-error" style={{ marginTop: 16, textAlign: 'center' }}>
          <p style={{ color: 'var(--ll-coral)', fontWeight: 600 }}>
            Steget misslyckades{failureText ? `: ${failureText}` : '.'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            icon="target"
            onClick={() => retry(failedStep && failedStep.part === 'fit' ? 'analyze' : 'research')}
          >
            Försök igen
          </Button>
        </div>
      ) : null}
    </div>
  );
}

const BRIDGE_KIND_LABEL = {
  reframe: 'Omformulering',
  'adjacent-proof': 'Angränsande bevis',
  'honest-ramp': 'Ärlig upplärningskurva',
};

// The fill-gap loop, per gap: the bridge suggestion + an answer box. The bullet-judge
// decides — accepted mints a datafact and flips the requirement to match; otherwise the
// gap STAYS a gap and the honest reason is shown. Both outcomes are first-class.
function GapFillForm({ gap, actions, running }) {
  const [answer, setAnswer] = React.useState('');
  const [result, setResult] = React.useState(null);
  const [submitError, setSubmitError] = React.useState(null);
  const canAnswer = Boolean(gap.requirementRef && gap.requirementRef.id);

  if (!canAnswer) return null;
  if (result && result.outcome === 'accepted') {
    return (
      <div className="lay-match__item-sug" style={{ color: 'var(--ll-green)' }}>
        <Icon name="check" size={13} sw={3} />
        Sparat som datafakta — kravet är nu uppdaterat till match.
      </div>
    );
  }

  const submit = async () => {
    setSubmitError(null);
    try {
      const out = await actions.answerGap(gap.id, { answer, requirementId: gap.requirementRef.id });
      setResult(out);
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  return (
    <div className="lay-match__gapform" style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Beskriv din faktiska erfarenhet av det här — Lilly bedömer om det ärligt kan bli en CV-punkt."
        rows={2}
        style={{ width: '100%', font: 'inherit', padding: 8, borderRadius: 8, border: '1px solid var(--ll-line, #dcdfe6)' }}
      />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button variant="secondary" size="sm" icon="check" onClick={submit} disabled={!answer.trim() || running.answerGap}>
          {running.answerGap ? 'Bedömer…' : 'Skicka svar'}
        </Button>
        {result && result.outcome === 'stays_gap' && (
          <span className="cap" style={{ color: 'var(--ll-coral)' }}>
            Kvarstår som lucka{result.reason ? ` — ${result.reason}` : ''}. Ingen fabricering: bara ärliga svar blir CV-punkter.
          </span>
        )}
        {submitError && <span className="cap" style={{ color: 'var(--ll-coral)' }}>Fel: {submitError}</span>}
      </div>
    </div>
  );
}

function MatchAnalysisContent({ job, caseData, actions, running }) {
  const fit = (caseData.fit && caseData.fit.data) || { capability: { requirements: [], overall: '' }, preference: { narrative: '' } };
  const gaps = (caseData.gaps && caseData.gaps.data) || [];
  const decodedReqs = (caseData.decodedRole && caseData.decodedRole.data && caseData.decodedRole.data.requirements) || [];
  const reqText = new Map(decodedReqs.map((r) => [r.id, r.requirement]));

  const rows = fit.capability.requirements || [];
  const matches = rows.filter((r) => r.status === 'match');
  const partials = rows.filter((r) => r.status === 'partial');
  const score = rows.length ? Math.round((matches.length / rows.length) * 100) : 0;
  const analyzedAt = caseData.fit && caseData.fit.updatedAt
    ? new Date(caseData.fit.updatedAt).toLocaleString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

  const R = 42, C = 2 * Math.PI * R, off = C * (1 - score / 100);
  const verdictHi = score >= 90;
  const verdictMid = score >= 60 && score < 90;
  const verdictHeadline = verdictHi
    ? 'Stark match.'
    : verdictMid
      ? 'Bra match, med luckor att fylla'
      : 'Tydliga luckor. Se dem nedan innan du bestämmer dig';
  const verdictBody = fit.capability.overall || 'Analysen är klar. Varje match nedan citerar en verklig datafakta ur din pool.';

  return (
    <React.Fragment>
      {/* Header band */}
      <div className="lay-match__head">
        <div className="lay-match__co">
          <div className="lay-match__logo" style={{ background:'#fff', color: job.logo || '#2B6CF0' }}>{(job.co || 'CO').slice(0,2).toUpperCase()}</div>
          <div>
            <div className="lay-match__co-nm">{job.co}</div>
            <div className="lay-match__co-meta">{job.city} · {job.type}{job.when ? ' · ' + job.when : ''}</div>
          </div>
        </div>
        <h1 className="lay-match__title">{job.t}</h1>

        <div className="lay-match__score-row">
          <div className="lay-match__ring">
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle className="bg" cx="48" cy="48" r={R} />
              <circle className="fg" cx="48" cy="48" r={R} strokeDasharray={C} strokeDashoffset={off} />
            </svg>
            <div className="lay-match__ring-n">{score}%</div>
          </div>
          <div className="lay-match__verdict">
            <b>{verdictHeadline}</b><br />
            {verdictBody}
            <div className="lay-match__by"><Icon name="sparkle" size={13} />Analyserad av Lilly{analyzedAt ? ` · ${analyzedAt}` : ''}</div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="lay-match__actions">
        {job.url && (
          <a className="btn btn--primary btn--sm" href={job.url} target="_blank" rel="noreferrer">
            <Icon name="check" size={16} />
            Ansök ändå
          </a>
        )}
        <a className="btn btn--secondary btn--sm" href="#gap-list" onClick={(e) => { e.preventDefault(); const el = document.querySelector('.lay-match__sec--gaps'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}>
          <Icon name="pen" size={16} />
          Fyll luckorna först
        </a>
      </div>

      {/* Hard-filter fit (preference) read */}
      {fit.preference && fit.preference.narrative ? (
        <div className="lay-match__sec">
          <div className="lay-match__sec-h">
            <Icon name="target" size={18} style={{ color: 'var(--ll-blue)' }} />
            <h3>Passar rollen dina villkor?</h3>
          </div>
          <p className="lay-match__item-m" style={{ margin: 0 }}>{fit.preference.narrative}</p>
        </div>
      ) : null}

      {/* Det du har — every match cites a real datafact */}
      <div className="lay-match__sec">
        <div className="lay-match__sec-h">
          <Icon name="check" size={18} sw={2.6} style={{ color:'var(--ll-green)' }} />
          <h3>Det du har</h3>
          <span className="lay-match__pill lay-match__pill--ok">{matches.length} av {rows.length} krav</span>
        </div>
        {matches.length === 0 && <p className="lay-match__item-m" style={{ margin: 0 }}>Inget krav har fullt stöd i din datafakta-pool ännu.</p>}
        {matches.map((m) => (
          <div className="lay-match__item" key={m.requirementRef.id}>
            <div className="lay-match__item-ic lay-match__item-ic--ok"><Icon name="check" size={14} sw={3} /></div>
            <div className="lay-match__item-b">
              <div className="lay-match__item-t">{reqText.get(m.requirementRef.id) || m.requirementRef.id}</div>
              <div className="lay-match__item-m">{m.evidence}</div>
              <div className="cap" style={{ marginTop:5, fontSize:11.5 }}>
                <Icon name="doc" size={11} sw={2.4} style={{ display:'inline', verticalAlign:'-1px', marginRight:4 }} />
                {m.evidenceRef ? `Citerad datafakta · ${m.evidenceRef.id}` : 'Ur din datafakta-pool'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delvis täckt */}
      {partials.length > 0 && (
        <div className="lay-match__sec">
          <div className="lay-match__sec-h">
            <Icon name="doc" size={18} style={{ color:'var(--ll-amber, #F39A1E)' }} />
            <h3>Delvis täckt</h3>
            <span className="lay-match__pill lay-match__pill--gap">{partials.length} krav</span>
          </div>
          {partials.map((p) => (
            <div className="lay-match__item" key={p.requirementRef.id}>
              <div className="lay-match__item-ic lay-match__item-ic--gap"><Icon name="doc" size={13} sw={2.6} /></div>
              <div className="lay-match__item-b">
                <div className="lay-match__item-t">{reqText.get(p.requirementRef.id) || p.requirementRef.id}</div>
                <div className="lay-match__item-m">{p.evidence || 'Delvis stöd — inget fullt belägg i poolen.'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Luckor + the fill-gap loop */}
      <div className="lay-match__sec lay-match__sec--gaps">
        <div className="lay-match__sec-h">
          <Icon name="bulb" size={18} style={{ color:'var(--ll-coral)' }} />
          <h3>Luckor att fylla</h3>
          <span className="lay-match__pill lay-match__pill--gap">{gaps.length} {gaps.length === 1 ? 'lucka' : 'luckor'}</span>
        </div>
        {gaps.length === 0 && <p className="lay-match__item-m" style={{ margin: 0 }}>Inga luckor namngavs i analysen.</p>}
        {gaps.map((g) => (
          <div className="lay-match__item" key={g.id}>
            <div className="lay-match__item-ic lay-match__item-ic--gap"><Icon name="plus" size={13} sw={3} /></div>
            <div className="lay-match__item-b">
              <div className="lay-match__item-t">{g.what}</div>
              <div className="lay-match__item-m">{g.why}</div>
              {g.bridge && (g.bridge.oneLiner || g.bridge.body) ? (
                <div className="lay-match__item-sug">
                  <Icon name="sparkle" size={13} />
                  {BRIDGE_KIND_LABEL[g.bridge.kind] || 'Brygga'}: {g.bridge.oneLiner || g.bridge.body}
                </div>
              ) : null}
              <GapFillForm gap={g} actions={actions} running={running} />
            </div>
          </div>
        ))}
      </div>

      {/* Deep links to tools */}
      <div className="lay-match__sec">
        <div className="lay-match__sec-h">
          <Icon name="arrow" size={18} style={{ color:'var(--ll-blue)' }} />
          <h3>Använd det här direkt</h3>
        </div>
        <div className="lay__deeps">
          <a href="#cv"      className="lay__deep" onClick={() => window.dispatchEvent(new CustomEvent('ll:helpful:close'))}>
            <div className="lay__deep-ic ic-blue"><Icon name="cv" size={20} /></div>
            <div className="lay__deep-b"><div className="lay__deep-t">Öppna CV-byggaren</div><div className="lay__deep-m">Lägg till det som saknas</div></div>
            <Icon name="arrow" size={16} className="lay__deep-go" />
          </a>
          <a href="#letter"  className="lay__deep" onClick={() => window.dispatchEvent(new CustomEvent('ll:helpful:close'))}>
            <div className="lay__deep-ic ic-lilac"><Icon name="letter" size={20} /></div>
            <div className="lay__deep-b"><div className="lay__deep-t">Skriv personligt brev</div><div className="lay__deep-m">Skräddarsy för {job.co}</div></div>
            <Icon name="arrow" size={16} className="lay__deep-go" />
          </a>
          <a href="#review"  className="lay__deep" onClick={() => window.dispatchEvent(new CustomEvent('ll:helpful:close'))}>
            <div className="lay__deep-ic ic-green"><Icon name="users" size={20} /></div>
            <div className="lay__deep-b"><div className="lay__deep-t">Be Sara granska</div><div className="lay__deep-m">15 min — hon svarar idag</div></div>
            <Icon name="arrow" size={16} className="lay__deep-go" />
          </a>
          <a href="#match"   className="lay__deep" onClick={() => window.dispatchEvent(new CustomEvent('ll:helpful:close'))}>
            <div className="lay__deep-ic ic-amber"><Icon name="target" size={20} /></div>
            <div className="lay__deep-b"><div className="lay__deep-t">Hela matchanalysen</div><div className="lay__deep-m">Med annons-genomgång</div></div>
            <Icon name="arrow" size={16} className="lay__deep-go" />
          </a>
        </div>
      </div>

      {/* Verdict */}
      <div className="lay-match__verdict-card">
        <Clover size={26} color="#fff" />
        <div className="lay-match__verdict-card-b">
          <h4>Vår känsla: {verdictHi ? 'gå för det.' : verdictMid ? 'gå för det med en liten polering.' : 'det går — men polera först.'}</h4>
          <p>{verdictBody}</p>
        </div>
      </div>
    </React.Fragment>
  );
}

export { HelpfulLayover, RICH_CONTENT, MatchAnalysisContent };
