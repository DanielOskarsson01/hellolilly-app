# Wave 1 - P4 Human Judgement + Selection-Quality Finding

> **SUPERSEDED (2026-07-20)** by [`wave1-p4-final-disposition.md`](wave1-p4-final-disposition.md) in this folder: the "does not pass / do not merge" state below is superseded — staged pass accepted, merge authorised. The selection-quality finding and root-cause analysis below stand as the record of what P4 found.

Date: 2026-07-19. Judge: Daniel. Branch under test: wave1-phase0-baseline @ 47dde94.
Record preserved from the planner session for docs/reviews/wave1/.

## P4 verdict: SPLIT - does not pass (both ads must pass; Wrknest fails relevance)

PRIMARY Wrknest: NEW loses to the reference on relevance-of-selection.
The ad demands operative / hands-on / structure / sales-coordination and
explicitly de-prioritises founder behaviour. NEW selected founder/strategy
lines; the reference selected the hands-on, sales-aligned, process/campaign
lines from the SAME pool. Relevance scored below 3.

SECOND Aloi: NEW BEATS the reference. The ad demands AI-native, modern,
scrappy-build, dual-audience B2B. NEW surfaced the AI-agents-daily and
build-by-hand lines, the professional-buyer B2B nuance, and the
not-enterprise framing. Relevance clearly at or above the reference.

Structure, narrative, honesty dimensions: not the blocker. Every emitted
line is verbatim pre-approved pool text (confirmed by prior review). The
failure is SELECTION relevance on the harder-to-read ad, not fabrication,
not structure, not rendering (rendering/fonts/image out of scope for P4).

## Root cause (diagnosed from decoder + tailor intermediates): TAILOR STAGE

The decoder is NOT at fault. It produced a razor-specific, correctly-weighted
Wrknest profile (execute-not-design at weight 5, no-personal-legacy at
weight 2, B2B fintech / project-delivery / sales+product coordination at
weight 4) and a sharply divergent Aloi profile (founder-level, build-from-
scratch, category-creation). A flattening decoder could not produce two
profiles this divergent.

The loss is at the decode->tailor boundary: execute.cjs passes only
decoded.requirements.map(r => r.requirement) - the bare requirement strings,
with the WEIGHTS, the rationale, and the anti-pattern narrative stripped.
Handed a flat unranked list, the tailor's selection prompt optimises for the
candidate's most impressive lines, which skew founder/strategy.

Smoking gun (operative alternatives existed and were passed over):
- Summary: a real 7-way choice; the tailor took the most founder line
  (datafact_5fc4baa1) over available operator lines (datafact_95815359,
  datafact_24a5530e, datafact_4b72831a).
- Highlights: passed over datafact_f65adb5d (LTV-not-CPA, concrete delivery)
  for a "strategic, holistic approach to scaling" line.
- Job bullets: with 39 Coinhero candidates including managerial/delivery
  ones, it chose founder framings (built strategy, established company
  structure, created brand from scratch).

## Honest constraint on the fix (expectations)

The pool genuinely skews founder, and some roles are structurally founder
(Coinhero = CEO/Founder; its intro cannot become operative without lying).
A tailor-side fix improves Wrknest where real operative alternatives exist
(summary, highlights, bullet framing) but will NOT fully re-cast Wrknest as
an operator - that would require fabricating evidence the pool does not hold.
The correct cure for a founder-skewed pool on an operative ad is the
SUGGESTION WAVE (next): add genuine operative bullets from cover letters and
history. Wave 1's tailor can only select from what exists.
PASS BAR for the re-run: Wrknest relevance reaches 3 (equal to the
reference), not necessarily 4.

## The fix (tailor-side only; no schema/template/scope change)

Lever (a): stop stripping the decode - pass the requirement WEIGHTS and the
anti-pattern framing into the selection prompt, so the tailor learns which
signals are top-weighted and which behaviours the ad rejects.
Lever (b), bounded and honesty-safe: instruct the tailor to match the ad's
operational register and down-rank founder/strategy framing WHEN THE AD
DEMANDS EXECUTION - warn-don't-force: never fabricate operative claims,
never distort structurally-founder roles. Stays inside advocate-not-audit
and the honesty rules.

## Disposition
Wave does NOT merge in this state. Fix is scoped, small, tailor-side, at the
named boundary. After fix: re-run 9-generation harness, regenerate Wrknest
P4 render, Daniel re-judges Wrknest vs reference, then final bounded
re-review, then merge. P3 harness passing + P4 dissenting is the intended
division of labour (P3 = responsiveness, P4 = relevance) working correctly.
