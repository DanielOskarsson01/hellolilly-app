'use strict';

// Shared store — interface + A0 in-memory implementation.
//
// Regions (concept §7.2):
//   - SHARED case objects (the produced content; collaborating submodules read/write)
//   - PRIVATE per-submodule scratch (a submodule's churn can't corrupt shared tables)
//   - the candidate DATA-LAYER (imported datafacts; the evidence the analyzer cites)
//
// WRITING-RULES POLICY (the gate redesign — carry this verbatim into the A2 brief):
//   Two kinds of text, two paths:
//   1. AUTHORED PROSE — text the system GENERATES (dossiers, decodedRole, fit, gaps, …).
//      Persisted ONLY via writePart(), which ALWAYS runs the writing-rules gate. There is
//      no skipGate / self-opt-out: a submodule cannot exempt its own generated prose.
//   2. IMPORTED FACTS / VERBATIM CITATIONS — the candidate's real CV text and quotes of it.
//      Persisted via ingestDatafact(), which is EXEMPT from the gate (these are evidence,
//      not authored prose, and must be preserved verbatim — never rephrased to pass a style
//      rule; rephrasing would launder the evidence the honesty mechanism depends on).
//   ingestDatafact is HOST-LEVEL ONLY — it is NOT exposed on the submodule-facing
//   tools.store (see capabilities.cjs), so it is not a back-door for authored prose.
//   (A2 added: a `datalayer` read capability for submodules, and a gate exemption for
//   evidence that EXACTLY equals the text of a datafact the written value references by a
//   {kind:'datafact',id} ref — ref-scoped exact whole-string equality, NOT substring.)
//
// This is the interface A0 commits to. Swapping to Hello Lilly's real DB later =
// reimplement these methods behind the same signatures.

const { createCase, setPartData, setPartStatus, PARTS } = require('../contract/case.cjs');
const { enforce } = require('../writing-rules/gate.cjs');

// Detach every value that crosses the store boundary, in BOTH directions, so the only way
// to change persisted state is through the store's own methods (which run the gate). Reads
// hand back a copy (callers can't mutate the live object); writes persist a copy (callers
// holding the written object can't mutate it into the store afterward). structuredClone is
// exact for the JSON-ish case shape (strings/numbers/arrays/objects/null). This closes the
// mutate-then-write side door around the writing-rules gate (was: getCase returned the live ref).
const detach = (v) => (v == null ? v : structuredClone(v));

