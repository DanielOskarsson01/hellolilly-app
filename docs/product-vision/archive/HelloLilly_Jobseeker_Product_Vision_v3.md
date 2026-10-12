# HelloLilly — The connected system that turns advice into outcomes

**Jobseeker Product Vision · Strategy Paper · Version 3 · October 2026 · Confidential draft**

Replaces the July 2026 version (36 pp). What changed is listed in Appendix C. Principles and boundaries are in the separate **Addendum A**.

---

## Opening

The reason for this tool is simple. Actually succeed at helping each jobseeker with what they really need, on their own terms. One needs help with execution. One needs help with confidence. Others need motivation, energy, connections, research, self-awareness, AI know-how, social-media skills, or a systematic approach. The right help depends on the person, not on which coach they happened to meet.

Much of what fills a jobseeker's day is formalia. Building a CV, drafting a cover letter, searching adverts, researching companies, writing outreach, sounding confident in an interview. These are execution and sales skills, not the qualities or expertise the person brings to a job. Where the formalia is necessary, AI agents should carry it, so the jobseeker's energy goes to showing who they really are. **Agents prepare. The person decides, approves every word, and sends.** And the coaches are freed for what only a human can do: motivate, advise, uplift, and help the person work through whatever is genuinely in the way.

HelloLilly already has the human infrastructure this work requires: coaches, participants across more than 60 municipalities, employer relationships, and the administrative system that holds it all together. What is missing is the layer above it. A connected, AI-supported system that meets each jobseeker on their own terms, does the preparation work between meetings, gives every coach access to the organisation's full knowledge, and turns every case into learning for the next person.

For some people the barrier is different again: not how they present who they are, but a direction not yet found or a skill not yet held. For them, education is a first-class route back to work, standing beside applying directly rather than beneath it. The system treats that route with the same seriousness as the first.

One has a flawless CV and freezes in every interview. One speaks four languages, just not the one the form is written in. One has applied to two hundred jobs and heard nothing back. One has not managed to open the laptop in a month. One is sixty and sure the phone will never ring. One spent twenty years in a trade that is thinning out, and needs a new direction more than a new CV. Every one of them is stuck, and every one is stuck for a different reason.

That is the gap. Not a missing feature, but a missing system. The model administers and advises, while the real work is left to the individual, to which coach they happened to meet, and to the gifts that one person happens to have. Nothing connects across people, and nothing accumulates over time.

> Do not leave outcomes to chance and good fortune.
> Optimise what can be optimised with technology.
> Let each jobseeker be part of their own journey, in the way they need and want it.

### Contents

1. Background
2. Everyone Is Stuck for a Different Reason
3. The Problems
4. Why People Will Engage
5. The Solution
6. The Unique Value
7. How We Build It Responsibly
8. The Full Vision
9. Build Order
- Appendix A: Why This Works
- Appendix B: A Week in the Life
- Appendix C: What Changed in Version 3

---

## 1. Background

HelloLilly is Sweden's largest provider of matching services, with offices in over 60 municipalities and a stated goal of matching 10,000 people to the right job or education by 2030. The funding is results-based, which means faster and better matches are not a nice-to-have. They are the business.

**But delivering advice is no longer enough.** Much of the actual work, the doing between meetings and reaching the right help at the right moment, still rests on the individual. The advice exists. Almost everything else is left to the person to carry.

**What changed is what AI agents can now do.** A year ago, an AI could help write a paragraph. Today, a set of agents can search for jobs every morning, read every advert, research the employer, tailor a CV, review the application from a recruiter's point of view, and prepare an interview, all before the person has had breakfast. The hard part is no longer generating the material. It is making sure every word is true, that the person stays in charge, and that the help reaches the people who need it most rather than the ones already confident with technology.

**A connected system is the missing piece.** A system like this turns HelloLilly from a service that tells people what to do into one that does the preparation with them, learns what works, and gets better over time. From guidance into momentum.

**Written from inside the program.** This vision comes from sitting on the participant side while also seeing it through the eyes of someone who builds digital products for a living.

**Several of these ideas are not drawings. They already run, in the author's own tooling.** A daily pipeline finds jobs, scores them for fit, tailors a CV into the right version, drafts the cover letter, and runs an automated consistency check before anything is sent. A war-room generator has been used to prepare for real interviews, with employer research and a bank of answers. A LinkedIn profile reader and a CSV import tool run in production in a separate content pipeline, and the method for enriching a person's own network from their contacts has been built and proven. Two pieces are still being worked out rather than running every day: a guided career intake that turns old documents into a clean CV, and the coach's private contact vault. The underlying tools are therefore not a hope. The work is to turn a process that needs a technical person at a terminal into a form that anyone can use, which is what HelloLilly is for.

---

## 2. Everyone Is Stuck for a Different Reason

Help for people out of work has historically been built around a working theory of the typical jobseeker, someone with a certain shape of barrier who needs a certain shape of help. That theory holds for some people some of the time. But there is no typical jobseeker. Everyone who has not found work has not found it for their own reasons, and each one needs different help to unblock it.

That width is the real difficulty, and it is no one's fault. Coaches are individuals with specific gifts. One has spent years placing nurses and knows the field cold. Another understands what it is to job-hunt with autism. A third has a knack for restoring confidence in people who have lost it. No one person can be the right gift for every life that walks through the door, simply because that is the human limit.

A system can do something no individual mind ever could: hold the full width of human difference. The idea is a hive of knowledge that quietly absorbs what every coach knows and what every situation teaches, and offers it back, so that any coach has the full library at their fingertips for the moments outside their personal expertise. That is not replacing the coach. It is freeing them to do what they are uniquely good at.

