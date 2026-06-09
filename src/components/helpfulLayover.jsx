import React from 'react';
import { Icon, Clover, Photo, Avatar, Button, Tag, SectionHeader } from './primitives.jsx';
import { acceptJob, getAcceptedJobs, jobKey, removeJob } from '../utils/jobStore.js';

// HelloLilly — Helpful Now layover
// Opens when a Helpful Now item is clicked (custom event `ll:helpful:open`).
// One fully-detailed example (the "Skriv ett CV som tål en lucka" video) shows
// the eventual pattern: media + author + body + comments + deep links to tools.
// Other items fall back to a small placeholder ("content kommer snart").

const RICH_CONTENT = {
  'cv-gap-video': {
    kind: 'Video',
    title: 'Skriv ett CV som tål en lucka',
    duration: '4:12',
    coach: { name: 'Sara Lind', role: 'Karriärcoach · HelloLilly', tone: 'av-c3' },
    eyebrow: 'Video från din coach',
    summary:
      'Ett glapp i CV:t är inget fel — det är ett kapitel som behöver rätt ram. Sara visar tre enkla sätt att skriva om luckan så att den känns trygg för dig och tydlig för rekryteraren.',
    learn: [
      'Hur du nämner ett glapp utan att be om ursäkt',
      'Tre fraser som vänder oro till styrka',
      'Vad du faktiskt gjorde under tiden — och varför det räknas',
    ],
    deeplinks: [
      { ic:'cv',     tint:'ic-blue',  href:'#cv',      t:'Öppna CV-byggaren',     m:'Använd fraserna direkt i ditt CV' },
      { ic:'letter', tint:'ic-lilac', href:'#letter',  t:'Skriv personligt brev', m:'Vänd luckan till en styrka i brevet' },
      { ic:'users',  tint:'ic-green', href:'#review',  t:'Be Sara granska',       m:'Hon svarar oftast samma dag' },
      { ic:'library',tint:'ic-amber', href:'#library', t:'Mallar och exempel',    m:'Färdiga formuleringar att kopiera' },
    ],
    templates: [
      { t:'Formulering: studier på egen hand', m:'En mening som funkar nästan alltid' },
      { t:'Formulering: hand om familj eller hälsa', m:'Varmt och tydligt – utan detaljer' },
      { t:'Formulering: tid mellan jobb', m:'Visar vad du faktiskt tog med dig' },
    ],
    comments: [
      { who:'Linnea', tone:'av-c2', when:'2 dgr sedan', text:'Den här gjorde mig så mycket lugnare. Jag testade fras nr 2 i går och fick napp i morse 💙' },
      { who:'Omar',   tone:'av-c1', when:'1 vecka sedan', text:'Bra påminnelse om att skriva vad jag GJORDE under glappet, inte bara att det fanns. Tack Sara!' },
      { who:'Eva',    tone:'av-c4', when:'2 veckor sedan', text:'Kan ni göra en motsvarande för någon som har två kortare luckor? Mitt CV ser lite hackigt ut.' },
    ],
    related: [
      { kind:'Mall',       title:'Erfarenhetssektion till CV',     why:'Strukturen Sara använder' },
      { kind:'Diskussion', title:'Förklara en lucka i CV:t',       why:'12 jobbsökare delar tips' },
      { kind:'Video',      title:'Så läser en rekryterare ett CV', why:'Vad de tittar på först' },
    ],
  },
};

