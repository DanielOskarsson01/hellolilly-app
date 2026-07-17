import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveVaultState } from './vaultEnvelope.mjs';

// Valvet slice 1 — the four envelope states (brief flow spec). The repo has no React
// render harness, so the state machine is a pure function the screen renders from, and
// this is the "one test per state" the brief asks for. Precedence matters: a load in
// flight is PENDING even over a prior error; an error is FAILED even with a stale count.

test('no vault yet, nothing loading → ABSENT', () => {
  assert.equal(deriveVaultState({ loading: false, error: null, count: 0 }), 'absent');
});

test('parse/upload in flight → PENDING (wins over a stale error)', () => {
  assert.equal(deriveVaultState({ loading: true, error: 'old', count: 0 }), 'pending');
});

test('parse failed → FAILED (even if a previous count lingers)', () => {
  assert.equal(deriveVaultState({ loading: false, error: 'kunde inte läsas', count: 5 }), 'failed');
});

test('rows present → READY', () => {
  assert.equal(deriveVaultState({ loading: false, error: null, count: 5 }), 'ready');
});
