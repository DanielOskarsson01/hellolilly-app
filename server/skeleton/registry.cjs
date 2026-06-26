'use strict';

// Submodule registry. Manifest validation is FAIL-CLOSED: a malformed manifest
// throws at registration (mirrors the pipeline's moduleLoader discipline). The
// manifest declares what a submodule reads/writes and which capabilities it needs;
// the skeleton injects only the declared ones (least privilege, see capabilities.cjs).

const VALID_CAPABILITIES = new Set(['http', 'logger', 'store', 'request', 'llm', 'search']);

function validateManifest(m) {
  if (!m || typeof m !== 'object') throw new Error('manifest must be an object');
  if (!m.id || typeof m.id !== 'string') throw new Error('manifest.id (string) is required');
  if (!Array.isArray(m.reads)) throw new Error(`[${m.id}] manifest.reads must be an array`);
  if (!Array.isArray(m.writes)) throw new Error(`[${m.id}] manifest.writes must be an array`);
  if (!Array.isArray(m.capabilities)) throw new Error(`[${m.id}] manifest.capabilities must be an array`);
  for (const cap of m.capabilities) {
    if (!VALID_CAPABILITIES.has(cap)) throw new Error(`[${m.id}] unknown capability: ${cap}`);
  }
  return m;
}

function createRegistry() {
  const byId = new Map();

  function register(manifest, execute) {
    validateManifest(manifest);
    if (typeof execute !== 'function') throw new Error(`[${manifest.id}] execute must be a function`);
    if (byId.has(manifest.id)) throw new Error(`Duplicate submodule id: ${manifest.id}`);
    byId.set(manifest.id, { manifest, execute });
    return manifest.id;
  }

  return {
    register,
    get: (id) => byId.get(id) || null,
    has: (id) => byId.has(id),
    list: () => [...byId.values()].map((e) => e.manifest),
  };
}

module.exports = { createRegistry, validateManifest, VALID_CAPABILITIES };
