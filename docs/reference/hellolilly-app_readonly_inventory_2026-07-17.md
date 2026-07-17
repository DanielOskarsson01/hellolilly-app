# HelloLilly-app — Read-Only Inventory Report
*For the CV-engine planning thread. Evidence-based; every claim carries a command run or a file path read. No recommendations, no changes made. This session was 100% read-only.*
*Generated 2026-07-17 · repo HEAD `9b51f7c` (branch `main`)*

---

## 0. REPO STATE

**Phase 1 — repo discovery.** Searched via `mdfind -name hellolilly`, `mdfind "hellolilly-app"`, and `find` over `~/dev ~/Documents ~/Projects ~/Developer ~/code ~/Desktop`. Copies found:

| Path | Cloud-sync? | Verdict |
|---|---|---|
| `/Users/danieloskarsson/dev/hellolilly-app` | **No** | **CHOSEN** — healthy, remote verified |
| `/Users/danieloskarsson/Library/CloudStorage/Dropbox/Projects/hello lily - app` | Yes (Dropbox) | Dead per header — read `.git/config` as plain file only, ran zero git |
| `/Users/danieloskarsson/Library/CloudStorage/Dropbox/Projects/hello-lily-jobsearch` | Yes (Dropbox) | Different/older project, ignored |
| `/Users/danieloskarsson/Documents/Codex/2026-07-10/hellolilly-read-only-integration-audit-no` | No | Empty audit scratch dir (`outputs/`, `work/`), **no `.git`** — not a repo |

**Verify-first gate passed.** `cat /Users/danieloskarsson/dev/hellolilly-app/.git/config` → `url = https://github.com/DanielOskarsson01/hellolilly-app.git`. Matches `DanielOskarsson01/hellolilly-app`. Decision rule (a): exactly one healthy non-sync copy → proceeded on it.

**State** (`git -C /Users/danieloskarsson/dev/hellolilly-app …`):
- **Branch:** `main` (reporting, not switching)
- **HEAD:** `9b51f7c` — `docs(D21): amend no-scraping refusal, wire E3/F3 reach architecture, index brief`
- **Latest commit date:** 2026-07-16 13:52:44 +0200
- **Ahead/behind origin:** `0 0` vs `origin/main` (no fetch performed; used cached tracking ref). Working tree: only `M package-lock.json`.
- **Last 10 subjects** (`git log --oneline -10`):
  ```
  9b51f7c docs(D21): amend no-scraping refusal, wire E3/F3 reach architecture, index brief
  f8e5799 docs(D21): record D21 (coach network reach) + D10 amendment pointer
  f6570bd docs(D21): commit external enrichment brief as evidence
  dca2fcf docs(backlog): PDF as a first-class CV output (not only .docx)
  165920f Merge docs-wave1-canon: Wave 1 build brief canonised, North Star superseded, review records (D19/D20)
  897e07c docs: canonise Wave 1 build brief, supersede North Star, add review records
  c917755 Merge docs-north-star-integration: North Star + walkthrough as docs of record, D14-D18
  cc20483 docs(backlog): CV-builder accumulation brief + orphan-datafact sweep + Rolldown arch mismatch
  47be32f docs(master-plan): current state — Wave A done, walkthrough + fixes merged
  c9691ed docs(decisions): add D14-D18, short entries pointing to NORTH_STAR
  ```
  *Note: the last 10 commits are all `docs(...)`. The codebase itself is ahead of where several of those docs describe it (see §1 doc-drift).*

---

## 1. STACK AND LAYOUT

**Stack:** React 19 + Vite 8 SPA on the frontend; a hand-rolled `node:http` dev server on the backend, with Vite in middleware mode (same process). Node ≥22.9. **No framework beyond React/Vite** — `package.json` deps are exactly `@vitejs/plugin-react`, `vite`, `react`, `react-dom` (`package.json:18-24`). `devDependencies: {}`.

