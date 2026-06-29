'use strict';

// Researcher (A1). Standalone-runnable: uses only injected `tools`.
//   Full research:  input = { caseId }
//   Reader drill:   input = { caseId, drill: { dossierKey, query } }
//
// Each front = a Perplexity grounding pass (real facts + sources) -> an Opus synthesis
// into the contract dossier shape. Fronts run in parallel. Niche depth is the quality bar.

const ANTI_CLICHE =
  'Write plainly, concretely, specifically. Do NOT use marketing or AI-fingerprint words ' +
  '(leveraged, robust, dynamic, cutting-edge, game-changer, synergy, passionate, excited, ' +
  'thrilled, elevate, unlock, delve, tapestry, testament to, proven track record). State facts.';

const FRONTS = [
  {
    key: 'company',
    query: (m) =>
      `Company research on "${m.company}". Origin and history (why it was founded, by whom, the ` +
      `problem it set out to solve), mission, what it is visibly trying to achieve, funding, size/` +
      `footprint, recent news, and any red flags. Give sources.`,
    system:
      'You research a company to prepare a candidate for an interview. Tell the story origin-to-' +
      'ambition: why it exists, the founding problem, the mission, what they are visibly trying to ' +
      'achieve. Funding/footprint/news/red-flags are supporting facts UNDER that story, not the ' +
      'headline. ' + ANTI_CLICHE,
    instruct: '4-7 paragraphs, origin-to-ambition first, supporting facts after.',
  },
  {
    key: 'product',
    query: (m) =>
      `The specific product a "${m.role || 'new hire'}" at "${m.company}" would work on: its ` +
      `history, current state, likely future, how it works, USPs, closest competitors, and open ` +
      `challenges. If the company has several products, focus on the most relevant one. Give sources.`,
    system:
      'You research the product the candidate would actually work on. History -> current state -> ' +
      'likely future; how it works, USPs, closest competitors, open challenges. Other products get ' +
      'one orientation sentence at most. ' + ANTI_CLICHE,
    instruct: '4-6 paragraphs centred on the one product that matters for this role.',
  },
  {
    key: 'people',
    query: (m) =>
      `People at "${m.company}" relevant to a "${m.role || 'new hire'}" interview` +
      (m.interviewers && m.interviewers.length ? `, especially the interviewer(s): ${m.interviewers.join(', ')}` : '') +
      `. Who they are, their role, relevant background. Then likely colleagues, reports, and ` +
      `dependencies for this role. Give sources.`,
    system:
      'You research the people the candidate will meet and work with. Interviewer(s) first (who ' +
      'they are, role, relevant background), then likely colleagues/reports/dependencies. ' + ANTI_CLICHE,
    instruct: 'Interviewer(s) first, one short paragraph each, then the working circle.',
  },
  {
    key: 'niche',
    query: (m) =>
      `The exact market niche of "${m.company}" for a "${m.role || 'new hire'}". Three levels: ` +
      `(1) the broad industry, (2) the vertical, (3) the EXACT niche — the specific competitors ` +
      `that actually matter, the vocabulary insiders use daily, the regulatory and integration ` +
      `reality, and the pressures of the next 12 months in that exact corner. Give sources.`,
    system:
      'You research the niche, weighted to the bottom. Research depth is inversely proportional to ' +
      'breadth: ONE orienting paragraph on the industry, a little context on the vertical, then real ' +
      'DEPTH on the exact niche — the competitors that actually matter, the daily vocabulary, the ' +
      'regulatory/integration reality, the 12-month pressures. Shallow industry-level output is a ' +
      'failure. ' + ANTI_CLICHE,
    instruct:
      'Exactly this order: paragraph 1 = industry (one orienting paragraph), paragraph 2 = vertical ' +
      '(context), paragraphs 3+ = the exact niche, where most of the depth goes.',
  },
];

function normalizeCitations(citations) {
  return (citations || [])
    .map((c) => (typeof c === 'string' ? { url: c } : { url: c.url, title: c.title }))
    .filter((c) => c.url);
}

function normalizeDossier(key, result, citations, tools) {
  const paragraphs = Array.isArray(result && result.paragraphs) ? result.paragraphs : [];
  return {
    title: (result && result.title) || key.charAt(0).toUpperCase() + key.slice(1),
    summary: (result && result.summary) || '',
    sources: normalizeCitations(citations),
    paragraphs: paragraphs
      .map((p) => ({ id: tools.ids.mintId('paragraph'), text: typeof p === 'string' ? p : (p && p.text) || '' }))
      .filter((p) => p.text),
  };
}

