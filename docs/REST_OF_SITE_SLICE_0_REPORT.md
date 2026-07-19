# REST OF SITE — Slice 0 Report & Integration Plan

**Date:** 2026-07-19 · **Slice:** 0 (read-only reconnaissance — produces this report; touches no product code, no canon docs, no git history).
**Verified against:** `origin/main` HEAD `9b51f7c` (fetched 2026-07-19) and the working tree of branch `docs-cv-engine-plan`.
**Status:** Slice 0 complete; held for Daniel's sign-off. Slice 1+ (writing slices) are GATED — see §B.6.
**Reads with:** `DECISIONS_ADDENDUM.md`, `CV_ENGINE_PLAN.md`, `REST_OF_SITE_DATA_CONTRACT_ADDENDUM.md`, `RETROFIT_LEDGER.md`, `inference-surface-registry.json`, `DEMO_TWIN_PERSONA.md`.

This build binds to the SEAM RIDER constraints + the dialog resolutions from the rest-of-site planning thread. Every claim below was checked against the repo, not assumed from the brief (verify-highest-first).

---

## A. Verification findings (the six seams)

### A.1 Decision numbering — verified
- Highest **committed** decision on `origin/main`: **D21**. The on-main `DECISIONS_ADDENDUM.md` ends at D21; no `## D22` heading exists there.
- **D22** (CV engine, provenance-first) exists only as commit `f54d0ce` on branch `docs-cv-engine-plan`, marked **DRAFT — "becomes canonical when `docs/CV_ENGINE_PLAN.md` merges to main."** Not on main. Matches the brief's "unresolved docs branch."
- **This build's decision will take D23.** Reasoning and contingency in §B.1.

### A.2 Datafact shape change — verified (shared substrate)
- The change (D22 decision 3 / wave CV-E1): the datafact record gains `status: 'verified' | 'unverified'` and `sources[]: { docId, page?, start, end }`. D22 states "no migration machinery is required and none exists."
- Current shape (`server/skeleton/datafacts/ingest-cv.cjs:11`): `{ id, kind:'datafact', type, text, tags, language }` — no `status`, no `sources`.
- **Every current reader of datafacts** (all verified in code); none loses its pool under the §B.2 rule:

  | Reader | File:line | Use of the pool |
  |---|---|---|
  | accessor (the chokepoint) | `server/skeleton/store/index.cjs:209,212` | `getDatafact(id)` / `listDatafacts()` |
  | datalayer wrapper | `server/skeleton/capabilities.cjs:81–83` | surfaces the accessor to submodules |
  | CV tailor | `server/submodules/cv-builder/execute.cjs:14` | `listDatafacts().filter(language)`, selects by id |
  | letter writer | `server/submodules/writer/execute.cjs:82` | `listDatafacts().filter(language)` |
  | Matchanalys | `server/submodules/gap-analyzer/execute.cjs:73` | whole pool |
  | bullet-judge | `server/skeleton/fill-gap/bullet-judge.cjs` | resolves by id; mints new verified facts |
  | keyword-judge | `server/skeleton/fill-gap/keyword-judge.cjs` | resolves by id (guards) |
  | seed/writer | `server/skeleton/datafacts/ingest-cv.cjs` | the shape source |
  | case ref-holder | `server/skeleton/contract/case.cjs:41` | holds `cvVersionRef`; not a pool reader |

- **Verified: no reader filters on datafact `status` today.** Every `.status` in these files is *requirement* status (`r.status === 'match'`) — a different field. The shape change is purely additive; nothing breaks today. The only risk is a *future* reader that filters on `status` and silently drops legacy facts — closed by §B.2.

