# HelloLilly: strategy paper compared with the development plans and the new job process

**Date:** 2026-10-06 · **Purpose:** decide what goes into the strategy paper v3 before it is rewritten.

**Sources compared:**
- **Paper:** `HelloLilly_Jobseeker_Product_Vision_INTEGRATED.pdf` (36 pp, last changed 2026-07-09). The text quoted here comes from the extracted copy in `HELLOLILLY_STRATEGY_AND_SPECS_BUNDLE.md` §1.
- **Plans:** `docs/` in this repo: decisions, backlog ideas, Valvet, the Wave 2 brief, the rest-of-site plan, Kind-3, the help layer, and the North Star.
- **Process:** `JobSearch/JOB_PROCESS.md` (2026-10-05, the staged agent process coordinated by Relay) and the `interview-prep` skill (the interview war-room).

**Ground rules for v3**, agreed 2026-10-06:
- The paper stays agnostic. No titles, sectors, variant counts or salary rules from Daniel's own search. Examples use other professions.
- No project status.
- Problem leads to solution. Guardrails go to Addendum A.

**Actions:**
- **Add:** new in v3.
- **Change:** rewrite what the paper says.
- **Keep:** unchanged.
- **Drop:** remove from the paper.
- **→A:** move to Addendum A.

---

## 1. The stance on automation

| Topic | Paper says | Plans + process say | v3 action |
|---|---|---|---|
| What "job search" means | Job Search is a tool that "gathers jobs from multiple public sources in one place" (§8 B). | The whole process of getting a job: from career intake to interview, plus networking (JOB_PROCESS stages 1–8, interview-prep). | **Change.** Job search = the whole route to a job. "Job Search" the tool is the discovery step inside it. |
| "Not automation" | LinkedIn Helper: "Not automation" (§8 E). "Automated outreach to employers" is on the not-first list (§9). "Honest scope. Job search aggregates public sources only" (§7). | Agents run discover, filter, score, brief, tailor, review and check in the background. Nothing is ever sent for the person (JOB_PROCESS principles). BACKLOG_IDEAS: "the product prepares, a real person confirms and sends." | **Change.** New line: **"Agents prepare. The person decides, approves every word, and sends."** The old stance was really protecting one thing — acting in the person's name — and that stays protected. |
| Human gates | One general principle: "Suggestions, not decisions" (§7). One named gate: the coach signs off long education plans (§8 F). | Gates in every tool: Go/Cut, Overrule, accepting a gap answer, accepting a suggestion (Wave 2), Send/Skip, LinkedIn Helper stopping at the send button (E1), assisted (never automatic) staffing-agency submission, Lilly suggesting but never writing (D11), consent before transcription, the coach owning the verdicts in Valvet (D21). | **Add.** One principle, "the person holds every gate", with one example in each tool's section. |

## 2. Truth and honesty

| Topic | Paper says | Plans + process say | v3 action |
|---|---|---|---|
| Who decides what is true | Not stated as a principle. Implied in "Human in the loop" (§7). | Only the person promotes text into the accepted banks. No line reaches a CV or letter unless it comes from accepted sources. The final check compares the text word for word against the bank (JOB_PROCESS principles + stage 8). | **Add.** A load-bearing principle: **the person is the judge of truth.** Applications may sell and embellish, but never invent. |
| Ärlighetskoll (the honesty panel) | Not in the paper. | MASTER_PLAN #4 / MASTER_STATE: a keep/soften/cut panel on the cover letter. In practice it made claims less salesy. | **Leave out of v3.** Replaced by the principle above. *Side note:* the app docs still describe the panel, so that is a separate product decision. |
| Writer ≠ checker | Not in the paper. | ARCH rule 3 (the generating call and the checking call are separate). JOB_PROCESS: "writers never check their own work." | **Add** as a principle (one line in the paper, detail in Addendum A). |
| Advocate, never audit | "Not about creating a false version of the person" (Image Studio). The anti-blame tone is implied. | D14. ARCH rule 1: fault lies with the document or the market, never with the person. | **Add** as a principle (one line in the paper, detail in Addendum A). |
| "Honest scope" lines | Application Check is "a keyword and format check, not access to a real applicant tracking system" (§7, §8 A). | Three reviewer agents simulate an ATS, a recruiter and an HR consultant. | **Change.** Keep the honest framing ("a simulation, not the employer's system") and describe the three reviewers. |

## 3. The job process mapped to HelloLilly tools

Each step becomes an improvement inside an existing (or new) tool section in §8 of the paper. Wording is agnostic.

