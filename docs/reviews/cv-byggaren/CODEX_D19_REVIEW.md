# D19 adversarial review — CV-byggaren build brief

**Reviewer:** Codex  
**Date:** 2026-07-20  
**Reviewed:** `D19_CV_BYGGAREN_REVIEW_PACKAGE.md`, `CV_BYGGAREN_BUILD_BRIEF.md`, and the complete HTML/CSS/JS source of `cv-byggaren-wireframe-v2.html`. Read-only checks against `/Users/danieloskarsson/dev/hellolilly-app` are cited only where the package explicitly asks for sequencing and live-data-model attacks.

## Finding 1 — Axis 1/2: Token traceability accepts false claims made by deletion and rebinding

**Severity: BLOCKER**

**The concrete case:** The bullet contract checks whether every output word or number appeared in the inputs. Give it:

- `Vad gjorde du?` — “Jag hjälpte teamledaren med ett team på sex personer, men jag ledde inte teamet.”

- Output — “Jag ledde ett team med sex personer.”

Every output token occurs in the answer. The generator only deleted `hjälpte`, `teamledaren`, `men`, and `inte`, turning an explicit denial into a leadership claim. Quantities can be rebound the same way: `Jag ledde 6 personer` plus `Jag arbetade 4 år` can become `Jag ledde 4 personer i 6 år` without introducing a new word or number. Removing `ibland`, `ungefär`, `upp till`, `under handledning`, or `hjälpte till` likewise strengthens a claim while remaining token-traceable.

The wireframe already demonstrates a relation-level version of this defect: the deterministic `assemble()` inserts `så att` between a task and an independently stated outcome, creating causality that the user did not assert (`cv-byggaren-wireframe-v2.html:350–355`). Swedish inflection, compounding, connective words, polarity, agency, and number binding make a stopword or lemma allowlist equally unsound.

**What would resolve it:** Replace token provenance with typed atomic claims preserving at least subject, predicate, object, polarity, modality, quantity, unit, referent, frequency, time, ownership, and causal relation. Either render those atoms through closed, trusted templates or reclassify semantic faithfulness as DISCIPLINE. A free-form model checker cannot make this property deterministic.

## Finding 2 — Axis 1/2: Inline approval launders AI invention into `verified`

**Severity: BLOCKER**

**The concrete case:** Daniel supplies only `Säljare`. The composer proposes `Prisbelönt säljare med dokumenterat starka resultat`. The checker highlights the added claim, and Daniel presses the wireframe’s blanket `Ja, så var det – använd`, reasonably treating yellow as a wording warning. The entire sentence is then minted as a verified datafact. Slice 5 reports `inget AI-påhitt` because a confirmation click exists.

All controls have worked as specified, yet the AI originated every substantive proposition. If approval of an AI-authored claim is sufficient evidence, the invariant collapses to “nothing unapproved is exported.” That is the editable-box control the brief says competitors already have, not the stronger promise that the AI never invents biography. The `claim diff → explicit confirmation → verified` rule in the bullet contract directly creates this loophole.

**What would resolve it:** Separate three events: a user/source assertion of an atomic fact, semantic validation of a derivation, and approval of final wording. An unsupported factual diff must be rejected; it cannot be cured inline. If it might be true, ask a neutral question and mint the answer as a new user-authored atom before regenerating. Approval of prose may approve presentation, but must never manufacture evidence.

## Finding 3 — Axis 1/4/5: Confirmation is not bound to the exact revision later stored and exported

**Severity: BLOCKER**

**The concrete case:** The approved wireframe shows summary A at line 282, but `Så vill jag ha den` writes a different, truncated literal B at line 285. The education button writes hard-coded default content independently of any edits to the visible inputs (lines 243–247). The skills button writes a hard-coded list independently of the selected chips (lines 258–274). A user therefore sees and approves A while canonical state receives B, and B can inherit the approval.

The brief does not close the same class of implementation bug. It does not specify an immutable candidate revision, what exact bytes a confirmation covers, whether an edit invalidates a checker result, or whether preview, save/resume, named versions, and PDF all render the same object. The “canonical document model” first appears in Slice 5, after Slices 2 and 4 have already minted and rendered generated prose. That is retrofit, not born compliance.

