// The renderable leaf items of a cvDraft section, across the three section shapes:
//   flat        -> section.items
//   competencies-> section.categories[].items   (Core Competencies: 3 categories x items)
//   experience  -> section.jobs[].items         (Professional Experience: 5 fixed jobs)
// Mirrors server/submodules/cv-tailor/execute.cjs sectionItems() (client/server boundary
// forbids importing the .cjs). Keep the two in sync.
export function sectionItems(section) {
  return [
    ...(section.items || []),
    ...((section.categories || []).flatMap(c => c.items || [])),
    ...((section.jobs || []).flatMap(j => j.items || [])),
  ];
}

export function cvDraftItems(cvDraft) {
  return ((cvDraft && cvDraft.sections) || []).flatMap(sectionItems);
}
