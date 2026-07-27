'use strict';

// INVARIANT 4 — record truth (numeral, date and duration grounding) + the 3.7
// AUTHORSHIP DISCRIMINATOR. Fully deterministic; no model involved.
//
// The deterministic core covers DIGIT-BEARING tokens (numerals, dates, durations,
// percentages, ranges). Worded numbers ("twelve", "three years") are semantic territory
// and belong to Judge A (DISCIPLINE 1) — stated plainly so the invariant never claims
// more than it enforces (Section 0: claiming the wrong tier is itself a violation).
//
// The discriminator (3.7, closes HIGH 4): for every unsupported token, does it appear in
// the MODEL'S DRAFT, or only after the person's keystrokes?
//   - unsupported token present in the model draft  -> DEFECTIVE PROPOSAL: it cannot mint
//     on a bare accept; the person either rewrites it in their own words (a fresh
//     person-typed mint) or rejects it. The model cannot hide an invention behind the
//     person's click.
//   - unsupported token present ONLY in the person's final wording -> PERSON-ATTESTED,
//     mints freely (D22: what the person types is truth, without friction).

// Every whitespace-delimited token containing at least one digit, with surrounding
// punctuation trimmed. '40%', '2019-2023', '3x' are single tokens.
function groundingTokens(text) {
  const m = String(text || '').match(/\S*\d\S*/g) || [];
  return m.map((t) => t.replace(/^[.,;:!?()"'«»[\]{}]+|[.,;:!?()"'«»[\]{}]+$/g, '')).filter(Boolean);
}

const digitRuns = (s) => String(s || '').match(/\d+/g) || [];

// A token is supported by a source text when EVERY digit run in the token appears as an
// exact digit run in the source ('12' never matches inside '2012'; '2019-2023' needs both
// runs). Exact-run equality keeps this deterministic while tolerating format drift
// ('40%' vs '40 percent').
function tokenSupportedBy(sourceText, token) {
  const src = new Set(digitRuns(sourceText));
  const runs = digitRuns(token);
  return runs.length > 0 && runs.every((r) => src.has(r));
}

// classifyGrounding({ finalText, draftText, spanTexts }) ->
//   { grounding: 'span-grounded'|'person-attested'|'defective', ok, tokens: [...] }
// `draftText` is the model's draft ('' or null for a pure person-typed entry — then every
// unsupported token is person-originated by construction and the entry is person-attested).
function classifyGrounding({ finalText, draftText = '', spanTexts = [] }) {
  const inSpans = (t) => spanTexts.some((s) => tokenSupportedBy(s, t));
  const inDraft = (t) => tokenSupportedBy(draftText || '', t);
  const tokens = groundingTokens(finalText).map((t) => {
    const supported = inSpans(t);
    return {
      token: t,
      supported,
      origin: supported ? 'span' : (inDraft(t) ? 'draft' : 'person'),
    };
  });
  const defective = tokens.filter((t) => t.origin === 'draft');
  const personTokens = tokens.filter((t) => t.origin === 'person');
  const grounding = defective.length ? 'defective' : (personTokens.length ? 'person-attested' : 'span-grounded');
  return { grounding, ok: defective.length === 0, tokens, defectiveTokens: defective.map((t) => t.token), personTokens: personTokens.map((t) => t.token) };
}

module.exports = { groundingTokens, tokenSupportedBy, classifyGrounding };
