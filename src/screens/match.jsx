import React from 'react';
import { Icon, Clover, Avatar, Tag, Button, SectionHeader } from '../components/primitives.jsx';
import { Sidebar, Topbar } from '../components/shell.jsx';
import { ToolHeader } from './cvActivity.jsx';
import { PIPELINE_RUN } from '../data/strategyData.js';

// HelloLilly — Matchanalys
// AI's analysis of how well your CV matches a specific job: score, what matches,
// what's missing (gaps), soft-skill read, verdict.

const MATCHES = [
  { t:'Truckkort A1', m:'Du tog det under praktik pa PostNord.', src:'CV · Lagerpraktik' },
  { t:'Skiftarbete', m:'Du jobbade tvaskift under praktiken.', src:'CV · PostNord' },
  { t:'Svenska, flytande', m:'Anges i ditt CV under sprak.', src:'CV · Sprak' },
  { t:'Handdator/scanning', m:'Naraliggande erfarenhet kan beskrivas arligt.', src:'Pipeline suggestion' },
];

const GAPS = PIPELINE_RUN.gaps;

const SOFTSKILLS = [
  { ic:'check',  t:'Pålitlighet', sc:'Stark', cls:'good' },
  { ic:'users',  t:'Lagspelare',  sc:'Stark', cls:'good' },
  { ic:'target', t:'Noggrannhet', sc:'Bra',   cls:'ok' },
  { ic:'sparkle',t:'Initiativ',   sc:'Visa mer', cls:'work' },
];