function HelpfulLayoverContent({ item }) {
  if (item && item.kind === 'job') return <JobDescriptionContent job={item} />;
  if (item && item.kind === 'job-analysis') return <JobAnalysisContent job={item.job || item} />;

  const rich = item && item.id && RICH_CONTENT[item.id];
  if (!rich) {
    // Stub view for items we haven't authored full content for yet.
    return (
      <div className="lay__stub">
        <Clover size={42} color="#2B6CF0" />
        <h2>{item ? item.title : ''}</h2>
        <p>{item && item.why}</p>
        <p className="cap" style={{ marginTop:14 }}>Det här innehållet är på väg. Kom snart tillbaka — eller säg till Sara om du vill att vi prioriterar det.</p>
        <Button variant="secondary" icon="letter">Skriv till Sara</Button>
      </div>
    );
  }

  return (
    <React.Fragment>
      {/* Hero: video player placeholder */}
      <div className="lay__media">
        <Photo tone="ph--sky" clover person label={null} />
        <span className="lay__media-len">{rich.duration}</span>
        <div className="lay__media-play"><span><Icon name="play" size={26} /></span></div>
      </div>

      <div className="lay__body">

        <span className="helpitem__kind helpitem__kind--video" style={{ alignSelf:'flex-start' }}>{rich.eyebrow || rich.kind}</span>
        <h1 className="lay__title">{rich.title}</h1>

        {/* Coach byline */}
        <div className="lay__byline">
          <Avatar name={rich.coach.name} size="sm" tone={rich.coach.tone} clover />
          <div>
            <div className="lay__byline-nm">{rich.coach.name}</div>
            <div className="lay__byline-rl">{rich.coach.role}</div>
          </div>
          <span className="coach__status" style={{ marginLeft:'auto' }}><span className="dot" />Online</span>
        </div>

        {/* Summary */}
        <p className="lay__summary">{rich.summary}</p>

        {/* What you'll learn */}
        <div className="lay__learn">
          <div className="lay__learn-h">Du tar med dig</div>
          {rich.learn.map((l, i) => (
            <div className="lay__learn-li" key={i}><Icon name="check" size={16} sw={2.6} />{l}</div>
          ))}
        </div>

        {/* Deep links to tools */}
        <SectionHeader title="Använd det här direkt" sub="Hopp till verktyget eller mallen" />
        <div className="lay__deeps">
          {rich.deeplinks.map((d, i) => (
            <a key={i} href={d.href} className="lay__deep" onClick={() => window.dispatchEvent(new CustomEvent('ll:helpful:close'))}>
              <div className={`lay__deep-ic ${d.tint}`}><Icon name={d.ic} size={20} /></div>
              <div className="lay__deep-b">
                <div className="lay__deep-t">{d.t}</div>
                <div className="lay__deep-m">{d.m}</div>
              </div>
              <Icon name="arrow" size={16} className="lay__deep-go" />
            </a>
          ))}
        </div>

        {/* Templates */}
        <SectionHeader title="Färdiga formuleringar" sub="Tre korta meningar du kan kopiera" />
        <div className="lay__tpls">
          {rich.templates.map((t, i) => (
            <div key={i} className="lay__tpl">
              <div className="lay__tpl-ic"><Icon name="doc" size={18} /></div>
              <div className="lay__tpl-b">
                <div className="lay__tpl-t">{t.t}</div>
                <div className="lay__tpl-m">{t.m}</div>
              </div>
              <button className="lay__tpl-go">Kopiera</button>
            </div>
          ))}
        </div>

        {/* Comments */}
        <SectionHeader title="Vad andra säger" sub={`${rich.comments.length} kommentarer`} />
        <div className="lay__comments">
          {rich.comments.map((c, i) => (
            <div key={i} className="lay__comment">
              <Avatar name={c.who} size="sm" tone={c.tone} />
              <div className="lay__comment-b">
                <div className="lay__comment-h">
                  <strong>{c.who}</strong>
                  <span className="cap">{c.when}</span>
                </div>
                <p>{c.text}</p>
              </div>
            </div>
          ))}
          <div className="lay__composer">
            <Avatar name="Amir" size="sm" tone="av-c1" />
            <input type="text" placeholder="Skriv något snällt eller fråga om något…" />
            <button className="lay__composer-send" aria-label="Skicka"><Icon name="send" size={17} /></button>
          </div>
        </div>

        {/* Related items */}
        <SectionHeader title="Relaterat" sub="Mer som hör ihop med det här" />
        <div className="lay__related">
          {rich.related.map((r, i) => {
            const kindClass = r.kind.toLowerCase().replace('ö','o');
            return (
              <button key={i} className="helpitem">
                <span className={`helpitem__kind helpitem__kind--${kindClass}`}>{r.kind}</span>
                <div className="helpitem__title">{r.title}</div>
                {r.why && <div className="helpitem__why">{r.why}</div>}
              </button>
            );
          })}
        </div>

      </div>
    </React.Fragment>
  );
}

