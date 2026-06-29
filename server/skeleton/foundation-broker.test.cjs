'use strict';

// Foundation pass — the broker is "the one place that sees the whole call graph", so an
// unknown-target refusal must be logged like the other refusals (cycle/depth/budget/circuit).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHost } = require('./host.cjs');

const passthru = (capabilities) => ({ reads: [], writes: [], capabilities });

test('an unknown-target refusal is recorded in the broker log', async () => {
  const host = createHost();
  host.registry.register({ id: 'caller', ...passthru(['request']) }, async (_i, _o, tools) => {
    try {
      await tools.request('ghost', {});
      return { caught: false };
    } catch (e) {
      return { caught: true, kind: e.detail && e.detail.kind };
    }
  });

  const { result, log } = await host.invoke('caller', {});
  assert.equal(result.caught, true, 'the unknown-target summon was refused');
  assert.equal(result.kind, 'unknown');

  const refusal = log.find((e) => e.event === 'refused' && e.reason === 'unknown' && e.target === 'ghost');
  assert.ok(refusal, 'unknown-target refusal must appear in the broker audit log');
});
