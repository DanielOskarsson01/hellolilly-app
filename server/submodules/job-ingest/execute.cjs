'use strict';

// job-ingest. Standalone-runnable: imports NOTHING — uses only injected `tools`.
//
//   input  = { csv: '<content>' }   (uploaded CSV content; the host route reads the file)
//   writes = canonical stage-1 job records into the `jobs` collection (decision 'new' unless the
//            CSV's approve column says otherwise), deduped by externalId, existing decisions kept.
//   output = { rows, added, skipped, urls:[...], errors:[...] }
//
// The CSV is Daniel's annotated tracking export. Two real-world quirks handled:
//  - quoted fields containing commas (e.g. "Miami, FL (...)", "Syndesus, Inc.")
//  - UTF-8 bytes that were decoded as Latin-1/Windows-1252 (mojibake: PÃ¥→På, lÃ¤n→län). Repaired by
//    reinterpreting the string's bytes as UTF-8 — the whole-file structural chars are ASCII, so this
//    is safe and only the multi-byte sequences change.

// If the text shows the tell-tale UTF-8-as-Latin-1 mojibake, reinterpret its bytes as UTF-8.
function fixMojibake(text) {
  if (!/Ã.|Â./.test(text)) return text;
  try {
    return Buffer.from(text, 'latin1').toString('utf8');
  } catch {
    return text;
  }
}

// Minimal RFC-4180-ish parser: quoted fields, escaped "" quotes, commas/newlines inside quotes.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; } else { inQuotes = false; }
      } else { field += c; }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function toObjects(rows) {
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1)
    .filter((r) => r.some((v) => v && v.trim()))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] || '').trim()])));
}

function extractLinkedInId(url) {
  const s = String(url || '');
  const m = s.match(/(?:jobs\/view\/|currentJobId=|jobPosting\/|\/view\/)(\d+)/)
    || (/linkedin\./i.test(s) ? s.match(/(\d{8,})/) : null);
  return m ? m[1] : null;
}

// Map the CSV's approve column to a decision. Blank = undecided = 'new'.
function decisionFor(approve) {
  const a = String(approve || '').trim().toLowerCase();
  if (!a) return 'new';
  if (['y', 'yes', 'approve', 'approved', 'x', '1', 'true'].includes(a)) return 'approved';
  if (['n', 'no', 'reject', 'rejected', '0', 'false'].includes(a)) return 'rejected';
  return 'new';
}

module.exports = async function execute(input, options, tools) {
  const raw = input && input.csv;
  if (typeof raw !== 'string' || !raw.trim()) throw new Error('job-ingest: input.csv (CSV content string) is required');

  const objects = toObjects(parseCsv(fixMojibake(raw)));
  const nowIso = new Date().toISOString();
  const seen = new Set(tools.store.listRecords('jobs').map((j) => j.externalId));

  let added = 0;
  let skipped = 0;
  const urls = [];
  const errors = [];

  for (const row of objects) {
    const id = extractLinkedInId(row.url);
    if (!id) { errors.push(`row "${row.title || row.url || '?'}": no extractable LinkedIn id`); continue; }
    const externalId = `linkedin-${id}`;
    urls.push(row.url);

    if (seen.has(externalId)) { skipped += 1; continue; } // dedup — keep the existing record + decision

    const snippet = tools.utils.stripHtml(row.snippet || '');
    tools.store.putRecord('jobs', {
      id: tools.ids.mintId('job'),
      externalId,
      source: 'csv-linkedin',
      title: row.title || '',
      company: row.company || '',
      location: row.location || '',
      url: row.url || '',
      snippet,
      text_content: '', // stage-2 body pending — enriched later by linkedin-job-fetcher
      needs_body: true,
      postedAt: row.posted_date || null,
      decision: decisionFor(row.approve),
      rejectReason: row.reason || null,
      found_in: row.found_in || null,
      locFit: row.loc_fit || null, // Daniel's own location judgement, carried as metadata
      discoveredAt: nowIso,
    });
    seen.add(externalId);
    added += 1;
    if (tools._partialItems) tools._partialItems.push(externalId);
  }

  if (tools.logger) tools.logger.info(`job-ingest: ${objects.length} rows → ${added} new, ${skipped} dup, ${errors.length} errors`);
  return { rows: objects.length, added, skipped, urls, errors };
};