function HelpfulLayover() {
  const [item, setItem] = React.useState(null);
  const open = item !== null;

  React.useEffect(() => {
    const onOpen  = (e) => setItem(e.detail);
    const onClose = () => setItem(null);
    const onKey   = (e) => { if (e.key === 'Escape') setItem(null); };
    const onHash  = () => setItem(null);
    window.addEventListener('ll:helpful:open', onOpen);
    window.addEventListener('ll:helpful:close', onClose);
    window.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', onHash);
    return () => {
      window.removeEventListener('ll:helpful:open', onOpen);
      window.removeEventListener('ll:helpful:close', onClose);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('hashchange', onHash);
    };
  }, []);

  // Body scroll lock while open
  React.useEffect(() => {
    if (open) document.body.classList.add('lay-open');
    else document.body.classList.remove('lay-open');
  }, [open]);

  return (
    <React.Fragment>
      <div className={`lay-scrim ${open ? 'lay-scrim--open' : ''}`} onClick={() => setItem(null)} aria-hidden={!open} />
      <div className={`lay ${open ? 'lay--open' : ''}`} role="dialog" aria-modal="true" aria-hidden={!open}>
        <button className="lay__close" onClick={() => setItem(null)} aria-label="Stäng">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
        <div className="lay__scroll">
          {open && <HelpfulLayoverContent item={item} />}
        </div>
      </div>
    </React.Fragment>
  );
}

/* ============================================================
   Job description + match-analysis content
   Jobbsök opens a plain job description. Matchanalys opens the
   analysis flow for an accepted job.
   ============================================================ */

function JobDescriptionContent({ job }) {
  const [accepted, setAccepted] = React.useState(() => getAcceptedJobs().some((item) => jobKey(item) === jobKey(job)));

  const onApply = () => {
    acceptJob(job);
    setAccepted(true);
  };

  const onRemove = () => {
    removeJob(job);
    window.dispatchEvent(new CustomEvent('ll:helpful:close'));
  };

  return (
    <React.Fragment>
      <div className="jobdesc__head">
        <div className="jobdesc__logo" style={{ background: job.logo || '#2B6CF0' }}>{(job.co || 'JO').slice(0, 2).toUpperCase()}</div>
        <div>
          <span className="helpitem__kind">Jobbannons</span>
          <h1 className="jobdesc__title">{job.t}</h1>
          <div className="jobdesc__meta">{job.co} · {job.city} · {job.type}{job.when ? ` · ${job.when}` : ''}</div>
        </div>
      </div>

      <div className="jobdesc__actions">
        <Button variant="ghost" size="sm" icon="plus" onClick={onRemove}>Ta bort</Button>
        <Button variant="primary" size="sm" icon="check" onClick={onApply}>{accepted ? 'Sparad till Matchanalys' : 'Ansök'}</Button>
      </div>

      {Array.isArray(job.tags) && job.tags.length > 0 && (
        <div className="jobdesc__tags">
          {job.tags.map((tag) => <Tag key={tag} variant="tag--ghost">{tag}</Tag>)}
        </div>
      )}

      <div className="jobdesc__body">
        <h2>Jobbeskrivning</h2>
        <p>{job.snippet || 'Ingen beskrivning fanns i sökresultatet. Öppna originalannonsen för full text.'}</p>
      </div>

      <div className="jobdesc__note">
        <Icon name="doc" size={18} />
        <span>Den här vyn visar bara annonsens text. För analys: lägg jobbet som ansökan och öppna det från Matchanalys.</span>
      </div>

      {job.url && (
        <a className="jobdesc__external" href={job.url} target="_blank" rel="noreferrer">
          Öppna originalannons <Icon name="arrow" size={16} />
        </a>
      )}
    </React.Fragment>
  );
}

const ANALYSIS_STEPS = [
  'Hämtar annonsen',
  'Läser krav och signalord',
  'Jämför mot CV-sektionerna',
  'Bygger konkreta nästa steg',
];

