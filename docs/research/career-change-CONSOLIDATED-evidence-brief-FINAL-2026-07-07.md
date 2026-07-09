# Career Change, Second Careers & Re-education: Consolidated Evidence Brief
### For HelloLilly — AI + human-coach product spanning the gap-fill to forced-full-re-education spectrum

**Date:** 2026-07-07. **Supersedes** the interim `hello_lilly_consolidated_evidence_summary.md`.
**Inputs consolidated:** (1) Claude deep-research pass v2 (`claude-deep-research-career-change-v2-2026-07-06.md`); (2) ChatGPT deep-research brief; (3) Perplexity deep-research brief (`HelloLilly Career Transition Evidence Brief`); (4) a fresh 16-claim adversarial web-verification of the new/contested claims from passes 2 and 3.

**Status:** Final consolidated brief. Merges two verification streams: (A) a Claude adversarial pass (21 confirmed claims, 11 findings) and (B) fresh adversarial verdicts on new/contested claims from ChatGPT + Perplexity passes. Every number below has been reconciled against the fresh verdicts.

**How to read the confidence tags:**
- **triple-confirmed** — agreed across all passes and/or independently corroborated by more than one source lineage.
- **verified** — confirmed by the adversarial pass against a primary/authoritative source.
- **verified-with-correction** — the direction holds, but a number, year, or framing was wrong and has been fixed here.
- **single-source** — one authoritative source; no independent corroboration.
- **preprint** — non-peer-reviewed working paper; treat as suggestive, not settled.
- **refuted-do-not-cite** — failed verification; listed in the appendix.

**Evidence-tier honesty note (read first):** Most of the *causal* findings in this brief are **quasi-experimental or meta-analytic**, not randomized controlled trials. The genuine RCTs here are narrow (IPS for serious mental illness; JOBS II; a 140-person Swedish refugee trial). Nearly all of the "how many jobs will change" figures (WEF, Frey/Osborne, OECD) are **projections or automatability estimates, not observed outcomes, and not causal forecasts**. Several of the external passes' supporting citations were **not each independently verified** — where a claim rests on a single external citation, it is tagged single-source or preprint. Do not present modelled or projected numbers as measured fact.

---

## 1. Triple-confirmed / highest confidence

These are the findings the passes agree on and that rest on the strongest evidence lineage. Build the product's core claims on these.

### 1.1 Retraining pays off medium-to-long term, not immediately
**Tier: meta-analysis + register data · triple-confirmed**
Active labour-market training shows near-zero or even negative returns in the short run (the "lock-in" period while people are studying), turning positive at roughly 2–3 years and beyond. Effects are larger for genuine human-capital programs and in downturns.
*Sources: Card/Kluve/Weber meta-analysis; IFAU 2025:2.*

### 1.2 Swedish labour-market training (arbetsmarknadsutbildning) has a clear positive long-run effect
**Tier: quasi-experimental (~90k participants) · triple-confirmed**
+8,880 SEK income at 3 years, declining to ~6,470 SEK at 5 years, and persisting for roughly 9 years.
*Sources: IFAU remissvar; Vikström & van den Berg, Econometrica 2022; Arbetsförmedlingen 2023.*

### 1.3 Labour-market training beats comparable komvux vocational study
**Tier: register quasi-experimental · verified**
About 7% higher income at 5 years for arbetsmarknadsutbildning versus comparable municipal vocational study.
*Source: Liljeberg et al. 2019 via IFAU 2025:2.*

### 1.4 Job-search interventions work causally — but only when they combine skills AND motivation
**Tier: meta-analysis (47 studies) · triple-confirmed**
Odds of employment rise (OR = 2.67) **only** when an intervention builds both job-search skills and motivation; the effect is mediated by skills, self-efficacy, and actual job-search behaviours. Skills-only or motivation-only programs underperform.
*Source: Liu, Huang & Wang 2014.*

### 1.5 Program type predicts effectiveness
**Tier: meta-analysis · verified**
Job-search assistance is favourable (especially short-run). Subsidised public-sector employment is ineffective. Human-capital training pays off later.
*Source: Card/Kluve/Weber.*

### 1.6 Individual Placement and Support (IPS) causally raises competitive employment
**Tier: meta-analysis of RCTs · triple-confirmed (with population caveat)**
Across 28 RCTs (N = 6,468), **55% of IPS participants** achieved competitive employment versus **25% of controls** (Bond, Drake & Pogue 2020, *World Psychiatry*). An independent meta-analysis (Frederick & VanderWeele 2019, *PLOS ONE*, ~25 RCTs) puts the pooled relative risk at **RR ≈ 1.6–1.8**. In **Sweden specifically**, the Bejerholm et al. (2015) RCT confirmed the advantage: **46% (IPS) vs 11% (control)** competitive employment at 18 months.
**Two honest caveats:** (1) The 55%/25% are a **simple across-study average** of "any competitive employment during the study," not a pooled point-in-time rate, and the sample skews US; the more defensible pooled statistic is RR ≈ 1.6–1.8. (2) This evidence is **specific to serious mental illness** (schizophrenia-spectrum, bipolar, major depression). **Do not transfer the 55% to a general career-transition audience** — that is a population overstatement. What *does* transfer is the mechanism: rapid placement into real work with in-work support beats train-then-place.
*Sources: Bond, Drake & Pogue 2020; Frederick & VanderWeele 2019; Bejerholm 2015.*

