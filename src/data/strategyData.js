const CASE_PROFILE = {
  person: 'Amir Hassan',
  coach: 'Sara Lind',
  municipality: 'Vasteras',
  goal: 'Lager och logistik, helst truck eller terminalarbete',
  blockers: ['Execution', 'Confidence', 'Relevance'],
  tone: 'Warm, concrete, one small next step at a time',
};

const FOUNDATION_TOOLS = [
  { id:'cv', ic:'cv', tint:'ic-blue', t:'CV Builder', sv:'CV-byggaren', phase:'Foundation', problem:'Execution', outcome:'Structured CV from guided intake' },
  { id:'letter', ic:'letter', tint:'ic-lilac', t:'Cover Letter Builder', sv:'Personligt brev', phase:'Foundation', problem:'Execution', outcome:'Role-specific letter with honest bridge paragraph' },
  { id:'match', ic:'target', tint:'ic-green', t:'Application Check', sv:'Ansokningskoll', phase:'Foundation', problem:'Relevance', outcome:'Fit score, gaps, and fixes before sending' },
  { id:'activity', ic:'activity', tint:'ic-coral', t:'Progress Support', sv:'Framstegsstod', phase:'Foundation', problem:'Confidence', outcome:'Tiny next actions and automatic activity log' },
  { id:'coach', ic:'users', tint:'ic-amber', t:'Case Record', sv:'Arendevy', phase:'Foundation', problem:'Consistency', outcome:'Shared picture for jobseeker and coach' },
  { id:'library', ic:'library', tint:'ic-blue', t:'Knowledge Hub', sv:'Kunskapshubb', phase:'Foundation', problem:'Silo', outcome:'Coach-approved resources surfaced in context' },
];

const NEXT_ACTIONS = [
  { id:'match', ic:'target', tint:'ic-green', t:'Kolla PostNord-ansokan', hint:'Pipeline hittade 3 luckor' },
  { id:'cv', ic:'cv', tint:'ic-blue', t:'Fyll luckan i CV:t', hint:'Handdator/WMS kan beskrivas' },
  { id:'letter', ic:'letter', tint:'ic-lilac', t:'Skapa brev fran analysen', hint:'Bridge-paragrafen ar klar' },
  { id:'interview', ic:'mic', tint:'ic-coral', t:'Ova en rollspecifik fraga', hint:'Byggd fran annonsen' },
  { id:'library', ic:'library', tint:'ic-blue', t:'Oppna ratt mall', hint:'Coach-approved, inte allmant rad' },
  { id:'coach', ic:'users', tint:'ic-amber', t:'Be Sara om nasta steg', hint:'Case record ar uppdaterat' },
];

const PIPELINE_RUN = {
  company: 'PostNord',
  role: 'Lagermedarbetare',
  location: 'Vasteras',
  score: 78,
  improvedScore: 92,
  confidence: 87,
  baseVariant: 'logistik',
  explicitRequirements: [
    { requirement:'Truckkort A1', priority:'must-have', status:'matched', source:'CV · Lagerpraktik PostNord' },
    { requirement:'Skiftarbete', priority:'must-have', status:'matched', source:'CV · tva skift under praktik' },
    { requirement:'God svenska', priority:'must-have', status:'matched', source:'CV · sprak' },
    { requirement:'Truckkort B', priority:'nice-to-have', status:'gap', source:'saknas' },
    { requirement:'WMS eller handdator', priority:'nice-to-have', status:'gap', source:'naraliggande erfarenhet' },
    { requirement:'Referens', priority:'must-have', status:'gap', source:'behov av coachstod' },
  ],
  selectedCvUpdates: [
    'Lyft PostNord-praktiken hogre upp i erfarenhet.',
    'Beskriv handdatorarbete som lageradministration i stallet for att lamna WMS tomt.',
    'Lagg truck A1 bland forsta kompetenserna.',
  ],
  coverLetterPlan: [
    'Oppna med palitlighet och terminalvana, inte generisk motivation.',
    'Visa att glappet ar hanterat genom praktik, aktivitet och ny riktning.',
    'Namnge truckkort B som nasta steg, utan att latsas att det redan finns.',
  ],
  gaps: [
    { t:'Truckkort B', m:'Annonsen onskar B-behorighet utover A1.', sug:'Lagg in fyradagars kurs i kalendern och namnge den som pagaende nasta steg.', cta:'Lagg in kurs' },
    { t:'WMS-system', m:'Annonsen namner SAP EWM eller liknande.', sug:'Beskriv handdator, inleverans och scanning fran praktiken. Det ar arligt naraliggande.', cta:'Lagg till i CV' },
    { t:'Referens', m:'Minst en referens behovs innan ansokan skickas.', sug:'Be Lena fran PostNord-praktiken. Sara kan skriva forsta meddelandet.', cta:'Skriv med Sara' },
  ],
};

