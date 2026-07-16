import test from 'node:test';
import assert from 'node:assert/strict';
import { routeKey, parseMatchDeepOpen, jobForCase } from './matchDeepOpen.mjs';

test('routeKey strips a /param so #match/<caseId> still resolves to the match screen', () => {
  assert.equal(routeKey('#match'), 'match');
  assert.equal(routeKey('#match/case_abc'), 'match');       // deep-open still routes to match
  assert.equal(routeKey('#cv'), 'cv');
  assert.equal(routeKey('#home'), 'home');
  assert.equal(routeKey(''), 'home');
  assert.equal(routeKey(undefined), 'home');
});

test('parseMatchDeepOpen extracts the caseId from #match/<caseId>, null otherwise', () => {
  assert.equal(parseMatchDeepOpen('#match/case_abc'), 'case_abc');
  assert.equal(parseMatchDeepOpen('#match/a%2Fb'), 'a/b'); // decoded
  assert.equal(parseMatchDeepOpen('#match'), null);        // plain list, not a deep-open
  assert.equal(parseMatchDeepOpen('#cv'), null);
  assert.equal(parseMatchDeepOpen(''), null);
});

test('jobForCase resolves a caseId to its queue job, else null (→ visible "job not found")', () => {
  const items = [{ id: 'j1', caseId: 'c1' }, { id: 'j2', caseId: 'c2' }, { id: 'j3' }];
  assert.equal(jobForCase('c2', items).id, 'j2');
  assert.equal(jobForCase('nope', items), null, 'unresolved caseId → not found, never a bare list');
  assert.equal(jobForCase(null, items), null);
  assert.equal(jobForCase('c1', []), null);
});
