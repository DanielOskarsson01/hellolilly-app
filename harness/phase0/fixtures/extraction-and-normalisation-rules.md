# Wave 1 - Extraction & Normalisation rules (Phase 0c)

Committed (synthetic tier). These rules are FROZEN in Phase 0 and do not change
after capture. They define how a tailored CV structure is turned into the
comparable representation the parity tests operate on, and the ONLY normalisation
permitted when checking node text against source text.

## Extraction (structure -> comparable representation)

For a tailored structured CV, the extracted representation is, per COMPARED
section, the ORDERED list of source identifiers of its content nodes:

| Section | Extracted as |
|---------|--------------|
| summary | [summary source id] (length 1) |
| career_highlights | ordered list of highlight source ids |
| core_competencies | ordered list of category ids, and within each, ordered item ids |
| professional_experience | per fixed job (fixed order): [role id, intro id] + ordered bullet ids |
| other_experience | ordered list of otherExp source ids |

Excluded from comparison (STATIC, never tailored): header image, name, job
company/period, earlier_career, education, awards_languages. These must render
unchanged but carry no selection to measure.

INVARIANT (from the brief's P3 metric): identifiers are UNIQUE within a section.
A duplicate identifier in any section is a P2 failure; the extracted lists are
duplicate-free by construction.

Every tailorable node carries exactly one TYPED source reference, and P2 resolves
it against a committed source **by ref kind**:

| Ref kind | Emitted for | Resolves against (P2) |
|----------|-------------|-----------------------|
| `datafact` | summary, highlights, competency items, job intro + bullets, otherExp, static-section items | the datafact pool (MANIFEST snapshot); node text == datafact text under normalisation |
| `category` | each selected competency category | the committed `COMPETENCY_MASTER_POOL.json` taxonomy; category id must be known + node title == taxonomy title |
| `role` | each fixed job's role | the frozen per-job role table (`TEMPLATE_DEFINITION.md` `job_roles`); role id (`role:<jobkey>`) must be known + node text == the frozen role title |

Category and role are TAXONOMY / STRUCTURE, not candidate evidence, so they are
typed **structural** refs — not datafact-pool ids — but each carries a resolvable
identifier verified against a committed source and enters extraction exactly like
a datafact id. This is the invariant the requirement protects: every tailorable
selection is identified, verified against a committed source, and measured.
Multi-source nodes are out of scope this wave.

## Normalisation (node text vs source text)

Node text must equal source text after WHITESPACE and PUNCTUATION-SPACING
normalisation ONLY (v2 finding 7 - the builder does not author its own oracle):

1. Collapse every run of whitespace (space, tab, newline) to a single space.
2. Trim leading and trailing whitespace.
3. Remove whitespace immediately before `, . ; : ! ?`.

Anything richer is FORBIDDEN: no case folding, no Unicode/quote/dash folding, no
stemming, no synonym mapping, no punctuation removal. Equality is
`normalise(nodeText) === normalise(sourceText)`.

Reference implementation + self-check: `normalise.cjs` (run `node normalise.cjs`).
