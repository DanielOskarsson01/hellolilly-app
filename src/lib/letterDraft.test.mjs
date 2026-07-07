import test from 'node:test';
import assert from 'node:assert/strict';
import { remapDecisions, seedEditor, unresolvedCount } from './letterDraft.mjs';

test('remapDecisions keeps matching claims, drops stale, leaves new unset', () => {
  const old = { 'claim A': 'keep', 'claim B': 'cut' };
  const out = remapDecisions(old, ['claim A', 'claim C']);
  assert.deepEqual(out, { 'claim A': 'keep' }); // B dropped (gone), C unset
});

test('seedEditor prefers the draft when present, remapping decisions to live claims', () => {
  const draft = { paragraphs: ['d1'], decisions: { 'x': 'soften', 'gone': 'cut' } };
  const letter = { paragraphs: ['l1'], unsupported_by_cv: ['x', 'y'] };
  const out = seedEditor(draft, letter);
  assert.equal(out.source, 'draft');
  assert.deepEqual(out.paragraphs, ['d1']);
  assert.deepEqual(out.decisions, { 'x': 'soften' }); // 'gone' dropped, 'y' unset
});

test('seedEditor falls back to the letter when no draft', () => {
  const letter = { paragraphs: ['l1', 'l2'], unsupported_by_cv: ['x'] };
  const out = seedEditor(null, letter);
  assert.equal(out.source, 'letter');
  assert.deepEqual(out.paragraphs, ['l1', 'l2']);
  assert.deepEqual(out.decisions, {});
});

test('unresolvedCount counts claims with no decision', () => {
  assert.equal(unresolvedCount(['x', 'y', 'z'], { 'x': 'keep' }), 2);
});
