'use strict';

// Addressing scheme (DATA_CONTRACT v0.2 §2.1).
// Every addressable node carries a stable, never-reused id of the form
// `<kind>_<short>`. A reference is a typed pointer { kind, id, caseId? }.
// Both build threads share this vocabulary; submodules reach it via tools.ids
// (they never require this file directly — see capabilities.cjs).

const { randomUUID } = require('node:crypto');

const KINDS = new Set([
  'case', 'dossier', 'paragraph', 'decodedRequirement', 'gap', 'bridge', 'card',
  'question', 'prepSection', 'cvSlide', 'liveQA', 'harvestItem', 'datafact',
]);

function mintId(kind) {
  if (!KINDS.has(kind)) throw new Error(`Unknown node kind: ${kind}`);
  return `${kind}_${randomUUID().slice(0, 8)}`;
}

function ref(kind, id, caseId) {
  if (!KINDS.has(kind)) throw new Error(`Unknown ref kind: ${kind}`);
  if (!id) throw new Error('ref requires an id');
  return caseId ? { kind, id, caseId } : { kind, id };
}

module.exports = { KINDS, mintId, ref };
