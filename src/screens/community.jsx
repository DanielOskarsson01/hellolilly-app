import React from 'react';
import { Icon, Clover, Avatar, AvatarStack, Photo, Tag, Chip, Button, SectionHeader } from '../components/primitives.jsx';
import { Sidebar, Topbar } from '../components/shell.jsx';

// HelloLilly — Community (Tillsammans), rebuilt
// 2-col layout: active feed (left) + compact rail (right). Search w/ categorized dropdown.

const SEARCH_RESULTS = {
  Coacher: [
    { ic:'av-c3', t:'Sara Lind',     m:'Karriärcoach · 124 svar · 5★', role:'Coach' },
    { ic:'av-c1', t:'Marcus Tylén',  m:'Intervjucoach · 88 svar · 5★', role:'Coach' },
    { ic:'av-c4', t:'Amira Khan',    m:'CV-specialist · 56 svar · 5★', role:'Coach' },
  ],
  Deltagare: [
    { ic:'av-c2', t:'Linnea Berg',   m:'Vård & omsorg · Hjälpare (980 p)', role:'Deltagare' },
    { ic:'av-c1', t:'Omar Ali',      m:'Lager & logistik · Vänlig (540 p)', role:'Deltagare' },
  ],
  'Frågor & diskussioner': [
    { ic:'ic-coral', t:'Hur lugnar ni nerverna innan intervjun?', m:'4 svar · för 12 min · Linnea', role:'Fråga' },
    { ic:'ic-lilac', t:'Bästa sättet att förklara ett glapp i CV:t?', m:'12 svar · för 1 tim · Omar', role:'Fråga' },
  ],
  Tips: [
    { ic:'ic-amber', t:'5 lugna svar på svåra frågor', m:'Sparat 613 ggr · Amira K.', role:'Tips' },
    { ic:'ic-green', t:'Kom igång de tunga dagarna', m:'Sparat 980 ggr · Johan P.', role:'Tips' },
  ],
  Verktyg: [
    { ic:'ic-blue',  t:'CV-byggaren',     m:'Bygg ditt CV genom korta frågor', role:'Verktyg' },
    { ic:'ic-coral', t:'Intervjuträning', m:'Öva högt i privat rum', role:'Verktyg' },
  ],
  Länkar: [
    { ic:'ic-blue',  t:'Arbetsförmedlingen – Rusta och matcha', m:'arbetsformedlingen.se', role:'Länk' },
    { ic:'ic-green', t:'Truckkort B – kostnadsfri kurs', m:'hellolilly.se/kurser', role:'Länk' },
  ],
};

