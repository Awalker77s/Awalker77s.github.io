# Research: Lofi/Chill Procedural Rain + Underwater Muffling (WebAudio)

Researched 2026-08-27. Scope: sound only (visuals/scroll owned by other lenses).
Target file under improvement: `src/lib/rain/audio.ts` (white noise → LP1300 Q0.5 ∥ BP5200 Q0.14; HP3800 patter bursts 110ms; master 0.32; gust LFO 0.11Hz depth 320; fades 1.2s/0.6s).

## BLUF

- **Swap white → pink noise at the buffer level.** Paul Kellet's 7-state filter (music-dsp list, Oct 1999) is the standard cheap JS method; every WebAudio noise/rain project fetched uses these exact coefficients. White noise's harshness in the upper frequencies is the documented reason. [confirmed — 3 sources]
- **The BP 5200Hz Q0.14 branch is the harshness culprit**: Q0.14 is nearly a shelf spanning 2–5kHz — the region mixing practitioners uniformly call the ear's most sensitive/"pain zone." Cut its level hard, and darken the whole mix with a series master lowpass (~3kHz, cascade two biquads for 24dB/oct). Real rain repo (`noised`) runs its noise body through LP 4000Hz and puts *drops* at bandpass 300–800Hz Q1 — far darker than our patter at HP 3800.
- **Tasteful lofi = level discipline, not effects**: EffeTune's documented "subtle" settings — wow/flutter 0.16–0.2%, crackles ~200/min at −48dB, pops ~20/min at −48dB, noise beds at −72..−48dB. Bitcrush/waveshaper on noise is counterproductive; playbackRate flutter is inaudible on aperiodic noise. Slow LFOs on cutoff+gain ("breathing") are the meaningful moves.
- **Underwater = steep lowpass to ~300Hz** (200Hz deep, 400–500Hz near surface) per mixing-practitioner recipe, exponentially mapped over depth; kill patter/crackle layers (they are "air" sounds), add faint low rumble and optional slow wobble; lower noise `playbackRate` slightly for free spectral drop.
- **Fatigue**: no absolute web-loudness target found ([insufficient evidence] for a number) — but avoid narrow resonant peaks (nothing high-Q between 2–5kHz), keep the bed low and defaulted quiet; mynoise calibrates to "barely audible" as the reference point.

---

## Q1 — Noise color: pink/brown vs white

**Answer: yes — pink (or pink-leaning blend) is warmer and less hissy, and there is one standard cheap JS method.**

- Noisehack ("How to Generate Noise with the Web Audio API", n.d., classic reference): pink noise "sounds *much* nicer than white noise, which is too harsh in the upper frequencies"; brown "sounds like a waterfall." [confirmed — 2 sources for the code, below]
- **Paul Kellet pink filter** — primary provenance: music-dsp mailing list, **Oct 17, 1999**, archived at firstpr.com.au/dsp/pink-noise/. Instrumentation-grade version accurate to ±0.05dB above 9.2Hz @44.1kHz. Exact code (identical in noisehack, zacharydenton/noise.js, and stargazingdave/noised): [confirmed — 3 sources]

  ```js
  b0 = 0.99886*b0 + white*0.0555179;
  b1 = 0.99332*b1 + white*0.0750759;
  b2 = 0.96900*b2 + white*0.1538520;
  b3 = 0.86650*b3 + white*0.3104856;
  b4 = 0.55000*b4 + white*0.5329522;
  b5 = -0.7616*b5 - white*0.0168980;
  out = (b0+b1+b2+b3+b4+b5+b6 + white*0.5362) * 0.11;  // *0.11 gain comp
  b6 = white*0.115926;
  ```

  Economy 3-state version (±0.5dB): `b0=0.99765*b0+white*0.0990460; b1=0.96300*b1+white*0.2965164; b2=0.57000*b2+white*1.0526913; pink=b0+b1+b2+white*0.1848;` [confirmed — 2 sources: firstpr.com.au archive; noisehack references same family]
- **Brown (red) noise leaky integrator** (−6dB/oct, much darker): `out = (lastOut + 0.02*white)/1.02; lastOut = out; out *= 3.5;` [confirmed — 2 sources: noisehack; zacharydenton/noise.js raw source — shared code lineage, i.e. it IS the community-standard snippet]
- The `noised` rain library exposes `"white" | "pink"` for its rain bed and its source uses the Kellet bank, described as producing "perceptually warmer rainfall." [single-source — repo source via raw fetch, accessed 2026-08-27]
- Precompute into the 2s loop buffer offline (our architecture already does this) — no ScriptProcessor/worklet needed. Brown alone reads as waterfall/rumble, not rain; a pink base with optional ~20–30% brown mixed in warms without losing "rain." [speculation — flagged: the blend ratio is our inference; the endpoint characterizations are sourced]

