# Brutal-Critic Audit: Wave 1 Brief v2 - The Honest Tailor

## Verdict: NOT FIT

Tally: **20 RESOLVED, 10 TRANSFERRED, 10 STILL OPEN**, plus 17 new findings.

Finding 3 remains open, which independently triggers NOT FIT under the stated rule. The frozen-baseline design is also contradicted by P2's live pool and P4's live second/third comparisons.

## Disposition of the original 40 findings

1. **RESOLVED - no frozen fixture.**  
   V2 requires one pinned ad and variant, corpus snapshots, a captured reference run, configuration, and committed fixtures: “Commit into the HelloLilly repo as fixtures: the pinned ad, the corpus snapshot manifest, the reference output…” (33-47).

2. **RESOLVED - mutable external oracle.**  
   “The oracle is now frozen and internal - the sibling directory's future edits cannot change what ‘pass’ means” (43-47).

3. **STILL OPEN - same job ad is still not the same input.**  
   V2 snapshots “the current datafact pool state and the reference system's curated content” separately (37-39), then P2 accepts content from “the Phase 0 corpus snapshot or the live datafact pool” (110-112). The reference and HelloLilly still use unequal evidence, and one side is mutable.

4. **RESOLVED - incorrect template list.**  
   Phase 0 extracts “the actual section set, order, and heading conventions AS THE REFERENCE PRODUCES THEM”; the committed definition becomes “the structural truth” (48-51).

5. **STILL OPEN - P1 still underdefines complete structure.**  
   P1 requires “the fixed job entries present and complete” (107-109), but “complete” has no defined nested fields, job order, bullet cardinality, dates, static content, or equality rule. The Phase 0 definition covers only section set, order, and headings (48-51).

6. **RESOLVED - no common representation.**  
   “All comparisons happen between STRUCTURED representations” with committed extraction rules (102-105).

7. **STILL OPEN - matching remains delegated to the builder.**  
   V2 fixes the unit as a “content node” (83-85), but says exactness is measured “after defined normalisation - the matching rule lives in the harness” (110-113). Permitted normalisation is not constrained; the builder authors its own oracle.

8. **RESOLVED - curated content lacked identities.**  
   Curated items receive “a stable fixture identifier assigned at snapshot time,” carried “ON EVERY CONTENT NODE” (80-85).

9. **STILL OPEN - the source oracle remains non-portable and mutable.**  
   V2 commits a “corpus snapshot manifest” rather than unambiguously committing resolvable source contents (43-45), then permits the “live datafact pool” (110-112). A clean checkout may lack the texts needed by P2.

10. **RESOLVED - ‘emphasis’ rewriting loophole.**  
    V2 permits only “SELECTION and REORDERING,” strikes “emphasis,” and states “no rewriting, no embellishment” (74-79).

11. **RESOLVED - nonexistent honesty machinery.**  
    The old P3 is removed: “source-support IS the fabrication check at this wave's scope” and is enforced through P2 (110-115).

12. **RESOLVED - P3 impossible/redundant fork.**  
    V2 explicitly chooses source support rather than truth adjudication and absorbs the old P3 into P2 (110-115).

13. **RESOLVED - automated execution boundary.**  
    The harness invokes the live tailor, requires an LLM key, emits artefacts, and is separated from offline validation (116-135).

14. **RESOLVED - verify could pass without parity.**  
    The harness report is committed and attached to review; “Review does not pass without the report” (130-135). The summary repeats that gate (180-192).

15. **STILL OPEN - P3 still does not prove tailoring relevance.**  
    P3 requires only that outputs “differ materially in content selection/ordering” (116-119). Random, ad-hash-driven, or irrelevant differences pass. Difference is not evidence that either output is relevant to its ad.

16. **RESOLVED - two wrong structures could pass invariance.**  
    Repeated generations must conform to the Phase 0 definition, “not merely to each other” (184-186).

17. **STILL OPEN - P4's compared artefacts remain ambiguous.**  
    Phase 0 captures “the tailored CV content and the suggestions/gaps doc” (40-42), while P4 says only that Daniel compares “the HelloLilly draft against the Phase 0 reference output” (120-121). It never identifies whether that means structured CV content, rendered DOCX, or the complete two-artefact package.

18. **STILL OPEN - parity still excludes canonical outcomes.**  
    The amended North Star still names “tailored CV .docx + suggestions/gaps doc” as the CV-chain gold standard (North Star 167-170). V2 excludes rendering and gap work (72, 173-176) and defines no HelloLilly counterpart to the suggestions/gaps artefact. Capturing an artefact is not testing parity against it.

19. **STILL OPEN - P4 remains test-shaped subjectivity.**  
    V2 adds four dimensions but only requires “At least as good overall, no dimension clearly worse” (120-124). No scale, anchors, weighting, recording format, or meanings of “overall” and “clearly worse” exist.

