# City-canvas research — calm sci-fi skyline behind the rain

Research date: 2026-08-27. Scope: above-water city scene (skyline, atmosphere, window lights, flying cars, performance) for the existing canvas-2D rain engine. Sound and scroll/underwater are owned by other lenses (see Additional Leads).

## BLUF

- **Skyline = 3 pre-rendered silhouette bands**, generated as a walk of grid-snapped rects with a power-law height distribution (`Math.pow(random, k)` gives few spires, many low buildings) — the exact pattern used in John Burn-Murdoch's canvas city gist. [confirmed — 2]
- **Depth is a color operation, not a detail operation**: per layer, lerp fill toward the sky color, drop contrast and saturation; Blade Runner 2049's VFX team found detail contrast and haze are directly coupled ("contrast … looked too much when the haze was reduced"). [confirmed — 2]
- **Windows: per-building lit ratio + horizontal run grouping, near-static** (Pixel City); "alive" comes from windows slowly turning on/off over minutes, not flicker (proceduralgraphics 2010 uses per-window turn-on *times*). Exact cadence numbers below are [speculation — flagged].
- **Cars = 2-px light dots on fixed straight lanes, constant per-car speed, wrap at edges** (Pixel City part 7 — complex motion is invisible and reads worse); trails via a per-car stored-positions array with alpha ramp (kirupa) — the full-canvas fade trick is unusable here and unnecessary.
- **Pre-render each static layer to a snug offscreen canvas, `drawImage` per frame at integer coords; regenerate on resize/DPR change** — standard practice per MDN + web.dev. [confirmed — 2] Skip the flipped-city water reflection (null search; physics water makes a static mirror read wrong); use per-light glint streaks instead [speculation — flagged].

---

## Q1 — Skyline generation

**Random-rect walk with power-law heights (real code).** John Burn-Murdoch's canvas city generator (gist, ~2017, fetched 2026-08-27) walks x across the canvas emitting buildings:

- Height: `Math.pow(Math.random(),6) * ((height*(1-CBDdist))-base-20) + 20` — the `pow(r, 6)` skew yields mostly short buildings and rare towers; a "CBD distance" term concentrates height near a chosen x (a downtown cluster reads as a real city, not a bar chart).
- Width: `Math.random() * 25 + 15` (15–40 px).
- Grid snap: `h = (+(h/wh).toFixed()) * wh` with `wh = 10`, `ww = 3` — snapping to the window grid so window rows always fit cleanly.
- Windows are a nested fillRect loop over that grid with `wh-0.5` / `ww-0.5` cell sizes (built-in mullion gaps).
Source: https://gist.github.com/johnburnmurdoch/c709504355a39a38f8684e6a51c95c28

**Deterministic reseed.** proceduralgraphics.blogspot.com (2010-01, fetched 2026-08-27) regenerates the whole skyline every frame from a fixed seed: "by setting the seed to the same value, you can re-create it again" — with the caveat that random calls must be an unconditional sequence. For us: generate once with a stored seed instead (we pre-render), but keep the seeded-PRNG discipline so resize rebuilds the *same* city. Source: https://proceduralgraphics.blogspot.com/2010/01/city-skyline.html [single-source]

