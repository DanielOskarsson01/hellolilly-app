'use strict';

// The require-guard — enforces the brokering rule mechanically (DEVELOPMENT_PLAN Rule 1).
//
// A submodule reaches peers ONLY through tools.request -> the broker. Everything else it
// needs arrives via injected `tools`. So the enforceable invariant is strict and simple:
//
//   A file under server/submodules/ may require() ONLY `node:` builtins, and only as a
//   STRING LITERAL (no dynamic require). Any relative/peer/skeleton import, any bare
//   module name, or any non-literal require() is a violation.
//
// This is a STATIC import scan, matched to the real threat model: accidental architectural
// drift by first-party authors, not a malicious submodule escaping isolation. It runs in
// two places (defense in depth): the submodule-isolation test (red CI build on drift) and
// a load-time assertion in loadSubmodules (fails closed at registration / boot).
//
// ACCEPTED LIMITATION (boundary of the guarantee): a static scan cannot stop a *determined*
// reflection-based bypass (e.g. globalThis, process.mainModule, indirectly-constructed
// require). The "string-literal only" rule closes ordinary dynamic require; exotic
// reflection is OUT OF SCOPE for this threat model. Revisit with a runtime sandbox/VM
// loader ONLY if submodules ever become third-party / untrusted.

const fs = require('node:fs');
const path = require('node:path');

// Remove block and line comments so `require(` mentioned in prose isn't flagged.
// The (^|[^:]) guard keeps it from eating `://` inside a URL string.
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

// Returns [] when clean, else [{ kind, target? }] for each violation in the source.
function scanSource(src) {
  const code = stripComments(src);
  const violations = [];
  const re = /\brequire\s*\(/g;
  let m;
  while ((m = re.exec(code))) {
    const after = code.slice(m.index + m[0].length);
    const lit = after.match(/^\s*(['"])([^'"]*)\1\s*\)/);
    if (!lit) {
      violations.push({ kind: 'dynamic-require' }); // require(<non-literal>) — disallowed
      continue;
    }
    const target = lit[2];
    if (!target.startsWith('node:')) {
      violations.push({ kind: 'forbidden-require', target }); // peer/skeleton/bare module
    }
  }
  return violations;
}

function listSubmoduleFiles(submodulesDir) {
  const out = [];
  if (!fs.existsSync(submodulesDir)) return out;
  for (const name of fs.readdirSync(submodulesDir)) {
    const sub = path.join(submodulesDir, name);
    if (!fs.statSync(sub).isDirectory()) continue;
    for (const f of fs.readdirSync(sub)) {
      if (f.endsWith('.cjs') || f.endsWith('.js')) out.push(path.join(sub, f));
    }
  }
  return out;
}

// Whole-dir scan -> [{ file, violations }] for any offending file (empty = clean).
function scanSubmodulesDir(submodulesDir) {
  const results = [];
  for (const file of listSubmoduleFiles(submodulesDir)) {
    const violations = scanSource(fs.readFileSync(file, 'utf8'));
    if (violations.length) results.push({ file, violations });
  }
  return results;
}

function describe(results) {
  return results
    .map(({ file, violations }) => `${file}: ${violations.map((v) => v.target ? `${v.kind} '${v.target}'` : v.kind).join(', ')}`)
    .join('; ');
}

// The load-time assertion. Throws (fail-closed) if any submodule file violates the rule.
function assertSubmodulesIsolated(submodulesDir) {
  const results = scanSubmodulesDir(submodulesDir);
  if (results.length) {
    throw new Error(`[submodule-isolation] brokering rule violated — ${describe(results)}`);
  }
}

module.exports = { scanSource, listSubmoduleFiles, scanSubmodulesDir, assertSubmodulesIsolated, describe };