function createStore() {
  const cases = new Map(); // shared, collaborative
  const scratchByNs = new Map(); // private, dedicated per submodule
  const datafacts = new Map(); // candidate data-layer (imported facts)
  const collections = new Map(); // non-case global regions: name -> Map(id -> record) — jobs/jobSources/jobRules/filterSet/…

  function requireCase(caseId) {
    const c = cases.get(caseId);
    if (!c) throw new Error(`No such case: ${caseId}`);
    return c;
  }

  // Collect the verbatim texts of the datafacts that THIS value references (by a
  // { kind:'datafact', id } ref anywhere in the tree). Only these are gate-exempt — the
  // value must cite a fact to keep its banned-word-bearing real CV text exact.
  function collectRefdFactTexts(value, out = new Set()) {
    if (Array.isArray(value)) { for (const v of value) collectRefdFactTexts(v, out); }
    else if (value && typeof value === 'object') {
      if (value.kind === 'datafact' && value.id) {
        const f = datafacts.get(value.id);
        if (f && typeof f.text === 'string') out.add(f.text);
      }
      for (const v of Object.values(value)) collectRefdFactTexts(v, out);
    }
    return out;
  }

  function createCaseRecord(meta) {
    const c = createCase(meta);
    cases.set(c.meta.id, c);
    return detach(c);
  }

  function getCase(caseId) {
    return detach(cases.get(caseId) || null);
  }

  function listCases() {
    return [...cases.values()].map(detach);
  }

  // Case delete — same convention as removeRecord: boolean result, no throw on a
  // missing id. Exists for operator cleanup (scrub-case.cjs); no API route exposes it.
  function removeCase(caseId) {
    return cases.delete(caseId);
  }

  // AUTHORED-PROSE path. The single persist chokepoint for generated text. The gate
  // ALWAYS runs — no opt-out. A violation throws and nothing is written. The persisted
  // value is a detached copy, so the caller can't mutate it into the store after the fact.
  function writePart(caseId, part, data) {
    const c = requireCase(caseId);
    // Ref-scoped verbatim-evidence exemption: only the texts of datafacts this value
    // cites are exempt, by EXACT equality (store/index.cjs header; gate.cjs check()).
    const exemptTexts = [...collectRefdFactTexts(data)];
    enforce(data, exemptTexts);
    return detach(setPartData(c, part, detach(data)));
  }

  // Multi-part write on ONE case: validate part names and run the writing-rules gate on
  // EVERY value first, then apply all. After validation nothing in the apply loop can
  // throw, so the parts change together or not at all — and the sqlite adapter persists
  // them as a single case-row write. Exists so the accept path can land the fit
  // migration and the gap resolution atomically (a durable fit that says 'match' while
  // the gap is still unresolved is exactly the partial-success state this forbids).
  function writeParts(caseId, parts) {
    const c = requireCase(caseId);
    const entries = Object.entries(parts);
    for (const [part, data] of entries) {
      if (!PARTS.includes(part)) throw new Error(`Unknown case part: ${part}`);
      enforce(data, [...collectRefdFactTexts(data)]);
    }
    const out = {};
    for (const [part, data] of entries) out[part] = setPartData(c, part, detach(data));
    return detach(out);
  }

  function setStatus(caseId, part, status, error) {
    return detach(setPartStatus(requireCase(caseId), part, status, error));
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

  // NON-CASE COLLECTIONS. Global, addressable, immutable named regions for data that is NOT a
  // per-interview case (jobs, jobSources, jobRules, the filter set). Each record carries a stable
  // `id` and is upserted by it. Detached on store AND on read (same immutability contract as cases).
  //
  // NOT writing-gated: these hold imported/structured records — a job's text_content is the
  // employer's verbatim ad (gating it would be wrong, like a datafact), and a filter rule is
  // operator-approved data. The writing-rules gate stays specific to case AUTHORED PROSE
  // (writePart). When a submodule later GENERATES prose into a record (a learner's rule rationale),
  // it runs the gate itself before putRecord — the store does not auto-gate collections.
  function collectionMap(name) {
    if (!collections.has(name)) collections.set(name, new Map());
    return collections.get(name);
  }
  function putRecord(collection, record) {
    if (!record || !record.id) throw new Error('putRecord: a record with an id is required');
    collectionMap(collection).set(record.id, detach(record));
    return detach(record);
  }
  function getRecord(collection, id) {
    const m = collections.get(collection);
    return detach((m && m.get(id)) || null);
  }
  function listRecords(collection) {
    const m = collections.get(collection);
    return m ? [...m.values()].map(detach) : [];
  }
  function removeRecord(collection, id) {
    const m = collections.get(collection);
    return m ? m.delete(id) : false;
  }

  // PERSISTENCE SEAM. snapshot() serializes the three durable regions to a JSON-safe
  // value; hydrate() replaces them from one. Scratch is deliberately excluded — it is
  // private per-run working state, not produced content. The file wrapper
  // (persistence.cjs) builds on exactly these two; the in-memory semantics above are
  // untouched, keeping the "swap the DB behind the same signatures" promise.
  function snapshot() {
    return detach({
      version: 1,
      cases: [...cases.entries()],
      datafacts: [...datafacts.entries()],
      collections: [...collections.entries()].map(([name, m]) => [name, [...m.entries()]]),
    });
  }
  function hydrate(snap) {
    if (!snap || snap.version !== 1) throw new Error('hydrate: unsupported or missing snapshot version');
    cases.clear();
    datafacts.clear();
    collections.clear();
    for (const [id, c] of snap.cases || []) cases.set(id, detach(c));
    for (const [id, f] of snap.datafacts || []) datafacts.set(id, detach(f));
    for (const [name, entries] of snap.collections || []) {
      const m = new Map();
      for (const [id, r] of entries || []) m.set(id, detach(r));
      collections.set(name, m);
    }
  }

  // IMPORTED-FACTS path. Exempt from the writing-rules gate by design (real CV text is
  // evidence, kept verbatim). Host-level only — not on tools.store. Detached at the
  // boundary like cases/collections: a caller mutating a fact object after ingest (or a
  // read copy) cannot change the stored evidence — which also means the ref-scoped gate
  // exemption always compares against the text as INGESTED, and (now that the store is
  // durable) in-session reads and post-restart reads can never diverge.
  function ingestDatafact(df) {
    if (!df || !df.id) throw new Error('ingestDatafact: a datafact with an id is required');
    datafacts.set(df.id, detach(df));
    return detach(df);
  }
  function getDatafact(id) {
    return detach(datafacts.get(id) || null);
  }
  function listDatafacts() {
    return [...datafacts.values()].map(detach);
  }

  // Datafact delete — removeRecord convention. Exists for compensation (a minted
  // fill-gap fact whose resolution write failed must not linger: the cv-builder mines
  // listDatafacts() directly, so a stray fact would leak into generated CVs) and for
  // operator cleanup. Host-level like ingestDatafact — not on tools.store.
  function removeDatafact(id) {
    return datafacts.delete(id);
  }

  return {
    createCase: createCaseRecord,
    getCase,
    listCases,
    removeCase,
    writePart,
    writeParts,
    setPartStatus: setStatus,
    scratch,
    putRecord,
    getRecord,
    listRecords,
    removeRecord,
    ingestDatafact,
    getDatafact,
    listDatafacts,
    removeDatafact,
    snapshot,
    hydrate,
  };
}

module.exports = { createStore };
