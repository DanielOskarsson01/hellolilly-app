# HelloLilly - North Star: Founding Intent and the CV Decision

Date: 2026-07-13, amended 2026-07-14 against the strategy bundle, amended again 2026-07-14 per adversarial review (CTO pass: SOUND WITH AMENDMENTS, all four amendments applied; brutal-critic pass on Wave 1 brief: NOT FIT, brief rewritten)
Status: Founding intent as stated by Daniel, verbatim in substance. This document
takes a position; it is not a menu. It dissolves the CV architecture fork raised in
WALKTHROUGH_FINDINGS_COMPLETE.md (Decision 1) and sets the standard every HelloLilly
tool is judged against.

---

## 1. What HelloLilly is

Two layers, both true:

THE ORIGIN: Daniel built a job-search tool for his own search. It is good and it
works. Its problem was never capability - it had no UI and could only be operated
through AI conversation, which was confusing. HelloLilly began as the
productisation of that proven tool, folding in the interview-prep process that
also already exists. Daniel is user #1.

THE DESTINATION: the strategy paper (docs/product-vision/, the 36-page Jobseeker
Product Vision). HelloLilly the organisation is Sweden's largest matching-services
provider - 60+ municipalities, a goal of 10,000 matches by 2030 - and the product
is the connected, AI-supported system on top of that infrastructure: tools that
execute WITH the jobseeker, a coach-side knowledge hive, community, and the
crosslinking layer that ties every tool, resource, case, and coach to whatever the
person is doing right now. The paper names the crosslinking as the moat: individual
AI tools are easy to copy; the crosslinked system is not.

The personal tool is the seed and the proof. The strategy paper is the goal. Every
build decision serves the second while being validated by the first.

## 2. The CV builder: in scope, sequenced separately

CORRECTED from the first draft of this document. HelloLilly does everything to
ensure people get a job - the strategy paper's own tool map lists the CV Builder
as a first-class answer to the Execution problem. There MUST be a CV builder in
HelloLilly.

The sequencing decision: it is built as a SEPARATE SIDE PROJECT, after the current
work. The spec is produced by another agent from accumulated material (the
original JobSearch/CVs machinery, the orientation report in the findings doc, the
templates, the walkthrough findings). It then integrates into HelloLilly - soon,
not someday.

Inside HelloLilly, until that side project lands, the working assumption stands:
THE CV BUILDER AND TEMPLATES EXIST (the original machinery is the stand-in).
HelloLilly's job around the CV remains:

- Hold the vast content base (interview Q&A, cover letters, datafacts, prior
  answers) in its database.
- Use that content to CREATE ADAPTED CONTENT and FILL THE GAPS in applications.
- Hand adapted content to the CV tool / templates, which render the document.

Consequence for the current build (unchanged): the live "Skapa anpassad CV" step
has been doing the builder's job with none of the builder's discipline - inventing
whole CVs with improvised structure. That is the category error behind the poor
walkthrough output. Its future shape is content adaptation against assumed
templates, judged by the parity standard below, until the real builder integrates.

## 3. The standard: outcome parity

For every tool and step translated from the original system into HelloLilly:

