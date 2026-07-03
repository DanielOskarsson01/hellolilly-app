import React from 'react';
import { Icon, Clover, Avatar, AvatarStack, Photo, Tag, Button, Rating, SectionHeader, DemoBar } from '../components/primitives.jsx';
import { JobResultsList } from '../components/jobResultsList.jsx';
import { Sidebar, Topbar, CoachCard, MilestonePath, Stats, Todo, ToolGrid, CourseFeed } from '../components/shell.jsx';
import {
  CASE_PROFILE,
  FOUNDATION_TOOLS,
  NEXT_ACTIONS,
  PIPELINE_RUN,
  DISCUSSIONS as STRATEGY_DISCUSSIONS,
  LEARNING_RESOURCES,
  COMMUNITY_WINS,
  OUTCOME_METRICS,
} from '../data/strategyData.js';
import { useLiveJobSearch } from '../hooks/useLiveJobSearch.js';
import { useActiveCase } from '../hooks/useCase.js';

// HelloLilly — Hem · Allt samlat (expanded "command center" home)
// Warm motivation on top, then auto job search, community pulse, improvements,
// fearless learning, and coaching outreach. Calm through clear sections.

const DISCUSSIONS = STRATEGY_DISCUSSIONS;
const VIDEOS = [
  { tone:'ph--sky', t:'Så hittar du de dolda jobben', len:'6:12' },
  { tone:'ph--coral', t:'Skriv ett CV på 20 minuter', len:'9:40' },
];
const NEWS = [
  { src:'Arbetsmarknad', h:'Logistikbranschen söker 5 000 nya medarbetare i vår', t:'idag' },
  { src:'Tips', h:'Nya regler för truckkort 2026 – så påverkas du', t:'igår' },
  { src:'Lokalt', h:'Tre nya lager öppnar i Mälardalen', t:'2 dgr sedan' },
];
const LEARN = LEARNING_RESOURCES;
const CONGRATS = COMMUNITY_WINS;

/* Small, scannable "next actions" — compact entry points to existing tools. */
const QUICK_ACTIONS = NEXT_ACTIONS;

// Derive the "where am I" read from the active case's real part statuses.
// No case -> honest zero state; otherwise the next concrete step in the loop.
function deriveCaseState(caseData) {
  if (!caseData) {
    return {
      heroLine: <>Inget aktivt ärende ännu. Börja i <b style={{ color:'var(--ll-blue-deep)' }}>Jobbsök</b>: acceptera ett jobb och kör en matchanalys, så byggs allt härifrån.</>,
      next: { href: '#jobbsok', title: 'Sök och acceptera ett jobb', body: 'Matchanalysen, CV-utkastet och brevet byggs från ett accepterat jobb.' },
      matchPct: null,
      openGaps: null,
    };
  }
  const s = (p) => caseData[p].status;
  const company = caseData.meta.company;
  const rows = s('fit') === 'ready' ? caseData.fit.data.capability.requirements : [];
  const matchPct = rows.length ? Math.round((rows.filter((r) => r.status === 'match').length / rows.length) * 100) : null;
  const fitByReq = new Map(rows.map((r) => [r.requirementRef.id, r.status]));
  const openGaps = s('gaps') === 'ready'
    ? caseData.gaps.data.filter((g) => !g.requirementRef || fitByReq.get(g.requirementRef.id) !== 'match').length
    : null;

  if (s('fit') !== 'ready') {
    return {
      heroLine: <>Ärendet för <b style={{ color:'var(--ll-blue-deep)' }}>{company}</b> är igång men inte analyserat än.</>,
      next: { href: '#match', title: `Analysera ${company}`, body: 'Kör matchanalysen så får du ärlig fit, luckor och bryggor.' },
      matchPct, openGaps,
    };
  }
  const heroLine = <>Lilly har analyserat <b style={{ color:'var(--ll-blue-deep)' }}>{company}</b>: {matchPct}% match{openGaps ? `, ${openGaps} ${openGaps === 1 ? 'lucka' : 'luckor'} kvar att fylla` : ', inga öppna luckor'}.</>;
  if (openGaps) {
    return { heroLine, next: { href: '#match', title: `Fyll ${openGaps} ${openGaps === 1 ? 'lucka' : 'luckor'} för ${company}`, body: 'Varje ärligt svar blir en datafakta och lyfter matchningen.' }, matchPct, openGaps };
  }
  if (s('cvDraft') === 'ready' && s('coverLetter') === 'ready') {
    return { heroLine, next: { href: '#cv', title: 'Granska CV-utkastet och brevet', body: 'Båda är byggda från analysen. Läs igenom innan du skickar.' }, matchPct, openGaps };
  }
  return { heroLine, next: { href: '#match', title: 'Generera CV och brev', body: 'Analysen är klar. Öppna den och låt Lilly bygga utkasten.' }, matchPct, openGaps };
}

