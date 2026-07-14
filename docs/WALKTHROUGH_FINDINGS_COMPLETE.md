# HelloLilly - First Real-User Walkthrough: Complete Findings Record

Date: 2026-07-11 into 2026-07-12
Session: Daniel's first genuine end-to-end run of the full pipeline, after the six
integration-audit honesty bugs and the three-layer gap-persistence fix were merged.
Status at session end: main includes the CSS-port merge (e1aa777) and the
gap-persistence merge (1a00b86); 273/273 green; store scrubbed to 6 real cases.

This document is the durable record so nothing surfaced tonight evaporates before
the next session. It is organised as: what the run proved, the findings by surface,
the one principle that reframes the product, the CV-machinery orientation, and the
two decisions explicitly deferred.

---

## 0. The verdict of the run

The pipeline now completes end to end - which it never did before, because every
prior attempt hit one of the bugs since fixed. That is real progress. The problem
is no longer "it breaks." The problem is the QUALITY and the STANCE of the output,
concentrated almost entirely in the CV surface and in the tool's voice.

One theme runs through nearly every finding below, and it is the most important
output of the walkthrough:

**The tool keeps performing honesty AT the user instead of advocating FOR the user.**
It reassures where it has not earned reassurance, it censors the user's own
judgement in the name of honesty, it narrates the job hunt in a compliance-auditor
voice that reads as being on the employer's side, and it invents structure and prose
while a quarter of the user's strongest real content sits silently corrupted. Every
one of these is the same root: the system should work from what is actually there,
told at maximum truthful strength, and it does not.

---

## 1. Findings by surface

### 1a. Matchanalys list view
Design-only, resolved this session. The list-view CSS was never ported; only the
detail-view classes were. Ported on branch port-matchanalys-list-css, reviewed
(including a delta re-review after a real scoping/collision catch), merged at
e1aa777. Card data (match %, "AI sag inte" chips, analyzing/klar/failed states)
still lands with the #8 wave, not here. WAVE_B_FOLLOWUPS #4 closed.

### 1b. Analysis skeleton reads as a hang
Design rule, still standing. A 2-3 minute skeleton with no progress indication or
expected-duration copy reads as broken. Mostly obsoleted by #8 (background analysis)
but still applies to Snabbkoll and regenerate paths. Rule: any long-running surface
needs progress indication plus "this takes a couple of minutes" copy.

### 1c. Background analysis on Godkann is not built (still a candidate wave)
Confirmed as current behaviour, not a regression. Today: approve, then go to
Matchanalys, click Analysera, wait. Intended (#8 + #9): approval triggers
fetch->research->analyze in the background; Matchanalys shows finished results;
the intermediate detail page with its Analysera button is retired; cards show
analyzing/klar/failed. Needs an in-process task queue and the conscious cost
decision (every approval auto-spends ~2-3 min of LLM credits). Still a candidate,
not queue-jumped.

### 1d. Gap persistence (RESOLVED this session, recorded for completeness)
The blocker that opened the session. Gap resolutions (accept, own answer, skip)
did not persist at all - everything lived in component state and died on
navigation; the completion banner and CV gate rendered from transient state.
Fixed across three review rounds: durable persistence, then live in-memory
rollback on failed writes, with the skip path hardened for free. Merged at
1a00b86. Seventh honesty-class bug of the project, in three layers.

### 1e. The CV is restructured, not tailored (MAJOR - see section 3 for root cause)
The live "Skapa anpassad CV" wholesale rearranges the user's CV rather than
adjusting content within the user's existing format. Daniel's requirement: the
tailored CV should keep his template and only adjust content - add bullets to the
summary, reword job-description entries toward the requirements. Instead it
produced an unfamiliar structure. Root cause found in the CV-machinery orientation
(section 4): the live builder has NO fixed template and lets the model invent
section headings every run.

Daniel's design correction: this is really TWO tools conflated into one.
- Tool 1 - CV builder: builds from scratch, then enhances structurally.
  Structure is fair game because building it is the job.
- Tool 2 - CV tailor: takes a finished CV in its established format and adjusts
  only content to fit a job ad. Structure is off-limits; the template is a fixed
  constraint, not a canvas.
The live step does Tool 1's job (free structural rearrangement) when it should do
Tool 2's job (content-only tailoring in a locked template).

### 1f. Innan du skickar - multiple findings

HONESTY-CLASS:
- Green checkmarks over real, addressable gaps. "CV tacker kraven 6/12" carries a
  green check. Half coverage is not success. "Brevet adresserar kraven 0/12" with
  a green check is the starkest version. The check must not read green on partial
  or zero coverage.
- The cover-letter box displays a metric for a check it explicitly refuses to
  perform. The tool's own copy says it does not keyword-check the letter (a letter
  should sound human, not echo the ad). A box showing a number for a check it
  won't run is decorative honesty. Remove it or make it real. (Daniel's scope: this
  concern is about the cover-letter box specifically, not the whole screen.)

