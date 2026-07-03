import React from 'react';
import { Icon, Clover, Avatar, AvatarStack, Photo, Tag, Chip, Button, Rating, SectionHeader } from '../components/primitives.jsx';
import { Sidebar } from '../components/shell.jsx';
import { CASE_PROFILE, PIPELINE_RUN } from '../data/strategyData.js';
import { useActiveCase, useCase } from '../hooks/useCase.js';
import { listCases } from '../api/caseApi.js';

// HelloLilly — CV builder & Activity tracker

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

/* ===================== CV BUILDER ===================== */
function VoiceWave({ bars = 18 }) {
  const hs = [8,14,20,12,18,22,10,16,21,9,15,19,11,17,13,20,8,14];
  return <div className="voicewave">{Array.from({length:bars}).map((_,i)=>(<span key={i} style={{ height:hs[i%hs.length] }} />))}</div>;
}

const CV_TEMPLATES = [
  { id:'lager', title:'Lager & logistik', tone:'ph--sky', meta:'ATS-vänlig · bild valfri', focus:'Tydlig erfarenhet, truckkort och skiftvana' },
  { id:'classic', title:'Klassisk rekryterare', tone:'ph--mint', meta:'En sida · hög läsbarhet', focus:'Profil, arbetslivserfarenhet och kompetenser först' },
  { id:'visual', title:'Bild-CV enkelt', tone:'ph--sun', meta:'Foto + sidospalt', focus:'Bra när personlig presentation hjälper' },
];

const CV_SECTIONS = [
  { title:'Profil', body:'Pålitlig lager- och logistikmedarbetare med praktik från PostNord, truck A1 och vana vid scanning, plockning och inleverans.' },
  { title:'Erfarenhet', body:'PostNord praktik, ICA-kundkontakt och daglig vana av tempo, ansvar och tydlig kommunikation.' },
  { title:'Kompetenser', body:'Truck A1, lagerhantering, handdator/scanning, plock och pack, noggrannhet, punktlighet och lagarbete.' },
  { title:'Utbildning', body:'Gymnasieutbildning samt kurser och intyg som kan kompletteras direkt när de laddas upp.' },
  { title:'Språk', body:'Svenska flytande, arabiska modersmål och enkel yrkesengelska för instruktioner och system.' },
  { title:'Referenser', body:'Referenser lämnas på begäran. Lilly hjälper till att formulera frågan till handledare eller tidigare chef.' },
];

