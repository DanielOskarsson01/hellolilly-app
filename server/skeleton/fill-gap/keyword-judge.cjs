'use strict';

// The keyword-judge: server-side honesty gate for keyword alignment.
// Aligns a CV item's wording to include an ad term ONLY where a real datafact backs it.
// The guardrail is enforced server-side (like bullet-judge) — the client cannot bypass it.
//
// Rules:
// - REFUSE if no basisDatafactId is provided (no supporting fact).
// - REFUSE if the datafact id does not resolve to a real datafact.
// - REFUSE if the basis datafact is not cited by any item in the current CV draft.
// - REFUSE if the aligned wording fails the writing-rules gate.
// - ALIGN: relabel the item's text to include the ad term; preserve datafactRef (the truth
//   is unchanged); store priorText for reversibility; persist via store.writePart.
//
// Returns: { outcome:'aligned'|'refused', reason?, term, datafactId? }

const { check } = require('../writing-rules/gate.cjs');

// Word-boundary term match (case-insensitive, regex-safe).
function hasTerm(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
}

/**
 * Apply keyword alignment.
 * @param {object} store  — must implement getCase(caseId), getDatafact(id), writePart(caseId, part, data)
 * @param {{ caseId: string, term: string, basisDatafactId: string|null }} opts
 * @returns {Promise<{ outcome:'aligned'|'refused', reason?: string, term: string, datafactId?: string }>}
 */
async function applyAlign(store, { caseId, term, basisDatafactId }) {
  const refuse = (reason) => ({ outcome: 'refused', reason, term });

  // Guard 1: must have a term and a declared basis.
  if (!term || !basisDatafactId) {
    return refuse('No supporting fact for this term — we don\'t add words the CV can\'t back.');
  }

  // Guard 2: the declared basis must resolve to a real datafact.
  const basis = store.getDatafact(basisDatafactId);
  if (!basis) {
    return refuse('The supporting fact could not be found on this case.');
  }

  // Guard 3: the basis datafact must be cited by an item in the current CV draft.
  const caseObj = store.getCase(caseId);
  const data = caseObj && caseObj.cvDraft && caseObj.cvDraft.data;
  if (!data) {
    return refuse('No CV draft to align.');
  }

  let target = null;
  outer: for (const sec of data.sections || []) {
    for (const it of sec.items || []) {
      if (it.datafactRef && it.datafactRef.id === basisDatafactId) {
        target = it;
        break outer;
      }
    }
  }
  if (!target) {
    return refuse('The supporting fact is not in the current draft.');
  }

  // Idempotent: if the term is already present, nothing to do.
  if (hasTerm(target.text, term)) {
    return { outcome: 'aligned', term, datafactId: basisDatafactId };
  }

  // Guard 5: the term must be lexically related to the basis datafact's text.
  // Mirrors the client-side findBasis() in src/lib/presendKeywords.mjs exactly:
  //   tokens = term.toLowerCase().split(/\W+/).filter(t => t.length >= 3)
  //   related iff toks.some(tok => basisText.toLowerCase().includes(tok))
  // This closes the server-side bypass hole: a direct API caller cannot align an
  // unrelated term onto a valid-but-referenced basis.
  const termTokens = term.toLowerCase().split(/\W+/).filter((t) => t.length >= 3);
  const basisText = String(basis.text || '').toLowerCase();
  const isRelated = termTokens.some((tok) => basisText.includes(tok));
  if (!isRelated) {
    return refuse("That term isn't supported by the referenced fact.");
  }

  // Append the ad term conservatively. No LLM — deterministic, reversible.
  const aligned = `${target.text} (${term})`;

  // Guard 4: the aligned wording must pass the writing-rules honesty gate.
  // check() returns { ok: boolean, violations: Array<{ phrase, snippet }> }.
  const gate = check({ text: aligned });
  if (!gate.ok) {
    const phrases = gate.violations.map((v) => v.phrase).join(', ');
    return refuse(`The aligned wording failed the honesty gate: ${phrases}`);
  }

  // Persist: store priorText for reversibility; update text; datafactRef stays untouched.
  if (target.priorText === undefined) target.priorText = target.text;
  target.text = aligned;
  target.alignedTerm = term;
  store.writePart(caseId, 'cvDraft', data);

  return { outcome: 'aligned', term, datafactId: basisDatafactId };
}

module.exports = { applyAlign };
