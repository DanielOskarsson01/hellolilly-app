// Item 3 deep-open: #match/<caseId> opens that job's EXISTING analysis view by id (no new
// affordances in match.jsx, no fill-loop rework). Pure helpers so the routing is unit-testable.

// The base route key for LL_ROUTES lookup: the segment before any "/param" (so #match/<caseId>
// still resolves to the "match" screen, which then reads the param from the hash).
export function routeKey(hash) {
  const slug = String(hash || '#home').replace(/^#/, '');
  return (slug.split('/')[0]) || 'home';
}

// The caseId encoded in a #match/<caseId> deep-open, or null for a plain #match / other hash.
export function parseMatchDeepOpen(hash) {
  const m = String(hash || '').match(/^#match\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

// Resolve a deep-open caseId to a queue job (jobs carry `.caseId`). null => not found:
// the caller shows a visible "job not found", never the bare list.
export function jobForCase(caseId, items) {
  if (!caseId) return null;
  return (items || []).find((j) => j.caseId === caseId) || null;
}
