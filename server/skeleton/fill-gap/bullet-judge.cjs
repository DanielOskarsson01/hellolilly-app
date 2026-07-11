'use strict';

// The fill-gap mechanism (host-level — minting datafacts is host-only). The bullet-judge
// decides whether a user's answer can become a TRUTHFUL, CV-worthy bullet. Accept -> mint a
// datafact + flip the requirement to match. Reject -> the gap STAYS open (honest-failure
// path, mandatory: no fabrication to satisfy a gap). Design §2 step 3, §6.

const { mintId } = require('../ids.cjs');
const { check } = require('../writing-rules/gate.cjs'); // host-level file MAY require the skeleton

const JUDGE_SYSTEM = `You decide whether a candidate's answer can become a single truthful, specific, CV-worthy bullet.
Rules: do NOT invent facts, numbers, titles, or scope beyond the answer. If the answer is vague, hedged,
or cannot be made truthful without inventing, return canFill:false. If it can, write ONE concrete bullet
using ONLY what the answer states. Output STRICT JSON: { "canFill": boolean, "bulletText": string|null, "reason": string }.`;

async function judgeAnswer({ requirement, gap, answer }, llm) {
  const out = await llm.completeJSON({
    system: JUDGE_SYSTEM,
    model: 'claude-opus-4-8',
    maxTokens: 600,
    prompt: [
      `REQUIREMENT: ${requirement || ''}`,
      `GAP: ${gap ? gap.what : ''}`,
      `CANDIDATE ANSWER: ${answer || ''}`,
    ].join('\n\n'),
  });
  return { canFill: !!out.canFill, bulletText: out.canFill ? (out.bulletText || '').trim() : null, reason: out.reason || '' };
}

// Mark one gap terminal in the persisted `gaps` part. The gaps part is the source of
// truth for the "Luckor att fylla" column and the completion gate, so a resolution MUST
// live here (not in transient component state) to survive navigation and reload. Both
// paths route through here: 'accepted' (from applyAnswer) and 'skipped' (a conscious,
// legitimate terminal state). writePart re-runs the writing-rules gate on the (unchanged,
// already-clean) gap prose; a throw persists nothing, so a caller can log success only
// after this returns.
function setGapResolution(store, caseId, gapId, resolution) {
  const theCase = store.getCase(caseId);
  if (!theCase) throw new Error(`setGapResolution: no such case ${caseId}`);
  const gaps = (theCase.gaps && theCase.gaps.data) || [];
  let found = false;
  const next = gaps.map((g) => (g.id === gapId ? (found = true, { ...g, resolution }) : g));
  if (!found) throw new Error(`setGapResolution: no such gap ${gapId} in case ${caseId}`);
  store.writePart(caseId, 'gaps', next);
  return next.find((g) => g.id === gapId) || null;
}

async function applyAnswer(store, llm, { caseId, gapId, answer, requirementId, tags = [] }) {
  const theCase = store.getCase(caseId);
  if (!theCase) throw new Error(`applyAnswer: no such case ${caseId}`);
  const gaps = (theCase.gaps && theCase.gaps.data) || [];
  const gap = gaps.find((g) => g.id === gapId) || null;
  // The resolution target must exist BEFORE anything durable happens (was: discovered
  // by setGapResolution after the mint + fit flip had already persisted).
  if (!gap) throw new Error(`applyAnswer: no such gap ${gapId} in case ${caseId}`);
  const reqs = ((theCase.decodedRole && theCase.decodedRole.data && theCase.decodedRole.data.requirements) || []);
  const requirement = (reqs.find((r) => r.id === requirementId) || {}).requirement || '';

  const verdict = await judgeAnswer({ requirement, gap, answer }, llm);
  if (!verdict.canFill || !verdict.bulletText) {
    return { outcome: 'stays_gap', reason: verdict.reason };
  }

  // Guard: ensure the target requirement exists in fit before minting anything.
  const fit = (theCase.fit && theCase.fit.data) || { capability: { requirements: [], overall: '' }, preference: { narrative: '' } };
  const targetExists = (fit.capability.requirements || []).some((r) => r.requirementRef && r.requirementRef.id === requirementId);
  if (!targetExists) {
    return { outcome: 'stays_gap', reason: `requirement ${requirementId} not found in fit — nothing minted` };
  }

  // The bullet is freshly AUTHORED (not lifted from the real CV), so it MUST pass the
  // writing-rules gate BEFORE it becomes a permanent, gate-exempt datafact. Reject -> stays_gap.
  // (No exemption arg: a fill-gap bullet is authored prose, not cited evidence.)
  const gate = check({ text: verdict.bulletText });
  if (!gate.ok) {
    return { outcome: 'stays_gap', reason: `bullet rejected by writing-rules: ${gate.violations.map((v) => v.phrase).join(', ')}` };
  }

  // Mint the new datafact (now gate-clean, kept verbatim, tagged + language).
  const fact = {
    id: mintId('datafact'),
    kind: 'datafact',
    type: 'fill-gap',
    text: verdict.bulletText,
    tags: [`addresses:${requirementId}`, 'fill-gap', ...tags].filter(Boolean),
    language: 'en',
  };
  store.ingestDatafact(fact); // must precede the fit write: the gate exempts fact.text only via a ref to a STORED fact

  // Flip the requirement to match; attach evidenceRef so the re-write survives the
  // ref-scoped exact-equality gate (Task 3) — fact.text is exempt only via its ref.
  fit.capability.requirements = (fit.capability.requirements || []).map((r) =>
    r.requirementRef && r.requirementRef.id === requirementId
      ? { ...r, status: 'match', evidence: fact.text, evidenceRef: { kind: 'datafact', id: fact.id } }
      : r,
  );
  const nextGaps = gaps.map((g) => (g.id === gapId ? { ...g, resolution: 'accepted' } : g));

  // Fit migration + gap resolution land in ONE atomic write (single case-row persist in
  // the sqlite adapter): the store can never durably say 'match' while the gap is still
  // unresolved. If that write fails, unmint the fact — the cv-builder mines
  // listDatafacts() directly, so a stray fill-gap fact would leak into generated CVs.
  // The throw then propagates: no 'accepted', no gap_filled activity.
  try {
    store.writeParts(caseId, { fit, gaps: nextGaps });
  } catch (err) {
    store.removeDatafact(fact.id);
    throw err;
  }

  return { outcome: 'accepted', newDatafactId: fact.id, updatedFit: store.getCase(caseId).fit.data, reason: verdict.reason };
}

module.exports = { judgeAnswer, applyAnswer, setGapResolution };
