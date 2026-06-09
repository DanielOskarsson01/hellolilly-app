import React from 'react';
import { Icon, Clover, Avatar, Button } from './primitives.jsx';
import { PIPELINE_RUN, KNOWLEDGE_RESOURCES, CASE_RECORD } from '../data/strategyData.js';

// HelloLilly — "Helpful Now" right-hand support column
// Compact contextual helper. Placeholder click behaviour for now —
// this lays the structural ground for a future overlay/layover.

const HELP_DEFAULT = [
  { kind:'Tips',       title:'Nästa lilla steg',                   why: CASE_RECORD.nextStep },
  { kind:'Mall',       title: KNOWLEDGE_RESOURCES[0].t,            why:'Coach-approved och kopplad till ditt case' },
  { kind:'Coach',      title:'Fråga Sara om pipeline-luckorna',    why:`${PIPELINE_RUN.gaps.length} saker att fixa innan ansökan` },
  { kind:'Analys',     title:`${PIPELINE_RUN.company}: ${PIPELINE_RUN.score}% → ${PIPELINE_RUN.improvedScore}%`, why:'Matchen blir bättre när luckorna fylls' },
];

const HELP_BY_ROUTE = {
  home: [
    { id:'cv-gap-video', kind:'Video', title:'Skriv ett CV som tål en lucka', why:'Sara · 4 min - används i PostNord-caset', rich:true },
    { kind:'Analys',     title:`Fixa ${PIPELINE_RUN.gaps[1].t}`,   why:PIPELINE_RUN.gaps[1].sug },
    { kind:'Coach',      title:'Be Sara om referensmeddelandet',   why:'En mänsklig insats, inte bara verktyg' },
    { kind:'Mall',       title:KNOWLEDGE_RESOURCES[4].t,           why:'Direkt kopplad till referensluckan' },
  ],
  cv: [
    { id:'cv-gap-video', kind:'Video', title:'Skriv ett CV som tål en lucka', why:'Sara · 4 min — värt det', rich:true },
    { kind:'Tips',       title:KNOWLEDGE_RESOURCES[0].t,           why:'Täcker WMS-luckan utan att överdriva' },
    { kind:'Mall',       title:'PostNord-praktik som CV-rad',      why:'Byggd från dagens analys' },
    { kind:'Coach',      title:'Fråga Sara om formuleringen',      why:'När sanningsgränsen känns svår' },
    { kind:'Analys',     title:'Valda CV-uppdateringar',           why:PIPELINE_RUN.selectedCvUpdates[0] },
  ],
  letter: [
    { kind:'Tips',       title:'Vänd oron till en styrka',         why:'En mening kan ändra allt' },
    { kind:'Mall',       title:'Brev för byte av bransch',         why:'Tre korta stycken' },
    { kind:'Video',      title:'Vad fastnar i ett brev?',          why:'Rekryterare berättar' },
    { kind:'Coach',      title:'Be Sara läsa innan du skickar',    why:'Hon svarar oftast samma dag' },
  ],
  interview: [
    { kind:'Tips',       title:'Andas innan du svarar',            why:'Två sekunder är okej' },
    { kind:'Övning',     title:'Tre vanliga frågor — öva tyst',    why:'Inga mikrofoner, ingen press' },
    { kind:'Video',      title:'Lugn inför intervjun',             why:'Sara · 5 min' },
    { kind:'Coach',      title:'Boka rollspel med Sara',           why:'Vi tar det varsamt' },
    { kind:'Diskussion', title:'Vad hjälpte dig att slappna av?',  why:'Andra jobbsökares knep' },
  ],
  match: [
    { kind:'Analys',     title:'Explicit requirements',            why:`${PIPELINE_RUN.explicitRequirements.length} krav lästa ur annonsen` },
    { kind:'Lucka',      title:PIPELINE_RUN.gaps[0].t,             why:PIPELINE_RUN.gaps[0].sug },
    { kind:'Lucka',      title:PIPELINE_RUN.gaps[1].t,             why:PIPELINE_RUN.gaps[1].sug },
    { kind:'Coach',      title:PIPELINE_RUN.gaps[2].t,             why:PIPELINE_RUN.gaps[2].sug },
  ],
  calendar: [
    { kind:'Tips',       title:'Boka in pauser, inte bara möten',  why:'Återhämtning räknas också' },
    { kind:'Coach',      title:'Boka kort avstämning',             why:'Sara har lediga tider i veckan' },
    { kind:'Diskussion', title:'Hur strukturerar du veckan?',      why:'Andra delar sina rutiner' },
  ],
  activity: [
    { kind:'Tips',       title:'Rapporten skriver sig själv',      why:`${CASE_RECORD.activityCount} händelser är redan loggade` },
    { kind:'Analys',     title:'Application Check räknas också',   why:'Det visar verkligt arbete, inte bara klick' },
    { kind:'Coach',      title:'Fråga Sara om månadsrapporten',    why:'Hon ser samma case record' },
  ],
  community: [
    { kind:'Tips',       title:'Ett vänligt svar = 5 poäng',       why:'Liten gest, stor effekt' },
    { kind:'Diskussion', title:'Veckans fråga: första intrycket?', why:'Hjälper någon annan idag' },
    { kind:'Coach',      title:'Tipsa Sara om en bra tråd',        why:'Hon lyfter de bästa' },
  ],
  library: [
    { kind:'Mall',       title:'CV — erfarenhetssektion',          why:'Färdig att kopiera' },
    { kind:'Mall',       title:'Personligt brev — byte av bransch',why:'Tre korta stycken' },
    { kind:'Video',      title:'Så läser en rekryterare ett CV',   why:'3 min · värt det' },
    { kind:'Tips',       title:'Spara dina favoriter',             why:'Hittar dem snabbare nästa gång' },
  ],
  review: [
    { kind:'Tips',       title:'Be om en sak i taget',             why:'Lättare för coachen att svara' },
    { kind:'Coach',      title:'Boka feedback-samtal',             why:'15 min räcker oftast' },
    { kind:'Video',      title:'Att ta emot återkoppling',         why:'En mjuk genomgång · 4 min' },
  ],
  studio: [
    { kind:'Tips',       title:'Naturligt ljus från sidan',        why:'Snällaste fotot för de flesta' },
    { kind:'Mall',       title:'LinkedIn-mått · 400×400',          why:'Klart att exportera' },
    { kind:'Video',      title:'Vad signalerar en profilbild?',    why:'Korta exempel · 2 min' },
  ],
  coach: [
    { kind:'Case',       title:'Amirs nästa steg',                 why:CASE_RECORD.nextStep },
    { kind:'Analys',     title:`${PIPELINE_RUN.company}: gap review`, why:`${PIPELINE_RUN.gaps.length} luckor behöver mänsklig prioritering` },
    { kind:'Kunskap',    title:'Kunskap som lever kvar',           why:'Coachens expertis blir organisationsminne' },
  ],
};

