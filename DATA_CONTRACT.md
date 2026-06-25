# Interview Prep - Data Contract (v0.2, draft)

**Date:** 2026-06-25 (v0.2) · 2026-06-15 (v0.1)
**Purpose:** The shared handshake between the backend skeleton (which serves this data) and the frontend `useCase()` layer (which consumes it). Both sides build to this so the shape is defined once, not invented twice. This is a planning artifact describing WHAT the data is, not HOW either side implements it.
**Status:** Draft for review. v0.2 resolves the buildability gaps that blocked Phase A0; the structure is the point. Refine before either side builds on top of it.
**Companions:** INTERVIEW_PREP_CONCEPT_FINAL.md (what the system does), DEVELOPMENT_PLAN.md (the build phases).

---

## 0. Changes in v0.2 (the diff from v0.1)

v0.1 was conceptually sound but not buildable without resolving these. Each was a "two builders would invent it differently" gap:

1. **Addressing scheme added (§2.1).** Every addressable node carries a stable `id`; a reference is a typed `{kind, id}` (or `{kind, id, caseId}` for cross-case). This is what makes crosslinks, write-backs, and card-derivation buildable at all. (Resolves v0.1 §6-Q1, generalised.)
2. **Per-part status envelope added (§2.2).** Each top-level part is `{ status, data, error?, updatedAt }` with a **closed** status enum `absent | pending | ready | failed`. The "frontend handles partial cases" requirement now has a representation. The progress strip reads these.
3. **`decodedRole` is top-level only.** v0.1 listed it both as a "fifth dossier" and a top-level field. Dossiers are now **four** (company, product, people, niche); `decodedRole` is its own top-level part — it is an analysis input, not a research dossier.
4. **`meta.status` is a closed enum** (was "e.g. …"): `intake | researching | analyzing | prep_ready | live | post | done`.
5. **`crosslinks` is NOT a stored part — it is a derived query.** v0.1 listed it as a case part but described it as computed-from-context. It is now a brokered query `getCrosslinks(context)` returning typed references; nothing is precomputed/stored. (Resolves §6-Q3.)
6. **`prep` is structured data, not a markdown blob.** PREP is an ordered array of sections, each carrying `{ full, compressed }`. CHEAT_SHEET / QUICK_REF are a deterministic projection (`sections.map(s => s.compressed)`), not a prose re-parse. This is what makes "no language model in compression" actually deterministic.
7. **The candidate data-layer is referenced, not embedded.** The case points at CV facts / competencies by `{kind, id}`; it never copies them in. This is what makes multi-user additive — add `meta.owner`, scope the data-layer per-user, the case shape is unchanged. (Resolves §6-Q4.)
8. **Gap provenance is required, and bridge material is a list** of `{ source, ref? }` (CV and/or co-op dialogue), not a single optional flag — so A3 and A8 can always tell where material came from.

Still genuinely open (do not block A0; flagged inline): card trigger-term internal form (§3 cards, decided at A5 replay-testing) and the exact niche-depth grading (a quality bar, not a shape).

---

## 1. What this contract is, and is not

This defines the **case object**: the complete data for one interview preparation, the thing a frontend screen reads and a backend submodule writes. One case per interview (per company-role-round).

It is deliberately **a data shape, not an API spec**. It says what a gap looks like, what a card looks like, what a research dossier looks like. It does not say what the endpoints are, what the database tables are, or how the skeleton routes a request. Those are implementation, owned by the builders. The contract is the noun vocabulary both sides agree on.

Two consumers, one shape:
- The **backend skeleton** produces and stores cases; each submodule writes its part (the Researcher writes dossiers, the Analyzer writes gaps, and so on).
- The **frontend** reads a case through `useCase()` and renders it through the templates. It treats the case as read-mostly, plus a few user actions (save a question, accept a harvest item) that write back.

---

## 2. Foundations the whole shape depends on

### 2.1 Identity and references (the addressing scheme)

Everything that can be pointed at, saved, drilled into, or crosslinked carries a **stable `id`**, minted once and never reused. Addressable node kinds:

`case · dossier · paragraph · decodedRequirement · gap · bridge · card · question · prepSection · cvSlide · liveQA · harvestItem · datafact` (a node in the candidate data-layer).

A **reference** is a typed pointer:
```
{ kind: <node kind>, id: <string> }            // within the current case
{ kind, id, caseId }                            // cross-case (learning tool, later)
{ kind: 'datafact', id }                        // into the candidate data-layer (referenced, not embedded)
```
Rules: ids are unique within their case; a reference resolves to exactly one node or is dangling (the resolver reports dangling refs — it never silently drops them). Paragraph-level granularity is the v0 default for dossiers (sentence-level is deferred — unnecessary for the reader actions).

### 2.2 Part status (partial cases, made explicit)