**Top-level layout** (`ls /Users/danieloskarsson/dev/hellolilly-app`):
```
src/         React frontend (screens, components, hooks, lib, api)
server/      backend: dev-server.cjs + skeleton/ + submodules/ + data/store.db
scripts/     seed-datafacts.cjs, repair-datafacts.cjs, run-* helpers
docs/        ~40 planning/decision docs (ARCH_RULES, MASTER_PLAN, NORTH_STAR, RETROFIT_LEDGER…)
data/        cv_data.json (the source CV)
design/      wireframes
index.html, vite.config.js, package.json, CLAUDE.md
```

**Entry chains:**
- Frontend: `index.html:9-10` (`<div id="root">` + `src/main.jsx`) → `src/main.jsx:6` (`createRoot(...).render(<App/>)`) → `src/App.jsx:66-148`.
- Backend: `server/dev-server.cjs:536` (`if (require.main === module) start()`); `start()` at `:462-527` builds Vite middleware + `http.createServer`. Launched via `npm run dev` (`package.json` → `node server/dev-server.cjs`).

**Routing:** hand-rolled hash routing, **no router library**. `src/App.jsx:39-42` (`getRoute()` reads `location.hash`), `:66-80` (`useState` + `hashchange` listener). Route table `LL_ROUTES` (`App.jsx:21-37`) = **15 routes**; unknown routes fall to `<ComingSoon>`. Nav tree `NAV_GROUPS` (`src/components/shell.jsx:9-64`) advertises ~40 items, most unrouted.

**SQLite schema location:** the *only* DDL in the repo is runtime `CREATE TABLE IF NOT EXISTS` in `server/skeleton/store/sqlite.cjs:33-41` (verified by direct read). No `.sql` files anywhere (`find *.sql` = none). Uses Node's built-in `node:sqlite` `DatabaseSync`, WAL mode. Four tables:
```sql
meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)
cases (id TEXT PRIMARY KEY, data TEXT NOT NULL)
datafacts (id TEXT PRIMARY KEY, data TEXT NOT NULL)
collection_records (name TEXT, id TEXT, data TEXT, PRIMARY KEY(name,id))
```
Every business table is a **`{id → JSON blob}` schemaless store** (one `data TEXT` column). Live DB `server/data/store.db`: 8 cases, 144 datafacts, 128 collection_records, meta=1.

**Migration mechanism: NONE.** `SCHEMA_VERSION = 1` is stamped into `meta` (`sqlite.cjs:25,42`) but nothing reads it to branch; no numbered migration dir, no `ALTER TABLE`, no up/down runner. Schema evolution relies on `CREATE TABLE IF NOT EXISTS` + the schemaless `data TEXT` blob absorbing new JSON keys. A separate one-time JSON→SQLite import exists (`server/store-bootstrap.cjs:37-63`) but that moves data between adapters, it does not version schema.

**Doc drift (flagged):** `REPO_FINDINGS_SCRATCH.md` (dated 2026-07-07) and `docs/PROJECT_INVENTORY.md` (2026-07-02, carries its own 07-03 errata) describe an *earlier* app. Their architecture description (broker-mediated submodules behind a node:http server; React+Vite hash SPA) matches code, but current-state specifics are **stale**: PROJECT_INVENTORY claims "no `/api/...` call exists in the frontend" and "store is 100% in-memory" — both **contradicted** by code (`src/hooks/useCase.js` → `src/api/caseApi.js` call real routes; store defaults to durable SQLite, `dev-server.cjs:476`). Treat the docs as history, not current truth.

---

## 2. CV-BYGGAREN

**Route/component:** `cv` → `CVBuilder` in `src/screens/cvActivity.jsx` (`App.jsx:23`). Server submodule: `server/submodules/cv-builder/{execute.cjs,manifest.cjs}`.

**What it does today: AI-assisted *selection*, never authoring. The manual intake form exists in the UI but is inert (disabled stub).**
- The submodule is an LLM that **selects datafact ids into sections** and is forbidden to write prose — `cv-builder/execute.cjs:3-5`:
  > `You assemble a tailored CV by SELECTING which candidate datafacts belong in each section. You do NOT write, paraphrase, or invent any CV text — you only choose ids. Output STRICT JSON: { "sections": [{ "key", "heading", "datafactIds": [] }] }`
