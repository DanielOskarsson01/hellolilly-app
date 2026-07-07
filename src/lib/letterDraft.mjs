// src/lib/letterDraft.mjs — pure, no React/DOM/fetch
export function remapDecisions(oldDecisions = {}, newClaims = []) {
  const keep = {};
  for (const claim of newClaims) {
    if (oldDecisions[claim]) keep[claim] = oldDecisions[claim];
  }
  return keep;
}

export function seedEditor(draft, coverLetter) {
  const claims = (coverLetter && coverLetter.unsupported_by_cv) || [];
  if (draft && Array.isArray(draft.paragraphs)) {
    return {
      paragraphs: draft.paragraphs.slice(),
      decisions: remapDecisions(draft.decisions || {}, claims),
      source: 'draft',
    };
  }
  return {
    paragraphs: ((coverLetter && coverLetter.paragraphs) || []).slice(),
    decisions: {},
    source: 'letter',
  };
}

export function unresolvedCount(claims = [], decisions = {}) {
  return claims.filter((c) => !decisions[c]).length;
}
