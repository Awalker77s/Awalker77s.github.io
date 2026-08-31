# Scroll-driven "descend underwater" background — research findings

Researched 2026-08-27 (web-research lens). Scope: scroll→canvas binding, underwater visuals for 2D canvas, depth color ramp, depth-adaptive text legibility, scrollytelling craft, fixed-canvas mobile gotchas. Out of scope (owned by other lenses): sound/underwater muffling, above-water city visuals.

## BLUF

- **Drive the canvas from `scrollY` cached by a plain `scroll` listener and consumed (smoothed) in the existing rAF loop.** CSS Scroll-Driven Animations / JS `ScrollTimeline` cannot ship as the primary path: Firefox stable still doesn't have it as of 2026-08-27 (scheduled ~157), and its compositor benefit doesn't apply to canvas drawing anyway. Note: `scroll` events can't be canceled, so `{passive:true}` is irrelevant there — the passive-listener win is for touch/wheel only.
- **Physics supports the planned palette exactly:** red light dies in the upper ~5–10 m, orange by ~40 m, yellow before 100 m; only blue survives to ~200 m; no light past 1000 m. Open water shifts teal → saturated deep blue → black. A 6-stop ramp from `#0e2233` to `#02050b` (below) is consistent with the site's navy tokens.
- **Pure darkening is a legibility *win*, verified numerically:** light text contrast **increases** from 14.2:1 to 17.9:1 across the ramp (WCAG AA needs 4.5:1 normal / 3:1 large). The only real risks are (a) additive god rays *behind* mid-tone text — a ray at α≈0.25 drops faint-text contrast to 3.23:1 (AA fail) — and (b) faint tokens/borders at the **lightest** background state, not the darkest. Keep text tokens static; no per-depth text adaptation needed.
- **Element set that reads professional:** 2–4 low-alpha god-ray wedges that fade out by ~200 m-equivalent depth, sparse marine-snow particles with 2-layer parallax, a bright Snell's-window-informed surface band seen from below, rare cyan bioluminescent glints in the abyss. No fish, no dense bubbles, nothing faster than ~20 px/s.
- **Mobile: the URL bar makes vh-family units churn during scroll.** Keep the canvas `fixed inset-0`, resize the buffer only when the element's size actually changed (debounced), never read `dvh`-dependent layout per frame, and paint `html` background to match the scene edge for overscroll.

---

## Q1 — Scroll→canvas binding

### Browser support for Scroll-Driven Animations (as of 2026-08-27)

