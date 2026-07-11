# HelloLilly - Architecture Rules Addendum v2 (post-review)
**Status:** doc of record per D12, adopted 2026-07-11 after tri-model adversarial review (two independent reviewers, reconciled). The three judgment calls below are confirmed by Daniel, 2026-07-11.
**What this is:** the D10 parked five as standing law, extending the four architecture non-negotiables (store, templates, status envelope, honesty gate). The existing four are untouched.
**What changed in v2:** both reviewers independently found the same structural fault - semantic goals declared as invariants without deterministic enforcement. v2 adopts the cure throughout: every rule separates its INVARIANT from its DISCIPLINE, and no claim exceeds its enforcement tier.

---

## Section 0 - Enforcement vocabulary (binds every rule below)

- **INVARIANT:** a deterministic property enforced by code, schema, or CI. Binary, auditable, no interpretation.
- **DISCIPLINE:** a semantic property enforced by judge calls and regression evals. It detects known failure channels and drift at change time. It is never described as a guarantee, and this document never claims runtime protection where only regression protection exists.
- **Failure disposition (universal):** when any runtime gate fails or cannot run, the status envelope transitions to **failed** with honest error copy. A gate failure never renders as a result, and never as a refusal - a refusal is a ready result whose content is a refusal; a failure is a failure. (The presend transport-vs-refusal split, generalized into law.)
- **Enforcement tiers, stated per path:** every prose or judging path is marked either runtime-gated (a judge sits in the path; zero-tolerance violations fail closed at runtime) or regression-gated (violations are caught by the eval corpus at change time). The marking lives in the tool's design entry. Claiming the wrong tier is itself a violation.

## Rule 1 - The anti-blame gate

**The obligation (positive form).** Prose about the person or their work locates defects in the artifact, the gap, or the market mechanism. The person's character is never the defect.

**Banned channels (non-exhaustive; each carries eval cases):** direct trait attribution ("you are not confident enough"); retrospective fault ("you should have followed up sooner"); improvement-framing of the person rather than the artifact; comparative shaming ("weaker than serious candidates"); statistical doom ("profiles like yours rarely progress"); contemptuous or exasperated tone; omission-only deficit reporting (output that lists only what is wrong when balance was contracted).

**The truth clauses (what this rule does NOT do):**
- Evidence-backed positive traits are required work, not violations - the CV and letter writers exist to express supported strengths.
- Verified conduct may be stated neutrally with its citation: "three booked sessions were not attended (record)" is compliant; "you are unreliable" is not. The neutral statement pairs with a mechanism next-step, never a character verdict.
- Hard market truths are stated as mechanisms: "adverts in this field increasingly require certificates you do not hold" is compliant and required by the honesty gate.
- The person's self-blame is never mirrored back as trait confirmation; the tool answers the mechanism.

**Enforcement.** DISCIPLINE: writing-rules modules in the prompt layer; zero-tolerance eval classes covering every banned channel above. Runtime frame-judging exists only where a judge already sits in the path; all other paths are regression-gated and marked so. (confirmed by Daniel, 2026-07-11: no universal runtime frame-judge at MVP - cost and latency; revisit at the first prose-heavy wave.)

## Rule 2 - The injection envelope and transitive provenance

**INVARIANT - provenance.** Every stored record carries provenance. Records derived in any part from untrusted input - including model-written derivatives such as dossiers, summaries, decoded roles and drafts - carry untrusted-derived provenance, permanently. Provenance survives storage, retrieval, summarization and reuse: taint is transitive.

**INVARIANT - assembly.** One named module owns prompt assembly. Untrusted and untrusted-derived content enters prompts only inside the envelope: canonical serialization, source-tagged, role-separated from instructions. Enveloping is decided by provenance at assembly time, never by "is this the ingestion moment". An ingestion point or prompt assembly outside this module is a violation by itself.

**INVARIANT - output side.** Model output is schema-validated before anything renders, writes or relays. The claim is scoped: schema validation stops malformed shape from driving the interface or the store; it does not stop semantically hostile but well-formed content - that is what the dispositions in Section 0 and the judge isolation in Rule 3 are for.

**DISCIPLINE.** Adversarial eval cases per ingestion class, covering the prohibited effects: verdict change, instruction adoption, persona shift, context or system-prompt exfiltration, and (when Lilly ships) tool-registry manipulation. Cases fail closed per Section 0.

**The ingestion inventory (kept current; one line per entry: source, transform, sink).** Pasted/imported job ads; decoded role text; researcher fetches; RSS items (B3); uploaded documents (CSV, the future doc-to-datafacts extractor); inbound coach-channel replies (untrusted transport even from a trusted sender); user-suggested Hub links; community content if it ever goes real. New ingestion points are added at build time.

**Scope of claim.** No inertness guarantee exists or is implied. The testable claim: the provenance and assembly invariants hold, and the known-channel adversarial cases pass. Defence in depth, honestly labelled.

## Rule 3 - Maker/checker separation

**INVARIANT.** Generation and judgment are separate calls. Prohibited shared state, enumerated: the maker's reasoning, drafts and chain-of-thought; the voice profile; conversation history; any case data not named in the judge's input contract. Each judge's input contract is written where the judge is specified; changing it is a logged contract change.