---

## 2. Premise-challenging findings (elevate these)

These two findings cut against the intuitive "just retrain people" pitch. They are the most strategically important results in the brief and should shape the product's honesty.

### 2.1 The equity / deadweight problem: Sweden's retraining grant is captured by the already-advantaged
**Tier: institutional-methodology (register data) · double-sourced (IFAU + SNS) · verified-with-correction**

Sweden's **omställningsstudiestöd** (transition study grant, introduced Oct 2022 under the LAS reform) is, in its first two application rounds (autumn 2022 + spring 2023), used **disproportionately by higher-educated workers and by workers in occupations at LOW risk of AI displacement**. The groups hardest hit by structural change — the low-educated and those in high-AI-risk occupations — apply at *lower* rates. Among applicants, CSN grants the support more often to the higher-educated and to those with lower individual unemployment risk (partly a mechanical consequence of a fixed budget + first-come-first-served processing, since higher-educated applicants apply faster).

**Two corrections the simple story misses:**
1. At the **occupation** level, *automation* risk shows **no** significant relationship with applying — only *AI* risk does.
2. At the **individual** level, higher unemployment-risk workers actually **apply more**, but are then **granted less**. So the "well-attached benefit most" pattern operates through the *granting* stage for unemployment risk, and through the *application* stage for education/AI risk.

**And a deadweight finding:** the grant appears to **subsidise education that would have happened anyway** — income paths of granted versus rejected applicants are near-identical.

**Key numbers:** Population mean application probability ≈ 0.4 pp. Education: +1 year → +0.04 pp applying (~10% of mean) and +2.6 pp being granted (~9% of the 29 pp mean grant rate). AI risk: applying is 0.7 pp *lower* for the highest-AI-risk occupations. Individual unemployment risk: applying *rises* (+0.17 pp per +5 pp risk) but being granted *falls* (−12 pp per +5 pp risk). Mean grant rate ≈ 29%. 2023 budget: 1,360m SEK budgeted vs only 625m SEK spent. Sample: individuals aged 30–55 in 2022 with 2020 monthly income > 20,000 SEK; applicants average 40 years old, 13.3 years of schooling, 60% women.

**Honest caveats:** This is **descriptive/correlational** register analysis, **not causal** — do not read the associations as effects of the grant itself. It is an **institutional policy report (SNS Analys 104 / "SNS Research Brief 104")**, not a peer-reviewed journal article. It is **Sweden-specific** institutional design and will not transfer mechanically abroad. It covers **only the first two rounds** — an early-adopter snapshot; caps and behaviour change annually. It is **double-sourced**: consistent with the SNS Konjunkturrådsrapport 2023 and the IFAU (2021) line on who structural change hits hardest — so it corroborates rather than merely echoes IFAU (note Fredriksson is a common author across the two SNS works).

*Sources: Fredriksson & Seim, SNS Analys 104, Sept 2024; corroborated by IFAU remissvar 2026-02-04 and Fredriksson & Seim 2024 (Finding A10 in the Claude pass).*

**Product implication:** the people most exposed to disruption are the *least* likely to reach for public retraining money on their own. A product that only serves motivated, higher-educated self-starters will *reinforce* this inequity. Reaching the underserved is a differentiator, not a nice-to-have.

### 2.2 Public retraining often does NOT move people out of exposed occupations
**Tier: preprint (US) · single-source · preprint — cite with heavy caveats**

A 2026 arXiv **preprint** (Jacobs & Canedy; **not peer-reviewed**) analysing **23M+ US WIOA participation records (2017–2023)** finds that public retraining **rarely shifts participants into less automation-exposed occupations**: ~**27% stayed in the same occupation** and ~**45% returned to the same industry**. The share moving to less routine work rose only modestly (routine-cognitive reduction 0.22 → 0.39; routine-manual → 0.29). The authors attribute positive outcomes mostly to **wage gains "possibly due to 'catch-up' mean reversion, rather than changes in occupation."**

**Honest caveats (this is the weakest-tier evidence in the brief, so state them plainly):** The study is **explicitly predictive/descriptive, NOT causal** (gradient-boosted trees + logistic regression; propensity matching "unable to account for unobservables"). There is **no non-participant control group**. It **conditions on successful re-attachment** (drops dropouts), which the authors say "almost certainly biases our index results upward." Horizon is only **4 quarters** post-exit. It is **US WIOA-specific** and does **not** transfer to Sweden's ALMPs. Treat "wage recovery is mainly mean reversion" as the authors' *interpretation of an association*, not an established decomposition.

*Source: Jacobs & Canedy, arXiv:2605.03767, v1 May 2026.*

**Product implication:** do not promise that retraining relocates people out of at-risk work. Some of what looks like "retraining success" is wage catch-up that would partly have happened anyway (this rhymes with the deadweight finding in 2.1 from an entirely different data system and country). The honest product goal is a *better-matched, more durable* transition, not a guaranteed escape from automation exposure.

