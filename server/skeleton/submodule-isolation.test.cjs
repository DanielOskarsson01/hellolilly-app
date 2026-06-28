'use strict';

// Enforces the brokering rule as a red-build invariant: no submodule may reach a peer or
// the skeleton directly. Pairs with the load-time assertion in loadSubmodules (host.cjs).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { scanSource, scanSubmodulesDir } = require('./submodule-isolation.cjs');

test('every shipped submodule imports only node: builtins (string literals)', () => {
  const dir = path.resolve(__dirname, '../submodules');
  const results = scanSubmodulesDir(dir);
  assert.deepEqual(results, [], `submodule isolation violated: ${JSON.stringify(results)}`);
});

test('scanner flags a peer/skeleton import', () => {
  const v = scanSource("const d = require('../decoder/execute.cjs');");
  assert.equal(v.length, 1);
  assert.equal(v[0].kind, 'forbidden-require');
  assert.equal(v[0].target, '../decoder/execute.cjs');
});

test('scanner flags a bare (non-node:) module and a dynamic require', () => {
  assert.equal(scanSource("require('lodash')")[0].kind, 'forbidden-require');
  assert.equal(scanSource('require(name)')[0].kind, 'dynamic-require');
  assert.equal(scanSource('require(`../${x}`)')[0].kind, 'dynamic-require');
});

test('scanner allows node: builtins and ignores require() in comments', () => {
  assert.deepEqual(scanSource("const c = require('node:crypto');"), []);
  assert.deepEqual(scanSource('// never require("../peer") directly\nconst c = require("node:fs");'), []);
});
