# HelloLilly - The Coach Vault (Valvet)

**Deep-dive companion to the Jobseeker Product Vision, Version 4 · October 2026 · Confidential draft**

How HelloLilly makes every coach's professional network available to every jobseeker who needs it, without any coach's contacts ever leaving the coach's own computer.

---

## Opening

Every HelloLilly coach carries a professional network built over a career: former colleagues, managers they placed people with, people they studied with, people who now run the ward, the warehouse, the school or the IT department a jobseeker wants to get into. Taken together, those networks reach a large part of the Swedish labour market.

Today almost none of that reach is available to the organisation. A coach's contacts sit in the coach's own LinkedIn account and memory, and they help only the jobseekers who happen to be on that coach's caseload, and only when the coach happens to remember the right person at the right moment. The nurse never meets the coach who knows the head of the ward. The door that would have opened stays shut, and nobody ever knows it was there.

The obvious fix, a shared contact database, is the wrong one. No coach should hand their professional network to an employer's system, and none would. It would be a privacy problem, a legal problem and an adoption problem at the same time.

The Coach Vault solves it the other way round. **The network never moves. The question does.** Each coach keeps their contacts encrypted on their own computer. When a jobseeker's case needs a door opened at a company, the vault on each coach's machine answers one question, yes or no, and nothing else ever leaves it. On a yes, that coach looks at who they know, decides, and makes the introduction personally.

This is the single largest piece of dormant potential in HelloLilly, released without taking anything away from the people who own it.

---

## 1. The Problem

- **How it is:** Each coach has a real network, but it lives in their own LinkedIn account and their own memory. The organisation cannot see it, cannot search it, and loses it when the coach leaves. Matching a jobseeker to the right contact depends on the right coach remembering the right person at the right moment.
- **What is missing:** A way for every case to benefit from every coach's reach, without anyone's contacts being collected, exposed or searchable by others.
- **The effect:** Many jobs are filled through an introduction or a recommendation, and the people furthest from work have the thinnest networks of their own. The organisation's largest reach stays unused, exactly where it would matter most.
- **Scenario:** You want to work in elderly care in your town. A coach in another office worked with the care manager there for six years. A word from her would get you an interview. Neither of you will ever know.

---

## 2. How It Works

Five steps. Only the fourth crosses any boundary, and what crosses is a yes or a no.

| Step | What happens | Where it happens |
|---|---|---|
| **1. Export** | The coach downloads their own LinkedIn connections with LinkedIn's official "get a copy of your data" feature. It gives each contact's name, current employer, title and profile link. | The coach's own LinkedIn account; an official feature, no risk |
| **2. Enrich (optional)** | If the coach wishes, the list is enriched with each contact's full career history from public profile information, through a third-party service that never logs into anyone's account. | Run for the coach, on the coach's behalf; never on the coach's LinkedIn account |
| **3. Keep** | The contacts, and any histories, are stored encrypted in a private vault on the coach's own computer. | The coach's computer only |
| **4. Ask** | When a jobseeker's case needs a door opened at a company or in a field, the vault on each coach's machine is asked whether any contact could help. It answers **yes** or **no**, with an opaque reference that means nothing outside that vault. | On the coach's computer; only the answer leaves |
| **5. Introduce** | On a yes, the coach who owns the vault sees which of their own contacts matched, judges whether the introduction makes sense, and makes it personally, from their own LinkedIn or phone. | The coach's own decision and their own relationship |

Everyone else, including the jobseeker, the jobseeker's own coach and HelloLilly itself, sees only one of two sentences: **"A request has gone to a coach"** or **"No match right now."** No names, no lists, no details.

---

## 3. What Crosses the Boundary

The design rests on a hard line between what stays with the coach and what HelloLilly ever sees.

| Stays on the coach's computer | Crosses to HelloLilly |
|---|---|
| Every contact's name, link, employer and title | Nothing |
| Career histories, if enriched | Nothing |
| Which contact matched | Nothing |
| The coach's judgement and the introduction | Nothing |
| The answer to "could anyone in this vault help with this need?" | **Yes or no, and an opaque reference** |

Two further rules close the obvious ways to probe the vault:

- **No free search.** Nobody can type a name or a company and query the network. Matching runs only on a real case's real need.
- **One uniform sentence.** The outside world sees the same two sentences whatever happens, so the answer cannot be mined for who knows whom.

---

## 4. Why Coaches Will Join

A system like this only works if coaches choose to take part. They will, because it is built on their side.

- **Their network stays theirs.** It never leaves their computer, and it remains their own professional equity if they change employer. That is both the legal position and the adoption story.
- **They stay in control of every introduction.** A yes is a request, not an obligation. The coach decides whether to make the introduction, how, and to whom.
- **They help far more people.** A coach's network stops being limited to their own caseload and starts helping the whole organisation.
- **They are credited.** Introductions made are visible to the coach, and to the organisation as a number, never as a list of names.
- **It costs them almost nothing.** One export, one upload, and the occasional decision on a request.

---

## 5. The Enrichment Route

