import React from 'react';
import { Icon, Clover, Avatar, AvatarStack, Photo, Tag, Chip, Button, Rating, SectionHeader, DemoBar } from '../components/primitives.jsx';
import { Sidebar } from '../components/shell.jsx';
import { useActiveCase } from '../hooks/useCase.js';
import { casePartsView } from '../hooks/casePartsView.mjs';
import { caseMetaView } from '../hooks/caseMetaView.mjs';
import { PartGate, PartState, PartSkeleton, STATUS } from '../components/partGate.jsx';
import { tr, useLang, LangToggle } from '../lib/i18n.mjs';
import { ContentArea, ContentBox, CrossColumn, PageTemplate } from '../components/grid.jsx';
import { listCases } from '../api/caseApi.js';
import { sectionItems } from '../lib/cvDraftItems.mjs';

const sectionLeafCount = (s) => sectionItems(s).length;

// HelloLilly — CV-byggaren (design-system era, bound to cvDraft)
// Ported from design/design/screens-cv2.jsx; wired to real data hooks.
// CSS renames applied per T9 merge:
//   .improve  → .cvb-improve  (was collision with existing indicators)
//   .intake   → .cvb-intake   (was collision with existing chat intake rail)
//   .improve__btn  → .cvb-improve__btn
//   .intake__hint  → .cvb-intake__hint

/* ---------- Crosslinking data for this screen ---------- */
function CV_CROSS() {
  return [
    { kind:'Mall',    icon:'doc',    title:tr({ sv:'Skriv resultat, inte uppgifter', en:'Write results, not tasks' }),    nav:tr({sv:'Mall',en:'Template'}),   why:tr({ sv:'Coach-godkänd bullet-mall', en:'Coach-approved bullet template' }) },
    { kind:'Målkrav', icon:'target', title:tr({ sv:'Skriv mot kravet: attribution & LTV', en:'Write toward: attribution & LTV' }), nav:tr({sv:'Krav',en:'Req'}),  why:tr({ sv:'Från rollens matchanalys', en:"From the role's decoded requirements" }) },
    { kind:'Nyckelord',icon:'search',title:tr({ sv:'Saknade nyckelord för rollen', en:'Missing keywords for the role' }),   nav:tr({sv:'Ord',en:'Words'}),   why:tr({ sv:'token-partnerships · influencer', en:'token-partnerships · influencer' }) },
    { kind:'Coach',   icon:'users',  title:tr({ sv:'Coach med iGaming-erfarenhet', en:'Coach with iGaming experience' }),  nav:tr({sv:'Sara',en:'Sara'}),   why:tr({ sv:'Kan granska dina bullets', en:'Can review your bullets' }) },
  ];
}

/* ---------- One CV item, traceable to its datafact ---------- */
// pool is EMPTY this wave → df is always null → chip shows honest generic fallback.
function CvItem({ item, resolve, asBullet }) {
  const df = item.datafactRef ? resolve(item.datafactRef.id) : null;
  const isNew = item.datafactRef && /_\d{10,}$/.test(item.datafactRef.id);
  // When df is null (empty pool), render the honest generic chip so the
  // traceability guarantee is always visible but never fabricated.
  const chip = df
    ? (
      <span className={`cvitem__chip ${isNew ? 'cvitem__chip--new' : ''}`}>
        <Icon name="doc" size={10} sw={2.4} />
        {isNew ? tr({ sv:'Tillagt nyss', en:'Just added' }) : tr({ sv:'Från din intake · ' + df.type, en:'From your intake · ' + df.type })}
      </span>
    )
    : item.datafactRef
      ? (
        <span className="cvitem__chip">
          <Icon name="doc" size={10} sw={2.4} />
          {tr({ sv:'Från ditt CV', en:'From your CV' })}
        </span>
      )
      : null;
  if (asBullet) return <li className="cvitem">{item.text}{chip}</li>;
  return <p className="cvitem" style={{ margin:'0 0 6px' }}>{item.text}{chip}</p>;
}