---

## 3. What the labour market is actually doing (disruption sizing)

These are the "how big is the problem" numbers. All are **projections or automatability estimates**, not measured job losses. Cite them as such.

### 3.1 WEF Future of Jobs 2025 projection
**Tier: survey (institutional) · verified-with-correction**
Over 2025–2030, employers project **170M new jobs created** (~14% of current employment) and **92M displaced** (~8%), a **net +78M** (~7% of the 1.2 billion formal jobs studied). This equals **22% structural labour-market churn** (creation *plus* displacement combined — **not** 22% of roles eliminated). On average, employers expect **39% of workers' core skill sets** to be transformed or outdated by 2030.
**Corrections:** "22% of roles disrupted" must read as **churn**, not elimination (displacement alone ≈ 8%). The skills-change figure fell across editions (44% in 2023 → **39%** in 2025) — cite the 2025 edition. These are **employers' forward-looking expectations**, from **large multinationals** (14M+ workers, 55 economies), **global** with **no Sweden-specific breakdown**.
*Source: WEF Future of Jobs Report 2025.*

### 3.2 Automation risk: the 47% headline vs the more defensible task-based numbers
**Tier: peer-reviewed (Frey/Osborne) + institutional working papers (OECD) · verified-with-correction**
Frey & Osborne (2013 WP; 2017 published) estimated ~**47% of US employment** in occupations at high risk of computerisation (probability > 0.7). This is an **occupation-based** estimate, not a prediction of jobs lost. The **task-based** OECD approach — which accounts for non-automatable tasks *within* occupations, and is widely regarded as more defensible — gives far lower shares: **~9% average high-risk** across 21 OECD countries (Arntz, Gregory & Zierahn 2016), and **~14% high-risk + ~32% facing significant task change** (Nedelkoska & Quintini 2018, PIAAC, 32 countries).
**Correction (important):** the frequently cited **27–28%** figure is **NOT** the task-based estimate — it comes from the **OECD 2023 Employment Outlook** (a separate AI-era skills-and-abilities method). Citing "27% task-based" is a mis-attribution. The honest task-based numbers are **9% (2016) or 14% (2018)**.
**Context for Sweden:** Sweden was in the OECD sample and sits **near the lower-automatability end**. All of these are **automatability/risk estimates, not observed losses**; later OECD work (2021) found employment in high-risk jobs did **not** collapse as feared.
*Sources: Frey & Osborne 2017; Arntz et al. 2016 (OECD WP 189); Nedelkoska & Quintini 2018; OECD Employment Outlook 2019/2023.*

---

## 4. Direction-finding and career-choice interventions (keep expectations modest)

### 4.1 Career-choice / direction-finding interventions: small-to-medium effect
**Tier: meta-analysis (57 studies) · triple-confirmed**
Overall weighted mean **d ≈ 0.35** for career-choice interventions. Career-decision self-efficacy is the largest subgroup at **d ≈ 0.45** (k = 32). Other sub-outcomes: career decidedness d ≈ 0.29, career maturity d ≈ 0.40, vocational identity d ≈ 0.21. **This d ≈ 0.35–0.45 is the defensible benchmark for what direction-finding realistically achieves.**
*Source: Whiston, Li, Goodrich Mitts & Wright 2017, J. Vocational Behavior.*

### 4.2 Computer/online career tools used IN ISOLATION are the weakest modality
**Tier: meta-analysis · verified (with a big scope caveat)**
Career interventions delivered by computer/online **in isolation** were statistically **non-significant** (ES 0.067–0.149); **counselor involvement significantly outperforms** self-serve tools.
**Critical caveat:** this rests on **pre-2016 CACGS systems, k = 2–4 studies, described as "tenuous," and is NOT modern AI.** It does **not** prove modern AI is weak — but it *does* establish that the historical evidence for standalone computer guidance is thin, and that human involvement is the reliably-effective ingredient.
*Source: Whiston et al. 2017.*

### 4.3 RIASEC / Holland counselling — the d = 0.77 number is an outlier, not the benchmark
**Tier: quasi-experimental (single small study) · single-source · verified-with-correction**
A single small Indonesian study (2025, n = 67 beauty-vocational high-school students) reported **d = 0.77** for Holland/RIASEC career counselling on a self-report career-decision-making score (experimental M = 89.45 vs control M = 77.82). **This is confirmed as reported — but it is NOT a generalisable headline.** It is one posttest-only, self-report study on a narrow student cohort, not adult career-changers and not Sweden. It is roughly **2× the meta-analytic average**.
**Use instead:** cite **d ≈ 0.35–0.45** (Whiston 2017) as the expected effect. If d = 0.77 is mentioned at all, flag it explicitly as a single small student sample. A corroborating RIASEC review (Frontiers 2026) found RIASEC self-help tools reliably affect only *proximal* outcomes (exploration), with mixed effects on decision self-efficacy/identity.
*Sources: Salud, Ciencia y Tecnología 2025 (the d=0.77 study); Whiston et al. 2017 (the benchmark); Frontiers in Organizational Psychology 2026.*