- Manifest: `reads: ['meta','decodedRole','fit'], writes: ['cvDraft']` (`manifest.cjs:4-8`).
- Frontend is a preview + disabled "Kommer" (coming) controls: the manual "add building block" form is fully `disabled` (`cvActivity.jsx:92-127`, comment: *"No addFact call, no datafact-mint engine — deferred"*); per-section "Improve wording / Add keywords" is disabled (`:57-64`). The only live control is **Generera/Uppdatera CV** → `actions.generate()` (`:241`).

**Where CV data is written + shape:** persisted server-side via `writePart(caseId, 'cvDraft', cvDraft)` (`cv-builder/execute.cjs:40`). Shape (`:33-40`):
```
{ language, sections: [ { key, heading, items: [ { datafactRef: {kind:'datafact', id}, text } ] } ] }
```
This is **not** a table of columns — it is a JSON blob inside a status envelope on the case row (`server/skeleton/contract/case.cjs:60-65`, `setPartData` → `envelope('ready', data)`), physically one `INSERT OR REPLACE` on `cases` (`sqlite.cjs:45`).

**Save path trace:** `cvActivity.jsx:241` (click) → `useCase.js:77` `generate` → `caseApi.js:61` `POST /api/case/:id/generate` → `dev-server.cjs:321-323` loops `host.invoke('cv-builder')` then `host.invoke('writer')` → `writePart`. A second in-place edit path exists: `POST /cv/align-keyword` → `keyword-judge.cjs:132-136` (reversible, stores `priorText`, keeps `datafactRef`).

**Versioning of CVs: ABSENT.** Every write **replaces** the prior `cvDraft`; only a single `updatedAt` survives (`case.cjs:62` overwrites the envelope; sqlite `INSERT OR REPLACE`). No history/revision table (grep of `sqlite.cjs` for `history|version|revision` → only `schema_version`). The UI "Ny version för annan roll" switcher is a disabled stub (`cvActivity.jsx:194-202`, "Kommer").

**Do CV bullets cite the fact IDs they rest on? EXISTS in data / PARTIAL at runtime.** Each item carries `datafactRef: {kind:'datafact', id}` (`execute.cjs:36`), and the store enforces a ref-scoped honesty exemption keyed on exactly those refs (`store/index.cjs:57-59`). **Caveat:** the live datafact pool is empty *for the CV screen this wave*, so refs don't resolve in the UI and it shows a generic "Från ditt CV" chip (`cvActivity.jsx:31,44-49`). So the citation linkage is real in the persisted shape; user-visible resolution to a named fact is not active this wave.

---

## 3. DATAFACTS

**A dedicated career-fact ledger EXISTS** — a `datafacts` table with a host-only write path, separate from cases and from generic collections.

**Fact shape** the mapper produces (`server/skeleton/datafacts/ingest-cv.cjs:10-12`, verified by direct read):
```js
function df(type, text, tags, language) {
  return { id: mintId('datafact'), kind: 'datafact', type, text: String(text).trim(), tags: tags.filter(Boolean), language };
}
```
Fields: **id, kind, type, text (verbatim), tags[], language.** That is the entire authored shape.

**Verified/unverified state: ABSENT.** No `verified`/`unverified`/`status` field on any datafact (grep across `server/skeleton/datafacts`, `store`, `seed-datafacts.cjs` → the only hit is an unrelated code comment). Facts are treated as trusted evidence unconditionally — the code comment at `ingest-cv.cjs:2-4` calls them "evidence, never authored prose."

**Source/provenance (spans, doc id, offsets): ABSENT.** No fact carries a source span, document id, char offsets, or a link to the CV file+location it came from. Partial/adjacent signals:
- 25 competency rows in the *live DB* carry an extra `category: {id,title,group,source:"COMPETENCY_MASTER_POOL.json"}` object — but that names a *grouping pool*, not the CV document, and the **current mapper cannot regenerate it** (grep `category` in `data/cv_data.json` = 0; `ingest-cv.cjs` never sets it). A wipe-and-reseed today would silently drop it. ⚠️ live-DB-vs-code divergence.
- `fill-gap` facts (11 in DB) carry `tags:['addresses:<requirementId>']` only.
- The *only* fact↔document linkage is the **reverse** direction: a case points *to* a fact via `evidenceRef: {kind:'datafact', id}` (`bullet-judge.cjs:94`; gap `material[].ref`). Facts themselves point to no source.

