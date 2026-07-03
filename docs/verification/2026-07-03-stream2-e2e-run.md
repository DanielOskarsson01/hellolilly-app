# Verification run — Stream 2 bridge, live end-to-end (2026-07-03)

**What ran:** the real dev server (`npm run dev`, node v26, worktree checkout of branch `claude/relaxed-knuth-3ee7ea`), with REAL clients — Anthropic (Opus 4.8, `ANTHROPIC_API_KEY`) and Perplexity (`PERPLEXITY_API_KEY`) from a local `.env`; `CV_DATA_PATH` pointed at the sibling `JobSearch/CVs/cv-source/en/cv_data.json` (133 datafacts seeded). No mocks anywhere in this run. Store: `server/data/store.json` (JSON snapshot persistence), started empty.

**The case:** `case_39ca4173` — *Marknadschef till snabbväxande bolag inom datadriven nykundsförsäljning*, **Brightsales i Stockholm AB**, a real Platsbanken ad found live during the run.

**The flow, driven entirely through the UI (browser at localhost:5173):**

1. **Jobbsök** — search `marknadschef, cmo, marketing manager` → `POST /api/jobs/search` → in-repo `job-discovery` → 14 real Platsbanken jobs (also persisted to the `jobs` collection). Accepted the Brightsales job ("Ansök").
2. **Matchanalys → Analysera** — `POST /api/case` created the case (201); the analysis layover then drove the pipeline off real part statuses:
   - `POST /api/case/:id/research` → dossiers `pending` → `ready` (~30 s), decodedRole `pending` → `ready` (~60 s total) — real Perplexity grounding + Opus synthesis, brokered decoder.
   - auto `POST /api/case/:id/analyze` → fit + gaps `ready` (~30 s). Result: **58 % match, 7 of 12 decoded requirements**, honest overall verdict, 3 named gaps (outbound/SDR vocabulary; led-teams-vs-solo-marketer; iGaming-vs-commoditized-service repositioning), each with a bridge.
   - auto background `POST /api/case/:id/generate` → cvDraft `ready` (8 sections, all selected datafacts) + coverLetter `ready` (5 paragraphs; opens with the real ComeOn BI story).
3. **Fill-gap loop** — `POST /api/case/:id/gap/:gapId/answer` with a deliberately vague answer → **`stays_gap`** with the judge's reason rendered in the UI ("The answer is vague and hedged … Cannot be made truthful"). No datafact minted. (The `accepted` path was NOT exercised live — that would mint a permanent datafact from text the agent invented about Daniel, which the honesty bar forbids; it is covered by unit tests `server/api.test.cjs` + `bullet-judge.test.cjs`, and Daniel exercises it with a true answer.)
4. **CV / Brev screens** — rendered the real `cvDraft` (role/company header, 8 sections) and `coverLetter` with the honesty panel listing **2 `unsupported_by_cv` claims** for review.
5. **Hem / Min aktivitet** — hero showed "Brightsales … 58 % match, 3 luckor kvar"; next-step card "Fyll 3 luckor"; activity strip showed the six part envelopes with real timestamps.
6. **Restart survival** — server stopped and restarted: all six parts still `ready`, 8 CV sections, 5 letter paragraphs, 133 datafacts — restored from `server/data/store.json`. An earlier restart mid-run also proved the in-flight case survived.

**Found and fixed during this run** (committed on the branch): `GET /api/case/:id` omitted the `dossiers` envelope, which silently prevented the pipeline from ever starting research (`052ea3f`); duplicate `items[]`/React keys when two search terms return the same job (`dae152a`); researcher stranding `dossiers` in `pending` on a crashed run + swallowed POST errors + filterSet exclude-term accumulation (`4bf3fb5`, from the branch code review).

**Suite state at the end of the run:** `npm test` — 147 tests, 146 pass, 1 skip (pre-existing sibling-file guard), 0 fail. `vite build` clean.
