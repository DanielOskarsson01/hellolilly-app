# A2 + Application Workflow - Reconciled Design

**Date:** 2026-06-29
**Status:** Reconciled source of truth. Merges `A2_GAP_ANALYZER_DESIGN.md` + `A2_FRONTEND_BRIEF.md` (the separate-session specs) with the decisions made in the planning thread. Where they disagreed, this document is the resolution. Two derived build briefs reference this: the Claude Code backend brief and the Claude Design frontend brief.
**Builds on:** the hardened, immutable skeleton + the job-search store extension (jobs/jobSources/jobRules/filterSet collections, `job` id kind).

---

## 0. The five reconciliations (what changed from the specs)

The specs came from an earlier session and disagreed with the thread in five places. Resolved:

1. **CV-builder and cover-letter are BACKGROUND generation, not interactive screens.** The specs had a Screen C "CV builder" with swap/reorder/regenerate. That's dropped. CV and cover letter generate automatically in the background after Matchanalys; their outputs surface in Ansökningskoll. No dedicated builder screen in the MVP.
2. **Naming is the thread's, not the specs'.** The spec called the analysis screen "Ansökningskoll." It is not. The analysis-and-fill-gap screen is **Matchanalys**. **Ansökningskoll** is a separate, later screen: the delivery + tracking surface.
3. **Canonical CV data = the current English copy** (Claude Code confirms which of the two English files is the most recent / week-22 one). Swedish exists but is deferred. **Build multilingual-ready** (see §5).
4. **Preference analysis = fit only.** "Can I credibly meet their needs / does it clear my deal-breakers." Whether Daniel *likes* the role is deferred to post-interview, NOT in this analysis. Drop any desirability/preference-narrative read beyond hard-filter fit.
5. **Bullet-judge is a function in the fill-gap endpoint** (not its own submodule); the cover-letter output is its own **`coverLetter`** part.

Everything else in the specs (the fill-gap loop, the compounding datafact pool, the honesty bar, the clone-the-decoder scaffold strategy) is kept - it's good and consistent.

---

## 1. The application workflow, end to end

```
Jobbsök (job-search, already in build)
   → approve/reject jobs
Matchanalys  [SCREEN]
   → fit + gaps analysis on an approved job, + the fill-gap loop
[background, no screen]
   → CV-builder assembles a tailored CV from the datafact pool
   → writer produces the cover letter
Ansökningskoll  [SCREEN, two views]
   → Delivery view: per-application card (job, company, downloadable + visualized CV & cover letter, inert comment surface, download, apply-directly link)
   → Tracking view: what's applied, interview status, manual for now
```

Three screens total in this workflow: **Matchanalys** (analysis + fill-gap), **Ansökningskoll** (delivery + tracking). (Jobbsök is the job-search build, separate.) CV-builder and writer are **background submodules with no UI**.

---

## 2. Backend submodules (all cloned from the live `decoder` - framework-correct, key-wired)

Reuse strategy throughout: **clone the `decoder` submodule** for the scaffold (gives the Anthropic client, key, manifest/store plumbing for free); **port the week-22 prompts and content** (the 5-layer analysis prompt, the cover-letter system prompt with the ComeOn/MrGreen accuracy guardrails, `cv_data.json` + variant bullets as seed content); **import no pipeline glue** (framework-enforced by the require-guard; different tool API `tools.llm.completeJSON`, different manifest, different I/O).

### gap-analyzer (A2)
- `reads: ['meta','decodedRole']`, `writes: ['fit','gaps']`, `capabilities: ['store','logger','llm','utils','datalayer']`, `options: { model: 'claude-opus-4-8' }`.
- Reads meta + decodedRole.requirements[], reads the candidate datafact pool via `datalayer`, reads `candidate_preferences.json` (for the hard-filter fit read only - per reconciliation 4).
- One `tools.llm.completeJSON()` call, ported 5-layer prompt → per-requirement match/partial/missing + the fit + gaps with bridges.
- Mints `gap_`/`bridge_` ids deterministically; writes `fit` and `gaps` via `writePart` (gate runs; verbatim datafact evidence exempt).
- On error: `setPartStatus(...,'failed', err)` + rethrow. Never swallow.

### cv-builder (background, no UI)
- Reads meta + decodedRole + fit + the datafact pool; **selects** the best bullets per section by relevance to the decoded requirements; assembles a tailored CV draft → writes a `cvDraft` part. Selects pre-approved datafacts; never authors claims.
- Takes a **language parameter** (hardcoded `'en'` for the MVP - see §5).
- The compounding payoff: gaps filled in Matchanalys add datafacts, so a re-run produces a stronger CV.
- On-screen visualization is the MVP; `.docx` export is a deferred fast-follow.

### writer (background, no UI)
- Reads meta + fit + gaps + the CV datafacts; ports the week-22 cover-letter prompt; writes a **`coverLetter`** part. Uses fit/gaps as the selection guide (must-haves lead; gaps decide the honest bridge paragraph; `unsupported_by_cv[]` surfaces fabrication risk).
- Takes a **language parameter** (hardcoded `'en'` for the MVP).

