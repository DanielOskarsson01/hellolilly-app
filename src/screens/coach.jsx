import React from 'react';
import { Icon, Clover, Logo, Avatar, AvatarStack, Photo, Tag, Chip, Button, Rating, SectionHeader } from '../components/primitives.jsx';
import { CASE_PROFILE, CASE_RECORD, PIPELINE_RUN, OUTCOME_METRICS } from '../data/strategyData.js';

// HelloLilly — Coachvy (coach-facing workspace)
// Coach resource library + the coaching process as a continuous cycle:
// Kartläggning → Strategi → Output → Feedback → Justering → (tillbaka till Kartläggning)

const CYCLE = [
  { key:'kartlaggning', label:'Kartläggning', icon:'target',    tint:'ic-blue',  color:'#2B6CF0',
    desc:'Förstå deltagarens läge, mål och hinder. Bygg trygghet och en gemensam bild.' },
  { key:'strategi',     label:'Strategi',     icon:'bulb',      tint:'ic-lilac', color:'#8E7CF0',
    desc:'Lägg en enkel plan: vilka verktyg, vilka steg och i vilken ordning.' },
  { key:'output',       label:'Output',       icon:'doc',       tint:'ic-green', color:'#2FA56A',
    desc:'Skapa konkret: CV, personligt brev, ansökningar, profilbild.' },
  { key:'feedback',     label:'Feedback',     icon:'users',     tint:'ic-amber', color:'#F39A1E',
    desc:'Coacher och deltagare ger varm, konkret återkoppling.' },
  { key:'justering',    label:'Justering',    icon:'refresh',   tint:'ic-coral', color:'#FF7A59',
    desc:'Finjustera utifrån feedbacken – och börja om med ny kartläggning.' },
];

// geometry: 5 nodes evenly around an ellipse, arrowheads at the midpoints (clockwise)
const CY_W = 520, CY_H = 470, CCX = 260, CCY = 215, CRX = 188, CRY = 172;
const polar = (deg) => ({ x: CCX + CRX * Math.sin(deg*Math.PI/180), y: CCY - CRY * Math.cos(deg*Math.PI/180) });

