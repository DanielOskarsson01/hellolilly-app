'use strict';

// The decode->tailor boundary serialiser — HOISTED into the skeleton (Wave 2, Section 4
// build fact): it used to live inside cv-tailor, where the submodule require-guard blocks
// every other consumer, and the targeting comparison + suggestion engine need the SAME
// serialisation, not a duplicate. cv-tailor now receives it via tools.utils (one
// maintained copy); host-level modules require this file directly.
//
// Serialises each decoded requirement WITH its weight + rationale, most decisive first,
// plus the decoder's narrative. Requirement weight can be NULL — handled explicitly:
// null-weight items sort last and render '?/5' rather than inventing a rank.

function decodedSignal(decoded) {
  const reqs = (decoded.requirements || []).slice().sort((a, b) => (b.weight || 0) - (a.weight || 0));
  const lines = reqs.map((r) => `  [weight ${r.weight != null ? r.weight : '?'}/5] ${r.requirement}${r.rationale ? ` — ${r.rationale}` : ''}`);
  return [
    decoded.narrative ? `What this job really is: ${decoded.narrative}` : '',
    reqs.length
      ? `Real requirements, MOST DECISIVE FIRST (weight 5 = decisive; low-weight or negatively-phrased items are behaviours the ad DE-PRIORITISES or REJECTS):\n${lines.join('\n')}`
      : '(no decoded requirements)',
  ].filter(Boolean).join('\n');
}

module.exports = { decodedSignal };
