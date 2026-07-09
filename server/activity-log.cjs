'use strict';

// Progress Support — the SINGLE activity emitter (Wave A).
//
// CONVENTION — activity logging. Every server action that produces a CONFIRMED,
// user-meaningful state change MUST call logActivity(store, {…}) on its SUCCESS
// path, AFTER the store mutation returned without throwing — never before (that
// logs an attempt), never for bulk/seed/derived writes (search results, filterSet,
// datafact seeding). Adding a new action ⇒ add a logActivity call, a row to the
// design-doc table (spec §2.3), and an emit test.
//
// This is action-level by a deliberate correction to the original scope note:
// store-level interception cannot distinguish align-vs-generate (both write
// cvDraft) or gap-fill-vs-analyze (both write fit). See the design doc §0.

const { mintId } = require('./skeleton/ids.cjs');

// Append one confirmed state-change record to the `activity` collection.
// `now`/`id` are injectable for deterministic tests. Returns the stored record.
function logActivity(store, { type, caseId = null, label, meta = {}, source = 'system' }, { now, id } = {}) {
  if (!type || !label) throw new Error('logActivity: type and label are required');
  const record = {
    id: id || mintId('activity'),
    at: now || new Date().toISOString(),
    type,
    caseId,
    label,
    meta,
    source,
  };
  return store.putRecord('activity', record); // durable via the sqlite adapter; detached; append-only
}

module.exports = { logActivity };
