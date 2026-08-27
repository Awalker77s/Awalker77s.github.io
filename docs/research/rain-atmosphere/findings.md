# Rain-atmosphere portfolio — research findings

- **Date:** 2026-08-27
- **Tier:** deep (3 parallel lenses: A rain rendering, B rain audio, C dark portfolio design) — operator-approved via "Full go"
- **Evidence:** 36 source files in `sources/` (rain-1…12, audio-1…10, design-1…14) + `live-1` sweep. Synthesis grep-verification ran 2026-08-27: all 10 probe fragments hit their evidence files — **zero confidence downgrades**.

## BLUF

**Build the rain original, synthesize the sound, and steal only structure from the design references.** No existing OSS project combines falling rain + a waterline + propagating surface ripples under a license we can use — the good-looking candidates are rain-on-glass effects or license-poisoned — so the engine is custom canvas-2D built from published, well-documented physics (equations are not copyrightable; implementations are). Rain audio is procedurally synthesized in WebAudio (zero licensing surface, zero download weight, inherently seamless), muted by default and gesture-gated per Chrome autoplay policy. The visual language is a stepped near-black navy surface scale with one cyan "wet reflection" accent and a floor-fade scrim that doubles as the water transition — borrowing the *structure* of Brittany Chiang's v4 palette and Linear's neutrals discipline, never their literal values or layouts.

## Lens A — rain rendering

### A1. No usable off-the-shelf rain+ripple engine exists `[confirmed — exhaustive sweep, 12 sources]`

Every attractive candidate fails on effect-type or license:

- **codrops RainEffect** — rain-on-glass (WebGL refraction), not falling rain; codrops resources carry custom no-resale terms unsuited to a personal-brand site we may later template. [rain-5, rain-6]
- **rainyday.js** — rain-on-glass; GPL-2.0 (viral for a portfolio we may open-source under MIT). [rain-7]
- **Shadertoy "Heartfelt" (BigWIngs)** — the famous one; rain-on-glass; page 403'd during fetch; license reported CC BY-NC-SA by aggregators `[reported, unverified]`. Non-commercial term disqualifies regardless. [rain-11 — GAP file]
- **evanw/webgl-water** — stunning caustics demo but 3D WebGL pool sim, massive overkill; GitHub API returns `license: null` — treat as all-rights-reserved. [rain-9]
- **tsParticles "rain preset"** — **null result: does not exist** as a maintained preset despite blog claims. [rain-10]
- **shadcn.io rain component** — falling-rain particle canvas, referenced as *architecture* only (layering, spawn cadence), no code copied. [rain-8]

**Consequence:** write the engine ourselves in TypeScript. ~300 lines of canvas-2D beats any dependency here.

### A2. The 1D spring-column water surface is the right ripple model `[confirmed — 4 independent implementations agree: rain-1, rain-2, rain-3, rain-4]`

The canonical algorithm (tutsplus/Hoffman, prime31, and two independent write-ups) — O(n) per frame over n columns:

```
// per column i, per frame:
displacement = restHeight - height[i]
velocity[i] += TENSION * displacement - velocity[i] * DAMPENING
height[i]   += velocity[i]

// neighbor propagation, PASS_COUNT times per frame:
leftDelta[i]  = SPREAD * (height[i] - height[i-1])  → applied to velocity[i-1]
rightDelta[i] = SPREAD * (height[i] - height[i+1])  → applied to velocity[i+1]

// drop impact: add impactVelocity to the nearest 1–2 columns
```

Published parameter sets: tension **0.025**, dampening **0.025**, **8 passes** [rain-1]; tension 0.01, dampening 0.005, 6 passes [rain-4]; spread **0.2** in practice (documented range 0–0.5). Splash particles: gravity 0.3, count ≈ speed/8 when speed > 60, launch angle −150°…−30°, magnitude ∝ sqrt(speed); metaball rendering optional [rain-1].

**Stability warning (verbatim from rain-1):** spring constant too high → explicit-Euler instability. Keep tension ≤ 0.03 and clamp dt.

**Mobile scaling:** drop spring-column count (reference impl ships 20/40/100 quality tiers) rather than frame rate. [rain-1]

### A3. Falling-rain layer: parallax streaks, not sprites `[confirmed — 2 primary]`

Slanted line-segment streaks in 2–3 depth layers (far = short/slow/dim, near = long/fast/bright), constant wind angle shared with the streak slope, devicePixelRatio-aware canvas with DPR capped at 2, `visibilitychange` pause. [rain-8, rain-3]