### 4.4 Career-choice self-efficacy is the most movable lever
Consistent across 1.4, 4.1 and 4.3: **self-efficacy / motivation is where interventions get the most traction** (subgroup d ≈ 0.45; the OR = 2.67 employment effect is mediated by self-efficacy). Direction-finding that only produces a "career decision" score without moving self-efficacy or actual behaviour is measuring the wrong thing.

---

## 5. International and program-design evidence

### 5.1 International ALMP effects are heterogeneous and modest
**Tier: preprint (causal-ML) · single-source · verified**
Swiss causal-ML evidence: wage subsidies small-positive by year 3; **basic job-application courses NEGATIVE**; employment/language/computer courses no significant effect; most effective for **non-EU migrants**.
*Source: Mascolo et al. 2024/25 (preprint).*

### 5.2 JOBS II: job-search workshops help — most for the least-motivated — but the "55% higher odds" number is unverified
**Tier: RCT · verified-with-correction (magnitude UNVERIFIED)**
The JOBS II randomized field experiment (Vinokur, Schul, Vuori & Price 2000; n = 1,801 recent job losers, Michigan) found, two years out, **significantly higher reemployment, higher monthly income, and better mental health** in the intervention group, with **larger benefits for those who started with LOW job-search motivation and low mastery**. This is causal (RCT) and the direction + moderation finding are confirmed.
**Do not cite the "~55% higher odds of employment" magnitude.** It could **not** be verified in the primary source (the abstract reports no odds ratio; full-text tables were paywalled). The "55%" that surfaced in searches was a study **non-compliance rate**, not an employment OR — a real risk of conflation. Cite the direction ("significantly higher reemployment") and the moderation, not the number. (A *different* study — JOBS I / Caplan et al. 1989 — reported 53% reemployed vs 29% at 4 months; do not merge the two.)
*Source: Vinokur et al. 2000, J. Occupational Health Psychology.*

