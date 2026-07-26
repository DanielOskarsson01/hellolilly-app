'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { buildTools } = require('./capabilities.cjs');
const { validateManifest } = require('./registry.cjs');
const { createStore } = require('./store/index.cjs');

test('datalayer capability exposes read-only datafact access', () => {
  const store = createStore();
  store.ingestDatafact({ id: 'datafact_a', kind: 'datafact', origin: 'curated', type: 'summary', text: 'Real CV text.', tags: [], language: 'en' });
  const manifest = { id: 'tester', reads: [], writes: [], capabilities: ['datalayer'] };
  const tools = buildTools({ manifest, callContext: {}, store });
  assert.equal(typeof tools.datalayer.listDatafacts, 'function');
  assert.equal(typeof tools.datalayer.getDatafact, 'function');
  assert.equal(tools.datalayer.listDatafacts().length, 1);
  assert.equal(tools.datalayer.getDatafact('datafact_a').text, 'Real CV text.');
  assert.equal(tools.datalayer.getDatafact('nope'), null);
  assert.equal(tools.datalayer.ingestDatafact, undefined, 'datalayer is read-only — no ingest');
});

test('datalayer is not injected unless declared', () => {
  const store = createStore();
  const manifest = { id: 'tester2', reads: [], writes: [], capabilities: [] };
  const tools = buildTools({ manifest, callContext: {}, store });
  assert.equal(tools.datalayer, undefined);
});

test('validateManifest accepts a manifest declaring datalayer', () => {
  assert.doesNotThrow(() => validateManifest({ id: 't', reads: [], writes: [], capabilities: ['datalayer'] }));
});