REAL BUG:
- The "Utforska och fyll den i Matchanalys" links in the gap cards are dead. They
  land on the Matchanalys list where the job has already moved to CV-byggaren, so
  the destination is empty, and the user is then stranded with no visible
  affordance at the real destination. Hits twice: from the gap cards and from the
  missing-keyword flow.

DESIGN:
- The fit-check list is upside down and flat. Covered and missing requirements take
  equal space with no hierarchy, so there is nowhere to focus. Fix: faults and gaps
  loud and addressable at the top; covered items collapsed to a single small line
  at the bottom. Highest-value design change on the screen - it inverts the page
  from "how fine you are" to "what to fix."

CORRECT GATE, WRONG INPUT (leads into section 2):
- The tool refuses to add "CMO" as a keyword, claiming it would assert something
  unsupported - but the CV already contains CMO in many places. The honesty
  behaviour (do not fabricate) is sound; the detection (believing CMO is absent
  when present) is a bug. But Daniel's deeper objection reframes the gate entirely
  - see section 2.

### 1g. Activity log (Min aktivitet) - the six-question read

This was the named input the Wave B sequencing decision waited on. The read is in,
and it is a low-priority verdict from every direction.

1. ROW COUNT: 4 rows for the session.
2. READS LIKE: a pathologically honest narrator - and one that reads as being on
   the EMPLOYER'S side, not the applicant's. "Arlig fit per krav," "arlig
   bridge-paragraf," "Luckorna och deras bryggor ar pa plats." The log narrates the
   job hunt in a compliance-auditor voice. This is finding 0 made visible in copy.
3. MISSING / GROUPING: a second job-search run is missing entirely. Grouping is
   unresolved but Daniel found its shape: at 10-20 jobs the flat list is a useless
   scroll. Natural structure is PER JOB AD - found, accepted, analysed, gaps filled,
   letter, sent, collapsed under the job, unfinished ones highlighted. Actions not
   tied to a specific ad (a new job-search run; building or enhancing the CV outside
   of tailoring) do not belong threaded into a job's timeline. The log has no notion
   of "belongs to this job" vs "standalone action."
4. NOISE: the per-row description is identical every time and adds nothing (could
   say how many gaps, what changed - but not important at this step). "Loggades
   automatiskt" on every row is filler - if it is everywhere it communicates
   nothing. A richer layover summarising gaps and changes is a later nice-to-have,
   explicitly parked.
5. (design system): the view is ugly and does not use the design system. Built as
   a minimal Wave A verification surface, never designed. Daniel rates the page
   low: "not that important."
6. LONG-RUNNING STEPS: nothing worked as it should.

STRATEGIC CONSEQUENCE: the activity log was treated as the gate for Wave B. On
contact with the real user it turns out to be a surface he does not much value yet.
This should deprioritise Wave B relative to the CV work, where all the energy and
the sharpest findings went. The log read did not green-light Wave B; it revealed
Wave B's core surface does not yet earn priority.

---

## 2. Principle correction: advocate, do not audit

This is the deepest thing the walkthrough produced, and it corrects a principle the
planner had been defending too strictly. It emerged from Daniel pushing back on the
honesty gate, in stages, and it reframes the whole product.

### The stages of the argument
1. The keyword gate blocks the user from adding a word that is in the job ad. Wrong:
   the tool overriding the human who knows their own history.
2. Warn, do not block. The tool can say "I do not see this supported in your CV -
   are you sure?" and show its reasoning; the human decides. This is MORE honest,
   because it stops the tool pretending it can judge truth from text alone.
3. The tool must advocate. An honest applicant who presents weakly is being FAILED
   by their tool while everyone else's tool embellishes. A tool that leaves the
   honest user behind is destructive to their job search, not constructive.
4. The safety net is the whole chain. A bold CV claim is safe because the
   interview-prep tool rehearses the user to defend exactly that claim, and the
   in-interview tool backs them live. The CV swings; the later tools make sure the
   user can land it.

### The principle, stated
The tool presents the user's real experience at its maximum truthful strength,
confidently and creatively - bridging tech-adjacent into tech, BI into technical-PM,
"managed marketing" into "owned the full funnel" - because the goal is the interview.

