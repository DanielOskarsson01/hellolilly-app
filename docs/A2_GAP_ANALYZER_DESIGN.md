# A2 Gap Analyzer + Fill-Gap Loop — Design Spec

**Date:** 2026-06-29
**Status:** Draft for review
**Scope:** HelloLilly A2 (Gap Analyzer) submodule, the cover-letter `writer` submodule, the seed datafact pool, the gap-fill write-back loop, and the front-end analysis screen.

---

## 1. Purpose

Turn A1's decoded job requirements into an honest, on-screen fit analysis, and add a human-in-the-loop loop that resolves gaps and **compounds the candidate's reusable evidence pool** with every job processed.

This replaces the week-22 OnlyiGaming CV pipeline (file-based, no decode step, no front-end, no write-back) with a HelloLilly-native version that reuses the proven *prompts and content* from week 22 but is rebuilt on the HelloLilly framework.

---

## 2. Current state (verified 2026-06-29)

| Piece | State |
|---|---|
| A0 skeleton (host, broker, store, writing-rules gate) | ✅ built + tested |
| A1 `decoder` + `researcher` | ✅ built, live on real jobs; decoder produces `decodedRole` (true weighted requirements) |
| A2 analyzer | ⚠️ stub only (`echo-analyzer` writes a placeholder `gaps`; no real `fit`) |
| `fit` / `gaps` data shapes | ✅ defined in `DATA_CONTRACT.md` v0.2 |
| Front-end | ⚠️ shell exists (`src/screens/match.jsx`, etc.) on demo data; not wired to real A2 |
| Seed datafact pool / write-back | ❌ does not exist anywhere yet |

**Reusable from week 22 (copy, do not import):** the 5-layer analysis prompt + honesty rules; the cover-letter system prompt (incl. the ComeOn/MrGreen accuracy guardrails); `cv_data.json` + the variant bullets as seed content. The execution glue is **not** reused — HelloLilly's framework forbids cross-imports (load-time scanner) and uses a different tool API (`tools.llm.completeJSON` vs `tools.ai.complete`), manifest shape, and I/O model.

---

## 3. Reuse strategy

- **Scaffold by cloning the live `decoder` submodule**, not the content-pipeline modules. The decoder is already framework-correct and wired to HelloLilly's Anthropic client + API key (`server/skeleton/clients/anthropic.cjs`, key in HelloLilly `.env`). Cloning it gives the AI call + key + manifest/store plumbing for free.
- **Brains = ported week-22 prompts.** Drop the 5-layer analysis prompt into A2; the cover-letter prompt into `writer`.
- **Seed content = `cv_data.json` + variant bullets**, ingested as datafacts.

---

## 4. Architecture

### 4.1 Backend submodules

**`gap-analyzer` (A2)** — cloned from `decoder/`:
- `manifest.cjs`: `reads: ['meta','decodedRole']`, `writes: ['fit','gaps']`, `capabilities: ['store','logger','llm','utils','datalayer']`, `options: { model: 'claude-opus-4-8' }`.
- `execute.cjs(input, options, tools)`:
  1. read `meta` + `decodedRole.requirements[]`
  2. read candidate datafacts (the seed pool) via the new `datalayer` read capability
  3. read `candidate_preferences.json` (preference fit input)
  4. one `tools.llm.completeJSON()` call with the ported 5-layer prompt → per-requirement match + preference narrative + gaps with bridges
  5. mint `gap_`/`bridge_` ids via `tools.ids.mintId()` (deterministic)
  6. `tools.store.writePart(caseId,'fit',...)` + `writePart(caseId,'gaps',...)` (writing-rules gate runs automatically; datafact-verbatim evidence is exempt)
  7. on error: `setPartStatus(...,'failed', err)` and rethrow (surface, never swallow)

**`writer`** — cloned from `decoder/`, ported cover-letter prompt. Reads `meta` + `fit` + `gaps` + the CV datafacts; writes a cover-letter part (or `prep`-adjacent part — exact part name decided in the plan). Uses `fit`/`gaps` as a selection guide exactly as week 22 did (must-haves decide what to lead with; gaps decide the honest "bridge" paragraph; `unsupported_by_cv[]` surfaces fabrication risks).

**`cv-builder`** — cloned from `decoder/`, ported from the week-22 `job-analyzer`/`cv-generator` selection logic. Reads `meta` + `decodedRole` + `fit` + the **datafact pool**; **selects the best bullets per section/job by relevance to the decoded requirements** and assembles a tailored CV draft, writing a `cvDraft` part. This is the payoff of the compounding pool: because the fill-gap loop adds new bullets as datafacts, the CV builder automatically picks them up — every resolved gap can strengthen the next assembled CV. Same honesty rule: it **selects** pre-approved datafacts, it does not author claims. On-screen assembled CV is the MVP; `.docx` export (port of week-22 `buildCV`) is a fast-follow bundling step.

### 4.2 Store additions

- **Seed-pool ingestion:** a one-time/repeatable script that loads `cv_data.json` + the variant bullets and writes them as **datafacts** — a flat, tagged pool (`{ id:'datafact_…', kind:'datafact', type, text, tags:[...] }`). The 7 named variants become seed groupings via tags, not rigid slots.
- **`datalayer` read capability:** a scoped tool that lets A2/`writer` read the datafact pool (the store comment already anticipates this).
- **Write-back:** a path to append a new datafact to the pool when a gap is resolved with a new bullet (the compounding mechanism). New bullets are tagged (`addresses: <requirement>`, plus job/theme tags).

### 4.3 API layer

