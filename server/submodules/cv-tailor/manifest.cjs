'use strict';
module.exports = {
  id: 'cv-tailor',
  description: 'Wave 1: a SELECTION-ONLY tailored cvDraft instantiated from the frozen reference template. Fills content nodes by selecting datafacts (never authoring/suggesting/gap-drafting). D12 Rule 2 via tools.assembly; output schema-validated; tailored structure stamped untrusted-derived. Replaces cv-builder on the /generate route.',
  reads: ['meta', 'decodedRole', 'fit'],
  writes: ['cvDraft'],
  capabilities: ['store', 'llm', 'datalayer', 'assembly'],
  options: { model: 'claude-sonnet-4-6', language: 'en', temperature: 0 },
};
