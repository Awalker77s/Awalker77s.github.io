# Source: Nielsen Norman Group — "Ensure High Contrast for Text Over Images"

- URL: https://www.nngroup.com/articles/text-over-images/
- Fetch date: 2026-08-27
- Fetched via: WebFetch

## Verbatim fragments

> contrast ratio of at least "4.5:1 (or 3:1 for large characters, defined as an 18-point font or a 14-point bold font)"

> "Ensure that the text is both legible and readable" — legibility = distinguishing characters, readability = processing word meaning (NN/g draws this distinction explicitly).

> Semi-transparent overlays: "a semi-transparent black gradient over the image in the CSS"

> Blur: "Blurring a portion of a photo minimizes legibility issues by making the text background appear more consistent."

> Positioning: "the lower portion of photos tends to lend itself well to added effects such as a blur, a darkening-gradient overlay (AKA 'floor fade'), or a semitransparent colored background."

> Combined approach: "a semiopaque overlay (either covering the entire image or just the text portion), a blur, a text shadow or outline, or a combination of these techniques"

> Worst-case design: "Consider all possible images that may be used" and ensure the technique gives "a high enough contrast for the worst-case background image."

## Notes for design brief — [confirmed, primary/authoritative source — NN/g is a recognized UX research authority]

This is the strongest single citation for the READABILITY TECHNIQUES section. Direct mapping to a rain-background portfolio:

1. **WCAG contrast floor (4.5:1 body / 3:1 large text)** is the hard numeric target regardless of how the rain/water background looks behind it — should be checked against the darkest AND lightest moments of the animation, not just a still frame.
2. **"Floor fade" gradient overlay** maps almost exactly onto "water surface at the bottom" — a bottom-anchored darkening gradient is both a readability technique AND consistent with the water/reflection visual concept, so it can do double duty.
3. **Worst-case-background design principle** is the key discipline for an animated (not static) background: because the rain/water is always moving and lightness varies frame-to-frame, content panels need a contrast treatment that holds up at the brightest instant the animation ever produces, not just its average.
4. **Blur + scrim behind text blocks**, rather than only a full-bleed overlay, lets the rain stay fully visible in the negative space around content (hero margins, section gaps) while content panels themselves sit on a calmer, more opaque surface — this is the standard "content card floats over atmosphere" treatment implied by combining scrim + blur + positioning guidance.
