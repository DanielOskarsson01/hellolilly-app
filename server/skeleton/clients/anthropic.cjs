'use strict';

// Anthropic (Claude) client — the `llm` capability. Reimplemented fresh in-repo via
// raw fetch (Rule 2; no SDK dependency). Injected into submodules as tools.llm.
// Default model is Opus 4.8 (A1 = quality-max); callers may override per call.

const DEFAULT_MODEL = 'claude-opus-4-8';
const API_URL = 'https://api.anthropic.com/v1/messages';

function createAnthropicClient({ apiKey, defaultModel = DEFAULT_MODEL, timeoutMs = 240000 } = {}) {
  if (!apiKey) throw new Error('anthropic client: ANTHROPIC_API_KEY missing');

  async function complete({ system, prompt, model, maxTokens = 4096 }) {
    // Note: `temperature` is deliberately not sent — it is deprecated on Opus 4.8.
    const body = JSON.stringify({
      model: model || defaultModel,
      max_tokens: maxTokens,
      ...(system ? { system } : {}),
      messages: [{ role: 'user', content: prompt }],
    });

    let lastErr;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (attempt > 0) await sleep(800 * 2 ** (attempt - 1)); // 0.8s, 1.6s backoff
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
          body,
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          return (data.content || []).map((b) => b.text || '').join('').trim();
        }
        const text = await res.text();
        // retry transient statuses only; fail fast on 4xx (bad request/auth)
        if (![429, 500, 502, 503, 529].includes(res.status)) {
          throw new Error(`anthropic ${res.status}: ${text.slice(0, 300)}`);
        }
        lastErr = new Error(`anthropic ${res.status}: ${text.slice(0, 200)}`);
      } catch (err) {
        lastErr = err;
        if (err.message && err.message.startsWith('anthropic 4')) throw err; // non-retryable
      } finally {
        clearTimeout(t);
      }
    }
    throw lastErr || new Error('anthropic: request failed');
  }

  // Structured generation with a markdown->JSON safety net + one corrective retry
  // (the seo-planner v2.2.1 lesson: models sometimes wrap JSON in prose/fences).
  async function completeJSON({ system, prompt, model, maxTokens = 4096, temperature = 0.3 }) {
    const raw = await complete({ system, prompt, model, maxTokens, temperature });
    const parsed = tryParseJSON(raw);
    if (parsed !== undefined) return parsed;

    const retry = await complete({
      system,
      prompt: `${prompt}\n\nYour previous reply was not valid JSON. Reply with ONLY the JSON object, no prose, no code fences.`,
      model,
      maxTokens,
      temperature: 0,
    });
    const reparsed = tryParseJSON(retry);
    if (reparsed !== undefined) return reparsed;
    throw new Error('anthropic completeJSON: model did not return valid JSON after retry');
  }

  return { complete, completeJSON, defaultModel };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tryParseJSON(text) {
  if (!text) return undefined;
  // strip ```json ... ``` fences if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  try {
    return JSON.parse(candidate.trim());
  } catch {
    // last resort: grab the outermost {...}
    const brace = candidate.match(/\{[\s\S]*\}/);
    if (brace) {
      try { return JSON.parse(brace[0]); } catch { /* fall through */ }
    }
    return undefined;
  }
}

module.exports = { createAnthropicClient, DEFAULT_MODEL };