function JobAnalysisContent({ job }) {
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    const timers = ANALYSIS_STEPS.map((_, index) => window.setTimeout(() => setStep(index + 1), 520 + index * 520));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [job]);

  if (step < ANALYSIS_STEPS.length) {
    return (
      <div className="lay-analysis-loading">
        <Clover size={44} color="#2B6CF0" />
        <span className="helpitem__kind">Matchanalys</span>
        <h1>{job.t}</h1>
        <p>Lilly startar analysflödet för den sparade annonsen och jämför den mot CV-byggarens innehåll.</p>
        <div className="analysis-steps">
          {ANALYSIS_STEPS.map((label, index) => (
            <div key={label} className={`analysis-step ${index < step ? 'is-done' : index === step ? 'is-now' : ''}`}>
              <span>{index < step ? <Icon name="check" size={14} sw={3} /> : index + 1}</span>
              <b>{label}</b>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <MatchAnalysisContent job={job} />;
}

const MATCH_DETAILS = {
  matches: [
    { t:'Truckkort A1',                 m:'Du tog det under praktik på PostNord.', sc:'Från ditt CV · Erfarenhet' },
    { t:'Lagererfarenhet, 6+ månader',  m:'Din praktik räcker som meriterande erfarenhet.', sc:'Från ditt CV · Praktik' },
    { t:'Skiftarbete',                  m:'Du jobbade tvåskift hos PostNord.', sc:'Från ditt CV' },
    { t:'Svenska, flytande',            m:'Anges i ditt CV under språk.', sc:'Från ditt CV · Språk' },
  ],
  gaps: [
    { t:'Truckkort B',            m:'Tjänsten önskar B-behörighet utöver A1.',
      sug:'HelloLilly har en kort kurs (4 dgr). Lägg in i kalender?', cta:'Visa kursen' },
    { t:'Erfarenhet av WMS-system', m:'Jobbet nämner SAP EWM eller liknande lagersystem.',
      sug:'Beskriv handdator-arbete från praktiken — det räknas.', cta:'Lägg till i CV' },
    { t:'Referens från tidigare chef', m:'Annonsen ber om minst en referens.',
      sug:'Be Lena (din handledare på PostNord) — Sara kan hjälpa.', cta:'Skriv till Sara' },
  ],
};

function MatchAnalysisContent({ job }) {
  const score = job.match || 78;
  const R = 42, C = 2 * Math.PI * R, off = C * (1 - score / 100);
  const verdictHi = score >= 90;
  const verdictMid = score >= 75 && score < 90;
  const verdictHeadline = verdictHi
    ? 'Stark match — gå för det.'
    : verdictMid
      ? 'Bra match — med några små luckor att fylla'
      : 'Värd att överväga — några luckor att titta på';
  const verdictBody = verdictHi
    ? `Du uppfyller det viktigaste och annonsen passar din profil. Sara kan hjälpa dig skicka ansökan idag.`
    : `Du uppfyller det viktigaste — fyll luckorna nedan så hamnar du runt ${Math.min(score + 14, 96)}%.`;

  return (
    <React.Fragment>
      {/* Header band */}
      <div className="lay-match__head">
        <div className="lay-match__co">
          <div className="lay-match__logo" style={{ background:'#fff', color: job.logo || '#2B6CF0' }}>{(job.co || 'CO').slice(0,2).toUpperCase()}</div>
          <div>
            <div className="lay-match__co-nm">{job.co}</div>
            <div className="lay-match__co-meta">{job.city} · {job.type}{job.when ? ' · ' + job.when : ''}</div>
          </div>
        </div>
        <h1 className="lay-match__title">{job.t}</h1>

        <div className="lay-match__score-row">
          <div className="lay-match__ring">
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle className="bg" cx="48" cy="48" r={R} />
              <circle className="fg" cx="48" cy="48" r={R} strokeDasharray={C} strokeDashoffset={off} />
            </svg>
            <div className="lay-match__ring-n">{score}%</div>
          </div>
          <div className="lay-match__verdict">
            <b>{verdictHeadline}</b><br />
            Lilly har läst annonsen och jämfört den mot ditt CV. {verdictBody}
            <div className="lay-match__by"><Icon name="sparkle" size={13} />Granskad av Lilly · för 2 min sedan</div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="lay-match__actions">
        <Button variant="primary" size="sm" icon="check">Ansök ändå</Button>
        <Button variant="secondary" size="sm" icon="pen">Fyll luckorna först</Button>
      </div>

      {/* Det du har */}
      <div className="lay-match__sec">
        <div className="lay-match__sec-h">
          <Icon name="check" size={18} sw={2.6} style={{ color:'var(--ll-green)' }} />
          <h3>Det du har</h3>
          <span className="lay-match__pill lay-match__pill--ok">{MATCH_DETAILS.matches.length} av {MATCH_DETAILS.matches.length} krav</span>
        </div>
        {MATCH_DETAILS.matches.map((m, i) => (
          <div className="lay-match__item" key={i}>
            <div className="lay-match__item-ic lay-match__item-ic--ok"><Icon name="check" size={14} sw={3} /></div>
            <div className="lay-match__item-b">
              <div className="lay-match__item-t">{m.t}</div>
              <div className="lay-match__item-m">{m.m}</div>
              <div className="cap" style={{ marginTop:5, fontSize:11.5 }}><Icon name="doc" size={11} sw={2.4} style={{ display:'inline', verticalAlign:'-1px', marginRight:4 }} />{m.sc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Luckor */}
      <div className="lay-match__sec">
        <div className="lay-match__sec-h">
          <Icon name="bulb" size={18} style={{ color:'var(--ll-coral)' }} />
          <h3>Luckor att fylla</h3>
          <span className="lay-match__pill lay-match__pill--gap">{MATCH_DETAILS.gaps.length} förbättringar</span>
        </div>
        {MATCH_DETAILS.gaps.map((g, i) => (
          <div className="lay-match__item" key={i}>
            <div className="lay-match__item-ic lay-match__item-ic--gap"><Icon name="plus" size={13} sw={3} /></div>
            <div className="lay-match__item-b">
              <div className="lay-match__item-t">{g.t}</div>
              <div className="lay-match__item-m">{g.m}</div>
              <div className="lay-match__item-sug"><Icon name="sparkle" size={13} />{g.sug}</div>
            </div>
            <button className="lay-match__item-cta">{g.cta}</button>
          </div>
        ))}
      </div>

      {/* Deep links to tools */}
      <div className="lay-match__sec">
        <div className="lay-match__sec-h">
          <Icon name="arrow" size={18} style={{ color:'var(--ll-blue)' }} />
          <h3>Använd det här direkt</h3>
        </div>
        <div className="lay__deeps">
          <a href="#cv"      className="lay__deep" onClick={() => window.dispatchEvent(new CustomEvent('ll:helpful:close'))}>
            <div className="lay__deep-ic ic-blue"><Icon name="cv" size={20} /></div>
            <div className="lay__deep-b"><div className="lay__deep-t">Öppna CV-byggaren</div><div className="lay__deep-m">Lägg till det som saknas</div></div>
            <Icon name="arrow" size={16} className="lay__deep-go" />
          </a>
          <a href="#letter"  className="lay__deep" onClick={() => window.dispatchEvent(new CustomEvent('ll:helpful:close'))}>
            <div className="lay__deep-ic ic-lilac"><Icon name="letter" size={20} /></div>
            <div className="lay__deep-b"><div className="lay__deep-t">Skriv personligt brev</div><div className="lay__deep-m">Skräddarsy för {job.co}</div></div>
            <Icon name="arrow" size={16} className="lay__deep-go" />
          </a>
          <a href="#review"  className="lay__deep" onClick={() => window.dispatchEvent(new CustomEvent('ll:helpful:close'))}>
            <div className="lay__deep-ic ic-green"><Icon name="users" size={20} /></div>
            <div className="lay__deep-b"><div className="lay__deep-t">Be Sara granska</div><div className="lay__deep-m">15 min — hon svarar idag</div></div>
            <Icon name="arrow" size={16} className="lay__deep-go" />
          </a>
          <a href="#match"   className="lay__deep" onClick={() => window.dispatchEvent(new CustomEvent('ll:helpful:close'))}>
            <div className="lay__deep-ic ic-amber"><Icon name="target" size={20} /></div>
            <div className="lay__deep-b"><div className="lay__deep-t">Hela matchanalysen</div><div className="lay__deep-m">Med annons-genomgång</div></div>
            <Icon name="arrow" size={16} className="lay__deep-go" />
          </a>
        </div>
      </div>

      {/* Verdict */}
      <div className="lay-match__verdict-card">
        <Clover size={26} color="#fff" />
        <div className="lay-match__verdict-card-b">
          <h4>Vår känsla: {verdictHi ? 'gå för det.' : verdictMid ? 'gå för det med en liten polering.' : 'det går — men polera först.'}</h4>
          <p>{verdictBody}</p>
        </div>
      </div>
    </React.Fragment>
  );
}

export { HelpfulLayover, RICH_CONTENT, MatchAnalysisContent };
