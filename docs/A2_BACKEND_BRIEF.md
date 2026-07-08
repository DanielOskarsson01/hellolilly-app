# A2 + Background Generators - Backend Build Brief (Claude Code)

**From:** Daniel (via planning)
**Source of truth:** `A2_RECONCILED_DESIGN.md` (read it first - this brief is the backend half of it). Build on the hardened skeleton + job-search store extension.
**Discipline:** clone the live `decoder` submodule for each new submodule (framework-correct, key-wired); port week-22 prompts + content; import no pipeline glue (require-guard enforces it). TDD throughout, mock-based tests + a live verify, code-review on the diff before deploy. Scope-and-report if anything turns out larger than scoped.

## What to build (backend only - no screens)

**1. Seed-pool ingestion + `datalayer` read capability**
- Confirm the canonical English `cv_data.json` first (which of top-level vs `cv-source/en` is most recent / week-22's - see reconciled design §9). That one is the ingestion source.
- Ingest it + the variant bullets as a flat, tagged datafact pool: `{ id, kind:'datafact', type, text, tags:[...], language:'en' }`. **Every datafact carries `language:'en'`** (multilingual-ready, §5 of the design). 7 variants become tag groupings, not slots.
- Add the `datalayer` read capability (scoped) so submodules can read the pool.

**2. gap-analyzer (A2)** - clone `decoder`, port the 5-layer analysis prompt
- `reads:['meta','decodedRole']`, `writes:['fit','gaps']`, `capabilities:['store','logger','llm','utils','datalayer']`, `options:{model:'claude-opus-4-8'}`.
- Reads meta + decodedRole.requirements[], the datafact pool, and `candidate_preferences.json`. **Preference read is hard-filter FIT only** (can he credibly meet the needs / does it clear deal-breakers) - NOT a desirability read (reconciliation 4).
- Writes real `fit` + `gaps` (shapes in design §4). Honesty bar §6: every match cites a resolvable datafact; unsupported → missing/partial; every bridge has `material[]`; surface failures, never swallow.

**3. Write-back + the bullet-judge** (the fill-gap mechanism)
- The bullet-judge is a **function in the fill-gap endpoint** (not a submodule). It decides if an answer becomes a truthful CV-worthy bullet. Yes → mint a datafact (tagged, `language:'en'`, `addresses:<requirement>`), write to the pool, flip the requirement to match, update fit. No → gap stays open, no fabrication (mandatory honest-failure path).

**4. cv-builder (background, no UI)** - clone `decoder`, port week-22 selection logic
- Reads meta + decodedRole + fit + the pool; **selects** best bullets per section by relevance; writes a `cvDraft` part. Selects pre-approved datafacts, authors nothing.
- Takes a **`language` parameter, hardcoded `'en'`** for now (multilingual-ready).

**5. writer (background, no UI)** - clone `decoder`, port the cover-letter prompt
- Reads meta + fit + gaps + CV datafacts; writes a **`coverLetter`** part. Carries the ComeOn/MrGreen accuracy guardrails and the no-overstate rule.
- Takes a **`language` parameter, hardcoded `'en'`**.

**6. API layer** (thin HTTP - design §7)
- `GET /api/case/:id`, `POST /api/case/:id/analyze`, `POST /api/case/:id/gap/:gapId/answer`, `POST /api/case/:id/generate` (runs cv-builder + writer, produces cvDraft + coverLetter, creates/updates the Ansökningskoll card).

## Multilingual-ready (build now, Swedish deferred - design §5)
Datafacts language-tagged (`'en'`), generators language-parameterized (`'en'`), analyzer language-agnostic. Swedish = later ingest of `cv-source/sv` as `'sv'` datafacts + pass `language:'sv'`. Do NOT build Swedish now; just don't hardcode language so it's additive.

## Build order
Seed-pool + datalayer → gap-analyzer + test → write-back + bullet-judge → fill-gap endpoint → API layer → (cv-builder + test) + (writer + test) + the generate endpoint.

## Deferred (don't build)
`.docx` export · Swedish output · Sara/human-review · the comment→regeneration backend loop (comments are captured in the frontend but don't trigger regeneration yet - that's a fast-follow).

## Report
Report after the canonical-copy confirmation (before ingesting), and at each submodule landing. Keep the contract aligned with the frontend thread (it builds to the same shapes + API).
