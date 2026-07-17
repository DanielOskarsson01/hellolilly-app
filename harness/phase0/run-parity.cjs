#!/usr/bin/env node
'use strict';

// Wave 1 parity harness — the LIVE 9-generation runner (needs ANTHROPIC_API_KEY; separate from
// `npm run verify`, which stays offline). Per the brief §"The parity tests" / §"Harness execution":
//   - decode once per pinned ad, then run cv-tailor THREE times on each of the three ads (9 runs);
//   - every run must pass P1 (structure vs the template machine block) and P2 (provenance: ids
//     resolve against the MANIFEST pool snapshot; node text == source under normalisation);
//   - compute the committed P3 pass rule (min primary-vs-control distance > max within-ad distance);
//   - write a committed report with the run-integrity fields (model, sampling, corpus version, run
//     date, run order/attempts, and the pool checksum of every source resolved).
// Runs against a COPY of the live store.db so the 9 harness cases never touch the real store.
//
//   RUN_DATE=2026-07-16 node harness/phase0/run-parity.cjs

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHost } = require('../../server/skeleton/host.cjs');
const { createAnthropicClient } = require('../../server/skeleton/clients/anthropic.cjs');
const { bootstrapStore } = require('../../server/store-bootstrap.cjs');
const M = require('./parity-metric.cjs');

const HL = path.resolve(__dirname, '..', '..');
const RUN_DATE = process.env.RUN_DATE || new Date().toISOString().slice(0, 10);
const RUNS_PER_AD = 3;

function apiKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const env = fs.readFileSync(path.join(HL, '.env'), 'utf8');
  const m = env.match(/ANTHROPIC_API_KEY\s*=\s*(\S+)/);
  if (!m) throw new Error('ANTHROPIC_API_KEY not in env or .env — the harness needs a live key');
  return m[1].replace(/^['"]|['"]$/g, '');
}

const ADS = [
  { role: 'primary', file: 'primary-wrknest.txt', company: 'Wrknest', title: 'Marknadschef (Fintech)' },
  { role: 'control', file: 'control-ramenbae.txt', company: 'Ramen Bae', title: 'Growth / Marketing' },
  { role: 'second', file: 'second-aloi.txt', company: 'Aloi AI', title: 'Marketing Lead' },
];

async function main() {
  const block = JSON.parse(fs.readFileSync(path.join(__dirname, 'TEMPLATE_DEFINITION.md'), 'utf8').match(/```json\s*([\s\S]*?)```/)[1]);
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'MANIFEST.json'), 'utf8'));
  const poolIds = new Set(manifest.corpus.datafact_pool.items.map((i) => i.id));
  const poolSha = manifest.corpus.datafact_pool.pool_sha256;

  // copy the live store so harness cases never pollute it
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-'));
  const tmpDb = path.join(tmpDir, 'store.db');
  fs.copyFileSync(path.join(HL, 'server', 'data', 'store.db'), tmpDb);

  const boot = bootstrapStore({ storePath: tmpDb });
  const store = boot.store;
  const sourceText = new Map(store.listDatafacts().map((f) => [f.id, f.text]));
  const llm = createAnthropicClient({ apiKey: apiKey() });
  const host = createHost({ llm, store });

  const selections = { primary: [], control: [], second: [] };
  const perRun = [];
  const resolvedIds = new Set();

  for (const ad of ADS) {
    const adText = fs.readFileSync(path.join(__dirname, 'local', 'ads', ad.file), 'utf8');
    const c = store.createCase({ company: ad.company, role: ad.title, sourceInput: adText });
    const caseId = c.meta.id;
    process.stderr.write(`\n[${ad.role}] ${ad.company} — decoding…`);
    await host.invoke('decoder', { caseId });
    const decoded = store.getCase(caseId).decodedRole;
    const decodeOk = decoded && decoded.status === 'ready';
    process.stderr.write(decodeOk ? ` decoded ${decoded.data.requirements.length} reqs\n` : ` DECODE FAILED (${decoded && decoded.error})\n`);

    for (let run = 1; run <= RUNS_PER_AD; run++) {
      process.stderr.write(`[${ad.role}] tailor run ${run}/${RUNS_PER_AD}…`);
      await host.invoke('cv-tailor', { caseId });
      const part = store.getCase(caseId).cvDraft;
      if (!part || part.status !== 'ready') {
        perRun.push({ ad: ad.role, run, tailor: 'failed', error: part && part.error });
        selections[ad.role].push({});
        process.stderr.write(` TAILOR FAILED (${part && part.error})\n`);
        continue;
      }
      const draft = part.data;
      const sel = M.selectionOf(draft);
      const p1 = M.validateStructure(draft, block);
      const p2 = M.validateProvenance(draft, poolIds, sourceText);
      for (const ids of Object.values(sel)) ids.forEach((id) => resolvedIds.add(id));
      selections[ad.role].push(sel);
      perRun.push({
        ad: ad.role, run, tailor: 'ready',
        p1: p1.ok, p1_errors: p1.errors, p2: p2.ok, p2_errors: p2.errors,
        sections: draft.sections.length, selection: sel,
      });
      process.stderr.write(` P1 ${p1.ok ? 'PASS' : 'FAIL'} · P2 ${p2.ok ? 'PASS' : 'FAIL'}\n`);
    }
  }

  const p3 = M.p3PassRule(selections);
  const everyRunReady = perRun.every((r) => r.tailor === 'ready');
  const everyP1P2 = perRun.every((r) => r.tailor === 'ready' && r.p1 && r.p2);
  const overallPass = everyRunReady && everyP1P2 && p3.pass;

  const report = {
    wave: 'Wave 1 — The Honest Tailor',
    harness: 'P1 (structure) + P2 (provenance) + P3 (job sensitivity)',
    run_date: RUN_DATE,
    run_integrity: {
      tailor_model: 'claude-sonnet-4-6',
      decoder_model: 'claude-opus-4-8 (upstream input step; recorded, not the parity-graded model)',
      sampling: 'tailor temperature=0 (stable selection; sonnet-4-6 honours it); decoder temperature not sent (deprecated on opus-4-8). maxTokens tailor=2000, decoder=3000',
      corpus_version: manifest.run_config && manifest.run_config.corpus_version,
      pool_sha256: poolSha,
      pool_size: poolIds.size,
      runs_per_ad: RUNS_PER_AD,
      ads: ADS.map((a) => ({ role: a.role, company: a.company, local_file: `ads/${a.file}` })),
      resolved_source_ids: resolvedIds.size,
      note: 'Selections are datafact ids (opaque refs, no content) — fixture-law safe to commit.',
    },
    per_run: perRun,
    p3: {
      pass: p3.pass, min_cross: round(p3.minCross), max_within: round(p3.maxWithin), cross_count: p3.crossCount,
      cross: p3.cross.map(([i, j, d]) => ({ primary: i, control: j, distance: round(d) })),
      within: {
        primary: p3.within.primary.map(fmtPair), control: p3.within.control.map(fmtPair), second: p3.within.second.map(fmtPair),
      },
    },
    every_run_p1_p2: everyP1P2,
    overall_pass: overallPass,
  };

  const jsonPath = path.join(__dirname, 'parity-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(__dirname, 'PARITY_REPORT.md'), renderMd(report));

  fs.rmSync(tmpDir, { recursive: true, force: true });
  store.close && store.close();

  process.stderr.write(`\n=== P1/P2 all runs: ${everyP1P2 ? 'PASS' : 'FAIL'} | P3: ${p3.pass ? 'PASS' : 'FAIL'} (minCross ${round(p3.minCross)} > maxWithin ${round(p3.maxWithin)}) | OVERALL ${overallPass ? 'PASS' : 'FAIL'} ===\n`);
  process.stderr.write(`report: harness/phase0/PARITY_REPORT.md + parity-report.json\n`);
  if (!overallPass) process.exitCode = 1;
}

