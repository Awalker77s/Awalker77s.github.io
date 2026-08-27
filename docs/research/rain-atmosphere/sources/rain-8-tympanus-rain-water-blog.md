# Source: Rain & Water Effect Experiments (Codrops/tympanus.net blog post)

- URL: https://tympanus.net/codrops/2015/11/04/rain-water-effect-experiments/
- Fetch date: 2026-08-27
- Publication date: November 4, 2015
- Author: Lucas Bebber
- License: none explicitly stated on the blog page itself (the linked code repo — rain-5 — carries the Codrops custom license: integrate/build-upon free, no as-is resale/redistribution)

## Verbatim quoted fragments
> "due to refraction, the raindrops appear to turn the image behind them upside down."
> "We'll use the color of the raindrop to get the coordinates of the texture we'll see through the drop." ... "data from the green channel to get the X position, and from the red channel to get the Y position."
> "drops that are close to each other get merged – and if it gets past a certain size, it falls down, leaving a small trail."

## Technique classification (important disconfirming evidence)
This CONFIRMS the codrops/RainEffect (rain-5) family is a **rain-on-glass refraction** technique — normal-map-style GLSL shaders reading a droplet's color channels as UV-offset coordinates into a background texture, plus droplet-merging/trail behavior. It is explicitly NOT a water-surface-with-propagating-ripples technique. Rendering uses WebGL vertex+fragment shaders, with separate rendering layers for large vs. small drops for performance.

## Confidence
[confirmed - 2 primary] (corroborates rain-5's README + independently describes the shader mechanism) that this entire technique family (codrops RainEffect, and by extension Shadertoy "Heartfelt"-style shaders — see rain-11) answers Falsifiable Question 2 with a clear NO: these are rain-ON-GLASS demos, not rain-striking-water-with-ripples demos. They are disqualified from the "water surface + propagating ripples" requirement, though they remain relevant prior art for a *different* possible mood (glass/window rain) not what this brief asks for.
