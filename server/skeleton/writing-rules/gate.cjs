'use strict';

// The writing-rules gate. The store calls enforce() on generated text BEFORE it
// is persisted (DEVELOPMENT_PLAN A0 "done when": a paragraph that breaks a rule is
// caught before it reaches a file). Enforcement lives at the store chokepoint, not
// trusted to each submodule.

const { PATTERNS } = require('./rules.cjs');

// Recursively collect every string value from any JSON-ish value, so a banned
// phrase buried in nested case data is still caught.
function collectStrings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const v of value) collectStrings(v, out);
  else if (value && typeof value === 'object') for (const v of Object.values(value)) collectStrings(v, out);
  return out;
}

function snippetAround(text, idx, span = 30) {
  const start = Math.max(0, idx - span);
  return text.slice(start, idx + span).replace(/\s+/g, ' ').trim();
}

function check(value) {
  const violations = [];
  for (const text of collectStrings(value)) {
    for (const { phrase, re } of PATTERNS) {
      const m = re.exec(text);
      if (m) violations.push({ phrase, snippet: snippetAround(text, m.index) });
    }
  }
  return { ok: violations.length === 0, violations };
}

class WritingRuleError extends Error {
  constructor(violations) {
    super(`Writing-rule violation: ${violations.map((v) => `"${v.phrase}"`).join(', ')}`);
    this.name = 'WritingRuleError';
    this.violations = violations;
  }
}

function enforce(value) {
  const { ok, violations } = check(value);
  if (!ok) throw new WritingRuleError(violations);
  return true;
}

module.exports = { check, enforce, WritingRuleError };