const LIVE_JOBS = [
  { co:'PostNord', logo:'#2B6CF0', t:'Lagermedarbetare', city:'Vasteras', type:'Heltid', tags:['Truckkort A1','Skift','Pipeline klar'], match:92, when:'2 tim sedan', hot:true },
  { co:'DHL', logo:'#F39A1E', t:'Truckforare', city:'Eskilstuna', type:'Heltid', tags:['Truckkort B','Dag','Kursbehov'], match:88, when:'idag' },
  { co:'ICA', logo:'#2FA56A', t:'Orderplockare', city:'Vasteras', type:'Deltid', tags:['Helg','Ingen erf. kravs'], match:81, when:'igar' },
  { co:'M&S', logo:'#8E7CF0', t:'Terminalarbetare', city:'Enkoping', type:'Heltid', tags:['Kyla','Skift'], match:79, when:'2 dgr sedan' },
];

const CASE_RECORD = {
  status:'Foundation case',
  nextStep:'Fyll PostNord-luckorna och skapa ansokan fran analysen',
  activityCount: 13,
  activeDays: '5 av 7',
  coachNote:'Amir gor jobbet nar stegen ar sma och konkreta. Undvik stora osorterade uppgifter.',
  timeline: [
    { day:'Idag · tisdag 3 juni', pill:'5 aktiviteter', items:[
      { ic:'target', tint:'ic-green', t:'Application Check kord', m:'PostNord · 78% match · 3 luckor hittade', time:'09:22', auto:true },
      { ic:'briefcase', tint:'ic-blue', t:'Ansokan forberedd', m:'Lagermedarbetare · PostNord, Vasteras', time:'09:14', auto:true },
      { ic:'mic', tint:'ic-coral', t:'Intervjutraning genomford', m:'3 rollspecifika fragor fran annonsen', time:'08:40', auto:true },
      { ic:'cv', tint:'ic-green', t:'CV uppdaterat', m:'Truck A1, scanning och PostNord-praktik lyftes fram', time:'08:22', auto:true },
      { ic:'letter', tint:'ic-lilac', t:'Brevutkast skapat', m:'Bridge for glapp och truckkort B', time:'igar 16:05', auto:true },
    ]},
    { day:'Mandag 2 juni', pill:'3 aktiviteter', items:[
      { ic:'users', tint:'ic-blue', t:'Coachmote med Sara', m:'Valde logistik som huvudriktning', time:'13:00', auto:false },
      { ic:'grad', tint:'ic-amber', t:'Seminarium', m:'Lugn infor intervjun · 30 min', time:'10:00', auto:true },
      { ic:'briefcase', tint:'ic-blue', t:'Ansokan skickad', m:'Truckforare · DHL, Eskilstuna', time:'09:30', auto:true },
    ]},
  ],
};

