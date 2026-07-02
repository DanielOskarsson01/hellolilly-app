# HelloLilly - Build Kickoff Seed

**For:** Claude Design (the design) + Claude Code / Fable (the build).
**Read first (the depth is here):**
- `docs/MASTER_PRODUCT_DESIGN_SPEC.md` - every surface, BUILT vs PLANNED, with real/conceptual data shapes and sample content.
- `docs/PROJECT_INVENTORY.md` - the factual state of the code (what is real today, and the 43 seams).

---

## Where we are (the one thing to internalize)

- The **backend for the core loop is BUILT and works**: research -> decode -> fit/gaps -> CV draft -> cover letter, plus job discovery. It has real submodules, a data contract, and 6 API endpoints.
- The **frontend never calls it.** There is no `/api/...` call anywhere in `src/`; the `useCase()` data bridge the architecture assumes does not exist; the 13 screens are fixture mockups; and the design system (`PageTemplate` / `ContentArea` / `ContentBox`) is built but **no screen uses it**.
- **~26 vision tools are still planned.** The full catalog, as-if-real specs, and real data shapes are all in the master spec.

The gap is not "missing tools." It is that nothing is connected, and the UI was built without a shared design or contract. The plan below exists so we do not just add 26 more disconnected mockups.

---

## The approach: design-first for the tools, data-bridge in parallel now. NOT a simultaneous build-everything.

**Stream 1 - Design (Claude Design). Start now.**
Design every surface from the master spec, built **on the design-system primitives**, and **against the real/conceptual data shapes** in the spec (so the design is implementable and the coding is a straight wire-up, not a reinterpretation). This is the long pole; everything downstream builds on it.
*Done when:* a coder can be handed a screen + the exact data shape it binds to.

**Stream 2 - Data bridge + wiring (Claude Code). Start now, in parallel. Design-independent.**
Build the `useCase()` layer; wire the ~6 already-built surfaces to their real endpoints (Matchanalys -> `POST /api/case/:id/analyze` -> `fit`/`gaps`; CV -> `/generate` -> `cvDraft`; Cover letter -> `/generate` -> `coverLetter`; the fill-gap loop; job search). Decide persistence (the store is in-memory today - nothing survives a restart).
*Done when:* one real case flows end-to-end through the UI on live backend data, no fixtures.

**Stream 3 - Build the rest (Claude Code + Fable). AFTER Streams 1 + 2.**
Build the planned tools, guided by the settled design (real components) and the proven bridge pattern (wired to backend from the start). Go in the vision's own order: Foundation -> Matching -> Network -> Market/learning. **Depth over breadth - fully wire a few before scaling.** Five tools that run on real data beat twenty-six mockups.
*Done per tool:* on the design system + reads/writes real (or clearly-marked conceptual) data + zero dead CTAs.

---

## Rules that keep it from re-breaking (these are the seams we already have)

1. Every screen builds on the design-system primitives - no new bespoke screens.
2. Every screen binds to a real endpoint / case part, or a clearly-marked conceptual shape - no orphan fixtures shipped as if live.
3. One persona everywhere: **Daniel Oskarsson** (iGaming / marketing) - see the persona section of the master spec. Honesty rules hold even in mockups.
4. The **crosslinking side-panel** ("help by situation") is on every surface - it is the core product idea, not a nice-to-have.
5. The same case record powers the jobseeker view and the coach view - design and wire both against the one shared `case`.

---

## First move (converge, then scale)

Start both streams on the **same cluster: Matchanalys + CV builder + Cover letter** - because those three already have real backend behind them and they are the core loop.
- **Claude Design:** design those three, bound to `fit` / `gaps` / `cvDraft` / `coverLetter`.
- **Claude Code:** build `useCase()` and wire those same three to their endpoints.

When Design and Bridge meet on that cluster, the whole pattern is proven end-to-end - then Stream 3 scales it across the rest with confidence.
