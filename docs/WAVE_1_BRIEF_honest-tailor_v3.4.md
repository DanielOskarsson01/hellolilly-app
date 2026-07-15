# HelloLilly - Wave 1 Brief v3.4: The Honest Tailor

Date: 2026-07-14
Status: v3.4 - closes the two round-6 specification gaps: the P3 order term's
edge cases and duplicate rule are defined (43), and live-generation
zero-tolerance evals move into an automated CI gate with a repository secret -
no honour system, per D12's wording (48). Finding 15 is logged
to the wave ledger as an accepted residual with rationale. Self-contained: no
requirement lives only in a prior version. v3.1 was corrected against the repo-grounded fact report:
Phase 0a premise corrected, D12 compliance completed rather than claimed, 0d's
judgement calls named, the fixture/local-parity-reference distinction adopted
(pending Daniel's D12 ratification). Two adversarial rounds preceded (v1: NOT
FIT, 40 findings; v2: NOT FIT, 10 open + 17 new).
PRECONDITION: the amended north star, this brief, the Wave 2 stub, and the
review records must be COMMITTED before build - the fact report found the
brief's canon existing only as uncommitted working-tree edits.
CONVERGENCE RULE, set by the planner: one final critic pass on this version,
scoped to the v2-open and new findings only. BLOCKER/HIGH findings block;
MEDIUM findings are logged to the wave's ledger and do not block. After that
pass, the brief ships to Phase 0 - the strongest remaining gates (P4 and real
use) exist only on the other side of building.
Canon: docs/HELLOLILLY_NORTH_STAR.md (amended through 2026-07-14, including the
FIXTURE LAW, STAGED CLAIM, and TRIGGER CLAUSE additions) and
docs/DECISIONS_ADDENDUM.md (D12 binds this brief - see Phase 0 and harness).

---

## The capability, in one sentence

The CV tailoring path is replaced at TAILORING PARITY with the proven original -
content selection and reordering inside a frozen structure - with the navigation
renamed to tell the truth and the dead links relabelled and retargeted to the
destination this path creates.

PARITY SCOPE, stated honestly (v2 finding 18): this wave claims tailoring
parity, not full-chain parity. Covered: content selection/reordering within the
reference structure. Owed to later waves (on the ledger, per the north star's
STAGED CLAIM): rendered .docx, Swedish, the suggestions/gaps companion
artefact, multi-variant UI - all D15 territory.

NO BRIDGED CLAIMS THIS WAVE (v2 finding 53): the tailor's powers are selection
and reordering of approved text only, so it produces no bold/bridged claims by
construction. The north star's HIGH-RISK tagging obligation (TRIGGER CLAUSE)
does not bind this wave; it binds the first wave that introduces bridged
generation.

## Phase 0: Freeze the baselines (build cannot start before this completes)

### 0a. Preflight the reference machinery (corrected per the fact report)
Fact: the variants files exist at the expected paths as working symlinks;
nothing currently needs restoring. The REAL hole is softer: the reference
loader warns-and-returns-empty on a missing soft input, so a run can complete
"without errors" while feeding the LLM empty source documents. The preflight
criterion is therefore: every required input (hard AND soft - both JSON files,
both variants files, MASTER_CV.md, highlight pool, i18n, images, SV sources)
loads NON-EMPTY, with content length asserted, before the capture run. A
degraded-but-completing run does not pass. If the reference cannot be made to
run faithfully on full inputs, STOP - there is no oracle.

### 0b. Pin the ads and capture the reference runs (v2 findings 44-47)
- Pin THREE job ads, all approved by Daniel before capture: the PRIMARY ad
  (from the real walkthrough set preferred), the SECOND P4 ad (Daniel's
  choice), and the CONTROL ad (deliberately different role/domain, used by P3).
- Run the reference machinery once per pinned ad. For each, record the role
  variant the reference selects - each ad's comparisons are made against ITS
  OWN captured run and variant (this replaces v2's single-variant rule and
  resolves the variant conflict). Capture the complete outputs.