**What makes it read sci-fi rather than generic** (Pixel City, Shamus Young, 2009, fetched 2026-08-27):
- Tiered/tapered towers driven by ~8 parameters: "Tier height proportions, ledge width…, tapered profiles toward the roof" — setback towers are the strongest single "future city" silhouette cue. https://www.shamusyoung.com/twentysidedtale/?p=3059
- "Larger gaps between buildings" so silhouettes stand out — density ≠ believability. (same URL)
- Roof clutter ("HVAC systems and infrastructure") + antennas break the flat roofline. (same URL)
- Blade Runner 2049 scale language: Weta built "colossal pyramid-shaped skyscrapers"; scale came from "smaller structures, fittings and detailing on the buildings," not from motion or clutter (Foundry, fetched 2026-08-27, https://www.foundry.com/insights/film-tv/iconic-look-blade-runner-2049 + Weta/VFXVoice search results). One or two oversized trapezoid/pyramid masses in the far band buy the "mega-structure" read cheaply. [confirmed — 2 for the pyramid/megastructure design language]

**Verdict:** rect-walk + pow-height + grid snap + (tiering, occasional antenna, 1–2 far pyramids, deliberate gaps) = sci-fi silhouette. An elevated monorail line (thin horizontal line between two mid-band towers) appears in no fetched source — [speculation — flagged], but consistent with the silhouette-cue logic.

## Q2 — Depth / atmospheric perspective

Slynyrd Pixelblog 62 (2026-05-27 — fresh, fetched 2026-08-27), concrete per-plane rules:
- "The closest plane is the most saturated with strongest contrast… saturation reduces with each receding plane."
- "Lightness increases… under… daylight, and atmospheric haze."
- "The hue shifts more to the color of the sky with each receding plane."
- Whole scenes achieved with ~15 total colors across all layers.
Source: https://www.slynyrd.com/blog/2026/5/27/pixelblog-62-landscape-backgrounds

Blade Runner 2049 VFX (Foundry, fetched 2026-08-27): "All the contrast that made the details show through the haze looked too much when the haze was reduced" and "atmosphere and view distance was a constantly changing target" — i.e., haze density and detail contrast must be tuned *together*; heavy haze is what licenses any visible detail. [confirmed — 2 with Slynyrd]

**Formula for us (night variant):** at night "lightness increases" inverts to "value converges on the sky value." Per layer i with depth t ∈ {0.75, 0.5, 0.25} (far→near): `color_i = lerp(buildingBase, skyColorAtThatY, t)`. Far band ends up a few steps darker than sky (barely-there silhouette), near band darkest. Optional haze: a vertical gradient (sky color, alpha 0.15→0) drawn over far+mid bands only. Exact lerp values are ours — [speculation — flagged], the direction and monotonicity are sourced.

## Q3 — Window lights

Pixel City (fetched 2026-08-27) is the strongest source:
- Texture: 512×512 → 64×64 window grid → 8×8 px per window, "6×6 usable" with border. Dark patches sit in the window's lower half ("furniture"), plus color noise so it reads as "a far-off view of a cluttered, busy scene." https://www.shamusyoung.com/twentysidedtale/?p=2954
- Lighting model v2: per building, "It randomly decides at the outset how big the interior spaces are, and what percent of the windows should be lit" — lit windows come in horizontal runs (offices/floors), and the lit ratio varies *per building* instead of globally. Uniform scattershot across all buildings read as monotonous. https://www.shamusyoung.com/twentysidedtale/?p=3059 [confirmed — 2 posts of the same project; treat as one strong project source]
- Vertical blank (windowless) strips: "shocking how the eye can instantly spot the break in the pattern" — pattern breaks matter more than pattern detail. (p=3059)
- Building/light tints limited to a small set of "common lights" colors. (p=3059)

Aliveness without blinking: proceduralgraphics (2010) gives each window "a random value of what time they'll turn on" — windows change state on a *clock*, they don't oscillate. [single-source]

**Calm parameters** (ours, [speculation — flagged], anchored to the above): lit ratio drawn per building from 0.04–0.18; runs of 1–4 adjacent lit windows; state changes: one window toggles every 2–6 s across the whole scene with a ~1 s alpha fade — that is ~0.2 state changes/s/screen, orders of magnitude below any flash-risk cadence (WCAG's flash threshold is 3 flashes/s — lead, not fetched). Warm-vs-cool mixing: Pixel City limits tints; our palette rule (one cyan accent) argues for cool-white windows at 2–3 brightness steps, warmth expressed as a slightly desaturated tint on ≤15% of lit windows *only if* it survives the one-accent rule — a taste call, not a sourced requirement.

## Q4 — Flying cars

**Render cars as lights, not shapes.** Pixel City part 7 (fetched 2026-08-27): "draws a simple 2d panel at a car's location. If the car is heading away, it draws it red, otherwise, white." Behavior: cars "select a speed and drive in a straight line until they get to the edge of the map, and then they randomly appear in a new location" — he deleted lane-change/turn AI because "I wasted a bunch of time writing code that slowed down the program and looked terrible when you noticed it at all." https://www.shamusyoung.com/twentysidedtale/?p=3080 [single-source, but strong: measured his own failure]
Viewer criticism of his demo video was that all cars moved at identical speeds (search-level, [reported, unverified]) — vary per-car speed.

**Trails on a fully-redrawn canvas.** The classic full-canvas translucent-fill fade is unusable for us (scene redraws every frame). The standard alternative (kirupa, fetched 2026-08-27): store recent positions per object and redraw them each frame:
```js
positions.push({x, y}); if (positions.length > motionTrailLength) positions.shift();
var ratio = (i + 1) / positions.length;           // oldest → ~0, newest → 1
context.fillStyle = "rgba(…, " + ratio / 2 + ")"; // draw oldest→newest, object last
```
`motionTrailLength = 10` in the tutorial. https://www.kirupa.com/canvas/creating_motion_trails.htm [single-source for the exact code; the technique is corroborated conceptually by rectangleworld's trail-methods article — lead, not fetched]
Cheaper equivalent for a straight-line car: one `createLinearGradient` stroke from tail to head (transparent → car color) — same visual, 1 draw call. [speculation — flagged]

**How many cars stay calm:** no fetched source states a number (null). Foundry's BR2049 account is the best calibration: the director *removed* motion ("pieces of cloth swaying… brought life to the shot" — rejected) to keep the scene austere. Recommendation: cap 3 concurrent, spawn interval 6–14 s randomized, 20% chance a spawn is skipped (silence gaps). [speculation — flagged]

## Q5 — Performance

**Pre-render + composite is standard practice.** [confirmed — 2]
- MDN Optimizing canvas (current, fetched 2026-08-27): "consider offloading them to an offscreen canvas… render the offscreen image to your primary canvas as often as needed"; also: `Math.floor()` all drawImage coords (sub-pixel = slow + blurry), "Avoid the shadowBlur property whenever possible," avoid state changes, batch paths. https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
- web.dev canvas-performance (2011 — old but consistent with current MDN): pre-rendering pays "when the rendering operation is expensive," **and** "make sure that your temporary canvas fits snugly around the image" or the copy cost eats the win. Layered canvases: background "only every Nth frame." https://web.dev/articles/canvas-performance
- No current measured ms numbers retrieved (web.dev's jsperf links are dead-era); claim of "hardware-accelerated drawImage" appeared only in an ag-grid blog snippet — [reported, unverified]. The *practice* is confirmed; the *magnitude* is not quantified here.

**DPR/resize:** no fetched source addresses DPR for pre-rendered layers directly (null). Engine-consistent plan: offscreen layer canvases sized `cssWidth × layerHeight` × min(dpr, 2); on resize or dpr change, regenerate from the stored seed. Snug-fit note → each band's canvas is only as tall as its tallest building + glow margin, not full viewport. [speculation — flagged, direction sourced from web.dev snug-fit]

**Water reflection:** the targeted search found only generic pixel-displacement ripple demos (Almeros WaterCanvas etc.), no skyline flip examples — **null for the specific technique**. Given our water already has physics shading, a static `scale(1,-1)` low-alpha mirror would sit visually *under* a surface that moves independently and break the illusion. Recommendation: skip the mirror; instead, for the ~8–12 brightest lights near the waterline, draw a 1-px vertical glint streak below the waterline, alpha modulated by the local spring-column displacement (reuses existing sim data, reads as shimmer). [speculation — flagged]

## Q6 — Mood references

1. **Blade Runner 2049 production design** (Foundry article, fetched; Weta/VFXVoice/architectmagazine search-level — architectmagazine 403'd). What it does right: haze does the restraint (dim skyline, lit-window pinpricks, near-monochrome); scale from silhouette masses (pyramids), not from activity; motion deliberately removed. [confirmed — 2 for haze/scale language]
2. **"The Drive Home" — BigWings, Shadertoy MdfBRX.** Rainy night, bokeh city lights, slow constant motion; community calls it "very relaxing." Page 403'd — [reported, unverified]. Right move to steal: lights are soft, sparse, and slow; nothing on screen demands attention.
3. **njmcode "Procedural Canvas cityscape"** (CodePen xRdJWa, 403'd — [reported, unverified] via search description): endless flyover of "random rows of lights and buildings" — evidence that rows of dim lights alone carry a city read.
4. **proceduralgraphics skyline** (fetched): calm via *slow global change* — a sunset→night fade with windows turning on over time. Slow scene-level drift is a legitimate aliveness channel.

**What busy ones do wrong** (from search-level survey of CodePen "cyberpunk" pens): glitch effects, saturated neon multi-color palettes, fast uniform motion (Pixel City demo criticism), flashing. Every one of those violates our locked rules already — the rules are the moat.

---

## Recommended scene spec (for OUR engine)

Coordinate frame: waterline y_w = 0.86 × viewport height (top of the 14% water band). City occupies roughly y ∈ [0.35, 0.86] × h.

**Layers (back→front), each pre-rendered to a snug offscreen canvas at min(dpr,2):**

| Band | Base y-extent | Building w (css px) | Height dist | Fill (lerp base→sky #0a1322) | Content |
|---|---|---|---|---|---|
| far | up to 0.30h above y_w | 24–56 | pow(r,4), 1–2 pyramid masses | t≈0.72 → ~#0a1220 | pure silhouette, 3–5 pinprick lights total |
| mid | up to 0.22h | 18–44 | pow(r,5) + cluster term | t≈0.45 → ~#091020 | tiered towers, antennas on tallest 15%, sparse windows |
| near | up to 0.15h | 30–80, larger gaps | pow(r,6) | t≈0.18 → ~#070d18 | window grids, roof clutter, 1 optional monorail line |

All heights snapped to the window-grid pitch (mid: 3×4 px cells, near: 4×5). Seeded PRNG (mulberry32-style), seed stored; resize/DPR regenerates identical city. Haze: sky-color gradient alpha 0.15→0 over far+mid. Parallax: bands are static (camera fixed) — depth comes from color, not motion; optional ±2px pointer-parallax max.

**Windows (mid+near only):** per building `litRatio = 0.04 + r*0.14`; lit cells in horizontal runs of 1–4; colors: streak-blue rgb(168,196,224) at alpha {0.20, 0.35, 0.5}; ≤15% slightly-warm variant only if the one-accent rule survives review. Static lit cells baked into the offscreen layer; keep a list of ~20 "mutable" window rects per band drawn live: one toggle per 2–6 s scene-wide, 1 s fade. Antenna beacons: 2–4 total, cyan accent rgb(103,224,255), sine pulse alpha 0.15→0.5, period 3–5 s, phase-offset.

**Cars:** max 3 concurrent; spawn every 6–14 s (20% skip). Two lanes: high lane y≈0.42h (dimmer, 1.5px, 18–30 px/s), low lane y≈0.55h skimming mid rooftops (2–2.5px, 30–55 px/s). Per-lane fixed direction, lanes opposed; per-car speed randomized; vertical sine drift ±2px / 5s. Color: streak-blue dot; heading-away cars 20% dimmer (nod to red-vs-white without adding red). Trail: gradient line tail→head, length = speed × 0.35 s, tail alpha 0 → head 0.4; no shadowBlur (draw a 2nd larger dot at alpha 0.15 for glow, matching the existing glow system). Cars draw AFTER city layers, BEFORE rain layers.

**Frame order:** sky gradient → far drawImage → mid drawImage → haze gradient → near drawImage → dynamic overlays (beacons, mutable windows, cars) → existing rain layers → water surface (+ glint streaks under brightest lights).

**Budget estimate:** 3 drawImage + ~30 small fillRects/strokes per frame added — comfortably inside the existing fixed-timestep loop.

## Limitations / [insufficient evidence]

- No source quantifies "how many moving lights before a scene stops feeling calm" — the 3-car cap is design judgment calibrated against BR2049's remove-motion evidence. [speculation — flagged]
- CodePen and Shadertoy both 403 WebFetch: njmcode's cityscape and The Drive Home could not be source-read; their techniques are inferred from descriptions. [reported, unverified]
- No fetched source on DPR handling for pre-rendered layers specifically; plan extrapolates MDN/web.dev + our engine's existing DPR cap.
- Window flicker cadence and glint-streak reflection are unsourced designs (nulls documented); marked speculative.
- web.dev perf article is 2011; its jsperf measurements were not retrievable. Direction confirmed by current MDN; magnitudes unquantified.

## Sources consulted

Fetched (all 2026-08-27):
- https://gist.github.com/johnburnmurdoch/c709504355a39a38f8684e6a51c95c28 — canvas city generator code
- https://proceduralgraphics.blogspot.com/2010/01/city-skyline.html — seeded skyline, window turn-on times
- https://www.shamusyoung.com/twentysidedtale/?p=2954 — Pixel City windows (grid, noise, grouping)
- https://www.shamusyoung.com/twentysidedtale/?p=3059 — Pixel City fixes (per-building lit %, tiers, gaps)
- https://www.shamusyoung.com/twentysidedtale/?p=3080 — Pixel City traffic (light dots, straight lines)
- https://www.slynyrd.com/blog/2026/5/27/pixelblog-62-landscape-backgrounds — atmospheric perspective rules
- https://www.slynyrd.com/blog/2019/2/23/pixelblog-14-cityscapes — cityscape composition (qualitative)
- https://www.kirupa.com/canvas/creating_motion_trails.htm — stored-positions trail code
- https://www.foundry.com/insights/film-tv/iconic-look-blade-runner-2049 — haze/contrast coupling, restraint
- https://web.dev/articles/canvas-performance — pre-render, snug fit, layering
- https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas — current perf checklist
- https://github.com/svwilke/skyline + https://svwilke.github.io/skyline/ — thin (source not exposed to fetch)

Blocked (403): codepen.io/njmcode/pen/xRdJWa; shadertoy.com/view/MdfBRX; architectmagazine.com Replicant City.
Null searches: "cyberpunk city canvas parallax" (stock-photo noise, no code); "city skyline water reflection flipped drawImage" (only generic ripple-displacement demos, no skyline mirror example); no source found quantifying calm traffic density.

## Additional Leads (not chased — other lenses / later)

- rectangleworld.com/blog/archives/214 — trail-fading methods comparison (Q4 depth, optional)
- github.com/skeeto/pixelcity — full Pixel City C source (window texture gen readable)
- WCAG 2.3.1 three-flashes threshold (w3.org) — formal anchor for the anti-seizure claim
- Slynyrd Pixelblog 23 (Parallax Scrolling) — layer speed ratios if the city ever scrolls (underwater-descent lens may care)
- BigWings' YouTube "Shader Coding: The Drive Home" breakdown — bokeh-light construction, if we ever want soft bokeh lights
- Steam Workshop "Cyberpunk city | parallax animated" wallpaper — mood comparison only
