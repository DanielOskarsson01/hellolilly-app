# job-discovery

Scheduled multi-provider job search — Step 1 of the job-search cluster. Rewrapped from the
OnlyiGaming pipeline's step-1 `api-search` ("copy freely, call never"): the provider abstraction,
field-map, and search/feed modes are **owned here**, not `require()`'d across repos.

## What it does
1. Reads the **filter set from the store** — `tools.store.getRecord('filterSet', 'active')`. Fails
   loud if absent (you must seed it first). This is the operability principle: search terms,
   providers, and reject rules are editable **data**, never hardcoded in this code.
2. Queries each configured provider:
   - **search mode** (jobtech / Platsbanken): one request per search term.
   - **feed mode** (remoteok, remotive): one request, filtered client-side by the search terms.
3. Maps results to the **canonical job shape**, HTML-stripping the body into `text_content`.
4. **Dedups by `externalId`** against jobs already in the store — never clobbers an existing
   `decision` (a re-run won't reset a job you already rejected to `new`).
5. **Flags, never hides.** A job matching a store-backed reject rule (`rejectTitleTerms`,
   `badCompanies`) is stored with `decision:'new'`, `signal:'low'`, and `matchedRules` recording
   why — the down-rank/approval call belongs to the approval + rejection-learning layer, not here.

## Contract
- **Capabilities:** `http` (provider calls), `store` (read filterSet, write `jobs`), `logger`, `utils`.
- **Input:** `{ profile? }` — an optional schedule-profile name (`'daily'` | `'weekly'`). The schedule
  itself is OS-level (cron/launchd → a host entrypoint → `broker.invoke('job-discovery', …)`); this
  submodule stays schedule-agnostic.
- **Output (return):** `{ ok, found, added, perProvider, errors }`. Writes canonical jobs into the
  `jobs` collection as a side effect.

## The filter set (store-backed, seeded from `candidate_preferences.json`)
A record in the `filterSet` collection, id `active`. job-discovery reads:
`searchTerms[]`, `providers[]` (subset of `jobtech|remoteok|remotive`), `maxResults`,
`rejectTitleTerms[]`, `badCompanies[]`. Seeding (file → store, with the agreed corrections —
CMO/CPO equal weight, the conceptual-vs-technical product boundary) is a separate ingest step;
after ingestion the store owns the filter set and the file is not re-read as source of truth.

## Canonical job shape (written to `jobs`)
`{ id (minted 'job'), externalId (provider-prefixed), source, title, company, location, url,
snippet, text_content, postedAt, decision:'new', signal, matchedRules, discoveredAt }`.
Downstream (decoder/analyzer/approval) never learns provider internals.

## Notes
- The provider catalog (URLs/field-maps) is **transport**, not a filter — it's infrastructure and
  stays in code, the same way the pipeline treated providers. Only filters are store-backed.
- In-memory store today (A0): persistence across separate process invocations is the deferred
  "real DB" swap behind the same store interface — relevant when the OS-cron schedule goes live.
