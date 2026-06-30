'use strict';

// A2 core. Reads the decoded role + the candidate datafact pool, produces an HONEST
// fit (every match cites a real datafact) and gaps (each with a bridge carrying material).
module.exports = {
  id: 'gap-analyzer',
  description: 'A2: reads decodedRole + datafact pool (+ optional preferences) and writes an honest fit (match/partial/missing, each match cited) and gaps (each with a bridge + material).',
  reads: ['meta', 'decodedRole'],
  writes: ['fit', 'gaps'],
  capabilities: ['store', 'logger', 'llm', 'datalayer'],
  options: { model: 'claude-opus-4-8' },
};
