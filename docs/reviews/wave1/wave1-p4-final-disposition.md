# Wave 1 - P4 Final Disposition (staged pass)
Date: 2026-07-20. Judge: Daniel (planner-recorded). Branch: wave1-phase0-baseline @ 8e41b69.
Record for docs/reviews/wave1/.

## Disposition: STAGED PASS - merge the proven infrastructure; Wrknest-class
## relevance is pool-limited and explicitly owed to the suggestion wave.

P4 returned all the signal it usefully can:
- SECOND (Aloi): NEW BEATS the reference. Proof the tailor reads an ad and
  selects the right existing lines when the material exists. Clean pass.
- PRIMARY (Wrknest): capped by POOL DEPTH, not tool quality. The value-prop
  pool is founder/strategy-heavy; the summary and Coinhero are structurally
  founder and must stay so to remain honest. The selection fix surfaced the
  operative lines that exist (LTV-not-CPA into highlights, strategy line
  demoted 1st->3rd) but cannot re-cast a founder pool as an operator CV
  without fabricating evidence - which the tool correctly refuses to do.

## Why this is a defensible merge, not a failed gate
- The tailor is PROVEN to work (Aloi superiority; honest verbatim selection;
  ad-responsive reorder on Wrknest where alternatives exist).
- The Wrknest shortfall is DIAGNOSED to root cause (twice, independently):
  it is the source material, not the machine. Re-tuning the tailor further
  would be misdiagnosis.
- The honesty properties all HOLD and are enforced: verbatim-only, no
  cross-attribution (the MrGreen padding attempt was caught by the pre-write
  gate), supply-short jobs render short never padded.
- This is a STAGED CLAIM per the north star: partial parity naming its owed
  outcome. The owed outcome is Wrknest-class relevance, owned by the
  suggestion wave.

## The owed outcome (binds the next wave)
The suggestion wave is no longer optional polish - it is the wave that makes
the tailor good on founder-skewed-pool-vs-operative-ad cases. Mechanism:
AI drafts genuine new operative bullets from Daniel's wider material (cover
letters, interview Q&A, prior answers); Daniel reviews/moulds/accepts;
accepted bullets mint permanent approved datafacts the tailor can then
select. Re-running Wrknest P4 against the enriched pool is the real
re-test - deferred to after that wave, by design.

## Gates still owed before merge (unchanged)
1. Final bounded re-review of the selection-fix diff (8e41b69 vs 47dde94):
   confirms the fix is sound, the latent MrGreen-padding closure holds, and
   no review-#2 fix was weakened. BLOCKER-only admission.
2. Daniel's GitHub settings: ANTHROPIC_API_KEY repository secret + mark the
   eval checks as required status checks in branch protection (the CI gate
   only blocks if both are set).
3. Merge on Daniel's go after 1 and 2.

## Sequenced next
Immediately after merge: the suggestion-wave brief (planner drafts; opus-4-8;
AI-drafted bullets, human accept-and-mint, bridging under the HIGH-RISK
machinery). This is the wave that fills the drawer.

## Second-reviewer addition (Gemini judgement pass, 2026-07-20)
Gemini independently reached the same verdict: SOUND TO MERGE AS STAGED.
It argued the strongest case against (trust deficit from shipping a tool that
predictably under-selects on operative ads before the fix exists) and still
concluded merge - holding a proven, fabrication-safe engine hostage to its
companion data-supply feature is the anti-pattern; the operative-ad "failure"
is a successful validation of the safety invariant.

One product gap it surfaced, ACCEPTED and BOUND to the suggestion wave (not a
Wave 1 merge blocker): graceful failure UX. When the tailor under-selects
because the pool is thin for an ad, the product should TELL the user ("I
couldn't find enough hands-on/operative experience in your profile for this
ad") rather than silently output a weak CV. This is not separate work - the
suggestion engine already detects the ad-vs-pool gap; that same detection
drives both the honest message and the drafting prompt. The suggestion wave's
brief must include this surfaced-gap affordance as its front door. Recorded so
it binds the next brief.
