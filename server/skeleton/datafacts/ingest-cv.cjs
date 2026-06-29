'use strict';

// Pure mapper: candidate cv_data.json -> a flat, tagged datafact pool. Every fact is a
// verbatim atomic unit of the candidate's real CV (evidence, never authored prose), so it
// is ingested via store.ingestDatafact (gate-exempt) and carries a `language` tag from day
// one (multilingual-ready — Swedish is a later 'sv' ingest, design §5).

const { mintId } = require('../ids.cjs');

function df(type, text, tags, language) {
  return { id: mintId('datafact'), kind: 'datafact', type, text: String(text).trim(), tags: tags.filter(Boolean), language };
}

function cvDataToDatafacts(cv = {}, language = 'en') {
  const out = [];
  const push = (type, text, tags = []) => { if (text && String(text).trim()) out.push(df(type, text, tags, language)); };

  // professional_summary
  if (cv.professional_summary) push('professional_summary', cv.professional_summary.default, cv.professional_summary.tags || []);

  // identity_positioning (the 7 "variants" -> tag groupings, not slots)
  for (const ip of cv.identity_positioning || []) push('identity_positioning', `${ip.label}: ${ip.description}`, ['identity', ...(ip.tags || [])]);

  // value_propositions
  for (const vp of cv.value_propositions || []) push('value_proposition', vp.text, ['value-prop', ...(vp.tags || [])]);

  // skills
  for (const s of cv.skills || []) push('skill', s.name, ['skill', ...(s.tags || [])]);

  // competencies (group -> each line)
  for (const [group, lines] of Object.entries(cv.competencies || {})) for (const line of lines || []) push('competency', line, ['competency', group]);

  // jobs: tasks_summary + each result bullet, tagged with the job + company_short
  for (const j of cv.jobs || []) {
    const jobTags = [j.company_short, ...(j.tags || [])].filter(Boolean);
    push('job_summary', j.tasks_summary, ['job', ...jobTags, j.role].filter(Boolean));
    for (const r of j.results || []) push('job_result', r, ['job-result', ...jobTags]);
  }

  // other_work
  for (const w of cv.other_work || []) push('other_work', `${w.role} at ${w.company} (${w.years})`, ['other-work', ...(w.tags || [])]);

  // education
  for (const e of cv.education || []) push('education', `${(e.degrees || []).join(', ')} — ${e.institution} (${e.years})`, ['education']);

  // awards
  for (const a of cv.awards || []) push('award', `${a.award} (${a.org}, ${a.years})`, ['award']);

  // star_stories: title + situation/task + each action
  for (const st of cv.star_stories || []) {
    const stTags = ['star-story', ...(st.tags || [])];
    push('star_story', `${st.title}: ${st.situation} ${st.task}`.trim(), stTags);
    for (const a of st.action || []) push('star_action', a, stTags);
  }

  // leadership_philosophy
  if (cv.leadership_philosophy) for (const [k, v] of Object.entries(cv.leadership_philosophy)) push('leadership', `${k}: ${v}`, ['leadership']);

  return out;
}

module.exports = { cvDataToDatafacts };
