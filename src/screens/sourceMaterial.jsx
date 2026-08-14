import React from 'react';
import { Icon, Button, Tag } from '../components/primitives.jsx';
import { Sidebar } from '../components/shell.jsx';
import { ContentArea, ContentBox, CrossColumn, PageTemplate } from '../components/grid.jsx';
import { tr } from '../lib/i18n.mjs';
import {
  listDocuments, uploadDocument, deleteDocument, suggestFacts,
  listProposals, acceptProposal, rejectProposal, mintPersonFact,
} from '../api/suggestApi.js';

// HelloLilly — Källmaterial (Wave 2, the suggestion engine's surface).
// Upload/paste attested material → the engine drafts span-grounded proposals → the person
// reviews WORDING AND PLACEMENT (3.6: placement in plain words) → accept mints. The
// person-typed entry is a FIRST-CLASS path (3.7/D22), invited, frictionless.

// Intake attestation (3.4). Three plainly-worded choices, the last an escape hatch, mapped
// onto the existing attested classes. Deterministic barring (isBarredAsExperienceSource) is
// UNCHANGED: 'mine' is usable experience; the other two set ownership 'third_party', which
// bars them from ever being read as the person's experience. 'unknown' keeps class 'other'
// so the uncertain/mixed bucket stays distinguishable. Its copy promises ONLY what the code
// does — barred until the person re-attests; there is no ask-flow yet (owed, see
// HELLOLILLY_BACKLOG). A label must never promise behaviour the system does not have.
const CLASS_OPTIONS = () => ([
  { v: 'mine', attestedClass: 'old_cv', ownership: 'mine',
    t: tr({ sv: 'Mitt eget material – brev, CV, anteckningar (används som din erfarenhet)', en: 'My own material – letter, CV, notes (used as your experience)' }) },
  { v: 'not_mine', attestedClass: 'third_party', ownership: 'third_party',
    t: tr({ sv: 'Något jag inte skrivit – jobbannons, mall, någon annans CV (läses aldrig som din erfarenhet)', en: "Something I didn't write – a job ad, template, someone else's CV (never read as your experience)" }) },
  { v: 'unknown', attestedClass: 'other', ownership: 'third_party',
    t: tr({ sv: 'Vet inte / blandat (används inte som din erfarenhet förrän du sagt vad det är)', en: "Not sure / mixed (not used as your experience until you say what it is)" }) },
]);

// How a STORED document's class reads in the library list (covers legacy classes too). The
// barred bucket is split for display: uncertain/mixed documents read differently from
// material declared as someone else's.
function classDisplay(doc) {
  const barred = ['job_ad', 'third_party'].includes(doc.attestedClass) || doc.ownership === 'third_party';
  if (doc.attestedClass === 'other' && doc.ownership === 'third_party')
    return { label: tr({ sv: 'Vet inte / blandat', en: 'Not sure / mixed' }), tone: 'warn' };
  if (barred) return { label: tr({ sv: 'Något jag inte skrivit', en: 'Not written by me' }), tone: 'warn' };
  return { label: tr({ sv: 'Mitt eget material', en: 'My own material' }), tone: 'ok' };
}

// "when added" — createdAt is already an ISO string; show it plainly, no locale dependency.
const fmtDate = (iso) => String(iso || '').slice(0, 16).replace('T', ' ');

const TYPE_LABELS = () => ({
  job_result: tr({ sv: 'Jobbresultat (bullet under en anställning)', en: 'Job result (bullet under a job)' }),
  value_proposition: tr({ sv: 'Karriärhöjdpunkt', en: 'Career highlight' }),
  competency: tr({ sv: 'Kompetens', en: 'Competency' }),
  skill: tr({ sv: 'Färdighet', en: 'Skill' }),
  other_work: tr({ sv: 'Övrig erfarenhet', en: 'Other experience' }),
});

// competency and skill both need a category so the fact reaches Core Competencies (server:
// validateAttribution). The UI captures it here; without one, the fact cannot mint.
const isCategoryType = (t) => t === 'competency' || t === 'skill';

