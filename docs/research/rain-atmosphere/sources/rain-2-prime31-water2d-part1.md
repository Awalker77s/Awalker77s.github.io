# Source: Modeling 2D Water With Springs: Part 1 (prime31 blog)

- URL: https://prime31.github.io/water2d-part1/
- Fetch date: 2026-08-27
- Publication date: not shown in fetched excerpt (prime31 blog, pre-2020 era Unity/game-dev blog; unconfirmed exact date)
- License/copyright: not stated in the fetched content — no license line visible
- Author: prime31 (Mike Desaro)

## Verbatim quoted fragments

> var heightOffset = baseHeight - currentHeight;
> velocity += tension * heightOffset - velocity * dampening;
> currentHeight += velocity;

> "a series of springs all in a vertical direction" [describing the water surface model]

> spring count configurable at "20, 40, or 100 springs" to balance visual quality versus performance across mobile and desktop platforms

> Article explicitly ends: "In the next post we will go over the rest of the simulation details" [i.e., neighbor/wave-propagation pass is covered in Part 2, not Part 1]

## Notes
This is a C#/Unity-flavored description of the exact same technique as the Envato Tuts+ article (spring restoring force = tension * displacement - velocity * dampening, then integrate). It corroborates the core Hooke's-law-per-column update independently of rain-4 (JS implementation). No neighbor-propagation/spread equations are in Part 1 — that's deferred to Part 2 (rain-3), but rain-3 in practice only covered splash/impact mechanics, not the spread loop itself in the fetched excerpt.

## Confidence
[confirmed - 2 primary] for the core per-column spring update equation (velocity += tension*offset - velocity*dampening; height += velocity), corroborated by rain-4's JS code which uses the identical structure (`this.speed += TENSION * x - this.speed * DAMP; this.height += this.speed;`).
