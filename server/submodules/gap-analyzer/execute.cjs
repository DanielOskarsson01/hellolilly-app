'use strict';

// Gap Analyzer (A2). input = { caseId, preferences? }. Reads decodedRole (the true job) and
// the candidate datafact pool, and emits an HONEST fit (each "match" must cite a real datafact
// by id) and gaps (each with a bridge carrying material).
//
// Honesty contract:
//   - The LLM returns a datafactId (string|null) per requirement — NOT free-text evidence.
//   - A "match" is kept ONLY when the datafactId resolves to a real fact in the pool.
//   - An unresolvable/absent id with status "match" is DOWNGRADED to "partial" (no evidenceRef).
//   - Preferences are a HARD-FILTER FIT read only (deal-breaker / credible-meet check),
//     NOT a desirability or enjoyment signal.

const SYSTEM =
  'You are an interview-prep analyst. Analyze a candidate\'s fit for a role against their evidenced datafact pool. ' +
  'Output STRICT JSON only — no markdown, no code fences.\n\n' +
  '=== 5-LAYER ANALYSIS FRAMEWORK ===\n' +
  'Layer 1 - EXPLICIT REQUIREMENTS: Hard skills, years of experience, tools, must-haves.\n' +
  'Layer 2 - PREFERRED QUALIFICATIONS: Nice-to-haves; differentiate candidates.\n' +
  'Layer 3 - INDUSTRY LANGUAGE: Domain jargon and keywords the employer uses.\n' +
  'Layer 4 - OPERATIONAL CONTEXT: Team size, scope, reporting line, location, travel.\n' +
  'Layer 5 - CULTURE SIGNALS: Work style, values, mission language, management philosophy.\n\n' +
  '=== HONESTY BAR (binding) ===\n' +
  'A requirement is "match" ONLY if a REAL datafact from the provided pool supports it.\n' +
  'You MUST cite that datafact by its EXACT id (datafactId field).\n' +
  'If nothing in the pool supports it, status is "partial" (partial evidence) or "missing" (none) and datafactId is null.\n' +
  'NEVER invent a datafactId. NEVER invent evidence text.\n' +
  'Preferences are a HARD-FILTER FIT read only — does the role clear the candidate\'s deal-breakers, ' +
  'and can the candidate credibly meet the role\'s needs? NOT whether the candidate would enjoy it.\n\n' +
  '=== OUTPUT SCHEMA ===\n' +
  '{\n' +
  '  "capability": {\n' +
  '    "requirements": [\n' +
  '      { "requirementId": "<id from input>", "datafactId": "<string id or null>", "status": "match"|"partial"|"missing" }\n' +
  '    ],\n' +
  '    "overall": "<1-2 sentence plain-language summary>"\n' +
  '  },\n' +
  '  "preference": { "narrative": "<hard-filter fit read only — deal-breakers + credible-meet assessment>" },\n' +
  '  "gaps": [\n' +
  '    {\n' +
  '      "what": "<the specific gap>",\n' +
  '      "why": "<why the role demands it>",\n' +
  '      "bridgeKind": "reframe"|"adjacent-proof"|"honest-ramp",\n' +
  '      "bridgeBody": "<honest bridge narrative>",\n' +
  '      "bridgeOneLiner": "<one-line version>",\n' +
  '      "material": [{ "source": "cv"|"coop-dialogue", "ref": "<optional ref string>" }]\n' +
  '    }\n' +
  '  ]\n' +
  '}';

module.exports = async function execute(input, options, tools) {
  const { caseId, preferences } = input;
  const theCase = tools.store.getCase(caseId);
  if (!theCase) throw new Error(`gap-analyzer: no such case ${caseId}`);
  const decoded = theCase.decodedRole && theCase.decodedRole.data;
  if (!decoded || !Array.isArray(decoded.requirements)) {
    throw new Error('gap-analyzer: decodedRole missing or has no requirements');
  }

  tools.store.setPartStatus(caseId, 'fit', 'pending');
  tools.store.setPartStatus(caseId, 'gaps', 'pending');
  if (tools.logger) tools.logger.info(`analyzing fit for ${theCase.meta.role || 'role'} @ ${theCase.meta.company}`);

  const pool = tools.datalayer.listDatafacts();
  const factById = new Map(pool.map((f) => [f.id, f]));

  try {
    const result = await tools.llm.completeJSON({
      system: SYSTEM,
      model: options.model,
      maxTokens: 4000,
      prompt: [
        `ROLE NARRATIVE: ${decoded.narrative || ''}`,
        `REQUIREMENTS:\n${decoded.requirements.map((r) => `- (${r.id}) ${r.requirement}`).join('\n')}`,
        `CANDIDATE DATAFACTS (evidence pool — cite the supporting one by its exact id):\n${pool.map((f) => `- (${f.id}) ${f.text}`).join('\n')}`,
        preferences
          ? `CANDIDATE PREFERENCES (hard-filter fit only — deal-breakers + credible-meet):\n${JSON.stringify(preferences)}`
          : 'CANDIDATE PREFERENCES: (none provided)',
      ].join('\n\n'),
    });

    const reqIds = new Set(decoded.requirements.map((r) => r.id));

    const fit = {
      capability: {
        requirements: (result && result.capability && Array.isArray(result.capability.requirements)
          ? result.capability.requirements
          : []
        )
          .filter((r) => reqIds.has(r.requirementId))
          .map((r) => {
            // Cite-by-id honesty: a "match" needs a datafactId that resolves in the pool.
            // An unverifiable cite (hallucinated or absent id) downgrades match -> partial.
            const cited = r.datafactId ? factById.get(r.datafactId) : null;
            const status = r.status === 'match' && !cited ? 'partial' : (r.status || 'missing');
            const base = {
              requirementRef: tools.ids.ref('decodedRequirement', r.requirementId),
              evidence: cited ? cited.text : '',
              status,
            };
            if (cited) base.evidenceRef = tools.ids.ref('datafact', cited.id);
            return base;
          }),
        overall: (result && result.capability && result.capability.overall) || '',
      },
      preference: {
        narrative: (result && result.preference && result.preference.narrative) || '',
      },
    };

    const gaps = (result && Array.isArray(result.gaps) ? result.gaps : [])
      .map((g) => ({
        id: tools.ids.mintId('gap'),
        what: g.what || '',
        why: g.why || '',
        bridge: {
          id: tools.ids.mintId('bridge'),
          kind: ['reframe', 'adjacent-proof', 'honest-ramp'].includes(g.bridgeKind)
            ? g.bridgeKind
            : 'reframe',
          body: g.bridgeBody || '',
          oneLiner: g.bridgeOneLiner || '',
          // material REQUIRED (design §4) — default to [{ source: 'cv' }] when absent/empty
          material:
            Array.isArray(g.material) && g.material.length > 0
              ? g.material
              : [{ source: 'cv' }],
        },
        provenance: 'gap-analyzer',
      }))
      .filter((g) => g.what);

    tools.store.writePart(caseId, 'fit', fit);
    tools.store.writePart(caseId, 'gaps', gaps);

    return {
      ok: true,
      requirements: fit.capability.requirements.length,
      matched: fit.capability.requirements.filter((r) => r.status === 'match').length,
      gaps: gaps.length,
    };
  } catch (err) {
    tools.store.setPartStatus(caseId, 'fit', 'failed', err.message);
    tools.store.setPartStatus(caseId, 'gaps', 'failed', err.message);
    throw err;
  }
};
