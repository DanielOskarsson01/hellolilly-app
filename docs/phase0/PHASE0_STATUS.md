# Wave 1 - Phase 0 status (baseline freeze)

Branch: `wave1-phase0-baseline` off `main` @ `165920f`.
Governing spec: `docs/WAVE_1_BRIEF_honest-tailor_v3.4.md`, Phase 0 (0a-0e). The brief wins where this doc differs.

**State: PHASE 0 COMPLETE. 0e confirmed by Daniel on 2026-07-16. Branch pushed. Item 1 NOT started (separate task).**

Reference machinery (LOCAL PARITY REFERENCE, never committed): `JobSearch/CVs/generate-tailored-cv.js` + `generate_core_cvs.js`. English pipeline.

---

## Model substitution (recorded in the manifest)

Original pinned model `claude-sonnet-4-20250514` reached **EOL 2026-06-15** and now 404s. Per Daniel's approval, substituted with **`claude-sonnet-4-6`** (current Sonnet, direct successor) on 2026-07-16, reason: EOL. Method: a local copy of the reference with ONLY the model id changed (original untouched; diff at `harness/phase0/local/reference-substitute/model-swap.diff`; original sha `4155bd8c…` unchanged).

**Standing rule (manifest):** all parity runs this wave use the SAME model id (`claude-sonnet-4-6`) for BOTH the reference substitute and the HelloLilly tailor - the model is held constant so the machinery is the only variable the parity tests measure.

---

## 0a PREFLIGHT - PASS
`harness/phase0/preflight.cjs`: 16/16 required reference inputs load non-empty; `ANTHROPIC_API_KEY` present.

## 0b ADS - verified & pinned (LOCAL, never committed)
| Ad | Source (same listing id) | Title / company | sha256 / bytes |
|----|----|----|----|
| PRIMARY Wrknest | JobTech live `/ad/30629138` | `Vikarierande Marknadschef…` / `Wrknest AB` | `02eafdae…` / 3794 |
| SECOND Aloi AI | JobTech historical `/ad/31216243` | `Senior Marketing Manager` / `Aloi AI AB` | `b566fb22…` / 2406 |
| CONTROL Ramen Bae | RemoteOK page body | `Creative Strategist` / `Ramen Bae` | `496a487a…` / 5868 |
All three verified (title+company match, complete). Pinned at `harness/phase0/local/ads/`.

## 0c CAPTURES - DONE (3 runs, one per ad)
Ran the substitute reference once per ad. Outputs (RESPONSE json + tailored CV docx + suggestions docx + run log) captured to `harness/phase0/local/captures/<role>/` (never committed).

| Ad | Selected variant | Company slug |
|----|------------------|--------------|
| PRIMARY Wrknest | `cmo` | Wrknest_Marknadschef_Fintech |
| SECOND Aloi AI | `cmo` | Aloi |
| CONTROL Ramen Bae | `cmo` | RamenBae |

**Observation for your 0e review:** all three selected the `cmo` variant (each ad's own run is recorded per the brief - this is allowed). The CONTROL landing on the same variant as the PRIMARY means P3's differential signal will come from the *content selection within* the variant, not the variant choice. That selection *does* differ: competency categories per ad - PRIMARY {Marketing & Growth, Leadership & Scaling, Operations & Execution}, SECOND {Marketing & Growth, Data & Analytics, Digital & Innovation}, CONTROL {Marketing & Growth, Data & Analytics, Operations & Execution}; item counts differ too. It responds to the ad, but PRIMARY vs CONTROL overlap is moderate. If you want a sharper CONTROL for P3 headroom, name a replacement now - it re-passes the 0b approval step. Otherwise this stands.

## 0d FIXTURES / TEMPLATE / MANIFEST - DONE (committed, synthetic tier)
- `harness/phase0/TEMPLATE_DEFINITION.md` - structural definition from the reference code, cross-checked against the 3 captures, with the **two named judgement calls** (JC1 cardinality bounds; JC2 all-sections-non-empty), both validated against captures and **vetoable by you at 0e**.
- `harness/phase0/fixtures/` - `synthetic-ad.txt`, `synthetic-corpus.json` (same shape as real data, fabricated), `extraction-and-normalisation-rules.md`, `normalise.cjs` (self-check passes).
- `harness/phase0/MANIFEST.json` - identifiers + content checksums for the 3 ads, 3 captured outputs, the 144-item datafact pool snapshot, and the curated corpus; plus run config (model, sampling temp 0.2 / max_tokens 8000, prompt version = reference code sha, corpus version, run date) and the substitution + same-model records. No real content.
- `harness/phase0/local/corpus/corpus-snapshot.json` - the real datafact-pool state + curated refs (never committed).

`npm run verify` green offline (279/279 + build); `normalise.cjs` and `preflight.cjs` self-checks pass.

---

## 0e - CONFIRMED (Daniel, 2026-07-16)

Baseline confirmation recorded (see `MANIFEST.json` -> `phase0_decisions`):
1. The three reference CVs look like the good CVs - **baseline confirmed**.
2. Model substitution to `claude-sonnet-4-6` **accepted** as the Wave 1 baseline. Wave 1 does no writing (selection/reordering only), so `claude-opus-4-8` is **designated for the next wave** (the suggestion engine, D20c) where writing happens - not used this wave. Both model ids validated live.
3. Named judgement calls JC1 (cardinality) and JC2 (all-sections-non-empty) **adopted** (not vetoed).
4. CONTROL (Ramen Bae) **stands** (not replaced).

### Header-image design decision
The reference forces the header shorter than its true aspect at width 800 (medium 280 vs natural 316; large 400 vs 452; small 160 vs 181 - all slightly squished). Decision: the **HelloLilly renderer** uses natural/undistorted heights **316/452/181**; the **reference oracle stays frozen** at 280/400/160 (honest historical baseline). Image is static/structural, not a parity-graded node - a deliberate design improvement, not a regression. Recorded in `TEMPLATE_DEFINITION.md` and `MANIFEST.json`. Item 1's renderer applies these heights.

**Phase 0 is COMPLETE.** Branch pushed. Item 1 build is a separate task - NOT started here.

## Committed on branch (pushed - Phase 0 complete)
`harness/phase0/`: `preflight.cjs`, `build-manifest.py`, `MANIFEST.json`, `TEMPLATE_DEFINITION.md`, `fixtures/*`; `docs/phase0/PHASE0_STATUS.md`; `.gitignore` (local rule).