## Lens B — rain audio

### B1. Synthesis-first: procedural WebAudio rain `[confirmed — 2 primary + working examples]`

White-noise `AudioBufferSourceNode` (looped) → bandpass `BiquadFilterNode` → `GainNode` → destination. Gusting: LFO `OscillatorNode` at ~0.1–0.3 Hz through a gain node modulating the filter frequency. Droplet sparkle: 10–20 ms highpass-filtered noise bursts at randomized intervals and gains. Zero licensing surface, zero network weight, seamless by construction. [audio-2, audio-3]

### B2. If a recorded layer is ever wanted, three verified-CC0 candidates `[confirmed — hosting-page license checked per file]`

- freesound **723703** (orb1t, 28 s WAV) [audio-6]
- freesound **518863** (idomusics, 54 s, "peaceful rain" — best tonal match) [audio-7]
- freesound **663947** (deadrobotmusic, 21.5 s, purpose-built seamless loop) [audio-8]

**Disqualified with cause:**
- freesound 212580 (qubodup) — aggregators list it CC0; the hosting page says **CC-BY 3.0** and the recording contains sirens. Aggregator license claims count zero. [audio-1]
- **All Pixabay audio** — proprietary "Content License", not CC0; redistribution "on a Standalone basis" is prohibited, which a public git repo containing the file arguably violates. [audio-4]

No files downloaded this session (operator gate on downloads stands); synthesis makes the question moot for v1.

### B3. Autoplay policy hard-gates sound `[confirmed — primary, developer.chrome.com]`

"Muted autoplay is always allowed" — but audible playback requires a user gesture. Implementation: start muted/off; on toggle click run `audioContext.resume()` **inside the gesture handler**, then ramp gain (~1 s) to target; persist preference in `localStorage`. Audio is opt-in by design anyway (consent-gated visible toggle — C4). [audio-5]

## Lens C — design language

### C1. Palette: stepped near-black navy + one cyan accent `[confirmed — primary CSS extracted]`

Structure borrowed from Brittany Chiang v4 (surfaces `#020c1b → #0a192f → #112240 → #233554`; text `#495670 → #8892b0 → #a8b2d1 → #ccd6f6 → #e6f1ff`; accent `#64ffda`) [design-12] and Linear's neutrals discipline (Nordic Gray `#222326` / Mercury White `#F4F5F8`) [design-13]. **Structure only** — our own hexes, shifted toward rain-slate blue, accent recolored to a cyan/electric-blue "wet reflection", plus a 10%-alpha tint utility. Never pure `#000`.

### C2. Legal/ethical fence on "inspiration" `[confirmed — 2 primary]`

p5aholic (a top atmospheric portfolio) states verbatim "Code reuse prohibited" [design-6]; the design community treats close portfolio clones as plagiarism even when code isn't copied [design-7]. Fence: take palette *principles*, type *pairings*, and layout *patterns* that are generic (fixed sidebar nav, numbered sections, floor fades) — never a specific site's composition.

### C3. Readability over animation `[confirmed — WCAG primary + practitioner consensus]`

