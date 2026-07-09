# HelloLilly app — agent instructions

## Verification gate — "green" means tests pass AND it compiles

Before you commit anything user-facing, and **always** before a merge or push to `main`,
run the full gate:

```bash
npm run verify   # = npm test && npm run build
```

**`npm test` alone is NOT the gate.** `node --test` never runs Vite, so a green suite can
hide a broken client build. This happened once: a JSX syntax error sat on `main` with
228/228 tests green because nothing compiled the client (`npm run build` was the only thing
that would have caught it). Treat a change as "green" only when the suite passes **and**
`npm run build` succeeds.

- Inner TDD loop: `npm test` is fine (fast; run it as often as you like).
- Gate (before commit of user-facing code, and before every merge/push): `npm run verify`.
- CI enforces the same gate: `.github/workflows/deploy-pages.yml` runs `npm test` then
  `npm run build` on every push to `main` **and** on every pull request — a broken build
  fails CI. Deploy to GitHub Pages happens only on a push to `main`.
