// The renderable leaf items of a cvDraft section, across the three section shapes:
//   flat        -> section.items
//   competencies-> section.categories[].items          (Core Competencies: 3 categories x items)
//   experience  -> section.jobs[].intro + .bullets     (Professional Experience: 5 fixed jobs)
// Mirrors server/submodules/cv-tailor/execute.cjs sectionItems() and harness/phase0/parity-metric.cjs
// sectionItems() (client/server boundary forbids importing the .cjs). Keep the three in sync: a job's
// datafact leaves are its intro + bullets (role is a structural ref node, not a datafact leaf).
export function sectionItems(section) {
  return [
    ...(section.items || []),
    ...((section.categories || []).flatMap(c => c.items || [])),
    ...((section.jobs || []).flatMap(j => [...(j.intro || []), ...(j.bullets || [])])),
  ];
}

export function cvDraftItems(cvDraft) {
  return ((cvDraft && cvDraft.sections) || []).flatMap(sectionItems);
}
