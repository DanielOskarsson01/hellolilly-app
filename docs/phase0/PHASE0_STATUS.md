# Wave 1 - Phase 0 status (baseline freeze)

Branch: `wave1-phase0-baseline` off `main` @ `165920f`.
Governing spec: `docs/WAVE_1_BRIEF_honest-tailor_v3.4.md`, Phase 0 (0a-0e). The brief wins where this doc differs.

**State: 0a-0d COMPLETE. STOPPED at 0e for Daniel's baseline confirmation (mandated gate).**

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

## 0e - STOPPED HERE: your baseline confirmation is required (mandated gate)

Per 0e, before Item 1 can start you must confirm: **do the three reference outputs look like the good CVs you remember?** If not, STOP - the baseline is wrong.

Open these three (local, git-ignored):
- `harness/phase0/local/captures/primary-wrknest/CV_Daniel_Oskarsson_Wrknest_Marknadschef_Fintech_tailored.docx`
- `harness/phase0/local/captures/second-aloi/CV_Daniel_Oskarsson_Aloi_tailored.docx`
- `harness/phase0/local/captures/control-ramenbae/CV_Daniel_Oskarsson_RamenBae_tailored.docx`

Please confirm (1) the three CVs look right (recorded as your baseline confirmation), (2) the model substitution to `claude-sonnet-4-6` is accepted as baseline, (3) the two named judgement calls (JC1/JC2 in TEMPLATE_DEFINITION.md) - accept or veto, and (4) whether the CONTROL stands or you want a sharper one (which re-passes 0b).

On your confirmation: I record it, Phase 0 completes, I push the branch, and Item 1 build can start. **Item 1 is NOT started.**

## Committed on branch (push deferred until 0e confirmation, per the brief)
`harness/phase0/`: `preflight.cjs`, `build-manifest.py`, `MANIFEST.json`, `TEMPLATE_DEFINITION.md`, `fixtures/*`; `docs/phase0/PHASE0_STATUS.md`; `.gitignore` (local rule).
