# REST OF SITE — Data Contract Addendum (v0.1, draft)

**Date:** 2026-07-07 · **Extends:** `DATA_CONTRACT.md` v0.4 (the case object). Nothing in v0.4 changes.
**Purpose:** the noun vocabulary for the remaining site tools (`HELLOLILLY_REST_OF_SITE_PLAN_v3.md`), defined once so backend and frontend build to one shape. Shapes were decided against the repo as it stands (main @ `1d53491`): the store's **collections** mechanism (`putRecord`/`getRecord`/`listRecords`/`removeRecord`, durable via the SQLite adapter) is the storage substrate for everything below that is STORED; the case-part envelope machinery is untouched.
**Reads with:** `REST_OF_SITE_RECONCILED_DESIGN.md` (which tool uses what), `WAVE_1_BACKEND_BUILD_BRIEF.md`.

---

## 0. Conventions (apply to every shape; per-shape sections state only deviations)

- **STORED vs DERIVED.** STORED = records in a named store collection. DERIVED = a computed read model answered by an endpoint at request time, never persisted (the `crosslinks` precedent from v0.4 §5). The decision is made per shape below from what the repo supports.
- **Ids.** Minted via the existing `mintId(kind)` → `<kind>_<8-hex>`; the KINDS set in `server/skeleton/ids.cjs` grows by the kinds introduced here (§20). References are typed `{ kind, id }` exactly as v0.4 §2.1; a reference into a case carries `{ kind, id, caseId }`.
- **Owner.** Every STORED record carries `owner` (default `'self'`), mirroring `meta.owner` — multi-user stays additive. "Owner/case relationship" below states whether records belong to a case, reference cases, or are case-free.
- **Status envelope usage.** The `{status,data,error?,updatedAt}` envelope remains the **case-part** mechanism. Collection records are plain records with a domain `status` field where lifecycle exists. Two envelope uses recur: (a) records that carry an **AI-produced payload** wrap that payload in an envelope-shaped sub-object (`{ status:'absent'|'pending'|'ready'|'failed', data, error? }`) so screens reuse the exact loading/error scaffolding; (b) **DERIVED read models return envelope-per-block**, so one failing block degrades honestly instead of faking a number.
- **Timestamps.** `createdAt`/`updatedAt`: system-set ISO-8601, `createdAt` immutable, `updatedAt` bumped on any change. Neither user nor AI input ever sets them.
- **Writability classes.** Per shape: **user-writable** (set via UI actions), **AI-writable** (produced by an LLM path — always through the writing-rules gate before `putRecord` when it is authored prose; verbatim person-words are gate-exempt evidence like datafacts), **system-writable** (computed/stamped by host code). A field appears in exactly one class.
- **Deletion vocabulary.** `hidden: true` = removed from display surfaces, data kept (activity's model). `archived: true` = out of active lists, retrievable. Hard delete = record (and any binary) destroyed — offered only where privacy demands it (imageAssets, interviewSessions/Answers).
- **Feeds.** "Feeds Progress Support" = emits taxonomy events (§T) and/or is read by planner/next-step. "Feeds learning layer" = a future Hive/Outcome consumer may read it cross-case (a flag on intent, not a built pipe).
- **List responses.** `GET` list endpoints return `{ ok: true, records: [...] }`; errors `{ ok: false, error }`. Mutations return the updated record.

---

## 1. activity — STORED (collection `activity`)

- **Purpose:** the automatic, supportive event log every real action emits — Progress Support's substance, Case Record's spine, the learning layer's future food.
- **Id:** `activity_<8hex>`. **Owner/case:** owner-scoped; MAY reference a case (`caseRef`) and always references its target object.
- **Envelope:** none (plain records; system-authored display params, no AI prose).
- **Fields:**
  - required: `id`, `owner`, `event` (taxonomy name, §T), `sourceTool` (§T), `target` (`{kind,id,caseId?}`), `params` (object of i18n interpolation values: company, role, count, language…), `hidden` (default `false`), `createdAt`
  - optional: `caseRef`, `dayKey` (YYYY-MM-DD, system, for week views)
- **Writable:** user — `hidden` only. AI — nothing. System — everything else, emitted at the **API/host layer only** (single chokepoint; submodules never write activity).
- **Timestamps:** `createdAt` only; activity records are immutable apart from `hidden` (no `updatedAt` semantics worth having).
- **Deletion:** never deleted; `hidden` per item (the plan's "the person can hide any logged item"). Hidden events still count in honest aggregates ("what the hive is already collecting") but never render in feeds.
- **Feeds Progress Support:** IS Progress Support. **Feeds learning layer:** yes (primary).

## 2. planner — STORED (collection `planner`)

- **Purpose:** the "one next step" state: system-suggested next actions (rule-based: oldest unfinished thread wins), max one active per day, user-snoozable — Home's centrepiece card and Progress Support's top block.
- **Id:** `plannerItem_<8hex>`. **Owner/case:** owner-scoped; references the thread it points at (a case, a company, an outreach contact…).
- **Envelope:** none.
- **Fields:**
  - required: `id`, `owner`, `kind` (`'next-step'` now; `'reminder'` reserved for H2's in-app surface), `titleKey` + `params` (i18n, like activity), `target` (`{kind,id,caseId?}`), `deeplink` (route string), `status` (`'suggested' | 'done' | 'snoozed' | 'dismissed'`), `forDay` (YYYY-MM-DD), `createdAt`, `updatedAt`
  - optional: `snoozedUntil`, `sourceRule` (which rule fired — the future learner's food), `effortMinutes`
- **Writable:** user — `status`, `snoozedUntil`. AI — nothing (the selection rule is deterministic code, no ML/LLM). System — the rest.
- **Deletion:** no delete; terminal states are `done`/`dismissed`. At most one `suggested` per owner per `forDay` — enforced at write.
- **Feeds Progress Support:** yes (it is the next-step mechanism; completing one emits an activity event). **Learning layer:** yes (`sourceRule` × outcome).

## 3. companies — STORED (collection `companies`)

- **Purpose:** the person's curated employer list (B1) — the launchpad card for research, blind applications and outreach.
- **Id:** `company_<8hex>`. **Owner/case:** owner-scoped, case-free; other records reference it via `companyRef`.
- **Envelope:** the `whyRelevant` line, when produced from a dossier, carries `whyRelevantSource` (a dossier paragraph ref) — content selected, not authored; no envelope needed.
- **Fields:**
  - required: `id`, `owner`, `name`, `source` (`'manual' | 'from-job' | 'suggested'`), `status` (`'interested' | 'contacted' | 'waiting' | 'closed'`), `createdAt`, `updatedAt`
  - optional: `orgUrl`, `notes` (user prose), `whyRelevant` (string) + `whyRelevantSource` (`{kind:'paragraph',id,caseId}`), `researchRef` (`{kind:'companyResearch',id}`), `fromJobRef` (`{kind:'job',id}`), `archived`
- **Writable:** user — `name`, `orgUrl`, `notes`, `status`, `archived`, creation. AI — nothing directly (`whyRelevant` is selected dossier text, written by system on research completion with its source ref). System — refs, timestamps.
- **Deletion:** `status:'closed'` for lifecycle; `archived` to leave the grid. No hard delete at MVP (blind applications/outreach may reference it).
- **Feeds Progress Support:** yes (`company.*` events; waiting-state follow-ups feed next-step). **Learning layer:** yes (path patterns).

## 4. companyResearch — STORED (collection `companyResearch`)

- **Purpose:** the durable link between a company (or a standalone research run) and the CASE whose `dossiers` part holds the research — research stays where the researcher writes it (a case part, envelope and all); this record makes it addressable from Company List / Research Helper / Blind Applications without duplicating content.
- **Id:** `companyResearch_<8hex>`. **Owner/case:** owner-scoped; REQUIRED `caseRef`; optional `companyRef`.
- **Envelope:** the research content itself lives in the case's `dossiers`/`decodedRole` envelopes — this record only points.
- **Fields:**
  - required: `id`, `owner`, `caseRef` (`{kind:'case',id}`), `purpose` (`'before-application' | 'before-interview' | 'before-blind-application' | 'before-career-change'`), `createdAt`
  - optional: `companyRef`, `requestRef` (`{kind:'researchRequest',id}`), `updatedAt`
- **Writable:** user — nothing directly (created by the flows). AI — nothing. System — all.
- **Deletion:** archived with its company; never deletes the underlying case.
- **Feeds Progress Support:** via `company.researched` events. **Learning layer:** yes (research→outcome traces).

## 5. blindApplications — STORED (collection `blindApplications`)

- **Purpose:** one spontaneous application (B2): the five-step guided flow's persistent state — company, angle, recipient, message, follow-up, outcome.
- **Id:** `blindApplication_<8hex>`. **Owner/case:** owner-scoped; references `companyRef` (required) and the research case.
- **Envelope:** `message` is an envelope-shaped sub-object (AI-drafted, resumable): `{ status, data: { language, paragraphs: [string], unsupported_by_cv: [string] }, error? }` — the exact `coverLetter` shape reused.
- **Fields:**
  - required: `id`, `owner`, `companyRef`, `step` (`1..5`), `status` (`'draft' | 'ready' | 'sent' | 'closed'`), `createdAt`, `updatedAt`
  - optional: `researchRef` (`{kind:'companyResearch',id}`), `angle` (`{ cvAngle: string, angleSource: {kind:'gap'|'decodedRequirement',id,caseId}? }`), `recipient` (`{ name?, role?, channel: 'email'|'linkedin'|'form'|'other', address? }` — **typed by the person, never looked up**), `message` (envelope above), `followUpOn` (date), `sentAt`, `outcome` (`{ code: 'reply-positive'|'reply-negative'|'no-reply'|'meeting'|'other', note? }`)
- **Writable:** user — step progression, `recipient`, message edits (their edited text replaces `data.paragraphs`; edits are the person's words), `followUpOn`, `sentAt`, `outcome`, `status`. AI — the initial `message.data` via `writer` (gated; `unsupported_by_cv` mandatory). System — refs, timestamps, activity emission.
- **Deletion:** `status:'closed'` + `archived`; no hard delete (outcomes are learning food).
- **Feeds Progress Support:** yes (`blindapp.*`; `followUpOn` feeds next-step). **Learning layer:** yes (angle × outcome — core signal).

## 6. outreach — STORED (collection `outreach`)

- **Purpose:** the contact plan (E2): who, why, order, message, follow-up, kanban state.
- **Id:** `outreachContact_<8hex>`. **Owner/case:** owner-scoped; optional `companyRef`.
- **Envelope:** `draft` is envelope-shaped when AI-drafted (same reuse as §5).
- **Fields:**
  - required: `id`, `owner`, `name`, `relationship` (`'warm' | 'cold'`), `lane` (`'planned' | 'sent' | 'replied' | 'done'`), `createdAt`, `updatedAt`
  - optional: `role`, `companyRef`, `whyThem`, `channel` (`'linkedin'|'email'|'phone'|'other'`), `contactClass` (register hint, added by D10: `'recruiter'|'former_colleague'|'cold_senior'|'referral'|'other'` — informs the draft's register and which social rules apply; **the same field is available to B2's recipient step, §5**; honest default carried in its copy: toward recruiters the person is senior talent, not a supplicant, and not replying to low-effort outreach is a valid choice), `priority` (int; rule-derived: warm before cold — system-suggested, user-overridable), `draft` (envelope: `{status, data:{ language, text, unsupported_by_cv:[…] }}`), `avoidNote`, `followUpOn` (default sent+7d, editable), `sentAt`, `repliedAt`, `archived`
- **Writable:** user — everything except timestamps/refs/`priority` initial value (may override `priority`). AI — `draft.data` via writer (gated); never chooses contacts or order. System — timestamps, default `followUpOn`, activity emission.
- **Deletion:** `done` lane + `archived`; no hard delete at MVP.
- **Feeds Progress Support:** yes (`outreach.*`; follow-ups become next-steps — the wireframe's explicit flow). **Learning layer:** yes (sequence × reply outcomes).

## 7. researchRequests — STORED (collection `researchRequests`)

- **Purpose:** the intake record of a Research Helper run (D1): what was asked, with which purpose preset, and which case fulfilled it. Keeps "research as a user-visible tool" separate from the case machinery that executes it.
- **Id:** `researchRequest_<8hex>`. **Owner/case:** owner-scoped; `caseRef` set once the case is created.
- **Envelope:** run progress is read from the case's `dossiers`/`decodedRole` envelopes — the request itself only tracks intake.
- **Fields:**
  - required: `id`, `owner`, `company`, `purpose` (§4 enum), `status` (`'created' | 'running' | 'done' | 'failed'` — a convenience mirror of the case envelopes for list views), `createdAt`, `updatedAt`
  - optional: `role`, `sourceInput` (pasted ad/mail), `caseRef`, `companyRef`, `error`
- **Writable:** user — intake fields at creation. AI — nothing. System — `status`, refs, timestamps.
- **Deletion:** `archived` after done; no hard delete.
- **Feeds Progress Support:** yes (`research.*` events). **Learning layer:** yes (what people research before what outcome).

## 8. interviewSessions — STORED (collection `interviewSessions`)

- **Purpose:** one Interview Trainer practice session (A2): job, style, the question flow, and the honest feedback summary.
- **Id:** `interviewSession_<8hex>`. **Owner/case:** owner-scoped; `caseRef` REQUIRED (the trainer grounds in a case's ad + CV + fit/gaps + dossiers; "session saved to the case" = this ref).
- **Envelope:** `feedback` is envelope-shaped (AI-authored, gated): `{ status, data: { strongMoments: [{ text, answerRef }], weakMoments: [{ text, answerRef }], oneThingToPractise: string }, error? }`. Every feedback item carries an `answerRef` — **feedback cites the person's actual answers or is not written** (the cite-or-refuse rule in trainer form).
- **Fields:**
  - required: `id`, `owner`, `caseRef`, `jobRef` (`{kind:'job',id}` when launched from a job), `style` (one of the seven paper styles — a prompt parameter), `status` (`'in-progress' | 'completed' | 'abandoned'`), `language`, `createdAt`, `updatedAt`
  - optional: `mode` (`'text' | 'spoken'`), `feedback` (envelope), `questionCount`, `completedAt`
- **Writable:** user — abandon/complete, hard delete (below). AI — `feedback.data` (gated, answer-cited); the questions live in §9. System — the rest.
- **Deletion:** **hard delete supported** — "this is practice, nothing is judged or shared without you" is a privacy promise; deleting a session cascades to its `interviewAnswers`. Default lifecycle otherwise: kept, feeding prep.
- **Feeds Progress Support:** yes (`interview.session_completed`). **Learning layer:** yes — but only sessions the user has not deleted; weak moments feed Interview Prep (D2/stages 4–6 later).

## 9. interviewAnswers — STORED (collection `interviewAnswers`)

- **Purpose:** the per-question record inside a session: the asked question (AI), the person's answer (verbatim — their words are evidence, like datafacts), follow-ups, and the weak-answer flag that feeds prep.
- **Id:** `interviewAnswer_<8hex>`. **Owner/case:** owner-scoped; `sessionRef` REQUIRED.
- **Envelope:** none (each record is one settled Q/A turn; the in-flight turn lives client-side until submitted).
- **Fields:**
  - required: `id`, `owner`, `sessionRef`, `seq` (int order), `question` (AI-authored, gated), `answer` (person's verbatim words — **gate-exempt evidence**, stored exactly), `createdAt`
  - optional: `followUpTo` (`{kind:'interviewAnswer',id}`), `questionSource` (`{kind:'gap'|'decodedRequirement'|'paragraph',id,caseId}` — what grounded the question), `weakFlag` (bool, set by the feedback pass, always paired with the feedback item's citation), `answeredVia` (`'typed' | 'spoken'`)
- **Writable:** user — `answer` (their submission). AI — `question`, `weakFlag` (via the cited feedback pass). System — order, refs, timestamps.
- **Deletion:** cascades with session hard delete; no per-answer delete (a session is one artifact).
- **Feeds Progress Support:** no direct events (session-level only). **Learning layer:** yes (weak-answer patterns), respecting deletion.

## 10. imageAssets — STORED (collection `imageAssets`; binaries on disk, never in git)

- **Purpose:** Image Studio state (A3): the uploaded photo, enhancement variants, and approved exports — with the identity line enforced in the shape (no identity-altering parameters exist).
- **Id:** `imageAsset_<8hex>`. **Owner/case:** owner-scoped; case-free.
- **Envelope:** each `variant` is envelope-shaped (enhancement is a long-running job): `{ status, data: { filePath, params }, error? }`.
- **Fields:**
  - required: `id`, `owner`, `kind` (`'source' | 'variant' | 'export'`), `filePath` (under `server/data/uploads/`; system-assigned), `createdAt`, `updatedAt`
  - optional: `sourceRef` (`{kind:'imageAsset',id}` — variants/exports point at their source), `params` (`{ strength: 0..MAX_BELOW_UNCANNY, background: 'original'|'replace:<template>', denoise: bool, relight: bool }` — the ONLY parameter vocabulary; nothing identity-altering is expressible), `template` (`'linkedin' | 'cv' | 'neutral'`), `dimensions`, `approvedAt` (set ONLY via the before/after approval action — an export without `approvedAt` cannot be downloaded), `exifStripped` (bool, system)
- **Writable:** user — upload (creates `source`), parameter choices, the approval action, hard delete. AI/model — the variant binaries (via the enhancement pipeline; parameters are the discipline — no prompt surface exists). System — paths, refs, timestamps, exif handling.
- **Deletion:** **hard delete on user request** (their face, their photo — privacy): destroys record AND binary, cascades source→variants→exports.
- **Feeds Progress Support:** yes (`image.exported` only — uploads are not activity). **Learning layer:** no.

## 11. resources — STORED (collection `resources`)

- **Purpose:** Knowledge Hub items (F2): links/notes/documents with honest counts, suggestion state, and the per-item assistant.
- **Id:** `resource_<8hex>`. **Owner/case:** owner-scoped suggester recorded; the library itself is shared-by-design (single-user today).
- **Envelope:** `assist` is envelope-shaped (AI summary produced on demand, cached): `{ status, data: { summary, howToUse }, error? }`.
- **Fields:**
  - required: `id`, `owner` (suggester), `type` (`'link' | 'pdf' | 'video' | 'note' | 'template'`), `title`, `status` (`'foreslagen' | 'godkand'` — approval visible per item; honestly stuck at `foreslagen` until a coach exists), `createdAt`, `updatedAt`
  - optional: `url`, `body` (note text), `tags` (string[]), `suggestedByRole` (`'jobseeker' | 'coach'`), `approvedBy` (`{kind:'coach',id}` — future), `assist` (envelope), `archived`
- **Writable:** user — suggest/edit own, `archived` own. AI — `assist.data` (grounded in the fetched content, gated). System — status transitions (approval is a coach action, later), timestamps.
- **Deletion:** suggester may archive own unapproved items; approved items archive only (no silent disappearance from a shared library).
- **Feeds Progress Support:** yes (`resource.suggested`). **Learning layer:** yes (which resources help whom — future).

## 12. feedback — STORED (collection `feedback`)

- **Purpose:** the Feedback Loop's suggestions + upvotes (F6) — the person → HelloLilly channel.
- **Id:** `feedback_<8hex>`. **Owner/case:** owner-scoped author; optional context ref.
- **Envelope:** none (user prose, not AI).
- **Fields:**
  - required: `id`, `owner`, `type` (`'suggestion' | 'issue' | 'praise'`), `body` (user prose), `votes` (int, system-maintained), `createdAt`, `updatedAt`
  - optional: `context` (`{kind,id,caseId?}` — what screen/object it concerns), `stage` (taxonomy-style category, reusing the 8-reason structured-capture pattern), `archived`
- **Writable:** user — `body`/`type` at creation, one vote per item (system enforces), retract own (`archived`). AI — nothing. System — `votes`, timestamps.
- **Deletion:** author-retract via `archived`; no hard delete.
- **Feeds Progress Support:** yes (`feedback.submitted`). **Learning layer:** yes (where many get stuck).

## 13. polls — STORED (collections `polls` + votes embedded)

- **Purpose:** one real poll at a time (F6), with the standing Pulse rule ENFORCED IN THE SHAPE'S API: results are never readable before the caller's own vote exists.
- **Id:** `poll_<8hex>`. **Owner/case:** polls are system/HelloLilly-authored; votes are owner-scoped.
- **Envelope:** none.
- **Fields:**
  - required: `id`, `questionKey` + `params` (i18n), `options` (`[{ key, labelKey }]`), `status` (`'open' | 'closed'`), `votes` (`[{ owner, optionKey, at }]` — one per owner, enforced), `createdAt`, `updatedAt`
  - optional: `opensAt`, `closesAt`
- **Writable:** user — exactly one vote per open poll (immutable once cast). AI — nothing. System — poll definitions (seeded via script at MVP), status.
- **API rule (normative):** `GET /api/polls` returns per-option counts ONLY for polls where the caller has a vote; otherwise options without counts. Fixture polls with fixture results exist only inside bannered T4 screens via `demoFixtures`, never in this collection.
- **Deletion:** polls close, never delete; votes immutable.
- **Feeds Progress Support:** yes (`poll.voted`). **Learning layer:** yes (aggregates).

## 14. coachCompetence — STORED (collection `coachCompetence`)

- **Purpose:** the REAL competence table under Coach Network (F3) and Network Match's real seam (E3) — seeded with three fixture cast members **plus one real row (D9): Daniel (pilotcoach)**; the fixture rows flip real by data replacement.
- **Id:** `coach_<8hex>`. **Owner/case:** system-managed roster; not owner-scoped.
- **Envelope:** none.
- **Fields:**
  - required: `id`, `name`, `fields` (string[] — e.g. vård & omsorg; Daniel's row: iGaming, digital product leadership, C-level hiring), `gift` (the paper's "gift" line), `languages` (string[]), `placeholder` (bool — the honesty bit: `true` for the three remaining wireframe-encoded cast members **Karin/Jonas/Amina Platshållare**; `false` for **Daniel (pilotcoach)**, the real row that replaced the fourth cast slot per D9), `createdAt`, `updatedAt`
  - optional: `photoRef`, `note`, `isCoachSelf` (bool — marks the pilot-coach row that the coach-channel adapter routes review requests to; `true` on Daniel's row, D9)
- **Writable:** user — nothing. AI — nothing. System — seed script now (three placeholders + Daniel's real row); admin path when further pilot coaches sign.
- **Display rule (normative):** any surface rendering a `placeholder:true` row is a demo-labelled surface (screen banner or section label per its tool's spec); a `placeholder:false` row (Daniel's) may render unlabelled. "Data changes, not code." **Note (D9):** one real row does not un-banner the Coach Network *directory* — a single coach is not a searchable network (see §4 F3); the per-row honesty (real row unlabelled) and the screen-level banner coexist there.
- **Deletion:** placeholder rows replaced 1:1 by real coaches; real rows archive.
- **Feeds Progress Support:** no. **Learning layer:** later (coach × outcome).

## 15. coachReviewRequests — STORED (collection `coachReviewRequests`)

> **Amended by D9 (2026-07-07).** Coach Review is now real end-to-end: Daniel signs on as the first pilot coach and responses arrive as real human judgment through a **messaging bridge** (Telegram first, pluggable). The prior draft parked responses as fixture-from-`demoFixtures`; that is superseded. The shape did **not** previously accommodate a human response arriving from an external channel with attribution and provenance — it now does, via the `responses` field below. This is the minimal amendment; nothing speculative beyond it.

- **Purpose:** the full Coach Review loop (F4): the person's submitted request (artifact + question) lands in the store and shows in Ärendevy; the request notifies the coach's channel via the coach-channel adapter; the coach's reply returns and is stored as a real response.
- **Id:** `reviewRequest_<8hex>`. **Owner/case:** owner-scoped; references the artifact's case.
- **Envelope:** none for the request. **Responses are real (D9), not fixture** — this collection no longer draws from `demoFixtures`; fixture and real data still never share a field, and now the field is simply real.
- **Fields:**
  - required: `id`, `owner`, `artifact` (`{kind:'cvDraft'|'coverLetter',caseId}` + `label` (system: e.g. "CV v3")), `question` (user prose), `status` (`'submitted' | 'answered' | 'withdrawn'` — `answered` **now reachable**, set when the first real response is stored), `createdAt`, `updatedAt`
  - optional (D9): `responses` — `[{ id, coachRef ({kind:'coach',id} → the responder's `coachCompetence` row, e.g. Daniel's real row), attribution (display string, e.g. "Daniel (pilotcoach)"), body (the coach's verbatim words — real human evidence, gate-exempt like the person's own words, never LLM-authored), at, channel ('telegram' | 'teams' | 'whatsapp' | …, the provenance of THIS reply), channelMessageRef? (opaque external id for traceability/idempotency) }]` — absent until the first reply returns
  - optional (D9): `dispatch` — `{ channel, sentAt, channelMessageRef? }` — outbound-notification provenance (which channel the request was pushed to, when); lets a retry avoid double-sends
- **Writable:** user — create, `question`, withdraw. AI — nothing (responses are a real human's words; no model authors a coach voice). System — labels, timestamps, `status` transitions, and — fed by the coach-channel adapter — the `dispatch` record on send and each inbound `responses[]` entry on reply (the inbound write emits `review.response_received`, co-located with this path as `review.requested` is with submit).
- **Provenance & privacy (normative, D9):** every response records the `channel` it arrived through and (where the channel exposes one) a `channelMessageRef`. The **outbound** side sends the artifact's CV/letter content over that third-party channel — **acceptable only while Daniel is the sole jobseeker** (his data on a channel he controls); **must be revisited before any second real jobseeker exists** (another jobseeker's CV must not transit a third-party messenger without an explicit data-handling decision). Channel identifiers/tokens are deployment config, never stored on these records.
- **Deletion:** withdraw (status), no hard delete.
- **Feeds Progress Support:** yes (`review.requested` on submit; storing an inbound response emits `review.response_received` — decided by Daniel, 2026-07-08). **Learning layer:** later (which review advice preceded which outcome).

## 16. radarSignals — STORED (collection `radarSignals`)

- **Purpose:** Job Radar's weekly real signals (B3): hiring-volume deltas computed from the jobs store + LLM-summarised curated-RSS items, each ending in one suggested action.
- **Id:** `signal_<8hex>`. **Owner/case:** owner-scoped (signals are filtered to the person's region/field); case-free.
- **Envelope:** none per record (a signal is written once, complete; the weekly RUN can fail — that surfaces on the digest read model as an envelope-shaped block, not on records).
- **Fields:**
  - required: `id`, `owner`, `weekKey` (ISO year-week), `type` (`'hiring-delta' | 'press'` — the two real types; tender/investment/leadership are T5 concepts, NOT enum values until real), `headline`, `source` (`{ name, url? }` — REQUIRED; a signal without a source is not written), `observed` (what was seen: for `hiring-delta` the numbers `{ postings, trailingAvg }`; for `press` the summary sentence — AI, gated), `suggestedAction` (`'add-to-company-list' | 'view-adverts' | 'research'`), `createdAt`
  - optional: `companyName`, `companyRef` (set when actioned), `actionedAt`, `hidden`
- **Writable:** user — `hidden`, actioning (which stamps `companyRef`/`actionedAt`). AI — `press` summaries (gated; source link mandatory; no person-claims — the prompt has no person context at all). System — deltas (pure code), weekKey, timestamps.
- **Deletion:** `hidden` per item; weeks age out of the digest view but records persist.
- **Feeds Progress Support:** yes (`radar.signal_actioned` — only user actions, never signal arrival). **Learning layer:** yes (signal type × action × outcome).

## 17. demoFixtures — STORED (collection `demoFixtures`)

- **Purpose:** the server-side home of every T4 screen's fixture content (design doc B-2): Network Match graphs, Hive/Outcome panels, Community threads, fixture polls. T4 screens read these through the API like real data — "flips real by changing data, not code" made literal, and no new disconnected mock screens. **Note (D9):** Coach Review is no longer here — its responses became real via the coach messaging bridge, so `coachgranskning` is not a `demoFixtures` screen.
- **Id:** `demoFixture_<8hex>`. **Owner/case:** system-owned; not owner-scoped.
- **Envelope:** none.
- **Fields:**
  - required: `id`, `screen` (`'natverksmatch' | 'hive' | 'resultatmotor' | 'community' | …` — **not** `'coachgranskning'`, which is real per D9), `slot` (which section of the screen), `payload` (the fixture object — shaped exactly like the REAL shape it stands in for, so the swap is data-only), `isFixture: true` (constant; belt-and-braces so a payload can never be mistaken for real at any layer), `createdAt`, `updatedAt`
  - optional: `castRefs` (`[{kind:'coach',id}]` — ties content to the placeholder cast), `note`
- **Writable:** seed scripts only.
- **Display rule (normative):** any data whose transport includes `isFixture:true` renders ONLY under a demo banner/label. The API route (`GET /api/demo-fixtures?screen=…`) never mixes fixture and real records in one response.
- **Deletion:** replaced/removed by seed as screens flip real.
- **Feeds Progress Support / learning layer:** no and never (fixture data must not contaminate either).

## 18. conceptPanels — STORED (collection `conceptPanels`)

- **Purpose:** the T5 registry: one record per "Koncept — kommande" panel (Live Support, native app, radar future-signal cards, remaining worth-keeping ComingSoon destinations) — the frozen frame, its callouts, and when it becomes real.
- **Id:** `conceptPanel_<8hex>`. **Owner/case:** system-owned.
- **Envelope:** none.
- **Fields:**
  - required: `id`, `slug` (nav/screen key it replaces), `titleKey`, `imageRef` (`{kind:'imageAsset',id}` — the captured frame composed from design-system components) OR `composed: true` (rendered inert from components at runtime; one of the two REQUIRED), `callouts` (`[{ n: 1..4, textKey }]` — 2–4 per the plan), `becomesRealKey` (one line: when/what makes it real), `createdAt`, `updatedAt`
- **Writable:** seed scripts only. **No interactive fields exist** — a panel contains no controls by definition.
- **Boundary (normative, plan §6):** panels exist ONLY for parked items. The refused list (LinkedIn automation, scraping, synthetic faces, pre-vote results, fake analytics) may never appear as a `conceptPanel` record. Not-yet gets a picture; not-ever gets nothing.
- **Deletion:** removed when the tool ships real.
- **Feeds:** no/never.

### 18b. voiceProfile — STORED (collection `voiceProfile`) — added by D10

- **Purpose:** how the person *sounds*, as distinct from what is *true* about them (datafacts). A small, user-editable record — register, formality, phrases they would and would never use, language mix — consumed by drafting paths (E1, E2, B2 writer calls) so suggestions stay in the person's voice instead of drifting into AI-speak. It is style, never claims: datafacts remain the sole source of what may be asserted.
- **Id:** `voiceProfile_<8hex>`. **Owner/case:** owner-scoped, case-free; singleton per owner (one active record — the person's voice, not a per-message setting).
- **Envelope:** none — the person authors every field; there is no AI-produced payload to wrap.
- **Fields:**
  - required: `id`, `owner`, `createdAt`, `updatedAt`
  - optional (all user-set): `register` (e.g. warm-direct, plainspoken, formal-professional), `formality` (small enum/scale), `phrasesUse` (string[] — turns of phrase they own), `phrasesAvoid` (string[] — words they would never use), `languageMix` (e.g. Swedish primary; English terms of art acceptable)
- **Writable:** user — every field (set via UI). AI — **nothing** (an LLM never writes to this shape). System — timestamps only.
- **Input-separation rule (normative):** drafting paths (E1, E2, B2 writer calls) receive the voice profile; **checking/judging paths NEVER do** — voice is not the checker's business, risk is, and a checker that sees voice starts grading it. (This is the local application of the maker/checker separation parked as a standing invariant in D10.)
- **Deletion:** user-clearable/editable in place; no hard delete needed (singleton).
- **Feeds Progress Support:** no (editing one's voice is a profile edit, not a logged milestone — same as datafacts). **Learning layer:** no (user-owned style; not a built pipe, and the input-separation rule keeps it out of judging paths).

## 19. homeSummary — DERIVED (endpoint `GET /api/home`; never stored)

- **Purpose:** everything Home needs in one honest read: the next-step card, true counts, and tool-entry states. Derived because every number on Home must be recomputed from source-of-truth at read time — a stored summary could go stale and lie, and the repo makes the derivation cheap (SQLite + small collections).
- **Id:** none (not a record). **Owner/case:** computed per owner.
- **Envelope:** **envelope-per-block** (convention (b)): each block is `{ status, data, error? }` so one failed derivation renders as an honest error state, never a fake zero.
- **Shape:**
  - `nextStep` — envelope; `data` = today's `plannerItem` (or `null` → the calm empty state)
  - `counts` — envelope; `data` = `{ newMatchingJobs (jobs collection: undecided, current filters), awaitingReply (sent blindApplications + outreach in 'sent'), practiceThisWeek (completed interviewSessions this week) }` — every count traceable to a query over real records; **no count renders that cannot be recomputed on demand**
  - `entries` — envelope; `data` = `[{ slug, tier: 'T1'|'T2'|'T3'|'T4'|'T5', state: 'real'|'demo'|'koncept'|'coming' }]` (system registry — the per-card label rule on Home)
  - `activeCase` — envelope; `data` = `{ caseRef, company, role, metaStatus }` or null
- **Writable:** nothing (reads only; interactions write to their own shapes).
- **Timestamps:** response carries `generatedAt`; no persistence.
- **Feeds Progress Support:** consumes it. **Learning layer:** no (derivable).

### 19b. caseRecord — DERIVED (endpoint `GET /api/case-record`; the Ärendevy read model)

Not in the required list but demanded by F1/Wave 1; recorded here so it is defined once: envelope-per-block; `data` = one chronological spine merging case-part transitions (from part `updatedAt`s), non-hidden `activity`, and collection milestones (companies, outreach, blindApplications, interviewSessions, researchRequests), each item `{ at, kindChip: 'cv'|'ansokningar'|'jobb'|'research'|'studieplan'|'aktivitet', textKey, params, target }`; filterable by `kindChip`; plus a `coachNotes` block that is **always `{ status:'absent' }` until a real coach exists** (the visibly-empty labelled section, honest by shape).

---

## 20. New id kinds (extend `KINDS` in `server/skeleton/ids.cjs`)

`activity · plannerItem · company · companyResearch · blindApplication · outreachContact · researchRequest · interviewSession · interviewAnswer · imageAsset · resource · feedback · poll · coach · reviewRequest · signal · demoFixture · conceptPanel · voiceProfile` *(voiceProfile added by D10)*

(`job` already exists from the job-search store extension.)

---

## T. Activity event taxonomy (normative)

Rules first:
- **Display text rule:** an event stores `event` + `params`, never prose. Rendering is `tr(EVENT_TEXT[event], params)` — i18n keys in the frontend, so language is a render-time choice and no LLM ever authors feed text. Params are plain values (company, role, count, title).
- **Hide rule:** EVERY event is user-hideable (the plan's blanket rule). Hiding affects Progress Support, Case Record and Home surfaces; aggregates stay honest.
- **Emission rule:** host/API layer only, after the operation succeeds — never speculative, never from submodules.
- **Reserved rows** marked ◇ belong to the current frontier (Ansökningskoll) or later phases — named now so the vocabulary is stable, emitted then. The ◇ `review.response_received` row is emitted by the **coach-channel adapter** (the Wave 2 companion), not by Wave 1's host-layer instrumentation, so the Wave 1 emission set does not grow (decided by Daniel, 2026-07-08). The ◇ `cv.keyword_aligned` row is reserved for the align endpoint in **Innan du skickar** (a shipped, honesty-gated action that appends an ad term to a CV item on a resolvable, related basis): it is a real CV-modifying action, so it must not be invisible to Progress Support or the learning layer — it is emitted once the Wave 1 host-layer emitter lands (the endpoint exists today; the emission is added with Wave 1 instrumentation, not now).

| Event | Source tool | Target `{kind}` | Params (display) | Hideable |
|---|---|---|---|---|
| `job.approved` | Jobbsök | `job` | company, title | yes |
| `job.rejected` | Jobbsök | `job` | company, title, reasonCode | yes |
| `research.completed` | Research Helper / Matchanalys | `case` | company, role?, purpose | yes |
| `research.drilled` | Research Helper | `paragraph` | dossierKey, query | yes |
| `case.analyzed` | Matchanalys | `case` | company, role | yes |
| `gap.answered` | Matchanalys fill-gap | `gap` | outcome (`accepted`/`stays_gap`), requirement | yes |
| `cv.generated` | CV-byggaren (generate) | `case` | company, role, language, version | yes |
| ◇ `cv.keyword_aligned` | Innan du skickar (align endpoint) | `case` | term | yes |
| `letter.generated` | Personligt brev (generate) | `case` | company, role, language | yes |
| `letter.draft_saved` | Personligt brev | `case` | company | yes |
| ◇ `application.sent` | Ansökningskoll | `application` | company, title | yes |
| ◇ `application.status_changed` | Ansökningskoll | `application` | status | yes |
| `prep.intake_created` | Interview Prep intake | `case` | company, role | yes |
| `interview.session_completed` | Interview Trainer | `interviewSession` | company, role, questionCount, style | yes |
| `image.exported` | Image Studio | `imageAsset` | template | yes |
| `company.added` | Company List | `company` | name, source | yes |
| `company.status_changed` | Company List | `company` | name, status | yes |
| `company.researched` | Company List / Research Helper | `company` | name | yes |
| `blindapp.step_completed` | Blind Applications | `blindApplication` | company, step | yes |
| `blindapp.sent` | Blind Applications | `blindApplication` | company | yes |
| `blindapp.outcome_logged` | Blind Applications | `blindApplication` | company, outcomeCode | yes |
| `outreach.contact_added` | Outreach Plan | `outreachContact` | name | yes |
| `outreach.sent` | Outreach Plan | `outreachContact` | name, channel | yes |
| `outreach.reply_logged` | Outreach Plan | `outreachContact` | name | yes |
| `outreach.done` | Outreach Plan | `outreachContact` | name | yes |
| `linkedin.checked` | LinkedIn Helper | — (no stored target; params only) | pieceType | yes |
| `resource.suggested` | Knowledge Hub | `resource` | title | yes |
| `feedback.submitted` | Feedback Loop | `feedback` | type | yes |
| `poll.voted` | Feedback Loop | `poll` | — (never the chosen option in the feed) | yes |
| `review.requested` | Coach Review | `reviewRequest` | artifactLabel | yes |
| ◇ `review.response_received` | Coach Review | `reviewRequest` | artifactLabel, attribution | yes |
| `radar.signal_actioned` | Job Radar | `signal` | companyName, action | yes |
| `nextstep.completed` | Progress Support | `plannerItem` | titleKey-echo | yes |
| ◇ `study.week_action` | Omställning (M-phases) | — | week | yes |

**Non-events (normative):** demo interactions on T4 screens, T5 panel views, uploads without export (A3), reading/browsing, and anything fixture-derived are NEVER logged. Activity records real actions only.

---

## Open items

1. `interviewAnswers` as a separate collection vs embedded in the session — separate chosen for addressability (`answerRef` citations in feedback, weak-answer feed to prep); revisit only if write amplification annoys.
2. `poll` seed/authoring stays script-side at MVP; a poll-authoring surface would move `polls` definitions into an admin-writable class.
3. `homeSummary.entries` tool registry — hardcoded frontend map vs server registry; server chosen (one honest source for tier labels), but it is 20 lines either way. Confirm at Wave 1 build.
4. The `applications` shape (Ansökningskoll frontier) is deliberately NOT defined here; its ◇ events are reserved above.
