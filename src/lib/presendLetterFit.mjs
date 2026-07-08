// Contract-only, honest. Surfaces the REAL unsupported_by_cv flag. Per-requirement "addressed"
// is null (cannot auto-determine) unless a real signal exists — never fabricated, never LLM.
// A real paragraph->requirement read is a logged follow-up.
export function computeLetterFit({ coverLetter, decodedRole }) {
  const honestyFlags = (coverLetter && coverLetter.unsupported_by_cv) || [];
  const rows = ((decodedRole && decodedRole.requirements) || []).map(r => ({
    reqId: r.id, requirement: r.requirement, addressed: null, quote: null,
  }));
  return { rows, honestyFlags };
}
