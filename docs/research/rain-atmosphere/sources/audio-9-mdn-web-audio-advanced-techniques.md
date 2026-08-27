# Source: MDN Web Docs — "Advanced techniques: Creating and sequencing audio" (Web Audio API)

- URL: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques
- Fetched: 2026-08-27
- Publication date: not visible in fetch (MDN pages show "last modified" dynamically; footer copyright range returned as "©1998–2026")
- Fetch method: WebFetch (not a browser tool)

## Verbatim quoted fragments

Noise buffer creation:
```javascript
const bufferSize = audioCtx.sampleRate * noiseDuration;
// Create an empty buffer
const noiseBuffer = new AudioBuffer({
  length: bufferSize,
  sampleRate: audioCtx.sampleRate,
});

// Fill the buffer with noise
const data = noiseBuffer.getChannelData(0);
for (let i = 0; i < bufferSize; i++) {
  data[i] = Math.random() * 2 - 1;
}
```

Node graph:
```javascript
const noise = new AudioBufferSourceNode(audioCtx, { buffer: noiseBuffer });
const bandpass = new BiquadFilterNode(audioCtx, { type: "bandpass", frequency: bandHz });
noise.connect(bandpass).connect(audioCtx.destination);
noise.start(time);
```

Description of effect:
> Raw white noise has "peaks of all frequencies, which are actually quite dramatic and piercing." Routing it through a bandpass filter "cut[s] high and low frequencies, producing 'pink or brown noise.'"

Content license (page footer):
> "Portions of this content are ©1998–2026 by individual mozilla.org contributors. Content available under [a Creative Commons license]."

## Notes
[confirmed — primary source, developer.mozilla.org] This is MDN's own official Web Audio API documentation — a primary, highly credible technical reference, and explicitly CC-licensed per its own footer (MDN's standard license across the docs corpus is CC-BY-SA 2.5 for prose; the fetch did not resolve the specific link target for the variant, so cite as "a Creative Commons license" per the page's own wording rather than asserting the exact sub-variant without direct confirmation — see gap below).
- Gap: the fetch returned the generic footer sentence but did not follow the "Creative Commons license" hyperlink to MDN's attribution/copyright guidelines page, so the exact CC variant (commonly CC-BY-SA 2.5 for MDN prose; MDN's separate code-sample policy is understood to be more permissive) is [reported, unverified] rather than independently confirmed in this session.
- This is the **foundational, license-attributable node graph** for the recommended synthesis approach: `AudioBufferSourceNode(white noise) → BiquadFilterNode(bandpass, tunable frequency) → destination`, directly producing pink/brown-noise-like rain-bed texture. Extend per audio-8's structural pattern (add an `OscillatorNode` LFO modulating `BiquadFilterNode.frequency` at ~0.1-0.3 Hz for "gusting" variation, plus a second short-decay noise-burst voice, randomly gain-triggered, for droplet transients) to reach a full rain patch.
