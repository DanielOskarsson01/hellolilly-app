# Brutal-Critic Review: Wave 1 Brief - The Honest Tailor

## Verdict: NOT FIT

The brief can produce a green build that neither proves parity nor protects tool-side honesty. P1-P3 are not runnable as written, P4 is an unstructured opinion gate, and Item 4 contains exactly the human/tool ambiguity the reviewer was asked to detect.

1. **No frozen parity fixture or baseline exists.**  
   Causing text: “on the same job ad given to both systems” and “P1-P3 automated parity checks pass on a real job ad” (Brief 78-80, 184). No ad, case, source-pool snapshot, reference artefact, model configuration, or chosen reference run is identified. This directly ignores the North Star’s prerequisite: “PARITY BASELINES CAPTURED” (North Star 150-153).

2. **The reference oracle is mutable and external to the build.**  
   Causing text: “The original machinery in JobSearch/CVs/ is the reference” (45-46). That directory is outside the HelloLilly repository and the brief pins no commit, checksum, or captured output. A clean checkout or CI run has no stable oracle; a later edit to the sibling project changes what “pass” means.

3. **“Same job ad” is not “same input.”**  
   Causing text: “on the same job ad given to both systems” (78-80), while HelloLilly may use “the datafact pool (which includes gap-answer facts—the compounding capability the original never had)” (63-66). Pool contents, approval state, language, role variant, and case state are uncontrolled. A better result could come from richer inputs rather than implementation parity.

4. **P1’s expected template contradicts the named reference engine.**  
   Causing text: “section set and order (summary, career highlights, core competencies, the fixed jobs, other experience, education, awards)” (55-59). The actual buildCV template includes Professional Experience, Earlier Career, and Awards, Recognition & Languages; its summary is headingless. “The fixed jobs” is not itself the reference heading. A builder cannot encode both the written list and actual reference equality.

5. **P1 tests headings, not the claimed fixed structure.**  
   Causing text: “section set and order are identical… Zero invented headings” (82-84). It does not require the five fixed jobs, their order, complete job entries, static content, or non-empty sections. Correct headings with empty content can pass P1; P2 and P3 then pass vacuously.

6. **P1 has no common comparison representation.**  
   Causing text: “HelloLilly output’s section set and order are identical to the reference engine’s template” (82-83), while “.docx export” is out of scope (172-173). One side is a rendered document; the other is an application draft. No extraction, normalisation, locale, heading, or static-field rules are defined. “Mechanically checkable” is an assertion, not an operational test.

7. **P2 defines neither its unit nor its matching rule.**  
   Causing text: “every content item in the output resolves to an approved source” (85-87). “Content item” could mean a text run, sentence, bullet, job entry, heading, date, or whole section. “Resolves” could mean an ID exists, exact equality, normalised equality, substring matching, or semantic support. These produce incompatible results.

8. **P2 has no machine-readable oracle for curated content.**  
   Causing text: “datafact id or curated-pool item” (85-87). Datafacts have IDs; most reference-library content does not have the same identity scheme. The brief requires traceability without defining a stable curated-item identifier or requiring that identifier in the output.

9. **P2 depends on unpinned, non-portable personal state.**  
   Causing text: “the datafact pool… or the curated content the reference system uses” (63-66). The real datafact corpus is personal, mutable, and excluded from clean CI; the curated corpus lives in the external reference project. An automated test cannot know which versions constitute “approved.”

10. **“Emphasis” reopens rewriting despite the quoted exact-text rule.**  
    Causing text: the reference rule is “Use ONLY exact pre-approved text… Zero creative writing” (47-49), but the required behaviour permits “selection, reordering, and emphasis” (60-62). “Emphasis” is undefined. A builder can interpret it as rewriting or embellishment while still attaching a source reference.

11. **P3 invokes machinery that does not perform P3.**  
    Causing text: “Checkable by the existing honesty-gate machinery” (88-89). Repository inspection shows the existing writing gate checks banned phrases; it does not segment claims or test factual entailment against the source pool. The narrow gap and keyword judges are not whole-CV fabrication checkers.

12. **P3 is either impossible or redundant.**  
    Causing text: “no claim… asserts experience absent from the source pool” (88-89), versus “The tool cannot judge truth from text alone” (151-153). If P3 means judging real experience, Item 4 denies that ability. If it means exact source support, it merely repeats P2. The brief never chooses.

