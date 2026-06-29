'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { cvDataToDatafacts } = require('./ingest-cv.cjs');

const SAMPLE = {
  professional_summary: { default: 'Twenty years building products.', tags: ['product', 'leadership'] },
  identity_positioning: [
    { label: 'C-level executive', description: 'Builds and runs commercial orgs.', tags: ['c-level', 'commercial'] },
  ],
  value_propositions: [{ text: 'Scaled a team from 7 to 40.', tags: ['scaling'] }],
  competencies: { leadership_management: ['Hiring', 'Mentoring'] },
  jobs: [{ id: 'comeon', company_short: 'ComeOn', role: 'CMO', date_display: '2016-2019', location: 'Malta', tags: ['igaming', 'cmo'], tasks_summary: 'Ran marketing.', results: ['Grew revenue 3x.'] }],
  star_stories: [{ title: 'Turnaround', company: 'X', tags: ['leadership'], situation: 'S', task: 'T', action: ['A1', 'A2'] }],
};

test('maps each atomic fact to a datafact with language and tags', () => {
  const facts = cvDataToDatafacts(SAMPLE, 'en');
  assert.ok(facts.length >= 7, `expected >=7 datafacts, got ${facts.length}`);
  for (const f of facts) {
    assert.equal(f.kind, 'datafact');
    assert.equal(f.language, 'en');
    assert.ok(f.id.startsWith('datafact_'), 'id is a datafact id');
    assert.ok(typeof f.text === 'string' && f.text.length > 0, 'has verbatim text');
    assert.ok(Array.isArray(f.tags), 'has tags');
  }
  const summary = facts.find((f) => f.type === 'professional_summary');
  assert.equal(summary.text, 'Twenty years building products.');
  const idp = facts.find((f) => f.type === 'identity_positioning');
  assert.ok(idp.tags.includes('c-level'), 'identity tags carried through');
  const jobResult = facts.find((f) => f.text === 'Grew revenue 3x.');
  assert.ok(jobResult.tags.includes('ComeOn'), 'job result tagged with company_short');
});

test('language parameter is honoured', () => {
  const facts = cvDataToDatafacts(SAMPLE, 'sv');
  assert.ok(facts.every((f) => f.language === 'sv'));
});
