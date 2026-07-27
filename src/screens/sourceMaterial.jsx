import React from 'react';
import { Icon, Button, Tag } from '../components/primitives.jsx';
import { Sidebar } from '../components/shell.jsx';
import { ContentArea, ContentBox, CrossColumn, PageTemplate } from '../components/grid.jsx';
import { tr } from '../lib/i18n.mjs';
import {
  listDocuments, uploadDocument, deleteDocument, suggestFacts,
  listProposals, acceptProposal, rejectProposal, mintPersonFact, getTarget,
} from '../api/suggestApi.js';
import { listCases } from '../api/caseApi.js';

// HelloLilly — Källmaterial (Wave 2, the suggestion engine's surface).
// Upload/paste attested material → the engine drafts span-grounded proposals → the person
// reviews WORDING AND PLACEMENT (3.6: placement in plain words) → accept mints. The
// person-typed entry is a FIRST-CLASS path (3.7/D22), invited, frictionless.

const CLASS_LABELS = () => ([
  { v: 'cover_letter', t: tr({ sv: 'Mitt personliga brev', en: 'My cover letter' }) },
  { v: 'old_cv', t: tr({ sv: 'Mitt gamla CV', en: 'My old CV' }) },
  { v: 'qa_notes', t: tr({ sv: 'Mina Q&A-/intervjuanteckningar', en: 'My Q&A or interview notes' }) },
  { v: 'job_ad', t: tr({ sv: 'En jobbannons (används aldrig som erfarenhetskälla)', en: 'A job ad (never used as an experience source)' }) },
  { v: 'third_party', t: tr({ sv: 'Någon annans material (används aldrig som erfarenhetskälla)', en: "Someone else's material (never used as an experience source)" }) },
  { v: 'other', t: tr({ sv: 'Annat', en: 'Other' }) },
]);

const TYPE_LABELS = () => ({
  job_result: tr({ sv: 'Jobbresultat (bullet under en anställning)', en: 'Job result (bullet under a job)' }),
  value_proposition: tr({ sv: 'Karriärhöjdpunkt', en: 'Career highlight' }),
  competency: tr({ sv: 'Kompetens', en: 'Competency' }),
  skill: tr({ sv: 'Färdighet', en: 'Skill' }),
  other_work: tr({ sv: 'Övrig erfarenhet', en: 'Other experience' }),
});