/* ---------- Improve strip (per section; disabled "Kommer") ---------- */
function ImproveStrip({ section }) {
  return (
    <div className="cvb-improve" aria-label={tr({ sv:'Förbättra ' + section.heading, en:'Improve ' + section.heading })}>
      <button className="cvb-improve__btn" disabled aria-disabled="true"><Icon name="pen" size={11} sw={2.6} />{tr({ sv:'Förbättra formulering', en:'Improve wording' })}</button>
      <button className="cvb-improve__btn" disabled aria-disabled="true"><Icon name="search" size={11} sw={2.6} />{tr({ sv:'Lägg till nyckelord', en:'Add keywords' })}</button>
      <span className="soon-tag">{tr({ sv:'Kommer', en:'Coming' })}</span>
    </div>
  );
}

/* ---------- The living CV preview (renders cvDraft.sections[]) ---------- */
// Section body renders one of three shapes: Core Competencies -> categories[] (title + items),
// Professional Experience -> jobs[] (company·period + items), everything else -> flat items.
function SectionBody({ sec, resolve }) {
  if (sec.categories) {
    return sec.categories.filter(c => (c.items || []).length).map(cat => (
      <div className="cvlive__cat" key={cat.id}>
        <div className="paper__cat-h">{cat.title}</div>
        <ul>{cat.items.map((it, i) => <CvItem key={i} item={it} resolve={resolve} asBullet />)}</ul>
      </div>
    ));
  }
  if (sec.jobs) {
    return sec.jobs.filter(j => (j.items || []).length).map(job => (
      <div className="cvlive__job" key={job.key}>
        <div className="paper__job-h">{job.company} · {job.period}</div>
        <ul>{job.items.map((it, i) => <CvItem key={i} item={it} resolve={resolve} asBullet />)}</ul>
      </div>
    ));
  }
  if (sec.key === 'summary') return sec.items.map((it, i) => <CvItem key={i} item={it} resolve={resolve} />);
  return <ul>{(sec.items || []).map((it, i) => <CvItem key={i} item={it} resolve={resolve} asBullet />)}</ul>;
}

