# Swedish Course + Labour-Demand Data Sources — for the Education & Re-skilling area

**Date:** 2026-06-30
**Status:** Verified data-sourcing report (decision-ready)
**Companion to:** `../product-vision/HelloLilly_Education_Reskilling_Area.md`
**Method:** multi-agent discover → fetch-and-verify → synthesize. 35 candidate sources found; 22 confirmed live/likely.
**Verification caveat (read first):** the core catalogue + taxonomy + statistics sources were probed live and **confirmed** (Susa-navet v3, Skolverket Planned Educations, SCB PxWeb v2, JobTech Taxonomy reads, SCB UF0701, MYH stats). A batch of verification agents for the **JobTech ad-APIs, ESCO, and Yrkesbarometern** hit a monthly spend limit mid-run and were **not live-probed** (marked `verification: null` / "likely" below) — they are well-documented but should be re-probed before integration. The skeptic critique at the end flags the soft spots — chiefly **Tool 4 (validering) is effectively unsourced**.

---

# HelloLilly Education & Re-skilling — Data Sourcing Report

## 1. Verdict on the build-blocking unknown

**YES — both halves are solved with live, open, no-key APIs. You can plan the integration step now.**

- **Open course/programme catalogue API: YES.** The single best answer is **Skolverket's Susa-navet API v3** (`https://api.skolverket.se/susa-navet/emil3`). It was verified live this round with real unauthenticated `curl` calls: `/api-info` returns `apiStatus: active`, v3.0.2, and data calls returned real records — **272,535 education events** total, **156,121 komvux (VUXGY) instances**, **7,332+ providers**, and **YH explicitly covered** (dedicated `YH_EducationLevel` schema). It is one national feed covering komvux + YH + university + Arbetsförmedlingen-procured (AF) training, daily-updated, CC0, no key. This is a genuine, production-grade open API, not a scrape.
- **Demand feed: YES (partly — two complementary live feeds, one a download).** **SCB PxWebApi v2** (`https://statistikdatabasen.scb.se/api/v2`) is verified live (apiVersion 2.3.2, CC0, no key) and serves the post-2024 **LOR "Lediga jobb och rekryteringsbehov"** vacancy/recruitment-shortage tables (TAB6397/6398/6400/6606 confirmed by live metadata calls). The canonical occupation-level **bristindex** — **Yrkesbarometern** — exists and is open, but is a **twice-yearly `.xlsx` bulk download, not a queryable API** (and its verification field is `null` — see §5). As a real-time proxy, **JobTech JobStream/JobSearch/Historical** (open, CC0) give vacancy volume per SSYK.

The one honest caveat: the single most decision-relevant demand source (Yrkesbarometern bristindex) is a periodic file download with `verification: null`, and the headline YH-outcome figures (SCB UF0512, 81% employment) are partly published as PDF/Excel reports rather than a refreshed API table. Both are usable, just not pure REST. Everything required for tools 1, 2, 4, 5 has a verified-live open API.

## 2. Per-tool source map

