'use strict';

// 3.1 / 3.4 — the documents module: attested intake classes, deterministic spanisation,
// INV2 span-schema validation, storage + span lifecycle, and the 3.1 stop-the-discard
// retention inside the gap-fill loop.

const { test } = require('node:test');
const assert = require('node:assert');
const {
  ATTESTED_CLASSES, isBarredAsExperienceSource, spanise, createDocument,
  storeDocument, deleteDocument, MAX_DOCUMENT_BYTES, SPAN_SCHEMA,
} = require('./skeleton/documents/index.cjs');
const { validate } = require('./skeleton/prompt-assembly/index.cjs');
const { createStore } = require('./skeleton/store/index.cjs');

test('spanise: headings, bullets and paragraphs become schema-complete spans (INV2)', () => {
  const text = [
    'PROFESSIONAL EXPERIENCE',
    '',
    'Head of Casino at Betclic, Bordeaux.',
    '',
    'Key results:',
    '- Grew revenue 40% in one year',
    '- Built a team of 12',
    '',
    'A closing paragraph with no heading above it beyond the last one.',
  ].join('\n');
  const spans = spanise(text);
  assert.ok(spans.length >= 4, `expected >=4 spans, got ${spans.length}`);
  // every BOUND span (as stored) passes the INV2 schema
  const bound = createDocument({ name: 'CV', text, attestedClass: 'old_cv', ownership: 'mine' }).spans;
  for (const s of bound) {
    const v = validate(s, SPAN_SCHEMA);
    assert.deepStrictEqual(v.errors, [], `span fails INV2 schema: ${JSON.stringify(s)}`);
  }
  // heading context is carried
  const revenue = spans.find((s) => s.text.includes('Grew revenue'));
  assert.strictEqual(revenue.heading, 'Key results:');
  assert.strictEqual(revenue.section, 'PROFESSIONAL EXPERIENCE');
  // bullets are individual spans
  const team = spans.find((s) => s.text.includes('team of 12'));
  assert.ok(team && team !== revenue);
  // location is real line numbers
  assert.strictEqual(typeof revenue.location.startLine, 'number');
});

test('spanise: headings themselves are not spans; empty text yields zero spans', () => {
  assert.deepStrictEqual(spanise(''), []);
  const spans = spanise('SUMMARY\n\nOne line of content.');
  assert.strictEqual(spans.length, 1);
  assert.strictEqual(spans[0].section, 'SUMMARY');
});

test('createDocument: validates attested class, caps size, stamps sha + context', () => {
  assert.throws(() => createDocument({ name: 'x', text: 'y', attestedClass: 'nope', ownership: 'mine' }), /attested class/);
  assert.throws(() => createDocument({ name: 'x', text: 'a'.repeat(MAX_DOCUMENT_BYTES + 1), attestedClass: 'other', ownership: 'mine' }), /exceeds/);
  const { doc, spans } = createDocument({
    name: 'My letter', text: 'Dear team,\n\nI led the launch of a casino brand.',
    attestedClass: 'cover_letter', ownership: 'mine', context: { note: 'test' },
  });
  assert.match(doc.id, /^document_/);
  assert.strictEqual(doc.attestedClass, 'cover_letter');
  assert.strictEqual(doc.ownership, 'mine');
  assert.strictEqual(typeof doc.sha256, 'string');
  assert.strictEqual(doc.context.note, 'test');
  assert.ok(spans.length >= 1);
  for (const s of spans) assert.strictEqual(s.documentId, doc.id);
});

test('createDocument: non-text content gets the explicit parse-failure, never a silent empty span set', () => {
  assert.throws(() => createDocument({ name: 'x', text: 'abc\u0000def', attestedClass: 'other', ownership: 'mine' }), /parse/i);
  assert.throws(() => createDocument({ name: 'x', text: 42, attestedClass: 'other', ownership: 'mine' }), /parse/i);
});

test('INV3 predicate: job-ad and third-party attested documents are barred as experience sources', () => {
  for (const cls of ATTESTED_CLASSES) {
    const barred = isBarredAsExperienceSource({ attestedClass: cls });
    assert.strictEqual(barred, cls === 'job_ad' || cls === 'third_party', cls);
  }
  // ownership alone also bars, whatever the class claims
  assert.strictEqual(isBarredAsExperienceSource({ attestedClass: 'old_cv', ownership: 'third_party' }), true);
});

test('storeDocument + deleteDocument: deleting a document purges its (unminted) spans', () => {
  const store = createStore();
  const a = createDocument({ name: 'A', text: 'Alpha content here.', attestedClass: 'old_cv', ownership: 'mine' });
  const b = createDocument({ name: 'B', text: 'Beta content here.', attestedClass: 'qa_notes', ownership: 'mine' });
  storeDocument(store, a.doc, a.spans);
  storeDocument(store, b.doc, b.spans);
  assert.strictEqual(store.listRecords('documents').length, 2);
  assert.strictEqual(store.listRecords('spans').length, a.spans.length + b.spans.length);
  deleteDocument(store, a.doc.id);
  assert.strictEqual(store.listRecords('documents').length, 1);
  const left = store.listRecords('spans');
  assert.strictEqual(left.length, b.spans.length);
  assert.ok(left.every((s) => s.documentId === b.doc.id), 'only the other document’s spans remain');
});

// ---- 3.1 stop the discard: the gap-fill loop retains the person's typed answer ----

test('3.1: applyAnswer retains the raw answer as a gap-answer document even when the judge rejects', async () => {
  const { applyAnswer } = require('./skeleton/fill-gap/bullet-judge.cjs');
  const store = createStore();
  const c = store.createCase({ company: 'X', role: 'Y' });
  store.writePart(c.meta.id, 'gaps', [{ id: 'gap_1', what: 'No SAP experience', why: 'ad wants SAP' }]);
  store.writePart(c.meta.id, 'decodedRole', { requirements: [{ id: 'req_1', requirement: 'SAP experience' }] });
  const llm = { completeJSON: async () => ({ canFill: false, reason: 'too vague' }) };
  const out = await applyAnswer(store, llm, { caseId: c.meta.id, gapId: 'gap_1', answer: 'I once configured SAP for a client.', requirementId: 'req_1' });
  assert.strictEqual(out.outcome, 'stays_gap');
  const docs = store.listRecords('documents');
  assert.strictEqual(docs.length, 1, 'the typed answer is retained');
  assert.strictEqual(docs[0].attestedClass, 'gap_answer');
  assert.strictEqual(docs[0].ownership, 'mine');
  // the gap and requirement travel as structural context (MEDIUM 3)
  assert.strictEqual(docs[0].context.gapId, 'gap_1');
  assert.strictEqual(docs[0].context.requirementId, 'req_1');
  assert.match(docs[0].context.requirement, /SAP/);
  const spans = store.listRecords('spans');
  assert.ok(spans.length >= 1 && spans[0].text.includes('configured SAP'));
});
