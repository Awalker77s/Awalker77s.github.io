# Source: bchiang7/v4 GitHub repo — raw CSS variables + fonts source files

- URL: https://raw.githubusercontent.com/bchiang7/v4/main/src/styles/variables.js and https://raw.githubusercontent.com/bchiang7/v4/main/src/styles/fonts.js
- Fetch date: 2026-08-27
- Fetched via: WebFetch (raw source file from GitHub, i.e. actual shipped CSS-in-JS design tokens — primary source, not a listicle)
- Caveat: this is the **v4 (Gatsby, styled-components) iteration** of brittanychiang.com. The live site today (design-1) reports itself as rebuilt with Next.js + Tailwind, so current production hex values may have since evolved — but this v4 repo is the specific artifact the brief names as "famously cloned," and its palette is the one most widely recognized/imitated as "the Brittany Chiang dark-navy-and-mint aesthetic," so it is the right primary artifact to cite for that aesthetic regardless of what today's live build uses pixel-for-pixel.

## Color variables — FULL VERBATIM LIST

```
--dark-navy: #020c1b
--navy: #0a192f
--light-navy: #112240
--lightest-navy: #233554
--navy-shadow: rgba(2, 12, 27, 0.7)
--dark-slate: #495670
--slate: #8892b0
--light-slate: #a8b2d1
--lightest-slate: #ccd6f6
--white: #e6f1ff
--green: #64ffda
--green-tint: rgba(100, 255, 218, 0.1)
--pink: #f57dff
--blue: #57cbff
```

## Typography

Font family stacks: **Calibre, Inter, San Francisco** (sans-serif, primary UI/body); **SF Mono, Fira Code** (monospace, for labels/code-like text). `fonts.js` confirms the actual shipped webfont is **Calibre** (weights 400/500/600, normal+italic) and **SF Mono** (weights 400/600, normal+italic), loaded as local `.woff`/`.woff2` files via generated `@font-face` rules with `font-display: auto`. Inter/San Francisco/Fira Code are system-font *fallbacks* in the stack, not the primary shipped faces.

Font sizes: scale runs `--fz-xxs: 12px` up through `--fz-heading: 32px` (exact intermediate steps not fully captured by this fetch — gap).

## Layout tokens

`--border-radius: 4px`, `--nav-height: 100px` (`--nav-scroll-height: 70px` on scroll), `--tab-height: 42px` / `--tab-width: 120px` (experience section tab list), `--hamburger-width: 30px`. Named `--easing` / `--transition` cubic-bezier tokens for animation.

## Notes for design brief — [confirmed, primary source]

- This is a genuinely usable **dark navy + mint** palette structure worth studying as a *pattern*, not copying as literal values: a near-black base (`#020c1b`), a stepped navy surface scale (3 lightness steps: `#0a192f` → `#112240` → `#233554`) for background/card/hover layering, a **separate stepped slate scale for text** (4 steps from `#495670` muted up to `#ccd6f6` near-white, plus `#e6f1ff` true "white" for emphasis), and exactly **one saturated accent** (`#64ffda` mint/green) used sparingly, with a 10%-alpha tint variant (`rgba(100,255,218,0.1)`) for hover/highlight washes rather than a second solid color. Pink/blue exist as tertiary/rare accents.
- **Directly transferable technique for a rain/water portfolio:** the "stepped navy surface scale + single saturated accent + alpha-tint of that same accent for hover states" pattern is exactly the right shape for a rain-at-night palette — e.g., near-black storm-navy background, 2–3 lightness steps for panels/cards, a slate-family text scale for hierarchy, and ONE accent color (need not be mint — could be a cool cyan/electric-blue to read as "wet reflection" rather than reusing green, to avoid the palette reading as a literal clone of this specific site).
- Typeface takeaway: pairing a **licensed/premium display-grade sans (Calibre here)** with a **monospace for technical/code-flavored labels (SF Mono)**, falling back to Inter/system fonts, is a validated pattern for developer portfolios — structurally the same pairing philosophy as Vercel's Geist Sans + Geist Mono (design-9), just with different specific faces. For a project avoiding licensing cost/complexity, Inter (free, variable) + a free mono (JetBrains Mono, Fira Code, or Geist Mono) reproduces this same structure without Calibre's licensing.
