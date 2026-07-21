// Wave 1 - committed normalisation rule (Phase 0c). Whitespace + punctuation-
// spacing ONLY; nothing richer (v2 finding 7). Frozen in Phase 0.
// `node normalise.cjs` runs the self-check.

function normalise(s) {
  return String(s)
    .replace(/\s+/g, " ")        // 1. collapse whitespace runs
    .trim()                       // 2. trim ends
    .replace(/\s+([,.;:!?])/g, "$1"); // 3. drop space before punctuation
}

function textEquals(nodeText, sourceText) {
  return normalise(nodeText) === normalise(sourceText);
}

module.exports = { normalise, textEquals };

if (require.main === module) {
  const assert = require("assert");
  // whitespace collapse + trim
  assert.strictEqual(normalise("  a\t b\n\n c  "), "a b c");
  // punctuation spacing
  assert.strictEqual(normalise("hello , world ."), "hello, world.");
  assert.strictEqual(normalise("a ; b : c ! d ?"), "a; b: c! d?");
  // equality across benign whitespace/punct-spacing differences
  assert.ok(textEquals("Grew users 3x .", "Grew users 3x."));
  assert.ok(textEquals("Brand  &\nGrowth", "Brand & Growth"));
  // FORBIDDEN normalisations must NOT be applied -> these stay unequal
  assert.ok(!textEquals("Growth", "growth"), "case must matter");
  assert.ok(!textEquals("go-to-market", "go to market"), "no dash folding");
  assert.ok(!textEquals("CRM, analytics", "CRM analytics"), "no punctuation removal");
  console.log("normalise.cjs self-check passed");
}