**What would resolve it:** Define the canonical claim/document model before Slice 2. Every claim-bearing node needs immutable text or structured atoms, pinned source-fact revisions, checker attestation where applicable, and a confirmation receipt over the exact content hash. `accept` should submit only an opaque candidate ID plus revision hash; the server retrieves the candidate actually shown. Any edit, rewrite, translation, regeneration, or source change creates a new pending revision. Preview, versions, plain-text view, and PDF must render that same revision.

## Finding 4 — Axis 4/6: Slice 1 would certify known model-authored legacy prose

**Severity: BLOCKER**

**The concrete case:** The live ledger contains 144 datafacts; all 144 lack `status` and `sources[]`. Eleven are `type: "fill-gap"`. The current `server/skeleton/fill-gap/bullet-judge.cjs:59–88` lets the model write `bulletText` and immediately calls host-level `ingestDatafact()`; Daniel does not confirm that exact generated wording. The locked missing-status → verified default would therefore positively certify eleven known model-authored claims.

The mapper change in Slice 1 will not repair them: `seedDatafactsIfEmpty()` skips a non-empty durable pool. Wiping and reseeding instead loses the eleven fill-gap rows, remints random IDs, and breaks existing references. A fresh seed is not clean either: the mapper ingests `professional_summary`, `identity_positioning`, `value_proposition`, `star_story`, and `leadership` prose as facts, often by concatenating fields (`server/skeleton/datafacts/ingest-cv.cjs:18–65`), while Slice 1 marks seeded output verified with only a document-level source. The item-by-item truth gate does not arrive until Slice 3.

**What would resolve it:** Add a mandatory, ID-preserving pre-Slice-1 reconciliation. Inventory every legacy origin; backfill verified only where a row matches a known, hashed, explicitly attested source; quarantine all `fill-gap`, derived-prose, and unknown-origin rows as unverified; and have Daniel confirm or delete them. This can be a targeted repair, not a general migration framework. Test an upgrade fixture containing mapper facts, model-written facts, and existing refs twice for idempotency, stable IDs, complete provenance, no dangling refs, and zero generator visibility of quarantined rows.

## Finding 5 — Axis 5/6: The proposed collections-backed version container is a direct ledger bypass

**Severity: BLOCKER**

**The concrete case:** The brief’s lighter default is to store named CV snapshots in collections, while the locked context says collections are client/submodule-writable. The live repo confirms the risk: generic `POST /api/collection/:name` accepts arbitrary records (`server/dev-server.cjs:162–186`), `putRecord()` is ungated (`server/skeleton/store/index.cjs:140–168`), and any submodule with the coarse `store` capability can write any collection (`server/skeleton/capabilities.cjs:33–40`). A client can save:

```json
{
  "item": {
    "datafactRef": "verified_fact_saying_6",
    "text": "Led 60 people"
  }
}
```

If export renders snapshot text, `60` bypasses the ledger. If it ignores text and re-resolves current facts, the object is not a snapshot of the approved CV. A summary with no ref is an even simpler bypass.

**What would resolve it:** Decide this before Slice 2. Use a dedicated host-owned canonical-version store or a reserved collection namespace writable only through a version-specific server API. Client state may contain ordering, presentation choices, and pinned verified revision IDs—never authoritative claim text. The server resolves all rendered text and rejects client-supplied claim strings, mismatched ref/text pairs, dangling refs, and unverified refs. Direct generic collection writes must be unable to create anything the exporter reads.

## Finding 6 — Axis 4/6: The new builder has no defined legal landing place in the current product

**Severity: BLOCKER**

**The concrete case:** The brief says to build inside the existing `CV-byggaren` screen, add no second-level navigation, and not touch the applying side. In the current repo, however, `#cv` is the applying-side, job-bound tailor: it reads the active case, displays company/role context, and `actions.generate()` invokes the shared endpoint that runs both the existing tailored `cv-builder` and the cover-letter `writer`. The recorded D17 explicitly requires two surfaces: job-independent `CV-byggaren` and job-bound `Anpassad CV` (`docs/DECISIONS_ADDENDUM.md:157–161`). The wireframe shows only the former.