20. **STILL OPEN - P4 remains gameable.**  
    The second ad is “of Daniel's choice”; a third “decides” (124-126). Ad selection, stochastic reruns, chosen outputs, third-ad selection, and variant handling remain uncontrolled.

21. **TRANSFERRED - human/tool boundary.**  
    “The keyword-gate change… is REMOVED from this wave… Findings 21-30 transfer to that brief” (21-25).

22. **TRANSFERRED - ‘on their own initiative’ loophole.**  
    The entire keyword-gate item and findings 21-30 move to the Wave 2 candidate brief (21-25, 171-172).

23. **TRANSFERRED - override versus P2/P3.**  
    “The keyword gate… moved to the Wave 2 candidate brief, carrying review findings 21-30” (171-172).

24. **TRANSFERRED - acceptance laundered into evidence.**  
    The executable concern moves with Item 4 (21-25). The amended North Star now states the governing policy: “A user-accepted override is authorisation, NOT evidence” (North Star 183-185).

25. **TRANSFERRED - nonexistent regression invariant.**  
    Item 4 and all findings 21-30 are removed from Wave 1 (21-25).

26. **TRANSFERRED - incomplete tool-route regression coverage.**  
    The associated keyword-gate regression suite moves with findings 21-30 (21-25, 171-172).

27. **TRANSFERRED - evidence display was vibes.**  
    Evidence-display behaviour is absent from Wave 1 and assigned with the keyword gate to the later brief (21-25).

28. **TRANSFERRED - CMO case untested.**  
    All keyword-gate work, including its carried findings, moves to Wave 2 (171-172).

29. **TRANSFERRED - override persistence.**  
    V2 excludes store-schema changes beyond source identifiers (175-176) and moves the override item with findings 21-30 (21-25).

30. **TRANSFERRED - D14's cross-tool consequence.**  
    Wave 1 no longer claims to implement the keyword-gate change; findings 21-30 are assigned to Wave 2 (21-25).

31. **RESOLVED - handoff interface undecided.**  
    V2 fixes the interface as “a STRUCTURED CV REPRESENTATION… a JSON structure” (68-73); the North Star specifies builder -> AST -> tailor -> renderer (158-166).

32. **RESOLVED - role variant untestable.**  
    Phase 0 pins “ONE role variant for this entire wave” and excludes multi-variant behaviour (33-36).

33. **RESOLVED - prohibited template rebuilding boundary.**  
    V2 distinguishes the frozen reference definition from new template/variant/DOCX/SV capability (93-98).

34. **RESOLVED - repair route remained open.**  
    “PATCHING THE CURRENT cv-builder GENERATOR IS FORBIDDEN” (91-93).

35. **STILL OPEN - modularity remains untested.**  
    The North Star still says “No welding a capability into one flow” (85-88). V2 supplies no reusable-module requirement or acceptance gate and leaves remaining mechanism choices to the builder (196-198).

36. **RESOLVED - secretly two waves.**  
    The new-ground keyword gate is removed because it is “a different doctrine class” (21-25). The remaining navigation and link work are direct entry edges to the tailor.

37. **RESOLVED - Item 3 authorised incompatible outcomes.**  
    Honest-disable is now conditional on the action existing nowhere, must be reported, and has its own acceptance outcome (162-167).

38. **RESOLVED - destination remained undecided.**  
    The links now land on “the job's ANPASSAD CV surface”; “v1's ‘or’ is struck” (153-156).

39. **RESOLVED - navigation boundary was unbounded.**  
    V2 limits the no-behaviour-change rule to navigation and route testing to routes touched by this wave (143-147).

40. **RESOLVED - D14-D18 citations did not resolve.**  
    V2 names both canonical documents and says explicitly that D14-D18 live in DECISIONS_ADDENDUM.md (10-11).

## New findings

41. **BLOCKER - Phase 0 violates the project's synthetic-only fixture law.**  
    V2 requires “ONE real job ad,” the current real datafact pool, and committed fixtures (33-45). The now-declared canonical Decisions Addendum says “Synthetic-only eval fixtures, binding immediately” (D12, line 109). The candidate corpus is also explicitly personal and gitignored in the repository. Phase 0 cannot simultaneously satisfy both instructions.

42. **BLOCKER - Phase 0 can freeze a degraded reference run.**  
    V2 says to snapshot the reference corpus “as [it exists] on the day of capture,” run the original once, and rely on whether Daniel thinks it “looks like the good CVs he remembers” (37-55). The current named script expects CV_JOB_VARIANTS.md and CV_SECTION_VARIANTS.md at paths where they are absent; only archived copies exist. No Phase 0 preflight requires every reference input to load successfully before freezing the oracle.

43. **BLOCKER - P3 cannot distinguish job sensitivity from normal LLM variance.**  
    P3 requires two live outputs to “differ materially” (116-119), and the harness requires a live LLM (130-131). No same-ad control establishes background stochastic variance. An ad-blind but non-deterministic generator can pass.

