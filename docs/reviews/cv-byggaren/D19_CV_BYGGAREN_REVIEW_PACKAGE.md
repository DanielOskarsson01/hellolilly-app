# D19 Adversarial Review Package - CV-byggaren build brief

**For:** two independent reviewers (Gemini, Codex), reviewed separately, findings returned as files.
**Subject:** the CV-byggaren build brief (building-only CV tool) + its wireframe, for the HelloLilly jobseeker platform.
**Your role:** hostile reviewer. This brief looks strong. Your job is not to confirm that - it is to find where it breaks. Assume the author is competent and has already thought of the obvious objections; earn your keep by finding the non-obvious ones. A review that returns "looks good" has failed regardless of the brief's quality.

---

## What you are reviewing and why the bar is high

HelloLilly is a Swedish employment-services platform. This tool helps a jobseeker build a CV from nothing, or from a messy old one. Its entire product thesis is a single safety claim:

> **The fabrication invariant: nothing enters the CV that the user has not confirmed.** The AI may ask, suggest, rephrase, and assemble from confirmed material. It may never introduce a fact - a number, employer, tool, credential, duty, date, or outcome - not traceable to something the user said or approved. Where evidence is missing, it asks or leaves a marked gap. It never invents a plausible value.

The claim behind the claim: every CV product on the market lets the AI invent biographical facts (a demo that fabricates "45% growth"; a tool that suggests "award-winning" for someone with no award). HelloLilly's whole competitive and ethical position is that it does NOT. This is asserted as an **INVARIANT** - deterministic, CI-enforced, never a matter of prompt tone.

If that invariant can be broken by some input, framing, or path the brief did not consider, the product's central promise is hollow - and a jobseeker could send out a CV containing a fabricated claim under their own name, into a real hiring process, possibly a public-sector one. That is the harm to reason about. This is why the review matters more than a normal design pass.

The full brief and wireframe are provided alongside this package. Read them first.

---

## The context you need (decisions already locked - do not relitigate, use them)

- **Two data paths.** Confirmed facts live in a dedicated "datafact" ledger (host-only writes, gate-exempt). A separate "collections" store is client/submodule-writable. The brief adds `status: verified|unverified` and `sources[]: {origin, ref?, span?}` to the datafact shape. Unverified facts are excluded from generation and from the CV until confirmed. Legacy facts with no status read as `verified` (defaulted at the single accessor).
- **The envelope (injection defence).** All untrusted text - uploaded CVs, pasted text, voice transcripts - enters model prompts only through a single source-tagged envelope, never concatenated raw. Model-written text is itself treated as untrusted-derived (taint is transitive).
- **Maker/checker.** Any submodule that generates a claim (bullet composer, summary writer) is paired with an independent checker that validates output against only its cited source facts. A generator grading itself is not a checker.
- **The five AI contracts:** fact extraction (from upload/paste/voice, verbatim spans, no paraphrase of hard facts, no inference of absent facts); bullet composer + checker (one sentence from four answers, every token traceable, claim-diff on any untraceable token, empty "result" yields no metric); capped neutral clarification questions; summary writer (summary-last, per-sentence provenance, easy-Swedish variant); skill suggester (each skill grounded in a confirmed task, rejectable).
- **Slices:** 0 verify (done), 1 ledger provenance, 2 guided from-scratch spine, 3 upload-and-review (the differentiator; voice folds in here), 4 summary + skills, 5 template + real PDF + parseability + export gate.
- **User model:** during the entire build the only user is Daniel, the founder, using his own real CV. No other real jobseeker touches these paths until a separate governance review is done. So "multi-user" and "other people's data" attacks are out of scope for THIS build - stay on the tool itself.

---

## Attack the brief along these axes (this is the work)

