'use strict';

// Decoder (A1). input = { caseId }. Reads the ad (meta.sourceInput) together with the
// research signals (company stage, ambitions, niche) and emits decodedRole — the real
// requirements beneath the ad, which the A2 analysis maps against (not the raw ad).

const ANTI_CLICHE =
  'Write plainly and specifically. No marketing or AI-fingerprint words (leveraged, robust, ' +
  'dynamic, cutting-edge, synergy, passionate, elevate, unlock, delve, testament to).';

const SYSTEM =
  'You decode the TRUE job behind a job ad. The role is often not what the ad literally states. ' +
  'Read the ad together with the signals around it: the company stage and ambitions, culture, the ' +
  'industry problems the company appears to be answering, and technical depth hiding under a ' +
  'non-technical title. Output the real requirements — what this job actually demands — each with a ' +
  'short rationale grounded in those signals, and a weight (1-5, 5 = most decisive). ' + ANTI_CLICHE;

function summarizeDossiers(dossiers) {
  if (!dossiers) return '';
  return ['company', 'product', 'people', 'niche']
    .filter((k) => dossiers[k])
    .map((k) => `## ${k}\n${dossiers[k].summary || ''}\n${(dossiers[k].paragraphs || []).map((p) => p.text).join('\n')}`)
    .join('\n\n')
    .slice(0, 12000); // keep the prompt bounded
}

async function gatedWrite(caseId, decodedRole, options, tools) {
  try {
    tools.store.writePart(caseId, 'decodedRole', decodedRole);
  } catch (err) {
    if (err.name !== 'WritingRuleError' || !err.violations) throw err;
    const banned = [...new Set(err.violations.map((v) => v.phrase))];
    const cleaned = await tools.llm.completeJSON({
      system: 'You rephrase text to remove specific words while preserving meaning.',
      model: options.model,
      maxTokens: 4000,
      prompt: `Remove these words/phrases, rephrasing naturally, keep all facts and JSON shape:\n${banned.join(', ')}\n\n${JSON.stringify(decodedRole)}\n\nReturn the same JSON shape, cleaned. JSON only.`,
    });
    tools.store.writePart(caseId, 'decodedRole', cleaned);
  }
}

module.exports = async function execute(input, options, tools) {
  const { caseId } = input;
  const theCase = tools.store.getCase(caseId);
  if (!theCase) throw new Error(`decoder: no such case ${caseId}`);
  const meta = theCase.meta;
  const dossiers = theCase.dossiers && theCase.dossiers.data;

  tools.store.setPartStatus(caseId, 'decodedRole', 'pending');
  if (tools.logger) tools.logger.info(`decoding true job for ${meta.role || 'role'} @ ${meta.company}`);

  try {
    const result = await tools.llm.completeJSON({
      system: SYSTEM,
      model: options.model,
      maxTokens: 3000,
      prompt:
        `Company: ${meta.company}\nAdvertised role: ${meta.role || 'unknown'}\n\n` +
        `The ad / source input:\n${meta.sourceInput || '(none provided — infer from role + research)'}\n\n` +
        `Research signals:\n${summarizeDossiers(dossiers)}\n\n` +
        `Output the decoded role as JSON: { "narrative": "<short paragraph: what this job really is>", ` +
        `"requirements": [ { "requirement": "<real requirement>", "rationale": "<why, from the signals>", ` +
        `"weight": <1-5> } ] }. 6-12 requirements. Return JSON only.`,
    });

    const decodedRole = {
      narrative: (result && result.narrative) || '',
      requirements: (Array.isArray(result && result.requirements) ? result.requirements : []).map((r) => ({
        id: tools.ids.mintId('decodedRequirement'),
        requirement: r.requirement || '',
        rationale: r.rationale || '',
        weight: typeof r.weight === 'number' ? r.weight : null,
      })).filter((r) => r.requirement),
    };

    await gatedWrite(caseId, decodedRole, options, tools);
    return { ok: true, requirements: decodedRole.requirements.length };
  } catch (err) {
    // mark the part failed (in scope — decoder owns decodedRole) so the failure is visible
    // in case state, then rethrow so the broker logs it and the caller surfaces it.
    tools.store.setPartStatus(caseId, 'decodedRole', 'failed', err.message);
    throw err;
  }
};
