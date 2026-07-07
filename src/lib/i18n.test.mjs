import test from 'node:test';
import assert from 'node:assert/strict';
import { trFor } from './i18n.mjs'; // pure, lang-injected variant for testing

test('trFor resolves active language, falls back to sv then empty', () => {
  assert.equal(trFor('en', { sv: 'Hej', en: 'Hi' }), 'Hi');
  assert.equal(trFor('en', { sv: 'Hej' }), 'Hej');   // no en → sv
  assert.equal(trFor('sv', 'literal'), 'literal');   // string passthrough
  assert.equal(trFor('en', null), '');               // null → ''
});