There is a flip side worth naming. In a high-technology world, the technology itself is often the blocker. For many people the systems, forms and tools are the barrier rather than the bridge. So part of the help is removing that friction entirely, and meeting people regardless of their comfort with technology, including those who fear it.

And the case is not only logical, it is evidenced. Solid research shows that the right tools and structured assistance raise the likelihood of finding work, and separate research shows that job clubs, built on structure, peers and accountability, do the same. The design here draws deliberately on both.

What makes the difference is the combination. A hive of knowledge that supports the coaches on one side, and a different set of tools, places and community for the jobseekers on the other. Each is valuable alone. Together they reach the full width that no model has reached yet.

---

## 3. The Problems

### The Execution Problem

- **How it is:** Coaching, by its nature, delivers advice and leaves the doing to the jobseeker. Advice, seminars and tips all end the same way, with the person still having to execute, alone. For many people the gap may not be advice at all, but execution: either the doing never happens, or it happens the wrong way, as a flood of untailored applications. Getting a job and doing the job are different skills, and yet the first decides access to the second. Sales skills should not decide whether a logistics manager or a truck driver is hired for work they could clearly do.
- **What is missing:** Something that does the preparation work alongside the person: finds the jobs, researches the employer, tailors the application and checks it, and leaves the person with decisions rather than blank pages.
- **The effect:** Good advice never becomes action. Momentum dies between meetings, and "it is up to you" becomes the exact point where progress stops.
- **Scenario:** Your coach said to tailor your CV for each role. Sound advice. It is now Tuesday night, you have three roles open in browser tabs, and you have no idea how to start. So you do not.

### The Consistency Problem

- **How it is:** When help rests on individuals, what each person experiences inevitably varies, because every coach brings their own gifts and their own limits. It is a feature of the model, not anyone's fault.
- **What is missing:** A consistent operational standard that does not depend on the gifts of the person each jobseeker happens to meet.
- **The effect:** People with similar starting points find themselves on very different paths. At scale, that variance becomes the largest hidden cost in any model built on individuals.
- **Scenario:** You and a friend both join. You get a coach who is brilliant with CVs, your friend gets one whose gift sits elsewhere. A year later one of you has a job and neither of you knows it came down to who you happened to meet.

### The Confidence Problem

This stands for inner barriers in general, not only confidence. Much of confidence is quietly fixed by not leaving the person alone with the work: the CV shaped with help, the cover letter checked, the interview rehearsed, the message reviewed. Each one stops the daily erosion and starts the rebuilding.

- **How it is:** For many long-term jobseekers the real barrier is not knowledge, it is belief. Age, repeated rejection, ADHD, autism and time out of work all erode confidence.
- **What is missing:** A way to rebuild self-efficacy and to practise without being judged. Structured job clubs, built on peers and accountability, place far more people than searching alone, and the system should emulate exactly that.
- **The effect:** People who know exactly what to do still freeze. The barrier is internal, and more advice does not touch it.
- **Scenario:** You have read every interview tip there is. You still feel sick the night before, you have nowhere safe to rehearse, and when the moment comes your mind goes blank.

### The Relevance Problem

- **How it is:** The help on offer can be genuinely good, and often is. But good is not the same as right for this particular person.
- **What is missing:** A diagnosis of the real blocker. Most people do not actually know what is stopping them from finding a job.
- **The effect:** Effort pours into the things that are already fine while the real obstacle goes untouched.
- **Scenario:** Your CV is polished and your interviews feel okay, and still nothing lands. No one has worked out that the real problem is the roles you are applying for, not the way you are applying.

### The Direction Problem

- **How it is:** For some people the barrier is not how they present who they are. The work they know is thinning out, or the role they want needs a skill they do not yet have. More applications cannot fix that, and today the honest answer, a new direction or new skills, is exactly where the help usually ends.
- **What is missing:** An honest path for changing direction: a realistic new target built on what the person already knows, the true cost of re-training in time and money, the funding that exists for exactly this, and applying directly kept as a real choice beside studying.
- **The effect:** People either keep applying into a shrinking corner of the market, or leap into long study on hope rather than evidence. And the people most exposed to the change are the least likely to find the support and the money on their own.
- **Scenario:** You have driven a truck for twenty years and the adverts now ask for certificates you do not have. Someone says "maybe retrain?" and hands you a course catalogue. Nobody can tell you which direction is realistic, what it would cost you, or whether applying anyway is the smarter move.

### The Silo Problem

- **How it is:** In any organisation built on individual expertise, knowledge and contacts live in the heads and address books of the people who hold them. Each coach has a real gift and a real network, but a gift in one head is not yet a gift the organisation can offer everyone.
- **What is missing:** A way to make any coach's expertise, and the reach of their network, available to every jobseeker who needs it, without exposing anyone's private contacts, and a way for the organisation to keep that expertise when a coach moves on.
- **The effect:** A jobseeker may end up with a coach whose gift sits in another area, not because anyone made a mistake but because there is no system to detect the match. And the one introduction that would have mattered never happens.
- **Scenario:** You are a nurse, assigned to the coach who used to place senior executives. The coach who has placed forty nurses, and who knows the head of the ward you want, is two desks away, and you will never meet them.

### The Barrier Problem

