# Wave 2 - Repo fact-check of the suggestion-engine brief (v1)

**Record status:** verbatim reviewer output - the fact-check session's delivered
report, committed as the review record. Markdown link targets flattened to plain
repo-relative paths; text otherwise unchanged.
**Delivered:** 2026-07-24. (The v3.2 brief refers to this fact-check as
2026-07-21; the discrepancy is noted, not resolved, here.)
**Verified against:** `main` @ `92e5373` (read-only; nothing written).

---

**Brief location note:** the brief was not in the repo. It existed only in the
Dropbox clone at `Dropbox/Projects/hello lily - app/docs/WAVE_2_BRIEF_suggestion-engine_v1.md`,
untracked. The 183-fact pool is likewise not "on main" in the literal sense -
the store is gitignored local state, and the two clones differ: the Dropbox
clone's live store has **183** facts; the ~/dev clone's has **144**
(pre-Coinhero). Data findings below are from the Dropbox live store (read via a
scratchpad copy); code findings are from main.

## 1. Provenance audit (Invariant 1 nuance) - PARTIAL

**Classification is possible for all 183, but for 133 of them only by inference
- no per-fact provenance is recorded.**

- The 183 split three ways, cleanly and exhaustively:
  - **39** carry `source: "JobSearch/CVs/generate_core_cvs.js (VARIANTS.*.jobs.coinhero.bullets)"`
    - the Coinhero import, explicit in-band curated origin
    (`scripts/ingest-coinhero-results.cjs:66`).
  - **11** have `type: "fill-gap"` - AI-involved minted facts. The bullet text
    is **model-authored** (an Opus judge writes "ONE concrete bullet" from the
    person's typed answer, `server/skeleton/fill-gap/bullet-judge.cjs:11-14`)
    and is minted in the same request with **no human review of the wording**
    and **no acceptance event, who, or when recorded on the fact** - fields are
    only `id, kind, type, text, tags, language`
    (`server/skeleton/fill-gap/bullet-judge.cjs:80-87`). A timestamped
    `gap_filled` activity record (11 exist, `source:"system"`, no user identity)
    links each `datafactId` - a partial trail, held in a separate collection.
  - **133** carry **no provenance-like field at all**
    (`id, kind, type, text, tags, language[, category]`). These are the cv_data
    ingest: `server/skeleton/datafacts/ingest-cv.cjs:10-11` mints facts without
    any source/provenance field. Classifying them as curated-origin rests on
    inference (not-fill-gap, no-source => ingest) plus text-matching against the
    gitignored `data/cv_data.json`; ids are randomly minted so they encode
    nothing.
- **No `status`/`verified` field exists** on any fact, and no code on main reads
  one. The brief's "default unverified" machinery is entirely new work.
- **What code does with missing provenance today: defaults to trusted.**
  `server/submodules/cv-tailor/execute.cjs:68`:
  `isDerived = (f) => f.provenance === 'untrusted-derived' || f.type === 'fill-gap'`
  - a fact with no provenance field and any other type goes into the **trusted**
  candidate pools. The comment above it claims "Provenance is carried on the
  fact when minted" - **that is false for the only mint path on main**:
  bullet-judge stamps no provenance field; the `type` check is not a legacy
  fallback, it is the sole mechanism. The store's taint guard applies to case
  parts only, not datafacts (`server/skeleton/store/index.cjs:38-45`);
  `ingestDatafact` accepts any shape (`server/skeleton/store/index.cjs:222-226`).
- Integrity (not origin) is bound by the committed manifest:
  `corpus.datafact_pool` records count 183, `pool_sha256`, and per-item sha256
  of each fact's full JSON blob (`harness/phase0/MANIFEST.json`, amendments of
  2026-07-16/17 documenting the `category` enrichment and the +39 Coinhero
  facts).
- One fact the brief doesn't state: the Wave 1 frozen parity pool of 144
  **already contained the 11 AI-authored fill-gap facts** (144 = 133 ingest +
  11 fill-gap).

## 2. Upload path - VERIFIED (entirely new ground)

- **No functional upload or file intake exists.** The full route list of
  `server/dev-server.cjs` contains only JSON-body routes; no multipart parsing
  anywhere.
- `src/screens/interview.jsx:66-67` renders "Ladda upp PDF/DOCX" with an
  `<input type="file">` - but it has **no handler**; the whole screen is a
  hardcoded static mock.
- `src/screens/jobSearch.jsx:217`: CSV upload "SHIPS but honestly disabled
  ('Kopplas snart')".
- Nearest existing surface: generic JSON collection CRUD
  `GET/POST/DELETE /api/collection/:name` (`server/dev-server.cjs:118-144`) -
  any client can POST an arbitrary JSON record into any collection name today
  (only `activity` is blocked). It stores records; it does not parse files.

## 3. Store shape - VERIFIED (no migration needed)

- SQLite at `server/data/store.db` (gitignored via `server/data/` in
  `.gitignore`), four tables: `meta`, `cases`, `datafacts`,
  `collection_records` - every row is `(id, data TEXT)` JSON blob;
  `collection_records` is `(name, id, data)`.
- New collections ("documents", "spans") need zero DDL -
  `putRecord(name, record)` auto-creates the named collection
  (`server/skeleton/store/index.cjs:167-175`); new datafact fields
  (`provenance`, `status`) are just JSON keys.
- Two properties of that path the brief's design would inherit: collections are
  **not writing-rules-gated** by design
  (`server/skeleton/store/index.cjs:158-166`), and the open
  `/api/collection/:name` POST (item 2) means a "documents" collection would be
  client-writable unless the route is constrained.
- Brief section 7 "same local store class as the datafact pool - outside the
  repo, gitignored, never committed": consistent with the actual setup.

