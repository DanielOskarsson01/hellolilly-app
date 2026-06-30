# stage2-filter

Completes the filtering layer. Stage-1 (job-discovery) flags on the **card** (title, company,
location). Stage-2 flags on the **body** (`text_content`) — the ~70% of Daniel's real rejections that
are only knowable from the description. Same flag-never-hide discipline: store + `signal:'low'` +
`matchedRules` (tagged `stage:2`), **never drop or hide**.

## What it does
1. Reads the **store-backed** reject codes + their patterns: `filterSet.stage_2[*].{reason_code, match}`.
   Patterns are **editable data** (seeded by `buildFilterSet`, refined by Daniel / the learner) — the
   submodule hardcodes **nothing** (the operability principle).
2. Scans every job with a non-empty `text_content`. Body-less jobs (`needs_body`, not yet enriched)
   are **skipped** — enrich them first.
3. For each job, applies each code's `match` patterns (word-boundary, case-insensitive) to the body.
   A match adds a `matchedRule { rule:<CODE>, term:<pattern>, stage:2 }` (one per code).
4. **Merges with stage-1:** keeps every existing `matchedRule` whose `stage !== 2`, replaces the
   stage-2 set. `signal = 'low'` if any rule (stage-1 or stage-2) matched, else `'neutral'`.
   Updates **in place** by the same `record.id`, changing only `signal` + `matchedRules`.
5. **Idempotent:** re-running recomputes the stage-2 set from current patterns and replaces it — no
   duplicates, no drift. Emptying a code's patterns clears its prior flags.

## The reject codes (seeded defaults, editable)
`US_TIMEZONE` (body requires US-timezone overlap — the #1 reject) · `TOO_TECHNICAL` (technical
product/PM signals: sprint planning, lead developers, …) · `LANG_REQ` (a required language Daniel
doesn't hold) · `SALES_HEAVY` (quota / close deals / in-store) · `INDUSTRY_FIT` (clear out-of-fit) ·
`SALARY_LOW` (**wired but no default patterns** — numeric salary-vs-floor is a future stage-2 rule type).

**The conceptual-vs-technical product boundary** lives under `TOO_TECHNICAL`: the *positive* in-scope
definition (conceptual/commercial — UX, features, the customer promise, commercial ownership) sits
alongside the technical out-of-scope one. Flagging keys on the technical signals, which a
conceptual/commercial role simply doesn't carry — so the **body**, not the title, makes the call
(a "CPO" can be either kind).

## Contract
- **Capabilities:** `store`, `logger`. Imports nothing (require-guard intact).
- **Input:** `{}` (scans the store). **Output:** `{ ok, scanned, flagged, skipped, perCode }`.
- **Pipeline:** ingest/discovery → enrich (bodies) → **stage2-filter** → approval screen ranks on the
  combined signal. `server/run-filter.cjs` runs the whole input+filter pipeline end-to-end in one
  process. Validated live: 18 enriched bodies → 9 flagged (US_TIMEZONE × "based in the united states",
  SALES_HEAVY × "close deals"/"commission"), clean marketing roles left neutral.