- **How it is:** Different people are blocked by different things. Some struggle to write, held back by a second language, dyslexia, or simply hating to sell themselves. Others struggle to search at all. For some the technology itself is the wall.
- **What is missing:** Help adapted to the specific barrier, built on collected, quantifiable data rather than one coach's memory.
- **The effect:** Without collected data, the help on offer tends toward the average, and the people furthest from average find the least suitable fit.
- **Scenario:** Swedish is not your first language. The advice is good but it is all in fast Swedish, the forms assume fluency, and asking for things to be slowed down feels like admitting you do not belong.

---

## 4. Why People Will Engage

This only works if people use it. Here is what brings each group in and keeps them coming back.

### For jobseekers

- **You are not alone** — see others in the same situation, and stop feeling like a failure.
- **Your morning starts with the work already done** — new jobs found overnight, sorted by how likely you are to want them and how well you fit, each with the reason. You decide; the system prepares.
- **Always a clear next step** — never the blank-page paralysis of not knowing what to do.
- **Nothing is ever said in your name that you did not approve** — every line in your CV and letter is something you have confirmed, and you press send yourself.
- **Every application makes the next one stronger** — each answer you give is saved and reused, so you never explain the same thing twice.
- **See people get out** — watching others land jobs is proof there is a way through.
- **A real community** — a place to ask, talk and belong, not just a portal you log into.
- **Share contacts and vouch** — introductions, references and honest opinions, the mechanic that works so well in startup incubators.
- **Works whatever your tech comfort** — talk instead of type, with one question at a time, or take full control if you want it.
- **Coach-approved help in one place** — knowledge, links, videos and guides, with Lilly, the assistant, there to explain any of them.
- **A real second route** — when the honest answer is a new direction or new skills, the system helps you find it, fund it and test it, with applying directly always kept beside it.

### For coaches

- **An internal system of their own** — shared presentations, and each coach's strengths and background searchable by every coach.
- **Their network stays theirs** — a coach's contacts stay on their own computer; the system can still tell when one of them could open a door, and the coach makes the introduction personally.
- **Help analysing and answering** — written help for hard questions, transcribed presentations and summaries, feeding a Sweden-specific knowledge base.
- **Meeting support** — with consent, sessions are summarised so help continues after the meeting.
- **A living picture of every jobseeker** — the shared case record shows goals, activity, applications and plans without chasing.
- **More time for the human work** — the report writes itself and the tool carries the mechanical load.

### For HelloLilly

- **Faster, better matches** — directly tied to funding and the 2030 goal.
- **A consistent standard** across every office.
- **Documented activity** generated as a byproduct, not chased after the fact.
- **Durable IP** — coaching expertise captured as a company asset rather than lost when people leave.
- **Easier to attract expertise**, and **a new kind of hire**: with AI carrying the operational baseline, HelloLilly can bring in specialists who understand autism, ADHD, age, youth, newcomers or disability, even if they are not traditional coaches.

---

## 5. The Solution

### The skeleton is already there

Providers in this sector, HelloLilly included, run on Workbuster Matcha (now part of Multisoft). It does what it is built to do well: administration, storing the data, scheduling, the library of templates and links, and the documentation that has to happen anyway. That is the skeleton. It is real, it is paid for, and it should stay.

What infrastructure cannot do on its own is create outcomes. Stored data is not learning. A library is not advice. A scheduler is not a conversation. The value is added by what sits on top: agents that do the preparation work, a community that connects the people, tools that help the jobseeker actually execute, and a learning layer that makes the whole thing better over time.

### The mechanism: agents prepare, the person decides

Every tool in this system follows the same pattern, in three steps:

1. **Agents prepare.** Search, research, drafting, reviewing and checking happen in the background, often overnight.
2. **The person decides.** At every gate the person chooses: keep or cut a job, accept or change a line, send or wait. Nothing is sent, posted or submitted in their name.
3. **Every decision is kept.** An accepted answer, a confirmed fact, a reason for cutting a job: each is saved, so the next round starts from more than the last.

The third step is what turns a set of tools into a system. The person's own bank of confirmed facts and wording grows with every application, and HelloLilly's shared knowledge grows with every case.

### How the system answers each problem

| Problem | Tools that help |
|---|---|
| Execution | Job Applications (search, scoring, tailoring, checking), CV Builder, Progress Support |
| Consistency | Knowledge Hub, Coach Network, Knowledge Hive, Outcome Engine |
| Confidence | Interview Training, Interview Preparation, Coach Review, Progress Support, community |
| Relevance | Match Analysis and its two scores, Research Helper, Job Search, Coach Network |
| Direction | Transition Compass, Direction Explorer, Funding Navigator, Education Matcher, Coach Network |
| Silo | Coach Contacts, Network Match, Coach Network, Knowledge Hub, Knowledge Hive |
| Barrier | spoken mode, one question at a time, Progress Support, LinkedIn Helper, Image Studio |

### Help right now, and Lilly

Next to every tool sits a panel called **Help right now** (Hjälp just nu). It shows what is relevant to the task at hand: a coach-approved template, an example from a similar role, a short video, a discussion where another jobseeker hit the same wall, the right coach for the situation. It only shows help that actually exists; an empty slot is never filled with a promise.

Above the panel sits **Lilly**, the assistant the person says hello to. Lilly explains any tool, finds the way, hands the person to the right place, and answers questions about their own situation by pointing to what is actually in it. Lilly suggests; she never acts on her own, never second-guesses another tool's verdict, and never tries to read the person's emotions.

### The crosslinking layer

The most important part of the system is not any single tool. It is the way every tool, person, resource, case, coach and piece of knowledge is crosslinked to whatever the jobseeker is doing at that moment. Most systems organise information by category. This one organises help by situation. Individual AI tools are easy to copy. A crosslinked knowledge and support system, built from HelloLilly's own coaches, cases, outcomes and labour-market knowledge, is much harder to copy. **The tools are the visible layer. The crosslinking is the system.**

