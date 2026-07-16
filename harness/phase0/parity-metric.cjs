'use strict';

// Wave 1 parity metric + P1/P2 structure/provenance validators. This is the COMMITTED core the
// brief pins in Phase 0 ("committed in Phase 0 and does not change after capture"). Pure and
// dependency-free (offline-testable under `npm run verify`); the live 9-generation runner
// (run-parity.cjs) imports these.

// ---- committed normalisation (identical to cv-tailor + fixtures/normalise): whitespace +
// punctuation-spacing only. Parity compares normalised text; stored text stays verbatim. ----
function normalise(s) {
  return String(s).replace(/\s+/g, ' ').trim().replace(/\s+([,.;:!?])/g, '$1');
}

// The tailorable sections whose SELECTION P3 measures (static earlier/education/awards do not
// vary and are not "selected"). Each maps to an ordered, duplicate-free list of datafact ids.
const TAILORABLE = ['summary', 'highlights', 'competencies', 'experience', 'other'];

// leaves of a section across the three shapes (flat items, competency categories, experience jobs)
function sectionItems(section) {
  return [
    ...(section.items || []),
    ...((section.categories || []).flatMap((c) => c.items || [])),
    ...((section.jobs || []).flatMap((j) => j.items || [])),
  ];
}

// selection = { sectionKey: [datafactId, ...] } over the tailorable sections, in document order.
function selectionOf(cvDraft) {
  const out = {};
  for (const s of (cvDraft && cvDraft.sections) || []) {
    if (!TAILORABLE.includes(s.key)) continue;
    out[s.key] = sectionItems(s).map((it) => it.datafactRef && it.datafactRef.id).filter(Boolean);
  }
  return out;
}

// ---- P3 distance metric (brief §P3, fully specified) ----
// Jaccard distance between the identifier SETS.
function jaccardDistance(a, b) {
  const A = new Set(a), B = new Set(b);
  if (A.size === 0 && B.size === 0) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = new Set([...A, ...B]).size;
  return 1 - inter / union;
}

// Normalised Kendall-tau distance over the identifiers COMMON to both, in each run's order.
// Edge case (brief): fewer than two shared identifiers -> no order info -> 0 (never NaN).
function kendallTauDistance(a, b) {
  const inB = new Set(b);
  const common = a.filter((x) => inB.has(x)); // in a's order
  const k = common.length;
  if (k < 2) return 0;
  const posB = new Map(b.map((x, i) => [x, i]));
  let discordant = 0, total = 0;
  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      total++;
      if (posB.get(common[i]) > posB.get(common[j])) discordant++; // a-order says i<j, b-order disagrees
    }
  }
  return total === 0 ? 0 : discordant / total;
}

// per-section distance = 0.5*Jaccard + 0.5*normalised Kendall-tau
function sectionDistance(a, b) {
  return 0.5 * jaccardDistance(a || [], b || []) + 0.5 * kendallTauDistance(a || [], b || []);
}

// run distance = mean of per-section distances across the union of section keys
function runDistance(selA, selB) {
  const keys = new Set([...Object.keys(selA || {}), ...Object.keys(selB || {})]);
  if (keys.size === 0) return 0;
  let sum = 0;
  for (const key of keys) sum += sectionDistance((selA || {})[key], (selB || {})[key]);
  return sum / keys.size;
}

// PASS RULE: min distance across the nine primary-vs-control pairs must EXCEED the max within-ad
// pair distance (primary-vs-primary, control-vs-control, second-vs-second). runsByAd = {primary,
// control, second}: each an array of selections (from selectionOf). Returns the full decision.
function pairs(group) {
  const out = [];
  for (let i = 0; i < group.length; i++) for (let j = i + 1; j < group.length; j++) out.push([i, j, runDistance(group[i], group[j])]);
  return out;
}
function p3PassRule({ primary, control, second }) {
  const cross = [];
  for (let i = 0; i < primary.length; i++) for (let j = 0; j < control.length; j++) cross.push([i, j, runDistance(primary[i], control[j])]);
  const within = { primary: pairs(primary), control: pairs(control), second: pairs(second) };
  const withinAll = [...within.primary, ...within.control, ...within.second].map((p) => p[2]);
  const crossVals = cross.map((p) => p[2]);
  const minCross = Math.min(...crossVals);
  const maxWithin = withinAll.length ? Math.max(...withinAll) : 0;
  return { pass: minCross > maxWithin, minCross, maxWithin, crossCount: cross.length, cross, within };
}

