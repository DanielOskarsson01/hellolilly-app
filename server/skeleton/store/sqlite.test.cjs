'use strict';

// D1 — the durable store adapter (SQLite via node:sqlite, no external deps).
// The adapter must be signature-compatible with createStore() and preserve the two
// contracts the suite enforces elsewhere: the detach/immutability boundary and the
// writing-rules gate on authored case prose. Strategy under test: inner in-memory
// store as source of truth (all semantics inherited), row-level write-through to
// SQLite, full load at open.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { createSqliteStore } = require('./sqlite.cjs');

function tmpDbPath() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'll-sqlite-')), 'store.db');
}

// Make the cases-row write itself fail at the SQLite layer (no stubs): a trigger on the
// cases table aborts every insert. Datafact/record writes are untouched. Returns an undo.
function breakCaseWrites(dbPath) {
  const db = new DatabaseSync(dbPath);
  db.exec(`CREATE TRIGGER fail_case_writes BEFORE INSERT ON cases
           BEGIN SELECT RAISE(ABORT, 'simulated disk failure'); END;`);
  db.close();
  return () => {
    const d = new DatabaseSync(dbPath);
    d.exec('DROP TRIGGER fail_case_writes');
    d.close();
  };
}

function seedStore(store) {
  const c = store.createCase({ company: 'Acme', role: 'PM' });
  store.writePart(c.meta.id, 'decodedRole', {
    narrative: 'A plain narrative.',
    requirements: [{ id: 'decodedRequirement_1', requirement: 'Ship things', rationale: 'They ship weekly', weight: 3 }],
  });
  store.ingestDatafact({ id: 'datafact_1', kind: 'datafact', type: 'cv', text: 'Led a team of five.', tags: [], language: 'en' });
  store.putRecord('jobs', { id: 'job_1', externalId: 'jobtech-1', title: 'Head of Product', decision: 'rejected' });
  return c.meta.id;
}

test('sqlite store survives close + reopen with identical content (no duplication)', () => {
  const p = tmpDbPath();
  const a = createSqliteStore({ path: p });
  const caseId = seedStore(a);
  const before = { cases: a.listCases().length, facts: a.listDatafacts().length, jobs: a.listRecords('jobs').length };
  a.close();

  const b = createSqliteStore({ path: p });
  assert.equal(b.getCase(caseId).meta.company, 'Acme');
  assert.equal(b.getCase(caseId).decodedRole.status, 'ready');
  assert.equal(b.getCase(caseId).decodedRole.data.requirements[0].requirement, 'Ship things');
  assert.equal(b.getDatafact('datafact_1').text, 'Led a team of five.');
  assert.equal(b.getRecord('jobs', 'job_1').decision, 'rejected', 'job decisions survive');
  assert.deepEqual(
    { cases: b.listCases().length, facts: b.listDatafacts().length, jobs: b.listRecords('jobs').length },
    before,
    'reopen does not duplicate anything',
  );
  b.close();
});

test('detach/immutability boundary holds through the adapter', () => {
  const p = tmpDbPath();
  const store = createSqliteStore({ path: p });
  const rec = { id: 'job_x', tags: ['a'] };
  store.putRecord('jobs', rec);
  rec.tags.push('mutated-after-put');
  assert.deepEqual(store.getRecord('jobs', 'job_x').tags, ['a']);
  const got = store.getRecord('jobs', 'job_x');
  got.tags.push('mutated-after-read');
  assert.deepEqual(store.getRecord('jobs', 'job_x').tags, ['a']);
  store.close();
});

test('the writing-rules gate still throws and persists NOTHING', () => {
  const p = tmpDbPath();
  const a = createSqliteStore({ path: p });
  const c = a.createCase({ company: 'Acme', role: 'PM' });
  assert.throws(() => a.writePart(c.meta.id, 'decodedRole', { narrative: 'A robust dynamic synergy.', requirements: [] }), /Writing-rule/i);
  a.close();

  const b = createSqliteStore({ path: p });
  assert.equal(b.getCase(c.meta.id).decodedRole.status, 'absent', 'gate-rejected write left no trace on disk');
  b.close();
});

test('removeRecord persists the deletion', () => {
  const p = tmpDbPath();
  const a = createSqliteStore({ path: p });
  a.putRecord('jobs', { id: 'job_gone', title: 'X' });
  assert.equal(a.removeRecord('jobs', 'job_gone'), true);
  a.close();
  const b = createSqliteStore({ path: p });
  assert.equal(b.getRecord('jobs', 'job_gone'), null);
  b.close();
});

test('hydrate() rewrites the database (the JSON-snapshot migration path)', () => {
  const { createStore } = require('./index.cjs');
  const legacy = createStore();
  const caseId = seedStore(legacy);
  const snap = legacy.snapshot();

  const p = tmpDbPath();
  const a = createSqliteStore({ path: p });
  a.hydrate(snap);
  a.close();

  const b = createSqliteStore({ path: p });
  assert.equal(b.getCase(caseId).meta.company, 'Acme');
  assert.equal(b.listDatafacts().length, 1);
  assert.equal(b.getRecord('jobs', 'job_1').decision, 'rejected');
  b.close();
});