Replacing `#cv` deletes or corrupts the existing tailor. Reusing it makes the supposedly job-independent builder depend on an active application case and can trigger out-of-scope letter generation. Both violate locked scope.

**What would resolve it:** D23 must explicitly dispose of D17 and name the routes, components, APIs, case dependencies, and submodule IDs. The safe cut is a distinct job-independent builder route/API and distinct composer/checker submodules while preserving the current tailor under `Anpassad CV`. If the tailor is intentionally retired, D23 must say so. Add a test that the builder starts with no active case and never reads an advert, decoded role, fit, or invokes the writer.

## Finding 7 — Axis 2: The brief labels semantic entailment as a deterministic invariant

**Severity: BLOCKER**

**The concrete case:** In Finding 1, every exported node can reference a verified datafact, every schema can validate, every provisional fact can remain excluded, and the export gate can pass. The sentence is still false. There are two different properties:

1. Every rendered claim node references an allowed, verified, exact source revision.
2. Every proposition expressed by free-form prose is entailed by those sources.

The first is deterministic. The second is semantic judgment when unrestricted natural language and a learned checker are involved. Maker/checker independence reduces correlated failures; it does not turn a model judgment into a proof. “Temperature zero,” a frozen model, or two agreeing models would not make the claim universal.

**What would resolve it:** State the exact machine predicate. A defensible form is `Claims(output) ⊆ AllowedDerivations(verified source atoms)`, but `Claims(output)` itself cannot be recovered reliably from arbitrary prose in CI. To retain the strong INVARIANT label, make typed claim atoms the authored object and use trusted deterministic rendering. Otherwise label only provenance-graph closure and exact-revision identity as INVARIANT; label free-form semantic faithfulness as a zero-tolerance DISCIPLINE with human-authored regression tests. The current classification is not honest enough to implement.

## Finding 8 — Axis 3/4: The eval corpus has neither a sound oracle nor a complete-before-merge slice

**Severity: BLOCKER**

**The concrete case:** The brief says the corpus is the executable form of the invariant, but it does not define CI’s pass/fail predicate:

- A token-subset oracle accepts deleted negation, subject swaps, and quantity swaps.

- Exact-string goldens reject harmless render variants and make model upgrades brittle.

- Reusing the production checker as oracle is circular.

- A second model/NLI judge is useful regression evidence, not deterministic enforcement.

The named temptations—sparse answers, a bare title, a vague duty—mostly exercise obvious additions, not fabrications made entirely from existing tokens and relations. Worse, Slice 2 says the corpus “begins here” even though the composer and acceptance path merge in that slice. A merge gate cannot be partially present.

**What would resolve it:** Define hand-authored allowed and forbidden atomic claims per fixture and validate the typed output against them independently of the production checker. Add mutation tests that deliberately delete negation, swap agents or quantities, attach a duty to another role, invent causality, upgrade assistance to ownership, remove uncertainty, translate a credential upward, and reuse a rejected/unverified fact; every mutant must fail. Add metamorphic laws such as “adding `inte` invalidates the positive claim” and “moving a duty moves every derivative.” Freeze the claim schema, normalization, renderer, oracle, prompt/checker configuration, and model-change policy. The complete Slice-2 corpus must gate the Slice-2 merge; Slice 3 extends it before extraction/voice merge.

## Finding 9 — Axis 1/5: The canonical wireframe itself exports unconfirmed claims

**Severity: MAJOR**

**The concrete case:** The approved “what” spec contains several counterexamples to its own safety claim:

- The summary says `tolv års erfarenhet`, `hålla lugnet`, and `Söker en roll med driftansvar` although the visible inputs do not establish twelve years, temperament, or a target involving operations responsibility (`cv-byggaren-wireframe-v2.html:282`).

- `Stresshantering` is inferred from one event that occurred while stressed (`:258–263`).

