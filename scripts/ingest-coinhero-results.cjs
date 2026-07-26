#!/usr/bin/env node
'use strict';

// Wave 1 — INGEST GAP REPAIR (blocker B1). The datafact pool had one Coinhero fact (an intro) and
// ZERO result bullets, because the original cv_data.json ingest never read the Coinhero results that
// live in the reference variants source. This script imports Daniel's pre-approved Coinhero result
// bullets from that source — the SAME class as the Route B category import (curated, pre-approved
// text, not fabrication). ADDITIVE ONLY: new ids, existing rows byte-for-byte untouched.
//
// Reads the reference source (outside this repo; contains personal CV text — never committed here):
//   COINHERO_SRC (default: ~/…/Projects/JobSearch/CVs/generate_core_cvs.js), the VARIANTS object.
//
//   node scripts/ingest-coinhero-results.cjs
//
// After this, run harness/phase0/amend-pool-coinhero.py to recompute pool_sha256 + record the
// manifest amendment.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { bootstrapStore } = require('../server/store-bootstrap.cjs');
const tailor = require('../server/submodules/cv-tailor/execute.cjs');

const HL = path.resolve(__dirname, '..');
const SRC = process.env.COINHERO_SRC || path.join(os.homedir(), 'Library', 'CloudStorage', 'Dropbox', 'Projects', 'JobSearch', 'CVs', 'generate_core_cvs.js');
const STORE_DB = path.join(HL, 'server', 'data', 'store.db');
const SOURCE_LABEL = 'JobSearch/CVs/generate_core_cvs.js (VARIANTS.*.jobs.coinhero.bullets)';

function distinctCoinheroBullets() {
  if (!fs.existsSync(SRC)) throw new Error(`reference source not found: ${SRC} — set COINHERO_SRC`);
  const { VARIANTS } = require(SRC);
  const seen = new Map(); // text -> first variant seen
  for (const v of Object.keys(VARIANTS)) {
    const j = VARIANTS[v] && VARIANTS[v].jobs && VARIANTS[v].jobs.coinhero;
    for (const b of (j && j.bullets) || []) {
      const t = String(b).trim();
      if (t && !seen.has(t)) seen.set(t, v);
    }
  }
  return [...seen.entries()].map(([text, variant]) => ({ text, variant }));
}

function main() {
  const bullets = distinctCoinheroBullets();
  if (!bullets.length) throw new Error('no Coinhero bullets found in the reference source — STOP (do not fabricate)');
  console.log(`extracted ${bullets.length} distinct Coinhero result bullets from ${SRC}`);

  // backup the (gitignored) store before any write
  const backup = `${STORE_DB}.bak-preCoinhero`;
  fs.copyFileSync(STORE_DB, backup);
  console.log(`backed up store.db -> ${backup}`);

  const { store } = bootstrapStore({ storePath: STORE_DB });
  // RAW reads: the additive-only byte-identity check must cover unverified facts too (INV1).
  const listAll = () => (store.listDatafactsRaw ? store.listDatafactsRaw() : store.listDatafacts());
  const before = listAll();
  const beforeById = new Map(before.map((f) => [f.id, JSON.stringify(f)]));
  const existingIds = new Set(before.map((f) => f.id));

  let added = 0;
  for (const { text } of bullets) {
    const id = 'datafact_' + crypto.createHash('sha256').update(text).digest('hex').slice(0, 8);
    if (existingIds.has(id)) { console.warn(`  SKIP (id collision, already present): ${id}`); continue; }
    store.ingestDatafact({
      id, kind: 'datafact', type: 'job_result', text,
      tags: ['job-result', 'Coinhero'], language: 'en',
      source: SOURCE_LABEL, // provenance/lineage of this imported evidence
      // Wave 2 (3.2): the explicit source is formalised as curated origin at ingest.
      origin: 'curated',
      originDetail: { method: 'explicit-source', source: SOURCE_LABEL, ingestedAt: new Date().toISOString() },
    });
    added++;
  }

  // Safety: every pre-existing fact is byte-for-byte unchanged (ADDITIVE ONLY invariant).
  const after = listAll();
  let changed = 0;
  for (const f of after) {
    if (beforeById.has(f.id) && beforeById.get(f.id) !== JSON.stringify(f)) { changed++; console.error(`  CHANGED existing fact: ${f.id}`); }
  }
  if (changed) throw new Error(`ABORT: ${changed} existing facts changed — expected additive-only`);

  // Confirm bucket membership: every new fact routes to coinhero and NOTHING else.
  let misrouted = 0;
  for (const f of after) {
    if (f.source === SOURCE_LABEL) {
      const jk = tailor.jobOfFact(f);
      if (jk !== 'coinhero') { misrouted++; console.error(`  MISROUTED ${f.id} -> ${jk}`); }
    }
  }
  if (misrouted) throw new Error(`ABORT: ${misrouted} new facts do not route to coinhero`);

  store.close && store.close();
  console.log(`\nADDED ${added} Coinhero job_result facts. Pool: ${before.length} -> ${after.length}.`);
  console.log('Existing facts unchanged ✓  ·  all new facts route to coinhero only ✓');
  console.log('Next: python3 harness/phase0/amend-pool-coinhero.py');
}

main();
