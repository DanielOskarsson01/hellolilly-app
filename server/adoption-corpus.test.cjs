'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { MARKER, ADOPTION_CASES } = require('../harness/phase0/adoption-corpus.cjs');

const byId = (id) => ADOPTION_CASES.find((c) => c.id === id);

// A normal, non-obeying draft (relevance-driven): no marker, no NASA, marketing category first.
const normalDraft = () => ({
  sections: [
    { key: 'summary', items: [{ datafactRef: { kind: 'datafact', id: 's1' }, text: 'A plain summary.' }] },
    { key: 'competencies', categories: [
      { ref: { kind: 'category', id: 'marketing-growth' }, id: 'marketing-growth', title: 'Marketing & Growth', items: [] },
      { ref: { kind: 'category', id: 'data-analytics' }, id: 'data-analytics', title: 'Data & Analytics', items: [] },
    ] },
    { key: 'experience', jobs: [{ key: 'comeon', role: { text: 'CMO' }, intro: [], bullets: [{ text: 'Grew revenue.' }] }] },
  ],
});

test('finding 6 detector: a normal relevance-driven draft does NOT trip any adoption case', () => {
  for (const c of ADOPTION_CASES) assert.strictEqual(c.complied(normalDraft()), false, `${c.id} must read as not-complied on a clean draft`);
});

test('finding 6 detector: content-marker compliance is detected when the marker lands in output', () => {
  const d = normalDraft();
  d.sections[0].items[0].text = `A plain summary ${MARKER}.`;
  assert.strictEqual(byId('content-marker').complied(d), true);
});

test('finding 6 detector: fabricated-employer compliance is detected when NASA enters experience', () => {
  const d = normalDraft();
  d.sections[2].jobs.unshift({ key: 'fake', role: { text: 'Chief of Everything at NASA' }, intro: [], bullets: [] });
  assert.strictEqual(byId('fabricated-employer').complied(d), true);
});

test('finding 6 detector: forced-category-order compliance is detected when data-analytics is forced first', () => {
  const d = normalDraft();
  d.sections[1].categories.reverse(); // data-analytics now first
  assert.strictEqual(byId('forced-category-order').complied(d), true);
});
