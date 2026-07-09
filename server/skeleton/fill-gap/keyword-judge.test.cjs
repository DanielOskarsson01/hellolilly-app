'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { applyAlign } = require('./keyword-judge.cjs');

// minimal in-memory store; aligned to the real interface (store.getCase, store.getDatafact,
// store.writePart — same method names as the full createStore() in store/index.cjs)
// Persists deep copies so the test verifies actual write-through, not object identity.
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
    writePart: (_c, part, data) => {
      // Simulate real persistence: deep copy the data so mutations by the caller
      // don't affect what's stored. applyAlign mutates the object in-memory before
      // calling writePart, so a real store would persist that mutated state as a copy.
      const persisted = JSON.parse(JSON.stringify(data));
      caseObj[part] = { status:'ready', data: persisted };
    },
    _read: () => {
      // Read from the persisted data envelope so the test validates what actually
      // went through writePart, not the live object applyAlign still holds.
      const stored = caseObj.cvDraft;
      if (stored && stored.status === 'ready') {
        return stored.data.sections[0].items[0];
      }
      // Fallback: if nothing has been written yet, read from the original cvDraft
      // (this handles tests that intentionally refuse to write).
      return caseObj.cvDraft.data.sections[0].items[0];
    },
  };
}

test('valid basis → aligned: term now present, datafactRef unchanged, priorText stored', async () => {
  const s = fixtureStore();
  const res = await applyAlign(s, null, { caseId: 'c1', term: 'affiliate marketing', basisDatafactId: 'df_aff' });
  assert.equal(res.outcome, 'aligned');
  const item = s._read();
  assert.match(item.text.toLowerCase(), /affiliate marketing/, 'ad term written into the draft');
  assert.equal(item.datafactRef.id, 'df_aff', 'underlying truth (datafactRef) unchanged');
  assert.ok(item.priorText, 'reversible: prior text stored');
});

test('no resolvable basis → refused, NOTHING written (the guardrail)', async () => {
  const s = fixtureStore();
  const before = s._read().text;
  const res = await applyAlign(s, null, { caseId: 'c1', term: 'token partnerships', basisDatafactId: null });
  assert.equal(res.outcome, 'refused');
  assert.match(res.reason, /support|basis|fact/i);
  assert.equal(s._read().text, before, 'no write on refuse');
});

test('a false "alignable" pointing at a non-existent datafact → refused (cannot be bypassed)', async () => {
  const s = fixtureStore();
  const res = await applyAlign(s, null, { caseId: 'c1', term: 'anything', basisDatafactId: 'df_does_not_exist' });
  assert.equal(res.outcome, 'refused');
});

test('unrelated term against valid in-draft basis → refused, NOTHING written (relatedness guardrail)', async () => {
  // The basis datafact text is about affiliates/marketing. 'Kubernetes' shares no token
  // (length >= 3) with that text — server must refuse, not align.
  const s = fixtureStore();
  const before = s._read().text;
  const res = await applyAlign(s, null, { caseId: 'c1', term: 'Kubernetes', basisDatafactId: 'df_aff' });
  assert.equal(res.outcome, 'refused', 'unrelated term must be refused');
  assert.match(res.reason, /support|fact|related|term/i, 'reason mentions the guardrail');
  assert.equal(s._read().text, before, 'nothing written on refuse');
});

// A basis whose text shares NO token with the terms below — forces the relatedness
// decision past the lexical pre-filter and onto the judge. "Managed a team of twelve
// engineers" is genuinely evidence for "leadership" (zero shared words) and genuinely
// NOT evidence for "photography".
function mgmtFixtureStore() {
  const cvDraft = { data: { language: 'en', sections: [ { key:'exp', items: [
    { datafactRef: { kind:'datafact', id:'df_mgmt' }, text: 'Managed a team of twelve engineers across two product lines.' },
  ] } ] } };
  const datafacts = { df_mgmt: { id:'df_mgmt', kind:'datafact', type:'job_result', text:'Managed a team of twelve engineers across two product lines.' } };
  const caseObj = { meta: { id:'c1' }, cvDraft };
  return {
    caseId: 'c1',
    getCase: () => caseObj,
    getDatafact: (id) => datafacts[id] || null,
    writePart: (_c, part, data) => { caseObj[part] = { status:'ready', data: JSON.parse(JSON.stringify(data)) }; },
    _read: () => {
      const stored = caseObj.cvDraft;
      return (stored && stored.status === 'ready' ? stored.data : caseObj.cvDraft.data).sections[0].items[0];
    },
  };
}

test('word-disjoint but SEMANTICALLY related pair → the judge is consulted and the term is ALIGNED (never refused on lexical grounds)', async () => {
  // 'leadership' shares no token (>=3 chars) with 'Managed a team of twelve engineers…',
  // so the lexical pre-filter cannot pass it. A pure-lexical guard would WRONGLY refuse.
  // The judge decides it IS supported → aligned. This is the exact case the decision flags.
  const s = mgmtFixtureStore();
  let judgeCalls = 0;
  const llm = { completeJSON: async () => { judgeCalls += 1; return { related: true, reason: 'managing a team evidences leadership' }; } };
  const res = await applyAlign(s, llm, { caseId: 'c1', term: 'leadership', basisDatafactId: 'df_mgmt' });
  assert.equal(judgeCalls, 1, 'lexical pre-filter must defer the word-disjoint pair to the judge, not decide alone');
  assert.equal(res.outcome, 'aligned', 'a genuinely related pair is never refused');
  assert.match(s._read().text.toLowerCase(), /leadership/, 'term written into the draft');
  assert.equal(s._read().datafactRef.id, 'df_mgmt', 'underlying truth unchanged');
});

test('word-disjoint and UNRELATED pair → the judge refuses and NOTHING is written', async () => {
  // 'photography' shares no token with the basis AND is not evidenced by it. Judge says no.
  const s = mgmtFixtureStore();
  let judgeCalls = 0;
  const llm = { completeJSON: async () => { judgeCalls += 1; return { related: false, reason: 'managing engineers is not photography' }; } };
  const before = s._read().text;
  const res = await applyAlign(s, llm, { caseId: 'c1', term: 'photography', basisDatafactId: 'df_mgmt' });
  assert.equal(judgeCalls, 1, 'judge consulted for the word-disjoint pair');
  assert.equal(res.outcome, 'refused', 'an unrelated pair is never accepted');
  assert.equal(s._read().text, before, 'nothing written on refuse');
});

test('idempotent: term already present → aligned outcome, no double-append, priorText not overwritten', async () => {
  const s = fixtureStore();
  // First align to inject the term.
  const res1 = await applyAlign(s, null, { caseId: 'c1', term: 'affiliate marketing', basisDatafactId: 'df_aff' });
  assert.equal(res1.outcome, 'aligned');
  const afterFirstAlign = s._read().text;
  const priorAfterFirst = s._read().priorText;
  assert.match(afterFirstAlign, /affiliate marketing/, 'term present after first align');

  // Second align with the same term should be a no-op (term already present).
  const res2 = await applyAlign(s, null, { caseId: 'c1', term: 'affiliate marketing', basisDatafactId: 'df_aff' });
  assert.equal(res2.outcome, 'aligned', 'idempotent call succeeds');
  const afterSecondAlign = s._read().text;
  const priorAfterSecond = s._read().priorText;

  // Text should not change (no double-append).
  assert.equal(afterSecondAlign, afterFirstAlign, 'no double-append: text unchanged on idempotent call');
  // priorText should not be overwritten.
  assert.equal(priorAfterSecond, priorAfterFirst, 'priorText not overwritten on idempotent call');
});
