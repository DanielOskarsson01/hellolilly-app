# HelloLilly - Design System (the shared contract)

**What this is:** the single source of truth for the visual language - colors, type, spacing, radii, shadows, grid, motion - extracted verbatim from the code (`src/styles/hello-lily.css` `:root`). The code's own comment says it: *"screens reference these; they never hardcode px/hex."*

**How both sides stay "the same design system":**
- **Claude Design:** design using ONLY these tokens + components. Do not introduce a color, spacing step, type size, radius, or font outside this set. If a screen genuinely needs something new, add it here first (deliberately) - never invent it inline.
- **Claude Code:** these tokens already live in `src/styles/hello-lily.css`, the components in `src/components/grid.jsx`. Build screens by composing the components and referencing the tokens - never hardcode hex/px.
- **Same by construction:** if both sides reference this one token set, design and code render identically. That is what "the same design system" means operationally - not a vibe match, a token match.

---

## Color
**Brand blue (primary):** `--ll-blue` #2B6CF0 · `--ll-blue-strong` #1E50C0 (hover/pressed) · `--ll-blue-deep` #14346E (emphasis) · `--ll-blue-tint` #E9F1FE · `--ll-blue-tint-2` #F4F8FF · `--ll-sky` #BBD4FA
**Ink (text):** `--ll-ink` #16233A (body) · `--ll-ink-soft` #51607A (secondary) · `--ll-ink-mute` #8694AC (captions)
**Accents (used sparingly):** coral #FF7A59 / soft #FFE7DF · amber #FFB23E / soft #FFF1D6 · green #2FA56A / soft #E2F4EA · lilac #8E7CF0 / soft #ECE9FD · pink #FF6FA8 / strong #F2478F / deep #B12E66 / soft #FFE6F1
**Surfaces & lines:** white #FFFFFF · paper #FBFCFE (app canvas) · cream #FBF7F0 / cream-deep #F4ECE0 · border #E4EAF3 / border-strong #D2DCEC

> **Confirm one thing with Claude Design:** the palette carries BOTH a blue-primary set AND a cream + "bubblegum pink" layer (`--ll-pink`, tagged in the CSS as "the brand's interchangeable 2nd colour"). Make sure Claude Design and the code agree on which is the current brand direction - that is the most likely place to drift.

## Type
- **Fonts:** display = **Nunito**, body = **Plus Jakarta Sans**
- **Size scale (px):** stat 48 · 3xl 40 · 2xl 34 · xl 25 · lg 20 · md 16 · base 14.5 · sm 13 · xs 12 · 2xs 11
- **Line height:** tight 1.15 · snug 1.3 · normal 1.5
- **Weights:** 400 / 500 / 600 / 700 / 800 / 900 · **tracking:** tight -.02em, eyebrow .07em

## Spacing (4px base scale)
`0 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96` (`--sp-0` .. `--sp-12`)
Rule: 16px default for boxes/lists, 32px for text/media/large regions.

## Radii
pill 999 · xl 28 · card 22 · md 16 · sm 12 · xs 9 (px)

## Shadows
`--sh-sm` / `--sh-md` / `--sh-lg` (soft, low, navy-tinted) + `--sh-blue` (blue glow for the primary CTA)

## Layout - the 3-area grid
max width 1440 · outer pad 40 · left nav column 208 · right cross-link rail 256 · gap 64 · gutter 16
Reflow breakpoints: lg 1180 · md 900

## Motion
ease `cubic-bezier(.2,.7,.2,1)` · duration .22s · fast .14s

## Components (build ON these - `src/components/grid.jsx`)
- **Layout:** `PageTemplate` · `ContentArea` · `ContentBox` · `CrossColumn` (the crosslinking rail)
- **Content:** `Hero` · `BigStat` · `MatchRing` · `Field` · `Link` · `JobRow` · `CrosslinkCard`
- Plus shared bits in `primitives.jsx` and the nav shell in `shell.jsx`.

---

## The one rule that keeps them in sync
**No hardcoded hex or px in a screen - everything routes through a token above.** A new need means adding a token here first, deliberately, so both sides pick it up. Give this file to Claude Design as the hard constraint, and check any design output against it: a new colour/size/font that is not in this list is drift - resolve it (add it here on purpose, or drop it) before it reaches code.
