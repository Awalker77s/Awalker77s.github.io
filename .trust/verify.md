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
- Sound toggle: button `aria-label="Toggle rain sound"` (aria-pressed reflects state)
- Sections: anchors `#work #experience #skills #about #contact`; nav links carry the same names.
- Audio evidence: the AudioContext and its nodes are closed over, so patch before first gesture:
  `const R = window.AudioContext; window.__ac = []; window.AudioContext = class extends R { constructor(...a){ super(...a); window.__ac.push(this); } }`
  `const cf = AudioContext.prototype.createBiquadFilter; window.__filters = []; AudioContext.prototype.createBiquadFilter = function(...a){ const f = cf.apply(this, a); window.__filters.push(f); return f; }`
  then click the sound toggle and read `window.__ac[0].state`; muffle sweep via the lowpass frequencies in `window.__filters`.
- Descent: `document.documentElement.style.scrollBehavior = "auto"` first (CSS smooth-scroll otherwise animates programmatic scrolls; the override dies on reload), then `window.scrollTo(0, y)`, wait ~0.8s, screenshot. Depth token: `getComputedStyle(document.documentElement).getPropertyValue("--depth")`.
- Persistence: localStorage keys `rain-motion` / `rain-sound`, values `"on"`/`"off"`; reload and re-check aria-pressed.
- Live-site screenshots for project cards: `node scripts/shoot.mjs` (writes `public/projects/*.png`, 1600×1000).

## Evidence
Screenshots with the page identity visible (nav name + section content); console message dump for cleanliness claims; `window.__ac[0].state` transitions (`running` → after toggle-off + 1s → `suspended`) for audio; localStorage value + post-reload aria-pressed for persistence. Rain motion: two screenshots ≥1s apart must differ in streak/ripple positions.

## Cleanup
`preview_stop` the server started for the run (evidence screenshots already captured in the transcript survive). Reset viewport emulation to desktop preset.

## Gotchas
- prefers-reduced-motion: emulate with a Playwright context `{ reducedMotion: "reduce" }` (pane tools can't; the rain toggle drives the same static-frame path interactively).
- Headless CDP screenshots omit the accelerated canvas layer — even under swiftshader, where the engine provably paints. Capture the scene via in-page `canvas.toDataURL("image/png")` → decode base64 to a PNG file; DOM screenshots stay valid for text/layout evidence. PNG encode is deterministic, so byte-equality doubles as a frozen-frame check.
- Synthetic pane clicks count as trusted user gestures in Chrome, so the autoplay gate does open for them.
- Injected patches (AudioContext/BiquadFilter wrappers, scrollBehavior override) die on any page reload — re-apply before the next gesture/scroll.
- Prefer `element.click()` via javascript_tool for the toggles: pane left_click can fire multiple event pairs, and the JS click still counts as a trusted gesture.
