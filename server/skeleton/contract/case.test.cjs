'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { createCase, PARTS } = require('./case.cjs');

test('new case seeds cvDraft and coverLetter as absent envelopes', () => {
  assert.ok(PARTS.includes('cvDraft'), 'cvDraft is a registered part');
  assert.ok(PARTS.includes('coverLetter'), 'coverLetter is a registered part');
  const c = createCase({ company: 'Acme', role: 'Head of Product' });
  assert.deepEqual(c.cvDraft, { status: 'absent', data: null, updatedAt: c.cvDraft.updatedAt });
  assert.deepEqual(c.coverLetter, { status: 'absent', data: null, updatedAt: c.coverLetter.updatedAt });
});
