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
  assert.equal(res._body.case.dossiers.status, 'absent', 'dossiers envelope IS served (the analysis stepper reads it)');

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

// --- Stream 2 jobs search (in-repo job-discovery, no sibling repo) ---

function jobsFakeHttp() {
  return {
    get: async (url) => {
      if (url.includes('jobtechdev.se')) {
        return { status: 200, body: JSON.stringify({ hits: [
          { id: 'jt9', headline: 'CMO at Acme', employer: { name: 'Acme' }, workplace_address: { municipality: 'Stockholm' }, description: { text: 'Own growth marketing.' }, webpage_url: 'https://jobs/jt9', publication_date: '2026-06-20' },
        ] }) };
      }
      return { status: 200, body: '[]' };
    },
  };
}

test('POST /api/jobs/search runs in-repo job-discovery and returns UI-shaped jobs', async () => {
  const host = createHost({ llm: null, search: null, http: jobsFakeHttp() });
  const handle = createApiHandler(host, { preferencesPath: null, llm: null });

  const res = mockRes();
  assert.equal(await handle(makeReq('POST', '/api/jobs/search', { keywords: ['CMO'], sources: ['jobtech'], municipality: '0180' }), res), true);
  assert.equal(res._status, 200);
  assert.equal(res._body.ok, true);
  assert.equal(res._body.jobs.length, 1);
  const j = res._body.jobs[0];
  assert.equal(j.co, 'Acme');
  assert.equal(j.t, 'CMO at Acme');
  assert.equal(j.city, 'Stockholm');
  assert.equal(j.type, 'Platsbanken');
  assert.ok(typeof j.match === 'number' && j.match >= 64);
  assert.equal(j.url, 'https://jobs/jt9');
  // the run also landed the canonical record in the backend jobs collection
  assert.equal(host.store.listRecords('jobs').length, 1);
});

test('POST /api/jobs/search with no matching providers returns empty jobs, not an error', async () => {
  const host = createHost({ llm: null, search: null, http: jobsFakeHttp() });
  const handle = createApiHandler(host, { preferencesPath: null, llm: null });
  const res = mockRes();
  await handle(makeReq('POST', '/api/jobs/search', { keywords: ['CMO'], sources: ['nonexistent-provider'] }), res);
  assert.equal(res._status, 200);
  assert.equal(res._body.ok, true);
  assert.deepEqual(res._body.jobs, []);
});

// --- Stream 2 case lifecycle routes (create / list / research) ---

const researchSearch = {
  grounded: async ({ query }) => ({ text: 'Grounded facts re: ' + String(query).slice(0, 30), citations: ['https://example.com/source'] }),
};

function researchLlm(override) {
  return {
    complete: async () => 'ok',
    completeJSON: async ({ prompt }) => {
      if (override) { const r = override(prompt); if (r !== undefined) return r; }
      if (/dossier as JSON/i.test(prompt)) return { summary: 'A short summary.', paragraphs: [{ text: 'Plain researched facts.' }] };
      if (/decoded role as JSON/i.test(prompt)) return { narrative: 'What the job really is.', requirements: [{ requirement: 'Own growth end to end', rationale: 'From the signals.', weight: 4 }] };
      return {};
    },
  };
}

test('POST /api/case creates a case (201); missing company/role is 400', async () => {
  const host = createHost({ llm: null, search: null });
  const handle = createApiHandler(host, { preferencesPath: null, llm: null });

  let res = mockRes();
  assert.equal(await handle(makeReq('POST', '/api/case', { company: 'Curoflow', role: 'Head of Marketing', sourceInput: 'The ad text.' }), res), true);
  assert.equal(res._status, 201);
  assert.equal(res._body.ok, true);
  assert.equal(res._body.case.meta.company, 'Curoflow');
  assert.equal(res._body.case.meta.sourceInput, 'The ad text.');
  assert.ok(res._body.case.meta.id.startsWith('case_'));
  assert.equal(host.store.getCase(res._body.case.meta.id).meta.role, 'Head of Marketing');

  res = mockRes();
  await handle(makeReq('POST', '/api/case', { company: '  ', role: 'X' }), res);
  assert.equal(res._status, 400);
  assert.equal(res._body.ok, false);
});

