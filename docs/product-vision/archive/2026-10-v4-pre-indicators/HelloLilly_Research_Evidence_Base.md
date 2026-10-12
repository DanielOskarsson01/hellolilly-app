# HelloLilly - What the Evidence Says

**Research companion to the Jobseeker Product Vision, Version 4 · October 2026 · Confidential draft**

Consolidates the research behind HelloLilly: the job-seeker pain-points brief (June 2026), the consolidated career-change evidence brief (July 2026, which merged three independent deep-research passes and an adversarial verification), and the verified Swedish data-sources report (June 2026). Every finding is mapped to what it means for the system.

---

## Opening

A system that promises to help people back to work owes them evidence, not enthusiasm. This document collects what the research actually says about why people get stuck, what helps, what does not, where digital tools and AI help and where they harm, and how re-skilling really pays off. It then shows how each finding shapes a specific part of the HelloLilly system.

Two things make it more than a literature list. First, every number has been reconciled against an adversarial verification pass: several widely repeated figures were found to be wrong, mis-attributed or retired, and they are listed at the end so nobody repeats them. Second, every finding is tied to a design consequence in the Version 4 system, so the research is not decoration. It is the reason the system looks the way it does.

### How to read the confidence levels

| Level | Meaning |
|---|---|
| **Strong** | Meta-analysis, randomised trial, or large register study, confirmed across independent passes |
| **Good** | Peer-reviewed or authoritative source, verified, sometimes with a correction |
| **Indicative** | Single source, observational, institutional report or preprint: shapes design, never quoted as proof |
| **Projection** | Forecasts and automatability estimates: not observed outcomes |

Most of the causal backbone is quasi-experimental and meta-analytic, reinforced by a few narrow randomised trials. That is a strong base for honest design, and a weak base for grand promises.

---

## 1. Why People Get Stuck

### Unemployment harms mental health, causally

**Strong.** Across hundreds of studies, unemployed people report substantially worse mental health than employed people (an average difference around d = 0.5), and about one in three unemployed people show psychological problems against one in six of the employed. Longitudinal studies and natural experiments indicate that unemployment causes the harm rather than merely accompanying it, and that re-employment improves it, though not always fully.

Part of the harm is the loss of what work gives besides money: time structure, social contact, purpose, status and activity.

**For HelloLilly:** the system must give structure and contact back, not only information. That is the job of Progress Support, the Community and the coach. And the tone must never add to the burden: argue for the person, never judge them.

### Job search is a self-regulation task

**Strong.** Job search requires setting goals, planning, sustaining effort, reading feedback and coping with setbacks over months. Self-efficacy, clear goals, planning and search intensity predict offers and re-employment; negative affect and poor coping predict slower return.

**For HelloLilly:** one clear next step at a time, a living plan, visible progress, and feedback that explains rather than discourages.

### The practical barriers

**Good.** Recurring obstacles are poor applications, weak tailoring, weak interview skills, not knowing which channels work, and too narrow or too unfocused a search. High volumes of untargeted applications do not work; they increase rejection and discouragement. Better targeting does.

**For HelloLilly:** fewer, better applications. Match Analysis, the Go or Cut gate, the tailored CV, Interview Preparation and the Contact Planner all exist to replace volume with quality.

### Disadvantage accumulates with time out of work

**Good.** The longer someone is out of work, the more mental health, search effort and employer interest decline, and the more learned helplessness sets in. Speed matters.

**For HelloLilly:** restore momentum early; make the first week count.

### The pains specific to changing career

**Indicative.** Career changers face a distinct layer: an occupational identity they are reluctant to give up, decision paralysis when there is no target role, the financial risk of starting over, loss of status, fatigue at starting credentials from scratch, and imposter feelings. The evidence here is mostly qualitative, so these pains are designed for, but no effect sizes are attached.

**For HelloLilly:** the Transition Compass, Direction Explorer, Prior Learning Check and Test Before You Invest exist for exactly these pains.

---

## 2. What Actually Works

### Job-search help works, when it builds both skill and motivation

