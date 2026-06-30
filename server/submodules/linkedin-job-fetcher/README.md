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

## Two modes

### FETCH-NEW — `{ ids?, urls?, id?, url? }`
Fetch raw LinkedIn ids/urls not yet in the store and write NEW canonical records (`source:'linkedin'`,
deduped by `externalId`, existing decisions preserved). Per-input status row: `ok` / `expired` (404) /
`rate_limited` (429) / `error`. Returns `{ ok, results, summary }`.

### ENRICH — `{ enrich:true, limit?, delayMs? }`  (the body-enrichment step)
Fills the **body** of jobs already in the store flagged `needs_body:true` (the body-less CSV-ingested
LinkedIn jobs). It scans `jobs` for `needs_body`, fetches each guest posting, and updates **in place by
the same `record.id`**, writing **only** `text_content` + `needs_body` + `body_status` — every other
field (the CSV's authoritative title/company/**Swedish** location, `decision`, `locFit`, `found_in`) is
carried through untouched. (The guest endpoint returns *English* locations and a hardcoded `decision`,
so enrich must never re-derive metadata — it only adds the body.)

**`needs_body` is the retry cursor:**
| outcome | `needs_body` | `body_status` | re-run |
|---|---|---|---|
| body fetched (≥40 chars) | `false` | `ok` | skipped (done) |
| 404 | `false` | `expired` | skipped (terminal — body stays empty, record visible) |
| 429 | `true` | `rate_limited` | retried |
| network/other error | `true` | `error` | retried |
| 200 but body <40 chars | `true` | `thin` | retried (never advances an empty body to stage-2) |
| no extractable LinkedIn id | `true` | `no_id` | re-evaluated (no fetch) |

`limit` caps the batch (paced by `delayMs` to avoid a 429 cascade); the rest are `deferred` and picked
up on the next run. Idempotent: re-running skips done/expired and retries only the unfinished set.
Returns `{ ok, mode:'enrich', candidates, results, summary:{ok,expired,rate_limited,error,thin,skipped,deferred} }`
(`ok = no error/rate_limited/thin remaining`). `npm run discover`-style orchestration: `server/run-enrich.cjs`
ingests the CSV then enriches in one process (the in-memory store is shared).

## Contract
- **Capabilities:** `http`, `store`, `logger`, `utils`. Imports nothing (require-guard intact).
- **Flow:** CSV upload → `job-ingest` extracts LinkedIn URLs/ids → this fetcher enriches each →
  full-bodied jobs enter the store → stage-1 AND stage-2 filtering both work.

## Caveats / next steps
- **HTML selectors VALIDATED** against live guest responses (15 real jobs: `top-card-layout__title`,
  `topcard__org-name-link`, `topcard__flavor--bullet` for the card; the description bounded by
  `show-more-less-html__button` to drop the trailing "Referrals increase your chances…" chrome). If
  LinkedIn ever shifts class names it's a `parsePosting` tweak, not a structural change.
- **Scaling (later, not now):** weekly batches of ~15–50 from one IP with a ~1–1.5s delay are fine.
  If volume ever needs hundreds fast and hits rate-limiting, route the same GET through the
  provisioned Bright Data Web Unlocker / ScrapFly — a transport swap, parse logic unchanged.
