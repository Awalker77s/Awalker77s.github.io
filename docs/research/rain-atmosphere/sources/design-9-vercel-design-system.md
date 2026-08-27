# Source: vercel.com/design

- URL: https://vercel.com/design
- Fetch date: 2026-08-27
- Fetched via: WebFetch

## Typography (verbatim/near-verbatim)

Primary content typeface: **Geist Sans**. Monospace typeface **Geist Mono**, used "exclusively for code, commands, paths, raw tokens, timestamps, and short operational identifiers such as region, plan, SKU, account, or environment IDs."

Google Fonts import string given: `family=Geist:wght@400..600&family=Geist+Mono:wght@400..600` — i.e., variable weight range 400–600 is the endorsed range for UI text.

## Design principles (verbatim)

> Rejects "decorative gradients, glows, blobs, stripes, textures, grid backgrounds, glass effects, paper simulations, colored side rails, ornamental shadows."

> Dark mode: pages must remain "usable in light and dark" without visible theme switchers — "implicit theme behavior through semantic color tokens rather than manual controls."

> Hierarchy: "through typography before surfaces or color. Separate paragraphs with space; never use first-line indents."

> "Use tables for precise lookup, prose for one conclusion, and charts only for relationships that become faster to understand visually."

> Grid: "12 columns on desktop, 6 on tablet, and 4 on mobile. Reading prose normally occupies 6–7 desktop columns."

> "Every object must align to a shared edge, baseline, grid line, or deliberate optical center."

## Color tokens (names only — no hex given, tokens are abstracted/read-only)

Surfaces: `--vbg-surface-primary`, `--vbg-surface-secondary`, `--vbg-surface-contrast`. Text: `--vbg-text-primary`, `--vbg-text-secondary`, `--vbg-text-on-contrast`. Data series: `--vbg-chart-1` through `--vbg-chart-6`. Spacing: `--vbg-space-1` through `--vbg-space-16`.

**Gap: exact hex values behind these tokens were not exposed by this fetch** — Vercel's system deliberately abstracts them behind semantic names.

## Notes for design brief — [confirmed, primary source]

- This is the single strongest "restraint" data point in the whole research set, and it directly warns AGAINST several things an atmospheric-rain portfolio could over-do: no "glows/blobs," no "glass effects," no "ornamental shadows," no decorative gradients as a crutch. If the rain/water effect is added, everything else on the page should stay this disciplined — the weather effect should be the one atmospheric element, not one of many.
- The explicit rule that decorative effects and manual theme switchers are avoided is a useful counterpoint to the brief's own request for an animated background AND (implicitly, per Bruno Simon precedent) a sound toggle — i.e., Vercel's restraint is the ceiling to design *toward*, even though this particular project intentionally includes one signature atmospheric device (rain) that Vercel's own guidelines would reject for a SaaS product page. That's fine — a personal portfolio is allowed one strong idea a B2B product page is not; the discipline should apply to everything *besides* that one idea.
- Geist Sans/Mono is a legitimate, well-documented "dark professional" typography pairing (sans for UI/body, mono reserved narrowly for literal technical tokens) — a strong candidate pairing for an AI/automation engineer's portfolio, since "mono for code/CLI-ish snippets, sans for prose" maps naturally onto that role's actual work.
