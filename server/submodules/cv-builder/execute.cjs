'use strict';

const SYSTEM = `You assemble a tailored CV by SELECTING which candidate datafacts belong in each section.
You do NOT write, paraphrase, or invent any CV text — you only choose ids. Output STRICT JSON:
{ "sections": [{ "key": string, "heading": string, "datafactIds": [string] }] }. Prefer datafacts whose tags/text match the role's requirements and the matched evidence.`;

module.exports = async function execute(input, options, tools) {
  const { caseId } = input;
  const language = options.language || 'en';
  const theCase = tools.store.getCase(caseId);
  if (!theCase) throw new Error(`cv-builder: no such case ${caseId}`);
  tools.store.setPartStatus(caseId, 'cvDraft', 'pending');

  const pool = tools.datalayer.listDatafacts().filter((f) => f.language === language);
  const byId = new Map(pool.map((f) => [f.id, f]));
  const decoded = (theCase.decodedRole && theCase.decodedRole.data) || { requirements: [] };
  const fit = (theCase.fit && theCase.fit.data) || null;

  try {
    const result = await tools.llm.completeJSON({
      system: SYSTEM,
      model: options.model,
      maxTokens: 2000,
      prompt: [
        'TASK: SELECT datafacts per CV section for this role.',
        `ROLE: ${theCase.meta.role || ''} @ ${theCase.meta.company || ''}`,
        `REQUIREMENTS:\n${decoded.requirements.map((r) => `- ${r.requirement}`).join('\n')}`,
        fit ? `MATCHED EVIDENCE:\n${fit.capability.requirements.filter((r) => r.status === 'match').map((r) => `- ${r.evidence}`).join('\n')}` : '',
        `DATAFACTS (id :: text :: tags):\n${pool.map((f) => `${f.id} :: ${f.text} :: ${(f.tags || []).join(',')}`).join('\n')}`,
      ].join('\n\n'),
    });

    const sections = (result?.sections || []).map((s) => ({
      key: s.key || 'section',
      heading: s.heading || '',
      items: (s.datafactIds || []).filter((id) => byId.has(id)).map((id) => ({ datafactRef: tools.ids.ref('datafact', id), text: byId.get(id).text })),
    })).filter((s) => s.items.length);

    const cvDraft = { language, sections };
    tools.store.writePart(caseId, 'cvDraft', cvDraft);
    return { ok: true, sections: sections.length, items: sections.reduce((n, s) => n + s.items.length, 0) };
  } catch (err) {
    tools.store.setPartStatus(caseId, 'cvDraft', 'failed', err.message);
    throw err;
  }
};
