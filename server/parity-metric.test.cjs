'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const M = require('../harness/phase0/parity-metric.cjs');

const BLOCK = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'harness', 'phase0', 'TEMPLATE_DEFINITION.md'), 'utf8').match(/```json\s*([\s\S]*?)```/)[1],
);

// ---------- P3 distance metric ----------
test('jaccardDistance: identical=0, disjoint=1, half-overlap known', () => {
  assert.strictEqual(M.jaccardDistance(['a', 'b'], ['a', 'b']), 0);
  assert.strictEqual(M.jaccardDistance(['a'], ['b']), 1);
  assert.strictEqual(M.jaccardDistance([], []), 0);
  assert.strictEqual(M.jaccardDistance(['a', 'b'], ['a', 'c']), 1 - 1 / 3); // inter 1, union 3
});

test('kendallTauDistance: same order=0, reversed=1, <2 shared=0 (never NaN)', () => {
  assert.strictEqual(M.kendallTauDistance(['a', 'b', 'c'], ['a', 'b', 'c']), 0);
  assert.strictEqual(M.kendallTauDistance(['a', 'b', 'c'], ['c', 'b', 'a']), 1); // all 3 pairs discordant
  assert.strictEqual(M.kendallTauDistance(['a'], ['a']), 0); // 1 shared -> no order info
  assert.strictEqual(M.kendallTauDistance(['a', 'x'], ['y', 'a']), 0); // <2 shared
  assert.ok(!Number.isNaN(M.kendallTauDistance([], [])));
});

test('sectionDistance blends the two halves', () => {
  // sets {a,b} vs {a,c}: jaccard 2/3; common {a}: order term 0 -> 0.5*2/3 + 0 = 1/3
  assert.ok(Math.abs(M.sectionDistance(['a', 'b'], ['a', 'c']) - 1 / 3) < 1e-9);
});

test('runDistance is the mean across the union of section keys', () => {
  const a = { summary: ['s1'], highlights: ['h1', 'h2'] };
  const b = { summary: ['s1'], highlights: ['h3', 'h4'] };
  // summary identical -> 0; highlights disjoint -> 0.5*1 + 0 = 0.5; mean = 0.25
  assert.ok(Math.abs(M.runDistance(a, b) - 0.25) < 1e-9);
});

test('p3PassRule: cross > within passes; unstable within fails', () => {
  // three ads, selections differ a lot BETWEEN ads, little WITHIN ad
  const mk = (base) => ({ summary: [base + '_s'], highlights: [base + '_1', base + '_2'] });
  const pass = M.p3PassRule({
    primary: [mk('P'), mk('P'), mk('P')], // within-primary distance 0 (identical)
    control: [mk('C'), mk('C'), mk('C')],
    second: [mk('S'), mk('S'), mk('S')],
  });
  assert.strictEqual(pass.pass, true);
  assert.strictEqual(pass.maxWithin, 0);
  assert.ok(pass.minCross > 0);
  assert.strictEqual(pass.crossCount, 9);

  // now make primary unstable (run 3 == a control selection) so a within pair >= a cross pair
  const fail = M.p3PassRule({
    primary: [mk('P'), mk('P'), mk('C')],
    control: [mk('C'), mk('C'), mk('C')],
    second: [mk('S'), mk('S'), mk('S')],
  });
  assert.strictEqual(fail.pass, false); // minCross (P vs C incl the P-run that IS C -> 0) not > maxWithin
});