| Tool | Recommended source(s) | Access model | Format | Confidence |
|------|----------------------|--------------|--------|------------|
| **1. Course-Fit Evaluator** (catalogue by skill/field) | **Susa-navet API v3** (`api.skolverket.se/susa-navet/emil3`) — primary; covers YH + komvux + university + AF training in one feed. Filter via `schoolType` (VUXGY/VUXGYAN = komvux, YH level), `updatedSince` for deltas. | Open, no key | REST JSON (EMIL 3), HAL-paginated | **High** (confirmed-live, real data, 272k events) |
| ↳ supplementary for AF/komvux planned cuts | **Skolverket Planned Educations API** (`api.skolverket.se/planned-educations/v3`) — `/v4/adult-education-events` confirmed live | Open, no key (v3 Accept header) | REST JSON (HAL) | **High** (confirmed-live) |
| ↳ human cross-ref only | yrkeshogskolan.se catalogue | scrape-only (JS SPA) | HTML | **Low** — use Susa-navet instead |
| **2. Skills-Gap → Skills mapper** (taxonomy) | **JobTech Taxonomy API** (`taxonomy.api.jobtechdev.se/v1/taxonomy`) — SSYK-level-4, skill, esco-occupation, esco-skill, SUN-education-field all confirmed as live concept types | **Open for reads** (api-key only governs `/private/` writes — verified: 4 read endpoints returned JSON with no key) | REST JSON + GraphQL | **High** (confirmed-live) |
| ↳ EU-wide reference / crosswalk target | **ESCO Web Service API v1.2.1** | Open, no key (hosted API) | REST JSON (HAL) | **Medium** — `verification: null` (not live-probed this round); EU-official, treat as likely |
| ↳ US reference (optional) | O*NET Web Services v2.0 | **Registration + approval-gated** API key (X-API-Key) | REST JSON | **Medium** — confirmed-live but gated; not needed for Swedish pipeline |
| **3. Demand Signal** (shortage/forecast or ad-volume proxy) | **SCB PxWebApi v2 — LOR tables** (TAB6397/6398/6400/6606) for vacancies/recruitment shortage | Open, no key | REST GET, JSON-stat2/CSV/XLSX/PX | **High** (confirmed-live) |
| ↳ canonical bristindex + 5-yr forecast | **Yrkesbarometern** (dataportal.se dataset `180_10443`; DCAT at `data.arbetsformedlingen.se/prognoser/yrkesbarometer.json.dcat.xml`) | Open, **bulk-download** (.xlsx, twice/yr) | Excel files | **Medium** — `verification: null`; described but not live-probed |
| ↳ real-time ad-volume proxy | **JobTech JobStream** (mirror) + **JobSearch** (queries) + **Historical Ads** (time-series) | api-key (free, JobStream/JobSearch); Historical = **open** | REST JSON | **Medium-High** — all `verification: null` this round, but well-documented and CC0 |
| ↳ jobseeker-interest proxy | JobSearch Trends (daily files) | Open, bulk JSON | Bulk JSON | **Low-Medium** — `verification: null` |
| **4. Validering check** (prior-learning recognition) | **JobTech Taxonomy API** carries `validering`/`other` dataType (occupation↔skill structure that validering maps against) | Open for reads | REST JSON | **Medium** — partial; see §5 |
| ↳ credential/merit exchange | **UHR Beda API** | **Registration + UHR approval + certificate (mTLS)**, institution-only | REST, cert auth | **Confirmed-live but NOT usable** by a third-party app (institution-gated, per-individual records) |
| **5. Pathway outcomes + honest timeline** (YH employment rates) | **SCB UF0512 "Inträdet på arbetsmarknaden"** (81% YH employment, occupational-match share) — headline figures in PDF/Excel reports | Open | PDF/Excel reports + adjacent PxWeb tables (UF0503: TAB5791) | **High** (confirmed-live; nuance below) |
| ↳ structured time-series | **SCB UF0701** YH stats via PxWeb (applicants, admitted, graduates, dropouts) | Open, no key | PxWeb API JSON | **High** (confirmed-live) |
| ↳ YH places/offerings context | MYH Statistik `.xlsx` (utbildningar och platser) | Open, bulk-download | Excel | **High** (confirmed-live, byte-verified) |
| **6. Blended/low-friction mode** | — (UI only, no external data) | n/a | n/a | n/a — ignored for sourcing |

## 3. Access & integration notes

**Truly open, no key, no registration (verified live — use freely):**
- **Susa-navet v3** (`api.skolverket.se/susa-navet/emil3`) — CC0, no `security` block in OpenAPI spec, real data returned unauthenticated.
- **Skolverket Planned Educations v3/v4** — CC0, `securitySchemes: None` confirmed in OpenAPI 3.1.0 spec.
- **Skolverket Syllabus v1** (`/syllabus/v1`), **Skolenhetsregistret v2** (`/skolenhetsregistret/v2`) — CC0, no auth, daily-updated.
- **SCB PxWebApi v2** (`statistikdatabasen.scb.se/api/v2`) — CC0 (`creativecommons.org/.../cc0/` in `/config`), no key. Also serves UF0701 (YH stats) and the LOR demand tables.
- **JobTech Taxonomy API** — open for all read endpoints (api-key gates only `/private/` writes). EPL-2.0 software licence; taxonomy content open/CC0.
- **JobTech Historical Ads API** — open, no key (confirmed in notes).