**What creates facts:**
- Bulk seed at boot: `scripts/seed-datafacts.cjs:19-31` reads `data/cv_data.json` → `cvDataToDatafacts` → `store.ingestDatafact(f)`, only into an empty pool (`store-bootstrap.cjs:70-74`).
- Runtime mint: `fill-gap/bullet-judge.cjs:80-88` mints `type:'fill-gap'` facts when a user answer passes the judge.
- Write method: `store/index.cjs:204-208` `ingestDatafact` — **host-level only, NOT on `tools.store`, gate-exempt by design** (`store/index.cjs:19-23`).

**What reads facts:** read-only `tools.datalayer` capability (`capabilities.cjs:80-85`: `listDatafacts`, `getDatafact`). Consumers: `cv-builder`, `writer`, `gap-analyzer` (all `.filter(f => f.language===language)`), `keyword-judge`, plus a count endpoint in `dev-server.cjs`.

**Storage:** `datafacts (id TEXT PRIMARY KEY, data TEXT)` — one JSON blob per fact; in-memory `Map` is the truth, SQLite a write-through shadow (`store/index.cjs:42`, `sqlite.cjs:36`).

---

## 4. MATCHANALYS

**Full path:** approve job → (manual) research (`researcher`) → decode role (`decoder`, "A1") → gap analysis (`gap-analyzer`, "A2") → writes `fit` + `gaps` parts → `match.jsx` renders and **computes the displayed %**. All LLM work is server-side in submodules.

**What is sent to the model:** structured records exist (requirements + datafacts each have ids) but the payload is **flattened to a single free-text prompt** with ids embedded so the model can cite by id — `gap-analyzer/execute.cjs:77`:
```
`REQUIREMENTS:\n${decoded.requirements.map(r => `- (${r.id}) ${r.requirement}`).join('\n')}`
`CANDIDATE DATAFACTS (cite the supporting one by its exact id):\n${pool.map(f => `- (${f.id}) ${f.text}`).join('\n')}`
```

**Where the LLM is called:** `gap-analyzer/execute.cjs:91` (`tools.llm.completeJSON`), model `claude-opus-4-8` (`manifest.cjs:11`). Decoder at `decoder/execute.cjs:54`, same model.

**What comes back:** per-requirement `{requirementId, datafactId|null, status: match|partial|missing}` + `gaps[]` (`execute.cjs:30-50`). **There is no `score` field in the model's output anywhere.**

**How the score is produced — KEY FINDING: neither the model nor the server emits a score; the number is a FRONTEND-COMPUTED match-ratio, and the underlying `status` is server-enforced.** Verified by direct read:
- Server never writes a score (grep `\bscore\b` across `server/submodules` + `server/skeleton` = nothing). The model owns only `status`, and even that is clamped + honesty-downgraded server-side — `gap-analyzer/execute.cjs:114-116`:
  ```js
  const allowed = new Set(['match','partial','missing']);
  let status = allowed.has(r.status) ? r.status : 'missing';
  if (status === 'match' && !cited) status = 'partial';   // unverifiable cite → downgrade
  ```
  (a "match" survives only if its `datafactId` resolves to a real fact in the pool).
- The % is computed in the screen — `match.jsx:628-631`:
  ```js
  const scoreVal = fit && fit.score != null ? fit.score
    : (capReqs.length ? Math.round((matches.length / capReqs.length) * 100) : 0);
  ```
  Since `fit.score` is never set server-side, the live path is **always** `matches.length / capReqs.length * 100`, where `matches = capReqs.filter(r => r.status === 'match')`.

  **Net: the number is client-side, computed from code-verified statuses. It matches the target's "server never owns the number" spirit only partially — today the *ratio* is computed in the browser, not the server, though the verifiable inputs (statuses) are server-enforced.**

**Requirement extraction:** EXISTS — `decoder/execute.cjs:54-75` extracts 6-12 weighted requirements `[{id, requirement, rationale, weight}]` into `decodedRole`.

