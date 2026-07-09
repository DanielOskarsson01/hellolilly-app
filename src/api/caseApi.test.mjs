import test from 'node:test';
import assert from 'node:assert/strict';
import { saveCoverLetterDraft, linkJobCase, alignKeyword } from './caseApi.js';

test('saveCoverLetterDraft POSTs to the letter-draft route with the draft body', async () => {
  const calls = [];
  globalThis.fetch = async (path, opts) => { calls.push({ path, opts }); return { ok: true, status: 200, json: async () => ({ ok: true, part: {} }) }; };
  await saveCoverLetterDraft('c1', { paragraphs: ['p'], decisions: { x: 'keep' }, language: 'en' });
  assert.equal(calls[0].path, '/api/case/c1/letter-draft');
  assert.equal(calls[0].opts.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].opts.body), { language: 'en', paragraphs: ['p'], decisions: { x: 'keep' } });
});

test('linkJobCase POSTs the caseId to the job-case route', async () => {
  const calls = [];
  globalThis.fetch = async (path, opts) => { calls.push({ path, opts }); return { ok: true, status: 200, json: async () => ({ ok: true, job: {} }) }; };
  await linkJobCase('job_x', 'c1');
  assert.equal(calls[0].path, '/api/job/job_x/case');
  assert.deepEqual(JSON.parse(calls[0].opts.body), { caseId: 'c1' });
});

// Fix 2 contract: a transport error is a FAILED ENVELOPE, not a truth-refusal. alignKeyword
// must REJECT on a non-2xx (the screen's catch → 'error' state, retryable copy) and must never
// hand back a refusal-shaped value. This is the seam the screen switches on; a rejection can
// never reach the `r.outcome === 'refused'` branch, so a server error can never render the
// "we won't add that word" honesty copy.
test('alignKeyword REJECTS on a 500 (transport error is a failed envelope, not a refusal)', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 500, json: async () => ({ ok: false, error: 'boom' }) });
  await assert.rejects(
    () => alignKeyword('c1', { term: 'kubernetes', basisDatafactId: 'df_1' }),
    /boom|HTTP 500/,
    'a 500 must reject — the screen renders the neutral error state, never the refusal copy',
  );
});

// A genuine judge refusal is a READY RESULT whose content is a refusal: HTTP 200, ok:false,
// resolved (not thrown) to { outcome:'refused' } so the screen renders the honesty copy.
test('alignKeyword RESOLVES a genuine refusal (200, ok:false) to outcome:refused — distinct from an error', async () => {
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ ok: false, result: { outcome: 'refused', reason: "the CV doesn't support it", term: 'kubernetes' } }) });
  const result = await alignKeyword('c1', { term: 'kubernetes', basisDatafactId: 'df_1' });
  assert.equal(result.outcome, 'refused', 'a refusal resolves (never throws) so it renders as the refusal state, not the error state');
  assert.equal(result.reason, "the CV doesn't support it");
});