A case is built incrementally: early on only `meta` and (pending) dossiers exist; by Stage 4 most parts are populated; `liveLog`/`postMortem` appear only after a call. Every **top-level part** is wrapped:
```
{ status: 'absent' | 'pending' | 'ready' | 'failed',
  data: <the part, or null>,
  error: <reason, present only when status === 'failed'>,
  updatedAt: <timestamp> }
```
- `absent` — not started. `pending` — a submodule is producing it. `ready` — usable. `failed` — production errored; `error` says why.
- The frontend's loading/empty/error scaffolding maps 1:1 to this enum. The Stage-2 progress strip is literally a render of the five research parts' statuses.

---

## 3. The case object, top level

`meta` is a plain object; every other part is a **status envelope** (§2.2) whose `data` is described below.

- **meta** — identity and status. Company, role, round number, interview date, named interviewer(s), format, the source input (ad / recruiter mail / company name), a **reference** to the CV version used (`{kind:'datafact', id}`), `owner` (single user today; the field exists so multi-user is additive), created/updated timestamps, and a closed **status**: `intake | researching | analyzing | prep_ready | live | post | done`. Stable once set, except `status` and `updatedAt`.
- **dossiers** — the **four** research outputs (Stage 2): `company`, `product`, `people`, `niche`. Produced by the Researcher.
- **decodedRole** — the true-job profile (Stage 2), the decoder's output, top-level. This is what analysis maps against, not the raw ad.
- **fit** — the two-way analysis (Stage 3): capability fit and preference fit. Produced by Decoder+Analyzer.
- **gaps** — named gaps and their bridges (Stage 3), enriched by the co-op dialogue.
- **prep** — the structured prep document + the CV story (Stage 4).
- **cards** — the atomised deck (Stage 4): one content model the dashboard, panic card, and live workspace all render from.
- **liveLog** — the distilled record from a call (Stage 6): Q&A in rewritten summary form + the topic log. Never a verbatim transcript.
- **postMortem** — the two harvests (Stage 6): weakness items and new-info items, each accept/dismiss.

> `crosslinks` is **not** a stored part — see §4. The candidate **data-layer** (CV facts, competency pool) is **not** a case part — the case references it (§2.1).

---

## 4. The parts in detail

### dossiers (four) — `data` shape
Each dossier is a titled body of researched content with sources noted, a short summary form (card-front without the full read), and an array of **paragraphs** — each `{ id, text, sources?, appended? }`. `appended` marks a drill-deeper subsection with its originating query. Paragraph `id`s are what save-as-question and drill anchor to (§5).
- **company** — origin to ambition: why it exists, mission, what it's trying to achieve; funding/footprint/news/red-flags as supporting facts.
- **product** — the product the candidate would work on: history, current state, likely future, USPs, closest competitors, open challenges. (Other products get a brief orientation paragraph.)
- **people** — interviewer(s) first, then likely colleagues/reports/dependencies. Per person: who, role, relevant background.
- **niche** — three levels, weighted to the bottom: industry (one orienting paragraph), vertical (context), exact niche (the depth: competitors that matter, daily vocabulary, regulatory/integration reality, 12-month pressures).

### decodedRole — `data` shape
A structured profile of the **real** requirements beneath the ad: the ad read against culture, company stage, ambitions, industry signals, hidden technical depth. An array of `decodedRequirement` nodes `{ id, requirement, rationale, weight? }` plus a short narrative. The requirement `id`s are what `fit.capability` maps against.

### fit — `data` shape
- **capability** — per decoded requirement: `{ requirementRef, evidence, status: 'match' | 'partial' | 'missing' }`, plus an overall capability read. (`requirementRef` is a reference to a `decodedRequirement`.)
- **preference** — the role against the candidate's own wishes: direction, deal-breakers, comp philosophy, culture signals, growth. A "do you want it, on what terms" read, not a score.

### gaps — `data` shape
A list. Each gap `{ id, what, why, bridge, provenance }`:
- **bridge** `{ id, kind: 'reframe' | 'adjacent-proof' | 'honest-ramp', body, oneLiner, material: [ { source: 'cv' | 'coop-dialogue', ref? } ] }`. `oneLiner` is the compressed form used by deterministic compression and the live cards. `material` is **required** (possibly one item) so origin is always known.
- **provenance** — `required`: how the gap surfaced. Co-op dialogue answers attach here and append to `bridge.material`.

### prep — `data` shape
- **PREP** — `sections: [ { id, heading, full, compressed } ]`. The full document is the ordered `full` fields; the compressed forms are inline, so:
- **CHEAT_SHEET** = the `compressed` of the 30-min subset; **QUICK_REF** = the `compressed` of the 5-min subset. Both are a **deterministic projection** over `sections` (subset by a `density` tag on each section), **no language model in the step**. This is the property A4 must hold.
- **cvStory** — `slides: [ { id, headline, detail } ]` — the CV retold from this role's angle.

