import test from 'node:test';
import assert from 'node:assert/strict';
import { NAV_GROUPS } from './navGroups.mjs';

const ansok = NAV_GROUPS.find(g => g.id === 'ansok');
const byId = (id) => ansok.items.find(i => i.id === id);

test('D17 nav split: the #cv item is renamed to "Anpassad CV" with its route id unchanged', () => {
  const cv = byId('cv');
  assert.ok(cv, 'the cv item still exists');
  assert.equal(cv.id, 'cv', 'route id #cv is unchanged');
  assert.equal(cv.label, 'Anpassad CV', 'label tells the truth about the tailored-draft screen');
  assert.ok(!cv.soon, 'Anpassad CV is a live, navigable item');
});

test('D17 nav split: a new honest-disabled "CV-byggaren" reserves the D15 slot', () => {
  const b = byId('cv-byggaren');
  assert.ok(b, 'the placeholder item exists');
  assert.equal(b.label, 'CV-byggaren');
  assert.equal(b.soon, true, 'honest-disabled ("Kommer"), not a dead link');
  // it sits right after Anpassad CV, so the two CV entries read together
  const ids = ansok.items.map(i => i.id);
  assert.equal(ids[ids.indexOf('cv') + 1], 'cv-byggaren');
});

test('cv-byggaren is the only honest-disabled item, and it carries no navigable wiring', () => {
  const soonItems = NAV_GROUPS.flatMap(g => g.items).filter(i => i.soon);
  assert.deepEqual(soonItems.map(i => i.id), ['cv-byggaren'], 'exactly one placeholder introduced');
  // an honest-disabled item is label + soon only — no badge or other affordance that implies action
  assert.deepEqual(Object.keys(byId('cv-byggaren')).sort(), ['id', 'label', 'soon']);
});