**Free API key required (low friction — `api-key` header from `apirequest.jobtechdev.se`):**
- JobTech **JobSearch**, **JobStream**, **JobAd Enrichments**. JobStream `/stream` has a **1 request/minute** rate limit. JobStream `/snapshot` is ~300 MB.
- **JobEd Connect** — documented as api-key, but verification found the key **not hard-enforced** (unauthenticated POST returned real data). Treat as effectively open / key-recommended.

**Bulk-download only (no queryable API):**
- **Yrkesbarometern** (bristindex) — twice-yearly `.xlsx`; entry point is dataportal.se dataset `180_10443` + the DCAT file (the literal `/data/yrkesbarometer` slug 404'd).
- **MYH Statistik** — static `.xlsx` from `assets.myh.se`; landing page is the stable entry point, exact file paths may change on regeneration.
- **JobSearch Trends** — daily bulk JSON files.

**Registration / approval-gated (NOT usable as open data):**
- **UHR Beda** — formal application + UHR approval + signed terms + passing tests + UHR-issued certificate (mTLS). Institution-only, per-individual grade records, GDPR-bound. **Do not plan against this for an app feature.**
- **O*NET v2.0** — reviewed-approval + X-API-Key. CC-BY (attribution required). Not needed for the Swedish pipeline.
- **EURES** — government-to-government pull model, scraping forbidden, no open outbound jobs API. **Out of scope** — use JobTech for Swedish job data.

**Scrape-only / dead-for-API:**
- **yrkeshogskolan.se** — JS SPA, empty static HTML. Use Susa-navet instead (same data, open API).
- **UHR antagning.se / antagningsstatistik** — web-only forms, SPA refuses non-browser clients, no API/export. University course data is already in Susa-navet.

**Swedish-language:** Essentially everything Swedish-sourced uses **Swedish labels and codes** (SCB: `Kon`, `UtbildnInriktn`, `Tid`; SCB free-text search matches Swedish only — `query=komvux` returns 0, `query=vuxenutbildning` returns 133). Plan for Swedish field names and a Swedish→English label layer if the UI is English. SCB and ESCO offer English where available.

**SSYK/ESCO crosswalk — available and load-bearing:** The **JobTech Taxonomy API** is the join key. Confirmed-live concept types include `ssyk-level-4`, `skill`, `esco-occupation`, `esco-skill`, and `sun-education-field-1..4` + `sun-education-level-1..3`. **Critical caveat from verification:** the taxonomy uses its own internal concept IDs (e.g. `Mvtg_rAs_h9U`) as the canonical key, with SSYK/ESCO as attributes — so joining external datasets (Yrkesbarometern, SCB LOR) is a **mapping step on their SSYK codes onto `ssyk-level-4` concepts**, not a single pre-joined field. The relation-edge query param shape wasn't confirmed (guessed `/relations` params 404'd) — confirm via GraphiQL/Swagger before building the crosswalk.

**The education↔occupation bridge (the magic glue):** **JobEd Connect** (`jobed-connect-api.jobtechdev.se`, OpenAPI v1.4.5) was confirmed live with a real `POST /v1/occupations/match-by-text` — it takes education knowledge-goal text and returns occupations carrying **SSYK + JobTech taxonomy IDs**. This is exactly the catalogue→occupation→skills bridge tools 1 and 2 need, and it consumes Susa-navet education data internally.

## 4. The data-integration step plan (course-fit submodule)

Framework-consistent: the submodule reads `gaps` → queries catalogue + taxonomy + demand → writes `learningPlan`. Build in this order so each layer has a verified foundation before the next.

**Step 0 — Skills-taxonomy backbone first (cache, refresh quarterly).**
Ingest the **JobTech Taxonomy** as the controlled vocabulary. Cache locally: `ssyk-level-4`, `skill`, `esco-occupation`/`esco-skill` (for the ESCO crosswalk), `sun-education-field-*`/`sun-education-level-*`. This is the join key for every other layer. Resolve the relation-edge param shape via GraphiQL before relying on SSYK↔ESCO traversal. Source is versioned — pin a version, store the version string, re-pull quarterly.

