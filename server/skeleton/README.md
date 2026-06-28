# Interview Prep — Skeleton (Phase A0)

The host + call-broker for the interview-prep suite, built the way the content
pipeline is built: **one skeleton that hosts every submodule and brokers every call
between them** (DEVELOPMENT_PLAN Rule 1). The skeleton is plumbing; submodules are the
work. Built inside Hello Lilly, **isolated from OnlyiGaming production** (Rule 2) — this
folder imports nothing from the OnlyiGaming pipeline.

## Layout

```
server/skeleton/
  host.cjs            boot: store + registry + broker, load submodules, expose invoke()
  broker.cjs          the switchboard — every inter-submodule call passes here
  registry.cjs        fail-closed manifest validation + registration
  capabilities.cjs    builds the per-invocation `tools` (the only handle a submodule gets); scoped store
  submodule-isolation.cjs  the require-guard scanner (enforces the brokering rule)
  ids.cjs             addressing scheme (DATA_CONTRACT v0.2 §2.1)
  contract/case.cjs   case factory + per-part status envelope (§2.2, §3)
  store/index.cjs     store: cases + private scratch + data-layer (datafacts); writing-rules policy
  writing-rules/      rules.cjs (banned phrases) + gate.cjs (enforce before persist)
  clients/            anthropic.cjs (llm/Opus) + perplexity.cjs (search/Sonar) — fresh in-repo
server/submodules/
  <id>/manifest.cjs + execute.cjs    flat, peer, position-agnostic
```

## The submodule contract

```js
// execute.cjs — pure, standalone-runnable, imports NOTHING from the skeleton
module.exports = async function execute(input, options, tools) { ... }
```

`manifest.cjs` declares `id`, `reads`, `writes`, and `capabilities` (a subset of
`http | logger | store | request | llm | search`). The skeleton injects **only** the
declared capabilities (least privilege). `tools.ids` (the shared contract vocabulary) is
always present. `llm` (Anthropic/Opus) and `search` (Perplexity Sonar) are fresh in-repo
clients under `clients/`, defaulted from `.env` (Rule 2) and injectable for tests.

## The brokering rule (the hinge)

Submodules never call each other directly. The **only** way to reach a peer is
`tools.request(id, input)`, which calls `broker.dispatch`. The submodule passes a
string id and holds no reference to the target. The broker threads a call-context
(ancestor chain + depth) the submodule cannot forge, and **refuses**:

| Guard | Trips on | Protects against |
|-------|----------|------------------|
| cycle | target already in the chain | `A → B → A` |
| depth | chain longer than `maxDepth` (8) | runaway recursion |
| budget | too many calls in one root invocation (50) | runaway cascade |
| circuit | a target that errored ≥3× | a cascade from one buggy tool |

Every call is logged, so one place sees the whole call graph.

**Enforced, not by convention** (`submodule-isolation.cjs`): a file under
`server/submodules/` may `require()` **only `node:` builtins, string literals only** —
so it has no way to reach a peer or the skeleton except through `tools.request`. Checked
in two places: the `submodule-isolation` test (drift → red CI) and a load-time assertion
in `loadSubmodules` (fail-closed at boot). **Accepted limitation (recorded boundary of the
guarantee):** a static scan can't stop a *determined* reflection-based bypass
(`globalThis`, `process.mainModule`, indirectly-built require); that's out of scope for
the threat model (first-party drift, not malicious escape). Revisit with a runtime
sandbox only if submodules ever become third-party/untrusted.

## Writing rules (two paths)

- **Authored prose** (text the system generates → case parts via `writePart`): the gate
  **always** runs, before persist. **No `skipGate` / self-opt-out** — a submodule cannot
  exempt its own generated text. A violation throws and nothing is written.
- **Imported facts / verbatim citations** (the candidate's real CV text → datafacts via
  the host-level `ingestDatafact`): **exempt** — evidence is kept verbatim, never rephrased
  to pass a style rule. The ingest path is **not** on the submodule-facing `tools.store`,
  so it's no back-door for prose.

(Full policy recorded in `store/index.cjs` — carried into the A2 brief unchanged.)

## Store scoping (least privilege, data dimension)

`tools.store` is a **scoped** view: a submodule may write only the case parts its manifest
`writes` declares, and only the case it was invoked for (caseId-bound). It cannot reach
another submodule's scratch namespace or the data-layer ingest path.

## Running

```
npm test          # node:test, no extra deps, no keys (mocked)
```

`server/skeleton` and `server/submodules` are **not** part of the Vite/Pages build, but
**CI runs `npm test` before build and a red test blocks the deploy** (`deploy-pages.yml`)
— so the broker/gate/guard are actually exercised on every push.

## Status

- **A0** — skeleton complete; `echo-researcher` / `echo-analyzer` stubs prove
  registration, brokered calls, store I/O, the gate, and standalone running.
- **A0-hardening** — CI runs tests (red blocks deploy); brokering rule enforced by the
  require-guard (test + load-time assertion); gate redesigned (authored-prose strict &
  non-bypassable, imported facts exempt); manifest writes-scope enforced; failed summons
  surfaced (no silent `ok:true`).
- **A1** — `researcher` (four fronts, niche depth) + `decoder` (true-job profile) shipped,
  using the `llm` + `search` capabilities; live-verified on Curoflow. Reader-drill included.
- **Next:** A2 (gap analyzer) reads `decodedRole` + the candidate data-layer.

Built to DATA_CONTRACT v0.2. Run `npm test` (mocked, no keys) or `npm run verify:a1` (live).