- USE the existing tools where they can be used.
- Where architecture requires a rebuild, the rebuilt version must achieve
  STRUCTURAL PARITY (matching structure/schema with the original's output) and
  SEMANTIC EQUIVALENCE (content judged equivalent against the original's output
  for the same pinned input). Architecture is free to differ; outcomes are not.
  Token-for-token equality is explicitly NOT required - the pipelines are
  LLM-driven and non-deterministic. (Amended 2026-07-14 per CTO review: the
  original "exact same outcome" wording was an engineering trap.)
- Parity is only testable against a FROZEN BASELINE: for each translated tool, a
  pinned input and a captured reference output, captured per the FIXTURE LAW
  below (synthetic committed; real content held as local parity references),
  with the reference run's configuration recorded. No baseline, no parity claim.

This gives the project an objective acceptance test it has not had: the original
tool's outputs are the gold standard. Any HelloLilly step can be put next to the
old system's output for the same input and judged. A step that produces worse
output than the original has failed, whatever its architecture. The current CV
step fails this test on sight.

## 4. Modularity requirement

The subtools - matching, analysis, and their siblings - must be built modular
enough to be reused in other areas of the larger site idea (per the HelloLilly
big-idea / strategy paper). No welding a capability into one flow when the wider
vision will need it elsewhere.

## 5. The frontend

The Claude Design frontend is approximately the correct design. The design is not
the problem; the machinery beneath it is. Build to the design; fix the plumbing.

## 5b. Build doctrine: replace, do not repair

Confirmed by Daniel 2026-07-14. The current cheap reimplementations (the live
"Skapa anpassad CV" step being the clear case) are NOT repaired. Patching a tool
that was wrong at birth is an endless negotiation with a broken architecture.
Instead: the PROVEN ENGINES (the original machinery) sit behind, the CLAUDE
DESIGN screens sit in front, and everything between them is disposable plumbing.

- Where a proven tool can be called as-is, call it.
- Where architecture forces a rebuild, the rebuild is judged by the parity
  standard: same input, same outcome as the original.
- The precedent that proves it: the cover letter, whose prompt was ported
  VERBATIM from the old system, is the one pipeline surface that survived the
  walkthrough without complaint. Carried-over-intact kept quality;
  reimplemented-from-philosophy lost it.

Caveat (per CTO review): "call the proven tool" does not mean deploying
run-by-hand CLI scripts as production services raw. Where a legacy script is
called, it is abstracted behind an API/service boundary (or its prompt and
behaviour ported verbatim, the cover-letter method) so it cannot block the
serving path or leak file-system assumptions into the product. The doctrine
protects the BEHAVIOUR of the proven tools, not their packaging.

Boundary: this doctrine governs the REIMPLEMENTED tools - where a proven original
exists. It does not condemn the new-ground capability (datafact pool, gap-fill
loop, honesty gates, store): those are not counterfeits of anything and get
evolved, not replaced. The line: where an original exists, reuse or match it;
where HelloLilly broke new ground, evolve it.

## 5c. Information architecture: the two CV tools get two menu items

Decided by Daniel 2026-07-14. The two-tools distinction becomes visible in the
navigation:

1. CV-BYGGAREN - the builder. Job-independent: build and maintain the master CV,
   templates, structural enhancement. This is the side project; until it lands,
   the menu item exists in the project's honest-disabled "Kommer" state,
   reserving the slot.
2. ANPASSAD CV (Skapa anpassad CV) - the tailor. Job-bound: one artefact per job,
   content-only adaptation within the locked template.

The nearly-free first move: the CURRENT "CV-byggaren" menu item is mislabelled -
the screen it opens already shows the per-case tailored draft. Rename it to
Anpassad CV (the nav then tells the truth), and add CV-byggaren as the reserved
"Kommer" item.

Side benefit: a proper per-job Anpassad CV surface is the correct landing
destination for the currently-dead "Utforska och fyll" links from Innan du
skickar (findings doc 1f).

Standing boundary: the tailor never gains structural powers; the builder never
becomes job-aware. Either tool doing the other's work recreates the conflation
that produced the walkthrough's poor CV.

## 6. What must be true at the start of the next working session

1. THE STRATEGY PAPER IS ON THE TABLE - RESOLVED. Daniel supplied the full
   bundle (HELLOLILLY_STRATEGY_AND_SPECS_BUNDLE.md, 26 documents inlined: the
   36-page vision paper, master plan, master state, decisions D1-D13, arch rules,
   all design specs). This document was reconciled against it on 2026-07-14 and
   amended: section 1 widened to the full system vision, section 2 corrected to
   CV-builder-in-scope-sequenced-separately. The bundle is the canon this document
   serves.
2. THE HANDOFF INTERFACE - DECIDED 2026-07-14 (per CTO review, Risk 1). The
   lingua franca between builder, tailor, and rendering is a STRUCTURED CV
   REPRESENTATION (JSON / AST): the builder produces the structure, the tailor
   modifies content nodes within it and never invents structure, and a separate
   rendering step turns the final structure into documents (.docx and friends).
   Neither the builder nor the tailor manipulates rendered documents directly -
   document surgery is brittle and recreates the invented-structure bug. The
   full renderer lands with the D15 side project; within current waves the
   tailor already operates on the structured representation.
3. PARITY BASELINES CAPTURED. For each translated tool, the acceptance reference
   is the original system's output. Concretely for the CV chain: the original
   generate-tailored-cv.js outputs (tailored CV .docx + suggestions/gaps doc) are
   the gold standard the HelloLilly flow must meet or beat.
   STAGED CLAIM (2026-07-14): full-chain parity completes when the D15 side
   project delivers rendering and the suggestions/gaps counterpart. Until then
   a wave may claim PARTIAL parity (e.g. tailoring parity: content selection
   within the frozen structure) if it names exactly which original outcomes it
   covers and which remain owed. Owed outcomes stay on the ledger; they do not
   silently disappear into "parity passed".
   FIXTURE LAW (2026-07-14, reconciling D12; precision added after the repo
   fact-check): eval FIXTURES are SYNTHETIC ONLY and committed - D12's
   invariant stands untouched. Real-content material used for parity (pinned
   ads, corpus snapshots, captured reference outputs) is NOT a fixture: it is
   a LOCAL PARITY REFERENCE - never committed, checksummed, resolvable via a
   committed manifest. The run REPORTS are committed; the content is not.
   Disclosure classes, stated accurately: this law protects contact PII, the
   evidence pool (data/cv_data.json, the datafact store), and captured CV
   artefacts. Daniel's career biography is a separate, deliberate class -
   committed by design as the real persona (writer prompt, persona pack,
   product-vision docs) per the standing decision. The law does not pretend
   otherwise. RATIFICATION REQUIRED: the fixture-vs-local-parity-reference
   distinction amends D12's scope and binds only on Daniel's explicit
   confirmation, recorded as a decision entry.
4. THE ADVOCACY PRINCIPLE APPLIED WITHIN THIS FRAME. The advocate-not-audit
   principle (findings doc, section 2) governs HOW content is adapted and gaps are
   filled: maximum truthful strength, warn-do-not-block, end-to-end honesty with
   the interview tools sharing state. It operates INSIDE the boundary this
   document sets - it shapes the content HelloLilly prepares, not the document
   the CV tool renders.
   AMENDED 2026-07-14 (per CTO review, Risk 2 - the broken safety net): bold
   claims are safe BECAUSE the later tools carry the user, so the system must
   not silently let the user skip the carrying. Every bold/bridged claim the
   system helps produce is tagged HIGH-RISK in the shared state, and at export
   or send time the user is explicitly warned which claims they carry and that
   interview prep exists to rehearse them. TRIGGER CLAUSE (2026-07-14): this
   obligation binds from the first wave that introduces bold/bridged
   GENERATION. Waves whose adaptation is selection/reordering of approved text
   only produce no bridged claims by construction and carry no tagging work. Warn, never block - but the warning
   is mandatory, visible, and specific. A user-accepted override is
   authorisation, NOT evidence: user acceptance never converts an unsupported
   claim into an approved source for any tool-side generation.

## 7. What this deprioritises or reframes

- The CV architecture fork (findings doc, Decision 1): DISSOLVED, replaced by the
  smaller handoff-interface decision above plus the sequenced CV-builder side
  project (section 2).
- Rebuilding template/variant/docx/SV capability inside the CURRENT HelloLilly
  waves: OUT. That capability arrives via the CV-builder side project, which
  integrates into HelloLilly when built.
- A new deferred action is added to the ledger: THE CV-BUILDER ACCUMULATION BRIEF -
  after the current work, gather the original machinery, templates, orientation
  report, and walkthrough findings into a package for another agent to spec the
  side project. Not the focus of the current discussion, by Daniel's instruction.
- Wave sequencing (findings doc, Decision 2) is now judged against founding
  intent: does a wave translate a proven step of the original process into the
  product, at outcome parity, as a reusable module? Waves that do rank above
  waves that decorate.

## 8. Standing constraints (unchanged)

Three-Claude workflow; independent review before merge; one wave at a time;
British English; hyphens only. BRIEF AUTHORITY (amended 2026-07-14): briefs
state WHAT and WHY, and may fix behavioural and boundary positions -
interfaces, forbidden routes, defined tests - where adversarial review demands
them; code structure within those boundaries stays the builder's. The findings record
(WALKTHROUGH_FINDINGS_COMPLETE.md) remains the session-level detail behind this
document. Both should be committed to docs/ in the repo.
