# HelloLilly - The CV Builder (CV-byggaren)

**Deep-dive companion to the Jobseeker Product Vision, Version 4 · October 2026 · Confidential draft**

How HelloLilly helps a person build a truthful CV from nothing, or from a messy old one, and why that CV becomes the foundation for everything else in the system.

---

## Opening

For many long-term jobseekers, the CV is where the search stops before it starts. The blank page, an old document nobody has touched in ten years, a career with gaps that are hard to explain, a second language, dyslexia, or simply hating to sell yourself. The CV is not the job, but it decides who gets to show they can do the job.

The market's answer is AI CV tools, and most of them share one quiet flaw: they make things up. A tool suggests "award-winning" for someone with no award, adds "increased sales by 45 per cent" because it sounds good, or turns "helped the team leader" into "led the team". The person sends it under their own name, into a real hiring process, and pays the price when the interview arrives.

HelloLilly's CV Builder is built on the opposite promise. **The AI may ask, suggest, rephrase and assemble. It may never introduce a fact about the person that the person did not supply or confirm.** Where evidence is missing, it asks, or leaves a marked gap. It never invents a plausible value.

And the CV is not an end in itself. Every confirmed fact the person gives once goes into their fact bank and is reused everywhere: in tailored CVs, cover letters, the LinkedIn profile, interview preparation, plan analysis and the direction tools. The CV Builder is where the person's flywheel starts.

---

## 1. The Problem

- **How it is:** Building a CV assumes writing skill, Swedish fluency, confidence in self-presentation and comfort with document tools. Existing AI tools lower the effort but raise a new risk: invented claims the person may not notice until it is too late.
- **What is missing:** A guided way to build a clean, professional CV from what the person actually has, old documents, memory and voice, where every claim is theirs.
- **The effect:** Many people never finish a CV at all. Others send CVs that undersell them, or, with AI tools, that oversell them in ways that collapse in the interview.
- **Scenario:** You have an old CV from 2014, a certificate in a drawer, and twenty years of experience in your head. A free AI tool turns it into a polished CV in two minutes. It says you "managed a team of twelve". You helped train new staff. At the interview, the first question is about your team.

---

## 2. Two Tools, Two Jobs

The system deliberately separates building a CV from tailoring one, because mixing the two is what produces bad CVs.

| | **CV Builder (CV-byggaren)** | **Tailored CV (Anpassat CV)** |
|---|---|---|
| **Job** | Build and maintain the master CV and its versions | Adapt one CV for one advert |
| **Knows about adverts?** | Never. It is job-independent | Yes, it reads one advert |
| **Can change structure?** | Yes: sections, order, templates | No: it selects, orders and words from confirmed lines within the template |
| **Writes new content?** | From the person's confirmed facts only | Proposes sharper wording of confirmed lines; the person accepts or keeps the original |
| **Output** | The master CV and versions for the kinds of work the person aims for, as PDF and Word | One application CV per job |

The boundary is firm: the builder never becomes job-aware, and the tailor never gains structural powers. Either doing the other's work recreates the confusion that makes AI CVs untrustworthy.

---

## 3. The Flow

### Start where the person is

There are four ways in, and the person can mix them:

- **Upload what you have.** Old CVs, letters, certificates, references, a LinkedIn export. Scanned documents are read with text recognition.
- **Paste text.** From an email, a job platform or a document.
- **Talk.** Answer one question at a time, out loud.
- **Start from nothing.** A guided set of questions, each with a short explanation and an example, in plain Swedish.

### Review what was found

Everything extracted from documents lands in a **review inbox**, never directly in the CV. The person sees each fact with where it came from, and confirms, corrects or rejects it. The inbox surfaces:

- conflicts, where two documents disagree on a title or date;
- uncertain readings, where the scan was hard to read;
- missing dates or employers;
- likely duplicates;
- facts that may have been read out of context, such as a line under "tasks I want to avoid".

