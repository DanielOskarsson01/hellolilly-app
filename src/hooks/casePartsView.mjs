const DATA_PARTS = ['decodedRole', 'fit', 'gaps', 'cvDraft', 'coverLetter', 'coverLetterDraft'];

export function casePartsView(caseData) {
  const statusOf = (part) => (caseData && caseData[part] && caseData[part].status) || 'absent';
  const dataOf = (part) => (statusOf(part) === 'ready' && caseData[part].data) || null;
  const view = {
    meta: (caseData && caseData.meta) || null,
    _pool: (caseData && caseData._pool) || [],
    statusOf,
    dataOf,
  };
  for (const part of DATA_PARTS) view[part] = dataOf(part);
  return view;
}