- The skills forward button adds `Schemaläggning` and `Truckkort A+B` whether or not the skill was selected or the licence was uploaded/approved (`:274`).

- A user can navigate directly to Step 6; all safety checks are hard-coded green and download is enabled (`:95–102`, `:306–319`).

A straightforward implementation of the canonical UX therefore reproduces the exact harm the brief claims is impossible. It also teaches reviewers and developers that a nearby fact or a green label is sufficient evidence.

**What would resolve it:** Correct the wireframe before it becomes canonical. Use an input/output fixture in which every displayed clause is actually supported, make suggestions explicit pending tri-state objects, remove all hard-coded claim insertion, and add real blocked/error/review states to Step 6. From a fresh store, clicking every forward/accept/download control without entering or confirming anything must yield zero CV claims and no export.

## Finding 10 — Axis 1: A verbatim span proves bytes, not the extracted relationship or the user’s understanding

**Severity: MAJOR**

**The concrete case:** A two-column CV visually contains:

```text
Butiksbiträde, 2018–2020      Lagermedarbetare, 2020–2023
                              Ledde sex personer
```

OCR reading order places `Ledde sex personer` under the left-hand role. The extractor returns a genuine span but attaches it to `Butiksbiträde`. The UI highlights real words, so Daniel clicks `Stämmer`, believing he is confirming transcription rather than the hidden role-duty edge. The wireframe compounds role, employer, place, and dates into one primary-button confirmation; its uncertain `Truckkort A+B, 2018` card offers a guessed year with no source quote (`:168–181`).

The correction path can launder provenance too: if Daniel changes OCR’s `2018` to `2019` and the verified fact keeps the old span, the citation falsely says the document supports 2019. The generic `{origin, ref?, span?}` shape has optional binding fields and no immutable source hash, extraction revision, offset units, page coordinates, or confirmation event. A schema-valid source object is not evidence.

**What would resolve it:** Use a discriminated source union. Document evidence needs an immutable asset/text revision hash, page and layout-block identity, declared offset units, bounds, and quote hash; code must prove source-slice equality. Voice needs immutable transcript revision plus timestamps/audio linkage. Corrections preserve the extraction source and add a separate exact user-correction event. Confirm high-risk fields and relations atomically, show the original page crop and surrounding heading, and require manual entry for damaged dates/numbers rather than making a plausible guess the primary action.

## Finding 11 — Axis 4/5: “Unverified is excluded from every reader” leaves no legal reader for review

**Severity: BLOCKER**

**The concrete case:** Slice 1 says unverified facts are excluded from every reader. Slice 3 requires the review UI to read those same candidates. Filtering the sole `listDatafacts()`/`getDatafact()` accessor hides the inbox; leaving a raw option exposed lets a generator or renderer request unverified facts directly. The current writing-gate exemption is a second bypass: `collectRefdFactTexts()` exempts any referenced datafact text without inspecting verification state (`server/skeleton/store/index.cjs:51–63`). A direct known-ID reference can therefore be more dangerous than a filtered list.

Lifecycle is also undefined. “Acceptance mints a verified fact” appears to leave the unverified candidate behind. If export blocks while any unconfirmed item remains, every accepted or rejected upload can block forever. Updating the candidate in place contradicts “mints” and destroys the audit trail.

**What would resolve it:** Specify two capabilities: an ingestion-batch-scoped candidate API available only to the host review flow, and a verified-only evidence API used by every generator, checker, renderer, citation exemption, and exporter. Define an immutable candidate lifecycle (`pending → accepted/rejected/superseded`) and whether acceptance creates a separate verified fact or transitions one object. Resolved candidates must not count as pending. Tests must cover list, direct ID, ref resolution, gate exemption, all existing consumers, rejection, acceptance, and unrelated unresolved upload batches.

## Finding 12 — Axis 1/4: Transitive taint and evidence selection disappear after one `verified` hop

**Severity: MAJOR**

**The concrete case:**

1. Daniel says, “Jag arbetade med ett team på sex personer; Sara ledde arbetet.”

