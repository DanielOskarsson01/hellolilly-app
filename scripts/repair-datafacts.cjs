'use strict';

// One-time data repair — heal the "[object Object]" job-result datafacts the old ingest
// bug wrote into the live store (ingest-cv.cjs, fixed in the same branch), WITHOUT
// changing any fact id.
//
// Why not delete-and-re-seed: the seed re-mints fresh ids every run. Five existing cases
// already referenced the seeded fact ids in their cvDraft and fit fields, so re-issuing
// ids severed 108 references (the first re-seed attempt did exactly this — id churn, not
// corruption, was the harm). So we repair IN PLACE: keep each corrupted fact's id and
// only replace its text (and tags) with what the fixed mapper produces. No id changes =>
// no reference can dangle.
//
// Mapping: a fresh ingest of cv_data.json is the canonical pool — real text, full tags, in
// seed order. We match each stored seeded fact (everything except the minted `fill-gap`
// answers) to its canonical twin and heal the corrupted ones UNDER THEIR ORIGINAL ID:
//
//   - A surviving fact is matched by its exact TEXT (cv_data.json texts are unique). This
//     verifies its identity by content and is independent of load order, so a re-run on an
//     already-healed store is a clean no-op no matter how the rows come back.
//   - A corrupted fact ("[object Object]") has no text to check, so we cannot trust its
//     position blindly. We verify it by the signal that survived: its job-level TAGS must
//     be the prefix of the canonical job_result it aligns to (same type, same company/job).
//     The corrupted facts pair to the destroyed slots in the store's DETERMINISTIC load
//     order (rowid = seed order); the tag check ABORTS on any cross-job misalignment.
//
// ponytail: two corrupted results OF THE SAME JOB are indistinguishable once their text is
// gone (identical job-level tags, opaque ids), so their relative binding rests on the
// deterministic load order — not verifiable, only preservable. That is why the SQLite
// adapter now loads ORDER BY rowid and overwrites in place (no rowid churn): the order the
// repair trusts is the seed order, pinned. Cross-job reordering IS caught, by the tags.
//
// RUN WITH THE SERVER STOPPED, against a store that still has the ORIGINAL seed ids (the
// pre-reseed backup, if the first re-seed already ran). Idempotent: a store with zero
// "[object Object]" facts is left untouched.
//
//   node scripts/repair-datafacts.cjs
//   STORE_PATH=/path/to/store.db node scripts/repair-datafacts.cjs

const path = require('node:path');
const fs = require('node:fs');
const { createSqliteStore } = require('../server/skeleton/store/sqlite.cjs');
const { cvDataToDatafacts } = require('../server/skeleton/datafacts/ingest-cv.cjs');
const { DEFAULT_JSON } = require('./seed-datafacts.cjs');

const DB_PATH = process.env.STORE_PATH || path.resolve(__dirname, '../server/data/store.db');
const CORRUPT = '[object Object]';
const isGapAnswer = (f) => f.type === 'fill-gap';

// Walk any value for { kind:'datafact', id } refs — same shape the store's gate uses.
function collectRefs(v, out = []) {
  if (Array.isArray(v)) v.forEach((x) => collectRefs(x, out));
  else if (v && typeof v === 'object') {
    if (v.kind === 'datafact' && v.id) out.push(v.id);
    for (const x of Object.values(v)) collectRefs(x, out);
  }
  return out;
}

// Count references to a non-existent fact id across every case's cvDraft and fit.
function danglingRefs(store) {
  const factIds = new Set(store.listDatafacts().map((f) => f.id));
  let n = 0;
  for (const c of store.listCases()) {
    for (const part of ['cvDraft', 'fit']) {
      const data = c[part] && c[part].data;
      if (data) for (const id of collectRefs(data)) if (!factIds.has(id)) n++;
    }
  }
  return n;
}

// `a` is a prefix of `b` (same values, in order, up to a.length). Used to verify a
// corrupted fact's surviving job-level tags against a canonical fact's fuller tags.
const isPrefix = (a, b) => a.length <= b.length && a.every((x, i) => x === b[i]);

