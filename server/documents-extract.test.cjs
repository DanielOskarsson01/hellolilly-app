'use strict';

// File-format extraction (the parser the documents module owed). The third-party libs
// (mammoth, unpdf) are tested upstream; here we test OUR dispatch, the HTML strip, and the
// ParseError discipline — unsupported/corrupt/empty binaries fail explicitly, never silently.

const { test } = require('node:test');
const assert = require('node:assert');
const JSZip = require('jszip'); // a mammoth transitive dep — reused to build a real .docx fixture
const { extractText, htmlToText } = require('./skeleton/documents/extract.cjs');
const { ParseError, createDocument } = require('./skeleton/documents/index.cjs');

const buf = (s) => Buffer.from(s, 'utf8');

async function makeDocx(paragraphs) {
  const body = paragraphs.map((p) => `<w:p><w:r><w:t>${p}</w:t></w:r></w:p>`).join('');
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.folder('_rels').file('.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.folder('word').file('document.xml', `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`);
  return zip.generateAsync({ type: 'nodebuffer' });
}

// a minimal single-page PDF with a real text object (proven extractable)
const MINIMAL_PDF = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 52>>stream
BT /F1 24 Tf 72 700 Td (Hello Lilly PDF) Tj ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R/Size 6>>
%%EOF`;

test('extractText: plain text formats pass through utf8', async () => {
  assert.strictEqual(await extractText({ filename: 'notes.txt', buffer: buf('Plain notes åäö') }), 'Plain notes åäö');
  assert.strictEqual(await extractText({ filename: 'CV.md', buffer: buf('# CV\n\n- Did a thing') }), '# CV\n\n- Did a thing');
});

test('htmlToText: strips tags, drops script/style, decodes entities, keeps bullet/paragraph structure', () => {
  const t = htmlToText('<html><style>x{}</style><h1>Erfarenhet</h1><p>Ledde &amp; byggde</p><ul><li>Ökade intäkter 40%</li><li>Team om 12</li></ul><script>bad()</script>');
  assert.ok(!/</.test(t), 'no tags remain');
  assert.ok(!/bad\(\)/.test(t) && !/x\{\}/.test(t), 'script/style content removed');
  assert.match(t, /Ledde & byggde/);
  assert.match(t, /- Ökade intäkter 40%/);
  // the strip is spanisable: heading + two bullets
  const spans = createDocument({ name: 'h', text: t, attestedClass: 'old_cv', ownership: 'mine' }).spans;
  assert.ok(spans.some((s) => s.text.includes('Team om 12')), 'bullet became its own span');
});

test('extractText: .html file is stripped to text', async () => {
  const out = await extractText({ filename: 'letter.html', buffer: buf('<p>Hej <b>där</b></p>') });
  assert.strictEqual(out.trim(), 'Hej där');
});

test('extractText: real .docx yields paragraph-separated text that spanises', async () => {
  const docx = await makeDocx(['BETCLIC', 'Grew casino revenue 40% in one year']);
  const text = await extractText({ filename: 'cv.docx', buffer: docx });
  assert.match(text, /BETCLIC/);
  assert.match(text, /Grew casino revenue 40%/);
  const spans = createDocument({ name: 'cv', text, attestedClass: 'old_cv', ownership: 'mine' }).spans;
  const rev = spans.find((s) => s.text.includes('Grew casino revenue'));
  assert.strictEqual(rev.section, 'BETCLIC', 'ALL-CAPS line read as the section heading');
});

test('extractText: real .pdf yields its text', async () => {
  const text = await extractText({ filename: 'x.pdf', buffer: Buffer.from(MINIMAL_PDF, 'latin1') });
  assert.match(text, /Hello Lilly PDF/);
});

test('extractText: unsupported, corrupt, and empty binaries all throw ParseError (explicit failure)', async () => {
  await assert.rejects(() => extractText({ filename: 'x.rtf', buffer: buf('{\\rtf1}') }), (e) => e instanceof ParseError && /unsupported/.test(e.message));
  await assert.rejects(() => extractText({ filename: 'x.docx', buffer: buf('not a zip at all') }), (e) => e instanceof ParseError && /docx/.test(e.message));
  await assert.rejects(() => extractText({ filename: 'x.pdf', buffer: buf('not a pdf') }), (e) => e instanceof ParseError);
  const emptyDocx = await makeDocx(['   ']);
  await assert.rejects(() => extractText({ filename: 'empty.docx', buffer: emptyDocx }), (e) => e instanceof ParseError && /no extractable text/.test(e.message));
});
