# HelloLilly - Project Inventory (factual state of the code)

**Date:** 2026-07-02
**Repo:** `hello lily - app` (github.com/DanielOskarsson01/hellolilly-app), current `main` (origin/main `16a0451`; working tree verified identical for `server/`, `src/`, `scripts/`).
**What this is:** A stocktaking of what the code IS and DOES today - not what was intended. No fixes, no priorities, no opinions. Where a fact could not be confirmed from the code it is marked **UNVERIFIED** rather than guessed.
**Method:** ~32 parallel reader agents, one per submodule and per screen plus dedicated readers for the skeleton, store, API layer, scripts, routing, data bridge, and components; then a seams pass consolidating contradictions and comparing against `/docs`. Every claim is grounded in a file that was read.
**A note on "tested":** the runner is `npm test` = `node --test "server/**/*.test.cjs" "scripts/**/*.test.cjs"`. "unit tests only" means the test exists but mocks external I/O (LLM/HTTP); no submodule or screen was confirmed validated against a live external API in this pass (all such validation is marked UNVERIFIED).

---

## State at a glance

The HelloLilly app has 11 backend submodules under `server/submodules/`: 9 are real (built+tested) implementations (cv-builder, decoder, gap-analyzer, job-discovery, job-ingest, linkedin-job-fetcher, researcher, stage2-filter, writer) and 2 are explicitly A0 stubs (echo-analyzer, echo-researcher). Submodules never import each other; every inter-module call passes through the skeleton broker (`tools.request`), and the four real A2 capabilities (gap-analyzer, cv-builder, writer, fill-gap) are reachable only through the `POST /api/case/:id/...` routes of a hand-rolled `node:http` dev server (`server/dev-server.cjs`); a separate `POST /api/jobs/search` route depends on the OnlyiGaming sibling repo. The store is 100% in-memory JS `Map`s - no disk, DB, or serialization, so nothing survives process exit. There are 13 real screens (12 jobseeker routes + the `coach` view) in a hand-rolled hash router; zero read the real HelloLilly backend - no `/api/...` call exists anywhere in the frontend, and every submodule/screen test is unit-only (no live-API validation, all mocked). Screens instead read hardcoded `strategyData.js` fixtures, browser-direct external job APIs, and localStorage; this inventory documents 43 seams across 12 sections (A-L).

### Backend at a glance

| Item | Purpose (terse) | Status | Tested | Invoked by |
|---|---|---|---|---|
| cv-builder | Selects (never authors) datafacts into a `cvDraft` | built+tested | unit (mock LLM); live UNVERIFIED | `host.invoke` via `POST /api/case/:id/generate` |
| decoder | Decodes ad + dossiers into weighted `decodedRole` requirements | built+tested | unit (mock LLM); live UNVERIFIED | Brokered by researcher; host/broker |
| echo-analyzer | A0 stub: brokers a peer, writes placeholder gap | stub | unit only | `host.invoke` (test harness only) |
| echo-researcher | A0 stub: writes hardcoded placeholder dossier | stub | unit only | Brokered / standalone (test only) |
| gap-analyzer | Writes honest `fit` (cite-by-id) + `gaps` | built+tested | unit (mock LLM); live UNVERIFIED | `host.invoke` via `POST /api/case/:id/analyze` |
| job-discovery | Multi-provider job search, dedup, stage-1 flag | built+tested | unit (fake http); live UNVERIFIED | `npm run discover` via broker |
| job-ingest | Ingest LinkedIn CSV into `jobs` collection | built+tested | unit (in-mem store); live UNVERIFIED | `host.invoke` in run-enrich/run-filter |
| linkedin-job-fetcher | Fetch/enrich LinkedIn guest-endpoint job bodies | built+tested | unit (fake http); live UNVERIFIED | `host.invoke` in run-enrich/run-filter |
| researcher | 4 dossiers (Perplexity+LLM), then summons decoder | built+tested | unit (mock llm/search); live UNVERIFIED | `host.invoke`; `npm run verify:a1` |
| stage2-filter | Body-level reject-code flagging (never drops) | built+tested | unit (in-mem store); live UNVERIFIED | `node server/run-filter.cjs` via broker |
| writer | Generates `coverLetter` prose (gate-checked) | built+tested | unit (mock LLM); live UNVERIFIED | `host.invoke` via `POST /api/case/:id/generate` |
| Skeleton core | host/broker/registry/capabilities/isolation/ids/utils | built+tested | 35 pass, 0 fail (mocked); live UNVERIFIED | Boots submodules; `createHost().invoke` |
| Skeleton services | contract, datafacts, fill-gap, writing-rules, clients | built+tested (clients: no unit tests) | unit only; anthropic/perplexity clients UNVERIFIED live | Host + `POST /api/case/:id/gap/:id/answer` |
| Store | In-memory cases/scratch/datafacts/collections (`Map`s) | built+tested | unit only (pure in-memory) | `createStore()` per host; no DB/disk |
| API layer | `node:http` dev server, 6 routes, no Express | partial (jobs/search path untested) | unit (`api.test.cjs`); jobs/search UNVERIFIED | `npm run dev`; imported by tests |
| Seeds/scripts | discover/enrich/filter/seed:datafacts/verify:a1 | partial (runner scripts untested) | submodules tested; scripts untested | `node ...` (each boots own in-mem host) |

### Frontend at a glance

| Screen | Route | Data source (actual) | Real backend data? | Design system |
|---|---|---|---|---|
| home.jsx | `home` | Live JobTech API direct-from-browser (jobs only) + `strategyData.js` fixtures + localStorage cache | no | bespoke |
| cvActivity.jsx (CVBuilder) | `cv` | Hardcoded fixture (`strategyData.js`) only | no | bespoke |
| cvActivity.jsx (ActivityTracker) | `activity` | Hardcoded fixture (`strategyData.js`) only | no | bespoke |
| coverLetter.jsx | `letter` | Hardcoded fixture (`strategyData.js`) only | no | bespoke |
| interview.jsx | `interview` | Hardcoded fixtures (inline + `PIPELINE_RUN`) | no | bespoke |
| library.jsx | `library` | Hardcoded fixture (`strategyData.js`) only | no | bespoke |
| review.jsx | `review` | Hardcoded in-file fixture only | no | bespoke |
| studio.jsx | `studio` | Hardcoded inline fixtures only | no | partial (shared components, bespoke layout) |
| coach.jsx | `coach` | Hardcoded fixtures (`strategyData.js` + inline) | no | bespoke |
| match.jsx | `match` | localStorage only (`jobStore.js` accepted jobs); analysis is `MATCH_DETAILS` fixture | no | bespoke |
| calendar.jsx | `calendar` | Hardcoded inline fixtures only | no | bespoke |
| community.jsx | `community` | Hardcoded inline fixtures only | no | bespoke |
| jobSearch.jsx | `jobbsok` | External job APIs direct-from-browser + localStorage (`jobStore.js`) | no | bespoke |

---

## Part 1 - Backend inventory

**Submodules** (`server/submodules/`, 11 - 9 real, 2 A0 stubs). Note: each submodule's manifest is `manifest.cjs` (a JS module), not `manifest.json`.

### cv-builder

- **Purpose:** Assembles a tailored `cvDraft` by SELECTING (never authoring) which existing candidate datafacts belong in each CV section, based on the decoded role requirements + fit evidence. Language-parameterised.
- **Status:** built+tested+on main. Not a stub — `execute.cjs` (46 lines) makes a real LLM call and writes a structured `cvDraft` part. The system prompt explicitly constrains the model to output only datafact ids (`{ "sections": [{ "key", "heading", "datafactIds": [] }] }`); code then resolves those ids to verbatim datafact text and drops any id not in the pool. (Files: `server/submodules/cv-builder/execute.cjs`, `server/submodules/cv-builder/manifest.cjs` — note the manifest is `manifest.cjs`, NOT `manifest.json`.)
- **Verified how:** unit tests only (mock LLM). Two direct tests in `server/skeleton/a2.test.cjs` (`'cv-builder selects datafacts into a cvDraft (selects, never authors)'` at L90; `'cv-builder drops hallucinated ids and empty sections'` at L111) plus two integration tests in `server/api.test.cjs` exercising it via `POST /generate` (L111, L128). All inject a mock `llm.completeJSON`. Live-validation against a real Anthropic API: UNVERIFIED (no smoke/verify script or run artifact found).
- **Inputs and outputs:**
  - Reads (manifest `reads`): case parts `meta`, `decodedRole`, `fit`. In code: `tools.store.getCase(caseId)` for `meta.role`/`meta.company`, `decodedRole.data.requirements`, and `fit.data.capability.requirements` (filtered to `status === 'match'` for matched evidence). Also pulls the full datafact pool via `tools.datalayer.listDatafacts()`, filtered by `options.language`.
  - Writes (manifest `writes`): case part `cvDraft` via `tools.store.writePart(caseId, 'cvDraft', ...)`. Sets `cvDraft` status to `pending` at start, `failed` (with message) on error. Output shape: `{ language, sections: [{ key, heading, items: [{ datafactRef, text }] }] }`; only sections with ≥1 resolvable item are kept. Returns `{ ok: true, sections, items }` on success.
  - Capabilities used (manifest `capabilities: ['store','llm','datalayer']`): `tools.store`, `tools.llm.completeJSON`, `tools.datalayer.listDatafacts`. Also uses `tools.ids.ref('datafact', id)` — `ids` is always injected by `capabilities.cjs` (not gated by the capabilities list), so this works despite `ids` not being declared in the manifest.
  - Options: `model` (default `claude-opus-4-8`), `language` (default `en`); `maxTokens: 2000` hardcoded in the call.
- **Runnable how:** In-process via the host broker `host.invoke('cv-builder', { caseId })`. Reached over HTTP through `POST /api/case/:caseId/generate` in `server/dev-server.cjs` (L119: loops `['cv-builder','writer']`), which requires the running dev server (`npm run dev` → `node server/dev-server.cjs`). A real run needs a real LLM key (an Anthropic key for the default `claude-opus-4-8` model) — UNVERIFIED which env var, not checked in this area. Tests run headless with a mock LLM via `npm test`; no running server needed for tests. Does NOT depend on the sibling JobSearch repo or an OnlyiGaming pipeline.

### decoder

- **One-line purpose:** Stage-2 "true-job decoder" (A1) — an LLM submodule that reads a job ad (`meta.sourceInput`) plus the researcher's dossiers (company stage/ambitions/culture/niche signals) and emits `decodedRole`: a narrative + 6–12 weighted real requirements beneath the ad, which the A2 gap analysis maps against instead of the raw ad.
- **Status:** built + tested + on main. Real (non-stub) submodule — makes a genuine `tools.llm.completeJSON` call, mints requirement ids, and persists through the writing-rules gate. Not an echo/stub.
- **Verified how:** unit tests only, with a **mock LLM (no live API calls)**. Primary test: `server/skeleton/a1.test.cjs` — exercises the decoder via the researcher/broker chain: contract-shape conformance (`decodedRole.data.requirements` all have `decodedRequirement_*` ids), broker dispatch (`chain: ['researcher']`), and a failure-surfacing case (LLM throws → `decodedRole.status === 'failed'`, researcher returns `ok:false, partial:true, decoderError`). Also referenced in `server/skeleton/submodule-isolation.test.cjs` (source-scan isolation guard) and the writing-rule gate is unit-tested at store level in `server/skeleton/store/index.test.cjs` (`writePart` on `decodedRole` throws on banned word). The a1 test file states verbatim (line 5): "Live niche-depth quality is verified separately." Live-data validation of the decoder: UNVERIFIED (no smoke/verify script or committed run artifact found).
- **Inputs and outputs:**
  - **Input:** `{ caseId }`. Reads from the case: `meta` (`company`, `role`, `sourceInput`) and `dossiers.data` (keys `company`, `product`, `people`, `niche` — each `summary` + `paragraphs[].text`, truncated to 12000 chars via `tools.utils.truncate`).
  - **Capabilities (from `manifest.cjs`):** `store`, `logger`, `llm`, `utils`. (execute.cjs also calls `tools.ids.mintId('decodedRequirement')` and `tools.ids` is always injected by `capabilities.cjs` regardless of manifest, so this works despite `ids` not being a declared capability.) Model default `claude-opus-4-8`.
  - **Output / writes:** `decodedRole` case part = `{ narrative, requirements: [ { id: decodedRequirement_*, requirement, rationale, weight (1–5|null) } ] }`. Requirements with empty `requirement` are filtered out. `manifest.reads: ['dossiers']`, `manifest.writes: ['decodedRole']`. It sets `decodedRole` status `pending` → (success) `ready` / (error) `failed`. Writes go through the scoped store's `writePart`, which always runs the writing-rules gate; on a `WritingRuleError` the decoder does a one-shot LLM rephrase (`gatedWrite`) to strip the banned phrases, then re-writes. Returns `{ ok: true, requirements: <count> }`; on error it marks the part `failed` and rethrows.
- **Runnable how:** No dedicated npm script or HTTP endpoint invokes the decoder directly. It runs (a) under `npm test` (`node --test "server/**/*.test.cjs"`) via `a1.test.cjs` with a mocked LLM, or (b) in-process through the skeleton host/broker — normally **summoned by the `researcher` submodule via the broker** (README + manifest), or standalone given a case that already has dossiers. A real (non-test) run needs a configured live `llm` client (`buildTools` throws "declares 'llm' but no llm client is configured" if absent → implies an Anthropic/Opus API key at the host layer, UNVERIFIED which env var). No running server, external script, or sibling repo (JobSearch/OnlyiGaming pipeline) is required.

### echo-analyzer

- **Purpose:** A0 skeleton stub proving one submodule can summon another *through the skeleton broker* (`tools.request`) rather than by direct import, then read the summoned peer's output from the store and write a placeholder result.
- **Status:** built but STUB. `execute.cjs` (32 lines) brokers a call to `echo-researcher`, reads the case, and writes a single hardcoded placeholder gap (`what: 'Stub gap (A0)'`, `body: 'Placeholder bridge body.'`, `oneLiner: 'Placeholder one-liner.'`). No real analysis logic. Both the manifest header and README mark it A0-stub, "Replaced by the real Decoder+Analyzer in A2." README §Status says A2 (the real gap analyzer) is "Next" / not yet built.
- **Verified how:** unit tests only — `server/skeleton/skeleton.test.cjs`. Two tests exercise echo-analyzer directly: the "brokered flow" test (registers, invokes via `host.invoke('echo-analyzer')`, asserts `result.ok === true`, `dossiersReadyFirst === true`, the researcher ran via broker before the analyzer read dossiers, and `chain === ['echo-analyzer']`), and the "each submodule runs alone" test (asserts standalone `runStandalone` of echo-analyzer *throws* `/standalone mode/` because it needs a peer and has no broker). Run via `npm test`. No live-data validation (it makes no external calls); live-validation is N/A.
- **Inputs and outputs:**
  - **Input:** `{ caseId }`.
  - **Reads (store):** the case via `tools.store.getCase(caseId)`, specifically checking `theCase.dossiers.status === 'ready'` (the dossiers part written by `echo-researcher`). Manifest `reads: ['dossiers']`.
  - **Writes (store):** `tools.store.writePart(caseId, 'gaps', gaps)` — one placeholder gap object. Manifest `writes: ['gaps']`.
  - **Brokered peer call:** `tools.request('echo-researcher', { caseId })` — starts the researcher through the skeleton (no direct import of echo-researcher in this file).
  - **Other tools used:** `tools.ids.mintId('gap' | 'bridge')` for ids.
  - **Capabilities (manifest):** `['store', 'logger', 'request']`. Note: `logger` is declared but never used in `execute.cjs` (uses only `store`, `request`, and `ids`). Does not use http/llm/search/utils/datalayer.
  - **Returns:** `{ ok: true, dossiersReadyFirst, wroteGap: gaps[0].id }`.
- **Runnable how:** Invoked programmatically through the skeleton host, not by an npm script or HTTP endpoint of its own. Exercised only by `npm test` (`node --test "server/**/*.test.cjs" "scripts/**/*.test.cjs"`), which creates a host (`server/skeleton/host.cjs`) and calls `host.invoke('echo-analyzer', …)`. No running server needed for the test; no env key; no dependency on the sibling JobSearch/OnlyiGaming repos (pure in-memory store + broker). Cannot run standalone (needs the broker for its peer request; standalone invocation throws by design).

### echo-researcher

- **One-line purpose:** A0 stub researcher — writes a hardcoded placeholder "company" dossier to a case to prove a submodule can register, be invoked through the skeleton, and write a case part against the contract.
- **Status:** built but STUB. `execute.cjs` performs no research and takes no external input beyond `caseId`; it writes a fixed literal object (`company` dossier with one placeholder paragraph; `product`/`people`/`niche` all `null`). Its own manifest self-describes as "A0 stub… Replaced by the real Researcher in A1" (`manifest.cjs:4-7`) and `execute.cjs:11-12` labels the text a "Placeholder … from the A0 stub researcher."
- **Verified how:** unit tests only. Referenced by `server/skeleton/skeleton.test.cjs` in two tests: the brokered-flow test (`skeleton.test.cjs:20-38`, echo-analyzer summons echo-researcher through the broker; asserts the researcher runs first and its call carries `chain: ['echo-analyzer']`) and the standalone test (`:81-91`, `runStandalone` on the researcher, then asserts `dossiers.status === 'ready'`). These exercise wiring/registration/write-path, not any research logic. No live-data validation (nothing calls an external API) — the module makes no network/LLM calls at all. `npm test` = `node --test "server/**/*.test.cjs" "scripts/**/*.test.cjs"`, which picks up `skeleton.test.cjs`.
- **Inputs and outputs:**
  - Inputs: `input.caseId` only. Tools used from the injected `tools` object: `tools.logger` (info log; guarded by `if (tools.logger)`) and `tools.store.writePart`. Also calls `tools.ids.mintId('paragraph')`, which is always injected by the host regardless of declared capabilities (`server/skeleton/capabilities.cjs:47`). Reads nothing from the store (manifest `reads: []`).
  - Outputs: writes the case part `dossiers` via `tools.store.writePart(caseId, 'dossiers', …)` — routed through the store chokepoint so the writing-rules gate runs before persist (comment at `execute.cjs:25`). Returns `{ ok: true, wrote: 'dossiers' }`. Manifest declares `writes: ['dossiers']`, `capabilities: ['store','logger']`, matching the code.
- **Runnable how:** No dedicated npm script or HTTP endpoint invokes it. It is loaded/registered by the skeleton host (`server/skeleton/host.cjs` scans `server/submodules/` and registers each manifest+execute) and invoked in two ways, both only inside the test harness: (1) brokered — dispatched by echo-analyzer via `tools.request` / `broker.dispatch`; (2) standalone — via `runStandalone(manifest, execute, { caseId }, { store })` (`server/skeleton/host.cjs`, exercised in `skeleton.test.cjs:81-91`). Needs no running server, no env key, no external/sibling repo — it is pure and self-contained (imports nothing; uses only injected `tools`). The only way it runs today is `npm test`.

### gap-analyzer

- **Purpose:** A2 core. Reads a case's decoded role + the candidate datafact pool (+ optional preferences) and writes an honest fit (per-requirement `match`/`partial`/`missing`, each `match` citing a real datafact by id) and a list of gaps (each with a bridge + material). (`server/submodules/gap-analyzer/execute.cjs:59-187`, `manifest.cjs:5-12`)
- **Status:** built + tested + on main. Real logic, not a stub: cite-by-id honesty enforcement (unresolvable/hallucinated `datafactId` on a `match` is downgraded to `partial` and drops the `evidenceRef`; out-of-enum status clamped to `missing`), a status/enum clamp, and a one-shot gate-aware LLM retry when its own authored prose trips the writing-rule gate (`execute.cjs:100-174`).
- **Verified how:** unit tests only — `server/skeleton/a2.test.cjs` (2 gap-analyzer tests: "writes honest fit + gaps citing datafacts" incl. hallucinated-id downgrade; "regenerates once when its authored prose trips the writing gate"). Both use a **mocked LLM** (`mockLlm` / inline `completeJSON` stub, `a2.test.cjs:14-21,70-77`); no real Anthropic call is exercised. Downstream shape is also referenced in `server/api.test.cjs` and `server/skeleton/fill-gap/bullet-judge.test.cjs` (they hand-write a `gaps` part with `provenance: 'gap-analyzer'`). **Live-data validation: UNVERIFIED** (no smoke/verify script or committed run artifact found).
- **Inputs and outputs:**
  - **Input arg:** `{ caseId, preferences? }`.
  - **Reads (tools):** `store.getCase(caseId)` → `theCase.decodedRole.data` (requires `requirements[]`) and `theCase.meta` (role/company); `datalayer.listDatafacts()` for the evidence pool; `logger` (optional); `llm.completeJSON` for the analysis. Manifest declares `reads: ['meta','decodedRole']`, `capabilities: ['store','logger','llm','datalayer']`. `tools.ids` (mintId/ref) is also used but is not a gated capability — it is always injected by the capabilities layer (`server/skeleton/capabilities.cjs:47`).
  - **Writes (tools):** `store.writePart(caseId,'fit',…)` and `store.writePart(caseId,'gaps',…)`; sets part status `pending`→(via writePart)`ready`, or `failed` with the error message on throw. Manifest `writes: ['fit','gaps']`. Fit refs are minted via `tools.ids.ref('decodedRequirement'|'datafact', …)`; gap/bridge ids via `tools.ids.mintId('gap'|'bridge')`. Return value: `{ ok, requirements, matched, gaps }` (counts only).
  - **LLM:** system prompt embeds a 5-layer analysis framework + honesty bar + a hardcoded banned-word/phrase list; `options.model` default `claude-opus-4-8`, `maxTokens: 4000` (`execute.cjs:14-98,95-97`, `manifest.cjs:11`).
- **Runnable how:** In-process only via the host — no standalone script. Invoked as `host.invoke('gap-analyzer', {caseId, preferences})` from the dev server's `POST /api/case/:id/analyze` route (`server/dev-server.cjs:89`), which also reads preferences from `docs/candidate_preferences.json` (`dev-server.cjs:315`, optional — warns and proceeds without if missing). Needs a running dev server for the HTTP path, or direct `host.invoke` in tests. A real run needs a working `llm` capability (Anthropic key) since it calls `llm.completeJSON`; the unit tests avoid this by injecting a mock LLM into `createHost`. No dependency on the sibling JobSearch repo or an OnlyiGaming pipeline observed for this module.

### job-discovery

