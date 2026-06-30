'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { createApiHandler } = require('./dev-server.cjs');
const { createHost } = require('./skeleton/host.cjs');

function mockRes() {
  return {
    _status: 0,
    _body: null,
    writeHead(s) { this._status = s; },
    end(b) { this._body = b ? JSON.parse(b) : null; },
  };
}

function makeReq(method, url, body) {
  const handlers = {};
  const req = { method, url, on(ev, cb) { handlers[ev] = cb; return req; } };
  process.nextTick(() => {
    if (body) handlers.data && handlers.data(JSON.stringify(body));
    handlers.end && handlers.end();
  });
  return req;
}

test('GET /api/case/:id returns the case parts; analyze writes fit+gaps', async () => {
  const llm = { completeJSON: async () => ({ capability: { requirements: [], overall: 'ok' }, preference: { narrative: '' }, gaps: [] }) };
  const host = createHost({ llm });
  const c = host.store.createCase({ company: 'Acme', role: 'PM' });
  host.store.writePart(c.meta.id, 'decodedRole', { narrative: '', requirements: [{ id: 'decodedRequirement_1', requirement: 'X', rationale: '', weight: 1 }] });
  const handle = createApiHandler(host, { preferencesPath: null, llm });

  let res = mockRes();
  assert.equal(await handle(makeReq('GET', `/api/case/${c.meta.id}`), res), true);
  assert.equal(res._status, 200);
  assert.equal(res._body.case.meta.company, 'Acme');
  assert.equal(res._body.case.decodedRole.status, 'ready');

  res = mockRes();
  await handle(makeReq('POST', `/api/case/${c.meta.id}/analyze`), res);
  assert.equal(res._status, 200);
  assert.equal(res._body.ok, true);
  assert.equal(host.store.getCase(c.meta.id).fit.status, 'ready');
  assert.equal(host.store.getCase(c.meta.id).gaps.status, 'ready');
});

test('GET unknown case is 404', async () => {
  const host = createHost({ llm: { completeJSON: async () => ({}) } });
  const handle = createApiHandler(host, { preferencesPath: null, llm: null });
  const res = mockRes();
  assert.equal(await handle(makeReq('GET', '/api/case/nope'), res), true);
  assert.equal(res._status, 404);
  assert.equal(res._body.ok, false);
});

test('a non-case URL falls through (handler returns false)', async () => {
  const host = createHost({ llm: { completeJSON: async () => ({}) } });
  const handle = createApiHandler(host, { preferencesPath: null });
  const res = mockRes();
  assert.equal(await handle(makeReq('GET', '/api/health'), res), false);
  assert.equal(res._status, 0, 'handler did not write a response for an unmatched route');
});

function fillGapFixture(llm) {
  const host = createHost({ llm });
  const c = host.store.createCase({ company: 'Acme', role: 'PM' });
  host.store.writePart(c.meta.id, 'decodedRole', { narrative: '', requirements: [{ id: 'decodedRequirement_1', requirement: 'ML infra', rationale: '', weight: 1 }] });
  host.store.writePart(c.meta.id, 'fit', { capability: { requirements: [{ requirementRef: { kind: 'decodedRequirement', id: 'decodedRequirement_1' }, evidence: '', status: 'missing' }], overall: '' }, preference: { narrative: '' } });
  host.store.writePart(c.meta.id, 'gaps', [{ id: 'gap_1', what: 'No ML infra', why: '', bridge: { id: 'bridge_1', kind: 'honest-ramp', body: '', oneLiner: '', material: [{ source: 'cv' }] }, provenance: 'gap-analyzer' }]);
  return { host, caseId: c.meta.id };
}

test('POST /gap/:gapId/answer accepted flips the fit requirement to match', async () => {
  const llm = { completeJSON: async () => ({ canFill: true, bulletText: 'Built the feature store for 12 models in production.', reason: 'ok' }) };
  const { host, caseId } = fillGapFixture(llm);
  const handle = createApiHandler(host, { preferencesPath: null, llm });

  const res = mockRes();
  await handle(makeReq('POST', `/api/case/${caseId}/gap/gap_1/answer`, { answer: 'I built our feature store for 12 models', requirementId: 'decodedRequirement_1' }), res);
  assert.equal(res._status, 200);
  assert.equal(res._body.outcome, 'accepted');
  assert.ok(res._body.newDatafactId);
  assert.equal(host.store.getCase(caseId).fit.data.capability.requirements[0].status, 'match');
});

