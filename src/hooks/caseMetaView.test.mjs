import test from 'node:test';
import assert from 'node:assert/strict';
import { caseMetaView } from './caseMetaView.js';
import profile from '../lib/profile.js';

const CASE = {
  meta: { id: 'c1', company: 'BettingJobs', role: 'Head of Acquisition', owner: 'self' },
};

const JOB = {
  title: 'Head of Acquisition',
  company: 'BettingJobs',
  location: 'Remote · EU',
  url: 'https://example.com/jobb/bettingjobs-head-of-acquisition',
};

test('jobTitle comes from meta.role', () => {
  const m = caseMetaView(CASE);
  assert.equal(m.jobTitle, 'Head of Acquisition');
});

test('company comes from meta.company', () => {
  const m = caseMetaView(CASE);
  assert.equal(m.company, 'BettingJobs');
});

test('logo is the first two characters of company, uppercased', () => {
  const m = caseMetaView(CASE);
  assert.equal(m.logo, 'BE');
});

test('person is the profile object', () => {
  const m = caseMetaView(CASE);
  assert.deepEqual(m.person, profile);
  assert.equal(m.person.name, 'Daniel Oskarsson');
});

test('location and url come from the linked job when provided', () => {
  const m = caseMetaView(CASE, JOB);
  assert.equal(m.location, 'Remote · EU');
  assert.equal(m.url, 'https://example.com/jobb/bettingjobs-head-of-acquisition');
});

test('location and url are null when no job is linked', () => {
  const m = caseMetaView(CASE);
  assert.equal(m.location, null);
  assert.equal(m.url, null);
});

test('employment is undefined — unknown fields are omitted, never fabricated', () => {
  const m = caseMetaView(CASE, JOB);
  assert.equal(m.employment, undefined);
});

test('null caseData returns null company/jobTitle/logo, profile person', () => {
  const m = caseMetaView(null);
  assert.equal(m.company, null);
  assert.equal(m.jobTitle, null);
  assert.equal(m.logo, null);
  assert.deepEqual(m.person, profile);
});
