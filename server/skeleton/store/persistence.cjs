'use strict';

// JSON-file snapshot persistence — the Stream 2 "decide persistence" decision.
// A createStore() hydrated from a snapshot file at boot, whose mutating methods
// schedule a debounced atomic write (tmp + rename) of store.snapshot(). Single-user
// dev-tool sizing by design: one process owns the file. Swapping to a real DB later
// still means reimplementing the store methods behind the same signatures — this
// wrapper adds only flush() on top of them.

const fs = require('node:fs');
const path = require('node:path');
const { createStore } = require('./index.cjs');

// Every method that changes durable state (cases / datafacts / collections).
// scratch is intentionally absent — it is private per-run state and not snapshotted.
const MUTATORS = ['createCase', 'removeCase', 'writePart', 'writeParts', 'setPartStatus', 'ingestDatafact', 'removeDatafact', 'putRecord', 'removeRecord'];

function createPersistentStore({ path: filePath, debounceMs = 300 } = {}) {
  if (!filePath) throw new Error('createPersistentStore: a path is required');
  const store = createStore();

  if (fs.existsSync(filePath)) {
    try {
      store.hydrate(JSON.parse(fs.readFileSync(filePath, 'utf8')));
    } catch (err) {
      // Never crash the server over a bad snapshot — keep the evidence, start empty.
      const backup = `${filePath}.corrupt`;
      try { fs.copyFileSync(filePath, backup); } catch { /* keep going — the warn below still fires */ }
      console.warn(`[store] snapshot at ${filePath} unreadable (${err.message}) — starting empty; bad file kept at ${backup}`);
    }
  }

  function save() {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tmp = `${filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(store.snapshot()));
    fs.renameSync(tmp, filePath); // atomic on the same filesystem — no torn snapshot
  }

  let timer = null;
  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      try {
        save();
      } catch (err) {
        console.error(`[store] snapshot write failed: ${err.message}`);
      }
    }, debounceMs);
    if (typeof timer.unref === 'function') timer.unref(); // never hold the process open
  }

  // Synchronous save-now: process shutdown hooks and tests.
  function flush() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    save();
  }

  const wrapped = { ...store, flush };
  for (const m of MUTATORS) {
    wrapped[m] = (...args) => {
      const out = store[m](...args); // a throw (e.g. the writing gate) skips the save
      schedule();
      return out;
    };
  }
  return wrapped;
}

module.exports = { createPersistentStore };