**Example: one answer, used everywhere.** An advert asks for experience training new staff. The person's CV does not mention it, so the gap interview asks one question: "Have you ever trained someone new at work?" The person answers out loud: two summers onboarding seasonal workers. They accept the wording. That fact now sits in their bank. It appears as an option in the next tailored CV, the cover letter can draw on it, the interview preparation turns it into a story to rehearse, and the match scores for every similar job improve. One answer, given once.

**Example: Interview Training.** The system uses the job advert, the CV, the employer brief and earlier practice answers to run a realistic spoken interview. At the same time it crosslinks to common questions for the role, coach advice, follow-up questions based on weak answers, and coaches who know the industry. The person is not just practising. They are practising in an environment that understands the role, the company and themselves.

**Example: Job Radar.** When a signal points to a company hiring more in the person's region, the system crosslinks it to the person's CV, suitable roles, a possible blind application angle, people to contact, coaches who know the company and the Company List. A market signal becomes an action path.

**Example: Direction Explorer.** When a person's target work is thinning out, the system maps their real experience onto the labour market's own map of occupations and skills and offers a few realistic adjacent directions, each with live adverts, the courses that close the gap, the funding the person may be entitled to, the cost in months and money, and a coach who knows the field. A dead end becomes a decision.

### The best of what already works

- **From a great coach:** judgement, encouragement and the right next step.
- **From the best CV tools:** clean structure and awareness of how applications are screened.
- **From a recruiter's desk:** three reviewers who read the application the way it will be read, before it is sent.
- **From an interview coach:** rehearsal and honest, kind feedback.
- **From a job club:** structure, accountability and peers, the things the evidence says actually move outcomes.
- **From a good study counsellor:** an honest fork between applying now and re-training, with the money made plain.
- **From a community:** shared templates, tips and help that anyone can contribute.
- **Built for HelloLilly:** tied to the coaches, the employer network and the matching mission.

---

## 6. The Unique Value

**The tools are easy to copy. The expertise is not.** Any single tool here is a weekend's work over a language model. That is not where the value is. The value is the engine underneath.

**Human relationships still beat AI.** As AI floods the job-search market with generic tools, the human coach becomes more valuable, not less. The system augments the coach; it does not replace them.

### Two flywheels

| | The person's flywheel | HelloLilly's flywheel |
|---|---|---|
| What accumulates | Confirmed facts, accepted wording, preferences and cut rules | Coach knowledge, cases, resources and outcomes |
| How it grows | Every gap answered, every line accepted, every job cut with a reason | Every coach interaction, every case, every placement |
| What it buys | Each application is faster and stronger than the last | Advice weighted by what actually got people hired |
| Why rivals can't catch up | They start from a blank CV | They start with none of HelloLilly's cases |

### Why HelloLilly can own this

Everyone has access to AI. HelloLilly's advantage is AI connected to things a generic startup does not have:

- many jobseekers, many coaches, many municipalities, many different barriers and life situations;
- coaches whose professional networks can open doors, reached without ever exposing their contacts;
- real employer relationships and a results-based business model that rewards good matching;
- existing administrative infrastructure to build on, not replace;
- activity and outcome data accumulating already;
- a stated 2030 goal that gives the strategic horizon.

### One value layer, built for the mission

Above the existing infrastructure, the value layer lives in one place, built around HelloLilly's actual job: matching people to the right work. The skeleton and the layer are not in competition. One holds the data and the workflow. The other turns them into outcomes.

---

## 7. How We Build It Responsibly

Three principles carry the system, and each is enforced in how it is built, not only promised:

- **The person decides what is true.** No line reaches a CV or letter unless it comes from something the person has confirmed or written. An application may sell and present real experience at its strongest. It may never invent.
- **The writer never checks its own work.** The agent that drafts is never the agent that checks.
- **Argue for the person, never judge them.** When something falls short, the fault lies in the document, the gap or the market, never in the person.

Around them: **agents prepare, people decide**, and nothing is sent in anyone's name. **Consent first** for any recording or transcription. **Retrieval, not training**: the system draws on a living knowledge base that cites its sources and can forget a person on request, and personal data is never used to train a model. **A fork, not a funnel**: where re-training is raised, applying directly is always shown beside it. **Reach the underserved on purpose.** **Transparent**: every person can see what the system knows about them and delete it. **Support, not surveillance.**

On the community side, not everything is shared with everyone. Public guides, coach-approved resources, anonymised examples shared with explicit consent, private case data visible only to the person and their coach, and coach-only discussions are kept clearly apart.

**Before real people use it**, the system passes a review of GDPR, the EU AI Act and the Arbetsförmedlingen framework, signed off by a qualified professional. Until then no claim of compliance is made.

The full set of principles, and the list of what the system will never do, are in **Addendum A: Principles and Boundaries**.

---

## 8. The Full Vision

This is the complete suite. Each tool is useful on its own and ships independently; the connected layer is what makes them work together.

### A. The five core jobseeker tools

These are the tools a jobseeker uses directly. They share one CV and one bank of confirmed facts, but each can be used on its own, and the person can choose to use or skip any of them.

#### 1. CV Builder (CV-byggaren)

**Why:** A CV and its content are the foundation for everything else.