**Strong.** A meta-analysis of 47 studies found that job-search interventions raise the odds of employment about 2.67 times, but **only** when they build both job-search skills and motivation. The effect runs through skills, self-efficacy and actual search behaviour. Skills-only or motivation-only programmes underperform.

**For HelloLilly:** this is the case for the division of labour. The system carries skill and execution; the coach carries motivation. Neither alone is enough.

### Job clubs work

**Strong.** Structured job clubs, with daily tasks, peer support, practice and accountability, placed more people faster than unstructured search. Effects are larger where structure and active practice are kept high.

**For HelloLilly:** the Community, peer support in the Expertise Exchange, Progress Support and Interview Training emulate the job-club ingredients.

### Building mastery works, most for those starting lowest

**Good.** The JOBS II randomised trial found significantly higher re-employment, higher income and better mental health two years on, with the largest benefits for people who started with low motivation and low sense of mastery. (The often-quoted "55 per cent higher odds" could not be verified and must not be cited.)

**For HelloLilly:** confidence is not soft; it is causal. Interview Training, rehearsal and being accompanied through the work are part of the outcome, not decoration.

### Place first, then support

**Strong, with a population caveat.** Individual placement and support, which places people quickly into real work and supports them afterwards, raises competitive employment considerably for people with serious mental illness (in a Swedish trial, 46 per cent against 11 per cent at eighteen months). The numbers do not transfer to all jobseekers; the mechanism does: rapid placement with in-work support beats train-then-place.

**For HelloLilly:** the Placement Finder, the Employer Bridge and the fork that always shows "apply now".

### Programme type predicts effect

**Good.** Job-search assistance gives earlier gains; human-capital training pays off later; subsidised public-sector jobs are ineffective; information-only measures such as one-off seminars or leaflets have limited impact. Small if-then planning prompts help follow-through, but never replace substantive support.

**For HelloLilly:** information alone is not help. Every explanation in the Situation Guide ends in a next step, and Lilly hands over to action, not to reading.

### Coaching works when it is supportive, not when it is surveillance

**Good.** More frequent meetings with clear expectations and supportive counselling improve job-finding; purely administrative monitoring can feel punitive and works less well.

**For HelloLilly:** support, not surveillance. Activity is logged to help the person, never to monitor them.

---

## 3. Digital Tools and AI

### Better recommendations change behaviour, not necessarily outcomes

**Strong.** Large field experiments with algorithmic job recommendations, including one on Sweden's largest job platform, substantially changed what people clicked and applied to, and broadened their search, but did not on average improve job-finding or earnings.

**For HelloLilly:** a better search engine is not the product. Matching alone does not solve unemployment, which is why the system is built around execution, people, coaches and routes, not around a ranking algorithm.

### CV tools improve intermediate scores, not proven hiring

**Indicative.** Applicant-tracking-optimised CV tools improve keyword and structure scores, but their effect on actual hiring is under-researched.

**For HelloLilly:** the Application Check is honestly labelled a simulation, and CV export is tested for parseability rather than sold with a universal "ATS score".

### Self-service career tools alone are the weakest option

**Good, with a scope caveat.** Career interventions delivered by computer alone were not significant in a meta-analysis; counsellor involvement significantly outperformed them. The evidence predates modern AI and rests on few studies, so it does not prove AI is weak, but it puts the burden of proof on AI-alone.

**For HelloLilly:** the coach stays in the loop by design. AI is the coach's force-multiplier, not the coach's replacement.

### Digital-first widens the gap

**Good.** Higher digital skills make online job search more successful and less exhausting; low digital skills reduce success and raise burnout. Because digital skills follow education and income, digital-first tools risk amplifying inequality. Blended human and guided digital help is needed for low-literacy and low-access groups.

**For HelloLilly:** no digital gate. Spoken mode, one question at a time, plain Swedish, mobile first, and the do-it-together mode with a coach are design rules, not features.

---

## 4. Re-skilling and Education

### Training pays off, slowly

**Strong.** Labour-market training shows near-zero or negative returns while people are studying, turning positive at around two to three years. Swedish labour-market training shows a clear long-run income gain (around 8,900 kronor at three years, about 6,500 at five, persisting for roughly nine years in a study of some 90,000 participants).

