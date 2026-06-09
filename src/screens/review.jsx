import React from 'react';
import { Icon, Clover, Avatar, AvatarStack, Tag, Button, SectionHeader } from '../components/primitives.jsx';
import { Sidebar } from '../components/shell.jsx';
import { ToolHeader } from './cvActivity.jsx';

// HelloLilly — Multi-coach review (one document, several warm coach comments)

const COMMENTS = [
  { pin:1, name:'Sara Lind', role:'Din coach', av:'av-c3', time:'för 2 tim', body:'Vilken fin öppning, Amir! Den känns ärlig och varm. Jag skulle bara byta “jag tror att” mot “jag vet att” – du får stå stadigt i det du kan.', react:'12' },
  { pin:2, name:'Marcus Tylén', role:'Intervjucoach', av:'av-c2', time:'igår', body:'Här lyfter du gapet på precis rätt sätt – som något du lärt dig av, inte något att ursäkta. Starkt. Lägg gärna till en mening om vad tiden gav dig.', react:'8' },
  { pin:3, name:'Amira Khan', role:'CV-specialist', av:'av-c4', time:'igår', body:'Avslutningen är tydlig och artig. Du kan korta sista stycket lite så att din vilja syns ännu mer. Annars – redo att skickas!', react:'5' },
];

function ReviewComment({ c }) {
  return (
    <div className="cmt">
      <div className="cmt__head">
        <Avatar name={c.name} size="sm" tone={c.av} clover />
        <div className="cmt__who">
          <div className="cmt__name">{c.name}</div>
          <div className="cmt__meta">{c.role} · {c.time}</div>
        </div>
        <span className="cmt__pin">{c.pin}</span>
      </div>
      <p className="cmt__body">{c.body}</p>
      <div className="cmt__react">
        <button className="reactbtn"><Icon name="heart" size={14} />Håller med · {c.react}</button>
        <button className="reactbtn"><Icon name="letter" size={14} />Svara</button>
      </div>
    </div>
  );
}

function MultiCoachReview() {
  return (
    <div className="ll app app--lively" data-screen-label="Granskning">
      <Sidebar active="letter" />
      <div className="main">
        <ToolHeader title="Granskning · Personligt brev">
          <span className="coach__status" style={{ marginRight:6 }}><span className="dot" />3 coacher har tittat</span>
          <Button variant="secondary" size="sm" icon="download">Ladda ner</Button>
          <Button variant="primary" size="sm" icon="check">Klar att skicka</Button>
        </ToolHeader>

        <div className="content content--narrow" style={{ paddingTop:18, maxWidth:1120, margin:'0 auto', width:'100%' }}>
          <div className="card card--pad" style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20, background:'var(--ll-blue-tint)', border:'none' }}>
            <Clover size={28} color="#2B6CF0" />
            <p style={{ fontSize:14.5, color:'var(--ll-ink)' }}><b>Tre i ditt team har läst ditt brev och lämnat snälla, konkreta tips.</b> Ta det som känns rätt för dig – det är ditt brev, du bestämmer.</p>
            <span style={{ marginLeft:'auto' }}><AvatarStack people={[{name:'Sara Lind',tone:'av-c3'},{name:'Marcus Tylén',tone:'av-c2'},{name:'Amira Khan',tone:'av-c4'}]} size="sm" /></span>
          </div>

          <div className="review">
            {/* document */}
            <div className="revdoc">
              <span className="revpin" style={{ top:64, left:-13 }}>1</span>
              <span className="revpin" style={{ top:232, left:-13 }}>2</span>
              <span className="revpin" style={{ top:392, left:-13 }}>3</span>
              <div className="cvpaper" style={{ maxWidth:'none', boxShadow:'none', padding:'8px 6px', borderRadius:0 }}>
                <h2 style={{ fontSize:22 }}>Amir Hassan</h2>
                <div className="cv-role">Personligt brev · Lagermedarbetare, PostNord</div>
                <hr className="divider" style={{ margin:'18px 0' }} />
                <p style={{ lineHeight:1.7, color:'#3a4456', background:'var(--ll-amber-soft)', borderRadius:8, padding:'10px 12px' }}>Hej! Jag tror att jag skulle passa bra som lagermedarbetare hos er. Jag är en person som gillar ordning, tar ansvar och trivs när det är fart.</p>
                <p style={{ lineHeight:1.7, color:'#3a4456', marginTop:16 }}>Efter en period borta från arbetslivet kom jag tillbaka via en praktik på PostNord. Där lärde jag mig truck och fick beröm för min noggrannhet.</p>
                <p style={{ lineHeight:1.7, color:'#3a4456', marginTop:16, background:'var(--ll-green-soft)', borderRadius:8, padding:'10px 12px' }}>Tiden hemma var inte lätt, men den lärde mig tålamod och att uppskatta ett jobb att gå till. Idag är jag taggad och redo.</p>
                <p style={{ lineHeight:1.7, color:'#3a4456', marginTop:16, background:'var(--ll-blue-tint)', borderRadius:8, padding:'10px 12px' }}>Jag skulle bli väldigt glad över chansen att få visa vad jag går för. Tack för att ni läste – jag hoppas vi hörs!</p>
                <p style={{ marginTop:18, fontWeight:700, color:'#1c2435' }}>Vänliga hälsningar,<br/>Amir Hassan</p>
              </div>
            </div>

            {/* comments */}
            <div className="revcol">
              {COMMENTS.map((c,i) => <ReviewComment key={i} c={c} />)}
              <div className="cmt cmt--add">
                <div style={{ display:'flex', alignItems:'center', gap:11, marginBottom:11 }}>
                  <Avatar name="Amir Hassan" size="sm" tone="av-c1" />
                  <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:14 }}>Skriv tillbaka till ditt team</span>
                </div>
                <input placeholder="Tack Sara! Jag ändrar öppningen…" aria-label="Skriv en kommentar" />
                <div style={{ display:'flex', justifyContent:'flex-end', marginTop:11 }}>
                  <Button variant="primary" size="sm" icon="send">Skicka</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { MultiCoachReview, ReviewComment };
