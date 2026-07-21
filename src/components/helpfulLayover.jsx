import React from 'react';
import { Icon, Clover, Photo, Avatar, Button, Tag, SectionHeader } from './primitives.jsx';
import { decideJob } from '../api/caseApi.js';
import { useActiveCase } from '../hooks/useCase.js';
import { useJobs } from '../hooks/useJobs.js';
import { findServerJob } from '../lib/jobRecordBridge.mjs';
import { casePartsView } from '../hooks/casePartsView.mjs';
import { caseMetaView } from '../hooks/caseMetaView.mjs';
import { REJECT_REASONS } from '../lib/jobTriage.mjs';
import { LetterFlag } from '../screens/coverLetter.jsx';

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
  // Cover-letter review (from Personligt brev "Granska" → kind:'letterreview').
  if (item && item.kind === 'letterreview') return <LetterReviewContent item={item} />;
  // CV review (from Matchanalys / Ansökningskoll → kind:'cvreview').
  if (item && item.kind === 'cvreview') return <CvReviewContent item={item} />;
  // A search-result row opens the light preview + decision surface (NOT the full analysis and
  // NOT an iframe of the posting). Placed before kind:'job' so it never falls through to it.
  if (item && item.kind === 'jobpreview') return <JobPreviewContent job={item} />;
  if (item && item.kind === 'job') return <JobDescriptionContent job={item} />;

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
      <div className={`lay ${open ? 'lay--open' : ''} ${item && (item.kind === 'cvreview' || item.kind === 'letterreview') ? 'lay--wide' : ''}`} role="dialog" aria-modal="true" aria-hidden={!open}>
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
  // Decisions go through the ONE server record (decideJob), bridged from the live-search job's
  // externalId. "Sparad till Matchanalys" is shown ONLY after the server write succeeds.
  const { jobs: records, approve, reject } = useJobs();
  const rec = findServerJob(records, job);
  const accepted = !!rec && rec.decision === 'approved';
  const [err, setErr] = React.useState(null);

  const onApply = async () => {
    if (!rec) { setErr('Kunde inte spara – jobbet finns inte i systemet ännu.'); return; }
    setErr(null);
    try { await approve(rec.id); }
    catch (e) { setErr(e.message || 'Kunde inte spara jobbet.'); }
  };

  const onRemove = async () => {
    if (!rec) { setErr('Kunde inte ta bort – jobbet finns inte i systemet ännu.'); return; }
    setErr(null);
    // A removal is data: mark it a home-feed cull so the learning layer can tell it apart.
    try { await reject(rec.id, 'OTHER', 'Borttagen från hemflödet'); window.dispatchEvent(new CustomEvent('ll:helpful:close')); }
    catch (e) { setErr(e.message || 'Kunde inte ta bort jobbet.'); }
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
      {err && <p className="cap" role="alert" style={{ margin: '4px 28px 12px', color: 'var(--ll-coral)', fontWeight: 600 }}>{err}</p>}

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

/* ============================================================
   Letter-review content (kind:'letterreview')
   Opened from Personligt brev screen's "Granska" button.
   item carries: { company, jobTitle, url, person, paragraphs[],
                   unsupported[], flagDecisions{} } — all packed by
   the screen's openLetterReview() before dispatching the event.
   Decisions are keyed by CLAIM TEXT (stable across save + regen),
   mirroring the screen's flagDec shape. Reuses the real LetterFlag
   imported from coverLetter.jsx — no window.LetterFlag fallback.
   ============================================================ */
function LetterReviewContent({ item }) {
  // The reviewed letter is always the active case's letter (the Personligt brev
  // screen opens this off useActiveCase), so persist through the same action the
  // screen's "Spara utkast" uses — a real durable coverLetterDraft, not a dead event.
  const { caseData, actions } = useActiveCase();
  const cParts = casePartsView(caseData);
  const person = item.person || {};
  const paras = item.paragraphs || [];
  const unsupported = item.unsupported || [];
  const [flagDec, setFlagDec] = React.useState(item.flagDecisions || {});
  const decide = (claim, v) =>
    setFlagDec((d) => { const n = { ...d }; if (v == null) delete n[claim]; else n[claim] = v; return n; });
  const openFlags = unsupported.filter((claim) => !flagDec[claim]).length;

  const [comments, setComments] = React.useState(item.seedComments || []);
  const [draft, setDraft] = React.useState('');
  const addComment = () => {
    const t = draft.trim();
    if (!t) return;
    setComments((c) => [...c, { who: 'Du', on: 'Allmänt', text: t }]);
    setDraft('');
  };
  const applyComment = (i) =>
    setComments((cs) => cs.map((c, j) => (j === i ? { ...c, applied: !c.applied } : c)));
  const applyAll = () => setComments((cs) => cs.map((c) => ({ ...c, applied: true })));
  const [saving, setSaving] = React.useState(false);
  const accept = async () => {
    setSaving(true);
    try {
      await actions.saveLetterDraft({
        paragraphs: paras,
        decisions: flagDec,
        language: (cParts.coverLetter && cParts.coverLetter.language)
          || (cParts.coverLetterDraft && cParts.coverLetterDraft.language) || 'en',
      });
      window.dispatchEvent(new CustomEvent('ll:helpful:close'));
    } finally {
      setSaving(false);
    }
  };
  const dl = () => {
    const html =
      `<body style="font-family:sans-serif;max-width:640px;margin:40px auto;color:#16233A">` +
      `<p style="font-weight:bold">${item.company}</p>` +
      `<h3>Ansökan: ${item.jobTitle}</h3>` +
      paras.map((x) => `<p>${x}</p>`).join('') +
      `<p style="font-weight:bold">${person.name || ''}</p>` +
      `<p style="color:#666">${person.contact || ''}</p></body>`;
    const blob = new Blob(['<!doctype html><meta charset="utf-8">' + html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Brev_' + String(item.company || 'brev').replace(/\W+/g, '_') + '.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <div className="cvrev">
      <div className="cvrev__head">
        <div className="cvrev__head-top">
          <div className="cvrev__head-id">
            <div className="cvrev__co">{item.company}</div>
            <div className="cvrev__jt">
              {item.jobTitle}
              {item.angle ? <span className="cvrev__tpl"> · Vinkel: {item.angle}</span> : null}
            </div>
          </div>
          <span className="cvrev__changes" style={{ background: 'var(--ll-lilac-soft)', color: 'var(--ll-lilac)' }}>
            Personligt brev
          </span>
        </div>
        <div className="cvrev__cta">
          <Button variant="primary" icon="check" onClick={accept} disabled={saving}>{saving ? 'Sparar…' : 'Spara brev'}</Button>
          <Button variant="secondary" icon="download" onClick={dl}>Ladda ner</Button>
          {item.url && (
            <a href={item.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" icon="arrow">Ansök</Button>
            </a>
          )}
        </div>
      </div>

      <div className="cvrev__body">
        <div className="cvrev__docwrap">
          <div className="cvpaper cvpaper--letter">
            <div className="ltpaper__head">
              <div className="ltpaper__ava" aria-hidden="true">{(person.name || 'D').slice(0, 1)}</div>
              <div>
                <div className="cvpaper__name" style={{ fontSize: '20px' }}>{person.name}</div>
                <div className="cvpaper__role">{person.headline}</div>
                <div className="cvpaper__contact">{person.contact}</div>
              </div>
            </div>
            <div className="ltpaper__subject">Ansökan: {item.jobTitle} — {item.company}</div>
            {paras.map((x, i) => <p key={i} className="ltpaper__p">{x}</p>)}
            <p className="ltpaper__sign">{person.name}</p>
          </div>
        </div>

        <div className="cvrev__rail">
          {/* Ärlighetskoll rail — claim-TEXT–keyed decisions, mirroring the screen */}
          {unsupported.length > 0 && (
            <div className="cvrev__honesty" style={{ marginBottom: 'var(--sp-4)' }}>
              <div className="cvrev__rail-h">
                <Icon
                  name={openFlags === 0 ? 'check' : 'bulb'}
                  size={15}
                  style={{ color: openFlags === 0 ? 'var(--ll-green)' : '#b07212' }}
                />
                Ärlighetskoll {openFlags === 0 ? '· alla hanterade' : `(${openFlags} kvar)`}
              </div>
              <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--ll-ink-soft)', margin: '0 0 var(--sp-2)' }}>
                Påståenden i brevet som ditt CV inte belägger — behåll, mjuka upp eller ta bort.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                {unsupported.map((claim) => (
                  <LetterFlag
                    key={claim}
                    claim={claim}
                    decision={flagDec[claim]}
                    onDecide={(v) => decide(claim, v)}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="cvrev__rail-h"><Icon name="letter" size={15} />Kommentarer ({comments.length})</div>
          {comments.map((c, i) => (
            <div className={`cvnote ${c.applied ? 'cvnote--applied' : ''}`} key={i}>
              <div className="cvnote__h"><b>{c.who}</b>{c.on && <span className="cvnote__on">{c.on}</span>}</div>
              <p>{c.text}</p>
              <div className="cvnote__act">
                {c.applied
                  ? <button className="cvnote__done" onClick={() => applyComment(i)}><Icon name="check" size={12} sw={3} />Ändrad · ångra</button>
                  : <button className="cvnote__btn" onClick={() => applyComment(i)}><Icon name="pen" size={12} sw={2.4} />Ändra</button>}
              </div>
            </div>
          ))}
          <div className="cvnote cvnote--add">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Föreslå en ändring i brevet…"
              rows={3}
            />
            <Button variant="secondary" size="sm" icon="plus" onClick={addComment}>Lägg till kommentar</Button>
          </div>
          {comments.length > 0 && (
            <div className="cvrev__apply">
              <Button
                variant="primary"
                size="sm"
                icon="sparkle"
                block
                disabled={comments.every((c) => c.applied)}
                onClick={applyAll}
              >
                {comments.every((c) => c.applied) ? 'Ändringar genomförda ✓' : 'Genomför ändringar'}
              </Button>
              <span className="cvrev__apply-note">Lilly uppdaterar brevet enligt kommentarerna.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CV-review content (kind:'cvreview')
   Opened from Matchanalys / Ansökningskoll "Se resultat" button.
   item carries: { company, jobTitle, id } — company/jobTitle for the
   header. Real CV content is read from parts.cvDraft via useActiveCase().
   _pool is empty this wave — honest generic citation chips only.
   ============================================================ */
function CvReviewContent({ item }) {
  const { caseData } = useActiveCase();
  const parts = casePartsView(caseData);
  const meta = caseMetaView(caseData);
  const person = meta.person || {};

  // cvDraft: { sections:[{ heading, items:[{ text, datafactRef }] }] } | null
  // (the real generated shape from cv-builder/execute.cjs — no body, no changes).
  const cvDraft = parts.cvDraft;
  const sections = (cvDraft && cvDraft.sections) || [];
  const company = item.company || meta.company || '';
  const jobTitle = item.jobTitle || meta.jobTitle || '';

  const [comments, setComments] = React.useState([]);
  const [draft, setDraft] = React.useState('');
  const addComment = () => {
    const t = draft.trim();
    if (!t) return;
    setComments((c) => [...c, { who: 'Du', on: 'Allmänt', text: t }]);
    setDraft('');
  };
  const applyComment = (i) =>
    setComments((cs) => cs.map((c, j) => (j === i ? { ...c, applied: !c.applied } : c)));
  const applyAll = () => setComments((cs) => cs.map((c) => ({ ...c, applied: true })));

  return (
    <div className="cvrev">
      <div className="cvrev__head">
        <div className="cvrev__head-top">
          <div className="cvrev__head-id">
            <div className="cvrev__co">{company}</div>
            <div className="cvrev__jt">{jobTitle}</div>
          </div>
        </div>
        <div className="cvrev__cta">
          {/* No accept/persist action exists yet (caseApi has no "accept CV") — an
              honest disabled state, not a button that silently drops the click. */}
          <Button variant="primary" icon="check" disabled>Acceptera CV</Button>
          <span className="soon-tag">Kommer</span>
          {item.url && (
            <a href={item.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" icon="arrow">Ansök</Button>
            </a>
          )}
        </div>
      </div>

      <div className="cvrev__body">
        <div className="cvrev__docwrap">
          <div className="cvpaper cvpaper--blue">
            <div className="cvpaper__id">
              <div className="cvpaper__id-b">
                <h1 className="cvpaper__name">{person.name}</h1>
                <div className="cvpaper__role">{person.headline}</div>
                <div className="cvpaper__contact">{person.contact}</div>
              </div>
            </div>
            {sections.length === 0 && (
              <p className="cvpaper__p" style={{ color: 'var(--ll-ink-soft)', fontStyle: 'italic' }}>
                CV-utkastet genereras efter matchanalysen. Kör analysen och kom tillbaka här.
              </p>
            )}
            {sections.map((s, i) => (
              <div key={i} className="cvpaper__sec">
                <div className="cvpaper__sec-h">{s.heading}</div>
                {s.categories
                  ? s.categories.filter(c => (c.items || []).length).map(cat => (
                      <div key={cat.id} className="cvpaper__cat">
                        <div className="cvpaper__cat-h">{cat.title}</div>
                        <ul className="cvpaper__ul">{cat.items.map((it, j) => <li key={j}>{it.text}</li>)}</ul>
                      </div>
                    ))
                  : s.jobs
                  ? s.jobs.filter(jb => (jb.intro || []).length || (jb.bullets || []).length).map(job => (
                      <div key={job.key} className="cvpaper__job">
                        <div className="cvpaper__job-h">{job.company} · {job.period}</div>
                        {job.role && job.role.text ? <div className="cvpaper__job-role">{job.role.text}</div> : null}
                        {(job.intro || []).map((it, j) => <p key={`i${j}`} className="cvpaper__p">{it.text}</p>)}
                        {(job.bullets || []).length ? <ul className="cvpaper__ul">{job.bullets.map((it, j) => <li key={`b${j}`}>{it.text}</li>)}</ul> : null}
                      </div>
                    ))
                  : <ul className="cvpaper__ul">{(s.items || []).map((it, j) => <li key={j}>{it.text}</li>)}</ul>}
              </div>
            ))}
          </div>
        </div>

        <div className="cvrev__rail">
          <div className="cvrev__rail-h"><Icon name="letter" size={15} />Kommentarer ({comments.length})</div>
          {comments.map((c, i) => (
            <div className={`cvnote ${c.applied ? 'cvnote--applied' : ''}`} key={i}>
              <div className="cvnote__h"><b>{c.who}</b>{c.on && <span className="cvnote__on">{c.on}</span>}</div>
              <p>{c.text}</p>
              <div className="cvnote__act">
                {c.applied
                  ? <button className="cvnote__done" onClick={() => applyComment(i)}><Icon name="check" size={12} sw={3} />Ändrad · ångra</button>
                  : <button className="cvnote__btn" onClick={() => applyComment(i)}><Icon name="pen" size={12} sw={2.4} />Ändra</button>}
              </div>
            </div>
          ))}
          <div className="cvnote cvnote--add">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Föreslå en ändring på CV:t…"
              rows={3}
            />
            <Button variant="secondary" size="sm" icon="plus" onClick={addComment}>Lägg till kommentar</Button>
          </div>
          {comments.length > 0 && (
            <div className="cvrev__apply">
              <Button
                variant="primary"
                size="sm"
                icon="sparkle"
                block
                disabled={comments.every((c) => c.applied)}
                onClick={applyAll}
              >
                {comments.every((c) => c.applied) ? 'Ändringar genomförda ✓' : 'Genomför ändringar'}
              </Button>
              <span className="cvrev__apply-note">Lilly uppdaterar CV:t enligt kommentarerna.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { HelpfulLayover, RICH_CONTENT };