- **Career intake (Karriärprofil).** The person first loads everything they have: old CVs, cover letters, applications, certificates, links. Then the system asks one question at a time, each with a short explanation and examples. Where the answer can be found in the loaded material, it is suggested for the person to confirm or correct. Otherwise the person speaks or writes the answer. Shorter and more focused than a traditional career form.
- **Builds the master CV and its versions.** A decision tree builds the master CV and versions for the kinds of jobs the person is aiming for. Which versions, and which sections, depend on the person: a nurse's versions differ from a manager's, and some people need sections others do not.
- **Suggestions from the person's own material.** The system drafts possible CV lines from the person's documents. Each one becomes a fact only when the person accepts it. Job adverts and other people's material can never be a source of experience.
- **One structured CV**, shared by every other tool, and output as PDF or Word.

#### 2. Job Applications (Jobbansökan)

**Why:** Turn a wide, tiring search into a short list of good decisions.

- **The start page.** Job search begins on a morning page with tabs for *New today*, *Questions*, *Send*, *Cuts* and **Ansökningskoll**, where every sent application shows its status. One clear next action at a time.
- **Job Search (Jobbsök).** The person keeps their own list of job titles, plus a broad catch-all search and an optional direction track that only ever adds options. Many sources are combined so each job appears once. Only new jobs are fetched each day. If a site blocks access, the search stops and tries again tomorrow; it never works around a block.
- **Filtering that learns.** Every cut job carries a named reason and can be overruled. When the person cuts a job by hand, their reason becomes a draft rule; once they accept it, it joins their preferences.
- **Match Analysis (Matchanalys).** Each job gets two scores, always with their explanation: how likely the person is to **like** the job, and how well they **fit** what the employer wants. Every requirement in the advert is checked against the person's evidence, with the source named. The scores sort a long list; they are never a verdict on the person. Earlier applications to the same employer are checked for consistency.
- **Go or Cut.** The person decides. Undecided jobs wait until tomorrow.
- **Employer brief.** For each chosen job, a brief with a fixed core (culture, way of working, stability, career path, hiring risk) plus topics chosen for the profession: shift patterns and staffing levels for a nurse, safety record and permanent versus agency work for a factory worker, technology and ways of working for an office role. Open sources only, and it says what it could not read.
- **Tailored CV and Cover Letter (Anpassat CV, Personligt brev).** Starts from the closest CV version and uses confirmed lines only. Where a sharper wording would fit this job, it is proposed; the person picks it or keeps the original, and an accepted version is saved for next time. The letter must name one concrete link: to the company, its industry, a competitor, or the phase the organisation is in.
- **Gap interview.** When the advert asks for something the bank does not cover, the system asks one question at a time, in writing. The person answers by voice or text. Accepted answers go into the person's bank of facts, wording and figures, so every application makes the next one stronger.
- **Application Check (Ansökningsgranskning).** Three reviewers read the application before it is sent: one as an applicant tracking system, one as a recruiter, one as an HR consultant. Each reviews alone, then they compare notes once. They point out problems and never rewrite. Where they disagree, whatever keeps the person from being screened out wins. It is a simulation, not access to the employer's own system.
- **Final check.** A separate checker compares every line and figure with the person's confirmed bank, and checks the layout. A line that is not in the bank blocks the application until it is fixed or confirmed. Everything else is advice.
- **Send.** The person sends. The application appears in Ansökningskoll, and a job already applied for never comes back.

#### 3. Interview Preparation (Intervjuförberedelse)

**Why:** Walk into every interview, or important meeting, knowing more than expected.

- **Intake:** the advert, recruiter message or company name, and the CV version that was sent. The system confirms who and what before doing any research.
- **Research on several fronts:** the real employer when a recruiter posted the advert, the company, the market, the role behind the advert, and the people the person will meet.
- **Analysis:** "can you do it, and do you actually want it?", with the honest gaps and how to bridge them.
- **A preparation pack** in three lengths (full read, thirty-minute review, five-minute glance), the job advert where clicking a phrase shows the person's angle and a question to ask, a bank of answers to rehearse, and stories from the person's own experience.
- **Weighting by stage:** a recruiter screen calls for warmth and motivation; a hiring manager calls for strategy and sharp questions.
- **During and after:** a call window with notes, and afterwards a short review. Anything new the person said that is not in their bank is offered as a fact to accept.
- Every bold claim in the CV becomes something to prepare for.

#### 4. Interview Training (Intervjuträning)

**Why:** A realistic spoken rehearsal, not a list of common questions.

- The tool plays the interviewer out loud and the person answers out loud, in a safe place, as many times as they like.
- Built from the advert, the CV, the gaps and the employer brief, and from the interview preparation if the person has done it.
- Asks follow-up questions depending on the answer, because real interviews are not static questionnaires. Style is adjustable: friendly, formal, case-based, competency-based, short and direct.
- Feedback quotes the person's own answer and never invents. It names strong moments, weak moments, and one thing to practise.
- The aim is not only better answers. It is safety, familiarity and less fear.

#### 5. Network Outreach (Nätverkskontakt)

**Why:** Many jobs are filled through a recommendation or an introduction, not an advert.

- **Lists that keep growing:** target jobs and companies, and the people at them by role: senior leaders, team leads, recruiters, HR, hiring managers. The system finds people from public profile information; nothing behind a login is ever used.
- **A step-by-step sequence for each person:** first a thoughtful comment on something they posted, then a short introduction, then a few follow-ups, with the goal of a recommendation or an introduction.
- **Proactive or reactive:** start from a company the person wants to work for, or from a job just found or already applied for.
- **A small daily pace**, for example five to ten people, with every step and reply tracked so the person sees what works.
- **The person does the sending.** The tool drafts, reminds and keeps score; it never sends.
- **Contacts can be linked to a job** at any time.

