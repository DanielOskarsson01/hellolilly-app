'use strict';

// Live end-to-end A2 smoke test. Run: node --env-file=.env scripts/smoke-a2.cjs
// NOT part of `npm test` — it makes real Anthropic calls (billed to ANTHROPIC_API_KEY). It
// exists because every unit test injects a mock LLM, so a green suite proves the WIRING works,
// not that the ported week-22 prompts produce sensible, HONEST output from a real model.
// It exercises the full A2 loop and prints what the real model produces so you can eyeball:
//   1. the analyzer's real fit + gaps on a role (cite-by-id honesty),
//   2. the cover letter (does it overstate? what does it flag as unsupported_by_cv?),
//   3. the bullet-judge: a WEAK answer must be refused (stays_gap), a STRONG one accepted.

const { createHost } = require('../server/skeleton/host.cjs');
const { createAnthropicClient } = require('../server/skeleton/clients/anthropic.cjs');
const { applyAnswer } = require('../server/skeleton/fill-gap/bullet-judge.cjs');
const { seedDatafacts } = require('./seed-datafacts.cjs');

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('smoke-a2: set ANTHROPIC_API_KEY (e.g. node --env-file=.env scripts/smoke-a2.cjs).');
    process.exit(1);
  }

  // Build the llm explicitly so we can also pass it to applyAnswer (host does not expose it).
  const llm = createAnthropicClient({ apiKey: process.env.ANTHROPIC_API_KEY });
  const host = createHost({ llm });
  const facts = seedDatafacts(host.store);
  console.log(`seeded ${facts.length} datafacts (language=en)`);

  // A realistic role with one strong-fit requirement and one Daniel almost certainly lacks.
  const c = host.store.createCase({ company: 'Example Co', role: 'Chief Marketing Officer' });
  host.store.writePart(c.meta.id, 'decodedRole', {
    narrative: 'A commercial leader to own marketing + revenue growth for a scaling iGaming/B2B platform, building and leading the org.',
    requirements: [
      { id: 'decodedRequirement_1', requirement: 'Scale and lead a commercial / marketing organisation', rationale: 'Own the function end to end', weight: 0.9 },
      { id: 'decodedRequirement_2', requirement: 'Hands-on machine-learning platform engineering', rationale: 'Build ML infra directly', weight: 0.5 },
      { id: 'decodedRequirement_3', requirement: 'iGaming / online gambling industry experience', rationale: 'Domain fluency', weight: 0.8 },
    ],
  });

  console.log('running gap-analyzer…');
  await host.invoke('gap-analyzer', { caseId: c.meta.id });
  console.log('running cv-builder…');
  await host.invoke('cv-builder', { caseId: c.meta.id });
  console.log('running writer…');
  await host.invoke('writer', { caseId: c.meta.id });

  const out = host.store.getCase(c.meta.id);
  console.log('\n========== FIT (cite-by-id honesty) ==========\n', JSON.stringify(out.fit.data, null, 2));
  console.log('\n========== GAPS ==========\n', JSON.stringify(out.gaps.data, null, 2));
  console.log('\n========== CV DRAFT ==========\n', JSON.stringify(out.cvDraft.data, null, 2));
  console.log('\n========== COVER LETTER (overstate check) ==========\n', JSON.stringify(out.coverLetter.data, null, 2));
  console.log('\nstatuses:', {
    fit: out.fit.status, gaps: out.gaps.status, cvDraft: out.cvDraft.status, coverLetter: out.coverLetter.status,
  });

  // ---- Bullet-judge demonstration: weak answer must be refused, strong one accepted ----
  const reqs = (out.fit.data && out.fit.data.capability && out.fit.data.capability.requirements) || [];
  const target = reqs.find((r) => r.status !== 'match') || reqs[0];
  const gaps = (out.gaps.data || []);
  const gapId = gaps[0] ? gaps[0].id : 'gap_none';
  const reqId = target ? target.requirementRef.id : 'decodedRequirement_1';
  console.log(`\n========== BULLET-JUDGE (target requirement ${reqId}, status before: ${target ? target.status : 'n/a'}) ==========`);

  console.log('\n-- WEAK answer (expect: stays_gap / refused) --');
  const weak = await applyAnswer(host.store, llm, {
    caseId: c.meta.id, gapId, requirementId: reqId,
    answer: 'um, i think i have maybe done a bit of that here and there, hard to say really, a fair amount i guess',
  });
  console.log(JSON.stringify(weak, null, 2));

  console.log('\n-- STRONG answer (expect: accepted, mints a datafact, flips to match) --');
  const strong = await applyAnswer(host.store, llm, {
    caseId: c.meta.id, gapId, requirementId: reqId,
    answer: 'At ComeOn I built and led the marketing and commercial organisation as CMO, growing the team from 7 to roughly 40 people across acquisition, CRM, brand and BI, and roughly tripling revenue over two years.',
  });
  console.log(JSON.stringify(strong, null, 2));

  const after = host.store.getCase(c.meta.id).fit.data.capability.requirements.find((r) => r.requirementRef.id === reqId);
  console.log(`\nrequirement ${reqId} status after the strong answer: ${after ? after.status : 'n/a'}`);
  console.log('datafact pool size now:', host.store.listDatafacts().length, '(grew if the strong answer was accepted)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