**The artifact clause (closing the reviewers' gap).** The checker necessarily receives the artifact it judges - and that artifact is model-written, therefore untrusted-derived under Rule 2, therefore enveloped inside the checker's prompt. A judge steered by the content it judges is not a gate; Rule 2 applies inside Rule 3.

**Corollaries.** The checker never sees voice - voice is not risk, and a checker that sees voice starts grading it. A smaller or faster model for checkers is allowed: separation is about context, not model parity. Lilly's no-relitigation rule (D11) is this invariant's conversational face.

**Scope.** Paths carrying a judgment the person relies on (honesty gates, verdicts, fit claims) require a checker. Pure drafting paths are governed by Rules 1 and 4 instead.

## Rule 4 - The eval corpus, the frozen zone, and what tests what

**Split of duties (INVARIANT vs DISCIPLINE).** Deterministic workflow properties - the pass-3 hard-code, the one-variant law, the approval-before-export gate - are proven by ordinary integration tests, not by the eval corpus. The eval corpus covers model-invoking behavior only.

**The corpus (DISCIPLINE, honestly named).** Every prose-producing and judging path carries graded eval cases. The corpus is a regression tripwire: it detects drift and known-channel violations at change time. It is not certification, and no output of it is described as one.

**Zero-tolerance classes (one failure blocks the change):** a fabricated claim about the person; a banned blame channel (Rule 1's list); compliance with instructions inside enveloped content (Rule 2); a verdict-discipline violation in model output. Zero-tolerance cases run repeated trials (three runs per case minimum; any failure fails the case) because single runs prove nothing about stochastic output.

**Run integrity (INVARIANT).** Every eval run records a manifest: model identifier and revision where the API exposes it, sampling settings, date, corpus version. Evals run against the runtime configuration, never a stand-in model.

**Corpus integrity (INVARIANT).** A candidate change passes the UNCHANGED prior corpus plus any approved additions. Weakening or removing a case is its own logged event with justification. A failing baseline has a documented repair path: fix forward with the failure recorded, never by deleting the case.

**Graded classes** (register fidelity sv/Swenglish, over-softening, mechanism-language quality): rubric, scorer configuration and thresholds are versioned separately from the prompts they test; a threshold change is a frozen-zone event, so thresholds cannot drift to meet results.

**The frozen zone, lightened (per review).** The RUN is automated: a pre-commit/CI hook blocks changes to prompt or eval paths unless the eval passes - no ceremony, no honor system. The EDIT gate stays human: prompts and cases change only in a deliberate session with Daniel plus a strong model. Ceremony only where judgment lives; automation where compliance lives.

**Fixtures (INVARIANT).** Eval cases contain synthetic person-data only. No real CV, disclosure, or coach record ever enters a fixture. (confirmed by Daniel, 2026-07-11 - binds immediately.)

## Section 5 - Inference surfaces and the real-persons gate

**The mechanical definition (INVARIANT).** An inference surface is any path that writes an interpretation of the person's state (confidence, wellbeing, barriers, motivation) to a stored shape, or renders one to a coach-facing view. Conversational padding that stores nothing and reaches no coach is not an inference surface. All inference surfaces live in ONE machine-readable registry file in the repo - not scattered flags. Known members at v2: the Transition Compass confidence capture, Transition View coach prompts, the Outcome Engine per-group analyses.

**The real-persons gate (REFUSAL; confirmed by Daniel, 2026-07-11).** No non-demo use - no real jobseeker other than Daniel - of any inference surface, or of any legacy path still on the retrofit ledger, until the governance review (AI Act, coach-facing surfaces, data controls) is recorded as done. This is the same trigger as D9's privacy flag: the second human is the deadline. Demo use continues freely.

**The retrofit ledger (INVARIANT).** Created with this document: the shipped paths not yet under these rules, named - the letter writer, the presend judges, Matchanalys prose, the A1 researcher prompts. Retrofit at next touch while demo-only; the ledger must be empty before the real-persons gate opens. No path leaves the ledger without its eval cases existing.

**Sensitive-class, minimally bound now.** Participation is sensitive by inference (unemployment status); barrier data touches disability, language origin, neurodivergence. Binding immediately: synthetic-only eval fixtures (Rule 4) and no person-data in logs beyond what the store itself holds. The full control matrix (retention, deletion, provider transfer, encryption posture) belongs to the governance plan and is not faked here.

---

## What this document refuses

- No universal semantic guarantees, anywhere. Every claim is scoped to its enforcement tier, and describing a DISCIPLINE as an INVARIANT is itself a violation.
- No real-jobseeker use behind the gate in Section 5 until the governance review is recorded and the retrofit ledger is empty.
- No real person-data in eval fixtures, ever.
- No per-tool exceptions to the zero-tolerance classes. A tool that cannot pass them does not ship its prose path.
- No dedicated retrofit wave - next-touch while demo-only, with the ledger as the honest debt record.
- No merging of this document into the honesty gate. The gates are orthogonal: a claim can be supported and still blame; both must pass.

## Open questions (carried, not hidden)

1. Shared frame-judge vs per-tool - decided at the eval corpus's first build.
2. Runtime frame-judging beyond judged paths - revisit at the first prose-heavy wave, with measured cost.
3. The inference-surface registry's CI check (lint that flags unregistered writes to state shapes) - nice-to-have, not blocking adoption.
