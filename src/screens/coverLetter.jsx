// HelloLilly — Personligt brev (design-system era, bound to the coverLetter part)
// ----------------------------------------------------------------------------
// Master-spec binding:  POST /api/case/:id/generate → case part coverLetter
//   coverLetter = { language, paragraphs[], unsupported_by_cv[] }
// The screen SURFACES and REVIEWS the generated letter — it does not author the
// prose from scratch. Three honest surfaces:
//   • Styrkor att lyfta   ← fit.capability (matches) vs decodedRole (what the ad rewards)
//   • Ditt brev           ← coverLetter.paragraphs[], editable in place
//   • Ärlighetskoll       ← coverLetter.unsupported_by_cv[]: each flagged claim,
//                            keep / soften / cut (the honesty core of the screen)
// Honest states throughout via PartGate (pending / ready / failed / absent).
// Daniel's real persona from meta — no Amir fixtures, no demobar.
//
// Ported from design/design/screens-letter2.jsx. The MARKUP is preserved; only
// the fixture bridge is swapped for the real one:
//   • useCase()            → useActiveCase()/useActiveCaseId() + casePartsView + caseMetaView
//   • parts.X.status/.data → parts.X (unwrapped) + parts.statusOf('coverLetter')
//   • parts.meta.data.person → caseMetaView(caseData).person (Daniel from profile.mjs)
//   • llStore.letterReviewed → a small localStorage flag (mirrors jobStore's pattern)
// Save-and-resume is real: the editable body seeds from the durable coverLetterDraft
// (draft WINS) or the letter, decisions are keyed by CLAIM TEXT (stable across
// save + regeneration), and "Spara utkast" persists via actions.saveLetterDraft.
// ============================================================================

import React from 'react';
import { Icon, Button } from '../components/primitives.jsx';
import { Sidebar } from '../components/shell.jsx';
import { PageTemplate, ContentArea, ContentBox, CrossColumn } from '../components/grid.jsx';
import { useActiveCase, useActiveCaseId } from '../hooks/useCase.js';
import { casePartsView } from '../hooks/casePartsView.mjs';
import { caseMetaView } from '../hooks/caseMetaView.mjs';
import { PartGate, PartState, PartSkeleton, STATUS } from '../components/partGate.jsx';
import { tr, useLang, LangToggle } from '../lib/i18n.mjs';
import { seedEditor, unresolvedCount, remapDecisions } from '../lib/letterDraft.mjs';

function LETTER_CROSS() {
  return [
    { kind:'Styrka',  icon:'sparkle', title:tr({ sv:'Dina starkaste bevis', en:'Your strongest proof' }), nav:tr({sv:'Analys',en:'Analysis'}), why:tr({ sv:'Matchanalysen visar vad som drar mest', en:'The match analysis shows what lands hardest' }), to:'match' },
    { kind:'Exempel', icon:'doc',     title:tr({ sv:'Starka öppningar för rollen', en:'Strong openings for this role' }), nav:tr({sv:'Mall',en:'Template'}), why:tr({ sv:'Rollspecifika exempel', en:'Role-specific examples' }) },
    { kind:'Research',icon:'search',  title:tr({ sv:'Research om klienten', en:'Research on the client' }), nav:tr({sv:'Dossier',en:'Dossier'}), why:tr({ sv:'Från Lillys företagsresearch', en:'From Lilly’s company research' }) },
    { kind:'Coach',   icon:'users',   title:tr({ sv:'Coach som kan sälja dig rätt', en:'Coach who can pitch you right' }), nav:tr({sv:'Sara',en:'Sara'}), why:tr({ sv:'Läser gärna innan du skickar', en:'Happy to read before you send' }), to:'coach' },
  ];
}

/* ---------- small durable flag: "letter reviewed" per case (mirrors jobStore's
   localStorage pattern — the design's llStore is not part of the real app). ---- */
