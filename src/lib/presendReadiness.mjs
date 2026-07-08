// Qualitative send-readiness — NEVER a number. work if a high-weight requirement isn't
// answered; else almost if any weak/missing/alignable-keyword/letter-gap/honesty-flag; else ready.
export const HIGH_WEIGHT = 0.8;

export function computeReadiness({ coverage, keyword, letter }) {
  const rows = (coverage && coverage.rows) || [];
  const counts = (coverage && coverage.counts) || { weak: 0, missing: 0 };
  const highUnmet = rows.some(r => r.status !== 'answered' && typeof r.weight === 'number' && r.weight >= HIGH_WEIGHT);
  if (highUnmet) return { tone: 'work' };
  const gaps = (counts.weak || 0) + (counts.missing || 0);
  const anyKeyword = ((keyword && keyword.missing) || []).some(m => m.alignable);
  const letterGaps = ((letter && letter.rows) || []).filter(r => r.addressed === false).length;
  const honesty = ((letter && letter.honestyFlags) || []).length;
  if (gaps > 0 || anyKeyword || letterGaps > 0 || honesty > 0) return { tone: 'almost' };
  return { tone: 'ready' };
}