| # | Step | Paper's tool today | What the process adds | v3 action |
|---|---|---|---|---|
| −1 | **Career intake** | Not present. Sara's CV "fills in as she talks" (App. B) is the closest. | Load every past CV, letter, application, link and certificate first. Then one question at a time, each with an explanation and examples. The AI suggests an answer from the loaded material where it can; otherwise the person speaks or writes it. Shorter than today's 98-question Karriärprofil form. Same engine as the gap interview. | **Add** a new tool: *Career intake (Karriärprofil)*, the start of everything. |
| 0 | **CV foundation** | CV Builder: "usable first version… different versions for different types of jobs" (§8 A). | A decision tree builds the master CV and the target variants. Which variants and sections exist depends on the jobs the person is aiming for. The structured CV is the base for everything after it. Builder and tailor are separate tools (North Star, D17). | **Change.** Split into CV Builder (foundation) and Tailored CV (per job). Add the decision tree. |
| 1 | **Start page** | The hub: "One clear next action at a time" (§8 H). | A morning page with tabs New today / Questions / Send / Cuts. Notifications carry no personal data. | **Change.** The hub becomes the job-search start page. |
| 2 | **Discover** | Job Search: choose sites, learn from clicks and saves (§8 B). | The person's own title list, plus a broad catch-all net, plus an optional direction track that only adds options. Sources merged so each job is one row. Only new jobs fetched per run. If a source blocks access, the search stops, logs it and retries. | **Change.** Add two nets plus the direction track, scheduled discovery, and one row per job. |
| 3 | **Filter** | "Learns from what the person clicks, saves, rejects" (§8 B). | Every cut carries a named rule and can be overruled. Rules check the job card first, then the full ad. Some cases are flagged but never cut. The reason for a manual cut is turned into a draft rule; once the person accepts it, it joins their preferences. | **Change.** Make the learning loop explicit: each reason becomes a rule the person accepts. |
| 4 | **Score** | Match Analysis: a percentage plus an explanation (§8 B). | Every requirement is checked against cited evidence. A map of matched skills and gaps. Earlier applications to the same employer checked for consistency. Low scores go to Cuts, which can be overruled. | **Change.** Add evidence-cited scoring, the skills map and the consistency check. |
| 5 | **Go / Cut** | Not present as a step. | The person picks. Undecided jobs carry over. | **Add** as a gate. |
| 6 | **Employer brief** | Research Helper: "companies, industries… culture… contact angles" (§8 D). | One brief per company: a fixed core (culture, way of working, stability, career path, hiring risk) plus **dimensions chosen by profession**. Open sources only, and it states what it could not read. | **Change.** Fixed core plus profession-specific topics. Example: a nurse's brief covers shift patterns and staffing levels; a factory worker's covers the safety record and permanent versus agency work. |
| 7 | **Tailor** | Cover Letter Builder "based on the job advert, the CV and the person's situation" (§8 A). | Start from the closest CV variant. Accepted lines only, and rewordings are proposals. The letter names one concrete connection: the company, its industry, a competitor, or the organisation's current phase. | **Change.** Accepted lines only, plus the "one concrete connection" rule. |
| 8 | **Gap interview** | Not present (the closest is Match Analysis "which requirements are missing"). | One question at a time in text. The person answers by voice or text. Accepted answers go into the person's evidence, wording and figures banks, **so each application makes the next one stronger.** (Wave 2 suggestion engine, gap-fill loop.) | **Add.** This is the person-level learning loop, alongside the organisation-level Knowledge Hive. |
| 9 | **Three-reviewer check** | Application Check: keywords and format (§8 A). | ATS, recruiter and HR-consultant agents review independently, then hold one cross-round. They point out problems but never rewrite. The number of pointers is small and adjustable. Ties go to whatever keeps the person from being screened out. Runs between gap acceptance and the final PDF. | **Change.** Application Check becomes *Before you send* (Innan du skickar) with the three reviewers. |
| 10 | **Consistency check + render** | Not present. | A separate checker sees only the package and the rules. It checks every line and figure against the accepted bank, plus the layout. If it fails, the package goes back once; on a second failure it is blocked. | **Add** inside *Before you send*. |
| 11 | **Send + register** | Not present (the name *Ansökningskoll* was used for the fit check). | The person sends. A register keeps one row per job with its status. A role already applied for never comes back. | **Add.** *Application tracker* (Ansökningskoll, the name moves here). |
| 12 | **Interview prep** | Interview Prep: "connects research, job advert, CV and Interview Trainer" (§8 D). | A war-room per interview, with: <ul><li>the real employer behind a recruiter identified</li><li>employer, market and interviewer dossiers</li><li>the job ad where each phrase can be clicked to show the angle and the question to ask</li><li>a rehearsable answer bank</li><li>the fit map, with gaps and bridges</li><li>STAR stories</li><li>different weighting for a recruiter screen and a hiring manager</li><li>a live-call window and notes</li></ul>It also works for networking meetings. The plans add a six-stage model: intake, research, analysis, package, live call, post-mortem (KIND3_ROADMAP). | **Change.** Expand into the war-room plus the six-stage model. |
| 13 | **Network outreach CRM** | LinkedIn Helper, Outreach Plan, Network Match (§8 E). Outreach Plan: "who to contact, why, in what order". | Lists that keep growing: target jobs and companies, then people by category (C-level, team level, recruiters, HR, hiring managers). A sequence for each person: step 0 a comment on one of their posts, step 1 a short intro, steps 2–4, and the goal of an endorsement or recommendation. A small daily pace (for example 5–10 people). Every step and reply is tracked and scored. It drafts and reminds, and the person sends. Contacts can be attached to jobs after the fact. | **Change.** Outreach Plan becomes a CRM with this sequence, a daily pace and tracking. |

