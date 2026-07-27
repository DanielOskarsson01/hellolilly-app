# Wave 2 — design entries and enforcement-tier markings

Per HELLOLILLY_ARCH_RULES Section 0: every path is marked **runtime-gated** (a
deterministic gate or judge sits in the path and fails closed at runtime) or
**regression-gated** (violations are caught by the eval corpus at change time).
Claiming the wrong tier is itself a violation. Brief of record:
`WAVE_2_BRIEF_suggestion-engine_v3.2.md` (FIT TO BUILD).

## Paths and tiers

| Path | Where | Tier | Mechanism |
|---|---|---|---|
| INVARIANT 1 — verified status | `server/skeleton/store/index.cjs` (`isVerifiedFact`, default reads) | **runtime-gated** | Default reads exclude non-verified at the datalayer root; raw reads are explicit host accessors; gate-4 test proves no submodule observes a quarantined fact. |
| INVARIANT 2 — span schema | `server/skeleton/documents/index.cjs` | **runtime-gated** | Schema-validated before write; a bad span aborts intake with an explicit failure. |
| INVARIANT 3 — attested-class barring | `documents/index.cjs` (`isBarredAsExperienceSource`) + `suggest/engine.cjs` propose | **runtime-gated** | Deterministic on attestation + ownership; barred documents' spans never reach any model. |
| INVARIANT 4 — numeral/date/duration grounding + authorship discriminator | `suggest/grounding.cjs`, enforced in `engine.cjs` (draft + accept) | **runtime-gated** | Deterministic digit-run token check; scope stated honestly: digit-bearing tokens only — worded numbers are Judge A's semantic territory (DISCIPLINE). Model-originated unsupported tokens refuse the mint; person-originated content mints as person-attested. |
| INVARIANT 5 — the recorded gate | `engine.cjs` accept/personMint + `isVerifiedFact` | **runtime-gated** | No non-curated fact reaches verified without an acceptance event carrying reviewed wording AND reviewed attribution (test: `server/invariant5.test.cjs`). Licenses the 3.5 eligibility loosening. |
| 5.4 gate realness — nonce + ceiling | `engine.cjs` serve/accept | **runtime-gated** | Single-use render-bound nonce; server-side rate ceiling (in-memory window — resets on restart, part of the D23 residual); session + device recorded. "Who accepted" is ATTESTED, NOT AUTHENTICATED until D13 fires (D23). |
| DISCIPLINE 1 — claim-addition (Judge A) | `suggest/judges.cjs` | **regression-gated** (runtime-informing) | Contract written at the judge (inputs exhaustive: spans, candidate wording, model draft; enveloped; separate invocation). Output classifies and flags; never silently blocks a person-authored mint. Zero-tolerance eval classes, 3 runs (Tier 2). |
| DISCIPLINE 2 — voice/ownership/negation (Judge B) | `suggest/judges.cjs`, applied in propose | **runtime-gated at draft time, regression-gated for detection quality** | A negative verdict bars the span as an experience source. The five named traps are the zero-tolerance corpus (`harness/wave2/trap-corpus.cjs`), 3 runs each (Tier 2); the third-party case is defended by INVARIANT 3, not this judge. |
| DISCIPLINE 3 — aggregation phrasing | drafter prompt + Judge A types (`duration`, `number`) | **regression-gated** | Deterministic core is INVARIANT 4; the semantic remainder is judged. |
| Drafter (maker) | `engine.cjs` propose, claude-opus-4-8 | **runtime-gated output side** | Output schema-validated; out-of-pool span ids dropped; unevidenced placement stripped to person-choice (3.6); INV4 + Judge A run on every draft. |
| Writing-rules gate at mint | `engine.cjs` accept/personMint | **runtime-gated for model wording, advisory for the person's own words** | A bare accept of model wording must pass the gate; person-edited/typed wording mints with warnings recorded (D14/D22 — the tool never audits the person). |
| Document intake surface | `dev-server.cjs` | **runtime-gated** | Dedicated routes only; the generic collection path refuses documents/spans/proposals on all three verbs; 5 MB ceiling; explicit parse-failure envelope. |
| Targeting affordance (Section 4) | `skeleton/targeting/index.cjs` | **honestly unlabelled as a gate** | Token-overlap support heuristic; it informs both graceful-failure faces, gates nothing. |

## Eval corpus

- **Tier 1 (offline, stubbed model, runs under `npm test` / CI):**
  `server/wave2-eval.test.cjs` — envelope + sentinel neutralisation for the new
  ingestion class, induced-auto-acceptance impossibility, INV3 barring, the
  DISCIPLINE-2 barring mechanism, the INV4 net + misattribution refusals. Plus
  `server/grounding.test.cjs`, `server/invariant1.test.cjs`, `server/invariant5.test.cjs`,
  `server/suggest-engine.test.cjs`, `server/documents*.test.cjs`, `server/tailor-eligibility.test.cjs`.
- **Tier 2 (live, real model, three runs per case — D12):**
  `harness/wave2/run-eval-live.cjs` over `harness/wave2/trap-corpus.cjs`
  (synthetic person-data only, Rule 4 fixture law).

## Stated residuals (named once, accepted)

- "Who accepted" is attested, not authenticated, until the D13 identity trigger
  fires (D23). The in-memory rate-ceiling window resets on restart — same residual class.
- Nothing catches a hurried typo or misremembered figure in person-attested
  material — by design (D22); every such fact is traceable (`grounding:
  'person-attested'`, dated acceptance) and editable later.
- PDF/DOCX parsing is OWED: plain text and pasted text only this pass (the
  brief's stated fallback). No parser dependency was taken.
- Minted `competency`-type facts lack the enriched `category` field, so they do
  not enter the tailor's categorised competency table until an enrichment pass
  assigns one. Job results, highlights, skills and other-experience mints are
  fully selectable.
- Legacy fill-gap facts (12) are permanently segregated (3.3): recreation via
  the person-typed path, never promotion. The old auto-mint path is deleted.