### Short and demand-aligned beats long

**Good.** Labour-market training shows about 7 per cent higher income at five years than comparable municipal vocational study, with courses about a third as long. Training passes cost-benefit tests mainly when demand is strong and targeting careful, and effects have varied strongly between decades.

### Vocational college outcomes are good but cooling

**Good.** 81 per cent of 2024 vocational college graduates were in work about a year later, down three points and the lowest since 2013 (earlier cohorts reached 89 to 91 per cent). A descriptive share, not a causal effect.

### Recognition of prior learning shortens paths

**Good.** Effective course choice combines labour-market data with recognition of what the person already knows (validering), avoiding redundant training. No open national data source yet shows which programme recognises what.

### The grant reaches the advantaged first

**Good, correlational.** The transition study grant has been used disproportionately by higher-educated workers and those in occupations at low risk from AI. Higher-risk individuals apply more but are granted less, partly because a fixed budget handled first-come-first-served rewards the fastest and most complete applicants. Some funded study may have happened anyway.

### Retraining does not always move people out of exposed work

**Indicative, preprint, United States.** A large non-peer-reviewed analysis of US public retraining found that many participants stayed in the same occupation or industry, and that wage gains may partly be catch-up. It does not transfer directly to Sweden, but it supports the same honest framing.

**For HelloLilly, all of section 4:** the fork that always shows applying now; labour-market training offered first; courses ranked by demand; the Prior Learning Check before any course; the Funding Navigator built to make the underserved the best prepared; honest timelines in months and years; and no promise of escape from a changing labour market. All of this is the Learn and Re-skill route.

---

## 5. Who Is Hit, and How

| Group | What the evidence shows | Confidence | What HelloLilly does |
|---|---|---|---|
| **Long-term unemployed** | Stigma, skill erosion and mental-health burden compound; training and wage subsidies show larger effects for this group | Good | Momentum early, placements, and the coach for motivation |
| **Older jobseekers** | In Sweden, callbacks fall from the early forties onwards (about half a percentage point per year), steeper for women; strongest against older women in US field experiments | Strong (causal, callbacks not hires) | Positioning strategy, employer relationships and the coach network; never "take another course" as the answer to bias |
| **Forced changers** | Forced change can leave a wellbeing deficit lasting years after re-employment; money is the most consistent predictor of how a transition ends | Good, correlational | The Transition Compass asks why first; a wellbeing check in the Transition View; Transition Economics |
| **Migrants** | Language, non-recognised credentials and discrimination; language training combined with work practice is promising; early intensive integration speeds entry but the long-run gap closes as others catch up | Good | Plain-Swedish explanations, the Prior Learning Check for foreign qualifications, placements |
| **Neurodivergent people** | Tailored one-to-one job development with on-the-job support raises employment; job carving and adapted environments help | Indicative for this group | Specialist coaches reachable through Coach Network, one step at a time, no nagging |
| **Low digital literacy** | Less success and more burnout online; blended support needed | Good | No digital gate; the do-it-together mode |
| **Young people outside work and education** | Overlapping risks; early outreach and coordinated services matter; Swedish implementation has been fragmented | Indicative | One coordinated system rather than scattered services |
| **People on sick leave** | A new instrument from March 2026 lets a person on full sickness benefit test work at their own employer for limited periods while keeping the benefit | Good (statute) | Surfaced by the Transition Compass as a matter of course |

---

## 6. How Big the Disruption Is

**Projection.** Employers in the World Economic Forum's 2025 survey project 170 million jobs created and 92 million displaced between 2025 and 2030, a structural churn of 22 per cent (creation plus displacement, not 22 per cent of jobs eliminated), and expect 39 per cent of workers' core skills to change by 2030.

**Projection.** The often-quoted 47 per cent of US jobs "at high risk" is an occupation-based estimate, not a prediction of losses. Task-based estimates are far lower: around 9 per cent (2016) to 14 per cent (2018) at high risk across OECD countries, with about a third facing significant change. Sweden sits near the lower end. Later work found jobs at high risk did not collapse as feared.

**For HelloLilly:** the disruption is real enough to justify a serious second route, and not large enough to justify fear-based selling. The system speaks about change calmly and in dated facts.

