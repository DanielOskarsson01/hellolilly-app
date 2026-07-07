import profile from '../lib/profile.js';

export function caseMetaView(caseData, job) {
  const meta = (caseData && caseData.meta) || {};
  const company = meta.company || (job && job.company) || null;
  return {
    company,
    jobTitle: meta.role || (job && job.title) || null,
    logo: company ? company.slice(0, 2).toUpperCase() : null,
    location: (job && job.location) || null,
    url: (job && job.url) || null,
    person: profile,
    // employment intentionally NOT set — unknown fields are omitted, never fabricated
  };
}
