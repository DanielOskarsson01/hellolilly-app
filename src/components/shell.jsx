import React from 'react';
import { Icon, Clover, Logo, Photo, Avatar, AvatarStack, Tag, Chip, Button, Rating, SectionHeader } from './primitives.jsx';
import { CoachSidebar, COACH_NAV_INDEX } from '../screens/coach.jsx';
import { TOOL_SPECS, COACH_TOOL_SPECS } from '../data/strategyData.js';

// HelloLilly — app shell + dashboard widgets
// Two-level navigation: 7 top-level groups with sub-items. The active group
// auto-opens; the others stay collapsed so the structure stays scannable.
const NAV_GROUPS = [
  { id:'plan',     label:'Plan',      icon:'activity',  items: [
    { id:'home',           label:'Framstegsstöd' },
    { id:'activity',       label:'Min aktivitet' },
    { id:'activity-log',   label:'Aktivitetslogg (verifiering)' },
    { id:'calendar',       label:'Kalender' },
    { id:'uppgifter',      label:'Uppgifter' },
    { id:'paminnelser',    label:'Påminnelser' },
    { id:'arendevy-plan',  label:'Ärendevy' },
  ]},
  { id:'jobb',     label:'Jobb',      icon:'briefcase', items: [
    { id:'jobbsok',        label:'Jobbsök' },
    { id:'match',          label:'Matchanalys' },
    { id:'jobbradar',      label:'Jobbradar' },
    { id:'foretagslista',  label:'Företagslista' },
    { id:'sparade-jobb',   label:'Sparade jobb' },
  ]},
  { id:'ansok',    label:'Ansök',     icon:'pen',       items: [
    { id:'cv',             label:'CV-byggare' },
    { id:'letter',         label:'Personligt brev' },
    { id:'ansokningskoll',    label:'Ansökningskoll' },
    { id:'innan-du-skickar', label:'Innan du skickar' },
    { id:'review',            label:'Coachgranskning' },
    { id:'studio',         label:'Bildstöd' },
  ]},
  { id:'intervju', label:'Intervju',  icon:'mic',       items: [
    { id:'interview',            label:'Intervjuträning', badge:1 },
    { id:'intervjuforberedelse', label:'Intervjuförberedelse' },
    { id:'researchstod',         label:'Researchstöd' },
    { id:'ovningshistorik',      label:'Övningshistorik' },
  ]},
  { id:'natverk',  label:'Nätverk',   icon:'globe',     items: [
    { id:'linkedin',          label:'LinkedIn-stöd' },
    { id:'kontaktplan',       label:'Kontaktplan' },
    { id:'natverksmatch',     label:'Nätverksmatch' },
    { id:'spontanansokningar',label:'Spontanansökningar' },
    { id:'kontakter',         label:'Kontakter' },
  ]},
  { id:'stod',     label:'Stöd',      icon:'library',   items: [
    { id:'kunskapshubb', label:'Kunskapshubb' },
    { id:'community',    label:'Community' },
    { id:'library',      label:'Mallar' },
    { id:'videos',       label:'Videos' },
    { id:'guider',       label:'Guider' },
    { id:'kurser',       label:'Kurser' },
    { id:'diskussioner', label:'Diskussioner' },
  ]},
  { id:'mincoach', label:'Min coach', icon:'users',     items: [
    { id:'meddelanden',     label:'Meddelanden' },
    { id:'moten',           label:'Möten' },
    { id:'arendevy-coach',  label:'Ärendevy' },
    { id:'review',          label:'Coachgranskning' },
    { id:'delade-dokument', label:'Delade dokument' },
    { id:'nastasteg',       label:'Nästa steg' },
  ]},
];

/* Flat lookup: route key → { label, group } — used by ComingSoon and the
   sidebar to find which group should auto-open. */
