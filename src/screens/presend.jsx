// HelloLilly — AREA 2 · "Innan du skickar" (pre-send fit-check)
// ----------------------------------------------------------------------------
// Sibling to Matchanalys (screens/match.jsx), NOT the delivery-tracking screen
// Ansökningskoll — that one stays. This is a PRE-SEND CHECK: the user has
// already drafted a CV + cover letter for a specific job; before they send,
// this shows how well the application fits the ad and flags what to improve.
// Three parts:
//   1. Requirement coverage (CV)  — per decoded requirement, does the drafted
//      CV evidence it? answered / weak / missing, each traceable.
//   2. Keyword alignment (CV ONLY) — the ad's literal terms missing from CV,
//      as fixable items. One-click align with honesty guard.
//   3. Send-readiness — qualitative at-a-glance (ready / almost / work), NO %.
// Ported verbatim from design/handoff-presend/design/screens-presend.jsx;
// data bridge swapped to real useActiveCase + casePartsView + four logic modules.
// ============================================================================

import React from 'react';
import { Icon, Button } from '../components/primitives.jsx';
import { Sidebar } from '../components/shell.jsx';
import { useActiveCase } from '../hooks/useCase.js';
import { casePartsView } from '../hooks/casePartsView.mjs';
import { PartState, PartSkeleton } from '../components/partGate.jsx';
import { tr, useLang, LangToggle } from '../lib/i18n.mjs';
import { ContentArea, ContentBox, CrossColumn, PageTemplate } from '../components/grid.jsx';
import { computeDraftCoverage } from '../lib/presendCoverage.mjs';
import { scanCvKeywords } from '../lib/presendKeywords.mjs';
import { computeReadiness } from '../lib/presendReadiness.mjs';
import { computeLetterFit } from '../lib/presendLetterFit.mjs';

/* ---------- Crosslinking column items ---------- */
const PRESEND_CROSS = () => [
  { kind: 'Tips',  icon: 'target', title: tr({ sv: 'Fyll luckorna i Matchanalys',       en: 'Fill gaps in Match analysis' }),     nav: tr({ sv: 'Analys',  en: 'Analysis' }), why: tr({ sv: 'Där stärker du krav som är svaga eller saknas',                en: 'Where you strengthen weak or missing requirements' }),      to: 'match' },
  { kind: 'Mall',  icon: 'cv',     title: tr({ sv: 'Justera CV:t',                       en: 'Adjust the CV' }),                   nav: tr({ sv: 'CV',      en: 'CV' }),       why: tr({ sv: 'Ändra formuleringar och lägg till exempel',                  en: 'Change wording and add examples' }),                        to: 'cv' },
  { kind: 'Brev',  icon: 'letter', title: tr({ sv: 'Se över brevet',                     en: 'Review the letter' }),               nav: tr({ sv: 'Brev',    en: 'Letter' }),   why: tr({ sv: 'Brevet ska adressera kraven — inte eka annonsen',            en: 'The letter should address the requirements — not echo the ad' }), to: 'letter' },
  { kind: 'Coach', icon: 'users',  title: tr({ sv: 'Be Sara läsa innan du skickar',      en: 'Ask Sara to read first' }),          nav: tr({ sv: 'Sara',    en: 'Sara' }),     why: tr({ sv: 'Hon svarar oftast samma dag',                                en: 'Usually same-day' }),                                       to: 'coach' },
];

/* ---------- Citation chip (requirement coverage traceable evidence) ----------
   Mirrors match.jsx CitationChip. Resolves datafact type from _pool when available.
   Generic "Från ditt CV" when pool is empty / datafact not found — honest, never fabricated. */
function PreCite({ tracedText, evidenceRefId, pool }) {
  if (!tracedText) return null;
  const df = Array.isArray(pool) ? pool.find((f) => f.id === evidenceRefId) : null;
  const typeLabel = df && df.type ? ' · ' + df.type : '';
  return (
    <span className="cite">
      <Icon name="doc" size={11} sw={2.4} />
      {tr({ sv: 'Från ditt CV' + typeLabel, en: 'From your CV' + typeLabel })}
    </span>
  );
}

