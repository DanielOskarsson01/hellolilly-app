# HelloLilly - Retrofit Ledger

**The gate (Section 5, `HELLOLILLY_ARCH_RULES.md`).** These are shipped paths that predate the Architecture Rules Addendum (D12). Each is retrofitted **at next touch while demo-only**. **This ledger must be empty before any real-jobseeker use** - it is one half of the real-persons gate (the other is the recorded governance review). No path leaves the ledger without its eval cases existing first.

Created with D12, 2026-07-11. One line per shipped path.

| Path | Predates which rules | Retrofit trigger | Exit condition |
|---|---|---|---|
| **The letter writer** - `server/submodules/writer/execute.cjs` (UI `src/screens/coverLetter.jsx`) | Rule 1 (anti-blame prose about the person), Rule 2 (consumes job ad / decoded role - untrusted-derived, must be enveloped), Rule 4 (prose-producing, needs the eval corpus) | Next touch of the writer submodule or its screen | Zero-tolerance + graded eval cases exist for the letter path before it leaves the ledger |
| **The presend judges** - `server/skeleton/fill-gap/bullet-judge.cjs`, `server/skeleton/fill-gap/keyword-judge.cjs` (UI `src/screens/presend.jsx`) | Rule 1 (verdict prose), Rule 2 (the judged artifact is model-written, must be enveloped inside the checker per Rule 3's artifact clause), Rule 3 (maker/checker separation - enumerated shared-state ban, written input contract), Rule 4 (judging path, zero-tolerance verdict-discipline cases) | Next touch of either judge or the presend screen | Judge input contracts written + zero-tolerance eval cases exist before either leaves the ledger |
| **Matchanalys prose** - `server/submodules/gap-analyzer/execute.cjs` (UI `src/screens/match.jsx`) | Rule 1 (fit prose about the person), Rule 2 (consumes the job ad - untrusted), Rule 3 (it carries a fit claim the person relies on, so it needs a checker), Rule 4 (prose + verdict eval cases) | Next touch of the gap-analyzer submodule or the match screen | Eval cases (anti-blame + fit-claim discipline) exist before it leaves the ledger |
| **The A1 researcher prompts** - `server/submodules/researcher/execute.cjs` | Rule 2 (researcher fetches are untrusted ingestion; dossiers are untrusted-derived and permanently tainted), Rule 4 (authored research prose), Rule 1 where output characterizes the person | Next touch of the researcher submodule | Ingestion-class adversarial cases + prose eval cases exist before it leaves the ledger |

**No dedicated retrofit wave** (D12 / Rule 4's frozen-zone note): retrofit happens next-touch while demo-only, with this ledger as the honest debt record. Retiring the last row is a precondition for opening the real-persons gate.
