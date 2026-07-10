import React from 'react';
import { Icon, Clover, Button } from '../components/primitives.jsx';
import { Sidebar } from '../components/shell.jsx';
import { useActiveCase } from '../hooks/useCase.js';
import { casePartsView } from '../hooks/casePartsView.mjs';
import { caseMetaView } from '../hooks/caseMetaView.mjs';
import { PartGate, PartState, PartSkeleton } from '../components/partGate.jsx';
import { tr, useLang, LangToggle } from '../lib/i18n.mjs';
import { ContentArea, ContentBox, CrossColumn, PageTemplate, MatchRing } from '../components/grid.jsx';
import { listJobs, createCase, linkJobCase } from '../api/caseApi.js';
import { setActiveCaseId } from '../utils/jobStore.js';

// HelloLilly — Matchanalys (design-system era, T13 → T15)
// Ported from design/design/screens-match2.jsx.
// Wiring: useActiveCase → casePartsView (fit/gaps/decodedRole) + caseMetaView (company/title/logo).
// Per-job ANALYSIS is real (fit.score, gaps loop, fill-gap 3 honest outcomes, PartGate).
// QUEUE (T15): durable approved-jobs store via listJobs().filter(j => j.decision === 'approved'),
//   refetched on ll:jobs:changed. Fixture ANALYZED_JOBS removed.
// #triage → #jobbsok (standalone triage route retired).
// Inline "Ändra" evidence edits: LOCAL state only (not persisted — design intent preserved).
// CitationChip: _pool is empty this wave → honest generic fallback, no fabricated id, no false alarm.

/* ---------- Cross-column data ---------- */
const MATCH_CROSS = () => [
  { kind: 'CV',       icon: 'cv',      title: tr({ sv: 'CV-bulleten som täcker kravet', en: 'The CV bullet that covers the requirement' }), nav: tr({ sv: 'CV', en: 'CV' }),       why: tr({ sv: 'LTV-vs-CPA-raden matchar attribution-kravet', en: 'The LTV-vs-CPA line matches the attribution requirement' }), to: 'cv' },
  { kind: 'Brygga',  icon: 'sparkle', title: tr({ sv: 'Bryggan att använda i brevet', en: 'The bridge to use in the letter' }),             nav: tr({ sv: 'Brev', en: 'Letter' }), why: tr({ sv: 'Coinhero 0-till-1 - utan att överdriva', en: 'Coinhero 0-to-1 - without overclaiming' }),                   to: 'letter' },
  { kind: 'Intervju', icon: 'mic',     title: tr({ sv: 'Vanliga frågor för rollen', en: 'Common questions for this role' }),                 nav: tr({ sv: 'Öva', en: 'Practise' }), why: tr({ sv: 'Head of Acquisition · budget & attribution', en: 'Head of Acquisition · budget & attribution' }),             to: 'interview' },
  { kind: 'Coach',   icon: 'users',   title: tr({ sv: 'Coach med iGaming-erfarenhet', en: 'Coach with iGaming experience' }),               nav: tr({ sv: 'Sara', en: 'Sara' }),   why: tr({ sv: 'Kan dubbelkolla matchningen', en: 'Can double-check the match' }),                                              to: 'coach' },
];

/* ---------- Verdict headline based on score ---------- */
function verdictHeadline(score) {
  if (score >= 88) return tr({ sv: 'Stark match — gå för det.', en: 'Strong match — go for it.' });
  if (score >= 72) return tr({ sv: 'Bra match — med några luckor att fylla.', en: 'Good match — a few gaps to fill.' });
  return tr({ sv: 'Värd att överväga — några luckor att titta på.', en: 'Worth considering — some gaps to look at.' });
}

/* ---------- CitationChip ----------
   Resolves a citation against _pool. This wave _pool is always empty →
   degrade to the honest GENERIC form. Never fabricate an id, never raise
   a false "unresolvable" alarm. */
function CitationChip({ citation, pool, isNew }) {
  if (!citation) return null;
  const df = Array.isArray(pool) ? pool.find((f) => f.id === citation.id) : null;
  const type = (df && df.type) || tr({ sv: 'CV', en: 'CV' });
  return (
    <span className={`cite ${isNew ? 'cite--new' : ''}`}>
      <Icon name="doc" size={11} sw={2.4} />
      {isNew
        ? (df ? tr({ sv: 'Tillagt nyss · ' + type, en: 'Just added · ' + type }) : tr({ sv: 'Tillagt nyss', en: 'Just added' }))
        : df
          ? tr({ sv: 'Från ditt CV · ' + type, en: 'From your CV · ' + type })
          : tr({ sv: 'Från din datafakta-pool', en: 'From your datafact pool' })}
    </span>
  );
}

