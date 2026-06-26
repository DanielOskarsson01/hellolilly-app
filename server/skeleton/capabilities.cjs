'use strict';

// Builds the ONLY handle a submodule ever gets: its per-invocation `tools` object.
// A submodule reaches peers SOLELY through tools.request(id, input) -> broker.dispatch.
// It never requires the registry or another submodule, so there is no code path from
// one submodule to another — the broker is the single chokepoint (the brokering rule).
// Only capabilities declared in the manifest are injected (least privilege).

const { mintId, ref } = require('./ids.cjs');

function buildTools({ manifest, callContext, store, http, llm, search, logSink, dispatch }) {
  // tools.ids is the shared contract vocabulary (pure, no privilege) — always present,
  // so submodule files import NOTHING from the skeleton.
  const tools = { _partialItems: [], ids: { mintId, ref } };
  const caps = new Set(manifest.capabilities);

  if (caps.has('logger')) {
    tools.logger = {
      info: (msg) => logSink({ level: 'info', from: manifest.id, msg }),
      warn: (msg) => logSink({ level: 'warn', from: manifest.id, msg }),
      error: (msg) => logSink({ level: 'error', from: manifest.id, msg }),
    };
  }

  if (caps.has('store')) {
    tools.store = store; // shared collaborative space
    tools.scratch = store.scratch(manifest.id); // private dedicated space
  }

  if (caps.has('http')) tools.http = http;
  if (caps.has('llm')) {
    if (!llm) throw new Error(`[${manifest.id}] declares 'llm' but no llm client is configured`);
    tools.llm = llm;
  }
  if (caps.has('search')) {
    if (!search) throw new Error(`[${manifest.id}] declares 'search' but no search client is configured`);
    tools.search = search;
  }

  if (caps.has('request')) {
    // The submodule passes only a string id; it holds no reference to the target.
    // callContext threads the call chain so the broker can refuse cycles/cascades —
    // the submodule cannot forge a fresh root context to escape detection.
    tools.request = (id, input) => dispatch(id, input, callContext);
  }

  return tools;
}

module.exports = { buildTools };
