# Valvet (the Coach Vault) — Consolidated State

The consolidated state of **Valvet** (the Coach Vault), so its status and design live in one doc of record instead of scattered across chat.

**Cross-references (authoritative):**
- `docs/DECISIONS_ADDENDUM.md` — **D21** (the architecture decision) and **D9** (Daniel as coach #1).
- `docs/RETROFIT_LEDGER.md` — the **two vault entries** (the encryption HARD GATE and the provenance CONSUMER-READ GATE). **Note:** those two ledger entries currently live in the ledger **on the `valvet-slice-1` branch only** — they land on `main` at merge. The `main` copy of `RETROFIT_LEDGER.md` does not yet carry them.

---

## What Valvet is

The **coach-side** tool where a coach loads her **own** LinkedIn connections into a **private, local vault on her own machine**. The architecture is **D21**:

- The full vault (names, URLs, histories) lives **encrypted on the coach's own machine only**.
- **HelloLilly never receives, stores, or queries vault rows.** Only **JA/NEJ verdicts + opaque IDs** ever transit the boundary.
- On a hit, the **owner coach resolves the opaque IDs locally** to her real rows and makes the intro herself.
- **Everyone else sees a uniform sentence** ("en förfrågan har gått till en coach" / "ingen träff just nu") — no names, no rows, no free-text query interface.

**Daniel is coach #1 (D9)** — Valvet is built for him first (the messaging-bridge pilot model).

## What slice 1 built (ingest + view only)

- **Upload** a LinkedIn `Connections.csv`.
- **Parse it defensively** — handles the LinkedIn notes-preamble that precedes the real header row.
- **Store it in a separate local SQLite vault** (`server/data/vault.db`) via a dedicated adapter that is **physically separate from the main store**.
- **Display the rows in the four envelope states** — empty / pending / ready / failed.
- **Re-upload replaces wholesale.**
- **Synthetic fixture only in git** — invented people, including one deliberately malformed row. No real export is committed.

## Status

- **Branch `valvet-slice-1` @ `39ca8e3`** (full: `39ca8e358be5f38f39e2a146bb9e217f29cc0da1`), **pushed** (`origin/valvet-slice-1` matches).
- **Verification recorded at slice 1:** `npm run verify` green (298 pass / 0 fail).
- **NOT merged.** The merge is **gated on a real-export walkthrough by Daniel**, which is currently **PAUSED and parked at Phase 3 (Network)**.
- The Valvet source (including `src/screens/valvet.jsx` and the `server/vault/*` adapter) exists **on the `valvet-slice-1` branch only** — not on `main` until merge.

## D19 conformance (the review postdates the original brief)

- **Finding 1 — PII in git — HANDLED.** Fixtures are invented people; no real export is committed; the runtime vault is git-ignored.
- **Finding 3 — reader isolation — HANDLED.** The vault store is physically separate; a runtime separation test proves the main store cannot return vault rows; no generator reaches it; `/api/vault` is the sole owner-view surface.
- **Finding 2 — provenance — LEDGERED as owed.** Vault rows carry only a loose `untrusted-derived` tag with **no immutable source binding**. Recorded in `RETROFIT_LEDGER.md` as a **CONSUMER-READ GATE** — the rows must bind to an immutable source (source-file hash + per-row digest) **before any consumer reads vault rows.**

## The two gates it carries (kept distinct)

1. **Encryption — HARD GATE (D21).** Blocks any **second coach's** vault. It is about **who owns** the vault: a hard precondition on any vault belonging to someone other than Daniel, regardless of demo/real status. (Daniel's own prototyping on his own machine sits outside this gate per D21.)
2. **Provenance — CONSUMER-READ GATE (D19 / Codex Finding 10).** Blocks any **consumer READ** of vault rows. It is orthogonal to ownership: it **fires on the first consumer read**, not on the second coach, and **applies even to Daniel's own vault**.

**Slice 1 is safe under both** because it is **ingest + view only** — no consumer reads the vault.

## OPEN FINDING

The **Valvet nav item is reportedly not visible** in the running app, despite the screen existing (`src/screens/valvet.jsx`, on the `valvet-slice-1` branch) and the slice-1 commit touching coach nav. **Under investigation** — reachability / wiring to **confirm before merge**.

## Roadmap ahead (all UNBUILT — later slices, each its own brief and gates)

- **Optional enrichment** of the coach's own network via the **cookie-free third-party route** (D21 — proven 2026-07-16, ~$4 per 1000 profiles, **never on the coach's LinkedIn account**).
- **The edge JA/NEJ judge** inside the injection envelope (D12 Rule 2: profile text is untrusted-derived).
- **The hit-resolution screen** — the owner sees the exact rows and makes a human intro.
- **The jobseeker-facing uniform-sentence surface (E3).**

Each of these is its own slice, with its own brief and its own gates.
