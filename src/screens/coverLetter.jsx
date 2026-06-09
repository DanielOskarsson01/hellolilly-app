import React from 'react';
import { Icon, Avatar, Tag, Chip, Button, SectionHeader } from '../components/primitives.jsx';
import { Sidebar } from '../components/shell.jsx';
import { ToolHeader } from './cvActivity.jsx';
import { CASE_PROFILE, PIPELINE_RUN } from '../data/strategyData.js';

// HelloLilly — Personligt brev (cover letter generator)
// Same calm intake pattern as CV builder; visibly reframes a concern (gap/career
// change/age) as a strength, with the letter building live on the right.

function CoverLetter() {
  return (
    <div className="ll app" data-screen-label="Personligt brev">
      <Sidebar active="letter" />
      <div className="main">
        <ToolHeader title="Personligt brev" step="3" total="5">
          <Button variant="ghost" size="sm" icon="download">Ladda ner PDF</Button>
          <Button variant="primary" size="sm" icon="check">Spara</Button>
        </ToolHeader>

        <div style={{ display:'grid', gridTemplateColumns:'minmax(420px,1fr) 1.05fr', flex:1, minHeight:0 }}>
          {/* intake */}
          <section className="intake" style={{ borderRight:'1px solid var(--ll-border)' }}>
            <div className="intake__head">
              <Avatar name="Sara Lind" size="md" tone="av-c3" clover />
              <div>
                <div className="intake__title">Vi skriver brevet från analysen</div>
                <div className="cap">En fråga i taget - inget ska hittas på</div>
              </div>
              <span className="intake__prog">50% klart</span>
            </div>

            <div className="intake__feed">
              <div className="msg msg--bot">
                <Avatar name="Sara Lind" size="sm" tone="av-c3" />
                <div className="msg__bubble">Vi gör ett kort, varmt brev till <b>{PIPELINE_RUN.company}</b>. Jag använder matchanalysen, CV-uppdateringarna och bara sådant vi faktiskt vet.</div>
              </div>

              <div className="msg msg--bot">
                <Avatar name="Sara Lind" size="sm" tone="av-c3" />
                <div className="msg__bubble">Pipeline-planen säger: öppna konkret, nämn glappet ärligt och var tydlig med truckkort B som nästa steg.</div>
              </div>

              <div className="intake__quick" style={{ marginTop:-4 }}>
                {PIPELINE_RUN.coverLetterPlan.map((p, i) => <Chip key={i} on={i===1}>{p}</Chip>)}
              </div>

              <div className="msg msg--me">
                <div className="msg__bubble">Jag var hemma en period och är orolig att de undrar varför.</div>
              </div>

              <div className="intake__reassure"><Icon name="heart" size={16} sw={2.4} />Det där är vanligt. Brevet ska inte ursäkta det - det ska visa vad du gjort sedan dess.</div>

              <div className="msg msg--bot">
                <Avatar name="Sara Lind" size="sm" tone="av-c3" />
                <div>
                  <div className="msg__bubble">Perfekt. Jag skriver inte runt luckan. Jag bygger en bridge: praktik, ny riktning, tydligt nästa steg. Titta till höger.</div>
                  <div className="msg__hint">Fråga 3 av 5 · du kan alltid gå tillbaka</div>
                </div>
              </div>
            </div>

            <div className="intake__composer">
              <div className="intake__inputrow">
                <input placeholder="Skriv ditt svar…" aria-label="Ditt svar" />
                <button className="intake__mic" aria-label="Spela in röst"><Icon name="mic" size={20} /></button>
                <button className="intake__send" aria-label="Skicka"><Icon name="send" size={19} /></button>
              </div>
              <div className="intake__quick">
                <Chip icon="sparkle">Låter bra, fortsätt</Chip>
                <Chip>Säg det mjukare</Chip>
                <Chip>Hoppa över</Chip>
              </div>
            </div>
          </section>

          {/* live preview */}
          <section className="cvframe">
            <div style={{ width:'100%', maxWidth:560 }}>
              <div className="between" style={{ marginBottom:14 }}>
                <span className="tag tag--green" style={{ gap:6 }}><Icon name="sparkle" size={14} />Byggt från pipeline</span>
                <span className="cap" style={{ fontWeight:700 }}>Förhandsvisning · {PIPELINE_RUN.company}</span>
              </div>
              <div className="cvpaper">
                <h2 style={{ fontSize:22 }}>{CASE_PROFILE.person}</h2>
                <div className="cv-role">Personligt brev · {PIPELINE_RUN.role}</div>
                <div className="cv-contact"><span>📍 Västerås</span><span>✉ amir.hassan@mail.se</span><span>✆ 070-123 45 67</span></div>
                <hr className="divider" style={{ margin:'18px 0' }} />
                <p style={{ lineHeight:1.7, color:'#3a4456' }}>Hej!</p>
                <p style={{ lineHeight:1.7, color:'#3a4456', marginTop:12 }}>Jag söker rollen som {PIPELINE_RUN.role.toLowerCase()} eftersom jag vet att jag fungerar bra i lagerflöden där noggrannhet, tempo och ansvar spelar roll.</p>
                <p style={{ lineHeight:1.7, color:'#3a4456', marginTop:12 }}>Under min praktik på PostNord arbetade jag med plockning, packning, scanning och inleverans. Jag körde truck A1 och fick beröm för att vara punktlig och noggrann.</p>
                <p style={{ lineHeight:1.7, color:'#3a4456', marginTop:12, background:'var(--ll-green-soft)', borderRadius:8, padding:'10px 12px' }}>Jag har haft en period borta från arbetslivet, men vägen tillbaka har varit praktisk och konkret: praktik, uppdaterat CV, intervjuträning och en tydlig riktning mot logistik.</p>
                <p style={{ lineHeight:1.7, color:'#3a4456', marginTop:12, display:'flex', alignItems:'center', gap:8 }}><span className="cv-typing">Lilly lägger in truckkort B som nästa steg, inte som ett påstående</span><span className="voicewave" style={{ height:18 }}><span style={{height:8}}/><span style={{height:14}}/><span style={{height:10}}/><span style={{height:16}}/><span style={{height:9}}/></span></p>
                <p style={{ marginTop:16, fontWeight:700, color:'#1c2435' }}>Vänliga hälsningar,<br/>Amir Hassan</p>
              </div>
              <div className="feedbackline" style={{ marginTop:16 }}>
                <Icon name="bulb" size={18} style={{ color:'var(--ll-amber)' }} />
                Det gröna stycket är bridge-paragrafen från strategin: ärlig, kort och användbar.
                <a href="#review" className="btn btn--secondary btn--sm" style={{ marginLeft:'auto' }}><Icon name="users" size={15} />Be coacher läsa</a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export { CoverLetter };
