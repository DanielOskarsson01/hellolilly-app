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

test('job results in the real { text, tags } object shape keep verbatim text and carry their own tags', () => {
  // The real cv_data.json stores each result as { text, tags, impact }, not a bare
  // string. Passing the object to push() used to store the literal "[object Object]",
  // destroying ~a quarter of the pool (the achievement bullets). Guard that shape.
  const facts = cvDataToDatafacts({
    jobs: [{
      company_short: 'ComeOn', role: 'CMO', tags: ['igaming'], tasks_summary: 'Ran marketing.',
      results: [{ text: 'Grew revenue 3x.', tags: ['growth', 'kpi'], impact: 'high' }],
    }],
  }, 'en');
  const jr = facts.find((f) => f.type === 'job_result');
  assert.ok(jr, 'a job_result fact was produced');
  assert.equal(jr.text, 'Grew revenue 3x.', 'stores verbatim text, not "[object Object]"');
  assert.ok(!facts.some((f) => f.text === '[object Object]'), 'no fact is a stringified object');
  assert.ok(jr.tags.includes('growth') && jr.tags.includes('kpi'), 'the result\'s own tags are carried');
  assert.ok(jr.tags.includes('ComeOn'), 'still tagged with company_short');
});

test('language parameter is honoured', () => {
  const facts = cvDataToDatafacts(SAMPLE, 'sv');
  assert.ok(facts.every((f) => f.language === 'sv'));
});

test('star_story with a missing field does not leak "undefined"', () => {
  const facts = cvDataToDatafacts({ star_stories: [{ title: 'Turnaround', tags: ['x'], situation: 'S only' }] }, 'en');
  const story = facts.find((f) => f.type === 'star_story');
  assert.ok(story && !/undefined/.test(story.text), `no undefined in: ${story && story.text}`);
  assert.equal(story.text, 'Turnaround: S only');
});
