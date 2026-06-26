'use strict';

// A1 tests — mock llm + search (no live API calls). Proves wiring, contract-shape
// conformance, the brokered decoder summon, drill append, the missing-client guard,
// and the writing-rule self-correction. Live niche-depth quality is verified separately.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHost } = require('./host.cjs');

const mockSearch = {
  grounded: async ({ query }) => ({ text: 'Grounded facts re: ' + String(query).slice(0, 30), citations: ['https://example.com/source'] }),
};

function makeMockLlm(override) {
  return {
    complete: async () => 'ok',
    completeJSON: async ({ prompt }) => {
      if (override) { const r = override(prompt); if (r !== undefined) return r; }
      if (/dossier as JSON/i.test(prompt)) return { summary: 'A short summary.', paragraphs: [{ text: 'First paragraph of plain facts.' }, { text: 'Second paragraph of plain facts.' }] };
      if (/decoded role as JSON/i.test(prompt)) return { narrative: 'What the job really is.', requirements: [{ requirement: 'Real requirement one', rationale: 'From the signals.', weight: 5 }, { requirement: 'Real requirement two', rationale: 'Niche pressure.', weight: 3 }] };
      if (/one focused paragraph/i.test(prompt)) return { text: 'A focused drilled answer.' };
      return {};
    },
  };
}

const META = { company: 'TestCo', role: 'Head of X', sourceInput: 'We are hiring a Head of X to do things.' };

test('researcher produces 4 dossiers + brokered decoder writes decodedRole (contract shape)', async () => {
  const host = createHost({ llm: makeMockLlm(), search: mockSearch });
  assert.ok(host.loaded.includes('researcher') && host.loaded.includes('decoder'));

  const c = host.store.createCase(META);
  const { result, log } = await host.invoke('researcher', { caseId: c.meta.id });

  assert.equal(result.ok, true);
  assert.deepEqual(result.fronts, ['company', 'product', 'people', 'niche']);
  assert.equal(result.decoded, true, 'decoder ran via the broker');

  const updated = host.store.getCase(c.meta.id);
  assert.equal(updated.dossiers.status, 'ready');
  for (const k of ['company', 'product', 'people', 'niche']) {
    const d = updated.dossiers.data[k];
    assert.ok(d && Array.isArray(d.paragraphs) && d.paragraphs.length > 0, `${k} has paragraphs`);
    assert.ok(d.paragraphs.every((p) => p.id.startsWith('paragraph_')), `${k} paragraphs have ids`);
  }
  assert.equal(updated.decodedRole.status, 'ready');
  assert.ok(updated.decodedRole.data.requirements.length >= 1);
  assert.ok(updated.decodedRole.data.requirements.every((r) => r.id.startsWith('decodedRequirement_')));

  // decoder was summoned THROUGH the broker (chain carries the researcher)
  const decoderCall = log.find((e) => e.event === 'call' && e.target === 'decoder');
  assert.ok(decoderCall, 'decoder dispatched by broker');
  assert.deepEqual(decoderCall.chain, ['researcher']);
});

test('reader-drill appends a marked paragraph to the named dossier', async () => {
  const host = createHost({ llm: makeMockLlm(), search: mockSearch });
  const c = host.store.createCase(META);
  await host.invoke('researcher', { caseId: c.meta.id });

  const before = host.store.getCase(c.meta.id).dossiers.data.company.paragraphs.length;
  await host.invoke('researcher', { caseId: c.meta.id, drill: { dossierKey: 'company', query: 'What is their latest funding round?' } });
  const after = host.store.getCase(c.meta.id).dossiers.data.company;

  assert.equal(after.paragraphs.length, before + 1);
  const appended = after.paragraphs[after.paragraphs.length - 1];
  assert.equal(appended.appended.query, 'What is their latest funding round?');
  assert.ok(appended.id.startsWith('paragraph_'));
});

test('missing llm client is a loud failure (least-privilege guard)', async () => {
  const host = createHost({ llm: null, search: mockSearch });
  const c = host.store.createCase(META);
  await assert.rejects(() => host.invoke('researcher', { caseId: c.meta.id }), /no llm client/);
});

test('researcher self-corrects a writing-rule violation, then writes clean', async () => {
  let dirtyOnce = true;
  const cleanDossiers = {
    company: { title: 'Company', summary: 'ok', sources: [], paragraphs: [{ id: 'paragraph_clean', text: 'This product is well built.' }] },
    product: { title: 'Product', summary: 'ok', sources: [], paragraphs: [{ id: 'paragraph_p', text: 'Plain product facts.' }] },
    people: { title: 'People', summary: 'ok', sources: [], paragraphs: [{ id: 'paragraph_pe', text: 'Plain people facts.' }] },
    niche: { title: 'Niche', summary: 'ok', sources: [], paragraphs: [{ id: 'paragraph_n', text: 'Plain niche facts.' }] },
  };
  const llm = makeMockLlm((prompt) => {
    if (/dossier as JSON/i.test(prompt) && dirtyOnce && /COMPANY dossier/i.test(prompt)) {
      dirtyOnce = false;
      return { summary: 'ok', paragraphs: [{ text: 'This product is robust and well built.' }] }; // 'robust' is banned
    }
    if (/Remove every/i.test(prompt)) return cleanDossiers; // cleanup returns clean
    return undefined;
  });

  const host = createHost({ llm, search: mockSearch });
  const c = host.store.createCase(META);
  await host.invoke('researcher', { caseId: c.meta.id });

  const dossiers = host.store.getCase(c.meta.id).dossiers;
  assert.equal(dossiers.status, 'ready', 'write succeeded after self-correction');
  assert.ok(!JSON.stringify(dossiers.data).toLowerCase().includes('robust'), 'banned word removed');
});
