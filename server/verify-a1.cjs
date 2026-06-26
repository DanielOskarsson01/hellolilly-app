'use strict';

// Live A1 verification. Boots the host with REAL clients (Opus 4.8 + Perplexity Sonar)
// and runs the researcher on one company, then prints a report to eyeball niche depth
// (the A1 quality bar). Run: node --env-file=.env server/verify-a1.cjs [Company] [Role]

const fs = require('node:fs');
const { createHost } = require('./skeleton/host.cjs');

const COMPANY = process.argv[2] || 'Curoflow';
const ROLE = process.argv[3] || 'Head of Marketing';

(async () => {
  if (!process.env.ANTHROPIC_API_KEY || !process.env.PERPLEXITY_API_KEY) {
    throw new Error('Missing keys — run with: node --env-file=.env server/verify-a1.cjs');
  }
  const host = createHost(); // real clients from env
  const c = host.store.createCase({
    company: COMPANY,
    role: ROLE,
    sourceInput: `${COMPANY} is hiring a ${ROLE}. (A1 verification run — niche-depth check)`,
  });
  console.log(`case ${c.meta.id} — researching ${COMPANY} (${ROLE})…`);

  const t0 = Date.now();
  const { result, log } = await host.invoke('researcher', { caseId: c.meta.id });
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  const updated = host.store.getCase(c.meta.id);

  console.log(`\n=== DONE in ${secs}s — ${JSON.stringify(result)}`);
  console.log(`dossiers=${updated.dossiers.status}  decodedRole=${updated.decodedRole.status}`);

  for (const k of ['company', 'product', 'people', 'niche']) {
    const d = updated.dossiers.data && updated.dossiers.data[k];
    if (!d) { console.log(`\n## ${k.toUpperCase()}: MISSING`); continue; }
    console.log(`\n## ${k.toUpperCase()} — ${d.paragraphs.length} paragraphs, ${d.sources.length} sources`);
    console.log('summary:', d.summary);
    if (k === 'niche') {
      d.paragraphs.forEach((p, i) => console.log(`  [${i + 1}] ${p.text}`)); // full niche = the depth check
    } else {
      console.log('  p1:', (d.paragraphs[0] && d.paragraphs[0].text || '').slice(0, 280));
    }
  }

  const dr = updated.decodedRole.data;
  console.log(`\n## DECODED ROLE — ${(dr && dr.requirements ? dr.requirements.length : 0)} requirements`);
  if (dr) {
    console.log('narrative:', dr.narrative);
    (dr.requirements || []).forEach((r) => console.log(`  - (w${r.weight}) ${r.requirement} — ${r.rationale}`));
  }

  const out = `/tmp/a1-${COMPANY.toLowerCase().replace(/\W+/g, '-')}.json`;
  fs.writeFileSync(out, JSON.stringify(updated, null, 2));
  console.log(`\nfull case -> ${out}`);

  const issues = log.filter((e) => e.event === 'error' || e.event === 'refused');
  if (issues.length) console.log('\n⚠ broker errors/refusals:', JSON.stringify(issues, null, 2));
})().catch((e) => { console.error('VERIFY FAILED:', e.message); process.exit(1); });
