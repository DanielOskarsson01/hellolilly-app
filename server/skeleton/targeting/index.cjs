'use strict';

// Section 4 — the graceful-failure affordance (owed outcome, binds). Deterministic
// comparisons only; no model. Both faces:
//   A. AD-DRIVEN, PRE-DRAFT: decoder's weighted requirements vs what the VERIFIED pool
//      can support — where thin for a top-weighted requirement, the product says so
//      plainly and offers to draft from the person's own material.
//   B. GENERATION-TIME: a generated draft whose jobs sit under their fixed ceilings is
//      reported as thin instead of silently handed over.
// The support measure is an honest HEURISTIC (token overlap), labelled as such — it
// informs an affordance, it gates nothing.

const tailor = require('../../submodules/cv-tailor/execute.cjs');

const STOP = new Set(['with', 'from', 'that', 'this', 'have', 'your', 'their', 'och', 'som', 'för', 'the', 'and', 'experience', 'skills', 'ability', 'strong', 'proven', 'years']);
const tokens = (s) => String(s || '').toLowerCase().split(/[^a-zåäö0-9+]+/).filter((t) => t.length >= 4 && !STOP.has(t));

// assessPool(decoded, facts) — requirement weight can be NULL: handled explicitly
// (null-weight items are never called top-weighted; they sort after weighted ones and
// carry weight: null in the output rather than an invented rank).
function assessPool(decoded, facts) {
  const factIndex = facts.map((f) => ({ id: f.id, toks: new Set(tokens(`${f.text} ${(f.tags || []).join(' ')}`)) }));
  const reqs = ((decoded && decoded.requirements) || []).map((r) => {
    const rToks = tokens(r.requirement);
    const supporting = rToks.length
      ? factIndex.filter((f) => rToks.some((t) => f.toks.has(t))).map((f) => f.id)
      : [];
    const topWeighted = r.weight != null && r.weight >= 4;
    const thin = supporting.length === 0; // zero support = thin; one real fact is support, not a nag
    return {
      id: r.id, requirement: r.requirement, weight: r.weight != null ? r.weight : null,
      supportCount: supporting.length, supportingFactIds: supporting.slice(0, 8),
      topWeighted, thin,
    };
  }).sort((a, b) => (b.weight || 0) - (a.weight || 0));
  const thinTop = reqs.filter((r) => r.topWeighted && r.thin);
  return { requirements: reqs, thinTop, poolSize: facts.length, method: 'token-overlap heuristic (affordance, not a gate)' };
}

// assessDraftThinness(cvDraft) — face B's deterministic core: jobs under their fixed
// per-job ceiling mean the pool could not support the ad there.
function assessDraftThinness(cvDraft) {
  const exp = ((cvDraft && cvDraft.sections) || []).find((s) => s.key === 'experience');
  const jobs = ((exp && exp.jobs) || []).map((j) => {
    const ceiling = tailor.BULLETS_PER_JOB[j.key] || 0;
    const bullets = (j.bullets || []).length;
    return { key: j.key, company: j.company, bullets, ceiling, underfilled: bullets < ceiling };
  });
  const underfilled = jobs.filter((j) => j.underfilled);
  return { jobs, underfilled, thin: underfilled.length > 0 };
}

module.exports = { assessPool, assessDraftThinness };
