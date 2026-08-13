'use strict';

// Wave 2 — file-format extraction (the parser dependency the documents module owed).
// Turns an uploaded FILE (binary or text) into the extracted TEXT the intake path stores.
// Runs BEFORE createDocument: a parse failure throws the shared ParseError so the caller
// produces the explicit failed envelope, never a silent empty span set (Section 0). The
// stored record stays extracted text only — the binary is never persisted (brief §D12).
//
// Deliberate dependency budget (this reverses the earlier no-new-dep call):
//   .docx -> mammoth   (25 transitive deps: docx is a zip+XML container; jszip unavoidable)
//   .pdf  -> unpdf     (0 transitive deps: bundles a serverless pdfjs, no native binary)
//   .txt/.md/.html     -> no dependency (utf8 decode; a small deterministic tag-strip)
// Both libs are loaded lazily — you pay for a parser only when that format actually arrives.

const { ParseError } = require('./index.cjs');

// Minimal HTML -> text. Not a full DOM parse — CV/letter HTML is paragraphs, headings and
// lists, and a regex strip that turns block tags into newlines and <li> into "- " keeps
// exactly the structure spanise() reads (headings, bullets, blank-line paragraph breaks).
// ponytail: regex strip, not a DOM. Swap for a parser only if rich/nested HTML shows up.
function htmlToText(html) {
  let s = String(html);
  s = s.replace(/<!--[\s\S]*?-->/g, ' ');
  s = s.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  s = s.replace(/<li\b[^>]*>/gi, '\n- ');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/(p|div|h[1-6]|li|tr|section|article|header|footer|ul|ol|table|blockquote)>/gi, '\n');
  s = s.replace(/<[^>]+>/g, ' ');
  s = s.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#3[49];/g, "'")
    .replace(/&#(\d+);/g, (_, n) => { try { return String.fromCodePoint(Number(n)); } catch { return ' '; } });
  s = s.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

const SUPPORTED_UPLOAD_EXTS = ['txt', 'md', 'markdown', 'text', 'html', 'htm', 'docx', 'pdf'];

// extractText({ filename, buffer }) -> Promise<string>. Dispatches on the file extension.
// Binary formats that yield no text (a scanned PDF, an empty .docx) throw ParseError rather
// than storing an empty document — "never a silent empty span set" applies to extraction too.
async function extractText({ filename, buffer }) {
  const ext = (String(filename || '').toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1] || '';
  if (['txt', 'md', 'markdown', 'text'].includes(ext)) return buffer.toString('utf8');
  if (['html', 'htm'].includes(ext)) return htmlToText(buffer.toString('utf8'));
  if (ext === 'docx') {
    let value;
    try { ({ value } = await require('mammoth').extractRawText({ buffer })); }
    catch (err) { throw new ParseError(`could not read the .docx (${err.message})`); }
    if (!value || !value.trim()) throw new ParseError('no extractable text in the .docx (an empty document?)');
    return value;
  }
  if (ext === 'pdf') {
    let text;
    try {
      const { extractText: pdfText } = await import('unpdf');
      ({ text } = await pdfText(new Uint8Array(buffer), { mergePages: true }));
    } catch (err) { throw new ParseError(`could not read the .pdf (${err.message})`); }
    if (!text || !text.trim()) throw new ParseError('no extractable text in the .pdf (a scanned image with no text layer?)');
    return text;
  }
  throw new ParseError(`unsupported file type: .${ext || '?'} — supported: .txt, .md, .html, .docx, .pdf, or pasted text`);
}

module.exports = { extractText, htmlToText, SUPPORTED_UPLOAD_EXTS };