**Step 1 — Catalogue mirror (cache, refresh daily via deltas).**
Ingest **Susa-navet v3** `/educationEvents` into a local DB. Use the `updatedSince`/delta parameter for daily incremental fetch (don't naive-pull 272k records). Store per instance: name, description, SUN education-field/level, `schoolType` (YH / VUXGY komvux / university / AF training), provider, location, dates, eligibility. Tag each record with its SUN concept → this is what makes it queryable by skill/field. Paginate via HAL links. (Add **Planned Educations `/v4/adult-education-events`** only if you find komvux/AF cuts Susa-navet doesn't carry.)

**Step 2 — Education→occupation→skill bridge (cache derived links).**
For each catalogue entry (or each gap), call **JobEd Connect** `POST /v1/occupations/match-by-text` (education/knowledge-goal text → occupations with SSYK + skills) and `match-by-education`/`match-by-occupation` for the reverse. Cache the derived `course → {SSYK occupations, in-demand skills}` map. This lets the submodule answer "which courses close this skill gap" without re-deriving each run.

**Step 3 — Demand signal (cache, refresh per source cadence).**
Two layers, joined on SSYK:
- **Forecast/shortage:** ingest **Yrkesbarometern** bristindex `.xlsx` (twice/yr) → per-SSYK shortage-vs-surplus + 5-yr outlook. This is the primary ranking signal.
- **Current vacancies:** **SCB LOR** (TAB6397 etc., quarterly) for recruitment-shortage by occupation group, and/or **JobTech JobSearch/Historical** for live ad-volume per SSYK as a finer-grained proxy.
Map all demand records' SSYK codes onto the taxonomy's `ssyk-level-4` concepts (the mapping step from §3).

**Step 4 — Validering + outcomes enrichment (cache).**
- **Validering:** attach the taxonomy `validering`/occupation-skill structure per occupation. (No clean open per-programme validering API exists — see §5; flag fields as "not yet sourced" rather than faking them.)
- **Outcomes/honest timeline:** join **SCB UF0701** (YH applicants/admitted/graduates/dropouts, study length) for the timeline, and **SCB UF0512** (81% employment, occupational-match share) for the honest outcome. Where UF0512's freshest figures are PDF/Excel-only, cache the structured **UF0503/TAB5791** tables for the API-available series and surface the report figure as the headline.

**Step 5 — Ranking & `learningPlan` output.**
The submodule, given `gaps`: (1) map gaps → skills/SSYK via the taxonomy; (2) query the cached catalogue for courses tagged with those skills/SUN fields; (3) enrich each candidate course with its JobEd-Connect occupation/skills, its demand score (bristindex weight + vacancy volume), validering flag, and outcome stats (employment rate + realistic duration); (4) rank courses by `(gap-closure × demand-score × outcome-rate)`; (5) write `learningPlan` with the honest timeline and a confidence note where data is bulk/stale.

**Caching summary:** taxonomy = quarterly; catalogue = daily delta; JobEd-Connect links = derived/on-demand-then-cache; bristindex = twice/yr; LOR = quarterly; outcomes = annual. Respect **SCB 30 calls/10s + 150k cells/call**, **JobStream 1 req/min**.

## 5. Gaps & risks

**Tools still lacking a clean real source:**
- **Tool 4 (Validering check) — weakest.** There is **no verified open per-programme/per-occupation prior-learning-recognition API**. UHR Beda is confirmed-live but **institution-gated (certificate/mTLS, per-individual records, GDPR)** — unusable for an app feature. The JobTech Taxonomy carries a `validering` dataType but that's occupation/skill structure, not "this YH programme grants validering for X." **Recommendation: scope Tool 4 as taxonomy-backed guidance now, flag per-programme validering as an open data gap, do not fabricate it.**
- **Tool 3 (Demand) — usable but no single clean API.** The canonical bristindex (**Yrkesbarometern**) is `.xlsx` bulk-download with `verification: null` (described, not live-probed this round). SCB LOR is the live-API fallback, but verification noted the **shortage-BY-OCCUPATION-GROUP cut wasn't individually enumerated** — re-confirm that specific table before depending on it. **SCB Arbetskraftsbarometern is DISCONTINUED (frozen at 2023)** and, per verification, its tables are **only in legacy PxWeb v1, NOT v2** (the candidate's "v2" claim is wrong) — use it as a historical signal only, plan v1-deprecation risk.