**User review of extracted requirements: ABSENT.** No UI mutates `decodedRole.requirements`. The screen only reads them for labels (`match.jsx:623-625`). The one in-screen "Ändra" edits per-match *evidence* and is **local-only, not persisted** (`match.jsx:22` comment; state never POSTed).

**Per-requirement evidence classification:** EXISTS and server-verified (the cite-by-id honesty rule above, `execute.cjs:111-122`).

**How results are stored:** case-parts JSON envelopes on the single case row (not a per-requirement table). `gap-analyzer/execute.cjs:168-169` writes `fit` and `gaps` parts. `fit.data = {capability:{requirements:[{requirementRef, evidence, status, evidenceRef?}], overall}, preference:{narrative}}`.

**Background-analysis-on-Godkänn flow: ABSENT.** Approving a job only records the decision + logs `job_approved` (`dev-server.cjs:162-171`); no `host.invoke` there. Analysis runs only when the user clicks **Analysera** (`match.jsx:446-457` `runAnalysis`). Grep for `background`/`auto-analy`/`on-approve` triggers → none. (The `writer` submodule's "Background generator" comment refers to the foreground `/generate` route, not an approve-triggered job.)

---

## 5. PERSONLIGT BREV

**Route/component:** `letter` → `CoverLetter` (`src/screens/coverLetter.jsx`). Submodule: `server/submodules/writer/{execute.cjs,manifest.cjs}`.

**Grounding: prompt-level only. No data-level link — output paragraphs carry no fact references.**
- Manifest: `reads: ['meta','fit','gaps'], writes: ['coverLetter']` (`writer/manifest.cjs:2-9`). Note it does **not** read `cvDraft`.
- The writer's own comment confirms un-referenced prose — `writer/execute.cjs:4-7`: *"The paragraphs are AUTHORED PROSE with no datafact refs, so the writing-rules gate runs in full on writePart."*

**Context the letter receives** (`writer/execute.cjs:80-89`): job meta (role/company) + matched-requirement evidence from `fit` + gap one-liners from `gaps` + **the full datafact pool as plain bullet text** (`CANDIDATE FACTS (use ONLY these):\n${pool.map(f => `- ${f.text}`)}`). The facts enter **stripped of their ids** — so grounding is an instruction ("use ONLY these"), not a traceable link.

**Link back to CV data / fact ledger:** the fact ledger *is* an input (`pool = tools.datalayer.listDatafacts()`, `:82`), but as untraceable text; there is **no link to `cvDraft`** and **no fact-id citation** in the output. Letter shape: `{language, paragraphs[], unsupported_by_cv[]}` (`:104-108`) — no `datafactRef` fields.

**LLM call:** `writer/execute.cjs:94-102` `tools.llm.completeJSON`, model `claude-opus-4-8`, `maxTokens:1500`. The only "support" signal is `unsupported_by_cv[]` — **the generator grading itself**, not an independent check.

---

## 6. INNAN DU SKICKAR

**Route/component:** `innan-du-skickar` → `InnanDuSkickar` (`src/screens/presend.jsx`). It runs four pure, no-LLM reads and is **display-only** — `presend.jsx:444`: *"Before you send doesn't track sent applications and doesn't send for you"*; `:90`: *"nothing blocking."* There is no send/submit button on the screen.

**The four checks — all WARN, none BLOCK:**
1. **Requirement coverage** (`presendCoverage.mjs:16-19`) — set-intersection of fit `evidenceRef.id` vs CV `datafactRef.id`; renders a bar + tags. Blocks nothing.
2. **Keyword alignment** (`presendKeywords.mjs:12-20`) — extracts the ad's quoted phrases + ALLCAPS acronyms absent from the CV; offers a one-click honesty-guarded CV edit. Blocks nothing.
3. **Cover-letter fit** (`presendLetterFit.mjs:4-9`) — surfaces the letter's self-declared `unsupported_by_cv`; per-requirement `addressed` is **hard-coded `null`** (never computed; comment: *"A real paragraph→requirement read is a logged follow-up"*). Warn only.
4. **Send-readiness** (`presendReadiness.mjs:8-15`) — qualitative tone `work|almost|ready`, never a number; drives banner copy only.

**Does anything block export?** The **only hard block in the whole system** is the deterministic **writing-rules gate** — and it checks *banned AI-speak phrases*, not claim support. `writing-rules/gate.cjs:48-52` `enforce()` throws `WritingRuleError` at `store.writePart`, blocking *persistence* of a generated/saved letter containing a banned phrase (`rules.cjs:8-15`: `leveraged, spearheaded, hit the ground running…`). It has no notion of whether a claim is fact-backed.

**Export is NOT gated.** On the letter screen, "Ladda ner PDF" (Download) has no `disabled` prop and always fires (`coverLetter.jsx:393`, verified). Only the "Klar/Done" button is gated (`disabled={unresolvedFlags > 0}`, `:392`) and that merely sets a localStorage review flag.

**Independent validation pass that blocks export of unsupported claims: ABSENT.** The closest mechanism (`unsupported_by_cv`) is the generator's self-report (PARTIAL as a surfacing device), blocks nothing, and is advisory.

---

## 7. AI CALL ARCHITECTURE

**Where calls happen: SERVER-SIDE ONLY.** Two clients (`server/skeleton/clients/anthropic.cjs`, `perplexity.cjs`) read keys from server env (`host.cjs:23-28`), injected into submodules least-privilege via `broker.cjs:64-73` → `capabilities.cjs:69-76` (a submodule gets `tools.llm` only if its manifest declares it). Grep of `src/` for `anthropic|claude-|messages.create` = **zero hits**. Browser reaches the model only via same-origin `POST /api/case/:id/{research,analyze,generate}`.

**Model ids:** `claude-opus-4-8` everywhere (`anthropic.cjs:9` DEFAULT_MODEL; hardcoded in `bullet-judge.cjs:19`, `keyword-judge.cjs:43`; in the `options` of decoder/gap-analyzer/writer/cv-builder/researcher manifests). Perplexity `sonar` for search. No sonnet/haiku. *(Standing note: validate Anthropic ids live before use — `opus-4-8` is the one this repo depends on.)* `temperature` is deliberately never sent (`anthropic.cjs:16`).

**Prompt storage:** inline template literals in each submodule's `execute.cjs` (`const SYSTEM = \`…\``), user prompt by string interpolation, model id in `manifest.cjs`. No prompt files, no templates, no DB. Example: `writer/execute.cjs:16-71` (~55-line prompt).

**Output schema validation: PARTIAL.** No schema library (no ajv/zod/joi), no tool-use/`response_format` forcing. What exists: a tolerant JSON parser (`utils.cjs:16-29`, regex/brace fallback) + **one corrective retry** (`anthropic.cjs:58-72` — "Your previous reply was not valid JSON…") + hand-rolled per-caller coercion/clamping (e.g. the status enum clamp in `gap-analyzer:114-116`). Note: `docs/HELLOLILLY_ARCH_RULES.md:35` claims "Model output is schema-validated before anything renders" — **not implemented as a schema**, only the ad hoc coercion.

**Injection envelope / provenance tagging (D12): ABSENT in code, documented-but-deferred.** "D12" is a doc standard (`docs/HELLOLILLY_ARCH_RULES.md` Rule 2, lines 29-41) mandating a single prompt-assembly module, source-tagged envelopes around untrusted content, and transitive provenance. None exists: untrusted content is concatenated raw with plain labels (`decoder/execute.cjs:59-61` pastes `meta.sourceInput` directly; `researcher/execute.cjs:96-99` interpolates Perplexity text raw). The only "provenance" in code is a literal author string (`gap-analyzer/execute.cjs:159` `provenance: 'gap-analyzer'`). `docs/RETROFIT_LEDGER.md:9-12` itself lists these paths as "not yet enveloped, retrofit at next touch."

**Maker/checker separation: PARTIAL.** Independent LLM *checkers* exist only on the fill-gap user-input path — `bullet-judge.cjs:16-27` (`judgeAnswer` → `canFill`) and `keyword-judge.cjs:37-48` (`judgeRelatedness`). The prose *makers* (writer, gap-analyzer, decoder, researcher) have **no independent checker** — they self-correct by re-calling the *same* model on a `WritingRuleError`. The relied-upon fit verdict has no checker; `ARCH_RULES.md` Rule 3 mandates one, `RETROFIT_LEDGER.md:11` marks it unmet.

**Eval fixtures / golden tests: ABSENT.** 42 `*.test.*` files exist but all **stub the LLM** with canned returns and test orchestration, not output quality (e.g. `api.test.cjs:28` injects a fake `completeJSON`). No eval/golden/fixture dirs. `verify-a1.cjs` is a manual eyeball harness. `ARCH_RULES.md` Rule 4 mandates a corpus; it is unbuilt.

**Orchestration:** `broker.cjs` is the single switchboard — `invoke` → `dispatch` enforces cycle/depth/budget/circuit guards, builds least-privilege `tools`, runs `entry.execute`. `host.cjs:49-64` auto-registers any `server/submodules/*/` folder with both `manifest.cjs` + `execute.cjs`, after `assertSubmodulesIsolated` fail-closes on cross-module imports.

---

## 8. COLLECTIONS (D5)

**The generic named-collection mechanism EXISTS.** Store API (`store/index.cjs:149-169`): `putRecord(collection, record)` / `getRecord` / `listRecords` / `removeRecord` — a record is any object with an `id`, upserted into a per-name Map, **deliberately NOT writing-gated** (`index.cjs:140-148` header: imported/structured records, not authored prose). Backed by `collection_records(name, id, data, PK(name,id))`.

**HTTP API** (`dev-server.cjs:122-143`): `GET /api/collection/:name` → `{ok, records}`; `POST /api/collection/:name` (body needs `id`) → `{ok, record}` (`activity` → 405); `DELETE /api/collection/:name/:id`. Client: `src/api/collectionApi.js`, hook `src/hooks/useCollection.js` (returns `{records, status, error, reload}`, refetches on `ll:collection:changed`). Live collections: `activity` (92, append-only log), `filterSet` (1), `jobs` (35). **None hold career facts.**

**Could a fact ledger be hosted in collections? Structurally yes; by current design, no — facts already have their own dedicated table + methods, and that separation is load-bearing.**
- Physically identical row shape (`{id,…}→JSON data TEXT`), so a fact is a valid collection record, and adding `verified`/provenance fields needs **no DDL/migration** (the live `category` object rides along freely — proof the schemaless blob absorbs new keys).
- **But** facts are kept separate deliberately: `ingestDatafact` is **host-only + gate-exempt** and NOT reachable via `/api/collection` (which is submodule- and client-writable). Hosting facts in a generic collection would expose evidence to client/submodule writes — the exact thing the two-path design forbids. And the writing-gate's honesty exemption resolves `{kind:'datafact', id}` refs specifically against the `datafacts` map (`index.cjs:54-64`), keyed to the dedicated store.
- **Bottom line for the plan:** the ledger has dedicated tables/methods today (`datafacts` + `ingestDatafact`/`getDatafact`/`listDatafacts`). Extending it with verified/unverified state and source-span provenance is a **JSON-shape change on the existing table — no new table and no migration machinery required (and none exists to invoke).**

---

## 9. EXPORT

**CV export: ABSENT.** No working CV export exists. The three download-looking buttons are **dead (no `onClick`)**: `cvActivity.jsx:369` ("Exportera rapport"), `cvActivity.jsx:380` ("Hämta som PDF"), `review.jsx:41` ("Ladda ner"). Grep for `exportCv|downloadCv|cvPdf|resume` → no CV export function anywhere.

**The only working export = COVER LETTER, client-side HTML blob, no library, mislabeled "PDF":**
- `coverLetter.jsx:68-73` `downloadLetter()` builds a `new Blob(['<!doctype html>…'], {type:'text/html'})` + `URL.createObjectURL` + anchor click, filename `Brev_<company>.html`.
- Button labelled "Ladda ner PDF" but emits **`.html`** (`coverLetter.jsx:393`, verified). Duplicated in `helpfulLayover.jsx:450-467`.
- **Format:** `.html`. **Side:** entirely client-side. **Library:** none (no `docx`/`jspdf`/`pdf-lib` in deps; no dynamic import/CDN). **Parseability check on the exported file: ABSENT** — blob is created and clicked with no validation/round-trip.

*(Context: commit `dca2fcf` "docs(backlog): PDF as a first-class CV output (not only .docx)" shows real PDF/DOCX export is a planned, not-yet-built item.)*

---

## 10. GAPS VS TARGET

The six target capabilities, each with a verdict and file-path evidence.

| # | Target capability | Verdict | Evidence |
|---|---|---|---|
| **(a)** | Career fact ledger where every fact carries **source spans** and a **verified/unverified state** | **PARTIAL** | A dedicated `datafacts` ledger EXISTS (`sqlite.cjs:36`; `ingest-cv.cjs:10-12`) with host-only gate-exempt writes (`store/index.cjs:204-208`). But fact shape is `{id,kind,type,text,tags,language}` — **no verified/unverified field and no source span/doc-id/offset** (grep confirms absent). Facts are pointed-*to* by cases, but carry no back-link to the CV document they came from. |
| **(b)** | Job-requirement extraction **with user review** | **PARTIAL** | Extraction EXISTS (`decoder/execute.cjs:54-75`, weighted `requirements[]`). **User review/edit is ABSENT** — no UI persists changes to `decodedRole.requirements`; the one editable field is per-match evidence and is local-only (`match.jsx:22`). |
| **(c)** | Evidence classification per requirement with a **server-computed score (model never owns the number)** | **PARTIAL** | Per-requirement classification EXISTS and is server-honesty-enforced (`gap-analyzer/execute.cjs:111-122`); the model does NOT emit a score. **But the number is not server-computed either — it's a FRONTEND ratio** `matches/total*100` (`match.jsx:628-631`), with `fit.score` never set server-side. Inputs are server-verified; the arithmetic lives in the browser. |
| **(d)** | Generation where every CV bullet **cites the fact IDs** it rests on | **PARTIAL (CV) / ABSENT (letter)** | CV: each `cvDraft` item carries `datafactRef:{kind:'datafact',id}` (`cv-builder/execute.cjs:36`) and a store-level ref exemption (`store/index.cjs:57-59`) — real in data, but unresolved in UI this wave (empty pool, `cvActivity.jsx:31`). Letter: paragraphs are authored prose with **no fact refs** (`writer/execute.cjs:6`); facts enter the prompt id-stripped. |
| **(e)** | Independent **validation pass that blocks export** of unsupported claims | **ABSENT** | Only hard block is the deterministic **banned-phrase** writing gate (`gate.cjs:48-52`, `rules.cjs:8-15`) — checks AI-speak, not claim support, and fires at `writePart`, not export. The only claim signal (`unsupported_by_cv`) is the generator's self-report and blocks nothing (`writer/execute.cjs:107`). Export button is ungated (`coverLetter.jsx:393`). No independent validator exists. |
| **(f)** | **Parseability check** on exported files | **ABSENT** | No CV export exists at all (dead buttons, `cvActivity.jsx:369,380`). The one working export (cover letter) is an unchecked client-side HTML blob (`coverLetter.jsx:68-73`), no validation/round-trip. |

**One-line orientation for the plan:** the *architecture* to build on is real and clean (server-only model access, least-privilege broker, a dedicated gate-exempt fact ledger, a case-parts store, ref-based CV provenance already in the data shape) — but the six provenance-first guarantees are mostly **PARTIAL or ABSENT**, and critically, the four D12-class guarantees (injection envelope, transitive provenance, output-schema validation, maker/checker-for-verdicts, eval corpus) are **written as standing law in `docs/HELLOLILLY_ARCH_RULES.md` but sit unimplemented on `docs/RETROFIT_LEDGER.md`**. The schemaless `data TEXT` blob means extending facts with verified-state + source-spans needs no migration machinery (and none exists). Two divergences to watch: the live DB holds a `category` field the current mapper can't regenerate (reseed drops it), and the planning docs (`PROJECT_INVENTORY.md`, `REPO_FINDINGS_SCRATCH.md`) describe an app the code has already outrun.