- Bottom-anchored **floor-fade scrim** doubles as the water transition zone.
- Content panels get their own opaque/blurred surface; rain lives in the negative space.
- Contrast tested against the animation's **brightest frame**, 4.5:1 body / 3:1 large text.
- Type: Inter or Geist Sans + JetBrains Mono / Geist Mono (free; Chiang's actual Calibre is licensed) [design-9, design-12].
- Vercel restraint rule: one glow system; no competing gradients/glassmorphism stacking [design-14].

### C4. Motion & sound respect `[confirmed — primary]`

`prefers-reduced-motion: reduce` → **stop** the rain (static gradient + faint mist texture), not merely slow it, with an in-page override control. Audio strictly off by default with a visible toggle. [design-10, audio-5]

## Showcase roster (operator delegated the pick — decided here)

Live-state verified 2026-08-27 [live-1]; facts cross-checked against the vault (evidence-honest copy mandate from `brain/Projects/Resume.md` applies to every card):

| # | Project | Evidence for the card | Visual source |
|---|---------|----------------------|---------------|
| 1 | **Mivora** — mivoralearn.com | Live flagship product: gamified AI-skills platform, FSRS-6 spaced repetition, 55-lesson flagship track, server-verified certificates, $0-runtime architecture | Playwright screenshot of live site |
| 2 | **Drydock** (Automation) | Deepest engineering artifact, exactly on positioning: local-model automation with subscription escalation, zero API keys, 3,816-test green suite, browser + Windows UIA "hands", graded safety gate, hash-chained evidence ledger | Local repo assets / stylized card v1; live capture in a later session |
| 3 | **Echinoid ID** — echinoid-ui.vercel.app | Live AI product with a real domain expert (Bill Thompson's taxonomy); the honest eval harness IS the story — no accuracy % in copy | Playwright screenshot of live site |
| 4 | **PrivatePilot** — public repo (MIT) | ImpactForge hackathon, team of 3; honest framing: Alex owned the engine end-to-end; local-first on Ollama | Existing real screenshots in repo `docs/img` |
| 5 | **Mother Truckin' Pizza** — staging | Real client (Jacksonville food truck): public site + owner admin with inquiry workflow, Supabase/Resend pipeline | Playwright screenshot of a static route (menu/home — schedule list 503s by design until prod env vars) |
| + | **Sport IQ** (collab strip) | Collaborator on Mustapha324's repo — PRs #55 (board-aligned player props) + #56 (game brain/backtest/champion–challenger); attribution explicit | Text-only card |

**Excluded with cause:** Mythient (vault: don't use until laptop-wip branch reconciled) · Cipher (not deployed) · Echo (ships OpenAI key client-side) · v0-mockingbird (contact form silently discards inquiries) · trust-stack (private; public flip is Alex's call — one About-section sentence at most).

## Limitations & insufficient evidence

- **Heartfelt license** `[reported, unverified]` — page 403'd; moot (disqualified on NC term + wrong effect type).
- **webgl-water license** — GitHub API `license: null`; treated as all-rights-reserved. Moot (wrong tech).
- Freesound CC0 statuses were verified on hosting pages but files were **not** downloaded or audio-auditioned — tonal-match judgments are from descriptions/comments `[single-source each]`.
- Design-lens contrast ratios are the standard's requirements; our actual palette needs measuring once implemented (validation step).
- No canonical "rain portfolio" exists to benchmark against — the combination is an original synthesis; taste risk rests on our restraint rules.

## Sources consulted (including nulls)

- **Lens A (rain):** rain-1 tutsplus 2D splash/water (algorithm + params) · rain-2 prime31 spring water · rain-3 parallax rain writeup · rain-4 alternate spring params · rain-5/6 codrops RainEffect + terms · rain-7 rainyday.js GPL · rain-8 shadcn.io rain (architecture ref) · rain-9 evanw/webgl-water (license null) · rain-10 tsParticles rain preset — **null: does not exist** · rain-11 Shadertoy Heartfelt — **403 GAP file** · rain-12 misc survey.
- **Lens B (audio):** audio-1 qubodup license mismatch · audio-2/3 WebAudio synthesis technique · audio-4 Pixabay Content License · audio-5 Chrome autoplay policy · audio-6/7/8 verified CC0 freesound candidates · audio-9/10 survey/nulls.
- **Lens C (design):** design-1…5 dark-portfolio survey · design-6 p5aholic "Code reuse prohibited" · design-7 plagiarism norms · design-8 layout patterns · design-9 type pairings · design-10 reduced-motion practice · design-11 scrim/readability · design-12 Chiang v4 CSS variables · design-13 Linear neutrals · design-14 Vercel restraint.
- **live-1:** first-party sweep of the three deployed apps (all UP, copy captured).

## Preserve / Change / Avoid / Risk (consumed by the build)

- **Preserve:** spring-column constants near published values (tension 0.02–0.025, dampening 0.02–0.03, spread 0.2, 6–8 passes); muted-by-default audio; evidence-honest card copy; the three live apps as primary showcases.
- **Change (from references):** all literal hexes, layouts, and code — original implementation only; accent shifted cyan; Calibre → Inter/Geist.
- **Avoid:** GPL/NC/no-resale code (rainyday.js, codrops, Heartfelt); Pixabay audio; accuracy % on Echinoid; featuring Mythient/Echo/v0-mockingbird; pure-black backgrounds; lightning flashes; autoplaying sound; cloning any single portfolio's composition.
- **Risk:** explicit-Euler blowup if tension/dt unclamped (clamp both); canvas jank on low-end mobile (scale column count + DPR cap 2, pause when hidden); contrast failures against bright splash frames (test brightest frame); the schedule route 503 on the pizza staging site (screenshot static routes only).
