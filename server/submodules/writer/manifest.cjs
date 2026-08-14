'use strict';
module.exports = {
  id: 'writer',
  description: 'Background: writes a cover letter from fit + gaps + the datafact pool. Must-haves lead; gaps drive the honest bridge paragraph. Carries accuracy guardrails + no-overstate. Language-parameterised.',
  reads: ['meta', 'fit', 'gaps'],
  writes: ['coverLetter'],
  capabilities: ['store', 'logger', 'llm', 'datalayer', 'assembly'],
  options: { model: 'claude-opus-4-8', language: 'en' },
};
