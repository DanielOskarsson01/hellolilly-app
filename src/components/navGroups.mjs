// HelloLilly two-level navigation data (pure — no JSX, so it is unit-testable).
// 7 top-level groups with sub-items; the active group auto-opens. An item with
// `soon:true` is honest-disabled (rendered with the "Kommer" chip, not navigable).
export const NAV_GROUPS = [
  { id:'plan',     label:'Plan',      icon:'activity',  items: [
    { id:'home',           label:'Framstegsstöd' },
    { id:'activity',       label:'Min aktivitet' },
    { id:'activity-log',   label:'Aktivitetslogg (verifiering)' },
    { id:'calendar',       label:'Kalender' },
    { id:'uppgifter',      label:'Uppgifter' },
    { id:'paminnelser',    label:'Påminnelser' },
    { id:'arendevy-plan',  label:'Ärendevy' },
  ]},
  { id:'jobb',     label:'Jobb',      icon:'briefcase', items: [
    { id:'jobbsok',        label:'Jobbsök' },
    { id:'match',          label:'Matchanalys' },
    { id:'jobbradar',      label:'Jobbradar' },
    { id:'foretagslista',  label:'Företagslista' },
    { id:'sparade-jobb',   label:'Sparade jobb' },
  ]},
  { id:'ansok',    label:'Ansök',     icon:'pen',       items: [
    // Wave 1 (D17 nav split): the existing item opens the per-job TAILORED draft, so it is
    // renamed to tell the truth about the screen; a new honest-disabled "CV-byggaren" reserves
    // the slot for the D15 from-scratch builder (the established "Kommer" pattern).
    { id:'cv',             label:'Anpassad CV' },
    { id:'cv-byggaren',    label:'CV-byggaren', soon:true },
    { id:'letter',         label:'Personligt brev' },
    { id:'ansokningskoll',    label:'Ansökningskoll' },
    { id:'innan-du-skickar', label:'Innan du skickar' },
    { id:'review',            label:'Coachgranskning' },
    { id:'studio',         label:'Bildstöd' },
  ]},
  { id:'intervju', label:'Intervju',  icon:'mic',       items: [
    { id:'interview',            label:'Intervjuträning', badge:1 },
    { id:'intervjuforberedelse', label:'Intervjuförberedelse' },
    { id:'researchstod',         label:'Researchstöd' },
    { id:'ovningshistorik',      label:'Övningshistorik' },
  ]},
  { id:'natverk',  label:'Nätverk',   icon:'globe',     items: [
    { id:'linkedin',          label:'LinkedIn-stöd' },
    { id:'kontaktplan',       label:'Kontaktplan' },
    { id:'natverksmatch',     label:'Nätverksmatch' },
    { id:'spontanansokningar',label:'Spontanansökningar' },
    { id:'kontakter',         label:'Kontakter' },
  ]},
  { id:'stod',     label:'Stöd',      icon:'library',   items: [
    { id:'kunskapshubb', label:'Kunskapshubb' },
    { id:'community',    label:'Community' },
    { id:'library',      label:'Mallar' },
    { id:'videos',       label:'Videos' },
    { id:'guider',       label:'Guider' },
    { id:'kurser',       label:'Kurser' },
    { id:'diskussioner', label:'Diskussioner' },
  ]},
  { id:'mincoach', label:'Min coach', icon:'users',     items: [
    { id:'meddelanden',     label:'Meddelanden' },
    { id:'moten',           label:'Möten' },
    { id:'arendevy-coach',  label:'Ärendevy' },
    { id:'review',          label:'Coachgranskning' },
    { id:'delade-dokument', label:'Delade dokument' },
    { id:'nastasteg',       label:'Nästa steg' },
  ]},
];