const LETTER_REVIEWED_KEY = 'hellolilly:letter-reviewed';
function canStore() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}
function readReviewed() {
  if (!canStore()) return {};
  try { const raw = window.localStorage.getItem(LETTER_REVIEWED_KEY); return raw ? JSON.parse(raw) : {}; }
  catch { return {}; }
}
function writeReviewed(map) {
  if (!canStore()) return;
  try { window.localStorage.setItem(LETTER_REVIEWED_KEY, JSON.stringify(map)); } catch { /* storage unavailable */ }
  window.dispatchEvent(new CustomEvent('ll:letter-reviewed:changed'));
}

/* ---------- PDF-ish download (client-side HTML blob) ---------- */
function letterDocHtml(app, person, paraTexts) {
  const p = person || {};
  const body = (paraTexts || []).filter(x => x && x.trim());
  return `<body style="font-family:sans-serif;max-width:640px;margin:40px auto;color:#16233A"><p style="font-weight:bold">${app.company}</p><h3>Ansökan: ${app.jobTitle}</h3>${body.map(x => `<p>${x}</p>`).join('')}<p style="font-weight:bold">${p.name || ''}</p><p style="color:#666">${p.contact || ''}</p></body>`;
}
function downloadLetter(app, person, paraTexts) {
  const blob = new Blob(['<!doctype html><meta charset="utf-8">' + letterDocHtml(app, person, paraTexts)], { type:'text/html' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = 'Brev_' + String(app.company || 'Brev').replace(/\W+/g, '_') + '.html';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ---------- One editable paragraph ---------- */
function Para({ index, text, edited, added, onChange, onRemove }) {
  const ref = React.useRef(null);
  const fit = () => { const el = ref.current; if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } };
  React.useEffect(fit, [text]);
  return (
    <div className={`para ${added ? 'para--added' : ''}`}>
      {edited && !added && <span className="para__edited">{tr({ sv:'Redigerad', en:'Edited' })}</span>}
      {added && <span className="para__edited para__edited--add">{tr({ sv:'Tillagt', en:'Added' })}</span>}
      <textarea ref={ref} rows={2} className="para__text" value={text} autoFocus={added && text === ''}
        onChange={e => onChange(index, e.target.value)} aria-label={tr({ sv:'Stycke ' + (index + 1), en:'Paragraph ' + (index + 1) })} />
      {added && <button type="button" className="para__del" onClick={() => onRemove(index)} aria-label={tr({ sv:'Ta bort stycke', en:'Remove paragraph' })}>×</button>}
    </div>
  );
}

/* ---------- insert-a-paragraph affordance (the + between/around paras) ---------- */
function ParaInsert({ onClick }) {
  return (
    <div className="para-ins">
      <button type="button" className="para-ins__btn" onClick={onClick} aria-label={tr({ sv:'Lägg till stycke här', en:'Add paragraph here' })}>
        <Icon name="plus" size={14} sw={3} />
      </button>
    </div>
  );
}

/* ---------- Honesty flag: one unsupported_by_cv claim, keep / soften / cut ----
   The honesty core of the screen. The backend flags a claim in the generated
   letter that isn't backed by the CV; the person decides what to do with it.
   No fabrication is defended silently — every flag must be answered. */
const FLAG_CHOICES = [
  { key:'keep',   label:{ sv:'Behåll',    en:'Keep' },   done:{ sv:'Du står bakom den',        en:'You stand behind it' },       hint:{ sv:'Behåll den — du kan belägga den i intervjun.', en:'Keep it — you can back it up in the interview.' } },
  { key:'soften', label:{ sv:'Mjuka upp', en:'Soften' }, done:{ sv:'Formuleras försiktigare', en:'Reworded more carefully' },   hint:{ sv:'Formulera om mjukare, utan att påstå för mycket.', en:'Reword it softer, without overclaiming.' } },
  { key:'cut',    label:{ sv:'Ta bort',   en:'Cut' },    done:{ sv:'Tas bort ur brevet',       en:'Removed from the letter' },   hint:{ sv:'Ta bort meningen helt — inget påhittat i brevet.', en:'Remove the sentence entirely — nothing invented.' } },
];
function LetterFlag({ claim, decision, onDecide }) {
  const resolved = !!decision;
  const chosen = FLAG_CHOICES.find(c => c.key === decision);
  return (
    <div className={`flag ${resolved ? 'flag--resolved' : ''}`}>
      <div className="flag__top">
        <Icon name={resolved ? 'check' : 'bulb'} size={16} sw={2.4} />
        <div className="flag__text">
          <span className="cap" style={{ display:'block', color: resolved ? 'var(--ll-green)' : '#8a5a0e', fontWeight:800, letterSpacing:'var(--tracking-eyebrow)', textTransform:'uppercase', fontSize:'var(--fs-2xs)', marginBottom:4 }}>
            {resolved ? tr({ sv:'Hanterad', en:'Handled' }) : tr({ sv:'Stöds inte av ditt CV', en:'Not backed by your CV' })}
          </span>
          <span style={{ fontStyle:'italic' }}>”{claim}”</span>
          {!resolved && <span style={{ display:'block', marginTop:6, color:'var(--ll-ink-soft)', fontSize:'var(--fs-xs)' }}>{tr({ sv:'Vill du behålla, mjuka upp eller ta bort den?', en:'Keep, soften, or cut it?' })}</span>}
        </div>
      </div>
      <div className="flag__acts">
        {FLAG_CHOICES.map(c => (
          <button key={c.key} className="flag__btn" aria-pressed={decision === c.key}
            onClick={() => onDecide(decision === c.key ? null : c.key)}>{tr(c.label)}</button>
        ))}
      </div>
      {resolved && (
        <span className="flag__done">
          <Icon name="check" size={12} sw={3} />{tr(chosen.done)} · <span style={{ color:'var(--ll-ink-soft)', fontWeight:500 }}>{tr(chosen.hint)}</span>
        </span>
      )}
    </div>
  );
}

/* ---------- open the review layover (carries the honesty flags too) ---------- */
function openLetterReview(app, person, paraTexts, unsupported, decisions) {
  window.dispatchEvent(new CustomEvent('ll:helpful:open', { detail: {
    kind:'letterreview', id: app.id, company: app.company, jobTitle: app.jobTitle, url: app.url,
    person, paragraphs: (paraTexts || []).filter(x => x && x.trim()),
    unsupported: unsupported || [], flagDecisions: decisions || {},
  } }));
}

/* ---------- The screen ---------- */
function CoverLetter() {
  useLang();
  const caseId = useActiveCaseId();
  const { caseData, running, actions } = useActiveCase();
  const parts = casePartsView(caseData);
  const meta = caseMetaView(caseData);
  const person = meta.person || {};

  const status = parts.statusOf('coverLetter');
  const cl = parts.coverLetter;                 // { paragraphs, unsupported_by_cv, language } | null
  const draft = parts.coverLetterDraft;         // { paragraphs, decisions, editedAt } | null

  // Editable paragraph body — each entry { text, seed }; seed is the generated
  // original (null = user-added). Honesty decisions keyed by CLAIM TEXT.
  const [paras, setParas] = React.useState(null);
  const [flagDec, setFlagDec] = React.useState({});
  const [savedNote, setSavedNote] = React.useState(false);

  // "Klart" flag persists per case in localStorage (mirrors jobStore).
  const [reviewed, setReviewed] = React.useState(() => !!(readReviewed()[caseId]));
  React.useEffect(() => {
    const sync = () => setReviewed(!!(readReviewed()[caseId]));
    sync();
    window.addEventListener('ll:letter-reviewed:changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('ll:letter-reviewed:changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, [caseId]);

  // Resume-on-open: seed the editor from the durable draft OR the letter.
  // draft WINS if present (that's what makes save-and-resume work). Reseeds when
  // a fresh letter is generated or the draft changes (seedKey).
  const seedKey = (cl ? cl.paragraphs.join('') : '') + '::' + (draft ? draft.editedAt : '');
  React.useEffect(() => {
    if (!cl && !draft) { setParas(null); return; }
    const seed = seedEditor(draft, cl);
    setParas(seed.paragraphs.map((t) => ({ text: t, seed: t })));
    setFlagDec(seed.decisions);
  }, [seedKey]);

  const list = paras || [];
  const setPara = (i, text) => setParas(ps => ps.map((p, j) => j === i ? { ...p, text } : p));
  const insertPara = (i) => setParas(ps => [...ps.slice(0, i), { text:'', seed:null }, ...ps.slice(i)]);
  const removePara = (i) => setParas(ps => ps.filter((_, j) => j !== i));
  // decisions keyed by claim TEXT (not index), so save + regeneration re-map stably.
  const decide = (claim, v) => setFlagDec(d => { const n = { ...d }; if (v == null) delete n[claim]; else n[claim] = v; return n; });

  const onGenerate = React.useCallback(() => { actions.generate().catch(() => {}); }, [actions]);

  // Deep-open from Ansökningskoll ("Skapa personligt brev"): ensure a letter exists.
  React.useEffect(() => {
    const onOpen = () => {
      window.scrollTo({ top: 0 });
      if (parts.statusOf('coverLetter') === STATUS.ABSENT) onGenerate();
    };
    window.addEventListener('ll:letter:open', onOpen);
    return () => window.removeEventListener('ll:letter:open', onOpen);
  }, [status, onGenerate]);

  // "Spara utkast" — ALWAYS enabled. Persists paragraphs + claim-keyed decisions
  // via the durable coverLetterDraft. THIS is what makes resume work.
  const saveDraft = async () => {
    await actions.saveLetterDraft({
      paragraphs: list.map(p => p.text),
      decisions: flagDec,
      language: (cl && cl.language) || (draft && draft.language) || 'en',
    });
    setSavedNote(true); setTimeout(() => setSavedNote(false), 2400);
  };

  const markReviewed = () => {
    const map = readReviewed();
    writeReviewed({ ...map, [caseId]: true });
    setSavedNote(true); setTimeout(() => setSavedNote(false), 2400);
  };
  const reopen = () => {
    const map = { ...readReviewed() }; delete map[caseId];
    writeReviewed(map);
  };

  // Regenerate affordance: a draft exists AND the underlying letter differs from
  // the draft body → offer to discard the draft seed and reseed from the letter,
  // so a stale draft never silently hides a freshly regenerated letter.
  const letterDiffersFromDraft = !!(cl && draft && Array.isArray(draft.paragraphs) &&
    (draft.paragraphs.length !== cl.paragraphs.length ||
      draft.paragraphs.some((t, i) => t !== cl.paragraphs[i])));
  const reseedFromLetter = () => {
    if (!cl) return;
    setParas(cl.paragraphs.map((t) => ({ text: t, seed: t })));
    setFlagDec(remapDecisions(flagDec, cl.unsupported_by_cv));
  };

  const unresolvedFlags = cl ? unresolvedCount(cl.unsupported_by_cv, flagDec) : 0;

  const app = {
    id: caseId, company: meta.company, jobTitle: meta.jobTitle, url: meta.url,
  };

  // Strengths (matched requirements) vs what the ad rewards (its full weighted ask,
  // gaps included — so the two columns differ honestly).
  const reqLabelById = {};
  ((parts.decodedRole && parts.decodedRole.requirements) || []).forEach(r => { reqLabelById[r.id] = r.requirement; });
  const fitReqs = (parts.fit && parts.fit.capability && parts.fit.capability.requirements) || [];
  const strengths = fitReqs.filter(r => r.status === 'match').map(r => reqLabelById[r.requirementRef.id]).filter(Boolean).slice(0, 4);
  const weightRank = { high:0, medium:1, low:2 };
  const rewards = ((parts.decodedRole && parts.decodedRole.requirements) || []).slice()
    .sort((a, b) => (weightRank[a.weight] ?? 3) - (weightRank[b.weight] ?? 3))
    .map(r => r.requirement).slice(0, 5);

  const cross = <CrossColumn title={tr({ sv:'Underlag för brevet', en:'Material for the letter' })} sub={tr({ sv:'Det brevet grundas i — annons, CV och analys.', en:'What the letter is grounded in — ad, CV and analysis.' })} items={LETTER_CROSS()} />;

  const body = (
    <React.Fragment>
      {/* Context: which role this letter targets */}
      <div className="ctxbar">
        <span className="ctxbar__logo" style={{ background:'var(--ll-lilac)' }}>{(meta.company || 'CO').slice(0, 2).toUpperCase()}</span>
        <div className="ctxbar__b">
          <div className="ctxbar__t">{meta.jobTitle}{meta.company ? ' · ' + meta.company : ''}</div>
          <div className="ctxbar__m">{[meta.location, meta.employment].filter(Boolean).map(x => x + ' · ').join('')}{tr({ sv:'Brev på engelska · svenska kommer', en:'Letter in English · Swedish coming' })}</div>
        </div>
        {reviewed && <span className="cvrow__donetag" style={{ marginLeft:'auto' }}>{tr({ sv:'Klart', en:'Done' })}</span>}
      </div>

      {/* Strengths to lead with vs what the ad rewards (from fit + decodedRole) */}
      <ContentBox>
        <div className="secrow">
          <Icon name="sparkle" size={20} style={{ color:'var(--ll-blue)' }} />
          <h3>{tr({ sv:'Styrkor att lyfta', en:'Strengths to lead with' })}</h3>
        </div>
        <p className="text-soft" style={{ fontSize:'var(--fs-xs)', margin:'0 0 var(--sp-3)' }}>{tr({ sv:'Brevet säljer dina starkaste bevis mot det annonsen faktiskt belönar — inte en ursäkt för luckor.', en:'The letter sells your strongest proof against what the ad actually rewards — not an apology for gaps.' })}</p>
        <div className="lt-cols">
          <div>
            <div className="lt-col-h">{tr({ sv:'Dina styrkor', en:'Your strengths' })}</div>
            <div className="concern">{strengths.map((s, i) => <span key={i} className="concern__chip concern__chip--on"><Icon name="check" size={12} sw={3} />{s}</span>)}</div>
          </div>
          <div>
            <div className="lt-col-h">{tr({ sv:'Vad annonsen belönar', en:'What the ad rewards' })}</div>
            <div className="concern">{rewards.map((s, i) => <span key={i} className="concern__chip concern__chip--reward"><Icon name="target" size={12} sw={2.4} />{s}</span>)}</div>
          </div>
        </div>
      </ContentBox>

      {/* The letter — bound to coverLetter, with honest states via PartGate */}
      <ContentBox className="ll-box--feature">
        <PartGate
          status={status}
          busy={running.generate}
          pending={<PartSkeleton lines={6} />}
          failed={
            <PartState tone="fail" title={tr({ sv:'Brevet kunde inte skrivas', en:'Couldn’t write the letter' })} body={(cl && cl.error) || tr({ sv:'Ingen gammal data visas — försök igen.', en:'No stale data shown — try again.' })}>
              <Button variant="secondary" size="sm" icon="refresh" onClick={onGenerate} disabled={running.generate}>{tr({ sv:'Försök igen', en:'Try again' })}</Button>
            </PartState>
          }
          absent={
            <PartState title={tr({ sv:'Inget brev genererat ännu', en:'No letter generated yet' })} body={tr({ sv:'Lilly skriver ett rollspecifikt brev av ditt CV och analysen — varje påstående grundat, flaggar det som inte är det.', en:'Lilly writes a role-specific letter from your CV and the analysis — every claim grounded, and flags what isn’t.' })}>
              <Button variant="primary" icon={running.generate ? null : 'sparkle'} onClick={onGenerate} disabled={running.generate}>
                {running.generate ? tr({ sv:'Skriver…', en:'Writing…' }) : tr({ sv:'Skriv brev', en:'Write letter' })}
              </Button>
            </PartState>
          }>
          <div className="letterview">
            <div className="secrow">
              <Icon name="letter" size={20} style={{ color:'var(--ll-lilac)' }} />
              <h3>{tr({ sv:'Ditt brev', en:'Your letter' })}</h3>
              <span className="text-muted" style={{ fontSize:'var(--fs-2xs)' }}>{tr({ sv:'Klicka i ett stycke för att redigera', en:'Click a paragraph to edit' })}</span>
              <Button variant="secondary" size="sm" icon={running.generate ? null : 'refresh'} onClick={onGenerate} disabled={running.generate} style={{ marginLeft:'auto' }}>
                {running.generate ? tr({ sv:'Skriver om…', en:'Rewriting…' }) : tr({ sv:'Skriv om', en:'Rewrite' })}
              </Button>
            </div>
            {letterDiffersFromDraft && (
              <div className="feedbackline" style={{ margin:'0 0 var(--sp-3)', alignItems:'center' }}>
                <Icon name="sparkle" size={16} sw={2.4} style={{ color:'var(--ll-blue)' }} />
                <span style={{ fontSize:'var(--fs-xs)' }}>{tr({ sv:'Ett nyare brev finns — du redigerar ett sparat utkast.', en:'A newer letter exists — you’re editing a saved draft.' })}</span>
                <Button variant="secondary" size="sm" icon="refresh" onClick={reseedFromLetter} style={{ marginLeft:'auto' }}>{tr({ sv:'Uppdatera från nytt brev', en:'Update from new letter' })}</Button>
              </div>
            )}
            <div className="paper paper--letter" style={{ maxHeight:'none' }}>
              <p style={{ fontWeight:700 }}>{meta.company}</p>
              <p className="paper__subject">{tr({ sv:'Ansökan: ', en:'Application: ' })}{meta.jobTitle}</p>
              {list.map((p, i) => (
                <React.Fragment key={i}>
                  <ParaInsert onClick={() => insertPara(i)} />
                  <Para index={i} text={p.text} edited={p.seed != null && p.text !== p.seed} added={p.seed == null} onChange={setPara} onRemove={removePara} />
                </React.Fragment>
              ))}
              <ParaInsert onClick={() => insertPara(list.length)} />
              <p style={{ fontWeight:700, marginTop:'var(--sp-3)' }}>{person.name}</p>
            </div>
          </div>
        </PartGate>
      </ContentBox>

      {/* Ärlighetskoll — the unsupported_by_cv honesty panel (the priority) */}
      {cl && (
        <ContentBox>
          <div className="secrow">
            <Icon name={unresolvedFlags === 0 ? 'check' : 'bulb'} size={20} style={{ color: unresolvedFlags === 0 ? 'var(--ll-green)' : 'var(--ll-coral)' }} />
            <h3>{tr({ sv:'Ärlighetskoll', en:'Honesty check' })}</h3>
            {cl.unsupported_by_cv.length > 0 && (
              <span className={`secrow__pill ${unresolvedFlags === 0 ? 'secrow__pill--ok' : 'secrow__pill--gap'}`}>
                {unresolvedFlags === 0 ? tr({ sv:'Alla hanterade', en:'All handled' }) : unresolvedFlags + ' ' + tr({ sv:'att svara på', en:'to answer' })}
              </span>
            )}
          </div>

          {cl.unsupported_by_cv.length === 0 ? (
            <div className="guarantee"><Icon name="check" size={14} sw={3} />{tr({ sv:'Inga flaggade påståenden — varje mening i brevet har stöd i ditt CV.', en:'No flagged claims — every sentence in the letter is backed by your CV.' })}</div>
          ) : (
            <React.Fragment>
              <p className="text-soft" style={{ fontSize:'var(--fs-xs)', margin:'0 0 var(--sp-3)' }}>{tr({ sv:'Lilly hittade påståenden i brevet som inte täcks av ditt CV. Inget döljs och inget hittas på — du bestämmer vad som händer med varje ett.', en:'Lilly found claims in the letter your CV doesn’t back. Nothing is hidden and nothing is invented — you decide what happens with each one.' })}</p>
              <div className="flaglist" style={{ display:'flex', flexDirection:'column', gap:'var(--sp-3)' }}>
                {cl.unsupported_by_cv.map((claim) => (
                  <LetterFlag key={claim} claim={claim} decision={flagDec[claim]} onDecide={(v) => decide(claim, v)} />
                ))}
              </div>
              {unresolvedFlags === 0 && (
                <div className="guarantee" style={{ marginTop:'var(--sp-3)' }}><Icon name="check" size={14} sw={3} />{tr({ sv:'Alla flaggor genomgångna 💙 Brevet är ärligt mot ditt CV.', en:'All flags reviewed 💙 The letter is honest to your CV.' })}</div>
              )}
            </React.Fragment>
          )}
        </ContentBox>
      )}

      {/* Finish CTAs */}
      {cl && (
        <ContentBox tone="tint">
          <div className="letter-finish">
            <div className="letter-finish__b">
              <div className="letter-finish__t">{tr({ sv:'Klar med brevet?', en:'Done with the letter?' })}</div>
              <div className="text-soft" style={{ fontSize:'var(--fs-sm)', marginTop:2 }}>{unresolvedFlags > 0
                ? tr({ sv:'Spara utkast när som helst. Svara på ärlighetsflaggorna ovan innan du markerar brevet klart.', en:'Save a draft anytime. Answer the honesty flags above before you mark the letter done.' })
                : tr({ sv:'Spara utkast för att fortsätta senare, eller markera brevet som klart.', en:'Save a draft to continue later, or mark the letter done.' })}</div>
              {savedNote && <span className="comment-saved"><Icon name="check" size={13} sw={3} />{tr({ sv:'Utkast sparat', en:'Draft saved' })}</span>}
            </div>
            <Button variant="secondary" icon={running.saveLetterDraft ? null : 'check'} onClick={saveDraft} disabled={running.saveLetterDraft}>
              {running.saveLetterDraft ? tr({ sv:'Sparar…', en:'Saving…' }) : tr({ sv:'Spara utkast', en:'Save draft' })}
            </Button>
            {reviewed
              ? <Button variant="secondary" icon="refresh" onClick={reopen}>{tr({ sv:'Öppna igen', en:'Reopen' })}</Button>
              : <Button variant="primary" icon="check" disabled={unresolvedFlags > 0} onClick={markReviewed}>{tr({ sv:'Klar', en:'Done' })}</Button>}
            <Button variant="secondary" icon="download" onClick={() => downloadLetter(app, person, list.map(p => p.text))}>{tr({ sv:'Ladda ner PDF', en:'Download PDF' })}</Button>
            <Button variant="secondary" icon="search" onClick={() => openLetterReview(app, person, list.map(p => p.text), cl.unsupported_by_cv, flagDec)}>{tr({ sv:'Granska', en:'Review' })}</Button>
          </div>
        </ContentBox>
      )}
    </React.Fragment>
  );

  const head = (
    <div className="ll-pagehead">
      <div className="ll-pagehead__b">
        <h1>{tr({ sv:'Personligt brev', en:'Cover letter' })}</h1>
        <p className="ll-pagehead__sub">{tr({ sv:'Ett rollspecifikt brev som säljer dina styrkor mot det annonsen belönar — och flaggar ärligt det som inte har stöd i ditt CV.', en:'A role-specific letter that sells your strengths against what the ad rewards — and honestly flags what your CV doesn’t back.' })}</p>
      </div>
      <div className="ll-pagehead__actions"><LangToggle /></div>
    </div>
  );

  return (
    <PageTemplate
      label="Personligt brev"
      nav={<Sidebar active="letter" />}
      cross={cross}
      content={<ContentArea>{head}{body}</ContentArea>}
    />
  );
}

export { CoverLetter, LetterFlag, Para, ParaInsert };
