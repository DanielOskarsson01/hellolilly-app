import test from 'node:test';
import assert from 'node:assert/strict';
import { pickSlot } from './partSlot.mjs';

test('pickSlot maps status→slot; busy forces pending', () => {
  assert.equal(pickSlot('ready', {}), 'ready');
  assert.equal(pickSlot('pending', {}), 'pending');
  assert.equal(pickSlot('failed', {}), 'failed');
  assert.equal(pickSlot('absent', {}), 'absent');
  assert.equal(pickSlot('ready', { busy: true }), 'pending'); // in-flight action
});

test('pickSlot unknown status → absent', () => {
  assert.equal(pickSlot('unknown', {}), 'absent');
  assert.equal(pickSlot(undefined, {}), 'absent');
  assert.equal(pickSlot('', {}), 'absent');
});

test('pickSlot busy overrides any status', () => {
  assert.equal(pickSlot('failed', { busy: true }), 'pending');
  assert.equal(pickSlot('absent', { busy: true }), 'pending');
  assert.equal(pickSlot('pending', { busy: true }), 'pending');
});

test('pickSlot defaults to no-busy when opts omitted', () => {
  assert.equal(pickSlot('ready'), 'ready');
  assert.equal(pickSlot('failed'), 'failed');
});
