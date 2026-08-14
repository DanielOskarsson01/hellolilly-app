# HelloLilly - Backlog (deferred items, not forgotten)

Parked work and deferred decisions. None blocking. Kept here so they survive (chat-only items get lost - the recurring lesson). Commit this to `docs/` so it's durable in the repo.

Last updated: 2026-08-14 (Wave 2: attestation "Vet inte / blandat" ask-flow recorded as owed). 2026-07-16 (PDF-as-first-class-output requirement added to the CV-builder wave). 2026-07-14: Wave A merged; first real-user walkthrough complete; North Star adopted, D14-D18.

---

## Deferred features (need infrastructure or a trigger that doesn't exist yet)

### Hosted / cloud persistence (the "make it live" bundle)
- **Status:** deferred by explicit decision - Daniel does not need the public site live now.
- The app is a **local-dev-server experience**: SQLite via the local dev-server, durable on the machine running it. The static GitHub Pages build has no server, so `/api/*` and the durable store only exist locally.
- **If ever needed:** shortest path is the existing Hetzner box (188.245.110.34, PM2) - deploy `dev-server.cjs` as a PM2 service serving both the SPA and `/api/*` same-origin (avoids CORS + configurable-API-base-URL work). Considerations: env vars, LLM API keys on the server (secured), SQLite location + backups, domain, HTTPS. Do as its own focused session; do NOT let it become a frontend rewrite (same-origin is fine).
- **Related (Progress Support):** D5 storage is a local-backend mechanism. If a content type ever needs cloud persistence, it's a separate client-side storage adapter behind the same store interface - a separate, larger piece. Not needed while local-only.

### Actively-delivered push reminders (Progress Support)
- **Status:** deferred - infrastructure-blocked, confirmed by investigation.
- No push/service-worker/email/cron/queue anywhere; static deploy; local-only server = nowhere for a background nudge to fire from.
- The **in-app** "due/overdue/next-step" surface (built in the Progress Support wave) stands in for now.
- **If ever needed:** requires a hosted always-on service + a push/email channel + a scheduler. Pairs naturally with the hosted-persistence bundle above.

### Attestation "Vet inte / blandat" ask-flow (Wave 2, owed)
- **Status:** deferred - the option exists; the ask-flow behind it does not yet.
- **What:** on the Källmaterial intake, the third attestation option is "Vet inte / blandat". Today it is stored as `other` + ownership `third_party`, so it is **barred as an experience source** (deterministic, same protection as declared third-party material). The copy now states exactly that ("används inte som din erfarenhet förrän du sagt vad det är") - it no longer promises "Lilly frågar innan något används", because there is no ask-flow to honour that promise. A label must not promise behaviour the system lacks.
- **Owed:** the actual ask-flow - Lilly prompts the person to clarify what an uncertain/mixed document is (or which parts are theirs), and on clarification the document/spans are re-attested to a usable class so the real experience inside a mixed doc stops being silently barred. Until then, uncertain material is safely parked, not used.
- **Where:** `src/screens/sourceMaterial.jsx` (`CLASS_OPTIONS`, the `unknown` bucket) + `server/skeleton/documents/index.cjs` (would need a re-attestation path). The bucket is already distinguishable at rest (class `other` + ownership `third_party`) so a future flow can find exactly these documents.

---

## Deferred until a trigger fires

### Coach-facing surfaces (D4 trigger: first pilot coach signs on)
- Ärendevy (coach case-view), Coach Review, Coach Network, Network Match, Community, the cross-user learning layer.
- All ship as **labelled demos with a fixture coach cast** until the trigger.
- **Note:** the ONE real activity collection (built in the Progress Support wave) is designed to serve both the jobseeker view (Min aktivitet, real now) AND the coach view (Ärendevy, demo until D4). When D4 fires, Ärendevy reads the log that's been accumulating since the Progress Support wave - so the pilot coach sees full real history, not an empty timeline.

### D9 - CONSCIOUSLY CONFIRM (moves the D4 trigger)
- D9 ("Daniel as first pilot coach, messaging-bridge model") was recorded during a docs-hygiene session and **refines the D4 trigger**. This moves the single biggest structural decision in the roadmap (when multi-user identity gets built).
- **Action:** Daniel to give D9 a deliberate look and confirm he intended it as recorded - not leave it half-inherited from a cleanup commit.

---

## The CV-builder side project (D15 - after current work)

### CV-builder accumulation brief
- **What:** after the current work, gather the original JobSearch/CVs machinery, the CV templates, the orientation report in `WALKTHROUGH_FINDINGS_COMPLETE.md`, and the walkthrough findings into a spec package for another agent to spec the CV-builder side project, which then integrates into HelloLilly.
- **Why deferred:** D15 - the CV builder is in scope but built separately, after current work. Not the focus of the current discussion, by Daniel's instruction.
- **Full framing:** `HELLOLILLY_NORTH_STAR.md` §2 and §7. (This is a note that the brief is owed, not the brief itself - briefs are produced separately, WHAT/WHY only.)