function getHelpRoute() {
  if (typeof window === 'undefined') return 'home';
  const r = (location.hash || '#home').slice(1);
  return HELP_BY_ROUTE[r] ? r : 'home';
}

function HelpfulNow() {
  const [route, setRoute] = React.useState(getHelpRoute());
  React.useEffect(() => {
    const onHash = () => setRoute(getHelpRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const items = HELP_BY_ROUTE[route] || HELP_DEFAULT;
  const onPick = (it) => {
    // Dispatch a global event — HelpfulLayover listens and opens itself.
    // For "rich" items we have full content; others fall back to a placeholder card.
    window.dispatchEvent(new CustomEvent('ll:helpful:open', { detail: it }));
    document.body.classList.remove('help-open');
  };

  const close = () => document.body.classList.remove('help-open');

  return (
    <aside className="helpful" aria-label="Stöd och kopplingar">
      <button className="helpful__close" aria-label="Stäng" onClick={close}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
      </button>
      <div className="helpful__head">
        <Clover size={18} color="#2B6CF0" />
        <h2>Helpful Now</h2>
      </div>
      <p className="helpful__sub">Små saker som kan hjälpa just nu — välj fritt, eller låt dem vara.</p>

      <div className="helpful__group">
        <div className="helpful__group-label">För det du gör nu</div>
        {items.map((it, i) => {
          const kindClass = it.kind.toLowerCase().replace('ö','o');
          return (
            <button key={i} className="helpitem" onClick={() => onPick(it)}>
              <span className={`helpitem__kind helpitem__kind--${kindClass}`}>{it.kind}</span>
              <div className="helpitem__title">{it.title}</div>
              {it.why && <div className="helpitem__why">{it.why}</div>}
            </button>
          );
        })}
      </div>

      <div className="helpful__foot">
        <Clover size={16} color="#2FA56A" />
        <span><strong>Sara finns där.</strong> Du behöver inte klara allt själv.</span>
      </div>
    </aside>
  );
}

export { HelpfulNow, HELP_BY_ROUTE, HELP_DEFAULT };
