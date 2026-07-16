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

// ---------- P1 / P2 on a well-formed draft ----------
const ref = (id) => ({ datafactRef: { kind: 'datafact', id }, text: `text-${id}` });
function validDraft() {
  return {
    language: 'en', provenance: 'untrusted-derived',
    sections: [
      { key: 'summary', heading: '', items: [ref('sum1')] },
      { key: 'highlights', heading: 'Career Highlights', items: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(ref) },
      { key: 'competencies', heading: 'Core Competencies', categories: [
        { id: 'marketing-growth', title: 'Marketing & Growth', items: ['m1', 'm2', 'm3', 'm4'].map(ref) },
        { id: 'leadership-scaling', title: 'Leadership & Scaling', items: ['l1', 'l2', 'l3', 'l4'].map(ref) },
        { id: 'data-analytics', title: 'Data & Analytics', items: ['d1', 'd2', 'd3', 'd4'].map(ref) },
      ] },
      { key: 'experience', heading: 'Professional Experience', jobs: [
        { key: 'onlyigaming', company: 'X', period: 'p', items: [ref('j1')] },
        { key: 'coinhero', company: 'X', period: 'p', items: [ref('j2')] },
        { key: 'betclic', company: 'X', period: 'p', items: [ref('j3')] },
        { key: 'comeon', company: 'X', period: 'p', items: [ref('j4')] },
        { key: 'mrgreen', company: 'X', period: 'p', items: [ref('j5')] },
      ] },
      { key: 'earlier', heading: 'Earlier Career', items: [ref('e1')] },
      { key: 'other', heading: 'Other Experience', items: [ref('o1')] },
      { key: 'education', heading: 'Education', items: [ref('edu1')] },
      { key: 'awards', heading: 'Awards, Recognition & Languages', items: [ref('a1')] },
    ],
  };
}

test('P1: a well-formed draft conforms to the template machine block', () => {
  const r = M.validateStructure(validDraft(), BLOCK);
  assert.deepStrictEqual(r.errors, []);
  assert.strictEqual(r.ok, true);
});

test('P1 catches: wrong order, wrong heading, bad cardinality, empty section (JC2)', () => {
  const d1 = validDraft(); [d1.sections[1], d1.sections[2]] = [d1.sections[2], d1.sections[1]];
  assert.match(M.validateStructure(d1, BLOCK).errors.join(';'), /section order/);

  const d2 = validDraft(); d2.sections[1].heading = 'Wrong';
  assert.match(M.validateStructure(d2, BLOCK).errors.join(';'), /heading\[highlights\]/);

  const d3 = validDraft(); d3.sections[2].categories = d3.sections[2].categories.slice(0, 1); // 1 category < min 2
  assert.match(M.validateStructure(d3, BLOCK).errors.join(';'), /competency categories/);

  const d4 = validDraft(); d4.sections[3].jobs = d4.sections[3].jobs.slice(0, 4); // 4 jobs != 5
  assert.match(M.validateStructure(d4, BLOCK).errors.join(';'), /jobs 4 != 5/);

  const d5 = validDraft(); d5.sections[6].items = []; // education empty
  assert.match(M.validateStructure(d5, BLOCK).errors.join(';'), /education empty|JC2/);
});

test('P2: verbatim resolving ids pass; dangling/reworded/duplicate fail', () => {
  const d = validDraft();
  const ids = ['sum1', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'm1', 'm2', 'm3', 'm4', 'l1', 'l2', 'l3', 'l4', 'd1', 'd2', 'd3', 'd4', 'j1', 'j2', 'j3', 'j4', 'j5', 'e1', 'o1', 'edu1', 'a1'];
  const pool = new Set(ids);
  const src = new Map(ids.map((id) => [id, `text-${id}`])); // matches ref() text
  assert.deepStrictEqual(M.validateProvenance(d, pool, src).errors, []);

  // dangling: drop an id from the pool
  assert.match(M.validateProvenance(d, new Set(ids.filter((x) => x !== 'm1')), src).errors.join(';'), /m1 not in the Phase 0 pool/);

  // reworded: source text differs from node text
  const src2 = new Map(src); src2.set('h1', 'REWORDED');
  assert.match(M.validateProvenance(d, pool, src2).errors.join(';'), /text for h1 != source/);

  // duplicate id within a section
  const dup = validDraft(); dup.sections[1].items.push(ref('h1'));
  assert.match(M.validateProvenance(dup, new Set([...ids]), src).errors.join(';'), /duplicate id h1/);
});

test('selectionOf collects only tailorable sections, in order, as id lists', () => {
  const sel = M.selectionOf(validDraft());
  assert.deepStrictEqual(Object.keys(sel).sort(), ['competencies', 'experience', 'highlights', 'other', 'summary']);
  assert.deepStrictEqual(sel.highlights, ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
  assert.deepStrictEqual(sel.competencies, ['m1', 'm2', 'm3', 'm4', 'l1', 'l2', 'l3', 'l4', 'd1', 'd2', 'd3', 'd4']);
  assert.deepStrictEqual(sel.experience, ['j1', 'j2', 'j3', 'j4', 'j5']);
  assert.ok(!('earlier' in sel), 'static sections are not part of the selection');
});