/* ---------- one proposal under review (shared with Matchanalys FillGap) ---------- */
export function ProposalReviewCard({ proposal, placementOptions, factTypes, onDone }) {
  const [text, setText] = React.useState(proposal.text);
  const [type, setType] = React.useState(proposal.type);
  const [jobKey, setJobKey] = React.useState(proposal.jobKey || '');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const types = TYPE_LABELS();
  const needsPlacement = proposal.placementEvidence === 'none';
  const placement = jobKey
    ? (placementOptions.find((o) => o.jobKey === jobKey) || {}).label
    : proposal.placementLabel;

  const accept = async () => {
    setBusy(true); setErr(null);
    const b = await acceptProposal(proposal.id, {
      nonce: proposal.nonce, finalText: text,
      attribution: { type, jobKey: jobKey || null, personPlaced: needsPlacement && !!jobKey },
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
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label={tr({ sv: 'Typ', en: 'Type' })}>
          {factTypes.map((t) => <option key={t} value={t}>{types[t] || t}</option>)}
        </select>
        {(type === 'job_result') && (
          <select value={jobKey} onChange={(e) => setJobKey(e.target.value)} aria-label={tr({ sv: 'Placering', en: 'Placement' })}>
            <option value="">{tr({ sv: '— välj anställning —', en: '— choose the job —' })}</option>
            {placementOptions.map((o) => <option key={o.jobKey} value={o.jobKey}>{o.label}</option>)}
          </select>
        )}
      </div>
      {/* 3.6 — the placement stated in plain words, always */}
      <div className="cap" style={{ fontWeight: 700 }}>
        {placement
          ? tr({ sv: `Detta kommer att stå under: ${placement}`, en: `This will appear under: ${placement}` })
          : tr({ sv: 'Välj var raden hör hemma innan du sparar.', en: 'Choose where this line belongs before saving.' })}
        {needsPlacement && jobKey ? ' ' + tr({ sv: '(din placering — källan anger ingen arbetsgivare)', en: '(your placement — the source names no employer)' }) : ''}
      </div>
      {err && (
        <div className="loop__res loop__res--fail">
          <Icon name="refresh" size={16} />
          <div className="loop__res-b"><div className="loop__res-m">{err}</div></div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="primary" size="sm" icon="check" onClick={accept} disabled={busy || (type === 'job_result' && !jobKey)}>
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
  const [cases, setCases] = React.useState([]);
  const [caseId, setCaseId] = React.useState('');
  const [target, setTarget] = React.useState(null);
  const [suggesting, setSuggesting] = React.useState(false);
  const [suggestNote, setSuggestNote] = React.useState(null);
  const [minted, setMinted] = React.useState([]);

  // upload form
  const [upName, setUpName] = React.useState('');
  const [upText, setUpText] = React.useState('');
  const [upClass, setUpClass] = React.useState('cover_letter');
  const [upErr, setUpErr] = React.useState(null);
  const [upBusy, setUpBusy] = React.useState(false);

  // person-typed entry (3.7 — the invited first-class path)
  const [ownText, setOwnText] = React.useState('');
  const [ownType, setOwnType] = React.useState('job_result');
  const [ownJob, setOwnJob] = React.useState('');
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
    }).catch(() => {});
  }, []);

  React.useEffect(() => { refreshDocs(); refreshProposals(); listCases().then(setCases).catch(() => {}); }, [refreshDocs, refreshProposals]);
  React.useEffect(() => {
    if (!caseId) { setTarget(null); return; }
    getTarget(caseId).then((b) => setTarget(b.ok ? b.target : { error: b.error })).catch(() => setTarget(null));
  }, [caseId]);

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setUpName(f.name);
    const reader = new FileReader();
    reader.onload = () => setUpText(String(reader.result || ''));
    reader.readAsText(f);
  };

  const doUpload = async () => {
    setUpBusy(true); setUpErr(null);
    const b = await uploadDocument({ name: upName || tr({ sv: 'Inklistrad text', en: 'Pasted text' }), text: upText, attestedClass: upClass });
    setUpBusy(false);
    if (b && b.ok) { setUpText(''); setUpName(''); refreshDocs(); }
    else setUpErr((b && b.error) || 'unknown error'); // the explicit failed envelope, shown as-is
  };

  const doSuggest = async () => {
    setSuggesting(true); setSuggestNote(null);
    try {
      const b = await suggestFacts({ caseId: caseId || null });
      setSuggestNote(b.ok ? {
        drafted: b.drafted, barredDocuments: b.barredDocuments || [], barredSpans: b.barredSpans || [], skippedSpans: b.skippedSpans || 0,
      } : { error: b.error });
    } catch (err) { setSuggestNote({ error: err.message }); }
    setSuggesting(false);
    refreshProposals();
  };

  const doOwnMint = async () => {
    setOwnBusy(true); setOwnErr(null);
    const b = await mintPersonFact({ text: ownText, attribution: { type: ownType, jobKey: ownJob || null, personPlaced: true } });
    setOwnBusy(false);
    if (b && b.ok) { setOwnText(''); setMinted((m) => [b.result.fact, ...m]); }
    else setOwnErr((b && b.result && b.result.reason) || (b && b.error) || 'unknown error');
  };

  const classes = CLASS_LABELS();
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
          <select value={ownType} onChange={(e) => setOwnType(e.target.value)}>
            {factTypes.map((t) => <option key={t} value={t}>{types[t] || t}</option>)}
          </select>
          {ownType === 'job_result' && (
            <select value={ownJob} onChange={(e) => setOwnJob(e.target.value)}>
              <option value="">{tr({ sv: '— välj anställning —', en: '— choose the job —' })}</option>
              {placementOptions.map((o) => <option key={o.jobKey} value={o.jobKey}>{o.label}</option>)}
            </select>
          )}
          <Button variant="primary" size="sm" icon="check" onClick={doOwnMint}
            disabled={ownBusy || !ownText.trim() || (ownType === 'job_result' && !ownJob)}>
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

      {/* 3.4 — intake with attestation */}
      <ContentBox style={{ display: 'grid', gap: 'var(--sp-3)' }}>
        <b>{tr({ sv: 'Lägg till ett dokument', en: 'Add a document' })}</b>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="file" accept=".txt,.md,text/plain" onChange={onFile} />
          <input type="text" value={upName} onChange={(e) => setUpName(e.target.value)} placeholder={tr({ sv: 'Namn', en: 'Name' })} />
        </div>
        <textarea className="loop__ta" rows={5} value={upText} onChange={(e) => setUpText(e.target.value)}
          placeholder={tr({ sv: '…eller klistra in texten här (txt/inklistrat — PDF/DOCX stöds inte ännu)', en: '…or paste the text here (txt/pasted — PDF/DOCX not supported yet)' })} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <label className="cap" style={{ fontWeight: 700 }}>{tr({ sv: 'Vad är det här?', en: 'What is this?' })}</label>
          <select value={upClass} onChange={(e) => setUpClass(e.target.value)}>
            {classes.map((c) => <option key={c.v} value={c.v}>{c.t}</option>)}
          </select>
          <Button variant="primary" size="sm" icon="plus" onClick={doUpload} disabled={upBusy || !upText.trim()}>
            {upBusy ? tr({ sv: 'Laddar upp…', en: 'Uploading…' }) : tr({ sv: 'Spara dokument', en: 'Save document' })}
          </Button>
        </div>
        {upErr && (
          <div className="loop__res loop__res--fail">
            <Icon name="refresh" size={16} />
            <div className="loop__res-b"><div className="loop__res-m">{upErr}</div></div>
          </div>
        )}
        {docsStatus === 'ready' && docs.length > 0 && (
          <div style={{ display: 'grid', gap: 8 }}>
            {docs.map((d) => (
              <div key={d.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Icon name="cv" size={14} />
                <b>{d.name}</b>
                <Tag variant={['job_ad', 'third_party'].includes(d.attestedClass) ? 'warn' : 'ok'}>{(classes.find((c) => c.v === d.attestedClass) || {}).t || d.attestedClass}</Tag>
                <span className="cap">{d.spanCount} {tr({ sv: 'textavsnitt', en: 'spans' })}</span>
                <button className="ll-link ll-link--text" style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}
                  onClick={() => deleteDocument(d.id).then(refreshDocs)}>
                  {tr({ sv: 'Radera', en: 'Delete' })}
                </button>
              </div>
            ))}
          </div>
        )}
      </ContentBox>

      {/* Section 4A/4C — draft standing or against an ad */}
      <ContentBox style={{ display: 'grid', gap: 'var(--sp-3)' }}>
        <b>{tr({ sv: 'Föreslå CV-rader ur materialet', en: 'Draft CV lines from the material' })}</b>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={caseId} onChange={(e) => setCaseId(e.target.value)}>
            <option value="">{tr({ sv: 'Utan annons (stående förslag)', en: 'Without an ad (standing suggestions)' })}</option>
            {cases.map((c) => <option key={c.meta.id} value={c.meta.id}>{c.meta.company} · {c.meta.role}</option>)}
          </select>
          <Button variant="secondary" size="sm" icon="sparkle" onClick={doSuggest} disabled={suggesting || docs.length === 0}>
            {suggesting ? tr({ sv: 'Lilly läser…', en: 'Lilly is reading…' }) : tr({ sv: 'Föreslå fakta', en: 'Draft proposals' })}
          </Button>
        </div>
        {/* Section 4A — the pre-draft thinness face, said plainly */}
        {target && target.thinTop && target.thinTop.length > 0 && (
          <div className="loop__res loop__res--gap">
            <Icon name="bulb" size={16} />
            <div className="loop__res-b">
              <div className="loop__res-t">{tr({ sv: 'Annonsen väger krav tungt där ditt underlag är tunt', en: 'The ad weighs requirements your pool is thin on' })}</div>
              <div className="loop__res-m">
                {target.thinTop.map((r) => `“${r.requirement}” (${tr({ sv: 'vikt', en: 'weight' })} ${r.weight}/5)`).join(' · ')}
                {' — '}
                {tr({ sv: 'ladda upp material eller skriv egna rader ovan, så kan Lilly föreslå därifrån.', en: 'upload material or type your own lines above, and Lilly can draft from there.' })}
              </div>
            </div>
          </div>
        )}
        {suggestNote && suggestNote.error && (
          <div className="loop__res loop__res--fail"><Icon name="refresh" size={16} /><div className="loop__res-b"><div className="loop__res-m">{suggestNote.error}</div></div></div>
        )}
        {suggestNote && !suggestNote.error && (
          <div className="cap">
            {tr({ sv: 'Utkast', en: 'Drafted' })}: <b>{suggestNote.drafted}</b>
            {suggestNote.barredSpans.length > 0 && <> · {tr({ sv: 'avvisade avsnitt', en: 'barred spans' })}: {suggestNote.barredSpans.map((s) => s.detectedClass).join(', ')}</>}
            {suggestNote.barredDocuments.length > 0 && <> · {tr({ sv: 'spärrade dokument (annons/tredje part)', en: 'barred documents (ad/third-party)' })}: {suggestNote.barredDocuments.length}</>}
            {suggestNote.skippedSpans > 0 && <> · {tr({ sv: 'väntande avsnitt', en: 'spans left for a later run' })}: {suggestNote.skippedSpans}</>}
          </div>
        )}
      </ContentBox>

      {/* the review queue */}
      {proposals.length > 0 && (
        <ContentBox style={{ display: 'grid', gap: 'var(--sp-3)' }}>
          <b>{tr({ sv: 'Förslag att granska', en: 'Proposals to review' })} ({proposals.length})</b>
          {proposals.map((p) => (
            <ProposalReviewCard key={p.id + (p.nonce || '')} proposal={p} placementOptions={placementOptions} factTypes={factTypes}
              onDone={() => refreshProposals()} />
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
