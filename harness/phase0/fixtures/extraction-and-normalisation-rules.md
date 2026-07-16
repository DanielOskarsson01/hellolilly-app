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

Every content node carries exactly one source identifier (datafact-pool id or
snapshot-corpus/fixture id). Multi-source nodes are out of scope this wave.

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
