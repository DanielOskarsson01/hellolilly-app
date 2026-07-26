# HelloLilly - Suggestion Engine Brief v3 (drafting and minting)

Status: v3.2 - round 2 returned FIT TO BUILD (both BLOCKERs resolved, no new
blocker). The four items left STILL OPEN at round 2 (HIGH 2, HIGH 4, MEDIUM
4, MEDIUM 5) are fixed here rather than carried into build. v2 was corrected
against the adversarial review of 2026-07-21
(NOT FIT: 2 BLOCKER, 4 HIGH, 5 MEDIUM). All findings accepted; dispositions
below. Both ratification points ANSWERED by Daniel 2026-07-21 and folded in
(see 3.7 and 5.4) - RATIFY-1 resolved more strongly than the planner
proposed: person-attested material is a FIRST-CLASS source of record, not a
lesser class.

Canon: HELLOLILLY_NORTH_STAR.md, HELLOLILLY_ARCH_RULES.md (D12, Section 0
tier definitions, Rule 2 taint, Rule 3 judge contracts, Rule 4 zero-tolerance
classes), DECISIONS_ADDENDUM.md (D13-D21), docs/reviews/wave1/.

## Dispositions (review findings -> where resolved)

| Finding | Resolution | Section |
|---|---|---|
| BLOCKER 1 - promotion converts taint | Decoupled: eligibility loosens, provenance never converts | 3.5 |
| BLOCKER 2 - attribution unreviewed | Attribution is part of the reviewed object | 3.6 |
| HIGH 1 - false tier labels | Tiers split honestly; deterministic cores extracted | 5 |
| HIGH 2 - no enforcement point | Datalayer root; INV5 scoped to non-curated facts (round 2 fix) | 5, INV5 |
| HIGH 3 - gate realness untestable | Nonce binding, rate ceiling, attested-not-authenticated (ratified) | 5.4 |
| HIGH 4 - edit is unbounded authoring | Person-attested requires person authorship - deterministic diff (round 2 fix) | 3.7 |
| MEDIUM 1 - backfill ground truth drift | Mapper-replay, cv_data re-attested, drift recorded | 3.2 |
| MEDIUM 2 - 11 legacy facts | Recreation, never promotion | 3.3 |
| MEDIUM 3 - retained answers side door | Gap answers are a document class in the same pipeline | 3.1 |
| MEDIUM 4 - deletion and surface | Span lifecycle, all three verbs; parser and ceilings specified (round 2 fix) | 3.4 |
| MEDIUM 5 - judge contracts, second face | Both judge contracts WRITTEN here (round 2 fix); generation-time UX in scope | 5.5, 4 |

---

## 1. What this wave is

The tailor selects from a drawer. This wave fills the drawer.

The AI drafts bullet-shaped facts from the person's own material; the person
reviews, moulds, and accepts; acceptance MINTS a datafact the tailor can
select. This is the first wave in which AI-shaped text can reach a CV through
an approved path.

The review's summary of what survives and what does not, adopted verbatim as
this brief's governing sentence: human acceptance mints selectable material;
acceptance is NOT a universal solvent that converts provenance, placement,
and scope all at once.

## 2. Why it matters, corrected

The system does not retain the person's own writing: raw gap answers are
discarded, no human-written letters are saved, interview material is a static
mock. Upload is therefore the SPINE of this wave. What the repo does hold:
AI-generated letters, gap bridges, dossiers and decodedRole, 35 job ads, the
183-fact pool, the activity log.

## 3. The work