44. **HIGH - the control case is neither frozen nor required to remain valid.**  
    P3 introduces “one deliberately different control ad” (116-118), but Phase 0 pins only the first ad. The control is not named, committed, approved, or constrained. P1 and P2 are not explicitly rerun against its output, so fabricated or structurally invalid control output can still satisfy “different.”

45. **BLOCKER - P4 reintroduces unfrozen baselines.**  
    The second and possible third ads are “run through both systems at judgement time” (124-126). Only the first ad has a captured reference. This directly contradicts the amended North Star: “No baseline, no parity claim” (73-75).

46. **BLOCKER - a third case can outvote a known parity failure.**  
    “If the two ads disagree, a third decides” (125-126) allows merge after one case is known to be worse. The North Star says, “A step that produces worse output than the original has failed” (77-81), not that failures are settled by majority vote.

47. **HIGH - the fixed-variant rule conflicts with P4's extra ads.**  
    Phase 0 pins “ONE role variant for this entire wave” (33-36), but P4 runs additional ads through the reference system (124-126), which may select other variants. The brief does not say whether those reference runs are forced to the pinned variant or compared against unlike variants.

48. **BLOCKER - the harness violates canonical eval-run requirements.**  
    V2 makes the live harness a separately run report attached to review (128-135). D12 requires zero-tolerance fabrication cases to run at least three times and requires an automated pre-commit/CI gate over the unchanged prior corpus. V2 specifies neither three-run execution, prior-corpus integrity, nor an automated blocking hook.

49. **HIGH - the new raw-ad prompt path omits binding architecture gates.**  
    V2 makes the raw job ad an LLM input and ports a prompt into the service (86-90). D12 requires an injection envelope with transitive provenance, schema validation before rendering/writing, maker/checker separation, and explicit failure disposition. None appears in the end state or tests.

50. **HIGH - “port the reference prompt” conflicts with the narrowed scope.**  
    The mechanism says “port the reference system's prompt and selection rules” (87-90). The named reference prompt also performs five-layer analysis, role-variant choice, authored suggestions, and gap generation. A full port violates v2's selection/reordering-only scope; a partial port is no longer the stated reference behaviour. The brief does not identify which interpretation controls.

51. **HIGH - the mechanism fallback has no executable decision rule.**  
    Calling the original becomes acceptable “if porting proves worse” (90-91). The brief does not identify which gate proves that, when the decision occurs, or whether discovering it after P4 forces a second implementation into the same wave. The North Star still says to call the proven tool where possible (103-105).

52. **BLOCKER - no current producer of the initial structured CV is identified.**  
    V2 says the tailor modifies a JSON structure and “can never add, remove, rename, or reorder sections” (68-73). The North Star says the builder produces that structure, but the builder is the later D15 side project (158-166). The brief never assigns responsibility for instantiating the per-case AST before that builder exists.

53. **BLOCKER - the amended North Star pulls the removed honesty/store work back into Wave 1.**  
    The North Star now requires every bold or bridged claim the system helps produce to be tagged HIGH-RISK in shared state (177-185). Wave 1 selects claims into a CV, while v2 forbids store-schema changes beyond source identifiers (175-176). It must either violate canon or reabsorb cross-tool honesty/state work - the same second capability whose removal resolved finding 36.

54. **HIGH - the repaired link still lies about its destination.**  
    V2 preserves the label “Utforska och fyll den i Matchanalys” but sends it to Anpassad CV (153-156). It never requires changing the copy. The route can pass while the link explicitly names the wrong destination.

55. **MEDIUM - the transfer has no durable receiving artefact.**  
    V2 assigns findings 21-30 to a “Wave 2 candidate brief” (21-25, 171-172), but no such brief exists under docs, and the numbered review being referenced is not named as committed canon. The findings are transferred conceptually but can still disappear operationally.

56. **MEDIUM - the brief contradicts its own WHAT/WHY-only rule.**  
    It prescribes a “MECHANISM POSITION” and default/fallback implementation (87-98), then says “WHAT/WHY only” (196). The North Star retains that standing brief constraint (206-208).

57. **MEDIUM - the HelloLilly harness run is not reproducibly recorded.**  
    Phase 0 records the reference model, prompt version, and date (43-45), but the live harness report requires only “P1-P3 results, generated artefacts” (130-133). It does not require the HelloLilly model/prompt version, retry count, run order, or selected attempt.

## Final assessment

The rewrite is materially better: it cleanly removes Item 4, fixes the handoff representation, closes the repair loophole, and makes much of P1/P2 concrete. But its central parity claim still rests on unequal inputs, a mutable live pool, an invalid stochastic P3, and unfrozen P4 comparisons. Under the stated decision rule, it is not fit to hand to a coding agent.
