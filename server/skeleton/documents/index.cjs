'use strict';

// Wave 2 — the documents module (brief 3.1 + 3.4). Host-level: intake attestation,
// deterministic spanisation, INV2 span-schema validation, storage and span lifecycle.
//
// Documents are a NEW UNTRUSTED INGESTION CLASS (brief §D12): the stored record is the
// EXTRACTED TEXT only (never an original binary), capped per file; spans reference their
// document by id and carry only their own snapshot. Deleting a document purges its
// unminted spans — a minted fact's span snapshot lives ON THE FACT (suggest/mint.cjs),
// so deletion is real, not cosmetic.
//
// Parser scope this pass: plain text and pasted text ONLY (the brief's stated fallback;
// a PDF/DOCX parser is a new dependency deliberately NOT taken — owed). Non-text content
// throws a ParseError so the caller can produce an explicit failed envelope, never a
// silent empty span set (Section 0 disposition).

const crypto = require('node:crypto');
const { mintId } = require('../ids.cjs');
const { validate } = require('../prompt-assembly/index.cjs');

// INTAKE ATTESTATION (3.4, load-bearing): the fixed set the person declares from.
// 'gap_answer' is the 3.1 auto-attested class for retained typed gap answers.
const ATTESTED_CLASSES = ['cover_letter', 'old_cv', 'qa_notes', 'job_ad', 'third_party', 'other', 'gap_answer'];

// INVARIANT 3 — attested source-class barring. Deterministic on the attestation (and on
// declared ownership), never on semantics: a job-ad-typed or third-party document can
// never be an experience source, whatever its headings look like.
function isBarredAsExperienceSource(doc) {
  return doc.attestedClass === 'job_ad' || doc.attestedClass === 'third_party' || doc.ownership === 'third_party';
}

const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024; // stated ceiling (brief 3.4), default 5 MB

// INVARIANT 2 — span schema completeness: heading, section, location on every span.
const SPAN_SCHEMA = {
  type: 'object',
  required: ['id', 'kind', 'documentId', 'text', 'heading', 'section', 'location'],
  props: {
    id: { type: 'string' }, kind: { type: 'string' }, documentId: { type: 'string' },
    text: { type: 'string' }, heading: { type: 'string' }, section: { type: 'string' },
    location: { type: 'object', required: ['startLine', 'endLine'], props: { startLine: { type: 'number' }, endLine: { type: 'number' } } },
  },
};

class ParseError extends Error {
  constructor(message) { super(message); this.name = 'ParseError'; }
}

