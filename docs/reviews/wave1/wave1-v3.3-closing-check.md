# Wave 1 Brief v3.3 - Closing Check (round 5)
Reviewer: Codex (brutal-critic seat). Record preserved verbatim from the
planner session of 2026-07-16; the original file was not saved separately.

Verdict: NOT FIT

- Finding 43 - STILL OPEN (BLOCKER). The coefficients and all within-ad
  variance groups are now specified. However, normalised Kendall tau over
  common identifiers is undefined when two selections share fewer than two
  identifiers, and duplicate handling is unspecified. Minimal primary/control
  overlap is a valid, likely input, so P3 can produce NaN or
  implementation-dependent results. [v3.3:191]
- Finding 48 - STILL OPEN (BLOCKER). Offline cases now receive a real CI
  blocker. Live-generation cases remain a written merge condition enforced
  through an attached report and manually invoked harness - not an automated
  pre-commit/CI check. D12 expressly requires an automated blocking run with
  "no honor system." [v3.3:137] [v3.3:225] [D12:59]

Requested notes:
- Finding 60 - RESOLVED. The out-of-scope boundary is fully inlined,
  including the previously omitted gap-fill, letter-writer and store-schema
  restriction. [v3.3:267]
- Finding 15 - ledger entry confirmed. The residual, acceptance rationale
  and revisit trigger are recorded. [v3.3:288]

No unrelated new blocker found.