### 5.3 Early intensive integration for refugees: a real short-run gain that FADES, not a durable lift
**Tier: RCT (small) · verified-with-correction (claim's horizon was inverted)**
A small Swedish RCT (N = 140; 70/70; Gothenburg, 2017 cohort) of an early, intensive labour-market integration program for low-educated newly-arrived refugees found a large **short-run** employment effect of ~**+15 pp** (first-year employment up 15–20 pp; job-finding roughly doubled). The effect **persisted ~3 years then FADED to roughly zero — not because the treatment group fell, but because the control group caught up**; both converged to ~50% employment. Effects were driven mainly by **men** (the property-maintenance jobs offered were less attractive to women). The paper's real finding is **accelerated integration** (treated refugees reached the long-run level ~4 years earlier), **not** a permanent employment-level increase.
**Correction:** any claim of "positive long-run employment effects of ~+15 pp" **inverts** the headline. The +15 pp is short/medium-run; the long-run effect fades. The cited IFAU 2023:23 is a **working paper (not peer-reviewed)**; the peer-reviewed companion (JEBO 2024) covers the short-run result only. Very limited generalisability (tiny sample, one city, one intake, low-educated refugees, male-concentrated).
*Sources: Dahlberg, Egebark & Vikman, IFAU WP 2023:23; short-run in Dahlberg et al., JEBO 2024.*

---

## 6. Age, voluntariness, and wellbeing (who is transitioning, and how it feels)

### 6.1 Age discrimination in hiring is real, causal, and starts in the early 40s (Sweden)
**Tier: quasi-experimental (correspondence field experiment) · peer-reviewed · verified-with-correction**
A Swedish correspondence experiment (**Carlsson & Eriksson, Labour Economics 2019**; WP 2017 — **not 2018**) sent 6,000+ fictitious résumés (ages 35–70) to real employers. Callback probability declined roughly linearly at **~0.5 pp per year (~5 pp per decade)**; near retirement, callbacks fell to only **~2–3%** (overall average callback ≈ 8.7%). **Correction:** the penalty is **largest at the YOUNG end** — the sharpest single categorical drop is 35–43 → 44–52 (**−7.6 pp**), with the marginal penalty *shrinking* thereafter. So it is discrimination that **begins in the early 40s**, not a post-40 acceleration toward retirement. The decline is **steeper for women** (slope −0.0057 vs −0.0038 for men; at age 35 women had a 4.8 pp higher callback rate). This is **causal** (randomized age) but measures **callbacks, not hires**, in low/medium-skilled roles.
*Source: Carlsson & Eriksson 2019, Labour Economics 59:173–183.*

### 6.2 US corroboration: age discrimination strongest against older women
**Tier: quasi-experimental (field experiment) · peer-reviewed · verified-with-correction**
Neumark, Burn & Button (*JPE* 2019) sent **40,000+ applications to 13,000+ lower-skill jobs** across 12 US cities and found robust causal age discrimination, **strongest against older women** (the older-men effect was weaker after bias corrections). Older applicants got ~**29% fewer callbacks** overall. A separate 2023 meta-analysis (Batinovic et al., 13 studies) **corroborates** fewer callbacks for older applicants.
**Correction:** the 40,000+ study is **Neumark et al. 2019**, **not** the Batinovic meta-analysis (a distinct corroborating source). US, lower-skill only; callbacks not hires.
*Sources: Neumark, Burn & Button 2019 (NBER w21669 / JPE); Batinovic et al. 2023.*

### 6.3 Chosen vs forced change and wellbeing — real, but not "the primary predictor"
**Tier: observational · peer-reviewed · verified-with-correction (medium confidence)**
Whether a later-life change is **chosen (agentic)** versus forced is associated with post-change wellbeing — but it is **not the single primary predictor**. In the cited study (Vogelsang, Olson & Shultz 2018; US cross-sectional, n = 337 **successful** later-life career changers), intentionality was linked to more positive emotions, but **financial resources were the more consistent predictor** (linked to all three wellbeing outcomes); family support also mattered; prior job prestige and job training showed no relationship. That study **did not measure forced changes** and is **survivorship-biased** (only successful changers).
The stronger claim — that **forced changes produce wellbeing deficits that persist even after re-employment** — comes from a **different evidence base**: the unemployment-**scarring** literature (German SOEP, US HRS panels), which finds life-satisfaction scarring lasting **~5+ years after re-employment**. Both halves are supported, but by different sources; associations are **correlational, not causal**; scarring evidence is mostly German/US, not Swedish.
*Sources: Vogelsang, Olson & Shultz 2018 (chosen-change half); SOEP/HRS scarring literature, e.g. Social Forces 2022 (persistent-deficit half).*

**Product implication:** the emotional starting state differs sharply between a voluntary pivot and a forced one. A forced changer may carry a wellbeing deficit that survives re-employment. The product must **detect which situation the user is in** and route support (and expectations) accordingly.

### 6.4 Career-changer-specific pain points (thinner evidence — not independently verified here)
**Tier: qualitative / observational (from the ChatGPT + Perplexity passes) · NOT adversarially verified in this consolidation**
The external passes document a distinct pain-point layer specific to career changers (as opposed to ordinary job seekers): **occupational identity and sunk-cost lock-in**, **decision paralysis** when no target role exists, **financial risk** of starting over, **loss of seniority/status**, **credential-from-scratch fatigue**, and **imposter feelings**. This evidence is mostly **qualitative/observational** (occupational-identity and career-regret studies) and was **not** part of the 16-claim adversarial verification, so treat it as **directional design input, not established fact — and attach no effect sizes to it.** Two members of this cluster *are* better-evidenced and appear elsewhere as verified findings: **age discrimination** (6.1/6.2, causal) and **financial risk / the funding reality** (7.2). The honest reading: these pains are real enough to design *for* (identity reframing, decision structuring, a test-before-invest step), but the product must not quote research magnitudes it does not have.

### 6.5 Design-input methods flagged by the external passes (use, but do not over-claim)
**Tier: expert-practice / institutional · not verified here**
- **Test-before-invest** (informational interviewing, job shadowing, taster courses, work trials): universally recommended in career-guidance practice, but **causal evidence is thin/absent**. The logic is sound (reduce uncertainty before committing to long, expensive study); the evidence is expert/practitioner, not experimental. Concrete Swedish vehicles exist: **arbetsprövning** (7.5) and Arbetsförmedlingen **praktik**.
- **Occupational-adjacency tooling** (O*NET Career Changers Matrix; ESCO / O*NET skill-distance): a **legitimate taxonomy layer** for mapping the gap-fill to pivot spectrum, and it aligns with the OECD retraining-need model (7.6). It identifies *plausible adjacent roles*; it is **not validated as a hiring-outcome predictor** — do not claim it guarantees a successful transition. Employer notions of "adjacent" may differ from algorithmic adjacency.
- **Digital divide:** online-only tools **systematically exclude** the lowest-literacy, lowest-Swedish, older, and digitally-marginalised users — precisely the harder-to-place people the mission targets. This reinforces both the equity finding (2.1) and the coach-in-the-loop requirement (8.5): a **digital-first default widens the gap** rather than closing it.

---

## 7. Sweden-specific system facts (get these exactly right)

### 7.1 omställningsstudiestöd — eligibility
**Tier: primary/govt · verified**
CSN grant (from Oct 2022): up to 80% of prior income (see cap below), ages **27–63**, worked ~8 of the last 14 years (96 months) **and** 12 of the last 24; the education must strengthen the applicant's labour-market position. The public-sector route requires kommun/region/Sobona affiliation.

### 7.2 omställningsstudiestöd — the cap (corrected)
**Tier: administrative-statistics · verified-with-correction**
Grant = **80% of prior income up to a statutory cap of 4.5 income base amounts × 0.8**.
- Government (Regeringen.se): **max 24,180 SEK/month at 2025 price level**, full-time.
- CSN operational figure: **5,773 SEK/week before tax (2026)** (≈ 23,092 SEK per 4-week month). These two figures are the **same cap expressed differently** (2025 monthly vs 2026 weekly), not competing values — always cite the **year**.
- Above the CSN cap, collectively-agreed top-ups (e.g. **Omställningsfonden**, 2026) add 80% cover on monthly salary 31,276–38,225 SEK and 65% on 38,226–83,400 SEK.
- Duration: up to **44 weeks** full-time.
**DROP** the "~19,400 SEK/month (2025)" figure — no primary source supports it. All amounts are **before tax**, taxable, and pension-qualifying; **year-indexed** (revised annually).
*Sources: CSN (2026 figures); Regeringen.se (24,180 SEK/month at 2025 price level).*

### 7.3 omställningsstudiestöd — uptake is ramping fast
**Tier: administrative-statistics · single-source (CSN) · verified**
Persons who studied with the grant: **5,200 (2023) → 12,400 (2024) → 20,900 (2025)**. **~70% of 2025 recipients were over 40** (a feature of the eligibility design, not unusual older-worker enthusiasm). Approval rate rose from **17% (2023) to just under 50% (2025)**. Total paid out 2025: **SEK 2.3 billion**; ~half took the loan component.
**Caveats:** administrative **flow** counts ("studied during the year"), not unique users; **start-up ramp** (rising applications + approval rate as backlogs cleared) — do not extrapolate the growth trend. Single-source (CSN's own release), which is appropriate for an administrative statistic.
*Source: CSN press release, 4 Feb 2026.*

### 7.4 yrkeshögskola (YH) graduate employment — corrected and cooling
**Tier: survey (institutional) · verified-with-correction**
**81% of 2024 graduates** had work as their main occupation ~1 year after graduation (surveyed autumn 2025) — **down 3 pp YoY and the lowest since 2013**. Earlier cohorts were higher: **2020 = 89%**, **2021 = ~91%**, 2023 = 84%.
**Corrections:** the ~89% figure is correct **only for the 2020 cohort** — do not label it "2020/2021" (2021 was ~91%). Anchor on the **graduating year, not the survey year** (MYH's "2024 report" covers 2023 graduates). This is a **descriptive employment share, not a causal effect** of YH (no counterfactual), and it is **cooling** — citing 89% today overstates current outcomes. Self-report, ~42% response rate, ~1 pp margin of error.
*Source: MYH/SCB graduate survey.*

### 7.5 Work-testing with retained sickness benefit — new instrument from 1 March 2026
**Tier: institutional-methodology (statute) · verified-with-correction**
From **1 March 2026**, an employed person on **full (100%) sickness benefit** may do **"arbetsprövning" (work testing)** at their own employer while keeping full benefit — capped at **two 14-consecutive-day periods per 365-day window**, with a new period no earlier than the 30th day after the previous ends (Prop. 2025/26:53).
**Correction / terminology:** the new March 2026 instrument is **"arbetsprövning" (work testing)** — legally **distinct** from the older **"arbetsträning" (work training)**; do not conflate them.
Separately, the long-standing **rehabilitation chain (rehabiliteringskedjan)**: from **day 91**, work capacity is assessed against **any work at the current employer**; from **day 181**, against **any regular occupation on the wider labour market** (subject to exceptions). Note: a 2024 Riksrevisionen audit found the day-180 exception is applied more broadly than intended, so the day-181 gate is not as mechanical in practice.
*Sources: Proposition 2025/26:53; Försäkringskassan (rehabiliteringskedjan).*

### 7.6 OECD retraining-need spectrum (a useful framework for the gap-fill → total-pivot design)
**Tier: institutional-methodology · verified**
The OECD (Bechichi et al., STI Policy Paper No. 70, 2019) classifies feasible occupational transitions into three retraining-need scenarios by approximate training duration: **"small" (up to ~6 months), "moderate" (up to ~1 year), and "important/large" (up to ~3 years)**. It further distinguishes **"possible"** transitions (reasonable upskilling, similar knowledge) from the narrower **"acceptable"** ones (also limited wage loss, e.g. ≤10%).
**Caveats:** the durations are explicitly **"tentative and indicative"** — modelled from a skill-distance-to-training-time conversion (PIAAC points per year of education), **not measured retraining times**, and sensitive to the conversion parameter. It is a **cross-country OECD model, not Sweden-specific**, and "feasible within X" is a **technical possibility, not a behavioural prediction**. Illustratively: within 6 months, managers can transit to ~60% of occupations vs ~5% for elementary occupations; ~46% of occupations have no acceptable transition within ~6 months, dropping to ~13% when up to 1 year of training is allowed.
*Source: Bechichi et al., OECD STI Policy Paper No. 70, April 2019.*

**This framework maps directly onto the product's spectrum** (Section 8): small gap-fill ≈ ≤6 months, moderate ≈ ≤1 year, total pivot ≈ up to ~3 years — with an explicit warning that the durations are indicative, not promises.

---

## 8. What this means for the product

### 8.1 Honest positioning
The evidence does **not** support "retrain and you'll escape disruption." It supports a narrower, more defensible promise: **a better-matched, more durable, faster transition — with realistic expectations.** Retraining pays off on a **2–3 year+** horizon (1.1, 1.2), not immediately; some apparent gains are **wage catch-up / deadweight** that would partly have happened anyway (2.1, 2.2); and retraining frequently does **not** relocate people out of exposed occupations (2.2). Sell the durable match, not the escape.

### 8.2 Driver-first diagnostic (the product's opening move)
Before recommending anything, the product must diagnose **why** the person is transitioning, because the evidence says the right response differs sharply:
- **Voluntary pivot vs forced change** (redundancy, health): different emotional starting state; forced changers may carry a **persistent wellbeing scar** that survives re-employment (6.3). Route support and expectations accordingly.
- **On sickness benefit?** The March 2026 **arbetsprövning** route and the rehabilitation-chain day gates (91/181) are live, concrete options (7.5).
- **Age and gender:** hiring discrimination is real and causal, **begins in the early 40s**, and is **steeper for women** (6.1, 6.2). Older and female users need strategy that accounts for demand-side bias, not just supply-side upskilling.
- **Motivation/self-efficacy baseline:** interventions help **most** those who start with **low** motivation/mastery (5.2), and employment effects are **mediated by self-efficacy** (1.4). Measure the baseline; target the lever.
- **Exposure vs attachment:** the most-exposed are the **least likely** to self-serve (2.1). If the product only serves motivated self-starters, it reinforces the inequity.

### 8.3 The gap-fill → forced-full-re-education spectrum
Structure the product around the OECD retraining-need scenarios (7.6):
- **Small gap-fill (≤ ~6 months):** cheapest, fastest, highest feasibility; job-search assistance + targeted upskilling (1.5). Best short-run ROI.
- **Moderate (≤ ~1 year):** more transitions become "acceptable" (the ~46% → ~13% no-transition drop). Human-capital training with a 2–3 year payoff horizon (1.1).
- **Total / forced full re-education (up to ~3 years):** highest cost and lock-in; only justified when skill distance is genuinely large. Match to Swedish funding realities (omställningsstudiestöd cap and duration, 7.2; YH as a route, 7.4). Set expectations that returns arrive **years** out, not immediately.
Label the durations as **indicative**, never as guarantees (per OECD's own hedge).

### 8.4 Modest expectations for direction-finding
Direction-finding is worth doing but is a **small-to-medium** lever: **d ≈ 0.35**, rising to **~0.45 for career-decision self-efficacy** (4.1). Do **not** market it on the outlier **d = 0.77** (4.3). Target **self-efficacy and actual job-search behaviour** — those are what mediate real employment gains (1.4) — not just a "career decision" score.

### 8.5 Coach-in-the-loop is a requirement, not a feature
The strongest cross-cutting result: **human involvement is the reliably effective ingredient.**
- Standalone computer/online career tools (in isolation) were **non-significant**; counselor involvement significantly outperforms (4.2). (Caveat honestly: that evidence is pre-2016 CACGS, not modern AI — so it does not *prove* AI is weak, but it *does* mean the burden of proof is on the AI-alone modality, and human-in-the-loop is the safe, evidence-backed default.)
- Job-search interventions work only when they combine **skills AND motivation** (1.4) — a coaching relationship is the natural vehicle for the motivational half.
- The IPS lesson (1.6) — **rapid placement into real work with ongoing in-work support** beats train-then-place — is a coach-supported model, not a self-serve one.
**Design implication:** AI can scale assessment, information, matching, and practice; the **human coach** carries motivation, accountability, emotional support (especially for forced/scarred changers), and the demand-side navigation (age/gender bias) that tools do not address. Position AI as the **coach's force-multiplier**, not the coach's replacement.

---

## 9. Do NOT cite / contested (appendix)

### 9.1 Refuted in the Claude adversarial pass — do not cite
- **"Counselor support ES = 0.825"** — refuted (0–3). The real counselor-vs-computer story is 4.2, not this effect size.
- **"80% grant caps at ~24,180 SEK/month" presented as the flat monthly cap without year** — the figure itself is *correct* as the 2025-price-level monthly statement, but was previously mishandled; see 7.2 for the correct, year-tagged framing (24,180/month 2025 ≡ 5,773/week 2026).
- **"yrkesvux +3% at 5yrs concentrated in care/vehicle"** — unverified (1–0).
- **"Training effects larger for low-educated/foreign-born/LTU"** — unverified (1–0). (Note: intuitive and partly consistent with 2.1's "hardest-hit," but **not** verified here — do not state as fact.)

### 9.2 Corrected numbers — cite the corrected version, not the original
- **CSN cap "~19,400 SEK/month (2025)"** — **no primary source. DROP it.** Correct cap: 24,180 SEK/month (2025 price level) ≡ 5,773 SEK/week before tax (2026). (7.2)
- **RIASEC "d = 0.77 as the headline effect for career counselling"** — real but a single small student outlier (~2× the benchmark). **Cite d ≈ 0.35–0.45 instead.** (4.3)
- **YH "89% employed (2020/2021)"** — 89% is the **2020** cohort only; 2021 ≈ 91%; the **current** figure is **81% (2024 grads), lowest since 2013**. Cite the cohort and the decline. (7.4)
- **WEF "22% of roles disrupted/eliminated"** — it is **22% churn** (creation + displacement); displacement alone ≈ 8%. Skills-change is **39%** (2025 edition), not 44% (2023). (3.1)
- **Automation "27–28% task-based"** — **mis-attributed.** The task-based figures are **9% (2016) / 14% (2018)**; 27% is the OECD 2023 skills-and-abilities method, not the task-based work. (3.2)
- **Refugee RCT "positive long-run employment effect of ~+15 pp"** — **inverts the finding.** +15 pp is short-run; the long-run effect **fades to ~0** as controls catch up. (5.3)
- **Carlsson & Eriksson "2018" / "callbacks fall sharply after 40 / accelerate near retirement"** — year is **2019** (WP 2017); the penalty is **largest in the early 40s** and the marginal effect **shrinks** thereafter. (6.1)
- **Neumark 40,000-application study attributed to Batinovic 2023** — the 40,000+ study is **Neumark, Burn & Button 2019**; Batinovic is a separate corroborating meta-analysis. (6.2)
- **Voluntariness as "the primary predictor" of post-change wellbeing** — in Vogelsang 2018, **financial resources** were the more consistent predictor; the "persistent deficit after re-employment" half is from the **scarring** literature, not Vogelsang. (6.3)
- **"arbetsträning" for the March 2026 retained-benefit rule** — the new instrument is **"arbetsprövning" (work testing)**, distinct from arbetsträning. (7.5)

### 9.3 Unverified magnitudes — cite direction only, not the number
- **JOBS II "~55% higher odds of employment"** — **UNVERIFIED** (the "55%" in searches was a non-compliance rate). Cite "significantly higher reemployment" + the low-motivation moderation, **not** the odds ratio. (5.2)

### 9.4 Over-claim guard (carry forward from the Claude pass)
- **IFAU's own read: there is largely NO causal evidence that transition support improves outcomes**, and omställningsstudiestöd has so far been used mainly by well-attached, higher-income workers — judged **societally inefficient** (IFAU backs reducing the grant). This is consistent with 2.1.
- **TRR's "88% found a job" is a placement statistic, NOT a causal effect.** Do not present placement rates (or YH's 81%, or IPS's 55%) as causal proof that the program *caused* the employment. Only the RCT/quasi-experimental *differences* (IPS 55% vs 25%; arbetsmarknadsutbildning income effects; the refugee short-run +15 pp) carry a causal reading.

---

## 10. Evidence-tier summary

| Finding | Tier | Confidence tag |
|---|---|---|
| Retraining pays off 2–3yr+ (1.1) | meta-analysis + register | triple-confirmed |
| Swedish arbetsmarknadsutbildning long-run + (1.2) | quasi-experimental (~90k) | triple-confirmed |
| Training beats komvux vocational (1.3) | register quasi-exp | verified |
| Job-search: skills AND motivation (1.4) | meta-analysis (47) | triple-confirmed |
| Program type predicts effect (1.5) | meta-analysis | verified |
| IPS 55% vs 25% (1.6) | meta-analysis of RCTs | triple-confirmed (population caveat) |
| Grant captured by advantaged (2.1) | institutional register (IFAU+SNS) | verified-with-correction, double-sourced, correlational |
| WIOA doesn't move people out of exposure (2.2) | preprint (US) | preprint, single-source, non-causal |
| WEF Future of Jobs (3.1) | employer survey | verified-with-correction, projection |
| Automation 47% vs 9–14% task-based (3.2) | peer-reviewed + institutional WP | verified-with-correction, estimate not forecast |
| Career-choice interventions d≈0.35 (4.1) | meta-analysis (57) | triple-confirmed |
| Computer-only weakest (4.2) | meta-analysis | verified (pre-2016, not AI) |
| RIASEC d=0.77 (4.3) | single small quasi-exp | single-source, outlier |
| International ALMP heterogeneous (5.1) | causal-ML preprint | single-source, verified |
| JOBS II direction (5.2) | RCT | verified; magnitude UNVERIFIED |
| Refugee RCT short-run + fades (5.3) | RCT (small) | verified-with-correction (horizon inverted) |
| Age discrimination Sweden (6.1) | field experiment | peer-reviewed, verified-with-correction, causal |
| Age discrimination US, older women (6.2) | field experiment | peer-reviewed, verified-with-correction, causal |
| Chosen vs forced wellbeing (6.3) | observational | peer-reviewed, verified-with-correction, correlational |
| omställningsstudiestöd eligibility (7.1) | primary/govt | verified |
| CSN cap (7.2) | administrative | verified-with-correction |
| Uptake ramp (7.3) | administrative | single-source (CSN), verified |
| YH 81% cooling (7.4) | institutional survey | verified-with-correction, descriptive |
| arbetsprövning March 2026 (7.5) | statute | verified-with-correction |
| OECD retraining spectrum (7.6) | institutional methodology | verified, indicative durations |

**Bottom line on tiers:** the product's *causal* backbone is **quasi-experimental and meta-analytic**, reinforced by a few **narrow RCTs**. The *disruption-sizing* numbers are **projections/estimates, not measured losses**. The two premise-challenging findings (2.1, 2.2) are, respectively, **correlational register analysis** and a **US preprint** — strong enough to shape honest positioning, not strong enough to state as causal law. Do not let the volume of external citations imply each was independently verified; where a finding is single-source or preprint, it is tagged as such above.