## 4. Existing source material - PARTIAL (brief's claim overstates it)

The brief asserts "The system holds cover letters, gap answers, interview
material - it should draft FROM them." Actual holdings:

- **Cover letters - PARTIAL.** The live store's 8 cases include **2 with a
  generated `coverLetter`** (AI-written by the writer submodule; real paragraph
  text) and 6 `letter_generated` activity events. A human-edited
  `coverLetterDraft` part, editor UI, and `POST /letter-draft` route exist
  (`server/dev-server.cjs:297-319`) - but **0 drafts are saved**. So:
  AI-generated letters exist; person-written letters in-app do not.
- **Gap answers - FALSE.** The person's raw answer text is **discarded**:
  `applyAnswer` judges it, keeps only the model-authored bullet, and neither
  the `gaps` part nor the activity record stores the answer
  (`server/skeleton/fill-gap/bullet-judge.cjs:48-115`,
  `server/dev-server.cjs:237-258`).
- **Interview material - FALSE.** The interview screen is a static mock
  (item 2). The case contract has `prep`, `cards`, `liveLog`, `postMortem`
  parts (`server/skeleton/contract/case.cjs:14`) - all four hold data in
  **0 of 8** cases.
- What genuinely exists to draft from without upload: the 183-fact pool, 7
  cases' `dossiers` and `decodedRole`, `fit` narratives, gap `bridge` prose,
  the 2 generated cover letters, 35 stored job ads, and the 92-record activity
  log.

## 5. D12 reuse of prompt-assembly - VERIFIED (no second assembly point needed)

- `server/skeleton/prompt-assembly/index.cjs` is content-agnostic:
  `envelope()`/`assemble()` take any `{label, provenance, content}` source;
  nonce-fenced, sentinel-neutralised; `taint()` implements transitive
  derivation. A new "uploaded document" ingestion class is just a new source
  label through the same `assemble()` - the module needs no structural change,
  and submodules already receive it as `tools.assembly`.
- One nuance: the `PROVENANCE` enum has no distinct class for documents -
  they'd enter as `untrusted` like a pasted ad. Distinguishing the class (as
  the brief's eval cases imply) would be a label/enum addition inside the one
  module, not a second assembly point.

## 6. Decoder signal (Lever A / weighted requirements) - VERIFIED available

- The decoder stores on the case part `decodedRole`:
  `requirements: [{id: decodedRequirement_*, requirement, rationale, weight 1-5|null}]`
  plus `narrative` (`server/submodules/decoder/execute.cjs:72-82`).
- Any submodule can read it: `getCase` is on the submodule-facing store
  whitelist (`server/skeleton/capabilities.cjs:30`); cv-tailor reads it exactly
  this way (`server/submodules/cv-tailor/execute.cjs:344`).
- Two things Wave 2 would need that don't exist: (a) the
  **pool-vs-requirement thinness comparison** itself - no code compares
  weighted requirements against pool support anywhere; (b) the
  `decodedSignal()` serializer lives inside cv-tailor and, under the
  require-guard (submodules may require only `node:` builtins), **cannot be
  imported by a new submodule** - its export
  (`server/submodules/cv-tailor/execute.cjs:400`) is reachable only by
  host/harness code, so reuse means hoisting it into the skeleton or
  duplicating ~10 lines. Also `weight` can be `null` (only empty `requirement`
  is filtered).

## 7. Other assertions checked

- **"Failure classes taken from the CV-byggaren adversarial review (D19
  record)" - PARTIAL.** The D19 *regime* exists (`docs/DECISIONS_ADDENDUM.md`,
  "## D19 - Adversarial-review regime for build briefs"), but **no CV-byggaren
  review record is tracked on main** (`git ls-files` has no match for
  byggaren/D19). The records exist only as untracked working files in the dev
  clone (`CODEX_D19_REVIEW.md`, `D19_CV_BYGGAREN_*.md`, `GEMINI_D19_REVIEW.md`)
  and on the unmerged branch `docs-cv-byggaren-slice0`. The quoted "BLOCKER"
  cannot be verified against anything on main.
- **Brief step 6 "the minted fact is an ordinary pool fact... same rules as any
  other" - PARTIAL against today's code.** AI-minted facts are currently *not*
  ordinary: `candidatePool` segregates fill-gap facts into `derivedHighlights`,
  they enter the prompt only enveloped as untrusted-derived, are eligible
  **only for the highlights section**, and can never reach job sections
  (`jobOfFact` only maps `job_summary`/`job_result` types) -
  `server/submodules/cv-tailor/execute.cjs:68-93`. Minting Wave-2 output as
  ordinary typed facts would change how minted material is treated, not
  continue it.
- **Decoder-weights claim - VERIFIED** (item 6). **"Wave 1 was selection-only"
  - VERIFIED** (tailor SYSTEM prompt; D20 part c, which also explicitly names
  the suggestion engine as "the immediate next wave" - supports the brief).
- **Canon citations - VERIFIED.** All four canon docs exist on main;
  `docs/reviews/wave1/wave1-p4-final-disposition.md` does bind both owed
  outcomes ("The owed outcome (binds the next wave)" - Wrknest-class relevance;
  graceful-failure UX). "FIXTURE LAW, D20b" resolves to D20 part (b) plus the
  north star's FIXTURE LAW section. The P4 re-test harness exists and is
  re-runnable (`harness/phase0/run-parity.cjs`, manifest pool sha).
- **Brief claim "the system holds cover letters, gap answers, interview
  material" - FALSE as written** (evidence in item 4). The strongest true
  version the repo supports: it holds AI-generated letters, gap *bridges*, and
  a rich datafact pool; the person's own written answers and interview material
  are not retained anywhere today.
