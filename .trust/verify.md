# verify.md — portfolio

## Launch
- Dev: `npm run dev` in repo root (or launch.json config `portfolio`: `npm --prefix portfolio run dev` from `C:\Users\Awalk\Projects`). Port 3000.
- Ready when: terminal prints `✓ Ready` and `http://localhost:3000` answers 200.
- Teardown: stop the dev-server process you started (browser pane: `preview_stop` with its serverId). Never kill by name `node`.

## Doctor
Read-only, before first drive: GET `http://localhost:3000/` returns 200, page contains `<canvas>` and the fixed nav, and the browser console shows no errors. No external side-effect paths exist (no forms, no network mutations — mailto/GitHub links only), so no sandbox sink is needed.

## Drive
Browser pane against `http://localhost:3000`. Stable handles:
- Rain toggle: button `aria-label="Toggle rain animation"` (aria-pressed reflects state)
- Sound toggle: button `aria-label="Toggle rain sound"` (aria-pressed reflects state)
- Sections: anchors `#work #experience #skills #about #contact`; nav links carry the same names.
- Audio evidence: the AudioContext is closed over, so patch before first gesture:
  `const R = window.AudioContext; window.__ac = []; window.AudioContext = class extends R { constructor(...a){ super(...a); window.__ac.push(this); } }`
  then click the sound toggle and read `window.__ac[0].state`.
- Persistence: localStorage keys `rain-motion` / `rain-sound`, values `"on"`/`"off"`; reload and re-check aria-pressed.
- Live-site screenshots for project cards: `node scripts/shoot.mjs` (writes `public/projects/*.png`, 1600×1000).

## Evidence
Screenshots with the page identity visible (nav name + section content); console message dump for cleanliness claims; `window.__ac[0].state` transitions (`running` → after toggle-off + 1s → `suspended`) for audio; localStorage value + post-reload aria-pressed for persistence. Rain motion: two screenshots ≥1s apart must differ in streak/ripple positions.

## Cleanup
`preview_stop` the server started for the run (evidence screenshots already captured in the transcript survive). Reset viewport emulation to desktop preset.

## Gotchas
- prefers-reduced-motion cannot be emulated from the pane tools; the equivalent code path (static frame) is driven via the rain toggle instead — report the media-query init path as unreachable, not verified.
- Synthetic pane clicks count as trusted user gestures in Chrome, so the autoplay gate does open for them.