const KNOWLEDGE_RESOURCES = [
  { tone:'ph--sky', type:['Mall','tag--ghost'], goal:['CV','tag'], t:'CV-rad: handdator och scanning', m:'Coach-approved formulering for lagerarbete nar WMS saknas men naraliggande erfarenhet finns.', by:'Sara Lind', role:'Coach', uses:'842', av:'av-c3' },
  { tone:'ph--coral', type:['Prompt','tag--lilac'], goal:['Brev','tag'], t:'Bridge: glapp utan ursakt', m:'En trygg struktur for att namna ett glapp och direkt visa vad som hant sedan dess.', by:'Marcus T.', role:'Coach', uses:'1,2k', av:'av-c2' },
  { tone:'ph--green', type:['Tips','tag--green'], goal:['Intervju','tag'], t:'Svarsmall: skift och tempo', m:'Konkreta exempel for terminal, lager och logistikintervjuer.', by:'Amira K.', role:'Coach', uses:'613', av:'av-c4' },
  { tone:'ph--lilac', type:['Guide','tag--amber'], goal:['Ansokan','tag'], t:'Application Check: sa laser du luckorna', m:'Forklarar matchpoang, krav, gaps och varfor ett lagre score inte betyder nej.', by:'Team Lilly', role:'HelloLilly', uses:'455', av:'av-c1' },
  { tone:'ph--sky', type:['Mall','tag--ghost'], goal:['Kontakt','tag'], t:'Be om referens fran handledare', m:'Kort meddelande till tidigare handledare, med varm och professionell ton.', by:'Sara Lind', role:'Coach', uses:'729', av:'av-c3' },
  { tone:'ph--coral', type:['Tips','tag--green'], goal:['Motivation','tag--coral'], t:'Nar laptopen inte oppnas', m:'Tre mikrosteg for dagar nar execution ar den verkliga blockeringen.', by:'Johan P.', role:'Deltagare', uses:'980', av:'av-c5' },
];

const DISCUSSIONS = [
  { who:'Linnea', tone:'av-c2', t:'Hur forklarar man glapp utan att be om ursakt?', m:'24 svar · kopplat till brev', hot:true },
  { who:'Omar', tone:'av-c1', t:'Nagon som tog truckkort B mitt i sokperioden?', m:'12 svar · relevant for PostNord' },
  { who:'Eva', tone:'av-c4', t:'Hur skriver man om scanning om man inte kan SAP?', m:'8 svar · nytt' },
];

const LEARNING_RESOURCES = [
  { ic:'target', tint:'ic-green', t:'Forsta Application Check', m:'Las match, krav och luckor utan att kanna dig bedomd.', min:'5 min' },
  { ic:'cv', tint:'ic-blue', t:'Skriv resultat, inte uppgifter', m:'Gor lagererfarenhet tydlig och konkret.', min:'6 min' },
  { ic:'letter', tint:'ic-lilac', t:'Bridge-paragrafen', m:'Sann, lugn och stark nar nagot saknas.', min:'4 min' },
  { ic:'mic', tint:'ic-coral', t:'Ova svaret om tempo', m:'En fraga fran PostNord-annonsen.', min:'3 min' },
  { ic:'users', tint:'ic-amber', t:'Nar behover Sara hoppa in?', m:'Skillnaden mellan verktygsstod och coachstod.', min:'7 min' },
];

const COMMUNITY_WINS = [
  { nm:'Linnea S.', co:'→ ICA Maxi', tone:'av-c2' },
  { nm:'Omar A.', co:'→ DHL', tone:'av-c1' },
  { nm:'Sara K.', co:'→ Coop', tone:'av-c4' },
  { nm:'Erik N.', co:'→ PostNord', tone:'av-c3' },
];

const OUTCOME_METRICS = [
  { label:'Foundation tools live', value:'6', hint:'CV, brev, check, aktivitet, arendevy, hubb' },
  { label:'Automatic case events', value:'13', hint:'Rapport som biprodukt' },
  { label:'PostNord match after fixes', value:'92%', hint:'Fran 78% nar luckorna fylls' },
];