async function researchFront(front, meta, options, tools) {
  const grounding = await tools.search.grounded({ query: front.query(meta), maxTokens: 1300 });
  const result = await tools.llm.completeJSON({
    system: front.system,
    model: options.model,
    maxTokens: 4096,
    prompt:
      `Company: ${meta.company}\nRole: ${meta.role || 'unknown'}\n` +
      (meta.sourceInput ? `Source input (ad/mail/name):\n${meta.sourceInput}\n` : '') +
      `\nGrounded research with sources:\n${grounding.text}\n\n` +
      `Write the ${front.key.toUpperCase()} dossier as JSON: ` +
      `{ "summary": "<2-3 sentence card-front>", "paragraphs": [ { "text": "<paragraph>" } ] }. ` +
      `${front.instruct} Return JSON only.`,
  });
  return normalizeDossier(front.key, result, grounding.citations, tools);
}

// Write dossiers through the store gate; on a writing-rule violation, ask Opus to
// rephrase the offending phrases once, then retry (protects the expensive run).
async function writeDossiersGated(caseId, dossiers, options, tools) {
  try {
    tools.store.writePart(caseId, 'dossiers', dossiers);
  } catch (err) {
    if (err.name !== 'WritingRuleError' || !err.violations) throw err;
    if (tools.logger) tools.logger.warn(`writing-rule hit, rephrasing: ${err.violations.map((v) => v.phrase).join(', ')}`);
    const banned = [...new Set(err.violations.map((v) => v.phrase))];
    const cleaned = await tools.llm.completeJSON({
      system: 'You rephrase text to remove specific words while preserving meaning and facts.',
      model: options.model,
      maxTokens: 6000,
      prompt:
        `Remove every occurrence of these exact words/phrases (and their inflections) from the ` +
        `JSON below, rephrasing naturally and keeping all facts and structure:\n${banned.join(', ')}\n\n` +
        `${JSON.stringify(dossiers)}\n\nReturn the same JSON shape, cleaned. JSON only.`,
    });
    tools.store.writePart(caseId, 'dossiers', cleaned); // throws again if still dirty — surfaced honestly
  }
}

async function runDrill(input, tools) {
  const { caseId, drill } = input;
  const theCase = tools.store.getCase(caseId);
  if (!theCase || theCase.dossiers.status !== 'ready') throw new Error('drill: dossiers not ready for this case');
  const dossiers = theCase.dossiers.data;
  if (!dossiers[drill.dossierKey]) throw new Error(`drill: unknown dossierKey "${drill.dossierKey}"`);

  const grounding = await tools.search.grounded({ query: drill.query, maxTokens: 1100 });
  const result = await tools.llm.completeJSON({
    system: 'You answer a focused follow-up research question concisely and factually. ' + ANTI_CLICHE,
    maxTokens: 1500,
    prompt: `Question: ${drill.query}\n\nGrounded research:\n${grounding.text}\n\nReply as JSON: { "text": "<one focused paragraph>" }. JSON only.`,
  });
  // Build the updated dossiers as a NEW value and write it through the store gate —
  // never mutate the object read from the store (the store hands back a detached copy
  // now, but constructing a fresh value keeps the proper-write intent explicit).
  const appended = {
    id: tools.ids.mintId('paragraph'),
    text: (result && result.text) || '',
    sources: normalizeCitations(grounding.citations),
    appended: { query: drill.query },
  };
  const target = dossiers[drill.dossierKey];
  const updatedDossiers = {
    ...dossiers,
    [drill.dossierKey]: { ...target, paragraphs: [...target.paragraphs, appended] },
  };
  tools.store.writePart(caseId, 'dossiers', updatedDossiers);
  return { ok: true, mode: 'drill', appendedTo: drill.dossierKey };
}

module.exports = async function execute(input, options, tools) {
  const { caseId } = input;
  if (input.drill) return runDrill(input, tools);

  const theCase = tools.store.getCase(caseId);
  if (!theCase) throw new Error(`researcher: no such case ${caseId}`);
  const meta = theCase.meta;

  tools.store.setPartStatus(caseId, 'dossiers', 'pending');
  if (tools.logger) tools.logger.info(`researching ${meta.company} (${FRONTS.length} fronts)`);

  // four fronts in parallel
  const results = await Promise.all(FRONTS.map((f) => researchFront(f, meta, options, tools)));
  const dossiers = {};
  FRONTS.forEach((f, i) => { dossiers[f.key] = results[i]; });

  await writeDossiersGated(caseId, dossiers, options, tools);

  // summon the decoder THROUGH the skeleton (never a direct import). A failed or refused
  // summon is SURFACED, not swallowed: dossiers succeeded (partial), but the run is NOT ok,
  // so a broker refusal or decoder error can never masquerade as success.
  const fronts = FRONTS.map((f) => f.key);
  try {
    const decoded = await tools.request('decoder', { caseId });
    return { ok: true, mode: 'research', fronts, decoded: decoded != null && decoded.ok === true };
  } catch (err) {
    if (tools.logger) tools.logger.error(`decoder summon failed: ${err.message}`);
    return { ok: false, partial: true, mode: 'research', fronts, decoded: false, decoderError: err.message };
  }
};