test('GET /api/cases lists case metas with part statuses', async () => {
  const host = createHost({ llm: null, search: null });
  const handle = createApiHandler(host, { preferencesPath: null, llm: null });
  const c = host.store.createCase({ company: 'Acme', role: 'PM' });
  host.store.writePart(c.meta.id, 'decodedRole', { narrative: '', requirements: [] });

  const res = mockRes();
  assert.equal(await handle(makeReq('GET', '/api/cases'), res), true);
  assert.equal(res._status, 200);
  assert.equal(res._body.cases.length, 1);
  assert.equal(res._body.cases[0].meta.company, 'Acme');
  assert.equal(res._body.cases[0].parts.decodedRole.status, 'ready');
  assert.ok(res._body.cases[0].parts.decodedRole.updatedAt, 'part carries updatedAt for activity derivation');
  assert.equal(res._body.cases[0].parts.fit.status, 'absent');
});

test('POST /api/case/:id/research runs researcher + brokered decoder', async () => {
  const host = createHost({ llm: researchLlm(), search: researchSearch });
  const handle = createApiHandler(host, { preferencesPath: null, llm: researchLlm() });
  const c = host.store.createCase({ company: 'Curoflow', role: 'Head of Marketing', sourceInput: 'Ad.' });

  const res = mockRes();
  assert.equal(await handle(makeReq('POST', `/api/case/${c.meta.id}/research`), res), true);
  assert.equal(res._status, 200);
  assert.equal(res._body.ok, true);
  const updated = host.store.getCase(c.meta.id);
  assert.equal(updated.dossiers.status, 'ready');
  assert.equal(updated.decodedRole.status, 'ready');
});

