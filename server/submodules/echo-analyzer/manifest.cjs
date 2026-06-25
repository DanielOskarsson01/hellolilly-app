'use strict';

// A0 stub. Proves one submodule can summon another VIA THE SKELETON (tools.request),
// never by a direct import. Replaced by the real Decoder+Analyzer in A2.
module.exports = {
  id: 'echo-analyzer',
  description: 'A0 stub: requests the researcher through the skeleton, reads its dossier, writes a stub gap.',
  reads: ['dossiers'],
  writes: ['gaps'],
  capabilities: ['store', 'logger', 'request'],
};
