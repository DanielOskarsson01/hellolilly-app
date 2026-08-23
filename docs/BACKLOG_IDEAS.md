# HelloLilly — Backlog Ideas

This file holds **not-yet-specced product ideas** captured during planning, so they survive as a doc of record rather than living only in chat.

**Each entry below is an IDEA, not a commitment or a spec.** Nothing here is scheduled, designed, or approved to build. It is a holding pen so good ideas are not lost between sessions.

**Standing constraints they inherit when specced.** When any idea here is taken forward into a real spec, it inherits the standing constraints already recorded in the decisions:
- **D21** — LinkedIn/social scraping posture and local data ownership: no logged-in scraping ever; enrichment only of a data-owner's own network, run by/for that owner; the full data stays local to its owner; only the minimum crosses any boundary. See `docs/DECISIONS_ADDENDUM.md` (D21).
- **The strategy's no-automated-outreach-to-employers line** — the product prepares, a real person confirms and sends. No automated outreach to employers.
- **The fabrication / consent discipline** — no fabricated claims about a person; real-person data enters only with consent and the real-persons gates (`docs/RETROFIT_LEDGER.md`, the recorded governance review).

---

## 1. Jobseeker network map

A visual map of the **jobseeker's OWN professional network** — distinct from the coach vault (Valvet), which is coach-owned. It shows who the jobseeker knows, where those contacts work, and which companies/industries their network clusters around, so the jobseeker can see their own reach and spot warm paths into target employers.

It extends **beyond LinkedIn to Facebook and other social platforms**, because many jobseekers' real networks are not on LinkedIn — a LinkedIn-only version would exclude exactly the groups the product exists to serve.

**Constraint flag.** Social-platform data access (especially Facebook) is more restricted than LinkedIn. The honest version is likely **user-initiated export / local ownership**, not scraping, and inherits D21 and the real-persons gates.

**Later synergy.** Shares enrichment plumbing with the coach vault (Valvet) — same machinery, **different owner** (jobseeker's own network vs coach's own network).

## 2. Area-based company research

Research all companies in a given **geographic area** (region / travel radius), so a jobseeker can systematically see the employers around them rather than finding companies one advert at a time.

Related to, but **distinct from**:
- **Job Radar** — signal-first (react to signals/postings).
- **Company List** — wishlist-first (curate named targets).
- **This** — **area-first / region-sweep** discovery.

Captured as its own tool note precisely because it is a third discovery axis, not a variant of the other two.

## 3. Staffing-agency (bemanningsföretag) section

A curated section of staffing agencies with **direct links**, and possibly **assisted CV submission**. Staffing agencies are often the fastest route into work for these jobseekers, and reaching them today is manual and scattered.

**Constraint flag — IMPORTANT.** "Automatic CV submission" collides with the strategy's **no-automated-outreach line** and the **consent discipline**. The honest design is **ASSISTED submission** — the system prepares, the person confirms and sends — **not** truly automatic. Direct links are clean; auto-send needs the person's real sign-off by construction.
