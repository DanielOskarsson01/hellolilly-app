# HelloLilly — Phase State

**Phase state as of 2026-07-24 · verified against the repo and written 2026-08-23.**

The single board of **what this phase needs** — the answer to "what needs doing." It is built by reading the decisions, the ledger, and the reconciled design, and it **points at those as the authoritative sources** rather than duplicating them.

> **This file is a map. The decisions and the ledger are the territory.** See `docs/DECISIONS_ADDENDUM.md` and `docs/RETROFIT_LEDGER.md`.

---

## BUILT AND MERGED (on `main`)

- **The core loop** (all confirmed on `main`):
  - **Jobbsök** — `src/screens/jobSearch.jsx` (nav `jobbsok`)
  - **Matchanalys** — `src/screens/match.jsx` (nav `match`)
  - **Anpassad CV** — the renamed tailor; `#cv` route → `<CVBuilder />`, title "Anpassad CV" (`src/App.jsx`, Wave 1 / D17)
  - **Personligt brev** — `src/screens/coverLetter.jsx` (nav `letter`)
  - **Innan du skickar** — `src/screens/presend.jsx` (nav `innan-du-skickar`)
- **Progress Support Wave A** — the single activity emitter, `server/activity-log.cjs`.
- **The collections substrate** — the generic named-collection CRUD (D5), `server/dev-server.cjs`.

## BUILT, MERGE-PENDING

- **Valvet slice 1** — branch **`valvet-slice-1` @ `39ca8e3`**. Gated on **Daniel's real-export walkthrough**, currently **paused, parked at Phase 3 (Network)**. See `docs/VALVET_STATE.md`.

## REVIEWED, NOT YET BUILT

- **CV-byggaren** (the from-scratch CV builder). D19 review **complete** — verdict **NOT-YET-FIT-TO-BUILD**. Reconciliation produced **three decisions (DECISION 1/2/3)** and **twelve binding brief amendments (A–L)**.
  - **Decision number:** recorded as **D24** in `docs/DECISIONS_ADDENDUM.md`; the reconciliation doc's own "D23" label predates the collision being caught — see the D24 entry.
  - **Review files:** the four D19 review files are **committed at `docs/reviews/cv-byggaren/`** on `main` (`CODEX_D19_REVIEW.md`, `GEMINI_D19_REVIEW.md`, `D19_CV_BYGGAREN_REVIEW_PACKAGE.md`, `D19_CV_BYGGAREN_RECONCILIATION.md`). The same four files are also tracked **at the repo root in the `wave2-suggestion-engine` tree only** (explains any root sighting on that checkout; resolves at branch switch).
  - **Slice 1 waits on:** the brief amended per the twelve items (A–L), the **Valvet merge**, and **Daniel's go**.
  - See `docs/reviews/cv-byggaren/`. The `cv-byggaren` nav item ships as `soon:true` today.

## SPECCED, NOT BUILT

- **The rest-of-site A–H tool suite.** See `docs/REST_OF_SITE_RECONCILED_DESIGN.md` for the per-tool tiers and boundaries.

## KNOWN HOLES

- **(a) Ansökningskoll / post-send application tracking** — specced nowhere, yet **shipped screens link to its dead route** (`#ansokningskoll` is linked from `match.jsx`, `cvActivity.jsx`, `coverLetter.jsx`, and is a nav item, but there is no `src/screens/ansokningskoll.jsx`). **The next design target.**
- **(b) The Valvet nav finding** — the Valvet nav item is reportedly not visible in the running app despite the screen existing on `valvet-slice-1`; confirm before merge. See `docs/VALVET_STATE.md`.
- **(c) The E1/E2/B2 verdict-discipline UI states** — decided (**D10**) but **not drawn**.

## DEFERRED (deliberately, not forgotten)

- **Progress Support Wave B** — **D18**: no automatic next wave; one undecided candidate among several.
- **The coach-network build beyond Valvet slice 1** — Path A + governance-review territory (D13/D21).
- **Everything in `docs/BACKLOG_IDEAS.md`.**

## THE DECISION AND DEBT SOURCES (authoritative)

- **`docs/DECISIONS_ADDENDUM.md`** — the decision log, **through D24** (D24 = the CV-byggaren re-scope folded from the D19 reconciliation, resolving the D23 number collision).
- **`docs/RETROFIT_LEDGER.md`** — the owed gates (the pre-D12 retrofit debt and, on `valvet-slice-1`, the two vault gates).

This file is a **map**; those two are the **territory**. When they disagree with this board, they win — update this board to match.