Thin HTTP endpoints so the React app drives the host:
- `POST /api/case/:id/analyze` → invoke `gap-analyzer` via the host → returns `{ fit, gaps }`.
- `GET /api/case/:id` → return case parts for rendering.
- `POST /api/case/:id/gap/:gapId/answer` → the fill-gap action: takes Daniel's reply, runs the **bullet-judge** (see 4.5), and either writes a new datafact + patches `fit`/`gaps`, or returns "stays a gap."
- `POST /api/case/:id/cv` → invoke `cv-builder` → assemble the tailored CV from the current pool → returns `cvDraft`. (Re-runnable after gaps are filled so the CV reflects the enriched pool.)

### 4.4 Front-end (adapt the mockup to the process)

The mockup is the look; structure comes from the data contract. Adapt `src/screens/match.jsx` to render real data:

| Screen element | Source |
|---|---|
| match verdict + "Granskad av Lilly" | `fit` (capability overall + preference narrative) |
| "Det du har — N krav" rows | `fit.capability[]` with status `match`, each citing its datafact (`evidence` → ref) |
| "Luckor att fylla" | `gaps[]` (the `missing`/`partial` requirements) |
| each gap's AI move | the gap's `bridge.kind` (`adjacent-proof` / `honest-ramp` / referral-action) |
| "Fyll luckorna" | enters the fill-gap loop (4.5) |
| bottom launchers, Sara | **deferred** — stubbed |

### 4.5 The fill-gap loop (the new capability)

Per gap, in the UI:
1. A2's bridge offers either a **suggested bullet** ("describe X — it counts") or a **question** ("do you have experience with Y?").
2. Daniel responds (accept the suggestion, or type his own experience).
3. A **bullet-judge** LLM call decides: *can this answer become a truthful, CV-worthy bullet?*
   - **Yes** → mint a datafact, write it into the pool (tagged), flip the requirement `missing/partial → match`, update the displayed match.
   - **No** (the answer doesn't legitimately fill it) → the gap **stays a gap**. No fabrication. This honest-failure path is mandatory, not optional.
4. The new datafact is now available to every future case — the pool compounds.

---

## 5. Data shapes (from DATA_CONTRACT v0.2)

```
decodedRole.data = { narrative, requirements: [{ id, requirement, rationale, weight }] }   // from A1

fit.data = {
  capability: {
    requirements: [{ requirementRef:{kind:'decodedRequirement',id}, evidence, status:'match'|'partial'|'missing' }],
    overall: string
  },
  preference: { narrative: string }
}

gaps.data = [{
  id: 'gap_…', what, why,
  bridge: { id:'bridge_…', kind:'reframe'|'adjacent-proof'|'honest-ramp', body, oneLiner,
            material:[{ source:'cv'|'coop-dialogue', ref?:{kind:'datafact',id} }] },   // material REQUIRED, no orphans
  provenance: string
}]

datafact = { id:'datafact_…', kind:'datafact', type, text, tags:[...] }   // verbatim, exempt from rewrite gate
```

---

## 6. Honesty bar (non-negotiable)

- Every `match` cites a **resolvable datafact id**; unsupported requirements return `missing`/`partial`, never a fabricated match.
- Every bridge carries `material[]` with a source; no orphan bridges.
- The bullet-judge must be able to return "**cannot truthfully fill**" and leave the gap open.
- Authored prose (gap `what`/`why`, bridge text) passes the writing-rules gate; verbatim datafact evidence is exempt (kept exact).
- Carry over week-22 guardrails: no invented/rounded numbers, banned AI-speak list, the ComeOn=CMO/CPO/COO vs MrGreen=founding-team (not CPO) facts.

---

## 7. MVP boundary

**In scope:** seed-pool ingestion · `gap-analyzer` (A2) writing real `fit`+`gaps` · the analysis screen (Ansökningskoll) on real data · the fill-one-gap loop with write-back · the `cv-builder` (tailored CV assembled from the pool, shown on-screen, reachable from Ansökningskoll) · the `writer` submodule (cover letter).

**Deferred (later, not never):** Sara (human review), course/calendar actions, `.docx` export of the CV/cover letter (port of week-22 `buildCV`), cover-letter screen polish.

---

## 8. Build order

1. Seed-pool ingestion (`cv_data.json` + variant bullets → tagged datafacts) + `datalayer` read capability.
2. `gap-analyzer` submodule (clone `decoder`, port 5-layer prompt) + `node --test` contract test (mirror `a1.test.cjs`).
3. Store write-back for new datafacts.
4. Bullet-judge logic + the fill-gap action endpoint.
5. API layer (`analyze`, `get case`, `gap answer`).
6. Front-end: `match.jsx` (Ansökningskoll) on real data + fill-gap loop UI.
7. `cv-builder` submodule (clone `decoder`, port week-22 selection logic) + test, and the CV-builder screen reachable from Ansökningskoll.
8. `writer` submodule (clone `decoder`, port cover-letter prompt) + test.

---

## 9. Decisions resolved

- **CV data ingestion:** ingest `cv_data.json` + variant bullets as a **flat, tagged datafact pool** (not a live read of the OnlyiGaming files; not the rigid 7-variant grid).
- **Preferences:** read `candidate_preferences.json` **as-is** for the MVP; preference fit is a narrative; unspecified fields = "unknown."
- **Capability mapping:** **reimplement in-repo** (clone `decoder`), reuse the week-22 **prompt + content** only. No content-pipeline imports (framework-enforced).

---

## 10. Open questions for the plan

- Exact part name for the cover letter output (`coverLetter` vs folding into `prep`).
- Whether the bullet-judge is its own tiny submodule or a function inside the fill-gap endpoint.
- Canonical source copy of `cv_data.json` (three copies exist: root, `cv-source/en`, `cv-source/sv`) — pick one as the ingestion source.
