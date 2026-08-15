'use strict';

// Finding 2 (Judge B half): the checker's input contract is EXHAUSTIVE (Rule 3) — span text,
// structural context (heading/section/position), attested class, nothing else. It must NOT
// receive case/gap/requirement state. And its OUTPUT vocabulary must be able to name
// third-party material, not lump it into 'other'.

const { test } = require('node:test');
const assert = require('node:assert');
const {
  judgeVoiceOwnership, JUDGE_B_SYSTEM, JUDGE_B_SCHEMA, DETECTED_CLASSES,
} = require('./skeleton/suggest/judges.cjs');
const { validate } = require('./skeleton/prompt-assembly/index.cjs');
const { createStore } = require('./skeleton/store/index.cjs');
const { createDocument, storeDocument } = require('./skeleton/documents/index.cjs');
const engine = require('./skeleton/suggest/engine.cjs');

// A stub that captures the exact prompt Judge B is handed.
function captureLlm(verdict = { isExperienceClaim: true, detectedClass: 'experience', reason: '' }) {
  const rec = { judgeBPrompt: null };
  return {
    rec,
    completeJSON: async ({ system, prompt }) => {
      if (/claim-addition checker/.test(system)) return { claims: [] };
      if (/FIRST-PERSON EXPERIENCE CLAIM/.test(system)) { rec.judgeBPrompt = prompt; return verdict; }
      return { proposals: [] };
    },
  };
}

const LEAK = ['SECRET_SAP_REQUIREMENT', 'gap_leak_1', 'req_leak_1', 'case_leak_1'];

test('finding 2 (Judge B contract): the judge boundary WHITELISTS structural context — documentContext / case-gap-requirement state never reaches the prompt', async () => {
  const llm = captureLlm();
  await judgeVoiceOwnership({
    spanText: 'Led the launch of a payments product',
    structuralContext: {
      heading: 'EXPERIENCE', section: 'EXPERIENCE', location: { startLine: 3, endLine: 3 },
      // a caller trying to hand the judge uncontracted state:
      documentContext: { gapId: 'gap_leak_1', requirementId: 'req_leak_1', requirement: 'SECRET_SAP_REQUIREMENT', caseId: 'case_leak_1' },
    },
    attestedClass: 'gap_answer',
  }, llm);
  const p = llm.rec.judgeBPrompt;
  for (const leak of LEAK) assert.ok(!p.includes(leak), `case/gap/requirement state must not reach the judge (leaked: ${leak})`);
  // the contracted structural fields ARE present
  assert.match(p, /EXPERIENCE/, 'heading/section still travel');
  assert.match(p, /Led the launch of a payments product/, 'the span text is judged');
});

test('finding 2 (Judge B contract): end-to-end via propose — a gap-answer document\'s embedded case/gap/requirement never reaches Judge B', async () => {
  const store = createStore();
  const { doc, spans } = createDocument({
    name: 'gap answer', text: 'ANSWER\n\nI configured the payments integration end to end.',
    attestedClass: 'gap_answer', ownership: 'mine',
    context: { caseId: 'case_leak_1', gapId: 'gap_leak_1', requirementId: 'req_leak_1', requirement: 'SECRET_SAP_REQUIREMENT' },
  });
  storeDocument(store, doc, spans);
  const llm = captureLlm();
  await engine.propose({ store, llm });
  const p = llm.rec.judgeBPrompt;
  assert.ok(p, 'Judge B ran on the span');
  for (const leak of LEAK) assert.ok(!p.includes(leak), `propose must not leak ${leak} into Judge B`);
});

test('finding 2 (Judge B vocabulary): third-party material is a contracted output class, schema-validated', () => {
  assert.ok(DETECTED_CLASSES.includes('third_party'), 'third-party material is nameable, not lumped into other');
  assert.match(JUDGE_B_SYSTEM, /third[_ ]party|another person|someone else|colleague/i, 'the prompt defines the third-party class');
  assert.match(JUDGE_B_SYSTEM, /third_party/, 'the output JSON vocabulary lists third_party');
  assert.ok(validate({ isExperienceClaim: false, detectedClass: 'third_party', reason: 'a colleague\'s line' }, JUDGE_B_SCHEMA).ok, 'third_party validates');
  assert.ok(!validate({ isExperienceClaim: false, detectedClass: 'someone_elses', reason: '' }, JUDGE_B_SCHEMA).ok, 'an out-of-vocab class is still a schema failure');
});