- The third-ad tiebreak is STRUCK (v2 finding 46): P4 runs on the primary and
  second ads, and BOTH must pass. Either ad clearly worse on the rubric fails
  the wave, per the north star ("a step that produces worse output than the
  original has failed").

### 0c. Fixtures under the FIXTURE LAW (v2 findings 41, 9; D12)
Two tiers, per the north star's fixture law:
- COMMITTED (synthetic only): a synthetic job ad plus a synthetic content
  corpus with the same shape as the real data, the extracted TEMPLATE
  DEFINITION (see 0d - structural only, no personal content), the extraction
  and normalisation rules, and the harness itself. These drive every
  CI-runnable mechanical test.
- LOCAL (real content, never committed): the three pinned ads, the corpus
  snapshot (datafact pool state + reference curated content, each item given a
  stable identifier), and the three captured reference outputs. Committed in
  their place: a MANIFEST of identifiers and content checksums, plus each
  reference run's configuration (model, prompt version, date). P2 resolves
  identifiers against the manifest; checksums make the local snapshot
  verifiable on any machine that holds it.

### 0d. Extract the template definition (v2 finding 5; judgement calls named
per the fact report)
The schema is extracted primarily from the reference CODE, where it is
deterministic (section sequence, headings via i18n, the five fixed jobs with
company/period, static content locations), cross-checked against the captured
outputs. Two elements are NOT encoded and are adopted as NAMED JUDGEMENT
CALLS, recorded in the definition and vetoable by Daniel at 0e: (1)
cardinality bounds - adopted from the reference's prose rules (the competency
pool _rules and the prompt's pick-3-categories/4-6-items instruction) and
validated against the three captured outputs; (2) section emptiness - the
reference renders every section unconditionally, so the definition requires
all sections present and non-empty. This definition is the structure factory
for the wave (v2 finding 52): the per-case structured CV is instantiated FROM
it, and the tailor fills content nodes within it. Structural only, committed
(synthetic tier). Node-identifier note per the fact report: the current draft
nodes already carry typed source refs and the store is schema-free JSON, so
carrying a new fixture-identifier ref kind requires NO schema work - one ref
per node; multi-source nodes are out of scope.

### 0e. Daniel's baseline confirmation
Daniel reviews the three reference outputs: do they look like the good CVs he
remembers? If not, STOP - the baseline is wrong. His confirmation is recorded.

## Item 1: Replace the tailoring behaviour

### Required end state
- The tailored CV is a structured representation instantiated from the Phase 0
  template definition. The tailor selects and reorders CONTENT within it and
  can never add, remove, rename, or reorder sections.
- Tailoring is SELECTION and REORDERING of approved content by relevance to the
  job ad, under the reference's rule (exact pre-approved text, zero creative
  writing). No rewriting, no embellishment, no bridging.
- Approved content: datafact-pool items (by datafact id) and snapshot-corpus
  items (by fixture identifier). Every content node carries its source
  identifier. Node text equals source text after the COMMITTED normalisation
  rules - whitespace and punctuation-spacing only; any richer normalisation is
  forbidden (v2 finding 7: the builder does not author its own oracle).