// A line reads as a heading when it is short, unterminated prose-wise, and shaped like a
// label: markdown #, ALL CAPS, or trailing colon. Deterministic — no model involved.
function isHeadingLine(line) {
  const t = line.trim();
  if (!t || t.length > 60) return false;
  if (/^#{1,6}\s/.test(t)) return true;
  if (/:$/.test(t)) return true;
  const letters = t.replace(/[^A-Za-zÅÄÖåäö]/g, '');
  return letters.length >= 3 && letters === letters.toUpperCase() && !/[.!?]$/.test(t);
}

const isBullet = (line) => /^\s*[-*•·]\s+/.test(line);

// spanise(text) -> spans WITHOUT ids/documentId (bindSpans attaches those). Deterministic:
// bullets are individual spans; contiguous non-blank prose lines form one span; heading
// lines are context, not spans. `section` = nearest top-level heading ('body' before any),
// `heading` = nearest heading of any level ('' before any).
function spanise(text) {
  const lines = String(text).split(/\r?\n/);
  const out = [];
  let section = 'body';
  let heading = '';
  let sawSection = false;
  let buf = null; // { text lines, startLine }
  const flush = (endLine) => {
    if (!buf) return;
    const t = buf.lines.join(' ').replace(/\s+/g, ' ').trim();
    if (t) out.push({ text: t, heading, section, location: { startLine: buf.startLine, endLine } });
    buf = null;
  };
  lines.forEach((line, i) => {
    const n = i + 1;
    if (!line.trim()) { flush(n - 1); return; }
    if (isHeadingLine(line)) {
      flush(n - 1);
      const label = line.replace(/^#{1,6}\s/, '').trim();
      heading = label;
      if (!sawSection || !/:$/.test(line.trim())) { section = label; sawSection = true; }
      return;
    }
    if (isBullet(line)) {
      flush(n - 1);
      out.push({ text: line.replace(/^\s*[-*•·]\s+/, '').trim(), heading, section, location: { startLine: n, endLine: n } });
      return;
    }
    if (!buf) buf = { lines: [], startLine: n };
    buf.lines.push(line.trim());
  });
  flush(lines.length);
  return out;
}

// createDocument -> { doc, spans }. Validates the attestation, enforces the byte ceiling,
// rejects non-text content with a ParseError (explicit failure, Section 0), spanises, and
// schema-validates every span BEFORE anything is stored (INV2, Rule 2 output side).
function createDocument({ name, text, attestedClass, ownership = 'mine', context = {} }) {
  if (typeof text !== 'string' || /\u0000/.test(text)) {
    throw new ParseError('document parse failed: only plain text and pasted text are supported this pass (PDF/DOCX parsing is owed, not silently skipped)');
  }
  if (!ATTESTED_CLASSES.includes(attestedClass)) {
    throw new Error(`unknown attested class: ${attestedClass} (expected one of ${ATTESTED_CLASSES.join(', ')})`);
  }
  if (!['mine', 'third_party'].includes(ownership)) throw new Error(`unknown ownership: ${ownership}`);
  const bytes = Buffer.byteLength(text, 'utf8');
  if (bytes > MAX_DOCUMENT_BYTES) throw new Error(`document exceeds the ${MAX_DOCUMENT_BYTES} byte ceiling (${bytes})`);
  const now = new Date().toISOString();
  const doc = {
    id: mintId('document'), kind: 'document',
    name: String(name || 'Untitled').slice(0, 160),
    attestedClass, ownership, attestedAt: now, createdAt: now,
    bytes, sha256: crypto.createHash('sha256').update(text, 'utf8').digest('hex'),
    text, context,
  };
  const spans = spanise(text).map((s) => ({ id: mintId('span'), kind: 'span', documentId: doc.id, ...s }));
  for (const s of spans) {
    const v = validate(s, SPAN_SCHEMA);
    if (!v.ok) throw new Error(`span failed INV2 schema validation: ${v.errors.join('; ')}`);
  }
  return { doc, spans };
}

function storeDocument(store, doc, spans) {
  store.putRecord('documents', doc);
  for (const s of spans) store.putRecord('spans', s);
  return doc;
}

// Span lifecycle (3.4): deleting a document purges its spans from the collection. Minted
// facts are untouched — their snapshot lives on the fact, so the deletion is real.
function deleteDocument(store, documentId) {
  for (const s of store.listRecords('spans')) {
    if (s.documentId === documentId) store.removeRecord('spans', s.id);
  }
  return store.removeRecord('documents', documentId);
}

// Library view (brief: a stored-document list so duplicate uploads stop being guaranteed).
// A re-upload is a duplicate when it matches an existing document by content hash OR by
// name — the caller says so plainly before saving. Content-hash match is the real signal
// (rename-and-reupload still caught); name match catches the human "same file again".
function findDuplicate(store, { name, sha256, excludeId = null }) {
  return store.listRecords('documents').find(
    (d) => d.id !== excludeId && (d.sha256 === sha256 || d.name === name),
  ) || null;
}

// "how many facts have been minted from it": an accepted fact carries its source span's
// snapshot (suggest/engine.cjs), so spanSnapshot.documentId is the link. Person-typed facts
// have no span snapshot and correctly count toward no document.
function factsMintedByDocument(store) {
  const counts = new Map();
  for (const f of store.listDatafactsRaw()) {
    const id = f.spanSnapshot && f.spanSnapshot.documentId;
    if (id) counts.set(id, (counts.get(id) || 0) + 1);
  }
  return counts;
}

module.exports = {
  ATTESTED_CLASSES, isBarredAsExperienceSource, MAX_DOCUMENT_BYTES, SPAN_SCHEMA,
  ParseError, spanise, createDocument, storeDocument, deleteDocument,
  findDuplicate, factsMintedByDocument,
};