const TOOL_SPECS = {
  home: {
    phase:'Foundation', problem:'Confidence + execution', title:'Progress Support', sv:'Framstegsstod',
    why:'Everything starts with one calm next action instead of a dense dashboard.',
    does:['Suggests the smallest useful step', 'Shows visible progress', 'Keeps the person moving between coach meetings'],
    inputs:['Case record', 'Activity history', 'Current blockers'], outputs:['Next step', 'Motivation cue', 'Activity event'],
  },
  cv: {
    phase:'Foundation', problem:'Execution', title:'CV Builder', sv:'CV-byggare',
    why:'Gets the person past the blank page and creates a usable first CV.',
    does:['Asks one question at a time', 'Improves wording, structure and keywords', 'Creates versions for different jobs'],
    inputs:['Experience', 'Education', 'Strengths', 'Job analysis'], outputs:['ATS-safe CV', 'Suggested missing facts', 'CV version history'],
  },
  letter: {
    phase:'Foundation', problem:'Execution + confidence', title:'Cover Letter Builder', sv:'Personligt brev',
    why:'Writes relevant letters from the job advert, CV and the person’s situation.',
    does:['Handles gaps, age, career change or language concerns', 'Keeps the tone honest', 'Helps the person dare to send'],
    inputs:['Job advert', 'CV', 'Known concerns', 'Match analysis'], outputs:['Letter draft', 'Bridge paragraph', 'Unsupported claims checklist'],
  },
  match: {
    phase:'Foundation/Matching', problem:'Relevance', title:'Application Check / Match Analysis', sv:'Ansokningskoll / Matchanalys',
    why:'Compares the application with the job advert and explains what to fix.',
    does:['Shows matches and missing requirements', 'Suggests CV and letter improvements', 'Turns each job into a learning loop'],
    inputs:['Job advert', 'CV', 'Cover letter', 'Case record'], outputs:['Fit score', 'Gap list', 'Action plan before sending'],
  },
  ansokningskoll: {
    phase:'Foundation', problem:'Relevance', title:'Application Check', sv:'Ansokningskoll',
    why:'A practical fit check before sending. Not a promise about an employer or ATS.',
    does:['Finds missing keywords', 'Flags weakly answered requirements', 'Shows what to improve before sending'],
    inputs:['Job advert', 'CV', 'Cover letter'], outputs:['Checklist', 'Gap fixes', 'Send readiness'],
  },
  activity: {
    phase:'Foundation', problem:'Confidence + reporting', title:'Progress Support / My Activity', sv:'Framstegsstod / Min aktivitet',
    why:'Logs real work automatically and makes reporting supportive instead of stressful.',
    does:['Breaks tasks into smaller steps', 'Logs activity as a byproduct', 'Creates overview for person and coach'],
    inputs:['Tool usage', 'Coach meetings', 'Applications', 'Practice'], outputs:['Activity timeline', 'Report export', 'Weekly progress'],
  },
  library: {
    phase:'Foundation', problem:'Silo', title:'Knowledge Hub', sv:'Kunskapshubb',
    why:'Turns templates, links, guides and coach experience into active help.',
    does:['Coach-approves resources', 'Lets the assistant explain each item', 'Surfaces resources in the right context'],
    inputs:['Coach material', 'User tips', 'Cases', 'Discussions'], outputs:['Approved resource', 'Summary', 'Tool-linked recommendation'],
  },
  kunskapshubb: {
    phase:'Foundation', problem:'Silo', title:'Knowledge Hub', sv:'Kunskapshubb',
    why:'The same library concept, but organised by situation rather than category.',
    does:['Quality-assures shared material', 'Connects resources to cases', 'Keeps knowledge after coaches move on'],
    inputs:['Templates', 'Guides', 'Videos', 'FAQs'], outputs:['Contextual help', 'Coach-approved answer', 'Reusable organisation memory'],
  },
  interview: {
    phase:'Matching', problem:'Confidence', title:'Interview Trainer', sv:'Intervjutraning',
    why:'A realistic simulation, not just a static list of common questions.',
    does:['Uses the uploaded job description', 'Adapts by role, company, industry and CV', 'Asks follow-up questions based on answers'],
    inputs:['Job description', 'CV', 'Company research', 'Previous answers'], outputs:['Likely interview questions', 'Gentle feedback', 'Practice history'],
  },
  intervjuforberedelse: {
    phase:'Matching', problem:'Confidence + relevance', title:'Interview Prep', sv:'Intervjuforberedelse',
    why:'Connects research, job advert, CV and interview training before a real meeting.',
    does:['Summarises company and role', 'Chooses CV examples to use', 'Flags risks to prepare for'],
    inputs:['Job advert', 'Company research', 'CV', 'Match analysis'], outputs:['Prep brief', 'Questions to ask', 'Practice plan'],
  },
  researchstod: {
    phase:'Matching', problem:'Relevance', title:'Research Helper', sv:'Researchstod',
    why:'Helps the person research correctly, relevantly and in the right amount.',
    does:['Summarises company, industry and role', 'Separates signal from noise', 'Creates interview and outreach angles'],
    inputs:['Company', 'Role', 'News', 'Job advert'], outputs:['Research brief', 'Useful facts', 'Contact angles'],
  },
  jobbsok: {
    phase:'Matching', problem:'Relevance', title:'Job Search', sv:'Jobbsok',
    why:'Gathers jobs from multiple public sources and improves search terms over time.',
    does:['Lets the person choose sources', 'Learns from saves, rejects and clicks', 'Sorts by relevance, match, location and role'],
    inputs:['Search terms', 'Location', 'CV profile', 'User feedback'], outputs:['Matched jobs', 'Better search terms', 'Saved roles'],
  },
  jobbradar: {
    phase:'Market', problem:'Hidden opportunities', title:'Job Radar', sv:'Jobbradar',
    why:'Finds opportunities before they appear as ordinary job adverts.',
    does:['Monitors hiring signals and public news', 'Finds growing companies', 'Turns market signals into action paths'],
    inputs:['News', 'Company pages', 'Press releases', 'Tender/investment signals'], outputs:['Opportunity signal', 'Company action path', 'Blind application angle'],
  },
  foretagslista: {
    phase:'Network', problem:'Direction', title:'Company List', sv:'Foretagslista',
    why:'Builds a wish list of employers suggested by CV, geography, interests and market signals.',
    does:['Explains why a company fits', 'Suggests roles and contacts', 'Links to Job Radar and blind applications'],
    inputs:['CV', 'Location', 'Industry interest', 'Radar signals'], outputs:['Company shortlist', 'Role ideas', 'Contact plan'],
  },
  spontanansokningar: {
    phase:'Network', problem:'Hidden opportunities', title:'Blind Applications', sv:'Spontanansokningar',
    why:'Helps contact companies even when no role is published.',
    does:['Creates fewer but better attempts', 'Plans contact and follow-up', 'Keeps communication natural'],
    inputs:['Company research', 'Contact person', 'CV angle'], outputs:['Message draft', 'Follow-up plan', 'Logged outreach'],
  },
  linkedin: {
    phase:'Network', problem:'Barrier + confidence', title:'LinkedIn Helper', sv:'LinkedIn-stod',
    why:'A safety tool for people who fear writing the wrong thing publicly.',
    does:['Checks profile, messages and posts', 'Improves tone and clarity', 'Creates the feeling that the message is reasonable'],
    inputs:['Draft text', 'Recipient', 'Industry context'], outputs:['Safer message', 'Tone check', 'Posting confidence'],
  },
  kontaktplan: {
    phase:'Network', problem:'Social rules', title:'Outreach Plan', sv:'Kontaktplan',
    why:'Plans who to contact, why, when and how to follow up.',
    does:['Orders contacts', 'Suggests message purpose', 'Avoids pushy or unclear outreach'],
    inputs:['Company list', 'Network match', 'LinkedIn draft'], outputs:['Contact sequence', 'Message plan', 'Follow-up reminders'],
  },
  natverksmatch: {
    phase:'Network', problem:'Access', title:'Network Match', sv:'Natverksmatch',
    why:'Shows whether there is a useful connection to a company or industry.',
    does:['Finds coach knowledge', 'Finds consented peer experience', 'Surfaces relevant contacts and templates'],
    inputs:['Target company', 'Coach profiles', 'Consented cases'], outputs:['Connection map', 'Warm intro option', 'Relevant coach'],
  },
  review: {
    phase:'Network/Coach', problem:'Confidence + expertise', title:'Coach Review', sv:'Coachgranskning',
    why:'Gets several supportive coach perspectives without changing the main coach relationship.',
    does:['Reviews CV, letter, application, LinkedIn, image or strategy', 'Keeps feedback constructive', 'Adds specialist knowledge'],
    inputs:['Document or profile', 'Question', 'Case context'], outputs:['Coach comments', 'Second opinion', 'Revision suggestions'],
  },
  studio: {
    phase:'Execution', problem:'Barrier', title:'Image Studio', sv:'Bildstod',
    why:'Helps people appear clear, professional and confident without creating a false version of them.',
    does:['Uses safe templates', 'Supports profile and CV images', 'Keeps visual presentation simple'],
    inputs:['Photo', 'Template choice', 'Use case'], outputs:['Profile image', 'LinkedIn image', 'Visual confidence'],
  },
  community: {
    phase:'Support', problem:'Confidence + belonging', title:'Community', sv:'Community',
    why:'Brings peers, accountability and proof that people do get through.',
    does:['Lets people ask and answer', 'Shares wins and practical tips', 'Creates structure and belonging'],
    inputs:['Questions', 'Wins', 'Tips', 'Discussions'], outputs:['Peer support', 'Motivation', 'Shared know-how'],
  },
  calendar: {
    phase:'Delivery', problem:'Execution', title:'Calendar', sv:'Kalender',
    why:'Keeps meetings, deadlines, practice, courses and reminders in one calm place.',
    does:['Schedules coach calls and tasks', 'Adds course and follow-up reminders', 'Keeps next steps visible'],
    inputs:['Case record', 'Coach availability', 'Action plan'], outputs:['Week plan', 'Reminder', 'Booked next step'],
  },
  'arendevy-plan': {
    phase:'Foundation/Coach', problem:'Consistency', title:'Case Record', sv:'Arendevy',
    why:'One living shared picture instead of a journey scattered across meetings, files and memory.',
    does:['Shows goals, blockers, CV versions, applications and next steps', 'Works for both jobseeker and coach', 'Updates from tool activity'],
    inputs:['Intake', 'Notes', 'Activity', 'Documents'], outputs:['Shared case view', 'Next step', 'Documentation'],
  },
};