## 4. Other concepts from the plans that the paper lacks

| Concept | Source | v3 action |
|---|---|---|
| **Help layer + Lilly.** A "Help right now" panel on every screen, plus an assistant that suggests but never acts or re-argues another tool's verdict. | HELP_LAYER_CONCEPT, D11 | **Change.** The paper's "side panel" (§5) gets its name and Lilly. |
| **Valvet / Coach Vault.** Coach-owned, local and encrypted. Only yes/no verdicts leave the coach's machine. It is the basis for Network Match. | VALVET_STATE, D21 | **Add** under Network Match / Coach tools. |
| **The jobseeker's own network map**, beyond LinkedIn (Facebook and others), built from the person's own exports. | BACKLOG_IDEAS #1 | **Add** under Network tools. |
| **Company research by area.** Every employer within a region or travel radius: a third way to discover, alongside Job Radar (driven by signals) and Company List (a wish list). | BACKLOG_IDEAS #2 | **Add** under Opportunity tools. |
| **Staffing-agency section.** Direct links plus assisted (never automatic) CV submission. | BACKLOG_IDEAS #3 | **Add** under Opportunity tools. |
| **The personal tool as seed and proof.** HelloLilly grew out of a real job-search system used daily. | NORTH_STAR | **Change.** §1 "Written from inside the program" gets one paragraph on this. It stays agnostic: it describes the process, not Daniel's choices. |
| Coach Review via a messaging bridge | D9 | **Drop** (implementation detail). |
| Architecture rules: injection envelope, eval corpus, register of every path that infers something about a person, minimum of 5 people per aggregate statistic, pilot paths | ARCH_RULES, PHASE_AFTER_PLAN | **→A** (Addendum A), or leave them in the engineering docs. |
| Build tiers T1–T5, waves, built/pending status | REST_OF_SITE_PLAN_v3, PHASE_STATE | **Drop.** This is a strategy paper, not a status report. |

## 5. Structure of the paper

| Section | v3 action |
|---|---|
| Opening, executive summary, §1–§4 (background, problems, engagement) | **Keep.** Small edits: job search = the whole route; the line on agents preparing. |
| §5 Solution, crosslinking layer | **Keep** + name the help layer. Add one crosslink example: *the gap interview banks a new fact, and every future application uses it*. |
| §6 Unique value | **Keep** + add the person-level flywheel (the person's bank of evidence grows) beside the organisation's flywheel (Knowledge Hive). |
| §7 How we build it responsibly | **Change.** One paragraph with three principles (judge of truth, writer ≠ checker, advocate never audit), the consent and GDPR line, then a pointer to Addendum A. The full list of principles **→A**. |
| §8 Full vision | **Change** per sections 3–4 above. The new tools are Career intake, Application tracker, Network CRM, Area research and the Staffing-agency section. |
| §9 Build order | **Keep** the phases as a strategic order of priority. Move Career intake + CV Builder to the front. **"What not to build first" →A.** |
| App. A evidence, App. B week in the life | **Keep.** Consider a third short persona: a nurse or factory worker running the full job process (intake → morning page → gap question by voice → three-reviewer check → send → interview war-room). |
| **New: Addendum A, "Principles and boundaries"** | The full set of principles, plus *What we will not build*: <ul><li>nothing sent in the person's name</li><li>no synthetic faces</li><li>no invented analytics</li><li>no auto-posting or LinkedIn API use</li><li>no logged-in scraping</li><li>the old "not first" list</li></ul> |

## 6. Questions for Daniel before the rewrite

1. **Names.** Should "Application Check" be renamed to *Before you send* (Innan du skickar), with *Ansökningskoll* moving to the application tracker? Or keep the paper's names?
2. **Third persona.** Add one to Appendix B (nurse or factory worker running the whole process), or fold the process into Sara's existing week?
3. **Valvet.** Name it in the paper, or describe it generically as "the coach's own network, kept on the coach's machine"?
4. **Language.** Keep the paper in English with Swedish tool names in brackets, as it is now?
