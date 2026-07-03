import React from 'react';
import { Icon, Clover, Avatar, Tag, Chip, Button, SectionHeader, DemoBar } from '../components/primitives.jsx';
import { Sidebar } from '../components/shell.jsx';
import { ToolHeader } from './cvActivity.jsx';
import { PIPELINE_RUN } from '../data/strategyData.js';
import { useActiveCase } from '../hooks/useCase.js';

// HelloLilly — Personligt brev (cover letter generator)
// The preview pane renders the REAL coverLetter part written by the `writer`
// submodule for the active case, including its honesty surface: every claim the
// letter makes that the CV does not support lands in unsupported_by_cv[] and is
// shown for review before sending — never hidden.

function LetterPaper({ caseData, running, actions }) {
  const letter = caseData && caseData.coverLetter;
  const status = letter ? letter.status : 'absent';

  if (!caseData || status === 'absent') {
    return (
      <div className="cvpaper" style={{ display: 'grid', placeItems: 'center', minHeight: 420, textAlign: 'center' }}>
        <div>
          <Clover size={38} color="#2B6CF0" />
          <h2 style={{ marginTop: 12 }}>Inget brev ännu</h2>
          <p className="muted" style={{ maxWidth: 380, margin: '8px auto 14px' }}>
            Brevet skrivs från matchanalysen: styrkorna leder, luckorna hanteras ärligt. Kör en analys i Matchanalys så skrivs brevet i bakgrunden.
          </p>
          <a className="btn btn--primary btn--sm" href="#match"><Icon name="target" size={16} />Till Matchanalys</a>
        </div>
      </div>
    );
  }

  if (status === 'pending' || running.generate) {
    return (
      <div className="cvpaper" style={{ display: 'grid', placeItems: 'center', minHeight: 420, textAlign: 'center' }}>
        <div>
          <span className="cv-typing">Lilly skriver brevet från analysen…</span>
          <p className="muted" style={{ maxWidth: 380, margin: '10px auto 0' }}>
            Måsten leder, luckorna får en ärlig bridge-paragraf. Inget hittas på.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="cvpaper" style={{ display: 'grid', placeItems: 'center', minHeight: 420, textAlign: 'center' }}>
        <div>
          <Icon name="letter" size={30} />
          <h2 style={{ marginTop: 12 }}>Brevet kunde inte skrivas</h2>
          <p className="muted" style={{ maxWidth: 380, margin: '8px auto 14px' }}>{letter.error || 'Okänt fel.'}</p>
          <Button variant="secondary" size="sm" icon="letter" onClick={() => actions.generate().catch(() => {})}>Försök igen</Button>
        </div>
      </div>
    );
  }

  const paragraphs = (letter.data && letter.data.paragraphs) || [];
  const unsupported = (letter.data && letter.data.unsupported_by_cv) || [];
  return (
    <React.Fragment>
      <div className="cvpaper">
        <h2 style={{ fontSize:22 }}>Daniel Oskarsson</h2>
        <div className="cv-role">Personligt brev · {caseData.meta.role}</div>
        <div className="cv-contact"><span>Till {caseData.meta.company}</span></div>
        <hr className="divider" style={{ margin:'18px 0' }} />
        {paragraphs.map((p, i) => (
          <p key={i} style={{ lineHeight:1.7, color:'#3a4456', marginTop: i === 0 ? 0 : 12 }}>{p}</p>
        ))}
        <p style={{ marginTop:16, fontWeight:700, color:'#1c2435' }}>Vänliga hälsningar,<br/>Daniel Oskarsson</p>
      </div>

      {/* The honesty surface: claims the CV does not support, flagged for review. */}
      {unsupported.length > 0 ? (
        <div className="feedbackline" style={{ marginTop:16, alignItems:'flex-start' }}>
          <Icon name="bulb" size={18} style={{ color:'var(--ll-coral)' }} />
          <div>
            <b>Påståenden att granska innan du skickar</b> — de saknar direkt stöd i ditt CV:
            <ul style={{ margin:'6px 0 0 18px' }}>
              {unsupported.map((u, i) => <li key={i} style={{ marginTop:4 }}>{u}</li>)}
            </ul>
          </div>
        </div>
      ) : (
        <div className="feedbackline" style={{ marginTop:16 }}>
          <Icon name="check" size={18} sw={2.6} style={{ color:'var(--ll-green)' }} />
          Alla påståenden i brevet har stöd i ditt CV.
          <a href="#review" className="btn btn--secondary btn--sm" style={{ marginLeft:'auto' }}><Icon name="users" size={15} />Be coacher läsa</a>
        </div>
      )}
    </React.Fragment>
  );
}

function CoverLetter() {
  const { caseData, running, actions } = useActiveCase();
  return (
    <div className="ll app" data-screen-label="Personligt brev">
      <Sidebar active="letter" />
      <div className="main">
        <ToolHeader title="Personligt brev" step="3" total="5">
          <Button variant="ghost" size="sm" icon="download">Ladda ner PDF</Button>
          <Button variant="primary" size="sm" icon="check">Spara</Button>
        </ToolHeader>

        <div className="toolsplit">
          {/* intake — fixture conversation (labelled demo until the Stream 1 design pass wires it) */}
          <section className="intake" style={{ borderRight:'1px solid var(--ll-border)' }}>
            <DemoBar />
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
                <div className="msg__bubble">Vi gör ett kort, varmt brev till <b>{(caseData && caseData.meta.company) || PIPELINE_RUN.company}</b>. Jag använder matchanalysen, CV-uppdateringarna och bara sådant vi faktiskt vet.</div>
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

          {/* live preview — the real coverLetter for the active case */}
          <section className="cvframe">
            <div style={{ width:'100%', maxWidth:560 }}>
              <div className="between" style={{ marginBottom:14 }}>
                {caseData && caseData.coverLetter.status === 'ready'
                  ? <span className="tag tag--green" style={{ gap:6 }}><Icon name="sparkle" size={14} />Skrivet från din matchanalys</span>
                  : <span className="tag tag--ghost" style={{ gap:6 }}><Icon name="letter" size={14} />Väntar på analys</span>}
                <span className="cap" style={{ fontWeight:700 }}>
                  Förhandsvisning{caseData ? ` · ${caseData.meta.company}` : ''}
                </span>
              </div>
              <LetterPaper caseData={caseData} running={running} actions={actions} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export { CoverLetter };
