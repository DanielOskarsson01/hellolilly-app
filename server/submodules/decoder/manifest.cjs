'use strict';

// A1 — Decoder (Stage 2). Reads the ad + research and outputs decodedRole: the true job
// beneath the ad. Consumed by A2 (the gap analyzer). Summoned by the researcher via the broker.
module.exports = {
  id: 'decoder',
  description: 'Stage 2 decoder: reads the ad together with culture/stage/ambition/niche signals and outputs the true-job profile (decodedRole) — the real requirements beneath the ad.',
  reads: ['dossiers'],
  writes: ['decodedRole'],
  capabilities: ['store', 'logger', 'llm', 'utils', 'assembly'],
  options: { model: 'claude-opus-4-8' },
};