- caniuse (`mdn-css_properties_animation-timeline`, fetched 2026-08-27): Chrome "115 - 150: Supported", Edge "115+", Safari "26.0 - 26.5: Supported", iOS Safari "26.0+", Samsung Internet "23+", global "85.43%" — and **"Firefox: 157: Supported"**. <https://caniuse.com/mdn-css_properties_animation-timeline>
- **Contradiction found and resolved, not averaged:** Firefox 157 does not exist yet. As of 2026-08-27 Firefox stable is ~154 (next release 155 on 2026-09-01 under the new two-week cadence, per Mozilla's support blog, 2026-08-19), and MDN's Firefox 152 release-note era still shows scroll-driven animations "behind the `layout.css.scroll-driven-animations.enabled` flag in stable, on by default in Nightly" (search-level snippets, 2026-08-27). The Chrome developers article likewise lists support as "Chrome 115+, Edge 115+, Firefox Technology Preview, Safari 26+". **Reading: caniuse's "157" is a scheduled future release (~Oct 2026), not shipped support.** [confirmed — 3] that Firefox stable lacks default support today; [reported, unverified] that 157 is the exact ship version.
- Safari 26+ means iOS 26+ only — mid-2026 iOS fleets still contain many pre-26 devices. So a JS fallback is mandatory regardless.

### Can ScrollTimeline drive canvas JS?

- MDN (fetched 2026-08-27): ScrollTimeline "represents a scroll progress timeline", constructed with `{source, axis}`, and is used by passing it "to the `Animation()` constructor or the `animate()` method" — i.e. it is consumed by Web Animations API animations of DOM properties. Marked "Limited availability — not Baseline". <https://developer.mozilla.org/en-US/docs/Web/API/ScrollTimeline> [confirmed — 2 with Chrome dev article]
- Chrome developers (fetched 2026-08-27): the entire performance pitch is compositor offload — "you can now have silky smooth animations, driven by scroll, running off the main thread", vs. "Main thread animations are subject to jank" and "Modern browsers perform scrolling on a separate process and therefore deliver scroll events asynchronously". The article "focuses exclusively on DOM element animations" — no canvas story. <https://developer.chrome.com/docs/css-ui/scroll-driven-animations> [single-source]
- **Analysis (flagged as ours):** canvas 2D drawing is main-thread JS by definition, so the compositor benefit cannot transfer. You *could* poll `timeline.currentTime` (inherited from `AnimationTimeline`) inside rAF, but that is strictly equivalent to reading cached `scrollY` — with worse browser support. ScrollTimeline is therefore CSS/WAAPI-only *in practice* for this use case. Use `@supports (animation-timeline: scroll())` only for optional pure-CSS garnish (e.g. a depth meter bar).

### What production scrollytelling does

- The Pudding's engineering post on scrollytelling (fetched 2026-08-27) is built around the fixed-graphic pattern — "We want the chart to stay fixed while the text moves and have it snap back into place" — and for hand-rolled versions recommends rAF: "You will want to consider performance optimizations like throttling and such." <https://pudding.cool/process/how-to-implement-scrollytelling/> [single-source]
- scrollama (The Pudding's own library) README (fetched 2026-08-27): "Scrollama is a modern & lightweight JavaScript library for scrollytelling using IntersectionObserver in favor of scroll events. … Scrollama is focused on performance by using IntersectionObserver to handle element position detection", and since 2.0 uses CSS `position: sticky` for fixed graphics. <https://github.com/russellsamora/scrollama> [single-source]
- **Pattern [confirmed — 2]:** discrete step *triggers* → IntersectionObserver; continuous *binding* (our case: camera depth) → scroll position consumed in rAF. Our fixed canvas + normally-scrolling content is exactly the sticky/fixed-graphic scroller pattern.

### Jank pitfalls

- **Passive listeners are a touch/wheel concern, not a `scroll` one.** Chrome (fetched 2026-08-27): "browsers can't know if a touch event listener is going to cancel the scroll, so they always wait for the listener to finish before scrolling the page" — but "The basic `scroll` event cannot be canceled, so it does not need to be set passive." <https://developer.chrome.com/blog/passive-event-listeners> [single-source] So: a `scroll` listener that only caches a number is already non-blocking; add `{passive:true}` to any touch/wheel listeners if ever added.
- **Layout thrash:** don't read `scrollHeight`/`getBoundingClientRect` per scroll event or per frame; compute the scroll range (`scrollHeight - innerHeight`) once and on (debounced) resize. [speculation — flagged: standard practice, no fetched source binds this sentence]
- **Scroll events arrive asynchronously from the scroll itself** (Chrome dev quote above), so raw scrollY steps are discrete and can lag momentum scrolling — smooth the consumed value in the fixed-timestep loop (exponential approach) instead of using it raw. iOS momentum-scroll event timing specifics: [insufficient evidence — not directly sourced this session; smoothing makes it moot].

## Q2 — Underwater light color science

### What the physics sources say

- Webb, *Introduction to Oceanography* §6.5 Light (LibreTexts mirror, fetched 2026-08-27 — original rwu.pressbooks.pub returned 403):
  - "red is absorbed in the upper 10 m, orange by about 40 m, and yellow disappears before 100 m", with "blue and green light reaching the deepest depths".
  - Energy: "At 1 m depth, only 45% of the solar energy that falls on the ocean surface remains"; "At 10 m depth only 16% of the light is still present"; "only 1% of the original light is left at 100 m"; "No light penetrates beyond 1000 m."
  - Zones: photic/euphotic 0–200 m ("enough light … to support photosynthesis"); dysphotic 200–1000 m ("still some light … but not enough"); aphotic >1000 m ("no light penetrates").
  - Color: "Blue light penetrates deeply and is scattered by the water molecules, while all other colors are absorbed; thus the water appears blue."
  <https://geo.libretexts.org/Bookshelves/Oceanography/Introduction_to_Oceanography_(Webb)/06%3A_Physical_Oceanography/6.05%3A_Light>
- NOAA Ocean Exploration (fetched 2026-08-27): "Blue light penetrates best, green light is second, yellow light is third, followed by orange light and red light." "At 100 meters, red light does not penetrate and, at this depth, a red fish is difficult, if not impossible to see." Red animals read as black at depth. <https://oceanexplorer.noaa.gov/ocean-fact/red-color/>
- Absorption order red→orange→yellow→green→blue and the teal→blue→black progression: [confirmed — 3] (Webb textbook + NOAA + diving-industry sources). Diving sources put *perceptual* red loss much shallower — "almost entirely gone at a depth of just 5 meters (15 feet)", orange/yellow by 10–20 m (scubadiverlife.com, divevolkdiving.com et al., search snippets 2026-08-27) [reported, unverified]. Not a contradiction: attenuation is exponential — red is *mostly* gone by 5–10 m and *entirely* gone well before 100 m. The exact per-color cutoff depths vary by source and water clarity; treat them as bands, not lines.
- Specific 45%/16%/1%/0% energy figures and zone boundaries: [single-source] (Webb; NOAA's "Light and Color in the Deep Sea" fact-sheet PDF is an unfetched corroborating lead).

### Derived 6-stop depth ramp (recommendation, derived from the above + site palette)

Rules encoded: G > R always; B > G always (blue dominates); R decays fastest, G next, B slowest; slight teal (green) cast only in the top two stops; bottom approaches — but never reaches — pure black, staying blue-biased (aphotic = lightless, but #000 flattens against the page and kills the canvas's depth cue).

| depth01 | ~real depth | zone | hex | RGB | note |
|---|---|---|---|---|---|
| 0.00 | 0–5 m | photic, just under surface | `#0e2233` | 14/34/51 | teal-tinged; warmest stop; ties to existing water `#0c1a2b` |
| 0.15 | ~10 m | red gone | `#0b1d30` | 11/29/48 | green fading |
| 0.35 | ~40–50 m | orange gone | `#081627` | 8/22/39 | blue-dominant navy |
| 0.55 | ~200 m | photic → dysphotic edge | `#060f1e` | 6/15/30 | "last light" milestone |
| 0.75 | ~600 m | dysphotic / midnight | `#040914` | 4/9/20 | near-black navy |
| 1.00 | ≥1000 m | aphotic abyss | `#02050b` | 2/5/11 | lightless; matches site floor `#050a12` family |

Interpolate in a perceptual-ish way (per-channel lerp between adjacent stops is fine at these low values). The existing sky `#060b14` and water `#0c1a2b → #050a12` bracket this ramp naturally.

## Q3 — Underwater scene elements in 2D canvas

Source availability was the weak spot: CodePen blocks fetching (both attempts 403), so parameter values below are engineering defaults, marked as such.

- **Caustic shimmer (the one fetched real implementation):** Ariya Hidayat's canvas underwater effect (post fetched 2026-08-27) does per-pixel periodic displacement — "it's a matter of shifting the pixels horizontally and vertically in a periodic manner": `xs = amplitude * Math.sin(2π(3y/height + T)); ys = amplitude * Math.cos(2π(3x/width + T))`, sampling source pixels at the offset. <https://ariya.io/2012/03/underwater-effect-with-html5-canvas> [single-source] **Caution (analysis):** per-pixel `ImageData` work at fullscreen × DPR 2 is exactly what the engine's budget can't afford; use it only as the *reference look*, and fake shimmer with 2–3 slow-moving low-alpha brightness bands clipped to the near-surface region instead.
- **Snell's window (seen-from-below surface):** "an underwater viewer sees everything above the surface through a cone of light of width of about 96 degrees"; it compresses "a 180° angle of view above water to a 97° angle of view below water"; "The area outside Snell's window will either be completely dark or show a reflection of underwater objects by total internal reflection." (Wikipedia, fetched 2026-08-27) <https://en.wikipedia.org/wiki/Snell%27s_window> [single-source] **Translation to a side-view 2D scene (analysis):** just after submerging, render the surface as a bright wavy ceiling band (the window) that dims and cools with depth, with the water flanking it darker than the sky above was — do not keep the sky visible at full brightness through the surface.
- **God rays / light shafts:** volumetric-light wedges are the standard trick; in 2D canvas the practical form is 2–4 rotated trapezoids filled with a vertical linear gradient (white-cyan → transparent), composited with `globalCompositeOperation: 'lighter'` or `'screen'`. The 'lighter'-composite + ~300-particle recipe appears in the blocked CodePen "Underwater Site Background" (search snippet only) [reported, unverified]. Recommended defaults [speculation — flagged]: 3 wedges, top-anchored, width 10–20% of viewport, peak alpha 0.04–0.08, sway ±2–3° with 20–40 s periods, alpha × (1 − depth01/0.55) so they die exactly at the "last light" stop — physically consistent with the photic zone ending at 200 m [physics part confirmed above].
- **Marine snow / drifting particles:** 40–80 particles, 1–2.5 px, sink 5–15 px/s with ±5 px sideways sine drift, alpha 0.10–0.35, two parallax layers (reuse the rain engine's layer machinery); pale blue-white, slightly denser and slower with depth. [speculation — flagged: parameter defaults ours; marine snow as the dominant deep-water visual is standard oceanography]
- **Bubbles:** sparse and shallow only — 0–2 concurrent, rising 30–60 px/s with sine wobble, only within the first ~0.2 of depth (bubbles at 800 m read as aquarium glass). [speculation — flagged]
- **Abyss life:** rare single-pixel cyan glints (the site's `rgb(103,224,255)` accent) with slow fade in/out below depth 0.75 — bioluminescence is the only light source in the aphotic zone, which NOAA's red-animals-look-black material supports indirectly [analysis].
- **Calm/professional vs. screensaver (analysis, consistent with The Deep Sea's restraint in Q5):** professional = few elements, slow (<20 px/s), low alpha, monochromatic-with-one-accent, and *subtractive with depth* (the deeper you go, the less happens). Screensaver tells: fish/creature clipart, dense bubble streams, fast caustic tiling, saturated teal light everywhere.

## Q4 — Depth-adaptive text legibility

### The requirements, precisely (WCAG 2.2)

- 1.4.3 Contrast (Minimum), AA: "The visual presentation of text and images of text has a contrast ratio of at least 4.5:1", with the large-text exception "Large-scale text … have a contrast ratio of at least 3:1"; large scale = "at least 18 point or 14 point bold" (≈24 px / ≈18.67 px bold per WebAIM). 1.4.6 (AAA): 7:1, large 4.5:1. 1.4.11 Non-text Contrast (AA): "contrast ratio of at least 3:1 against adjacent color(s): User Interface Components [and] Graphical Objects". Ratio formula "(L1 + 0.05) / (L2 + 0.05)", range 1:1–21:1. (W3C WCAG 2.2 TR + WebAIM, both fetched 2026-08-27) <https://www.w3.org/TR/WCAG22/> <https://webaim.org/articles/contrast/> [confirmed — 2]

### Is pure darkening a problem? No — verified against the math

With light text fixed, background luminance L2 only decreases as the scene darkens, so (L1+0.05)/(L2+0.05) only increases. Computed this session (WCAG formula, standard sRGB linearization) with a representative light text `#e8f1f8`, a mid "faint" token `#8fa3b8`, and the accent `#67e0ff`:

| background | light text | faint `#8fa3b8` | accent `#67e0ff` |
|---|---|---|---|
| `#0e2233` (lightest underwater stop) | **14.18:1** | 6.25:1 | 10.56:1 |
| `#02050b` (abyss) | **17.85:1** | 7.87:1 | 13.30:1 |
| sky `#060b14` (page top, for reference) | — | 7.60:1 | — |

Every cell clears AA (4.5:1) with room; darkening monotonically improves all of them. **The binding constraint is the *lightest* background a token ever sits on, not the darkest** — here the lightest underwater stop (6.25:1 for faint text) is worse than the abyss (7.87:1).

### Where the real risk is (also computed)

Additive light elements behind text, not darkness. A god-ray wedge (`#b4dcff`) over the lightest stop:

| ray alpha | effective bg | light text | faint text |
|---|---|---|---|
| 0.10 | `#1f3547` | 11.08:1 | **4.88:1** (AA pass, thin margin) |
| 0.25 | `#385066` | 7.33:1 | **3.23:1 — AA FAIL** for normal text |

So: cap cumulative ray/caustic alpha at ≈0.10 wherever faint-token text can overlap, or (simpler) keep rays in the outer gutters, off the content column. Same logic covers caustic bands.

### Token strategy

- **Recommended: keep all text/border tokens static and skip per-depth text adaptation entirely.** It is provably unnecessary (table above), it keeps the AA audit a single-state check (the already-validated top-of-page state plus one check at the lightest underwater stop), and it avoids Tailwind v4 complications.
- If depth-tinting chrome is wanted anyway: have the rAF loop write one custom property — `document.documentElement.style.setProperty('--depth', d)` once per frame (cheap, one style write) — and consume it in plain CSS via `color-mix(in oklab, var(--panel), black calc(var(--depth) * 20%))` behind `@supports (color: color-mix(in oklab, red, blue))`. Note for Tailwind v4 `@theme inline`: keep the dynamic var *outside* `@theme` (a `:root` rule) and reference it from the theme token, since `@theme inline` inlines values at build time. [speculation — flagged: Tailwind detail from stack knowledge, not fetched this session]
- Panels: current opaque/near-opaque panel tokens already sidestep the whole problem — an opaque panel's text contrast never changes with canvas depth. Semi-transparent panels only get *darker* backing as depth grows (helps), but their 1.4.11 3:1 border/chip contrast must be checked at the page-top (lightest) state.

## Q5 — Scrollytelling craft

- **The Deep Sea (neal.fun, 2019):** direct fetch 403'd, web.archive.org is blocked for this tool, and the Creative Bloq article fetch returned only chrome — path blocked twice, moved on per protocol. From secondary/search-level material (Fandom wiki, Laughing Squid, Make Play Go snippets, 2026-08-27): a single very tall page mapping scroll to a real depth scale over "over ten thousand meters", animals placed at their true depths, "stories and facts" interspersed, minimalist single-purpose UI, with the darkening water itself as the only scenography. [reported, unverified — no primary/technical writeup found; see nulls]
- **Craft takeaways (analysis, grounded in the above + The Pudding's fixed-graphic pattern):** (1) a persistent depth readout turns raw scrolling into narrative progress; (2) emptiness is pacing — long quiet stretches make milestones land; (3) milestones should be *true* (last-light at 200 m, midnight zone at 1000 m) — our site can pin section boundaries to them (hero above water; work in the photic zone; experience/skills through twilight; about/contact in the abyss); (4) native scroll speed is never hijacked.
- **Accessibility for scroll-linked motion:** WCAG 2.3.3 Animation from Interactions (AAA): "Motion animation triggered by interaction can be disabled, unless the animation is essential to the functionality or the information being conveyed" (W3C TR, fetched 2026-08-27) [single-source — spec text verbatim]. Guidance pages name parallax-on-scroll as the canonical example of what this covers (Pope Tech / CSS-Tricks / Deque, search snippets) [reported, unverified]. WCAG 2.2.2 Pause, Stop, Hide (A) additionally requires a pause mechanism for auto-playing motion >5 s — the site's existing rain/motion toggle already satisfies the mechanism; it must keep working underwater.
- **prefers-reduced-motion plan:** under PRM, keep the *depth color ramp* responding to scroll (it's a slow, user-controlled color change, not vestibular-trigger motion) but render via the existing `renderStaticFrame()` path: no particle drift, no ray sway, no shimmer, no parallax velocities — regenerate the static frame when depth01 changes by more than ~0.02. [analysis; PRM-for-scroll-effects norm corroborated by the guidance snippets above]

## Q6 — Fixed-canvas mobile gotchas

- **The unit model (web.dev, fetched 2026-08-27):** large viewport = "assuming any UA interfaces that are dynamically expanded and retracted to be retracted"; small = "…to be expanded"; dynamic flips between them as toolbars show/hide. Classic `100vh` content "will bleed out of the viewport" when toolbars are expanded. Critical caveats: "The values for the dynamic viewport do not update at 60fps … updating is throttled as the UA UI expands or retracts" (so `dvh`-bound layout visibly lags/janks during the URL-bar transition), and "The on-screen keyboard … is not considered part of the UA UI. Therefore it does not affect the size of the viewport units." <https://web.dev/blog/viewport-units> [single-source for the quotes; the unit semantics are spec-level]
- **vh churn during scroll is a real production complaint:** scrollama README: "Avoid using `viewport height` (vh) in your CSS because scrolling up and down constantly triggers vh to change, which will also trigger a window resize." <https://github.com/russellsamora/scrollama> [single-source] Together with web.dev: [confirmed — 2] that retractable browser UI makes viewport-height-derived values unstable while scrolling.
- **Remedies for our fixed canvas (analysis over the above):**
  1. Keep `position: fixed; inset: 0` on the canvas element (already validated clean at 375×812 per project notes). Optionally back it with `height: 100lvh` so the element already covers the *largest* viewport and the URL-bar retraction never exposes a gap.
  2. In JS, on `resize`: compare the canvas element's actual `clientWidth/Height` against the current buffer size and resize the drawing buffer **only when changed**, debounced (~150 ms) — URL-bar show/hide then costs at most one buffer realloc, and scroll-driven resize storms are absorbed.
  3. Never derive per-frame render math from `innerHeight` reads inside the scroll handler; cache viewport metrics in the same debounced resize path (this also covers the scroll-range denominator from Q1).
  4. Paint `html`/`body` background with scene-consistent colors (sky at top, abyss-navy as the base) so iOS rubber-band overscroll shows scene, not white.
  5. `VisualViewport` API is the escape hatch if pinch-zoom/keyboard tracking ever matters — not needed for a background canvas. [reported, unverified — MDN page not fetched this session]

---

## Recommended implementation spec (for this stack)

**Scroll binding.** Plain `window.addEventListener('scroll', onScroll)` (passive flag optional — `scroll` is uncancelable) that only writes `targetDepth = clamp01(scrollY / scrollRange)`; `scrollRange = scrollHeight - innerHeight` cached in the debounced resize handler. The fixed-timestep loop smooths `depth += (targetDepth - depth) * (1 - Math.exp(-dt * 8))` and renders from `depth`. Keep rendering paused-on-hidden as today; also idle the loop to a low-power state when `depth` has converged and no rain/particles are active. CSS Scroll-Driven Animations only as `@supports`-gated garnish for DOM extras; do not build on `ScrollTimeline` (Firefox stable gap + no canvas benefit).

**Camera/surface mapping.** Surface line rises past the viewport top early (first ~1 viewport of scroll); thereafter `depth01` eases 0→1 over the remaining ~4–5 viewports. Rain alpha × (1 − submergedFraction); rays and bubbles gated to `depth01 < ~0.55` and `< 0.2` respectively; marine snow from ~0.15; cyan glints ≥ 0.75.

**Depth→color ramp** (canvas background vertical gradient, top/bottom sampled from the ramp at `depth01` and `depth01 + small offset`):
`#0e2233` (0.00) → `#0b1d30` (0.15) → `#081627` (0.35) → `#060f1e` (0.55) → `#040914` (0.75) → `#02050b` (1.00).

**Elements + params.** God rays: 3 top-anchored gradient trapezoids, width 10–20% vw, peak α 0.04–0.08, `'lighter'` composite, ±2–3° sway over 20–40 s, α scaled by (1 − depth01/0.55), kept out of the central content column. Marine snow: 40–80 particles, 1–2.5 px, sink 5–15 px/s, sine drift, α 0.10–0.35, 2 parallax layers. Bubbles: ≤2 concurrent, shallow band only. Surface-from-below: bright wavy ceiling band (Snell's-window cue) dimming with depth. Shimmer: 2–3 slow brightness bands near the surface — no per-pixel displacement.

**Text tokens.** Static. Audit once at page-top state and once at `#0e2233`; both already pass with the current-style palette (measured 14.2:1 light text, 6.25:1 faint-tier, 10.6:1 accent at the worst stop). Guardrail: cumulative additive-light alpha ≤ 0.10 under any text; panels keep their opaque tokens. Optional `--depth` custom property (one `setProperty` per frame) + `color-mix()` behind `@supports` for subtle chrome tinting — not required for AA.

**Mobile.** `fixed inset-0` canvas (+ optional `100lvh`), debounced size-compare buffer resize, no per-frame viewport reads, `html` background matched to scene ends for overscroll, DPR cap 2 unchanged.

**Reduced motion.** Extend `renderStaticFrame(depth01)`: full color ramp + static surface band + static sparse snow, zero velocities/sway; re-render on depth deltas > 0.02. Existing motion toggle remains the WCAG 2.2.2/2.3.3 disable mechanism and must also stop underwater ambience.

## Limitations / [insufficient evidence]

- No first-party technical writeup of The Deep Sea exists that this session could find; its implementation details remain [reported, unverified].
- No production-grade 2D-canvas underwater source could be fetched (CodePen 403 ×2); all element parameter values are engineering defaults [speculation — flagged], to be tuned visually.
- iOS momentum-scroll event-delivery timing was not directly sourced; the smoothing recommendation makes the render robust to it either way.
- Firefox's exact ship version/date for scroll-driven animations is scheduled-not-shipped information; re-check caniuse at implementation time.
- Contrast numbers used a representative light-text hex (`#e8f1f8`) and faint hex (`#8fa3b8`) since exact site token values weren't in scope; re-run the check with the real tokens (the margins are wide).

## Sources consulted

**Fetched (all 2026-08-27):**
1. caniuse — animation-timeline support table — <https://caniuse.com/mdn-css_properties_animation-timeline>
2. MDN — ScrollTimeline — <https://developer.mozilla.org/en-US/docs/Web/API/ScrollTimeline>
3. Chrome for Developers — Scroll-driven animations — <https://developer.chrome.com/docs/css-ui/scroll-driven-animations>
4. Chrome for Developers — Passive event listeners — <https://developer.chrome.com/blog/passive-event-listeners>
5. Webb, Introduction to Oceanography §6.5 Light (LibreTexts) — <https://geo.libretexts.org/Bookshelves/Oceanography/Introduction_to_Oceanography_(Webb)/06%3A_Physical_Oceanography/6.05%3A_Light>
6. NOAA Ocean Exploration — Why are so many deep-sea animals red? — <https://oceanexplorer.noaa.gov/ocean-fact/red-color/>
7. W3C — WCAG 2.2 Recommendation — <https://www.w3.org/TR/WCAG22/>
8. WebAIM — Contrast and Color Accessibility — <https://webaim.org/articles/contrast/>
9. web.dev — The large, small, and dynamic viewport units — <https://web.dev/blog/viewport-units>
10. The Pudding — How to implement scrollytelling — <https://pudding.cool/process/how-to-implement-scrollytelling/>
11. scrollama README — <https://github.com/russellsamora/scrollama>
12. Ariya Hidayat — Underwater effect with HTML5 canvas (2012) — <https://ariya.io/2012/03/underwater-effect-with-html5-canvas>
13. Wikipedia — Snell's window — <https://en.wikipedia.org/wiki/Snell%27s_window>

**Nulls / blocked:**
- `rwu.pressbooks.pub` Webb chapter — HTTP 403 (recovered via LibreTexts mirror).
- `neal.fun/deep-sea/` — HTTP 403; `web.archive.org` copy — tool-blocked; Creative Bloq article — fetched but content truncated to site chrome. Path abandoned after two blocks.
- `codepen.io/Lavrus/pen/AYaQjM` (Underwater Site Background) — HTTP 403.
- Search for a first-party "how I built The Deep Sea" technical writeup — none found.
- Search for "Firefox 157 release notes" — none exist (157 unreleased as of 2026-08-27); this null is itself the evidence that resolved the caniuse contradiction.

## Additional leads (not chased)

- Cross-boundary (SOUND lens): underwater audio muffling typically modeled as a low-pass filter sweep tied to the same `depth01`; WebAudio `BiquadFilterNode` on the existing rain synth bus.
- Cross-boundary (CITY lens): the Snell's-window ceiling band is the natural hand-off point — city silhouette could remain faintly visible *through* the window for the first ~0.1 of depth.
- NOAA "Light and Color in the Deep Sea" fact sheet (PDF) — corroborating depth/color figures: <https://oceanexplorer.noaa.gov/wp-content/uploads/2025/04/light-and-color-fact-sheet.pdf>
- Ahmad Shadeed, "New Viewport Units" — deeper svh/lvh/dvh treatment: <https://ishadeed.com/article/new-viewport-units/>
- Josh Comeau, "Scroll-Driven Animations" — practitioner take on SDA ergonomics: <https://www.joshwcomeau.com/animation/scroll-driven-animations/>
- Smashing Magazine, "An Introduction to CSS Scroll-Driven Animations" (2024-12): <https://www.smashingmagazine.com/2024/12/introduction-css-scroll-driven-animations/>
- CSS-Tricks, "Accessible Web Animation: The WCAG on Animation Explained" — maps 2.2.2/2.3.3 to scroll effects: <https://css-tricks.com/accessible-web-animation-the-wcag-on-animation-explained/>
- Cyanilux, "Sun Beams / God Rays Shader Breakdown" — 3D reference for ray falloff shaping: <https://www.cyanilux.com/tutorials/god-rays-shader-breakdown/>
- Firefox scroll-linked effects performance doc: <https://firefox-source-docs.mozilla.org/performance/scroll-linked_effects.html>
