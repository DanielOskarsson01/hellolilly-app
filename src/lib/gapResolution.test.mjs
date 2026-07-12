import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openGaps, skippedGaps, cvGateOpen } from './gapResolution.mjs';

const gap = (id, resolution) => (resolution === undefined ? { id, what: `gap ${id}` } : { id, what: `gap ${id}`, resolution });

test('CV gate opens when every gap is terminally resolved (accepted or skipped)', () => {
  assert.equal(cvGateOpen([gap('g1', 'accepted'), gap('g2', 'skipped')]), true);
  assert.equal(cvGateOpen([gap('g1', 'accepted'), gap('g2', 'accepted')]), true);
});

test('CV gate stays closed while any gap lacks a resolution', () => {
  assert.equal(cvGateOpen([gap('g1', 'accepted'), gap('g2')]), false);
  assert.deepEqual(openGaps([gap('g1', 'accepted'), gap('g2')]).map((g) => g.id), ['g2']);
});

test('a truthy but non-terminal resolution does NOT open the gate (fail-closed)', () => {
  for (const junk of [true, 'yes', 'resolved', 'pending', 1, 'ACCEPTED']) {
    assert.equal(cvGateOpen([gap('g1', junk)]), false, `resolution ${JSON.stringify(junk)} must not count as terminal`);
    assert.equal(openGaps([gap('g1', junk)]).length, 1, `resolution ${JSON.stringify(junk)} keeps the gap open`);
  }
});

test('no gaps at all leaves the gate open (nothing to resolve)', () => {
  assert.equal(cvGateOpen([]), true);
  assert.equal(cvGateOpen(undefined), true);
});

test('skippedGaps selects exactly the consciously-skipped ones', () => {
  const gaps = [gap('g1', 'accepted'), gap('g2', 'skipped'), gap('g3'), gap('g4', 'skipped')];
  assert.deepEqual(skippedGaps(gaps).map((g) => g.id), ['g2', 'g4']);
});
