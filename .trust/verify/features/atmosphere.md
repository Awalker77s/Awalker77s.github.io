# atmosphere — rain engine + audio

Owner code: `src/components/Atmosphere.tsx`, `src/lib/rain/engine.ts`, `src/lib/rain/audio.ts`.

- **EP-RAIN** — canvas animates on load (default: motion on unless reduced-motion). Drive: load `/`, screenshot twice ≥1s apart; streaks/ripples must differ; water band (bottom ~14%) shows surface line + ripples when drops land.
- **EP-SOUND** — sound toggle (`aria-label="Toggle rain sound"`). Drive: patch AudioContext (see verify.md), click toggle → `window.__ac[0].state === "running"`, aria-pressed=true; click again → after ~1s state `suspended`, aria-pressed=false. Stored pref `rain-sound: "on"` arms a one-time pointerdown on next visit (gesture-gated — clicking anywhere starts audio).
- **EP-MOTION-PREF** — reduced-motion users get a static frame by default. Media-query init not emulatable from pane tools → drive the same code path via the rain toggle (`aria-label="Toggle rain animation"`): off → animation halts, static frame with water band remains (not a blank canvas).
- **EP-PERSIST** — toggles persist. Drive: set rain off, reload, aria-pressed stays false and canvas static; localStorage `rain-motion` = "off".

Gotchas: canvas is `fixed inset-0 -z-10` under a body background — a fully black screenshot means the negative-z stack broke. Engine pauses on `visibilitychange` (background tabs keep state, drop no backlog).
