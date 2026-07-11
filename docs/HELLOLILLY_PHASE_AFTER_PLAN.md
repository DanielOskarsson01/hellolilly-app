# HelloLilly - The Phase-After Plan v2: governance, the second human, and the handover
**Status:** doc of record per D13, adopted 2026-07-11 after tri-model adversarial review (two independent reviewers, reconciled). Daniel's three calls (padlock rule, identity-trigger refinement, pilot-agreement precondition dropped) are folded into the body.
**What this is:** the plan for the phase where the product stops being Daniel's tool and meets real people and a real organisation. It defines the governance review that the real-persons gate (D12 §5) waits on, sequences the second human's arrival, sets the learning-layer threshold, and shapes the pilot.
**What this is NOT:** legal advice. Where a question is legal, this plan names it precisely and assigns it to professional verification. Any legal conclusion asserted by this document instead of by counsel is a defect in this document - and where v1 broke that rule, v2 relabels those passages as working hypotheses.

---

## 0. Enforcement honesty (imported from D12)

Every gate protection below is marked **INVARIANT** (technical, binary) or **DISCIPLINE** (a rule, enforced by conduct and review). At demo stage the enforcer of every DISCIPLINE is Daniel, and this plan does not pretend otherwise: its job is to make any violation deliberate and visible instead of accidental. The one external anchor before a pilot exists is the professional sign-off in §2. A stale or bypassed gate is treated as SHUT (fail-closed), never as approximately open.

## 1. The gates already standing, and the definition they need

Four gates exist: the real-persons gate (D12 §5), the D9 privacy flag, the D4 identity trigger (refined by this plan, §3), and the retrofit ledger. This plan is the path through them.

**Non-demo use, binding definition (DISCIPLINE).** Demo use = wholly synthetic fixture data, or Daniel's own data, operated by Daniel. Non-demo use begins the moment ANY real person other than Daniel has data entered about them, a case created, or a tool's output applied to their situation. **"Applied" means:** any output that selects, changes, prioritises, or communicates an action for an identifiable person - copying a fixture-generated recommendation into a real person's counselling counts.

**Real-derived is real (DISCIPLINE).** Pseudonymised, anonymised-by-hand, composite, "inspired by", or LLM-recast versions of a real person's data are non-demo use. Synthetic is a property, not a label: fixtures are wholly invented and carry recorded provenance (who invented them, from nothing). The Daniel-shaped twin persona - his career's shape, nobody's facts - is the canonical demo fixture.

**Coach accounts.** A coach's own account and profile data is professional-user data handled under the coach's ordinary consent; it does not trip the jobseeker gate. What the gate guards is jobseeker-side data and outputs - including anything a coach pastes in (§3).

## 2. The governance review, defined (the hard consumer)

One recorded document, updated on material change, committed to the repo. **Done-when (hardened):** every section carries an affirmative per-surface disposition or an explicit blocking condition; the real-persons gate opens only with ZERO unresolved blocking conditions and every blocking mitigation implemented and tested - a recorded "we accept the risk" does not open the gate. The legal sections carry sign-off by a named professional qualified in EU data/AI law, credentials recorded. **The reviewer and the budget are named before §2 is marked in progress** - an unfunded mandate invites self-certification, so the funding decision is part of the plan, not an afterthought.

**2a. AI Act posture.** Which surfaces fall into regulated categories, using the inference-surface registry (D12) as inventory. Working hypothesis for counsel to confirm or refute (not settled context): HelloLilly cannot claim the personal-use framing that shields individual tools, because coach-facing surfaces deliver institutional inference in an employment-services context. Deliverable: per-surface classification, obligations, and required changes. Professional verification: required.

**2b. GDPR basis and classification.** Working hypotheses for counsel: participation reveals unemployment status; barrier data (disability, language origin, neurodivergence) may constitute special-category health data. Counsel records the actual classification and basis per data category. Also: the data-subject rights mechanisms (see-what-it-knows, deletion) named as concrete features; the processor chain verified, not assumed (the LLM API provider processes person-data on every prompt - DPA status, retention mode, EU processing options).

**2b-annex. The applicability matrix (added per review).** The review decides, with evidence, the applicability of each and completes every applicable one before done: DPIA (GDPR art. 35); fundamental-rights impact assessment (AI Act art. 27, deployer-side); controller/processor/deployer allocation across Daniel's company, HelloLilly and the LLM provider; human-oversight and contestability requirements; minors (the product serves adults - verify nothing in the funnel admits otherwise); complaints and redress.

**2c. The data-controls matrix.** Retention and deletion per shape; encryption at rest and in transit; access control on any server; backups with deletion honoured through backups; logging boundaries (D12 baseline stands). **Controls are implemented and TESTED before any non-demo data exists in ANY environment - local included.** A control that is a recorded posture rather than a working mechanism does not count.

**2d. The Arbetsförmedlingen framework (expanded per review).** Beyond residency/documentation/audit: whether a subcontracted tool needs the provider's or the agency's prior approval (a pilot-gating question); the statutory constraint that registered data serve necessity and that selection searches on sensitive data are prohibited - flagged with its product consequence, since it touches how Matchanalys and the Outcome Engine may ever be used institutionally. Provider-only items split by consequence: anything gating THE PILOT closes before done; items gating only later phases may be tagged and carried.

**2e. Security incident duty (new).** Detection, containment, processor escalation, breach assessment and the 72-hour notification process, stop/restart authority. Exists as a written, tested process before any non-demo data.