function CmSearch() {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  React.useEffect(() => {
    const onClick = (e) => { if (!e.target.closest('.cm-search')) setOpen(false); };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
  return (
    <div className={`cm-search ${open?'cm-search--open':''}`}>
      <div className="cm-search__bar" onClick={() => setOpen(true)}>
        <Icon name="search" size={20} style={{ color:'var(--ll-blue)' }} />
        <input
          placeholder="Sök coacher, deltagare, frågor, tips, verktyg, länkar…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          aria-label="Sök i community"
        />
        <span className="cm-search__hot"><kbd>⌘</kbd> + <kbd>K</kbd></span>
        {q && <button className="iconbtn" style={{ width:34, height:34 }} onClick={(e) => { e.stopPropagation(); setQ(''); }} aria-label="Rensa"><Icon name="plus" size={14} style={{ transform:'rotate(45deg)' }} /></button>}
      </div>
      {open && (
        <div className="cm-drop" role="listbox">
          {Object.entries(SEARCH_RESULTS).map(([cat, items], gi) => (
            <React.Fragment key={cat}>
              <div className="cm-drop__cat">{cat}</div>
              {items.map((r, i) => {
                const isPerson = r.ic.startsWith('av-');
                return (
                  <div key={i} className={`cm-drop__row ${gi===0 && i===0 ? 'is-active' : ''}`}>
                    {isPerson
                      ? <Avatar name={r.t} size="sm" tone={r.ic} clover={r.role==='Coach'} />
                      : <div className={`cm-drop__ic ${r.ic}`}><Icon name={cat==='Tips'?'bulb':cat==='Verktyg'?'briefcase':cat==='Länkar'?'globe':'letter'} size={16} /></div>}
                    <div style={{ minWidth:0 }}>
                      <div className="cm-drop__t">{r.t}</div>
                      <div className="cm-drop__m">{r.m}</div>
                    </div>
                    <span className="cm-drop__role">{r.role}</span>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

const FEED = [
  { kind:'question', who:'Linnea Berg', av:'av-c2', role:'part', when:'för 8 min', type:'Fråga', typeCls:'phase-feedback',
    t:'Hur lugnar ni nerverna precis innan intervjun?',
    body:'Imorgon har jag min första intervju på 3 år. Tipsa gärna om vad som hjälpt er konkret i de sista 10 minuterna innan!',
    tags:[['Intervju','tag--coral'],['Stöd','tag--amber']], ans:4, hot:true },

  { kind:'tip', who:'Sara Lind', av:'av-c3', role:'coach', when:'för 25 min', type:'Coach-tips', typeCls:'phase-kartlaggning',
    t:'Veckans lugna knep: andas 4-7-8 innan du säger något.',
    body:'Andas in 4 sek, håll 7 sek, andas ut 8 sek. Gör det tre gånger innan ett samtal eller intervju. Sänker pulsen och röster blir stadigare. Funkar för mig varje gång.',
    tags:[['Andas','tag--green'],['Intervju','tag--coral']], reacts:42 },

  { kind:'poll', who:'Marcus Tylén', av:'av-c1', role:'coach', when:'för 1 tim', type:'Omröstning', typeCls:'phase-strategi',
    t:'Vad hjälper dig mest innan en intervju?',
    options:[
      { l:'Öva högt med någon', v:48 },
      { l:'Lyssna på lugn musik', v:21 },
      { l:'Läsa om företaget en sista gång', v:18 },
      { l:'En kort promenad', v:13 },
    ], votes:127 },

  { kind:'request', who:'Eva Stenberg', av:'av-c4', role:'part', when:'för 2 tim', type:'Vill ha hjälp', typeCls:'phase-output',
    t:'Söker någon som bytt från handel till vård – hur sålde du in din erfarenhet?',
    body:'10 år i butik bakom mig och vill jobba med människor på riktigt. Allt tips uppskattas – CV, brev, intervju, allt.',
    tags:[['Bransch','tag--lilac'],['Vård','tag--green']], bounty:40, ans:2 },

  { kind:'tip', who:'Omar Ali', av:'av-c1', role:'part', when:'igår', type:'Tips från deltagare', typeCls:'phase-output',
    t:'Det här hjälpte mig faktiskt få jobbet.',
    body:'I slutet av intervjun frågade jag: "Vad skulle den första veckan se ut för mig om jag fick jobbet?" — De började prata som om jag redan jobbade där. Fick erbjudandet två dagar senare.',
    tags:[['Intervju','tag--coral'],['Modigt','tag--amber']], reacts:88 },

  { kind:'post', who:'HelloLilly', av:'av-c1', role:'coach', when:'igår', type:'Från teamet', typeCls:'phase-justering',
    t:'Nytt: Truckkort B-kurs i Västerås, helt gratis för deltagare',
    body:'Vi har precis öppnat anmälan till en 4-dagars truckkort B-kurs i juni. Begränsat antal platser – först till kvarn. Skriv till din coach om du vill ha en plats.',
    tags:[['Nyhet','tag'],['Logistik','tag--green']], reacts:23 },

  { kind:'question', who:'Johan Pettersson', av:'av-c5', role:'part', when:'igår', type:'Fråga', typeCls:'phase-feedback',
    t:'Vågar man säga "jag har ADHD" på intervjun?',
    body:'Funderar fram och tillbaka. Vissa säger det är en styrka, andra varnar för fördomar. Hur har ni gjort?',
    tags:[['Öppenhet','tag--lilac']], ans:9, bounty:30 },

  { kind:'poll', who:'Amira Khan', av:'av-c4', role:'coach', when:'2 dgr sedan', type:'Snabb fråga',  typeCls:'phase-strategi',
    t:'Skulle ni vilja ha en peer-mentor-funktion?',
    options:[
      { l:'Ja, gärna!', v:72 },
      { l:'Kanske – behöver veta mer', v:21 },
      { l:'Nej, klarar det själv', v:7 },
    ], votes:204 },
];

const MINI_TOP = [
  { nm:'Sara Lind',    pt:1240 },
  { nm:'Linnea Berg',  pt:980 },
  { nm:'Marcus Tylén', pt:870 },
  { nm:'Omar Ali',     pt:540 },
  { nm:'Du (Amir)',    pt:245, me:true },
];

const WINS2 = [
  { nm:'Linnea S.', co:'→ ICA Maxi · butiksbiträde', tone:'av-c2', q:'Tack vare Amir och Sara vågade jag ringa själv. Jobbet var mitt efter en vecka!', thx:'Tackade: Amir, Sara' },
  { nm:'Omar A.',   co:'→ DHL · truckförare',         tone:'av-c1', q:'Marcus hjälpte mig formulera ett brev som faktiskt kändes som jag. Det öppnade dörren.', thx:'Tackade: Marcus, Eva' },
  { nm:'Sara K.',   co:'→ Coop · lagerassistent',     tone:'av-c4', q:'En kort intervjuövning med Linnea gav mig modet att svara stadigt.', thx:'Tackade: Linnea' },
];

function FeedCard({ c }) {
  const RoleBadge = () => c.role === 'coach'
    ? <span className="role-coach">COACH</span>
    : <span className="role-part">DELTAGARE</span>;

  return (
    <article className="fcard2">
      <header className="fcard2__hd">
        <Avatar name={c.who} size="sm" tone={c.av} clover={c.role==='coach'} />
        <div className="fcard2__who">
          <div className="fcard2__nm">{c.who}</div>
          <div className="fcard2__meta"><RoleBadge />{c.when}{c.hot && <span style={{ color:'var(--ll-coral)', fontWeight:800 }}> · 🔥 Hett</span>}</div>
        </div>
        <span className={`fcard2__type ${c.typeCls}`}>{c.type}</span>
      </header>

      <h3 className="fcard2__t">{c.t}</h3>

      {c.kind === 'poll' ? (
        <div className="poll">
          {c.options.map((o, i) => (
            <div className="poll__row" key={i}>
              <div className="poll__fill" style={{ width:`${(o.v/c.votes)*100}%` }} />
              {o.l}<span className="pct">{Math.round((o.v/c.votes)*100)}%</span>
            </div>
          ))}
          <div className="poll__meta">{c.votes} röster · pågår 2 dagar till</div>
        </div>
      ) : c.kind === 'tip' && c.who !== 'Sara Lind' ? (
        <div className="tip-quote">"{c.body}"</div>
      ) : (
        <p className="fcard2__body">{c.body}</p>
      )}

      {c.tags && <div className="fcard2__tags">{c.tags.map((tg,i)=><Tag key={i} variant={tg[1]}>{tg[0]}</Tag>)}</div>}

      <div className="fcard2__foot">
        {c.kind === 'question' || c.kind === 'request' ? (
          <React.Fragment>
            <span className="fcard2__react"><Icon name="letter" size={15} />{c.ans} svar{c.ans===0 && ' än'}</span>
            {c.bounty && <span className="q-bounty"><Icon name="sparkle" size={13} />+{c.bounty} p</span>}
          </React.Fragment>
        ) : c.kind === 'poll' ? (
          <span className="fcard2__react"><Icon name="users" size={15} />Rösta så ser du resultatet</span>
        ) : (
          <span className="fcard2__react"><Icon name="heart" size={15} />{c.reacts} håller med</span>
        )}
        <span className="fcard2__cta">
          {c.kind === 'poll'
            ? <Button variant="primary" size="sm" icon="check">Rösta</Button>
            : c.kind === 'tip' || c.kind === 'post'
              ? <Button variant="secondary" size="sm" icon="heart">Tacka</Button>
              : <Button variant="primary" size="sm" icon="letter">Svara</Button>}
        </span>
      </div>
    </article>
  );
}

function Community() {
  return (
    <div className="ll app app--lively" data-screen-label="Community">
      <Sidebar active="community" />
      <div className="main">
        <Topbar />
        <div className="content content--narrow" style={{ paddingTop:14 }}>

          <div className="hero-greet" style={{ marginBottom:14 }}>
            <div>
              <h1>Tillsammans i Lilly <span className="wave">💛</span></h1>
              <p className="muted" style={{ fontSize:15.5, marginTop:6 }}>Coacher och deltagare hjälps åt. Ställ en fråga, dela ett tips eller heja på någon.</p>
            </div>
            <span className="date">Vecka 24 · juni 2026</span>
          </div>

          {/* search */}
          <CmSearch />

          {/* filter tabs */}
          <div className="cm-tabs">
            <Chip on icon="users">Alla</Chip>
            <Chip icon="letter">Frågor</Chip>
            <Chip icon="bulb">Tips</Chip>
            <Chip icon="target">Omröstningar</Chip>
            <Chip icon="heart">Coachposter</Chip>
            <Chip icon="briefcase">Söker hjälp</Chip>
            <span style={{ marginLeft:'auto' }}><Button variant="primary" size="sm" icon="plus">Ställ en fråga</Button></span>
          </div>

          {/* main 2-col */}
          <div className="cm-grid">
            {/* feed */}
            <div>
              <div className="cm-compose">
                <Avatar name="Amir Hassan" size="sm" tone="av-c1" />
                <input placeholder="Dela ett tips, ge ett varmt råd, ställ en fråga…" aria-label="Skapa inlägg" />
                <button className="cm-compose__icbtn" aria-label="Skapa omröstning"><Icon name="target" size={17} /></button>
                <Button variant="primary" size="sm" icon="send">Dela</Button>
              </div>

              <div className="cm-feed">
                {FEED.map((c,i) => <FeedCard key={i} c={c} />)}
              </div>
            </div>

            {/* right rail */}
            <aside className="cm-rail">
              <div className="cm-mini-lvl">
                <div className="cm-mini-lvl__hd">
                  <Clover size={22} color="#FF7A59" />
                  <div>
                    <div className="cm-mini-lvl__lvl">Du är Hjälpare 🤝</div>
                    <div className="cm-mini-lvl__sub">55 p till Mentor</div>
                  </div>
                </div>
                <div className="cm-mini-lvl__bar"><span style={{ width:'82%' }} /></div>
                <div className="cm-mini-lvl__row"><span>245 p</span><b>+15 p denna vecka</b></div>
              </div>

              <div className="cm-mini-top">
                <h4><Icon name="star" size={14} style={{ color:'var(--ll-amber)' }} />Topp i veckan<a className="ml" href="#">Hela</a></h4>
                {MINI_TOP.map((p,i) => (
                  <div className={`mt-row ${p.me?'is-me':''}`} key={i}>
                    <span className="rk">{i+1}</span>
                    <span className="nm">{p.nm}</span>
                    <span className="pt">{p.pt} p</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          {/* wins at the very bottom */}
          <section style={{ marginTop:32 }}>
            <SectionHeader title="Veckans hjältar 🎉" sub="Nya jobb tack vare ett team som hejade på" seeAll={null} />
            <div className="wins">
              {WINS2.map((w,i) => (
                <article className="win" key={i}>
                  <div className="win__hd">
                    <Avatar name={w.nm} size="md" tone={w.tone} clover />
                    <div><div className="win__nm">{w.nm}</div><div className="win__co">{w.co}</div></div>
                  </div>
                  <p className="win__quote">"{w.q}"</p>
                  <div className="win__thx"><Icon name="heart" size={14} />{w.thx}</div>
                </article>
              ))}
            </div>
          </section>

          {/* tiny points line at the bottom */}
          <div className="cm-points-tiny">
            <span><b>+5p</b>svar</span>
            <span><b>+10p</b>👍 på ditt svar</span>
            <span><b>+15p</b>dela mall</span>
            <span><b>+50p</b>någon fick jobb</span>
            <span><b>+20p</b>7 dagar i rad</span>
          </div>

        </div>
      </div>
    </div>
  );
}

export { Community, CmSearch, FeedCard };