// ---- P1 STRUCTURE: conform to the committed template machine block ----
// block = TEMPLATE_DEFINITION.md's JSON block. cvDraft = a HelloLilly draft. The header image is
// static (binding constraint: heights cannot fail parity) — not validated here.
const KEY_TO_CANON = {
  summary: 'summary', highlights: 'career_highlights', competencies: 'core_competencies',
  experience: 'professional_experience', earlier: 'earlier_career', other: 'other_experience',
  education: 'education', awards: 'awards_languages',
};
function validateStructure(cvDraft, block) {
  const errors = [];
  const secs = (cvDraft && cvDraft.sections) || [];
  const canon = secs.map((s) => KEY_TO_CANON[s.key]).filter(Boolean);
  // order: the draft's canonical sections appear in the template's declared order (minus the two
  // chrome sections header_image/name_contact, which are not draft sections).
  const expectedOrder = block.section_order.filter((k) => k !== 'header_image' && k !== 'name_contact');
  if (JSON.stringify(canon) !== JSON.stringify(expectedOrder)) errors.push(`section order ${JSON.stringify(canon)} != ${JSON.stringify(expectedOrder)}`);
  const byKey = Object.fromEntries(secs.map((s) => [s.key, s]));
  // headings
  for (const [key, canonKey] of Object.entries(KEY_TO_CANON)) {
    const want = block.headings_en[canonKey];
    if (!want) continue; // summary has no heading in the template
    const s = byKey[key];
    if (s && s.heading !== want) errors.push(`heading[${key}] "${s && s.heading}" != "${want}"`);
  }
  const card = block.cardinality;
  const count = (s) => (s ? sectionItems(s).length : 0);
  // summary exact 1
  if (count(byKey.summary) !== card.summary.exact) errors.push(`summary count ${count(byKey.summary)} != ${card.summary.exact}`);
  // highlights exact
  if (count(byKey.highlights) !== card.highlights.exact) errors.push(`highlights count ${count(byKey.highlights)} != ${card.highlights.exact}`);
  // competency categories 2-4, each 4-6 items
  const cats = (byKey.competencies && byKey.competencies.categories) || [];
  if (cats.length < card.competency_categories.min || cats.length > card.competency_categories.max) errors.push(`competency categories ${cats.length} outside ${card.competency_categories.min}-${card.competency_categories.max}`);
  for (const c of cats) {
    const n = (c.items || []).length;
    if (n < card.competency_items_per_category.min || n > card.competency_items_per_category.max) errors.push(`category ${c.id} has ${n} items outside ${card.competency_items_per_category.min}-${card.competency_items_per_category.max}`);
  }
  // jobs exactly 5, each >= 1 bullet
  const jobs = (byKey.experience && byKey.experience.jobs) || [];
  if (jobs.length !== card.jobs.exact) errors.push(`jobs ${jobs.length} != ${card.jobs.exact}`);
  for (const j of jobs) if ((j.items || []).length < card.bullets_per_job.min) errors.push(`job ${j.key} has no bullets`);
  // otherExp >= 1
  if (count(byKey.other) < card.otherExp.min) errors.push('otherExp empty');
  // JC2: all sections present and non-empty (static + tailorable)
  if (block.all_sections_non_empty) {
    for (const key of Object.keys(KEY_TO_CANON)) {
      if (!byKey[key]) { errors.push(`section ${key} missing`); continue; }
      if (count(byKey[key]) === 0) errors.push(`section ${key} empty (JC2)`);
    }
  }
  return { ok: errors.length === 0, errors };
}

// ---- P2 PROVENANCE: every node id resolves against the manifest pool; node text == source text
// under normalisation; identifiers unique within a section (a duplicate is a P2 failure). ----
// poolIds = Set of datafact ids from MANIFEST corpus.datafact_pool.items. sourceText = id -> text.
function validateProvenance(cvDraft, poolIds, sourceText) {
  const errors = [];
  for (const s of (cvDraft && cvDraft.sections) || []) {
    const seen = new Set();
    for (const it of sectionItems(s)) {
      const id = it.datafactRef && it.datafactRef.id;
      if (!id) { errors.push(`node in ${s.key} has no datafactRef`); continue; }
      if (seen.has(id)) errors.push(`duplicate id ${id} in section ${s.key}`); // P2 invariant
      seen.add(id);
      if (!poolIds.has(id)) errors.push(`id ${id} not in the Phase 0 pool snapshot`);
      else if (sourceText && normalise(it.text) !== normalise(sourceText.get(id))) errors.push(`text for ${id} != source (fabrication check)`);
    }
  }
  return { ok: errors.length === 0, errors };
}

module.exports = {
  normalise, TAILORABLE, sectionItems, selectionOf,
  jaccardDistance, kendallTauDistance, sectionDistance, runDistance, p3PassRule,
  validateStructure, validateProvenance, KEY_TO_CANON,
};
