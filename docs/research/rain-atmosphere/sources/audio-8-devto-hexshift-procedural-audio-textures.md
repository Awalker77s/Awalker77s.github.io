# Source: DEV Community — "How to Generate Procedural Audio Textures in the Browser (No Samples Needed)" by hexshift (Asher Baum)

- URL: https://dev.to/hexshift/how-to-generate-procedural-audio-textures-in-the-browser-no-samples-needed-332l
- Fetched: 2026-08-27
- Publication date: not visible in fetch (author byline: Asher Baum / hexshift)
- Fetch method: WebFetch (not a browser tool)

## Verbatim/extracted content

Node types used:
> AudioBufferSourceNode (plays generated white noise buffer), GainNode (volume), BiquadFilterNode (lowpass/bandpass/highpass), OscillatorNode (LFO for dynamic texture variation)

Node graph (as extracted):
> `AudioBufferSourceNode → BiquadFilterNode → GainNode → AudioContext.destination`
> LFO path: `OscillatorNode → GainNode → BiquadFilterNode.frequency`

Code pattern:
> White noise via random samples: `data[i] = Math.random() * 2 - 1;` across a buffer, looped, with filtering and a slow (0.2 Hz) LFO modulating filter frequency "to simulate wind or rain textures."

## License
[gap — no explicit code license stated]. The fetch found no explicit license/copyright statement for the code snippets themselves — "Standard DEV Community terms apply." DEV Community's platform ToS generally leaves copyright with the author and does not grant an open-source license by default. **Treat this as a technique reference / recipe to reimplement from scratch, not as code to copy verbatim without the author's explicit permission.**

## Notes
[confirmed — corroborates audio-9] This is the most directly on-topic source found: it explicitly names "wind or rain textures" as the target of a noise+filter+LFO node graph, matching the brief's requested recipe shape (filtered noise + randomization/droplet-like modulation). Combined with MDN's license-clear noise-buffer-plus-bandpass-filter primitive (audio-9), this gives a full, defensible recipe: build the primitive from MDN's own example, then layer/modulate per this article's structural description (which is technique, not copyrightable code, once reimplemented independently).