### cards (the deck) — `data` shape
The atomised content model. Each card `{ id, category, front, body, triggers, subject?, sourceRef? }`:
- **category** — `gap-bridge | story | technical-move | question-to-ask | fact | comp-posture | dont | domain-fact`.
- **front** — readable in five seconds. **body** — revealed on tap.
- **triggers** — terms prepared at generation, used by the live auto-cue. **v0: an opaque `string[]`.** Its internal form (keywords / phrases / embeddings) is decided at A5 replay-testing — the contract deliberately does not fix it.
- **subject** — for domain cards (marketing / BI / AI / leadership / CRM / VIP / gamification / …).
- **sourceRef** — a **reference** to the node this card was derived from (a gap, a question, a dossier paragraph). Cards are a **projection** built by A4 over the other parts; `sourceRef` keeps them traceable rather than silently duplicated. The deck is one structure rendered three ways: dashboard grid, panic card (filtered to top priority), live workspace (navigated by audio match).

### liveLog — `data` shape
Per call: `qa: [ { id, question, answer } ]` in **rewritten summary form** (never verbatim), plus a `topicLog: [ { ref, at } ]` (which cards/topics fired, when — metadata, not speech). Input to the post-mortem. No verbatim transcript is stored — this is a behavioural guarantee enforced by the producing submodule and the writing/privacy gate, not by the shape alone (the shape cannot tell a summary from a transcript).

### postMortem — `data` shape
- **weakness items** `{ id, where, draftedAnswer, proposalRef?, decision: 'pending' | 'accepted' | 'dismissed' }` — proposed for the bank/deck.
- **new-info items** `{ id, claim, proposesDatafact, decision }` — each proposed as an addition to the candidate data-layer (a `datafact`); accepted items flow there (never silent auto-write).
- Plus a thank-you draft and a round-two starting note.

---

## 5. Crosslinks — a derived query, not a stored part

The crosslinking column shows what is relevant to **whatever the centre is currently showing**. As data, a crosslink is a **typed, reasoned reference**:
```
{ ref: { kind, id, caseId? }, relevance: <why it surfaced now>, score? }
```
It is **computed**, never authored or stored. The skeleton answers a brokered query:
```
getCrosslinks({ caseId, focus: { kind, id } }) -> Crosslink[]
```
- **v0 (MVP):** within-case, rule-based. Given a gap in focus, return its bridge card + the dossier paragraph it relates to + any `question-to-ask` tagged to it. Trivial once §2.1 ids exist — that is the whole reason the addressing scheme comes first.
- **Later:** the central learning tool (Phase A8) answers the same query smarter and adds platform-level refs (`caseId` set: discussions, other anonymised cases, coaches). Same shape, same call — nothing rebuilt.

Two boundaries hold for v0: within-case only (the `caseId`-bearing refs are allowed by the shape but unpopulated until A8), and derived-not-authored (computation grows over time; the shape is fixed now).

---

## 6. Write-backs (the few things the frontend changes)

The case is read-mostly. The frontend writes back through a small, bounded set, each addressing a node by `id`:
- **save a question to ask** — adds a `question` node to the questions set (optionally with a `sourceRef` to the paragraph it came from).
- **drill deeper** — requests a targeted search against a `paragraph` ref; the result appends to that dossier as an `appended` paragraph.
- **accept / dismiss a post-mortem item** — sets `decision` on a `weaknessItem` / `newInfoItem`; an accepted new-info item flows toward the data-layer as a `datafact`.
- **co-op dialogue answer** — attaches to a `gap` by ref and appends to its `bridge.material`.

Every other frontend action is read-and-render. The write surface is small and explicit, not "the frontend can edit anything."

---

## 7. Resolved, and the remaining open questions

v0.2 resolves the four v0.1 open questions: Q1 (granularity → paragraph-level ids, §2.1), Q2 (trigger-term form → opaque `string[]` now, fixed at A5), Q3 (crosslink MVP → §5 rule), Q4 (identity → data-layer referenced + `meta.owner`, §2.1/§3).

Genuinely still open, none blocking A0:
1. **Trigger-term internal form** — decided empirically at A5 replay-testing. The field exists; its shape is opaque until then.
2. **Niche-depth grading** — the quality bar for "deep enough," a Researcher (A1) concern, not a shape decision.
3. **PREP `density` tagging granularity** — per-section is the v0.2 model; if some sections need finer (per-element) density control for the 5-min view, that's an A4 refinement within this shape.

The shape is now buildable: the store and case factory have ids and a status model; crosslinks and write-backs have addressable targets; compression has a deterministic structure. Phase A0 builds to this.
