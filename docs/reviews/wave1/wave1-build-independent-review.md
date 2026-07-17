# Wave 1 Build - Independent Review (Codex, repo access)
Reviewed: branch wave1-phase0-baseline @ 942a503 vs main @ 9b51f7c.
Date: 2026-07-16. Record preserved verbatim from the planner session.

Verdict: FIT TO MERGE PENDING P4

No BLOCKER or HIGH findings survived verification. All seven required
checks pass against the code (not just the reported claims); both named
questions resolve cleanly. Four MEDIUM + one LOW logged to the wave
ledger. npm run verify -> 321/321 + build green; branch not merged.

## The seven checks
(1) D12 Rule 2 - PASS. One named assembly module (RETROFIT_LEDGER.md
designates server/skeleton/prompt-assembly/index.cjs; the tailor uses
only tools.assembly, no second assembly point). Job ad enveloped as
UNTRUSTED, decoded role as UNTRUSTED_DERIVED (execute.cjs:222-223).
Draft hardcoded provenance 'untrusted-derived' regardless of input
(:178). Schema validate at :229 throws before writePart at :233;
failure -> part failed. Adversarial cases in both tiers via the shared
harness/phase0/injection-corpus.cjs.
(2) Selection-only - PASS (one noted nuance). The ported prompt contains
no authoring/suggestion/gap instructions - those words appear only as
prohibitions (execute.cjs:123-124). Every content node is verbatim byId
text + a datafactRef. Nuance -> ledger #4: category titles / job
company+period / section headings are emitted as taxonomy/structural
strings without a datafactRef - by the approved rigid-template design
(decision 2), with provenance recorded on the source datafact.
(3) cv-builder untouched - PASS. git diff on server/submodules/cv-builder/
= 0 lines. dev-server.cjs is exactly the one-line id swap.
(4) Template fidelity + id-stable Route B - PASS. Emitted structure = the
8 canonical sections incl. the single Professional Experience
super-heading over 5 fixed jobs and 3 competency categories (JC1);
drift-guard + P1 tests green. Enrichment verified against the live
store: 144 facts, all 25 competency facts carry category
{id,title,group,source}, manifest ids == store ids (no churn), 204 case
refs / 0 dangling. MANIFEST amendment moved only pool_sha256 + the 25
item hashes.
(5) Fixture law - PASS (with ledger items). git ls-files
harness/phase0/local/ = 0, server/data/store.db untracked - the real
144-fact corpus, ad bodies, and captured CVs are not committed.
MANIFEST/PARITY_REPORT/parity-report.json carry only ids, checksums,
config, labels. Residual leaks minor -> ledger #1, #5.
(6) Parity metric - PASS, reproducible. Formula in
harness/phase0/parity-metric.cjs matches the brief exactly: Jaccard,
normalised Kendall-tau over common ids with <2 shared -> 0, 0.5/0.5
blend, mean across tailorable sections, min(9 cross) > max(within).
Recomputing from the report's recorded selections reproduces the report
exactly: minCross 0.0855, maxWithin 0.0663, pass true.
(7) Two-tier gate - PASS (blocking is a repo setting -> ledger #3).
offline-eval runs on all PRs; live-zero-tolerance is path-gated,
RUNS=3 per case, fails closed (exit 1) if ANTHROPIC_API_KEY absent when
honesty paths changed.

## Named questions
(a) Decode model / guard / same-model rule: decode served by
claude-opus-4-8 (decoder/manifest.cjs options.model). The decoder never
passes temperature, so the client guard is a no-op for decode -
behaviour identical before and after, nothing silent. The same-model
rule governs reference substitute vs tailor (both claude-sonnet-4-6);
the decoder is an upstream input step producing decodedRole, honestly
recorded. Rule honoured in substance. Caveat, not a defect: the
opus-decoded role is one of the tailor's enveloped inputs and
contributes to cross-ad signal, but it is held constant per ad across
the 3 tailor runs, so it never touches the within-ad measurement.
(b) Thin P3 margin: computation verified (reproduces 0.0855 > 0.0663).
Nothing artificially inflates cross-ad distance; within-ad is not
artificially zero (primary [0.0145, 0.0663, 0.0655], control [0.0088,
0.0172, 0.010], second [0.0295, 0.0392, 0.0395]). The margin is
load-bearing on temperature 0 - a legitimate, recorded choice for a
stable selection task; at the manifest's declared 0.2 it could fail.
-> ledger #2.

## Wave ledger findings
MEDIUM
1. harness/phase0/TEMPLATE_DEFINITION.md:6 claims "No personal content"
   but line 16 commits the real name and real company names as
   structural constants. Not a corpus/ad/CV leak (name pre-existing in
   the app), but the self-description is inaccurate - fix the claim or
   drop the name.
2. P3 pass is contingent on tailor temperature=0 with a thin margin
   (delta 0.0192); serving noise could flip a re-run. Document the
   temp-0 dependency in the report; consider the sharper control ad
   Daniel declined at 0e.
3. The gate blocks merge only if offline-eval / live-zero-tolerance are
   marked required status checks in branch protection - a repo setting
   not in code. Set it, or "BLOCKS the PR" is aspirational.
4. Category titles are emitted taxonomy strings without a datafactRef -
   by approved decision 2. PLANNER CONFIRMATION 2026-07-16: matches the
   confirmed rigid-template decision; by design, recorded.
LOW
5. Test/fixture hygiene: synthetic test bullets tag real company names
   and one generic phrase overlapping a real pool bullet;
   synthetic-corpus.json reuses a few generic competency labels while
   claiming "fully fabricated." No personal achievement, ad body, or
   full pool bullet committed - tighten to fully-synthetic strings.

## Merge condition
The brief-required merge gates that are not code: P4 human judgement on
the primary + second ads (owed); the harness report as an attached
review artifact (present, verified reproducible); Daniel arming the
ANTHROPIC_API_KEY secret + marking the checks required. Code-side: ship
it after P4.
