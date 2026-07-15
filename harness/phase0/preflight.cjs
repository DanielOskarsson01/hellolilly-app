#!/usr/bin/env node
// Wave 1 Phase 0a - preflight the reference machinery's inputs.
//
// Brief (WAVE_1_BRIEF_honest-tailor_v3.4.md, 0a): the reference loader
// warns-and-returns-empty on a missing SOFT input, so a run can complete
// "without errors" while feeding the LLM empty documents. The pass criterion
// is therefore NON-EMPTY loads with content length asserted - not absence of
// errors. Every required input (hard AND soft) must load non-empty or we STOP:
// there is no oracle to build parity against.
//
// This gate hard-fails (exit 1) on the first empty/missing input. It reads the
// LOCAL PARITY REFERENCE machinery (never committed, per the FIXTURE LAW), so
// the reference dir is machine-local and overridable via REF_CV_DIR.

const fs = require("fs");
const path = require("path");

const REF = process.env.REF_CV_DIR
  || "/Users/danieloskarsson/Library/CloudStorage/Dropbox/Projects/JobSearch/CVs";

const results = [];
let failed = false;

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  if (!ok) failed = true;
}

// Replicates the reference loader's search (CVs/<f> then CVs/../<f>) but, unlike
// the reference, treats missing/empty as a FAILURE instead of returning "".
function loadText(relRoots) {
  for (const rel of relRoots) {
    const p = path.join(REF, rel);
    if (fs.existsSync(p)) {
      const s = fs.readFileSync(p, "utf-8");
      return { path: p, len: s.length, text: s };
    }
  }
  return null;
}

function assertText(name, relRoots, minLen = 1) {
  const r = loadText(relRoots);
  if (!r) return record(name, false, `not found at any of: ${relRoots.join(", ")}`);
  if (r.text.trim().length < minLen) return record(name, false, `loaded but empty (${r.len} chars) @ ${r.path}`);
  record(name, true, `${r.len} chars @ ${path.relative(REF, r.path) || r.path}`);
}

function assertJson(name, rel, check) {
  const p = path.join(REF, rel);
  if (!fs.existsSync(p)) return record(name, false, `not found: ${rel}`);
  const raw = fs.readFileSync(p, "utf-8");
  if (!raw.trim()) return record(name, false, `empty file: ${rel}`);
  let j;
  try { j = JSON.parse(raw); } catch (e) { return record(name, false, `invalid JSON: ${e.message}`); }
  const problem = check(j);
  if (problem) return record(name, false, problem);
  record(name, true, `${raw.length} chars, parsed OK`);
}

function assertBinary(name, rel, minBytes = 1) {
  const p = path.join(REF, rel);
  if (!fs.existsSync(p)) return record(name, false, `not found: ${rel}`);
  const sz = fs.statSync(p).size;
  if (sz < minBytes) return record(name, false, `too small (${sz} bytes): ${rel}`);
  record(name, true, `${sz} bytes`);
}

// ---- both JSON files ----
assertJson("cv_data.json", "cv_data.json",
  j => (Array.isArray(j.identity_positioning) && j.identity_positioning.length) ? null : "missing/empty identity_positioning");
assertJson("COMPETENCY_MASTER_POOL.json", "COMPETENCY_MASTER_POOL.json",
  j => (j.categories && Object.keys(j.categories).length) ? null : "missing/empty categories");

// ---- both variants files (symlinks -> cv-source/en) ----
assertText("CV_JOB_VARIANTS.md", ["CV_JOB_VARIANTS.md"]);
assertText("CV_SECTION_VARIANTS.md", ["CV_SECTION_VARIANTS.md"]);

// ---- MASTER_CV.md (reference tries cv/ then root) ----
assertText("MASTER_CV.md", ["cv/MASTER_CV.md", "MASTER_CV.md"], 200);

// ---- highlight pool ----
assertJson("highlight-pool.json", "highlight-pool.json",
  j => (j && (Array.isArray(j.shared) ? j.shared.length : Object.keys(j).length)) ? null : "empty highlight pool");

// ---- i18n (require must yield an .en label set) ----
try {
  const i18n = require(path.join(REF, "i18n.js"));
  const ok = i18n && i18n.en && Object.keys(i18n.en).length;
  record("i18n.js", !!ok, ok ? `en has ${Object.keys(i18n.en).length} keys` : "no .en labels");
} catch (e) { record("i18n.js", false, `require failed: ${e.message}`); }

// ---- images (the 5 files IMAGE_MAP actually references) ----
const IMAGES = [
  "Header image medium business.jpg",        // generic, cmo
  "Header image medium internationlist.jpg", // igaming
  "Header image large builder.jpg",          // cpo, digital
  "Header image large business.jpg",         // ceo
  "Header image small builder.jpg",          // startup
];
for (const f of IMAGES) assertBinary(`image: ${f}`, path.join("images", "png", f), 1000);

// ---- SV sources (owed-later output, but a required reference input per 0a) ----
for (const f of ["cv_data.json", "COMPETENCY_MASTER_POOL.json", "CV_JOB_VARIANTS.md", "CV_SECTION_VARIANTS.md"]) {
  assertText(`SV source: ${f}`, [path.join("cv-source", "sv", f)]);
}

// ---- report ----
const w = Math.max(...results.map(r => r.name.length));
console.log(`\nWave 1 Phase 0a preflight  (REF_CV_DIR=${REF})\n`);
for (const r of results) console.log(`  ${r.ok ? "PASS" : "FAIL"}  ${r.name.padEnd(w)}  ${r.detail}`);
console.log(`\n  ${results.filter(r => r.ok).length}/${results.length} inputs load non-empty`);

// Live-key note: the reference RUN (0c) needs ANTHROPIC_API_KEY; the preflight
// itself does not generate, so it only reports the key's presence.
console.log(`  ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? "present" : "MISSING (needed for 0c capture, not for this preflight)"}`);

if (failed) {
  console.error("\nPREFLIGHT FAILED - a required reference input is missing or empty. STOP: there is no oracle to build parity against.\n");
  process.exit(1);
}
console.log("\nPREFLIGHT PASSED - every required reference input loads non-empty.\n");