// Client MIRROR of the server's placementLabel (engine.cjs): the placement the person reviews
// must name the SAME destination the server records (finding: reviewed placement == recorded
// placement). jobKey only counts for job_result — a type change clears it, so the label can
// never go stale against a recalculated server label.
const TYPE_PLACEMENT = () => ({
  value_proposition: tr({ sv: 'Karriärhöjdpunkter', en: 'Career Highlights' }),
  competency: tr({ sv: 'Kärnkompetenser', en: 'Core Competencies' }),
  skill: tr({ sv: 'Kärnkompetenser', en: 'Core Competencies' }),
  other_work: tr({ sv: 'Övrig erfarenhet', en: 'Other Experience' }),
  job_result: tr({ sv: 'Professionell erfarenhet (anställning ej vald)', en: 'Professional Experience (job not yet chosen)' }),
});
function reviewedPlacement(type, jobKey, placementOptions) {
  if (type === 'job_result' && jobKey) return (placementOptions.find((o) => o.jobKey === jobKey) || {}).label;
  return TYPE_PLACEMENT()[type] || type;
}

/* ---------- one proposal under review (shared with Matchanalys FillGap) ---------- */
export function ProposalReviewCard({ proposal, placementOptions, factTypes, competencyCategories = [], onDone }) {
  const [text, setText] = React.useState(proposal.text);
  const [type, setType] = React.useState(proposal.type);
  const [jobKey, setJobKey] = React.useState(proposal.jobKey || '');
  const [catId, setCatId] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const types = TYPE_LABELS();
  const needsPlacement = proposal.placementEvidence === 'none';
  // recomputed from the CURRENT type/jobKey — never the proposal's stale draft-time label
  const placement = reviewedPlacement(type, jobKey, placementOptions);
  const needsCategory = isCategoryType(type);

  const changeType = (nt) => { setType(nt); if (nt !== 'job_result') setJobKey(''); if (!isCategoryType(nt)) setCatId(''); };

  const accept = async () => {
    setBusy(true); setErr(null);
    const b = await acceptProposal(proposal.id, {
      nonce: proposal.nonce, finalText: text,
      attribution: {
        type, jobKey: jobKey || null, personPlaced: needsPlacement && !!jobKey,
        ...(needsCategory && catId ? { category: competencyCategories.find((c) => c.id === catId) } : {}),
      },
    });
    setBusy(false);
    if (b && b.ok) onDone({ accepted: true, fact: b.result.fact });
    else setErr((b && b.result && b.result.reason) || (b && b.error) || 'okänt fel');
  };
  const reject = async () => {
    setBusy(true);
    await rejectProposal(proposal.id);
    setBusy(false);
    onDone({ accepted: false });
  };

  return (
    <div className="ll-box" style={{ padding: 'var(--sp-4)', display: 'grid', gap: 'var(--sp-3)' }}>
      {proposal.status === 'defective' && (
        <div className="loop__res loop__res--gap">
          <Icon name="bulb" size={16} />
          <div className="loop__res-b">
            <div className="loop__res-t">{tr({ sv: 'Förslaget har ostödda uppgifter', en: 'This draft carries unsupported details' })}</div>
            <div className="loop__res-m">
              {tr({ sv: 'Modellen skrev in något källan inte styrker', en: 'The model wrote something the source does not back' })}
              {proposal.grounding.defectiveTokens.length ? ` (${proposal.grounding.defectiveTokens.join(', ')})` : ''}.{' '}
              {tr({ sv: 'Skriv om det med egna ord — eller avvisa. Det du själv skriver sparas som din sanning.', en: 'Rewrite it in your own words — or reject it. What you write yourself is saved as your truth.' })}
            </div>
          </div>
        </div>
      )}
      <textarea className="loop__ta" value={text} onChange={(e) => setText(e.target.value)} rows={2} />
      <div className="cap" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Icon name="cv" size={14} />
        <span>{tr({ sv: 'Källa', en: 'Source' })}: <b>{proposal.span.documentName}</b>{proposal.span.heading ? ` › ${proposal.span.heading}` : ''} — “{proposal.span.text.length > 140 ? proposal.span.text.slice(0, 140) + '…' : proposal.span.text}”</span>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={type} onChange={(e) => changeType(e.target.value)} aria-label={tr({ sv: 'Typ', en: 'Type' })}>
          {factTypes.map((t) => <option key={t} value={t}>{types[t] || t}</option>)}
        </select>
        {(type === 'job_result') && (
          <select value={jobKey} onChange={(e) => setJobKey(e.target.value)} aria-label={tr({ sv: 'Placering', en: 'Placement' })}>
            <option value="">{tr({ sv: '— välj anställning —', en: '— choose the job —' })}</option>
            {placementOptions.map((o) => <option key={o.jobKey} value={o.jobKey}>{o.label}</option>)}
          </select>
        )}
        {needsCategory && (
          <select value={catId} onChange={(e) => setCatId(e.target.value)} aria-label={tr({ sv: 'Kategori', en: 'Category' })}>
            <option value="">{tr({ sv: '— välj kategori —', en: '— choose a category —' })}</option>
            {competencyCategories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        )}
      </div>
      {/* 3.6 — the placement stated in plain words, always; recalculated on every type change */}
      <div className="cap" style={{ fontWeight: 700 }}>
        {placement
          ? tr({ sv: `Detta kommer att stå under: ${placement}`, en: `This will appear under: ${placement}` })
          : tr({ sv: 'Välj var raden hör hemma innan du sparar.', en: 'Choose where this line belongs before saving.' })}
        {needsPlacement && jobKey ? ' ' + tr({ sv: '(din placering — källan anger ingen arbetsgivare)', en: '(your placement — the source names no employer)' }) : ''}
        {needsCategory && !catId ? ' ' + tr({ sv: '— välj en kategori först', en: '— choose a category first' }) : ''}
      </div>
      {err && (
        <div className="loop__res loop__res--fail">
          <Icon name="refresh" size={16} />
          <div className="loop__res-b"><div className="loop__res-m">{err}</div></div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="primary" size="sm" icon="check" onClick={accept} disabled={busy || (type === 'job_result' && !jobKey) || (needsCategory && !catId)}>
          {busy ? tr({ sv: 'Sparar…', en: 'Saving…' }) : tr({ sv: 'Acceptera & mynta', en: 'Accept & mint' })}
        </Button>
        <Button variant="secondary" size="sm" onClick={reject} disabled={busy}>
          {tr({ sv: 'Avvisa', en: 'Reject' })}
        </Button>
      </div>
    </div>
  );
}

/* ---------- the screen ---------- */
function SourceMaterial() {
  const [docs, setDocs] = React.useState([]);
  const [docsStatus, setDocsStatus] = React.useState('pending');
  const [proposals, setProposals] = React.useState([]);
  const [placementOptions, setPlacementOptions] = React.useState([]);
  const [factTypes, setFactTypes] = React.useState(['job_result', 'value_proposition', 'competency', 'skill', 'other_work']);
  const [competencyCategories, setCompetencyCategories] = React.useState([]);
  const [minted, setMinted] = React.useState([]);
  // per-document draft trigger (F6): contextual to a stored document, not a global selector
  const [suggestDocId, setSuggestDocId] = React.useState(null);
  const [suggestNote, setSuggestNote] = React.useState(null);

  // upload form — a chosen file rides as base64 (extracted to text server-side); paste rides as text
  const [upName, setUpName] = React.useState('');
  const [upText, setUpText] = React.useState('');
  const [upFilename, setUpFilename] = React.useState(null);
  const [upData, setUpData] = React.useState(null); // base64 of a chosen file, or null for paste
  const [upClass, setUpClass] = React.useState('mine');
  const [upErr, setUpErr] = React.useState(null);
  const [upDup, setUpDup] = React.useState(null); // a pending same-name/-content match awaiting "save anyway"
  const [upBusy, setUpBusy] = React.useState(false);

  // person-typed entry (3.7 — the invited first-class path)
  const [ownText, setOwnText] = React.useState('');
  const [ownType, setOwnType] = React.useState('job_result');
  const [ownJob, setOwnJob] = React.useState('');
  const [ownCat, setOwnCat] = React.useState('');
  const [ownBusy, setOwnBusy] = React.useState(false);
  const [ownErr, setOwnErr] = React.useState(null);

  const refreshDocs = React.useCallback(() => {
    listDocuments().then((d) => { setDocs(d || []); setDocsStatus('ready'); }).catch(() => setDocsStatus('failed'));
  }, []);
  const refreshProposals = React.useCallback(() => {
    listProposals().then((b) => {
      setProposals((b.proposals || []).filter((p) => p.status === 'open' || p.status === 'defective'));
      setPlacementOptions(b.placementOptions || []);
      if (b.factTypes) setFactTypes(b.factTypes);
      setCompetencyCategories(b.competencyCategories || []);
    }).catch(() => {});
  }, []);

  React.useEffect(() => { refreshDocs(); refreshProposals(); }, [refreshDocs, refreshProposals]);

  // File formats: read the chosen file as base64 (any of txt/md/html/docx/pdf) and let the
  // server extract the text. Paste stays a text path.
  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setUpErr(null); setUpDup(null); setUpText('');
    setUpName(f.name); setUpFilename(f.name);
    const reader = new FileReader();
    reader.onload = () => { const r = String(reader.result || ''); setUpData(r.slice(r.indexOf(',') + 1)); };
    reader.readAsDataURL(f);
  };

  const clearUpload = () => { setUpText(''); setUpName(''); setUpFilename(null); setUpData(null); setUpDup(null); };

  const doUpload = async (confirmDuplicate = false) => {
    const opt = CLASS_OPTIONS().find((o) => o.v === upClass) || CLASS_OPTIONS()[0];
    setUpBusy(true); setUpErr(null); if (!confirmDuplicate) setUpDup(null);
    const b = await uploadDocument({
      name: upName || tr({ sv: 'Inklistrad text', en: 'Pasted text' }),
      text: upText, filename: upFilename, dataBase64: upData || undefined,
      attestedClass: opt.attestedClass, ownership: opt.ownership, confirmDuplicate,
    });
    setUpBusy(false);
    if (b && b.ok) { clearUpload(); refreshDocs(); }
    else if (b && b.failure === 'duplicate') setUpDup(b.duplicate); // say so plainly before saving
    else setUpErr((b && b.error) || 'unknown error'); // the explicit failed envelope, shown as-is
  };

  const changeOwnType = (nt) => { setOwnType(nt); if (nt !== 'job_result') setOwnJob(''); if (!isCategoryType(nt)) setOwnCat(''); };
  const ownNeedsCategory = isCategoryType(ownType);

  const doOwnMint = async () => {
    setOwnBusy(true); setOwnErr(null);
    const b = await mintPersonFact({ text: ownText, attribution: {
      type: ownType, jobKey: ownJob || null, personPlaced: true,
      ...(ownNeedsCategory && ownCat ? { category: competencyCategories.find((c) => c.id === ownCat) } : {}),
    } });
    setOwnBusy(false);
    if (b && b.ok) { setOwnText(''); setOwnCat(''); setMinted((m) => [b.result.fact, ...m]); }
    else setOwnErr((b && b.result && b.result.reason) || (b && b.error) || 'unknown error');
  };

  // F6 — draft proposals from ONE stored document (the standing/no-case path stays reachable
  // via the API; per-job drafting lives in Matchanalys). Contextual to the document row.
  const doSuggestFromDoc = async (docId) => {
    setSuggestDocId(docId); setSuggestNote(null);
    try {
      const b = await suggestFacts({ documentIds: [docId] });
      setSuggestNote(b && b.ok
        ? { docId, drafted: b.drafted, barredSpans: b.barredSpans || [], skippedSpans: b.skippedSpans || 0 }
        : { docId, error: (b && b.error) || 'unknown error' });
    } catch (err) { setSuggestNote({ docId, error: err.message }); }
    setSuggestDocId(null);
    refreshProposals();
  };

  const classOptions = CLASS_OPTIONS();
  const types = TYPE_LABELS();

  const content = (
    <ContentArea>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900 }}>
        {tr({ sv: 'Källmaterial & förslag', en: 'Source material & proposals' })}
      </h1>
      <p className="muted" style={{ maxWidth: '68ch' }}>
        {tr({
          sv: 'Ladda upp eller klistra in ditt eget material — brev, gamla CV:n, intervjuanteckningar. Lilly föreslår CV-rader ur det; du granskar formulering OCH placering; det du godkänner myntas i din byrålåda.',
          en: 'Upload or paste your own material — letters, old CVs, interview notes. Lilly drafts CV lines from it; you review wording AND placement; what you accept is minted into your drawer.',
        })}
      </p>

      {/* 3.7 — the INVITED person-typed path, first, prominent */}
      <ContentBox tone="accent" style={{ display: 'grid', gap: 'var(--sp-3)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Icon name="sparkle" size={18} />
          <b>{tr({ sv: 'Har du ett exempel som aldrig hamnade i något dokument?', en: 'Have an example that never made it into any document?' })}</b>
        </div>
        <p className="cap" style={{ margin: 0 }}>
          {tr({ sv: 'Efter 30 år finns det mer i minnet än i filerna. Skriv det — det är ditt för alltid, sparat som din egen uppgift.', en: 'After a long career, more lives in memory than in files. Type it — it is yours forever, saved as your own statement.' })}
        </p>
        <textarea className="loop__ta" rows={2} value={ownText} onChange={(e) => setOwnText(e.target.value)}
          placeholder={tr({ sv: 'T.ex. "Omförhandlade alla leverantörsavtal 2008 och sänkte kostnaderna"', en: 'e.g. "Renegotiated all supplier contracts in 2008, cutting costs"' })} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={ownType} onChange={(e) => changeOwnType(e.target.value)}>
            {factTypes.map((t) => <option key={t} value={t}>{types[t] || t}</option>)}
          </select>
          {ownType === 'job_result' && (
            <select value={ownJob} onChange={(e) => setOwnJob(e.target.value)}>
              <option value="">{tr({ sv: '— välj anställning —', en: '— choose the job —' })}</option>
              {placementOptions.map((o) => <option key={o.jobKey} value={o.jobKey}>{o.label}</option>)}
            </select>
          )}
          {ownNeedsCategory && (
            <select value={ownCat} onChange={(e) => setOwnCat(e.target.value)} aria-label={tr({ sv: 'Kategori', en: 'Category' })}>
              <option value="">{tr({ sv: '— välj kategori —', en: '— choose a category —' })}</option>
              {competencyCategories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          )}
          <Button variant="primary" size="sm" icon="check" onClick={doOwnMint}
            disabled={ownBusy || !ownText.trim() || (ownType === 'job_result' && !ownJob) || (ownNeedsCategory && !ownCat)}>
            {ownBusy ? tr({ sv: 'Sparar…', en: 'Saving…' }) : tr({ sv: 'Spara som min uppgift', en: 'Save as my statement' })}
          </Button>
        </div>
        {ownErr && <div className="cap" style={{ color: 'var(--ll-red, #c0392b)' }}>{ownErr}</div>}
        {minted.map((f) => (
          <div key={f.id} className="loop__res loop__res--ok">
            <Icon name="check" size={16} sw={2.6} />
            <div className="loop__res-b">
              <div className="loop__res-m">{tr({ sv: 'Sparad', en: 'Saved' })}: “{f.text}” — {f.acceptance.reviewedAttribution.placementLabel} <Tag variant="ok">{tr({ sv: 'egen uppgift', en: 'person-attested' })}</Tag></div>
            </div>
          </div>
        ))}
      </ContentBox>

      {/* 3.4 — intake with attestation; file formats: Word/PDF/HTML/txt or paste */}
      <ContentBox style={{ display: 'grid', gap: 'var(--sp-3)' }}>
        <b>{tr({ sv: 'Lägg till ett dokument', en: 'Add a document' })}</b>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="file" accept=".txt,.md,.pdf,.docx,.html,.htm,text/plain" onChange={onFile} />
          <input type="text" value={upName} onChange={(e) => setUpName(e.target.value)} placeholder={tr({ sv: 'Namn', en: 'Name' })} />
        </div>
        {upData && (
          <span className="cap">{tr({ sv: 'Vald fil', en: 'Chosen file' })}: <b>{upFilename}</b> — {tr({ sv: 'texten läses ur filen när du sparar', en: 'the text is read from the file when you save' })}</span>
        )}
        <textarea className="loop__ta" rows={5} value={upText}
          onChange={(e) => { setUpText(e.target.value); setUpData(null); setUpFilename(null); }}
          placeholder={tr({ sv: '…eller klistra in texten här (Word, PDF, HTML och txt kan laddas upp som fil ovan)', en: '…or paste the text here (Word, PDF, HTML and txt can be uploaded as a file above)' })} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <label className="cap" style={{ fontWeight: 700 }}>{tr({ sv: 'Vad är det här?', en: 'What is this?' })}</label>
          <select value={upClass} onChange={(e) => setUpClass(e.target.value)} style={{ maxWidth: '100%' }}>
            {classOptions.map((c) => <option key={c.v} value={c.v}>{c.t}</option>)}
          </select>
          <Button variant="primary" size="sm" icon="plus" onClick={() => doUpload(false)} disabled={upBusy || (!upData && !upText.trim())}>
            {upBusy ? tr({ sv: 'Laddar upp…', en: 'Uploading…' }) : tr({ sv: 'Spara dokument', en: 'Save document' })}
          </Button>
        </div>
        {upDup && (
          <div className="loop__res loop__res--gap">
            <Icon name="bulb" size={16} />
            <div className="loop__res-b">
              <div className="loop__res-t">{tr({ sv: 'Det här dokumentet finns redan', en: 'This document is already stored' })}</div>
              <div className="loop__res-m">
                {upDup.sameContent
                  ? tr({ sv: `Samma innehåll som ”${upDup.name}”.`, en: `Same content as “${upDup.name}”.` })
                  : tr({ sv: `Ett dokument heter redan ”${upDup.name}”.`, en: `A document is already named “${upDup.name}”.` })}{' '}
                <button className="ll-link ll-link--text" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', textDecoration: 'underline', padding: 0 }}
                  onClick={() => doUpload(true)} disabled={upBusy}>
                  {tr({ sv: 'Spara ändå', en: 'Save anyway' })}
                </button>
              </div>
            </div>
          </div>
        )}
        {upErr && (
          <div className="loop__res loop__res--fail">
            <Icon name="refresh" size={16} />
            <div className="loop__res-b"><div className="loop__res-m">{upErr}</div></div>
          </div>
        )}
        {/* Library view — what is already stored (name, when added, class, spans, facts minted) */}
        {docsStatus === 'ready' && docs.length > 0 && (
          <div style={{ display: 'grid', gap: 8 }}>
            <div className="cap" style={{ fontWeight: 700 }}>{tr({ sv: 'Sparat material', en: 'Stored material' })} ({docs.length})</div>
            {docs.map((d) => {
              const cd = classDisplay(d);
              const barred = ['job_ad', 'third_party'].includes(d.attestedClass) || d.ownership === 'third_party';
              const note = suggestNote && suggestNote.docId === d.id ? suggestNote : null;
              return (
                <div key={d.id} style={{ display: 'grid', gap: 4 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Icon name="cv" size={14} />
                    <b>{d.name}</b>
                    <Tag variant={cd.tone}>{cd.label}</Tag>
                    <span className="cap">{fmtDate(d.createdAt)}</span>
                    <span className="cap">{d.spanCount} {tr({ sv: 'textavsnitt', en: 'spans' })}</span>
                    <span className="cap">{d.factCount || 0} {tr({ sv: 'myntade fakta', en: 'facts minted' })}</span>
                    <span style={{ marginLeft: 'auto', display: 'flex', gap: 14, alignItems: 'center' }}>
                      {/* F6 — the draft trigger, CONTEXTUAL to this document (barred docs can't be an experience source) */}
                      {!barred && (
                        <button className="ll-link ll-link--text" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ll-blue-deep)' }}
                          onClick={() => doSuggestFromDoc(d.id)} disabled={suggestDocId === d.id}>
                          {suggestDocId === d.id ? tr({ sv: 'Lilly läser…', en: 'Lilly is reading…' }) : tr({ sv: 'Föreslå rader ur det här dokumentet', en: 'Suggest lines from this document' })}
                        </button>
                      )}
                      <button className="ll-link ll-link--text" style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        onClick={() => deleteDocument(d.id).then(() => { refreshDocs(); refreshProposals(); })}>
                        {tr({ sv: 'Radera', en: 'Delete' })}
                      </button>
                    </span>
                  </div>
                  {note && (
                    <div className="cap" style={{ paddingLeft: 22 }}>
                      {note.error
                        ? <span style={{ color: 'var(--ll-red, #c0392b)' }}>{note.error}</span>
                        : <>{tr({ sv: 'Utkast', en: 'Drafted' })}: <b>{note.drafted}</b>{note.drafted === 0
                            ? ' — ' + tr({ sv: 'inga nya rader (avsnitten kan redan ha förslag)', en: 'no new lines (spans may already have proposals)' })
                            : ' — ' + tr({ sv: 'se granskningskön nedan', en: 'see the review queue below' })}
                          {note.barredSpans && note.barredSpans.length ? ` · ${tr({ sv: 'avvisade avsnitt', en: 'barred spans' })}: ${note.barredSpans.length}` : ''}</>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ContentBox>

      {/* the review queue (standing suggestions stay reachable via API; per-job drafting lives in Matchanalys) */}
      {proposals.length > 0 && (
        <ContentBox style={{ display: 'grid', gap: 'var(--sp-3)' }}>
          <b>{tr({ sv: 'Förslag att granska', en: 'Proposals to review' })} ({proposals.length})</b>
          {proposals.map((p) => (
            <ProposalReviewCard key={p.id + (p.nonce || '')} proposal={p} placementOptions={placementOptions} factTypes={factTypes}
              competencyCategories={competencyCategories} onDone={() => refreshProposals()} />
          ))}
        </ContentBox>
      )}
    </ContentArea>
  );

  return (
    <PageTemplate
      label="Källmaterial"
      nav={<Sidebar active="kallmaterial" />}
      cross={<CrossColumn items={[]} />}
      content={content}
    />
  );
}

export { SourceMaterial };
