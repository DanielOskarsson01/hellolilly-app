// Word-boundary literal matcher — inlined on purpose. It mirrors the logic in
// server/submodules/stage2-filter/execute.cjs (compileRules/bodyRules), but this module runs
// in the browser bundle and must not import server .cjs code across the client/server boundary.
// It is ~8 trivial lines; independently tested here.
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function termPresent(text, term) {
  return new RegExp(`\\b${escapeRegex(String(term).toLowerCase())}\\b`, 'i').test(String(text || '').toLowerCase());
}

const STOP = new Set(['THE','AND','FOR','WITH','A','AN','OF']);

export function extractAdTerms(decodedRole) {
  const terms = new Set();
  for (const r of (decodedRole && decodedRole.requirements) || []) {
    const s = String(r.requirement || '');
    for (const m of s.matchAll(/[""'"]([^""'"]{2,40})[""'"]/g)) terms.add(m[1].trim());   // quoted phrases
    for (const m of s.matchAll(/\b([A-Z]{2,6})\b/g)) if (!STOP.has(m[1])) terms.add(m[1]); // ALLCAPS acronyms
  }
  return [...terms];
}

function cvText(cvDraft) {
  return ((cvDraft && cvDraft.sections) || []).flatMap(s => s.items || []).map(i => i.text || '').join('\n');
}

// A basis is a CV datafact whose text lexically overlaps the term (shared token/substring),
// i.e. the fact already expresses the concept — aligning only relabels wording. No overlap → not alignable.
function findBasis(term, cvDraft) {
  const items = ((cvDraft && cvDraft.sections) || []).flatMap(s => s.items || []);
  const toks = term.toLowerCase().split(/\W+/).filter(t => t.length >= 3);
  for (const it of items) {
    const t = String(it.text || '').toLowerCase();
    if (toks.some(tok => t.includes(tok))) return { id: it.datafactRef && it.datafactRef.id, wording: it.text };
  }
  return null;
}

export function scanCvKeywords({ decodedRole, cvDraft }) {
  const terms = extractAdTerms(decodedRole);
  const text = cvText(cvDraft);
  const present = terms.filter(t => termPresent(text, t));
  const missing = terms.filter(t => !termPresent(text, t)).map(term => {
    const basis = findBasis(term, cvDraft);
    return { term, cvWording: basis ? basis.wording : null, basisDatafactId: basis ? basis.id : null, alignable: !!(basis && basis.id) };
  });
  return { present, missing };
}
