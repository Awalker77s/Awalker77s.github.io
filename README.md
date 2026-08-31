# portfolio

Alexander Walker's developer portfolio — a dark, rainy single page that submerges as you scroll. Everything atmospheric is hand-built: the rain, city, and water are a custom canvas engine (spring-column water surface, seeded skyline, parallax streaks), and the soundtrack is synthesized live in the Web Audio API — no animation libraries, no audio files.

## The descent

Scrolling is a dive. The camera submerges past the waterline in the first viewport, the scene darkens through a six-stop ramp toward a near-black abyss, DOM surfaces sink with a `--depth` token — and the music changes mood with you: a bright lofi bed (Cmaj9 → Fmaj9 → Am11 → Gadd9, pentatonic bell line) plays at the surface, and as you sink it muffles away (3000 → 300 Hz) while an open-fifth deep-water pad world crossfades in. Sound is on by default; the first qualifying gesture starts it (autoplay policy), and both music and rain toggles persist.

## Run

```bash
npm run dev
```

Port 3000. Content facts live in `src/lib/content.ts` only — copy edits happen there, never inline in JSX.

## Verify

The full launch/doctor/drive/evidence recipe is in `.trust/verify.md`, with per-feature expectations in `.trust/verify/features/`. Card screenshots regenerate via `node scripts/shoot.mjs` (live sites; local-app captures are documented in the feature notes).

## Layout

- `src/lib/rain/engine.ts` — canvas rain/city/water/descent engine
- `src/lib/rain/audio.ts` — two-bed depth-reactive WebAudio score + rain synth
- `src/lib/scroll.ts` — the single smooth-scroll stage (camera tracks scrollY directly)
- `src/lib/content.ts` — every fact on the page
- `src/components/Atmosphere.tsx` — canvas + toggles + default-on sound arming