13. **The automated-test execution boundary is undefined.**  
    Causing text: “tailoring is LLM-driven and non-deterministic” (78-79) and “P1-P3 are mandated automated tests” (96). It does not say whether tests invoke live generation, inspect a captured artefact, or use mocks. Live tests are key-, network-, model-, and sampling-dependent; mocked validator tests do not prove production behaviour.

14. **npm run verify green is not tied to parity.**  
    Causing text: “P1-P3 are mandated automated tests” (96) and “npm run verify green” (197). The brief never requires the parity harness to run under verify or names another command and artefact. A green standard suite can coexist with parity never having run.

15. **The automated tests do not test tailoring.**  
    Causing text: tailoring must perform “selection, reordering, and emphasis… by relevance to the job ad” and receive the raw ad (60-69). P1-P3 assert none of relevance, job-dependent variation, raw-ad use, role narrative, or reorder quality. The same generic sourced CV returned for every job can pass all three.

16. **The two-run invariance test proves only repeatability of any structure.**  
    Causing text: “two consecutive generations… produce identical section structure” (186-187). Two identically wrong structures pass. It neither establishes equality with the reference nor proves invariance beyond two samples.

17. **P4 does not identify the artefacts being compared.**  
    Causing text: “shown the two outputs side by side” (90-91). The North Star names the original outcome as “tailored CV .docx + suggestions/gaps doc” (150-153), while the brief excludes .docx export and gap drafting (172-175). It is unclear whether Daniel compares UI against DOCX, extracted text, visual rendering, or only part of the original package.

18. **The brief silently downgrades the North Star’s parity standard.**  
    Causing text: the North Star requires “THE EXACT SAME OUTCOME” (65-68) and names both original artefacts as the baseline; the brief substitutes structure, provenance, non-fabrication, and one subjective preference judgement. All four tests can pass while major original outcomes are absent.

19. **P4 is explicitly vibes.**  
    Causing text: “judges the HelloLilly output at least as good” and “explicitly subjective” (90-93). No dimensions govern relevance, completeness, honesty, narrative quality, or presentation, nor how trade-offs are decided. D14 making the human the truth authority does not define a quality-parity rubric.

20. **P4’s sample and result rules are gameable.**  
    Causing text: “One job ad minimum; two if the first is ambiguous” (93-94). The selector, meaning of “ambiguous,” rerun policy, chosen stochastic output, and outcome when the second result disagrees are all unspecified. One favourable ad cannot establish parity across seven role variants.

21. **Item 4’s human/tool boundary is non-exclusive.**  
    Causing text: “USER-INITIATED keyword additions are never hard-blocked” (147-150), versus protection for tool paths only when acting “on their own initiative” (154-157). The live action is simultaneously user-initiated and tool-executed: a click asks the server to construct and persist changed CV text. A builder can remove the server-side support guard, call the result a human override, and claim compliance.

22. **“On their own initiative” is direct licence to weaken tool-side honesty.**  
    Causing text: “still never insert unsupported claims on their own initiative” (154-156). That forbids unsolicited tool fabrication but does not forbid tool-authored unsupported text requested or confirmed by a user. The summary test repeats the same defective split: “user-initiated unsupported keyword” versus “TOOL-initiated generation” (193-196).

23. **An override directly conflicts with P2 and P3.**  
    Causing text: an unsupported keyword may “proceed” (147-150), while P2 requires every item to resolve to an approved source and P3 forbids any claim absent from the pool (85-89). The brief defines no exception or transition by which the resulting text becomes compliant.

24. **User acceptance can be laundered into evidence.**  
    Causing text: “the fact that a warned keyword was accepted by the user is provenance” (160-162). Acceptance proves authorisation, not that the experience exists. Because P2 treats provenance/source resolution as the honesty mechanism, a builder may turn an override record into an “approved source” reusable by tailoring or letter generation.

25. **The claimed tool-side regression target is not an existing invariant.**  
    Causing text: “regression test on the existing never-fabricate behaviour” (195-196). Current authored-prose paths rely on model instructions and self-reported unsupported claims; the persistence gate checks writing-style phrases, not factual support. There is no executable existing invariant to regress against.

26. **The regression test is singular while the requirement is plural.**  
    Causing text: the protected paths are “tailoring, letter, drafts” (154-156), but the test requires only “a TOOL-initiated generation” (195-196). Protecting one route can satisfy the test while another named route weakens. No test covers the critical override-then-regenerate path.

27. **“SHOWS ITS EVIDENCE” is test-shaped vibes.**  
    Causing text: “what it looked at, what it did or did not find” (147-150). The corpus, matching semantics, required fields, completeness, and expected fixture output are undefined. “Checked your CV” and a full per-source trace both satisfy the words.

