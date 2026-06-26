'use strict';

// A1 — Researcher (Stage 2). Produces the four research dossiers to niche depth, then
// summons the decoder through the skeleton. Standalone use: "should I even apply?"
module.exports = {
  id: 'researcher',
  description: 'Stage 2: four research dossiers (company, product, people, niche) to niche depth; then summons the decoder. Reader-drill mode appends targeted research to a dossier.',
  reads: [],
  writes: ['dossiers'],
  capabilities: ['store', 'logger', 'llm', 'search', 'request'],
  options: { model: 'claude-opus-4-8' },
};
