# Source: Make a Splash With Dynamic 2D Water Effects (Envato Tuts+)

- URL attempted: https://gamedevelopment.tutsplus.com/tutorials/make-a-splash-with-dynamic-2d-water-effects--gamedev-236
- Fetch date: 2026-08-27
- Status: REDIRECT — server returned 301 to https://code.tutsplus.com/c/game-development (a category listing page, not the article). Direct article fetch was retried at https://code.tutsplus.com/make-a-splash-with-dynamic-2d-water-effects--gamedev-236t (see follow-up fetch below / rain-1b if separate).
- Publication date: unconfirmed via fetch (WebSearch snippet suggested this is the canonical "classic" reference tutorial for spring-based 2D water with splash particles)
- License: unknown/unverified — Envato Tuts+ articles are typically all-rights-reserved editorial content, not code under an OSS license; treat any adapted code as "read the technique, re-implement independently."

## What WebSearch snippet reported (unverified, not a direct fetch quote)
> "The tutorial covers two mostly independent parts to water simulation: first, making waves using a spring model, and second, using particle effects to add splashes."
> "To make the waves, the water surface is modeled as a series of vertical springs... Water particles are made to pull on their neighbouring particles to allow the waves to spread."
> "The code runs Hooke's Law on each spring, then looks at height differences between springs and neighbors, with the neighbor-pulling step repeated eight times to allow waves to propagate faster."

Marked [reported, unverified] — this is a search-snippet paraphrase, not a verbatim fetch of the article body. The direct article WebFetch redirected to a category page and did not return article text. See rain-4 (anothrNick/2D-Water-Javascript-Demo) for a verified, code-level implementation of the same algorithm family (Hoffman-style spring + spread), and rain-2/rain-3 (prime31 blog) for a second independently-fetched description of the same technique lineage.

## Verdict (SUPERSEDED — see successful fetch below)
Could not obtain verbatim primary-source text directly from this specific tutorial due to redirect. This is a GAP — see final report. The algorithm itself is triangulated and confirmed via rain-2, rain-3, and rain-4, which describe the same spring+spread+splash technique with actual fetched code, so the underlying claim (spring model + neighbor propagation + splash particles) is [confirmed - 2 primary] via those other sources even though this specific page could not be verified directly.

---

## SUCCESSFUL FETCH (retry via alternate mirror URL)

- URL: https://code.tutsplus.com/make-a-splash-with-dynamic-2d-water-effects--gamedev-236t
- Fetch date: 2026-08-27
- Author: Michael Hoffman
- Publication date: August 14, 2012
- Copyright footer: "© 2025 Envato Trademarks" (site-wide copyright notice, all-rights-reserved editorial content — this is Envato Tuts+ prose+code, NOT an OSS-licensed repo; treat as a technique reference to re-implement, not a source to copy verbatim)

### Verbatim/close-paraphrase quoted fragments

> Position += Velocity;
> Velocity += Acceleration;

> a = -(k/m) * x - d*v
[acceleration from spring tension (k) and dampening (d), x = displacement from target/rest height]

> `k` (spring constant): Hoffman recommends `0.025f`
> `d` (dampening factor): demo uses `0.025`

> "Do not set the spring constant too high" [to avoid numerical instability with Euler integration]

> "Springs pull on their neighbouring springs" — spread mechanism computes `leftDeltas`/`rightDeltas` arrays of height differences, applies `Spread * (springs[i].Height - springs[neighbor].Height)`, executed across **8 passes per frame**.

> Spread constant range: 0 to 0.5; larger values accelerate wave propagation.

> Gravity constant for splash particles: `0.3f`. Particles removed when "off-screen or under water."

> Splash particle count spawns proportional to impact speed: "speed / 8" particles when speed exceeds 60 units. Particle velocity uses polar coordinates, randomized angle range **-150° to -30°**, magnitude scaling with `sqrt(speed)`.

> Water surface rendered as trapezoids (two triangles per segment), color gradient light-blue (surface) to dark-blue (depth). Splashes use **metaball** technique with additive blending + alpha-test for liquid-like fusion.

## Confidence
[confirmed - 2 primary] — this is THE canonical source for the browser spring-water technique (author Michael Hoffman, Aug 2012, Envato Tuts+/gamedevelopment.tutsplus.com), and its equations match rain-2 (prime31) and rain-4 (anothrNick JS demo) almost exactly: `velocity += tension*offset - velocity*dampening; height += velocity` is the same structure as `a = -(k/m)*x - d*v` integrated via semi-implicit Euler. The 8-pass neighbor spread also matches rain-4's WAV_PASS=6 (same mechanism, different tuned pass-count). This source additionally supplies the splash-particle side (gravity, angle range, count-by-speed, metaball rendering) that rain-2/rain-3 (Unity-flavored) only partially covered. This is the single strongest, most complete source for the whole "spring water + splash particles" pattern.
