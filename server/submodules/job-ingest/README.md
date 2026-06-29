# job-ingest

Brings in LinkedIn jobs that **can't be API-searched**, from a CSV upload (Daniel's annotated
tracking export). Maps each row to the **same canonical job shape** as discovery/fetcher, into the
`jobs` collection — so an ingested job and a discovered job are indistinguishable downstream.

## What it does
1. **Parses the CSV** — a minimal RFC-4180-ish parser that handles quoted fields with commas
   (`"Miami, FL (…)"`, `"Syndesus, Inc."`).
2. **Repairs mojibake** — the export is UTF-8 bytes decoded as Latin-1/Windows-1252
   (`PÃ¥ distans` → `På distans`, `lÃ¤n` → `län`). Reinterprets the bytes as UTF-8 (structural
   chars are ASCII, so only the multi-byte sequences change). Applied only when the tell-tale
   `Ã`/`Â` markers are present.
3. **Maps → canonical stage-1 jobs** and stores them (deduped by `externalId`, an existing
   `decision` is never clobbered). Jobs land **stage-1-ready**: `title`/`company`/`location`/`url`
   known, `text_content: ''` and `needs_body: true` — the description **body** is enriched later by
   `linkedin-job-fetcher` (a separate step, see below).

## Contract
- **Capabilities:** `store`, `logger`, `utils`. Imports nothing (require-guard intact).
- **Input:** `{ csv: '<content>' }` (the host route reads the uploaded file and passes the string).
- **Output (return):** `{ rows, added, skipped, urls:[…], errors:[…] }`. `urls` is the LinkedIn list
  for the enrichment step; rows with no extractable LinkedIn id are reported in `errors`, never
  silently dropped.

## Column mapping
`title→title · company→company · location→location (repaired) · url→url (+ externalId
`linkedin-{id}`) · posted_date→postedAt · snippet→snippet · approve→decision (blank→new) ·
reason→rejectReason · found_in→found_in (search context) · loc_fit→locFit (Daniel's own location
judgement, carried as metadata)`. `source: 'csv-linkedin'`.

## Body enrichment is a SEPARATE step (by design)
Ingest stores stage-1 records only. To fill `text_content`, `linkedin-job-fetcher` fetches each
url's body. **Sequencing matters:** the fetcher currently *skips* an `externalId` already in the
store (its dedup, to protect decisions), so a naïve ingest→fetch order would leave bodies empty.
The intended flow is **fetch-first-then-merge** (fetcher writes the full-bodied record, ingest merges
its CSV metadata on top) OR an explicit fetcher "enrich existing" mode. That integration is its own
small piece — not built here. Today: ingest makes jobs **stage-1 filterable immediately**; stage-2
(body) filtering follows enrichment.

## Validated
Run against the real 78-row export: 76 jobs ingested, 0 errors, mojibake repaired
(`Stockholms län`, `Mellanöstern`, `Malmö, Skåne län`), quoted-comma fields intact, `loc_fit`
carried. The personal CSV stays local (gitignored), never committed.