const PART_TAG = {
  absent: { label: 'Saknas', variant: 'tag--lilac', width: '8%' },
  pending: { label: 'Byggs…', variant: 'tag', width: '50%' },
  ready: { label: 'Klart', variant: 'tag--green', width: '100%' },
  failed: { label: 'Misslyckades', variant: 'tag--coral', width: '30%' },
};

function HomeExpanded() {
  const { jobs: liveJobs, status: jobStatus, error: jobError, meta: jobMeta } = useLiveJobSearch();
  const { caseData } = useActiveCase();
  const derived = deriveCaseState(caseData);
  const cvTag = PART_TAG[caseData ? caseData.cvDraft.status : 'absent'];
  const letterTag = PART_TAG[caseData ? caseData.coverLetter.status : 'absent'];
  const todayLabel = new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="ll app app--lively" data-screen-label="Hem · Allt samlat">
      <Sidebar active="home" />
      <div className="main">
        <Topbar />
        <div className="content content--narrow home2" style={{ paddingTop:14 }}>

          {/* ---------- WARM HERO ---------- */}
          <section>
            <div className="hero-greet">
              <div>
                <h1>Heja Daniel! <span className="wave">👋</span></h1>
                <p className="muted" style={{ fontSize:15.5, marginTop:6 }}>Skönt att se dig. {derived.heroLine}</p>
              </div>
              <span className="date" style={{ textTransform:'capitalize' }}>{todayLabel}</span>
            </div>
            <div className="grid herorow">
              <div className="nudge nudge--coral">
                <span className="nudge__eyebrow"><Icon name="sparkle" size={15} />Ditt nästa steg</span>
                <h2>{derived.next.title}</h2>
                <p>{derived.next.body}</p>
                <div className="nudge__actions">
                  <a className="btn btn--primary" href={derived.next.href}><Icon name="play" size={18} />Gör det nu</a>
                </div>
                <Clover className="nudge__art" color="rgba(255,255,255,.18)" size={220} />
              </div>
              <CoachCard message={caseData
                ? `Daniel, ärendet för ${caseData.meta.company} ligger i Matchanalys. Ta nästa steg när det passar — det är ett litet steg, inte ett stort projekt.`
                : 'Daniel, när du accepterat ett jobb i Jobbsök kör vi analysen tillsammans. Ett litet steg i taget.'} />
            </div>
          </section>

          {/* ---------- QUICK ACTIONS ("Gör dig starkare") ---------- */}
          <section>
            <SectionHeader title="Gör dig starkare" sub="Små saker du kan ta itu med just nu" seeAll={null} />
            <div className="quickact">
              {QUICK_ACTIONS.map((a,i) => {
                const site = typeof window !== 'undefined' && true;
                const inner = (<React.Fragment>
                  <div className={`qact__ic ${a.tint}`}><Icon name={a.ic} size={18} /></div>
                  <div className="qact__b">
                    <div className="qact__t">{a.t}</div>
                    {a.hint && <div className="qact__h">{a.hint}</div>}
                  </div>
                  <Icon name="arrow" size={16} className="qact__go" />
                </React.Fragment>);
                return site
                  ? <a key={i} href={`#${a.id}`} className="qact">{inner}</a>
                  : <button key={i} className="qact">{inner}</button>;
              })}
            </div>
          </section>

          {/* ---------- AUTO JOB SEARCH ---------- */}
          <section>
            <SectionHeader title="Jobb som matchar dig" sub="Live från jobbpipelinen — och blir bättre för varje dag" seeAll="Visa alla" />
            <div className="card card--pad jobsearch">
              <div className="jobterms">
                <span className="lbl">Söker efter:</span>
                <span className="term">lager <Icon name="plus" size={12} className="x" style={{ transform:'rotate(45deg)' }} /></span>
                <span className="term">logistik <Icon name="plus" size={12} className="x" style={{ transform:'rotate(45deg)' }} /></span>
                <span className="term">truck <Icon name="plus" size={12} className="x" style={{ transform:'rotate(45deg)' }} /></span>
                <span className="term term--geo"><Icon name="target" size={13} />Kommunkod 0180</span>
                <a className="term term--add" href="#jobbsok"><Icon name="plus" size={13} />Ändra sökning</a>
                <span style={{ marginLeft:'auto', display:'inline-flex', alignItems:'center', gap:7 }} className="coach__status">
                  <span className="dot" />{jobStatus === 'loading' ? 'Söker live' : 'Aktiv sökning'}
                </span>
              </div>

              {jobStatus === 'error' && (
                <div className="feedbackline" style={{ marginBottom:10 }}>
                  <Icon name="lock" size={18} style={{ color:'var(--ll-coral)' }} />
                  Live-sökningen svarade inte just nu. {jobError}
                </div>
              )}

              <JobResultsList jobs={liveJobs} status={jobStatus} />

              <div className="feedbackline">
                <Icon name="bulb" size={18} style={{ color:'var(--ll-amber)' }} />
                {jobMeta ? `${jobMeta.total_found || liveJobs.length} jobb hittade via ${jobMeta.sources?.join(', ') || 'API-sökning'}.` : 'Var de här jobben relevanta? Din matchning blir bättre när du säger till.'}
                <span className="fbtns">
                  <button className="thumbbtn" aria-label="Ja, relevanta"><Icon name="thumb" size={17} /></button>
                  <button className="thumbbtn down" aria-label="Nej, mindre relevanta"><Icon name="thumb" size={17} /></button>
                </span>
              </div>
            </div>
          </section>

          {/* ---------- IMPROVE ---------- */}
          <section>
            <SectionHeader title="Gör dig ännu starkare" sub="Små förbättringar som lyfter dina chanser — inget måste" seeAll={null} />
            <div className="improve">
              <div className="impcard">
                <div className="impcard__head"><div className="impcard__ic ic-blue"><Icon name="cv" size={20} /></div><div className="impcard__t">CV-utkast</div><span style={{ marginLeft:'auto' }}><Tag variant={cvTag.variant}>{cvTag.label}</Tag></span></div>
                <div className="impbar"><span style={{ width: cvTag.width }} /></div>
                <div className="impcard__list">
                  {caseData && caseData.cvDraft.status === 'ready' ? (
                    <div className="impchk impchk--done"><span className="box"><Icon name="check" size={13} sw={3} /></span>{caseData.cvDraft.data.sections.length} sektioner byggda från dina datafakta</div>
                  ) : (
                    <div className="impchk"><span className="box" />Byggs automatiskt när matchanalysen är klar</div>
                  )}
                </div>
                <a className="btn btn--secondary btn--sm btn--block" href="#cv"><Icon name="pen" size={15} />Öppna CV-byggaren</a>
              </div>

              <div className="impcard">
                <DemoBar />
                <div className="impcard__head"><div className="impcard__ic ic-coral"><Icon name="mic" size={20} /></div><div className="impcard__t">Intervjuträning</div><span style={{ marginLeft:'auto' }}><Tag variant="tag--coral">40%</Tag></span></div>
                <div className="impbar"><span style={{ width:'40%', background:'var(--ll-coral)' }} /></div>
                <div className="impcard__list">
                  <div className="impchk impchk--done"><span className="box"><Icon name="check" size={13} sw={3} /></span>2 frågor övade</div>
                  <div className="impchk"><span className="box" />Öva 3 frågor till</div>
                  <div className="impchk"><span className="box" />Spela in ett svar åt Sara</div>
                </div>
                <Button variant="secondary" size="sm" icon="play" block>Träna mer</Button>
              </div>

              <div className="impcard">
                <div className="impcard__head"><div className="impcard__ic ic-lilac"><Icon name="letter" size={20} /></div><div className="impcard__t">Personligt brev</div><span style={{ marginLeft:'auto' }}><Tag variant={letterTag.variant}>{letterTag.label}</Tag></span></div>
                <div className="impbar"><span style={{ width: letterTag.width, background:'var(--ll-lilac)' }} /></div>
                <div className="impcard__list">
                  {caseData && caseData.coverLetter.status === 'ready' ? (
                    <div className="impchk impchk--done"><span className="box"><Icon name="check" size={13} sw={3} /></span>Skrivet för {caseData.meta.company} — granska innan du skickar</div>
                  ) : (
                    <div className="impchk"><span className="box" />Skrivs automatiskt från matchanalysen{caseData ? ` för ${caseData.meta.company}` : ''}</div>
                  )}
                </div>
                <a className="btn btn--primary btn--sm btn--block" href="#letter"><Icon name="letter" size={15} />Öppna brevet</a>
              </div>
            </div>
          </section>

          {/* ---------- FOUNDATION SYSTEM ---------- */}
          <section>
            <SectionHeader title="Grundsystemet som gör jobbet med dig" sub="Sex första moduler från strategin, kopplade till samma case och samma kunskap" seeAll={null} />
            <DemoBar />
            <div className="quickact">
              {FOUNDATION_TOOLS.map((tool) => (
                <a key={tool.id} href={`#${tool.id}`} className="qact">
                  <div className={`qact__ic ${tool.tint}`}><Icon name={tool.ic} size={18} /></div>
                  <div className="qact__b">
                    <div className="qact__t">{tool.sv}</div>
                    <div className="qact__h">{tool.problem}: {tool.outcome}</div>
                  </div>
                  <Icon name="arrow" size={16} className="qact__go" />
                </a>
              ))}
            </div>
            <div className="grid" style={{ gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginTop:12 }}>
              {OUTCOME_METRICS.map((m) => (
                <div key={m.label} className="card card--pad">
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:26, color:'var(--ll-blue-deep)' }}>{m.value}</div>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:14 }}>{m.label}</div>
                  <p className="cap" style={{ marginTop:4 }}>{m.hint}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ---------- TRIO: discussions / videos / news ---------- */}
          <section>
            <SectionHeader title="För dig just nu" sub="Samtal, korta videor och nyheter som kan hjälpa dig" seeAll={null} />
            <DemoBar />
            <div className="trio">
              <div className="panel">
                <div className="panel__head"><div className="panel__ic ic-lilac"><Icon name="users" size={18} /></div><h3>Nya diskussioner</h3><a className="seeall" href="#">Forum</a></div>
                {DISCUSSIONS.map((d,i) => (
                  <div className="disc" key={i}>
                    <Avatar name={d.who} size="sm" tone={d.tone} />
                    <div className="disc__b">
                      <div className="disc__t">{d.t}</div>
                      <div className="disc__m">{d.hot && <span className="disc__hot">🔥 Hett · </span>}{d.m}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="panel">
                <div className="panel__head"><div className="panel__ic ic-coral"><Icon name="play" size={18} /></div><h3>Videor: så söker du</h3><a className="seeall" href="#">Alla</a></div>
                {VIDEOS.map((v,i) => (
                  <div className="vidcard" key={i}>
                    <Photo tone={v.tone} clover person label={null} />
                    <span className="vidcard__len">{v.len}</span>
                    <div className="vidplay"><span><Icon name="play" size={20} /></span></div>
                    <div className="vidcard__cap"><div className="vidcard__t">{v.t}</div></div>
                  </div>
                ))}
              </div>

              <div className="panel">
                <div className="panel__head"><div className="panel__ic ic-blue"><Icon name="globe" size={18} /></div><h3>Nyheter som hjälper</h3><a className="seeall" href="#">Mer</a></div>
                {NEWS.map((n,i) => (
                  <div className="newsitem" key={i}>
                    <div className="src">{n.src}</div>
                    <div className="h">{n.h}</div>
                    <div className="t">{n.t}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ---------- LEARN (fearless) ---------- */}
          <section>
            <SectionHeader title="Lär dig något nytt" sub="I din egen takt" seeAll="Bibliotek" />
            <DemoBar />
            <div className="learn-rs"><Clover size={18} color="#8E7CF0" />Du kan inte göra fel här — allt går att ångra, och ingen ser något du inte vill dela.</div>
            <div className="learn">
              {LEARN.map((l,i) => (
                <div className="learncard" key={i}>
                  <div className={`learncard__ic ${l.tint}`}><Icon name={l.ic} size={22} /></div>
                  <div className="learncard__t">{l.t}</div>
                  <div className="learncard__m">{l.m}</div>
                  <div className="learncard__foot"><Icon name="clock" size={14} />{l.min}<span style={{ marginLeft:'auto' }}><Icon name="arrow" size={15} /></span></div>
                </div>
              ))}
            </div>
          </section>

          {/* ---------- COACHING COLD OUTREACH ---------- */}
          <section>
            <SectionHeader title="Våga höra av dig först" sub="Det här är ofta så de bästa jobben hittas" seeAll={null} />
            <DemoBar />
            <div className="outreach">
              <div className="outreach__l">
                <h2>Ett vänligt mejl kan öppna en dörr</h2>
                <p>Många jobb syns aldrig som annonser. Sara hjälper dig skriva ett kort, varmt mejl till arbetsgivare du gillar — så det känns som du, och så att du slipper oroa dig för att säga fel.</p>
                <div style={{ display:'flex', gap:10, marginTop:18 }}>
                  <Button variant="coral" icon="pen">Skriv med Sara</Button>
                  <Button variant="secondary" icon="letter">Se fler exempel</Button>
                </div>
              </div>
              <div className="outreach__r">
                <div className="mailprev">
                  <div className="mailprev__h"><span className="k">Till: </span><span className="v">rekrytering@postnord.se</span></div>
                  <div className="mailprev__h"><span className="k">Ämne: </span><span className="v">Intresserad av lagerarbete i Västerås</span></div>
                  <div className="mailprev__body">Hej! Jag heter Amir och bor i Västerås. Jag har truckkort och praktik från lager, och blev nyfiken på er efter att ha sett ert arbete. <b>Finns det möjlighet att höras om ni söker folk framöver?</b> Tack för att ni läser!</div>
                </div>
              </div>
            </div>
          </section>

          {/* ---------- COMMUNITY ---------- */}
          <section>
            <SectionHeader title="Tillsammans i Lilly" sub="Du är inte ensam i det här" seeAll={null} />
            <DemoBar />
            <div className="commwrap">
              <div className="commstats">
                <div className="commstat"><div className="stat__ic ic-green" style={{ width:44, height:44, marginBottom:0 }}><Icon name="briefcase" size={20} /></div><div><div className="big" style={{ color:'#1c7a48' }}>4</div><div className="lab">fick jobb den här veckan 🎉</div></div></div>
                <div className="commstat"><div className="stat__ic ic-blue" style={{ width:44, height:44, marginBottom:0 }}><Icon name="cv" size={20} /></div><div><div className="big" style={{ color:'var(--ll-blue-deep)' }}>3</div><div className="lab">nya mallar delades</div></div></div>
                <div className="commstat"><div className="stat__ic ic-amber" style={{ width:44, height:44, marginBottom:0 }}><Icon name="bulb" size={20} /></div><div><div className="big" style={{ color:'#9a6611' }}>2</div><div className="lab">nya tips från deltagare</div></div></div>
              </div>

              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:15, marginBottom:12 }}>Grattis till veckans hjältar! 🎉</div>
              <div className="congrats">
                {CONGRATS.map((c,i) => (
                  <div className="congrat" key={i}>
                    <Avatar name={c.nm} size="lg" tone={c.tone} clover />
                    <div className="nm">{c.nm}</div>
                    <div className="co">{c.co}</div>
                    <span className="badge">Ny tjänst</span>
                  </div>
                ))}
              </div>

              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:15, margin:'4px 0 12px' }}>Andra deltagare söker hjälp inom:</div>
              <div className="helptags">
                <span className="helptag">Tandläkarmottagningar <span className="cnt">3</span></span>
                <span className="helptag">Distributionscentraler <span className="cnt">5</span></span>
                <span className="helptag">Kodare & utvecklare <span className="cnt">2</span></span>
                <span className="helptag">Vård & omsorg <span className="cnt">4</span></span>
                <span className="helptag" style={{ background:'var(--ll-blue)', color:'#fff', borderColor:'var(--ll-blue)' }}><Icon name="heart" size={14} />Känner du någon? Tipsa</span>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

export { HomeExpanded };
