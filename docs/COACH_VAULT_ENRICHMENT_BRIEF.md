> **External brief, committed as evidence for D21, 2026-07-16. Its repo conventions are not this repo's.**

# Implementation Brief — Contact Career-History Enrichment (LinkedIn)

**Status:** Method PROVEN (2026-07-16). Ready to plan the build.
**Audience:** the planning agent that will design and sequence this capability.
**Author context:** distilled from a live proof-of-concept run; every tool, ID, cost, and field below is real and verified, not assumed.

---

## 1. Goal (what we are building)

Let each **coach** obtain the **full prior-job history** of the people in their LinkedIn network — not just the current title LinkedIn shows, and NOT the coach's own CV.

- **Input we can get for free:** a coach's list of their connections (name, current company/title, and crucially the **LinkedIn profile URL**).
- **What we need to add:** each connection's complete career history (every past role, employer, dates), plus optionally education / skills.
- **Scale & cadence:** voluntary, one coach at a time, rolled out over weeks. Not a bulk blast. "One coach here and there."

**Non-goals:** enriching strangers who never consented via the coach relationship; harvesting emails/phones; anything that puts a coach's own LinkedIn account at risk.

---

## 2. Why this shape (the architecture decision — do not re-litigate)

LinkedIn gives **no** consent-based route to a contact's *full* career history:
- The native **"Get a copy of your data" export** and the **EU DMA Portability API** only ever return the *exporting person's own* data. A coach's connections export contains only each contact's **current** company/title + profile URL — never their history.
- Therefore full history must come from a **third-party enrichment source** keyed on the profile URL.

So the capability is **two layers with a hard security boundary between them:**

| Layer | Runs where | Risk | What it produces |
|-------|-----------|------|------------------|
| **L1 — Consent export** | Each coach, in their own LinkedIn account | Zero (official feature, own data) | `Connections.csv`: name, current company/title, **profile URL** (the seed) |
| **L2 — Enrichment** | Centrally, on OUR Apify account | On our account only, never a coach's | Full career history per URL |

**The boundary is the whole point:** coaches' LinkedIn accounts NEVER run a scraper. The scraping happens centrally against a cookie-free provider that never logs into anyone's account. This is what makes it safe and repeatable. Any design that puts a scraper on coaches' machines/accounts (logged-in Playwright, browser extensions, `li_at` cookies) is rejected — it's the account-ban route.

---

## 3. Proof it works (so the planner doesn't re-verify from scratch)

One profile was run end-to-end as ground truth: **Sema Schmidt** (`https://www.linkedin.com/in/sema-schmidt-204b991/`), whose true 9+ roles were known independently.

**Result: 11/11 roles returned, exact dates to the month, including the entire 2002–2012 span that web search completely missed**, plus correct education (caught a wrong "Master's" claim from a press interview — it's a Bachelor's). Cost: **$0.004**. For comparison, plain web search got ~3.5 of 9 roles and fabricated a nonexistent employer.

**Acceptance test for the build:** re-run this same URL through the finished pipeline and confirm it still returns all 11 roles with correct dates. That's the done-signal.

---

## 4. The exact tool (L2 enrichment)

**Apify actor: `harvestapi/linkedin-profile-scraper`**
- No cookies, no login, no LinkedIn account involved.
- 50k+ users, **99.6% success rate**, 4.4★.
- Store page: https://apify.com/harvestapi/linkedin-profile-scraper

