// Section 4B (Wave 2) — the GENERATION-TIME graceful-failure face, client side.
// A job under its frozen per-job ceiling means the pool could not support the ad there;
// the product says so instead of silently handing over a weak CV.
//
// BULLETS_PER_JOB mirrors the frozen-template constant in
// server/submodules/cv-tailor/execute.cjs (itself drift-guarded against
// TEMPLATE_DEFINITION.md); draftThinness.test.mjs guards this copy against the server's.

export const BULLETS_PER_JOB = { onlyigaming: 5, coinhero: 5, betclic: 5, comeon: 6, mrgreen: 8 };

export function assessDraftThinness(cvDraft) {
  const exp = ((cvDraft && cvDraft.sections) || []).find((s) => s.key === 'experience');
  const jobs = ((exp && exp.jobs) || []).map((j) => {
    const ceiling = BULLETS_PER_JOB[j.key] || 0;
    const bullets = (j.bullets || []).length;
    return { key: j.key, company: j.company, bullets, ceiling, underfilled: bullets < ceiling };
  });
  const underfilled = jobs.filter((j) => j.underfilled);
  return { jobs, underfilled, thin: underfilled.length > 0 };
}
