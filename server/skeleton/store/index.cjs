'use strict';

// Shared store — interface + A0 in-memory implementation.
//
// Two regions (concept §7.2): a SHARED collaborative space (the case objects,
// written by collaborating submodules) and PRIVATE dedicated scratch per submodule
// (so a submodule's churn can't corrupt shared tables).
//
// This is the interface A0 commits to. Swapping to Hello Lilly's real DB later =
// reimplement these methods behind the same signatures; nothing else changes.
//
//   createCase(meta)                    -> case
//   getCase(id) / listCases()
//   writePart(caseId, part, data, opts) -> envelope   (writing-rules gate runs here)
//   setPartStatus(caseId, part, status, error)
//   scratch(namespace)                  -> { get, set, all }  (private space)

const { createCase, setPartData, setPartStatus } = require('../contract/case.cjs');
const { enforce } = require('../writing-rules/gate.cjs');

function createStore() {
  const cases = new Map(); // shared, collaborative
  const scratchByNs = new Map(); // private, dedicated per submodule

  function requireCase(caseId) {
    const c = cases.get(caseId);
    if (!c) throw new Error(`No such case: ${caseId}`);
    return c;
  }

  function createCaseRecord(meta) {
    const c = createCase(meta);
    cases.set(c.meta.id, c);
    return c;
  }

  function getCase(caseId) {
    return cases.get(caseId) || null;
  }

  function listCases() {
    return [...cases.values()];
  }

  // The single persist chokepoint. Generated text is gated BEFORE it lands;
  // a violation throws and nothing is written. Pass { skipGate:true } for data
  // that is not generated prose (e.g. machine-built status maps).
  function writePart(caseId, part, data, opts = {}) {
    const c = requireCase(caseId);
    if (!opts.skipGate) enforce(data);
    return setPartData(c, part, data);
  }

  function setStatus(caseId, part, status, error) {
    return setPartStatus(requireCase(caseId), part, status, error);
  }

  function scratch(ns) {
    if (!scratchByNs.has(ns)) scratchByNs.set(ns, new Map());
    const m = scratchByNs.get(ns);
    return {
      get: (k) => m.get(k),
      set: (k, v) => { m.set(k, v); return v; },
      all: () => Object.fromEntries(m),
    };
  }

  return {
    createCase: createCaseRecord,
    getCase,
    listCases,
    writePart,
    setPartStatus: setStatus,
    scratch,
  };
}

module.exports = { createStore };
