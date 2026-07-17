# Wave 1 - Template Definition (Phase 0d)

Structural only, committed. Extracted PRIMARILY from the reference
CODE (`JobSearch/CVs/generate_core_cvs.js` `buildCV`, headings from `i18n.js`),
cross-checked against the three captured reference outputs.

**Committed-by-design personal content.** This file carries the real name
(`Daniel Oskarsson`) and the real company/period names as **structural
constants** — the fixed CV scaffold the tailor may never add to, rename, or
reorder (see the section table and the five fixed jobs below). Per D20(b),
the career biography (name, employers, roles, periods) is committed-by-design
under the standing persona decision; only contact PII, the evidence/datafact
pool, and captured CV artefacts are withheld from the repo. None of that
withheld class appears here — no contact details, no pool bullets, no ad or
CV bodies — only the structural skeleton.

This is the structure factory for the wave: the per-case structured CV is
instantiated FROM this definition, and the tailor fills content nodes within it.
The tailor can never add, remove, rename, or reorder sections.

## Section sequence (fixed, from `buildCV`)

| # | Section | Heading (i18n `en`) | Content | Tailorable? |
|---|---------|--------------------|---------|-------------|
| 1 | Header image | (none) | variant-themed image | structural (variant-driven, no text node) |
| 2 | Name + contact | (none) | name "Daniel Oskarsson" (static); contact block | contact = tailorable node |
| 3 | Executive summary | (none - runs straight in) | one summary paragraph | tailorable: 1 summary variant |
| 4 | Career Highlights | "Career Highlights" | highlight bullets | tailorable: from highlight pool |
| 5 | Core Competencies | "Core Competencies" | competency table | tailorable: categories + items from COMPETENCY_MASTER_POOL |
| 6 | Professional Experience | "Professional Experience" | 5 fixed jobs | role/intro/bullets tailorable; company+period STATIC |
| 7 | Earlier Career | "Earlier Career" | 4 fixed entries | STATIC (shared content) |
| 8 | Other Experience | "Other Experience" | otherExp list | tailorable |
| 9 | Education | "Education" | 3 institutions | STATIC |
| 10 | Awards, Recognition & Languages | "Awards, Recognition & Languages" | awards + languages line | STATIC |

## The five fixed jobs (order + company/period static, from `JOB_HEADERS`)

Order is fixed: `onlyigaming, coinhero, betclic, comeon, mrgreen`.

| key | company (static) | period (static) |
|-----|------------------|-----------------|
| onlyigaming | OnlyiGaming.com, enable.rs, Antler, PlayPalz.com \| Stockholm | 2020 - Present |
| coinhero | Coinhero.io \| Remote | 2023 - 2024 |
| betclic | Betclic Mangas Group \| Bordeaux | 2018 - 2019 |
| comeon | ComeOn/Cherry (NASDAQ listed) \| Malta / Stockholm | 2012 - 2017 |
| mrgreen | MrGreen (now 888) (NASDAQ listed) \| Malta | 2009 - 2013 |

Static content locations (NOT tailored, must render unchanged): job company+period, Earlier Career (Getupdated, Telge Energi, Nofrontiere, McCann-Erickson), Education, Awards, languages line, the name.

## Two NAMED JUDGEMENT CALLS (adopted; vetoable by Daniel at 0e)

Neither is deterministically encoded in the reference code; both are adopted from the reference's PROSE rules and validated against the three captured outputs.

### JC1 - cardinality bounds
Source: `COMPETENCY_MASTER_POOL.json._rules` ("pick 3 categories per CV, occasionally 2 or 4"; "4-6 items") and the prompt's fixed 6-highlight template. Validated against captures (Wrknest / Aloi / Ramen Bae, all `cmo`):

