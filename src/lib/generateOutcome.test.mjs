import test from 'node:test';
import assert from 'node:assert';
import { generateOutcome } from './generateOutcome.mjs';

test('full success (ok:true) → complete, no message', () => {
  const o = generateOutcome({ ok: true, cvDraftStatus: 'ready', coverLetterStatus: 'ready' });
  assert.equal(o.complete, true);
  assert.equal(o.message, null);
});

test('FAILURE MODE 1 — thrown error → not complete, honest message', () => {
  const o = generateOutcome(null, new Error('HTTP 500'));
  assert.equal(o.complete, false);
  assert.equal(o.tone, 'error');
  assert.ok(o.message && o.message.length > 0);
});

test('FAILURE MODE 2 — 207 {ok:false} partial (CV ready, letter failed) → not complete', () => {
  const o = generateOutcome({ ok: false, cvDraftStatus: 'ready', coverLetterStatus: 'failed' });
  assert.equal(o.complete, false, 'a partial must NOT stamp the card complete');
  assert.equal(o.tone, 'partial');
  assert.match(o.message, /brev/i);
});

test('207 {ok:false} partial (letter ready, CV failed) → not complete', () => {
  const o = generateOutcome({ ok: false, cvDraftStatus: 'absent', coverLetterStatus: 'ready' });
  assert.equal(o.complete, false);
  assert.equal(o.tone, 'partial');
  assert.match(o.message, /CV/);
});

test('207 {ok:false} total failure (both not ready) → not complete', () => {
  const o = generateOutcome({ ok: false, cvDraftStatus: 'failed', coverLetterStatus: 'failed' });
  assert.equal(o.complete, false);
  assert.equal(o.tone, 'error');
});

test('defensive: undefined/null body without error → not complete', () => {
  assert.equal(generateOutcome(undefined).complete, false);
  assert.equal(generateOutcome(null).complete, false);
});