### Axis 1 - Break the fabrication invariant
This is the centre. Find an input or path where an unconfirmed fact reaches the finished CV despite every stated control. Concrete hunting grounds, not limited to these:
- **The paraphrase seam.** The composer assembles "only from the four answers". The checker "flags any word or number not present in the inputs". But natural language needs connective and inflected words that are not in the inputs (Swedish inflection, joining verbs). Where is the line between legitimate assembly and a smuggled claim? Can a claim be smuggled through *inflection* or *implication* while every literal token is "traceable"? Example to test: the answers imply seniority the person never claimed; the bullet states it. No single token is fabricated; the meaning is.
- **Aggregation.** Each summary sentence "links to the facts that support it". Can a set of individually-sourced sentences combine to imply a claim (a seniority, a scope, a tenure) that no single fact supports and the person never made? Sourced-per-sentence does not mean truthful-in-aggregate.
- **Extraction inversion.** Fact extraction takes a verbatim span with a source. But OCR damage or a parse error can make a verbatim span *mean* something false (a date range that reads as current employment; a bullet that belongs to the job above it). The span is real; the fact is wrong. The brief names "structural-risk detection" - is it specified concretely enough to actually catch this, or is it a hopeful label?
- **The confirmation ritual.** Acceptance mints a verified fact. But if the review UI presents a fabricated-by-OCR fact as "found in your document", the user may confirm it *believing the tool read it correctly*. Does confirmation actually mean the user vouched for the fact, or only that they clicked "Stämmer" on something the tool asserted? Where is the boundary between "the user confirmed" and "the user rubber-stamped the machine"?
- **Skill/rationale drift.** A skill is grounded in a confirmed task with a rationale ("because you led a team of six"). Can the rationale itself assert something stronger than the task fact (leadership *quality*, not just the fact of leading)?

### Axis 2 - INVARIANT vs DISCIPLINE misclassification
The brief marks some properties INVARIANT (deterministic, CI-enforced) and others DISCIPLINE (judged). Find anything sorted into the wrong bin. Specifically: is "no unconfirmed claim can be exported" genuinely enforceable deterministically, or does it secretly depend on a judgment call (what counts as a "claim"? is an inflected verb a claim?) that cannot be a clean CI gate? If the invariant's enforceability rests on a semantic judgment, the brief has an INVARIANT that can only be a DISCIPLINE - which is exactly the class of error the vocabulary exists to prevent. This is the highest-value single finding if it exists.

### Axis 3 - The eval corpus as the invariant's executable form
The no-fabrication eval set is "the executable form of section 4 and gates merge". Attack it: what temptation cases would you demand are in it that the brief does not name? What is the pass/fail predicate exactly - "output contains no token outside the source set" (defeatable by the inflection/aggregation attacks above) or something stronger? Can the corpus actually encode "no fabrication" as a deterministic check, or only sample against it? If the latter, is calling it an INVARIANT-gate honest?

### Axis 4 - Slice boundaries and the born-compliant claim
The brief says new code is "born compliant" - envelope, schema-validation, maker/checker from day one, not retrofitted. Test that against the slice cut: does any slice ship a generation path before its checker exists? Does slice 2's composer land before the eval corpus can gate it? Does the voice path in slice 3 genuinely inherit the envelope, or is it bolted onto an extraction contract designed for documents? Find the slice where a control is claimed but arrives a slice late.

### Axis 5 - The export gate's "blocks by construction" claim
The brief's cleverest move: export is blocked while any unconfirmed claim remains, "and because unconfirmed text can never enter the CV, in practice it blocks by construction". Is that true, or circular? If unconfirmed text genuinely cannot enter the CV, the gate is redundant; if the gate is load-bearing, then unconfirmed text CAN enter and the earlier invariant leaks. Which is it? A believed-redundant gate that is actually load-bearing is a dangerous place for a bug.

### Axis 6 - Anything else
Data-model risk (the additive shape change; the legacy-verified default - can a genuinely unverified legacy fact exist that now reads as verified?). The category-field repair (reseed-safety). Save-and-resume and version snapshots selecting from a shared mutable ledger (if the ledger changes under a saved version, what happens?). Scope leak. Sequencing against the repo. Name what you would refuse to build without more specification.

---

## How to return findings

For each finding:
- **Axis and one-line title.**
- **Severity:** BLOCKER (build must not start until resolved) / MAJOR (must be resolved in or before the slice it touches) / MINOR (fix opportunistically) / QUESTION (needs Daniel's decision, not clearly a defect).
- **The concrete case** - the input, path, or sequence that exhibits it. Abstract objections are weak; a specific CV, answer, or upload that breaks the invariant is strong.
- **What would resolve it** - a spec change, a new test, a reclassification, a slice re-cut.

End with one paragraph: **is this brief fit to build, fit to build with the fixes you listed, or not yet fit to build - and the single most important thing to change.**

Do not rewrite the brief. Find what is wrong with it.