function CoachingCycle({ activeKey = 'output', here = 'Amir' }) {
  const nodes  = CYCLE.map((s,i) => ({ ...s, ...polar(i*72), n:i+1 }));
  const arrows = CYCLE.map((_,i) => ({ ...polar(i*72+36), rot:i*72+36 }));
  return (
    <div className="cycle">
      <svg viewBox={`0 0 ${CY_W} ${CY_H}`} aria-hidden="true">
        <ellipse cx={CCX} cy={CCY} rx={CRX} ry={CRY} fill="none" stroke="#D7E5FB" strokeWidth="2.5" strokeDasharray="2 9" strokeLinecap="round" />
        {arrows.map((a,i) => (
          <g key={i} transform={`translate(${a.x} ${a.y}) rotate(${a.rot})`}>
            <path d="M -8 -7 L 6 0 L -8 7" fill="none" stroke="#9DBEF6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
      </svg>

      <div className="cycle__center">
        <Clover size={40} color="#2B6CF0" />
        <div className="ttl">Coachingcykeln</div>
        <div className="sub">Ett varv i taget,<br/>tillsammans</div>
      </div>

      {nodes.map(nd => (
        <div key={nd.key} className={`cnode ${nd.key===activeKey ? 'cnode--active' : ''}`} style={{ left:nd.x, top:nd.y }}>
          <div className={`cnode__dot ${nd.tint}`}>
            <Icon name={nd.icon} size={26} />
            <span className="cnode__step">{nd.n}</span>
          </div>
          <div className="cnode__lbl">{nd.label}</div>
          {nd.key===activeKey && <span className="cnode__here"><span style={{width:6,height:6,borderRadius:'50%',background:'currentColor',display:'inline-block'}} />{here} är här</span>}
        </div>
      ))}
    </div>
  );
}

/* Coach sidebar — 2-level navigation (groups + sub-items). Mirrors the
   jobseeker pattern so coaches have the same shape and rhythm. */
const COACH_NAV_GROUPS = [
  { id:'c-oversikt',  label:'Översikt',     icon:'home',      items: [
    { id:'coach',                       label:'Dagens möten' },
    { id:'c-behover-uppmarksamhet',     label:'Behöver uppmärksamhet', badge:3 },
    { id:'c-vantande-granskningar',     label:'Väntande granskningar' },
    { id:'c-senaste-framsteg',          label:'Senaste framsteg' },
    { id:'c-foreslagna-uppfoljningar',  label:'Föreslagna uppföljningar' },
  ]},
  { id:'c-deltagare', label:'Deltagare',    icon:'users',     items: [
    { id:'c-alla-deltagare',  label:'Alla deltagare' },
    { id:'c-sok-deltagare',   label:'Sök deltagare' },
    { id:'c-filter',          label:'Filter' },
    { id:'c-fastnat',         label:'Fastnat' },
    { id:'c-senaste-aktivitet',label:'Senaste aktivitet' },
  ]},
  { id:'c-arenden',   label:'Ärenden',      icon:'briefcase', items: [
    { id:'c-arendevy',          label:'Ärendevy' },
    { id:'c-mal-och-hinder',    label:'Mål och hinder' },
    { id:'c-cv-och-ansokningar',label:'CV och ansökningar' },
    { id:'c-jobbmatchningar',   label:'Jobbmatchningar' },
    { id:'c-aktiviteter',       label:'Aktiviteter' },
    { id:'c-nasta-steg',        label:'Nästa steg' },
    { id:'c-dokument',          label:'Dokument' },
  ]},
  { id:'c-granskningar', label:'Granskningar', icon:'pen', items: [
    { id:'c-cv-granskning',         label:'CV-granskning' },
    { id:'c-brev-granskning',       label:'Brevgranskning' },
    { id:'c-ansoknings-granskning', label:'Ansökningsgranskning' },
    { id:'c-linkedin-granskning',   label:'LinkedIn-granskning' },
    { id:'c-bild-granskning',       label:'Bildgranskning' },
    { id:'c-second-opinion-g',      label:'Second opinion' },
  ]},
  { id:'c-natverk', label:'Coachnätverk', icon:'globe', items: [
    { id:'valvet',              label:'Valvet — ditt nätverk' },
    { id:'c-hitta-coach',       label:'Hitta coach' },
    { id:'c-specialistkunskap', label:'Specialistkunskap' },
    { id:'c-branschkunskap',    label:'Branschkunskap' },
    { id:'c-second-opinion-n',  label:'Second opinion' },
    { id:'c-coachprofiler',     label:'Coachprofiler' },
  ]},
  { id:'c-kunskap', label:'Kunskap', icon:'library', items: [
    { id:'c-kunskapshubb',  label:'Kunskapshubb' },
    { id:'c-mallar',        label:'Mallar' },
    { id:'c-guider',        label:'Guider' },
    { id:'c-presentationer',label:'Presentationer' },
    { id:'c-videos',        label:'Videos' },
    { id:'c-best-practice', label:'Best practice' },
    { id:'c-interna-tips',  label:'Interna tips' },
  ]},
  { id:'c-moten', label:'Möten', icon:'calendar', items: [
    { id:'c-kalender',          label:'Kalender' },
    { id:'c-motesforberedelse', label:'Mötesförberedelse' },
    { id:'c-motesstod',         label:'Mötesstöd' },
    { id:'c-sammanfattningar',  label:'Sammanfattningar' },
    { id:'c-uppfoljning',       label:'Uppföljning' },
  ]},
  { id:'c-insikter', label:'Insikter', icon:'activity', items: [
    { id:'c-feedback',           label:'Feedback' },
    { id:'c-vanliga-hinder',     label:'Vanliga hinder' },
    { id:'c-vad-fungerar',       label:'Vad fungerar' },
    { id:'c-aktivitetsmonster',  label:'Aktivitetsmönster' },
    { id:'c-utfall',             label:'Utfall' },
    { id:'c-forbattringsforslag',label:'Förbättringsförslag' },
  ]},
];

const COACH_NAV_INDEX = (() => {
  const ix = {};
  COACH_NAV_GROUPS.forEach(g => g.items.forEach(i => {
    if (!ix[i.id]) ix[i.id] = { label: i.label, group: g.id, groupLabel: g.label, coach: true };
  }));
  return ix;
})();

function CoachSidebar({ active = 'coach' }) {
  const site = typeof window !== 'undefined' && true;
  const activeGroup = (COACH_NAV_INDEX[active] && COACH_NAV_INDEX[active].group) || 'c-oversikt';
  const [open, setOpen] = React.useState(() => new Set([activeGroup]));
  React.useEffect(() => {
    setOpen(prev => { const next = new Set(prev); next.add(activeGroup); return next; });
  }, [activeGroup]);
  const toggle = (id) => setOpen(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <aside className="side">
      <a href={site ? '#coach' : undefined} aria-label="HelloLilly" style={{ display:'block' }}><Logo /></a>
      <span className="side__role"><Clover size={12} color="#2B6CF0" />Coachvy</span>
      <nav className="nav nav--grouped" aria-label="Coachmeny" style={{ marginTop:6 }}>
        {COACH_NAV_GROUPS.map(g => {
          const isOpen = open.has(g.id);
          const hasActive = g.items.some(i => i.id === active);
          return (
            <div key={g.id} className={`navgroup ${isOpen ? 'navgroup--open' : ''} ${hasActive ? 'navgroup--has-active' : ''}`}>
              <button type="button" className="navgroup__head" onClick={() => toggle(g.id)} aria-expanded={isOpen}>
                <Icon name={g.icon} size={18} />
                <span className="navgroup__lbl">{g.label}</span>
                <Icon name="chevron" size={14} className="navgroup__chev" />
              </button>
              {isOpen && (
                <div className="navgroup__items">
                  {g.items.map(i => {
                    const isActive = i.id === active;
                    const cls = `subnav ${isActive ? 'subnav--active' : ''}`;
                    const inner = (<React.Fragment>
                      <span className="subnav__lbl">{i.label}</span>
                      {i.badge && <span className="navitem__badge">{i.badge}</span>}
                    </React.Fragment>);
                    return site
                      ? <a key={i.id + '-' + g.id} href={`#${i.id}`} className={cls} aria-current={isActive ? 'page' : undefined}>{inner}</a>
                      : <button key={i.id + '-' + g.id} className={cls} aria-current={isActive ? 'page' : undefined}>{inner}</button>;
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div style={{ marginTop:'auto' }}>
        {site
          ? <a href="#home" className="navitem" style={{ color:'var(--ll-ink-soft)' }}><Icon name="arrow" size={20} style={{ transform:'scaleX(-1)' }} />Till deltagarvyn</a>
          : null}
        <div className="card card--tint card--pad" style={{ padding:18, marginTop:8 }}>
          <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10 }}>
            <Clover size={24} color="#2B6CF0" />
            <strong style={{ fontFamily:'var(--font-display)', fontSize:14, color:'var(--ll-blue-deep)' }}>Ny deltagare?</strong>
          </div>
          <p style={{ fontSize:12.5, color:'var(--ll-ink-soft)', marginBottom:12 }}>Starta en coachingcykel på under en minut.</p>
          {site
            ? <a href="#coach" className="btn btn--primary btn--sm btn--block"><Icon name="plus" size={16} />Starta coaching</a>
            : <Button variant="primary" size="sm" icon="plus" block>Starta coaching</Button>}
        </div>
      </div>
    </aside>
  );
}

/* participants in the cycle */
const PARTICIPANTS = [
  { name:'Amir Hassan', tone:'av-c1', meta:'Lager & logistik', phase:2, phaseLbl:'Output', next:'Granska CV ihop', cls:'phase-output' },
  { name:'Linnea Berg', tone:'av-c2', meta:'Vård & omsorg', phase:0, phaseLbl:'Kartläggning', next:'Första samtalet', cls:'phase-kartlaggning' },
  { name:'Johan Pettersson', tone:'av-c5', meta:'Bygg', phase:3, phaseLbl:'Feedback', next:'Boka feedbackmöte', cls:'phase-feedback' },
  { name:'Sara Khan', tone:'av-c4', meta:'Administration', phase:1, phaseLbl:'Strategi', next:'Välj verktyg', cls:'phase-strategi' },
  { name:'Erik Nyström', tone:'av-c3', meta:'IT & support', phase:4, phaseLbl:'Justering', next:'Putsa brev', cls:'phase-justering' },
];

/* coach material library */
const RESOURCES = [
  { ft:'ft-pptx', ext:'PPTX', t:'Onboarding – första mötet', m:'Presentation · 18 sidor', by:'HelloLilly', upd:'Uppdaterad mån' },
  { ft:'ft-doc',  ext:'DOC',  t:'Kartläggningsmall', m:'Dokument · ifyllbar', by:'Sara Lind', upd:'Använd 142 ggr' },
  { ft:'ft-pdf',  ext:'PDF',  t:'Intervjuguide för coacher', m:'Guide · 6 sidor', by:'Marcus Tylén', upd:'Populär' },
  { ft:'ft-zip',  ext:'ZIP',  t:'CV-mallar (paket)', m:'12 mallar · ATS-säkra', by:'HelloLilly', upd:'Ny' },
  { ft:'ft-key',  ext:'KEY',  t:'Seminarium: Lugn inför intervju', m:'Slides · 24 sidor', by:'Sara Lind', upd:'Uppdaterad' },
  { ft:'ft-xls',  ext:'XLS',  t:'Strategi & uppföljning', m:'Mall · per deltagare', by:'HelloLilly', upd:'Använd 88 ggr' },
];

function CoachTopbar({ name = 'Sara' }) {
  return (
    <header className="topbar">
      <div className="topbar__search">
        <Icon name="search" size={18} />
        <span>Sök deltagare, mallar eller material…</span>
      </div>
      <div className="topbar__spacer" />
      <button className="iconbtn" aria-label="Notiser"><Icon name="bell" size={20} /><span className="dot" /></button>
      <button className="iconbtn" aria-label="Inställningar"><Icon name="settings" size={20} /></button>
      <Avatar name={name} size="md" tone="av-c3" clover />
    </header>
  );
}

function CoachWorkspace() {
  return (
    <div className="ll app app--warm" data-screen-label="Coachvy">
      <CoachSidebar active="coach" />
      <div className="main">
        <CoachTopbar name="Sara" />
        <div className="content content--narrow" style={{ paddingTop:14 }}>

          {/* header */}
          <div className="coachhead">
            <div>
              <h1 style={{ fontFamily:'var(--font-display)', fontSize:30, fontWeight:900 }}>God morgon, Sara <span style={{ fontSize:26 }}>👋</span></h1>
              <p className="muted" style={{ fontSize:15, marginTop:6 }}>Sex deltagare i aktiv coaching. {CASE_PROFILE.person} behöver ett konkret nästa steg, inte mer allmänna råd.</p>
            </div>
            <div className="coachhead__stats">
              <div className="cstat"><div className="stat__ic ic-blue" style={{ width:40, height:40, marginBottom:0 }}><Icon name="users" size={19} /></div><div><div className="big" style={{ color:'var(--ll-blue-deep)' }}>6</div><div className="lab">aktiva deltagare</div></div></div>
              <div className="cstat"><div className="stat__ic ic-amber" style={{ width:40, height:40, marginBottom:0 }}><Icon name="target" size={19} /></div><div><div className="big" style={{ color:'#9a6611' }}>{PIPELINE_RUN.score}%</div><div className="lab">PostNord nu</div></div></div>
              <div className="cstat"><div className="stat__ic ic-green" style={{ width:40, height:40, marginBottom:0 }}><Icon name="check" size={19} /></div><div><div className="big" style={{ color:'#1c7a48' }}>{PIPELINE_RUN.improvedScore}%</div><div className="lab">efter åtgärd</div></div></div>
            </div>
          </div>

          <section style={{ marginBottom:32 }}>
            <SectionHeader title="Ärendevy: levande case record" sub="Samma bild för coach, deltagare och assistent" seeAll="Öppna full ärendevy" />
            <div className="grid" style={{ gridTemplateColumns:'1.25fr .75fr', gap:16, alignItems:'stretch' }}>
              <div className="card card--pad">
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                  <Avatar name={CASE_PROFILE.person} size="md" tone="av-c1" />
                  <div>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:18 }}>{CASE_PROFILE.person}</div>
                    <div className="cap">{CASE_PROFILE.goal} · {CASE_PROFILE.municipality}</div>
                  </div>
                  <span style={{ marginLeft:'auto' }}><Tag variant="tag--green">{CASE_RECORD.status}</Tag></span>
                </div>
                <p style={{ color:'var(--ll-ink-soft)', lineHeight:1.55 }}>{CASE_RECORD.coachNote}</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginTop:14 }}>
                  {OUTCOME_METRICS.map((m) => (
                    <div key={m.label} style={{ background:'var(--ll-blue-tint-2)', borderRadius:12, padding:'12px 14px' }}>
                      <div style={{ fontFamily:'var(--font-display)', fontWeight:900, color:'var(--ll-blue-deep)', fontSize:22 }}>{m.value}</div>
                      <div className="cap">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card card--pad">
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:800, marginBottom:10 }}>Nästa coachinsats</h3>
                <p style={{ color:'var(--ll-ink-soft)', lineHeight:1.55 }}>{CASE_RECORD.nextStep}</p>
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
                  {PIPELINE_RUN.gaps.map((gap) => (
                    <div key={gap.t} className="lgloop" style={{ justifyContent:'flex-start' }}><Icon name="sparkle" size={14} />{gap.t}</div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* coaching cycle */}
          <section style={{ marginBottom:32 }}>
            <SectionHeader title="Coachingprocessen" sub="En trygg, återkommande cykel – inte en rak linje" seeAll={null} />
            <div className="card card--pad" style={{ padding:'28px 30px' }}>
              <div className="cycle-wrap">
                <CoachingCycle activeKey="output" here="Amir" />
                <div>
                  <div className="cyclelegend">
                    {CYCLE.map((s,i) => (
                      <div className="lgstep" key={s.key}>
                        <span className="lgstep__n" style={{ background:s.color }}>{i+1}</span>
                        <div>
                          <div className="lgstep__t">{s.label}{s.key==='output' && <span className="phasechip phase-output">Amir är här</span>}</div>
                          <div className="lgstep__m">{s.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="lgloop"><Icon name="refresh" size={17} />Efter justering börjar ett nytt varv – med en ny kartläggning.</div>
                  <div style={{ display:'flex', gap:10, marginTop:16 }}>
                    <Button variant="primary" icon="plus">Starta ny coachingcykel</Button>
                    <Button variant="secondary" icon="doc">Öppna mallar</Button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* participants in the cycle */}
          <section style={{ marginBottom:32 }}>
            <SectionHeader title="Mina deltagare" sub="Var i cykeln befinner de sig?" seeAll="Visa alla 6" />
            <div className="card card--pad">
              {PARTICIPANTS.map((p,i) => (
                <div className="prow" key={i}>
                  <div className="prow__who">
                    <Avatar name={p.name} size="md" tone={p.tone} clover />
                    <div>
                      <div className="prow__name">{p.name}</div>
                      <div className="prow__meta">{p.meta}</div>
                    </div>
                  </div>
                  <div className="prow__track" aria-label={`Fas: ${p.phaseLbl}`}>
                    {CYCLE.map((_,k) => (
                      <span key={k} className={`ptick ${k < p.phase ? 'ptick--done' : ''} ${k === p.phase ? 'ptick--now' : ''}`} />
                    ))}
                  </div>
                  <span className={`phasechip ${p.cls}`} style={{ flex:'0 0 auto' }}>{p.phaseLbl}</span>
                  <div className="prow__next">Nästa: <b>{p.next}</b></div>
                  <div className="prow__act">
                    <Button variant="secondary" size="sm" icon="letter">Skriv</Button>
                    <Button variant="primary" size="sm" iconRight="arrow">Öppna</Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* coach resource library */}
          <section>
            <SectionHeader title="Material & mallar" sub="Filer, presentationer och mallar att återanvända" seeAll="Hela biblioteket" />
            <div className="resbar">
              <Chip on icon="library">Allt</Chip>
              <Chip icon="image">Presentationer</Chip>
              <Chip icon="doc">Mallar</Chip>
              <Chip icon="bulb">Guider</Chip>
              <Chip icon="grad">Seminarier</Chip>
              <span style={{ marginLeft:'auto' }}><Button variant="secondary" size="sm" icon="plus">Ladda upp</Button></span>
            </div>
            <div className="res">
              {RESOURCES.map((r,i) => (
                <article className="resfile" key={i}>
                  <div className="resfile__top">
                    <div className={`filetype ${r.ft}`}>{r.ext}</div>
                    <div style={{ minWidth:0 }}>
                      <div className="resfile__t">{r.t}</div>
                      <div className="resfile__m">{r.m}</div>
                    </div>
                  </div>
                  <div className="resfile__foot">
                    <span className="resfile__by">{r.by} · {r.upd}</span>
                    <div className="resfile__acts">
                      <button className="miniicon" aria-label="Dela"><Icon name="share" size={16} /></button>
                      <button className="miniicon" aria-label="Öppna"><Icon name="arrow" size={16} /></button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

export { CoachWorkspace, CoachingCycle, CoachSidebar, COACH_NAV_GROUPS, COACH_NAV_INDEX };
