# A2 Front-End Brief — Analysis Screen + Fill-Gap Loop

**Date:** 2026-06-29
**Companion to:** `A2_GAP_ANALYZER_DESIGN.md` (the backend/process spec)
**Purpose:** Define exactly what the user sees, the choices they make, and the fields they fill — for the MVP front-end. Visual reference is the draft mockup (Swedish "Wrknest AB / Marknadschef" screen); copy here is illustrative — real strings come from the data + i18n.

---

## 1. Scope

**MVP screens (build now):**
- **Screen A — Analysis = "Ansökningskoll" / "Application Check"** (adapt existing `src/screens/match.jsx`; it's the `id:'match'` feature in `strategyData.js`)
- **Screen B — Fill the gaps** (the interactive loop)
- **Screen C — CV builder** (assemble the tailored CV from the pool; reachable from Ansökningskoll)

**Deferred screens/components (stub or hide):** Sara human-review, course/calendar action, cover-letter screen polish, `.docx` export.

---

## 2. Page map

```
Home / job list ──► [select a job] ──► SCREEN A: Analysis (Ansökningskoll)
                                          │
                  ┌───────────────────────┼───────────────────────┐
           "Apply anyway"        "Fill the gaps first"      "Open CV builder"
           (exit / mark applied)         │                         │
                                  SCREEN B: Fill the gaps    SCREEN C: CV builder
                                  (gap-by-gap loop)          (tailored CV from pool)
                                         │                         │
                            [back to Screen A, match updated] ◄─────┘
```

Every screen reads from one **case** (the job + its analysis). Screen A renders the `fit` and `gaps` parts; Screen B writes back into the datafact pool and patches `fit`/`gaps`; Screen C assembles a `cvDraft` from the (now-enriched) pool. Because B grows the pool and C reads it, filling a gap on B strengthens the CV on C.

---

## 3. SCREEN A — Analysis

The single most important screen. Mirrors the mockup, top to bottom.

### 3.1 What is seen

**Header band**
- Company name, location, source + date (e.g. "Wrknest AB · Stockholm · Platsbanken · 18 feb")
- Close (×) button
- Job title

**Verdict block** ← from the `fit` part
- Match score as a ring (e.g. **90%**)
- One-line verdict ("Strong match — go for it")
- 2–3 line plain-language summary (the `fit` capability `overall` + a line of preference read)
- Provenance line: "Reviewed by Lilly · 2 min ago" (Lilly = the AI analyst = A2)

**Primary actions (two buttons)**
- **Apply anyway** → leaves the loop, marks the case as ready/applied
- **Fill the gaps first** → opens Screen B

**"What you have" section** ← `fit.capability[]` rows with status `match`
- Section title + count ("4 of 4 requirements")
- One row per matched requirement:
  - requirement title
  - one-line plain explanation (the `evidence`, restated)
  - **citation chip**: "From your CV · {datafact type}" (e.g. Experience / Internship / Language) — this is the resolvable-datafact honesty bar, made visible
  - green check icon

**"Gaps to fill" section** ← `gaps[]`
- Section title + count ("3 improvements")
- One row per gap:
  - gap title (the unmet/partial requirement)
  - why it matters (one line)
  - **AI move** (the bridge), one of:
    - a *suggested bullet* ("Describe handheld-device work from your internship — it counts")
    - a *question / external action* ("HelloLilly has a short course (4 days)" / "Ask Lena, your supervisor")
  - action button matching the move (e.g. "Add to CV" / "Show course" / "Write to Sara")
  - "+" / improvement icon

**"Use this directly" launchers**
- **Open CV builder** ← **active** → opens Screen C (assemble tailored CV from the pool)
- Write cover letter · Ask Sara to review · Full match analysis ← **deferred** (disabled/stub for MVP)

### 3.2 Choices on Screen A
| Choice | Effect |
|---|---|
| Apply anyway | exit loop, mark case applied/ready |
| Fill the gaps first | open Screen B |
| A single gap's action button | jump into Screen B focused on that gap |
| Open CV builder | open Screen C (tailored CV from the current pool) |
| Close (×) | return to job list |

### 3.3 States (per the data-contract status envelope)
- `fit`/`gaps` = `pending` → skeleton/loading ("Lilly is analyzing…")
- `ready` → full render as above
- `failed` → "Analysis failed" with the error reason; **no stale partial render**
- `absent` → "Not analyzed yet" + a "Run analysis" button

---

## 4. SCREEN B — Fill the gaps (the loop)

Reached from "Fill the gaps first." Works one gap at a time.

### 4.1 What is seen (per gap)
- Progress indicator ("Gap 1 of 3")
- The requirement + why it matters
- The AI move, in one of two modes:
  - **Suggestion mode** — a proposed bullet shown in an editable text box, prefilled with the AI's suggestion
  - **Question mode** — a prompt ("Do you have experience with WMS systems?") + an empty text box

### 4.2 Fields to fill
| Field | Type | Notes |
|---|---|---|
| Answer / bullet text | multi-line text | prefilled in suggestion mode; empty in question mode |
| (optional) tags | chips, AI-prefilled | e.g. `comeon`, `compliance`; user can adjust before saving |

### 4.3 Choices per gap
| Choice | Effect |
|---|---|
| **Accept suggestion** | take the prefilled bullet as-is → judge → save |
| **Edit & save** | modify the text → judge → save |
| **Write my own** | (question mode) type experience → judge → save |
| **Skip** | leave this gap open, move to next |

### 4.4 What happens after the user submits (the AI judge)
The answer goes to the bullet-judge. Two outcomes, both shown clearly:
- ✅ **Accepted** — "Added to your CV and saved for future jobs." The requirement flips `gap → match`, the match score updates, and a citation chip appears (it's now a datafact in the pool).
- 🚫 **Stays a gap** — "This doesn't fully cover the requirement yet." Honest; the gap remains open. The UI must **never fake a match** here.

### 4.5 End of loop
- Summary ("2 of 3 gaps filled — match now 96%")
- Button: **Back to analysis** (Screen A, refreshed)

### 4.6 States
- While judging: per-gap inline spinner ("Lilly is checking…")
- Save failure: inline error, keep the user's text (never lose typed input)

---

## 4b. SCREEN C — CV builder

Reached from "Open CV builder" on Ansökningskoll. Assembles a tailored CV from the datafact pool, tuned to this job's decoded requirements. This is where the compounding pool pays off — bullets added in Screen B show up here.

### What is seen
- The assembled CV, section by section (Summary, Highlights, Core Competencies, each job entry, fixed sections), in the HelloLilly CV layout
- Each selected bullet shows a small **source/relevance hint** ("from your CV", and why it was picked — which requirement it serves)
- A banner if the CV was strengthened by a just-filled gap ("Includes 2 bullets you added today")

### Choices
| Choice | Effect |
|---|---|
| Swap a bullet | replace a selected bullet with another option from the pool (same section/job) |
| Reorder bullets | change emphasis order within a section |
| Add from pool | pull in an additional relevant datafact the builder didn't auto-select |
| Remove a bullet | drop it from this CV (stays in the pool) |
| Regenerate | re-run `cv-builder` against the current pool (e.g. after filling more gaps) |
| Back to Ansökningskoll | return to Screen A |

### Fields to fill
| Field | Type | Notes |
|---|---|---|
| (inline) bullet text edit | text | optional tweak; an edited bullet can be saved back to the pool as a new datafact (compounding) |

### Rules
- The builder **selects** pre-approved datafacts; it never authors new claims. Edits the user makes are theirs, and saving an edit back to the pool goes through the same truthfulness path as Screen B.
- `.docx` export is **deferred** — the MVP shows the tailored CV on-screen.

### States
- `cvDraft` `pending` → "Assembling your CV…"; `ready` → render; `failed` → error + retry.

---

## 5. Cross-cutting UI rules

- **Citations everywhere a match is shown** — every matched requirement and every newly-saved bullet shows its "From your CV · …" source. No uncited matches.
- **Honesty visible** — gaps that can't be truthfully filled stay visibly open; no fabricated wins.
- **The compounding message** — when a bullet is saved, tell the user it's reusable ("saved for future jobs"), because that's the product's core value.
- **Loading/error states map 1:1 to the part status** (`pending`/`ready`/`failed`/`absent`) — reuse the contract, don't invent ad-hoc states.
- **Copy** is illustrative here; route all strings through i18n (the mockup is Swedish; app should support SV/EN).

---

## 6. Inventory — every input the user touches (MVP)

1. Select a job (from list) — opens Screen A (Ansökningskoll)
2. "Apply anyway" / "Fill the gaps first" / "Open CV builder" (Screen A)
3. Per-gap: Accept suggestion / Edit & save / Write my own / Skip (Screen B)
4. Answer/bullet text box (Screen B)
5. (optional) tag chips on a new bullet (Screen B)
6. "Back to analysis" (Screen B → A)
7. CV builder (Screen C): Swap / Reorder / Add from pool / Remove / Regenerate; inline bullet edit
8. "Back to Ansökningskoll" (Screen C → A)

Everything else in the mockup (Sara, course/calendar, cover-letter launcher, `.docx` export) is **deferred** and should render disabled or hidden for the MVP.

---

## 7. Data the front-end consumes (from the API)

- `GET /api/case/:id` → `{ meta, decodedRole, fit, gaps, cvDraft? }` for rendering
- `POST /api/case/:id/analyze` → run A2 (used by the "Run analysis" state)
- `POST /api/case/:id/gap/:gapId/answer` → `{ answer, tags? }` → returns `{ outcome:'accepted'|'stays_gap', updatedFit?, newDatafactId? }`
- `POST /api/case/:id/cv` → run `cv-builder` against the current pool → returns `cvDraft` (re-run after filling gaps to refresh)

Field-to-source mapping is in `A2_GAP_ANALYZER_DESIGN.md` §4.4 and §5.
