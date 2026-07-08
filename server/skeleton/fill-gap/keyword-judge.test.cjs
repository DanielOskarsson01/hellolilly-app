'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { applyAlign } = require('./keyword-judge.cjs');

// minimal in-memory store; aligned to the real interface (store.getCase, store.getDatafact,
// store.writePart — same method names as the full createStore() in store/index.cjs)
function fixtureStore() {
  const cvDraft = { data: { language: 'en', sections: [ { key:'exp', items: [
    { datafactRef: { kind:'datafact', id:'df_aff' }, text: 'Built the affiliates department at ComeOn.' },
  ] } ] } };
  const datafacts = { df_aff: { id:'df_aff', kind:'datafact', type:'job_result', text:'Built the affiliates department at ComeOn.' } };
  const caseObj = { meta: { id:'c1' }, cvDraft };
  return {
    caseId: 'c1',
    getCase: () => caseObj,
    getDatafact: (id) => datafacts[id] || null,
    writePart: (_c, part, data) => { caseObj[part] = { status:'ready', data }; },
    _read: () => caseObj.cvDraft.data.sections[0].items[0],
  };
}

test('valid basis → aligned: term now present, datafactRef unchanged, priorText stored', async () => {
  const s = fixtureStore();
  const res = await applyAlign(s, { caseId: 'c1', term: 'affiliate marketing', basisDatafactId: 'df_aff' });
  assert.equal(res.outcome, 'aligned');
  const item = s._read();
  assert.match(item.text.toLowerCase(), /affiliate marketing/, 'ad term written into the draft');
  assert.equal(item.datafactRef.id, 'df_aff', 'underlying truth (datafactRef) unchanged');
  assert.ok(item.priorText, 'reversible: prior text stored');
});

test('no resolvable basis → refused, NOTHING written (the guardrail)', async () => {
  const s = fixtureStore();
  const before = s._read().text;
  const res = await applyAlign(s, { caseId: 'c1', term: 'token partnerships', basisDatafactId: null });
  assert.equal(res.outcome, 'refused');
  assert.match(res.reason, /support|basis|fact/i);
  assert.equal(s._read().text, before, 'no write on refuse');
});

test('a false "alignable" pointing at a non-existent datafact → refused (cannot be bypassed)', async () => {
  const s = fixtureStore();
  const res = await applyAlign(s, { caseId: 'c1', term: 'anything', basisDatafactId: 'df_does_not_exist' });
  assert.equal(res.outcome, 'refused');
});