const round = (n) => Math.round(n * 1e4) / 1e4;
const fmtPair = ([i, j, d]) => ({ a: i, b: j, distance: round(d) });

function renderMd(r) {
  const rows = r.per_run.map((x) => x.tailor !== 'ready'
    ? `| ${x.ad} | ${x.run} | TAILOR FAILED | — | — | ${x.error || ''} |`
    : `| ${x.ad} | ${x.run} | ${x.p1 ? '✅' : '❌'} | ${x.p2 ? '✅' : '❌'} | ${x.sections} | ${[...x.p1_errors, ...x.p2_errors].join('; ') || '—'} |`).join('\n');
  return `# Wave 1 — Parity Harness Report

**Run date:** ${r.run_date} · **Overall:** ${r.overall_pass ? '✅ PASS' : '❌ FAIL'}

## Run integrity (D12)
- Tailor model: \`${r.run_integrity.tailor_model}\` · Decoder (input step): \`${r.run_integrity.decoder_model}\`
- Sampling: ${r.run_integrity.sampling}
- Corpus version: \`${r.run_integrity.corpus_version}\`
- Pool: ${r.run_integrity.pool_size} datafacts · pool_sha256 \`${r.run_integrity.pool_sha256}\`
- Runs per ad: ${r.run_integrity.runs_per_ad} · Ads: ${r.run_integrity.ads.map((a) => `${a.role} (${a.company})`).join(', ')}
- Distinct source ids resolved across all runs: ${r.run_integrity.resolved_source_ids}
- ${r.run_integrity.note}

## P1 (structure) + P2 (provenance) — every run
${'| ad | run | P1 | P2 | sections | errors |'}
${'|----|-----|----|----|----------|--------|'}
${rows}

**Every run passed P1 and P2:** ${r.every_run_p1_p2 ? '✅ yes' : '❌ no'}

## P3 (job sensitivity)
Pass rule: **min(primary-vs-control distance) > max(within-ad distance)**.
- min cross-ad (primary↔control) distance: **${r.p3.min_cross}** (${r.p3.cross_count} pairs)
- max within-ad distance: **${r.p3.max_within}**
- **P3: ${r.p3.pass ? '✅ PASS' : '❌ FAIL'}**

> ⚠️ **Margin dependency (ledger #2):** this pass is load-bearing on tailor **temperature=0** — the recorded intended setting for stable selection (\`server/submodules/cv-tailor/manifest.cjs\`). The margin is thin (Δ ${round(r.p3.min_cross - r.p3.max_within)} = ${r.p3.min_cross} − ${r.p3.max_within}); at a non-zero temperature the within-ad distances would rise and could flip the result. Any re-run must hold temperature=0 for this result to stand.

Within-ad pair distances: primary ${r.p3.within.primary.map((p) => p.distance).join(', ') || '—'} · control ${r.p3.within.control.map((p) => p.distance).join(', ') || '—'} · second ${r.p3.within.second.map((p) => p.distance).join(', ') || '—'}

## Scope honesty (brief finding 15)
P3 proves the selection RESPONDS to the ad; it does not prove the response is RELEVANT — that is
P4 dimension 2, scored by Daniel against each ad's captured reference. P4 is a separate human step.
`;
}

main().catch((err) => { console.error('\nHARNESS ERROR:', err.stack || err.message); process.exit(1); });
