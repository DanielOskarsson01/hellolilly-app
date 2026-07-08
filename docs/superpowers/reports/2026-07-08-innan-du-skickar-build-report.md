# "Innan du skickar" (pre-send fit-check) — build report

**Date:** 2026-07-08
**Branch:** `presend-fitcheck` (worktree `.claude/worktrees/presend-fitcheck`), off `main` @ `a8f43a3`.
**Status:** Code-complete, reviewed, green. **NOT merged, NOT pushed** — awaiting independent review + your merge decision.
**Spec:** `docs/superpowers/specs/2026-07-08-innan-du-skickar-presend-design.md` · **Plan:** `docs/superpowers/plans/2026-07-08-innan-du-skickar-presend.md`

## Result
- **Tests:** baseline 201 pass on `main`; final **220 pass / 0 fail / 1 skipped** (1 pre-existing env-conditional skip). **Fresh-clone holds** — the suite passes with **no `node_modules`** (220/0), so a clean checkout is green.
- **Execution:** subagent-driven, 8 tasks (Task 1 dropped in pre-flight — see below), fresh implementer + independent task reviewer per task, plus a final whole-branch review (verdict: *ready to merge with Minor fixes; no Critical/Important*).
- **11 commits** on the branch: `719b0d9` (spec+plan) → `74ec8d2` (screen fix). No merge.

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

## Final-review findings (all Minor — your triage; NOT yet actioned)
1. **Server-side term↔basis relatedness is not enforced** (`keyword-judge.cjs`). The server guards `datafactRef`-preservation + reversibility, but the check that the *term* relates to the basis fact's text lives only in the **client** basis-finder. A direct API caller could pair an unrelated `term` with a referenced basis and get it appended. The underlying claim (`datafactRef`) stays true and reversible, so the stated invariant holds — but if the server is meant to be the *sole* unbypassable honesty gate, it should also require lexical overlap between `term` and the basis fact. **Decision needed:** accept-with-comment (client pre-filter is the relatedness gate; server guards the truth-link) **or** add server-side overlap enforcement. *Recommendation: add the server-side check — it directly honors "enforced where it can't be bypassed."*
2. **Align errors render as honesty refusals** (`presend.jsx` align `catch`). A network/500 shows the same "we won't add that word — your CV doesn't support it" copy as a genuine truth-based refusal. Cheap fix: a distinct `error` UI state. *Recommendation: fix (small honesty-of-UX improvement).*
3. `presendCoverage` `else`→`missing` fallthrough lacks a clarifying comment (maintainability).
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
