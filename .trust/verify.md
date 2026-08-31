# verify.md — portfolio

## Launch
- Dev: `npm run dev` in repo root (or launch.json config `portfolio`: `npm --prefix portfolio run dev` from `C:\Users\Awalk\Projects`). Port 3000.
- Ready when: terminal prints `✓ Ready` and `http://localhost:3000` answers 200.
- Teardown: stop the dev-server process you started (browser pane: `preview_stop` with its serverId). Never kill by name `node`.

## Doctor
Read-only, before first drive: GET `http://localhost:3000/` returns 200, page contains `<canvas>` and the fixed nav, and the browser console shows no errors. No external side-effect paths exist (no forms, no network mutations — mailto/GitHub links only), so no sandbox sink is needed.

## Drive
Playwright headless against `http://localhost:3000` (repo devDep — `createRequire("<repo>/package.json")` then `require("playwright")`; launch args `--disable-gpu --use-angle=swiftshader` so the canvas rasterizes). Browser pane works for interactive spot checks. Stable handles:
- Rain toggle: button `aria-label="Toggle rain animation"` (aria-pressed reflects state)
- Music toggle: button `aria-label="Toggle background music"` (aria-pressed reflects state)
- Sections: anchors `#work #experience #skills #about #contact`; nav links carry the same names.
- Audio evidence: the AudioContext and its nodes are closed over, so patch before first gesture (use `ctx.addInitScript` so the patch survives reloads):
  `const R = window.AudioContext; window.__ac = []; window.AudioContext = class extends R { constructor(...a){ super(...a); window.__ac.push(this); } }`
  `const cf = AudioContext.prototype.createBiquadFilter; window.__filters = []; AudioContext.prototype.createBiquadFilter = function(...a){ const f = cf.apply(this, a); window.__filters.push(f); return f; }`
  `const co = AudioContext.prototype.createOscillator; window.__oscs = []; AudioContext.prototype.createOscillator = function(...a){ const o = co.apply(this, a); window.__oscs.push(o); return o; }`
  then click the music toggle and read `window.__ac[0].state`; chord voicing via `window.__oscs` frequency values; muffle sweep via `window.__filters`. Five lowpasses exist (rain body ~1400 gust-swept, rumble 90, keys 1800, plus the muffle pair) — the muffle pair is the two reading ~3000 at surface; capture those two by index there and re-read the same indices at depth. Loudness: patch `AudioNode.prototype.connect` (init script) to tee any node connecting to `ctx.destination` into an AnalyserNode; sample `getFloatTimeDomainData` for ~4s after the 1.2s fade-in — surface RMS lands ≈ −11 dBFS ±1.5 (chord wobble), peak ≈ −1 dBFS held by the master limiter (RMS below ≈ −16 dBFS is the inaudible-at-normal-volume regression; a peak ≥ 0 means the limiter is gone). Spectrum reads: call `getFloatFrequencyData` every sampling tick, never once per stop — the analyser's 0.8 smoothing EMAs each call against the previous one, so a single read reports ~80% stale spectrum from wherever you measured last.
- Descent: `document.documentElement.style.scrollBehavior = "auto"` first (CSS smooth-scroll otherwise animates programmatic scrolls; the override dies on reload), then `window.scrollTo(0, y)`, wait ~0.8s, screenshot. Depth token: `getComputedStyle(document.documentElement).getPropertyValue("--depth")`.
- Smooth scroll: attach probe = dispatch a synthetic cancelable `WheelEvent` and read `defaultPrevented` (true when the smoother is attached; false under reduced motion). Real glides: `page.mouse.wheel(0, 120)` fires trusted cancelable wheels; record per-frame `window.scrollY` in a rAF loop and assert dense small steps, strictly monotonic (scroll.ts clamps dt ≥ 0, so any backward frame is a regression). Let the probe's own glide fully settle (~1.2s) before starting a trace. Anchor navigation stays native CSS smooth — test with the explicit `a[href="#work"]`; `a[href^="#"]` matches the nav logo `href="#"` and `querySelector("#")` throws. Scene coupling: in the same rAF trace also read `--depth` — in the hero region it must equal `0.4 · clamp01(scrollY / (0.9 · vh))` within the 0.003 emission step on the same frame. scroll.ts is the ONLY smoothing stage; the engine camera tracks scrollY directly, so any threshold-crossing lag between expected and actual `--depth` means a second ease crept back in (the water-lags-text bug).
- Persistence: localStorage keys `rain-motion` / `rain-sound`, values `"on"`/`"off"`; reload and re-check aria-pressed.
- Live-site screenshots for project cards: `node scripts/shoot.mjs` (writes `public/projects/*.png`, 1600×1000).

## Evidence
Screenshots with the page identity visible (nav name + section content); console message dump for cleanliness claims; `window.__ac[0].state` transitions (`running` → after toggle-off + 1s → `suspended`) for audio; localStorage value + post-reload aria-pressed for persistence. Rain motion: two screenshots ≥1s apart must differ in streak/ripple positions.

## Cleanup
`preview_stop` the server started for the run (evidence screenshots already captured in the transcript survive). Reset viewport emulation to desktop preset.

## Gotchas
- prefers-reduced-motion: emulate with a Playwright context `{ reducedMotion: "reduce" }` (pane tools can't; the rain toggle drives the same static-frame path interactively).
- Plain `page.screenshot()` captures the canvas fine (an earlier note here claimed CDP omits the accelerated layer — misdiagnosis; the real cause was an opaque body background covering the `-z-10` canvas). Because `html` carries a background for overscroll match, body backgrounds do not propagate to the root — body must stay transparent (base coat lives on the canvas element, see globals.css). A flat scene-less hero screenshot means that stacking regressed, not that capture failed. In-page `canvas.toDataURL("image/png")` still works to read the engine raster directly; its PNG encode is deterministic, so byte-equality doubles as a frozen-frame check.
- Synthetic pane clicks count as trusted user gestures in Chrome, so the autoplay gate does open for them.
- Injected patches (AudioContext/BiquadFilter wrappers, scrollBehavior override) die on any page reload — re-apply before the next gesture/scroll.
- Prefer `element.click()` via javascript_tool for the toggles: pane left_click can fire multiple event pairs, and the JS click still counts as a trusted gesture.
- rAF callback timestamps mark the frame's start and can PRECEDE a `performance.now()` captured in the input handler that scheduled the callback — a glide's first frame can compute negative dt (scroll.ts clamps dt to [0, 0.1] for exactly this). Test wheel glides from a non-zero resting y (e.g. after the probe glide settles near 120): at y=0 the browser clamps `scrollTo` below zero and a backward jerk hides. To name a mystery scroll writer, wrap `scrollTo`/`scrollBy`/`scrollTop` at document-start with stack capture and log per-frame `scrollHeight` (constant height rules out layout shift/anchoring).
- Main-context `goto`/`reload`: use `waitUntil: "domcontentloaded"` + `waitForSelector` — `networkidle` is flaky against the dev server's HMR socket.
