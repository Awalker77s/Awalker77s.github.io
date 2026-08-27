# Source: bruno-simon.com

- URL: https://bruno-simon.com/
- Fetch date: 2026-08-27
- Fetched via: WebFetch (HTML→markdown conversion, summarized by small model)

## Verbatim/near-verbatim fragments returned by fetch

> "My name is **Bruno Simon**, and I'm a **creative developer** (mostly for the web)."

> "This is my portfolio. Please drive around to learn more about me and discover the many secrets of this world."

## Technical stack (as surfaced by fetch)

Three.js, WebGPU (optional renderer), WebGL, Rapier (physics), Howler.js (audio), TSL (Three.js Shading Language). Fonts: **Amatic SC** and **Nunito** (Google Fonts). Source available on GitHub, **MIT license** (per fetch summary — should be spot-checked if reused, but MIT is a low-risk permissive license if confirmed).

## Readability-over-animation techniques (for this fully-animated 3D scene)

- UI elements (maps, controls, achievement badges) are described as **overlaying** the animated 3D scene rather than being embedded inside it — i.e., a fixed HUD layer on top of the canvas.
- **Audio toggle** is a first-class, visible control (relevant to the sound-toggle question).
- Quality/perf settings exposed to the user (graceful degradation control), plus gamepad/keyboard/mobile input support.

## Notes for design brief

- This is the most animation-heavy, least "professional/corporate" reference in the set — playful car-driving 3D world, novelty typeface (Amatic SC is a handwritten-style display face). Good example of "borrow the layer-over-canvas HUD pattern for readability," **bad** example to imitate wholesale for a professional AI-automation-engineer portfolio — tonally it reads as personal-brand/game-dev, not "clean, professional, readable."
- Confirms audio-toggle-as-standard-affordance on a heavily-animated personal site (Howler.js + visible toggle), directly relevant to the sound-toggle UX question.
