# CV Builder reverse-engineering and replacement package

Prepared: 17 July 2026

## Outcome

Shortlisted has been traced from public landing/auth through profile ingestion, job analysis, generation, export, saving, billing, support, content, analytics, and administration. One user-authorized authenticated run confirmed the real profile → analysis → CV/cover-letter/LinkedIn generation path. No personal CV content is reproduced, and no generated application was saved or downloaded during the test.

The evidence establishes **Lovable involvement** and makes a Lovable-built/integrated Shortlisted highly likely, but the browser cannot prove authorship or frontend hosting. I could not identify a current public builder named exactly “Hello Lily.” The replacement package remains platform-portable and explains how to use a different private builder safely.

## Read in this order

1. [Shortlisted functional reverse engineering](./01-shortlisted-reverse-engineering.md)  
   Current screens, routes, stack, functions, data surfaces, score, generation/export, subscriptions, analytics, and reproduced defects.

2. [Better CV Builder architecture](./02-better-cv-builder-architecture.md)  
   Complete target product, services, API, storage, AI pipeline, deterministic scoring, learning, privacy/security, billing, observability, failures, tests, and phases.

3. [Reference Supabase/PostgreSQL schema](./03-reference-schema.sql)  
   48 tables plus relationships, indexes, RLS/minimum grants, private-storage strategy, immutable requirement/atom analyses and documents, atomic usage reservation, leased operations/outbox, model telemetry, portable data exports, audit, support, and deletion orchestration.

4. [AI contracts and prompts](./04-ai-contracts-and-prompts.md)  
   Strict typed contracts and original prompts for fact extraction, requirement parsing, evidence classification, clarification, generation, claim validation, localization, injection defense, and eval gates.

5. [CV-tailoring learnings](./05-cv-tailoring-learnings.md)  
   Practical rules for reading a job advert, matching evidence, adjusting a CV truthfully, ATS parseability, user learning, fairness, and measurement.

6. [Lovable/Hello Lily build plan](./06-build-plan-for-lovable-or-hello-lily.md)  
   Platform capability test, production topology, repo layout, configuration, migrations, epics, acceptance criteria, CI/CD, deployment, runbooks, costs, and a 12-prompt Lovable construction sequence.

7. [OpenAPI reference](./07-openapi.yaml)  
   A parse- and lint-validated OpenAPI 3.1 core contract with 40 paths, 49 operations, and 53 reusable schemas, including reload/history, atom-level analysis, typed editing, export, and deletion; auxiliary account, consent, support, billing-provider, admin, URL-import, and worker APIs remain specified in the architecture.

## Five decisive findings

1. **The current product is not mysterious infrastructure.** It is a React SPA over Supabase Auth/Postgres/Storage/Edge Functions, AI calls, Stripe, and browser-side Word generation. That is reproducible with ordinary components.

2. **Its score is not trustworthy as rendered.** The controlled run produced a mathematically correct 65 from the visible components, while another total/label used 70. Multiple score authorities are mixed in the UI.

3. **The real moat should be provenance, not prompting.** A source-linked career fact ledger, reviewed job requirements, claim IDs, deterministic arithmetic, and post-generation validation make the product safer and more valuable than merely generating polished text.

4. **“ATS optimization” should become measurable parseability.** Generate DOCX and PDF from one canonical document model, extract them again, compare content/order, and show the plain-text preview. Do not claim one universal ATS score.

5. **Learning must not rewrite history.** Learn the user's style, density, layout, and accepted edits. New dates, titles, skills, metrics, credentials, scope, or outcomes require explicit fact confirmation.

## Recommended first release

Ship a trustworthy narrow product before a feature-rich clone:

- Swedish and English;
- PDF/DOCX source extraction with OCR fallback;
- reviewed Career Library facts and source spans;
- pasted job descriptions;
- reviewed requirements and transparent category coverage;
- up to five clarification questions;
- one structured, evidence-grounded CV editor;
- one safe single-column template;
- validated DOCX and PDF;
- correct trial/plan/usage ledger;
- real export/deletion/consent flows.

Add cover letters, outreach messages, URL import, multiple templates, application outcomes, blog/admin breadth, and pooled learning only after the truth and privacy layers pass their release gates.

## Source boundary

Observed current-product claims come from the live application, browser-delivered assets, public pages/policies, and the authorized authenticated workflow. Hidden source code, backend implementation, model prompts, vendor agreements, RLS, webhook internals, and production configuration were not available and are not represented as known.

Recommended CV behavior is cross-checked against official/primary material including:

- [Europass CV guidance](https://europass.europa.eu/en/create-europass-cv)
- [Greenhouse resume-parser failure guidance](https://support.greenhouse.io/hc/en-us/articles/200989175-Unsuccessful-resume-parse)
- [Lever resume-parsing guidance](https://help.lever.co/hc/en-us/articles/20087345054749-Understanding-Resume-Parsing)
- [Oxford criteria-evidence guidance](https://www.careers.ox.ac.uk/demonstrate-you-fit-the-job-criteria)
- [MIT resume guidance](https://capd.mit.edu/resources/resumes-writing-about-your-skills/)
- [Arbetsförmedlingen CV guidance](https://arbetsformedlingen.se/for-arbetssokande/cv-ansokan-och-intervju/skriva-cv)
- [GDPR text](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- [Swedish PTS cookie guidance](https://pts.se/internet-och-telefoni/kakor-cookies/)
- [OWASP file-upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [NIST Secure Software Development Framework](https://csrc.nist.gov/pubs/sp/800/218/final)

Weights, thresholds, latency goals, retention durations, and quality targets in this package are clearly identified as proposed product decisions. They are not presented as universal standards or legal conclusions. Privacy/consumer/AI-law implementation should receive qualified Swedish/EU legal review before launch.