2. Composer emits and stores, “Ledde ett team på sex personer.”

3. Skill suggester derives `Arbetsledning`.

4. Summary writer derives `Erfaren arbetsledare med dokumenterad ledarerfarenhet`.

Every later component can cite a verified immediate predecessor even though the leaf evidence says Sara led. `status` plus one-hop `sources[]` does not encode the review package’s locked transitive-taint rule. Generated prose can thus become stronger “evidence” on every pass.

The maker/checker design has another evidence-laundering seam: the maker appears to choose the citations, then the checker sees only the cited facts. It can omit a relevant contradiction such as `ingen personalansvar`, cite the title `Teamledare`, and ask the checker to judge `personal manager` against a selectively favorable record. Sentence-level “has a source” and skill-level “has a grounded task” test relatedness, not entailment. The wireframe’s `Stresshantering` and `hålla lugnet` demonstrate that drift.

**What would resolve it:** Make provenance a DAG closed to immutable user/source atoms; generated prose never becomes independent evidence. The host, not the maker, supplies the complete relevant fact set including negative answers, qualifiers, and contradictions. Check every atomic clause/relation and its citation. Either add an independent skill/rationale checker as required by the general maker/checker rule or constrain skills to a reviewed deterministic mapping; a proposed skill remains unverified until separately confirmed.

## Finding 13 — Axis 1/4: Step-6 English and rewrite/edit controls are uncontracted generation paths

**Severity: MAJOR**

**The concrete case:** The wireframe explicitly separates interface language from CV language and lets the user choose `Svenska / English` in Step 6 (`:109–114`, `:304`). The five AI contracts contain no translation contract. Confirmed Swedish `Jag biträdde teamledaren med scheman` can become `Assistant Team Leader responsible for scheduling`; `påbörjad socionomutbildning, ingen examen` can become `Bachelor’s degree in Social Work`. Existing verified source IDs remain present, so a structural export gate passes the strengthened English claim.

`Skriv om enklare` and `Ändra själv` have the same invalidation problem. A simplifier can drop `ibland`, `ungefär`, or a negation; a manual edit can change `6` to `60` while retaining the old checker result and citations. Choosing a language or style is not informed confirmation of every transformed proposition.

**What would resolve it:** Either remove English CV output from this build or add a translation contract, independent semantic check, variant-specific provenance, exact-revision acceptance, and adversarial evals. Every easy-Swedish rewrite creates a new pending revision and reruns the same checks. A manual edit is allowed as user-authored material, but it must create a new exact user-source event and invalidate all prior checker/confirmation attestations. If Step 6 changes headings only, state that explicitly and prevent content-language mismatch.

## Finding 14 — Axis 4: Voice is presented in Slice 2 but architected as a different path in Slice 3

**Severity: MAJOR**

**The concrete case:** The wireframe’s `Berätta muntligt` enters the same guided fields as typed answers and voice/read-aloud controls appear from the start (`:109–129`). The brief instead defers voice to Slice 3 and says transcripts run through bulk document extraction. Those are different products and different truth semantics.

Daniel says `Jag ledde inte teamet`; ASR drops `inte`. If voice fills a guided answer, the result may be minted as a direct verified answer. If it follows document extraction, a character span proves only a mutable transcript, not the speech. Streaming ASR adds another race: an interim `16 personer` may later become final `6 personer` after extraction has already stored offsets.

**What would resolve it:** Decide before Slice 2 whether voice is field dictation or bulk narration, and hide/disable the door until its slice exists. Bulk narration may extract only from a finalized immutable transcript revision with audio/timecode linkage and explicit correction/confirmation. Field dictation commits only the exact reviewed field value as a user answer. Test dropped negation, digit/homophone confusion, interim-result mutation, correction after restart, and direct attempts to bypass the server path.

## Finding 15 — Axis 5/6: A shared mutable ledger makes versions and checked PDFs change after approval

**Severity: MAJOR**

