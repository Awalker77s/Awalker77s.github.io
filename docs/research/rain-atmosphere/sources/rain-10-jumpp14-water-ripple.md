# Source: jumpp14/Water-Ripple (GitHub)

- URL: https://github.com/jumpp14/Water-Ripple
- Fetch date: 2026-08-27
- License: not visible in fetched content (GAP)
- Commits: "11 Commits" shown on gh-pages branch; exact last-commit date not displayed in fetched excerpt (GAP)
- Live demo: https://jumpp14.github.io/Water-Ripple/

## Verbatim quoted fragments
> Reference source credited: "an archived article at: https://web.archive.org/web/20160418004149/http://freespace.virgin.net/hugo.elias/graphics/x_water.htm"
> Interaction: "users can interact by touching the water surface to create ripples that radiate outward and reflect off boundaries"

## Technique classification — DIFFERENT ALGORITHM FAMILY than the spring-water approach
This implements the **Hugo Elias 2-buffer ripple algorithm** (classic "DOS demo era" water ripple technique: two height-buffers, each cell's next-frame height = (sum of 4-neighbor heights in current buffer)/2 - previous-buffer-height-at-that-cell, then damped by a decay factor), NOT the 1D spring-per-column technique from rain-1/2/3/4. This is a full 2D grid ripple simulation (radiates outward in circles, reflects off walls) — visually richer for a pond/puddle look but O(width×height) per frame instead of O(width) for a 1D spring column array, i.e. meaningfully more expensive computationally for a full-viewport effect.

## Confidence and relevance
[single-source] on the Hugo Elias technique attribution. This is a legitimate alternative algorithm for "ripples propagating along a waterline," but its 2D-grid cost profile is a worse fit than the 1D spring-column approach for a full-viewport 60fps requirement on mid-range hardware sitting behind DOM content — the 1D approach only needs to simulate a thin horizontal strip (the waterline), matching the brief's "bottom ~15% of viewport" band, while a full 2D grid ripple sim would be simulating a much larger area than needed for a mere waterline effect. Noted as a fallback/enhancement technique (e.g., for close-up splash ripples layered on top of the 1D spring baseline) rather than the primary recommendation.
