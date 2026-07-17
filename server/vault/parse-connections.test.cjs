'use strict';

// Valvet slice 1 — the CSV parser is the only place that trusts the file's bytes,
// so it is where the defensive-parse rules (brief §5) get proven: the FILE's header
// wins over any assumed column list, a LinkedIn "Notes:" preamble is skipped, a
// malformed row is a counted row-level skip (not a total failure), unknown columns
// are preserved raw, and a file with no recognizable header is an all-or-nothing
// FAILURE that stores nothing.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseConnections } = require('./parse-connections.cjs');

const SAMPLE = fs.readFileSync(path.join(__dirname, '__fixtures__', 'connections-sample.csv'), 'utf8');

test('happy path: parses the invented cast, mapping columns by the file header', () => {
  const { rows } = parseConnections(SAMPLE);
  const anna = rows.find((r) => r.lastName === 'Bergström');
  assert.ok(anna, 'Anna Bergström parsed');
  assert.equal(anna.name, 'Anna Bergström');
  assert.equal(anna.company, 'Spelbolaget AB');
  assert.equal(anna.position, 'Head of Marketing');
  assert.equal(anna.connectedOn, '18 Jun 2023');
  assert.equal(anna.url, 'https://www.linkedin.com/in/annabergstrom');
  assert.equal(anna.email, 'anna@example.com');
  // D12 Rule 2: every vault row is third-party-authored text.
  assert.equal(anna.provenance, 'untrusted-derived');
});

test('a quoted field containing a comma is one field, not two', () => {
  const { rows } = parseConnections(SAMPLE);
  const peter = rows.find((r) => r.lastName === 'Lind');
  assert.equal(peter.position, 'VP, Growth');
});

test('malformed row (wrong field count) is skipped and counted, never a total failure', () => {
  const { rows, skipped } = parseConnections(SAMPLE);
  assert.equal(skipped, 1, 'the one short row is skipped');
  assert.equal(rows.length, 5, 'the five well-formed rows survive');
  assert.ok(!rows.some((r) => r.lastName === 'Rydberg'), 'the malformed Rydberg row is not stored');
});

test('the LinkedIn "Notes:" preamble before the header is skipped', () => {
  // A parser that trusted line 1 as the header would treat "Notes:" as columns and
  // find zero contacts. Finding the real header proves the preamble was handled.
  const { rows } = parseConnections(SAMPLE);
  assert.ok(rows.length > 0, 'contacts found past the preamble');
  assert.ok(rows.every((r) => r.firstName && r.lastName), 'no preamble line leaked in as a contact');
});

test('unknown columns are preserved raw, never dropped silently', () => {
  // "Tags" is not in the expected family; it must still survive on the raw row.
  const { rows } = parseConnections(SAMPLE);
  const anna = rows.find((r) => r.lastName === 'Bergström');
  assert.equal(anna.raw.Tags, 'vip', 'the unknown Tags column is kept on raw');
  assert.equal(anna.raw['Connected On'], '18 Jun 2023', 'known columns are on raw too');
});

test('newest-first sort key: connectedAt is a timestamp, null when undatable', () => {
  const { rows } = parseConnections(SAMPLE);
  const peter = rows.find((r) => r.lastName === 'Lind'); // 02 Feb 2024
  const erik = rows.find((r) => r.lastName === 'Sundqvist'); // 30 Sep 2021
  assert.ok(peter.connectedAt > erik.connectedAt, 'later date sorts newer');
});

test('a file with no recognizable header throws (all-or-nothing FAILED — caller stores nothing)', () => {
  assert.throws(() => parseConnections('this is not a csv\njust some prose\n'), /header/i);
  assert.throws(() => parseConnections(''), /header/i);
});