Sources: https://www.firstpr.com.au/dsp/pink-noise/ (1999, archival primary) · https://noisehack.com/generate-noise-web-audio-api/ · https://raw.githubusercontent.com/zacharydenton/noise.js/master/noise.js · https://raw.githubusercontent.com/stargazingdave/noised/main/src/V2/RainGenerator.ts

## Q2 — Filter topology for soft/indoor rain

**Answer: real generators run the body much darker than our graph, and put discrete drops in the LOW mids, not highs.**

- `stargazingdave/noised` `V2/RainGenerator.ts` (fetched raw, accessed 2026-08-27): noise bed → **lowpass, default 4000Hz**, LFO-modulated at **0.1Hz, ±1000Hz**; **drops = bandpass randomized 300–800Hz, Q=1**, exponential decay (`exponentialRampToValueAtTime(0.001, now+0.5)`), plus convolution reverb wet ~0.4. Gains: noise 0.2, drops 0.5, master 0.5. [single-source — but it is actual shipped source code]
- binaura.net procedural rain/wind (2012-01-24): rain built from "random pitched oscillators with very tiny ADSR events" over a filtered-noise wind bed — confirms the two-layer architecture (continuous filtered noise + sparse pitched micro-events) our code already has. [confirmed — 2 sources for the architecture: binaura + noised]
- **Harshness above ~4kHz / the 2–5kHz zone**: multiple independent mixing-practitioner pages state the ear is most sensitive at 2–5kHz ("the pain zone"), where "an excess … causes resonance that rings unpleasantly" and causes fatigue; this matches equal-loudness (Fletcher–Munson) theory. [confirmed — 2+ sources at search-snippet level: bchillmix.com EQ chart, mixdownonline "Say Goodbye To Harsh Mixes", kernaudio.io harshness guide; snippets not full-fetched — treat individual wordings as [reported, unverified]]
- **Second lowpass in series**: no fetched rain project explicitly cascades two lowpasses; however BiquadFilter lowpass is 2nd-order (12dB/oct), and cascading two is the textbook route to 24dB/oct — and the underwater recipe below explicitly calls for "a very aggressive top end low pass," implying steep slopes read as "muffled/soft." Timeless DSP theory + practitioner implication. [confirmed as filter theory; "rain projects standardly do it" — insufficient evidence]
- Implication for our graph: LP1300 body is fine; the **BP5200 Q0.14** branch (Q0.14 ≈ ~7-octave bandwidth — effectively broadband treble) and **HP3800 patter** both dump energy exactly into 2–5kHz. Re-voicing patter down to noised's 300–1800Hz region and shelving everything above ~3kHz is what moves this from "hiss + ticks" to "soft rain."

## Q3 — Lofi character: what's used, what's overkill

Evidence from EffeTune (Frieve-A/effetune `docs/plugins/lofi.md`, actively maintained repo, accessed 2026-08-27) — a real parameterized lofi DSP suite:

- **Wow/flutter**: cassette default **0.20%**, tape default **0.16%** (0–1% range). Tape at moderate settings described as "softened treble, gentle warmth, light hiss." [single-source]
- **Vinyl artifacts, "subtle vinyl character"**: **Pops 20/min at −48dB, Crackles 200/min at −48dB, Wear 25%.** [single-source]
- **Noise beds**: white/pink/brown blender; "very subtle" −96..−72dB, "gentle" −72..−48dB. [single-source]
- **Bit crush**: even the *subtle* tier is 12–16 bit — i.e., always audible coloration. [single-source]
- AceStep VHS web generator (search snippet): pitch wobble from "two LFOs: a slow 'wow' and a fast 'flutter'"; hiss flavors "bright white for VHS … smooth pink for cassette, dark brown for heavily worn tape." [reported, unverified — page not fetched]
- **Crackle synthesis method**: PD-forum approach — white noise through a lowpass whose "cutoff frequency [is randomized] every 1 ms to create 'pops' that sound like digital vinyl crackle"; alternatively Dust-style "randomly spaced impulses with random amplitudes" (HetrickCV Dust doc). [reported, unverified — search snippets; both are leads, and both reduce to: sparse random impulses → bandpass → tiny gain]

**Overkill/cheesy for a calm professional site** (our judgment, grounded in the above):
- Bitcrush/WaveShaper on a noise bed: [speculation — flagged] adds aliasing hiss to a signal that is already noise — fights the goal.
- playbackRate wobble on the noise loop for "tape flutter": [speculation — flagged] pitch wobble is inaudible on aperiodic noise (nothing periodic to detune); it only pays off on tonal material. Skip.
- What earns its place: pink base + darker voicing (Q1/Q2), the existing slow cutoff LFO, a second very slow **gain** LFO (±~1dB "breathing"), and *optionally* EffeTune-spec crackle at −45..−50dB — quiet enough to be subliminal texture.