28. **The known CMO defect is deliberately left untested.**  
    Causing text: the brief identifies CMO as already present but falsely rejected (139-143), then excludes “detection improvement behind the CMO false-warning” (177-180). Test 6 uses an actually unsupported keyword (193-194). The exact known failure can remain, even producing a warning whose displayed evidence contradicts its claim.

29. **Override persistence is undefined hidden scope.**  
    Causing text: “The user’s override is recorded with the resolution” and “recording it now is cheap” (160-163). No record shape, identity, edited-claim link, durability, read-back, withdrawal, failure behaviour, or distinction from the separately out-of-scope activity log is specified. A useless log line can technically pass “recorded.”

30. **Item 4 claims D14 while deferring D14’s consequence.**  
    Causing text: interview-prep tools “will need it” but “consuming it is a later wave” (160-163). The North Star requires “end-to-end honesty with the interview tools sharing state” (154-159). Recording an unused event is not the claimed shared-state capability.

31. **The mandatory handoff interface remains undecided.**  
    Causing text: “calling the original scripts, porting… or another route—is the builder’s decision” (70-74). The North Star says “THE HANDOFF INTERFACE DEFINED” must specify exactly what HelloLilly hands over and receives, explicitly including gap answers, keyword alignments, role variant, document, and reference (144-149). The brief delegates that product/architecture decision to the coding agent.

32. **Role-variant behaviour is consequently untestable.**  
    Causing text: the reference has “7 role variants” (45-47), while the brief uses a singular template and excludes “role-variant switching in the UI” (172-173). It never says whether the baseline variant is fixed, inferred, inherited, or selected elsewhere.

33. **The brief permits rebuilding capability the North Star excludes.**  
    Causing text: “porting their prompt and template model into the HelloLilly service” (70-72). The North Star says “Rebuilding template/variant/docx/SV capability inside the CURRENT HelloLilly waves: OUT” (166-168). The brief supplies no boundary between disposable integration plumbing and prohibited template reconstruction.

34. **“Another route” reopens the repair strategy canon forbids.**  
    Causing text: “or another route” and “one criterion: the parity tests” (70-74). The North Star requires calling the proven tool where possible and rebuilding only where architecture forces it (96-98). A patched version of the current failed generator can satisfy the brief’s loose tests while violating “replace, do not repair.”

35. **The North Star’s modularity requirement is waived.**  
    Causing text: “The brief takes no position on code structure” (73-74). The North Star requires reusable subtools and says, “No welding a capability into one flow” (78-81). No acceptance gate detects a route-specific welded implementation.

36. **“One coherent capability” is false.**  
    Causing text: “One coherent capability” (7-8), followed by a sentence joining tailoring replacement, navigation, dead-link repair, and keyword policy/state (16-19). Item 1 replaces a proven engine; Item 4 evolves a new-ground honesty gate and store—the North Star explicitly treats those as different doctrine classes (104-108). Their tests and failure modes are independent. This is at least two waves, with two additional UI bugs attached.

37. **Item 3 authorises mutually exclusive outcomes.**  
    Causing text: the capability promises “dead links get a real destination” (18), but Item 3 allows either retargeting or “honest-disable or remove” (128-133). Test 5 then requires “Each retargeted link lands” where the action works (190-192). Deletion can satisfy the requirement while making the mandated test fail or disappear.

38. **Item 3 leaves a decided destination undecided.**  
    Causing text: “the job’s own analysis/gap context or its Anpassad CV surface” (128-131). The North Star calls Anpassad CV “the correct landing destination” (127-129). The brief’s “or” reopens that product decision; making the promised fill action available may also leak into the separately out-of-scope gap-drafting work.

39. **The navigation acceptance boundary is ambiguous and potentially unbounded.**  
    Causing text: “No behaviour change beyond the label and the placeholder” (114-115), while the same wave replaces the behaviour beneath Anpassad CV; test 4 adds “no route dead-ends” (188-189). A builder can read the former as forbidding Item 1 changes or the latter as requiring an application-wide route audit.

40. **The brief’s canonical references do not resolve from the declared canon.**  
    Causing text: “Canon this brief serves: docs/HELLOLILLY_NORTH_STAR.md (D14-D18)” (9), followed by repeated D14-D18 citations. The attached North Star contains no D14-D18 labels; those IDs live in DECISIONS_ADDENDUM.md, which the brief does not name as canon. A coding agent following only the declared documents cannot trace the requirements reliably.