### A.3 Storage rule (D20b) + fixture cast — verified & resolved
- D20(b) confirms: contact PII, the evidence pool, and **captured CV artefacts never enter the repo**. Uploaded CVs, extracted source documents with spans, and voice transcripts therefore live under git-ignored paths (`server/data/…`, the "binaries on disk, never in git" convention of `REST_OF_SITE_DATA_CONTRACT_ADDENDUM.md` §10), never in the repo.
- Committed eval fixtures are **synthetic-only** (D12 Rule 4). Daniel's real CV is **walkthrough material only, never committed**.
- **Fixture cast RESOLVED — the canonical twin is `docs/DEMO_TWIN_PERSONA.md`.** Verified: Mikael Sandell, wholly-invented synthetic persona (2026-07-12), 14 career datafacts `TWIN-DF-01..14`, provenance-clean, with a **binding consistency law: the twin's facts exist only in that file — a session needing a fact the file lacks adds it there first; ad-hoc invention is a provenance violation.** Treated here as canonical and **unmodifiable-in-substance**. Derived fixtures (a fixture CSV, eval inputs) draw **only** from its `TWIN-DF` facts, referenced by id.
- **⚠ Location flag (resolved in-plan, needs sign-off confirmation):** `DEMO_TWIN_PERSONA.md` currently exists **only in the Dropbox clone** (`~/Library/CloudStorage/Dropbox/Projects/hello lily - app/docs/`), which `CV_ENGINE_PLAN.md:10` marks **dead ("never git-operate on them")**. It is **absent from this canonical `~/dev` clone and from `origin/main`.** The first docs commit (§B.3) brings it into `~/dev` by **byte-exact copy + `cmp` verification** (unmodified-in-substance; never retyped/pasted). No git operation touches the Dropbox clone.

### A.4 Ingestion inventory + submodule non-membership — verified
- The inventory is `REST_OF_SITE_DATA_CONTRACT_ADDENDUM.md`; the precedent entry is **§22 vaultContact, "New ingestion point (D21, Valvet slice 1)."** Each new ingestion point (upload, paste, voice) adds an analogous entry **in the slice that builds it** — not in Slice 0.
- **The new submodules — extraction, composer, checkers, summary writer, skill suggester — are NOT inference-surface-registry members.** The registry's definition (`inference-surface-registry.json`) is *a path that writes an interpretation of the person's **state** (confidence, wellbeing, barriers, motivation) to a stored shape, or renders one to a coach-facing view.* These submodules interpret **documents and claims**, not a person's state — the same reading recorded with D21 (the vault judge interprets third-party profile text, not a person's state). Registry membership stays the existing three (transition-compass confidence capture, transition-view coach prompts, outcome-engine per-group analyses). Stated in the plan, not added silently.

### A.5 Sequencing — verified
- **The Valvet slice-1 work is branch-only, not on main.** `origin/main` has no §22, no RETROFIT_LEDGER vault row, and no `server/vault/` code. All three live on this branch (commit `68e9474`, unpushed). This branch is a tangle: it carries both the D22 CV-engine docs and the Valvet slice-1 commit on top of them.
- Slice 0 is read-only and runs regardless of the Valvet queue.

### A.6 D19 large-wave review — NOT passed
- This build qualifies as a large wave (D19). The only review record in the repo is `docs/reviews/wave1/`. **No adversarial-review record exists for the rest-of-site / CV-engine build.** The brief has **not** passed the D19 hostile-review regime.

---

## B. Integration plan (binding for slice 1+)

### B.1 Decision number: **D23**
D22 is already claimed by the CV-engine draft (a committed decision on a branch). The addendum's own convention (D9 numbering note) takes "the next number clear of **all** schemes" so numbers never collide; reusing D22 would collide with the CV-engine draft. So this build records **D23** when its decision is written.
- *Pre-answer to "D22 is only a draft, reuse it":* a committed draft is a live claim under the collision-avoidance convention; a fresh number costs nothing and avoids the collision.
- **Contingency:** if D22 is renumbered/abandoned before either D22 or this build merges, this reverts to D22. **Re-verify highest-on-main at the moment the decision is written** — do not hard-code D23 earlier.
- The D23 decision entry is **not** written in Slice 0 (pre-decision, pre-review). It lands with the build's decision, after §B.6 clears.

### B.2 Datafact compatibility rule: **verified-legacy at the accessor**
**Rule (binding):** a datafact with no `status` field is read as `status: 'verified'` (legacy). The default is applied at the single accessor — `store.listDatafacts()` / `store.getDatafact()` (`server/skeleton/store/index.cjs:209,212`) — so **no reader can bypass it**.
- Composes with CV-E1's "ingest-cv seeds facts as verified" — it does not contradict it. New facts are written with an explicit `status`; the read-time default **fires only for pre-change rows** in an existing live DB.
- *Why not backfill-at-seed alone:* an existing live DB must not be reseeded (reseeding drifts ids and row counts). Seed-only leaves those rows without `status`; a future status filter would silently drop them. The accessor default is the belt-and-braces that keeps every applying-side tool's pool intact.
- **The future "`unverified` excluded from generation and CV" filter lives at or behind this same chokepoint** (in / behind `listDatafacts()`/`getDatafact()`, e.g. a `listDatafacts({ verifiedOnly })` option or a filtered view), **never re-implemented per reader.** One place owns both the legacy default and the verified-only projection; consumers ask for the pool they need, they do not each re-derive the status predicate.
- **The applying-side tools (tailor, writer, Matchanalys, the fill-gap judges) must not silently lose their pool** — under this rule they cannot: `status`-absent facts read as `verified` and remain selectable.

