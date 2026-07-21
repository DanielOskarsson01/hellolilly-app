import { cvDraftItems } from './cvDraftItems.mjs';

// Part 1: the DRAFT-coverage read. A requirement is "answered" only if the datafact
// satisfying it (fit evidenceRef.id) is among the datafacts the CV actually included
// (cvDraft datafactRef.ids). Set intersection over ids already on the case — no LLM.
// This is deliberately NOT Matchanalys's evidence-bank read.
export function computeDraftCoverage({ fit, cvDraft, decodedRole }) {
  const reqs = (fit && fit.capability && fit.capability.requirements) || [];
  const reqById = new Map(((decodedRole && decodedRole.requirements) || []).map(r => [r.id, r]));
  const cvItems = cvDraftItems(cvDraft);
  const cvIds = new Set(cvItems.map(i => i.datafactRef && i.datafactRef.id).filter(Boolean));

  const rows = reqs.map(r => {
    const reqId = r.requirementRef && r.requirementRef.id;
    const meta = reqById.get(reqId) || {};
    const evId = r.evidenceRef && r.evidenceRef.id;
    let status;
    if (r.status === 'match' && evId && cvIds.has(evId)) status = 'answered';
    else if (r.status === 'match') status = 'weak';        // in the bank, not used by the draft
    else if (r.status === 'partial') status = 'weak';
    else status = 'missing';        // 'missing', and the fallthrough for any unrecognised fit.status
    const traced = status === 'answered' ? cvItems.find(i => i.datafactRef && i.datafactRef.id === evId) : null;
    return {
      reqId,
      requirement: meta.requirement || reqId,
      weight: typeof meta.weight === 'number' ? meta.weight : null,
      status,
      tracedText: traced ? traced.text : null,
      evidenceRefId: evId || null,
    };
  });
  const counts = {
    answered: rows.filter(r => r.status === 'answered').length,
    weak: rows.filter(r => r.status === 'weak').length,
    missing: rows.filter(r => r.status === 'missing').length,
    total: rows.length,
  };
  return { rows, counts };
}
