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

const RELATEDNESS_SYSTEM = `You decide whether a keyword TERM is genuinely supported by one specific FACT from a candidate's CV.
"Supported" means the fact is real evidence that the term honestly applies — the term names a skill, tool, domain,
seniority, or responsibility that the fact actually demonstrates, EVEN IF the term and the fact share no words
(e.g. the term "leadership" is supported by "Managed a team of twelve engineers"). If the fact does NOT support
the term — unrelated, or only coincidentally worded — return related:false. Do NOT be generous: when genuinely
unsure, return related:false. Output STRICT JSON: { "related": boolean, "reason": string }.`;

// Semantic relatedness judge. Only consulted when the lexical pre-filter fails to find
// overlap — a term can honestly relate to a fact while sharing zero words, and refusing
// those on lexical grounds alone would false-refuse legitimate pairs. When no llm is
// available (e.g. no ANTHROPIC_API_KEY), the relatedness cannot be verified, so we refuse
// conservatively rather than align an unverified pair.
async function judgeRelatedness({ term, basisText }, llm) {
  if (!llm || typeof llm.completeJSON !== 'function') {
    return { related: false, reason: 'no judge available to verify relatedness' };
  }
  const out = await llm.completeJSON({
    system: RELATEDNESS_SYSTEM,
    model: 'claude-opus-4-8',
    maxTokens: 200,
    prompt: [`TERM: ${term}`, `FACT: ${basisText || ''}`].join('\n\n'),
  });
  return { related: !!(out && out.related), reason: (out && out.reason) || '' };
}

/**
 * Apply keyword alignment.
 * @param {object} store  — must implement getCase(caseId), getDatafact(id), writePart(caseId, part, data)
 * @param {object|null} llm  — optional LLM (completeJSON); powers the term↔basis relatedness judge
 * @param {{ caseId: string, term: string, basisDatafactId: string|null }} opts
 * @returns {Promise<{ outcome:'aligned'|'refused', reason?: string, term: string, datafactId?: string }>}
 */
async function applyAlign(store, llm, { caseId, term, basisDatafactId }) {
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

  // Guard 4: the term must genuinely relate to the basis datafact — enforced server-side
  // so a direct API caller cannot align an unrelated term onto a valid-but-referenced basis.
  //
  // Lexical overlap is a CONSERVATIVE PRE-FILTER, never the sole test: a term token that
  // matches a basis token AS A WHOLE WORD is a high-confidence "related" signal, so we
  // fast-accept and skip the LLM. The match is token EQUALITY, never substring containment —
  // "java" must NOT fast-accept against a basis mentioning "javascript" (different technology,
  // an acceptance the judge never ruled on). A substring-only match is treated exactly like a
  // word-disjoint pair: it defers to the judge. Absence of a whole-word match is NOT proof of
  // unrelatedness either — a term can honestly relate to a fact while sharing zero words
  // ("leadership" ↔ "Managed a team of twelve engineers") — so those also defer to the judge
  // rather than refuse on lexical grounds alone. A refusal therefore always requires the judge
  // to decline; the pre-filter can only fast-accept.
  const termTokens = term.toLowerCase().split(/\W+/).filter((t) => t.length >= 3);
  const basisTokens = new Set(String(basis.text || '').toLowerCase().split(/\W+/).filter((t) => t.length >= 3));
  const lexicallyRelated = termTokens.some((tok) => basisTokens.has(tok));
  if (!lexicallyRelated) {
    const verdict = await judgeRelatedness({ term, basisText: basis.text }, llm);
    if (!verdict.related) {
      return refuse("That term isn't supported by the referenced fact.");
    }
  }

  // Append the ad term conservatively. No LLM — deterministic, reversible.
  const aligned = `${target.text} (${term})`;

  // Guard 5: the aligned wording must pass the writing-rules honesty gate.
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