**The concrete case:** Version A selects fact F, `Led 6 people`. Daniel corrects F to `Led 8 people` while building Version B. The current store upserts datafacts by ID, and existing repair code deliberately overwrites text in place. Version A either silently changes to 8 without approval, or keeps copied text 6 while its ref now resolves to 8. Current seed IDs are random, so a wipe/reseed makes older refs dangle.

The export flow has the same time-of-check/time-of-use defect if it validates a document or PDF and then renders/downloads again. An autosave, fact edit, template change, language switch, font fallback, or nondeterministic renderer can make the checked bytes differ from the delivered bytes. A one-way “all expected text is present” comparison also accepts extra template text such as `Certifierad lagerledare`.

**What would resolve it:** Make facts immutable revisions; corrections append and supersede rather than overwrite. Version items pin `{factId, revision/contentHash}` and dependent derived nodes. Specify whether superseded facts keep old versions viewable but export-blocked or require an explicit upgrade. For export, freeze one immutable document revision, validate its provenance graph, render once, hash those exact bytes, perform a bidirectional content/order comparison on those bytes under a narrow normalization contract, and return those same bytes. Any state change invalidates the artifact.

## Finding 16 — Axis 6: Category “reseed safety” has no reproducible source or stable identity rule

**Severity: MAJOR**

**The concrete case:** Twenty-five live competency facts carry a `category` object whose source names `COMPETENCY_MASTER_POOL.json`; the canonical `data/cv_data.json` contains no category field, and the mapper never produces one. The real-data mapper test is skipped in a clean checkout because Daniel’s personal file is gitignored. “Whatever grouping metadata the live store carries” therefore does not identify a reproducible input or mapping.

Even if a mapper re-derives categories, current seeding mints random IDs. A fresh-store reseed can reproduce text and categories while still breaking every version and citation reference. Testing only “drops nothing” by count will miss both remapping and wrong-category attachment.

**What would resolve it:** Put the non-personal category taxonomy/mapping in a versioned canonical source or add stable category keys to the input format. Define deterministic source-derived IDs or an atomic old→new ref remap. Add a committed synthetic fixture with the exact production shape and compare full structural equality—IDs, text, status, sources, categories, and references—across two rebuilds. Do not rely on the gitignored real CV to make a CI invariant executable.

## Finding 17 — Axis 5: The export gate is circular and has no defined domain

**Severity: MAJOR**

**The concrete case:** The brief says export is blocked while any unconfirmed claim remains, then says unconfirmed text can never enter the CV so it blocks “by construction.” Those statements leave three incompatible implementations:

- Query the whole ledger: an ignored, rejected, or unrelated pending upload blocks export forever.

- Query only CV items with `status: unverified`: an orphan free-text node has no status and can pass.

- Assume construction already excluded all bad nodes: the gate checks nothing and cannot catch storage, manual-edit, stale-snapshot, or template bugs.

The approved UI hides this ambiguity by showing every check as green and keeping download enabled. The parseability round-trip cannot compensate; it only proves that the PDF resembles a document model that may already contain an unsupported claim.

**What would resolve it:** State one server-side predicate: every claim-bearing leaf in the exact immutable export graph must resolve to an allowed, verified source revision or an exact user-authored assertion, and the rendered claim must be the accepted revision; missing or mismatched provenance fails closed. Only enumerated structural text such as section headings and punctuation is exempt. Pending candidates outside the graph are either a separate warning or an explicitly specified workflow blocker. Compute the UI checklist from that predicate, deep-link to blockers, and rerun it on the exact snapshot rendered to the downloadable artifact.

## Verdict

This brief is **not yet fit to build**. Its structural ideas can enforce that a verified ID is present, but the current design cannot enforce that exported language means only what the user’s evidence says, and the live legacy/collections/route seams provide concrete bypasses before model quality is even relevant. The single most important change is to define the unit of a claim as an immutable, typed, source-bound atom—separating source assertion, derived wording, and wording approval—and either render only deterministically allowed derivations from those atoms or honestly reclassify free-form semantic no-fabrication as DISCIPLINE. Until that foundation, the advertised invariant is a provenance label around a semantic judgment, not a deterministic safety property.