This builds new connections. It is different from using the people the person already knows (see the Network Map below).

### B. Finding opportunities

**Job Radar (Jobbradar).** Find opportunities before they appear as ordinary adverts. It starts with signals that can be read honestly: companies posting noticeably more jobs in the person's region and field, and relevant news with links to the source. Each signal comes with one suggested action. Tenders, investments and leadership changes are added as further signals.

**Company List (Företagslista).** The person's own wish list of employers. Each company card shows why it may be relevant, open roles, recent signals and a status (interested, contacted, waiting, closed), and is the launch point for research, a blind application and outreach.

**Companies by Area (Företag i området).** Every employer within a region or a commuting distance, so the person can see the whole map around them rather than finding companies one advert at a time. A third way in, beside signals and the wish list.

**Staffing Agencies (Bemanningsföretag).** A curated guide to staffing agencies, often the fastest route into work, with direct links. The system prepares the CV for each agency; the person sends it.

**Blind Applications (Spontanansökningar).** Contact companies with no published role, in five steps: research, angle, recipient, message, follow-up. If the person feels stuck, it first asks how much they can manage today (a full message, two lines, buy time, or not today), and "not today" is a valid answer. Fewer but better attempts, never mass outreach.

**Research Helper (Researchstöd).** Research a company, an industry or a role, with or without a job attached: a short summary of what matters for the purpose, detailed briefs with sources, and a "dig deeper" on any point.

### C. Direction and re-skilling

**Find the honest path when the answer is a new direction or new skills, not another application.** These tools are reached from Match Analysis, when a requirement truthfully cannot be met, or directly, by a person who arrives without a target role at all. They open by asking why the person is changing, because the right help differs sharply between a chosen move, a redundancy and a health reason. And whatever the distance to travel, one choice never leaves the screen:

| Apply now anyway | Re-train |
|---|---|
| Faster, a lower fit. Often the honest better choice: rapid placement with support beats studying first for many people. Always shown, never buried. | Slower, a higher fit. Worth it when the skill distance is genuinely large, and only with the timeline named: returns arrive over years, not months. |

- **Transition Compass (Omställningskompassen).** A short conversation, spoken if preferred, that records why the person is changing, their financial runway, their comfort with technology and their confidence. For someone on sick leave, it surfaces the formal routes back to work as a matter of course.
- **Direction Explorer (Riktningsutforskaren).** Maps the person's real experience onto the labour market's own map of occupations and skills and offers a few realistic adjacent directions, each with what transfers, what is missing, how far it is (up to half a year, about a year, up to three years), demand, live adverts and salary reality. Ends in something to test, not a verdict.
- **Funding Navigator (Finansieringsguiden).** Checks eligibility against the real conditions, shows amounts and dates as dated facts, and assembles an application-ready pack in advance, with a motivation the coach reviews, so a person is not beaten by an incomplete form or a slow start. Those who will not qualify are routed to the alternatives that fit them.
- **Education Matcher (Utbildningsmatchningen).** Ranks the few real courses that close the gap, from the national catalogue of publicly funded education, each with an honest outcome note, its true cost and timeline, and applying directly beside it. Outcome figures are never presented as proof that a course caused a job.
- **Test-Before-Invest (Prova-först).** A short plan to try a direction for real: an informational conversation, a day of shadowing, a taster course, a work trial. Sits before any commitment of six months or more.
- **Transition Economics (Omställningskalkylen).** Applying now, a short course and a full re-training side by side, in months and money, under the real support caps. Payback is named honestly, in ranges, never as a promise.

### D. Network and visibility

**LinkedIn Helper (LinkedIn-stöd).** A safety and confidence tool for people who find social visibility hard. It reviews what the person wrote and shows a suggestion beside it, with a plain explanation of why it reads better. Every check ends in one verdict: *send*, *send with one change*, or *hold*. After *send* it offers nothing more, because permission to stop is the point. It walks the person to the send button and stops there; it never posts.

**Image Studio (Bildstöd).** Help the person look clear and professional in a CV or profile photo. It improves the real photo (sharpness, light, background, cropping to the right sizes) under one rule: *same face, better photograph*. The person approves the before and after. Nothing that changes who they look like is possible.

**Network Map (Nätverkskarta).** A map of who the jobseeker already knows and where those people work, to find warm ways into target employers. It covers more than LinkedIn, because many people's real networks live elsewhere, and it is built from the person's own exports of their contacts, owned by them.

**Network Match (Nätverksmatch).** When a case needs a door opened at a company, the system checks quietly whether any coach's network reaches it. Each coach's contacts stay on the coach's own computer (see Coach Contacts); only a yes or no ever reaches HelloLilly. On a yes, that coach makes the introduction personally. Everyone else sees only that "a request has gone to a coach". No names are shown, and nobody can search the network freely.

### E. Coach tools

**Case Record (Ärendevy).** The shared picture of the jobseeker's journey: goals, CV versions, applications, research, study and funding plans, agreed next steps and activity, in one page the person can read too.

**Coach Contacts (Coachkontakter).** Each coach loads their own professional contacts into a private, encrypted store on their own computer. HelloLilly never receives, stores or searches it. It powers Network Match while the contacts remain the coach's own professional asset, which is both the legal position and the reason coaches will want to take part.

**Coach Network (Coachnätverk).** HelloLilly's internal competence, searchable by field, special strength and language, so the coach who knows the field can give a second opinion.

**Coach Review (Coachgranskning).** Ask coaches for feedback on a CV, letter, profile or plan, answered in the coach's own words. No AI ever writes in a coach's voice.

