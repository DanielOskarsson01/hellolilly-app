'use strict';

// The broker — the single switchboard every inter-submodule call passes through
// (concept §7.3). A broker that only passes calls through is half a broker; this one
// can REFUSE. Four guards make peer-calling safe:
//   - cycle:    target already in the ancestor chain        (A -> B -> A)
//   - depth:    chain longer than maxDepth                  (runaway recursion)
//   - budget:   too many total calls in one root invocation (runaway cascade)
//   - circuit:  a target that has errored too often is cut  (stop a cascade at the edge)
// Every call is logged, so there is one place that sees the whole call graph.

const { buildTools } = require('./capabilities.cjs');

const DEFAULTS = { maxDepth: 8, maxCalls: 50, maxErrorsPerTarget: 3 };

class BrokerRefusal extends Error {
  constructor(message, detail) {
    super(message);
    this.name = 'BrokerRefusal';
    this.detail = detail; // { kind: 'cycle' | 'depth' | 'budget' | 'circuit' | 'unknown' }
  }
}

function createBroker({ registry, store, http, llm, search, limits = {} }) {
  const cfg = { ...DEFAULTS, ...limits };

  function makeDispatch(rootState) {
    // dispatch(targetId, input, parentContext); parentContext is null for the root.
    function dispatch(targetId, input, parentContext) {
      const chain = parentContext ? parentContext.chain : [];
      const depth = parentContext ? parentContext.depth + 1 : 0;

      if (chain.includes(targetId)) {
        rootState.log.push({ event: 'refused', reason: 'cycle', target: targetId, chain: [...chain] });
        throw new BrokerRefusal(`cycle refused: ${[...chain, targetId].join(' -> ')}`, { kind: 'cycle' });
      }
      if (depth > cfg.maxDepth) {
        rootState.log.push({ event: 'refused', reason: 'depth', target: targetId, depth });
        throw new BrokerRefusal(`max depth ${cfg.maxDepth} exceeded at ${targetId}`, { kind: 'depth' });
      }
      if (rootState.callCount >= cfg.maxCalls) {
        rootState.log.push({ event: 'refused', reason: 'budget', target: targetId });
        throw new BrokerRefusal(`call budget ${cfg.maxCalls} exhausted at ${targetId}`, { kind: 'budget' });
      }
      if ((rootState.errors.get(targetId) || 0) >= cfg.maxErrorsPerTarget) {
        rootState.log.push({ event: 'refused', reason: 'circuit', target: targetId });
        throw new BrokerRefusal(`circuit open for ${targetId}`, { kind: 'circuit' });
      }

      const entry = registry.get(targetId);
      if (!entry) throw new BrokerRefusal(`unknown submodule: ${targetId}`, { kind: 'unknown' });

      rootState.callCount += 1;
      const callContext = { chain: [...chain, targetId], depth };
      const started = Date.now();
      rootState.log.push({ event: 'call', target: targetId, depth, chain: [...chain] });

      const tools = buildTools({
        manifest: entry.manifest,
        callContext,
        store,
        http,
        llm,
        search,
        logSink: (e) => rootState.log.push({ event: 'log', ...e }),
        dispatch,
      });

      return Promise.resolve()
        .then(() => entry.execute(input, entry.manifest.options || {}, tools))
        .then((result) => {
          rootState.log.push({ event: 'return', target: targetId, ms: Date.now() - started });
          return result;
        })
        .catch((err) => {
          rootState.errors.set(targetId, (rootState.errors.get(targetId) || 0) + 1);
          rootState.log.push({ event: 'error', target: targetId, error: err.message });
          throw err;
        });
    }
    return dispatch;
  }

  // The only place a root call-context is born. External callers (the host's API,
  // a test) enter here; submodules enter via tools.request.
  async function invoke(targetId, input) {
    const rootState = { callCount: 0, errors: new Map(), log: [] };
    const dispatch = makeDispatch(rootState);
    const result = await dispatch(targetId, input, null);
    return { result, log: rootState.log };
  }

  return { invoke, config: cfg };
}

module.exports = { createBroker, BrokerRefusal, DEFAULTS };