### The fill-gap loop (the new capability)
Per gap, in Matchanalys:
1. A2's bridge offers a **suggested bullet** ("describe X - it counts") or a **question** ("do you have experience with Y?").
2. Daniel responds (accept, edit, or write his own).
3. A **bullet-judge** (a function in the fill-gap endpoint, per reconciliation 5) decides: can this become a truthful, CV-worthy bullet?
   - **Yes** → mint a datafact, write it to the pool (tagged, incl. language), flip the requirement to `match`, update the displayed fit.
   - **No** → the gap **stays a gap**. No fabrication. This honest-failure path is mandatory.
4. The new datafact is now available to every future case - the pool compounds.

---

## 3. Store additions

- **Seed-pool ingestion:** a repeatable script loads the canonical English `cv_data.json` + variant bullets as **datafacts** - a flat, tagged pool `{ id:'datafact_…', kind:'datafact', type, text, tags:[...], language:'en' }`. The 7 week-22 variants become tag groupings, not rigid slots.
- **`datalayer` read capability:** scoped tool letting A2/writer/cv-builder read the pool (the store comment already anticipates this).
- **Write-back:** appends a new datafact when a gap is resolved (the compounding mechanism), tagged (`addresses:<requirement>`, job/theme tags, `language`).

---

## 4. Data shapes (DATA_CONTRACT v0.2)

```
decodedRole.data = { narrative, requirements:[{ id, requirement, rationale, weight }] }   // A1

fit.data = {
  capability: { requirements:[{ requirementRef:{kind:'decodedRequirement',id}, evidence, status:'match'|'partial'|'missing' }], overall:string },
  preference: { narrative:string }   // hard-filter FIT read only (recon 4), not desirability
}

gaps.data = [{ id:'gap_…', what, why,
  bridge:{ id:'bridge_…', kind:'reframe'|'adjacent-proof'|'honest-ramp', body, oneLiner,
           material:[{ source:'cv'|'coop-dialogue', ref?:{kind:'datafact',id} }] },   // material REQUIRED
  provenance:string }]

datafact = { id:'datafact_…', kind:'datafact', type, text, tags:[...], language:'en' }   // verbatim, gate-exempt
```

---

## 5. Multilingual-ready (build now, Swedish deferred)

The MVP is English-only, but build so Swedish is additive, not a retrofit (same discipline as store-backed filters / DB-swap-ready):

- **Datafacts carry a `language` tag from day one**, populated `'en'` for everything in the MVP. Swedish is NOT translation-at-render - the Swedish `cv-source/sv` is genuinely different content, so Swedish datafacts are their own evidence atoms, ingested later as `'sv'`-tagged.
- **cv-builder and writer take a `language` parameter**, hardcoded `'en'` now. Later, passing `'sv'` selects Swedish datafacts and produces a Swedish CV/letter.
- **The analyzer is language-agnostic** - fit/gap analysis doesn't depend on output language; the multilingual concern lives in the pool and the generators, not A2.
- Adding Swedish later = ingest `cv-source/sv` as `'sv'` datafacts + pass `language:'sv'`. No re-mint, no rewrite.

---

## 6. Honesty bar (non-negotiable, carried from the spec + the thread)

- Every `match` cites a resolvable datafact id; unsupported → `missing`/`partial`, never a fabricated match.
- Every bridge carries `material[]` with a source; no orphan bridges.
- The bullet-judge can return "cannot truthfully fill" and leave the gap open - mandatory.
- Authored prose (gap what/why, bridge text, cover-letter prose) passes the writing-rules gate; verbatim datafact evidence is exempt (kept exact).
- Week-22 guardrails carried over: no invented/rounded numbers, the banned AI-speak list, the ComeOn=CMO/CPO/COO vs MrGreen=founding-team-not-CPO facts. The cover letter especially must not overstate to satisfy a comment.

---

## 7. API layer (thin HTTP, React drives the host)

- `GET /api/case/:id` → case parts for rendering (`meta, decodedRole, fit, gaps, cvDraft?, coverLetter?`)
- `POST /api/case/:id/analyze` → invoke gap-analyzer → `{ fit, gaps }`
- `POST /api/case/:id/gap/:gapId/answer` → `{ answer, tags? }` → bullet-judge → `{ outcome:'accepted'|'stays_gap', updatedFit?, newDatafactId? }`
- `POST /api/case/:id/generate` → invoke cv-builder + writer (background generation) → produces `cvDraft` + `coverLetter`, and creates/updates the Ansökningskoll card
- (Ansökningskoll tracking-view reads/writes application status - manual for now)

---

## 8. MVP boundary

**In scope:** seed-pool ingestion (English, language-tagged) · gap-analyzer writing real fit+gaps · Matchanalys screen on real data · the fill-one-gap loop with write-back · background cv-builder + writer producing cvDraft + coverLetter · Ansökningskoll (delivery view with downloadable + visualized CV/letter, inert comment surface; tracking view, manual).

**Deferred (later, not never):** the comment/revision *backend* loop (comments are captured + visible in the MVP but don't trigger regeneration - see the frontend brief) · `.docx` export · Swedish output (multilingual-ready, not built) · Sara/human-review · course/calendar actions · the richer feedback-driven adaptation.

---

## 9. Open item for Claude Code to resolve
- Confirm which of the two English `cv_data.json` copies (top-level vs `cv-source/en`) is the most recent / the one week-22 used; that one is canonical for ingestion. (Swedish `cv-source/sv` noted for the deferred multilingual step.)
