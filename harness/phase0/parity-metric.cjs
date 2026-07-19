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

// DATAFACT-bearing leaves of a section (flat items, competency category items, experience job
// intro+bullets). Category/role nodes carry typed STRUCTURAL refs, walked by provenanceNodes.
function sectionItems(section) {
  return [
    ...(section.items || []),
    ...((section.categories || []).flatMap((c) => c.items || [])),
    ...((section.jobs || []).flatMap((j) => [...(j.intro || []), ...(j.bullets || [])])),
  ];
}

// Every ref-bearing node in document order, tagged by ref kind — the COMPLETE committed extraction
// (finding 9): summary, highlights, category ids + items, per-job role + intro + bullets, otherExp.
// datafact refs resolve against the pool; category/role are typed structural refs (kind:'category'|
// 'role') resolved against the committed taxonomy / frozen role table (see extraction-and-
// normalisation-rules.md). node.text is the datafact text, category title, or role title.
function provenanceNodes(section) {
  const out = [];
  for (const it of section.items || []) if (it.datafactRef) out.push({ kind: 'datafact', id: it.datafactRef.id, text: it.text });
  for (const c of section.categories || []) {
    if (c.ref) out.push({ kind: c.ref.kind, id: c.ref.id, text: c.title });
    for (const it of c.items || []) if (it.datafactRef) out.push({ kind: 'datafact', id: it.datafactRef.id, text: it.text });
  }
  for (const j of section.jobs || []) {
    if (j.role && j.role.ref) out.push({ kind: j.role.ref.kind, id: j.role.ref.id, text: j.role.text });
    for (const it of [...(j.intro || []), ...(j.bullets || [])]) if (it.datafactRef) out.push({ kind: 'datafact', id: it.datafactRef.id, text: it.text });
  }
  return out;
}

// The committed taxonomy/role resolver: role ids -> title (from block.job_roles) + competency
// category ids -> title (from the enriched facts). Passed to validateProvenance so category/role
// refs resolve against a committed source, exactly like datafact refs resolve against the pool.
function buildStructuralText(block, facts) {
  const m = new Map();
  for (const [key, title] of Object.entries((block && block.job_roles) || {})) m.set(`role:${key}`, title);
  for (const f of facts || []) if (f.type === 'competency' && f.category) m.set(f.category.id, f.category.title);
  return m;
}