- **Purpose:** Step 1 of the job-search cluster — scheduled multi-provider job search. Queries configured job-board APIs, maps results to a canonical job shape, dedups by `externalId`, and flags (never hides) jobs matching store-backed reject rules.
- **Status:** built + tested + on main (real implementation, NOT a stub). `execute.cjs` (203 lines) contains a full provider catalog (jobtech/remoteok/remotive), field-map resolution with fallbacks, search-vs-feed modes, HTML-stripping, `externalId` dedup, and stage-1 rule flagging (`reject_title`, `bad_company`, `location_out`, `location_off_target`).
- **Verified how:** unit tests only — `server/skeleton/job-discovery.test.cjs` (6 tests, all pass; confirmed by running `node --test`). Tests use a fake `http` capability returning canned provider payloads — no real API is called under test. Live-data validation: UNVERIFIED (a manual runner exists — `server/run-discovery.cjs` — that hits the real public APIs, but no committed run artifact proving a live run was found).
- **Inputs and outputs:**
  - Manifest is `manifest.cjs` (not `manifest.json`): `id: 'job-discovery'`, `reads: []`, `writes: []`, `capabilities: ['http','store','logger','utils']`, `options: {}`.
  - Input arg: `{ profile? }` — an optional schedule-profile name (`'daily'|'weekly'`); currently unused inside `execute.cjs` (the code ignores `input`).
  - Reads from `tools.store`: `getRecord('filterSet','active')` (throws loudly if absent) — consumes flat fields `searchTerms[]`, `providers[]`, `maxResults`, `rejectTitleTerms[]`, `badCompanies[]`, `stage_1.location.{good,maybe,out}[]`. Also `listRecords('jobs')` to build the dedup set.
  - Uses `tools.http.get` (provider API calls), `tools.utils` (`stripHtml`, `truncate`, `parseJSON`), `tools.logger` (info/warn/error), and `tools.ids.mintId('job')` (note: `tools.ids` is injected unconditionally by `capabilities.cjs`, not declared in the manifest `capabilities` list).
  - Writes: canonical job records into the global `jobs` collection via `tools.store.putRecord('jobs', …)`. Shape: `{ id, externalId (provider-prefixed), source, title, company, location, url, snippet, text_content, postedAt, decision:'new', discoveredAt, signal, matchedRules }`. Pushes each new record to `tools._partialItems` for timeout resilience. (Global collections like `jobs`/`filterSet` are not part-scoped by the manifest `writes` field — `writes` governs case parts only; see `capabilities.cjs` `makeScopedStore`.)
  - Return value: `{ ok, found, added, perProvider, errors }`.
- **Runnable how:** `npm run discover` → `node server/run-discovery.cjs` (manual, single-process, no running server needed). That script requires the local, uncommitted `docs/candidate_preferences.json`, builds the filter set via `buildFilterSet` (`server/seed-filter-set.cjs`), seeds it into the in-memory store, then invokes the submodule through the host broker (`createHost().invoke('job-discovery', {})`). The three providers (jobtech / remotive / remoteok) are public and need no auth/env key (discovery needs neither `llm` nor `search`). No dependency on the sibling `../JobSearch` repo or an OnlyiGaming pipeline — provider transport is copied in-repo ("copy freely, call never"). Store is in-memory only (A0), so state does not persist across separate process invocations.

### job-ingest

- **Purpose:** Ingest a CSV of LinkedIn jobs (Daniel's annotated tracking export — jobs that can't be API-searched) into the `jobs` store collection as canonical stage-1 records, deduped by `externalId`, preserving existing decisions.
- **Status:** built + tested + on main. Real functional module (not a stub): parses CSV, repairs mojibake, maps rows to canonical job shape, writes to the store, dedups. Body enrichment is intentionally a separate step (done by `linkedin-job-fetcher`).
- **Verified how:** unit tests only — `server/skeleton/job-ingest.test.cjs` (5 tests, all pass via `node --test`; covers parse+mojibake repair, quoted-comma fields, externalId dedup preserving `decision`, summary/urls output, and unextractable-id error reporting). Tests run against an in-memory store fixture, NOT live LinkedIn. The README's "Validated against the real 78-row export (76 ingested)" claim is UNVERIFIED from committed code — the referenced CSV `docs/jobs-2026-06-29.csv` is git-ignored (`git check-ignore` confirms) and untracked, so no committed run artifact exists.
- **Inputs and outputs:**
  - Input (function arg): `{ csv: '<content string>' }` — caller reads the file and passes the string.
  - Capabilities used (manifest `capabilities: ['store','logger','utils']`): `tools.store.listRecords('jobs')` (dedup seed) + `tools.store.putRecord('jobs', ...)`; `tools.utils.stripHtml` (snippet); `tools.logger.info` (summary). Also uses `tools.ids.mintId('job')` — `tools.ids` is always provided by `buildTools` regardless of the manifest capability list (`server/skeleton/capabilities.cjs:47`), so this is not a missing declaration. Pushes new `externalId`s to `tools._partialItems`.
  - Writes: records into the **`jobs` collection** with fields `{id, externalId ('linkedin-{id}'), source:'csv-linkedin', title, company, location, url, snippet, text_content:'' , needs_body:true, postedAt, decision, rejectReason, found_in, locFit, discoveredAt}`. Manifest `reads:[]`/`writes:[]` govern only case parts, not non-case collections (collection access is deliberately coarse-grained per `capabilities.cjs:33-40`), so writing `jobs` with empty `writes` is by-design.
  - Return value: `{ rows, added, skipped, urls:[...], errors:[...] }`. Rows with no extractable LinkedIn id are reported in `errors`, never silently dropped.
- **Runnable how:** No HTTP endpoint and no dedicated npm script. Invoked via `host.invoke('job-ingest', { csv })` from two manual runner scripts that must be run by hand from a `node` process (in-memory shared store, no server): `node server/run-enrich.cjs` (ingest → linkedin-job-fetcher enrich) and `node server/run-filter.cjs` (seed filterSet → ingest → enrich → stage2-filter). Both read the local git-ignored `docs/jobs-2026-06-29.csv` (and `run-filter` also `docs/candidate_preferences.json`) — so a real run needs those local files present. No env key required for ingest itself (env `LIMIT`/`DELAY` only affect the downstream fetcher). Does NOT require the sibling JobSearch repo or any OnlyiGaming pipeline. Tests invoke it via `runStandalone(manifest, execute, {csv}, {store})`.

### linkedin-job-fetcher

- **Purpose:** Fetches full LinkedIn job postings via LinkedIn's unauthenticated guest endpoint (`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{id}`, browser User-Agent, no login/Voyager/headless browser) and writes/updates canonical `jobs` records. LinkedIn-specific logic is confined to id-extraction + HTML parse; output is the generic canonical job shape.
- **Status:** built + tested + on main. Real working module (NOT a stub) with two modes in `execute.cjs`: **FETCH-NEW** (`{ ids?, urls?, id?, url? }`) writes new `source:'linkedin'` records deduped by `externalId`; **ENRICH** (`{ enrich:true, limit?, delayMs? }`) fills the body of existing `needs_body:true` jobs in place by the same `record.id`, writing only `text_content` + `needs_body` + `body_status`, preserving all other fields (title/company/location/`decision`/`locFit`/`found_in`). `needs_body` is a retry cursor (404 terminal→`expired`; 429→`rate_limited` retryable; error→`error` retryable; 200 but <40 chars→`thin` retryable; no extractable id→`no_id` retryable, no fetch).
- **Verified how:** unit tests only. Two test files: `server/skeleton/linkedin-job-fetcher.test.cjs` (6 tests — FETCH-NEW mode: id extraction/browser-UA, canonical parse+write, explicit 404/429 status surfacing, non-extractable-id error, non-LinkedIn-URL phantom-fetch guard, dedup preserves existing decision) and `server/skeleton/linkedin-enrich.test.cjs` (18 tests — ENRICH mode incl. in-place update, metadata/decision/Swedish-location preservation, retry-cursor semantics, limit/deferred, idempotency, partial-progress durability, and a CSV `job-ingest`→enrich integration test). All fixtures use a **fake `http`**; no live LinkedIn call in any test. Both files match the `npm test` glob `server/**/*.test.cjs`. Live validation is UNVERIFIED from code — the README claims out-of-band success on "14/15 / 15 real ids" but there is no committed run artifact or in-repo smoke script that calls the real endpoint as part of tests.
- **Inputs and outputs:**
  - **Reads (tools):** `tools.http.get` (guest endpoint fetch, `user-agent` browser header, 15s timeout); `tools.store.listRecords('jobs')` (existing externalIds for dedup / `needs_body` work set); `tools.utils` (`stripHtml`, `truncate`); `tools.ids.mintId('job')` (new record ids — `ids` is always injected by `buildTools`, not declared in the manifest); `tools.logger.info`; `tools._partialItems` (timeout-durability push). Does NOT read case parts, `llm`, `search`, `request`, or `datalayer`.
  - **Writes:** `jobs` collection via `tools.store.putRecord('jobs', …)`. FETCH-NEW writes full canonical job objects (`id, externalId:'linkedin-<id>', source:'linkedin', title, company, location, url, snippet, text_content, needs_body:false, postedAt:null, decision:'new', discoveredAt`). ENRICH re-puts the existing record with only body fields changed.
  - **Manifest `reads`/`writes`:** both declared `[]` (empty) despite the code reading and writing the `jobs` collection — see seamNotes.
- **Runnable how:** No dedicated npm script and no HTTP endpoint invokes it. Invoked programmatically via the host broker `host.invoke('linkedin-job-fetcher', …)` (host loads it from `server/submodules/` when it has both `manifest.cjs` + `execute.cjs`) or in isolation via `runStandalone(manifest, execute, input, deps)`. Two manual runner scripts drive it end-to-end against the **real** default `http` (no fake): `node server/run-enrich.cjs` (env `LIMIT`, `DELAY`) and `node server/run-filter.cjs` (env `LIMIT`, `DELAY`) — both read a **local, gitignored** LinkedIn CSV at `docs/jobs-2026-06-29.csv` (and `run-filter.cjs` also `docs/candidate_preferences.json`) and exit if the file is missing; they run `job-ingest` then this fetcher's enrich mode in one shared-in-memory-store process. No running server required (in-memory store, single process). No API key required for this module (uses only `http`/`store`/`utils`/`logger`; `ANTHROPIC_API_KEY`/`PERPLEXITY_API_KEY` are unrelated). No sibling `JobSearch` or OnlyiGaming pipeline needed — module imports nothing external (isolation enforced at host load time).

### researcher

- **Purpose:** Stage 2 (A1) submodule. Produces four research dossiers (`company`, `product`, `people`, `niche`) to "niche depth" for interview prep, then summons the `decoder` submodule through the skeleton broker. Also has a reader-drill mode that appends one targeted research paragraph to an existing dossier.
- **Status:** built + tested + on main. Not a stub — `execute.cjs` (189 lines) does real work: it calls `tools.search.grounded()` (Perplexity grounding) per front and `tools.llm.completeJSON()` (Opus synthesis) per front, runs the four fronts in parallel via `Promise.all`, writes through the store's writing-rules gate with a one-shot rephrase-and-retry on `WritingRuleError`, and brokers a `decoder` request. (Distinct from the sibling `echo-researcher` stub module, which is separate.)
- **Verified how:** unit tests only — `server/skeleton/a1.test.cjs` (5 tests, mocked `llm` + `search`, no live API calls). Tests cover: 4-dossier + brokered-decoder contract shape, reader-drill append, missing-llm-client loud-fail guard, writing-rule self-correction, and decoder-summon-failure surfacing as `ok:false`. File is at `server/skeleton/a1.test.cjs`, matched by the `npm test` glob `server/**/*.test.cjs`. Live niche-depth quality is NOT covered by `npm test` — it is a separate manual eyeball script (`server/verify-a1.cjs`, `npm run verify:a1`) that needs `ANTHROPIC_API_KEY` + `PERPLEXITY_API_KEY`. Live-validation of researcher output against real APIs is UNVERIFIED (no committed run artifact found; the verify script writes to `/tmp` only).
- **Inputs and outputs:**
  - Input object: full research `{ caseId }`, or reader drill `{ caseId, drill: { dossierKey, query } }`. Second positional arg is `options` (manifest default `{ model: 'claude-opus-4-8' }`); third is `tools`.
  - Capabilities used (declared in `manifest.cjs` `capabilities: ['store','logger','llm','search','request']`): `store` (`getCase`, `setPartStatus`, `writePart`), `logger` (`info`/`warn`/`error`), `llm` (`completeJSON`), `search` (`grounded`), `request` (brokered `tools.request('decoder', { caseId })`). Also uses `tools.ids.mintId('paragraph')`, which the host injects unconditionally regardless of declared capabilities.
  - Reads (manifest `reads`): `[]` (empty). Reads the case's `meta` (company/role/interviewers/sourceInput) via `store.getCase`.
  - Writes (manifest `writes`): `['dossiers']`. Writes the `dossiers` case part (four dossier objects, each `{ title, summary, sources, paragraphs[] }`). Drill mode also rewrites `dossiers` with an appended, marked paragraph. It does NOT write `decodedRole` itself — that part is written by the `decoder` submodule it summons.
  - Return value: research mode → `{ ok, mode:'research', fronts, decoded }`, or on decoder failure `{ ok:false, partial:true, ..., decoderError }`; drill mode → `{ ok:true, mode:'drill', appendedTo }`.
- **Runnable how:** Two paths, both invoked via the in-process skeleton host/broker (`host.invoke('researcher', input)`), not an HTTP endpoint. (1) Unit tests: `npm test` (no server, no keys, all mocked). (2) Live: `npm run verify:a1 -- "Company" "Role"` → runs `server/verify-a1.cjs` with real Opus 4.8 + Perplexity Sonar clients built from `.env`; requires `ANTHROPIC_API_KEY` and `PERPLEXITY_API_KEY` (script throws if absent) and defaults to `Curoflow` / `Head of Marketing` if no args. No running server required (script boots its own host). Does NOT depend on the sibling JobSearch or OnlyiGaming repos.

### stage2-filter

- **Purpose:** Body-level (stage-2) job filter. Applies store-backed reject-code patterns (`filterSet.stage_2[*].match`) against each job's `text_content` and tags matches with a `signal:'low'` + `matchedRules` (stage:2), never dropping/hiding jobs. Complements stage-1 (card-level) filtering done in job-discovery.

- **Status:** built+tested+on main. Real (non-stub) implementation — `execute.cjs` compiles word-boundary/case-insensitive regexes from store patterns, scans jobs, merges with stage-1 flags, is idempotent, and returns a per-code summary. Committed on main (`df86927`).

- **Verified how:** unit tests only — `server/skeleton/stage2-filter.test.cjs` (11 `node:test` cases: US_TIMEZONE flag, technical-vs-conceptual boundary, LANG_REQ/SALES_HEAVY, clean=neutral, stage-1 merge, idempotency, never-drops, body-less skip, store-backed patterns, no-filterSet no-op, per-code summary). Runs via `npm test` (`node --test "server/**/*.test.cjs"`) using in-memory `createStore()` + `runStandalone`. Live-validation UNVERIFIED — README claims "Validated live: 18 enriched bodies → 9 flagged," but the data files it would run against (`docs/candidate_preferences.json`, `docs/jobs-2026-06-29.csv`) are gitignored/uncommitted and no committed run artifact exists.

- **Inputs and outputs:**
  - Capabilities used (from `tools`): `store` (`getRecord('filterSet','active')`, `listRecords('jobs')`, `putRecord('jobs', …)`), `logger` (optional info logs). Also touches `tools._partialItems` (pushes `externalId` per processed job) when present.
  - Reads (actual): store collection `filterSet` record `active` (specifically `stage_2[*].{reason_code, match}`), and all `jobs` records' `text_content` + existing `matchedRules`.
  - Writes (actual): updates each scanned `jobs` record in place (same `id`), changing only `signal` (`'low'` if any rule matched else `'neutral'`) and `matchedRules` (preserves `stage !== 2`, replaces stage-2 set).
  - Manifest `reads: []` / `writes: []` (empty) — does NOT declare the `filterSet`/`jobs` access it performs (see seam note). Manifest `capabilities: ['store','logger']`, `options: {}`, `id: 'stage2-filter'`.
  - Input arg: `{}` (ignored — scans the store). Output: `{ ok, scanned, flagged, skipped, perCode }`.
  - Reject codes seeded in tests: US_TIMEZONE, TOO_TECHNICAL, LANG_REQ, SALES_HEAVY, SALARY_LOW (wired, no default patterns).

- **Runnable how:**
  - As a unit: `npm test` (no server, no env key, no live data — uses in-memory store).
  - End-to-end: `node server/run-filter.cjs` (invokes it as step 4 of ingest→enrich→stage2-filter via `createHost().invoke('stage2-filter', {})`). This wrapper is a manual script run (no HTTP server needed) but requires the two gitignored local files (`docs/candidate_preferences.json`, `docs/jobs-2026-06-29.csv`); env `LIMIT`/`DELAY` optional. Its enrich step (`linkedin-job-fetcher`, uses `http`) reaches live LinkedIn, so the full pipeline is not reproducible from the repo alone. stage2-filter itself needs neither the network, an env key, nor the sibling JobSearch/OnlyiGaming repos — only injected `tools` (imports nothing).

### writer

- **Purpose:** Background generator (submodule id `writer`, labeled "A2") that writes a cover letter for a case from its fit result (must-haves lead), gaps (drive the "honest bridge" paragraph), and the language-filtered datafact pool; writes a `coverLetter` case part of authored prose. (`server/submodules/writer/execute.cjs:73-130`, `manifest.cjs`)
- **Status:** Built + tested + on main. It is a real generator, not a stub: it calls `tools.llm.completeJSON` with a large verbatim cover-letter SYSTEM prompt (banned AI-speak words, 4-5 para Open/Middle/Bridge/Close ~250-320 words, ComeOn/MrGreen accuracy guardrails, use-only-datafact-facts) and has a gate-aware single retry. (`execute.cjs:16-71,94-124`)
- **Verified how:** Unit tests only — LLM is mocked (`completeJSON` returns canned JSON) in every test; no live Anthropic call, no committed run artifact. Tests: `server/skeleton/a2.test.cjs` ("writer produces a coverLetter that passes the writing gate" — asserts `result.ok`, part status `ready`, `>=4` paragraphs, `unsupported_by_cv` array; and "writer that emits a banned phrase is rejected by the gate (safety net)" — asserts the write rejects with `WritingRuleError` and part status `failed`) and `server/api.test.cjs` (the `POST /generate` path exercises writer at lines 111-144, both the ready case and the 207 per-generator-failure case). Live-data validation: **UNVERIFIED** (no smoke/verify script hits a real API for this module).
- **Inputs and outputs:** Input `{ caseId }`, plus `options.language` (default `'en'`) and `options.model` (default `claude-opus-4-8`). Reads case parts `meta`, `fit`, `gaps` (manifest `reads: ['meta','fit','gaps']`) and reads the datafact pool via `tools.datalayer.listDatafacts()` filtered to `f.language === language`. Capabilities used (manifest `capabilities: ['store','logger','llm','datalayer']`): `store` (`getCase`, `setPartStatus`, `writePart`), `datalayer` (`listDatafacts`), `llm` (`completeJSON`), `logger` (retry warning). Writes case part `coverLetter` = `{ language, paragraphs[], unsupported_by_cv[] }` (manifest `writes: ['coverLetter']`); on failure sets `coverLetter` status `failed` and re-throws. The `coverLetter` write goes through `store.writePart`, which always runs the writing-rules gate (gate lives in `server/skeleton/store/index.cjs:83`, not in this module) — a banned phrase makes the write throw `WritingRuleError`; one retry naming the violated words is attempted, else it fails loud.
- **Runnable how:** No dedicated npm script. Runs under a **running dev server** (`server/dev-server.cjs`) via `POST /api/case/:id/generate`, which loops `['cv-builder','writer']` and calls `host.invoke(id, { caseId })` (`dev-server.cjs:117-131`); the case must already have `fit` and `gaps` parts. Also invocable directly through the host broker (`host.invoke('writer', { caseId })`). A **real run needs `ANTHROPIC_API_KEY`** — the `llm` capability is backed by `server/skeleton/clients/anthropic.cjs`, which throws "ANTHROPIC_API_KEY missing" without it. Tests run without a server or key because they inject a mock `llm`. **No dependency on the sibling JobSearch/OnlyiGaming repos at runtime** — the only cross-repo reference is a source comment noting the SYSTEM prompt was ported verbatim from `JobSearch/CVs/generate-cover-letter.js`.

**Skeleton** (`server/skeleton/`).

### Skeleton core (host, broker, registry, capabilities, isolation)

All paths under `server/skeleton/`. Test runner: `npm test` = `node --test "server/**/*.test.cjs" "scripts/**/*.test.cjs"`. The 7 core files below have no `*.test.cjs` file named after them individually; they are covered by shared skeleton test files. I ran the covering tests: `skeleton.test.cjs`, `hardening.test.cjs`, `capabilities.test.cjs`, `submodule-isolation.test.cjs`, `utils.test.cjs`, `foundation-broker.test.cjs`, `a1.test.cjs` → **35 pass / 0 fail**. All tests use mocked llm/search/http; no live external API is called in any core test (live-validation UNVERIFIED for the core — see flags).

**`host.cjs`** — Purpose: the host that boots store+registry+broker, loads submodules from disk, exposes `invoke()`. Holds no domain logic. Status: tested (`skeleton.test.cjs`, `hardening.test.cjs`, `a1.test.cjs`, `foundation-store/broker`). Provides:
- `createHost({ http, llm, search, submodulesDir, limits })` → `{ store, registry, broker, loaded, invoke }`. Defaults: `submodulesDir` = `server/submodules`.
- Default capability clients read HelloLilly's own env (Rule 2): `defaultLlm()` = Anthropic client iff `ANTHROPIC_API_KEY` set else `null`; `defaultSearch()` = Perplexity client iff `PERPLEXITY_API_KEY` set else `null`; `defaultHttp()` = a fresh in-repo `fetch` wrapper (`.get(url, opts)`, `AbortController` timeout default 15000ms, returns `{status, body}`). A null client only fails if a submodule *declares* that capability (loud fail at build-tools time).
- `loadSubmodules(registry, dir)` — a folder is loadable iff it has BOTH `manifest.cjs` and `execute.cjs`; calls `assertSubmodulesIsolated(dir)` FIRST (fail-closed at boot before any registration) then `registry.register(require(manifest), require(execute))`.
- `runStandalone(manifest, execute, input, deps)` — runs one submodule with NO broker; its `dispatch` throws `standalone mode: no broker — peer requests unavailable`, proving a submodule isn't welded to the skeleton.

**`broker.cjs`** — Purpose: the single switchboard every inter-submodule call passes through; can REFUSE. Status: tested (`skeleton.test.cjs` cycle+budget, `foundation-broker.test.cjs` unknown-target, `a1.test.cjs` brokered summon). Provides `createBroker({registry, store, http, llm, search, limits})` → `{ invoke, config }`.
- `invoke(targetId, input)` is the only place a root call-context is born; returns `{ result, log }` where `log` is the full call-graph audit (events: `call`/`return`/`error`/`refused`/`log`).
- Four refusal guards, each throwing `BrokerRefusal` with `detail.kind` and logged before throw: **cycle** (target already in ancestor `chain`), **depth** (`depth > maxDepth`), **budget** (`rootState.callCount >= maxCalls`), **circuit** (per-target error count `>= maxErrorsPerTarget`). A 5th refusal: **unknown** target (not in registry) — also logged then thrown.
- `DEFAULTS = { maxDepth: 8, maxCalls: 50, maxErrorsPerTarget: 3 }`, overridable via `limits`.
- Threads `callContext = { chain, depth, caseId }` (caseId from `input.caseId` by convention) into `buildTools` per call so the store scope binds to the invoked case and the submodule cannot forge a fresh root context.

