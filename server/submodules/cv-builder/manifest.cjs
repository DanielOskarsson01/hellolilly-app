'use strict';
module.exports = {
  id: 'cv-builder',
  description: 'Background: assembles a tailored cvDraft by SELECTING (never authoring) the best datafacts per section by relevance to decodedRole + fit. Language-parameterised.',
  reads: ['meta', 'decodedRole', 'fit'],
  writes: ['cvDraft'],
  capabilities: ['store', 'logger', 'llm', 'datalayer'],
  options: { model: 'claude-opus-4-8', language: 'en' },
};