### 3.1 Stop the discard (do first)
The gap-fill loop discards the person's typed answer and keeps only the
model's bullet. Retain the raw answer.
CORRECTION (MEDIUM 3): retained answers do NOT become pre-trusted source
material. Gap answers habitually echo the requirement they answer ("I don't
have SAP, but..."), so employer-voice and negation would arrive trusted. A
retained answer is a DOCUMENT CLASS - auto-attested "gap answer", carrying
its gap and requirement as structural context - and goes through the same
spanisation, attestation, and context handling as an upload. First-party
origin makes it curated as a SOURCE; it is not exempt from context handling.

### 3.2 Provenance backfill (unblocks the default flip)
Today no status field exists; missing provenance defaults to TRUSTED; the
code comment claiming provenance is stamped at mint is FALSE.

Work, id-stable and additive (Route B / ingest-coinhero discipline: backup,
byte-identity check on untouched fields, id-stability, new pool_sha256):
- 39 Coinhero facts: formalise the existing explicit source.
- 133 ingest facts: classify by REPLAY OF THE COMMITTED MAPPER
  (cvDataToDatafacts), NOT raw-file substring matching - many fact texts are
  composed strings, so substring matching is the wrong instrument. Measured:
  mapper-replay reproduces all 133 live texts exactly, both directions.
- Anything the replay does not reproduce is quarantined as unclassified.
- 11 fill-gap facts: see 3.3.
GROUND-TRUTH DRIFT (MEDIUM 1): today's cv_data.json no longer matches the
Phase 0 manifest pin (different size and sha). The backfill runs against a
cv_data.json Daniel RE-ATTESTS; the new sha and the explained drift are
recorded in the manifest amendment. Stamping curated-origin against an
unattested file is forbidden.
Fix the false comment. Only after this backfill does default-unverified
become safe.

### 3.3 The 11 legacy AI-authored facts - recreation, never promotion
Minted by a model judge with no wording review and no acceptance event, and
present inside Wave 1's frozen parity pool. Their source answer was
DISCARDED, so there is no span to show alongside - "offering them for review"
would be review of bare text against nothing, which is exactly the theatre
Invariant 4 forbids (MEDIUM 2).
Disposition: permanent segregation, OR the person re-attests the statement as
a NEW person-authored fact (fresh mint, person-authored provenance, the old
fact retired). Recreation, not promotion.

### 3.4 Document intake
The person uploads documents; they are stored centrally, parsed into
candidate spans carrying source document, location, and structural context.

INTAKE ATTESTATION (new, and load-bearing - see 5): at upload the person
declares the document type and ownership from a fixed set: my cover letter /
my old CV / my Q&A or interview notes / a job ad / someone else's material /
other. This is a deterministic gate: job-ad-typed and third-party-typed
documents are BARRED as experience sources. It is the only real defence
against an uploaded third-party CV, whose every heading looks like a normal
experience heading and against which structural context is useless.

Surface and lifecycle (MEDIUM 4):
- New collections need no schema migration, but the generic
  /api/collection/:name routes are open - POST, GET and DELETE must ALL be
  constrained for documents and spans, not left on the generic path.
- Span lifecycle: deleting a document purges its UNMINTED spans; a minted
  fact's snapshot lives ON THE FACT, not in the spans collection - so
  deletion is real, not cosmetic.
- The document parser (PDF/DOCX) is a NEW DEPENDENCY and a new attack surface
  in a deliberately dependency-light repo (no parser exists in package.json
  today). Required before the first parsing commit: the chosen library named
  in the build plan with its justification, its transitive dependency count
  reported, and parse failure given its Section 0 disposition - an explicit
  failed envelope, never a silent empty span set. Plain text and pasted text
  need no parser and are the acceptable first increment if the dependency
  question is unresolved.
- STORAGE SHAPE AND CEILINGS, stated: the store is boot-hydrated in memory,
  so whole documents as JSON rows have a real memory and boot cost. Documents
  are capped per file (a stated maximum, default 5 MB) and the extracted
  TEXT is what is stored - not the original binary. Spans reference their
  document by id and carry only their own snapshot. If the original file must
  be retained, it is retained OUTSIDE the hydrated store as a file on disk,
  referenced by path, never as a row.

### 3.5 Minting: what acceptance does and does not convert (BLOCKER 1)
Two things were conflated in v2. They are now separate:
- SECTION ELIGIBILITY may loosen on a real gate. A minted fact IS eligible
  for job sections, not highlights-only. The product goal survives.
- PROMPT PROVENANCE NEVER CONVERTS. Minted facts carry machine provenance
  (person-approved-derived) and ALWAYS enter prompts ENVELOPED, never in the
  trusted instruction block. D12 Rule 2 is standing law: taint survives
  storage, retrieval, summarisation and reuse. A brief cannot amend it.
The derivedHighlights pattern already envelopes derived facts, so this
extends an existing mechanism rather than inventing one.
No taint conversion is claimed anywhere in this wave. If a future wave wants
one, it needs an explicit Daniel-ratified amendment to D12 recorded in
DECISIONS_ADDENDUM - not a planner position.

### 3.6 Attribution is part of the reviewed object (BLOCKER 2)
Selectability is decided by type plus job tag plus category - metadata the
MODEL assigns. A wrong tag is self-consistent and passes every deterministic
check, so a true sentence becomes a fabricated claim by placement (Rule 4
zero-tolerance class) through the approved path.
Required:
- The review UI states the placement in plain words: "this will appear under
  Coinhero, CEO / Founder, 2023-2024".
- The acceptance event records the REVIEWED ATTRIBUTION (type, tags,
  category), not only the wording.
- Where the source document does not itself evidence the employer, placement
  is not model-assigned: the person chooses it explicitly and it is recorded
  as person-attested.
- Misattribution temptations join the zero-tolerance eval corpus.

### 3.7 Person-attested material is a first-class source (HIGH 4, RATIFIED)

DANIEL'S RATIFICATION, 2026-07-21, binding: "As I have worked for 30 years,
there is no way I can or should have all the details and numbers in all
documents. If I write something specifically, you should save it as the
truth. It is new material that is the single source of truth, because I said
so. It is not lying - it is me adding material that might be outside the
normal usage in bullet points, but might be perfect for some jobs. It should
be saved."

Consequences, binding on the design:
- A thing the person types IS a first-class source of record - the SAME trust
  class as their curated source files, not a lesser one. A line typed in the
  review box and a line in cv_data.json are both the person asserting a fact
  about their own career; nothing makes the file version more trustworthy.
- It mints WITHOUT FRICTION. No blocking, no confirmation friction, no "are
  you sure". Refusing would be the tool auditing the person, contrary to D14
  advocate-not-audit.
- PERSON-TYPED ENTRY IS A FIRST-CLASS PATH, not a grudging edit affordance.
  For a long career the biggest pool gap is experience that was never written
  into any document - so the review surface must actively invite the person
  to add from memory ("do you have an example of hands-on delivery? type it
  and it is yours forever"), and treat that as a primary way the drawer gets
  filled, likely the highest-value one for the Wave 1 Wrknest gap.
- What is still required is RECORD TRUTH, not restriction: the provenance
  must state accurately what the fact is - span-grounded (drawn from a cited
  document span) or PERSON-ATTESTED (asserted directly by the person, dated).
  A fact recorded as span-grounded when the number came from the person's
  memory is a false record, and that is the only defect this section exists
  to prevent.
- The claim check still RE-RUNS on the final wording, and its output is
  CLASSIFICATION: span-grounded or person-attested.

THE AUTHORSHIP DISCRIMINATOR (round 2, HIGH 4 - closes the one hole in the
ratified policy). v3.1 did not distinguish the person TYPING something from
the person CLICKING ACCEPT on something the model invented. Both would have
recorded as person-attested, which would let an AI invention mint wearing the
person's name - the bridging path this wave defers, arriving early. The
deterministic rule:
- The MODEL's draft must always be span-grounded. An unsupported claim
  originating in the model's own wording is a DEFECTIVE PROPOSAL: it is
  flagged, and it cannot mint on a bare accept. The person either edits it -
  which makes the wording theirs - or rejects it.
- Unsupported content that appears ONLY in the person's final wording, and
  not in the model's draft, is PERSON-ATTESTED and mints freely, exactly per
  Daniel's ratification.
- The discriminator is a deterministic diff: does the unsupported token
  appear in the model's draft, or only after the person's keystrokes?
This preserves the ratification completely - what the person types is truth,
without friction - while closing the hole: the model cannot hide an invention
behind the person's click. It also makes the wave's scope boundary MECHANICAL
rather than asserted: AI stays span-grounded, the person may add anything,
and the record always states which. Consistent with the north star: acceptance
is authorisation, not evidence.
- One residual, named once and accepted rather than argued: nothing catches a
  hurried typo or a misremembered figure - by design, because the alternative
  is a tool that interrogates its owner. The mitigations are that every
  person-attested fact is traceable and editable later, and that downstream
  interview preparation can see which claims have no document behind them, so
  the person is ready to speak to them (D14 end-to-end honesty).
- Bridging remains next wave: that is the AI stretching a claim beyond
  support, which is a different act from the person asserting their own
  experience.

## 4. Targeting: the graceful-failure affordance (owed outcome, binds)

A. AD-DRIVEN, PRE-DRAFT: compare the decoder's weighted requirements against
   what the pool can support; where thin for a top-weighted requirement, say
   so plainly and offer to draft from the person's own material.
B. GENERATION-TIME (MEDIUM 5): the Wave 1 disposition's affordance was born
   from under-selection AT GENERATION. That face is IN SCOPE: when a
   generated CV is thin because the pool could not support the ad, the
   product says so rather than silently handing over a weak CV. Closing only
   the pre-draft face would half-close the owed outcome.
C. STANDING: suggestions without an ad.
Build facts: the pool-vs-requirement comparison does not exist (new work);
the decodedSignal serialiser sits inside cv-tailor where the submodule
require-guard blocks import, so it must be HOISTED into the skeleton, not
duplicated; requirement weight can be null - handle it explicitly.

## 5. The enforcement tiers, honestly labelled (HIGH 1)

Section 0 is binding: an INVARIANT is deterministic, binary, auditable, no
interpretation - and describing a DISCIPLINE as an INVARIANT is itself a
violation. v2 broke that. The deterministic cores are extracted below;
everything semantic is a DISCIPLINE with zero-tolerance eval classes.

### INVARIANT 1 - Verified status, enforced at the accessor root (HIGH 2)
A fact is VERIFIED if and only if it is curated-origin (stamped by the 3.2
backfill) OR it carries a recorded acceptance event. Everything else,
including missing or unknown provenance, is UNVERIFIED and cannot enter
generation or a CV.
ENFORCEMENT POINT: the single datalayer capability. Default reads exclude
non-verified facts, so cv-tailor, writer and cv-builder all inherit it - the
letter writer is on the retrofit ledger and is the least-defended consumer,
which is exactly why per-caller enforcement fails. The suggestion engine
reads raw only through an explicit host-level accessor. Test: no submodule
can observe a quarantined fact.

### INVARIANT 2 - Span schema completeness
Every span carries heading, section, and location. Schema-validated before
write (Rule 2 output side). Deterministic.

### INVARIANT 3 - Attested source class barring
Documents attested as job ad or third-party material are barred as experience
sources at draft time. Deterministic on the attestation, not on semantics.

### INVARIANT 4 - Record truth (numeral and date grounding)
Deterministic check: every numeral, date, and duration token in the minted
wording either appears in a cited span, or it appears only in the person's
own final wording - in which case the fact is recorded as PERSON-ATTESTED
(3.7). A token unsupported by any span AND present in the model's draft
fails: that is a defective proposal, not a person-attested fact (the
authorship discriminator, 3.7). The invariant enforces that the provenance
record is TRUE about the fact's origin; it never restricts what the person
may write. This is the enforceable core of what v2 wrongly called "no
aggregation".

### INVARIANT 5 - The recorded gate (scoped, round 2 HIGH 2 fix)
SCOPE: newly minted and non-curated facts. For those, no path exists by which
a fact reaches verified without a recorded acceptance event carrying reviewed
wording AND reviewed attribution. Curated-origin facts stamped by the 3.2
backfill are verified by origin and are outside this invariant's scope - the
v3.1 wording contradicted Invariant 1's disjunction by demanding an
acceptance event they cannot have. Deterministic, and it is what licenses
section-eligibility loosening in 3.5.

### DISCIPLINE 1 - Semantic claim check (maker/checker, Rule 3)
Checks for claims added beyond cited spans - entities, numbers, seniority,
scope, duration, outcomes. Semantic, judged, informs rather than silently
blocks. A literal token matcher would flag ordinary grammar as invention and
train the person to rubber-stamp, destroying the gate the design rests on.

### DISCIPLINE 2 - Voice, ownership and negation detection
Detects text that is not the person's own experience claim. Zero-tolerance
eval classes must cover every trap the review named, none of which structural
context alone defeats:
- a span lifted from the INTERVIEWER's question in Q&A material ("Do you have
  SAP experience?") - and Q&A is a primary upload type
- in-sentence negation under a clean heading ("While I have never led
  hands-on delivery, I...")
- ad-mirroring without quotation ("You need deep SAP experience. I am that
  person because...")
- aspirational and future-tense text ("In this role I would build...", a
  "Goals" section)
- a third-party CV or template uploaded whole, where every heading is normal
  (defended deterministically by INVARIANT 3, not by this discipline)

### DISCIPLINE 3 - Aggregation phrasing
No temporal, quantitative, or seniority claim derived by combining separate
sources. Judged; its deterministic core is INVARIANT 4.

### 5.4 Gate realness (HIGH 3)
The integrity test proves the data path demands an acceptance record; it
cannot prove a human produced one. There is no auth (D13 defers identity),
every route is an open local surface, and "no bulk accept" is a UI property a
loop can bypass.
Required: an acceptance must present a single-use nonce minted when that
specific proposal and span were RENDERED, binding accept to a served review;
a server-side batch and rate ceiling; session and device recorded on the
event. An eval case covers document text attempting to induce automatic
acceptance.
RATIFIED by Daniel 2026-07-21: "who accepted" is ATTESTED, NOT
AUTHENTICATED until the D13 identity trigger fires. Accepted as a stated
residual for the single-user local product, with the nonce binding and rate
ceiling above, and re-opened the moment a second person or a hosted surface
exists. Recorded in the brief and to be carried into the wave ledger.

### 5.5 Judge contracts, written (Rule 3 - round 2 MEDIUM 5 fix)
Rule 3 requires the contract written where the judge is specified, so both
are written here rather than deferred.

JUDGE A - claim-addition checker (serves DISCIPLINE 1).
- Inputs, exhaustive: the cited span text(s), the candidate wording, and the
  model's original draft. Nothing else - no pool, no ad, no case record.
- Output: a list of claims present in the candidate wording but unsupported
  by the cited spans, each typed (entity, number, seniority, scope, duration,
  outcome), plus for each whether it originates in the model's draft or only
  in the person's wording (the 3.7 discriminator). An empty list means
  span-grounded.
- Maker/checker separation: the checker invocation is separate from the
  drafter's; the judged artifact is ENVELOPED as untrusted-derived inside the
  checker's prompt.
- Tier: DISCIPLINE. Its output classifies and flags; it never silently
  blocks a person-authored mint.
- Regression: zero-tolerance eval cases carrying known additions of each
  type, three runs each.

JUDGE B - voice, ownership and negation checker (serves DISCIPLINE 2).
- Inputs, exhaustive: the span text, its structural context (heading,
  section, position), and the document's attested class. Nothing else.
- Output: whether the span is a first-person experience claim by the
  document's owner, and where it is not, the detected class (interviewer
  question, in-sentence negation, ad-mirroring, aspirational or future
  tense, third-party material).
- Maker/checker separation and envelope: as Judge A.
- Tier: DISCIPLINE. A negative verdict bars the span as an experience source
  at draft time.
- Regression: the five named traps in DISCIPLINE 2, three runs each.

Each tool's design entry carries its enforcement-tier marking, per Section 0.

### D12 on the new ingestion class
Uploaded documents are a new untrusted ingestion class. Rule 2 in full:
envelope with provenance, transitive taint on everything derived, assembly
inside the ONE named module (which generalises - it needs a document class
added to its provenance enum, inside that module, not a second assembly
point), schema validation before write, adversarial eval cases including
prompt injection inside an uploaded document.

## 6. Out of scope

- Bridging beyond source support and its HIGH-RISK tagging and export-warning
  machinery - NEXT wave (TRIGGER CLAUSE). Note the boundary is enforced at
  the mint by 3.7, not merely asserted here.
- Rendering, CV-byggaren (D15), hosted multi-user storage, any change to the
  Wave 1 tailor's selection mechanism.

## 7. Central storage is a NEW DATA CATEGORY (D13 trigger)

Governance review scope widens BEFORE any hosted multi-user version. This
wave: local store class only, outside the repo, gitignored. Hosted storage,
per-user isolation, retention, deletion policy and GDPR posture are OWED.

## 8. Gates before merge

1. Backfill run and reported: mapper-replay classification, re-attested
   cv_data with recorded drift, unmatched facts quarantined, id-stability
   proven, manifest amended.
2. Zero-tolerance eval corpus: injection inside an uploaded document;
   interviewer-question spans; in-sentence negation; ad-mirroring;
   aspirational text; third-party document barring; misattribution
   temptations; numeral grounding; induced-auto-acceptance. Three runs each
   (D12).
3. Invariant 5 test (the recorded gate) - the test that licenses 3.5.
4. Accessor-root test: no submodule can observe a quarantined fact.
5. Scripted real-data walkthrough by Daniel: upload real cover letters and
   Q&A, run the ad-driven target against the Wrknest ad, judge whether
   proposals are true, in his voice, correctly placed, and worth accepting.
6. Independent adversarial review of this brief before build, of the diff
   before merge (D19).
7. The CV-byggaren review records this brief leans on must be COMMITTED to
   docs/reviews/ before build, or the citations are unverifiable canon.

## 9. The re-test this wave earns

After merge and after a meaningful set of accepted operative bullets, re-run
the Wave 1 Wrknest P4 comparison against the enriched pool. Does the tailor
now beat the reference on the ad it was pool-limited on? That closes the
Wave 1 owed outcome honestly.

## 10. Process

One branch, one owner, ONE WRITER. Fact-check done and folded (2026-07-21);
adversarial round 1 done and folded (2026-07-21); both ratifications received
and folded (2026-07-21); round 2 returned FIT TO BUILD with four non-blocking
items, all four fixed in this version (2026-07-21). Next: commit this brief
and the review records as canon, then build.