const COACH_TOOL_SPECS = {
  'c-arendevy': TOOL_SPECS['arendevy-plan'],
  'c-motesstod': {
    phase:'Market', problem:'Coach support', title:'Live Support', sv:'Motesstod',
    why:'Helps the coach during and after meetings with consent, summaries and suggested next steps.',
    does:['Records and transcribes with consent', 'Suggests follow-up questions', 'Updates the Case Record after the meeting'],
    inputs:['Meeting transcript', 'Case record', 'Knowledge hub'], outputs:['Meeting summary', 'Next steps', 'Relevant resources'],
  },
  'c-hitta-coach': {
    phase:'Network', problem:'Silo', title:'Coach Network', sv:'Coachnatverk',
    why:'Makes HelloLilly’s internal competence searchable across offices and specialties.',
    does:['Finds specialist coaches', 'Suggests second opinions', 'Keeps expertise available beyond one person'],
    inputs:['Coach profiles', 'Industries', 'Barrier expertise'], outputs:['Specialist match', 'Second opinion request', 'Knowledge connection'],
  },
  'c-kunskapshubb': TOOL_SPECS.kunskapshubb,
  'c-feedback': {
    phase:'Market', problem:'Learning', title:'Feedback Loop', sv:'Aterkoppling',
    why:'Lets HelloLilly improve from real needs, stuck points and coach/user suggestions.',
    does:['Collects polls and comments', 'Shows repeated blockers', 'Feeds product and knowledge improvements'],
    inputs:['Feedback', 'Usage signals', 'Questions'], outputs:['Improvement queue', 'Common blockers', 'New resource needs'],
  },
  'c-vad-fungerar': {
    phase:'Learning', problem:'Organisation memory', title:'Knowledge Hive', sv:'Kunskapssystem',
    why:'The long-term core where cases, resources, meetings and outcomes accumulate into intelligence.',
    does:['Learns which support helps which people', 'Keeps coaching expertise durable', 'Makes the connected system hard to copy'],
    inputs:['Cases', 'Resources', 'Applications', 'Outcomes'], outputs:['Reusable patterns', 'Better recommendations', 'Organisation IP'],
  },
  'c-utfall': {
    phase:'Learning', problem:'Outcomes', title:'Outcome Engine', sv:'Resultatmotor',
    why:'Connects actions to results so HelloLilly can learn what actually leads to jobs or education.',
    does:['Connects activities to interviews and outcomes', 'Shows which interventions create momentum', 'Improves advice over time'],
    inputs:['Activity logs', 'Applications', 'Interviews', 'Outcomes'], outputs:['Outcome insight', 'Effective support paths', 'Quality ranking evidence'],
  },
};

export {
  CASE_PROFILE,
  FOUNDATION_TOOLS,
  NEXT_ACTIONS,
  PIPELINE_RUN,
  LIVE_JOBS,
  CASE_RECORD,
  KNOWLEDGE_RESOURCES,
  DISCUSSIONS,
  LEARNING_RESOURCES,
  COMMUNITY_WINS,
  OUTCOME_METRICS,
  TOOL_SPECS,
  COACH_TOOL_SPECS,
};