**Live Support (Mötesstöd).** With clear consent, recorded before anything is processed, sessions are transcribed and summarised, so agreed steps and resources reach the case record after the meeting.

**Transition View (Omställningsvyn).** Keeps human judgement on the biggest decision a jobseeker can make. It shows the person's direction, funding and study plans to the coach, with prompts that follow the evidence. Any plan built on long education needs a coach's sign-off.

**Knowledge Hub (Kunskapshubb).** Templates, guides, videos, documents and coach experience in one place. Jobseekers can suggest items, which stay marked as suggested until a coach approves them. Lilly can explain any item.

**Feedback Loop (Återkoppling).** Suggestions, upvotes, polls and feedback after interviews and applications. Poll results appear only after the person has voted.

### F. Learning layer

**Knowledge Hive (Kunskapssystem).** The long-term core, where HelloLilly's experience accumulates: from coaches, resources, cases, applications and outcomes. What competitors will find hardest to copy.

**Outcome Engine (Resultatmotor).** Connects actions to results: which support helps which people, which activities lead to interviews, which paths lead to jobs or education. Outcomes are recorded as dated facts, never as proof of cause. No figure ever describes fewer than five people, and nothing it learns ever feeds a decision about a person's benefits, sanctions or eligibility.

### G. Delivery

**The hub.** A calm home, not a dashboard: one clear next action, visible progress, and quiet entries grouped by need (search and match, create material, prepare, make contact, new direction, my coach).

**Progress Support (Framstegsstöd).** Reminds, suggests and breaks larger tasks into small steps, with one next step at a time. Activity is logged to help the person remember and restart, grouped by job, and every item can be hidden. No streaks and no nagging. During any period of study it keeps one light market action a week in the plan.

**On the phone.** An app installed from the browser onto the home screen, with reminders for new matching jobs, applications that need finishing and coach calls. Works for people who live more on a phone than at a desk.

**Community.** A place to ask, talk, share contacts and vouch for each other, with clear privacy boundaries.

---

## 9. Build Order

Nothing here needs to be built all at once. Each tool is useful on its own. The phases sequence the suite so that early value is real, and the connected system grows around it.

| Phase | Purpose | Tools |
|---|---|---|
| **1. Foundation** | The CV and the first applications, with the coach in the loop | Career intake, CV Builder, Tailored CV and Cover Letter, Application Check, Progress Support, Case Record, Knowledge Hub, Help right now and Lilly, Transition Compass, Funding Navigator |
| **2. Matching** | From material to direction, selection and practice | Start page and Job Search, Match Analysis, employer brief and Research Helper, Gap interview, Ansökningskoll, Interview Preparation, Interview Training, the remaining re-skilling tools |
| **3. Network** | Opportunities that come through people | Network Outreach, LinkedIn Helper, Network Map, Company List, Companies by Area, Staffing Agencies, Blind Applications, Coach Contacts and Network Match, Coach Network, Coach Review, Image Studio |
| **4. Market and learning** | A proactive, self-improving system | Job Radar, Live Support, Feedback Loop, Knowledge Hive, Outcome Engine, community |

### How it reaches real people

1. **A pilot coach first**, working with the tools on sample cases, so a professional user hardens the system before the first vulnerable user arrives.
2. **Then a small group of consenting jobseekers**, using only the tools that are fully real, after the legal review is signed off.
3. **Then the wider rollout**, phase by phase.

Before the first real user: logins and roles, "see what it knows" and "delete me" all work.

### What we will measure

| Measure | Why it matters |
|---|---|
| Time from a job being found to an application being sent | The execution problem, in hours |
| Interviews per application sent | Whether tailoring and checking work |
| Share of coach time spent on human work rather than admin | The core promise to coaches |
| Placements into work or education, in HelloLilly's own verified terms | The 2030 goal |
| Facts in each person's bank and how often they are reused | The person's flywheel |
| Uptake among the people furthest from the labour market | Whether the system reaches the underserved, not only the confident |

A baseline for each is taken before the pilot starts.

### Why this is realistic

The first versions are now fast and inexpensive to build. With today's AI models and agents, transcription, search, voice tools and document generation, many modules can be built quickly. Several of the hardest pieces already run in the author's own tooling (see Section 1): the daily job pipeline from search to a checked, tailored application, the interview war-room, and a production LinkedIn reader and CSV import. So this is a proven process to package for a wider audience, not a guess. The direction and re-skilling tools lean on open public data: the national course catalogue, the labour market's map of occupations and skills, and demand forecasts. The strategic value, though, lives less in the first tool and more in the connected system, the accumulated knowledge, and the outcome-weighted learning over time.

> The tools help the individual. The connected system, built on HelloLilly's own coaches, cases and outcomes, helps the organisation get better every day. That is the difference, and that is what is missing.

What the system will deliberately not build, now or ever, is listed in **Addendum A**.

---

## Appendix A: Why This Works

The design is built on what the evidence says actually helps people get back to work. These findings come from structured programmes and human services, so they are the case for the human-plus-tool model, not for software alone.