// The live preview pane, bound to the active case's cvDraft envelope. Every rendered
// text is a SELECTED datafact (cv-builder never authors), so the paper shows real,
// traceable content — or an honest absent/pending/failed state.
function CVDraftPaper({ caseData, running, actions }) {
  const draft = caseData && caseData.cvDraft;
  const status = draft ? draft.status : 'absent';

  if (!caseData || status === 'absent') {
    return (
      <div className="cvpaper" style={{ display: 'grid', placeItems: 'center', minHeight: 420, textAlign: 'center', gap: 10 }}>
        <div>
          <Clover size={38} color="#2B6CF0" />
          <h2 style={{ marginTop: 12 }}>Inget CV-utkast ännu</h2>
          <p className="muted" style={{ maxWidth: 380, margin: '8px auto 14px' }}>
            CV-utkastet byggs från din matchanalys. Kör en analys på ett accepterat jobb så väljer Lilly de datafakta som passar rollen.
          </p>
          <a className="btn btn--primary btn--sm" href="#match"><Icon name="target" size={16} />Till Matchanalys</a>
        </div>
      </div>
    );
  }

  if (status === 'pending' || running.generate) {
    return (
      <div className="cvpaper" style={{ display: 'grid', placeItems: 'center', minHeight: 420, textAlign: 'center', gap: 10 }}>
        <div>
          <VoiceWave bars={14} />
          <h2 style={{ marginTop: 12 }}>Lilly bygger utkastet</h2>
          <p className="muted" style={{ maxWidth: 380, margin: '8px auto 0' }}>
            Väljer datafakta per sektion utifrån de avkodade kraven för {caseData.meta.role} hos {caseData.meta.company}.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="cvpaper" style={{ display: 'grid', placeItems: 'center', minHeight: 420, textAlign: 'center', gap: 10 }}>
        <div>
          <Icon name="doc" size={30} />
          <h2 style={{ marginTop: 12 }}>Utkastet kunde inte byggas</h2>
          <p className="muted" style={{ maxWidth: 380, margin: '8px auto 14px' }}>{draft.error || 'Okänt fel.'}</p>
          <Button variant="secondary" size="sm" icon="target" onClick={() => actions.generate().catch(() => {})}>Försök igen</Button>
        </div>
      </div>
    );
  }

  const sections = (draft.data && draft.data.sections) || [];
  return (
    <div className="cvpaper">
      <div className="cvpaper__photo">
        <Photo tone="ph--sky" clover person label="CV-bild" />
      </div>
      {/* Single-user product: the pool is Daniel's real CV (meta.owner = 'self'). */}
      <h2>Daniel Oskarsson</h2>
      <div className="cv-role">{caseData.meta.role} · {caseData.meta.company}</div>
      {sections.map((sec) => (
        <div className="cv-sec" key={sec.key || sec.heading}>
          <h3>{sec.heading}</h3>
          {sec.items.map((it) => (
            <p key={it.datafactRef ? it.datafactRef.id : it.text} style={{ marginTop: 8 }}>{it.text}</p>
          ))}
        </div>
      ))}
      {sections.length === 0 && <p className="muted" style={{ marginTop: 12 }}>Inga sektioner kunde fyllas från datafakta-poolen.</p>}
    </div>
  );
}