// ---------- P1 / P2 on a well-formed draft (FULL definition: 10 sections, typed refs) ----------
const ref = (id) => ({ datafactRef: { kind: 'datafact', id }, text: `text-${id}` });
const cat = (id, title, items) => ({ ref: { kind: 'category', id }, id, title, items: items.map(ref) });
const job = (key, bullet) => ({ key, company: BLOCK.job_headers[key].company, period: BLOCK.job_headers[key].period, role: { ref: { kind: 'role', id: `role:${key}` }, text: BLOCK.job_roles[key] }, intro: [], bullets: [ref(bullet)] });
// committed structural source for category + role refs
const STRUCT = M.buildStructuralText(BLOCK, [
  { type: 'competency', category: { id: 'marketing-growth', title: 'Marketing & Growth' } },
  { type: 'competency', category: { id: 'leadership-scaling', title: 'Leadership & Scaling' } },
  { type: 'competency', category: { id: 'data-analytics', title: 'Data & Analytics' } },
]);
function validDraft() {
  return {
    language: 'en', provenance: 'untrusted-derived',
    sections: [
      { key: 'header_image', heading: '', structural: true },
      { key: 'name_contact', heading: '', structural: true, name: 'Daniel Oskarsson' },
      { key: 'summary', heading: '', items: [ref('sum1')] },
      { key: 'highlights', heading: 'Career Highlights', items: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(ref) },
      { key: 'competencies', heading: 'Core Competencies', categories: [
        cat('marketing-growth', 'Marketing & Growth', ['m1', 'm2', 'm3', 'm4']),
        cat('leadership-scaling', 'Leadership & Scaling', ['l1', 'l2', 'l3', 'l4']),
        cat('data-analytics', 'Data & Analytics', ['d1', 'd2', 'd3', 'd4']),
      ] },
      { key: 'experience', heading: 'Professional Experience', jobs: [
        job('onlyigaming', 'j1'), job('coinhero', 'j2'), job('betclic', 'j3'), job('comeon', 'j4'), job('mrgreen', 'j5'),
      ] },
      { key: 'earlier', heading: 'Earlier Career', items: [ref('e1')] },
      { key: 'other', heading: 'Other Experience', items: [ref('o1')] },
      { key: 'education', heading: 'Education', items: [ref('edu1')] },
      { key: 'awards', heading: 'Awards, Recognition & Languages', items: [ref('a1')] },
    ],
  };
}
// section indices: 0 header_image, 1 name_contact, 2 summary, 3 highlights, 4 competencies,
// 5 experience, 6 earlier, 7 other, 8 education, 9 awards.

test('P1: a well-formed FULL draft conforms to the template machine block (10 sections)', () => {
  const r = M.validateStructure(validDraft(), BLOCK);
  assert.deepStrictEqual(r.errors, []);
  assert.strictEqual(r.ok, true);
});

test('P1 catches: missing chrome, wrong order, wrong heading, bad cardinality, empty section (JC2)', () => {
  const d0 = validDraft(); d0.sections = d0.sections.slice(1); // drop header_image
  assert.match(M.validateStructure(d0, BLOCK).errors.join(';'), /header_image|section order/);

  const d1 = validDraft(); [d1.sections[3], d1.sections[4]] = [d1.sections[4], d1.sections[3]];
  assert.match(M.validateStructure(d1, BLOCK).errors.join(';'), /section order/);

  const d2 = validDraft(); d2.sections[3].heading = 'Wrong';
  assert.match(M.validateStructure(d2, BLOCK).errors.join(';'), /heading\[highlights\]/);

  const d3 = validDraft(); d3.sections[4].categories = d3.sections[4].categories.slice(0, 1); // 1 category < min 2
  assert.match(M.validateStructure(d3, BLOCK).errors.join(';'), /competency categories/);

  const d4 = validDraft(); d4.sections[5].jobs = d4.sections[5].jobs.slice(0, 4); // 4 jobs != 5
  assert.match(M.validateStructure(d4, BLOCK).errors.join(';'), /jobs 4 != 5/);

  const d5 = validDraft(); d5.sections[8].items = []; // education empty
  assert.match(M.validateStructure(d5, BLOCK).errors.join(';'), /education empty|JC2/);
});

test('P1: a job with an intro but ZERO bullets fails (bullets distinct from intro — the Coinhero class)', () => {
  const d = validDraft();
  d.sections[5].jobs[1] = { key: 'coinhero', company: BLOCK.job_headers.coinhero.company, period: BLOCK.job_headers.coinhero.period, role: { ref: { kind: 'role', id: 'role:coinhero' }, text: BLOCK.job_roles.coinhero }, intro: [ref('ci')], bullets: [] };
  assert.match(M.validateStructure(d, BLOCK).errors.join(';'), /coinhero has 0 bullets|no bullets|< 1/);
});

