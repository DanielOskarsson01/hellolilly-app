'use strict';

// The deterministic JobSearch writing ruleset (concept principle 9 — no AI-fingerprint
// language anywhere). Pipeline-agnostic: these are generic AI tells, not content-type
// specific. No language model is involved — pure pattern match, so the gate is
// deterministic and cheap. Subtle/contextual checks belong to a later LLM pass.

const BANNED_PHRASES = [
  'leveraged', 'spearheaded', 'cutting-edge', 'cutting edge', 'robust', 'passionate',
  'excited', 'thrilled', 'resonates', 'synergy', 'dynamic', 'proven track record',
  'perfect fit', 'hit the ground running', 'happy to discuss', 'i am confident that',
  'i believe i would be a great fit', 'delve', 'tapestry', 'testament to',
  'elevate', 'unlock', 'game-changer', 'game changer', 'in todays fast-paced',
  "in today's fast-paced",
];

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Word-boundary, case-insensitive. (\b around phrases keeps "robustness" or
// "unlocked" from false-positiving where the banned token is a substring of a
// legitimate word.)
const PATTERNS = BANNED_PHRASES.map((phrase) => ({
  phrase,
  re: new RegExp(`\\b${escapeRe(phrase)}\\b`, 'i'),
}));

module.exports = { BANNED_PHRASES, PATTERNS };
