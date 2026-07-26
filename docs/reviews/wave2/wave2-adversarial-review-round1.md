# Wave 2 - Adversarial review, round 1 (of brief v2)

**Verdict: NOT FIT TO BUILD - 2 BLOCKER, 4 HIGH, 5 MEDIUM.**
**Record status:** verbatim reviewer output - the round-1 adversarial review as
delivered, committed as the review record. Markdown link targets flattened to
plain repo-relative paths; text otherwise unchanged.
**Delivered:** 2026-07-24. (The v3.2 brief refers to round 1 as 2026-07-21; the
discrepancy is noted, not resolved, here.)
**Reviewed:** WAVE_2_BRIEF_suggestion-engine_v2.md, against `main` @ `92e5373`
and the binding canon.

---

**Verdict: NOT FIT TO BUILD** - two blockers sit exactly on the load-bearing
joint this wave stands on (the promotion position and the gate that licenses
it). Both are resolvable at the brief level; nothing requires build-time
discovery. With the two blockers and the tier-relabeling (HIGH-1) resolved,
this is fit.

The v2 fact base held up - nothing below re-litigates what the fact report
corrected. All findings verified against `main` @ `92e5373` and the binding
canon; two are backed by measurements run for this review.

---

## BLOCKER 1 - The promotion position converts attackable text into permanently-trusted *prompt* material, and contradicts Rule 2 as written

The brief treats segregation as one thing. In the code it is two: **section
eligibility** (highlights-only) and **prompt provenance** (enveloped as
untrusted-derived). Promotion to "ordinary pool fact" loosens both - and the
second one is the laundering path.

Trusted pool facts enter the model prompt **unenveloped, inside the trusted
instruction block** (`server/submodules/cv-tailor/execute.cjs:347-364` -
`poolText(pool)` is concatenated into `task`), and three submodules mine the
pool (`server/submodules/writer/execute.cjs:82`,
`server/submodules/cv-builder/execute.cjs:14`). Concrete case: an uploaded
cover letter contains an instruction-shaped or steering sentence. The drafter
proposes it near-verbatim - it is *span-grounded*, so Discipline 1 finds no
claims added. A tired human accepts. That text now enters **every future tailor
and letter prompt as trusted instruction-adjacent content, un-enveloped,
un-neutralised, forever**. One click converts the most attackable input the
product accepts into permanent trusted prompt material. This is precisely the
conversion `docs/HELLOLILLY_ARCH_RULES.md` Rule 2 forbids: *"untrusted-derived
provenance, **permanently**. Provenance survives storage, retrieval,
summarization and reuse."* A planner position cannot amend standing law.

**Resolution.** Decouple the two meanings. (a) *Section eligibility* may loosen
on a real gate - the product goal (minted facts selectable for job sections)
survives intact. (b) *Prompt provenance never converts*: minted facts carry
machine provenance (e.g. `person-approved-derived`) and always enter prompts
enveloped - the `derivedHighlights` pattern already does exactly this, so the
cost is extending an existing mechanism, not inventing one. (c) If any taint
conversion is still claimed, it requires an explicit Daniel-ratified amendment
to D12/Rule 2, recorded in DECISIONS_ADDENDUM.

## BLOCKER 2 - The gate reviews wording; selectability is determined by attribution metadata nobody reviews

To be an "ordinary typed fact" a mint must carry a `type` plus a job tag (and
`category` for competencies): `jobOfFact`
(`server/submodules/cv-tailor/execute.cjs:71-76`) routes by `matchTags`
(`'Coinhero'`, `'ComeOn'`...), and the strict pre-write gate validates
membership **against the fact's own tag**
(`server/submodules/cv-tailor/execute.cjs:267-270`) - a wrong tag is
self-consistent and passes every deterministic check in the system. The model
assigns this metadata; 3.4's acceptance record covers source document, span,
draft, wording, who, when - **not placement**.

Concrete case: a span from a cover letter says "built a VIP retention programme
from scratch" (no employer named - cover letters rarely name one per sentence).
The drafter emits `type: job_result, tags: ['job-result','Coinhero']`. The
person reviews the wording against the span - both true - and accepts. The
bullet renders under "CEO / Founder - Coinhero.io, 2023-2024" when the work
happened at ComeOn. A true sentence becomes a **fabricated claim by placement**
(Rule 4 zero-tolerance class), through the approved path, invisible to
Invariants 1-4 as specified.