function JobMatchReview() {
  const score = PIPELINE_RUN.score, R = 78, C = 2 * Math.PI * R, off = C * (1 - score/100);
  return (
    <div className="ll app app--warm" data-screen-label="Matchanalys">
      <Sidebar active="match" />
      <div className="main">
        <ToolHeader title={`Matchanalys · ${PIPELINE_RUN.role}`}>
          <Button variant="secondary" size="sm" icon="share">Dela med Sara</Button>
          <Button variant="primary" size="sm" icon="check">Ansök</Button>
        </ToolHeader>

        <div className="content content--narrow" style={{ paddingTop:14 }}>

          {/* hero */}
          <div className="match-hero">
            <div className="match-score">
              <svg width="180" height="180" viewBox="0 0 180 180">
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2FA56A" /><stop offset="100%" stopColor="#5C93F7" />
                  </linearGradient>
                </defs>
                <circle className="bg" cx="90" cy="90" r={R} />
                <circle className="fg" cx="90" cy="90" r={R} strokeDasharray={C} strokeDashoffset={off} />
              </svg>
              <div className="match-score__n"><div><b>{score}%</b><span>Matchning</span></div></div>
            </div>
            <div className="match-meta">
              <div className="match-meta__co">
                <div className="joblogo" style={{ background:'#2B6CF0', width:46, height:46 }}>PO</div>
                <div>
                  <div style={{ fontWeight:800, fontFamily:'var(--font-display)', fontSize:15 }}>{PIPELINE_RUN.company}</div>
                  <div className="cap" style={{ fontWeight:600 }}>{PIPELINE_RUN.role} · {PIPELINE_RUN.location} · Heltid</div>
                </div>
              </div>
              <h1>Bra match - med tre konkreta luckor att fylla</h1>
              <p className="match-meta__verdict">Lilly har kort samma 5-lagersanalys som jobbpipelinen: krav, nice-to-haves, branschsprak, kontext och kultursignaler. Resultatet ar praktiskt, inte ett domslut.</p>
              <div className="match-meta__by"><Icon name="sparkle" size={14} style={{ color:'var(--ll-blue)' }} />Granskad av Lilly · for 2 min sedan · {PIPELINE_RUN.confidence}% saker</div>
            </div>
            <div className="match-actions">
              <Button variant="primary" icon="check">Ansök ändå</Button>
              <Button variant="secondary" icon="pen">Fyll luckorna först</Button>
              <Button variant="ghost" icon="heart" size="sm">Spara till senare</Button>
            </div>
          </div>

          {/* matches + gaps */}
          <div className="match-grid" style={{ marginBottom:22 }}>
            <div className="card card--pad match-col">
              <h3><Icon name="check" size={19} sw={2.6} style={{ color:'var(--ll-green)' }} /><span className="lbl">Det du har</span> <span className="pill" style={{ background:'var(--ll-green-soft)', color:'#1c7a48' }}>4 matchningar</span></h3>
              {MATCHES.map((m,i) => (
                <div className="matchitem" key={i}>
                  <div className="matchitem__ic ok"><Icon name="check" size={16} sw={3} /></div>
                  <div className="matchitem__b">
                    <div className="matchitem__t">{m.t}</div>
                    <div className="matchitem__m">{m.m}</div>
                    <span className="matchitem__src"><Icon name="doc" size={12} sw={2.4} style={{ display:'inline', verticalAlign:'-2px', marginRight:4 }} />{m.src}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="card card--pad match-col">
              <h3><Icon name="bulb" size={19} style={{ color:'var(--ll-coral)' }} /><span className="lbl">Luckor att fylla</span> <span className="pill" style={{ background:'var(--ll-coral-soft)', color:'#b5421f' }}>{GAPS.length} förbättringar</span></h3>
              {GAPS.map((g,i) => (
                <div className="matchitem" key={i}>
                  <div className="matchitem__ic miss"><Icon name="plus" size={15} sw={3} /></div>
                  <div className="matchitem__b">
                    <div className="matchitem__t">{g.t}</div>
                    <div className="matchitem__m">{g.m}</div>
                    <div style={{ marginTop:8, fontSize:13, color:'var(--ll-ink)', background:'var(--ll-blue-tint-2)', padding:'9px 11px', borderRadius:9 }}><Icon name="sparkle" size={14} style={{ color:'var(--ll-blue)', display:'inline', verticalAlign:'middle', marginRight:6 }} />{g.sug}</div>
                  </div>
                  <div className="matchitem__act"><Button variant="secondary" size="sm">{g.cta}</Button></div>
                </div>
              ))}
            </div>
          </div>

          {/* soft skills + job description */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:22 }}>
            <div className="card card--pad">
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:800, marginBottom:14 }}>Valda CV-uppdateringar</h3>
              <p className="cap" style={{ marginBottom:14 }}>Det här är exakt vad CV-byggaren använder från analysen.</p>
              <div className="match-soft">
                {PIPELINE_RUN.selectedCvUpdates.map((s,i) => (
                  <div key={i} className="softpill good">
                    <div className="ic ic-green"><Icon name="check" size={18} /></div>
                    <b>CV</b><span className="sc">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card card--pad">
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:800, marginBottom:6 }}>Annonsen, granskad</h3>
              <p className="cap" style={{ marginBottom:12 }}>Explicit requirements från pipelineanalysen.</p>
              <div className="jd">
                <p>Systemet markerar krav som <mark className="ok">matchade</mark> eller <mark className="miss">luckor</mark>, med källa från CV eller coachfråga.</p>
                <h4>Krav och status</h4>
                <ul>
                  {PIPELINE_RUN.explicitRequirements.map((r) => (
                    <li key={r.requirement}><mark className={r.status === 'matched' ? 'ok' : 'miss'}>{r.requirement}</mark> · {r.priority} · {r.source}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* verdict */}
          <div className="verdict">
            <div className="verdict__ic"><Clover size={28} color="#fff" /></div>
            <div style={{ flex:1 }}>
              <h3>Vår känsla: gå för det, men gör det smart.</h3>
              <p>Med CV-tillägget, kursplanen för truck B och en referensfråga till Lena hamnar du på <b style={{ color:'#fff' }}>{PIPELINE_RUN.improvedScore}%</b>. Det är den sortens hjälp systemet ska ge: konkret nog att göra direkt.</p>
            </div>
            <Button variant="primary" icon="pen">Fixa luckorna med Sara</Button>
          </div>

        </div>
      </div>
    </div>
  );
}

export { JobMatchReview };