**2f. Accessibility (new).** The public-sector context makes accessibility law a real procurement question; the review states what applies to a supplier's tool and what the product must meet before pilot.

**Material change, enumerated (DISCIPLINE).** The review reopens - and the gate is SHUT while it is open - on any of: a new inference surface; a new data category; a new model or vendor; a new communication channel; a deployment change; a new user class. Registry completeness relies on D12's open CI-lint question, referenced not duplicated.

## 3. The second human - two paths, one identity rule

**The identity rule (refines D4; Daniel 2026-07-11).** Identity - login, roles, per-person data isolation - is built BEFORE the first real case that is not Daniel's exists, whichever path fires first, or when a pilot coach needs the in-app surface, whichever comes first. Reason: the first rights of a second human are "show me my data" and "delete me", and an identity-less system cannot know who is asking.

**Path A - the pilot coach.** Preconditions, ordered: (1) identity built (the rule above); (2) 2a cleared for the coach-facing surfaces the coach will see; (3) the coach's own consent recorded; (4) **the fixture sandbox (DISCIPLINE + role INVARIANT where cheap):** the coach interacts with fixture jobseekers only - never Daniel's real inferred state, never a pasted real CV (that is non-demo use by §1) - until Path B's preconditions are met; (5) demo-tier tools are role-inaccessible to coach accounts, not merely bannered.

**Path B - the second jobseeker.** Preconditions, ordered: (1) the governance review recorded done, zero blocking conditions; (2) the retrofit ledger empty; (3) identity live; (4) consent, see-what-it-knows and deletion working before the first real case is created; (5) the channel rule: NO jobseeker data of any kind - not only CVs - on any channel the review has not approved; the coach bridge moves in-app or gets an approved channel; (6) a verified purge of the historical Telegram bridge content, recorded.

**Order:** A before B remains the recommendation - a professional user hardens the system before the first vulnerable user arrives. The gates bind either way.

## 4. The learning-layer threshold

Hive and the Outcome Engine go real only on accumulated genuine usage. Binding floor **(INVARIANT once built): k ≥ 5** - no real-data aggregate visible to anyone other than the data's own person may describe a cohort or cell of fewer than five people. Applies to the Outcome Engine, to Hive, to exports, and to the one-real-counts-row the moment a second person's data exists or a coach can see it (a count of a two-person cohort identifies by subtraction). Case-count and duration thresholds for the first real screen are set by Daniel at adoption (order of 10+ completed cases with outcome events, months of history) - open question 1. A single-pilot dataset will likely never clear k ≥ 5 for coach-visible analytics; the review's 2b owns that boundary.

## 5. Deployment - the padlock rule (Daniel 2026-07-11)

- **Daniel's personal deployed instance: real data, behind a lock.** HTTPS plus an access lock (basic auth or equivalent) plus the 2c basics implemented (encrypted disk or equivalent, server access control, backups). Rationale in one line: the store holds the application pipeline, the practice sessions and the inference data - the parts whose exposure costs negotiating leverage in the exact game this tool serves - not just the CV, which is built to circulate.
- **Unattended demo URLs handed to others: synthetic-only** - the Daniel-shaped twin carries the story.
- **Demos Daniel runs from his own screen: real data, as always.**
- Any environment holding non-demo data: tested controls first (2c), no exceptions for "it is only local".

## 6. The pilot, smallest honest version

What HelloLilly sees first: the strategy paper's own demo order, with the honesty architecture told as the differentiator. The pilot: one real coach (Path A), a handful of consenting jobseekers (Path B cleared), T1 tools only - demo-tier tools are outside the promise AND role-inaccessible to pilot accounts. **Evidence design, locked before the first case:** a quantified pre-pilot baseline of coach time allocation (unreconstructable later - captured first); outcomes recorded in the provider's own verified terms (work or study begun within the payment-relevant window, sustained per the 3- and 6-month checkpoints), as dated facts, never caused-by claims. The commercial question (results-based funding, who pays, IP of the knowledge base) stays named and deliberately unanswered - a negotiation, not a plan.

## 7. Omställning rejoins

Own track, own namespace, rejoin at Path B: its tools are inference-heavy and enter the registry and review scope the moment they leave demo tier. The OMST numbering reconciliation rides with the rejoin.

## 8. What this plan refuses

- No non-demo use before the review is done (zero blocking conditions) and the ledger is empty - with §1's definitions of non-demo, "applied", and real-derived closing the side doors.
- No legal conclusions asserted by this plan or inside the product; "compliant by design" is banned from all surfaces and documents until the review exists to back it.
- No inference output ever feeds an eligibility, sanction, rationing or other consequential decision about a person.
- No person-data in model training, ever.
- No real-derived data relabeled synthetic.
- No coach-visible analytics below k ≥ 5, ever.
- **Stop conditions (fail-closed):** a data incident, a rights-request failure, a harmful unsupported output reaching a real person, or any gate-invalidating change pauses all non-demo use; restart requires a recorded approval.
- No accidental pilot: "just try it on your CV" at a demo is a gate violation, not hospitality.

## 9. Open questions (carried, not hidden)

1. The §4 threshold numbers - Daniel sets at adoption.
2. The named professional and the budget - required before §2 goes in-progress; who and when is Daniel's call.
3. Path A identity scope - minimal single-coach role versus the full roles model; decided at build time.
4. The registry CI lint - D12's open question, shared consumer.