### PDF as a first-class output, not only .docx (Daniel, 2026-07-16)
- **Requirement:** the CV tool must produce a ready-to-send **PDF**, not just an editable `.docx`. PDF is part of the process and the tool - a first-class output, not a manual afterthought. (Applies to cover letters too.)
- **Mechanism (proven in Wave 1 Phase 0):** the `docx` library emits `.docx` only; convert with **LibreOffice headless** as a post-render step - `soffice --headless --convert-to pdf <file>.docx`. High fidelity, already installed locally; it is exactly what produced the Phase 0 CV/PDF previews.
- **Deployment note:** a hosted renderer needs LibreOffice (or an equivalent docx->pdf engine) available server-side - pairs with the hosted-persistence bundle above.
- **Owner:** rendering is an owed-later outcome per the Wave 1 brief; it lands with this CV-builder wave, wired as a post-render step (docx -> PDF). NOT welded into the Wave 1 tailor.

---

## Docs corrections (keep the plan-of-record accurate)

### Naming split - "Innan du skickar" vs "Ansökningskoll"
- **Resolved in build, needs docs update:** "Innan du skickar" (shipped) = the pre-send fit-check (no D5, ephemeral). **Ansökningskoll** = the *tracking* screen (post-send, NOT yet built) = **D5's real first customer** was originally thought to be this, but Progress Support's activity collection is now the actual first D5 customer.
- **Update:** KIND3_ROADMAP + DECISIONS_ADDENDUM (D5) - correct the "Ansökningskoll's application card is D5's first customer" line. Activity events (Progress Support) are the first real collection; the tracking screen is a later collection customer.

### Provenance-tracking follow-up
- Commit `3df846d` deleted superseded product-vision originals, citing `docs/product-vision/README.md` + `archive/` as justification - but those are **untracked**, so git preserves neither.
- **Action:** one-line follow-up commit to track `docs/product-vision/README.md` + `archive/` so the deletion justification is durable.

### RESUME.md refresh
- Mark the Kind-1 spine **complete** (all 5 screens merged, final commit `37a2b27`); point `## Now` at Kind-3 / Progress Support. (Recurring hazard: stale RESUME misleads the next session.)

---

## Logged engineering follow-ups (real future work, not blockers)

- **Real semantic letter-fit read** (Innan du skickar) - currently contract-only/honest-silence; pairs with a future letter-analysis engine.
- **Richer keyword basis source** (Innan du skickar) - currently high-precision only (quoted phrases + ALLCAPS); stemming/multiword/synonyms later.
- **Aligned-keyword undo UI** (Innan du skickar) - the align is reversible in data (priorText stored); the undo affordance isn't surfaced yet.
- **vitest + jsdom frontend test harness** - frontend component tests (own unit).
- **CV-intake datafact-mint engine** - turn uploaded documents into verified CV facts; pairs with interview-prep Stage 6's harvest.
- **Delete orphaned JobAnalysisContent + localStorage-link imports** (dead code from the core-loop wave).
- **Point-and-build the #ansokningskoll route** - three shipped screens link to it and dead-end on the ComingSoon stub (this is the tracking screen, a later build).
- **Merged-branch/worktree cleanup** - delete merged branches + remove stale worktrees after each merge (recurring collision hazard when left around).
- **Orphan-datafact sweep** - documented crash-window residual: a minted fill-gap fact whose resolution write fails can linger unreferenced, and the cv-builder mines `listDatafacts()` directly, so a stray fact could leak into a generated CV. One-off sweep for datafacts referenced by no case. (Sibling of the orphan activity rows with no `caseId`.)
- **Node x64/arm64 Rolldown arch mismatch** - flagged in review: the Vite/Rolldown native binary must match the running machine's architecture; an x64 `node_modules` opened under arm64 Node (or the reverse) breaks the build. Fix is a reinstall on the running arch. Pairs with the Dropbox-two-machines risk below.
- **Repo-in-Dropbox-two-machines risk** (risk to mitigate, not a feature) - the repo lives under Dropbox; two machines syncing it can corrupt `.git`, race `node_modules`/native binaries (see the Rolldown item above), and clobber each other's `main`. Mitigation: one active build machine at a time, one machine owns `main`, never build on both concurrently. (Noted as a hazard in the master plan; recorded here so it survives as a tracked item.)

---

## Interview-prep (the main Kind-3 thrust, after Progress Support)

Full stage-by-stage map is in `docs/KIND3_ROADMAP.md`. Most native area - stages map onto existing contract slots (prep/cards/liveLog/postMortem). Build order within it: Stage 1 Intake -> 2-thin Research -> 3 Analysis (largely Matchanalys reuse) -> 4 Prep package -> 6-manual Post-mortem, then 2-full (the research drill-loop), then Stage-5 replay harness, live audio last. Deep spec: INTERVIEW_PREP_CONCEPT_FINAL.md.
