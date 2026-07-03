# data/ — the candidate evidence pool (D2)

`cv_data.json` lives here: the canonical English CV source the datafact pool
seeds from (`scripts/seed-datafacts.cjs`). It is **personal data and gitignored** —
inside the project boundary, outside git history.

- Canonical origin (2026-07-03): `JobSearch/CVs/cv-source/en/cv_data.json`,
  verified a strict superset of the older top-level copy (see the D1+D2 build report).
- Missing file: seeding fails with a clear message (and CI/fresh clones skip the
  real-shape contract test). Restore by copying your cv_data.json here, or point
  `CV_DATA_PATH` / `{ jsonPath }` elsewhere.
- Swedish later: a `cv_data.sv.json` here + ingest with `language: 'sv'` (design §5).