### Ask, do not invent

Where something is missing, the system asks a small number of neutral questions, never more than it needs, and never with the answer pre-filled. "Did any of your roles include training new staff?" rather than "You trained new staff, right?" Skipping a question leaves an honest gap, not an invented line.

### Build the lines

For each role, the person answers a few short questions about what they did, how, and with what result. The system composes one clear line from those answers. An independent checker, separate from the writer, compares the line against the person's own answers and flags anything new: a number, a seniority, a result, a cause, a "led" that was really a "helped". The person then approves the exact final wording.

### Summary last

The summary is written last, from confirmed facts only, never the other way round. Each sentence links to the facts behind it. The system is explicitly forbidden from adding up facts into claims the person never made, such as turning two separate roles into "five years' experience".

### Skills and versions

Skills are suggested only from confirmed tasks, each with its reason, and can be rejected. A decision tree builds the master CV and versions for the kinds of work the person aims for: a nurse's versions differ from a manager's, and some people need sections others do not.

### Export, and check it can be read

The CV is produced as both PDF and Word from one underlying document, in a clean single-column template first. Both files are then read back automatically to check that the headings, dates and contact details come out in the right order, the way a recruitment system would read them. If the check fails, a safer template is offered. There is no promise of a universal "ATS score", because no such thing exists.

---

## 4. The Truth Model

The CV Builder's credibility rests on a clear, honest model of what counts as true.

### Every fact has a state

| State | Meaning | Can it reach the CV? |
|---|---|---|
| **Found in a document** | Read from an uploaded file, with the exact passage | Not yet: the person must confirm it |
| **Confirmed** | The person has confirmed it | Yes |
| **Corrected** | The person changed it; the original is kept for the record | Yes, the corrected version |
| **Typed by the person** | Written in the person's own words | Yes: what the person types is saved as their truth |
| **Suggested by the system** | A rewording or a derived line | Only after the person approves the exact wording |
| **Rejected** | The person said no | Never |

### Three separate moments

A common trap in AI tools is a single "Yes, looks good" button that turns an AI suggestion into a verified fact. The CV Builder keeps three moments apart:

1. **The fact is asserted**, by the person or from a document they supplied.
2. **The wording is checked** against that fact by an independent checker.
3. **The person approves the final wording.**

A suggestion can never become evidence on a blanket click.

### What is guaranteed, and what is checked

The system is honest about the difference:

- **Guaranteed by construction:** every claim in an exported CV traces to a confirmed fact or the person's own words; unconfirmed facts never reach generation or export; what the person approved is exactly what is exported; all AI runs on the server, behind protection against manipulated input.
- **Checked, not guaranteed:** whether a reworded sentence quietly says more than the facts behind it. This is judged by an independent model and tested against an adversarial collection of hard cases, including deleted negations, swapped roles, inflated numbers and added-up claims. Any regression blocks release.

So the public promise is precise: **the AI is held to never introducing biography you did not supply, checked by an independent model and tested against an adversarial corpus. Fabrication is caught and regression-tested, not merely discouraged.** It is never "fabrication is impossible", because no honest system can claim that.

### Every other path is held to the same rule

Translation into English, the plain-Swedish version, manual edits and voice dictation are all checked the same way. "Helped the team leader" may not become "Assistant Team Leader" in translation; "started a degree, no diploma" may not become "Bachelor's degree".

---

## 5. How the CV Builder Connects to the Rest of the Site

The CV Builder is the foundation the rest of the system stands on.