The one line it holds: the bridge must start from something real (BI WAS
tech-involved). It swings from a true anchor; it does not conjure an anchor that
is not there. Fabrication is not forbidden because it is impolite - it is forbidden
because it is BAD ADVOCACY: it collapses under interview scrutiny and takes the
user's credibility on everything else with it. The strongest candidate is the real
self told at full volume, not a fake self that cannot survive a follow-up question.

### The distinction that keeps it safe
- ADVOCACY / embellishment: real experience at full strength, bold framing, using
  every technique the optimised competition uses. Encouraged, aggressively.
- FABRICATION: a thing that is not there at all. Forbidden - because it loses the
  user the job in the room.
- The human is the honesty authority. The user knows whether they can defend a
  claim. The tool frames at full strength and flags the one or two places it cannot
  see support, so the HUMAN decides. It neither censors nor auto-invents.

### The architectural consequence (a real requirement, not a mood)
Honesty in this product is END-TO-END, not per-tool. A bold claim is honest IF the
system carries the user to where they can defend it. Therefore:
- The CV tailor and the interview-prep tool MUST SHARE STATE. Every bold framing
  the CV makes becomes a prep item. Otherwise the CV writes a cheque the prep tool
  does not know to cash, and the user is in a room defending a claim they were never
  rehearsed on.
- This ties the CV tailor, the gap-drafter, Innan du skickar, and the two interview
  tools into ONE honesty-advocacy system rather than separate features.

