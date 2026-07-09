# "Innan du skickar" (pre-send fit-check) — build report

**Date:** 2026-07-08
**Branch:** `presend-fitcheck` (worktree `.claude/worktrees/presend-fitcheck`), off `main` @ `a8f43a3`.
**Status:** Code-complete, reviewed, green. **NOT merged, NOT pushed** — awaiting independent review + your merge decision.
**Spec:** `docs/superpowers/specs/2026-07-08-innan-du-skickar-presend-design.md` · **Plan:** `docs/superpowers/plans/2026-07-08-innan-du-skickar-presend.md`

## Result
- **Tests:** baseline 201 pass on `main`; final **221 pass / 0 fail / 1 skipped** (1 pre-existing env-conditional skip; includes the two post-review honesty fixes below). **Fresh-clone holds** — verified on a bare `/tmp` clone of the pushed branch: `git clone` → `npm ci` → `npm test` = **221 / 0 / 1**. (Correction: an earlier check that ran the suite *without* `npm install` reported a false green — the worktree is nested inside the main repo, so Node resolved the *parent's* `node_modules`. Without install a true bare clone fails `api.test.cjs` (`vite`) and `i18n.test.mjs` (`react`) on those declared deps — both pre-existing, resolved by the standard `npm install`. Clone → install → test is the correct check, and it passes.)
- **Execution:** subagent-driven, 8 tasks (Task 1 dropped in pre-flight — see below), fresh implementer + independent task reviewer per task, a final whole-branch review (verdict: *ready to merge with Minor fixes; no Critical/Important*), then **two honesty fixes applied + independently reviewed** (findings §ns 1–2 below).
- Branch tip after fixes: `551bad6`. Spec+plan at `719b0d9`. No merge.

## What shipped
- **4 pure client logic modules** (`src/lib/`), each with co-located `node --test` tests: `presendCoverage` (Part 1), `presendKeywords` (scan + basis-finder), `presendReadiness` (tone), `presendLetterFit`.
- **Server honesty gate** `server/skeleton/fill-gap/keyword-judge.cjs` (`applyAlign`) + endpoint `POST /api/case/:caseId/cv/align-keyword` + client `caseApi.alignKeyword` + `useCase` action.
- **Screen** `src/screens/presend.jsx` (`InnanDuSkickar`) ported from the design onto the real `useActiveCase()` + `casePartsView()`, plus route (`innan-du-skickar`, `template:true`), nav entry after `ansokningskoll`, a `TOOL_SPEC`, and the `ll-presend` CSS block in `src/styles/hello-lily.css`.
- **`#ansokningskoll` ComingSoon stub + its TOOL_SPEC: untouched** (verified in the final review).

## The two mandated gates (both proven by test)
1. **Draft-coverage ≠ Matchanalys** (`presendCoverage.test.mjs`): a `status:'match'` requirement whose `evidenceRef.id` is **absent from the CV draft's datafact set** resolves to **weak** — proven against a fixture that keeps the datafact in the bank but omits it from the draft. Pure set intersection, no LLM.
2. **Server-side keyword-judge refuses without a resolvable basis** (`keyword-judge.test.cjs`, 4 tests incl. idempotency): valid basis → aligned (term written, `datafactRef` preserved, `priorText` stored, reversible); no basis / unresolved basis / writing-rules fail → refused, nothing written. The endpoint only delegates to `applyAlign` — the guardrail cannot be bypassed from the client.

## Design gaps answered
- **(c) `fit.capability` semantics.** Resolved. Part 1 recomputes coverage against the **drafted CV** via the datafact-id intersection (`fit…evidenceRef.id ∈ cvDraft…datafactRef.id`), not the evidence-bank verdict. This is the correctness point and it is tested.
- **(d) Align persistence.** Resolved per your decision: the align is a **real, reversible, server-gated write** into the existing `cvDraft` part (no new part/schema). `priorText` is stored for undo; `datafactRef` is preserved so the underlying truth is unchanged. The refuse path is intact and enforced server-side.
- **(e) Readiness thresholds.** `HIGH_WEIGHT = 0.8` (single tunable constant); a requirement `weight >= 0.8` that isn't answered forces `work`. **Qualitative only — no `%` anywhere** (an honest "X av Y" count is allowed).
- **(f) Keyword-diff quality.** High-precision extraction (quoted phrases + ALLCAPS acronyms) + a conservative lexical basis-finder. Deliberately **non-exhaustive**; the panel is framed **"Nyckelordsluckor vi hittade — inte en fullständig lista" / "Keyword gaps we spotted — not an exhaustive list"** (Flag 1) so under-coverage never reads as false reassurance. The honesty boundary is the basis-finder: no lexical basis → not alignable → the align refuses.

## Honesty invariants (final review confirmed all hold)
Draft-coverage is a real DRAFT read (not the bank); the server align guardrail is unbypassable and truth-preserving/reversible; no number/percentage; letter-fit never fabricates (`addressed` is `null` where undeterminable, real `unsupported_by_cv` surfaced); §0 distinction preserved (the `.presubj` strip, draft-vs-background framing, every fix links OUT to `#match`, no fill-gap loop); ephemeral except the explicit align; `#ansokningskoll` untouched.

## Final-review findings + dispositions
1. **[FIXED — `bf289db`] Server-side term↔basis relatedness enforced.** `applyAlign` now refuses unless ≥1 token (≥3 chars) of `term` is a substring of the basis datafact's text — a rule byte-identical to the client `findBasis`, sitting in the only path to the write. Closes the API bypass hole (the endpoint smoke test's aligned case had used an *unrelated* term that only passed because the check didn't exist; corrected to a related pair). Independently reviewed: guardrail holds server-side, nothing weakened.
2. **[FIXED — `551bad6`] Align errors no longer render as honesty refusals.** A thrown/transport failure now sets a distinct `error` row state with neutral, retryable copy ("Något gick fel — det gick inte att spara just nu. Försök igen.") — never the truth-based "your CV doesn't support it." The genuine judge-returned `refused` path is untouched; tokens-only CSS. Independently reviewed.
3. `presendCoverage` `else`→`missing` fallthrough lacks a clarifying comment (maintainability — left for independent review).
4. Design-faithful raw hex text-colors + some raw px in the CSS block (no exact token equivalents; documented ports).
5. A now-dead defensive `else` branch in `presend.jsx` after the `coreReady` guard (harmless).

## Logged follow-ups (deferred by design, not this build)
- Real semantic **letter-fit read** (paragraph→requirement) to replace the honest `addressed:null`.
- Real semantic **keyword basis source** (beyond lexical overlap) — richer term-diff.
- Optional `_pool` in the GET-case response for citation **type** labels (traceability already works without it).
- The three dead `#ansokningskoll` links (separate concern per the build scope).
- A per-item **undo UI** for an aligned keyword (the data — `priorText` — is already stored).
- Pre-existing: `useCase.js` `wrap()` dispatches `notifyCaseChanged()` unconditionally in `finally` (all actions; out of this build's scope).

## Pre-flight correction
Original plan Task 1 (extract a shared server term-matcher) was **dropped**: the keyword scan is a client module, so importing server `.cjs` into the Vite client bundle would be a layering break, and with the client inlining its own ~8-line word-boundary matcher the extraction had no second consumer (YAGNI). `stage2-filter/execute.cjs` was left untouched.

## Next step
Independent review of the branch, then your merge decision. Nothing of mine has been merged or pushed.

**Note on `main` (multi-window):** during this session `main` advanced `a8f43a3` → `24528b7` via **5 docs-only commits authored by you** (rest-of-site plan, wireframes, D9 decision, product-vision archive) — committed from another window. This is benign: `presend-fitcheck` is based on `a8f43a3` (still the merge-base), **none of its commits are on `main`**, and there is **zero file overlap** (your commits are `docs/product-vision` / rest-of-site docs; mine are `src` / `server` / `docs/superpowers`). A merge of `presend-fitcheck` into current `main` should be clean. Revert point: `main` is unaffected by this build; the feature is fully isolated on its branch.

---

## Recovery-session addendum (2026-07-09) — Daniel's three final-instruction fixes applied

The 2026-07-08 window closed before the final instructions arrived. This session applied the three decided fixes. **Still NOT merged, NOT pushed to `main` — branch pushed to `origin/presend-fitcheck` for independent review only.** Suite: **221 → 225 pass / 0 fail / 1 skipped** (+4 tests, no regressions).

1. **Fix 1 — term↔basis relatedness is now judge-backed, superseding finding §1's lexical-only guard (`bf289db`).** Daniel's decision: lexical overlap is "acceptable only as a conservative pre-filter, never the sole test" — a term can honestly relate to a fact while sharing zero words, so a pure-lexical guard would false-refuse legitimate semantic pairs. `applyAlign` now takes `(store, llm, opts)`: lexical token overlap **fast-accepts** (skips the LLM); a **word-disjoint** pair defers to a new `judgeRelatedness()` LLM judge (sibling to `bullet-judge`) rather than refusing on lexical grounds. A refusal always requires the judge to decline. **Degradation:** when no `llm` is available (no `ANTHROPIC_API_KEY`), a word-disjoint pair is refused conservatively (cannot verify → don't write an unverified claim). Endpoint threads the same `llm` as the gap/answer path. Tests (`keyword-judge.test.cjs`, one per direction): word-disjoint **related** → judge consulted → **aligned** (never refused); word-disjoint **unrelated** → judge → **refused**, nothing written.
2. **Fix 2 — the mandated test was missing (the `551bad6` client fix shipped without one).** Added `caseApi.test.mjs` contract tests locking the transport-error-≠-refusal distinction at the seam the screen switches on: a forced **500 rejects** (→ screen `catch` → `'error'` state, retry copy — never the refusal copy); a genuine **refusal resolves** to `{outcome:'refused'}` (→ `'refused'` honesty copy). No React render harness exists, so the API seam is the honest test boundary; a rejection can never reach the `r.outcome === 'refused'` branch.
3. **Fix 3 — verified already compliant, no code change.** Every user-facing string in `presend.jsx` uses `tr({sv,en})` (92 usages; all `title=` attrs included). The `label="Innan du skickar"` prop is a non-rendered `data-screen-label` attribute, not user-facing. The review's "Swedish panel copy" was the design-source file; the port to `src/screens/presend.jsx` already applied i18n throughout.

## Reconciliation + substring-hole fix (2026-07-09, on `main`)

Superseding the "NOT merged" note above: `judgeRelatedness` was verified **absent** from `main`, so `origin/presend-fitcheck` was merged into `main` (merge `88c8b04`, clean; suite **226/226/0/0**). Then the pre-filter's substring fast-accept was closed on `main`: it now matches on **whole-word token equality**, never substring containment — term "Java" no longer fast-accepts against a basis mentioning "JavaScript" (a pair the judge never ruled on); a substring-only match defers to `judgeRelatedness` like any word-disjoint pair. The fast-accept-only property is preserved (a whole-word match still skips the judge; a refusal always requires the judge to decline). Suite after: **228/228/0/0**.

**Follow-up logged (not built) — Refusal reason attribution:** a no-LLM conservative refusal (could not verify) currently renders identically to a judged-unrelated refusal; a reason code on the refusal payload should distinguish them. Same misattribution class as the Fix 2 transport-error split. Rides with the next presend-touching session.

**Optional hardening, non-blocking:** the `api.test.cjs` aligned round-trip validates endpoint plumbing via the idempotent early-return, not the relatedness pre-filter — give it a single-word term not already present in the basis. Rides with the next presend-touching session.
