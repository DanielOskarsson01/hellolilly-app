# Wave 1 - Phase 0 status (baseline freeze)

Branch: `wave1-phase0-baseline` off `main` @ `165920f`.
Governing spec: `docs/WAVE_1_BRIEF_honest-tailor_v3.4.md`, Phase 0 (0a-0e). The brief wins where this doc differs.

Reference machinery (LOCAL PARITY REFERENCE, never committed):
`JobSearch/CVs/generate-tailored-cv.js` + `generate_core_cvs.js`. English pipeline. Swedish output owed-later (out of scope) but SV sources preflighted per 0a.

---

## 0a PREFLIGHT - PASS

Gate: `harness/phase0/preflight.cjs`. Criterion is NON-EMPTY loads (the reference `loadFile()` warns-and-returns-`""` on a missing soft input, so "no errors" is not the test). **16/16 required inputs load non-empty**; `ANTHROPIC_API_KEY` present. (Full table in the prior commit's version of this file; unchanged.)

---

## 0b ADS - APPROVED, FETCHED, VERIFIED, PINNED

Daniel approved: PRIMARY Wrknest, SECOND Aloi AI, CONTROL Ramen Bae; instruction: fetch the three source URLs, extract verbatim ad text only, verify title+company match and completeness, keep as LOCAL PARITY REFERENCES (never committed, checksums in the manifest).

The store `sourceInput` held only ~280-char snippets, so the full ad text was fetched from each listing's own data endpoint (same listing ID; page-as-data, verbatim body only):

| Ad | Source (same listing) | Title / company vs case | Verify | Bytes / sha256 |
|----|----|----|----|----|
| PRIMARY Wrknest | JobTech live API `/ad/30629138` | `Vikarierande Marknadschef till Göteborg 🚀` / `Wrknest AB` | MATCH, complete | 3794 / `02eafdae…e62f5a43` |
| SECOND Aloi AI | JobTech historical API `/ad/31216243` (expired from live feed) | `Senior Marketing Manager` / `Aloi AI AB` | MATCH, complete | 2406 / `b566fb22…93206366` |
| CONTROL Ramen Bae | RemoteOK page body (JSON-LD was a truncated teaser; full body from visible HTML) | `Creative Strategist` / `Ramen Bae` | MATCH, complete | 5868 / `496a487a…c05298063` |

Pinned at `harness/phase0/local/ads/{primary-wrknest,second-aloi,control-ramenbae}.txt` (git-ignored). No STOP triggered - all three verified.

Fetch-method note: the literal SPA/page URLs return no ad text to a fetcher (Arbetsförmedlingen is a JS shell; RemoteOK 403s bots). The data endpoints above serve the SAME listing IDs verbatim - not a substitution.

---

## 0c CAPTURE - BLOCKED: the reference's pinned model is END-OF-LIFE

Running `generate-tailored-cv.js` on the PRIMARY ad failed:

```
NotFoundError: 404 {"type":"not_found_error","message":"model: claude-sonnet-4-20250514"}
The model 'claude-sonnet-4-20250514' is deprecated and reached end-of-life on June 15th, 2026.
```

The reference hardcodes `model: "claude-sonnet-4-20250514"` (generate-tailored-cv.js:452). That model is dead as of 2026-06-15; the API returns 404. The key works (this is a model error, not auth). No outputs were produced.

Per 0a's rule ("if the reference cannot be made to run faithfully on full inputs, STOP - there is no oracle") this is a STOP. The captured baseline **must** be the CVs Daniel remembers as good; the model is a recorded run-integrity field, and swapping it changes what the oracle produces. That is Daniel's decision, not the builder's.

**Needed from Daniel to unblock 0c (pick one):**
1. Approve substituting the reference model with a current one - recommended `claude-sonnet-5` (same tier, direct successor). I would run a local copy of the reference with only the model id changed (original reference left untouched), and record the substitution prominently as a run-integrity field in the manifest (original pinned model `claude-sonnet-4-20250514`, EOL 2026-06-15; substitute + date). The 0e gate then does its job: confirm the three outputs still look like the good CVs. If they do not, the baseline is rejected there.
2. Name a different model to standardise on.
3. Point at a captured set of the original sonnet-4 reference outputs from your own records (if any exist), to use as the frozen baseline without re-running.

Whichever path: a model substitution re-touches the oracle, so it is recorded and surfaced at 0e, exactly like an ad replacement re-passes approval.

---

## Done this session
- 0b ads fetched, verified (title+company match, complete), pinned as LOCAL PARITY REFERENCES with checksums.
- `harness/phase0/local/` created and git-ignored (FIXTURE LAW: real content never committed).

## Gated - NOT done
- **0c captures / 0d fixtures + template definition / manifest:** blocked on the reference-model decision above. The template definition cross-checks against the captured outputs and the cardinality judgement call is validated against them, so 0d cannot complete before 0c.
- **0e baseline confirmation:** downstream of 0c-0d.
- **Item 1+**: not started.

## Committed on branch (push deferred until Phase 0 completes, per the brief)
- `harness/phase0/preflight.cjs` (0a gate), `.gitignore` (local-parity-reference rule), `docs/phase0/PHASE0_STATUS.md` (this file).
