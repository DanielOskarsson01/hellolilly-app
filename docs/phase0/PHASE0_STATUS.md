# Wave 1 - Phase 0 status (baseline freeze)

Branch: `wave1-phase0-baseline` off `main` @ `165920f`.
Governing spec: `docs/WAVE_1_BRIEF_honest-tailor_v3.4.md`, Phase 0 (0a-0e). The brief wins where this doc differs.

Reference machinery (LOCAL PARITY REFERENCE, never committed):
`JobSearch/CVs/generate-tailored-cv.js` + `generate_core_cvs.js`. Model `claude-sonnet-4-20250514`, English pipeline. Swedish output is owed-later (out of scope this wave) but SV sources are still preflighted per 0a.

---

## 0a PREFLIGHT - PASS

Gate: `harness/phase0/preflight.cjs` (run: `node harness/phase0/preflight.cjs`, override reference dir with `REF_CV_DIR`). Criterion per 0a is NON-EMPTY loads (the reference `loadFile()` warns-and-returns-`""` on a missing soft input, so "no errors" is not the test). The gate hard-fails on the first empty/missing input.

Result: **16/16 required inputs load non-empty.**

| Input | Result |
|-------|--------|
| cv_data.json | 33172 chars, parsed, identity_positioning present |
| COMPETENCY_MASTER_POOL.json | 7962 chars, parsed, categories present |
| CV_JOB_VARIANTS.md (symlink -> cv-source/en) | 33876 chars |
| CV_SECTION_VARIANTS.md (symlink -> cv-source/en) | 17808 chars |
| MASTER_CV.md (cv/MASTER_CV.md) | 14946 chars |
| highlight-pool.json | 8640 chars, parsed |
| i18n.js | loads; `en` label set present (small - 3 keys - but this is the file the reference has always run on) |
| images (5 files IMAGE_MAP references) | all present, 2.2-5.5 MB each |
| SV sources (cv_data, COMPETENCY pool, JOB + SECTION variants) | all present non-empty |

Live key: **`ANTHROPIC_API_KEY` present** in the environment. 0c capture is therefore NOT blocked on the key.

0a verdict: the reference can be fed full, non-empty CV source inputs. **PASS** - the CV-source oracle exists. (The remaining oracle input, the job ad, is pinned in 0b and carries the blocker below.)

---

## 0b AD PROPOSALS - AWAITING DANIEL'S APPROVAL (do not capture yet)

Three real ads, drawn from the store's real walkthrough case set (`server/data/store.db`, git-ignored):

| Role | Case | Company / role | Why |
|------|------|----------------|-----|
| **PRIMARY** | `case_a48b0067` | Wrknest AB - Vikarierande Marknadschef, Goteborg (bank/fintech, 12-mo interim) | The real walkthrough case (do-not-scrub). Senior marketing leadership -> the tailor's home ground; strongest primary. |
| **SECOND** (P4) | `case_55cd7250` | Aloi AI AB - Senior Marketing Manager (Stockholm legal-tech, founding hire) | Senior marketing, but English + startup/AI flavour - a genuinely distinct second judgement, not a near-clone of the primary. |
| **CONTROL** (P3) | `case_4414212b` | Ramen Bae - Creative Strategist (remote, food/CPG brand) | Deliberately different role AND domain (creative strategist, food brand) so the tailor's selection must diverge - the differential-response control P3 needs. |

Alternates if you prefer: SECOND -> `case_cbacd95f` Brightsales (Marknadschef, data-driven B2B sales); CONTROL -> `case_38cb66da` Electrolux (Head of Content Design). Full case list: also ABAX (Product Marketing/GTM), Academic Work (Digital Marketing Specialist; Campaign Manager).

### BLOCKER before any capture (0c): the store holds only truncated ad snippets

Every case's `sourceInput` is a **~280-char intro snippet + the source URL**, not the full ad text (verified: Wrknest ends mid-sentence; the longer case fields are LLM-derived niche/fit analysis, not the verbatim ad). The reference tailor reads the pinned ad file verbatim and feeds it to the LLM - a truncated snippet would be a **degraded run**, which 0a explicitly disqualifies as the oracle.

To pin faithfully, for each of the three approved ads I need ONE of:
1. the **full ad text** pasted/supplied by Daniel (preferred - deterministic and durable), or
2. approval to **fetch from the source URL** (external action; these are live listings that may have expired):
   - Wrknest: `https://arbetsformedlingen.se/platsbanken/annonser/30629138`
   - Aloi AI: `https://arbetsformedlingen.se/platsbanken/annonser/31216243`
   - Ramen Bae: `https://remoteOK.com/remote-jobs/remote-creative-strategist-ramen-bae-1134585`

---

## Gated - NOT started this session

- **0c-0d (capture + fixtures + template definition):** blocked on (1) Daniel approving the three ads and (2) the full ad text per the blocker above. Once unblocked: run the reference once per ad, record each ad's selected variant, build the two-tier fixtures (synthetic committed; real kept as LOCAL PARITY REFERENCES with a committed manifest of identifiers + checksums + run config), extract the template definition with the two named judgement calls.
- **0e (baseline confirmation):** blocked on 0c-0d; Daniel must confirm the three reference outputs look like the good CVs he remembers. Mandated gate before Item 1.
- **Item 1+**: not started. Phase 0 must complete and be confirmed first.

## Committed this session (branch only; push deferred until Phase 0 completes, per the brief)
- `harness/phase0/preflight.cjs` - the 0a gate.
- `docs/phase0/PHASE0_STATUS.md` - this file.