// selection = { sectionKey: [refId, ...] } over the tailorable sections, in document order —
// including category ids + role ids (the complete committed extraction, finding 9).
function selectionOf(cvDraft) {
  const out = {};
  for (const s of (cvDraft && cvDraft.sections) || []) {
    if (!TAILORABLE.includes(s.key)) continue;
    out[s.key] = provenanceNodes(s).map((n) => n.id);
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
  header_image: 'header_image', name_contact: 'name_contact',
  summary: 'summary', highlights: 'career_highlights', competencies: 'core_competencies',
  experience: 'professional_experience', earlier: 'earlier_career', other: 'other_experience',
  education: 'education', awards: 'awards_languages',
};
// P1 validates the FULL definition (finding 8): all ten sections incl. header_image + name_contact
// as structural presence, distinct role/intro/bullets per job, and the cardinalities.
function validateStructure(cvDraft, block) {
  const errors = [];
  const secs = (cvDraft && cvDraft.sections) || [];
  // Unknown sections must be REJECTED, never silently dropped (finding 8): map every key, using a
  // sentinel for any key outside the committed set so the order comparison also catches an extra one.
  const unknown = secs.filter((s) => !KEY_TO_CANON[s.key]).map((s) => s.key);
  if (unknown.length) errors.push(`unknown section(s) ${JSON.stringify(unknown)} not in the committed template`);
  const canon = secs.map((s) => KEY_TO_CANON[s.key] || `?${s.key}`);
  if (JSON.stringify(canon) !== JSON.stringify(block.section_order)) errors.push(`section order ${JSON.stringify(canon)} != ${JSON.stringify(block.section_order)}`);
  const byKey = Object.fromEntries(secs.map((s) => [s.key, s]));
  // structural chrome presence
  if (!byKey.header_image) errors.push('header_image section missing');
  if (!byKey.name_contact || !byKey.name_contact.name) errors.push('name_contact section missing (no name)');
  // headings
  for (const [key, canonKey] of Object.entries(KEY_TO_CANON)) {
    const want = block.headings_en[canonKey];
    if (!want) continue; // summary + chrome have no heading in the template
    const s = byKey[key];
    if (s && s.heading !== want) errors.push(`heading[${key}] "${s && s.heading}" != "${want}"`);
  }
  const card = block.cardinality;
  const nItems = (s) => (s && s.items ? s.items.length : 0);
  if (nItems(byKey.summary) !== card.summary.exact) errors.push(`summary count ${nItems(byKey.summary)} != ${card.summary.exact}`);
  if (nItems(byKey.highlights) !== card.highlights.exact) errors.push(`highlights count ${nItems(byKey.highlights)} != ${card.highlights.exact}`);
  // competency categories 2-4, each 4-6 items, each carrying a typed category ref
  const cats = (byKey.competencies && byKey.competencies.categories) || [];
  if (cats.length < card.competency_categories.min || cats.length > card.competency_categories.max) errors.push(`competency categories ${cats.length} outside ${card.competency_categories.min}-${card.competency_categories.max}`);
  for (const c of cats) {
    const n = (c.items || []).length;
    if (n < card.competency_items_per_category.min || n > card.competency_items_per_category.max) errors.push(`category ${c.id} has ${n} items outside ${card.competency_items_per_category.min}-${card.competency_items_per_category.max}`);
    if (!c.ref || c.ref.kind !== 'category') errors.push(`category ${c.id} missing typed category ref`);
  }
  // jobs exactly 5, in the FIXED order + keys; each carries the STATIC company/period/role and a
  // bullet count within [1, ceiling] (finding 8). company/period/role are committed constants — the
  // tailor may never rename or reorder them; the bullet ceiling is the variant-fixed reference count
  // as an upper bound (over-selection fails; a pool shortfall renders fewer and is a P4 note).
  const jobs = (byKey.experience && byKey.experience.jobs) || [];
  if (jobs.length !== card.jobs.exact) errors.push(`jobs ${jobs.length} != ${card.jobs.exact}`);
  const ceilBy = (card.bullets_per_job && card.bullets_per_job.ceiling_by_job) || {};
  jobs.forEach((j, i) => {
    if (block.fixed_jobs[i] !== j.key) errors.push(`job at position ${i} is '${j.key}' but the fixed order requires '${block.fixed_jobs[i]}'`);
    const hdr = (block.job_headers || {})[j.key];
    if (!hdr) errors.push(`unknown job key '${j.key}'`);
    else {
      if (j.company !== hdr.company) errors.push(`job ${j.key} company changed (static): ${JSON.stringify(j.company)}`);
      if (j.period !== hdr.period) errors.push(`job ${j.key} period changed (static): ${JSON.stringify(j.period)}`);
    }
    const roleWant = (block.job_roles || {})[j.key];
    if (!j.role || !j.role.text || !j.role.ref) errors.push(`job ${j.key} missing role node`);
    else if (roleWant != null && j.role.text !== roleWant) errors.push(`job ${j.key} role text changed (static)`);
    if ((j.intro || []).length > 1) errors.push(`job ${j.key} intro > 1`);
    const bn = (j.bullets || []).length;
    if (bn < card.bullets_per_job.min) errors.push(`job ${j.key} has ${bn} bullets (< ${card.bullets_per_job.min})`);
    const ceil = ceilBy[j.key];
    if (ceil != null && bn > ceil) errors.push(`job ${j.key} has ${bn} bullets (> ceiling ${ceil})`);
  });
  if (nItems(byKey.other) < card.otherExp.min) errors.push('otherExp empty');
  // JC2: every content section present and non-empty (chrome is presence-checked above)
  if (block.all_sections_non_empty) {
    for (const key of Object.keys(KEY_TO_CANON)) {
      if (key === 'header_image' || key === 'name_contact') continue;
      const s = byKey[key];
      if (!s) { errors.push(`section ${key} missing`); continue; }
      const cnt = key === 'competencies' ? cats.reduce((a, c) => a + (c.items || []).length, 0)
        : key === 'experience' ? jobs.reduce((a, jj) => a + (jj.intro || []).length + (jj.bullets || []).length, 0)
        : nItems(s);
      if (cnt === 0) errors.push(`section ${key} empty (JC2)`);
    }
  }
  return { ok: errors.length === 0, errors };
}

// ---- P2 PROVENANCE: every node id resolves against the manifest pool; node text == source text
// under normalisation; identifiers unique within a section (a duplicate is a P2 failure). ----
// poolIds = Set of datafact ids from MANIFEST corpus.datafact_pool.items. sourceText = id -> text.
// P2 resolves the COMPLETE extraction (finding 9). datafact refs resolve against the pool (text ==
// source); category/role refs resolve against structuralText (the committed taxonomy + frozen role
// table). Every tailorable selection is thus identified, verified against a committed source, and
// unique within its section. structuralText from buildStructuralText(block, facts).
function validateProvenance(cvDraft, poolIds, sourceText, structuralText = new Map()) {
  const errors = [];
  for (const s of (cvDraft && cvDraft.sections) || []) {
    const seen = new Set();
    for (const node of provenanceNodes(s)) {
      const { kind, id, text } = node;
      if (!id) { errors.push(`node in ${s.key} has no ref`); continue; }
      if (seen.has(id)) errors.push(`duplicate id ${id} in section ${s.key}`); // P2 invariant
      seen.add(id);
      if (kind === 'datafact') {
        if (!poolIds.has(id)) errors.push(`id ${id} not in the Phase 0 pool snapshot`);
        else if (sourceText && normalise(text) !== normalise(sourceText.get(id))) errors.push(`text for ${id} != source (fabrication check)`);
      } else { // category | role — typed structural ref resolved against the committed source
        if (!structuralText.has(id)) errors.push(`structural ref ${id} (${kind}) not in the committed ${kind} source`);
        else if (normalise(text) !== normalise(structuralText.get(id))) errors.push(`text for ${kind} ${id} != committed source`);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

module.exports = {
  normalise, TAILORABLE, sectionItems, provenanceNodes, buildStructuralText, selectionOf,
  jaccardDistance, kendallTauDistance, sectionDistance, runDistance, p3PassRule,
  validateStructure, validateProvenance, KEY_TO_CANON,
};