// review #2 finding 8 — P1 must enforce the FULL machine block, not just "5 jobs, >=1 bullet".
// Each mutation below passed the OLD validator (jobs reordered, static company/period/role changed,
// an unknown section added, a job over its variant-fixed bullet ceiling) and must now fail P1.
test('P1 (finding 8) enforces job order/keys, static company+period+role, no unknown sections, bullet ceiling', () => {
  // jobs reordered (swap coinhero <-> betclic) -> fixed-order violation
  const dOrder = validDraft();
  [dOrder.sections[5].jobs[1], dOrder.sections[5].jobs[2]] = [dOrder.sections[5].jobs[2], dOrder.sections[5].jobs[1]];
  assert.match(M.validateStructure(dOrder, BLOCK).errors.join(';'), /position 1|fixed order/i);

  // static company changed -> violation
  const dCompany = validDraft();
  dCompany.sections[5].jobs[0].company = 'Totally Different Co | Nowhere';
  assert.match(M.validateStructure(dCompany, BLOCK).errors.join(';'), /company/i);

  // static period changed -> violation
  const dPeriod = validDraft();
  dPeriod.sections[5].jobs[0].period = '1999 - 2000';
  assert.match(M.validateStructure(dPeriod, BLOCK).errors.join(';'), /period/i);

  // static role text changed -> violation
  const dRole = validDraft();
  dRole.sections[5].jobs[0].role.text = 'Chief Something Officer';
  assert.match(M.validateStructure(dRole, BLOCK).errors.join(';'), /role/i);

  // an unknown section added -> violation (must NOT be silently dropped)
  const dUnknown = validDraft();
  dUnknown.sections.splice(3, 0, { key: 'made_up_section', heading: 'X', items: [ref('u1')] });
  assert.match(M.validateStructure(dUnknown, BLOCK).errors.join(';'), /unknown section|made_up_section/i);

  // over-ceiling bullets (coinhero ceiling 5, give 6) -> violation
  const dCeil = validDraft();
  dCeil.sections[5].jobs[1].bullets = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'].map(ref);
  assert.match(M.validateStructure(dCeil, BLOCK).errors.join(';'), /ceiling|> 5|coinhero has 6/i);

  // at-ceiling bullets (comeon ceiling 6, give exactly 6) -> OK (within bound)
  const dAt = validDraft();
  dAt.sections[5].jobs[3].bullets = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6'].map(ref);
  assert.deepStrictEqual(M.validateStructure(dAt, BLOCK).errors, []);
});

test('P2: verbatim datafact ids + typed category/role refs resolve; dangling/reworded/duplicate fail', () => {
  const d = validDraft();
  const ids = ['sum1', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'm1', 'm2', 'm3', 'm4', 'l1', 'l2', 'l3', 'l4', 'd1', 'd2', 'd3', 'd4', 'j1', 'j2', 'j3', 'j4', 'j5', 'e1', 'o1', 'edu1', 'a1'];
  const pool = new Set(ids);
  const src = new Map(ids.map((id) => [id, `text-${id}`]));
  assert.deepStrictEqual(M.validateProvenance(d, pool, src, STRUCT).errors, []);

  // a category/role ref that is NOT in the committed structural source fails
  const dBad = validDraft(); dBad.sections[4].categories[0].id = 'made-up'; dBad.sections[4].categories[0].ref = { kind: 'category', id: 'made-up' };
  assert.match(M.validateProvenance(dBad, pool, src, STRUCT).errors.join(';'), /made-up \(category\) not in the committed/);

  // dangling datafact id
  assert.match(M.validateProvenance(d, new Set(ids.filter((x) => x !== 'm1')), src, STRUCT).errors.join(';'), /m1 not in the Phase 0 pool/);

  // reworded datafact text
  const src2 = new Map(src); src2.set('h1', 'REWORDED');
  assert.match(M.validateProvenance(d, pool, src2, STRUCT).errors.join(';'), /text for h1 != source/);

  // duplicate id within a section (highlights = index 3)
  const dup = validDraft(); dup.sections[3].items.push(ref('h1'));
  assert.match(M.validateProvenance(dup, new Set([...ids]), src, STRUCT).errors.join(';'), /duplicate id h1/);
});

test('selectionOf collects the COMPLETE committed extraction: category ids + role ids + items', () => {
  const sel = M.selectionOf(validDraft());
  assert.deepStrictEqual(Object.keys(sel).sort(), ['competencies', 'experience', 'highlights', 'other', 'summary']);
  assert.deepStrictEqual(sel.highlights, ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
  assert.deepStrictEqual(sel.competencies, ['marketing-growth', 'm1', 'm2', 'm3', 'm4', 'leadership-scaling', 'l1', 'l2', 'l3', 'l4', 'data-analytics', 'd1', 'd2', 'd3', 'd4']);
  assert.deepStrictEqual(sel.experience, ['role:onlyigaming', 'j1', 'role:coinhero', 'j2', 'role:betclic', 'j3', 'role:comeon', 'j4', 'role:mrgreen', 'j5']);
  assert.ok(!('earlier' in sel), 'static sections are not part of the selection');
});
