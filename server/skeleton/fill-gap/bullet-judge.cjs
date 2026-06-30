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

async function applyAnswer(store, llm, { caseId, gapId, answer, requirementId, tags = [] }) {
  const theCase = store.getCase(caseId);
  if (!theCase) throw new Error(`applyAnswer: no such case ${caseId}`);
  const gaps = (theCase.gaps && theCase.gaps.data) || [];
  const gap = gaps.find((g) => g.id === gapId) || null;
  const reqs = ((theCase.decodedRole && theCase.decodedRole.data && theCase.decodedRole.data.requirements) || []);
  const requirement = (reqs.find((r) => r.id === requirementId) || {}).requirement || '';

  const verdict = await judgeAnswer({ requirement, gap, answer }, llm);
  if (!verdict.canFill || !verdict.bulletText) {
    return { outcome: 'stays_gap', reason: verdict.reason };
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
  store.ingestDatafact(fact);

  // Flip the requirement to match; attach evidenceRef so the re-write survives the
  // ref-scoped exact-equality gate (Task 3) — fact.text is exempt only via its ref.
  const fit = (theCase.fit && theCase.fit.data) || { capability: { requirements: [], overall: '' }, preference: { narrative: '' } };
  fit.capability.requirements = (fit.capability.requirements || []).map((r) =>
    r.requirementRef && r.requirementRef.id === requirementId
      ? { ...r, status: 'match', evidence: fact.text, evidenceRef: { kind: 'datafact', id: fact.id } }
      : r,
  );
  store.writePart(caseId, 'fit', fit); // gate runs; fact.text exempt via evidenceRef

  return { outcome: 'accepted', newDatafactId: fact.id, updatedFit: store.getCase(caseId).fit.data, reason: verdict.reason };
}

module.exports = { judgeAnswer, applyAnswer };