function CVBuilder() {
  const [uploadedTemplates, setUploadedTemplates] = React.useState([]);
  const { caseData, running, actions } = useActiveCase();

  const onTemplateUpload = (event) => {
    const files = Array.from(event.target.files || []).map((file) => ({
      id: `${file.name}-${file.lastModified}`,
      name: file.name,
      size: Math.round(file.size / 1024),
    }));
    setUploadedTemplates((current) => [...files, ...current].slice(0, 6));
    event.target.value = '';
  };

  return (
    <div className="ll app" data-screen-label="CV-byggaren">
      <Sidebar active="cv" />
      <div className="main">
        <ToolHeader title="CV-byggaren" step="4" total="7">
          <label className="btn btn--secondary btn--sm cv-upload-btn">
            <Icon name="upload" size={16} />
            Ladda upp mall
            <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" multiple onChange={onTemplateUpload} />
          </label>
          <Button variant="ghost" size="sm" icon="download">Ladda ner PDF</Button>
          <Button variant="primary" size="sm" icon="check">Spara</Button>
        </ToolHeader>

        <div className="cvbuilder-grid">
          {/* intake */}
          <section className="intake" style={{ borderRight:'1px solid var(--ll-border)' }}>
            <div className="intake__head">
              <Avatar name="Sara Lind" size="md" tone="av-c3" clover />
              <div>
                <div className="intake__title">Vi bygger ditt CV från case record</div>
                <div className="cap">En fråga i taget - kopplat till {(caseData && caseData.meta.company) || PIPELINE_RUN.company}-analysen</div>
              </div>
              <span className="intake__prog">60% klart</span>
            </div>

            <div className="cv-template-panel">
              <div className="between" style={{ marginBottom:10 }}>
                <div>
                  <h3>CV-mallar</h3>
                  <p className="cap">Välj bas eller ladda upp en egen mall.</p>
                </div>
                <span className="pill">{CV_TEMPLATES.length + uploadedTemplates.length} mallar</span>
              </div>
              <div className="cv-templates">
                {CV_TEMPLATES.map((template) => (
                  <button className="cv-template-card" key={template.id} type="button">
                    <Photo tone={template.tone} clover person={template.id === 'visual'} label={template.title} />
                    <div>
                      <b>{template.title}</b>
                      <span>{template.meta}</span>
                      <p>{template.focus}</p>
                    </div>
                  </button>
                ))}
                {uploadedTemplates.map((template) => (
                  <button className="cv-template-card cv-template-card--uploaded" key={template.id} type="button">
                    <div className="filetype ft-doc">DOC</div>
                    <div>
                      <b>{template.name}</b>
                      <span>{template.size} KB · uppladdad</span>
                      <p>Redo att mappas mot HelloLillys CV-sektioner.</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="intake__feed">
              <div className="msg msg--bot">
                <Avatar name="Sara Lind" size="sm" tone="av-c3" />
                <div>
                  <div className="msg__bubble">Hej {CASE_PROFILE.person.split(' ')[0]}! Vi tar det lugnt och bygger ditt CV tillsammans. Jag har redan hämtat intake, aktivitet och matchanalysen - du behöver inte börja om.</div>
                </div>
              </div>

              <div className="intake__reassure"><Icon name="check" size={16} sw={2.6} />Jag hittade praktik, truck A1 och dagens Application Check. Nu fyller vi bara luckorna.</div>

              <div className="msg msg--bot">
                <Avatar name="Sara Lind" size="sm" tone="av-c3" />
                  <div className="msg__bubble">Pipeline-fråga: <b>har du använt handdator, scanning eller inleveranssystem?</b> Det kan täcka WMS-luckan ärligt.</div>
              </div>

              <div className="msg msg--me">
                <div className="msg__bubble">Ja, jag scannade paket och registrerade inleveranser på praktiken.</div>
              </div>

              <div className="msg msg--bot">
                <Avatar name="Sara Lind" size="sm" tone="av-c3" />
                <div>
                  <div className="msg__bubble">Perfekt. Då skriver vi det som handdator och inleverans, inte som SAP-expertis. Det blir sant och användbart.</div>
                  <div className="msg__hint">Fråga 4 av 7 · du kan alltid gå tillbaka</div>
                </div>
              </div>
            </div>

            <div className="cv-section-panel">
              <div className="between" style={{ marginBottom:10 }}>
                <h3>CV-sektioner</h3>
                <span className="cap">Allt innehåll är redigerbart</span>
              </div>
              <div className="cv-section-grid">
                {CV_SECTIONS.map((section) => (
                  <div className="cv-section-card" key={section.title}>
                    <div className="cv-section-card__icon"><Icon name="doc" size={16} /></div>
                    <div>
                      <b>{section.title}</b>
                      <p>{section.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="intake__composer">
              <div className="intake__inputrow">
                <input placeholder="Skriv ditt svar…" aria-label="Ditt svar" />
                <button className="intake__mic" aria-label="Spela in röst"><Icon name="mic" size={20} /></button>
                <button className="intake__send" aria-label="Skicka"><Icon name="send" size={19} /></button>
              </div>
              <div className="intake__quick">
                <Chip icon="voice">Jag scannade paket</Chip>
                <Chip>Jag använde handdator</Chip>
                <Chip>Fråga Sara</Chip>
              </div>
            </div>
          </section>

          {/* live preview — the real cvDraft for the active case */}
          <section className="cvframe">
            <div style={{ width:'100%', maxWidth:560 }}>
              <div className="between" style={{ marginBottom:14 }}>
                {caseData && caseData.cvDraft.status === 'ready'
                  ? <span className="tag tag--green" style={{ gap:6 }}><Icon name="sparkle" size={14} />Byggt från din matchanalys</span>
                  : <span className="tag tag--ghost" style={{ gap:6 }}><Icon name="doc" size={14} />Väntar på analys</span>}
                <span className="cap" style={{ fontWeight:700 }}>
                  {caseData ? `Förhandsvisning · ${caseData.meta.company}` : 'Förhandsvisning'}
                </span>
              </div>
              <CVDraftPaper caseData={caseData} running={running} actions={actions} />
            </div>
          </section>
        </div>
      </div>
    </div>
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