### What this reframes
- The CV tailor: not "adjust honestly" but "advocate within the user's template."
- The gap-drafter (walkthrough finding #5, prior session): drafting from what is
  held IS advocacy - finding the diagonal truth and stating it boldly.
- Innan du skickar: not a censor but an adviser.
- The interview tools: the safety net that makes CV boldness defensible.

---

## 3. Why the CV output is weak: two compounding causes

The walkthrough's weak, restructured CV had TWO causes, now both root-caused.

Cause A - no template (structural): the live builder invents section headings every
run because it has no fixed template. This is the "it rearranged my CV" complaint.
See section 4.

Cause B - a quarter of the pool is corrupted (content): a verified live bug means
~23% of the datafact pool the builder selects from is the literal string
"[object Object]" - and specifically the achievement bullets, the strongest content.
So even setting structure aside, the builder was drawing from a pool where the best
evidence about the user had been silently destroyed at ingest. See section 4 and the
separate fix brief.

These compound: invented structure filled with a pool missing its strongest quarter.

---

## 4. CV-machinery orientation (the foundation for the next decision)

Read-only investigation of the original CV builder. Bottom line: HelloLilly's live
"Skapa anpassad CV" does NOT call or import the original machinery. It was rebuilt
from scratch on a different content model, keeping only the philosophy
("select, never invent") and a one-time copy of cv_data.json. The live step is
thinner, and a live bug is corrupting ~23% of its pool.

### The original builder (JobSearch/CVs/)
Two run-by-hand Node scripts, not a service or importable package:
- generate_core_cvs.js - the engine. Emits 14 base CVs (7 role variants x EN/SV
  .docx); exports buildCV, VARIANTS, deepMerge.
- generate-tailored-cv.js - the tailoring CLI. Requires the engine, adds the Claude
  API layer, takes one job-ad .txt, renders a tailored CV .docx plus a separate
  suggestions/gaps .docx.
Content in cv-source/{en,sv}/: COMPETENCY_MASTER_POOL.json, CV_JOB_VARIANTS.md,
CV_SECTION_VARIANTS.md, cv_data.json, plus highlight-pool.json and cv/MASTER_CV.md.

What it does:
- Fixed template, content swaps. buildCV always lays out the same sections in the
  same order. 7 role variants change only content per section, never structure.
- The "~30 bullets per section" figure is a myth - it is multi-tier and
  variant-keyed. Real counts: competencies 9 categories / 115 items (pick 3
  categories, 4-6 items each); job bullets 5 jobs x 7 variants, ~5-9 each; career
  highlights 28 reusable ids across all variants combined. The 28 is likely what
  got remembered as "~30 per section."
- Selection is LLM, not scoring. One Anthropic call under hard rules: "Use ONLY
  exact pre-approved text... Zero creative writing," core mechanism "Reorder items
  within a section by relevance to the job ad. That is the primary tailoring
  mechanism." Returns strict JSON of variant + section picks, deep-merged as
  overrides into buildCV.

### What crossed into HelloLilly: exactly one thing
The cv_data.json data file was physically copied once (seed-datafacts.cjs provenance
comment; the cover-letter prompt was also ported verbatim into writer/execute.cjs).
The CODE was rebuilt. Name-greps for the original modules return zero code hits.

### What the live step does instead
- On boot, ingest-cv.cjs flattens cv_data.json into one flat pool of tagged
  datafacts. The 7 variants survive only as tags, not template slots.
- The CV step is a 46-line submodule (cv-builder/execute.cjs), a pure selector - its
  prompt says "you only choose ids." One Opus call gets the role, decoded
  requirements, matched evidence, and the whole pool; returns
  {sections:[{key,heading,datafactIds}]}; keeps only ids resolving to a real fact;
  emits each fact's text verbatim. It invents headings (no fixed template), does not
  get the raw job ad (only the decoded role), and does not read gaps.
- The pool COMPOUNDS: answering a gap mints a new datafact into the same pool -
  something the static old library never did.
- Every richer frontend affordance ("Forbattra formulering," "Lagg till nyckelord,"
  "Ny version for annan roll," "Acceptera CV") is a disabled "Kommer" placeholder.

### The gap - what the old builder does that the live step does not
- A finished, styled .docx (EN + SV). Live: on-screen draft only, docx deferred.
- Multi-variant / template selection (7 whole-CV role lenses). Live: one draft, the
  "annan roll" switcher disabled, variants survive only as tags.
- A curated, human-approved per-variant library. Live: one file atomized into flat
  facts, assembled by the model - no curated per-role narrative.
- Swedish output. Live: English-only.
- A suggestions/gaps document alongside the CV. Live: folds gaps into the fill-gap
  loop.
Not pure regression: the live version adds a pool that grows as gaps are answered,
an upstream decode->fit->select chain, per-fact traceability, and a stricter
never-author guarantee.

### The live bug (fix briefed separately)
ingest-cv.cjs stringifies job-result objects, so 33 of 143 datafacts in the live
store are literally "[object Object]" - the achievement bullets, the strongest
content. ~23% of the pool corrupted. Confirmed against the live store.db, not just
the data shape. One-line ingest fix, plus a re-seed to clear the 33 already-poisoned
facts.

Two caveats: the cv-builder needs a live LLM key (no offline fallback); the frontend
traceability _pool is empty this wave so provenance chips degrade to a generic
"Fran ditt CV" label.

---

## 5. Decisions explicitly deferred to a fresh session

These are the biggest product decisions the project has faced and they need a clear
head, not the end of a long session.

### Decision 1: the CV architecture fork
Two paths, mutually informative, not yet chosen:
- REWIRE HelloLilly to the machinery already built in JobSearch/CVs/ (fixed
  template, variants, .docx, SV, curated prose).
- KEEP BUILDING on the datafact model and bring the missing pieces back one by one
  (a fixed template object, role variants, .docx export, SV output).
This decision determines whether the CV-tailor fix is "wire up what you already
built" or "rebuild it." Everything in the CV pile sits downstream of this.

### Decision 2: full sequencing
The three original candidates were #8 (background analysis), gap-drafting+intake,
and Wave B. Tonight reorders them:
- The CV / honesty-advocacy work is the headline (pending the fork decision).
- Gap-drafting+intake is HALF of that same capability (drafting from what is held).
- #8 remains a sensible small quality-of-life fix.
- Wave B drops down the list - the activity-log read revealed its core surface does
  not yet earn priority.
Do NOT brief any of this before the advocacy principle (section 2) is written as a
design document and the fork (Decision 1) is chosen. Briefing sooner re-introduces
the conflation the walkthrough spent the session un-tangling.

### The next concrete step
Write the advocacy principle as a proper design document, make the fork decision
against it, then sequence. And the immediate small win, briefed now: the ingest
corruption fix, so the next real CV run draws from a clean pool.

---

## Standing process notes (unchanged, recorded)
- Three-Claude workflow: planner briefs and decides, never codes; Code builds on
  branches, never merges without independent review; Design works from briefs.
- When review verdicts split, the one with checkable findings decides (this session:
  Codex rejected with evidence what Gemini approved; Codex was right, twice).
- Delta re-reviews are scoped to the specific prior findings, not full re-reads.
- British English, hyphens only. Name the project in the first line of every paste.
- Repo-in-Dropbox-on-two-machines remains a standing risk; GitHub should be the
  transfer mechanism, not Dropbox sync. Flagged, not urgent.
- D12/D13 documentation commits are now standing law on main; the planner knows them
  only by commit message and should be briefed on their content next session.
- Open items parked, not chased: RESUME's #1 (Valj bort local-only) and #2 (Home
  Ansok legacy path); the 18 orphan no-caseId activity rows; known-orphan datafact
  sweep (the documented crash-window residual from the gap-persistence fix).
