# Source: GitHub — 747745124/Raindrop-Generator

- URL: https://github.com/747745124/Raindrop-Generator
- Fetched: 2026-08-27
- Publication date: not visible in fetch
- Fetch method: WebFetch (not a browser tool)

## Extracted content (paraphrased by fetch model — no long verbatim quotes were returned)

Technique (semi-physically-based, academically grounded):
- Rain drops modeled in two scenarios: impacts on hard surfaces vs. wet surfaces; each drop lasts ~10-20 ms.
- Wet-surface model has no analytical solution, so the author approximates the waveform with an `exp(-t)sin(t)` function.
- Layered synthesis: multiple simultaneous drop-generator tracks (high-frequency band + mid-frequency band) mixed with white noise and individual drop transients.
- Controllable parameters: gain, drop density, frequency coefficients, drop duration, noise levels, 12dB/octave high-pass and low-pass filters.

## License
Not determined — the fetch did not surface a LICENSE file or badge. Treat as **[gap — license unconfirmed]**; do not reuse code from this repo without checking its LICENSE file directly before citing it as "open license."

## Notes — relevance caveat
[single-source] This project is a **JUCE-based VST/AU desktop plugin, NOT a Web Audio API / browser implementation.** It is useful only as a conceptual/DSP reference (the two-stage droplet model, `exp(-t)sin(t)` transient shape, layered frequency-band noise mixing) — none of its code is directly portable to WebAudio without a rewrite. Cited here as corroborating evidence that "filtered noise + randomized droplet transients, layered across frequency bands" is a credible, academically-grounded technique for rain synthesis in general (not WebAudio-specific).
