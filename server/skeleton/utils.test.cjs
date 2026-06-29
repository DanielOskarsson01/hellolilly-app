'use strict';

// Foundation pass — the shared platform-utility layer (tools.utils). Pure, general helpers
// (parsing, normalization, retry) that the require-guard would otherwise force every submodule
// to copy-paste. One maintained copy here; injected into submodules like any other capability.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHost } = require('./host.cjs');
const utils = require('./utils.cjs');

test('parseJSON parses a plain JSON object', () => {
  assert.deepEqual(utils.parseJSON('{"a":1,"b":[2,3]}'), { a: 1, b: [2, 3] });
});

test('parseJSON unwraps a ```json fenced block', () => {
  assert.deepEqual(utils.parseJSON('Here you go:\n```json\n{"ok":true}\n```\nthanks'), { ok: true });
});

test('parseJSON recovers the outermost object from surrounding prose', () => {
  assert.deepEqual(utils.parseJSON('preamble {"x":5} trailer'), { x: 5 });
});

test('parseJSON returns undefined for non-JSON and empty input', () => {
  assert.equal(utils.parseJSON('not json at all'), undefined);
  assert.equal(utils.parseJSON(''), undefined);
  assert.equal(utils.parseJSON(null), undefined);
});

test('stripHtml removes tags, decodes common entities, collapses whitespace', () => {
  assert.equal(utils.stripHtml('<p>Hello&nbsp;<b>world</b> &amp; co</p>'), 'Hello world & co');
  assert.equal(utils.stripHtml(null), '');
});

test('truncate caps an over-length string, passes through short strings and non-strings', () => {
  assert.equal(utils.truncate('abcdef', 3), 'abc');
  assert.equal(utils.truncate('ab', 5), 'ab');
  assert.equal(utils.truncate(42, 5), 42);
});

test('retry returns on first success without retrying', async () => {
  let calls = 0;
  const r = await utils.retry(async () => { calls += 1; return 'ok'; }, { sleep: async () => {} });
  assert.equal(r, 'ok');
  assert.equal(calls, 1);
});

test('retry retries until success', async () => {
  let calls = 0;
  const r = await utils.retry(async () => { calls += 1; if (calls < 3) throw new Error('transient'); return 'done'; }, { attempts: 5, sleep: async () => {} });
  assert.equal(r, 'done');
  assert.equal(calls, 3);
});

test('retry throws the last error after exhausting attempts', async () => {
  let calls = 0;
  await assert.rejects(
    () => utils.retry(async () => { calls += 1; throw new Error(`fail ${calls}`); }, { attempts: 3, sleep: async () => {} }),
    /fail 3/,
  );
  assert.equal(calls, 3);
});

test('retry stops early when shouldRetry returns false', async () => {
  let calls = 0;
  await assert.rejects(
    () => utils.retry(async () => { calls += 1; throw new Error('nope'); }, { attempts: 5, shouldRetry: () => false, sleep: async () => {} }),
    /nope/,
  );
  assert.equal(calls, 1);
});

test('tools.utils is injected only when the manifest declares the "utils" capability', async () => {
  const host = createHost({ llm: null, search: null });
  host.registry.register(
    { id: 'uses-utils', reads: [], writes: [], capabilities: ['utils'] },
    async (_i, _o, tools) => ({ type: typeof tools.utils, parsed: tools.utils.parseJSON('{"a":1}') }),
  );
  host.registry.register(
    { id: 'no-utils', reads: [], writes: [], capabilities: [] },
    async (_i, _o, tools) => ({ type: typeof tools.utils }),
  );

  const a = await host.invoke('uses-utils', {});
  assert.equal(a.result.type, 'object', 'declared → injected');
  assert.deepEqual(a.result.parsed, { a: 1 });

  const b = await host.invoke('no-utils', {});
  assert.equal(b.result.type, 'undefined', 'not declared → not injected (least-privilege)');
});
