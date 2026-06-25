'use strict';

// input: { caseId }
module.exports = async function execute(input, options, tools) {
  const { caseId } = input;

  // Brokered call — the skeleton starts the researcher. This file holds NO reference
  // to echo-researcher; it passes a string id to tools.request.
  await tools.request('echo-researcher', { caseId });

  const theCase = tools.store.getCase(caseId);
  const dossiersReadyFirst = theCase && theCase.dossiers && theCase.dossiers.status === 'ready';

  const gaps = [
    {
      id: tools.ids.mintId('gap'),
      what: 'Stub gap (A0)',
      why: dossiersReadyFirst ? 'Found the dossiers the researcher wrote.' : 'No dossiers found.',
      bridge: {
        id: tools.ids.mintId('bridge'),
        kind: 'reframe',
        body: 'Placeholder bridge body.',
        oneLiner: 'Placeholder one-liner.',
        material: [{ source: 'cv' }],
      },
      provenance: 'analyzer',
    },
  ];

  tools.store.writePart(caseId, 'gaps', gaps);
  return { ok: true, dossiersReadyFirst, wroteGap: gaps[0].id };
};