### B.3 Storage & fixtures (D20b / D12 Rule 4) + the first docs commit
- Captured CV artefacts (uploaded CVs, extracted source docs with spans, voice transcripts) → git-ignored paths under `server/data/` (or the §10 binaries-on-disk convention). Never committed.
- Committed eval fixtures are synthetic-only and draw **only** from `DEMO_TWIN_PERSONA.md`'s `TWIN-DF` facts (per its consistency law). A fixture needing a new fact adds it to `DEMO_TWIN_PERSONA.md` first.
- **First docs commit (scheduled; held for sign-off):** bundles **(1)** this Slice 0 report and **(2)** `docs/DEMO_TWIN_PERSONA.md` (byte-exact copy from the Dropbox clone, `cmp`-verified, substance unchanged) → lands on `main`. This is the mechanism by which `main` "gains `docs/DEMO_TWIN_PERSONA.md`" in the §B.5 pre-slice-1 state.

### B.4 Ingestion-inventory protocol + non-membership
- Each new ingestion point (upload, paste, voice) adds a `REST_OF_SITE_DATA_CONTRACT_ADDENDUM.md` entry modelled on §22, **in the slice that builds it**.
- A slice that builds extraction/composer/checkers/summary-writer/skill-suggester does **not** add it to `inference-surface-registry.json` (per A.4).

### B.5 Sequencing (serial writes) — ruling
1. **Valvet slice-1 extraction runs as its own named session** (not this read-only one): commit `68e9474` is extracted onto branch `valvet-slice-1` **cut fresh from `origin/main`**, verified (`npm run verify`), pushed, and **merged to `main`** — bringing §22 (data-contract), the RETROFIT_LEDGER vault row, and `server/vault/` code. `docs-cv-engine-plan` then carries **only** the D22 draft, whose merge is a **separate** decision.
2. **The first docs commit (§B.3)** puts this report + `DEMO_TWIN_PERSONA.md` on `main`.
3. **Then** this build's slice 1 **rebases onto that `main`** (Valvet merge + twin persona present) and does its own writes.
- **This session performs neither the extraction nor any merge** (read-only). Slice 0 runs now, regardless of the Valvet queue.

### B.6 Gate: build start awaits D19 review or a waiver — run in parallel
Slice 1+ (any writing slice) does **not** start until **either** the rest-of-site build brief passes the D19 adversarial-review regime (rounds to 0 findings, records under `docs/reviews/`) **or** Daniel issues an explicit, recorded waiver. The planning thread runs this review **in parallel** with the Valvet extraction/merge — it is concurrent work on the timeline, not dead waiting time. Slice 0 is exempt (read-only).

### Path to slice 1 (parallel tracks converging)
```
Track 1 (separate session):  extract 68e9474 → valvet-slice-1 (from main) → verify → push → merge to main
Track 2 (this deliverable):  first docs commit → Slice 0 report + DEMO_TWIN_PERSONA.md → main   [held for sign-off]
Track 3 (planning thread):   D19 adversarial review → 0 findings  (or Daniel's recorded waiver)
                                     │
   all three land ─────────────────►│──►  slice 1 rebases onto main and begins
```

---

## C. Open dependencies (block slice 1, not Slice 0)
1. **D19 review or explicit recorded waiver** (§B.6) — hard gate on all writing slices; runs in parallel.
2. **Valvet slice-1 extraction + merge to main** (§B.5) — separate named session; the substrate slice 1 rebases onto.
3. **`DEMO_TWIN_PERSONA.md` into `~/dev` + on main** (§A.3/§B.3) — canonical content confirmed; needs the byte-exact copy from the Dropbox clone landed via the first docs commit. **Sign-off point:** confirm the copy-from-dead-Dropbox-clone path is the intended route (vs. re-placing the file directly in `~/dev`).
