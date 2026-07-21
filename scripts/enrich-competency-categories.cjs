#!/usr/bin/env node
'use strict';

// Wave 1 — enrich the competency datafacts with the CATEGORY TAXONOMY the frozen template
// requires (harness/phase0/TEMPLATE_DEFINITION.md §5 "Core Competencies: categories + items
// from COMPETENCY_MASTER_POOL"). Route B, per Daniel's binding conditions:
//
//   ID-PRESERVING   add a `category` field to the EXISTING competency facts in place. No id
//                   changes, no facts deleted — every case reference still resolves. Idempotent,
//                   same discipline as scripts/repair-datafacts.cjs.
//   IMPORT, NOT     the category TITLES come from COMPETENCY_MASTER_POOL.json (the pre-approved
//   AUTHORING       reference material, checksummed in harness/phase0/MANIFEST.json). The
//                   item→category grouping is NOT invented here: it already exists in the live
//                   data — ingest-cv.cjs:31 tagged every competency fact with its cv_data
//                   `competencies` group (tags[1]). This script only crosswalks that existing
//                   group to the approved pool category and records the provenance.
//
// The crosswalk below maps each cv_data.competencies group to one pool category, grounded in
// the item text of that group (see the build report). Every target title is validated to exist
// in the pool (fail-closed) so pool drift is caught rather than silently mapped to nothing.
//
// The 13 flat `skill` facts carry no group and are NOT part of the reference's categorised
// competency table — they are left untouched.
//
// One-time, run with the server STOPPED. The pool lives in the machine-local reference dir
// (FIXTURE LAW — never committed), overridable via REF_CV_DIR / --pool.
//
//   node scripts/enrich-competency-categories.cjs
//   REF_CV_DIR=/path/to/CVs node scripts/enrich-competency-categories.cjs

const fs = require('node:fs');
const path = require('node:path');
const { createSqliteStore } = require('../server/skeleton/store/sqlite.cjs');

const DB_PATH = process.env.STORE_PATH || path.resolve(__dirname, '../server/data/store.db');
const REF_CV_DIR = process.env.REF_CV_DIR
  || '/Users/danieloskarsson/Library/CloudStorage/Dropbox/Projects/JobSearch/CVs';
const DEFAULT_POOL = path.join(REF_CV_DIR, 'COMPETENCY_MASTER_POOL.json');
const POOL_SOURCE = 'COMPETENCY_MASTER_POOL.json'; // recorded as provenance on each fact

// cv_data.competencies group  ->  approved pool category title. Evidence-grounded; the one
// judgement call is industry_knowledge (leads with iGaming/casino/sportsbook -> iGaming &
// Entertainment; alternative Compliance & Regulatory, recorded for veto).
const CROSSWALK = {
  leadership_management: 'Leadership & Scaling',
  product_development: 'Product & Technology',
  marketing_strategy: 'Marketing & Growth',
  technical_analytical: 'Data & Analytics',
  industry_knowledge: 'iGaming & Entertainment',
};

const slug = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Load the approved category titles from the pool file (or accept them injected, for offline tests).
function poolTitles({ poolPath = DEFAULT_POOL, poolCategories = null } = {}) {
  if (poolCategories) return new Set(poolCategories);
  if (!fs.existsSync(poolPath)) {
    throw new Error(
      `COMPETENCY_MASTER_POOL.json not found at ${poolPath}. It is the approved category source ` +
      '(machine-local reference, FIXTURE LAW). Set REF_CV_DIR or pass { poolCategories }.',
    );
  }
  const j = JSON.parse(fs.readFileSync(poolPath, 'utf8'));
  if (!j.categories || !Object.keys(j.categories).length) throw new Error('pool has no categories');
  return new Set(Object.keys(j.categories));
}

// Enrich in place. Returns { enriched, categories } — enriched = # competency facts given a
// category; categories = the distinct {id,title} taxonomy applied.
function enrich(store, opts = {}) {
  const titles = poolTitles(opts);
  // fail-closed: every crosswalk target must be an approved pool title
  for (const t of Object.values(CROSSWALK)) {
    if (!titles.has(t)) throw new Error(`crosswalk target "${t}" is not a category in the approved pool — refusing to author a title`);
  }

  const comps = store.listDatafacts().filter((f) => f.type === 'competency');
  const applied = new Map();
  for (const f of comps) {
    const group = (f.tags || [])[1];
    const title = CROSSWALK[group];
    if (!title) throw new Error(`competency fact ${f.id} has group "${group}" with no crosswalk entry — refusing to guess its category`);
    const category = { id: slug(title), title, group, source: POOL_SOURCE };
    store.ingestDatafact({ ...f, category }); // same id => in-place overwrite, no reference churn
    applied.set(category.id, { id: category.id, title });
  }
  return { enriched: comps.length, categories: [...applied.values()] };
}

// Count references to a non-existent fact id across every case — the id-stability guard.
function collectRefs(v, out = []) {
  if (Array.isArray(v)) v.forEach((x) => collectRefs(x, out));
  else if (v && typeof v === 'object') {
    if (v.kind === 'datafact' && v.id) out.push(v.id);
    for (const x of Object.values(v)) collectRefs(x, out);
  }
  return out;
}
function danglingRefs(store) {
  const ids = new Set(store.listDatafacts().map((f) => f.id));
  let n = 0;
  for (const c of store.listCases()) for (const id of collectRefs(c)) if (!ids.has(id)) n++;
  return n;
}

module.exports = { enrich, danglingRefs, CROSSWALK, slug };

if (require.main === module) {
  const store = createSqliteStore({ path: DB_PATH });
  try {
    console.log(`Enriching competency datafacts in ${DB_PATH}`);
    console.log(`Pool source: ${DEFAULT_POOL}\n`);
    const before = { total: store.listDatafacts().length, dangling: danglingRefs(store) };
    const skillsBefore = store.listDatafacts().filter((f) => f.type === 'skill').map((f) => f.id).sort();

    const { enriched, categories } = enrich(store);

    const after = { total: store.listDatafacts().length, dangling: danglingRefs(store) };
    const skillsAfter = store.listDatafacts().filter((f) => f.type === 'skill').map((f) => f.id).sort();

    console.log(`enriched ${enriched} competency facts with ${categories.length} categories:`);
    for (const c of categories) console.log(`  ${c.id.padEnd(24)} ${c.title}`);
    console.log(`\n  total facts: ${before.total} -> ${after.total} (unchanged: ${before.total === after.total})`);
    console.log(`  dangling refs: ${before.dangling} -> ${after.dangling}`);
    console.log(`  skill facts untouched: ${JSON.stringify(skillsBefore) === JSON.stringify(skillsAfter)}`);

    if (after.total !== before.total) throw new Error('fact count changed — a fact was added or deleted');
    if (after.dangling !== before.dangling) throw new Error('dangling references changed — an id was churned');
    if (JSON.stringify(skillsBefore) !== JSON.stringify(skillsAfter)) throw new Error('skill facts changed');
    console.log('\nOK — categories imported, ids stable, no reference churn, skills untouched.');
  } finally {
    store.close();
  }
}