test('detachment across ALL ingest paths, proven against the durable store: in-session truth == post-restart truth', () => {
  const p = tmpDbPath();
  const a = createSqliteStore({ path: p });

  // path 1: ingestDatafact — post-ingest mutation must reach neither memory nor disk
  const df = { id: 'datafact_z', kind: 'datafact', type: 'cv', text: 'Exact evidence.', tags: [], language: 'en' };
  a.ingestDatafact(df);
  df.text = 'MUTATED';
  // path 2: createCase — mutating the returned case must not persist
  const c = a.createCase({ company: 'Acme', role: 'PM' });
  c.meta.company = 'MUTATED';
  // path 3: writePart — mutating the written data afterwards must not persist
  const decoded = { narrative: 'Plain words.', requirements: [] };
  a.writePart(c.meta.id, 'decodedRole', decoded);
  decoded.narrative = 'MUTATED';
  // path 4: putRecord — mutating the record afterwards must not persist
  const rec = { id: 'job_z', title: 'Original title' };
  a.putRecord('jobs', rec);
  rec.title = 'MUTATED';

  const inSession = {
    fact: a.getDatafact('datafact_z').text,
    company: a.getCase(c.meta.id).meta.company,
    narrative: a.getCase(c.meta.id).decodedRole.data.narrative,
    title: a.getRecord('jobs', 'job_z').title,
  };
  assert.deepEqual(inSession, { fact: 'Exact evidence.', company: 'Acme', narrative: 'Plain words.', title: 'Original title' });
  a.close();

  const b = createSqliteStore({ path: p });
  const postRestart = {
    fact: b.getDatafact('datafact_z').text,
    company: b.getCase(c.meta.id).meta.company,
    narrative: b.getCase(c.meta.id).decodedRole.data.narrative,
    title: b.getRecord('jobs', 'job_z').title,
  };
  assert.deepEqual(postRestart, inSession, 'restart changes nothing a mutation could not change in-session');
  b.close();
});

test('a failed SQLite case write rolls the LIVE store back — served state never outruns disk', () => {
  const p = tmpDbPath();
  const a = createSqliteStore({ path: p });
  const caseId = seedStore(a);
  a.writeParts(caseId, {
    fit: { capability: { requirements: [], overall: 'Plain.' }, preference: { narrative: '' } },
    gaps: [{ id: 'gap_1', what: 'A gap.' }],
  });

  const undo = breakCaseWrites(p);
  // writeParts: the accept path's atomic fit+resolution write
  assert.throws(
    () => a.writeParts(caseId, {
      fit: { capability: { requirements: [], overall: 'Changed.' }, preference: { narrative: '' } },
      gaps: [{ id: 'gap_1', what: 'A gap.', resolution: 'accepted' }],
    }),
    /simulated disk failure/,
  );
  assert.equal(a.getCase(caseId).fit.data.capability.overall, 'Plain.', 'live fit does not serve the failed write');
  assert.equal(a.getCase(caseId).gaps.data[0].resolution, undefined, 'live gap stays unresolved');
  // writePart: the skipped-resolution path
  assert.throws(() => a.writePart(caseId, 'gaps', [{ id: 'gap_1', what: 'A gap.', resolution: 'skipped' }]), /simulated disk failure/);
  assert.equal(a.getCase(caseId).gaps.data[0].resolution, undefined, 'writePart rolls back too');
  // setPartStatus and createCase follow the same all-or-nothing rule
  assert.throws(() => a.setPartStatus(caseId, 'gaps', 'failed', 'x'), /simulated disk failure/);
  assert.equal(a.getCase(caseId).gaps.status, 'ready');
  const casesBefore = a.listCases().length;
  assert.throws(() => a.createCase({ company: 'Never', role: 'Persisted' }), /simulated disk failure/);
  assert.equal(a.listCases().length, casesBefore, 'a case that never reached disk is not served');
  undo();
  a.close();

  const b = createSqliteStore({ path: p });
  assert.equal(b.getCase(caseId).fit.data.capability.overall, 'Plain.', 'disk tells the same story');
  assert.equal(b.getCase(caseId).gaps.data[0].resolution, undefined);
  b.close();
});

test('adapter self-describes for the health route', () => {
  const p = tmpDbPath();
  const store = createSqliteStore({ path: p });
  assert.equal(store.adapter, 'sqlite');
  assert.equal(store.path, p);
  store.close();
});

test('removeCase and removeDatafact delete durably (gone after reopen)', () => {
  const p = tmpDbPath();
  const a = createSqliteStore({ path: p });
  const caseId = seedStore(a);
  assert.equal(a.removeCase(caseId), true);
  assert.equal(a.removeDatafact('datafact_1'), true);
  assert.equal(a.removeCase('case_NOPE'), false, 'removeRecord convention: false, no throw');
  a.close();

  const b = createSqliteStore({ path: p });
  assert.equal(b.getCase(caseId), null, 'case row deleted on disk');
  assert.equal(b.getDatafact('datafact_1'), null, 'datafact row deleted on disk');
  b.close();
});

test('writeParts applies all parts together and a gate violation persists NONE of them', () => {
  const p = tmpDbPath();
  const a = createSqliteStore({ path: p });
  const caseId = seedStore(a);

  a.writeParts(caseId, { fit: { capability: { requirements: [], overall: 'Plain.' }, preference: { narrative: '' } }, gaps: [{ id: 'gap_1', what: 'A gap.' }] });
  a.close();
  const b = createSqliteStore({ path: p });
  assert.equal(b.getCase(caseId).fit.data.capability.overall, 'Plain.', 'both parts landed');
  assert.equal(b.getCase(caseId).gaps.data[0].id, 'gap_1');

  // One clean part + one banned part: the write must be all-or-nothing.
  assert.throws(
    () => b.writeParts(caseId, { fit: { capability: { requirements: [], overall: 'Still plain.' }, preference: { narrative: '' } }, gaps: [{ id: 'gap_1', what: 'We spearheaded it.' }] }),
    /spearheaded/,
  );
  assert.equal(b.getCase(caseId).fit.data.capability.overall, 'Plain.', 'clean part NOT applied when a sibling part violates');
  b.close();

  const c = createSqliteStore({ path: p });
  assert.equal(c.getCase(caseId).fit.data.capability.overall, 'Plain.', 'nothing from the failed write on disk either');
  c.close();
});