// Repair in place. Returns { fixed } — how many "[object Object]" facts were healed.
function repair(store, { jsonPath = DEFAULT_JSON } = {}) {
  const cv = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const fresh = cvDataToDatafacts(cv, 'en'); // fixed mapper => real text + tags, in seed order
  const seeded = store.listDatafacts().filter((f) => !isGapAnswer(f)); // original ids, deterministic order

  if (seeded.length !== fresh.length) {
    throw new Error(`alignment: store has ${seeded.length} seeded facts, cv_data.json yields ${fresh.length} — cannot map`);
  }

  // Pass 1 — VERIFY every surviving fact by its exact text and claim its canonical slot.
  // Order-independent (texts are unique), so this is exactly what makes a re-run a no-op.
  const canonByText = new Map(fresh.map((f) => [f.text, { f, claimed: false }]));
  const corrupt = []; // corrupted facts, in the store's deterministic load order
  for (const s of seeded) {
    if (s.text === CORRUPT) { corrupt.push(s); continue; }
    const c = canonByText.get(s.text);
    if (!c || c.claimed) {
      throw new Error(`alignment: seeded fact not in cv_data.json (store drifted) — type=${s.type} text=${JSON.stringify(s.text).slice(0, 60)}`);
    }
    if (c.f.type !== s.type) throw new Error(`alignment: type mismatch for ${JSON.stringify(s.text).slice(0, 40)} — store=${s.type} cv=${c.f.type}`);
    c.claimed = true;
  }

  // Pass 2 — the unclaimed canonical facts are exactly the destroyed slots. Pair them to
  // the corrupted facts in seed/load order and VERIFY each pairing by tags (the surviving
  // signal): abort rather than bind a bullet to the wrong id.
  const destroyed = fresh.filter((f) => !canonByText.get(f.text).claimed); // seed order
  if (corrupt.length !== destroyed.length) {
    throw new Error(`alignment: ${corrupt.length} corrupted facts but ${destroyed.length} destroyed slots in cv_data.json`);
  }
  const plan = [];
  for (let k = 0; k < corrupt.length; k++) {
    const s = corrupt[k];
    const f = destroyed[k];
    if (s.type !== f.type || !isPrefix(s.tags || [], f.tags || [])) {
      throw new Error(
        `alignment: corrupted fact ${s.id} (${s.type}, tags ${JSON.stringify(s.tags)}) does not match the ${f.type} it aligns to ` +
        `(tags ${JSON.stringify(f.tags)}) — refusing to bind the wrong evidence to an id`,
      );
    }
    plan.push({ ...s, text: f.text, tags: f.tags }); // same id => in-place overwrite
  }

  for (const fact of plan) store.ingestDatafact(fact);

  const remaining = store.listDatafacts().filter((f) => f.text === CORRUPT).length;
  if (remaining !== 0) throw new Error(`repair left ${remaining} "[object Object]" facts`);
  return { fixed: plan.length };
}

function report(label, store) {
  const facts = store.listDatafacts();
  console.log(
    `${label}: total=${facts.length}  "[object Object]"=${facts.filter((f) => f.text === CORRUPT).length}` +
    `  fill-gap=${facts.filter(isGapAnswer).length}  cases=${store.listCases().length}  danglingRefs=${danglingRefs(store)}`,
  );
}

if (require.main === module) {
  const store = createSqliteStore({ path: DB_PATH });
  try {
    console.log(`Repairing datafacts in ${DB_PATH}\n`);
    report('BEFORE', store);
    const gapBefore = store.listDatafacts().filter(isGapAnswer).length;
    const { fixed } = repair(store);
    report('AFTER ', store);
    console.log(`  repaired ${fixed} facts in place (ids unchanged)`);

    // Hard checks — the review's mandated end state.
    const facts = store.listDatafacts();
    if (facts.filter((f) => f.text === CORRUPT).length !== 0) throw new Error('non-zero "[object Object]"');
    if (facts.filter(isGapAnswer).length !== gapBefore) throw new Error('gap answers changed');
    if (danglingRefs(store) !== 0) throw new Error('store has dangling fact references');
    console.log('OK — zero "[object Object]", gap answers preserved, ids stable, zero dangling references.');
  } finally {
    store.close();
  }
}

module.exports = { repair, danglingRefs };
