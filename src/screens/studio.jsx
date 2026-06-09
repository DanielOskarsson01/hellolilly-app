import React from 'react';
import { Icon, Clover, Photo, Tag, Chip, Button, SectionHeader } from '../components/primitives.jsx';
import { Sidebar } from '../components/shell.jsx';
import { ToolHeader } from './cvActivity.jsx';

// HelloLilly — Bildstudio (generate profile & personal-branding images from templates)

const TEMPLATES = [
  { tone:'ph--sky',   t:'Proffsig profilbild', m:'Neutral bakgrund, vänligt ljus', on:true },
  { tone:'ph--coral', t:'LinkedIn-porträtt', m:'Varmt och inbjudande' },
  { tone:'ph--green', t:'CV-foto', m:'Rent, enkelt, seriöst' },
  { tone:'ph--lilac', t:'Lilly-stil (blå)', m:'På HelloLillys blå vägg' },
];

const SUGGEST = ['Le lite mer', 'Ljusare bakgrund', 'Skjorta istället', 'Mjukare ljus'];

function StudioResult({ tone, fav=false, main=false }) {
  return (
    <div className="result">
      <Photo tone={tone} clover person label={null} />
      <div className="result__bar">
        <button className="result__btn" aria-label="Spara som favorit" style={ fav ? { color:'var(--ll-coral)' } : null}><Icon name="heart" size={18} /></button>
        <button className="result__btn" aria-label="Gör om"><Icon name="refresh" size={17} /></button>
        <button className="result__btn result__btn--primary" aria-label="Använd bild"><Icon name="check" size={18} /></button>
      </div>
      {main && <span className="ph__tag" style={{ top:12, left:12, bottom:'auto', background:'var(--ll-blue)' }}>Din favorit</span>}
    </div>
  );
}

function ImageStudio() {
  return (
    <div className="ll app app--lively" data-screen-label="Bildstudio">
      <Sidebar active="studio" />
      <div className="main">
        <ToolHeader title="Bildstudio">
          <span className="stage__priv" style={{ background:'var(--ll-blue-tint)', color:'var(--ll-blue-deep)' }}><Icon name="sparkle" size={14} />Dina bilder, dina rättigheter</span>
        </ToolHeader>

        <div className="content content--narrow" style={{ paddingTop:18 }}>
          {/* templates */}
          <SectionHeader title="1 · Välj en mall att börja från" sub="Du behöver bara en bra bild att utgå ifrån" seeAll={null} />
          <div className="tplrow">
            {TEMPLATES.map((t,i) => (
              <button key={i} className={`tpl ${t.on ? 'on' : ''}`}>
                <Photo tone={t.tone} clover person label={null} />
                <div className="tpl__cap"><div className="tpl__t">{t.t}</div><div className="tpl__m">{t.m}</div></div>
              </button>
            ))}
          </div>

          {/* prompt */}
          <div style={{ marginTop:28 }}>
            <SectionHeader title="2 · Beskriv hur du vill se ut" sub="Med egna ord — eller använd ett förslag" seeAll={null} />
            <div className="promptbar">
              <textarea rows={2} defaultValue="En vänlig och proffsig profilbild, neutral ljusblå bakgrund, jag i en enkel mörk skjorta som ler lugnt."></textarea>
              <hr className="divider" style={{ margin:'14px 0' }} />
              <div className="between">
                <div className="intake__quick" style={{ marginTop:0 }}>
                  {SUGGEST.map((s,i) => <Chip key={i} icon="sparkle">{s}</Chip>)}
                </div>
                <Button variant="primary" icon="sparkle">Skapa 4 bilder</Button>
              </div>
            </div>
          </div>

          {/* results */}
          <div style={{ marginTop:28 }}>
            <SectionHeader title="3 · Dina bilder" sub="Spara dem du gillar — gör om resten" />
            <div className="resultgrid">
              <StudioResult tone="ph--sky" main fav />
              <StudioResult tone="ph--coral" />
              <StudioResult tone="ph--green" />
              <StudioResult tone="ph--lilac" />
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:18, justifyContent:'center', color:'var(--ll-ink-soft)', fontSize:13.5 }}>
              <Clover size={18} color="#2B6CF0" />Inga rätt eller fel — prova dig fram tills en känns som du.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ImageStudio, StudioResult };
