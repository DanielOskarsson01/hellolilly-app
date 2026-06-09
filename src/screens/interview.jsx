import React from 'react';
import { Icon, Clover, Avatar, Tag, Button, SectionHeader } from '../components/primitives.jsx';
import { Sidebar } from '../components/shell.jsx';
import { ToolHeader } from './cvActivity.jsx';
import { PIPELINE_RUN } from '../data/strategyData.js';

// HelloLilly — Intervjuträning (spoken practice + gentle feedback)

function RecWave() {
  const hs = [10,18,26,34,22,30,40,28,16,24,38,20,32,12,26,36,18,28,14,30,22,34,20,12];
  return <div className="recwave">{hs.map((h,i)=>(<span key={i} style={{ height:h }} />))}</div>;
}

const QSET = [
  { n:1, t:'Berätta om din PostNord-praktik', state:'done' },
  { n:2, t:'Hur arbetar du när tempot är högt?', state:'now' },
  { n:3, t:'Vad betyder noggrannhet i terminalarbete?', state:'todo' },
  { n:4, t:'Hur använder du handdator och scanning?', state:'todo' },
  { n:5, t:'Vad gör du medan du tar truckkort B?', state:'todo' },
];

function InterviewTrainer() {
  const [jobText, setJobText] = React.useState('PostNord söker lagermedarbetare till terminal i Västerås. Skiftarbete, truckkort A1, god svenska, noggrannhet och gärna erfarenhet av WMS eller handdator/scanning.');
  const hasJob = jobText.trim().length > 40;
  return (
    <div className="ll app app--lively" data-screen-label="Intervjuträning">
      <Sidebar active="interview" />
      <div className="main">
        <ToolHeader title="Intervjuträning">
          <div className="seg" role="tablist" aria-label="Träningsläge">
            <button><Icon name="globe" size={16} />Allmän träning</button>
            <button className="on"><Icon name="briefcase" size={16} />{PIPELINE_RUN.company}</button>
          </div>
        </ToolHeader>

        <div className="content content--narrow" style={{ paddingTop:18, maxWidth:1000, margin:'0 auto', width:'100%' }}>
          <div className="card card--pad" style={{ marginBottom:18, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:18, alignItems:'stretch' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div className="stat__ic ic-blue" style={{ width:42, height:42, marginBottom:0 }}><Icon name="doc" size={20} /></div>
                <div>
                  <h2 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:900 }}>Lägg in jobbannonsen först</h2>
                  <p className="cap">Strategin säger att intervjun ska byggas från jobbannons, CV, företag och tidigare svar.</p>
                </div>
              </div>
              <textarea
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                aria-label="Job description"
                placeholder="Klistra in jobbannonsen här..."
                style={{
                  width:'100%',
                  minHeight:118,
                  resize:'vertical',
                  border:'1.5px solid var(--ll-border)',
                  borderRadius:12,
                  padding:'13px 14px',
                  font:'14px/1.5 var(--font-body)',
                  color:'var(--ll-ink)',
                  outline:'none',
                  background:'#fff',
                }}
              />
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:10 }}>
                <label className="btn btn--secondary btn--sm" style={{ cursor:'pointer' }}>
                  <Icon name="upload" size={16} />Ladda upp PDF/DOCX
                  <input type="file" accept=".pdf,.doc,.docx,.txt" style={{ display:'none' }} />
                </label>
                <Button variant="primary" size="sm" icon="sparkle">Skapa intervjufrågor</Button>
                <span className="cap" style={{ alignSelf:'center' }}>{hasJob ? 'Annonsen är redo att analyseras' : 'Klistra in lite mer text för att anpassa frågorna'}</span>
              </div>
            </div>
            <div style={{ background:'var(--ll-blue-tint-2)', borderRadius:14, padding:'16px 18px', display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:900, color:'var(--ll-blue-deep)' }}>Frågor genereras från</div>
              <div className="lgloop" style={{ justifyContent:'flex-start' }}><Icon name="briefcase" size={14} />Roll: {PIPELINE_RUN.role}</div>
              <div className="lgloop" style={{ justifyContent:'flex-start' }}><Icon name="target" size={14} />Krav: skift, truck, svenska</div>
              <div className="lgloop" style={{ justifyContent:'flex-start' }}><Icon name="cv" size={14} />CV: PostNord-praktik</div>
              <div className="lgloop" style={{ justifyContent:'flex-start' }}><Icon name="bulb" size={14} />Lucka: WMS/handdator</div>
            </div>
          </div>

          {/* practice stage */}
          <div className="stage">
            <div className="stage__top">
              <span className="stage__count">Fråga 2 av 5 · {PIPELINE_RUN.role}</span>
              <span className="stage__priv"><Icon name="lock" size={14} />Privat &amp; tryggt — ingen lyssnar live</span>
            </div>
            <div className="stage__q">Hur arbetar du när tempot är högt i terminalen?</div>
            <p className="stage__hint">Frågan kommer från annonsens kultursignaler: tempo, skift och noggrannhet. Svara med ett konkret exempel från praktiken.</p>
            <div className="stage__rec">
              <button className="recbtn recbtn--live" aria-label="Spelar in — tryck för att stoppa">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="3" /></svg>
              </button>
              <RecWave />
              <span className="stage__timer">00:24</span>
            </div>
            <Clover className="stage__art" size={210} />
          </div>

          {/* feedback */}
          <div style={{ marginTop:28 }}>
            <SectionHeader title="Återkoppling på ditt förra svar" sub="Mjuk feedback, men kopplad till samma krav som matchanalysen" seeAll={null} />
            <div className="fbgrid">
              <div className="fb">
                <div className="fb__head">
                  <div className="fb__ic ic-coral"><Icon name="voice" size={22} /></div>
                  <span className="fb__t">Leverans</span>
                  <span className="fb__score" style={{ background:'var(--ll-green-soft)', color:'#1c7a48' }}>Bra!</span>
                </div>
                <div className="fb__bars">
                  <div className="fb__bar">
                    <div className="between"><span>Tempo</span><span className="muted">Lugnt</span></div>
                    <div className="fb__track"><span style={{ width:'82%', background:'var(--ll-green)' }} /></div>
                  </div>
                  <div className="fb__bar">
                    <div className="between"><span>Tydlighet</span><span className="muted">Lätt att följa</span></div>
                    <div className="fb__track"><span style={{ width:'76%', background:'var(--ll-blue)' }} /></div>
                  </div>
                  <div className="fb__bar">
                    <div className="between"><span>Utfyllnadsord</span><span className="muted">Några – ok</span></div>
                    <div className="fb__track"><span style={{ width:'55%', background:'var(--ll-amber)' }} /></div>
                  </div>
                </div>
                <div className="fb__note"><Icon name="bulb" size={18} style={{ color:'var(--ll-amber)', flex:'0 0 auto' }} /><span><b>Litet tips:</b> en kort paus istället för “öh” låter självsäkert. Du gjorde det redan ett par gånger – fint!</span></div>
              </div>

              <div className="fb">
                <div className="fb__head">
                  <div className="fb__ic ic-blue"><Icon name="doc" size={22} /></div>
                  <span className="fb__t">Innehåll</span>
                  <span className="fb__score" style={{ background:'var(--ll-blue-tint)', color:'var(--ll-blue-deep)' }}>På väg</span>
                </div>
                <div className="fb__bars">
                  <div className="fb__bar">
                    <div className="between"><span>Svarade på frågan</span><span className="muted">Ja</span></div>
                    <div className="fb__track"><span style={{ width:'88%', background:'var(--ll-green)' }} /></div>
                  </div>
                  <div className="fb__bar">
                    <div className="between"><span>Konkret exempel</span><span className="muted">Lägg till ett</span></div>
                    <div className="fb__track"><span style={{ width:'45%', background:'var(--ll-coral)' }} /></div>
                  </div>
                </div>
                <div className="fb__note"><Icon name="sparkle" size={18} style={{ color:'var(--ll-blue)', flex:'0 0 auto' }} /><span>Du nämnde att du är pålitlig - <b>koppla det till scanning, plockning eller skift</b>. Då svarar du på annonsen utan att låta inövad.</span></div>
              </div>
            </div>
          </div>

          {/* coach note + question rail */}
          <div className="grid" style={{ gridTemplateColumns:'1fr 320px', marginTop:24, alignItems:'start' }}>
            <div className="card card--pad">
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:800, marginBottom:14 }}>Frågor i den här övningen</h3>
              <div className="qrail" style={{ flexDirection:'column' }}>
                {QSET.map(q => (
                  <div key={q.n} className={`qpip qpip--${q.state}`} style={{ width:'100%' }}>
                    <span className="n">{q.state==='done' ? '✓' : q.n}</span>{q.t}
                    {q.state==='now' && <span style={{ marginLeft:'auto' }}><Tag variant="tag--coral">Nu</Tag></span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="stack">
              <div className="coach">
                <div className="coach__head">
                  <Avatar name="Sara Lind" size="md" tone="av-c3" clover />
                  <div className="coach__who"><div className="coach__name">Sara</div><div className="coach__role">Din coach</div></div>
                </div>
                <div className="coach__bubble" style={{ margin:'14px 0' }}>Det här är precis poängen: du tränar inte på slumpmässiga frågor, utan på frågorna PostNord sannolikt bryr sig om. Dela gärna en inspelning med mig.</div>
                <Button variant="secondary" size="sm" icon="share" block>Dela en inspelning med Sara</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { InterviewTrainer, RecWave };