---

## 7. From Evidence to Design

The table below is the bridge between research and system. Every row is a design decision in the Version 4 vision that rests on evidence above.

| Evidence | Design decision | Where it lives in the system |
|---|---|---|
| Help works only when it builds skill **and** motivation | The division of labour: the system carries skill and execution, the coach carries motivation | The whole system; the coach section of the paper |
| The counsellor is the reliably effective ingredient | AI as the coach's force-multiplier; coach sign-off on big decisions | Coach tools, Transition View |
| Digital-first widens the gap | No digital gate as a design rule | Spoken mode, plain Swedish, mobile first, do-it-together |
| Unemployment causally harms mental health | Structure, contact and a kind tone; argue for the person | Progress Support, Community, all copy |
| Job clubs work | Peers, structure and accountability built in | Community, Expertise Exchange, Progress Support |
| Mastery matters most for those starting lowest | Rehearsal and accompaniment as part of the outcome | Interview Training, LinkedIn Helper, Coach Review |
| Untargeted volume does not work | Fewer, better applications | Match Analysis, Go or Cut, tailored CV, Contact Planner |
| Better recommendations do not by themselves raise job-finding | The product is execution and people, not a ranking algorithm | The routes and the human layer |
| Rapid placement with support beats train-then-place | Placements as a first-class route; "apply now" always shown | Placement Finder, Employer Bridge, the fork |
| Training pays off slowly; short and demand-aligned is better | Honest timelines; labour-market training first; demand-ranked courses | Education Matcher, Transition Economics |
| Recognition shortens paths | Check recognition before recommending courses | Prior Learning Check |
| The grant reaches the advantaged first | Make the underserved the best prepared | Funding Navigator |
| Forced change and money shape wellbeing | Ask why first; show the money | Transition Compass, Transition Economics |
| Age bias is causal and starts early | Positioning and employer relationships, not more courses | Coach Network, Network Match, Transition View |
| Information-only measures have limited impact | Every explanation ends in a next step | Situation Guide, Lilly |
| ATS tools prove intermediate scores, not hiring | Honest simulation labels; tested parseability | Application Check, CV export |

---

## 8. What a Digital System with Coaches Can Carry

Adapted from the July research, using the corrected evidence:

| Need | Can the system plus coach help? | How, in HelloLilly |
|---|---|---|
| Low job-search self-efficacy | Strong | Accompanied execution, rehearsal, visible progress, coach |
| Mental distress | Mixed | Structure and contact; the coach refers onward when clinical help is needed |
| No target role | Mixed | Direction Explorer, with the coach to validate |
| Identity and sunk cost | Mixed | Stories from people who made the move; the coach for depth |
| Understanding the money | Strong | Funding Navigator, Transition Economics |
| Mapping skills to occupations | Strong | Direction Explorer on the national skills taxonomy |
| Knowing what is in demand | Strong | Demand data in the Education Matcher and Job Radar |
| Foreign credential recognition | Strong as a guide | Prior Learning Check, in plain Swedish |
| Age bias | Mixed | Positioning, employer relationships, coach network |
| Following through | Strong | One next step, reminders, if-then planning |
| Testing before investing | Mixed | Test Before You Invest; supply depends on employers and coach networks |
| Peer and role-model support | Mixed | Community and Expertise Exchange, with moderation |
| People excluded by digital tools | Not alone | Only with the do-it-together mode and mobile-first design |
| Hand-off to a human | Strong | Coaching Prompts, Lilly hand-over, Case Record |

---

## 9. What We Should Measure

To learn what works for whom, the research is clear that placement rates alone are not enough.

| Kind | Measures |
|---|---|
| **Outcomes** | Time to work or education; employment at 6, 12 and 24 months; earnings; job quality (contract, hours, match to training); retention |
| **Intermediate** | Job-search self-efficacy, motivation, confidence, wellbeing indicators (with consent) |
| **Process** | Applications and their quality, interviews per application, routes used, support taken up, plans followed |
| **Who** | Prior work and education, recognised skills, digital comfort, constraints, always with consent and minimum five people per figure |

