# Source: anothrNick/2D-Water-Javascript-Demo (GitHub, index.html)

- URL: https://github.com/anothrNick/2D-Water-Javascript-Demo/blob/master/index.html
- Fetch date: 2026-08-27
- Last commit date: CONFIRMED via GitHub API (https://api.github.com/repos/anothrNick/2D-Water-Javascript-Demo): pushed_at = "2014-09-07T00:00:12Z" — i.e. this demo is ~12 years old / dormant, not actively maintained.
- License: CONFIRMED via GitHub API: license.name = null, license.spdx_id = null — no license file detected. Treat as unlicensed/all-rights-reserved; do not copy verbatim into a commercial portfolio. Re-implement from the equations/parameter values instead (which are just physics constants, not copyrightable expression).
- Stars (API-confirmed): 5
- Language: vanilla JavaScript + canvas

## Verbatim quoted fragments (exact parameter values)

> Spring Constant (K): 0.05
> Spread Factor: .2
> Dampening Factor: .005
> Tension: .01
> Wave Propagation Passes: 6 (WAV_PASS)
> Wave Frequency (spacing): 5 pixels

> this.speed += TENSION * x - this.speed * DAMP;
> this.height += this.speed;
[where x = HEIGHT - this.height, i.e. displacement from rest height]

> leftDeltas[i] = SPREAD * (springs[i].height - springs[i - 1].height);
> rightDeltas[i] = SPREAD * (springs[i].height - springs[i + 1].height);
[applied to neighboring springs across WAV_PASS iterations to propagate wave motion horizontally]

## Confidence
[confirmed - 2 primary] — this is a full, runnable, code-level implementation of the identical spring+dampening+neighbor-spread algorithm independently described in prose/pseudocode by rain-2 (prime31 part 1) and the rain-1 search-snippet paraphrase of the Tuts+ article. The three sources triangulate on the same technique lineage (this is effectively "the" canonical browser water-spring algorithm, reimplemented many times). This file is the strongest source for exact parameter values since it's the only one with concrete numbers for K/spread/dampening/tension/pass-count fetched directly.

## Adaptation-fit note
Straightforward to port to TypeScript: it's a small array of "spring" objects (height, speed) updated per-frame with a Hooke's-law integrator, then a fixed number of neighbor-diffusion passes. No external dependencies, no shader code — pure canvas 2D. License status unverified, so treat as a technique reference (re-implement from the equations) rather than a copy-paste source.