/* ---------- Fill-gap loop, for one gap ---------- */
function FillGap({ gap, reqLabel, onAnswer }) {
  const initialMode = gap.bridge && gap.bridge.mode === 'suggestion' ? 'suggestion' : 'question';
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState(initialMode);
  const [text, setText] = React.useState(gap.bridge && gap.bridge.mode === 'suggestion' ? (gap.bridge.body || '') : '');
  const [busy, setBusy] = React.useState(false);
  const [res, setRes] = React.useState(null); // { outcome, reason?, ... }

  const reset = () => {
    setMode(initialMode);
    setText(gap.bridge && gap.bridge.mode === 'suggestion' ? (gap.bridge.body || '') : '');
    setRes(null);
  };

  // Three honest outcomes: accepted / stays_gap / save_failed.
  // accepted → the store mutates and the screen reloads; this card unmounts.
  // stays_gap / save_failed → keep the user's typed text, show the banner.
  const submit = async (opts) => {
    setBusy(true);
    setRes(null);
    const r = await onAnswer(gap, text, opts || {});
    setBusy(false);
    setRes(r);
  };

  if (!open) {
    return (
      <div className="gapcard">
        <div className="gapcard__top">
          <span className="gapcard__ic"><Icon name="plus" size={14} sw={3} /></span>
          <div className="gapcard__b">
            <div className="gapcard__t">{gap.what}</div>
            <div className="gapcard__why">{gap.why}</div>
          </div>
        </div>
        {gap.bridge && gap.bridge.oneLiner && (
          <div className="gapcard__oneliner"><Icon name="sparkle" size={14} />{gap.bridge.oneLiner}</div>
        )}
        <div className="jobc__acts">
          <Button variant="secondary" size="sm" icon="pen" onClick={() => setOpen(true)}>
            {tr({ sv: 'Fyll den här', en: 'Fill this in' })}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="gapcard gapcard--open">
      <div className="gapcard__top">
        <span className="gapcard__ic"><Icon name="pen" size={13} sw={2.6} /></span>
        <div className="gapcard__b">
          <div className="gapcard__t">{gap.what}</div>
          <div className="gapcard__why">{gap.why}</div>
        </div>
      </div>

      <div className="loop">
        {gap.fillable !== 'credential' && (
          <div className="loop__mode" role="group" aria-label={tr({ sv: 'Hur vill du fylla luckan', en: 'How to fill the gap' })}>
            <button
              aria-pressed={mode === 'suggestion'}
              onClick={() => { setMode('suggestion'); setText(gap.bridge ? (gap.bridge.body || '') : ''); }}
            >{tr({ sv: 'Förslag', en: 'Suggestion' })}</button>
            <button
              aria-pressed={mode === 'own'}
              onClick={() => { setMode('own'); setText(''); }}
            >{tr({ sv: 'Skriv eget', en: 'Write my own' })}</button>
          </div>
        )}

        <div className="loop__label">
          {mode === 'question' || gap.fillable === 'credential'
            ? ((gap.bridge && gap.bridge.prompt) || tr({ sv: 'Ditt svar', en: 'Your answer' }))
            : tr({ sv: 'Förslag från Lilly — ändra fritt', en: "Lilly's suggestion — edit freely" })}
        </div>
        <textarea
          className="loop__ta"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={gap.fillable === 'credential'
            ? tr({ sv: 'T.ex. "Jag har bokat körlektioner, klar om ca 2 mån."', en: "e.g. \"I've booked lessons, done in ~2 months.\"" })
            : tr({ sv: 'Skriv en mening om vad du gjort…', en: "Write a sentence about what you've done…" })}
        />

        {/* outcome: accepted */}
        {res && res.outcome === 'accepted' && (
          <div className="loop__res loop__res--ok">
            <Icon name="check" size={18} sw={2.6} />
            <div className="loop__res-b">
              <div className="loop__res-t">{tr({ sv: 'Tillagt i ditt CV', en: 'Added to your CV' })}</div>
              <div className="loop__res-m">{tr({ sv: '“' + reqLabel + '” räknas nu som uppfyllt — och det är sparat för framtida jobb, inte bara det här.', en: '“' + reqLabel + '” now counts as met — and it’s saved for future jobs, not just this one.' })}</div>
            </div>
          </div>
        )}

        {/* outcome: stays_gap */}
        {res && res.outcome === 'stays_gap' && (
          <div className="loop__res loop__res--gap">
            <Icon name="bulb" size={18} />
            <div className="loop__res-b">
              <div className="loop__res-t">{tr({ sv: 'Det täcker inte luckan ännu', en: "That doesn't cover it yet" })}</div>
              <div className="loop__res-m">{gap.fillable === 'credential'
                ? tr({ sv: 'Det här är ett krav vi inte kan skriva oss förbi. Har du behörigheten — eller en konkret plan — så räknas det. Annars låter vi luckan stå öppen, ärligt.', en: "This is a requirement we can't write around. If you hold it — or have a concrete plan — it counts. Otherwise we leave it honestly open." })
                : tr({ sv: 'Skriv gärna lite mer konkret om vad du faktiskt gjort, så kan det räknas. Vi hittar aldrig på en match åt dig.', en: 'Add a bit more concretely what you actually did, then it can count. We never invent a match for you.' })}</div>
            </div>
          </div>
        )}

        {/* outcome: save_failed */}
        {res && res.outcome === 'save_failed' && (
          <div className="loop__res loop__res--fail">
            <Icon name="refresh" size={18} />
            <div className="loop__res-b">
              <div className="loop__res-t">{tr({ sv: 'Kunde inte spara', en: "Couldn't save" })}</div>
              <div className="loop__res-m">{tr({ sv: 'Din text finns kvar nedan — tryck Spara igen.', en: 'Your text is still here below — press Save again.' })}</div>
            </div>
          </div>
        )}

        {(!res || res.outcome !== 'accepted') && (
          <div className="loop__acts">
            <Button
              variant="primary"
              size="sm"
              icon={busy ? null : 'check'}
              onClick={() => submit()}
              disabled={busy}
            >
              {busy
                ? tr({ sv: 'Sparar…', en: 'Saving…' })
                : (mode === 'suggestion' && gap.fillable !== 'credential'
                  ? tr({ sv: 'Acceptera & spara', en: 'Accept & save' })
                  : tr({ sv: 'Spara', en: 'Save' }))}
            </Button>
            <button
              className="ll-link ll-link--text"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 4px' }}
              onClick={() => { reset(); setOpen(false); }}
            >
              {tr({ sv: 'Hoppa över', en: 'Skip' })}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Analyzed-jobs list row ----------
   T15: queue is durable approved jobs from listJobs(). Job records use the
   canonical store shape: co, t (title), city, match (score), caseId. */
function scoreTone(s) { return s >= 85 ? 'ok' : s >= 72 ? 'mid' : 'low'; }

function MatchRow({ job, onOpen, onQuick, onReject }) {
  const open = () => onOpen(job.id);
  const title = job.title || job.t || '';
  const location = job.location || job.city || '';
  const score = job.score != null ? job.score : (job.match || 0);
  const notMatching = job.notMatching || [];
  return (
    <article
      className="matchrow matchrow--clickable"
      onClick={open}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }}
    >
      <span className="matchrow__logo" style={{ color: job.logo }}>{(job.co || '??').slice(0, 2).toUpperCase()}</span>
      <div className="matchrow__b">
        <div className="matchrow__t">{title}</div>
        <div className="matchrow__m">
          <span>{job.co}</span><span className="dot" />
          <span>{location}</span><span className="dot" />
          <span>{job.type}</span>
        </div>
        {notMatching.length > 0 && (
          <div className="matchrow__gaps">
            <span className="matchrow__gaps-l">{tr({ sv: 'AI såg inte i ditt CV:', en: "AI didn't find in your CV:" })}</span>
            <div className="matchrow__gaps-chips">
              {notMatching.map((g, i) => (
                <span key={i} className="miss"><Icon name="plus" size={10} sw={3} />{g}</span>
              ))}
            </div>
          </div>
        )}
        {!job.caseId && (
          <div className="matchrow__gaps">
            <span className="matchrow__gaps-l" style={{ color: 'var(--ll-blue)' }}>
              {tr({ sv: 'Klar för analys', en: 'Ready for analysis' })}
            </span>
          </div>
        )}
      </div>
      <div className={`matchrow__score matchrow__score--${scoreTone(score)}`}>
        <b className="num">{score}%</b><span>match</span>
      </div>
      <div className="matchrow__acts">
        {!job.caseId ? (
          <Button variant="primary" size="sm" icon="target" onClick={(e) => { e.stopPropagation(); onOpen(job.id); }}>
            {tr({ sv: 'Analysera', en: 'Analyse' })}
          </Button>
        ) : (
          <Button variant="primary" size="sm" icon="target" onClick={(e) => { e.stopPropagation(); onQuick(job.id); }}>
            {tr({ sv: 'Snabbkoll', en: 'Quick read' })}
          </Button>
        )}
        <Button variant="ghost" size="sm" className="btn--reject" onClick={(e) => { e.stopPropagation(); onReject(job.id); }}>
          {tr({ sv: 'Välj bort', en: 'Reject' })}
        </Button>
      </div>
    </article>
  );
}

/* ---------- Durable approved-jobs queue (T15) ----------
   Reads from the persistent jobs store (listJobs filtered to decision === 'approved').
   Refetched on ll:jobs:changed so approve/reject events on other screens are reflected
   immediately. ANALYZED_JOBS fixture is gone; this is the authoritative queue. */

/* ============================================================
   Matchanalys — the main screen
   ============================================================ */
function JobMatchReview() {
  useLang();
  const { caseData, running, actions, error, refresh } = useActiveCase();
  const parts = casePartsView(caseData);
  const [generating, setGenerating] = React.useState(false);

  // QUEUE: durable approved jobs. Refetched on mount and on ll:jobs:changed.
  const [items, setItems] = React.useState([]);
  const reloadQueue = React.useCallback(() => {
    listJobs()
      .then((jobs) => setItems((jobs || [])
        .filter((j) => j.decision === 'approved')
        // The store shape is { company, title, location }; this screen (and createCase)
        // read co/t/city. Normalize ONCE here so every downstream read — the logo badge,
        // createCase's `company`, and the Snabbkoll layover — lines up. Missing this alias
        // is why createCase got `company: undefined` → 400 → every Analysera silently failed.
        .map((j) => ({ ...j, co: j.co || j.company, t: j.t || j.title, city: j.city || j.location }))))
      .catch(() => { /* keep current items on transient error */ });
  }, []);
  React.useEffect(() => { reloadQueue(); }, [reloadQueue]);
  React.useEffect(() => {
    window.addEventListener('ll:jobs:changed', reloadQueue);
    return () => window.removeEventListener('ll:jobs:changed', reloadQueue);
  }, [reloadQueue]);

  const [openId, setOpenId] = React.useState(null); // null = list view
  const [created, setCreated] = React.useState([]); // ids with a tailored application built

  const [linking, setLinking] = React.useState(null); // jobId currently being linked
  const [caseError, setCaseError] = React.useState(null); // honest surface for a failed case setup
  const [runErr, setRunErr] = React.useState(null);        // honest surface for a failed research/analyze

  const rejectItem = React.useCallback((id) => {
    setItems((cur) => cur.filter((j) => j.id !== id));
    setOpenId((cur) => (cur === id ? null : cur));
  }, []);

  // Durable job→case link (T15 full unification).
  // If the job already has a caseId: set it as the active case and open the analysis view.
  // If not: create a case → linkJobCase (durable POST /api/job/:id/case) → setActiveCaseId → open.
  const handleOpenJob = React.useCallback(async (id) => {
    const job = items.find((j) => j.id === id);
    if (!job) return;
    if (job.caseId) {
      setActiveCaseId(job.caseId);
      setOpenId(id);
      return;
    }
    setLinking(id);
    setCaseError(null);
    try {
      const sourceInput = [job.snippet, job.url].filter(Boolean).join('\n\n');
      const c = await createCase({ company: job.co || job.company, role: job.t || job.title || '', sourceInput });
      const caseId = c && c.meta && c.meta.id;
      if (!caseId) throw new Error('createCase returned no id');
      await linkJobCase(id, caseId); // durable POST /api/job/:id/case; dispatches ll:jobs:changed
      setActiveCaseId(caseId);
      setOpenId(id);
    } catch (err) {
      // Honest surface: a failed setup MUST be visible, not a silent console.error on a
      // button that appears to do nothing. Shown as an alert in the list view below.
      setCaseError(err.message || 'Kunde inte starta analysen');
    } finally {
      setLinking(null);
    }
  }, [items]);

  // The match-analysis layover's "Välj bort" CTA rejects into this same list.
  React.useEffect(() => {
    const onReject = (e) => { if (e.detail && e.detail.id) rejectItem(e.detail.id); };
    window.addEventListener('ll:match:reject', onReject);
    return () => window.removeEventListener('ll:match:reject', onReject);
  }, [rejectItem]);

  // "Snabbkoll" opens the quick-read layover. Durable job fields: t (title), city, match (score).
  const openQuick = React.useCallback((id) => {
    const j = items.find((x) => x.id === id);
    if (!j) return;
    window.dispatchEvent(new CustomEvent('ll:helpful:open', {
      detail: { ...j, t: j.t || j.title || '', city: j.city || j.location || '', match: j.match || j.score || 0, kind: 'job', externalId: j.id },
    }));
  }, [items]);

  // The layover's "Fyll luckorna & förbättra" CTA opens the full page for that job.
  // Uses handleOpenJob so the caseId link is made durably if not yet present.
  React.useEffect(() => {
    const onOpenFull = (e) => { if (e.detail && e.detail.id) handleOpenJob(e.detail.id); };
    window.addEventListener('ll:match:open', onOpenFull);
    return () => window.removeEventListener('ll:match:open', onOpenFull);
  }, [handleOpenJob]);

  // Inline "Ändra" evidence edits: LOCAL state only (not persisted — design intent).
  const [capOv, setCapOv] = React.useState({});    // { [reqId]: newEvidence }
  const [capEdit, setCapEdit] = React.useState({ id: null, text: '' });

  // answerGap: wire to actions.answerGap(gap.id, { answer, requirementId })
  const onAnswer = async (gap, text, _opts) => {
    try {
      const requirementId = gap.requirementRef && gap.requirementRef.id;
      return await actions.answerGap(gap.id, { answer: text, requirementId });
    } catch (err) {
      return { outcome: 'save_failed', reason: err.message };
    }
  };

  // Run the SAME pipeline Snabbkoll uses: research (dossiers + decodedRole) THEN analyze
  // (fit + gaps). analyze() alone throws "decodedRole missing or has no requirements" — the
  // detail-view CTA used to call analyze() directly, so it could never have produced a result.
  // Skip research if the role is already decoded. Generate stays on the gap-aware "Skapa
  // anpassad CV" button below (auto-generating here would skip the user's gap answers).
  const runAnalysis = React.useCallback(async () => {
    setRunErr(null);
    try {
      const decoded = caseData && caseData.decodedRole && caseData.decodedRole.status;
      if (decoded !== 'ready') await actions.research();
      await actions.analyze();
    } catch (err) {
      // Honest surface: a failed run must be visible. analyze failure leaves fit 'absent'
      // (not 'failed'), so PartGate would otherwise just re-show the button — silent again.
      setRunErr(err.message || 'Analysen misslyckades');
    }
  }, [actions, caseData]);

  // Build tailored application (generate CV + cover letter)
  const makeApplication = async () => {
    if (!openId) return;
    const id = openId;
    setGenerating(true);
    try { await actions.generate(); } catch (_) { /* surfaced on CV/letter screens */ }
    setGenerating(false);
    setCreated((c) => (c.includes(id) ? c : [...c, id]));
    setOpenId(null);
  };

  // Open the created enhanced CV over Ansökningskoll.
  const openCvReview = (j) => {
    location.hash = '#ansokningskoll';
    setTimeout(() => window.dispatchEvent(new CustomEvent('ll:helpful:open', {
      detail: {
        kind: 'cvreview', id: j.id, company: j.co, jobTitle: j.title,
      },
    })), 60);
  };

  const selected = items.find((i) => i.id === openId) || null;
  const fitStatus = parts.statusOf('fit');

  /* ---- Cross column ---- */
  const cross = (
    <CrossColumn
      title={tr({ sv: 'Stöd & kopplingar', en: 'Support & links' })}
      sub={tr({ sv: 'Det som hjälper just den här matchen.', en: 'What helps this particular match.' })}
      items={MATCH_CROSS()}
    />
  );

  /* ---- Page header ---- */
  const head = (
    <div className="ll-pagehead">
      <div className="ll-pagehead__b">
        <h1>{tr({ sv: 'Matchanalys', en: 'Match analysis' })}</h1>
        <p className="ll-pagehead__sub">
          {openId
            ? tr({ sv: 'Lilly har läst annonsen och jämfört den mot ditt CV. Fyll luckorna en i taget — vi hittar aldrig på en match.', en: 'Lilly read the ad and compared it to your CV. Fill the gaps one at a time — we never invent a match.' })
            : tr({ sv: 'Jobben du godkänt har laddats ner och matchats mot ditt CV. Klicka för hela analysen — eller välj bort det som inte passar.', en: "The jobs you approved were downloaded and matched to your CV. Click for the full analysis — or reject what doesn't fit." })}
        </p>
      </div>
      <div className="ll-pagehead__actions"><LangToggle /></div>
    </div>
  );

  /* ---- Body: either list view or per-job analysis view ---- */
  let body;

  if (!openId) {
    /* ==== LIST VIEW ==== */
    const activeItems = items.filter((j) => !created.includes(j.id));
    const createdJobs = created.map((id) => items.find((x) => x.id === id)).filter(Boolean);

    body = (activeItems.length === 0 && createdJobs.length === 0)
      ? (
        <PartState
          title={tr({ sv: 'Inga analyser kvar', en: 'No analyses left' })}
          body={tr({ sv: 'Du har gått igenom allt. Godkänn fler jobb i triage så analyseras de här.', en: "You've been through them all. Approve more jobs in triage and they'll be analysed here." })}
        >
          {/* #triage repointed to #jobbsok — standalone triage route was retired */}
          <a href="#jobbsok" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm" icon="check">{tr({ sv: 'Till jobbsök', en: 'To job search' })}</Button>
          </a>
        </PartState>
      )
      : (
        <React.Fragment>
          {caseError && (
            <div role="alert" style={{ margin: '0 0 var(--sp-3)', padding: 'var(--sp-3)', border: '1px solid var(--ll-coral)', borderRadius: 10, color: 'var(--ll-coral)', background: 'rgba(224,90,120,0.06)' }}>
              <strong>{tr({ sv: 'Kunde inte starta analysen. ', en: "Couldn't start the analysis. " })}</strong>
              {caseError}
            </div>
          )}
          {activeItems.length > 0 ? (
            <React.Fragment>
              <div className="tri-bar">
                <span className="tri-count"><b>{activeItems.length}</b> {tr({ sv: 'godkända jobb', en: 'approved jobs' })}</span>
                <span className="text-muted" style={{ fontSize: 'var(--fs-sm)' }}>
                  {linking
                    ? tr({ sv: 'Skapar ärende…', en: 'Setting up case…' })
                    : tr({ sv: 'Klicka Analysera · välj bort det som inte passar', en: "Click Analyse · reject what doesn't fit" })}
                </span>
              </div>
              <div className="matchlist">
                {activeItems.map((j) => (
                  <MatchRow key={j.id} job={j} onOpen={handleOpenJob} onQuick={openQuick} onReject={rejectItem} />
                ))}
              </div>
            </React.Fragment>
          ) : (
            <div className="cv-empty">
              <Clover size={30} color="#2B6CF0" />
              <p>{tr({ sv: 'Allt genomgånget 💙 Dina skapade CV ligger nedanför.', en: 'All reviewed 💙 Your created CVs are below.' })}</p>
            </div>
          )}

          {createdJobs.length > 0 && (
            <div className="matcharch">
              <div className="secrow">
                <Icon name="check" size={20} style={{ color: 'var(--ll-green)' }} />
                <h3>{tr({ sv: 'Skapade CV', en: 'Created CVs' })}</h3>
                <span className="secrow__pill secrow__pill--ok">{createdJobs.length}</span>
              </div>
              <div className="matcharch__list">
                {createdJobs.map((j) => (
                  <div className="matcharch__row" key={j.id}>
                    <span className="matcharch__logo" style={{ color: j.logo }}>{(j.co || '??').slice(0, 2).toUpperCase()}</span>
                    <div className="matcharch__b">
                      <div className="matcharch__t">{j.title || j.t} · <span className="matcharch__co">{j.co}</span></div>
                      <div className="matcharch__chips">
                        <span className="matcharch__tag">{tr({ sv: 'CV skapat', en: 'CV created' })}</span>
                        {(j.notMatching || []).slice(0, 2).map((g, i) => <span key={i} className="matcharch__chip">{g}</span>)}
                      </div>
                    </div>
                    <div className="matcharch__acts">
                      <Button variant="primary" size="sm" icon="search" onClick={() => openCvReview(j)}>
                        {tr({ sv: 'Se resultat', en: 'See result' })}
                      </Button>
                      <Button variant="ghost" size="sm" icon="pen" onClick={() => setOpenId(j.id)}>
                        {tr({ sv: 'Ändra', en: 'Change' })}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </React.Fragment>
      );

  } else {
    /* ==== PER-JOB ANALYSIS VIEW — gated on parts.statusOf('fit') via PartGate ==== */
    // Compute meta outside PartGate so caseMetaView runs once regardless of fit status.
    const meta = caseMetaView(caseData);
    const co = selected ? selected.co : (meta.company || '');
    const jt = selected ? (selected.title || selected.t || '') : (meta.jobTitle || '');
    const loc = selected ? (selected.location || selected.city || '') : (meta.location || '');
    const pool = parts._pool || [];

    // Derive analysis values (only meaningful when fitStatus === 'ready').
    const fit = parts.fit; // { capability: { requirements, overall }, preference: { narrative }, score }
    const gaps = parts.gaps || [];
    const decodedRole = parts.decodedRole || { requirements: [] };
    const reqLabelById = {};
    (decodedRole.requirements || []).forEach((r) => { reqLabelById[r.id] = r.requirement; });
    const capReqs = (fit && fit.capability && fit.capability.requirements) || [];
    const matches = capReqs.filter((r) => r.status === 'match');
    // Served score: always parts.fit.score (never a fixture number)
    const scoreVal = fit && fit.score != null
      ? fit.score
      : (capReqs.length ? Math.round((matches.length / capReqs.length) * 100) : 0);
    const allFilled = gaps.length === 0;

    body = (
      <React.Fragment>
        <button className="matchback" onClick={() => setOpenId(null)}>
          <Icon name="arrow" size={15} style={{ transform: 'rotate(180deg)' }} />
          {tr({ sv: 'Tillbaka till listan', en: 'Back to the list' })}
        </button>

        <PartGate
          status={fitStatus}
          busy={running.analyze || running.research}
          pending={<ContentBox className="ll-box--feature"><PartSkeleton lines={5} /></ContentBox>}
          failed={
            <PartState
              tone="fail"
              title={tr({ sv: 'Kunde inte läsa analysen', en: "Couldn't load the analysis" })}
              body={tr({ sv: 'Ingen gammal data visas — försök igen.', en: 'No stale data shown — try again.' })}
            >
              <Button variant="secondary" size="sm" icon="refresh" onClick={refresh}>
                {tr({ sv: 'Försök igen', en: 'Try again' })}
              </Button>
            </PartState>
          }
          absent={
            /* Absent: offer the Analysera CTA to kick off actions.analyze() */
            <PartState
              title={tr({ sv: 'Ingen analys ännu', en: 'No analysis yet' })}
              body={tr({ sv: 'Kör analysen för att se hur jobbet matchar ditt CV.', en: 'Run the analysis to see how this job matches your CV.' })}
            >
              <Button
                variant="primary"
                size="sm"
                icon={running.research || running.analyze ? null : 'target'}
                onClick={runAnalysis}
                disabled={!caseData || running.research || running.analyze}
              >
                {running.research || running.analyze
                  ? tr({ sv: 'Analyserar…', en: 'Analysing…' })
                  : tr({ sv: 'Analysera', en: 'Analyse' })}
              </Button>
              {runErr && (
                <p role="alert" style={{ marginTop: 8, color: 'var(--ll-coral)' }}>
                  {tr({ sv: 'Analysen misslyckades: ', en: 'The analysis failed: ' })}{runErr}
                </p>
              )}
              <Button variant="ghost" size="sm" icon="arrow" onClick={() => setOpenId(null)} style={{ marginTop: 8 }}>
                {tr({ sv: 'Tillbaka till listan', en: 'Back to the list' })}
              </Button>
            </PartState>
          }
        >
          {/* PartGate ready slot: analysis data is available — render verdict + content + queue */}
          {/* Verdict block */}
          <ContentBox className="ll-box--feature">
          <div className="verdictblk">
            <div className="verdictblk__ring">
              <MatchRing value={scoreVal} size={104} stroke={11} color="var(--ll-green)" />
            </div>
            <div className="verdictblk__b">
              <div className="verdictblk__co">
                <span className="verdictblk__logo">{(co || 'CO').slice(0, 2).toUpperCase()}</span>
                <div>
                  <div className="verdictblk__co-nm">{co}</div>
                  <div className="verdictblk__co-meta">{jt}{loc ? ' · ' + loc : ''}</div>
                </div>
              </div>
              <h2 className="verdictblk__title">{verdictHeadline(scoreVal)}</h2>
              <p className="verdictblk__sum">{fit && fit.capability && fit.capability.overall}</p>
              {fit && fit.preference && fit.preference.narrative && (
                <div className="verdictblk__pref">
                  <strong>{tr({ sv: 'Passar villkoren: ', en: 'Fits your terms: ' })}</strong>
                  {fit.preference.narrative}
                </div>
              )}
              <div className="verdictblk__by">
                <Icon name="sparkle" size={13} />
                {tr({ sv: 'Granskad av Lilly', en: 'Reviewed by Lilly' })}
              </div>
            </div>
          </div>
        </ContentBox>

        {/* Det du har + Luckor att fylla */}
        <ContentArea mode="split">
          {/* Left: matches with CitationChips */}
          <ContentBox>
            <div className="secrow">
              <Icon name="check" size={20} sw={2.6} style={{ color: 'var(--ll-green)' }} />
              <h3>{tr({ sv: 'Det du har', en: 'What you have' })}</h3>
              <span className="secrow__pill secrow__pill--ok">
                {matches.length} {tr({ sv: 'krav', en: 'reqs' })}
              </span>
            </div>
            {matches.map((m, i) => {
              const reqId = m.requirementRef && m.requirementRef.id;
              // citation: m.citation (from design) or m.evidenceRef (from actual fit shape)
              const citation = m.citation || m.evidenceRef || null;
              // isNew: minted by the fill-gap loop (id has a long timestamp suffix)
              const isNew = citation && /_\d{10,}$/.test(citation.id);
              const ev = capOv[reqId] != null ? capOv[reqId] : m.evidence;
              const editing = capEdit.id === reqId;
              return (
                <div className={`caprow ${editing ? 'caprow--editing' : ''}`} key={i}>
                  <span className={`caprow__ic caprow__ic--${m.status}`}>
                    <Icon name="check" size={15} sw={3} />
                  </span>
                  <div className="caprow__b">
                    <div className="caprow__t">{reqLabelById[reqId] || reqId}</div>
                    {editing ? (
                      <div className="caprow__edit">
                        <textarea
                          value={capEdit.text}
                          onChange={(e) => setCapEdit({ id: reqId, text: e.target.value })}
                          rows={3}
                          placeholder={tr({ sv: 'Beskriv hur du uppfyller kravet…', en: 'Describe how you meet this…' })}
                        />
                        <div className="caprow__editrow">
                          <Button
                            variant="primary"
                            size="sm"
                            icon="check"
                            onClick={() => {
                              setCapOv((o) => ({ ...o, [reqId]: capEdit.text.trim() || m.evidence }));
                              setCapEdit({ id: null, text: '' });
                            }}
                          >{tr({ sv: 'Spara', en: 'Save' })}</Button>
                          <button className="linkbtn" onClick={() => setCapEdit({ id: null, text: '' })}>
                            {tr({ sv: 'Avbryt', en: 'Cancel' })}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <React.Fragment>
                        {ev && (
                          <div className="caprow__ev">
                            {ev}
                            {capOv[reqId] != null && (
                              <span className="caprow__edited">{tr({ sv: 'redigerad', en: 'edited' })}</span>
                            )}
                          </div>
                        )}
                        {/* CitationChip: pool empty this wave → honest generic (no fabricated id) */}
                        <CitationChip citation={citation} pool={pool} isNew={isNew} />
                      </React.Fragment>
                    )}
                  </div>
                  {!editing && (
                    <button className="caprow__change" onClick={() => setCapEdit({ id: reqId, text: ev || '' })}>
                      <Icon name="pen" size={12} sw={2.4} />
                      {tr({ sv: 'Ändra', en: 'Change' })}
                    </button>
                  )}
                </div>
              );
            })}
          </ContentBox>

          {/* Right: fill-gap loop */}
          <ContentBox>
            <div className="secrow">
              <Icon name="bulb" size={20} style={{ color: 'var(--ll-coral)' }} />
              <h3>{tr({ sv: 'Luckor att fylla', en: 'Gaps to fill' })}</h3>
              {!allFilled && (
                <span className="secrow__pill secrow__pill--gap">
                  {gaps.length} {tr({ sv: 'kvar', en: 'left' })}
                </span>
              )}
            </div>

            {allFilled ? (
              <div className="loopdone">
                <Clover size={30} color="#fff" />
                <div className="loopdone__b">
                  <h3>{tr({ sv: 'Alla luckor genomgångna 💙', en: 'All gaps reviewed 💙' })}</h3>
                  <p>{tr({ sv: 'Det du la till är sparat för framtida jobb också. Dags att skapa din anpassade CV.', en: 'What you added is saved for future jobs too. Time to build your tailored CV.' })}</p>
                  <Button
                    variant="white"
                    size="sm"
                    icon={generating ? null : 'sparkle'}
                    onClick={makeApplication}
                    disabled={generating}
                    className="loopdone__cta"
                  >
                    {generating
                      ? tr({ sv: 'Skapar…', en: 'Building…' })
                      : tr({ sv: 'Skapa anpassad CV', en: 'Create tailored CV' })}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="tri-list">
                {gaps.map((g) => (
                  <FillGap
                    key={g.id}
                    gap={g}
                    reqLabel={g.what}
                    onAnswer={onAnswer}
                  />
                ))}
              </div>
            )}
          </ContentBox>
        </ContentArea>

        {/* Continue with the rest of the queue */}
        {items.filter((i) => i.id !== openId && !created.includes(i.id)).length > 0 && (
          <ContentBox>
            <div className="secrow">
              <Icon name="briefcase" size={20} style={{ color: 'var(--ll-blue)' }} />
              <h3>{tr({ sv: 'Fortsätt med nästa i kön', en: 'Continue with the next in queue' })}</h3>
              <span className="secrow__pill">
                {items.filter((i) => i.id !== openId && !created.includes(i.id)).length}
              </span>
            </div>
            <div className="matchqueue">
              {items.filter((i) => i.id !== openId && !created.includes(i.id)).map((j) => (
                <button key={j.id} className="matchqueue__row" onClick={() => handleOpenJob(j.id)}>
                  <span className="matchqueue__logo" style={{ color: j.logo }}>{(j.co || '??').slice(0, 2).toUpperCase()}</span>
                  <span className="matchqueue__b">
                    <span className="matchqueue__t">{j.title || j.t}</span>
                    <span className="matchqueue__m">{j.co} · {j.location || j.city}</span>
                  </span>
                  <span className={`matchqueue__score matchqueue__score--${scoreTone(j.score != null ? j.score : j.match)}`}>{j.score != null ? j.score : j.match}%</span>
                  <Icon name="arrow" size={16} />
                </button>
              ))}
            </div>
          </ContentBox>
        )}

        {/* Created tailored applications */}
        {created.length > 0 && (
          <ContentBox>
            <div className="secrow">
              <Icon name="cv" size={20} style={{ color: 'var(--ll-blue)' }} />
              <h3>{tr({ sv: 'Skapade ansökningar', en: 'Created applications' })}</h3>
              <span className="secrow__pill secrow__pill--ok">{created.length}</span>
            </div>
            <div className="matchqueue">
              {created.map((id) => {
                const j = items.find((x) => x.id === id);
                if (!j) return null;
                return (
                  <div className="matchqueue__row matchqueue__row--static" key={id}>
                    <span className="matchqueue__logo" style={{ color: j.logo }}>{(j.co || '??').slice(0, 2).toUpperCase()}</span>
                    <span className="matchqueue__b">
                      <span className="matchqueue__t">{j.title || j.t}</span>
                      <span className="matchqueue__m">{j.co} · {j.location || j.city}</span>
                    </span>
                    <Button variant="secondary" size="sm" icon="search" onClick={() => openCvReview(j)}>
                      {tr({ sv: 'Se resultat', en: 'See result' })}
                    </Button>
                  </div>
                );
              })}
            </div>
            <a className="ll-link" href="#ansokningskoll" style={{ marginTop: 'var(--sp-3)', display: 'inline-flex' }}>
              {tr({ sv: 'Se alla anpassade ansökningar', en: 'See all tailored applications' })}
            </a>
          </ContentBox>
        )}
        </PartGate>
      </React.Fragment>
    );
  }

  return (
    <PageTemplate
      label="Matchanalys"
      nav={<Sidebar active="match" />}
      cross={cross}
      content={<ContentArea>{head}{body}</ContentArea>}
    />
  );
}

export { JobMatchReview };
