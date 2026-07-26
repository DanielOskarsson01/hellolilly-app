# Wave 2 - Adversarial review round 2, disposition (RECONSTRUCTED)

**Record status: PLANNER-RECONSTRUCTED - NOT verbatim reviewer output.** The
round-2 reviewer's original file was not placed in the repo; this record is
reconstructed from the v3.2 brief's status header, disposition table, and the
round-2 fixes it marks inline. It follows the precedent of
`docs/reviews/wave1/wave1-repo-fact-report-RECONSTRUCTED.md`. If the verbatim
round-2 output surfaces, it should replace this file.

**Round 2 reviewed:** brief v3.1 (the v2 corrected against round 1's findings).
**Verdict: FIT TO BUILD** - both BLOCKERs resolved, no new blocker.
**Still open at round 2:** four non-blocking items - HIGH 2, HIGH 4, MEDIUM 4,
MEDIUM 5 - all four fixed in v3.2 rather than carried into build.
**Dates:** the v3.2 brief dates round 2 to 2026-07-21 (see the date note in the
round-1 record).

## Disposition of the round-1 findings (as recorded in v3.2)

| Round-1 finding | Resolution | Brief section |
|---|---|---|
| BLOCKER 1 - promotion converts taint | Decoupled: section eligibility loosens, prompt provenance never converts; no taint conversion claimed anywhere in the wave | 3.5 |
| BLOCKER 2 - attribution unreviewed | Attribution is part of the reviewed object; person-chosen placement where the document does not evidence the employer | 3.6 |
| HIGH 1 - false tier labels | Tiers split honestly; deterministic cores extracted as INVARIANTs 2-4, semantics as DISCIPLINEs 1-3 | 5 |
| HIGH 2 - no enforcement point | Datalayer accessor root; INV5 scoped to non-curated facts (**round-2 fix** - v3.1's wording contradicted INV1's disjunction) | 5 (INV1, INV5) |
| HIGH 3 - gate realness untestable | Nonce binding, server-side rate ceiling, attested-not-authenticated residual ratified by Daniel | 5.4 |
| HIGH 4 - edit is unbounded authoring | Person-attested requires person authorship - the authorship discriminator, a deterministic diff against the model's draft (**round-2 fix**); interacts with Daniel's RATIFY-1 (person-typed material is first-class) | 3.7 |
| MEDIUM 1 - backfill ground-truth drift | Mapper-replay classification; cv_data re-attested; drift recorded in the manifest amendment | 3.2 |
| MEDIUM 2 - 11 legacy facts | Recreation, never promotion | 3.3 |
| MEDIUM 3 - retained answers side door | Gap answers are a document class through the same spanisation/attestation pipeline | 3.1 |
| MEDIUM 4 - deletion and surface | Span lifecycle; all three /api/collection verbs constrained; parser dependency and storage ceilings specified (**round-2 fix**) | 3.4 |
| MEDIUM 5 - judge contracts, second face | Both judge contracts written in the brief (**round-2 fix**); generation-time graceful-failure face in scope | 5.5, 4 |

## The two ratifications folded in between rounds

- **RATIFY-1 (from HIGH 4):** Daniel ratified person-typed material as a
  FIRST-CLASS source of record - stronger than the planner proposed - minting
  without friction; the record states span-grounded or person-attested
  honestly; the authorship discriminator closes the model-invention-behind-a-
  click hole. Brief 3.7; DECISIONS_ADDENDUM D22.
- **RATIFY-2 (from HIGH 3):** "who accepted" is attested, not authenticated,
  until the D13 identity trigger fires - a stated residual for the single-user
  local product, with nonce binding and rate ceiling, re-opened when a second
  person or hosted surface exists. Brief 5.4; DECISIONS_ADDENDUM D23.

## Round-2 outcome

FIT TO BUILD, conditional on the four still-open items being fixed in the brief
before canon commit - which v3.2 does (INV5 scoping, the authorship
discriminator, parser/ceiling specification, written judge contracts). Gate 7
of the brief additionally requires the CV-byggaren review records committed to
`docs/reviews/` before build, since the honesty machinery cites them; that is
done alongside this record (`docs/reviews/cv-byggaren/`).