Re-skilling must be judged on a horizon of years. A system that judges it on six to twelve months will systematically undervalue it. And because outcomes depend on many components at once, the Outcome Engine records dated facts and never claims cause.

---

## 10. What Not to Cite

These figures circulate widely. They are wrong, mis-attributed, unverified or retired, and must not be repeated in any HelloLilly material.

| Do not say | Say instead |
|---|---|
| The transition grant pays "about 19,400 kronor a month" | 80 per cent of income, capped at 5,773 kronor a week before tax (2026), always with the year |
| Vocational college graduates are "89 per cent employed" | 81 per cent of 2024 graduates, the lowest since 2013; 89 per cent was the 2020 cohort |
| "22 per cent of jobs will be eliminated" | 22 per cent structural churn (creation plus displacement); displacement alone about 8 per cent |
| "27 per cent of jobs are at high risk (task-based)" | Task-based estimates are 9 to 14 per cent; 27 per cent comes from a different method |
| JOBS II gave "55 per cent higher odds of employment" | Significantly higher re-employment, largest for those starting with low motivation |
| Refugee early integration gave "a lasting 15-point gain" | A short-run gain that faded as others caught up: faster integration, not a higher level |
| Age discrimination "accelerates near retirement" | It begins in the early forties and is steeper for women |
| Choosing the change is "the main predictor" of wellbeing | Money is the more consistent predictor; forced change leaves lasting effects |
| "Career counselling has an effect of d = 0.77" | The defensible benchmark is d = 0.35 to 0.45 |
| Placement rates (such as "88 per cent found a job") as proof a programme worked | Placement rates describe; only controlled comparisons show cause |
| "Fabrication is structurally impossible" in our CV tools | Fabrication is caught by an independent check and regression-tested against an adversarial corpus |

---

## Appendix: The Swedish Data Behind the System

Verified in June 2026. The core sources are open, free and need no key; a few are files rather than live services.

| Need | Source | Access | Note |
|---|---|---|---|
| All publicly funded courses | Susa-navet (Skolverket), one national feed covering komvux, vocational college, university and labour-market training | Open, no key, daily | About 272,000 education events; verified live |
| Planned adult education | Skolverket Planned Educations | Open, no key | Supplementary |
| Occupations and skills | JobTech Taxonomy (Arbetsförmedlingen), including the European ESCO links | Open for reading | The join key for everything else |
| Education to occupation | JobEd Connect | Open in practice; key may be enforced later | The bridge from course content to occupations and skills |
| Shortage and five-year outlook | Yrkesbarometern | Open file, twice a year | To be inspected before it becomes the ranking backbone |
| Vacancies | SCB statistics (vacancy and recruitment tables) | Open API | Verified live |
| Live advert volume | JobTech JobSearch and Historical Ads | Free key or open | Well documented |
| Vocational college outcomes | SCB and MYH statistics | Open, partly reports | Licence terms for MYH files to be confirmed |
| Recognition of prior learning | No open source per programme | Gap | Guidance only; never invented |

Not usable: the university admissions statistics site (no API), the credential exchange service (institution-only), and the EU job portal (no open outbound access).

**Sources.** Card, Kluve and Weber, active labour-market policy meta-analyses; Liu, Huang and Wang 2014; Paul and Moser 2009; Kanfer, Wanberg and Kantrowitz 2001; Vinokur and others 2000 (JOBS II); Azrin's job-club studies; Bond, Drake and Pogue 2020 and Bejerholm and others 2015 (IPS); Whiston and others 2017; IFAU reports including 2025:2 and Vikström and van den Berg 2022; Fredriksson and Seim, SNS Analys 104 (2024); CSN statistics (February 2026); MYH and SCB graduate surveys; Carlsson and Eriksson 2019; Neumark, Burn and Button 2019; Vogelsang, Olson and Shultz 2018; Dahlberg, Egebark and Vikman (IFAU 2023 and 2024); OECD (Arntz and others 2016; Nedelkoska and Quintini 2018; Bechichi and others 2019); WEF Future of Jobs 2025; Proposition 2025/26:53; Jacobs and Canedy 2026 (preprint). Full references are in the underlying research files.
