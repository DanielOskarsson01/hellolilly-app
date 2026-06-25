'use strict';

// A0 stub. Proves a submodule can register, be invoked through the skeleton, and
// write a case part against the contract. Replaced by the real Researcher in A1.
module.exports = {
  id: 'echo-researcher',
  description: 'A0 stub: writes a placeholder company dossier to a case.',
  reads: [],
  writes: ['dossiers'],
  capabilities: ['store', 'logger'],
};