function CvLive({ cvDraft, meta, resolve }) {
  const person = meta.person || {};
  // Only sections with at least one renderable leaf render (spec: select, never invent).
  const sections = (cvDraft.sections || []).filter(s => sectionLeafCount(s) > 0);
  return (
    <div className="cvlive">
      <div className="paper paper--cv">
        <h2>{person.name}</h2>
        <div className="paper__role">{person.headline}</div>
        <div className="paper__contact">{person.contact}</div>
        {sections.map(sec => (
          <div className="cvlive__sec" key={sec.key}>
            <div className="paper__sec-h">{sec.heading}</div>
            <SectionBody sec={sec} resolve={resolve} />
            <ImproveStrip section={sec} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Intake rail — DISABLED "Kommer" (living-CV-now decision) ---------- */
// Rendered visibly so the user sees the intended layout, but the form and pool
// list are disabled. No addFact call, no datafact-mint engine — deferred.
const INTAKE_TYPES = [
  { code:'Erfarenhet', sv:'Erfarenhet', en:'Experience' },
  { code:'Resultat',   sv:'Resultat',   en:'Result' },
  { code:'Utbildning', sv:'Utbildning', en:'Education' },
  { code:'Styrka',     sv:'Styrka',     en:'Strength' },
];
function IntakeRail({ pool }) {
  return (
    <div className="cvb-intake">
      <div className="secrow">
        <Icon name="doc" size={20} style={{ color:'var(--ll-blue)' }} />
        <h3>{tr({ sv:'Dina byggstenar', en:'Your building blocks' })}</h3>
        <span className="secrow__pill secrow__pill--ok">{pool.length} {tr({ sv:'fakta', en:'facts' })}</span>
        <span className="soon-tag">{tr({ sv:'Kommer', en:'Coming' })}</span>
      </div>
      <p className="cvb-intake__hint">{tr({ sv:'Allt i ditt CV byggs av de här verifierade fakta. Lilly väljer bland dem - hon hittar aldrig på något nytt.', en:'Everything in your CV is built from these verified facts. Lilly selects among them - she never invents anything new.' })}</p>

      <div className="loop__label" style={{ marginTop:'var(--sp-2)' }}>{tr({ sv:'Lägg till en byggsten', en:'Add a building block' })}</div>
      <div className="loop__mode" role="group" aria-label={tr({ sv:'Typ av fakta', en:'Fact type' })} aria-disabled="true">
        {INTAKE_TYPES.map(t => (
          <button key={t.code} disabled aria-disabled="true">{tr({ sv:t.sv, en:t.en })}</button>
        ))}
      </div>
      <textarea
        className="loop__ta" style={{ minHeight:64 }}
        disabled
        placeholder={tr({ sv:'Byggstensintag aktiveras snart.', en:'Building block intake coming soon.' })}
      />
      <div>
        <Button variant="secondary" size="sm" icon="plus" disabled>
          {tr({ sv:'Spara byggsten', en:'Save building block' })}
        </Button>
      </div>

      {pool.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-2)', marginTop:'var(--sp-2)' }}>
          {pool.map(df => (
            <div className={`fact ${/_\d{10,}$/.test(df.id) ? 'fact--new' : ''}`} key={df.id}>
              <div className="fact__top">
                <span className="fact__type">{df.type}</span>
                <span className="fact__lang">{df.language}</span>
              </div>
              <div className="fact__text">{df.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===================== CV BUILDER ===================== */
function CVBuilder() {
  useLang();
  const { caseData, running, actions } = useActiveCase();
  const parts = casePartsView(caseData);
  const meta = caseMetaView(caseData);

  // resolveDatafact: reads pool by id; pool is empty this wave → always returns null.
  const resolveDatafact = React.useCallback((id) => {
    const pool = parts._pool || [];
    return pool.find(df => df.id === id) || null;
  }, [parts._pool]);

  const cvStatus = parts.statusOf('cvDraft');
  const cvDraft = parts.cvDraft; // null unless status === 'ready'
  const pool = parts._pool || [];

  const cross = (
    <CrossColumn
      title={tr({ sv:'Stöd för ditt CV', en:'Support for your CV' })}
      sub={tr({ sv:'Det som hjälper avsnittet du jobbar med.', en:'What helps the section in focus.' })}
      items={CV_CROSS()}
    />
  );

  const head = (
    <div className="ll-pagehead">
      <div className="ll-pagehead__b">
        <h1>{tr({ sv:'CV-byggaren', en:'CV builder' })}</h1>
        <p className="ll-pagehead__sub">{tr({ sv:'Förbi det tomma pappret: dina svar blir byggstenar, Lilly väljer ihop dem till ett CV för rollen - aldrig något påhittat.', en:'Past the blank page: your answers become building blocks, Lilly assembles them into a role-tailored CV - never anything invented.' })}</p>
      </div>
      <div className="ll-pagehead__actions"><LangToggle /></div>
    </div>
  );

  const ctx = meta.company && (
    <div className="ctxbar">
      <span className="ctxbar__logo">{meta.logo}</span>
      <div className="ctxbar__b">
        <div className="ctxbar__t">{meta.jobTitle} · {meta.company}</div>
        {meta.location && <div className="ctxbar__m">{meta.location}</div>}
      </div>
      <span className="ctxbar__lang"><Icon name="doc" size={12} sw={2.4} />{tr({ sv:'CV på engelska · svenska kommer', en:'CV in English · Swedish coming' })}</span>
    </div>
  );

  const body = (
    <React.Fragment>
      {/* Version switcher — one real version per case; more versions per role coming */}
      <div className="vers" role="group" aria-label={tr({ sv:'CV-versioner', en:'CV versions' })}>
        {meta.jobTitle && meta.company
          ? <button className="vers__tab" aria-pressed="true"><Icon name="cv" size={13} sw={2.4} />{meta.jobTitle} · {meta.company}</button>
          : <button className="vers__tab" aria-pressed="true"><Icon name="cv" size={13} sw={2.4} />{tr({ sv:'Ditt CV', en:'Your CV' })}</button>
        }
        <button className="vers__tab" disabled aria-disabled="true"><Icon name="plus" size={12} sw={2.6} />{tr({ sv:'Ny version för annan roll', en:'New version for another role' })}</button>
        <span className="soon-tag">{tr({ sv:'Kommer', en:'Coming' })}</span>
      </div>

      <ContentArea mode="split">
        {/* Left: guided intake rail — disabled "Kommer" this wave */}
        <ContentBox>
          <IntakeRail pool={pool} />
        </ContentBox>

        {/* Center-right: the living CV */}
        <ContentBox>
          <div className="secrow">
            <Icon name="cv" size={20} style={{ color:'var(--ll-blue)' }} />
            <h3>{tr({ sv:'Ditt levande CV', en:'Your living CV' })}</h3>
            {cvStatus === STATUS.READY && (
              <Button
                variant="secondary"
                size="sm"
                icon={running.generate ? null : 'refresh'}
                onClick={() => actions.generate()}
                disabled={running.generate}
              >
                {running.generate ? tr({ sv:'Uppdaterar…', en:'Updating…' }) : tr({ sv:'Uppdatera CV', en:'Update CV' })}
              </Button>
            )}
          </div>
          <div className="guarantee">
            <Icon name="check" size={14} sw={3} />
            {tr({ sv:'Lilly väljer, hittar aldrig på: varje rad går att spåra till en av dina byggstenar.', en:'Lilly selects, never invents: every line traces to one of your building blocks.' })}
          </div>
          <div style={{ height:'var(--sp-3)' }}></div>

          <PartGate
            status={cvStatus}
            busy={running.generate}
            absent={
              <PartState
                title={tr({ sv:'Inget CV genererat ännu', en:'No CV generated yet' })}
                body={tr({ sv:'Lilly bygger ett skräddarsytt CV för den här rollen av dina byggstenar - varje rad med källa.', en:'Lilly assembles a role-tailored CV from your building blocks - every line with a source.' })}
              >
                <Button variant="primary" icon={running.generate ? null : 'sparkle'} onClick={() => actions.generate()} disabled={running.generate}>
                  {running.generate ? tr({ sv:'Genererar…', en:'Generating…' }) : tr({ sv:'Generera CV', en:'Generate CV' })}
                </Button>
              </PartState>
            }
          >
            {cvDraft && <CvLive cvDraft={cvDraft} meta={meta} resolve={resolveDatafact} />}
          </PartGate>
        </ContentBox>
      </ContentArea>

      {cvStatus === STATUS.READY && (
        <ContentBox tone="tint">
          <div className="comment-row">
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, color:'var(--ll-blue-deep)', fontSize:'var(--fs-md)' }}>{tr({ sv:'Nästa steg', en:'Next step' })}</div>
              <div className="text-soft" style={{ fontSize:'var(--fs-sm)', marginTop:2 }}>{tr({ sv:'Använd CV:t som grund för ditt personliga brev, eller granska hela ansökan.', en:'Use the CV as the base for your cover letter, or review the whole application.' })}</div>
            </div>
            <a className="btn btn--primary" href="#letter"><Icon name="letter" size={16} />{tr({ sv:'Använd i Personligt brev', en:'Use in Cover letter' })}</a>
            <a className="btn btn--secondary" href="#ansokningskoll"><Icon name="check" size={16} />{tr({ sv:'Ansökningskoll', en:'Application check' })}</a>
          </div>
        </ContentBox>
      )}
    </React.Fragment>
  );

  return (
    <PageTemplate
      label="CV-byggaren"
      nav={<Sidebar active="cv" />}
      cross={cross}
      content={<ContentArea>{head}{ctx}{body}</ContentArea>}
    />
  );
}

/* ===================== ACTIVITY TRACKER ===================== */
function WeekRing({ pct = 72 }) {
  const r = 34, c = 2 * Math.PI * r, off = c * (1 - pct/100);
  return (
    <svg className="ring" width="86" height="86" viewBox="0 0 86 86">
      <circle className="bg" cx="43" cy="43" r={r} />
      <circle className="fg" cx="43" cy="43" r={r} strokeDasharray={c} strokeDashoffset={off} />
    </svg>
  );
}

/* tool header bar shared by tool screens */
function ToolHeader({ title, step, total, children }) {
  return (
    <header className="topbar" style={{ borderBottom:'1px solid var(--ll-border)', paddingTop:16, paddingBottom:16 }}>
      <button className="iconbtn" aria-label="Tillbaka"><Icon name="chevron" size={20} style={{ transform:'scaleX(-1)' }} /></button>
      <div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800 }}>{title}</h1>
        {step && <p className="cap" style={{ fontWeight:600 }}>Steg {step} av {total} · spara automatiskt</p>}
      </div>
      <div className="topbar__spacer" />
      {children}
    </header>
  );
}

// The honest activity strip: literally a render of the case parts' status envelopes
// across all cases (there is no separate activity log in the backend — this IS the
// real system state, with real timestamps).
const PART_ACTIVITY = {
  dossiers: { label: 'Research klar', m: 'Företag, produkt, människor och nisch researchade.', ic: 'search', tint: 'ic-blue' },
  decodedRole: { label: 'Rollen avkodad', m: 'Det verkliga jobbet bakom annonsen, med viktade krav.', ic: 'target', tint: 'ic-lilac' },
  fit: { label: 'Matchanalys körd', m: 'Ärlig fit per krav, varje match citerar en datafakta.', ic: 'sparkle', tint: 'ic-green' },
  gaps: { label: 'Luckor namngivna', m: 'Luckorna och deras bryggor är på plats.', ic: 'bulb', tint: 'ic-amber' },
  cvDraft: { label: 'CV-utkast byggt', m: 'Sektioner valda ur datafakta-poolen.', ic: 'cv', tint: 'ic-blue' },
  coverLetter: { label: 'Personligt brev skrivet', m: 'Brevet med ärlig bridge-paragraf.', ic: 'letter', tint: 'ic-lilac' },
};

function useActivityRows() {
  const [cases, setCases] = React.useState(null);
  const [fetchError, setFetchError] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    const load = () => listCases()
      .then((cs) => { if (alive) { setCases(cs); setFetchError(null); } })
      // A failed fetch must not masquerade as "no activity" — that would hide a failure.
      .catch((err) => { if (alive) { setCases([]); setFetchError(err.message); } });
    load();
    window.addEventListener('ll:case:changed', load);
    return () => { alive = false; window.removeEventListener('ll:case:changed', load); };
  }, []);

  if (cases === null) return { loading: true, days: [], readyCount: 0, caseCount: 0, fetchError: null };
  const rows = [];
  for (const c of cases) {
    for (const [part, info] of Object.entries(PART_ACTIVITY)) {
      const p = c.parts[part];
      if (!p || p.status === 'absent') continue;
      rows.push({
        part, ...info,
        caseId: c.meta.id,
        status: p.status,
        t: p.status === 'ready' ? info.label : p.status === 'pending' ? `${info.label.split(' ')[0]} pågår…` : `${info.label} misslyckades`,
        company: c.meta.company, role: c.meta.role,
        at: p.updatedAt,
      });
    }
  }
  rows.sort((a, b) => new Date(b.at) - new Date(a.at));
  const byDay = new Map();
  for (const r of rows) {
    const day = new Date(r.at).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(r);
  }
  return {
    loading: false,
    days: [...byDay.entries()].map(([day, items]) => ({ day, items })),
    readyCount: rows.filter((r) => r.status === 'ready').length,
    caseCount: cases.length,
    fetchError,
  };
}

function ActivityTracker() {
  const { loading, days, readyCount, caseCount, fetchError } = useActivityRows();
  return (
    <div className="ll app app--warm" data-screen-label="Min aktivitet">
      <Sidebar active="activity" />
      <div className="main">
        <ToolHeader title="Min aktivitet">
          <Button variant="secondary" size="sm" icon="share">Dela med Sara</Button>
          <Button variant="primary" size="sm" icon="download">Exportera rapport</Button>
        </ToolHeader>

        <div className="content content--narrow" style={{ paddingTop:18, maxWidth:980, margin:'0 auto', width:'100%' }}>
          {/* export banner — the report writes itself */}
          <div className="export" style={{ marginBottom:22 }}>
            <div className="stat__ic" style={{ width:52, height:52, background:'rgba(255,255,255,.22)', color:'#fff', marginBottom:0 }}><Icon name="sparkle" size={26} /></div>
            <div style={{ flex:1 }}>
              <h3>Din aktivitetsrapport skriver sig själv</h3>
              <p>Varje verktyg uppdaterar case record automatiskt: analys, CV-andring, brev, traning och coachnasta steg. Rapporten blir en biprodukt av verklig hjalp.</p>
            </div>
            <Button variant="primary" size="lg" icon="download">Hämta som PDF</Button>
          </div>

          {/* summary + filters */}
          <div className="grid" style={{ gridTemplateColumns:'1fr 320px', alignItems:'start' }}>
            <div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:18 }}>
                <Chip on icon="filter">Allt</Chip>
                <Chip icon="briefcase">Ansökningar</Chip>
                <Chip icon="mic">Intervjuer</Chip>
                <Chip icon="users">Möten</Chip>
                <Chip icon="grad">Kurser</Chip>
              </div>

              <div className="atimeline">
                {loading && <p className="muted">Hämtar aktivitet…</p>}
                {!loading && fetchError && (
                  <div className="feedbackline" style={{ marginBottom: 12 }}>
                    <Icon name="lock" size={18} style={{ color: 'var(--ll-coral)' }} />
                    Kunde inte hämta aktiviteten: {fetchError}
                  </div>
                )}
                {!loading && !fetchError && days.length === 0 && (
                  <div className="card card--pad" style={{ textAlign: 'center' }}>
                    <Icon name="target" size={26} />
                    <h3 style={{ marginTop: 8 }}>Ingen aktivitet än</h3>
                    <p className="muted" style={{ marginTop: 6 }}>Aktiviteten fylls på när du kör en matchanalys — varje steg loggas automatiskt från systemets verkliga tillstånd.</p>
                    <a className="btn btn--primary btn--sm" style={{ marginTop: 12 }} href="#match"><Icon name="target" size={16} />Till Matchanalys</a>
                  </div>
                )}
                {days.map((g) => (
                  <div className="aday" key={g.day}>
                    <div className="aday__label" style={{ textTransform: 'capitalize' }}>{g.day}<span className="pill">{g.items.length} {g.items.length === 1 ? 'aktivitet' : 'aktiviteter'}</span></div>
                    {g.items.map((a) => (
                      <div className="aitem" key={`${a.caseId}-${a.part}`}>
                        <div className="aitem__rail"><div className={`aitem__ic ${a.tint}`}><Icon name={a.ic} size={20} /></div></div>
                        <div className="aitem__card">
                          <div className="aitem__top">
                            <span className="aitem__t">{a.t}</span>
                            <span className="aitem__time">{new Date(a.at).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="aitem__m">{a.company} · {a.role}{a.status === 'ready' ? ` — ${a.m}` : ''}</p>
                          <div style={{ marginTop:10 }}><span className="aitem__auto"><Icon name="sparkle" size={12} />Loggades automatiskt</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* right rail summary */}
            <div className="stack">
              <div className="card card--pad" style={{ textAlign:'center' }}>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:800, marginBottom:14 }}>Din vecka i siffror</h3>
                <div style={{ position:'relative', width:86, height:86, margin:'0 auto 8px' }}>
                  <WeekRing pct={Math.min(100, readyCount * 10)} />
                  <div style={{ position:'absolute', inset:0, display:'grid', placeItems:'center' }}>
                    <div><div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:22, lineHeight:1 }}>{readyCount}</div><div className="cap" style={{ fontSize:11 }}>klara delar</div></div>
                  </div>
                </div>
                <p className="muted" style={{ fontSize:13.5 }}>{caseCount === 0 ? 'Inga ärenden än — allt börjar med ett accepterat jobb.' : <><b style={{ color:'var(--ll-ink)' }}>{caseCount}</b> {caseCount === 1 ? 'ärende' : 'ärenden'} med <b style={{ color:'var(--ll-ink)' }}>{readyCount}</b> klara delar. Varje del är systemets verkliga tillstånd, inte en uppskattning.</>}</p>
              </div>

              <div className="card card--pad">
                <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10 }}>
                  <Clover size={24} color="#2B6CF0" />
                  <strong style={{ fontFamily:'var(--font-display)', fontSize:15 }}>Det här räknas</strong>
                </div>
                <p style={{ fontSize:13.5, color:'var(--ll-ink-soft)' }}>Den här vyn finns för att <b>visa hur långt du kommit</b> - inte för att kontrollera dig. Allt här loggas automatiskt av verktygen själva.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { CVBuilder, ActivityTracker, ToolHeader, WeekRing };
