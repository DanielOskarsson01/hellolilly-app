# HelloLilly - The Help Layer (right column): crosslink panel + assistant
**Status:** doc of record per D11, 2026-07-10 (originally drafted 2026-07-09).
**Scope:** the persistent right-hand column: the situation-aware help panel (the floor) and the conversational assistant (the layer above it). One design object, two layers, one spec.

---

## 1. Strategy anchors

The strategy paper gives this more weight than any single tool:

- Section 5 defines the side panel: templates, examples from similar roles, short videos, consented anonymised cases, discussions where someone hit the same wall, the right coach, research, motivational notes - "the help appears next to the work, instead of being somewhere the person has to leave the task to find."
- The crosslinking layer section makes the claim outright: the crosslinking, not any tool, is the moat. "The tools are the visible layer. The crosslinking is the system."
- The spoken mode ("the assistant guides the next step"), the assistant under every Knowledge Hub item, and "always a clear next step" are all fragments of the same assistant, currently scattered across three places in the paper.

Planning finding this note closes: the wireframes carry the panel ("Hjälp just nu") on every work screen, but no document of record gives the panel a build item. The most important part of the system has had no spec until now.

## 2. The two layers

**Layer 1 - the crosslink panel (the floor).** Deterministic and rule-based. No LLM. Reads the current screen, the case state, and the part being worked on; resolves a small set of slots. Cheap, predictable, always honest because it only links to things that exist.

**Layer 2 - the assistant (the voice above the floor).** Conversational, LLM via API, grounded by retrieval over the app's own state: the tool registry (TOOL_SPECS already exists in the repo), the case read models (homeSummary, caseRecord), and the library. It knows what every tool does and where the person is. The Knowledge Hub's per-item assistant is NOT a separate thing - it is this assistant opened with a resource in context. Unify them.

**Name (confirmed by Daniel, 2026-07-10):** the assistant is **Lilly**. The product is HelloLilly; the assistant is the Lilly you say hello to. The brand becomes a person you can talk to, which is the spoken-mode promise made literal.

## 3. Layer 1 spec - the panel

- **Slot types:** template · example · video/resource (from the Hub) · discussion (community) · coach (from coachCompetence) · next step (from Progress Support's rules) · research (existing dossiers) · encouragement (static, sparing).
- **The resolution rule (normative):** a slot renders only if it resolves to real content. No placeholder slots on real screens. On T4 demo screens, fixture slots are allowed under the screen's existing banner. This keeps the panel honest by construction: it can never promise help that is not there.
- **Context inputs:** screen id + case state + active part. A static rules registry maps context to candidate slots (code or config, not AI).
- **Tier: T1.** Buildable with zero LLM cost. Grows richer automatically as tools ship, because more real content resolves.
- **Instrumentation:** propose two ◇-reserved taxonomy rows for §T (verify against §T's emission philosophy in the addendum session): `help.opened` and `help.item_used`. Rationale: the panel is the natural instrumentation point for the Outcome Engine's core question - which support actually helps which people. Without these rows the learning layer is blind to the very layer the paper calls the system. **Outcome (D11, settled):** both rows were evaluated and **rejected** per §T's philosophy — they are client-side view events (reading/browsing, an explicit §T non-event) and would double-count actions the destination tools already log. The learning-layer need routes to the learning layer's **own telemetry stream** instead, per the note now in `REST_OF_SITE_DATA_CONTRACT_ADDENDUM.md` §T.

## 4. Layer 2 spec - Lilly, v1 boundary

**Can do at v1 (tier T2, deliberately thin):**
- Explain any tool: what it does, what it needs, what it will not do (grounded in TOOL_SPECS, static and safe).
- Navigate and hand off: "open the cover letter with this job selected" - deep links with context, person confirms.
- What next: delegates to Progress Support's next-step rules. Lilly NEVER invents her own priorities - one brain for next steps, not two.
- Explain a resource: the Hub assistant role, absorbed.
- Answer questions about the person's own state by citing it: "you have 3 applications waiting" comes from the read models, cited, or is not said.

**Not at v1:** emotional coaching, tone-reading of the person, proactive interruptions, an anticipation engine, long-term conversational memory (conversations are transient at v1; durable memory is learning-layer territory and waits for it).

## 5. Posture rules (the part that makes it HelloLilly and not a chatbot)

1. **Quiet by default.** Collapsed, silent, present. Speaks when spoken to; the panel's slots are the only unprompted surface. A copilot that talks constantly is the dense dashboard wearing a face.
2. **One suggestion at a time.** Verdict-style brevity. Never a menu of options where one will do.
3. **The honesty gate applies.** Any claim about the person cites datafacts or case parts, or is refused. Lilly's knowledge of the tools is static and safe; her knowledge of you is gated like every other tool's.
4. **Anti-blame applies** (the D10 parked gate lands here first): mechanism language, never trait attributions - "the letter is missing two keywords", never "you tend to undersell yourself".
5. **Suggestions, not actions.** Lilly navigates, prefills, drafts handoffs - the person confirms everything. No autonomous writes, ever.
6. **Lilly upholds verdicts - the spiral's side door stays shut.** When E1 has said SEND, and the person asks Lilly "but is it really okay?", Lilly does not offer a fresh review. The pass ceiling is system-wide or it is nothing. Same for every tool's refusals: Lilly never re-litigates another tool's honesty gate.

## 6. The model decision

**LLM via API plus retrieval. No bespoke local model.** The strategy paper already decided this (Section 7: start with an off-the-shelf model made better by your own crosslinked knowledge base; selective fine-tuning later only where it clearly earns its place), and the master plan parks fine-tuned models as not-yet. A local model would multiply the Image Studio hosting question by a hundred and deliver worse Swedish. The privacy dimension of API calls belongs to the parked AI Act/governance review, not to this decision.

## 7. Tiering and placement

- **Panel (Layer 1):** build with the Wave 1 frontend screens - it is already drawn on every work-screen wireframe, and its rules registry is small.
- **Lilly (Layer 2):** her own small wave after Wave B, because she needs Progress Support's next-step rules and the read models to exist. Voice via browser speech APIs after that, per the A2 decision.
- **Decision candidate for Daniel:** adopt this note's boundaries as D11 when it becomes a doc of record.

## 8. Refusals (so nobody relitigates mid-build)

- No always-on chatter, no proactive interruptions, no engagement mechanics. Banned: streaks, nudges-for-nudging's-sake, "just checking in".
- No bespoke local model at MVP (see 6).
- No autonomous actions - the person confirms every write and every send, always.
- No emotional-state inference presented as fact. Lilly does not do tone-reads of the person at v1, at all.
- No panel slot that does not resolve to real content on a real screen (fixture slots live only under T4 banners).
- No second opinion against another tool's verdict or refusal - the ceiling holds everywhere.

## 9. Open questions

1. ~~The name~~ - resolved: **Lilly**, confirmed by Daniel 2026-07-10.
2. Conversation persistence beyond a session - deferred to the learning-layer work by default; confirm.
3. Panel behaviour on mobile (collapse pattern) - Design's call in its wave.
