# HelloLilly — Education & Re-Skilling Area (new product area)

**Date:** 2026-06-30
**Status:** Design draft for review
**Grounded in:** `docs/research/job-seeker-pain-points-report.md` (the evidence brief) and `HelloLilly_Jobseeker_Product_Vision.docx` (the master vision)
**Why it exists:** The master vision is built around presenting *who the jobseeker already is* (CV, gaps, interviews). It barely addresses the case where the real blocker is a **skills gap that has to be closed** — re-training, courses, credentials — and the question *"which course actually fits this person and this target role?"* The evidence brief makes this a first-class need. This area fills it.

---

## 1. Where it fits

This is the **fourth move** in the candidate journey, triggered by the third:

```
Decode the job (A1) → Analyse fit + name gaps (A2) → Fill gaps from existing experience (A3 loop)
                                                              │
                                          gap CANNOT be bridged from real experience
                                                              │
                                                              ▼
                                            EDUCATION & RE-SKILLING AREA  ← this doc
                                     "this gap needs new skills — here is the path to get them"
```

The A2/A3 loop already produces the perfect trigger: the **honest "stays a gap"** outcome (a requirement that no reframe or adjacent-proof can truthfully cover). Today that's a dead end. This area turns it into an action path: *evaluate whether a course closes it, which course, and whether it's worth it.*

---

## 2. Evidence basis (and the cautions it forces)

From the brief, the findings that justify and constrain this area:

- **Skills gaps are a real, distinct blocker** — separate from CV quality or confidence; for many harder-to-place people, retraining is the actual route back. (§4)
- **Returns are real but slow + carry lock-in** — training reduces job-search during the course and pays off *years* later; effects appear at 2+ years, near-zero short-run. → **The tool must set honest timelines and never over-promise.** (§4.1, §4.3, §8)
- **Targeting to real labour demand is decisive** — training passes cost–benefit only with strong demand and careful targeting to bottleneck occupations; effects oscillate from strong to near-zero by period. → **Course recommendations must be driven by demand signals, not catalogue browsing.** (§4.3, §7.2)
- **Swedish pathways have hard outcome data** — YH ≈ 81–90% employed one year out with good course–job match; Komvux vocational ≈ +3% income at 5y; Arbetsförmedlingen labour-market training ≈ +7% vs Komvux (shorter, better-aligned). → **Prefer employer-driven, demand-aligned pathways; surface the outcome numbers.** (§4.4, §4.5)
- **`Validering` (prior-learning recognition) shortens paths** — recognise skills gained outside formal education to avoid redundant training. → **Check "can this be validated?" before recommending a full course.** (§4.7)
- **Skills taxonomies enable the match** — ESCO / O*NET give a structured way to map person ↔ course ↔ role; skill classifiers can extract demanded skills from ads, but need expert validation. (§4.6)
- **Don't make it "digital-first" for everyone** — low digital literacy widens inequality; blended (human + guided digital) is required for some. (§3.4, §5.5)

---

## 3. What tools users need (derived from the evidence)

Each tool = a user need + the evidence behind it + what it does.

| # | Tool | User need (who it's for) | What it does | Evidence |
|---|---|---|---|---|
| 1 | **Course-Fit Evaluator** | "I have an unbridgeable gap — do I need a course, and which one?" | Takes A2's `missing`/`partial` requirements + the person's datafacts + a course catalogue + demand signal → ranks the *few* courses that actually close the decisive gaps for the target role | §4.6, §4.7 |
| 2 | **Skills-Gap → Skills mapper** | "What exactly am I missing, in real terms?" | Maps the decoded requirements and the candidate's evidence onto an ESCO/O*NET skills frame, so gaps are named as *skills*, not vague asks | §4.6 |
| 3 | **Demand Signal** | "Is this worth retraining for?" | Pulls local/role demand (vacancy data, bottleneck-occupation lists) so recommendations target real demand, not just available courses | §4.3, §7.2 |
| 4 | **Validering check** | "Do I even need the course, or can my experience be recognised?" | Flags where prior learning could be formally recognised (shorten/skip training) before recommending a full programme | §4.7 |
| 5 | **Pathway outcomes + honest timeline** | "Will this actually pay off, and when?" | Shows the route's evidence (e.g. YH employment rate, expected lag) and an honest ramp time — explicitly contrasting "fast: apply now" vs "slow: retrain" | §4.5, §8 |
| 6 | **Blended/low-friction mode** | "I'm not comfortable with digital systems / forms" | Spoken/guided mode + coach hand-off for the same flow, so the education path isn't gated by digital literacy | §3.4, §5.5 |

