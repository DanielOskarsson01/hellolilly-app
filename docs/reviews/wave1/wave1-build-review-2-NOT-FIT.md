# Wave 1 Build - Second Independent Review (deep pass)
Reviewed: branch wave1-phase0-baseline (post ledger-fix commits) vs main.
Date: 2026-07-16. Record preserved verbatim from the planner session.
SUPERSEDES the first build review's verdict (wave1-build-independent-review.md,
"FIT TO MERGE PENDING P4"): this pass reproduced concrete exploits the first
pass missed; under the standing rule, checkable findings win.

Verdict: NOT FIT - multiple HIGH findings block merge independently of P4.

Check results: D12 Rule 2 FAIL; selection-only PARTIAL (prompt and leaf text
pass; complete provenance does not); cv-builder scope PASS; template fidelity
FAIL; Route B identity stability PASS mechanically; fixture law FAIL; P3
formula/arithmetic PASS but extraction and run evidence FAIL; two-tier CI
FAIL as a blocking gate.

HIGH FINDINGS
1. D12 prompt assembly and taint are not enforced invariants. The named
   module merely concatenates caller-provided strings; it does not receive
   provenance-bearing sources and decide enveloping itself. The tailor
   manually envelopes only the ad and decoded requirements, while
   model-authored gap-fill datafacts enter the trusted task unenveloped. The
   decoder assembles the raw ad outside the module.
   (prompt-assembly/index.cjs:34, cv-tailor/execute.cjs:211,
   decoder/execute.cjs:54)
2. The string envelope is delimiter-injectable: an ad containing the exact
   END UNTRUSTED_DATA sentinel escapes the first fence. The adversarial
   corpus uses a nonmatching sentinel, so it misses this case.
3. Draft taint is hard-coded once rather than transitively enforced; the
   store accepts later writes that omit or downgrade provenance.
   (cv-tailor/execute.cjs:178, store/index.cjs:99)
4. Schema validation does not prevent an invalid draft from being written
   ready. Nested job/category fields, all five job keys, cardinalities,
   membership and uniqueness are not required. REPRODUCED: an empty draft
   validated successfully and was written ready; P1 then reported 17 errors.
   P1/P2 are not runtime pre-write gates. (cv-tailor/execute.cjs:106, :227)
5. IDs resolve from the global fact map, not checked against their
   category/job bucket: a valid MrGreen fact can be placed under Coinhero
   and pass - false attribution from verbatim, resolving text.
   (cv-tailor/execute.cjs:150)
6. Adversarial gates do not detect instruction adoption (offline stub always
   returns a fixed good selection; live cases check only status/taint/P1/P2 -
   an obeyed instruction choosing different valid ids passes). The live
   runner copies gitignored server/data/store.db - clean-checkout
   reproduction exits ENOENT before any adversarial run.
   (eval-gate.test.cjs:80, run-eval-live.cjs:38/:54, .gitignore:11)
7. main has no branch protection and no ruleset - failed checks do not block
   merging; the workflow itself runs and fails closed correctly.
8. P1 validates a reduced structure, not TEMPLATE_DEFINITION.md: the tailor
   emits eight sections, collapses intro and bullets, omits roles, header
   image, structured name/contact and the languages line; P1 deletes
   header_image and name_contact from its expected sequence and checks one
   item per job despite variant-fixed bullet counts.
9. Extraction incomplete vs the committed extraction law: competency
   categories are tailorable content rendered without datafactRef; category
   ids and job-role ids are omitted from extraction; P2/P3 inspect only
   child items.
10. Fixture law breached inside committed test material: the "fully
    fabricated" synthetic corpus copies entries byte-for-byte from the local
    curated competency pool; the offline eval pools contain real employer
    history and CV-derived claims while calling themselves synthetic. The
    biography exception does not make person-data in an eval case synthetic.

NAMED QUESTIONS
(a) Three decode calls, one per ad, each targeting claude-opus-4-8, reused
    across the three tailor runs. The historically served revision is not
    determinable (client discards the response envelope; report hard-codes
    configured strings). The guard did not substitute a model. The
    same-model rule holds only for the final request ids; in substance the
    HelloLilly chain is Opus->Sonnet vs reference Sonnet-only, and sampling
    differs (reference 0.2/8000 vs tailor 0/2000).
(b) P3 arithmetic correct and reproducible (minCross 0.0855026455,
    maxWithin 0.0663121693, margin 0.0191904762); the entire pass margin
    comes from Kendall ordering (permitted). Within-ad variance is deflated
    by temperature 0 and one decode held fixed across runs, while ad-specific
    Opus decode can strengthen cross-ad differentiation. The extraction
    feeding the formula is not the committed extraction exactly.

VERIFIED PASSES + MEDIUM LEDGER
- cv-builder byte-identical; sole route swap at dev-server.cjs:323.
- Route B mechanically id-stable (144 ids, 25 changed records, hashes match,
  0 dangling refs).
- MEDIUM: Route B exposes only five categories; cannot reproduce the
  captures' Operations or Digital categories.
- MEDIUM: the executable metric was not frozen in Phase 0; it arrived with
  the results, contrary to the freeze requirement (the formula itself was
  frozen in the brief and the implementation matches it).
- Tests 321/321 pass but encode the weakened boundaries; they do not clear
  the findings.