**Resolution.** Attribution is part of the reviewed object: the review UI
states in plain words where the fact will live ("this will appear under
**Coinhero, 2023-2024**"), the acceptance event records the reviewed
attribution (type/tags/category), and a span whose document does not itself
evidence the employer forces an explicit person-chosen placement recorded as
person-attested. Misattribution temptations join the gate-2 eval corpus.

---

## HIGH 1 - Invariants 2 and 3 claim an enforcement tier they cannot hold - which is itself a canon violation

ARCH_RULES Section 0 is unambiguous: an INVARIANT is *"deterministic... binary,
auditable, no interpretation"*, and *"describing a DISCIPLINE as an INVARIANT
is itself a violation."* Detecting a "negating, hypothetical, or third-party
heading" and detecting "a claim derived by combining" are semantic judge calls.
INV2 even promises *"refused at draft time"* - a runtime semantic guarantee
ARCH_RULES explicitly refuses to let anyone claim.

Traps the named list misses: **Q&A inversion** - a span lifted from the
interviewer's *question* line ("Do you have SAP experience?"), and Q&A is a
named primary upload type in 3.3; **in-sentence negation under a neutral
heading** ("While I have never led hands-on delivery, I..." - heading context
is clean); **ad-mirroring without quotes** ("You need someone with deep SAP
experience. I am that person because..."); **a third-party CV or template
uploaded whole** - every heading is a perfectly normal experience heading, so
structural context is *useless* against the worst case; **aspirational text**
("In this role I would build...", a "Goals:" section).

**Resolution.** Split each tier honestly. Deterministic core, enforceable now:
span schema *requires* heading + section + location (schema-validated before
write, Rule 2 output-side); a **required document-type/ownership attestation at
intake** (person picks: my cover letter / my old CV / Q&A / a job ad / someone
else's material - then job-ad-typed and third-party-typed documents are
deterministically barred as experience sources, which is the only real defence
against the third-party-CV case); INV3's enforceable core: **any numeral, date,
or duration token in minted wording must appear in a cited span** - a
deterministic token check. Everything semantic (negation, voice, ownership
inside first-party docs, aggregation phrasing) becomes DISCIPLINE with
zero-tolerance eval classes covering the traps above.

## HIGH 2 - Invariant 1 names no enforcement point, and three consumers mine the pool directly

`cv-tailor` (`server/submodules/cv-tailor/execute.cjs:341`), `writer` and
`cv-builder` all call `tools.datalayer.listDatafacts()` directly. If quarantine
is enforced inside the suggestion engine, unclassified facts keep flowing into
cover letters - and the letter writer is *still on the retrofit ledger*
(ARCH_RULES Section 5), so it is the least-defended consumer. The CV-byggaren
blocker's whole lesson was: fix at the accessor root, not per-caller.

**Resolution.** Enforce in the one `datalayer` capability
(`server/skeleton/capabilities.cjs`): default reads exclude non-verified facts;
the suggestion engine reads raw through an explicit host-level accessor;
integration test = no submodule can observe a quarantined fact. Also fix INV1's
literal wording: as drafted, a curated-origin fact (which has no acceptance
event) reads UNVERIFIED - state the disjunction: *verified iff curated-origin
OR recorded acceptance*.

## HIGH 3 - The human-gate integrity test cannot license what 3.4 hangs on it

The stated test proves the *data path* demands an acceptance record. It cannot
prove a **human** produced one. There is no auth anywhere (D13 explicitly
defers identity); "no bulk accept" is a UI property, while every API route is
an open local HTTP surface - a ten-line script POSTing accepts in a loop
satisfies the test perfectly, and "who" is a constant string. Ordinarily
tolerable in a single-user local app; not when this test is named as *the thing
that justifies the promotion position*.

**Resolution.** Server-side realness: an acceptance must present a single-use
nonce minted when that specific proposal+span was *rendered* (binding accept to
a served review), plus a server-side batch/rate ceiling; record session/device
on the event. The brief states plainly that "who" is attested-not-authenticated
until the D13 identity trigger fires, and Daniel ratifies that residual. Add an
eval case: document text attempting to induce automatic acceptance.

## HIGH 4 - Edit-then-accept is an unbounded authoring channel that quietly crosses the wave's own scope line

"The person's wording mints" - and nothing re-checks the final wording. The
person can type a number, a scope, a seniority claim no span supports; the
minted fact then records "AI-drafted, grounded in span X, accepted" while the
wording is none of those - **the provenance record is internally false**. And
since Discipline 1 runs at proposal time and "informs, does not block," the
wave's scope boundary ("the source says it") has *no enforcement at the mint*:
an accepted flagged-addition is bridging - next wave's territory, owed the
HIGH-RISK tagging and export-warning machinery - shipped early through this
wave's gate.

**Resolution.** Re-run the claim check on the final wording; persist its
verdict and the claims-delta on the minted fact (accepted-with-additions is
visible provenance, never a silent pass). The brief explicitly decides - Daniel
ratifies - whether flagged additions may mint this wave; the honest
classification for person-typed additions is *person-authored* (their own
writing, cv_data-class), not *span-grounded*, and the fact should say which it
is.

---

## MEDIUM 1 - The backfill's ground truth has drifted from its pin (measured)

Two measurements from this review: (a) replaying the committed mapper
(`cvDataToDatafacts`) on today's `cv_data.json` reproduces the live 133 texts
**exactly - zero mismatches in both directions**, so classification is clean
*if* specified as mapper-replay (many fact texts are composed strings - "role
at company (years)", "label: description" - raw-file substring matching is the
wrong instrument). (b) Today's `cv_data.json` (37,707 B, sha `6741dd76...`,
identical in both clones) **no longer matches the manifest pin**
`corpus.cv_data` (33,179 B, sha `005cb54d...`) from the Phase-0 freeze. The
attested ground truth and the actual ground truth have diverged; the drift
happens not to affect mapper output today, but the backfill would stamp
"curated-origin" against an unattested file.

**Resolution.** Specify the backfill as replay-of-`cvDataToDatafacts` against a
`cv_data.json` Daniel re-attests; record its new sha and the explained drift in
the manifest amendment; run under the ingest-coinhero discipline (backup,
additive-only with byte-identity check on untouched fields, id-stability, new
`pool_sha256`).

## MEDIUM 2 - The 11 legacy facts cannot be "reviewed" into promotion by INV4's own standard

Their source - the raw answer - was discarded; there is no span to show
alongside. 3.2's "offered for explicit review" is a review of bare text against
nothing: exactly the theatre INV4 forbids. **Resolution:** permanent
segregation, or the person re-attests the statement as a *new person-authored
fact* (fresh mint, person-authored provenance, old fact retired via
`removeDatafact`) - recreation, not promotion.

## MEDIUM 3 - 3.0's retained answers re-enter the named trap through the side door

Gap answers habitually echo the decoded requirement they answer ("I don't have
SAP, but..."). If retained answers become person-attributed source material
*outside* the span/attestation/context pipeline, employer-voice and negation
text arrives pre-trusted. **Resolution:** retained answers are a document class
(auto-attested "gap answer", carrying its gap/requirement as structural
context) through the same spanization; first-party origin makes them curated as
*source*, not exempt from context handling.

## MEDIUM 4 - Deletion semantics and the collection surface are half-specified

Every candidate span *snapshots* source text - so after "document deleted", the
spans collection still holds the document in pieces; deletion as specified is
cosmetic. And the brief constrains the open **POST**, but
`DELETE /api/collection/:name/:id` (`server/dev-server.cjs:137-143`) equally
lets any client delete document/span records directly, bypassing the "source
marked removed" semantics. **Resolution:** specify span lifecycle - document
delete purges unminted spans; a minted fact's snapshot lives *on the fact*, not
in the spans collection - and constrain all three verbs for the new
collections. Two adjacent gaps to name in the same section: whole PDFs/DOCX as
JSON rows in a boot-hydrated in-memory store class has a real memory/boot
ceiling, and the document *parser* is a new dependency and attack surface in a
deliberately dependency-light repo - name it, and give parse failure its
Section-0 disposition (failed envelope, never a silent empty span set).

## MEDIUM 5 - New judges have no Rule 3 contracts; the owed affordance's second face is unstated

Discipline 1's claim-check judge (and any context judge) is a checker: Rule 3
requires a written input contract, maker/checker separation, and the judged
artifact *enveloped inside the checker's prompt* (the artifact clause) - the
brief is silent, and per Section 0 the enforcement-tier marking must live in
the tool's design entry. Separately, the P4 disposition's graceful-failure
affordance was born from **generation-time under-selection**; 4A covers only
the pre-draft thinness message. State that the generation-time UX is in scope
(or explicitly still owed) so the owed outcome isn't half-closed.

**Resolution:** one paragraph naming each judge, its input contract and tier
marking (ARCH_RULES Section 0: "the marking lives in the tool's design entry"),
plus the generation-time face in section 4.

---

**Verdict: NOT FIT TO BUILD** in current form. What flips it: resolve BLOCKER 1
(decouple section-eligibility from prompt-provenance; canon amendment if any
taint conversion is claimed) and BLOCKER 2 (attribution inside the reviewed and
recorded object), relabel INV2/INV3 to honest tiers with their deterministic
cores extracted (HIGH 1), and fold HIGH 2-4 into the spec. The wave's core idea
- human acceptance minting selectable material - survives every finding above;
what does not survive is treating acceptance as a universal solvent that
converts provenance, placement, and scope all at once.