These six are the **tool set** for this area. Tools 1, 3, 5 are the core MVP; 2 underpins them; 4 and 6 are fast-follows.

---

## 4. How we'd create them (on the existing architecture)

Reuse the HelloLilly framework exactly as A1/A2 do — no new infrastructure.

**Backend submodules** (cloned from the `decoder` scaffold; CommonJS `.cjs`; `tools.llm`, `tools.store`, `datalayer`):
- **`course-fit` submodule** — `reads: ['meta','decodedRole','gaps']`, `writes: ['learningPlan']`. For each unbridgeable gap, calls the LLM with: the gap, the skills frame (tool 2), the candidate datafacts, the matched courses (tool 1's catalogue lookup), and the demand signal (tool 3) → emits a ranked **`learningPlan`** part: `[{ gapRef, recommendation: 'course'|'validate'|'reframe-instead', course?, provider, expectedOutcome, rampTime, demandLevel, evidenceNote }]`.
- The **honest guardrail is in the contract**: every recommendation must cite *why* (the gap it closes + the demand + the evidence), and must offer the "validate instead of retrain" and "apply now anyway" alternatives — never a bare "take this course."

**Data sources** (the part needing a targeted follow-up — see §6):
- Skills frame: **ESCO** (EU, Swedish-localised) and/or O*NET.
- Course catalogue: **YH** (MYH), **komvux**, **SFI**, **Arbetsförmedlingen** labour-market training; ideally via their open data/APIs.
- Demand signal: vacancy data (we already have LinkedIn job-fetch infra from the week-22 work) + Arbetsförmedlingen occupation-outlook (bristyrken).
- `Validering`: MYH / Swedish Council for Higher Education recognition routes (initially informational, later integrated).

**Front-end** — a new screen, reachable from the analysis screen (**Ansökningskoll**) and from A3 when a gap is marked "stays a gap":
- "**Close this gap with learning**" panel: the unbridgeable gap, the 1–3 recommended courses, each with provider, **expected outcome + honest timeline**, demand level, and the validering shortcut.
- A clear **fork**: *"Apply now anyway" (fast, lower fit)* vs *"Retrain" (slow, higher fit)* — the evidence says people must see this trade-off, not be pushed to train.

**Crosslinking** (per the vision's central idea): the learning plan crosslinks to coaches with relevant field knowledge, peers who took the same path, course reviews, and the person's Company/Job list — help appears next to the decision.

---

## 5. Honest-design guardrails (baked in, from the evidence)

1. **Never over-promise.** Training is slow and period-dependent; show the lag and the demand caveat. Don't evaluate/justify it on a 6–12-month horizon. (§7.2, §8)
2. **Target demand, not catalogue.** No recommendation without a demand signal behind it. (§4.3)
3. **Validate before retrain.** Always check prior-learning recognition first. (§4.7)
4. **Offer the non-training route.** Surface "apply now" alongside "retrain" — re-skilling is one option, not the default. (§2.5: targeting > volume)
5. **Don't assume digital comfort.** Blended/spoken mode + coach hand-off for low-digital-literacy users. (§5.5)
6. **It augments coaches, doesn't replace them.** The robustly effective interventions are human-centred; this tool feeds the coach conversation. (§8)

---

## 6. MVP slice + open follow-up

**MVP:** `course-fit` submodule (tools 1+2+5) reading A2's gaps → a `learningPlan` rendered on the new screen, with the apply-vs-retrain fork and honest timelines. Demand signal (3) and validering (4) start as lightweight/informational; blended mode (6) is a fast-follow.

**Build order:** depends on A2/A3 existing (it consumes `gaps`). So: **after** the A2 MVP. It's the natural next area once the gap loop produces unbridgeable gaps.

**Open follow-up research (targeted, not another full deep-research run):** confirm the *available data interfaces* — does MYH/YH, komvux, SFI, or Arbetsförmedlingen expose an open course API + an occupation-demand (bristindex) feed we can call? That's the one build-blocking unknown; everything else reuses the framework. Worth a short, scoped lookup before Step 1 of this area.

---

## 7. One-line summary

The gap loop tells a person *what they're missing*; this area tells them *how to get it* — honestly, demand-first, with the fast "apply anyway" route always on the table — and it's the same decode → datafact → submodule → screen architecture, just pointed at courses instead of CV bullets.