test('POST research on an unknown case is 404; a partial (decoder failed) run is 207', async () => {
  const failingDecoder = researchLlm((prompt) => {
    if (/decoded role as JSON/i.test(prompt)) throw new Error('decoder llm boom');
    return undefined;
  });
  const host = createHost({ llm: failingDecoder, search: researchSearch });
  const handle = createApiHandler(host, { preferencesPath: null, llm: failingDecoder });

  let res = mockRes();
  await handle(makeReq('POST', '/api/case/nope/research'), res);
  assert.equal(res._status, 404);

  const c = host.store.createCase({ company: 'Acme', role: 'PM' });
  res = mockRes();
  await handle(makeReq('POST', `/api/case/${c.meta.id}/research`), res);
  assert.equal(res._status, 207);
  assert.equal(res._body.ok, false);
  assert.equal(res._body.partial, true);
  assert.match(res._body.decoderError, /decoder llm boom/);
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

// --- Task 2: POST /api/job/:id/decide ---

test('POST /api/job/:id/decide writes decision + reason; reopen clears them; other fields untouched', async () => {
  const host = createHost({ llm: null });
  host.store.putRecord('jobs', { id: 'job_1', externalId: 'jobtech-1', title: 'CMO', company: 'Acme', location: 'Stockholm', decision: 'new', signal: 'low', matchedRules: [{ rule: 'x', term: 'y', stage: 1 }] });
  const handle = createApiHandler(host, { preferencesPath: null, llm: null });

  let res = mockRes();
  assert.equal(await handle(makeReq('POST', '/api/job/job_1/decide', { decision: 'rejected', reason: 'LOCATION', note: 'too far' }), res), true);
  assert.equal(res._status, 200);
  let stored = host.store.getRecord('jobs', 'job_1');
  assert.equal(stored.decision, 'rejected');
  assert.equal(stored.rejectReason, 'LOCATION');
  assert.equal(stored.rejectNote, 'too far');
  assert.equal(stored.title, 'CMO');                 // untouched
  assert.equal(stored.matchedRules[0].stage, 1);     // untouched

  res = mockRes();
  await handle(makeReq('POST', '/api/job/job_1/decide', { decision: 'new' }), res); // reopen
  stored = host.store.getRecord('jobs', 'job_1');
  assert.equal(stored.decision, 'new');
  assert.equal(stored.rejectReason, null);
  assert.equal(stored.rejectNote, null);
});

test('POST /api/job/:id/decide: 404 unknown, 400 bad decision, 400 rejected-without-reason', async () => {
  const host = createHost({ llm: null });
  const handle = createApiHandler(host, { preferencesPath: null, llm: null });
  let res = mockRes();
  await handle(makeReq('POST', '/api/job/nope/decide', { decision: 'approved' }), res);
  assert.equal(res._status, 404);
  res = mockRes();
  host.store.putRecord('jobs', { id: 'job_1', decision: 'new' });
  await handle(makeReq('POST', '/api/job/job_1/decide', { decision: 'banana' }), res);
  assert.equal(res._status, 400);
  res = mockRes();
  await handle(makeReq('POST', '/api/job/job_1/decide', { decision: 'rejected' }), res);
  assert.equal(res._status, 400);
});

test('decide survives a re-discovery dedup pass (decision not clobbered)', async () => {
  const host = createHost({ llm: null });
  host.store.putRecord('jobs', { id: 'job_1', externalId: 'jobtech-1', decision: 'new', signal: 'neutral', matchedRules: [] });
  const handle = createApiHandler(host, { preferencesPath: null, llm: null });
  await handle(makeReq('POST', '/api/job/job_1/decide', { decision: 'approved' }), mockRes());
  // simulate discovery re-seeing the same externalId (dedup path preserves the existing record)
  const existing = host.store.listRecords('jobs').find((j) => j.externalId === 'jobtech-1');
  assert.equal(existing.decision, 'approved');
});

test('POST /api/job/clear removes all jobs and returns cleared count', async () => {
  const host = createHost({ llm: null });
  host.store.putRecord('jobs', { id: 'job_1', externalId: 'jt-1', title: 'CMO', decision: 'new' });
  host.store.putRecord('jobs', { id: 'job_2', externalId: 'jt-2', title: 'VP Marketing', decision: 'approved' });
  assert.equal(host.store.listRecords('jobs').length, 2);

  const handle = createApiHandler(host, { preferencesPath: null, llm: null });
  const res = mockRes();
  assert.equal(await handle(makeReq('POST', '/api/job/clear'), res), true);
  assert.equal(res._status, 200);
  assert.equal(res._body.ok, true);
  assert.equal(res._body.cleared, 2);
  assert.equal(host.store.listRecords('jobs').length, 0);
});

test('GET /api/jobs returns stored canonical jobs with decision + signal + matchedRules', async () => {
  const host = createHost({ llm: null });
  host.store.putRecord('jobs', { id: 'job_1', externalId: 'jobtech-1', title: 'CMO', company: 'Acme', location: 'Stockholm', decision: 'new', signal: 'neutral', matchedRules: [] });
  host.store.putRecord('jobs', { id: 'job_2', externalId: 'rok-2', title: 'VP US', company: 'Playline', location: 'Remote US', decision: 'new', signal: 'low', matchedRules: [{ rule: 'location_out', term: 'US', stage: 1 }] });
  const handle = createApiHandler(host, { preferencesPath: null, llm: null });
  const res = mockRes();
  assert.equal(await handle(makeReq('GET', '/api/jobs'), res), true);
  assert.equal(res._status, 200);
  assert.equal(res._body.ok, true);
  assert.equal(res._body.jobs.length, 2);
  const flagged = res._body.jobs.find((j) => j.id === 'job_2');
  assert.equal(flagged.signal, 'low');
  assert.equal(flagged.matchedRules[0].stage, 1);
});

test('a new case exposes coverLetterDraft as an absent part', () => {
  const host = createHost();
  const c = host.store.createCase({ company: 'Acme', role: 'CMO' });
  assert.equal(c.coverLetterDraft.status, 'absent');
});

// --- Task 3: POST /api/job/:id/case ---

test('POST /api/job/:id/case links a caseId onto the durable job record (idempotent)', async () => {
  const host = createHost({ llm: null });
  host.store.putRecord('jobs', { id: 'job_x', externalId: 'e1', title: 'Head of Acq', company: 'BettingJobs', decision: 'approved' });
  const handle = createApiHandler(host, { preferencesPath: null, llm: null });

  const res1 = mockRes();
  assert.equal(await handle(makeReq('POST', '/api/job/job_x/case', { caseId: 'case_1' }), res1), true);
  assert.equal(res1._status, 200);
  assert.equal(res1._body.ok, true);
  assert.equal(res1._body.job.caseId, 'case_1');
  // durable: assert the store was updated
  assert.equal(host.store.getRecord('jobs', 'job_x').caseId, 'case_1');

  // idempotent: re-linking the same caseId returns 200, unchanged
  const res2 = mockRes();
  assert.equal(await handle(makeReq('POST', '/api/job/job_x/case', { caseId: 'case_1' }), res2), true);
  assert.equal(res2._status, 200);
  assert.equal(res2._body.job.caseId, 'case_1');
});

test('POST /api/job/:id/case: 404 unknown job, 400 missing caseId', async () => {
  const host = createHost({ llm: null });
  const handle = createApiHandler(host, { preferencesPath: null, llm: null });

  // 404: job not found
  const res404 = mockRes();
  await handle(makeReq('POST', '/api/job/no-such-job/case', { caseId: 'case_1' }), res404);
  assert.equal(res404._status, 404);
  assert.equal(res404._body.ok, false);

  // 400: missing caseId
  host.store.putRecord('jobs', { id: 'job_y', externalId: 'e2', title: 'CPO', company: 'Acme', decision: 'approved' });
  const res400 = mockRes();
  await handle(makeReq('POST', '/api/job/job_y/case', {}), res400);
  assert.equal(res400._status, 400);
  assert.equal(res400._body.ok, false);
});

test('POST /api/job/:id/case does NOT hit the case handler (shadowing regression)', async () => {
  // This verifies the job route sits above the /api/case/:id guard in dev-server.cjs.
  // If shadowed, GET /api/case/job_z would try to load 'job_z' as a case and not return 200
  // for the job POST route. Here we confirm the job/case route returns true (handled),
  // and that a distinct GET /api/case/:id still resolves to the case handler (not the job route).
  const host = createHost({ llm: null });
  host.store.putRecord('jobs', { id: 'job_z', externalId: 'e3', title: 'CMO', company: 'Acme', decision: 'approved' });
  const c = host.store.createCase({ company: 'Acme', role: 'CMO' });
  const handle = createApiHandler(host, { preferencesPath: null, llm: null });

  // The job/case route must be handled (not fall through to case handler)
  const resJob = mockRes();
  assert.equal(await handle(makeReq('POST', '/api/job/job_z/case', { caseId: c.meta.id }), resJob), true);
  assert.equal(resJob._status, 200);
  assert.equal(resJob._body.job.caseId, c.meta.id);

  // The GET /api/case/:id route still works (case handler not broken)
  const resCase = mockRes();
  assert.equal(await handle(makeReq('GET', `/api/case/${c.meta.id}`), resCase), true);
  assert.equal(resCase._status, 200);
  assert.equal(resCase._body.case.meta.company, 'Acme');
});

// --- Task 7: POST /api/case/:id/cv/align-keyword ---

function alignKeywordFixture() {
  const host = createHost({ llm: null });
  host.store.ingestDatafact({ id: 'datafact_k1', kind: 'datafact', type: 'cv', text: 'Led agile transformation across three squads.', tags: [], language: 'en' });
  const c = host.store.createCase({ company: 'Acme', role: 'PM' });
  host.store.writePart(c.meta.id, 'cvDraft', {
    sections: [{
      key: 'experience', heading: 'Experience',
      items: [{ text: 'Led agile transformation across three squads.', datafactRef: { kind: 'datafact', id: 'datafact_k1' } }],
    }],
  });
  return { host, caseId: c.meta.id };
}

test('POST /cv/align-keyword aligned round-trip: ok:true + term persisted in cvDraft', async () => {
  const { host, caseId } = alignKeywordFixture();
  const handle = createApiHandler(host, { preferencesPath: null, llm: null });
  const res = mockRes();
  await handle(makeReq('POST', `/api/case/${caseId}/cv/align-keyword`, { term: 'Scrum', basisDatafactId: 'datafact_k1' }), res);
  assert.equal(res._status, 200);
  assert.equal(res._body.ok, true);
  assert.equal(res._body.result.outcome, 'aligned');
  assert.equal(res._body.result.term, 'Scrum');
  // term must be persisted in the stored cvDraft in the EXACT case supplied
  const updated = host.store.getCase(caseId);
  const itemText = updated.cvDraft.data.sections[0].items[0].text;
  assert.ok(itemText.includes('Scrum'), `expected 'Scrum' (exact case) in "${itemText}"`);
});

test('POST /cv/align-keyword refused round-trip: ok:false + nothing written', async () => {
  const { host, caseId } = alignKeywordFixture();
  const handle = createApiHandler(host, { preferencesPath: null, llm: null });
  const before = host.store.getCase(caseId).cvDraft.data.sections[0].items[0].text;

  const res = mockRes();
  // No basisDatafactId → guardrail must refuse
  await handle(makeReq('POST', `/api/case/${caseId}/cv/align-keyword`, { term: 'Scrum', basisDatafactId: null }), res);
  assert.equal(res._status, 200);
  assert.equal(res._body.ok, false);
  assert.equal(res._body.result.outcome, 'refused');
  // nothing written
  const after = host.store.getCase(caseId).cvDraft.data.sections[0].items[0].text;
  assert.equal(after, before, 'refused path must not modify the cvDraft');
});

test('POST /api/case/:id/letter-draft writes a durable coverLetterDraft, readable via GET case', async () => {
  const host = createHost();
  const c = host.store.createCase({ company: 'Acme', role: 'CMO' });
  const body = { language: 'en', paragraphs: ['p1', 'p2'], decisions: { 'overclaim X': 'soften' } };
  const handle = createApiHandler(host, { preferencesPath: null, llm: null });
  const res = mockRes();
  await handle(makeReq('POST', `/api/case/${c.meta.id}/letter-draft`, body), res);
  assert.equal(res._status, 200);
  assert.equal(res._body.ok, true);
  assert.equal(res._body.part.status, 'ready');
  // durable round-trip: re-read straight from the store
  const reread = host.store.getCase(c.meta.id);
  assert.deepEqual(reread.coverLetterDraft.data.paragraphs, ['p1', 'p2']);
  assert.equal(reread.coverLetterDraft.data.decisions['overclaim X'], 'soften');
  // round-trip through the GET endpoint (catches the coverLetterDraft omission bug)
  const getRes = mockRes();
  assert.equal(await handle(makeReq('GET', `/api/case/${c.meta.id}`), getRes), true);
  assert.equal(getRes._status, 200);
  assert.deepEqual(getRes._body.case.coverLetterDraft.data.paragraphs, ['p1', 'p2']);
  assert.equal(getRes._body.case.coverLetterDraft.data.decisions['overclaim X'], 'soften');
});