**`registry.cjs`** — Purpose: submodule registry with fail-closed manifest validation. Status: tested (`skeleton.test.cjs` "registry is fail-closed", `capabilities.test.cjs`). Provides `createRegistry()` → `{ register, get, has, list }`.
- `validateManifest(m)` throws on: non-object; missing/non-string `id`; `reads`/`writes`/`capabilities` not arrays; any capability not in `VALID_CAPABILITIES`.
- `register(manifest, execute)` additionally throws if `execute` isn't a function or the `id` is a duplicate.
- `VALID_CAPABILITIES = { http, logger, store, request, llm, search, utils, datalayer }` (8 total).

**`capabilities.cjs`** — Purpose: builds the per-invocation `tools` object — the ONLY handle a submodule ever gets. Status: tested (`capabilities.test.cjs` datalayer, `hardening.test.cjs` scope+ingest guard, `utils.test.cjs` injection). Provides `buildTools({manifest, callContext, store, http, llm, search, logSink, dispatch})`. Injects ONLY manifest-declared capabilities (least privilege). Always-present (no declaration needed): `tools._partialItems` (array) and `tools.ids` (`{ mintId, ref }`, the pure shared contract vocabulary). Enumerated capabilities:
  - **`logger`** → `tools.logger` with `.info/.warn/.error(msg)`, each stamped `from: manifest.id` and routed to `logSink`.
  - **`store`** → `tools.store` (a SCOPED, RESTRICTED view via `makeScopedStore`) AND `tools.scratch` (private per-submodule namespace = `store.scratch(manifest.id)`, methods `get/set/all`). Scoped store: `getCase`, `listCases`, `writePart`, `setPartStatus` (last two enforce that `part ∈ manifest.writes` AND, when the invocation carries a `caseId`, that the written case equals the bound case — else throws `[scope] …`), plus coarse-grained non-case collection access `putRecord/getRecord/listRecords/removeRecord`. `store.ingestDatafact` is NOT exposed (host-level only — verified by `hardening.test.cjs`).
  - **`utils`** → `tools.utils` = the shared `utils.cjs` singleton (`parseJSON/stripHtml/truncate/retry`).
  - **`http`** → `tools.http` = the injected http client (default `.get`).
  - **`llm`** → `tools.llm` = injected llm client; throws `[id] declares 'llm' but no llm client is configured` if the client is null.
  - **`search`** → `tools.search` = injected search client; throws analogously if null.
  - **`datalayer`** → `tools.datalayer` = READ-ONLY view `{ listDatafacts, getDatafact }` over imported datafacts; write (`ingestDatafact`) is deliberately absent.
  - **`request`** → `tools.request(id, input)` = `dispatch(id, input, callContext)`. The submodule passes only a string id and holds no reference to the target; `callContext` is threaded so the broker can detect cycles/cascades. This is the ONLY path from one submodule to another (the brokering rule / single chokepoint).

**`submodule-isolation.cjs`** — Purpose: the require-guard enforcing the brokering rule mechanically (Rule 1). Status: tested (`submodule-isolation.test.cjs` — scans shipped submodules + unit-tests the scanner). Provides `scanSource`, `listSubmoduleFiles`, `scanSubmodulesDir`, `assertSubmodulesIsolated`, `describe`.
- **Isolation rule as coded:** a file under `server/submodules/` may `require()` ONLY `node:` builtins, and ONLY as a string literal. Violations: `forbidden-require` (any relative/peer/skeleton path or bare module name not starting with `node:`) and `dynamic-require` (any non-literal `require(...)`). Comments are stripped before scanning so `require(` in prose isn't flagged. Scans `.cjs` and `.js` files in each submodule subdir.
- Enforced in TWO places (defense in depth): the isolation test (red CI on drift) and `assertSubmodulesIsolated` called at load time in `host.loadSubmodules` (fail-closed at boot).
- Explicit accepted limitation (in code comments): a static scan cannot stop a determined reflection-based bypass (`globalThis`, `process.mainModule`, indirectly-constructed require) — OUT OF SCOPE for the first-party threat model.

**`ids.cjs`** — Purpose: the addressing scheme (DATA_CONTRACT v0.2 §2.1). Status: no dedicated test file; exercised indirectly via `a1.test.cjs` (paragraph/decodedRequirement id prefixes asserted). Provides: `KINDS` (a fixed Set of 16 node kinds: `case, dossier, paragraph, decodedRequirement, gap, bridge, card, question, prepSection, cvSlide, liveQA, harvestItem, datafact, job`); `mintId(kind)` → `<kind>_<8-hex>` (from `randomUUID().slice(0,8)`), throws on unknown kind; `ref(kind, id, caseId?)` → typed pointer `{kind, id, caseId?}`, throws on unknown kind or missing id.

