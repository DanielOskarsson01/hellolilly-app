'use strict';

// The fill-gap mechanism (host-level — minting datafacts is host-only).
//
// WAVE 2 REWIRE (brief 3.1 + 3.5-3.7): the old flow auto-minted a model-authored bullet
// with no wording review and no acceptance event — exactly the class the 3.3 backfill
// segregated. Now the typed answer is RETAINED as an auto-attested 'gap_answer' document
// (3.1) and goes through the SAME draft-review-mint pipeline as an upload: the engine
// drafts a span-grounded PROPOSAL, the person reviews wording AND attribution, and only
// engine.accept mints — with the recorded acceptance event INVARIANT 5 demands. The
// honest-failure path stands: when nothing truthful can be drafted (or Judge B bars the
// answer as a non-experience claim), the gap STAYS open.

const { createDocument, storeDocument } = require('../documents/index.cjs'); // 3.1 stop the discard
const engine = require('../suggest/engine.cjs');

// Mark one gap terminal in the persisted `gaps` part. The gaps part is the source of
// truth for the "Luckor att fylla" column and the completion gate, so a resolution MUST
// live here (not in transient component state) to survive navigation and reload. Both
// paths route through here: 'accepted' (from engine.accept's gap context) and 'skipped'
// (a conscious, legitimate terminal state). writePart re-runs the writing-rules gate on
// the (unchanged, already-clean) gap prose; a throw persists nothing, so a caller can
// log success only after this returns.
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

// applyAnswer -> { outcome: 'proposal', proposals } | { outcome: 'stays_gap', reason }.
// No datafact is minted here — minting is engine.accept's job, and it requires the
// served-review nonce plus reviewed wording + attribution (INV5).
async function applyAnswer(store, llm, { caseId, gapId, answer, requirementId }) {
  const theCase = store.getCase(caseId);
  if (!theCase) throw new Error(`applyAnswer: no such case ${caseId}`);
  const gaps = (theCase.gaps && theCase.gaps.data) || [];
  const gap = gaps.find((g) => g.id === gapId) || null;
  if (!gap) throw new Error(`applyAnswer: no such gap ${gapId} in case ${caseId}`);
  const reqs = ((theCase.decodedRole && theCase.decodedRole.data && theCase.decodedRole.data.requirements) || []);
  const requirement = (reqs.find((r) => r.id === requirementId) || {}).requirement || '';

  // A blank / no-usable-content answer can't be spanised (createDocument now rejects the
  // empty span set); that is a legitimate honest-failure, not an error — the gap stays open.
  if (!answer || !String(answer).trim()) return { outcome: 'stays_gap', reason: 'no answer was typed — the gap stays open' };

  // 3.1 STOP THE DISCARD — retain the person's typed answer BEFORE any judging, whatever
  // the verdict. It is a DOCUMENT CLASS (auto-attested 'gap_answer'), NOT pre-trusted
  // source material: it carries its gap and requirement as structural context and goes
  // through the same spanisation/attestation/context handling as an upload (MEDIUM 3 —
  // gap answers habitually echo the requirement they answer, so employer-voice and
  // negation must not arrive trusted).
  let retained;
  try {
    retained = createDocument({
      name: `Gap answer — ${(gap.what || gapId)}`.slice(0, 160),
      text: answer,
      attestedClass: 'gap_answer',
      ownership: 'mine',
      context: { caseId, gapId, gap: gap.what || '', requirementId, requirement },
    });
  } catch (err) {
    if (err && err.name === 'ParseError') return { outcome: 'stays_gap', reason: 'the answer had no usable content — the gap stays open' };
    throw err;
  }
  storeDocument(store, retained.doc, retained.spans);

  const r = await engine.propose({ store, llm, documentIds: [retained.doc.id] });
  if (!r.proposals.length) {
    const reason = r.barredSpans.length
      ? `the answer reads as ${r.barredSpans[0].detectedClass.replace(/_/g, ' ')}, not your own experience claim — the gap stays open`
      : 'no truthful bullet could be drafted from the answer — the gap stays open';
    return { outcome: 'stays_gap', reason, retainedDocumentId: retained.doc.id, barredSpans: r.barredSpans };
  }
  return { outcome: 'proposal', proposals: r.proposals, retainedDocumentId: retained.doc.id };
}

module.exports = { applyAnswer, setGapResolution };