test('POST answer with missing fields is 400 and mints nothing', async () => {
  const llm = { completeJSON: async () => ({ canFill: true, bulletText: 'x', reason: 'ok' }) };
  const { host, caseId } = fillGapFixture(llm);
  const handle = createApiHandler(host, { preferencesPath: null, llm });
  const before = host.store.listDatafacts().length;

  const res = mockRes();
  await handle(makeReq('POST', `/api/case/${caseId}/gap/gap_1/answer`, { answer: 'only an answer, no requirementId' }), res);
  assert.equal(res._status, 400);
  assert.equal(res._body.ok, false);
  assert.equal(host.store.listDatafacts().length, before, 'nothing minted on a 400');
  assert.equal(host.store.getCase(caseId).fit.data.capability.requirements[0].status, 'missing');
});

function generateFixture(llm) {
  const host = createHost({ llm });
  host.store.ingestDatafact({ id: 'datafact_x', kind: 'datafact', type: 'job_result', text: 'Grew revenue 3x.', tags: ['ComeOn'], language: 'en' });
  const c = host.store.createCase({ company: 'Acme', role: 'PM' });
  host.store.writePart(c.meta.id, 'decodedRole', { narrative: '', requirements: [{ id: 'decodedRequirement_1', requirement: 'X', rationale: '', weight: 1 }] });
  host.store.writePart(c.meta.id, 'fit', { capability: { requirements: [{ requirementRef: { kind: 'decodedRequirement', id: 'decodedRequirement_1' }, evidence: 'Grew revenue 3x.', evidenceRef: { kind: 'datafact', id: 'datafact_x' }, status: 'match' }], overall: '' }, preference: { narrative: '' } });
  host.store.writePart(c.meta.id, 'gaps', []);
  return { host, caseId: c.meta.id };
}

test('POST /generate runs cv-builder + writer and returns both parts ready', async () => {
  const llm = { completeJSON: async ({ prompt }) => {
    if (prompt.includes('SELECT')) return { sections: [{ key: 'experience', heading: 'Experience', datafactIds: ['datafact_x'] }] };
    return { paragraphs: ['A clear opening line.', 'A solid middle paragraph.', 'An honest bridge.', 'A closing line.'], unsupported_by_cv: [] };
  } };
  const { host, caseId } = generateFixture(llm);
  const handle = createApiHandler(host, { preferencesPath: null, llm });

  const res = mockRes();
  await handle(makeReq('POST', `/api/case/${caseId}/generate`), res);
  assert.equal(res._status, 200);
  assert.equal(res._body.ok, true);
  assert.equal(host.store.getCase(caseId).cvDraft.status, 'ready');
  assert.equal(host.store.getCase(caseId).coverLetter.status, 'ready');
  assert.ok(res._body.coverLetter.paragraphs.length >= 4);
});

test('POST /generate is 207 with a per-generator error when one fails', async () => {
  // writer emits a banned phrase -> the writing-rules gate fails the coverLetter part.
  const llm = { completeJSON: async ({ prompt }) => {
    if (prompt.includes('SELECT')) return { sections: [{ key: 'experience', heading: 'Experience', datafactIds: ['datafact_x'] }] };
    return { paragraphs: ['I am a perfect fit and would hit the ground running.'], unsupported_by_cv: [] };
  } };
  const { host, caseId } = generateFixture(llm);
  const handle = createApiHandler(host, { preferencesPath: null, llm });

  const res = mockRes();
  await handle(makeReq('POST', `/api/case/${caseId}/generate`), res);
  assert.equal(res._status, 207);
  assert.equal(res._body.ok, false);
  assert.equal(host.store.getCase(caseId).cvDraft.status, 'ready', 'cv-builder still succeeded');
  assert.equal(host.store.getCase(caseId).coverLetter.status, 'failed', 'writer failed the gate');
  assert.ok(res._body.writer_error, 'the writer error is surfaced');
});
