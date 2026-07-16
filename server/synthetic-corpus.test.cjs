'use strict';
// Shape parity: the committed synthetic corpus must present competencies in the SAME shape the
// live pool carries after the category enrichment, so the offline CI structure tests and the live
// parity runs exercise ONE tailor path (Daniel's binding condition for Route B).

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const tailor = require('./submodules/cv-tailor/execute.cjs');

const corpus = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'harness', 'phase0', 'fixtures', 'synthetic-corpus.json'), 'utf8'));

// Flatten the synthetic competency_categories to datafacts — the SAME conversion a corpus->pool
// step does, producing the live enriched fact shape. (The Step-4 CI gate reuses this shape.)
function competencyFacts(c) {
  const out = [];
  for (const cat of c.competency_categories) {
    for (const it of cat.items) {
      out.push({
        id: it.id, kind: 'datafact', type: 'competency', text: it.text,
        tags: ['competency', cat.group], language: 'en',
        category: { id: cat.id, title: cat.title, group: cat.group, source: cat.source },
      });
    }
  }
  return out;
}

test('synthetic competency facts carry the exact live enriched field shape', () => {
  const facts = competencyFacts(corpus);
  assert.ok(facts.length >= 12, 'three categories worth of items');
  for (const f of facts) {
    assert.deepStrictEqual(Object.keys(f).sort(), ['category', 'id', 'kind', 'language', 'tags', 'text', 'type']);
    assert.strictEqual(f.type, 'competency');
    assert.deepStrictEqual(Object.keys(f.category).sort(), ['group', 'id', 'source', 'title']);
    assert.strictEqual(f.tags[0], 'competency');
    assert.strictEqual(f.tags[1], f.category.group);
  }
});

test('candidatePool groups the synthetic corpus into the same category shape as live (JC1-satisfiable)', () => {
  const pool = tailor.candidatePool(competencyFacts(corpus));
  // three categories, each with 4-6 items (JC1 bounds)
  assert.strictEqual(pool.competencyCategories.length, 3);
  for (const cat of pool.competencyCategories) {
    assert.ok(cat.id && cat.title && cat.source, 'category carries id/title/source');
    assert.ok(cat.items.length >= tailor.COMP.itemsPerCategory.min && cat.items.length <= tailor.COMP.itemsPerCategory.max,
      `${cat.title} has ${cat.items.length} items, within ${tailor.COMP.itemsPerCategory.min}-${tailor.COMP.itemsPerCategory.max}`);
  }
  // titles are approved pool categories
  const titles = pool.competencyCategories.map((c) => c.title);
  assert.ok(titles.includes('Marketing & Growth') && titles.includes('Leadership & Scaling'));
});