- The raw job ad is an input to the tailoring step. This untrusted-input path
  complies with D12 Rule 2 IN FULL (the fact report showed v3's claim covered
  two of three invariants): injection envelope with provenance; schema
  validation before anything is rendered or written, with explicit failure
  disposition; prompt assembly per D12's one-named-module rule, resolved concretely
  (finding 58): at build start, identify the module that currently owns prompt
  assembly under D12 in this repo; if one exists, the tailor's assembly lives
  inside it; if none is yet designated, the tailor's assembly module IS
  registered as the named module, recorded in the arch-rules ledger - either
  way exactly one named owner, never a second assembly point; TRANSITIVE TAINT - the tailored structure is
  model-written and therefore carries untrusted-derived provenance permanently,
  per Rule 2's explicit wording; and adversarial eval cases for the
  pasted-job-ad ingestion class (D12's DISCIPLINE), added to the eval corpus.
  D12 EVAL REGIME (finding 48 closed with a real gate, not debt-reporting):
  the new cases join the EXISTING D12 eval corpus; the prior corpus runs
  unchanged alongside the additions; zero-tolerance cases run three times
  each. AUTOMATED BLOCKING, two tiers, both mandatory:
  (1) Every eval case runnable WITHOUT a live key (schema validation,
  envelope/taint checks, structure and provenance validators against stored
  artefacts, injection cases against a stubbed model) runs in an automated
  CI step that BLOCKS the pull request on failure. If no such CI step exists
  in the repo yet, THIS WAVE CREATES IT - a workflow step running the
  existing offline suites is in scope and small.
  (2) Zero-tolerance cases requiring live generation ALSO run in an
  automated CI job - no honour system, per D12's own wording. The job uses
  an LLM key held as a repository secret, is path-triggered (it runs when a
  pull request touches prompt, eval, or tailoring paths - keeping spend
  bounded to the changes that can regress honesty), runs each zero-tolerance
  case three times, and BLOCKS the pull request on any failure. The full
  harness report (all nine parity generations) remains a hard merge
  condition attached to the independent review - but the zero-tolerance
  honesty gate itself is machine-enforced, not reviewer-enforced. SETUP
  DEPENDENCY, named: Daniel adds the LLM key as a repository secret once;
  the wave's build report includes the exact one-step instruction. No prompt
  change ships past either tier.
  The harness manifest records the RUN DATE alongside the other
  run-integrity fields.
- MECHANISM: port the reference system's SELECTION AND REORDERING rules and
  template constraints into the HelloLilly service. The ported prompt is
  TRIMMED TO SELECTION SCOPE (findings 50 and 53 closed at the root): the
  five-layer analysis may inform selection, but the suggestion/gap-authoring
  instructions are REMOVED from the ported prompt - this wave's tailor does
  not GENERATE suggestion or gap content at all, not merely discard it. That
  keeps the wave outside the TRIGGER CLAUSE by construction, not by disposal.
  Variant choice is fixed per-ad by the Phase 0 capture. The fallback clause is STRUCK (v2 finding
  51): if porting fails to meet the tests, stop and report - do not improvise
  an alternative route mid-wave. Patching the current cv-builder generator
  remains FORBIDDEN.
- MODULARITY (v2 finding 35): the tailor is exposed as a module with a defined
  interface (structured CV in, job-ad context in, tailored structure out),
  callable outside the case flow. The independent review explicitly checks it
  is not welded to the case route.

### The parity tests
All comparisons between structured representations, using the committed
extraction rules. The reference side of each comparison is that ad's OWN Phase
0 captured run.

P1 STRUCTURE: the output conforms to the FULL template definition (0d) -
   sections, order, headings, job-entry completeness per the schema, non-empty
   where the reference is non-empty.
P2 PROVENANCE: every content node's identifier resolves against the Phase 0
   corpus snapshot manifest ONLY. The snapshot includes the datafact pool
   state at capture time - gap-answer facts included - so the reference run
   and the HelloLilly runs see the SAME pinned input (finding 3: the v3.1
   live-pool exception is STRUCK; facts minted after capture are invisible to
   this wave's parity runs by design). Node text equals source text under the
   committed normalisation. Source-support is the fabrication check at this
   wave's scope.
P3 JOB SENSITIVITY with variance control (findings 43 and 15 closed with a
   defined metric and an explicit division of labour): the harness runs the
   tailor THREE times on EACH pinned ad - primary, control, and the second P4
   ad (nine runs total) - and every run must pass P1-P2 (D12: three runs per
   case minimum, any failure fails the case).
   THE METRIC, fully specified here (finding 43 closed - nothing deferred to
   the harness): for each run, the selection is the ordered list of source
   identifiers per section. INVARIANT: identifiers are unique within a
   section - a duplicate identifier in any section is a P2 FAILURE, so the
   metric operates on duplicate-free lists by construction. Distance between
   two runs, per section, is 0.5 x Jaccard distance between the identifier
   SETS plus 0.5 x normalised Kendall tau distance over the ORDER of the
   identifiers common to both. EDGE CASE, defined: when the two selections
   share fewer than two identifiers, no order information exists and the
   order term is 0 by definition - the Jaccard term already carries the
   (near-maximal) distance of near-disjoint selections, which is the
   expected shape for a working tailor, never NaN. Run distance is the mean
   across sections. This formula is committed in Phase 0 and does not change
   after capture.
   PASS RULE (control-side variance included): the MINIMUM distance across
   all nine primary-vs-control pairs must exceed the MAXIMUM within-ad
   distance - the largest of the three primary-vs-primary, three
   control-vs-control, and three second-ad-vs-second-ad pair distances.
   Unstable output on ANY ad raises the bar or fails P1-P2 outright.
   Deterministic, automated, no adjectives.
   SCOPE HONESTY (finding 15): P3 proves the selection RESPONDS to the ad; it
   does not and cannot prove the response is RELEVANT. Relevance is gated by
   P4 dimension 2 (relevance of selection to the ad), scored by Daniel against
   each ad's captured reference. P3 necessary, P4-dim2 sufficient - that is
   the deliberate division, stated so no one mistakes P3 for a relevance test.
P4 HUMAN PARITY JUDGEMENT: for the primary AND second pinned ads, Daniel
   scores the HelloLilly output AGAINST that ad's captured reference output,
   per dimension, on this anchored comparative scale (finding 19):
   1 = clearly worse than the reference, 2 = somewhat worse, 3 = equal,
   4 = somewhat better, 5 = clearly better. Dimensions: structural fidelity,
   relevance of selection to the ad, narrative strength, honesty of framing.
   PASS PER AD: every dimension scores 3 or higher (no dimension worse than
   the reference), and the mean across the four dimensions is 3.0 or higher.
   "Overall" means that mean - no other aggregation. BOTH ads must pass. The judged output is the FIRST generated for each ad (attempt
   count recorded - no cherry-picking; v2 finding 20). The judgement is
   recorded in a committed file.
   P4's compared artefacts, precisely (v2 finding 17): the on-screen draft
   rendered from the HelloLilly structure vs the reference run's tailored CV
   text. The reference's suggestions/gaps doc is NOT part of P4 - it is an
   owed outcome on the ledger.

### Harness execution
A named command, separate from npm run verify (needs a live key; verify stays
offline). The harness report records: P1-P3 results per run, the HelloLilly
model and prompt version, SAMPLING SETTINGS and CORPUS VERSION (D12's
run-integrity invariant, per the fact report), run order and attempt counts,
and the checksums of every source resolved (v2 finding 57). The report is committed on the branch;
review does not pass without it. Structure/provenance validators that need no
generation run under verify against the synthetic fixtures.

## Item 2: The navigation split (D17) - stated in full (finding 60)
- The existing menu item currently labelled "CV-byggaren" is renamed to
  "Anpassad CV" - it already opens the per-job tailored draft, so the nav then
  tells the truth about what the screen shows.
- A new menu item "CV-byggaren" is added in the project's honest-disabled
  state (the established "Kommer" pattern), reserving the slot for the D15
  side project.
- The no-behaviour-change constraint binds THE NAVIGATION CHANGE ITSELF
  (labels and placeholder only); it does not restrict Item 1's replacement of
  what the Anpassad CV screen shows.
- Route tests cover this wave's touched routes: Anpassad CV, the CV-byggaren
  placeholder, and the retargeted links of Item 3 - not an application-wide
  audit.

## Item 3: Retarget AND relabel the dead links - stated in full (finding 60)
- The "Utforska och fyll den i Matchanalys" links in Innan du skickar's gap
  cards, and the equivalent link in the missing-keyword flow, currently land
  on the Matchanalys list where the job is no longer present - the user is
  stranded with no visible affordance. These links are retargeted to the
  job's ANPASSAD CV surface (Item 2 gives it its stable name).
- On arrival, the promised context must be visible: the user can see the
  job's gaps/analysis state and reach the existing fill affordance from
  there. Building richer gap-filling is out of scope (that is gap-drafting,
  a later wave).
- The link COPY is updated to name the actual destination (finding 54): a
  label saying "i Matchanalys" may not point at Anpassad CV. Every
  retargeted link's label, destination, and visible context agree.
- Escape hatch, bounded: ONLY if a link promises an action that exists
  nowhere in the product may it be honest-disabled instead of retargeted -
  and every such case is reported in the build report, never silently
  decided. Retargeted links must land correctly; disabled links must be
  visibly disabled, not dead.

## Explicitly out of scope (stated in full - finding 60)
- The keyword gate (warn-do-not-block) and all Innan du skickar display
  honesty (false green checkmarks, the letter-check box, the fit-list
  inversion) - transferred to the Wave 2 pre-send honesty brief, carrying
  adversarial findings 21-30 via the committed stub.
- Rendered .docx output, Swedish output, and multi-variant UI - owed
  outcomes, arriving with the separate CV-builder side project.
- The suggestion engine: AI-drafted new/changed bullets from the user's
  wider material (cover letters, interview Q&A, prior answers) with
  human accept-and-mint - the immediate next wave after this one.
- Bridged/advocacy-grade adaptation and its HIGH-RISK tagging machinery -
  binds from the wave that introduces bridging (the suggestion wave or
  later).
- Background analysis on job approval (the walkthrough's product
  correction: approving a job triggers analysis in the background) - a
  queued candidate wave.
- The Progress Support surface (activity timeline and cadence) -
  deprioritised by decision D18 after the first real-user read.
- Any change to the gap-fill loop, the letter writer, or the store schema
  beyond what carrying source identifiers on draft content nodes requires.

## Wave ledger - accepted residuals (per the convergence rule)
- Finding 15 (HIGH, non-blocking): P3 proves the selection responds to the
  ad; the CONTROL ad's own output relevance is never human-judged - only the
  primary and second ads get P4. Rationale for acceptance: the control
  exists solely to prove differential response; extending human judgement to
  it buys little for real cost. Revisit if P3 ever passes while P4 fails.
- Finding 56's history and any future MEDIUM findings live here rather than
  blocking.

## Ratification required from Daniel (before build, one message)
1. The D12 reconciliation: real-content parity material is a LOCAL PARITY
   REFERENCE, not a fixture - D12's synthetic-only fixture invariant stands
   untouched. D12 was confirmed by Daniel and binds; only Daniel amends its
   scope. Recorded as a decision entry on ratification.
2. The biography class: career biography remains committed-by-design (the
   persona decision); the FIXTURE LAW protects contact PII, the evidence pool,
   and captured CV artefacts. Confirm this reading.
3. Emphasis (carried from v2): the Wave 1 tailor is exactly as bold as the
   original - selection/reordering only; advocacy-grade bridging arrives with
   the wave that carries the HIGH-RISK machinery.

## Transfer artefact (v2 finding 55)
This wave's docs commit includes docs/WAVE_2_STUB_presend-honesty.md carrying
findings 21-30 by number with their one-line summaries, plus the green-checks,
cover-letter-box, and list-inversion findings from the walkthrough doc. The
transfer becomes durable, not conceptual.

## Mandated tests (summary)
1. Phase 0: preflight passed; three ads pinned and approved; reference runs
   captured with per-ad variants; two-tier fixtures per the FIXTURE LAW;
   template definition committed; Daniel's baseline confirmation recorded.
2. Harness report (P1-P3: three runs on each of the three pinned ads, nine
   generations total, every run P1-P2 checked, the committed P3 metric
   computed) committed and attached to review.
3. P4 passed on both pinned ads, judgement file committed.
4. Template invariance: repeated generations conform to the definition.
5. Nav and links per Items 2-3, including label/destination agreement.
6. Modularity check in independent review.
7. npm run verify green (offline, synthetic fixtures).
8. Independent review before merge with fixtures manifest + harness report +
   judgement file in the package.

## Process
One branch, one owner (Claude Code on Fable 5). BRIEF-AUTHORITY RULE (closes
finding 56, and the north star's process section is amended to match): briefs
state WHAT and WHY, and may additionally fix BEHAVIOURAL and BOUNDARY
positions - required interfaces, forbidden routes, defined tests, prohibited
implementations - when adversarial review has demanded them. Code structure
within those boundaries is the builder's. The old "WHAT/WHY only" wording is
superseded by this rule. Stop-and-report on anything outside
scope. Phase 0 completes and is confirmed before Item 1 build starts.
