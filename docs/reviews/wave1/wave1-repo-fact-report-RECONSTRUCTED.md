# Wave 1 - Repo-Grounded Fact Report (RECONSTRUCTION)
Produced by a read-only Claude Code session against the live repository,
2026-07-16, fact-checking Wave 1 Brief v3's repo claims before final review.
STATUS OF THIS FILE: the original report file was lost; this is a
reconstruction from the planner session record, preserving the findings'
substance. Where exact wording is uncertain, substance over phrasing.

1. Reference machinery preflight (brief claimed inputs missing at expected
   paths): FALSE as claimed. CV_JOB_VARIANTS.md and CV_SECTION_VARIANTS.md
   exist at the expected paths as working symlinks; nothing needed restoring.
   The REAL defect found instead: the reference loader (loadFile)
   console-warns and returns an empty string on a missing soft input, so a
   run can complete "without errors" while feeding the LLM empty source
   documents. Preflight must assert non-empty loads, not absence of errors.
2. D12 claims: PARTIAL x3. (a) The synthetic-only fixture rule is real and
   binding ("no real CV ever enters a fixture", confirmed by Daniel) - the
   brief's local real-content tier is only lawful if such material is not a
   fixture; the reconciliation requires Daniel's ratification. (b) The
   three-run rule applies to every zero-tolerance case, not only the primary
   ad. (c) Rule 2 has three invariants - envelope, one named prompt-assembly
   module, transitive taint on model-written output - of which the brief had
   covered two; adversarial eval cases for the new ingestion class are also
   required, and the run manifest must carry sampling settings, corpus
   version, and run date.
3. Data exposure: VERIFIED with nuance. data/cv_data.json and the datafact
   store are gitignored and absent from git history; committed contact
   details are a fake pair. HOWEVER Daniel's career biography is committed
   by design (writer prompt, persona pack, product-vision docs) per the
   standing real-persona decision - the fixture law's rationale must state
   disclosure classes accurately rather than claim blanket privacy.
4. Template extraction: PARTIAL. Four of six schema elements are mechanical
   from the reference code (section sequence, i18n headings, five fixed jobs
   with company/period, static content locations). Two are judgement calls
   the brief must name: cardinality bounds (live in prose rules and the
   prompt, not code) and section emptiness (buildCV renders every section
   unconditionally).
5. Structured-representation claim: VERIFIED, better than claimed. Draft
   content nodes already carry typed source refs and the store is
   schema-free JSON - carrying a new fixture-identifier ref kind requires no
   schema work.
6. Standout additional fact: the canon the brief cites (amended north star,
   the brief itself, the stub) existed only as uncommitted working-tree
   edits - a reviewer of the committed repo could not see the law the brief
   binds itself to. Committing canon must precede build.