## Q4 — Underwater muffling

- **Core recipe** — musicguymixing.com "Underwater EQ Settings" (2024-08-06): "The important filter doing all the heavy lifting … is the low pass filter at **300Hz**"; **200Hz = deeper**, **400–500Hz = closer to the surface**; optional HP 20Hz for headroom; **chorus ~4Hz, 50/50** for the wavering quality; automate the LPF upward to simulate "swimming to the surface." [single-source for exact numbers; the water-as-lowpass physics is corroborated across every underwater-tool page seen]
- **Game middleware pattern**: Wwise/FMOD do this as a bus-wide LPF driven by a state/snapshot with a transition time (the Audiokinetic Q&A page confirming specifics returned HTTP 403 — [reported, unverified], from search summaries of middleware snapshot mixing).
- **Shipped tool components** — elysiatools underwater effect (fetched): exposes Muffling 0–1, Bubble intensity 0–1, "Pressure Effect" 0–1 producing "subtle pitch and modulation changes," Depth 1–100m where "Deeper = more muffled and low-pass filtered." No Hz values disclosed (null). [single-source for component list]
- A recurring search-summary claim of "steep LPF (order ~8) at ~1000Hz + mid scoop −4..−14dB @1500Hz + 0.35Hz amplitude wobble" could not be pinned to a fetchable primary. [reported, unverified]
- **Scroll mapping 0→1**: pitch/brightness perception is logarithmic, so interpolate cutoff **exponentially**, not linearly: `f(d) = fTop * (fBottom/fTop)^d` (e.g. 16000→300Hz ⇒ `16000 * Math.pow(300/16000, d)`), applied with `setTargetAtTime` to avoid zipper noise. Ease `d` (smoothstep) so the dramatic change clusters at the surface crossing, mirroring the "automate upward when surfacing" practice. [speculation — flagged: the exponential mapping is standard psychoacoustics applied by us; endpoints are sourced]
- Cheap extra: drop the noise-source `playbackRate` to ~0.92–0.95 at full depth — resampling shifts the entire noise spectrum down, adding muffle + the "pressure pitch change" the tools model. [speculation — flagged, grounded in resampling theory + elysiatools' pressure-effect description]

## Q5 — Loudness / long-session fatigue

- Wikipedia "Listener fatigue": mechanism is temporary threshold shift — "When exposed to noise, the human ear's sensitivity to sound is decreased" — driven by level and exposure duration; sonic artifacts become more noticeable and fatiguing as volume rises. **Null**: the article gives no frequency-range specifics. [single-source]
- 2–5kHz is where excess energy reads as harsh and fatiguing (see Q2 citations) — so the fix for fatigue is spectral (keep that band gentle, no high-Q resonances there), not just level. [confirmed — 2+ sources, search-snippet level]
- mynoise.net calibration page: reference level is set where "the static noise should be barely audible"; full spectral compensation "will probably sound too bright" — even correction toward flat must be conservative because listeners adapt. Ambient beds should default *quiet* and be user-adjustable. [single-source]
- Absolute target (LUFS/dBFS) for website ambient loops: **[insufficient evidence]** — no standard found in fetched sources. Practical floor from our graph: master ≤ 0.3 with no narrow peaks; keep all musical Qs ≤ ~1–2.

---

## Recommended parameter table for OUR graph

| Node / change | Current | Recommended | Why |
|---|---|---|---|
| Noise buffer | white | **Pink (Kellet 7-state, ×0.11)**; optional +25% brown mix | Q1: kills hiss at the source [confirmed] |
| Body filter A | LP 1300Hz Q0.5 | **keep LP ~1200–1500Hz, Q 0.5–0.7** | Already in the right zone |
| Body filter B (new) | — | **2nd LP in series, ~2800–3200Hz Q0.7, on the master sum** | 24dB/oct total top-end rolloff = "indoors/tape softened treble" |
| Sparkle branch | BP 5200Hz Q0.14 | **gain ×0.15–0.25 (≈−14dB) or delete**; if kept, recenter ~2200Hz Q0.7 | Q2: broadband energy across the 2–5kHz pain zone |
| Patter layer | HP 3800Hz, 110ms bursts | **BP randomized 800–1800Hz, Q 1–2, exp decay 60–120ms** (`exponentialRampToValueAtTime`), keep random skip | noised uses BP 300–800Hz Q1 drops; mid "plips" not high "ticks" |
| Gust LFO | 0.11Hz depth 320 on LP | **keep** (noised validates 0.1Hz); widen depth to ~±400 on pink base | Matches real repo values |
| Breathing (new) | — | LFO ~0.06Hz, ±10% (±~1dB) on master gain | Q3 "gentle amplitude breathing" |
| Crackle (optional) | — | Poisson impulses ~200/min crackle (1–4ms) + ~20/min pops (10–20ms), through BP ~1.5–3kHz, gain ≈ −48dB rel. bed (≈0.004–0.008 linear) | EffeTune subtle-vinyl spec verbatim |
| Avoid | — | No WaveShaper bitcrush; no playbackRate flutter on noise | Q3 [flagged reasoning] |
| Master | 0.32 | 0.28–0.32, fades unchanged | Q5; spectral fix does the work |
| **Underwater (depth d 0→1)** | — | Series master LP: `f = 16000·(300/16000)^smoothstep(d)` → **300Hz at d=1** (200Hz for "deep"); 2 cascaded biquads; patter/crackle/sparkle gains ×(1−d)²; master ×(1−0.35d); +low rumble (brown noise or 60–80Hz sine, gain →0.04); optional 0.3–4Hz gentle wobble (±1dB gain or ±10% cutoff); noise playbackRate →0.93 at d=1; drive with `setTargetAtTime` (τ≈0.08–0.15s) | Q4 sources + exp mapping |

## Limitations / [insufficient evidence]

- No numeric loudness target for web ambient loops found (Q5).
- "Rain generators standardly cascade two lowpasses" — not directly evidenced; cascade recommendation rests on filter theory + "aggressive LPF" underwater practice.
- 2–5kHz sensitivity claims corroborated only at search-snippet level (multiple independent practitioner sites, not full-fetched).
- The "order-8 LPF @1000Hz + 0.35Hz wobble" underwater spec never resolved to a fetchable primary.
- Audiokinetic Q&A (Wwise underwater LPF) blocked (HTTP 403) — middleware detail stays [reported, unverified].

## Sources Consulted

**Fetched (12):**
1. https://noisehack.com/generate-noise-web-audio-api/ — pink/brown JS code, perceptual notes (n.d., classic)
2. https://www.firstpr.com.au/dsp/pink-noise/ — Paul Kellet primary archive (1999-10-17)
3. https://github.com/stargazingdave/noised — README (thin; near-null)
4. https://www.audiokinetic.com/qa/14313/... — **HTTP 403 (null/blocked)**
5. https://github.com/Frieve-A/effetune/blob/main/docs/plugins/lofi.md — lofi parameter spec (accessed 2026-08-27)
6. https://www.binaura.net/stc/fp/?entry=entry120124-173444 — procedural rain/wind (2012-01-24)
7. https://raw.githubusercontent.com/zacharydenton/noise.js/master/noise.js — pink/brown source
8. https://api.github.com/repos/stargazingdave/noised/git/trees/main?recursive=1 — file tree
9. https://www.musicguymixing.com/underwater-eq/ — underwater EQ recipe (2024-08-06)
10. https://raw.githubusercontent.com/stargazingdave/noised/main/src/V2/RainGenerator.ts — rain source values
11. https://en.wikipedia.org/wiki/Listener_fatigue — fatigue mechanisms (null on frequency specifics)
12. https://mynoise.net/calibration.php — level/calibration practice
13. https://elysiatools.com/en/tools/audio-underwater-effect — components only (null on Hz values)

**Search-level corroboration (not fetched):** bchillmix.com EQ chart; mixdownonline.com harsh mixes; kernaudio.io harshness; cryo-mix.com harsh vocals; acestep.io VHS generator; forum.pdpatchrepo.info crackle thread; hetrickcv Dust doc; waves.com ear-fatigue.

**Null results (queries):** "underwater … cutoff Hz" search → mostly patents/arxiv noise; "dsp.stackexchange underwater …" → zero dsp.stackexchange hits, no Subnautica/ABZU interviews surfaced; "synthesize vinyl crackle … javascript" → no direct JS implementation, PD-forum lead only.

## Additional Leads (out of scope / other lenses or later)

- Subnautica/ABZU GDC audio talks — deeper underwater ambience design (not chased; game-specific).
- mynoise.net individual rain generators ("Rain Noise", "Rain on a Tent") — Pigeon occasionally documents slider voicings in blog posts.
- teropa.info Web Audio deep dives — scheduling patterns if patter timing gets rebuilt.
- Scroll-driven `AudioParam` automation must coordinate with the scroll-mechanics lens (who owns the depth value 0→1 and its easing) — flagged, not chased.
- AudioWorklet migration (ScriptProcessor deprecation) — irrelevant to us since we precompute buffers, but worth noting if live noise synthesis is ever wanted.
