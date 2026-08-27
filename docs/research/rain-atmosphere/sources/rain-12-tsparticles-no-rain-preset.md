# Source: tsParticles official presets catalog — NEGATIVE FINDING

- URL: https://particles.js.org/demos/presets
- Fetch date: 2026-08-27
- Secondary URL attempted: https://github.com/tsparticles/presets/tree/main/presets/rain → HTTP 404 Not Found (path does not exist)

## Verbatim quoted fragment
> Full preset list: "ambient, big-circles, bubbles, confetti, confetti-cannon, confetti-explosions, confetti-falling, confetti-parade, party, fire, firefly, fireworks, fountain, hyperspace, links, matrix, meteors, seaAnemone, snow, squares, stars, triangles"
> "Does 'rain' appear? No, there is no 'rain' preset in this catalog."

## Verdict — corrects the orchestrator's candidate-lead list
The brief's context list named "tsParticles rain preset" as a candidate. This is **DISCONFIRMED**: there is no official `@tsparticles/preset-rain` package and no "rain" entry in the live presets catalog as of this fetch (2026-08-27). The closest analog is "snow" (falling-particle preset) or a manually-configured tsParticles instance (tsParticles is a general-purpose particle engine — a rain-like effect could be hand-configured via its `move`/`direction`/`opacity` options, but that is not a ready-made "rain preset" and was not found as such). Community blog posts/CodeSandboxes titled "tsParticles rain" likely refer to custom JSON configs, not an official preset — not chased further given budget, but flagged as a naming-confusion trap for future reference.

## Confidence
[confirmed - 1 primary, negative result] — the official catalog page was fetched directly and enumerated; "rain" is absent from the list.