**`utils.cjs`** — Purpose: pure, side-effect-free platform helpers injected via the `utils` capability (so submodules import nothing and there's one maintained copy). Status: tested (`utils.test.cjs`, `foundation-store.test.cjs`). Provides: `parseJSON(text)` (tolerates prose/```json fences/outermost `{…}`, never throws, returns `undefined` on failure); `stripHtml(html)` (drops tags, decodes common named entities, collapses whitespace); `truncate(str, max)` (non-strings pass through); `retry(fn, opts)` (generic transient-retry with injectable `sleep`, `attempts` default 3, exponential `factor` default 2, `shouldRetry` predicate; `fn` receives the attempt index).

### Skeleton services (contract, datafacts, fill-gap, writing-rules, clients)

All paths under `server/skeleton/`. Test runner = `npm test` (`node --test "server/**/*.test.cjs" "scripts/**/*.test.cjs"`).

**`contract/case.cjs` — the case-object factory + part-status contract (DATA_CONTRACT v0.2 §2.2/§3).**
- Status: implemented. Tests: `contract/case.test.cjs` (unit, 1 test — only asserts `cvDraft`/`coverLetter` seed as absent envelopes); the envelope/status logic is exercised indirectly by store tests. Unit tests only.
- Exports `PART_STATUS`, `META_STATUS`, `PARTS`, `envelope`, `createCase`, `setPartData`, `setPartStatus`.
- `meta` is a plain object (id, company, role, round, interviewDate, interviewers, format, sourceInput, `cvVersionRef` ({kind:'datafact',id}), owner=`'self'`, status, createdAt, updatedAt). Every other top-level part is a status envelope `{ status, data, updatedAt, error? }`.
- **Part statuses (closed enum):** `absent`, `pending`, `ready`, `failed` (`error` only set on `failed`).
- **meta.status enum:** `intake`, `researching`, `analyzing`, `prep_ready`, `live`, `post`, `done` (default `intake`).
- **The enveloped PARTS (in code):** `dossiers`, `decodedRole`, `fit`, `gaps`, `cvDraft`, `coverLetter`, `prep`, `cards`, `liveLog`, `postMortem`. `createCase` initializes every part to `envelope('absent')` (data:null).
- NOT parts (per code comments): `crosslinks` (derived query, §5); the candidate data-layer / datafacts (referenced by the case via `cvVersionRef`, not enveloped in it, §2.1). No `cvStory`/`datafact`/`fit-gap` top-level part exists — the CV-authoring part is named **`cvDraft`**.

**`datafacts/ingest-cv.cjs` — pure mapper: candidate `cv_data.json` → flat tagged datafact pool.**
- Status: implemented, pure (no I/O, no LLM). Tests: `datafacts/ingest-cv.test.cjs` (unit, 3 tests). Unit tests only.
- Input: `cvDataToDatafacts(cv = {}, language = 'en')`. Output: array of `{ id: mintId('datafact'), kind:'datafact', type, text (verbatim, trimmed), tags (falsy-filtered), language }`.
- Emits datafact `type`s: `professional_summary`, `identity_positioning`, `value_proposition`, `skill`, `competency`, `job_summary`, `job_result`, `other_work`, `education`, `award`, `star_story`, `star_action`, `leadership`. Job results/summaries tagged with `company_short`; every fact carries the `language` tag (multilingual-ready). Facts are meant to be ingested via `store.ingestDatafact` (gate-exempt evidence).

**`fill-gap/bullet-judge.cjs` — host-level fill-gap: LLM decides if a user answer can become one truthful CV bullet.**
- Status: implemented (host-level; requires the skeleton, mints datafacts). Tests: `fill-gap/bullet-judge.test.cjs` (unit, 4 tests, LLM stubbed via injected fake `completeJSON`). Unit tests only; no live-LLM test — UNVERIFIED against live model.
- `judgeAnswer({requirement, gap, answer}, llm)` → calls `llm.completeJSON` with model **`claude-opus-4-8`**, maxTokens 600, returns `{ canFill, bulletText, reason }`.
- `applyAnswer(store, llm, {caseId, gapId, answer, requirementId, tags})` flow: judge → if `!canFill`/no bullet → `stays_gap` (mints nothing, honest-failure path). Guard: target requirement must exist in `fit.capability.requirements` else `stays_gap`. Authored bullet MUST pass the writing-rules `check()` (no exemption arg) → violation → `stays_gap`. On accept: mints datafact (`type:'fill-gap'`, tags `addresses:<reqId>` + `fill-gap`, language `'en'`) via `store.ingestDatafact`, flips the requirement to `status:'match'` with `evidence`+`evidenceRef`, persists via `store.writePart(caseId,'fit',...)`. Returns `{ outcome:'accepted'|'stays_gap', ... }`.

**`writing-rules/gate.cjs` — deterministic banned-phrase gate; the store's persistence chokepoint.**
- Status: implemented, pure (no LLM). Tests: `writing-rules/gate.test.cjs` (unit, 6 tests) + integration coverage in `store/index.test.cjs` (writePart gating). Unit tests only.
- Exports `check(value, exemptTexts=[])` → `{ ok, violations:[{phrase, snippet}] }`, `enforce(value, exemptTexts=[])` (throws `WritingRuleError`), `WritingRuleError`.
- **Enforces:** recursively collects EVERY string in any JSON-ish value and rejects it if it matches any `PATTERNS` regex (word-boundary `\b`, case-insensitive banned phrase). Called by `store.writePart` via `enforce` on ALL persisted part data.
- **Exempt:** a collected string is exempt ONLY if it EXACTLY (whole-string) equals a text in `exemptTexts`. No substring/`.includes` (explicitly to prevent laundering; verified by tests: a substring fragment or word-boundary mismatch like `dynamic` vs fact `dynamics` is NOT exempt). `exemptTexts` is built ref-scoped in `store.writePart` from datafact texts the data cites via `evidenceRef` — so verbatim cited real-CV evidence is allowed; freshly authored prose is not. Datafacts persisted via `ingestDatafact` bypass the gate entirely (evidence, not authored prose).

**`writing-rules/rules.cjs` — the banned-phrase list + compiled regex patterns.**
- Status: implemented. Tests: none dedicated (exercised via `gate.test.cjs`). Exports `BANNED_PHRASES` (26 entries incl. leveraged, spearheaded, cutting-edge/cutting edge, robust, passionate, excited, thrilled, resonates, synergy, dynamic, proven track record, perfect fit, hit the ground running, happy to discuss, i am confident that, i believe i would be a great fit, delve, tapestry, testament to, elevate, unlock, game-changer/game changer, in todays fast-paced / in today's fast-paced) and `PATTERNS` (`{phrase, re}`, each `\b<escaped>\b` case-insensitive). Pure pattern match, no language model.

**`clients/anthropic.cjs` — Anthropic (Claude) client, raw `fetch`, no SDK (the `llm` capability).**
- Status: implemented. Tests: NO `.test.cjs` (no unit tests found). Real-API smoke coverage exists via `scripts/smoke-a2.cjs`, which is explicitly NOT part of `npm test` (its header comment says it makes real billed Anthropic calls) — live validation is manual/on-demand, UNVERIFIED as run.
- **Env key:** `ANTHROPIC_API_KEY` (passed as `apiKey`; constructor throws if missing). **Model:** default `claude-opus-4-8` (`DEFAULT_MODEL`), per-call override allowed. API `https://api.anthropic.com/v1/messages`, header `anthropic-version: 2023-06-01`.
- `complete({system, prompt, model, maxTokens=4096})` → joined text; 3 attempts, exponential backoff (0.8s/1.6s), retries only 429/500/502/503/529, fails fast on 4xx, `AbortController` timeout (default 240000ms). `temperature` deliberately NOT sent (comment: deprecated on Opus 4.8). `completeJSON(...)` → `utils.parseJSON` with one corrective retry (temperature 0) then throws.

**`clients/perplexity.cjs` — Perplexity Sonar client, raw `fetch`, no SDK (the `search` capability).**
- Status: implemented. Tests: NO `.test.cjs` (no unit tests found). No smoke script drives it directly; `server/verify-a1.cjs` references `PERPLEXITY_API_KEY` but is a verify script, not a test. Live validation UNVERIFIED.
- **Env key:** `PERPLEXITY_API_KEY` (as `apiKey`; constructor throws if missing). **Model:** default `sonar` (`DEFAULT_MODEL`), per-call override allowed. API `https://api.perplexity.ai/chat/completions`, `Authorization: Bearer`.
- `grounded({query, system, model, maxTokens=1024})` → `{ text, citations }` (`citations` from `data.citations || data.search_results`). Single attempt (no retry loop), `AbortController` timeout default 60000ms.

**The store.**

### The store

**File:** `server/skeleton/store/index.cjs` (169 lines). Single factory `createStore()`; `module.exports = { createStore }`.

**Backing:** Four in-process JS `Map`s created inside `createStore()` (index.cjs:40-43):
- `cases` — SHARED, collaborative case objects (the produced content).
- `scratchByNs` — PRIVATE per-submodule scratch (`Map` of `ns -> Map`).
- `datafacts` — the candidate DATA-LAYER (imported facts/verbatim CV text).
- `collections` — non-case global named regions (`name -> Map(id -> record)`).

**The three regions / spaces:**
- **SHARED** = `cases`. Any submodule with the `store` capability can read/write parts of a case (subject to declared-write scoping in `capabilities.cjs`, not in the store itself).
- **PRIVATE / scratch** = `scratch(ns)` (index.cjs:96-104). Returns a `{ get, set, all }` view over a per-namespace `Map`; namespaced to `manifest.id` in `capabilities.cjs` (`tools.scratch = store.scratch(manifest.id)`). A submodule's scratch churn cannot corrupt shared tables. **Scratch is NOT detached and NOT gated** — `set`/`get` store/return the live value directly (contrast with cases/collections which detach).
- **DATA-LAYER** = `datafacts`, written only via `ingestDatafact` (host-level only; not exposed on `tools.store`, per `capabilities.cjs`).

**Collections (the non-case store):** the `collections` map is a **generic keyed store with no fixed schema** — any string name creates a new `Map` lazily on first `putRecord`/`collectionMap` (index.cjs:115-118). Records are upserted by their `id` field (`putRecord` throws if no `id`, index.cjs:119-123). API: `putRecord / getRecord / listRecords / removeRecord`. Collection names are **not enumerated or validated in code** — the header comment lists "jobs / jobSources / jobRules / filterSet / …" as examples (index.cjs:43, 107).
- Collection names **actually written in code today:** `jobs`, `jobSources`, `filterSet` (verified via grep of `putRecord('…')` call sites, e.g. `server/run-discovery.cjs:31`, `server/run-filter.cjs:26`).
- `jobRules` and `cases` appear **only in comments/enumerations**, not as any live `putRecord`/`getRecord` call. UNVERIFIED that any `jobRules` collection is ever populated.
- `filterSet` uses record id `active` (seeded as `filterSet/active` from a candidate-preferences JSON at each run start).

**Immutability contract:** `detach = structuredClone` (index.cjs:37) is applied in BOTH directions for cases and collections — reads return a copy, writes persist a copy. Callers cannot mutate persisted state except through store methods (which run the gate for authored prose). `datafacts` and `scratch` are **NOT detached** (`ingestDatafact` stores `df` directly; `getDatafact`/`listDatafacts` return live refs).

**Writing-rules gate:** only `writePart` (authored case prose) runs the gate (`enforce`, index.cjs:83-90); a violation throws (`WritingRuleError`) and nothing is written. `putRecord` (collections) and `ingestDatafact` are **exempt** — they hold imported/structured records/evidence. Ref-scoped exemption: a written case value whose text exactly equals a datafact it cites (via `{kind:'datafact', id}` ref) is gate-exempt (`collectRefdFactTexts`, index.cjs:54-64).

**PERSISTENCE REALITY — fully in-memory, nothing survives process exit:**
- The store holds state in JS `Map`s only. **No disk write, no DB, no serialization** exists inside `store/index.cjs` or in the host that instantiates it. Grep for `writeFile/readFile/sqlite/postgres/redis/Pool/new Database` inside the store found none.
- `createStore()` is called fresh per host (`server/skeleton/host.cjs:67`, `:86` `deps.store || createStore()`; also `scripts/seed-datafacts.cjs:31`). Each new host/process starts with **empty maps**. **When the process exits, all cases, scratch, datafacts, and collections are lost.** Seed scripts (e.g. `run-discovery.cjs`, `seed-datafacts.cjs`) repopulate from source files (prefs/CV JSON) at each run — persistence of *source inputs* is on disk as those files, but the store's own state is not.
- The only `fs` writes near this code are: (a) `host.cjs:50-60` — `fs.readdirSync/existsSync` to **scan submodule directories at load time** (module loading, not state), and (b) `server/verify-a1.cjs:53` — a script that dumps one processed case to `/tmp/a1-*.json` for inspection (a debug artifact, not store persistence).
- Header comment (index.cjs:25-26) states this is the interface A0 commits to; "Swapping to Hello Lilly's real DB later = reimplement these methods behind the same signatures." So a real DB is **future/UNVERIFIED**, not present.

**Tests (`npm test` = `node --test "server/**/*.test.cjs"`):** store logic is covered by **unit tests only** (no live-data validation):
- `server/skeleton/store/index.test.cjs` — 2 tests: gate runs on authored prose even when a datafact contains the banned word; ref-cited verbatim evidence is exempt.
- `server/skeleton/foundation-store.test.cjs` — 4 tests: `getCase` returns a detached copy; `writePart` persists a detached copy; mutate-then-write cannot bypass the gate; researcher-drill path does not leak a gate-violating paragraph.
- `server/skeleton/collections.test.cjs` — 8 tests: `putRecord/getRecord` round-trip, `listRecords`/unknown-collection-empty, upsert-by-id, id-required throw, `removeRecord`, boundary immutability (detach on read+write), the `job` id kind, and a `store`-capable submodule using collections via `tools.store`.
- All are in-process, no external API. Live-validation: UNVERIFIED (none applicable — store is pure in-memory).

**The API layer.**

### The API layer

**Source:** `server/dev-server.cjs` (355 lines) — a hand-rolled `node:http` server (no Express). Routing is done by matching `req.method` + `req.url` (exact-string matches for health/jobs; a single regex `^/api/case/([^/]+)(\/analyze|\/generate|\/gap\/([^/]+)\/answer)?$` for all case routes, in `createApiHandler`). Non-API requests fall through to Vite's middleware (`vite.middlewares(req, res)`) in `appType: 'spa'` middleware mode. All responses go through `sendJson()` → `content-type: application/json; charset=utf-8`, `cache-control: no-store`. `readJson()` rejects bodies > 100 KB. The dev server is booted by `npm run dev` (`package.json`: `"dev": "node server/dev-server.cjs"`), listening on `PORT` (env, default `5173`).

**Note on the sibling repo (dev-server.cjs L16–22):** `PIPELINE_MODULES_DIR` defaults to `path.resolve(__dirname, '../../OnlyiGaming/content-pipeline-modules-v2')`. The comment states the `api-search` module lives in a SIBLING repo "not present in CI" and is therefore `require()`d **lazily inside `runJobSearch`** (not at module top) so that `require('./dev-server.cjs')` from `server/api.test.cjs` does not throw `MODULE_NOT_FOUND` in a clean checkout.

| Method + path | What it does | What it returns | Invokes |
|---|---|---|---|
| `GET /api/health` | Liveness check. Matched by exact `req.url === '/api/health'` in `start()`'s server callback (NOT in `createApiHandler` — the case handler returns `false` for it). | `200 {ok:true, service:'hello-lilly-dev-server'}` | none |
| `POST /api/jobs/search` | Live job search. Reads JSON body, calls `runJobSearch(body)`. `runJobSearch` lazy-`require`s the sibling `api-search/execute.js`, cleans/caps inputs (`keywords`≤8, `excludeKeywords`≤20, `sources`≤5, `maxResults` clamped 5–50, `municipality`), filters `JOB_SEARCH_PROVIDERS` to selected `sources`, builds a `tools` object (`logger`, `progress`, `http.get` via native `fetch` with 15 s `AbortController` timeout), executes api-search, then `normalizeJob()`-maps items (adds `co`/`logo`/`match` score 64–96/`when`/`hot`/tags) and slices to 40. If no providers selected → early `{ok:true, jobs:[]}`. | `200 {ok:true, jobs[], summary, meta{keywords,sources,municipality,...}, logs[]}`; on thrown error `500 {ok:false, error}` | Sibling `OnlyiGaming/content-pipeline-modules-v2/modules/step-1-discovery/api-search/execute.js` (external repo) + `server/job-search-config.cjs` |
| `GET /api/case/:id` | Returns case parts. `host.store.getCase(caseId)`. | `200 {ok:true, case:{meta,decodedRole,fit,gaps,cvDraft,coverLetter}}`; unknown case → `404 {ok:false, error:'no such case'}` | `host.store.getCase` (skeleton) |
| `POST /api/case/:id/analyze` | Runs gap analysis. `host.invoke('gap-analyzer', {caseId, preferences})` where preferences are read from `preferencesPath` (`docs/candidate_preferences.json`; missing/unreadable → warns and analyzes without them). | `200 {ok:true, fit, gaps, summary}`; on error `500 {ok:false, error}` | skeleton submodule `gap-analyzer` via `host.invoke` |
| `POST /api/case/:id/gap/:gapId/answer` | Applies a user answer to a gap. Requires `body.answer` + `body.requirementId` (else `400`). Calls `applyAnswer(host.store, llm, {...})` using the **explicitly threaded `llm`** (comment: `host.llm` does not exist). | `200 {ok:true, ...out}` (out includes `outcome`, `newDatafactId`); missing fields → `400 {ok:false, error:'answer and requirementId are required'}`; on error `500` | `server/skeleton/fill-gap/bullet-judge.cjs` → `applyAnswer` |
| `POST /api/case/:id/generate` | Runs both generators. Loops `['cv-builder','writer']`, `host.invoke(id,{caseId})`, catching each error into `out[id+'_error']`. Reads back `cvDraft`/`coverLetter`. `ok` is true ONLY when BOTH parts `status==='ready'`. | `200` when both ready else `207` (`{ok, cvDraft, coverLetter, cvDraftStatus, coverLetterStatus, [<id>_error]}`); no such case → `404` | skeleton submodules `cv-builder` + `writer` via `host.invoke` |

**Does `npm run dev` serve each endpoint today?** Yes for all six routes as wired — the server callback in `start()` registers `/api/health` and `/api/jobs/search` inline, then delegates the four `/api/case/...` routes to `handleCaseApi` (from `createApiHandler`), then falls through to Vite. Caveats grounded in code: `/api/case/.../analyze`, `/gap/.../answer`, `/generate` all depend on a real `llm` — `start()` builds one only if `process.env.ANTHROPIC_API_KEY` is set (`createAnthropicClient`), else `llm = null`; with a null llm these LLM-backed routes are served but would fail at invoke/`applyAnswer` time (surfaced as their `500`/`207` error paths). `module.exports = { createApiHandler }` and the `require.main === module` guard mean importing the file (tests) does NOT bind a port or start Vite.

**Does `/api/jobs/search` depend on the OnlyiGaming sibling repo being present?** YES — this is the known seam. `runJobSearch` does `require(path.join(PIPELINE_MODULES_DIR, 'modules/step-1-discovery/api-search/execute.js'))` at call time. `PIPELINE_MODULES_DIR` defaults to `../../OnlyiGaming/content-pipeline-modules-v2` (overridable via env). On this machine the sibling repo and that `execute.js` DO exist (verified: `path.resolve` target exists, `execute.js` present) — but in a clean checkout without the sibling repo the FIRST `POST /api/jobs/search` throws `MODULE_NOT_FOUND`, caught by the route's try/catch → `500 {ok:false, error}`. The lazy require is deliberate so the other endpoints and the tests work without the sibling repo.

**Tested:** unit tests: `server/api.test.cjs` covers `GET /api/case/:id` (200 + 404), `POST /analyze` (writes fit+gaps), the `/api/health` fall-through (asserts the case handler returns `false`, NOT the health payload), `POST /gap/:gapId/answer` (accepted flips fit to `match`; missing-fields 400 mints nothing), and `POST /generate` (200 both-ready; 207 with `writer_error` when the writing-rules gate fails). All use a mock `llm` and mock req/res. **No test exercises `/api/jobs/search`, `runJobSearch`, `normalizeJob`, the real `api-search` module, or the health endpoint's actual 200 payload.** Live-validation of the job-search path against a real external API is UNVERIFIED (no smoke/verify script or committed run artifact found).

**Seeds and scripts.**

### Seeds and scripts

All entry points are CommonJS (`.cjs`), Node >=22, run via `node ...`. None require a separately-running server: each script boots its own in-memory host in-process (`createHost()` from `server/skeleton/host.cjs`), so the store is shared between seed and run within one process. There is **no persistent DB** — every run starts empty.

| npm script | file | what it does end-to-end | needs |
|---|---|---|---|
| `discover` | `server/run-discovery.cjs` | Reads local `docs/candidate_preferences.json` → `buildFilterSet(prefs)` → seeds `filterSet/active` into the in-memory store → invokes `job-discovery` submodule through the broker (queries jobtech / remotive / remoteok public APIs, no auth) → prints summary + up to 8 sample jobs. Exits 1 if prefs file missing. | No running server. Manual run. **Local file** `docs/candidate_preferences.json` (gitignored, untracked; present on this machine). Real outbound HTTP to public job APIs. No API key. |
| `enrich` | `server/run-enrich.cjs` | Reads local `docs/jobs-2026-06-29.csv` → invokes `job-ingest` (CSV → body-less stage-1 jobs, `needs_body:true`) → invokes `linkedin-job-fetcher` in enrich mode (`limit`, `delayMs`) to fetch each guest posting body and fill `text_content` in place → prints one before/after sample + a regex signal scan over enriched bodies. Exits 1 if CSV missing. Env: `LIMIT` (default 12), `DELAY` (default 1200ms). | No running server. Manual run. **Local file** `docs/jobs-2026-06-29.csv` (gitignored, untracked; present). Real outbound HTTP to LinkedIn guest postings (paced/limited). No API key. |
| `filter` | `server/run-filter.cjs` | Full input+filter pipeline in one process: seed `filterSet/active` from `docs/candidate_preferences.json` → `job-ingest` (CSV) → `linkedin-job-fetcher` enrich → `stage2-filter` (apply stage_2 reject codes against bodies, flag-never-hide) → prints jobs down-ranked on stage-2 grounds with reason codes. Exits 1 if either local file missing. Env: `LIMIT` (default 15), `DELAY` (default 1300ms). | No running server. Manual run. **Both local files** in `docs/` (gitignored, untracked; present). Real outbound HTTP (job APIs + LinkedIn). No API key. |
| `seed:datafacts` | `scripts/seed-datafacts.cjs` | `seedDatafacts(store)`: reads `cv_data.json`, maps via `cvDataToDatafacts()` (`server/skeleton/datafacts/ingest-cv.cjs`), ingests each fact into a store. As a CLI (`require.main`) it builds a fresh store, seeds, prints count + by-type breakdown; `--print` dumps all facts. The API host also calls `seedDatafacts()` at startup (per comment). | No running server for CLI use. Manual run. **EXTERNAL SIBLING FILE** — see seam below. No API key. |
| `verify:a1` | `server/verify-a1.cjs` | Live A1 verification. Boots host with REAL clients (Anthropic + Perplexity Sonar from env) → creates a case for `[Company] [Role]` (defaults `Curoflow` / `Head of Marketing`) → invokes `researcher` submodule → prints dossiers (company/product/people/niche), decoded role requirements; writes full case JSON to `/tmp/a1-<company>.json`. Throws if either key missing. | No running server. Manual run. **Requires `ANTHROPIC_API_KEY` + `PERPLEXITY_API_KEY`** via `node --env-file=.env`. Real Opus + Perplexity API calls (costs money / live external). |
| `test` | (runner) | `node --test "server/**/*.test.cjs" "scripts/**/*.test.cjs"`. Runs the whole suite of `.test.cjs` files. | Node >=22. No server, no keys (tests self-provision fixtures / skip when the sibling file is absent). |
| (no npm script) | `server/seed-filter-set.cjs` | Not a runnable entry point — a module exporting `buildFilterSet` (+ `splitTerms`, defaults). One-time mapper: `candidate_preferences.json` (+ two hardcoded 2026 "corrections": CMO/CPO equal weight; positive conceptual-vs-technical product scope) → the `filterSet/active` record. `require`d by run-discovery / run-filter and its own test. | N/A (library). |
| (no npm script) | `server/job-search-config.cjs` | Not a runnable entry point — a data module exporting `JOB_SEARCH_PROVIDERS` (jobtech / remoteok / remotive endpoint + field_map config), `DEFAULT_JOB_SEARCH`, `sourceLabel`. Consumed by `server/dev-server.cjs` and `server/submodules/job-discovery/execute.cjs`. | N/A (config/data). |

**`seed:datafacts` source path (KNOWN SEAM — confirmed):** `DEFAULT_JSON` is `path.resolve(__dirname, '../../JobSearch/CVs/cv-source/en/cv_data.json')`, which resolves to the literal absolute path `/Users/danieloskarsson/Library/CloudStorage/Dropbox/Projects/JobSearch/CVs/cv-source/en/cv_data.json`. This lives in an **external sibling folder** (`Projects/JobSearch/`), NOT inside this repo (`hello lily - app/`) and not in this repo's git tree. The file **currently exists** on this machine (37,707 bytes, mtime 2026-07-01). `seedDatafacts` has **no `existsSync` guard** — a missing sibling file makes `fs.readFileSync` throw `ENOENT` at runtime. The real-shape contract test in `scripts/seed-datafacts.test.cjs` explicitly `skip`s when `DEFAULT_JSON` is absent (comment: "JobSearch is a sibling tree, not in this repo's git, so it may be absent in CI").

**Tests:**
- `seed:datafacts` — unit tests: `scripts/seed-datafacts.test.cjs` (tmp-file ingest test always runs; a second test asserts >=60 real datafacts / expected types against the sibling `cv_data.json`, skipped when absent). Unit tests only.
- `seed-filter-set.cjs` — unit tests: `server/skeleton/seed-filter-set.test.cjs` (against an inline fixture, not the real personal file). Unit tests only.
- `discover` / `enrich` / `filter` / `verify:a1` — **no tests found** referencing these entry points. The underlying submodules have their own tests (`job-discovery.test.cjs`, `job-ingest.test.cjs`, `linkedin-job-fetcher.test.cjs`, `stage2-filter.test.cjs`, `a1.test.cjs`), but the runnable scripts themselves are untested.
- **Live-data validation:** `verify:a1`, `discover`, `enrich`, `filter` are the only scripts making real external API calls, but they are manual eyeball scripts (print to stdout / write `/tmp`), not automated. No committed run artifact found. Automated live-validation: UNVERIFIED.

---

## Part 2 - Frontend inventory (as coded, not as designed)

**Screens** (`src/screens/`, 12 files / 13 screen-components incl. the coach view). Classification key for actions: **WORKS** (real thing wired to real data) / **PARTIAL** (does something other than its label) / **DEAD** (visible, does nothing) / **FAKE** (looks functional but operates on fixture/mock data).

### home.jsx

**Screen:** `HomeExpanded` — the expanded "command center" home ("Hem · Allt samlat"). Route key **`home`** in `src/App.jsx` `LL_ROUTES` (`home: { c: () => <HomeExpanded />, title: 'Hem' }`), and the default route (`getRoute()` falls back to `home`).

**DATA SOURCE (mixed — one live external API, everything else hardcoded fixtures):**
- **Job list only** is live: `useLiveJobSearch()` (`src/hooks/useLiveJobSearch.js`) → `searchJobs()` (`src/api/jobSearch.js`) which calls the **JobTech / Platsbanken API DIRECTLY FROM THE BROWSER** via `fetch('https://jobsearch.api.jobtechdev.se/search?...')` (default query: keywords `lager`/`logistik`/`truck`, municipality `0180`). NOT our backend — no `/api/...` call is involved. Results are cached to **localStorage** (`hellolilly:latest-job-search`) via `saveLatestJobSearch` in `src/utils/jobStore.js`, and the hook seeds initial state from that cache on mount. `remoteok`/`remotive` providers exist in jobSearch.js but the default query only uses `jobtech`.
- **Everything else on the page is a hardcoded fixture** from `src/data/strategyData.js`: hero greeting/score (`CASE_PROFILE`, `PIPELINE_RUN`), "Gör dig starkare" quick actions (`NEXT_ACTIONS`), foundation tools (`FOUNDATION_TOOLS`), outcome metrics (`OUTCOME_METRICS`), discussions (`DISCUSSIONS`), learning cards (`LEARNING_RESOURCES`), community wins (`COMMUNITY_WINS`). Plus module-local const arrays defined inline in home.jsx: `VIDEOS`, `NEWS`. The three "Improve" cards (CV 60%, Intervjuträning 40%, Personligt brev), the community stat counters (4/3/2), the outreach mail preview, and the "helptags" counts are hardcoded literals in JSX.

**CTA / action table:**

| Action | Class | Note |
|---|---|---|
| Hero "Börja öva" (primary) | DEAD | `Button` with no `onClick`/`href`; renders a `<button>`, no handler |
| Hero "Påminn ikväll" (secondary) | DEAD | No handler |
| CoachCard message | FAKE | Static string built from `CASE_PROFILE`/`PIPELINE_RUN` fixtures |
| Quick actions list ("Gör dig starkare") | PARTIAL | Renders `<a href="#{a.id}">` (e.g. `#match`, `#cv`) — real in-app hash navigation to other routes, but the `hint` text ("Pipeline hittade 3 luckor" etc.) is fixture copy from `NEXT_ACTIONS` |
| Job section "Visa alla" (SectionHeader seeAll) | DEAD | `seeAll="Visa alla"` label rendered by SectionHeader; UNVERIFIED whether SectionHeader wires it to anything (no target passed here) |
| "Ändra sökning" term link | WORKS | `<a href="#jobbsok">` — navigates to the JobSearch route |
| Search-term chips (lager/logistik/truck + "Kommunkod 0180" + the "x" remove icons) | FAKE | Static markup; the ×-rotated plus icons are decorative, not wired to remove terms |
| "Aktiv sökning / Söker live" status | WORKS | Driven by real `jobStatus` from the live hook (`loading` → "Söker live") |
| Error line ("Live-sökningen svarade inte…") | WORKS | Shown when `jobStatus === 'error'`, prints real `jobError` |
| Job results (`JobResultsList jobs={liveJobs}`) | WORKS | Real jobs from the live JobTech fetch (empty array until the fetch resolves) |
| Feedback line count ("N jobb hittade via …") | WORKS | Uses real `jobMeta.total_found`/`jobMeta.sources`; falls back to fixture copy when meta is null |
| Thumb up / thumb down feedback buttons | DEAD | `<button>` with `aria-label` only, no `onClick` |
| Improve cards "Förbättra CV" / "Träna mer" / "Skapa brev" | DEAD | `Button`s with no `onClick`/`href`; the % bars and checklists are hardcoded literals |
| Foundation tools list | WORKS | `<a href="#{tool.id}">` real hash navigation; subtitle text is `FOUNDATION_TOOLS` fixture copy |
| Trio "Forum/Alla/Mer/seeall" links | DEAD | `<a href="#">` — anchors to top, no destination |
| Video cards + play overlay | FAKE | `VIDEOS` fixture; play button is decorative, no handler |
| Learn cards | FAKE | `LEARNING_RESOURCES` fixture; whole card, no click handler |
| Outreach "Skriv med Sara" / "Se fler exempel" | DEAD | `Button`s, no handler; mail preview is hardcoded literal text |
| Community wins / stats / helptags | FAKE | `COMMUNITY_WINS` fixture + hardcoded counters; helptags are static `<span>` (not links) |

**Design system status:** Bespoke/legacy markup. There is **no `PageTemplate`/`ContentArea`/`ContentBox`** design-system template in this repo (grep of `primitives.jsx` + `shell.jsx` returns none). The screen composes the shell manually: `<div className="ll app">` → `<Sidebar active="home" />` + `<div className="main">` → `<Topbar />` + `<div className="content content--narrow home2">`, then hand-written `<section>`/`className`'d divs. It does reuse leaf primitives (`Icon`, `Button`, `Avatar`, `Photo`, `Tag`, `Clover`, `SectionHeader`) and shell components (`Sidebar`, `Topbar`, `CoachCard`, `JobResultsList`), but there is no page-level layout template — every section is bespoke JSX with inline styles.

**i18n:** No translation function. All UI strings are **hardcoded Swedish literals** inline in JSX (and in the `strategyData.js` fixtures). No `t()`/i18n import anywhere in the file.

**Tested:** No tests found. `npm test` globs only `server/**/*.test.cjs` and `scripts/**/*.test.cjs`, structurally excluding all `src/**` frontend files. No `.test.cjs` references `home.jsx`/`HomeExpanded`, nor the data path (`searchJobs`, `normalizeJobQuery`, `saveLatestJobSearch`, `useLiveJobSearch`, `strategyData`). Live-validation of the JobTech browser fetch: UNVERIFIED (no smoke/verify script found that exercises it).

### cvActivity.jsx

**File:** `src/screens/cvActivity.jsx` — TWO screen components exported from one file: `CVBuilder` and `ActivityTracker` (plus helpers `ToolHeader`, `WeekRing`).

**Screen names + route keys** (from `src/App.jsx` `LL_ROUTES`, lines 21/24):
- `CVBuilder` → route key **`cv`**, title "CV-byggaren"
- `ActivityTracker` → route key **`activity`**, title "Min aktivitet"

**DATA SOURCE — hardcoded fixture only.** Both components read exclusively from `src/data/strategyData.js` (imported line 4: `CASE_PROFILE, CASE_RECORD, PIPELINE_RUN`). No backend API, no external API, no localStorage, no `fetch`. Grep for `fetch|localStorage|jobStore|jobSearch|useLiveJobSearch|/api/` in the file returned nothing.
- `CVBuilder` uses `PIPELINE_RUN.company` (renders "PostNord") and `CASE_PROFILE.person` ("Amir Hassan"). All CV content (`CV_TEMPLATES`, `CV_SECTIONS`, the entire live-preview CV paper) is **hardcoded literally inside cvActivity.jsx itself** — including a hardcoded email `amir.hassan@mail.se` and phone, which are not from the fixture.
- `ActivityTracker` uses `CASE_RECORD.timeline` (aliased to `ACTIVITY`, line 252), plus `CASE_RECORD.activityCount / activeDays / nextStep / coachNote`.
- `CVBuilder` holds one piece of real local state: `uploadedTemplates` via `React.useState` (lines 45–55). File-picker upload populates an in-memory list (name/size/id) capped at 6; it is **not** persisted or sent anywhere.

**CTA / action table:**

| Action | Classification | Note |
|---|---|---|
| ToolHeader back button "Tillbaka" (both screens) | DEAD | `<button>` with no onClick handler |
| CVBuilder "Ladda upp mall" file input | PARTIAL | Real `onChange` handler reads picked files into local `uploadedTemplates` state and renders cards; no upload/persist/parse — purely in-memory display |
| CVBuilder "Ladda ner PDF" (ghost Button) | DEAD | No onClick; Button renders label only |
| CVBuilder "Spara" (primary Button) | DEAD | No onClick (header claims "spara automatiskt" but nothing saves) |
| CVBuilder template cards (CV_TEMPLATES) | DEAD | `<button type="button">` with no onClick; render fixture array |
| CVBuilder uploaded-template cards | FAKE | Show "Redo att mappas mot HelloLillys CV-sektioner" — no mapping logic exists |
| CVBuilder composer input / mic / send buttons | DEAD | No handlers; chat feed above is hardcoded static markup, not interactive |
| CVBuilder quick-reply Chips ("Jag scannade paket" etc.) | DEAD | No onClick |
| CVBuilder CV-preview "Sara skriver klart den här raden" + VoiceWave | FAKE | Static text + decorative CSS-height bars; no generation |
| ActivityTracker "Dela med Sara" (Button) | DEAD | No onClick |
| ActivityTracker "Exportera rapport" (Button) | DEAD | No onClick |
| ActivityTracker "Hämta som PDF" (Button) | DEAD | No onClick |
| ActivityTracker filter Chips (Allt/Ansökningar/Intervjuer/Möten/Kurser) | DEAD | No onClick; "Allt" has `on` prop but is not stateful — timeline is never filtered |
| ActivityTracker timeline items + "Loggades automatiskt" badges | FAKE | Rendered from `CASE_RECORD.timeline` fixture; `a.auto` flag drives a static badge; nothing is actually logged |
| ActivityTracker WeekRing (72%) + "vecka i siffror" | FAKE | `pct={72}` hardcoded in JSX; center number is `CASE_RECORD.activityCount` fixture |

**Design system status:** **Bespoke/legacy markup.** No design-system page templates used — `primitives.jsx` and `shell.jsx` export no `PageTemplate`/`ContentArea`/`ContentBox`. Both screens hand-roll the layout: `<div className="ll app">` → `<Sidebar>` + `<div className="main">` + a **locally-defined** `ToolHeader` (lines 9–21). Note: `shell.jsx` exports a `Topbar` component, but this file defines its own `ToolHeader` instead of using it. It does consume shared primitives (`Icon, Clover, Avatar, Photo, Chip, Button, Sidebar`, etc.) and relies on CSS classes/`var(--ll-*)` tokens.

**i18n:** **All strings hardcoded** (Swedish). No translation function; no `t(`/`i18n`/`useTranslation` call anywhere in the file. UI labels, chat bubbles, section bodies, and CV content are string literals.

**Tests:** no tests found. No `*.test.cjs` references `cvActivity`, `CVBuilder`, or `ActivityTracker`. Live-validation: N/A (frontend screen, no external calls to validate). UNVERIFIED that it renders — no test or run artifact confirms mount.

### coverLetter.jsx

**Screen name:** Personligt brev (Cover Letter Builder) · exports `CoverLetter`
**Route key:** `letter` in `src/App.jsx` `LL_ROUTES` (`letter: { c: () => <CoverLetter />, title: 'Personligt brev' }`, App.jsx:22)

**DATA SOURCE:** Hardcoded fixture only. Imports `CASE_PROFILE` and `PIPELINE_RUN` from `src/data/strategyData.js` (a static object literal, no I/O). No backend API call, no external API, no localStorage, no hook. The whole screen is a static render of fixture strings — grep for cover/letter references in `src/api/`, `src/utils/`, `src/hooks/` returns nothing. Displayed values that come from the fixture: `PIPELINE_RUN.company` ("PostNord"), `PIPELINE_RUN.role` ("Lagermedarbetare"), `PIPELINE_RUN.coverLetterPlan` (3 chips), `CASE_PROFILE.person` ("Amir Hassan"). The letter body itself (paragraphs, contact line `amir.hassan@mail.se` / `070-123 45 67` / Västerås, "Hej!", the green bridge paragraph, signature) is hardcoded JSX literal text in the component — NOT sourced from any data object.

**CTA / action table:**

| Button / action | Classification | Note |
|---|---|---|
| "Ladda ner PDF" (ghost, download icon) | DEAD | No `onClick`; renders a `<Button>` with no handler |
| "Spara" (primary, check icon) | DEAD | No `onClick`; no save logic anywhere |
| Intake text `<input placeholder="Skriv ditt svar…">` | DEAD | Uncontrolled input, no state/onChange/onSubmit |
| Mic button (`aria-label="Spela in röst"`) | DEAD | No handler; decorative |
| Send button (`aria-label="Skicka"`) | DEAD | No handler; decorative |
| Quick-reply chips ("Låter bra, fortsätt" / "Säg det mjukare" / "Hoppa över") | DEAD | `<Chip>` elements, no handler |
| `coverLetterPlan` chips (mapped, `on={i===1}`) | FAKE | Render 3 fixture strings from `PIPELINE_RUN.coverLetterPlan`; look like selectable plan steps but are static, non-interactive |
| "Be coacher läsa" (`<a href="#review">`) | PARTIAL | Plain hash anchor to `#review`; navigates via URL hash, not wired to the app's `LL_ROUTES` router or any coach-review flow |

Note: the conversation feed (bot/user message bubbles, "50% klart", "Fråga 3 av 5") is entirely hardcoded JSX — a scripted mock transcript, not a live chat.

**Design system status:** Bespoke/legacy markup. Does NOT use PageTemplate/ContentArea/ContentBox (those primitives do not exist — `primitives.jsx` exports Icon, Avatar, Tag, Chip, Button, SectionHeader, etc.; `shell.jsx` exports Sidebar, Topbar, etc.). Uses shared primitives (`Icon`, `Avatar`, `Tag`, `Chip`, `Button`, `SectionHeader`), `Sidebar` from shell, and `ToolHeader` (imported from `./cvActivity.jsx`, a `topbar`-based header). Layout is hand-rolled `<div className="ll app">` / `main` / `toolsplit` with many inline `style={{…}}` objects and raw class strings (`intake`, `cvframe`, `cvpaper`, `msg`, etc.).

**i18n:** All strings hardcoded Swedish inline in JSX. No translation function, no i18n import, no message keys.

### interview.jsx

**Screen:** Intervjuträning (Interview Trainer) — export `InterviewTrainer`. Route key `interview` in `src/App.jsx` LL_ROUTES (`interview: { c: () => <InterviewTrainer />, title: 'Intervjuträning' }`).

**DATA SOURCE:** Hardcoded fixtures only. Imports `PIPELINE_RUN` from `src/data/strategyData.js` (a hardcoded object: `company:'PostNord'`, `role:'Lagermedarbetare'`, etc.) and uses `PIPELINE_RUN.company` / `PIPELINE_RUN.role` for labels. Two further arrays are inline-hardcoded in the file itself: `QSET` (5 interview questions) and the `RecWave` bar heights. No backend fetch, no external API, no localStorage, no `jobStore`/`jobSearch`/`useLiveJobSearch` import (grep for `fetch(|/api/|jobSearch|jobStore|useLiveJobSearch|axios` returns zero matches). The only live state is `jobText` — a `React.useState` seeded with a hardcoded PostNord job-ad string, editable in the textarea; `hasJob` derives from its length (>40 chars).

**CTA / action table:**

| Button / action | Classification | Note |
|---|---|---|
| Job-description `<textarea>` (value/onChange) | WORKS | Only functional control; local `useState`, drives `hasJob` hint text. Text is never sent anywhere. |
| "Allmän träning" / "{company}" mode tabs (`.seg` role=tablist) | DEAD | Two `<button>`s, no `onClick`; second hardcoded `className="on"`. |
| "Ladda upp PDF/DOCX" file input (`<input type="file">`) | DEAD | No `onChange`/handler; selected file is discarded. |
| "Skapa intervjufrågor" (`Button` primary, icon sparkle) | DEAD | No `onClick`; QSET questions are static hardcoded, not generated. |
| Record button (`.recbtn--live`, stop-square SVG) | FAKE | Styled as actively recording with `RecWave` animation + `00:24` timer, but no handler and no audio/media API — pure visual. |
| `RecWave` + `stage__timer 00:24` | FAKE | Static hardcoded waveform bars and timer string. |
| Feedback cards (Leverans/Innehåll scores, bars) | FAKE | Hardcoded percentages/labels ("Bra!", "82%", "Lugnt") presented as analysis of a prior answer; no data behind them. |
| Question rail (`QSET.map`) | FAKE | Renders hardcoded 5-question array with fixed `done/now/todo` states; no progression logic. |
| "Dela en inspelning med Sara" (`Button` secondary, icon share) | DEAD | No `onClick`. |

**Design system status:** Bespoke/legacy markup. Does NOT use PageTemplate/ContentArea/ContentBox. Layout is hand-rolled `<div className="ll app app--lively">` → `<Sidebar active="interview" />` + `.main` + `ToolHeader` (imported from `./cvActivity.jsx`), with raw `div.card`/`div.content`/`div.stage`/`div.fbgrid` classes and heavy inline `style={{...}}`. It does consume shared primitives (`Icon`, `Clover`, `Avatar`, `Tag`, `Button`, `SectionHeader` from `components/primitives.jsx`; `Sidebar` from `components/shell.jsx`) but not the page-template wrappers.

**i18n:** Hardcoded. All Swedish UI strings are literals in JSX (e.g. "Lägg in jobbannonsen först", "Skapa intervjufrågor", "Privat & tryggt — ingen lyssnar live"). No translation function / i18n import.

**Tests:** No tests found. No `*.test.cjs` references `interview` or `InterviewTrainer`; no matching test under `server/skeleton/`.

### library.jsx

**Screen:** `SharedLibrary` (titled "Bibliotek" / knowledge-hub library) · **Route key:** `library` in `src/App.jsx` LL_ROUTES (`library: { c: () => <SharedLibrary />, title: 'Bibliotek' }`, App.jsx:25).

**DATA SOURCE:** Hardcoded fixture only. Imports `KNOWLEDGE_RESOURCES` and `FOUNDATION_TOOLS` from `src/data/strategyData.js` (both are static in-file arrays; `KNOWLEDGE_RESOURCES` is 6 hand-written objects at strategyData.js:90-97). No backend `/api/...` fetch, no external API, no `localStorage`, no `useLiveJobSearch`/`jobStore`/`jobSearch` — grep for all of these in the file returned zero hits. The library grid renders `LIB.map(...)` where `LIB = KNOWLEDGE_RESOURCES`. The hero counter "320+ delade resurser" is a hardcoded string literal (line 52); the "N resurser" filter count is real (`LIB.length`, = 6).

**CTA / action table:**

| Button / action | Classification | Note |
|---|---|---|
| "Bidra med ditt" (primary, header) | DEAD | No `onClick`; renders label only (line 41). |
| "Använd" per card (secondary "+") | DEAD | No `onClick`; one per fixture card (line 27). |
| Type filter chips: Alla / Mallar / Prompts / Tips / Guider | DEAD | Static `<Chip>` elements; "Alla" hardcoded `on`, no click handler, no filtering state (line 61). |
| Mål filter chips (`FOUNDATION_TOOLS.map`) | DEAD | Rendered from fixture, no `onClick`/filter wiring (line 66). |
| Card thumbs/uses count (`item.uses`) | FAKE | Displays hardcoded fixture strings ("842", "1,2k", etc.), not a real metric (line 26). |

No button in this screen has any handler, state, or data mutation — the whole screen is static presentation over a fixture.

**Design system status:** Bespoke/legacy markup. Does NOT use the design-system page templates. The templates `PageTemplate`/`ContentArea`/`ContentBox` exist in `src/components/grid.jsx` (lines 116-135) but are not imported here. library.jsx builds its own layout with raw `<div className="ll app app--lively">` → `<Sidebar>` + `<div className="main">` + `<ToolHeader>` (imported from `./cvActivity.jsx`) + `<div className="content content--narrow">` and inline `style={{...}}` objects throughout. It does reuse shared *primitives* (`Icon`, `Clover`, `Avatar`, `Photo`, `Tag`, `Chip`, `Button` from primitives.jsx; `Sidebar` from shell.jsx). Note: `Topbar` (shell.jsx) and `SectionHeader` (primitives.jsx) are imported but unused.

**i18n:** All strings hardcoded in Swedish inline (e.g. "Bibliotek", "Kunskapshubb med coach-approved material", "Bidra med ditt", "Använd", "resurser"). No translation function / i18n layer — no `t(...)`, no lookup.

**Tests:** No tests found — no `*.test.cjs` references `library`, `SharedLibrary`, `LibCard`, or `KNOWLEDGE_RESOURCES`. Live-validation: N/A (no external calls). UNVERIFIED that this screen is exercised by any test.

### review.jsx

**Screen name:** `MultiCoachReview` (exported from `src/screens/review.jsx`; also exports helper `ReviewComment`)
**Route key:** `review` — registered in `src/App.jsx` LL_ROUTES (line 26): `review: { c: () => <MultiCoachReview />, title: 'Granskning' }`.

**DATA SOURCE (critical):** **Hardcoded fixture, in-file — NO external/backend/localStorage source of any kind.**
- All three coach comments come from a module-level `const COMMENTS = [...]` array literal at the top of the file (lines 8–12): hardcoded names (Sara Lind / Marcus Tylén / Amira Khan), roles, relative-time strings (`'för 2 tim'`, `'igår'`), comment bodies, and reaction counts.
- The reviewed "personligt brev" document is hardcoded JSX prose in the render (lines 59–66): candidate "Amir Hassan", role "Lagermedarbetare, PostNord", and four paragraphs of Swedish letter text written inline.
- Imports are UI-only: `primitives.jsx` (Icon, Clover, Avatar, AvatarStack, Tag, Button, SectionHeader), `shell.jsx` (Sidebar), and `cvActivity.jsx` (ToolHeader). **No import from `src/api/jobSearch.js`, `src/data/strategyData.js`, `src/utils/jobStore.js`, `src/hooks/useLiveJobSearch.js`, no `fetch`, no `/api/` call, no `localStorage`** (verified by grep — zero matches).
- No React state, no props, no effects — the component is a pure static render of the fixture.

**CTA / action table:**

| Button/action | Classification | Note |
|---|---|---|
| "Ladda ner" (download, header) | DEAD | `<Button variant="secondary" icon="download">` — no `onClick`; nothing to download (letter is inline JSX). |
| "Klar att skicka" (check, header) | DEAD | `<Button variant="primary" icon="check">` — no `onClick`, no send/state logic. |
| "Håller med · {react}" (heart, per comment) | FAKE | Renders per-comment count from the hardcoded `COMMENTS` fixture; `<button className="reactbtn">` has no handler — count is static, click does nothing. |
| "Svara" (reply, per comment) | DEAD | `<button className="reactbtn">` — no `onClick`. |
| Reply text `<input>` ("Skriv tillbaka till ditt team") | DEAD | Uncontrolled input, no `value`/`onChange`/state; typed text is not captured or stored. |
| "Skicka" (send reply) | DEAD | `<Button variant="primary" icon="send">` — no `onClick`; does not read the input or post anywhere. |
| Sidebar (`<Sidebar active="letter" />`) | UNVERIFIED (out of area) | Navigation lives in `shell.jsx`; not assessed here. |

Net: every interactive control on this screen is DEAD except the reaction counts, which are FAKE (real-looking numbers sourced from a fixture, no behavior).

**Design system status:** **Bespoke / legacy markup.** Does NOT use the design-system templates `PageTemplate`/`ContentArea`/`ContentBox` (those exist in `src/components/grid.jsx` but are not imported here). Instead builds its own layout: `<div className="ll app app--lively">` → `Sidebar` + `<div className="main">` → `ToolHeader` (borrowed from `cvActivity.jsx`) + hand-rolled `content` / `card` / `review` / `revdoc` / `revcol` / `cmt` divs, with many inline `style={{...}}` objects. Uses shared primitives (Avatar, AvatarStack, Clover, Icon, Button) but not the grid template shell.

**i18n:** **All strings hardcoded (Swedish), no translation function.** No `useTranslation`/`i18n`/`t()` anywhere in `src/` (verified by grep — zero matches). Labels, comment bodies, document prose, header text, and placeholders are literal Swedish strings in the JSX.

### studio.jsx

**Screen name:** Bildstudio (exports `ImageStudio`, plus helper `StudioResult`)
**Route key:** `studio` (`src/App.jsx:27` — `studio: { c: () => <ImageStudio />, title: 'Bildstudio' }`)

**DATA SOURCE:** Hardcoded fixtures defined inline in the file — `TEMPLATES` (4 template objects, `studio.jsx:8-13`) and `SUGGEST` (4 suggestion strings, `studio.jsx:15`). No backend API call, no external API, no localStorage, no hooks. Imports are only presentational: `primitives.jsx`, `shell.jsx` (Sidebar), and `ToolHeader` from `cvActivity.jsx` (`studio.jsx:1-4`). No image-generation call of any kind exists; the four result images are static `<Photo>` glyphs (`studio.jsx:71-74`).

**CTA / action table:**

| Button / action | Classification | Note |
|---|---|---|
| Template tiles (×4, `studio.jsx:44-49`) | DEAD | `<button>` with no `onClick`; one is pre-styled `on:true` (`studio.jsx:9`) but selection isn't wired. |
| Prompt textarea (`studio.jsx:56`) | DEAD | Uncontrolled `defaultValue` only; no state/handler. |
| Suggestion chips (×4, `studio.jsx:60`) | DEAD | `<Chip>` renders text; no click handler passed. |
| "Skapa 4 bilder" (`studio.jsx:62`) | DEAD | `<Button>` with no `onClick`; does not generate anything. |
| Per-result "Spara som favorit" / heart (`studio.jsx:22`) | DEAD | `<button>` with `aria-label`, no `onClick`. |
| Per-result "Gör om" / refresh (`studio.jsx:23`) | DEAD | `<button>` with `aria-label`, no `onClick`. |
| Per-result "Använd bild" / check (`studio.jsx:24`) | DEAD | `<button>` with `aria-label`, no `onClick`. |

All controls are static markup with no event handlers; the whole screen is a non-interactive mockup.

**Design system status:** Partial / shared-component but bespoke layout. Uses shared components `Sidebar` (`shell.jsx`), `ToolHeader` (`cvActivity.jsx`), and `SectionHeader`, `Photo`, `Icon`, `Clover`, `Chip`, `Button` (`primitives.jsx`). It does NOT use `PageTemplate`/`ContentArea`/`ContentBox` — those names do not exist in `primitives.jsx` (exports confirmed at `primitives.jsx:178`). Page scaffolding is hand-rolled `<div className="ll app...">` / `<div className="main">` / `<div className="content content--narrow">` with inline styles.

**i18n:** All strings hardcoded in Swedish (e.g. "Bildstudio", "Välj en mall att börja från", "Skapa 4 bilder", `studio.jsx:36,42,62`). No translation function used.

**Tests:** No tests found — no `*.test.cjs` references `studio`, `ImageStudio`, or `StudioResult`. Live-validation: N/A (no external calls). UNVERIFIED that any test exercises this screen.

### coach.jsx

**Screen:** CoachWorkspace ("Coachvy") — the coach-facing workspace.
**Route key:** `coach` in `src/App.jsx` `LL_ROUTES` (`coach: { c: () => <CoachWorkspace />, title: 'Coachvy' }`), reached via URL hash `#coach`.

**DATA SOURCE:** 100% hardcoded fixtures. No backend, no external API, no localStorage. Two sources:
- Imports `CASE_PROFILE`, `CASE_RECORD`, `PIPELINE_RUN`, `OUTCOME_METRICS` from `src/data/strategyData.js` — a pure fixture module (only exported object/array literals; contains no `import`, no `fetch`, no network I/O — verified by reading the whole file).
- Module-local constant arrays defined inline in `coach.jsx`: `CYCLE`, `COACH_NAV_GROUPS`, `PARTICIPANTS`, `RESOURCES`.
- Does NOT import `src/api/jobSearch.js`, `src/utils/jobStore.js`, or `src/hooks/useLiveJobSearch.js`. No `fetch`/`/api/` call anywhere in the file. All numbers in the header stats (6 active participants, `PIPELINE_RUN.score` 78%, `PIPELINE_RUN.improvedScore` 92%) are fixture literals.

**CTA / action table:**

| Action | Classification | Note |
|---|---|---|
| Sidebar logo → `#coach` | WORKS | Anchor to own route hash |
| Sidebar group headers (Översikt, Deltagare, Ärenden…) expand/collapse | WORKS | Real `useState`/`toggle` accordion; local UI state only |
| Sidebar sub-nav links (all `#c-*` items, e.g. Ärendevy, CV-granskning) | PARTIAL | Real `<a href="#c-...">` hash links, but these route keys are not in `LL_ROUTES` (only `coach` is) — App.jsx renders a fallback/ComingSoon, not a distinct screen |
| "Till deltagarvyn" → `#home` | WORKS | Anchor to jobseeker home route |
| Sidebar "Starta coaching" (`#coach` / Button) | DEAD | Anchor re-points to current route / Button has no `onClick` |
| Topbar search field | DEAD | Static `<div>` with placeholder text, not an `<input>`; no handler |
| Topbar bell / settings `iconbtn` | DEAD | No `onClick` |
| "Öppna full ärendevy" (SectionHeader seeAll) | DEAD | SectionHeader renders label; no navigation wired here |
| Case-record metrics / gaps display | FAKE | Renders `CASE_PROFILE`/`CASE_RECORD`/`OUTCOME_METRICS`/`PIPELINE_RUN.gaps` from fixture — looks live, is static |
| "Starta ny coachingcykel" / "Öppna mallar" (Button) | DEAD | No `onClick` |
| Per-participant "Skriv" / "Öppna" (Button ×5 rows) | FAKE/DEAD | Rendered per fixture `PARTICIPANTS` row; Buttons have no `onClick` |
| Resource filter chips (Allt, Presentationer, Mallar, Guider, Seminarier) | DEAD | `Chip` with static `on` prop; no state/handler |
| "Ladda upp" (Button) | DEAD | No `onClick` |
| Per-file "Dela" / "Öppna" `miniicon` (×6) | DEAD | Rendered per fixture `RESOURCES`; no handler |

**Design system status:** Bespoke/legacy markup. Imports only low-level pieces from `components/primitives.jsx` (Icon, Clover, Logo, Avatar, AvatarStack, Photo, Tag, Chip, Button, Rating, SectionHeader). No `PageTemplate`/`ContentArea`/`ContentBox` template exists (primitives.jsx has no such export; shell.jsx exports jobseeker blocks like Sidebar/Topbar/Stats but no generic template). coach.jsx defines its own `CoachSidebar`, `CoachTopbar`, `CoachWorkspace`, and `CoachingCycle` (inline SVG) using raw `<div className="...">` with hardcoded CSS class strings and inline `style={{}}` objects throughout. Does not reuse shell.jsx's `Sidebar`/`Topbar` — it duplicates that pattern.

**i18n:** No translation function. All UI strings are hardcoded Swedish literals in JSX and in the local fixture arrays (e.g. "God morgon, Sara", "Coachingprocessen", "Mina deltagare", "Material & mallar"). No `t(...)`/i18n import anywhere in the file.

### match.jsx

- **Screen name / route key:** `JobMatchReview` — route key `match` in `src/App.jsx` (`LL_ROUTES.match = { c: () => <JobMatchReview />, title: 'Matchanalys' }`, App.jsx:30; imported App.jsx:12). Hash route `#match`.
- **DATA SOURCE (critical):** **localStorage only.** Reads accepted jobs via `getAcceptedJobs()` from `src/utils/jobStore.js` (match.jsx:5,11), which reads `window.localStorage['hellolilly:accepted-jobs']` (jobStore.js:96-98, key defined jobStore.js:5). No backend `/api/...` fetch, no external API call, no hardcoded fixture, no `useLiveJobSearch` hook in this screen. The list is populated elsewhere (Jobbsök) calling `acceptJob()`; this screen only reads/removes. Re-reads on `ll:jobs:changed` and `storage` window events (match.jsx:13-21). Empty by default until the user accepts a job in Jobbsök.
- **CTA / action table:**

| Action | Classification | Note |
|---|---|---|
| "Till Jobbsök" link (header, `href="#jobbsok"`) | WORKS | Hash nav to the Jobbsök screen. |
| "Sök jobb" link (empty-state, `href="#jobbsok"`) | WORKS | Hash nav to Jobbsök; shown only when 0 accepted jobs. |
| "Analysera" button (per job) | FAKE | Dispatches `ll:helpful:open` with `{kind:'job-analysis', job}` (match.jsx:23-25). Handled by `helpfulLayover.jsx` → `JobAnalysisContent`, which plays a timed step animation (setTimeout, helpfulLayover.jsx:286-288) then renders `MatchAnalysisContent` using a **hardcoded `MATCH_DETAILS` fixture** (PostNord/Truckkort/WMS content, helpfulLayover.jsx:313-328) — the real `job` only supplies title + `job.match` score; no real analysis runs. |
| "Ta bort" button (per job) | WORKS | Calls `removeAcceptedJob(job)` (jobStore.js:107-110) then re-reads state; genuinely removes the job from localStorage. |
| "Original" link (per job, when `job.url` set) | WORKS | Opens `job.url` in a new tab (`target="_blank" rel="noreferrer"`). |

- **Displayed data caveat:** The per-job match badge shows `{job.match || 76}%` (match.jsx:76) — falls back to a hardcoded 76% when the stored job has no match value; `compactJob` also defaults `match` to 76 (jobStore.js:42). Match percentage is not computed here.
- **Design system status:** **Bespoke/legacy markup.** Uses raw CSS-class divs (`ll app`, `main`, `content content--narrow`, `card card--pad`, `match-queue-hero`, `accepted-job`, etc.), not `PageTemplate`/`ContentArea`/`ContentBox` shell templates. It does use design-system atoms: `Icon`, `Clover`, `Button`, `Tag`, `SectionHeader` from `components/primitives.jsx`, `Sidebar` from `components/shell.jsx`, and `ToolHeader` imported from `./cvActivity.jsx`.
- **i18n:** **Hardcoded strings** (Swedish), inline in JSX — no translation function / i18n wrapper. E.g. "Analysera de jobb du valt att gå vidare med", "Inga jobb redo för analys än", "Sök jobb".
- **Tests:** no tests found. No `.test.cjs` references `JobMatchReview`, `screens/match`, `getAcceptedJobs`, or `removeAcceptedJob` (searched `server/` and `scripts/`; `src/screens/*.test.cjs` absent). Live-validation UNVERIFIED (no data-fetch to validate).

### calendar.jsx

**Screen name / route key:** "Kalender" — route key `calendar` in `src/App.jsx` LL_ROUTES (`calendar: { c: () => <CalendarView />, title: 'Kalender' }`, App.jsx:31). Exports `CalendarView`.

**DATA SOURCE:** Hardcoded fixtures defined inline at the top of the file — NOTHING external. Three module-level `const` arrays: `EVENTS` (8 calendar events, calendar.jsx:17-26), `UPCOMING` (5 upcoming-event rows, :29-35), plus `DAYS` (:10-13) and `HOURS` (:14). Coach availability slots ("Idag · 16:00", etc.) are literal JSX text (:128-130). No imports from `api/jobSearch.js`, `data/strategyData.js`, `utils/jobStore.js`, no hooks, no `fetch`/`axios`, no backend `/api/...` call. Imports are UI-only: `primitives.jsx` (Icon, Avatar, Tag, Button, SectionHeader), `shell.jsx` (Sidebar, Topbar), `cvActivity.jsx` (ToolHeader). The whole week is a static picture; the "today = torsdag 11 juni 2026" and week range "8 – 14 juni 2026" are hardcoded strings (:55-56).

**CTA / action table:**

| Button / action | Classification | Note |
|---|---|---|
| "Lägg till händelse" (header, :43) | DEAD | No onClick handler; renders only |
| "Boka med Sara" (header, :44) | DEAD | No onClick handler |
| Förra veckan / Nästa vecka chevrons (:52-53) | DEAD | `<button>` with aria-label, no handler; week is fixed to 8–14 juni 2026 |
| "Vecka" / "Månad" segment toggle (:58-59) | DEAD | Static; "Vecka" hardcoded active (`className="on"`), no state/handler |
| Event blocks in grid (:85-91) | DEAD | Non-interactive `<div>`s rendered from `EVENTS` fixture |
| "Kommande" upcoming rows (:98-106) | DEAD | Non-interactive `<div>`s from `UPCOMING` fixture |
| "Välj" x3 (coach availability slots, :128-130) | DEAD | `<button>` elements, no onClick |

All actions are DEAD (visible, no wiring). None are FAKE (none appear to submit/mutate anything), none PARTIAL. The screen has no React state, no event handlers of any kind.

**Design system status:** Bespoke/legacy markup. Uses shell primitives `Sidebar` (`shell.jsx`) and `ToolHeader` (from `cvActivity.jsx`) for the frame, but there is NO `PageTemplate`/`ContentArea`/`ContentBox` template in the codebase — `primitives.jsx` exports only atoms (Icon, Avatar, Tag, Button, Rating, SectionHeader, etc.), no layout template. The calendar body is hand-rolled `<div>`s with CSS-class-driven grid (`calgrid`, `cal-head`, `cal-cell`, `calev`, `calrail`, `upnext`, `availcard`) and inline `style={{ gridColumn/gridRow }}`. `Topbar` and `SectionHeader` are imported but unused in the component body.

**i18n:** All strings hardcoded (Swedish literals) — no translation function. Examples: "Lägg till händelse", "Boka med Sara", "Idag är torsdag", "Kommande", "Typer av händelser", "Sara har tid", "Välj". Day/month labels ("Mån", "jun") and event titles are literals in the fixture arrays.

**Tests:** No tests found — no `.test.cjs` references `calendar`/`CalendarView`; no server or scripts reference this screen. Pure static presentational component. Live-validation: N/A (no external calls to validate).

### community.jsx

- **Screen name / route key:** `Community` (exported from `src/screens/community.jsx`). Route key in `src/App.jsx` `LL_ROUTES`: `community` → `{ c: () => <Community />, title: 'Community' }` (App.jsx:32). Also exports `CmSearch`, `FeedCard`.
- **DATA SOURCE:** **Hardcoded fixtures only — nothing external, no backend, no localStorage.** The screen imports only UI (`../components/primitives.jsx`, `../components/shell.jsx`); no api/, data/, hooks/, or `fetch`. All content is inline module-level constants in this file:
  - `SEARCH_RESULTS` (lines 8-34) — search-dropdown categories (Coacher/Deltagare/Frågor/Tips/Verktyg/Länkar)
  - `FEED` (lines 86-133) — the community feed (questions, tips, polls, requests, posts)
  - `MINI_TOP` (135-141) — weekly leaderboard
  - `WINS2` (143-147) — "Veckans hjältar" success stories
  - Level widget, points values, week label ("Vecka 24 · juni 2026"), current-user identity ("Amir Hassan" / "Du (Amir)") are all hardcoded literals in JSX.
- **CTA / action table:**

| Button / action | Classification | Note |
|---|---|---|
| Search bar (`CmSearch`) open/close + typing | PARTIAL | Opens/filters the dropdown UI (`open` state, click-outside close), but `q` never filters `SEARCH_RESULTS` — always renders the full fixture list regardless of query |
| Search "Rensa" (clear) button | WORKS | Clears the `q` input string (local state only) |
| Search result rows | DEAD | Rendered from `SEARCH_RESULTS` fixture; no onClick/href |
| Filter tabs (Alla / Frågor / Tips / Omröstningar / Coachposter / Söker hjälp `Chip`s) | DEAD | Static chips, `on` hardcoded on "Alla"; no click handler, no filtering of `FEED` |
| "Ställ en fråga" button | DEAD | No onClick |
| Compose box (avatar + input + poll icon + "Dela") | DEAD | Input has no state binding; poll icon button and "Dela" have no onClick |
| Feed card "Rösta" (poll) | FAKE | Poll bars render from fixture `options`/`votes`; button has no handler — no voting |
| Feed card "Tacka" (tip/post) | DEAD | No onClick |
| Feed card "Svara" (question/request) | DEAD | No onClick |
| "Topp i veckan" → "Hela" link | DEAD | `href="#"` |
| "Veckans hjältar" `SectionHeader` (`seeAll={null}`) | DEAD | No see-all action passed |

  No button in this screen is wired to real data or a backend; the only functioning interactivity is the search-dropdown open/close and the clear-input, both local component state.
- **Design system status:** **Bespoke/legacy markup.** Uses shared primitives (`Icon, Clover, Avatar, AvatarStack, Photo, Tag, Chip, Button, SectionHeader`) and shell (`Sidebar, Topbar`), but builds its own layout with hand-rolled `className` divs (`ll app app--lively`, `content content--narrow`, `cm-grid`, `cm-rail`, `fcard2`, `poll`, `wins`, etc.). Does NOT use the design-system page templates `PageTemplate`/`ContentArea`/`ContentBox` (those exist in `src/components/grid.jsx` but are not imported here).
- **i18n:** **All strings hardcoded** (Swedish literals inline in JSX and in the fixture constants). No translation function or i18n import.
- **Tested:** no tests found (no `*community*.test.cjs`; no community references in `server/` test files). Pure presentational component; live-validation N/A.

### jobSearch.jsx

**Screen name / route key:** `JobSearch` — route key `jobbsok` in `src/App.jsx` (`LL_ROUTES.jobbsok = { c: () => <JobSearch />, title: 'Jobbsök' }`, App.jsx:29).

**DATA SOURCE (critical):** External APIs called **directly from the browser**, plus localStorage persistence. NOT our backend. The screen calls `useLiveJobSearch` (`src/hooks/useLiveJobSearch.js`) → `searchJobs` (`src/api/jobSearch.js`), which does raw `fetch()` from the client to three third-party endpoints (`src/api/jobSearch.js:148-152`, `PROVIDERS` block lines 10-71):
- JobTech / Platsbanken: `https://jobsearch.api.jobtechdev.se/search` (one call per keyword, `q`/`limit`/`municipality`).
- RemoteOK: `https://remoteok.com/api` (feed, client-side keyword filter).
- Remotive: `https://remotive.com/api/remote-jobs` (feed, client-side keyword filter).
Municipality is hard-fixed to `'0180'` (`FIXED_MUNICIPALITY`, jobSearch.js:1); `normalizeJobQuery` overrides any passed municipality back to `0180` (jobSearch.js:245). Results are scored/tagged/sorted client-side (top 40). The `meta.api_calls` shown in the UI is a real count of fetches performed. Persistence goes through `src/utils/jobStore.js` (localStorage keys under `hellolilly:*`): latest search, saved searches, accepted jobs, removed jobs. On mount the hook seeds from `getLatestJobSearch()` (last cached run) then auto-runs a live search. No hardcoded fixture (`strategyData.js` is not imported here).

**CTA / action table:**

| Action | Classification | Note |
|---|---|---|
| "Sök jobb" (submit, primary) | WORKS | Calls `runSearch` → live `searchJobs` fetch to the 3 external APIs; disabled while `status==='loading'` (jobSearch.jsx:140, useLiveJobSearch.js:15-33). |
| Source toggle chips (Platsbanken / RemoteOK / Remotive) | WORKS | `toggleSource` adds/removes provider id from `sources`; used by the next search (jobSearch.jsx:46-50, 124-136). |
| Sökord text input | WORKS | Controlled; parsed by `parseTerms` (comma-split) into keywords on submit (jobSearch.jsx:110-115, 55). |
| Kommunkod input | DEAD | `readOnly`, value fixed to `'0180'`; editing impossible and `normalizeJobQuery` would force `0180` anyway (jobSearch.jsx:116-123, jobSearch.js:245). |
| "Spara sökning" (secondary) | WORKS | `saveSearch` writes current query to localStorage `hellolilly:saved-searches` (max 8, dedup by fingerprint); shows "Sparad: …" notice for 2.2s (jobSearch.jsx:68-73, jobStore.js:71-90). |
| Saved-search chip (click to apply) | WORKS | `applySavedSearch` restores terms+sources and runs a live search (jobSearch.jsx:75-84). |
| Saved-search "×" (remove) | WORKS | `removeSavedSearch` deletes from localStorage (jobSearch.jsx:158-164, jobStore.js:92-94). |
| Job row click / Enter/Space | WORKS | Dispatches `ll:helpful:open` event consumed by `helpfulLayover.jsx` (real listener at helpfulLayover.jsx:183) to open an overlay for the job (jobResultsList.jsx:33-64). |
| "Läs" (per-job, secondary) | WORKS | Same `openJob` → `ll:helpful:open` overlay (jobResultsList.jsx:77). |
| "Ta bort" (per-job, ghost, icon `plus`) | PARTIAL | Label says remove and it does remove: `removeJob` adds id to localStorage `hellolilly:removed-jobs` so the row is filtered out (jobResultsList.jsx:78, jobStore.js:134-140). Note: icon is `plus`, mismatched with the "remove" label. |
| "Ansök" / "Sparad" (per-job, primary) | PARTIAL | Label is "Ansök" (Apply) but it does NOT open an application — it calls `acceptJob`, saving the job to localStorage `hellolilly:accepted-jobs` and relabeling the button "Sparad" (jobResultsList.jsx:79, 42-45, jobStore.js:100-105). No external apply/navigation. |

**Design system status:** Bespoke/legacy markup. Uses `Sidebar`/`Topbar` from `components/shell.jsx` and `Icon`/`Button`/`SectionHeader`/`Tag` from `components/primitives.jsx`, but the page body is hand-rolled `<div className="ll app">` / `content` / `card card--pad` / raw `<form>`/`<label>`/`<input>` markup — it does NOT use PageTemplate/ContentArea/ContentBox-style templates.

**i18n:** No translation function. All strings are hardcoded Swedish literals inline in JSX ("Jobbsök", "Live API-sökning", "Sök jobb", "Spara sökning", "Söker...", "träffar", "Ansök", "Ta bort", "Läs", "Sparad", etc.).

**Tested:** No tests found for this screen or its data chain. No `.test.cjs` references `screens/jobSearch`, `useLiveJobSearch`, `api/jobSearch`, `utils/jobStore`, or `jobResultsList` (grep returned nothing). The `job-*.test.cjs` files under `server/skeleton/` are backend/skeleton job modules, unrelated to this frontend screen. Live-validation of the external-API calls: UNVERIFIED (no smoke/verify script found exercising these browser fetches).

**Routing and app shell.**

### Frontend routing and app shell

**Entry point:** `src/main.jsx` mounts `<App />` (from `src/App.jsx`) into `#root` via React 18 `createRoot`, importing global CSS `src/styles/hello-lily.css`. No framework router; no SSR.

**Routing mechanism:** Hash-based, hand-rolled — NOT react-router. `App` (`src/App.jsx:35-77`) reads `location.hash` (`getRoute()` strips the leading `#`, defaults to `home`), keeps `route` in `React.useState`, and re-reads on the `hashchange` window event. Each hash change also closes the nav/help drawers and scrolls to top. `document.title` is set from `LL_ROUTES[route].title`, else `COACH_NAV_INDEX[route].label`, else `NAV_INDEX[route].label`, else `'Hem'` (`App.jsx:66-74`). Render selects `LL_ROUTES[route].c()` if the key exists, otherwise falls back to `<ComingSoon routeKey={route} />` (`App.jsx:76-77`).

**`LL_ROUTES` — the definitive route-key → screen-component map (13 keys, exactly as in `src/App.jsx:19-33`):**

| Route key (`#hash`) | Component | Source file | Title |
|---|---|---|---|
| `home` | `HomeExpanded` | `src/screens/home.jsx` | Hem |
| `cv` | `CVBuilder` | `src/screens/cvActivity.jsx` | CV-byggaren |
| `letter` | `CoverLetter` | `src/screens/coverLetter.jsx` | Personligt brev |
| `interview` | `InterviewTrainer` | `src/screens/interview.jsx` | Intervjuträning |
| `activity` | `ActivityTracker` | `src/screens/cvActivity.jsx` | Min aktivitet |
| `library` | `SharedLibrary` | `src/screens/library.jsx` | Bibliotek |
| `review` | `MultiCoachReview` | `src/screens/review.jsx` | Granskning |
| `studio` | `ImageStudio` | `src/screens/studio.jsx` | Bildstudio |
| `coach` | `CoachWorkspace` | `src/screens/coach.jsx` | Coachvy |
| `jobbsok` | `JobSearch` | `src/screens/jobSearch.jsx` | Jobbsök |
| `match` | `JobMatchReview` | `src/screens/match.jsx` | Matchanalys |
| `calendar` | `CalendarView` | `src/screens/calendar.jsx` | Kalender |
| `community` | `Community` | `src/screens/community.jsx` | Community |

**TRUE count:** 13 real routes → real screen components (12 jobseeker screens + `coach` → `CoachWorkspace`). The task's "13 + coach view" is off by one in framing: `coach` is one of the 13 `LL_ROUTES` entries (the coach view), not an extra beyond them. Every other route key resolves to `ComingSoon`.

**`NAV_INDEX` (`src/components/shell.jsx:66-70`)** is a flat lookup built from `NAV_GROUPS` (`shell.jsx:9-62`) — 7 sidebar groups (`plan`, `jobb`, `ansok`, `intervju`, `natverk`, `stod`, `mincoach`) whose sub-items enumerate jobseeker nav keys. Many of these keys have NO entry in `LL_ROUTES` and therefore render `ComingSoon`, e.g.: `uppgifter`, `paminnelser`, `arendevy-plan`, `jobbradar`, `foretagslista`, `sparade-jobb`, `ansokningskoll`, `intervjuforberedelse`, `researchstod`, `ovningshistorik`, `linkedin`, `kontaktplan`, `natverksmatch`, `spontanansokningar`, `kontakter`, `kunskapshubb`, `videos`, `guider`, `kurser`, `diskussioner`, `meddelanden`, `moten`, `arendevy-coach`, `delade-dokument`, `nastasteg`. (`NAV_INDEX` is used only for titles/`ComingSoon` metadata and to decide which sidebar group auto-opens — it is not itself a route table.)

**`COACH_NAV_INDEX` (`src/screens/coach.jsx:127-133`)** is the coach-side flat lookup built from `COACH_NAV_GROUPS` (`coach.jsx:62-125`) — 8 coach groups (`c-oversikt`, `c-deltagare`, `c-arenden`, `c-granskningar`, `c-natverk`, `c-kunskap`, `c-moten`, `c-insikter`). Of all its keys, only `coach` maps to a real `LL_ROUTES` screen (`CoachWorkspace`); every other `c-*` key (e.g. `c-arendevy`, `c-cv-granskning`, `c-kalender`, `c-feedback`, …) renders `ComingSoon` with `isCoach=true` styling. `ComingSoon` (`shell.jsx:134-157`) checks `COACH_NAV_INDEX[routeKey]` first, then `NAV_INDEX[routeKey]`, and pulls a spec from `COACH_TOOL_SPECS`/`TOOL_SPECS` (`src/data/strategyData.js`) or a generated fallback; it renders the coach `CoachSidebar` when the key is a coach key, otherwise the jobseeker `Sidebar`.

**Routes pointing at ComingSoon / no screen:** Every hash that is NOT one of the 13 `LL_ROUTES` keys falls through to `ComingSoon` (`App.jsx:77`). This includes ~25 jobseeker nav keys and ~40 coach `c-*` nav keys that appear in the sidebars but have no dedicated screen. A completely unknown/typo hash also renders `ComingSoon` (label falls back to the raw `routeKey`, group `plan`).

**Tested:** No routing tests. No `.test.cjs` references `App.jsx`, `LL_ROUTES`, or `getRoute` (all test files are `server/**` and `scripts/**`). Frontend routing/app-shell: no tests found.

**The data bridge and i18n.**

### The data bridge and i18n

**No async layer to any backend `/api/case` (or any `/api/*`) endpoint exists.** A full `src/` grep for `fetch('/api`, `/api/case`, and any `/api/` string literal returns nothing. The only reference to a case-data layer is a *comment* in `src/components/grid.jsx:5` ("the coming `useCase()` data layer drops straight in") — `useCase()` is not implemented anywhere. CONFIRMED. The single `fetch()` call in all of `src/` is in `src/api/jobSearch.js:149`.

**`src/api/jobSearch.js` calls external job APIs DIRECTLY from the browser** (no backend proxy). CONFIRMED. `fetchJson()` (line 148-152) does a plain `fetch(url)` against provider-built URLs. Three providers hardcoded in `PROVIDERS`:
- `jobtech` → `https://jobsearch.api.jobtechdev.se/search` (JobTech / Platsbanken), `mode: 'search'`, one call per keyword, params `q`, `limit`, `municipality`.
- `remoteok` → `https://remoteok.com/api`, `mode: 'feed'`.
- `remotive` → `https://remotive.com/api/remote-jobs`, `mode: 'feed'`.
`DEFAULT_QUERY` = keywords `['lager','logistik','truck']`, sources `['jobtech']`, municipality `'0180'` (fixed; `normalizeJobQuery` forces `FIXED_MUNICIPALITY` regardless of input). `searchJobs()` fans out over sources with `Promise.all`, dedupes by id, sorts by `match`, caps at 40. Results are client-side normalized/scored (`scoreJob`, `normalizeJob`) and localized in Swedish (`relativeDate` returns "nyss"/"tim sedan"/"igår"/etc.). Consumed via `useLiveJobSearch` (`src/hooks/useLiveJobSearch.js`) in `src/screens/home.jsx` and `src/screens/jobSearch.jsx`.
NOTE: whether these cross-origin browser calls actually succeed against live APIs (CORS, key requirements) is UNVERIFIED — no smoke/verify script or committed run artifact was found for the browser path.

**`src/utils/jobStore.js` is localStorage-backed.** CONFIRMED. `canStore()` guards on `window.localStorage`; `readJson`/`writeJson` wrap `localStorage.getItem/setItem` with try/catch. Four keys persisted (line 3-8): `hellolilly:saved-searches`, `hellolilly:accepted-jobs`, `hellolilly:removed-jobs`, `hellolilly:latest-job-search`. It persists saved searches (capped 8, fingerprinted, normalized via `normalizeJobQuery`), accepted jobs (capped 30, compacted), removed-job ids (capped last 200), and the latest search payload (query + compacted jobs + summary + meta + `searchedAt`). Every write dispatches a `ll:jobs:changed` CustomEvent. Importers: `useLiveJobSearch.js` (`getLatestJobSearch`/`saveLatestJobSearch`), `src/screens/match.jsx`, `src/components/helpfulLayover.jsx`.

**`src/data/strategyData.js` is a hardcoded fixture module** (no functions, no I/O — only exported object/array literals). CONFIRMED. It exports 13 constants: `CASE_PROFILE`, `FOUNDATION_TOOLS`, `NEXT_ACTIONS`, `PIPELINE_RUN`, `LIVE_JOBS`, `CASE_RECORD`, `KNOWLEDGE_RESOURCES`, `DISCUSSIONS`, `LEARNING_RESOURCES`, `COMMUNITY_WINS`, `OUTCOME_METRICS`, `TOOL_SPECS`, `COACH_TOOL_SPECS` — a fictional Swedish jobseeker scenario ("Amir Hassan", coach "Sara Lind", PostNord match 78→92) plus per-tool spec copy. Consumers (import verified): `src/screens/home.jsx`, `coach.jsx`, `cvActivity.jsx`, `coverLetter.jsx`, `interview.jsx`, `library.jsx`, `src/components/shell.jsx`, `helpfulNow.jsx`. NOTE: `LIVE_JOBS` is exported but has ZERO importers anywhere in `src/` (home.jsx uses the live `useLiveJobSearch()` hook instead) — dead export.

**i18n: there is NO i18n library and NO translation function — all strings are hardcoded, predominantly Swedish.** CONFIRMED. `package.json` dependencies are only `@vitejs/plugin-react`, `vite`, `react`, `react-dom` (no i18next/react-intl/intl/polyglot/lingui). A `src/` grep for `react-intl`, `i18next`, `useTranslation`, `useIntl`, `IntlProvider`, `FormattedMessage`, `Trans`, `gettext`, `__(` returns zero matches. No local i18n layer or translation module exists; UI copy is written inline as Swedish literals in the fixtures and JSX (e.g. `strategyData.js`, `jobSearch.js` date strings, screen components). The earlier broad grep hits were false positives (bare `t(` / substring "translat"), not translation APIs.

**Shared components and design system.**

### Shared components and design system

Grounded in `src/components/{primitives,shell,grid,helpfulLayover,helpfulNow,jobResultsList}.jsx`, `src/App.jsx`, `src/screens/home.jsx`. No `.test.cjs` exists for any of these UI files — the test runner (`node --test "server/**/*.test.cjs" "scripts/**/*.test.cjs"`) covers only `server/`+`scripts/`; a grep of those dirs for these filenames/component names returned nothing. **No tests found for any shared component; live-validation UNVERIFIED (no browser/render test harness in repo).**

**Two parallel "design systems" exist — one wired, one dormant.**

**A. `primitives.jsx` — the real, universally-used atom layer.** Exports `Icon` (47-name SVG path set `ICONS`), `Clover`/`CloverDefs` (brand quatrefoil + a reusable `clipPath id="ll-clover"`), `Logo`, `PersonGlyph`, `Photo` (duotone clover-watermarked placeholder), `Avatar`/`AvatarStack` (initials-based), `Tag`, `Chip`, `Button` (variant/size/icon), `Rating`, `SectionHeader`. All are presentational (className + props → markup); no state except `useState` imported but unused. Imported by shell, grid, helpfulLayover, helpfulNow, jobResultsList and (per grep) all screens. This is the actual shared vocabulary.

**B. `shell.jsx` — the wired app-chrome + dashboard layer.** Exports `Sidebar` (two-level grouped nav from `NAV_GROUPS`, 7 groups; auto-opens the active group via `NAV_INDEX` lookup + `useState`/`useEffect` — real interactive state), `Topbar`, `ComingSoon` (fallback screen for any route not in `App.LL_ROUTES`; pulls copy from `TOOL_SPECS`/`COACH_TOOL_SPECS` in `data/strategyData.js`), plus presentational dashboard widgets `CoachCard`, `MilestonePath`, `Stats`, `Todo`, `ToolGrid`, `CourseFeed` (each ships hardcoded default fixtures — `MILES`, `STATS`, `TODOS`, `TOOLS`, `FEED` — but accepts an `items` prop). **Real/wired:** `Sidebar` (nav state), `ComingSoon` (route-driven). `home.jsx` imports `Sidebar, Topbar, CoachCard, MilestonePath, Stats, Todo, ToolGrid, CourseFeed` and composes them with bespoke `<div className="main">`/`<div className="content">` markup.

**C. `grid.jsx` — a SECOND, self-described "design-system layer" + GRID TEMPLATES that NO screen uses.** Header comment: "design-system layer… + the GRID TEMPLATES… Mirror of the prototype's ds-system.jsx". Exports the template primitives the task asked about:
- **`PageTemplate`** (`{ nav, content, cross }` slots → `.ll-shell`/`.ll-page` with built-in mobile burger/drawer/scrim + Escape-to-close `useState`/`useEffect`) — the intended page primitive.
- **`ContentArea`** (`mode='single'|'split'`) and **`ContentBox`** (`tone`/`span2` section wrapper) — the middle-column layout primitives.
- Plus atoms/molecules/organisms `Field`, `MatchRing`, `BigStat`, `CrosslinkCard`, `JobRow`, `Hero`, `CrossColumn`, `Link`.

**`PageTemplate`/`ContentArea`/`ContentBox` and every other `grid.jsx` export are imported by NO screen and NO other file** (verified: `grep -rln PageTemplate|ContentArea|ContentBox|MatchRing|CrossColumn|Hero|BigStat src/` returns only `grid.jsx` itself). `grid.jsx` itself imports only `Icon, Clover` from primitives. So the entire `grid.jsx` module — including its stateful `PageTemplate` — is dead/unwired code today. It is functional React (not stubbed) but unreferenced.

**Actual page composition (App.jsx):** `App` is a hash-router (`LL_ROUTES` map + `getRoute()`), renders one screen + always-mounted `<HelpfulNow/>` and `<HelpfulLayover/>`, and owns its OWN mobile chrome (`.ll-menu`/`.ll-scrim`/`.ll-help-toggle` buttons + `nav-open`/`help-open` body classes) — duplicating what `grid.jsx PageTemplate` was built to provide. Screens each render their own `<Sidebar/>` + `.main`/`.content` markup rather than `PageTemplate`.

**Right-rail support components (real/wired):**
- **`helpfulNow.jsx` — `HelpfulNow`**: contextual right column; reads `location.hash` (`getHelpRoute`) + `hashchange` listener to pick a route-specific item list (`HELP_BY_ROUTE`, 12 routes, sourced from `strategyData` `PIPELINE_RUN`/`CASE_RECORD`/`KNOWLEDGE_RESOURCES`); clicking dispatches `CustomEvent('ll:helpful:open')`. Wired.
- **`helpfulLayover.jsx` — `HelpfulLayover`**: full-screen dialog that listens for `ll:helpful:open`/`ll:helpful:close`/`keydown`(Esc)/`hashchange`, body-scroll-locks (`lay-open` class). Routes by `item.kind`: `job` → `JobDescriptionContent`, `job-analysis` → `JobAnalysisContent` (fake 4-step timed "analysis" via `setTimeout` → `MatchAnalysisContent` with hardcoded `MATCH_DETAILS`), else `RICH_CONTENT[item.id]` (only ONE authored entry, `'cv-gap-video'`) or a "content kommer snart" stub. Wired via events; **content data is hardcoded fixtures**, and Job accept/remove goes through `utils/jobStore.js` (real localStorage store, present).
- **`jobResultsList.jsx` — `JobResultsList`**: renders a `jobs` prop as clickable rows (open → `ll:helpful:open` with `kind:'job'`; Läs/Ta bort/Ansök buttons via `jobStore` `acceptJob`/`removeJob`); syncs on `ll:jobs:changed`+`storage` events; empty-state when filtered to zero. Wired; imported by `home.jsx` and `jobSearch.jsx`.

**Net:** Screens are expected to build on `primitives.jsx` (universally) + `shell.jsx` `Sidebar`/`Topbar` + bespoke markup. The formal `grid.jsx` template system (`PageTemplate`/`ContentArea`/`ContentBox` and the crosslinking `CrossColumn`) exists as an aspirational, prop-driven layer but is currently orphaned — screens use bespoke layout markup instead of these templates.

---

## Part 3 - The seams

Every place the code contradicts the plan docs (`/docs`) or itself. Facts only; each item names the files and states what the code does vs what the label/plan says. All claims below were confirmed by reading the cited files.

### A. Frontend does not use its own backend (the big architecture seam)

1. **Jobbsök / job search bypasses the HelloLilly backend entirely and hits JobTech (and RemoteOK/Remotive) directly from the browser.** `src/api/jobSearch.js:149` `fetchJson` calls `fetch()` straight to `https://jobsearch.api.jobtechdev.se/search`, `https://remoteok.com/api`, `https://remotive.com/api/remote-jobs`. `src/hooks/useLiveJobSearch.js` and `src/screens/jobSearch.jsx` consume this client. A grep of all of `src/` for `/api/` or `fetch(` found only the external-API fetch (jobSearch.js:149) and one import string — **no HelloLilly `/api/...` call exists anywhere in the frontend.** Meanwhile the backend has a fully separate `/api/jobs/search` handler (`server/dev-server.cjs:323`, `runJobSearch` at :210) that goes through the sibling pipeline `api-search` module. The two job-search paths are completely disjoint: the shipped UI never touches the server path.

2. **The `useCase()` data-bridge layer that both A2 briefs make the foundation does not exist.** `A2_FRONTEND_BUILD_BRIEF.md` ("The foundation to build first: the data bridge … the `useCase()`-style layer"), `DATA_CONTRACT.md` §7, and `src/components/grid.jsx:5` (comment: "coming useCase() data layer" that "drops straight in") all reference an async layer that reads case parts from the backend API with `pending/ready/failed/absent` states. No such implementation exists — no `useCase`, no `/api/case` fetch in `src/`. Screens (`match.jsx`, `cvActivity.jsx`, `coach.jsx`, etc.) import the `strategyData.js` fixture directly.

3. **Matchanalys (`match.jsx`) reads localStorage fixtures, not the backend `fit`/`gaps` parts.** `A2_RECONCILED_DESIGN.md` and `A2_FRONTEND_BRIEF.md` specify the Matchanalys screen renders the `fit` part (verdict, capability rows, citation chips) and runs the fill-gap loop against the backend. Actual `src/screens/match.jsx` imports only from `src/utils/jobStore.js` (localStorage) and renders a hardcoded `MATCH_DETAILS` fixture (in `helpfulLayover.jsx`). Screen copy claims it "opens the job in Lilly's analysis flow against the CV-builder's sections" and computes a match "signal" %; the code renders a fixed fixture and the % defaults to a hardcoded 76 (`match.jsx:76`, `jobStore.js:42`). No `/api/case/:id/analyze` call is made from any screen.

4. **Backend A2 capabilities have zero frontend exposure.** The `/api/case/:id` routes in `dev-server.cjs` (`createApiHandler`, lines ~58-200) are the only callers of the real A2 work: `POST /analyze` → `host.invoke('gap-analyzer')` (:32); `POST /generate` → invokes `cv-builder` and `writer` (:60-63); `POST /gap/:gapId/answer` → `applyAnswer` (bullet-judge fill-gap, :50). The submodules `gap-analyzer` (187-line real module), `cv-builder`, `writer`, and the `fill-gap/bullet-judge.cjs` function are reachable ONLY through `/api/case`, which no screen calls. They are backend-only capabilities with no wired UI.

### B. Cross-repo / external-machine dependencies (runs here, would fail on a clean checkout or CI)

5. **`/api/jobs/search` hard-depends on the OnlyiGaming sibling repo.** `dev-server.cjs:16-17` sets `PIPELINE_MODULES_DIR = process.env.PIPELINE_MODULES_DIR || path.resolve(__dirname, '../../OnlyiGaming/content-pipeline-modules-v2')`, and `runJobSearch` (:213) does `require(path.join(PIPELINE_MODULES_DIR, 'modules/step-1-discovery/api-search/execute.js'))`. The in-file comment (:18-22) states the sibling "is not present in CI"; the lazy require means the first `/api/jobs/search` call returns 500 MODULE_NOT_FOUND on any box without the sibling. On this machine the file **is** present (verified: `.../api-search/execute.js`, 16075 bytes) — so behavior differs between this dev box and a clean checkout/CI.

6. **`seed:datafacts` reads `cv_data.json` from a sibling folder two levels above the repo root.** `scripts/seed-datafacts.cjs:16` `DEFAULT_JSON = path.resolve(__dirname, '../../JobSearch/CVs/cv-source/en/cv_data.json')` → resolves to `/Users/danieloskarsson/…/Projects/JobSearch/CVs/cv-source/en/cv_data.json` (verified present, 37707 bytes, outside this repo, not in git). `seedDatafacts` has no `existsSync` guard, so an absent file throws ENOENT (uncaught in the CLI path; caught only by the `try/catch` around the boot-time seed in `dev-server.cjs:310-313`). The repo is not self-contained for datafact seeding.

7. **The two English `cv_data.json` copies are NOT content-identical, contradicting the seed script's own comment.** `seed-datafacts.cjs:13-14` comment: "cv-source/en is content-identical to the top-level copy, newer". Actual md5s differ: `JobSearch/CVs/cv_data.json` = `c20b70a1…` vs `JobSearch/CVs/cv-source/en/cv_data.json` = `ba5cc6f9…` (37707 bytes). Both files are external to this repo (no `cv_data.json` exists inside `hello lily - app`). The reconciled design (§3, §9, §pre-flight) left "which of the two English files is canonical" as a to-be-confirmed item; the seed script picked `cv-source/en` but its "content-identical" justification is false against the current files.

8. **The `discover` / `enrich` / `filter` runner scripts depend on gitignored, untracked local data files.** `run-discovery.cjs`, `run-enrich.cjs`, `run-filter.cjs` read `docs/candidate_preferences.json` and `docs/jobs-2026-06-29.csv` (present on this machine). They guard with `existsSync` and `exit 1`, so on a fresh clone (where these local files are absent) they cannot run out-of-the-box.

### C. Doc-vs-doc: duplicate / stale / competing specs (nothing deleted — status by header/date/content)

9. **DATA_CONTRACT.md vs DATA_CONTRACT.md.bak2.** `DATA_CONTRACT.md` header is v0.3 (date line `2026-06-29 (v0.3) · 2026-06-25 (v0.2) · 2026-06-15 (v0.1)`); `.bak2` header is the earlier version (date line lacks the v0.3 entry). Diff: v0.3 adds the `cvDraft` and `coverLetter` parts and an `evidenceRef` field to `capability`. **`DATA_CONTRACT.md` is canonical; `.bak2` is the prior (pre-A2) snapshot.**

10. **Three byte-identical copies of the pain-points research report.** `docs/research/job-seeker-pain-points-report.md`, `…report.md.md`, and `perplexity.md` all have md5 `070eb3d3…` (identical content). The `.md.md` double-extension and `perplexity.md` are duplicate copies of the canonically-named `job-seeker-pain-points-report.md`. (`PERPLEXITY_DEEP_RESEARCH_PROMPT.md` is the distinct source prompt, not a report copy.)

11. **`linkedin-job-scraping-report.md.md` has a double `.md.md` extension** (no single-`.md` sibling exists in `docs/research/`). Content is the LinkedIn scraping report; the double extension is a naming artifact, not a second report.

12. **A2 spec stack — one canonical, several inputs/derived briefs (all coexist, none marked superseded).** `A2_RECONCILED_DESIGN.md` (Status: "Reconciled source of truth … Where they disagreed, this document is the resolution") supersedes `A2_GAP_ANALYZER_DESIGN.md` (Status still "Draft for review") and `A2_FRONTEND_BRIEF.md`. `A2_BACKEND_BRIEF.md` and `A2_FRONTEND_BUILD_BRIEF.md` both declare "Source of truth: `A2_RECONCILED_DESIGN.md`" and are the derived backend/frontend build halves. So: RECONCILED = canonical; GAP_ANALYZER_DESIGN + FRONTEND_BRIEF = the earlier "separate-session specs" it merges (still labelled Draft, not marked stale on their own faces); BACKEND_BRIEF + FRONTEND_BUILD_BRIEF = current derived briefs. All are git-untracked (`git status` shows them as `??`).

### D. Doc-vs-code contradictions

13. **`DATA_CONTRACT.md` (v0.3) is internally inconsistent about the CV part — it lists both `cvStory` and `cvDraft`.** The v0.3 diff added `cvDraft` (`{language, sections…}`), but line 124 still defines a legacy `cvStory` (`slides: [{id, headline, detail}]`). The code's canonical parts array (`server/skeleton/contract/case.cjs:14`) contains `cvDraft` but **no** `cvStory`. So `cvStory` in the contract is a stale interview-prep leftover with no code backing, sitting next to the new `cvDraft`.

14. **`server/skeleton/README.md` §Status is stale vs shipped code.** It lists "**Next:** A2 (gap analyzer) …" and closes with "Built to DATA_CONTRACT v0.2." But `gap-analyzer` is a full 187-line shipped submodule (not "next"), and the current contract is v0.3. README §Capabilities (line 36) also lists `http | logger | store | request | llm | search | utils` and omits `datalayer`, which `registry.cjs` (VALID_CAPABILITIES) and `capabilities.cjs` include as a real 8th capability (used by `gap-analyzer` and `cv-builder`).

15. **`researcher/README.md:23` disagrees with `researcher/execute.cjs` on the standalone research-mode outcome.** README: "Standalone (no broker): drills and dossiers work; the decoder summon is skipped." Code: in research mode it unconditionally calls `tools.request('decoder', {caseId})` and, in standalone host mode, `tools.request` throws "standalone mode: no broker"; the module catches it and returns `{ok:false, partial:true, decoded:false, decoderError}`. So standalone research reports `ok:false`/partial, not a clean skip. (Drill mode genuinely does not summon the decoder, so drills do work standalone — that half of the README is correct.)

16. **`echo-analyzer` is still the shipped A2 analyzer stub per its own docs, even though the real `gap-analyzer` exists.** `server/skeleton/README.md` frames `echo-analyzer` as an A0 stub "Replaced by the real Decoder+Analyzer in A2." Both the stub (`server/submodules/echo-analyzer/`) and the real `gap-analyzer` coexist in `server/submodules/`; the README §Status has not been updated to reflect gap-analyzer shipping.

17. **`writer/execute.cjs` claims its SYSTEM prompt is "ported verbatim" from a sibling file — the sibling exists but verbatim-ness is unverified.** Comment at `writer/execute.cjs:9-14` cites `JobSearch/CVs/generate-cover-letter.js` (snapshot `pipeline-job-search/cover_letter_prompt.md`). Both sibling files exist (`generate-cover-letter.js` 15478 bytes; `cover_letter_prompt.md` 5031 bytes). A verbatim-port claim in a comment; the actual text was not diffed here (see UNVERIFIED).

### E. Config-surface / stale-default seams

18. **Two different default municipalities for the two job-search config surfaces.** Frontend `src/api/jobSearch.js:1` `FIXED_MUNICIPALITY = '0180'` (Västerås per the reader note; the code comment/scoring targets Västerås), and `normalizeJobQuery` hard-overrides any user value back to `'0180'`. Backend `server/job-search-config.cjs:64` `DEFAULT_JOB_SEARCH.municipality = '1980'`. Both share the same warehouse keywords `['lager','logistik','truck']` and `sources:['jobtech']`, but the municipality codes disagree between the frontend live path and the backend/`job-discovery` path.

19. **The Jobbsök municipality field is decorative.** `src/screens/jobSearch.jsx` presents a "Kommunkod" input, but it is `readOnly` and pinned to `FIXED_MUNICIPALITY='0180'`, and `normalizeJobQuery` discards any other municipality value (`jobSearch.js:normalizeJobQuery` returns `municipality: FIXED_MUNICIPALITY` unconditionally). The field cannot change the query.

20. **Jobbsök hero copy over-claims sources vs the default.** The screen advertises searching "Platsbanken/JobTech, RemoteOK och Remotive," but `DEFAULT_QUERY.sources = ['jobtech']` (jobSearch.js:5) — only Platsbanken/jobtech is queried unless the user manually toggles the other two on.

21. **The warehouse-persona default is baked into the "live" search.** `DEFAULT_QUERY` keywords `['lager','logistik','truck']` + municipality `0180` (frontend) pin the "live" job search to the fictional warehouse/logistics case-study persona regardless of user, while the A2 pipeline / `seed-filter-set.cjs` / `run-discovery` target an executive CMO/CPO search — two unrelated persona targets in the same repo.

### F. Manifest-vs-code documentation seams (declared contract ≠ what the code touches — not runtime bugs, but inaccurate module docs)

22. **Every submodule manifest under-declares `tools.ids`.** `cv-builder`, `decoder`, `echo-researcher`, `gap-analyzer`, `job-discovery`, `job-ingest`, `linkedin-job-fetcher` (and others) call `tools.ids.mintId`/`ref` but do not list `ids` in `capabilities`. This is intentional, not a bug: `server/skeleton/capabilities.cjs:47` always injects `tools.ids` as shared contract vocabulary regardless of the manifest. A reader comparing manifest `capabilities` to code sees a consistent apparent gap across the module set.

23. **Multiple manifests declare empty `reads:[]`/`writes:[]` while the code reads/writes global collections.** `job-discovery`, `job-ingest`, `linkedin-job-fetcher`, `stage2-filter` all show `reads:[]`/`writes:[]` yet read/write the `jobs`/`filterSet`/etc. collections. Not a runtime contradiction: `capabilities.cjs:33-40` scopes `reads`/`writes` to CASE PARTS only; non-case global collections are coarse-grained and writable by any store-capable submodule (explicit MVP decision, documented in-code). But the manifests read as "reads/writes nothing," which is inaccurate as documentation. The same coarse-grained privilege means the "least privilege / declared writes" framing is wider than it implies for global collections.

24. **Declared-but-unused / under-declared capabilities.** `echo-analyzer` manifest declares `logger` but `execute.cjs` never uses a logger (uses store/request/ids). `decoder` README lists only `store, logger, llm` and omits `utils`, which the manifest declares and `execute.cjs` uses (`tools.utils.truncate`). `cv-builder` manifest declares `['store','llm','datalayer']` but the module also relies on `tools.ids`.

25. **`gap-analyzer` manifest `reads:['meta','decodedRole']` omits its datafact-pool input.** `execute.cjs` also reads the datafact pool via `tools.datalayer.listDatafacts()`. The pool is a global store region, not a case part, so `reads` (case parts) legitimately doesn't cover it — but a reader treating `reads` as the full input list would miss the datafact dependency.

### G. Store / gate self-seams (code documents a narrower guarantee than the framing implies)

26. **Persistence is 100% in-memory.** `server/skeleton/store/index.cjs:3,25,40-43` — cases/scratch/datafacts/collections are JS `Map`s; the header frames on-disk/DB persistence as future work ("Swapping to Hello Lilly's real DB later"). Any doc claiming durable persistence today would contradict the code. (No doc reviewed here claims durable persistence — flagged as the boundary.)

27. **The writing-rules gate is unbypassable only for authored case prose.** The gate runs on `writePart` (case authored prose) but NOT on collections or datafacts; `store/index.cjs:112-114` notes a submodule generating prose into a collection "runs the gate itself before putRecord" — i.e. opt-in/manual for collections. Nothing in the store forces gating of generated prose that lands in a collection. Immutability (detach via `structuredClone`) is likewise applied to cases and collections but NOT to datafacts or scratch (they return live refs). So two of the store's four regions sit outside both the gate and the detach boundary the header emphasizes.

28. **`jobRules` is documented-but-unused.** The store header and `capabilities.cjs:33` enumerate `jobs/jobSources/jobRules/filterSet` as the collection set, but grep shows only `jobs`, `jobSources`, and `filterSet` are actually written anywhere; `jobRules` is named in comments only, never written.

### H. LLM-client dead-parameter seam

29. **`completeJSON` passes a `temperature` that `complete()` silently ignores.** `server/skeleton/clients/anthropic.cjs` — `completeJSON` supplies `temperature` (0.3 default, 0 on retry), but `complete()` destructures only `{system, prompt, model, maxTokens}` and a header comment states temperature is deliberately not sent (deprecated on Opus 4.8). The temperature values are dead; harmless but internally inconsistent.

### I. Frontend "promises features that don't exist" seams (screen CTAs / labels vs code)

30. **"Live från jobbpipelinen" / "via API-sökning" on Home is fixture copy — the fetch goes directly to jobtechdev.se, not through any server pipeline.** (`src/screens/home.jsx` + `jobSearch.js`.) Every other live-looking element on Home (hero "78% → 92%", CV/interview/letter progress %, community counters, "fick jobb den här veckan") is a hardcoded literal. The thumbs-up/down "din matchning blir bättre" feedback affordance has no handlers — no feedback is captured.

31. **CVBuilder (`cvActivity.jsx`) claims "spara automatiskt" / auto-save and "Pipeline-kopplat" but has no save logic and reads only two fixture strings.** The "Steg 4 av 7 · spara automatiskt" header and separate "Spara" button have no save code; the "kopplat till PostNord-analysen" / green "Pipeline-kopplat" tag reads only `PIPELINE_RUN.company` ('PostNord') and `CASE_PROFILE.person` — CV body, chat, and "Application Check" refs are hardcoded literals. ActivityTracker's "uppdaterar case record automatiskt / Loggades automatiskt" is a static `CASE_RECORD.timeline` fixture with no logging. The WeekRing shows `pct={72}` hardcoded, unrelated to the `activityCount` (13) in the ring center. Contact line hardcodes `amir.hassan@mail.se`.

32. **CoverLetter (`coverLetter.jsx`) presents as "Byggt från pipeline / Vi skriver brevet från analysen" but implements none of `strategyData.js`'s `TOOL_SPECS.letter` outputs.** The spec lists Letter draft / Bridge paragraph / Unsupported-claims checklist from inputs (job advert, CV, concerns, match analysis); the screen renders a fixed fictional Amir Hassan/PostNord letter from static `PIPELINE_RUN` fields with zero inputs and no generation.

33. **Interview (`interview.jsx`) claims it builds questions "från jobbannons, CV, företag och tidigare svar" but QSET and feedback are static hardcoded arrays.** Only `PIPELINE_RUN.company`/`.role` label strings feed in. The recording UI, waveform, timer, and delivery/content scoring are fixed visuals with no media capture or scoring backend.

34. **Studio (`studio.jsx`) is a fully dead mockup of image generation.** All 7+ controls (4 template tiles, prompt textarea, 4 suggestion chips, "Skapa 4 bilder", 3×4 result action buttons) have no `onClick`/state; the four "results" are static `<Photo>` glyphs, no generation, no data source beyond inline fixtures.

35. **Community (`community.jsx`) is 100% static.** Every CTA (post, vote, reply, thank, filter, ask) is dead or fake; the search input captures state and has a clear button but never filters `SEARCH_RESULTS` (always shows the full fixture list). No backend/persistence.

36. **Library (`library.jsx`) hero says "320+ delade resurser" but the dataset has 6 items.** `strategyData.js:90-97` `KNOWLEDGE_RESOURCES` = 6; the filter count "`<LIB.length>` resurser" correctly shows 6 — so the hero number (320+) contradicts the real data on the same screen. Filter chips are decorative (no filtering).

37. **Review (`review.jsx`) presents as a collaborative multi-coach tool ("3 coacher har tittat", reply box, agree/reply) but is 100% static fixture with zero wired actions.**

38. **Coach (`coach.jsx`) sidebar exposes ~8 nav groups / ~50 sub-items but `LL_ROUTES` defines exactly ONE `coach` route.** Every coach sub-item link is a dead-end. The screen's SectionHeader says "Samma bild för coach, deltagare och assistent" implying a shared live case record, but it reads the same static `strategyData.js` fixture (Amir Hassan, 78→92%, PostNord) as the jobseeker screens.

39. **`jobSearch.jsx` "Ansök" (Apply) button does not apply or open the job URL — it only saves to localStorage (`acceptJob`) and relabels to "Sparad".** The label implies an apply action that does not exist. ("Ta bort" remove buttons use the `plus` icon on both `jobSearch.jsx:86` and `match.jsx:86` — cosmetic icon/label mismatch; the action itself is correct.)

### J. Navigation breadth vs implemented screens

40. **The sidebar advertises ~65 destinations; only 13 render a real screen.** `shell.jsx` NAV_GROUPS (7 jobseeker groups) + `coach.jsx` COACH_NAV_GROUPS together expose dozens of sub-items, but `LL_ROUTES` (App.jsx:19) has exactly 13 entries (`coach` is one of the 13, not a 14th). Every other sidebar item falls through to `<ComingSoon>`. (The task framing "13 + coach" is inaccurate: it is 13 total, with `coach` included.)

### K. Design-system template layer is fully orphaned

41. **`src/components/grid.jsx` (`PageTemplate`/`ContentArea`/`ContentBox`/`CrossColumn`) is the documented page-primitive layer ("the GRID TEMPLATES … so every template inherits it") but NO screen imports it.** `A2_FRONTEND_BUILD_BRIEF.md` says to build on "the delivered design system (tokens, grid, `PageTemplate`/`ContentArea`/`ContentBox`, the load-bearing crosslinking column)." In practice: (a) screens (`library.jsx`, `review.jsx`, `calendar.jsx`, `community.jsx`, `cvActivity.jsx`) hand-roll bespoke markup instead of adopting these templates; (b) grid.jsx's own docstring says templates "take data as PROPS/SLOTS (never import a fixture)," yet the actually-wired widgets (shell.jsx Stats/Todo/ToolGrid, helpfulLayover RICH_CONTENT/MATCH_DETAILS) ship hardcoded fixtures — the no-fixture principle lives only in the unused module; (c) `App.jsx` re-implements mobile chrome (burger/scrim/help toggle) that `PageTemplate` already builds; (d) `CrossColumn` (grid.jsx) implements the crosslinking right-rail and dispatches `ll:helpful:open`, but the app instead wires `helpfulNow.jsx` `HelpfulNow` for the same role — two components for the crosslinking column, only `HelpfulNow` wired. Several screens also carry dead imports of `Topbar`/`SectionHeader` they never render (`library.jsx`, `calendar.jsx`).

42. **Cross-screen coupling instead of shared components.** `review.jsx` and `match.jsx` both import `ToolHeader` from `src/screens/cvActivity.jsx` (a screen file) rather than a shared component module; `cvActivity.jsx` defines its own local `ToolHeader` instead of reusing `shell.jsx`'s exported `Topbar`; `coach.jsx` re-implements `CoachSidebar`/`CoachTopbar` (COACH_NAV_GROUPS/INDEX) that mirror `shell.jsx`'s `Sidebar`/`Topbar` (NAV_GROUPS/INDEX).

### L. Dead / stale fixtures superseded by the live path

43. **`strategyData.js` exports `LIVE_JOBS` (a 4-item hardcoded job fixture) that nothing imports.** The Home and Jobbsök screens use `useLiveJobSearch()` against the real external APIs instead; `LIVE_JOBS` is a stale/dead fixture superseded by the live path.

### UNVERIFIED

- **Writer prompt "verbatim port" (seam 17):** the sibling `JobSearch/CVs/generate-cover-letter.js` (15478 bytes) and `pipeline-job-search/cover_letter_prompt.md` (5031 bytes) both exist, but I did not diff their text against `writer/execute.cjs`'s SYSTEM string to confirm the port is truly verbatim.
- **Which English `cv_data.json` week-22 actually used (seam 7):** confirmed the two files differ and the "content-identical" comment is false, but the reconciled design left "which is canonical / week-22's" open; I could not confirm from code which file week-22 truly used or which is genuinely newer beyond the mtimes (both dated 2026-07-01 / earlier).
- **`gap-analyzer` code comment "deferred co-op-dialogue write-back" (reader note):** `execute.cjs:144-150` cites a §4 design path (typed `material[].ref`) the module never emits (it emits `{source}` only). I confirmed the code emits `{source}`; I did not open the specific `/docs` §4 the comment cites to confirm whether the doc still requires the typed `ref`, so the doc side of this self-described gap is unverified.
- **`job-ingest` → `linkedin-job-fetcher` enrich-mode sequencing (reader note):** `job-ingest/README.md` says fetch-first-then-merge / an "enrich existing" mode is NOT built, while `run-enrich.cjs`/`run-filter.cjs` invoke the fetcher with `{enrich:true}` and `linkedin-job-fetcher/execute.cjs` has an enrich path. I did not trace whether the README's "not built" claim is now stale vs the shipped enrich mode — flagged for reconciliation.
- **Whether the `research/` duplicates or `docs/*.bak2`/`RESUME.md.bak` are referenced anywhere:** they are all git-untracked (`git status ??`) and appear to be manual backups/copies; I did not grep every doc for inbound references, so "purely stale duplicate, referenced nowhere" is asserted only from content/naming, not an exhaustive reference search.

---

## Appendix - Consolidated UNVERIFIED flags

Every item below is something a reader could not confirm from the code alone. It is recorded here (rather than asserted) so the reconciliation knows what still needs a live check. Grouped by inventory area.

**cv-builder**
- Live-validation against a real Anthropic/Claude API — no smoke script, verify script, or committed run artifact found; all tests use a mock llm.completeJSON.
- Which env var supplies the LLM API key for the default claude-opus-4-8 model (not checked in this area; the LLM wiring lives in skeleton, out of scope here).
- Whether the model claude-opus-4-8 is a valid/current Anthropic model id in production use — only observed as the manifest default string.

**decoder**
- Live-data / real-API validation of the decoder: no smoke or verify script and no committed run artifact found. a1.test.cjs uses a mock LLM and its own comment says live niche-depth quality is verified separately (that separate verification was not located in server/).
- Which env var supplies the Anthropic API key for a real Opus 4.8 run (manifest sets model 'claude-opus-4-8'): the llm client is injected at the host layer; capabilities.cjs only checks the client object is present, so the key name is not visible in the decoder's own files.
- Whether the 'model' option is passed through to the actual client and honored (execute.cjs passes options.model to tools.llm.completeJSON, but the concrete llm client implementation in server/skeleton/clients was not inspected).

**echo-analyzer**
- No live-data validation exists or is applicable — echo-analyzer makes no external calls (only tools.request/store/ids); it never touches http/llm/search.
- Whether A2 (the real gap analyzer that replaces this stub) exists elsewhere — README §Status lists A2 as 'Next', and no non-stub analyzer was found in server/submodules/echo-analyzer/.

**echo-researcher**
- No live-data validation exists or is claimed — echo-researcher makes zero network/LLM calls; it writes a hardcoded literal. 'Validated against live data' is N/A, not merely unconfirmed.
- No standalone npm script, CLI runner, or HTTP endpoint targets echo-researcher directly; confirmed it appears in no package.json script. Only invocation path is via the skeleton host inside skeleton.test.cjs (brokered by echo-analyzer, or via runStandalone).

**gap-analyzer**
- Live/real-LLM validation: no smoke or verify script and no committed run artifact found that calls a real Anthropic API through gap-analyzer; both tests use a mocked LLM.
- Which Anthropic env var / key name the llm capability requires at runtime was not confirmed from the gap-analyzer files (it delegates to tools.llm assembled elsewhere).
- The 'coop-dialogue' material source and the typed material[].ref write-back are described in code comments as a DEFERRED co-op-dialogue write-back path (execute.cjs:144-150); no evidence it is implemented anywhere in this module.

**job-discovery**
- Live-data validation: no committed smoke/verify artifact was found proving a real run against jobtech/remotive/remoteok. The manual runner server/run-discovery.cjs is capable of hitting the real public APIs, but there is no npm test script or committed output confirming it was exercised against live data.
- The `input.profile` argument documented in the manifest/README is never read inside execute.cjs — the module is effectively schedule-agnostic and ignores its input. Whether any live scheduler (cron/launchd) actually invokes it is UNVERIFIED (README says the schedule is OS-level and out of scope; no such scheduler config found in this area).
- docs/candidate_preferences.json is described as local/uncommitted; its presence was not verified, so `npm run discover` may fail with 'Missing …' on a fresh checkout.

**job-ingest**
- README claim 'Validated against the real 78-row export: 76 jobs ingested, 0 errors' — no committed run artifact; the CSV docs/jobs-2026-06-29.csv is git-ignored and untracked, so live-data validation cannot be confirmed from the repo. Unit tests use a 4-row in-memory fixture only.
- No live LinkedIn/network call is made by job-ingest itself (it only parses a CSV string); any real-world mojibake/78-row behavior is UNVERIFIED from code.

**linkedin-job-fetcher**
- Live-data validation of the HTML selectors and rate-limit behavior: README asserts out-of-band success on real LinkedIn ids (14/15 and 15-sequential no-rate-limit), but no committed run artifact/log or in-repo live-hitting smoke test exists to confirm it. The two runner scripts (run-enrich.cjs/run-filter.cjs) would hit the live endpoint but require a local gitignored CSV and manual execution; no evidence they were run and no output is committed.
- Whether the module is ever invoked in the running app (dev-server) — only the host broker and the two manual runner scripts reference it; no HTTP route or scheduler wiring was found for it.
- Actual per-collection write scoping: capabilities.cjs notes store writes are coarse-grained (not scoped to declared `writes`) in the MVP, so the empty manifest `writes: []` is not enforced against the `jobs` write at runtime (based on the comment in makeScopedStore; not runtime-verified).

**researcher**
- Live validation against real Perplexity/Anthropic APIs: no committed run artifact found. verify-a1.cjs writes output only to /tmp/a1-<company>.json, so any past live run's output is not in the repo. Cannot confirm the module has actually been run against live data.
- Actual quality of 'niche depth' output — verify-a1.cjs is a manual eyeball script with no assertions; nothing in the codebase automatically checks niche-depth quality.
- README says 'Standalone (no broker): drills and dossiers work; the decoder summon is skipped.' The execute.cjs always calls tools.request('decoder', ...); in standalone mode host.cjs makes tools.request throw, so the code would return ok:false/partial (decoder summon surfaced as failed) rather than 'skipped'. Not tested in a1.test.cjs (all its tests use the full broker host). This standalone-skip behavior is UNVERIFIED against code.
- Whether the drill-mode second completeJSON call intentionally omits options.model (it does — falls back to the llm client default) is not asserted by any test.

**stage2-filter**
- README claim 'Validated live: 18 enriched bodies → 9 flagged (US_TIMEZONE, SALES_HEAVY...)' — no committed run artifact; the source data files (docs/candidate_preferences.json, docs/jobs-2026-06-29.csv) are gitignored/uncommitted, so this live run cannot be reproduced or confirmed from the repo.
- README lists reject codes INDUSTRY_FIT and SALARY_LOW as seeded defaults, but the test fixture (DEFAULT_STAGE2) has no INDUSTRY_FIT entry and SALARY_LOW has empty match[]. Actual seeded default patterns come from seed-filter-set.cjs (buildFilterSet), which was not read in this pass — the exact default pattern set per code is UNVERIFIED here.
- End-to-end behavior of run-filter.cjs (that stage2 receives enriched bodies) depends on linkedin-job-fetcher's live HTTP enrich succeeding; not exercised or confirmed in this pass.

**writer**
- Live-data validation: no smoke/verify script or committed run artifact exercises writer against the real Anthropic API; all tests mock tools.llm.completeJSON.
- Whether options.model 'claude-opus-4-8' is actually accepted by the live Anthropic endpoint was not verified (no live call made in tests); the model string is passed through from the manifest default.
- Actual end-to-end behavior of the gate-aware retry against a real model (whether a real model successfully rewrites without banned words on retry) is unverified — the retry path is only exercised with mocked LLM output in tests.

**skeleton-core**
- Live-data validation of the skeleton CORE (host/broker/registry/capabilities/isolation/ids/utils): UNVERIFIED. All 7 core files are exercised by unit tests only; every covering test injects mocked llm/search/http (e.g. a1.test.cjs mockSearch/makeMockLlm, and skeleton.test.cjs uses echo submodules). No smoke/verify script calls a real external API through the core in these tests. (README.md line 119 claims a submodule was 'live-verified on Curoflow', but that is a submodule-level claim, not evidence the core files were run against live data.)
- ids.cjs and utils.cjs have no test file named after them; ids.cjs has no dedicated unit test at all (only indirect assertions on id prefixes in a1.test.cjs). Claim that ids.cjs behaves exactly as described beyond prefix shape is UNVERIFIED by a direct test.
- Whether the load-time assertSubmodulesIsolated actually fires against a real violating on-disk submodule is UNVERIFIED at load time — the isolation test only unit-tests scanSource with inline strings and asserts the currently-shipped submodules are clean; no test introduces a violating file and boots the host to confirm the boot-time throw path.

**skeleton-services**
- Live-API behavior of clients/anthropic.cjs — no unit tests exist; only scripts/smoke-a2.cjs makes real calls and it is explicitly excluded from npm test. Whether it has actually been run successfully against the live model is UNVERIFIED.
- Live-API behavior of clients/perplexity.cjs — no test and no smoke script drives it; only server/verify-a1.cjs references PERPLEXITY_API_KEY. UNVERIFIED against live Perplexity API.
- bullet-judge.cjs live-LLM behavior — all 4 tests stub llm.completeJSON; the real claude-opus-4-8 JSON contract (canFill/bulletText/reason) is UNVERIFIED against the live model.
- The datafact `type` list emitted by ingest-cv.cjs was read from the mapper source; no test asserts every type is produced from a real cv_data.json, so full coverage of a real candidate file is UNVERIFIED.

**the-store**
- No `jobRules` collection is populated in code — it appears only in header comments/enumerations (index.cjs:43,107; capabilities.cjs:33), never in a live putRecord/getRecord call. Whether any code path writes jobRules is UNVERIFIED.
- 'cases' as a *collection name* (via putRecord) is never used — cases live in the dedicated `cases` Map with its own createCase/getCase API, not the generic collections map. The word 'cases' in the collections comment is illustrative only.
- A real/persistent DB backing is future intent only (index.cjs:25-26 says 'Swapping to Hello Lilly's real DB later'); no DB code exists today. UNVERIFIED whether/when it is implemented.
- Live-data validation of the store: not applicable/UNVERIFIED — the store is pure in-memory with no external calls, so all coverage is unit tests only.

**api-layer**
- Live-validation of POST /api/jobs/search against a real external job API (JobTech etc.): no smoke/verify script or committed run artifact found — job-search path has NO automated test at all.
- Whether the invoke ids 'gap-analyzer', 'cv-builder', 'writer' resolve to real registered submodules at runtime: the API passes these strings to host.invoke() but registration lives in the skeleton (outside this area); no manifest.json files exist under server/skeleton, so registration mechanism was not confirmed here.
- The GET /api/health 200 payload is never asserted by a test — api.test.cjs only asserts the case handler falls through (returns false) for that URL.
- Runtime behavior when ANTHROPIC_API_KEY is unset (llm=null) for the analyze/gap-answer/generate routes is inferred from code paths, not observed via a test.

**seeds-and-scripts**
- Whether cv_data.json exists in CI / on any machine other than this one — it exists here (37,707 bytes, mtime 2026-07-01) but is a sibling outside this repo's git, so its presence is machine-dependent.
- That the API host actually calls seedDatafacts() at startup — asserted by seed-datafacts.cjs comment; not verified by reading the host startup code in this task.
- Live/automated validation of discover, enrich, filter, verify:a1 against real external APIs — these are manual print/eyeball scripts; no automated live test or committed run artifact found.
- Whether the public job APIs (jobtech/remotive/remoteok) and LinkedIn guest-posting fetch actually succeed at runtime — code intent only, not exercised in this inventory.

**home.jsx**
- Whether the live JobTech (Platsbanken) browser fetch actually returns data in practice — no smoke/verify script or committed run artifact found; the code path is present but its live behavior is unconfirmed. Note the sibling app screen jobSearch.jsx documents Platsbanken as a React SPA that fails static scraping (per CLAUDE.md session logs), but that concerns the pipeline scraper, not this direct API call.
- Whether SectionHeader's `seeAll` prop (e.g. 'Visa alla' on the jobs section) wires to any navigation — home.jsx passes only a label string, no target; SectionHeader implementation not read.
- Whether the quick-action / foundation-tool `#id` hash anchors (e.g. #match, #cv, #letter, #interview, #library, #coach) all resolve to real routes — #jobbsok, #cv, #letter, #interview, #library, #coach, #match are LL_ROUTES keys (verified in App.jsx), but I did not cross-check every single NEXT_ACTIONS/FOUNDATION_TOOLS id.

**cvActivity.jsx**
- No test or run artifact confirms either component actually mounts/renders without error — asserted purely from reading source (no *.test.cjs matches cvActivity/CVBuilder/ActivityTracker).
- CSS classes referenced (cvbuilder-grid, cvpaper, atimeline, export, ring, voicewave, etc.) are assumed to be defined in a stylesheet outside this file; I did not read the CSS to confirm styles exist.
- The 'DEAD' classification for buttons is based on absence of onClick in this file; I did not check for global event delegation elsewhere (none observed, but not exhaustively grep-verified across the repo).

**coverLetter.jsx**
- Live-validation against any real cover-letter/LLM backend: N/A — the screen makes no network calls at all, so there is nothing to validate. UNVERIFIED whether any backend cover-letter endpoint exists elsewhere (none referenced from this screen).
- Behavior of `<a href="#review">`: classified PARTIAL from the static anchor; not runtime-verified whether the app's router reacts to the `#review` hash (App.jsx uses LL_ROUTES keyed by route, and 'review' is a TOOL_SPECS key but the anchor sets a URL hash, not the app route state).

**interview.jsx**
- Live-validation: N/A — screen makes no external/API calls, so there is nothing to validate against live data. UNVERIFIED that any of the displayed feedback/scores/questions could ever be dynamic (no code path exists today).
- Whether the file-upload input or 'Skapa intervjufrågor' button are wired anywhere else — confirmed NOT in this file; no other module was traced back into it, but a global handler cannot be fully excluded (none found via grep in this file).

**library.jsx**
- No unit tests exist for library.jsx (SharedLibrary/LibCard) — confirmed absent, so runtime rendering behavior is unverified by tests.
- The '320+ delade resurser' hero figure is a hardcoded string; whether it is intended to become dynamic is unknown (no code path exists for it).

**review.jsx**
- Sidebar navigation behavior (from shell.jsx) not assessed — out of area; the `active="letter"` prop is passed but its click/nav wiring lives in shell.jsx.
- Whether the CSS classes used (cmt, revdoc, revpin, cvpaper, reactbtn, etc.) are defined in a stylesheet — not checked; only the JSX/behavior of review.jsx was inspected.
- No live-data validation applies — the screen has no external data path to validate.

**studio.jsx**
- No test file references studio/ImageStudio/StudioResult (searched all *.test.cjs); this screen has no unit tests. Live-data validation is N/A because the screen makes no external/backend calls.

**coach.jsx**
- Whether the `#c-*` sidebar sub-nav routes render a ComingSoon vs a blank screen — App.jsx was only read at lines 19-48; the fallback branch for unknown routes (referenced at LL_ROUTES lookups near lines 67/76) was not fully read. Confirmed only that no `c-*` key exists in LL_ROUTES.
- No test file was searched for specifically for coach.jsx; per the task's test-runner scope (server/**/*.test.cjs, scripts/**/*.test.cjs) a frontend screen component like this is not covered by node --test — UNVERIFIED that any test exercises CoachWorkspace, and no live-data validation applies (screen reads only fixtures).

**match.jsx**
- Live-validation: N/A — the screen makes no external/backend call; it reads localStorage only. No smoke/verify artifact exists for it.
- Whether the 'Analysera' layover ever performs real analysis for other kinds: confirmed FAKE for kind 'job-analysis' (fixed MATCH_DETAILS fixture in helpfulLayover.jsx); not investigated for other layover kinds.
- Runtime behavior of the ll:jobs:changed / storage event sync not executed — inferred from code (match.jsx:13-21, jobStore.js writeJson dispatches ll:jobs:changed).

**calendar.jsx**
- Whether the DEAD buttons are intended to be wired later — the code has no handlers today; intent not inferable from code.
- Runtime appearance/CSS behavior of the grid classes (calgrid, calev, availcard, etc.) — CSS not inspected; only that the classNames are applied.

**community.jsx**
- Whether the CSS classes used (cm-search, cm-drop, fcard2, poll, cm-grid, wins, etc.) are defined anywhere — styling was not traced; only the component logic was read.
- Runtime behavior of the ⌘+K hotkey hint (line 55): it is displayed as a <kbd> visual hint only; no keyboard handler for ⌘K exists in this file, but a global handler elsewhere was not searched.

**jobSearch.jsx**
- No unit tests or smoke tests exist for jobSearch.jsx or its data chain (useLiveJobSearch, api/jobSearch, utils/jobStore, jobResultsList) — grep of *.test.cjs found zero references.
- Whether the three external endpoints (jobtechdev.se, remoteok.com, remotive.com) actually return data to the browser at runtime is UNVERIFIED — no committed run artifact or verify script calls them; classification of live fetches as WORKS is based on code wiring only, not an observed successful response. CORS behavior from the browser to remoteok.com/remotive.com is unverified.
- The `ll:helpful:open` overlay content for a job (what helpfulLayover.jsx renders for kind:'job') was not fully read; only confirmed a listener is registered.

**frontend-routing-app-shell**
- Whether any build tooling (Vite/webpack) resolves these JSX imports — build config not read; only src/main.jsx + src/App.jsx + shell.jsx + coach.jsx were inspected for this area.
- Runtime behavior (that hashchange actually renders correctly in a browser) — not executed; claims are from static code only.
- The full contents of the referenced screen components (home.jsx, cvActivity.jsx, etc.) — only their exported names as imported by App.jsx were confirmed.

**data-bridge-i18n**
- Whether the direct browser-side calls to jobtechdev.se / remoteok.com / remotive.com actually succeed at runtime (CORS acceptance, rate limits, key requirements) — no smoke/verify script or committed run artifact covers the browser fetch path; the only verify script (verify:a1 / server/verify-a1.cjs) is server-side, not this browser module.
- No unit tests found for src/api/jobSearch.js, src/hooks/useLiveJobSearch.js, or src/utils/jobStore.js — test runner globs server/**/*.test.cjs and scripts/**/*.test.cjs, which do not cover src/; these three modules are untested.

**shared-components-design-system**
- No unit tests exist for any shared component (primitives/shell/grid/helpfulLayover/helpfulNow/jobResultsList) — none referenced in server/ or scripts/ test dirs. Live/render validation UNVERIFIED; repo has no browser/JSX test harness.
- Whether grid.jsx (PageTemplate/ContentArea/ContentBox/Hero/CrossColumn/etc.) was ever wired and later abandoned, or never wired — code shows it currently has zero importers outside itself; history not checked.
- Runtime behavior of Sidebar auto-open, HelpfulLayover event flow, and JobResultsList jobStore sync is asserted from reading code only; not executed/observed.
- Visual/CSS correctness of the design system (classes like .ll-page, .ll-box, .tool, .coach) not verified — CSS file (src/styles/hello-lily.css) not read for this area.

**seams**
- Writer SYSTEM prompt 'verbatim port' from JobSearch/CVs/generate-cover-letter.js — sibling files exist (15478 / 5031 bytes) but I did not diff their text against writer/execute.cjs to confirm verbatim.
- Which of the two differing English cv_data.json copies week-22 actually used / which is genuinely canonical — confirmed they differ and the seed script's 'content-identical' comment is false, but could not confirm week-22 provenance from code.
- gap-analyzer execute.cjs:144-150 'deferred co-op-dialogue write-back' vs the cited /docs §4 — confirmed code emits {source} only, did not open the exact doc §4 to confirm the doc still mandates the typed material[].ref.
- job-ingest README claim that fetch-first-then-merge / 'enrich existing' mode is NOT built vs run-enrich.cjs/run-filter.cjs invoking the fetcher with {enrich:true} — did not trace whether the README is stale vs the shipped enrich mode.
- That the research/ duplicates and docs/*.bak2 / RESUME.md.bak are referenced nowhere — asserted from content/naming + git-untracked status, not an exhaustive inbound-reference grep across all docs.

