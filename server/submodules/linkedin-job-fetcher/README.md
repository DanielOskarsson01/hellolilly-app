# linkedin-job-fetcher

Enriches LinkedIn jobs — which can't be API-searched — with their full body, so stage-2
(description-body) filtering and the decoder work on LinkedIn jobs just like API jobs.

## Why this approach
The **unauthenticated guest endpoint** `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{id}`
returns the full posting as static HTML with a browser User-Agent. **No login, no Voyager, no
headless browser, no LinkedIn account** → zero risk to any LinkedIn session and no entanglement with
the production scraper. Plain native `fetch` (`tools.http`) — **no new dependency**. (Verified
out-of-band: 14/15 real ids returned full descriptions, no rate-limiting on 15 sequential requests;
the one miss was a genuinely-removed job.)

## What it does
- **Input:** `{ ids?, urls?, id?, url? }` — bare numeric ids or any LinkedIn URL form (tracking
  params ignored; the numeric job id is extracted).
- **Fetch:** GET the guest endpoint per id, with a browser UA.
- **Parse (LinkedIn-specific, the only place):** title / company / location / full description body.
  Output is the **generic canonical job shape** — downstream never learns LinkedIn internals.
- **Status, never silent drop:** every input yields a result row — `ok` / `expired` (404) /
  `rate_limited` (429) / `error` (bad id, network, other HTTP). `ok` jobs are written to the `jobs`
  collection (`source:'linkedin'`, deduped by `externalId`, existing decisions preserved).
- **Output (return):** `{ ok, results:[{jobId,status,…}], summary:{ok,expired,rate_limited,error} }`.

## Contract
- **Capabilities:** `http`, `store`, `logger`, `utils`. Imports nothing (require-guard intact).
- **Flow:** CSV upload → `job-ingest` extracts LinkedIn URLs/ids → this fetcher enriches each →
  full-bodied jobs enter the store → stage-1 AND stage-2 filtering both work.

## Caveats / next steps
- **HTML selectors are best-effort** against the guest markup and should be validated against a real
  response; if LinkedIn shifts class names it's a parse tweak (`parsePosting`), not a structural
  change. The transport / id-extraction / status logic is solid regardless.
- **Scaling (later, not now):** weekly batches of ~15–50 from one IP with a ~1–1.5s delay are fine.
  If volume ever needs hundreds fast and hits rate-limiting, route the same GET through the
  provisioned Bright Data Web Unlocker / ScrapFly — a transport swap, parse logic unchanged.
