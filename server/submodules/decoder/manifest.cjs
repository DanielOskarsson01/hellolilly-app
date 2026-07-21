'use strict';

// A1 — Decoder (Stage 2). Reads the ad + research and outputs decodedRole: the true job
// beneath the ad. Consumed by A2 (the gap analyzer). Summoned by the researcher via the broker.
module.exports = {
  id: 'decoder',
  description: 'Stage 2 decoder: reads the ad together with culture/stage/ambition/niche signals and outputs the true-job profile (decodedRole) — the real requirements beneath the ad.',
  reads: ['dossiers'],
  writes: ['decodedRole'],
  capabilities: ['store', 'logger', 'llm', 'utils', 'assembly'],
  // Wave 1 decode runs the SAME model as the tailor (review #2 finding 7) so the whole HelloLilly
  // chain is single-model (claude-sonnet-4-6), matching the reference's single-model property. The
  // opus writing-wave model is D20c's next-wave concern, not this selection-only wave.
  options: { model: 'claude-sonnet-4-6' },
};
