'use strict';

// Valvet slice 1 — parse a LinkedIn "Connections" CSV export defensively (brief §5).
// The FILE's header row wins over any assumed column list; a "Notes:" preamble before
// the header is skipped; every column found is kept raw (unknown columns included); a
// row whose field count does not match the header is a counted row-level skip; a file
// with no recognizable header is an all-or-nothing failure (throws → caller stores
// nothing). Every row is stamped provenance 'untrusted-derived' (D12 Rule 2).

// The seven columns a LinkedIn export is expected to carry. This list only decides
// which cells get promoted to named fields and which line is the header — it never
// overrides the file: unknown columns still survive on `raw`, and a real export with
// extra/renamed columns still parses.
const KNOWN = ['first name', 'last name', 'url', 'email address', 'company', 'position', 'connected on'];

// RFC-4180-ish single-line tokenizer: commas separate fields, double quotes wrap a
// field that may contain commas, "" is an escaped quote inside a quoted field.
// ponytail: line-based — a field with an embedded newline (quoted) would split wrong;
// LinkedIn's name/company/position/date fields never contain newlines. Upgrade to a
// whole-text stateful tokenizer only if a real export ever breaks this.
function splitCsvLine(line) {
  const out = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { out.push(field); field = ''; }
    else field += ch;
  }
  out.push(field);
  return out.map((f) => f.trim());
}

// A line is the header iff at least two of its cells name a known column. Two, not one,
// so a stray preamble line that happens to contain e.g. "company" can't be mistaken for
// the header; a genuine export always carries several of these together.
function looksLikeHeader(cells) {
  const lower = cells.map((c) => c.toLowerCase());
  return KNOWN.filter((k) => lower.includes(k)).length >= 2;
}

function connectedAt(str) {
  if (!str) return null;
  const t = Date.parse(str); // LinkedIn uses "DD Mon YYYY"; V8 parses it.
  return Number.isNaN(t) ? null : t;
}

function parseConnections(text) {
  const lines = String(text || '').split(/\r?\n/);
  const headerIdx = lines.findIndex((l) => l.trim() && looksLikeHeader(splitCsvLine(l)));
  if (headerIdx === -1) {
    throw new Error('no recognizable LinkedIn Connections header row — not a Connections export');
  }

  const header = splitCsvLine(lines[headerIdx]);
  const at = (cells, colName) => {
    const i = header.findIndex((h) => h.toLowerCase() === colName);
    return i === -1 ? '' : (cells[i] || '');
  };

  const rows = [];
  let skipped = 0;
  for (let i = headerIdx + 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // blank lines are noise, not malformed rows
    const cells = splitCsvLine(lines[i]);
    if (cells.length !== header.length) { skipped++; continue; } // row-level skip, counted

    const raw = {};
    header.forEach((h, c) => { raw[h] = cells[c]; });
    const firstName = at(cells, 'first name');
    const lastName = at(cells, 'last name');
    const connectedOn = at(cells, 'connected on');
    rows.push({
      id: `vc_${rows.length}`,
      name: `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      position: at(cells, 'position'),
      company: at(cells, 'company'),
      connectedOn,
      connectedAt: connectedAt(connectedOn),
      url: at(cells, 'url'),
      email: at(cells, 'email address'),
      raw,
      provenance: 'untrusted-derived',
    });
  }

  return { columns: header, rows, skipped };
}

module.exports = { parseConnections, splitCsvLine };
