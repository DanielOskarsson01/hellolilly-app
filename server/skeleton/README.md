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
  capabilities.cjs    builds the per-invocation `tools` (the only handle a submodule gets)
  ids.cjs             addressing scheme (DATA_CONTRACT v0.2 §2.1)
  contract/case.cjs   case factory + per-part status envelope (§2.2, §3)
  store/index.cjs     shared store interface + in-memory impl (writing-rules gate runs on write)
  writing-rules/      rules.cjs (banned phrases) + gate.cjs (enforce before persist)
server/submodules/
  <id>/manifest.cjs + execute.cjs    flat, peer, position-agnostic
```

## The submodule contract

```js
// execute.cjs — pure, standalone-runnable, imports NOTHING from the skeleton
module.exports = async function execute(input, options, tools) { ... }
```

`manifest.cjs` declares `id`, `reads`, `writes`, and `capabilities` (a subset of
`http | logger | store | request`). The skeleton injects **only** the declared
capabilities (least privilege). `tools.ids` (the shared contract vocabulary) is always
present.

## The brokering rule (the hinge)

Submodules never call each other directly. The **only** way to reach a peer is
`tools.request(id, input)`, which calls `broker.dispatch`. The submodule passes a
string id and holds no reference to the target, so there is no code path from one
submodule to another — the broker is the single chokepoint. It threads a call-context
(ancestor chain + depth) the submodule cannot forge, and **refuses**:

| Guard | Trips on | Protects against |
|-------|----------|------------------|
| cycle | target already in the chain | `A → B → A` |
| depth | chain longer than `maxDepth` (8) | runaway recursion |
| budget | too many calls in one root invocation (50) | runaway cascade |
| circuit | a target that errored ≥3× | a cascade from one buggy tool |

Every call is logged, so one place sees the whole call graph.

## Writing rules

The store's `writePart` runs the deterministic writing-rules gate on generated text
**before** it persists; a violation throws and nothing is written.

## Running

```
npm test          # A0 acceptance tests (node:test, no extra deps)
```

`server/skeleton` and `server/submodules` are **not** part of the Vite/Pages build —
`npm run build` is unaffected.

## Status

Phase A0 only. Submodules `echo-researcher` / `echo-analyzer` are stubs that prove
registration, brokered calls, store I/O, the gate, and standalone running. The real
submodules arrive in A1+ (Researcher, Decoder+Analyzer, …). Built to DATA_CONTRACT v0.2.