LinkedIn's own export gives only each contact's current employer and title, never their history. A contact's full history often matters more: the person who ran the logistics team at a company five years ago may be exactly the right introduction today.

The optional enrichment step adds that history. It has been proven on a real profile: all eleven roles returned with correct dates, including a decade of history that ordinary web search missed entirely, at a cost of a few öre per profile. A coach's entire network of a thousand contacts costs roughly four US dollars to enrich.

It is stated plainly, not hidden: enrichment uses public profile information through a third-party provider, which keeps every coach's own account safe, but remains against LinkedIn's platform terms as a matter of principle. The risk sits with the provider, never with the coaches. Enrichment is optional, runs only on the coach's own network, at the coach's choice, and is never extended to anyone outside it.

The same people search and post search tooling, and the same private vault machinery, already run on another platform the author operates. HelloLilly reuses proven tooling rather than building it from scratch.

---

## 6. How the Vault Connects to the Rest of the Site

The vault is a coach tool, but it is felt across the whole system.

| Connected tool | How the vault connects |
|---|---|
| **Network Match** | The vault is the engine behind Network Match. A case's need goes in; a yes or no comes out. |
| **Company List and Job Radar** | When a person adds a target company, or a signal points to a company hiring, the system can quietly ask whether any coach's network reaches it. |
| **Contact Planner** | When the person plans outreach to a company, a coach introduction is offered as the strongest first step where one exists. The person's own outreach still runs in parallel. |
| **Placement Finder and Employer Bridge** | Placements and work trials are far easier to open with an introduction. The vault helps find the coach who can make it. |
| **Coach Network** | Coach Network finds the coach who **knows the field**; the vault finds the coach who **knows the person** at the company. Together they give both expertise and access. |
| **Test Before You Invest** | An informational conversation or a day of shadowing in a new field, opened by a coach who knows someone there. |
| **Case Record** | The request and its outcome are logged on the case, as "a request has gone to a coach", without names. |
| **Lilly and Help right now** | Lilly can explain that a request has been sent and what happens next. She never reveals who. |
| **The jobseeker's Network Map** | The same machinery, a different owner: a jobseeker can map their own network from their own exports, kept on their own device. |
| **Outcome Engine** | Introductions made and their results are counted, never named, so the organisation learns how much access the network creates. |

---

## 7. The Rules

These rules are not preferences. They are the design.

- The vault lives **encrypted on the coach's own computer only**. HelloLilly never receives, stores or queries its rows.
- **Only yes or no** crosses the boundary, with an opaque reference that only the owner can resolve.
- **No free-text search** of anyone's network, ever.
- **One uniform sentence** for everyone except the owner.
- **The coach makes every introduction personally.** No message is ever sent automatically.
- **No logged-in automation.** Nothing ever runs on a coach's LinkedIn account. Enrichment, if used, is cookie-free and runs on the coach's behalf.
- **Only the coach's own network.** No lists bought, no strangers enriched.
- **Profile text is treated as untrusted** when the vault judges a match, so a contact's profile cannot manipulate the answer.
- **Sample data only** until the legal review is signed off. No real coach vault other than the first pilot coach's own touches the product before then.

---

## 8. The Legal Position

The working hypothesis, to be confirmed or refuted by qualified counsel before any real vault touches the product:

- **The coach is the independent controller of their own vault.** It is professional activity, not private household use, and is stated honestly as such.
- **HelloLilly is a tool provider** that processes only yes-or-no answers and opaque references, never personal data from the vault.
- **Enrichment of a coach's own network** for legitimate professional use rests on legitimate interest. If any of the data were ever used for marketing or outreach beyond a personal introduction, a privacy notice and opt-out handling would be required. The design does not do that.
- **Records carry their source and date**, and a refresh or expiry policy keeps them from silently going stale.

Until counsel rules, no claim of compliance is made.

---

## 9. Where It Stands and How It Grows

The first part is built: a coach can import their own LinkedIn connections, which are stored in a vault physically separate from everything else in the system, and view them privately. It runs on sample data and on the first pilot coach's own export.

What comes next, each as its own step with its own safety gate:

| Step | What it adds | Gate before it ships |
|---|---|---|
| **Encryption at rest** | The vault encrypted on the coach's machine | Required before any second coach has a vault |
| **Source binding** | Every row tied to the exact file it came from | Required before anything reads the vault |
| **Optional enrichment** | Full career histories for the coach's own contacts | The coach's choice; legal review |
| **The yes-or-no judge** | Matching a case's need against the vault, on the coach's machine | Untrusted-input protection; sample data first |
| **The owner's resolution screen** | The coach sees which contacts matched and decides | Only the owner ever sees it |
| **The jobseeker sentence** | "A request has gone to a coach" in the jobseeker's view | Uniform wording, no leakage |

The vault reaches real coaches with the third phase of the build, once a pilot coach group exists and the legal review is signed off. It is one of the clearest examples of the Version 4 principle: the system carries the load, the person makes the choices, and the coach does the human work, with their own network, on their own terms.