/* ---------- The checked (ready) state — the main event ---------- */
function CheckedState({ parts, actions }) {
  const meta = parts.meta || {};
  const role = meta.role || meta.jobTitle || '';
  const company = meta.company || '';
  const pool = parts._pool || [];

  // Four logic reads (all pure, no LLM)
  const coverage = computeDraftCoverage({ fit: parts.fit, cvDraft: parts.cvDraft, decodedRole: parts.decodedRole });
  const kw = scanCvKeywords({ decodedRole: parts.decodedRole, cvDraft: parts.cvDraft });
  const letter = computeLetterFit({ coverLetter: parts.coverLetter, decodedRole: parts.decodedRole });
  const readiness = computeReadiness({ coverage, keyword: kw, letter });

  // Per-keyword UI state: { [term]: 'idle'|'busy'|'aligned'|'refused' }
  const [kwState, setKwState] = React.useState({});

  const alignKeyword = async (m) => {
    const key = m.term;
    setKwState((s) => ({ ...s, [key]: 'busy' }));
    try {
      const r = await actions.alignKeyword({ term: m.term, basisDatafactId: m.basisDatafactId });
      setKwState((s) => ({ ...s, [key]: r.outcome }));
    } catch (_) {
      // If the action throws, treat as refused
      setKwState((s) => ({ ...s, [key]: 'refused' }));
    }
  };

  const { tone } = readiness;
  let statusIcon, statusTxt, subTxt;
  if (tone === 'work') {
    statusIcon = 'bulb';
    statusTxt = tr({ sv: 'Behöver arbete', en: 'Needs work' });
    subTxt = tr({ sv: 'Ett eller flera viktiga krav är inte styrkta i ditt CV ännu. Stärk dem innan du skickar.', en: "One or more high-priority requirements aren't evidenced in your CV yet. Strengthen them before you send." });
  } else if (tone === 'almost') {
    statusIcon = 'sparkle';
    statusTxt = tr({ sv: 'Nästan redo', en: 'Almost ready' });
    subTxt = tr({ sv: 'Grunden är stark. Det finns några saker värda att titta på nedan — inget som stoppar dig, men de gör ansökan vassare.', en: 'The foundation is strong. A few things below are worth a look — nothing blocking, but they sharpen the application.' });
  } else {
    statusIcon = 'check';
    statusTxt = tr({ sv: 'Redo att skicka', en: 'Ready to send' });
    subTxt = tr({ sv: 'Ditt CV täcker kraven och brevet adresserar dem. Läs gärna en sista gång — sedan är du redo.', en: "Your CV covers the requirements and the letter addresses them. Give it one last read — then you're ready." });
  }

  const { counts, rows: covRows } = coverage;
  const total = counts.total;

  // at-a-glance mini checklist
  const alignableCount = kw.missing.filter((m) => m.alignable).length;
  const letterAddressed = letter.rows.filter((r) => r.addressed === true).length;
  const letterTotal = letter.rows.length;
  const letterMissing = letter.rows.filter((r) => r.addressed === false).length;
  const honestyCount = letter.honestyFlags.length;

  const glance = [
    { ic: counts.missing === 0 ? 'ok' : 'warn', t: tr({ sv: 'CV täcker kraven', en: 'CV covers requirements' }), v: counts.answered + ' / ' + total },
    { ic: 'info', t: tr({ sv: 'Nyckelord i CV att titta på', en: 'CV keywords to look at' }), v: String(kw.missing.length) },
    { ic: letterMissing > 0 ? 'warn' : 'ok', t: tr({ sv: 'Brevet adresserar kraven', en: 'Letter addresses requirements' }), v: letterAddressed + ' / ' + letterTotal },
    { ic: honestyCount > 0 ? 'warn' : 'ok', t: tr({ sv: 'Ärlighetsflaggor i brevet', en: 'Honesty flags in the letter' }), v: String(honestyCount) },
  ];

  const seg = (n) => ({ flex: n, display: n ? 'block' : 'none' });
  const lflag = letter.honestyFlags[0] || null;

  return (
    <React.Fragment>
      {/* ---- What we're reading: the FINISHED DRAFT (the frame vs Matchanalys) ---- */}
      <div className="presubj">
        <div className="presubj__lead">
          <span className="presubj__lead-l">{tr({ sv: 'Kollas', en: 'Checking' })}</span>
          <div className="presubj__docs">
            <span className="predoc">
              <Icon name="cv" size={15} sw={2.2} />
              {tr({ sv: 'CV-utkast', en: 'CV draft' })}
              <span className="predoc__tag">{tr({ sv: 'klart', en: 'ready' })}</span>
            </span>
            <span className="predoc">
              <Icon name="letter" size={15} sw={2.2} />
              {tr({ sv: 'Personligt brev', en: 'Cover letter' })}
              <span className="predoc__tag">{tr({ sv: 'klart', en: 'ready' })}</span>
            </span>
          </div>
        </div>
        <p className="presubj__contrast">
          {tr({ sv: 'Vi läser vad ditt ', en: 'We read what your ' })}
          <b>{tr({ sv: 'färdiga utkast faktiskt säger', en: 'finished draft actually says' })}</b>
          {tr({ sv: ' — inte vad din bakgrund skulle kunna säga. Det utforskar du i ', en: ' — not what your background could say. You explore that in ' })}
          <a className="presubj__ex" href="#match">{tr({ sv: 'Matchanalys', en: 'Match analysis' })}</a>
          {tr({ sv: '.', en: '.' })}
        </p>
      </div>

      {/* ---- Send-readiness band (qualitative, NO number) + honesty line ---- */}
      <ContentBox className="ll-box--feature rband-box">
        <div className={`rband rband--${tone}`}>
          <div className="rband__lead">
            <span className="rband__ic"><Icon name={statusIcon} size={30} sw={2.4} /></span>
            <div className="rband__b">
              <div className="rband__eyebrow">
                {tr({ sv: 'Sändningsstatus', en: 'Send-readiness' })} · {role} · {company}
              </div>
              <h2 className="rband__status">{statusTxt}</h2>
              <p className="rband__sub">{subTxt}</p>
            </div>
          </div>
          <div className="rband__glance">
            {glance.map((g, i) => (
              <div className="rgl" key={i}>
                <span className={`rgl__ic rgl__ic--${g.ic}`}>
                  <Icon name={g.ic === 'ok' ? 'check' : g.ic === 'warn' ? 'bulb' : 'target'} size={15} sw={2.6} />
                </span>
                <span className="rgl__t">{g.t}</span>
                <span className="rgl__v">{g.v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="honestline">
          <Icon name="bulb" size={17} sw={2.2} />
          <div className="honestline__b">
            {tr({ sv: 'Det här är en ärlig koll mot ', en: 'This is an honest check against ' })}
            <b>{tr({ sv: 'annonsen och allmän ATS-praxis', en: 'the ad and general ATS best-practice' })}</b>
            {tr({ sv: ' — inte en förutsägelse av hur arbetsgivarens riktiga ATS rangordnar dig. Vi kan inte läsa deras system, och låtsas inte att vi kan.', en: " — not a prediction of how the employer's real ATS will rank you. We can't read their system, and we don't pretend to." })}
          </div>
        </div>
      </ContentBox>

      {/* ---- 1 · Requirement coverage (CV) — the core ---- */}
      <ContentBox>
        <div className="secrow">
          <Icon name="target" size={20} sw={2.4} style={{ color: 'var(--ll-blue)' }} />
          <h3>{tr({ sv: 'Kravtäckning', en: 'Requirement coverage' })}</h3>
          <span className="secrow__pill secrow__pill--ok">{tr({ sv: 'CV', en: 'CV' })}</span>
        </div>
        <div className="cov">
          <div className="cov__top">
            <span className="cov__count">
              <span className="num">{counts.answered}</span>{' '}
              {tr({ sv: 'av', en: 'of' })} {total}
            </span>
            <span className="cov__label">
              {tr({ sv: 'krav som ditt utkast faktiskt styrker — varje styrkt krav går att spåra till en rad i CV-utkastet.', en: 'requirements your draft actually evidences — each answered one traces to a line in the CV draft.' })}
            </span>
          </div>
          <div className="cov__bar" aria-hidden="true">
            <span className="cov__seg cov__seg--answered" style={seg(counts.answered)} />
            <span className="cov__seg cov__seg--weak" style={seg(counts.weak)} />
            <span className="cov__seg cov__seg--missing" style={seg(counts.missing)} />
          </div>
          <div className="cov__legend">
            <span className="cov__leg"><span className="cov__dot cov__dot--answered" />{counts.answered} {tr({ sv: 'styrkta', en: 'answered' })}</span>
            {counts.weak > 0 && <span className="cov__leg"><span className="cov__dot cov__dot--weak" />{counts.weak} {tr({ sv: 'svaga', en: 'weak' })}</span>}
            {counts.missing > 0 && <span className="cov__leg"><span className="cov__dot cov__dot--missing" />{counts.missing} {tr({ sv: 'saknas', en: 'missing' })}</span>}
          </div>
        </div>

        {covRows.map((row, i) => {
          const icClass = row.status === 'answered' ? 'answered' : row.status === 'weak' ? 'weak' : 'missing';
          const iconName = row.status === 'answered' ? 'check' : row.status === 'weak' ? 'bulb' : 'plus';
          const tagLabel = row.status === 'answered'
            ? tr({ sv: 'Styrkt', en: 'Answered' })
            : row.status === 'weak'
              ? tr({ sv: 'Svagt', en: 'Weak' })
              : tr({ sv: 'Saknas', en: 'Missing' });
          return (
            <div className="caprow" key={i}>
              <span className={`caprow__ic caprow__ic--${icClass}`}>
                <Icon name={iconName} size={15} sw={3} />
              </span>
              <div className="caprow__b">
                <div className="caprow__t">
                  {row.requirement || row.reqId}
                  {row.weight != null && (
                    <span className="caprow__wt">
                      · {row.weight >= 0.8
                        ? tr({ sv: 'Viktigt krav', en: 'High priority' })
                        : row.weight >= 0.5
                          ? tr({ sv: 'Medel', en: 'Medium' })
                          : tr({ sv: 'Lägre', en: 'Lower' })}
                    </span>
                  )}
                </div>
                {row.status === 'answered' ? (
                  <React.Fragment>
                    {row.tracedText && <div className="caprow__ev">{row.tracedText}</div>}
                    <PreCite tracedText={row.tracedText} evidenceRefId={row.evidenceRefId} pool={pool} />
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <div className="caprow__lack">
                      {row.status === 'weak'
                        ? tr({ sv: 'Ditt utkast nuddar vid det här kravet, men säger det inte tydligt nog. ', en: "Your draft touches this requirement but doesn't say it clearly enough. " })
                        : tr({ sv: 'Ditt utkast säger inte det här — även om din bakgrund kanske gör det. Vi läser bara det du skrivit, och hittar aldrig på en match åt dig.', en: "Your draft doesn't say this — even if your background might. We read only what you wrote, and never invent a match for you." })}
                    </div>
                    <a className="caprow__fix" href="#match">
                      <Icon name="target" size={13} sw={2.4} />
                      {tr({ sv: 'Utforska och fyll den i Matchanalys', en: 'Explore and fill it in Match analysis' })}
                    </a>
                  </React.Fragment>
                )}
              </div>
              <span className={`reqtag reqtag--${icClass}`}>{tagLabel}</span>
            </div>
          );
        })}
      </ContentBox>

      {/* ---- 2 · Keyword alignment (CV) | Cover-letter requirement-fit (letter) ---- */}
      <ContentArea mode="split">
        {/* LEFT — keyword alignment, CV ONLY */}
        <ContentBox>
          <div className="secrow">
            <Icon name="cv" size={20} sw={2.4} style={{ color: 'var(--ll-blue)' }} />
            <h3>{tr({ sv: 'Nyckelord i CV:t', en: 'Keywords in the CV' })}</h3>
            <span className="secrow__pill secrow__pill--ok">{tr({ sv: 'Endast CV', en: 'CV only' })}</span>
          </div>
          {/* Flag 1 guardrail: "gaps we spotted", NOT "exact terms / complete list" */}
          <div className="kw-scope">
            <Icon name="filter" size={15} sw={2.2} />
            {tr({
              sv: 'Nyckelordsluckor vi hittade — inte en fullständig lista. ATS matchar ord bokstavligt. Vi ändrar bara formulering där sanningen redan stödjer det — och avstår där det inte gör det.',
              en: "Keyword gaps we spotted — not an exhaustive list. ATS matches words literally. We only change wording where the truth already supports it — and refuse where it doesn't.",
            })}
          </div>
          {kw.missing.length === 0 ? (
            <div className="caprow" style={{ border: 'none', padding: 'var(--sp-3) 0' }}>
              <span className="caprow__ic caprow__ic--answered"><Icon name="check" size={15} sw={3} /></span>
              <div className="caprow__b">
                <div className="caprow__t">{tr({ sv: 'Inga uppenbarade nyckelordsluckor hittades', en: 'No obvious keyword gaps found' })}</div>
              </div>
            </div>
          ) : (
            kw.missing.map((m, i) => {
              const key = m.term;
              const st = kwState[key] || 'idle';
              return (
                <div
                  className={`kw ${st === 'aligned' ? 'kw--aligned' : ''} ${st === 'refused' ? 'kw--refused' : ''}`}
                  key={i}
                >
                  <div className="kw__pair">
                    <span className="kw__term">{m.term}</span>
                    <Icon name="arrow" size={15} className="kw__arrow" />
                    <span className="kw__cv">
                      {tr({ sv: 'ditt CV: ', en: 'your CV: ' })}
                      <b>{m.cvWording || '—'}</b>
                    </span>
                  </div>
                  {m.cvWording && st !== 'refused' && (
                    <span className="cite" style={{ marginBottom: st === 'idle' ? 'var(--sp-3)' : 0, display: 'inline-flex' }}>
                      <Icon name="doc" size={11} sw={2.4} />
                      {tr({ sv: 'Styrks av: ' + m.cvWording, en: 'Backed by: ' + m.cvWording })}
                    </span>
                  )}
                  {st === 'aligned' ? (
                    <div className="kw__res kw__res--ok">
                      <Icon name="check" size={17} sw={2.6} />
                      <div className="kw__resbody">
                        <b>{tr({ sv: 'Tillagt i ditt CV', en: 'Added to your CV' })}</b>
                        {tr({ sv: `"${m.term}" finns nu i CV:t, sparat — och sanningen bakom det är oförändrad.`, en: `"${m.term}" is now in the CV, saved — and the truth behind it is unchanged.` })}
                      </div>
                    </div>
                  ) : st === 'refused' ? (
                    <div className="kw__res kw__res--refused">
                      <Icon name="bulb" size={17} sw={2.4} />
                      <div className="kw__resbody">
                        <b>{tr({ sv: 'Det ordet lägger vi inte till', en: "We won't add that word" })}</b>
                        {tr({ sv: `Att skriva in "${m.term}" skulle påstå något ditt CV inte styrker. Vi alignar formulering — vi hittar inte på erfarenhet. Ta upp det ärligt istället.`, en: `Writing in "${m.term}" would claim something your CV doesn't support. We align wording — we don't invent experience. Address it honestly instead.` })}
                        <a className="kw__reflink" href="#match">
                          <Icon name="target" size={13} sw={2.4} />
                          {tr({ sv: 'Bryggan i Matchanalys', en: 'The bridge in Match analysis' })}
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="kw__acts">
                      <Button
                        variant={m.alignable ? 'primary' : 'secondary'}
                        size="sm"
                        icon={st === 'busy' ? null : (m.alignable ? 'check' : 'sparkle')}
                        disabled={st === 'busy'}
                        onClick={() => alignKeyword(m)}
                      >
                        {st === 'busy'
                          ? tr({ sv: 'Kontrollerar…', en: 'Checking…' })
                          : tr({ sv: 'Använd annonsens ord', en: 'Use the ad's word' })}
                      </Button>
                      <span className="text-muted" style={{ fontSize: 'var(--fs-xs)' }}>
                        {tr({ sv: 'ärlighetskollas först', en: 'honesty-checked first' })}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </ContentBox>

        {/* RIGHT — cover-letter requirement-fit, NOT keyword */}
        <ContentBox>
          <div className="secrow">
            <Icon name="letter" size={20} sw={2.4} style={{ color: 'var(--ll-lilac)' }} />
            <h3>{tr({ sv: 'Brevet mot kraven', en: 'Letter vs requirements' })}</h3>
            <span className="secrow__pill" style={{ background: 'var(--ll-lilac-soft)', color: '#5b48c9' }}>
              {tr({ sv: 'Endast passform', en: 'Fit only' })}
            </span>
          </div>
          <div className="lfit-note">
            <Icon name="bulb" size={17} sw={2.2} />
            <div className="lfit-note__b">
              {tr({ sv: 'Vi ', en: 'We ' })}
              <b>{tr({ sv: 'nyckelordskollar inte brevet', en: "don't keyword-check the letter" })}</b>
              {tr({ sv: '. Ett brev ska låta som en människa, inte eka annonsen. Vi kollar bara om det ', en: '. A letter should sound human, not echo the ad. We only check whether it ' })}
              <b>{tr({ sv: 'adresserar kraven', en: 'addresses the requirements' })}</b>
              {tr({ sv: '.', en: '.' })}
            </div>
          </div>
          <div className="lfit">
            {letter.rows.length === 0 ? (
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--ll-ink-soft)' }}>
                {tr({ sv: 'Inga krav att kolla mot.', en: 'No requirements to check against.' })}
              </div>
            ) : (
              letter.rows.map((l, i) => {
                // addressed: true = yes, false = no, null = cannot auto-determine
                const isYes = l.addressed === true;
                const isNo = l.addressed === false;
                // null → honest "cannot auto-determine" state
                return (
                  <div className="lrow" key={i}>
                    <span className={`lrow__ic ${isYes ? 'lrow__ic--yes' : isNo ? 'lrow__ic--no' : ''}`} style={l.addressed === null ? { background: 'var(--ll-blue-tint-2)', color: 'var(--ll-ink-mute)' } : undefined}>
                      <Icon name={isYes ? 'check' : isNo ? 'plus' : 'bulb'} size={13} sw={3} />
                    </span>
                    <div className="lrow__b">
                      <div className="lrow__t">{l.requirement || l.reqId}</div>
                      {isYes && l.quote && <div className="lrow__q">{l.quote}</div>}
                      {isNo && <div className="lrow__miss">{tr({ sv: 'Brevet verkar inte adressera det här kravet.', en: "The letter doesn't seem to address this requirement." })}</div>}
                      {l.addressed === null && (
                        <div className="lrow__miss" style={{ color: 'var(--ll-ink-mute)', fontStyle: 'italic' }}>
                          {tr({ sv: 'Vi avgör inte automatiskt — läs brevet och bedöm själv.', en: "We can't auto-determine — read the letter and judge for yourself." })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {lflag && (
            <div className="lflag">
              <Icon name="bulb" size={17} sw={2.2} />
              <div className="lflag__b">
                <b>{tr({ sv: 'En formulering att dubbelkolla: ', en: 'One line to double-check: ' })}</b>
                {lflag}
                {tr({ sv: ' — den stöds inte tydligt av ditt CV. Ta upp den i intervjun, inte som ett påstående i brevet.', en: ' — it isn't clearly supported by your CV. Raise it in the interview, not as a claim in the letter.' })}
              </div>
            </div>
          )}
        </ContentBox>
      </ContentArea>

      {/* ---- Footer: honest next steps (this screen doesn't send or track) ---- */}
      <ContentBox>
        <div className="presend-foot">
          <a href="#coach" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm" icon="users">
              {tr({ sv: 'Be Sara läsa innan du skickar', en: 'Ask Sara to read first' })}
            </Button>
          </a>
          {meta.url && (
            <a href={meta.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="sm" icon="arrow">
                {tr({ sv: 'Till annonsen', en: 'To the ad' })}
              </Button>
            </a>
          )}
          <span className="presend-foot__note">
            {tr({ sv: 'Innan du skickar följer inte skickade ansökningar och skickar inte åt dig — den hjälper dig bara att skicka något du står för.', en: "Before you send doesn't track sent applications and doesn't send for you — it just helps you send something you stand behind." })}
          </span>
        </div>
      </ContentBox>
    </React.Fragment>
  );
}

/* ---------- The screen ---------- */
function InnanDuSkickar() {
  useLang();
  const { caseData, running, actions, error, refresh } = useActiveCase();
  const parts = casePartsView(caseData);

  const cvStatus = parts.statusOf('cvDraft');
  const letterStatus = parts.statusOf('coverLetter');
  const fitStatus = parts.statusOf('fit');
  const roleStatus = parts.statusOf('decodedRole');

  // Overall data readiness: need fit + decodedRole + cvDraft + coverLetter
  const coreReady = cvStatus === 'ready' && letterStatus === 'ready' && fitStatus === 'ready' && roleStatus === 'ready';
  const anyPending = [cvStatus, letterStatus, fitStatus, roleStatus].includes('pending');
  const anyFailed = !anyPending && !coreReady && [cvStatus, letterStatus, fitStatus, roleStatus].includes('failed');

  const cross = (
    <CrossColumn
      title={tr({ sv: 'Innan du skickar', en: 'Before you send' })}
      sub={tr({ sv: 'Det som hjälper dig stärka just den här ansökan.', en: 'What helps you strengthen this application.' })}
      items={PRESEND_CROSS()}
    />
  );

  const head = (
    <div className="ll-pagehead">
      <div className="ll-pagehead__b">
        <h1>{tr({ sv: 'Innan du skickar', en: 'Before you send' })}</h1>
        <p className="ll-pagehead__sub">
          {tr({
            sv: 'En ärlig sista koll av din ansökan mot annonsen — innan du skickar. Vi visar hur väl ditt CV och brev täcker kraven och vad som är värt att stärka. Vi kan inte läsa arbetsgivarens system och låtsas inte att vi kan.',
            en: "An honest final check of your application against the ad — before you send. We show how well your CV and letter cover the requirements and what's worth strengthening. We can't read the employer's system and don't pretend to.",
          })}
        </p>
      </div>
      <div className="ll-pagehead__actions"><LangToggle /></div>
    </div>
  );

  let body;

  if (anyPending || running.analyze) {
    body = <ContentBox className="ll-box--feature"><PartSkeleton lines={5} /></ContentBox>;
  } else if (anyFailed || error) {
    body = (
      <PartState
        tone="fail"
        title={tr({ sv: 'Kunde inte läsa ansökan', en: 'Couldn't load the application' })}
        body={error || tr({ sv: 'Ingen gammal data visas — försök igen.', en: 'No stale data shown — try again.' })}
      >
        <Button variant="secondary" size="sm" icon="refresh" onClick={refresh}>
          {tr({ sv: 'Försök igen', en: 'Try again' })}
        </Button>
      </PartState>
    );
  } else if (!caseData || cvStatus === 'absent' || letterStatus === 'absent') {
    // Empty state: no draft yet — point to build them first, honestly name the distinction
    const meta = parts.meta || {};
    const role = meta.role || meta.jobTitle || '';
    const company = meta.company || '';
    const bodyText = role && company
      ? tr({
          sv: `Det här är en koll du gör innan du skickar — så den behöver ett CV och ett personligt brev för ${role} hos ${company}. Bygg dem först, så kollar vi passformen här.`,
          en: `This is a check you run before you send — so it needs a CV and a cover letter for ${role} at ${company}. Build them first and we'll check the fit here.`,
        })
      : tr({
          sv: 'Det här är en koll du gör innan du skickar — så den behöver ett CV och ett personligt brev. Bygg dem först, så kollar vi passformen här.',
          en: "This is a check you run before you send — so it needs a CV and a cover letter. Build them first and we'll check the fit here.",
        });
    body = (
      <PartState
        title={tr({ sv: 'Ingen ansökan att kolla ännu', en: 'No application to check yet' })}
        body={bodyText}
      >
        <div className="presend-foot" style={{ justifyContent: 'center' }}>
          <a href="#cv" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm" icon="cv">{tr({ sv: 'Bygg CV', en: 'Build CV' })}</Button>
          </a>
          <a href="#letter" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="sm" icon="letter">{tr({ sv: 'Skriv personligt brev', en: 'Write cover letter' })}</Button>
          </a>
        </div>
        <div className="honestline" style={{ maxWidth: 520, marginInline: 'auto', textAlign: 'left' }}>
          <Icon name="bulb" size={16} />
          <div className="honestline__b">
            {tr({ sv: 'Ansökningskoll och ', en: 'The delivery view and ' })}
            <b>{tr({ sv: 'Innan du skickar', en: 'Before you send' })}</b>
            {tr({ sv: ' är två olika saker: den ena samlar dina förbättrade CV, den här gör en passformskoll innan du trycker på skicka.', en: ' are two different things: one collects your enhanced CVs, this one does a fit-check before you hit send.' })}
          </div>
        </div>
      </PartState>
    );
  } else {
    body = <CheckedState parts={parts} actions={actions} />;
  }

  return (
    <PageTemplate
      label="Innan du skickar"
      nav={<Sidebar active="innan-du-skickar" />}
      cross={cross}
      content={<ContentArea>{head}{body}</ContentArea>}
    />
  );
}

export { InnanDuSkickar };
