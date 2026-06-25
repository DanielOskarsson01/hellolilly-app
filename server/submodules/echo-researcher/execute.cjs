'use strict';

// Standalone-runnable: uses only the injected `tools` — imports nothing from the
// skeleton. input: { caseId }
module.exports = async function execute(input, options, tools) {
  const { caseId } = input;
  if (tools.logger) tools.logger.info(`researching ${caseId}`);

  const dossiers = {
    company: {
      title: 'Company (stub)',
      summary: 'Placeholder company dossier from the A0 stub researcher.',
      paragraphs: [
        {
          id: tools.ids.mintId('paragraph'),
          text: 'This company exists to do a thing. Placeholder origin-to-ambition paragraph.',
        },
      ],
    },
    product: null,
    people: null,
    niche: null,
  };

  // Write goes through the store chokepoint (writing-rules gate runs before persist).
  tools.store.writePart(caseId, 'dossiers', dossiers);
  return { ok: true, wrote: 'dossiers' };
};