- **The right tools raise the odds.** Across many studies, structured job-search interventions and assistance raise the odds of obtaining employment roughly 2.67 times (Liu, Huang and Wang, 2014).
- **So do job clubs.** Classic job-club trials, built on structure, daily activity, peers and accountability, placed far more people than unstructured search.
- **Confidence is causal, not soft.** The JOBS II programme improved both re-employment and mental health by building a sense of mastery and inoculating people against setbacks, with the largest gains for those most at risk.
- **For barrier groups, place then train.** Supported employment, which places people quickly and supports them afterwards, roughly doubles competitive employment for people with significant barriers.
- **Speed matters.** The longer someone is unemployed, the harder re-entry becomes, so anything that restores momentum early works against that scarring.
- **Re-training pays off slowly, and should say so.** Study reduces job search while it lasts, and the returns arrive over years, not months.
- **Support reaches the confident first.** Left alone, re-training help and funding are taken up most by those who need them least.
- **Different situations, different paths.** There is no single funnel that fits everyone, and the evidence itself says so.

The design follows from that. Instead of analysing a jobseeker and pushing them into a predetermined path, the system lets the person's situation find the right help. The help comes to the person, not the person to a funnel.

---

## Appendix B: A Week in the Life

**Sara is 52 and has been out of work for fourteen months. Her confidence is low and she has started to avoid the search altogether.**

**Monday.** She opens the hub. It does not show her a wall of tasks, just a warm greeting and one next step: build her CV. She uploads an old CV and two letters she wrote years ago. Then the assistant asks her about her last role, one question at a time. Where her old documents already hold the answer, it shows her and she confirms it; where they do not, she answers out loud. She did not have to face a blank page.

**Tuesday.** Her start page shows six new jobs found overnight, sorted by how likely she is to like each one and how well she fits, each with the reason. She picks two and cuts one: "too far to travel". The system asks whether it should skip jobs that far away from now on. She says yes.

**Wednesday.** For each of her two jobs, an employer brief, a tailored CV and a cover letter are waiting. One advert asks for experience training new staff, which her CV does not mention, so she gets one question: "Have you ever trained someone new at work?" She answers out loud: she onboarded the summer temps for six years. She accepts the wording, and it will be there for every application after this one. Three reviewers read each application: the recruiter flags a missing keyword, and she adds it. The final check passes. She presses send, and both applications appear in Ansökningskoll.

**Thursday.** An invitation arrives. Her interview preparation opens with what the company does, what the role really needs, and the three questions she is most likely to get. She practises out loud with the interview trainer, three times, alone in her kitchen, and the feedback is kind and specific. By the third try she does not freeze.

**Friday.** Her coach opens Sara's case and the week's activity is already there, so the report is done. Instead of admin, the meeting is about how Sara is feeling. A request has quietly gone to another coach whose network reaches the company, and that coach offers to put in a word.

**Three weeks later Sara has an offer.** The system did not replace her coach. It made sure that everything between the meetings actually happened, and that every word she sent was hers.

---

**Johan is 47 and was made redundant after twenty-two years in a printing plant that closed. He does not need a better CV. He needs a direction.**

**Monday.** The Compass asks him, in plain spoken questions, why he is here and what he can carry financially. It does not cheer at him. It notes that this change was not his choice, and his coach sees that too.

**Tuesday.** The Direction Explorer shows him three realistic moves built on what he already knows (machine operation, quality control, maintenance), each with the local adverts, what is missing, and what closing it would take. Beside every one: apply now anyway, as a real choice.

**Wednesday.** He picks one to test. The system drafts the message for a short chat with a maintenance technician his coach knows, and finds a taster day. The calculator shows him, in months and money, what the short course would mean, and that the funding window opens in six weeks.

**Thursday.** His application pack for the study grant is assembled and complete: the checklist, the details, the motivation his coach has reviewed. When the window opens at eight in the evening, he files in minutes, ahead of the queue that usually beats people like him to the money.

**Johan's week did not end in a job.** It ended in a direction he had tested, a plan he could afford, and a coach who signed off on it. That is what the second route looks like when it is real.

---

## Appendix C: What Changed in Version 3

| Area | Change |
|---|---|
| Stance on automation | "Not automation" becomes **agents prepare, the person decides, approves every word, and sends**. Nothing is sent in anyone's name. |
| Truth | New principle: the person decides what is true. Only confirmed or person-written lines reach a CV or letter; a final check blocks anything else. |
| Core jobseeker tools | Reorganised into five tools, each usable on its own: CV Builder, Job Applications, Interview Preparation, Interview Training, Network Outreach. |
| CV Builder | Adds career intake from the person's old documents, versions built by a decision tree, and suggestions the person accepts. |
| Job Applications | New end-to-end process: start page, daily search, learning filter, two explained scores, employer brief, tailoring that can propose new wording, gap interview, three-reviewer Application Check, final check, Ansökningskoll. |
| Names | Application Check is the three-reviewer review; Ansökningskoll is the start-page section for sent applications. |
| Interview Preparation | Expanded into a full preparation pack, including real employer, people briefs, interactive advert and stage weighting. |
| Interview Training | Now its own tool: spoken rehearsal with feedback that quotes the person's own answers. |
| Network Outreach | New: a personal CRM that finds people at target companies and runs a step-by-step sequence; the person always sends. |
| Network | New Network Map, Coach Contacts (a coach's private, local contacts) and a blind Network Match. |
| Opportunity | New Companies by Area and Staffing Agencies; Job Radar starts from signals that can be read honestly. |
| Help | The side panel is named **Help right now**; the assistant is **Lilly**. |
| Image Studio | Real photo enhancement under "same face, better photograph". |
| Responsible build | Shortened to three principles; the full set and the never-build list move to Addendum A. "Compliant by design" is replaced by a legal review before real use. Personal data is never used for training. |
| Phone | An installable web app rather than separate iOS and Android apps. |
| Build order | Career intake and CV Builder first; adds how the system reaches real people and what is measured. |
| Appendix B | Sara's week now follows the new process. |
