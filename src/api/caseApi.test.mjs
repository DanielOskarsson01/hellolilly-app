import test from 'node:test';
import assert from 'node:assert/strict';
import { saveCoverLetterDraft, linkJobCase } from './caseApi.js';

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
