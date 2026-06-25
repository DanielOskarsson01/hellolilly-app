'use strict';

// The host — boots the store, registry and broker, loads submodules from disk, and
// exposes invoke() (the external entry). The host holds NO domain logic: it is
// plumbing. Submodules are the work.
//
// Isolation (Rule 2): this file and everything under server/skeleton + server/submodules
// import NOTHING from the OnlyiGaming pipeline. The default http capability is a fresh
// in-repo implementation (the same tiered approach can be reimplemented later, locally).

const fs = require('node:fs');
const path = require('node:path');
const { createStore } = require('./store/index.cjs');
const { createRegistry } = require('./registry.cjs');
const { createBroker } = require('./broker.cjs');
const { buildTools } = require('./capabilities.cjs');

function defaultHttp() {
  return {
    get: async (url, opts = {}) => {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), opts.timeout || 15000);
      try {
        const res = await fetch(url, {
          headers: { accept: 'application/json', 'user-agent': 'HelloLilly skeleton', ...(opts.headers || {}) },
          signal: controller.signal,
        });
        return { status: res.status, body: await res.text() };
      } finally {
        clearTimeout(t);
      }
    },
  };
}

// A submodule folder is loadable if it has both manifest.cjs and execute.cjs.
function loadSubmodules(registry, dir) {
  if (!fs.existsSync(dir)) return [];
  const ids = [];
  for (const name of fs.readdirSync(dir)) {
    const sub = path.join(dir, name);
    if (!fs.statSync(sub).isDirectory()) continue;
    const manifestPath = path.join(sub, 'manifest.cjs');
    const executePath = path.join(sub, 'execute.cjs');
    if (!fs.existsSync(manifestPath) || !fs.existsSync(executePath)) continue;
    ids.push(registry.register(require(manifestPath), require(executePath)));
  }
  return ids;
}

function createHost({ http, submodulesDir, limits } = {}) {
  const store = createStore();
  const registry = createRegistry();
  const broker = createBroker({ registry, store, http: http || defaultHttp(), limits });
  const dir = submodulesDir || path.resolve(__dirname, '../submodules');
  const loaded = loadSubmodules(registry, dir);
  return { store, registry, broker, loaded, invoke: broker.invoke };
}

// Run a single submodule ALONE — no broker (concept §7.2 "each submodule must run
// alone"). Peer requests are unavailable: tools.request throws. Proves a submodule
// is not welded to the skeleton's coordination.
async function runStandalone(manifest, execute, input, deps = {}) {
  const store = deps.store || createStore();
  const tools = buildTools({
    manifest,
    callContext: { chain: [manifest.id], depth: 0 },
    store,
    http: deps.http || defaultHttp(),
    logSink: deps.logSink || (() => {}),
    dispatch: () => { throw new Error('standalone mode: no broker — peer requests unavailable'); },
  });
  return execute(input, manifest.options || {}, tools);
}

module.exports = { createHost, runStandalone, loadSubmodules, defaultHttp };
