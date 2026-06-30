'use strict';

// Live end-to-end A2 smoke test. Run: ANTHROPIC_API_KEY=... node scripts/smoke-a2.cjs
// NOT part of `npm test` — it makes real Anthropic calls (costs money). It exists because
// every unit test injects a mock LLM, so a green suite proves the WIRING works, not that the
// ported prompts actually produce the target JSON from a real model. Run it manually to
// eyeball fit/gaps honesty + cover-letter quality on one real case.

const { createHost } = require('../server/skeleton/host.cjs');
const { seedDatafacts } = require('./seed-datafacts.cjs');

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('smoke-a2: set ANTHROPIC_API_KEY to run the live smoke test.');
    process.exit(1);
  }

  const host = createHost(); // no llm passed -> defaultLlm() reads ANTHROPIC_API_KEY
  const facts = seedDatafacts(host.store);
  console.log(`seeded ${facts.length} datafacts (language=en)`);

  const c = host.store.createCase({ company: 'Example Co', role: 'Head of Product' });
  host.store.writePart(c.meta.id, 'decodedRole', {
    narrative: 'A commercial product leader who can scale an org.',
    requirements: [
      { id: 'decodedRequirement_1', requirement: 'Scale a commercial org', rationale: '', weight: 0.9 },
      { id: 'decodedRequirement_2', requirement: 'Hands-on ML platform engineering', rationale: '', weight: 0.7 },
    ],
  });

  console.log('running gap-analyzer…');
  await host.invoke('gap-analyzer', { caseId: c.meta.id });
  console.log('running cv-builder…');
  await host.invoke('cv-builder', { caseId: c.meta.id });
  console.log('running writer…');
  await host.invoke('writer', { caseId: c.meta.id });

  const out = host.store.getCase(c.meta.id);
  console.log('\n=== FIT ===\n', JSON.stringify(out.fit.data, null, 2));
  console.log('\n=== GAPS ===\n', JSON.stringify(out.gaps.data, null, 2));
  console.log('\n=== CV DRAFT ===  sections:', (out.cvDraft.data && out.cvDraft.data.sections ? out.cvDraft.data.sections.length : 0));
  console.log('\n=== COVER LETTER ===\n', JSON.stringify(out.coverLetter.data, null, 2));
  console.log('\nstatuses:', {
    fit: out.fit.status, gaps: out.gaps.status, cvDraft: out.cvDraft.status, coverLetter: out.coverLetter.status,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
