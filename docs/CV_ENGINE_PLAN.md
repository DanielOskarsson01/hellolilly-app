# CV Engine Plan - provenance-first upgrade of the CV path

Status: DRAFT - becomes canonical when merged to main after Daniel's sign-off
Date: 2026-07-17

Grounded in: read-only inventory of HEAD 9b51f7c (docs/reference/hellolilly-app_readonly_inventory_2026-07-17.md), the shortlisted.nu benchmark teardown (docs/reference/shortlisted-benchmark.md), and the CV-builder reverse-engineering package (docs/reference/cv-builder-package/).

## Canonical working copy

/Users/danieloskarsson/dev/hellolilly-app (branch main). The Dropbox copies under ~/Library/CloudStorage/Dropbox/Projects are dead since 2026-07-10. Never git-operate on them.

## Why this plan

The benchmark proves CV tailoring is commoditised; the defensible layer is Stage 0: turning raw career material into a verified, source-linked fact ledger, and generating only from it. The inventory shows our architecture already points this way (server-only LLM access, least-privilege broker, a dedicated gate-exempt datafacts ledger, cvDraft items that already carry datafactRef, a selection-only cv-builder forbidden to write prose). What is missing is the provenance guarantees on top.

## Target capabilities vs current state (inventory of 9b51f7c)

| # | Capability | Verdict today |
|---|------------|---------------|
| a | Fact ledger with source spans + verified/unverified state | PARTIAL - ledger exists; both fields absent |
| b | Requirement extraction with user review | PARTIAL - extraction exists; review UI absent |
| c | Server-computed transparent score, model never owns the number | PARTIAL - statuses server-enforced; the % is a frontend ratio |
| d | Generation where every claim cites fact ids | PARTIAL for CV (refs in data, unresolved in UI) / ABSENT for letter |
| e | Independent validator that blocks export of unsupported claims | ABSENT - only the banned-phrase gate exists, at writePart not export |
| f | Parseability-checked export | ABSENT - no CV export; letter "PDF" button emits an HTML blob |

## Design decisions

1. Adopt the AI contracts in docs/reference/cv-builder-package/04-ai-contracts-and-prompts.md as the reference design for fact extraction, requirement review states, evidence classification, clarification questions, evidence-grounded generation, and independent claim validation - adapted to our shapes (datafact JSON blobs, case-parts envelopes), not the package's Supabase schema.
2. Reject the package's platform layer: Lovable topology, Stripe billing, the 48-table schema, the standalone-SaaS framing. We integrate into hellolilly-app.
3. Datafact shape gains status ('verified'|'unverified') and sources[] ({docId, page?, start, end}). This is a JSON-shape change on the existing datafacts table; no migration machinery is required and none exists.
4. The match number moves server-side into the fit part with a component breakdown (per-category coverage against weighted requirements), computed in code, never emitted by the model. The frontend renders the number; it never computes it. Keep a believable ceiling: a perfect profile never displays 100.
5. Every generated claim - CV item AND letter paragraph - carries fact refs. A new independent checker submodule (maker/checker per HELLOLILLY_ARCH_RULES Rule 3) validates each claim against only its cited facts and gates export: supported / needs review / blocked.
6. Retrofit-at-touch: every wave implements the D12-class guarantees (injection envelope with source tagging, output schema validation, eval fixtures) on the paths it touches, and clears the corresponding RETROFIT_LEDGER lines in the same wave.

## Waves - dependency-ordered, one active at a time, each ends with a scripted real-data walkthrough

### CV-E1 - Ledger provenance (small)

Add status + sources[] to the datafact shape. ingest-cv seeds facts as verified with a document-level source pointing at data/cv_data.json. fill-gap minted facts are verified (user-confirmed by construction). Repair the live-DB divergence: the mapper must regenerate the category field so a reseed no longer silently drops it. Envelope and schema-validate the paths touched.

### CV-E2 - Intake engine (large; the moat)

Absorbs and supersedes the pending gap-drafting + doc-to-datafacts wave. Upload or paste a document → fact-extraction contract → review inbox (confirm / correct / reject, conflicts surfaced) → acceptance mints a verified datafact with source spans. Clarification questions are capped, neutral, and never prefill an answer. AI drafts, the user verifies, acceptance mints - the walkthrough principle already agreed.

### CV-E3 - Requirements review + server score + Godkänn trigger (medium)

Requirement matrix becomes editable and persisted (decodedRole.requirements review states). Score computed server-side into fit with the component breakdown from decision 4. Background analysis on job approval (the confirmed product-flow correction) lands here because it touches the same path.

### CV-E4 - Grounded generation + validator + real export (medium-large)

Letter paragraphs carry fact refs (writer output shape gains refs; id-stripping in the prompt ends). CV screen resolves datafactRef to named facts. The independent claim-validator submodule from decision 5 gates export. Real PDF export (DOCX later, per backlog commit dca2fcf) with an extract-and-compare parseability check. The mislabelled "Ladda ner PDF" HTML blob dies here.

## Out of scope for these waves

Multi-user identity (D4 trigger unchanged), coach surfaces, Knowledge Hub crosslinks, outcome weighting, fine-tuned models.