| Connected tool | How it connects |
|---|---|
| **Career Intake and the fact bank** | The intake fills the fact bank; the CV Builder turns it into documents. Every confirmed fact is reused everywhere. |
| **Tailored CV and Cover Letter** | Start from the closest CV version; use confirmed lines only. |
| **Gap interview** | When an advert asks for something new, the answer goes into the bank, and appears as an option in the next CV version. |
| **LinkedIn Profile** | Built from the CV, which is why the CV comes first: headline, About section, experience and skills, rewritten the way LinkedIn is read, from the same confirmed facts. |
| **Image Studio** | A clear, professional photo under the rule "same face, better photograph". |
| **Interview Preparation** | Every bold claim in the CV becomes something to prepare for, with stories from the person's own facts. |
| **My Plan and Plan Analysis** | The CV versions mirror the directions in the plan; the plan analysis shows which experience counts toward which target. |
| **Learn and Re-skill** | Completed courses, certificates and recognised skills become confirmed facts and appear in the CV the moment they are confirmed. |
| **Placement Finder and Staffing Agencies** | A ready CV version for each agency or placement; the person sends. |
| **Coach Review** | Coaches give feedback in their own words; the coach never writes in the person's CV on their behalf. |
| **Community, Shared Bank and Tutorial Library** | Templates and short clips on writing a CV; shared examples, anonymised and with consent. |
| **Lilly and Help right now** | An example from a similar role, a short video, or the right coach, next to the step the person is on. |

---

## 6. Built for People Who Find This Hard

- **Spoken and one question at a time.** The whole builder can run as a conversation.
- **Plain Swedish.** Questions and explanations in simple Swedish; a plain-Swedish version of the CV itself is available, checked like every other version.
- **Do it together.** A coach can run the builder side by side with the person, in the meeting.
- **A usable first version, fast.** The point is a CV that can be sent this week, improved over time, not a perfect one before anything happens.
- **Honest about gaps.** A gap in the CV is handled truthfully and in the person's favour, never hidden with invention.

---

## 7. What the Market Taught Us

A detailed teardown of a leading AI CV product, and a study of what parsers and recruiters actually need, gave five lessons the CV Builder is designed around:

1. **Tailoring is a commodity.** Any tool can rewrite a CV for an advert. The defensible layer is the step before: turning raw career material into a reviewed, source-linked set of facts, and generating only from it.
2. **Scores must be honest.** The benchmark product displayed two different scores for the same CV. HelloLilly computes any score in code, from visible parts, and never lets a model invent a number.
3. **"ATS optimisation" should be measurable.** Read the exported file back and check it, rather than claiming a universal score.
4. **Learning must not rewrite history.** The system learns the person's style, length and layout preferences; it never learns new facts without the person confirming them.
5. **A narrow, trustworthy first release beats a feature-rich clone.** Swedish and English, document intake with review, a few honest questions, one structured editor, one safe template, and validated PDF and Word.

---

## 8. How It Gets Built

The CV Builder has been through two independent hostile design reviews, which found where the first design could still leak an invented claim and how to close each gap. The build follows from that review, in steps:

| Step | What it delivers |
|---|---|
| **Clean the existing facts** | Every fact already in the system is classified by origin; anything the person did not confirm word for word is set aside for their explicit decision |
| **Fact states and sources** | Every fact carries its state and the exact source it came from |
| **One canonical document** | A single document model that every view, version and export is built from, so what is approved is exactly what is exported |
| **Guided build from scratch** | The question-led path, with the independent checker and the adversarial test collection in place from the first day |
| **Upload and review** | Document and voice intake with the review inbox, including context and reading-order checks |
| **Summary and skills** | Written last, from confirmed facts, with no adding-up |
| **Templates and export** | PDF and Word from the one document, read back and checked |

A safety check that arrives one step after the feature it protects is not a safety check, so each control ships with the feature it guards.

---

## 9. What It Will Never Do

- Invent a fact, figure, title, skill, credential, duty, date or result about a person.
- Turn an AI suggestion into a fact on a single blanket click.
- Add up separate facts into a claim the person never made.
- Strengthen a claim in translation, simplification or editing.
- Read an advert while building the master CV.
- Write in a coach's voice inside the person's CV.
- Promise a universal ATS score.
- Send a CV anywhere. The person sends.
