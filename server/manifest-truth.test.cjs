'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Finding 7: same-model in substance + record truth. The whole HelloLilly chain runs one model
// (sonnet-4-6), and every recorded sampling field in the manifest must be TRUE — matching the code,
// not the reference oracle's 0.2/8000.
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'harness', 'phase0', 'MANIFEST.json'), 'utf8'));
const decoderManifest = require('./submodules/decoder/manifest.cjs');
const tailorManifest = require('./submodules/cv-tailor/manifest.cjs');
const tailorSrc = fs.readFileSync(path.join(__dirname, 'submodules', 'cv-tailor', 'execute.cjs'), 'utf8');
const decoderSrc = fs.readFileSync(path.join(__dirname, 'submodules', 'decoder', 'execute.cjs'), 'utf8');

test('finding 7: the HelloLilly chain is single-model — decoder and tailor both claude-sonnet-4-6', () => {
  assert.strictEqual(tailorManifest.options.model, 'claude-sonnet-4-6');
  assert.strictEqual(decoderManifest.options.model, 'claude-sonnet-4-6', 'decoder must run the same model as the tailor');
});

test('finding 7: MANIFEST records the ACTUAL per-call sampling, matching the code (no untrue 8000 for HelloLilly)', () => {
  const s = manifest.run_config.sampling;
  // anchor to the SPECIFIC calls: the tailor's selection call passes temperature; the decoder's
  // main decode call ends with `prompt })` (distinct from gatedWrite's rephrase call).
  const tailorMax = Number(tailorSrc.match(/maxTokens:\s*(\d+),\s*temperature/)[1]);
  const decoderMax = Number(decoderSrc.match(/maxTokens:\s*(\d+),\s*prompt\s*}/)[1]);
  assert.strictEqual(s.hellolilly_tailor.max_tokens, tailorMax, 'recorded tailor max_tokens equals the code');
  assert.strictEqual(s.hellolilly_tailor.temperature, 0, 'tailor temperature is 0 (stable selection)');
  assert.strictEqual(s.hellolilly_decoder.max_tokens, decoderMax, 'recorded decoder max_tokens equals the code');
  // the reference oracle's divergent sampling is recorded truthfully AS the reference's, not the HL run config
  assert.strictEqual(s.reference_substitute.temperature, 0.2);
  assert.strictEqual(s.reference_substitute.max_tokens, 8000);
});
