'use strict';

// Perplexity Sonar client — the `search` capability (grounded fact-finding for the
// Researcher). Reimplemented fresh in-repo via raw fetch (Rule 2 — the OnlyiGaming
// pipeline's search-grounding PATTERN, not its code). Injected as tools.search.

const API_URL = 'https://api.perplexity.ai/chat/completions';
const DEFAULT_MODEL = 'sonar';

function createPerplexityClient({ apiKey, defaultModel = DEFAULT_MODEL, timeoutMs = 60000 } = {}) {
  if (!apiKey) throw new Error('perplexity client: PERPLEXITY_API_KEY missing');

  // grounded(query) -> { text, citations } : a web-grounded answer with sources.
  async function grounded({ query, system, model, maxTokens = 1024 }) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: model || defaultModel,
          max_tokens: maxTokens,
          messages: [
            ...(system ? [{ role: 'system', content: system }] : []),
            { role: 'user', content: query },
          ],
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`perplexity ${res.status}: ${body.slice(0, 300)}`);
      }
      const data = await res.json();
      return {
        text: (data.choices?.[0]?.message?.content || '').trim(),
        citations: data.citations || data.search_results || [],
      };
    } finally {
      clearTimeout(t);
    }
  }

  return { grounded, defaultModel };
}

module.exports = { createPerplexityClient, DEFAULT_MODEL };
