// jobTriage — pure triage logic for the Jobbsök unit. NO React, NO DOM, NO fetch.
// Shared by the screen (tiers + evidence chips) and the layover (reject taxonomy).
//
// Reads the REAL stored-job shape (server/submodules/job-discovery + stage2-filter):
//   signal        : 'neutral' | 'low'          — 'low' iff any rule matched (flag-never-hide)
//   matchedRules  : [{ rule, term, stage? }]   — stage-1 rules (reject_title / bad_company /
//                   location_out / location_off_target) carry NO `stage`; only stage-2 body
//                   rules carry `stage: 2`, and their `rule` is the reject CODE.
// It NEVER reads the prototype's fixture fields (locFit / stage2) and NEVER fabricates a chip.

// The sign-off's 8-reason reject taxonomy. `code` is what the store keeps (and what the future
// rejection-learner eats); `label` is UI-only ({ sv, en }). OTHER requires a short free-text note.
export const REJECT_REASONS = [
  { code: 'LOCATION',      label: { sv: 'Fel ort / för långt',      en: 'Wrong location / too far' } },
  { code: 'SENIORITY',     label: { sv: 'Fel nivå (senioritet)',    en: 'Wrong seniority' } },
  { code: 'INDUSTRY',      label: { sv: 'Fel bransch',              en: 'Wrong industry' } },
  { code: 'COMPENSATION',  label: { sv: 'Ersättningen räcker inte', en: 'Compensation too low' } },
  { code: 'LANGUAGE',      label: { sv: 'Språkkrav passar inte',    en: 'Language requirement' } },
  { code: 'TOO_TECHNICAL', label: { sv: 'För tekniskt',             en: 'Too technical' } },
  { code: 'SALES_HEAVY',   label: { sv: 'För säljtungt',            en: 'Sales-heavy' } },
  { code: 'OTHER',         label: { sv: 'Annat …',                  en: 'Other …' }, note: true },
];

// Stage-2 signal code → chip label. Covers the REAL backend codes (seed-filter-set.cjs reason_codes:
// US_TIMEZONE, TOO_TECHNICAL, LANG_REQ, SALARY_LOW, SALES_HEAVY, INDUSTRY_FIT) plus the prototype's
// extra codes (kept for compatibility). An unmapped code falls back to the raw code — never fabricated.
export const STAGE2_LABELS = {
  US_TIMEZONE:   { sv: 'Kräver USA-tider', en: 'US hours required' },
  TOO_TECHNICAL: { sv: 'För tekniskt',     en: 'Too technical' },
  LANG_REQ:      { sv: 'Språkkrav',        en: 'Language requirement' },
  SALARY_LOW:    { sv: 'Låg ersättning',   en: 'Low compensation' },
  SALES_HEAVY:   { sv: 'Säljtungt',        en: 'Sales-heavy' },
  INDUSTRY_FIT:  { sv: 'Bransch-fit',      en: 'Industry fit' },
  // prototype extras (not emitted by the current backend; harmless, future-proof):
  TITLE_LEVEL:   { sv: 'Nivå under din',   en: 'Below your level' },
  LOW_COMP:      { sv: 'Låg ersättning',   en: 'Low compensation' },
  LANG_SV_ONLY:  { sv: 'Endast svenska',   en: 'Swedish-only' },
};

// Stage-1 location read → chip label + tone (verbatim from the design's ll-case.jsx). Exported
// for taxonomy completeness; the real backend expresses location fit as a matchedRule, so the
// current screen derives location chips from matchedRules, not from a locFit field.
export const LOCFIT = {
  in:    { sv: 'Ort: passar',  en: 'Location: fits',    tone: 'ok' },
  maybe: { sv: 'Ort: osäker',  en: 'Location: unsure',  tone: 'warn' },
  out:   { sv: 'Ort: utanför', en: 'Location: outside', tone: 'out' },
};

// Friendly labels for the known stage-1 rule codes; anything else falls back to the matched term.
const STAGE1_LABELS = {
  location_out:        { sv: 'Ort: utanför',       en: 'Location: outside' },
  location_off_target: { sv: 'Ort: osäker',        en: 'Location: unsure' },
  reject_title:        { sv: 'Titel-flagga',       en: 'Title flag' },
  bad_company:         { sv: 'Arbetsgivar-flagga', en: 'Employer flag' },
};

// Flagged = down-ranked, NEVER hidden. The store sets signal:'low' when any rule matched.
export function jobFlagged(job) {
  return !!job && job.signal === 'low';
}

// Split a job list into the four triage tiers: 'new' jobs split by flag; the rest by decision.
export function tierize(jobs = []) {
  const toReview = [];
  const flagged = [];
  const approved = [];
  const rejected = [];
  for (const job of jobs) {
    if (job.decision === 'approved') approved.push(job);
    else if (job.decision === 'rejected') rejected.push(job);
    else if (jobFlagged(job)) flagged.push(job);
    else toReview.push(job);
  }
  return { toReview, flagged, approved, rejected };
}

// Evidence chips = the pipeline's judgment, on every row (the operability principle). Derived
// ONLY from real matchedRules. A rule tagged `stage:2` → a stage-2 body-signal chip; any other
// rule (reject_title / bad_company / location_*, which carry no stage) → a stage-1 chip. Empty
// matchedRules → only the trailing source chip (no fabricated flags). Always ends with a source chip.
export function evidenceChips(job = {}, lang = 'sv') {
  const chips = [];
  for (const r of job.matchedRules || []) {
    if (r.stage === 2) {
      const label = STAGE2_LABELS[r.rule];
      chips.push({ tone: 'warn', stage: 2, label: (label && label[lang]) || r.rule });
    } else {
      const label = STAGE1_LABELS[r.rule];
      chips.push({ tone: 'warn', stage: 1, label: (label && label[lang]) || r.term || r.rule });
    }
  }
  const origin = job.origin === 'csv'
    ? { sv: 'Från din CSV', en: 'From your CSV' }
    : { sv: 'Hittad av Lilly', en: 'Found by Lilly' };
  chips.push({ tone: 'src', label: origin[lang] || origin.sv, source: job.source });
  return chips;
}