### Pricing (verified)
| Mode | Cost |
|------|------|
| `Profile details no email ($4 per 1k)` | **$0.004 / profile** ← use this |
| `Profile details + email search ($10 per 1k)` | $0.01 / profile (we don't need emails) |

At $4/1,000, a coach's entire 1,000-connection network = **~$4**.

### Apify account & billing (verified)
- **Free plan** = $5 platform credit/month, **no card, no subscription required**, and that $5 **covers third-party per-result fees** (confirmed in Apify docs). So one coach network/month is effectively free.
- A subscription (Starter $29/mo) is only needed if you enrich **many** coach networks in a **single calendar month** and blow past $5.
- **Known trap:** an Apify account with a *history of failed/blocked card charges* gets flagged and refuses paid runs with the misleading error **"Too many outstanding invoices"** — even when the current Invoices tab shows none. Fix: use a **clean/fresh Apify account**. (This is exactly what happened in the PoC; a fresh account solved it.)

### Input schema (the fields we use)
```json
{
  "profileScraperMode": "Profile details no email ($4 per 1k)",
  "urls": ["https://www.linkedin.com/in/sema-schmidt-204b991/"]
}
```
`urls` is an array — batch a coach's whole network in one call. (`queries` / `publicIdentifiers` / `profileIds` also accepted; `urls` is simplest.)

### Two ways to call it — pick per environment
1. **Apify MCP connector** (`mcp__Apify__call-actor`) — clean, but authenticates as whatever token the connector holds. In the PoC the connector was stuck on the old flagged account and could NOT be swapped by editing (needed full remove + re-add). Reliable only if the connector is freshly wired to the clean account's token.
2. **Direct REST via `tools.http` / curl** (the reliable fallback, and the pipeline-correct path per Rule 3):
   ```
   POST https://api.apify.com/v2/acts/harvestapi~linkedin-profile-scraper/run-sync-get-dataset-items
   Header:  Authorization: Bearer <APIFY_TOKEN>
   Body:    {"profileScraperMode":"Profile details no email ($4 per 1k)","urls":[...]}
   ```
   `run-sync-get-dataset-items` blocks until the run finishes and returns the dataset items directly (one JSON array of profile objects). **Token goes in the Authorization header, never in the URL/query string.**

---

## 5. Output schema (real, from the verified run)

Top-level profile object (selected keys — there are ~40):
`publicIdentifier, linkedinUrl, firstName, lastName, headline, about, location{parsed{city,state,country,countryCode}}, currentPosition, topSkills[], connectionsCount, followerCount, experience[], education[], certifications[], skills[], languages[], receivedRecommendations[], honorsAndAwards[], volunteering[], publications[], courses[], registeredAt`.

**`experience[]` item (the core deliverable):**
```json
{
  "position": "CMO & Head of eCom",
  "companyName": "Teknikmagasinet",
  "companyLinkedinUrl": "https://www.linkedin.com/company/teknikmagasinet/",
  "companyId": "95375",
  "employmentType": "Full-time",
  "location": "Stockholm, Sverige",
  "duration": "1 yr 1 mo",
  "description": "…full role description…",
  "skills": ["CRM","Affärsstrategi", …],
  "startDate": { "month": "Jan", "year": 2021, "text": "Jan 2021" },
  "endDate":   { "month": "Jan", "year": 2022, "text": "Jan 2022" }
}
```
Note: `startDate`/`endDate` are **objects** (`{month, year, text}`); `endDate` is `{text:"Present"}` (no month/year) for current roles. A role with no start month yields `{year, text}` only. **Normalize these** — don't assume month is always present.

**`education[]` item:**
```json
{ "schoolName": "Karlstad University", "degree": "Bachelor's degree",
  "fieldOfStudy": "Information Technology/ Computer Science",
  "startDate": {"year":1999,"text":"1999"}, "endDate": {"year":2001,"text":"2001"} }
```

Media/logo blobs (`companyLogo.sizes[]`, `profilePicture`) are large and usually noise — **drop them** unless a UI needs avatars.

---

## 6. Build plan (steps to sequence)

### Phase 0 — Account & secrets
1. Create/confirm a **clean Apify account** (fresh email if the existing one is flagged). Free plan, no card.
2. Generate a **Personal API token**; store as `APIFY_TOKEN` in the skeleton `.env` (never in module code — Rule 3 / secrets discipline). Rotate/revoke any token that ever appears in a log or chat.

### Phase 1 — Coach-side SOP (L1, no code)
3. Write a **one-page coach instruction sheet** (Swedish + English) for the connections export:
   - LinkedIn → **Settings & Privacy → Data privacy → Get a copy of your data**
   - Choose **"Want something in particular?" → tick _Connections_** (not the full archive)
   - CSV arrives by email in ~10 min → coach drops it in an agreed intake location (shared folder / upload).
   - Note the two normal quirks: email column is usually blank; a few rows may have blank company/title (restricted profiles).
4. Decide the **intake channel** (shared Drive folder? upload endpoint? email-in?). This is a product/ops choice — surface to the human.

### Phase 2 — Central enrichment (L2)
5. Parse the coach's `Connections.csv` → extract the **profile URL column** into a URL list. (Dedupe; drop rows with no URL.)
6. Call the actor over that list (batched) via the REST path in §4. Respect the **free $5/month ceiling** — at $0.004 each, 1,250 profiles/month is the free cap; log and pause if a run would exceed remaining budget rather than silently truncating.
7. Persist partial results as they arrive (Rule 10 `_partialItems` if built as a module) so a timeout on a large network doesn't lose everything.

### Phase 3 — Normalize & store
8. Map each profile object → a clean career record. Minimum fields to keep per role: `person_name, person_linkedin_url, position, companyName, startDate.text, endDate.text, duration, description`. Keep `education[]` (school, degree, field, years) if in scope; drop logos/media.
9. Store with **provenance on every record**: `source = "harvestapi/linkedin-profile-scraper"`, `observed_at = <run timestamp>`, `profile_url`. This is what lets you re-run and detect changes, and satisfies data-hygiene/GDPR record-keeping.
10. Output format: CSV/JSON for a spreadsheet, OR feed into the pipeline pool via **`csv-discovery`** if this should live inside the content pipeline.

### Phase 4 — Verify
11. Run the **Sema acceptance test** (§3) through the finished path. Green = 11 roles, correct dates.

---

## 7. Fit with the existing pipeline (repo conventions)

- **This is not a new specialized module by default.** Per the project's architectural commitments (small generic modules, config over code), the enrichment call is a **provider config on the already-specced `api-fetcher` / `dataset-fetcher` briefs** (`docs/submodule-briefs-rev-2026-07-03/`). Apify HarvestAPI = one provider config. Only build a bespoke module if a config genuinely can't express it.
- **Rule 3:** all HTTP goes through `tools.http`, never raw fetch/axios.
- **Rule 10:** push `tools._partialItems` after each batch.
- **Retire, don't extend, the repo's existing `linkedin-profile-scraper` module** (the logged-in Hetzner-Chrome / `li_at` one). It is the fragile account-risk route this design replaces; its sibling jobs endpoint is already dead. Do not build L2 on top of it.
- **Manifest contract** (if it does become a module): `item_key`, `data_operation_default`, `pool_precondition`, `cost` are all mandatory. Likely shape: an enrichment that adds career data onto existing contact items → `data_operation_default: "add"` (net-new career records) or `"transform"` (enrich existing contact rows) depending on pool design; `pool_precondition: "requires_items"` (needs the seed URLs); `cost: "medium"` or `"expensive"` (network I/O, possibly hundreds of profiles).

---

## 8. Legal / compliance (must be in the plan, not an afterthought)

- **GDPR (coaches & contacts are in Sweden/EU):** enrichment of personal data needs a lawful basis. For a coach enriching their *own* professional network for legitimate professional use, legitimate-interest is the usual basis — **but if any of this data is used for outreach/marketing, opt-out handling and a privacy notice are required.** Flag this to the human; it's a product/legal decision, not a coding one.
- **Consent boundary:** the coach relationship + the coach's own connection to the person is the consent story. Do **not** enrich people outside that (no buying random URL lists).
- **LinkedIn ToS:** cookie-free third-party scraping of public profiles sits in a legal grey zone (post-*hiQ v. LinkedIn*), and it does keep the coaches' accounts safe — but it is still against LinkedIn's ToS as a platform matter. The risk lives on the third-party provider, not on the coaches. State this plainly in the plan; don't pretend it's fully clean.
- **Retention:** store `observed_at`; define a re-fetch / expiry policy so records don't silently rot. Keep the dataset access-controlled.
- **Never** store or expose the Apify token in module code, logs, or client-visible output.

---

## 9. Failure modes & fallbacks (design defensively)

| Failure | Handling |
|---------|----------|
| Apify account flagged → "Too many outstanding invoices" | Use a clean account. Don't try to run paid actors on a card-blocked account. |
| Free $5/month exhausted | Runs blocked till reset. Budget-gate before large runs; log what was skipped (no silent truncation). |
| Actor breaks (LinkedIn markup change — the whole store had a mass breakage in June 2026) | Have a **fallback provider** ready: PDL (best single-person identity+history, set `min_likelihood >= 6`) or Coresignal (bulk). These are paid APIs → also `api-fetcher` configs. |
| Profile private / URL dead | Actor returns empty for that URL. Skip, log, don't fail the batch. |
| Dates missing month | `startDate`/`endDate` may be `{year,text}` only or `{text:"Present"}`. Normalizer must tolerate. |
| Missing company/title rows in `Connections.csv` | Normal for restricted profiles. Drop rows with no URL; keep the rest. |

---

## 10. Open decisions to surface to the human (strategic, not the planner's to invent)

1. **Standalone tool vs pipeline module?** A spreadsheet-in / spreadsheet-out script is enough for "one coach here and there." A pipeline module is only worth it if this becomes routine/high-volume. Default to the smaller thing.
2. **Where does enriched data live?** Spreadsheet, Supabase, the pipeline pool, a CRM? Drives Phase 3.
3. **How do coaches submit exports?** Shared folder / upload / email-in.
4. **Scope beyond jobs?** Just career history, or also education/skills/recommendations? (All are in the payload for free.)
5. **Is any of this used for outreach?** If yes → GDPR opt-out + notice obligations kick in (see §8).

---

## 11. One-call reference (copy-paste to reproduce the proof)

```bash
curl -s -X POST \
  "https://api.apify.com/v2/acts/harvestapi~linkedin-profile-scraper/run-sync-get-dataset-items" \
  -H "Authorization: Bearer $APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"profileScraperMode":"Profile details no email ($4 per 1k)","urls":["https://www.linkedin.com/in/sema-schmidt-204b991/"]}'
```
Expect: JSON array, one object, `experience[]` with 11 roles. Cost ~$0.004.