const NAV_INDEX = (() => {
  const ix = {};
  NAV_GROUPS.forEach(g => g.items.forEach(i => { if (!ix[i.id]) ix[i.id] = { label: i.label, group: g.id, groupLabel: g.label }; }));
  return ix;
})();

function Sidebar({ active = 'home' }) {
  const site = typeof window !== 'undefined' && true;
  // Which group contains the active route?
  const activeGroup = (NAV_INDEX[active] && NAV_INDEX[active].group) || 'plan';
  const [open, setOpen] = React.useState(() => new Set([activeGroup]));
  // Keep the active group open whenever route changes
  React.useEffect(() => {
    setOpen(prev => { const next = new Set(prev); next.add(activeGroup); return next; });
  }, [activeGroup]);
  const toggle = (id) => setOpen(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <aside className="side">
      <a href={site ? '#home' : undefined} aria-label="HelloLilly hem" style={{ display:'block' }}><Logo /></a>
      <nav className="nav nav--grouped" aria-label="Huvudmeny">
        {NAV_GROUPS.map(g => {
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
        {site && <a href="#coach" className="navitem" style={{ color:'var(--ll-ink-soft)', marginBottom:8 }}><Icon name="users" size={20} />Coachvy</a>}
        <div className="card card--tint card--pad" style={{ padding:18 }}>
          <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10 }}>
            <Clover size={26} color="#2B6CF0" />
            <strong style={{ fontFamily:'var(--font-display)', fontSize:14.5, color:'var(--ll-blue-deep)' }}>Behöver du prata?</strong>
          </div>
          <p style={{ fontSize:13, color:'var(--ll-ink-soft)', marginBottom:12 }}>Din coach finns här för dig, helt utan stress.</p>
          {site
            ? <a href="#review" className="btn btn--primary btn--sm btn--block"><Icon name="letter" size={16} />Skriv till Sara</a>
            : <Button variant="primary" size="sm" icon="letter" block>Skriv till Sara</Button>}
        </div>
      </div>
    </aside>
  );
}

/* ---------- Coming soon screen (default for nav targets we haven't built) ---------- */
function ComingSoon({ routeKey }) {
  const coachInfo = (typeof window !== 'undefined' && COACH_NAV_INDEX && COACH_NAV_INDEX[routeKey]) || null;
  const info = coachInfo || NAV_INDEX[routeKey] || { label: routeKey, group: 'plan', groupLabel: 'Plan' };
  const spec = (coachInfo && COACH_TOOL_SPECS[routeKey]) || TOOL_SPECS[routeKey] || {
    phase: info.groupLabel,
    problem: coachInfo ? 'Coach workflow' : 'Connected support',
    title: info.label,
    sv: info.label,
    why: coachInfo
      ? 'This coach section is part of the shared operating system: case record, meeting support, knowledge hub and outcome learning should stay connected.'
      : 'This section belongs to the connected support layer. It should use the person’s case, current task, coach-approved knowledge and next action instead of becoming a standalone page.',
    does: coachInfo
      ? ['Keeps coach work connected to the case', 'Surfaces relevant knowledge and next steps', 'Feeds learning back into the organisation']
      : ['Connects to the current jobseeker case', 'Shows the next useful action', 'Links resources, coach help and activity logging'],
    inputs: coachInfo ? ['Case record', 'Coach notes', 'Knowledge hub'] : ['Case record', 'Current task', 'Helpful Now context'],
    outputs: coachInfo ? ['Coach action', 'Updated case record', 'Reusable learning'] : ['Clear next step', 'Relevant resource', 'Logged progress'],
  };
  const isCoach = !!coachInfo;
  const SideComp = isCoach && typeof window !== 'undefined' && CoachSidebar ? CoachSidebar : Sidebar;
  const appClass = isCoach ? 'll app app--warm' : 'll app';
  const topName = isCoach ? 'Sara' : 'Amir';
  return (
    <div className={appClass} data-screen-label={info.label}>
      <SideComp active={routeKey} />
      <div className="main">
        <Topbar name={topName} />
        <div className="content content--narrow" style={{ paddingTop:14 }}>
          <div className="hero-greet">
            <div>
              <span className="cap" style={{ fontWeight:700, color:'var(--ll-blue)' }}>{info.groupLabel}</span>
              <h1 style={{ marginTop:6 }}>{info.label}</h1>
            </div>
          </div>
          <div className="card card--pad" style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:22, alignItems:'start', marginTop:14 }}>
            <Clover size={56} color="#2B6CF0" />
            <div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
                <Tag variant="tag">{spec ? spec.phase : 'Planerad modul'}</Tag>
                {spec && <Tag variant="tag--ghost">{spec.problem}</Tag>}
              </div>
              <h2 style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:24, color:'var(--ll-ink)' }}>{spec ? spec.title : 'Kommer snart'}</h2>
              <p style={{ fontSize:15, color:'var(--ll-ink-soft)', marginTop:6, lineHeight:1.6, maxWidth:'70ch' }}>
                {spec ? spec.why : (isCoach ? 'Den här coachytan är inplanerad och kopplas till samma case record, kunskapshubb och resultatmotor.' : 'Den här ytan är inplanerad och kommer att kopplas till samma case, coach och kunskapssystem.')}
              </p>

              {spec && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(190px, 1fr))', gap:12, marginTop:18 }}>
                  <div style={{ background:'var(--ll-blue-tint-2)', borderRadius:12, padding:'14px 16px' }}>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:900, color:'var(--ll-blue-deep)', marginBottom:8 }}>Gör</div>
                    <ul style={{ margin:0, paddingLeft:18, color:'var(--ll-ink-soft)', fontSize:13.5, lineHeight:1.5 }}>
                      {spec.does.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div style={{ background:'#fff', border:'1px solid var(--ll-border)', borderRadius:12, padding:'14px 16px' }}>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:900, color:'var(--ll-ink)', marginBottom:8 }}>Tar in</div>
                    <ul style={{ margin:0, paddingLeft:18, color:'var(--ll-ink-soft)', fontSize:13.5, lineHeight:1.5 }}>
                      {spec.inputs.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div style={{ background:'var(--ll-green-soft)', borderRadius:12, padding:'14px 16px' }}>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:900, color:'#1c7a48', marginBottom:8 }}>Ger tillbaka</div>
                    <ul style={{ margin:0, paddingLeft:18, color:'#1c7a48', fontSize:13.5, lineHeight:1.5 }}>
                      {spec.outputs.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              )}

              <div style={{ display:'flex', gap:10, marginTop:18, flexWrap:'wrap' }}>
                {isCoach
                  ? <a href="#coach" className="btn btn--secondary btn--sm">Tillbaka till översikt</a>
                  : <React.Fragment>
                      <a href="#home" className="btn btn--primary btn--sm"><Icon name="activity" size={16} />Tillbaka till nästa steg</a>
                      <a href="#library" className="btn btn--secondary btn--sm"><Icon name="library" size={16} />Öppna kunskapshubben</a>
                    </React.Fragment>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Topbar({ name = 'Daniel Oskarsson' }) {
  return (
    <header className="topbar">
      <div className="topbar__search">
        <Icon name="search" size={18} />
        <span>Sök verktyg, kurser eller tips…</span>
      </div>
      <div className="topbar__spacer" />
      <button className="iconbtn" aria-label="Notiser"><Icon name="bell" size={20} /><span className="dot" /></button>
      <button className="iconbtn" aria-label="Inställningar"><Icon name="settings" size={20} /></button>
      <Avatar name={name} size="md" tone="av-c1" />
    </header>
  );
}

/* ---------- Coach card (always present) ---------- */
function CoachCard({ compact = false, message }) {
  return (
    <div className="coach">
      <div className="coach__head">
        <Avatar name="Sara Lind" size="lg" tone="av-c3" clover />
        <div className="coach__who">
          <div className="coach__name">Sara Lind <Clover size={15} color="#2FA56A" /></div>
          <div className="coach__role">Din karriärcoach</div>
        </div>
        <span className="coach__status" style={{ marginLeft:'auto' }}><span className="dot" />Online</span>
      </div>
      <div className="coach__bubble">
        <div className="from">Sara</div>
        {message || 'Hej Amir! Vad fint att du är här idag. Vi tar ett litet steg i taget – ska vi öva inför fredagens intervju tillsammans?'}
      </div>
      <div className="coach__actions">
        <Button variant="primary" size="sm" icon="letter">Svara</Button>
        <Button variant="secondary" size="sm" icon="calendar">Boka samtal</Button>
      </div>
    </div>
  );
}

/* ---------- Milestone journey ---------- */
const MILES = [
  { lbl:'Kom igång', sub:'Klart', icon:'check', state:'done' },
  { lbl:'Profil & CV', sub:'Klart', icon:'check', state:'done' },
  { lbl:'Ansökningar', sub:'Pågår', icon:'briefcase', state:'now' },
  { lbl:'Intervju', sub:'Snart', icon:'mic', state:'todo' },
  { lbl:'Nytt jobb', sub:'Målet', icon:'target', state:'todo' },
];
function MilestonePath({ fill = 52 }) {
  return (
    <div className="card journey">
      <div className="between">
        <div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:19, fontWeight:800 }}>Din resa framåt</h2>
          <p className="cap" style={{ marginTop:3 }}>Du är på god väg – steg för steg.</p>
        </div>
        <Tag variant="tag--green" dot>52% av vägen</Tag>
      </div>
      <div className="journey__track">
        <div className="journey__line" />
        <div className="journey__fill" style={{ width:`calc(${fill}% - 22px)` }} />
        {MILES.map((m, i) => (
          <div key={i} className={`mstone mstone--${m.state}`}>
            <div className="mstone__dot"><Icon name={m.icon} size={20} /></div>
            <div className="mstone__lbl">{m.lbl}</div>
            <div className="mstone__sub">{m.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Progress stats ---------- */
const STATS = [
  { ic:'briefcase', tint:'ic-blue',  n:'12', l:'Ansökningar skickade', d:'+3 i veckan' },
  { ic:'cv',        tint:'ic-green', n:'2',  l:'CV skapade', d:'Senast igår' },
  { ic:'mic',       tint:'ic-coral', n:'5',  l:'Intervjuer övade', d:'+2 i veckan' },
  { ic:'letter',    tint:'ic-lilac', n:'7',  l:'Personliga brev', d:'+1 idag' },
];
function Stats({ items = STATS }) {
  return (
    <div className="stats">
      {items.map((s, i) => (
        <div key={i} className="stat">
          <div className={`stat__ic ${s.tint}`}><Icon name={s.ic} size={20} /></div>
          <div className="stat__n">{s.n}</div>
          <div className="stat__l">{s.l}</div>
          {s.d && <div className="stat__d">{s.d}</div>}
        </div>
      ))}
    </div>
  );
}

/* ---------- To-do ---------- */
const TODOS = [
  { t:'Öva två intervjufrågor', m:'Bara 5 minuter – Sara har valt enkla att börja med', time:'5 min', done:false },
  { t:'Lägg till din senaste praktik i CV:t', m:'Vi har redan fyllt i det mesta åt dig', time:'3 min', done:false },
  { t:'Titta på seminariet “Lugn inför intervjun”', m:'', time:'12 min', done:false },
  { t:'Fyll i din profil', m:'', time:'', done:true },
];
function Todo({ items = TODOS, max }) {
  const list = max ? items.slice(0, max) : items;
  return (
    <div className="card card--pad">
      <div className="between" style={{ marginBottom:6 }}>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800 }}>Att göra idag</h2>
        <Tag variant="tag--coral">3 mjuka steg</Tag>
      </div>
      <div className="todo">
        {list.map((t, i) => (
          <div key={i} className={`todo__item ${t.done ? 'todo__item--done' : ''}`}>
            <span className={`todo__check ${t.done ? 'todo__check--done' : ''}`}>{t.done && <Icon name="check" size={16} sw={3} />}</span>
            <div className="todo__body">
              <div className="todo__t">{t.t}</div>
              {t.m && <div className="todo__m">{t.m}</div>}
            </div>
            {t.time && <span className="todo__time">{t.time}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Tool tiles ---------- */
const TOOLS = [
  { id:'cv', ic:'cv', tint:'ic-blue', t:'CV-byggaren', m:'Bygg ditt CV genom att svara på enkla frågor.' },
  { id:'letter', ic:'letter', tint:'ic-lilac', t:'Personligt brev', m:'Vänd en oro till en styrka i ett färdigt brev.' },
  { id:'interview', ic:'mic', tint:'ic-coral', t:'Intervjuträning', m:'Öva högt i ett tryggt, privat rum.' },
  { id:'activity', ic:'activity', tint:'ic-green', t:'Min aktivitet', m:'Din rapport skriver sig själv.' },
  { id:'library', ic:'library', tint:'ic-amber', t:'Bibliotek', m:'Gratis mallar, tips och exempel.' },
  { id:'studio', ic:'image', tint:'ic-lilac', t:'Bildstudio', m:'Skapa en fin profilbild på en minut.' },
];
function ToolGrid({ items = TOOLS, cols = 3 }) {
  const site = typeof window !== 'undefined' && true;
  return (
    <div className="tools" style={{ gridTemplateColumns:`repeat(${cols},1fr)` }}>
      {items.map(t => {
        const inner = (<React.Fragment>
          <div className={`tool__ic ${t.tint}`}><Icon name={t.ic} size={24} /></div>
          <div className="tool__t">{t.t}</div>
          <div className="tool__m">{t.m}</div>
          <span className="tool__go">Öppna<Icon name="arrow" size={15} /></span>
        </React.Fragment>);
        return site
          ? <a key={t.id} href={`#${t.id}`} className="tool">{inner}</a>
          : <button key={t.id} className="tool">{inner}</button>;
      })}
    </div>
  );
}

/* ---------- Course / seminar feed ---------- */
const FEED = [
  { tone:'ph--sky', tag:'Seminarium', when:'Tis 14:00 · Online', t:'Lugn inför intervjun', m:'Enkla andningsknep och vad du kan säga när du blir nervös.', who:'Sara Lind', mins:'30 min' },
  { tone:'ph--coral', tag:'Kurs', when:'I din takt', t:'Skriv ett CV som syns', m:'Korta lektioner – titta när du orkar, pausa när du vill.', who:'HelloLilly', mins:'4 delar' },
  { tone:'ph--green', tag:'Workshop', when:'Tor 10:00 · Göteborg', t:'Hitta dolda jobb', m:'Så når du arbetsgivare innan jobbet ens annonseras.', who:'Marcus Tylén', mins:'45 min' },
];
function CourseFeed({ items = FEED }) {
  return (
    <div className="feed">
      {items.map((f, i) => (
        <article key={i} className="fcard">
          <Photo tone={f.tone} label={f.tag} clover person />
          <div className="fcard__body">
            <div className="fcard__meta"><Icon name="calendar" size={14} />{f.when}</div>
            <div className="fcard__t">{f.t}</div>
            <p className="fcard__m">{f.m}</p>
            <div className="fcard__foot">
              <Avatar name={f.who} size="xs" tone="av-c3" />
              {f.who}<span style={{ marginLeft:'auto' }}><Tag variant="tag--ghost">{f.mins}</Tag></span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export { Sidebar, ComingSoon, Topbar, CoachCard, MilestonePath, Stats, Todo, ToolGrid, CourseFeed, NAV_GROUPS, NAV_INDEX, MILES };