| Node | Adopted bound | Observed in 3 captures |
|------|---------------|------------------------|
| summary | exactly 1, non-empty | 1 / 1 / 1 |
| highlights | 6 | 6 / 6 / 6 |
| competency categories | 3 (allow 2-4) | 3 / 3 / 3 |
| items per category | 4-6 | [6,5,5] / [6,4,4] / [6,4,4] - all within 4-6 |
| professional-experience jobs | exactly 5, fixed keys/order | 5 / 5 / 5 |
| bullets per job | >= 1 non-empty; exact count is variant-fixed, not freely chosen | identical across captures (cmo): onlyigaming 5, coinhero 5, betclic 5, comeon 6, mrgreen 8 |
| otherExp | >= 1 non-empty | present / present / present |

### JC2 - section emptiness
The reference renders every section unconditionally (`buildCV` pushes all sections; the only conditional, Education, still renders a fallback). Therefore the definition requires **all sections present and non-empty**. Validated: every tailorable section is non-empty in all three captures.

## Machine-readable structure block (for the Item-1 P1 validator)

```json
{
  "section_order": ["header_image","name_contact","summary","career_highlights","core_competencies","professional_experience","earlier_career","other_experience","education","awards_languages"],
  "headings_en": {"career_highlights":"Career Highlights","core_competencies":"Core Competencies","professional_experience":"Professional Experience","earlier_career":"Earlier Career","other_experience":"Other Experience","education":"Education","awards_languages":"Awards, Recognition & Languages"},
  "fixed_jobs": ["onlyigaming","coinhero","betclic","comeon","mrgreen"],
  "job_roles": {"onlyigaming":"Entrepreneur & Consultant - Product / Start-up / iGaming","coinhero":"CEO / Founder - iGaming Operator Development","betclic":"Head of Casino Business / Intrapreneur","comeon":"CMO / CPO / COO","mrgreen":"Head of Marketing, Brand & Communication (Founding Team)"},
  "static_sections": ["earlier_career","education","awards_languages"],
  "static_within_jobs": ["company","period","role"],
  "tailorable_nodes": ["contact","summary","highlights","competencies","job.intro","job.bullets","otherExp"],
  "structural_ref_kinds": {"datafact": "resolves against the datafact pool (evidence)", "category": "resolves against the committed COMPETENCY_MASTER_POOL taxonomy (id + title)", "role": "resolves against job_roles above (frozen per-job role table)"},
  "cardinality": {
    "summary": {"exact": 1},
    "highlights": {"exact": 6},
    "competency_categories": {"target": 3, "min": 2, "max": 4},
    "competency_items_per_category": {"min": 4, "max": 6},
    "jobs": {"exact": 5},
    "bullets_per_job": {"min": 1, "note": "exact count variant-fixed"},
    "otherExp": {"min": 1}
  },
  "all_sections_non_empty": true,
  "header_image": {
    "render_width": 800,
    "reference_heights_frozen": {"medium": 280, "large": 400, "small": 160},
    "hellolilly_template_heights": {"medium": 316, "large": 452, "small": 181},
    "note": "HelloLilly renderer uses natural (undistorted) heights at width 800; reference oracle stays frozen"
  }
}
```

## Header image (HelloLilly template design value, confirmed 0e)

The header image is variant-driven (`IMAGE_MAP`), rendered at fixed `width: 800`.
The reference forces heights 280 (medium) / 400 (large) / 160 (small) - all BELOW
the natural height at width 800, so every header renders slightly vertically
squished. Original banners are all 2480px wide: medium 2480x980 -> natural 316,
large 2480x1400 -> natural 452, small 2480x560 -> natural 181.

Daniel's decision (0e): the **HelloLilly renderer** uses the natural/undistorted
heights **medium 316, large 452, small 181** (un-squished). The **reference oracle
stays frozen** at its historical 280/400/160 - it remains the honest baseline. The
image is static/structural and not a parity-graded node, so this HelloLilly-vs-
reference image delta is a deliberate design improvement, not a regression (P4 may
note structural fidelity; taller-correct is "better", allowed).