**Sources that turned out dead / scrape-only / mislabelled:**
- **yrkeshogskolan.se** = JS SPA, "scrape-only" but effectively empty on static fetch → **use Susa-navet** (same data, open API). The candidate's "scrape-only" label is technically true but misleading.
- **UHR antagning.se / antagningsstatistik** = web-only, SPA refuses non-browser clients, **no API** → university data comes from Susa-navet instead.
- **EURES** = no open outbound jobs API, scraping forbidden, government-to-government only → **out of scope**; use JobTech for Swedish jobs.
- **UHR Beda** = real and live but registration/certificate-gated, institution-only → not an app data source.

**`verification: null` sources (described in JSON but NOT live-probed this round — treat as likely, confirm before building):** JobTech JobSearch, JobStream, Taxonomy (first listing), Historical Ads, JobAd Enrichments, JobEd Connect (first listing — though a *later* duplicate listing WAS confirmed live), Yrkesbarometern, JobTech Historical Job Ads, JobSearch Trends, ESCO Web Service API, ESCO Bulk Download, SSYK Hierarchy dataset. The JobTech APIs are well-documented and CC0, so risk is low — but the only **demand source that was fully live-verified is SCB PxWebApi v2**; Yrkesbarometern specifically should be downloaded and inspected before being made the ranking backbone.

**Licence concerns:**
- **MYH Statistik `.xlsx`** — no explicit open-data licence printed on the page (Swedish agency public data, freely downloadable, but reuse terms not stated inline). **Confirm with `statistikservice@myh.se` before redistribution.**
- **Yrkesbarometern** — "likely CC0" but confirm exact CC term per edition in the DCAT metadata.
- **JobSearch Trends / Historical bulk** — "confirm exact CC term in dataset metadata."
- **O*NET** — CC-BY, **attribution required** if used.
- **ESCO** — EU open terms, exact licence text not stated on the download page; verify before redistribution. Bulk download needs an email (light registration).
- Everything Skolverket (Susa-navet, Planned Educations, Syllabus, Skolenhetsregistret) and SCB is **CC0, clean** — no attribution required, safe to redistribute.

**Operational risks to flag for the integration step:**
- **Version churn:** Susa-navet legacy `/susanavet` host + EMIL2 retired ~April–May 2026 → target `emil3` paths only. SCB PxWeb v1 deprecating in favour of v2 (but Arbetskraftsbarometern is v1-only). Skolverket Syllabus stable is **v1**, not the v2 the candidate cited (v2 is alpha). Pin versions, watch deprecations.
- **Swedish-only search semantics** (SCB free-text matches Swedish labels) — a naive English query falsely looks empty.
- **Bulk file path instability** (MYH, Yrkesbarometern) — anchor on landing/dataset pages, not hardcoded file URLs.

---

**Bottom line for the team:** Start building. The catalogue (Susa-navet v3) and taxonomy (JobTech) backbones are open, CC0, verified-live, and key-free — wire those two first, add JobEd Connect for the education→occupation bridge, layer SCB outcomes (UF0701/UF0512) and demand (LOR + Yrkesbarometern download) on top. The only genuine sourcing gap is per-programme **validering** (Tool 4) — plan it as a flagged gap, not a fabricated field.

Relevant source URLs cited above are all from the provided JSON; no sources were invented.

---

## Skeptic critique (completeness check)

I have enough to assess the report skeptically. The key facts hold: SUSA-navet covers YH and is the correct primary catalogue source; Yrkesbarometern is download-only (twice/yr, June/Dec); validering has no clean per-programme open API; the JobTech Taxonomy is the right taxonomy backbone. Let me give the skeptical assessment.

---

