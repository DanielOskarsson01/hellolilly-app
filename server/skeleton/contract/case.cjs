'use strict';

// The case object factory + part-status helpers (DATA_CONTRACT v0.2 §2.2, §3).
// `meta` is a plain object; every other top-level part is a status envelope
// { status, data, error?, updatedAt } with a closed status enum.

const { mintId } = require('../ids.cjs');

const PART_STATUS = ['absent', 'pending', 'ready', 'failed'];
const META_STATUS = ['intake', 'researching', 'analyzing', 'prep_ready', 'live', 'post', 'done'];

// The enveloped top-level parts. (crosslinks is NOT here — it is a derived query, §5.
// The candidate data-layer is NOT here either — the case references it, §2.1.)
const PARTS = ['dossiers', 'decodedRole', 'fit', 'gaps', 'prep', 'cards', 'liveLog', 'postMortem'];

function nowIso() {
  return new Date().toISOString();
}

function envelope(status = 'absent', data = null, error) {
  if (!PART_STATUS.includes(status)) throw new Error(`Invalid part status: ${status}`);
  const env = { status, data, updatedAt: nowIso() };
  if (status === 'failed') env.error = error || 'unknown error';
  return env;
}

function createCase(meta = {}) {
  const status = meta.status || 'intake';
  if (!META_STATUS.includes(status)) throw new Error(`Invalid meta.status: ${status}`);
  const now = nowIso();
  const theCase = {
    meta: {
      id: meta.id || mintId('case'),
      company: meta.company || null,
      role: meta.role || null,
      round: meta.round == null ? 1 : meta.round,
      interviewDate: meta.interviewDate || null,
      interviewers: meta.interviewers || [],
      format: meta.format || null,
      sourceInput: meta.sourceInput || null,
      cvVersionRef: meta.cvVersionRef || null, // { kind: 'datafact', id }
      owner: meta.owner || 'self', // single-user today; field exists so multi-user is additive
      status,
      createdAt: now,
      updatedAt: now,
    },
  };
  for (const part of PARTS) theCase[part] = envelope('absent');
  return theCase;
}

function assertPart(part) {
  if (!PARTS.includes(part)) throw new Error(`Unknown case part: ${part}`);
}

function touch(theCase) {
  theCase.meta.updatedAt = nowIso();
}

function setPartData(theCase, part, data) {
  assertPart(part);
  theCase[part] = envelope('ready', data);
  touch(theCase);
  return theCase[part];
}

function setPartStatus(theCase, part, status, error) {
  assertPart(part);
  if (!PART_STATUS.includes(status)) throw new Error(`Invalid part status: ${status}`);
  theCase[part] = { ...theCase[part], status, updatedAt: nowIso() };
  if (status === 'failed') theCase[part].error = error || 'unknown error';
  else delete theCase[part].error;
  touch(theCase);
  return theCase[part];
}

module.exports = {
  PART_STATUS, META_STATUS, PARTS,
  envelope, createCase, setPartData, setPartStatus,
};
