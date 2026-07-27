'use strict';

// Platform utilities — pure, general, side-effect-free helpers.
//
// The require-guard forbids submodules from require()-ing shared modules, which would push
// utility logic (JSON recovery, HTML stripping, normalization, transient-retry) to be
// copy-pasted into every submodule. Instead these live here ONCE and are injected via the
// `tools.utils` capability (see capabilities.cjs) — submodules still import nothing, the
// require-guard stays intact, and there is a single maintained copy. The skeleton's own
// clients may require() this file directly (clients are not under the guard).
//
// Scope rule: ONLY genuinely pure, general helpers belong here. Domain logic stays in submodules.

// parseJSON(text) -> parsed value | undefined. Tolerates a model wrapping JSON in prose or
// ```json fences; last resort grabs the outermost {...}. Never throws.
function parseJSON(text) {
  if (!text) return undefined;
  const fenced = String(text).match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : String(text);
  try {
    return JSON.parse(candidate.trim());
  } catch {
    const brace = candidate.match(/\{[\s\S]*\}/);
    if (brace) {
      try { return JSON.parse(brace[0]); } catch { /* fall through */ }
    }
    return undefined;
  }
}

// stripHtml(html) -> plain text: drop tags, decode the common named entities, collapse runs
// of whitespace. Pure; for snippet/normalization use.
function stripHtml(html) {
  if (html == null) return '';
  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// truncate(str, max) -> str capped to `max` chars. Non-strings pass through unchanged.
function truncate(str, max) {
  if (typeof str !== 'string') return str;
  return str.length <= max ? str : str.slice(0, max);
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// retry(fn, opts) -> resolves with fn's result, retrying on throw. Generic transient-retry
// wrapper: callers supply shouldRetry to decide what is transient. `sleep` is injectable so
// tests don't wait on real timers. fn receives the zero-based attempt index.
async function retry(fn, opts = {}) {
  const {
    attempts = 3,
    baseDelayMs = 0,
    factor = 2,
    shouldRetry = () => true,
    sleep = defaultSleep,
  } = opts;
  let lastErr;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn(i);
    } catch (err) {
      lastErr = err;
      if (i === attempts - 1 || !shouldRetry(err, i)) throw err;
      await sleep(baseDelayMs * factor ** i);
    }
  }
  throw lastErr;
}

// Wave 2 (Section 4): the decode->tailor serialiser is skeleton-owned (one copy) and
// reaches cv-tailor through this injected surface — the brief mandates the hoist, which
// is why a domain serialiser sits on the utils surface despite the scope rule above.
const { decodedSignal } = require('./targeting/decoded-signal.cjs');

module.exports = { parseJSON, stripHtml, truncate, retry, decodedSignal };