- **Tools still lacking a verified-live source: #3 (Demand) partially, and #4 (Validering) substantively.** For #3, the only fully live-probed demand source is SCB PxWeb v2 (LOR vacancies); the *canonical* signal (Yrkesbarometern bristindex + 5-yr forecast) is `verification: null` and download-only — the report is honest about this, but it means the demand *ranking backbone* is unverified. For #4, the report's own conclusion is correct and well-flagged: there is **no verified open per-programme/per-occupation validering API** — UHR Beda is gated, and the JobTech Taxonomy "`validering` dataType" is a thin reed (it carries occupation↔skill structure, not "this YH programme grants RPL for X"). Tool 4 is effectively unsourced and the report says so.

- **Over-claim on JobTech Taxonomy as a "Medium" source for Tool 4 (§2/§4).** This is the report's softest spot. Listing the taxonomy as a partial validering source dresses up a gap as a half-solution. The taxonomy gives you the skills vocabulary (Tool 2), not prior-learning recognition. The §5 caveat is honest, but the §2 table row and Step 4 ("attach the taxonomy validering structure per occupation") overstate it — there's no evidence the taxonomy encodes programme-level RPL. Treat Tool 4 as **unsourced**, full stop.

- **JobTech Taxonomy "open reads" claim is plausible but only partially verified.** The report says reads are key-free and only `/private/` writes need a key; I couldn't independently confirm the per-endpoint auth split from the Swagger this round (the report claims 4 read endpoints returned JSON unauthenticated, which is the kind of thing worth re-probing, but it's a believable and low-risk claim). Not an over-claim, just lean evidence.

- **MAJOR Swedish sources — coverage is actually strong; the big ones are all present.** SUSA-navet (confirmed as the correct YH+komvux+university+AF national feed — verified: it explicitly spans "primary school to adult education and vocational higher education"), JobTech Taxonomy, ESCO, SCB PxWeb, Yrkesbarometern, MYH stats are all covered. **antagning.se/UHR is correctly handled, not missed** — flagged as web-only/SPA with no API, with SUSA-navet as the substitute. **ESCO bulk download is present** (with light email registration noted). No major source is missing.

- **One real omission worth flagging: Arbetsförmedlingen's own Platsbanken/JobSearch is the de-facto live demand proxy and is slightly under-weighted vs. the dead-end LOR/bristindex chase.** The report does list JobTech JobSearch/JobStream/Historical as the ad-volume proxy, so it's not missed — but given the canonical bristindex is download-only and `null`-verified, the *live* demand signal for #3 should lean on JobTech ad-volume as primary, not as a third-tier "↳" fallback. Priority inversion, not an omission.

- **No egregious "open" mislabels — the gated/scrape-only sources are correctly demoted.** UHR Beda (cert/mTLS, institution-only), O*NET (registration + X-API-Key), EURES (gov-to-gov, no open API), yrkeshogskolan.se and antagning.se (scrape-only SPAs) are all correctly excluded from the "open" tier. The one to watch: **JobEd Connect** is called "effectively open / key not hard-enforced" — that's an over-optimistic read of an undocumented gap; an API key that's documented-but-unenforced can start being enforced at any time, so don't architect a load-bearing education→occupation bridge on the assumption it stays key-free.

- **Verification honesty is good but the demand layer is thinner than the "YES" verdict implies.** The headline "Demand feed: YES" rests on SCB LOR (live) plus two `null`-verified sources doing the real work (Yrkesbarometern for forecast, JobTech for live volume). Reasonable, but the verdict's confidence outruns the evidence for the *forecast/shortage* dimension specifically. Re-probe Yrkesbarometern (download + inspect) and the JobTech APIs before treating #3 as solved.

Sources: [SUSA-navet API (Skolverket)](https://www.skolverket.se/om-skolverket/oppna-data/api-for-utbildningstillfallen-susa-navet/susa-navet---nationell-databas-for-utbildningar), [Yrkesbarometern (JobTech)](https://jobtechdev.se/sv/nyheter/yrkesbarometern), [Yrkesbarometer dataset (dataportal.se)](https://www.dataportal.se/datasets/180_10443), [JobTech Taxonomy](https://taxonomy.api.jobtechdev.se/), [MYH validering](https://www.myh.se/validering-och-seqf/for-dig-som-vill-validera-din-kompetens/validering-for-utbildning)