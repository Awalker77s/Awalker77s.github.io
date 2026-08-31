export type AtmosphereAudio = {
  enable: () => Promise<void>;
  disable: () => void;
  isRunning: () => boolean;
  setDepth: (depth: number) => void;
  destroy: () => void;
};

// Pulled from 1.1 to 0.78 (~-3 dB) by operator call — the score is ambience
// behind reading, not a listening session. Surface lands ≈ -13 dBFS RMS.
const MASTER_LEVEL = 0.78;
const FADE_IN_S = 1.2;
const FADE_OUT_S = 0.6;

// Voicing and underwater values from docs/research/underwater-city/audio-lofi.md:
// two cascaded master lowpasses sweep 3000 Hz (surface, tape-soft top end) down
// to 700 Hz along an exponential curve — brightness perception is logarithmic,
// so a linear sweep would bunch all the change at the deep end. The full sweep
// lands by SUBMERGE_DEPTH — the engine's combined depth once the camera is
// fully underwater (it emits 0.4·submersion + 0.6·page depth) — because the
// muffle belongs to crossing the waterline; below it the cutoff holds and only
// depthTrim keeps sinking.
//
// The muffle only governs the SURFACE world (rain + bright keys + plucks).
// The DEEP world bypasses it and swells in as the surface fades, so descending
// reads as a mood change, not a volume dip. Underwater scores that people
// love (Abzû, Journey, Subnautica's surface-to-reef transitions) never reach
// for a brutal lowpass alone — they trade brightness for SPACE. So the deep
// world here is: detuned pad pairs breathing under a wobbling filter, two
// high diatonic color voices that keep a little "magic" above the pads,
// occasional inharmonic bells on their own unmuffled bus, and a comb-network
// reverb that gives the whole thing somewhere to echo. The 700 Hz floor (up
// from an earlier 300) keeps enough voice in the muffled surface remnant
// that the crossfade never feels like drowning.
// The bass sits below the muffle floor and carries through the waterline in
// both worlds, which is what keeps the crossfade feeling continuous.
const MUFFLE_SURFACE_HZ = 3000;
const MUFFLE_DEEP_HZ = 700;
const SUBMERGE_DEPTH = 0.4;
const DEPTH_SMOOTH_S = 0.12;

// Rain sits far behind the music: a light bed, not the subject.
const RAIN_BODY_LEVEL = 0.15;
const SPARKLE_LEVEL = 0.035;
const RUMBLE_LEVEL = 0.03;

const KEYS_LEVEL = 0.32;
const BASS_LEVEL = 0.25;
const PLUCK_PEAK = 0.09;
const PLUCK_CHANCE = 0.04;
const DEEP_LEVEL = 0.32;
const ABYSS_BELL_BUS_LEVEL = 0.2;
const CHORD_S = 7;
const GLIDE_S = 0.12;
// Deep pad voices take whole seconds to arrive at each new chord — underwater
// nothing moves quickly, and the slow swell between chords is most of the mood.
const DEEP_GLIDE_S = 1.6;
const LOOKAHEAD_S = 1.2;
const TICK_MS = 125;

// C major pentatonic, C5–C6 — every note is at worst a mild color tone
// against every chord in the loop (no tritone or semitone lands anywhere),
// so the bell line can wander freely without ever sounding wrong. A sparse
// high pentatonic top-line is the clearest "hopeful" signal the bed has
// (game-audio vertical-layering literature is unanimous on this one).
const BELL_POOL = [523.25, 587.33, 659.26, 783.99, 880.0, 1046.5];

// Cmaj9 → Fmaj9 → Am11 → G(add9) — the I–IV–vi–V loop in C major, voiced a
// fourth above the old D-minor bed with maj9/add9 clusters so it reads warm
// and hopeful instead of ominous. The vi is voiced WITHOUT its minor third
// (G B D E over A) so even the minor stop stays open. Voice-led: three of the
// four voices move by step; the top voice glides a gentle third.
// Deep pads sit an octave up from their first voicing (sub-200 Hz pads read
// as dread; 250-500 Hz reads as warm Rhodes-adjacent lofi). The bass keeps
// the low anchor, so the register lift costs no foundation.
const PROGRESSION = [
  { bass: 65.41, keys: [196.0, 246.94, 293.66, 329.63], deep: [261.63, 392.0, 523.25] },
  { bass: 87.31, keys: [220.0, 261.63, 329.63, 392.0], deep: [261.63, 349.23, 523.25] },
  { bass: 110.0, keys: [196.0, 246.94, 293.66, 329.63], deep: [220.0, 329.63, 440.0] },
  { bass: 98.0, keys: [220.0, 246.94, 293.66, 392.0], deep: [196.0, 293.66, 392.0] },
];
// Higher voices read louder at equal gain, so the stack tapers upward.
const VOICE_LEVELS = [0.24, 0.22, 0.2, 0.17];
// The deep pad swells per voice on offset LFOs so it breathes like a current.
const DEEP_VOICE_LEVELS = [0.34, 0.26, 0.2];
const DEEP_SWELL_HZ = [0.05, 0.062, 0.077];
// Each deep pad voice is a ±7-cent pair — the slow beat between the pair is
// what turns a plain sine into "shimmer" without adding any brightness.
const DEEP_DETUNE_CENTS = 7;
// Two high color voices ride above the pads (maj7 / 9th of the sounding
// chord, octave-up register): quiet, but they are the "magic" that keeps the
// deep from being only darkness. Indexed in step with PROGRESSION.
const COLOR_VOICES = [
  [493.88, 587.33], // Cmaj9  -> B4, D5
  [659.26, 392.0], //  Fmaj9  -> E5, G4
  [392.0, 493.88], //  Am11   -> G4, B4
  [440.0, 587.33], //  Gadd9  -> A4, D5
];
const COLOR_LEVELS = [0.12, 0.1];
// Comb-network reverb (four parallel feedback delays at mutually-prime-ish
// lengths, each damped by its own lowpass). Not a true FDN — no mixing
// matrix — but at 0.28 wet under a pad bed the difference doesn't survive.
// Shorter, warmer, darker-tailed room (the earlier 0.35-0.61s cavern read as
// portentous — a lofi beat wants a small room, not a cathedral).
const REVERB_DELAYS_S = [0.21, 0.27, 0.33, 0.39];
const REVERB_FEEDBACK = [0.3, 0.28, 0.26, 0.24];
const REVERB_DAMP_HZ = 1800;
const REVERB_WET = 0.17;

// ——— The deep beat ———
// Underwater is a lofi groove, not dark ambient. The grid derives from the
// chord clock (CHORD_S/16 per eighth = 2 bars of 4/4 per chord, ≈68.6 BPM
// half-time feel — squarely Dilla/Nujabes territory), so beat and harmony
// stay phase-locked forever with no second clock to drift. Hits are ephemeral
// nodes like the plucks; loudness tracks deepLevel and hard-gates on abyss
// progress, so the surface stays beatless and the kit only enters once the
// muffle crossfade has fully finished.
const DRUM_EIGHTH_S = CHORD_S / 16;
const DRUM_KICK_PEAK = 0.16;
const DRUM_SNARE_NOISE_PEAK = 0.1;
const DRUM_SNARE_BODY_PEAK = 0.04;
const DRUM_HAT_PEAK = 0.035;
// 58% swing: odd (upbeat) eighths land this late. Carried almost entirely by
// the hats — the kick/snare pattern below avoids odd steps.
const DRUM_SWING_S = DRUM_EIGHTH_S * 2 * 0.08;
const DRUM_FADE_ABYSS = 0.15;
const DRUM_DUCK_DEPTH = 0.55;
const DRUM_DUCK_RELEASE_TC = 0.06;
// 16-step grid (2 bars): kick on beat 1 + the "and" of 3, backbeat snare.
const KICK_STEPS: Record<number, number> = { 0: 1, 5: 0.85, 8: 1, 13: 0.85 };
const SNARE_STEPS: Record<number, number> = { 2: 1, 6: 1, 10: 1, 14: 1 };

// Waterline one-shots: the plunge/breach ARE the crossing, so they bypass the
// muffle AND depthTrim (whose live depth automation would wobble a
// hand-authored envelope mid-scroll) and join at master — still limited.
const WATERLINE_HYST = 0.02;
const WATERLINE_COOLDOWN_S = 1;

type Graph = {
  context: AudioContext;
  noise: AudioBufferSourceNode;
  patter: BiquadFilterNode;
  patterGain: GainNode;
  crackleGain: GainNode;
  sparkleGain: GainNode;
  rumbleGain: GainNode;
  muffleA: BiquadFilterNode;
  muffleB: BiquadFilterNode;
  deepFilter: BiquadFilterNode;
  deepGain: GainNode;
  abyssBellBus: GainNode;
  drumSum: GainNode;
  snareReverbSend: GainNode;
  duckGain: GainNode;
  transitionBus: GainNode;
  pinkBuffer: AudioBuffer;
  whiteBuffer: AudioBuffer;
  bellSend: DelayNode;
  depthTrim: GainNode;
  master: GainNode;
  keysOscs: OscillatorNode[];
  deepOscs: OscillatorNode[];
  colorOscs: OscillatorNode[];
  bassOsc: OscillatorNode;
};

// Paul Kellet's pink-noise filter (music-dsp list, 1999) — white noise reads as
// hiss; pink is the standard warm base for rain beds.
function pinkNoiseBuffer(context: AudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

function bandpass(context: AudioContext, frequency: number, q: number): BiquadFilterNode {
  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = frequency;
  filter.Q.value = q;
  return filter;
}

function lowpass(context: AudioContext, frequency: number, q: number): BiquadFilterNode {
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = frequency;
  filter.Q.value = q;
  return filter;
}

export function createAtmosphereAudio(): AtmosphereAudio {
  let graph: Graph | null = null;
  let tickTimer: number | null = null;
  let suspendTimer: number | null = null;
  let depth = 0;
  let airLevel = 1;
  let deepLevel = 0;
  let chordIndex = 1;
  let nextChordTime = 0;
  let nextAbyssBellAt = 0;
  let abyss = 0;
  let drumEighthIndex = 0;
  let nextDrumEighth = 0;
  let waterlineSide: "above" | "below" | null = null;
  let bandEnteredAt = 0;
  let lastWaterlineFireAt = -Infinity;

  function buildGraph(): Graph {
    const context = new AudioContext();

    const noise = context.createBufferSource();
    const pinkBuffer = pinkNoiseBuffer(context);
    noise.buffer = pinkBuffer;
    noise.loop = true;
    // White noise for the drum kit's snare/hats (pink is too dull up top);
    // shared read-only across every per-hit AudioBufferSourceNode.
    const whiteBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const whiteData = whiteBuffer.getChannelData(0);
    for (let i = 0; i < whiteData.length; i++) whiteData[i] = Math.random() * 2 - 1;

    const body = lowpass(context, 1400, 0.6);
    const bodyGain = context.createGain();
    bodyGain.gain.value = RAIN_BODY_LEVEL;

    const sparkle = bandpass(context, 2200, 0.7);
    const sparkleGain = context.createGain();
    sparkleGain.gain.value = SPARKLE_LEVEL;

    const patter = bandpass(context, 1200, 1.5);
    const patterGain = context.createGain();
    patterGain.gain.value = 0;

    const crackle = bandpass(context, 1900, 1);
    const crackleGain = context.createGain();
    crackleGain.gain.value = 0;

    const rumble = lowpass(context, 90, 0.7);
    const rumbleGain = context.createGain();
    rumbleGain.gain.value = 0;

    const muffleA = lowpass(context, MUFFLE_SURFACE_HZ, 0.7);
    const muffleB = lowpass(context, MUFFLE_SURFACE_HZ, 0.7);
    const breath = context.createGain();
    breath.gain.value = 1;
    const depthTrim = context.createGain();
    depthTrim.gain.value = 1;
    const master = context.createGain();
    master.gain.value = 0;
    // Stacked chord + gust + pluck + drum peaks can still spike well above
    // the average level; the limiter shaves only those rare peaks.
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -4;
    limiter.knee.value = 3;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.25;

    noise.connect(body).connect(bodyGain).connect(muffleA);
    noise.connect(sparkle).connect(sparkleGain).connect(muffleA);
    noise.connect(patter).connect(patterGain).connect(muffleA);
    noise.connect(crackle).connect(crackleGain).connect(muffleA);
    noise.connect(rumble).connect(rumbleGain).connect(muffleA);
    muffleA.connect(muffleB).connect(breath).connect(depthTrim).connect(master).connect(limiter).connect(context.destination);

    const gust = context.createOscillator();
    gust.type = "sine";
    gust.frequency.value = 0.11;
    const gustDepth = context.createGain();
    gustDepth.gain.value = 400;
    gust.connect(gustDepth).connect(body.frequency);

    const breathLfo = context.createOscillator();
    breathLfo.type = "sine";
    breathLfo.frequency.value = 0.06;
    const breathDepth = context.createGain();
    breathDepth.gain.value = 0.1;
    breathLfo.connect(breathDepth).connect(breath.gain);

    // Keys: two slightly detuned oscillators per voice into a warm lowpass —
    // the detune beat plus the wow LFO below is what reads as "tape". The
    // 2400 Hz cutoff (up from the minor bed's 1800) lets the maj9 shimmer
    // through without losing the tape softness.
    const keysFilter = lowpass(context, 2400, 0.5);
    const keysGain = context.createGain();
    keysGain.gain.value = KEYS_LEVEL;
    keysFilter.connect(keysGain).connect(muffleA);

    const wow = context.createOscillator();
    wow.type = "sine";
    wow.frequency.value = 0.4;
    const wowDepth = context.createGain();
    wowDepth.gain.value = 4.5;
    wow.connect(wowDepth);

    const keysOscs: OscillatorNode[] = [];
    PROGRESSION[0].keys.forEach((frequency, voice) => {
      const voiceGain = context.createGain();
      voiceGain.gain.value = VOICE_LEVELS[voice];
      voiceGain.connect(keysFilter);
      for (const [shape, detune] of [["triangle", 2.5], ["sine", -2.5]] as const) {
        const osc = context.createOscillator();
        osc.type = shape;
        osc.frequency.value = frequency;
        osc.detune.value = detune;
        wowDepth.connect(osc.detune);
        osc.connect(voiceGain);
        keysOscs.push(osc);
      }
    });

    const tremolo = context.createOscillator();
    tremolo.type = "sine";
    tremolo.frequency.value = 3.4;
    const tremoloDepth = context.createGain();
    tremoloDepth.gain.value = KEYS_LEVEL * 0.25;
    tremolo.connect(tremoloDepth).connect(keysGain.gain);

    const bassOsc = context.createOscillator();
    bassOsc.type = "sine";
    bassOsc.frequency.value = PROGRESSION[0].bass;
    const bassGain = context.createGain();
    bassGain.gain.value = BASS_LEVEL;
    bassOsc.connect(bassGain).connect(muffleA);

    // A soft feedback delay shared by the bell plucks — two or three fading
    // repeats read as space and playfulness without a convolution reverb.
    const bellSend = context.createDelay(1);
    bellSend.delayTime.value = 0.31;
    const bellFeedback = context.createGain();
    bellFeedback.gain.value = 0.22;
    const bellWet = context.createGain();
    bellWet.gain.value = 0.5;
    bellSend.connect(bellFeedback).connect(bellSend);
    bellSend.connect(bellWet).connect(muffleA);

    // The deep world: open fifths and octaves only — no thirds, so it reads
    // as vast rather than sad. It joins the chain AFTER the muffle (the pads
    // are native to the water; muffling them too would just be a second
    // volume knob) but before depthTrim, so the whole mix still settles as
    // you sink. The 1400 Hz ceiling (up from a darker 850) keeps cozy
    // AM-radio midrange presence; the slow cutoff wobble reads as breathing.
    // The dry pad path runs through duckGain so each kick can pump it a
    // little (sidechain feel) — the reverb send taps BEFORE the duck so the
    // tail stays continuous instead of stuttering.
    const deepFilter = lowpass(context, 1400, 0.5);
    const deepGain = context.createGain();
    deepGain.gain.value = 0;
    const duckGain = context.createGain();
    duckGain.gain.value = 1;
    deepFilter.connect(deepGain);
    deepGain.connect(duckGain).connect(breath);

    const deepWobble = context.createOscillator();
    deepWobble.type = "sine";
    deepWobble.frequency.value = 0.05;
    const deepWobbleDepth = context.createGain();
    deepWobbleDepth.gain.value = 35;
    deepWobble.connect(deepWobbleDepth).connect(deepFilter.frequency);

    const deepWow = context.createOscillator();
    deepWow.type = "sine";
    deepWow.frequency.value = 0.13;
    const deepWowDepth = context.createGain();
    deepWowDepth.gain.value = 6;
    deepWow.connect(deepWowDepth);

    // Pad voices as ±7-cent pairs; each pair shares a swell LFO so the two
    // halves breathe together while beating against each other.
    const deepOscs: OscillatorNode[] = [];
    const deepSwells: OscillatorNode[] = [];
    PROGRESSION[0].deep.forEach((frequency, voice) => {
      const voiceGain = context.createGain();
      voiceGain.gain.value = DEEP_VOICE_LEVELS[voice];
      voiceGain.connect(deepFilter);
      for (const detune of [DEEP_DETUNE_CENTS, -DEEP_DETUNE_CENTS]) {
        const osc = context.createOscillator();
        osc.type = "sine";
        osc.frequency.value = frequency;
        osc.detune.value = detune;
        deepWowDepth.connect(osc.detune);
        osc.connect(voiceGain);
        deepOscs.push(osc);
      }
      const swell = context.createOscillator();
      swell.type = "sine";
      swell.frequency.value = DEEP_SWELL_HZ[voice];
      const swellDepth = context.createGain();
      swellDepth.gain.value = DEEP_VOICE_LEVELS[voice] * 0.25;
      swell.connect(swellDepth).connect(voiceGain.gain);
      deepSwells.push(swell);
    });

    // High color voices — through the deep bus so they inherit its fade, but
    // quiet enough to read as light from the surface, not melody.
    const colorOscs: OscillatorNode[] = [];
    COLOR_VOICES[0].forEach((frequency, voice) => {
      const voiceGain = context.createGain();
      voiceGain.gain.value = COLOR_LEVELS[voice];
      voiceGain.connect(deepFilter);
      const osc = context.createOscillator();
      osc.type = "sine";
      osc.frequency.value = frequency;
      deepWowDepth.connect(osc.detune);
      osc.connect(voiceGain);
      colorOscs.push(osc);
    });

    // Abyssal bells bypass the deep lowpass on their own bus — their upper
    // partials are the one bright thing underwater, which is exactly why
    // they read as distant and holy rather than muffled.
    const abyssBellBus = context.createGain();
    abyssBellBus.gain.value = ABYSS_BELL_BUS_LEVEL;
    abyssBellBus.connect(breath);

    // Comb-network reverb fed by the deep world (pads post-fade + bells):
    // the wet return joins at depthTrim so the echo still settles with depth.
    const reverbIn = context.createGain();
    reverbIn.gain.value = 1;
    deepGain.connect(reverbIn);
    abyssBellBus.connect(reverbIn);
    const reverbWet = context.createGain();
    reverbWet.gain.value = REVERB_WET;
    reverbWet.connect(depthTrim);
    REVERB_DELAYS_S.forEach((seconds, i) => {
      const delay = context.createDelay(1);
      delay.delayTime.value = seconds;
      const damp = lowpass(context, REVERB_DAMP_HZ, 0.5);
      const feedback = context.createGain();
      feedback.gain.value = REVERB_FEEDBACK[i];
      reverbIn.connect(delay);
      delay.connect(damp).connect(feedback).connect(delay);
      delay.connect(reverbWet);
    });

    // Drum kit bus: kick/snare/hats sum here, pass through one static tanh
    // soft-clip (tape saturation so synth drums don't read as too clean) and
    // join at breath — parallel to the pad bus, bypassing deepFilter (whose
    // 1400 Hz ceiling would gut the hats). Snare alone taps a small reverb
    // send; kick and hats stay dry and tight.
    const drumSum = context.createGain();
    drumSum.gain.value = 1;
    const shaper = context.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) curve[i] = Math.tanh(1.7 * ((i / (curve.length - 1)) * 2 - 1));
    shaper.curve = curve;
    shaper.oversample = "2x";
    drumSum.connect(shaper).connect(breath);
    const snareReverbSend = context.createGain();
    snareReverbSend.gain.value = 0.2;
    snareReverbSend.connect(reverbIn);

    // Waterline one-shot bus: joins at master (see constants above).
    const transitionBus = context.createGain();
    transitionBus.gain.value = 1;
    transitionBus.connect(master);

    noise.start();
    gust.start();
    breathLfo.start();
    wow.start();
    tremolo.start();
    bassOsc.start();
    deepWobble.start();
    deepWow.start();
    for (const osc of keysOscs) osc.start();
    for (const osc of deepOscs) osc.start();
    for (const osc of colorOscs) osc.start();
    for (const osc of deepSwells) osc.start();

    chordIndex = 1;
    nextChordTime = context.currentTime + CHORD_S;
    // Drum grid step 0 and chord 0's downbeat start at the same instant.
    drumEighthIndex = 0;
    nextDrumEighth = context.currentTime;

    const built: Graph = {
      context,
      noise,
      patter,
      patterGain,
      crackleGain,
      sparkleGain,
      rumbleGain,
      muffleA,
      muffleB,
      deepFilter,
      deepGain,
      abyssBellBus,
      drumSum,
      snareReverbSend,
      duckGain,
      transitionBus,
      pinkBuffer,
      whiteBuffer,
      bellSend,
      depthTrim,
      master,
      keysOscs,
      deepOscs,
      colorOscs,
      bassOsc,
    };
    applyDepth(built);
    return built;
  }

  function applyDepth(g: Graph) {
    const now = g.context.currentTime;
    const submerge = Math.min(1, depth / SUBMERGE_DEPTH);
    const eased = submerge * submerge * (3 - 2 * submerge);
    abyss = Math.max(0, (depth - SUBMERGE_DEPTH) / (1 - SUBMERGE_DEPTH));
    airLevel = (1 - eased) * (1 - eased);
    // Pads fade in on a sin curve while the surface world's level falls on a
    // squared curve — not a matched equal-power pair, but close enough that
    // the crossfade holds perceived loudness. Small extra lift in the abyss.
    deepLevel = DEEP_LEVEL * Math.sin((Math.PI / 2) * eased) * (0.85 + 0.15 * abyss);
    const cutoff = MUFFLE_SURFACE_HZ * Math.pow(MUFFLE_DEEP_HZ / MUFFLE_SURFACE_HZ, eased);
    g.muffleA.frequency.setTargetAtTime(cutoff, now, DEPTH_SMOOTH_S);
    g.muffleB.frequency.setTargetAtTime(cutoff, now, DEPTH_SMOOTH_S);
    g.sparkleGain.gain.setTargetAtTime(SPARKLE_LEVEL * airLevel, now, DEPTH_SMOOTH_S);
    g.rumbleGain.gain.setTargetAtTime(RUMBLE_LEVEL * eased, now, DEPTH_SMOOTH_S);
    g.deepGain.gain.setTargetAtTime(deepLevel, now, DEPTH_SMOOTH_S);
    g.depthTrim.gain.setTargetAtTime(1 - 0.4 * eased - 0.15 * abyss, now, DEPTH_SMOOTH_S);
    g.noise.playbackRate.setTargetAtTime(1 - 0.07 * eased, now, DEPTH_SMOOTH_S);
  }

  // Retunes only the voices that move, gliding over GLIDE_S — the same
  // oscillators run for the life of the graph, so chord changes cost nothing.
  function scheduleChord(g: Graph, index: number, when: number) {
    const chord = PROGRESSION[index];
    const previous = PROGRESSION[(index + PROGRESSION.length - 1) % PROGRESSION.length];
    chord.keys.forEach((frequency, voice) => {
      const previousFrequency = previous.keys[voice];
      if (frequency === previousFrequency) return;
      for (const osc of [g.keysOscs[voice * 2], g.keysOscs[voice * 2 + 1]]) {
        osc.frequency.setValueAtTime(previousFrequency, when);
        osc.frequency.linearRampToValueAtTime(frequency, when + GLIDE_S);
      }
    });
    chord.deep.forEach((frequency, voice) => {
      const previousFrequency = previous.deep[voice];
      if (frequency === previousFrequency) return;
      for (const osc of [g.deepOscs[voice * 2], g.deepOscs[voice * 2 + 1]]) {
        osc.frequency.setValueAtTime(previousFrequency, when);
        osc.frequency.linearRampToValueAtTime(frequency, when + DEEP_GLIDE_S);
      }
    });
    const colors = COLOR_VOICES[index];
    const previousColors = COLOR_VOICES[(index + COLOR_VOICES.length - 1) % COLOR_VOICES.length];
    colors.forEach((frequency, voice) => {
      if (frequency === previousColors[voice]) return;
      const osc = g.colorOscs[voice];
      osc.frequency.setValueAtTime(previousColors[voice], when);
      osc.frequency.linearRampToValueAtTime(frequency, when + DEEP_GLIDE_S);
    });
    if (chord.bass !== previous.bass) {
      g.bassOsc.frequency.setValueAtTime(previous.bass, when);
      g.bassOsc.frequency.linearRampToValueAtTime(chord.bass, when + GLIDE_S);
    }
  }

  function schedulePluck(g: Graph) {
    const start = g.context.currentTime + 0.02;
    const frequency = BELL_POOL[Math.floor(Math.random() * BELL_POOL.length)];
    const osc = g.context.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = frequency;
    const envelope = g.context.createGain();
    envelope.gain.value = 0;
    osc.connect(envelope).connect(g.muffleA);
    envelope.connect(g.bellSend);
    const peak = PLUCK_PEAK * (0.25 + 0.75 * airLevel);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.linearRampToValueAtTime(peak, start + 0.005);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + 1.2);
    osc.start(start);
    osc.stop(start + 1.3);
  }

  // An abyssal chime: three near-harmonic partials (1 : 2 : 3.01 — the 3.01
  // keeps a touch of struck-object character without the gong-like dread of
  // a fully inharmonic stack), 8 ms strike, tight chime decays. Rooted on
  // the sounding chord an octave up so it always lands inside the harmony,
  // and deliberately OFF the drum grid — a floating chime over a locked
  // groove is a lofi staple. Routed to the unmuffled bell bus; the reverb
  // network is what turns it into distance.
  function scheduleAbyssBell(g: Graph) {
    const start = g.context.currentTime + 0.02;
    const sounding = PROGRESSION[(chordIndex + PROGRESSION.length - 1) % PROGRESSION.length];
    const root = sounding.deep[0] * 2;
    const partials: Array<[ratio: number, peak: number, decayS: number]> = [
      [1, 0.32, 2.5 + Math.random()],
      [2, 0.14, 1.5 + Math.random()],
      [3.01, 0.06, 1 + Math.random()],
    ];
    for (const [ratio, peak, decayS] of partials) {
      const osc = g.context.createOscillator();
      osc.type = "sine";
      osc.frequency.value = root * ratio;
      const envelope = g.context.createGain();
      envelope.gain.value = 0;
      osc.connect(envelope).connect(g.abyssBellBus);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.linearRampToValueAtTime(peak, start + 0.008);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + decayS);
      osc.start(start);
      osc.stop(start + decayS + 0.1);
    }
  }

  // One 16th of the lofi groove. levelMult scales every hit by how deep the
  // listener actually is (deepLevel is the pad ramp; the abyss factor keeps
  // the kit silent until the muffle crossfade has fully finished). Peaks are
  // read live at schedule time — same pattern the plucks use for airLevel —
  // so no automated bus is needed for the fade.
  function scheduleDrumStep(g: Graph, index: number, when: number) {
    const drumLevel = deepLevel * Math.min(1, abyss / DRUM_FADE_ABYSS);
    if (drumLevel <= 0.01) return;
    const levelMult = drumLevel / DEEP_LEVEL;
    // Hits are clamped to the context clock: the drum cursor starts at the
    // context's birth (t ≈ 0), and negative jitter/swing on the first window
    // would otherwise produce t < 0 — setValueAtTime THROWS on negative time
    // (a visitor who reloads while submerged and then clicks trips this).
    const floor = g.context.currentTime + 0.001;
    const swung = index % 2 === 1 ? when + DRUM_SWING_S : when;

    const kickVel = KICK_STEPS[index];
    if (kickVel !== undefined) {
      const hit = Math.max(floor, swung + (Math.random() * 0.024 - 0.012));
      const peak = DRUM_KICK_PEAK * kickVel * levelMult * (0.85 + Math.random() * 0.3);
      const osc = g.context.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(130, hit);
      osc.frequency.exponentialRampToValueAtTime(42, hit + 0.09);
      const envelope = g.context.createGain();
      envelope.gain.setValueAtTime(0.0001, hit);
      envelope.gain.linearRampToValueAtTime(peak, hit + 0.003);
      envelope.gain.exponentialRampToValueAtTime(0.0001, hit + 0.22);
      osc.connect(envelope).connect(g.drumSum);
      osc.start(hit);
      osc.stop(hit + 0.3);
      // Sidechain pump: dip the dry pad path, recover over ~180ms. Kicks are
      // never closer than ~1.3s in this pattern, so ramps can't overlap.
      g.duckGain.gain.setValueAtTime(1, hit);
      g.duckGain.gain.linearRampToValueAtTime(DRUM_DUCK_DEPTH, hit + 0.005);
      g.duckGain.gain.setTargetAtTime(1, hit + 0.005, DRUM_DUCK_RELEASE_TC);
    }

    const snareVel = SNARE_STEPS[index];
    if (snareVel !== undefined) {
      const hit = Math.max(floor, swung + (Math.random() * 0.02 - 0.01));
      const vel = snareVel * levelMult * (0.88 + Math.random() * 0.24);
      const noise = g.context.createBufferSource();
      noise.buffer = g.whiteBuffer;
      const filter = bandpass(g.context, 1500, 1.1);
      const envelope = g.context.createGain();
      envelope.gain.setValueAtTime(0.0001, hit);
      envelope.gain.linearRampToValueAtTime(DRUM_SNARE_NOISE_PEAK * vel, hit + 0.002);
      envelope.gain.exponentialRampToValueAtTime(0.0001, hit + 0.08);
      noise.connect(filter).connect(envelope).connect(g.drumSum);
      envelope.connect(g.snareReverbSend);
      noise.start(hit, Math.random() * 1.5);
      noise.stop(hit + 0.12);
      const body = g.context.createOscillator();
      body.type = "sine";
      body.frequency.value = 200;
      const bodyEnv = g.context.createGain();
      bodyEnv.gain.setValueAtTime(0.0001, hit);
      bodyEnv.gain.linearRampToValueAtTime(DRUM_SNARE_BODY_PEAK * vel, hit + 0.002);
      bodyEnv.gain.exponentialRampToValueAtTime(0.0001, hit + 0.06);
      body.connect(bodyEnv).connect(g.drumSum);
      body.start(hit);
      body.stop(hit + 0.1);
    }

    // Hats tick every eighth: dusty bandpassed clicks, upbeats softer.
    {
      const hit = Math.max(floor, swung + (Math.random() * 0.012 - 0.006));
      const accent = index % 2 === 0 ? 1 : 0.65;
      const peak = DRUM_HAT_PEAK * accent * levelMult * (0.75 + Math.random() * 0.5);
      const noise = g.context.createBufferSource();
      noise.buffer = g.whiteBuffer;
      const filter = bandpass(g.context, 6500, 0.9);
      const envelope = g.context.createGain();
      envelope.gain.setValueAtTime(0.0001, hit);
      envelope.gain.linearRampToValueAtTime(peak, hit + 0.001);
      envelope.gain.exponentialRampToValueAtTime(0.0001, hit + 0.018);
      noise.connect(filter).connect(envelope).connect(g.drumSum);
      noise.start(hit, Math.random() * 1.5);
      noise.stop(hit + 0.05);
    }
  }

  // The plunge: a pitch-dropping lowpass-swept whoosh, a sinking bloop, and
  // a scatter of small bubbles. speedGain/durationScale come from how fast
  // the listener actually crossed the waterline (fast fling = louder and
  // snappier; slow drift = softer and slightly lingering).
  function scheduleSubmergeSfx(g: Graph, speedGain: number, durationScale: number) {
    const start = g.context.currentTime + 0.02;
    const whoosh = g.context.createBufferSource();
    whoosh.buffer = g.pinkBuffer;
    whoosh.playbackRate.setValueAtTime(1, start);
    whoosh.playbackRate.exponentialRampToValueAtTime(0.6, start + 0.55 * durationScale);
    const sweepA = lowpass(g.context, 4500, 0.7);
    const sweepB = lowpass(g.context, 4500, 0.7);
    sweepA.frequency.setValueAtTime(4500, start);
    sweepA.frequency.exponentialRampToValueAtTime(350, start + 0.55 * durationScale);
    sweepB.frequency.setValueAtTime(4500, start);
    sweepB.frequency.exponentialRampToValueAtTime(350, start + 0.55 * durationScale);
    const whooshEnv = g.context.createGain();
    whooshEnv.gain.setValueAtTime(0.0001, start);
    whooshEnv.gain.linearRampToValueAtTime(0.14 * speedGain, start + 0.03);
    whooshEnv.gain.exponentialRampToValueAtTime(0.0001, start + 0.73 * durationScale);
    whoosh.connect(sweepA).connect(sweepB).connect(whooshEnv).connect(g.transitionBus);
    whoosh.start(start, Math.random());
    whoosh.stop(start + 0.8 * durationScale);

    const bloop = g.context.createOscillator();
    bloop.type = "sine";
    bloop.frequency.setValueAtTime(500, start + 0.08);
    bloop.frequency.exponentialRampToValueAtTime(90, start + 0.08 + 0.5 * durationScale);
    const bloopEnv = g.context.createGain();
    bloopEnv.gain.setValueAtTime(0.0001, start + 0.08);
    bloopEnv.gain.linearRampToValueAtTime(0.1 * speedGain, start + 0.1);
    bloopEnv.gain.exponentialRampToValueAtTime(0.0001, start + 0.58 * durationScale);
    bloop.connect(bloopEnv).connect(g.transitionBus);
    bloop.start(start + 0.08);
    bloop.stop(start + 0.7 * durationScale);

    for (let i = 0; i < 5; i++) {
      const at = start + 0.15 + i * 0.09 + (Math.random() * 0.03 - 0.015);
      const decayS = 0.06 + Math.random() * 0.03;
      const frequency = 600 + Math.random() * 1200;
      const blip = g.context.createOscillator();
      blip.type = "sine";
      blip.frequency.setValueAtTime(frequency, at);
      blip.frequency.linearRampToValueAtTime(frequency * 0.78, at + decayS);
      const blipEnv = g.context.createGain();
      blipEnv.gain.setValueAtTime(0.0001, at);
      blipEnv.gain.linearRampToValueAtTime((0.025 + Math.random() * 0.02) * speedGain, at + 0.004);
      blipEnv.gain.exponentialRampToValueAtTime(0.0001, at + decayS);
      blip.connect(blipEnv).connect(g.transitionBus);
      blip.start(at);
      blip.stop(at + decayS + 0.05);
    }
  }

  // The breach: a sharp highpass-swept splash, a rising whoop, and droplet
  // patter falling back onto the surface after.
  function scheduleResurfaceSfx(g: Graph, speedGain: number, durationScale: number) {
    const start = g.context.currentTime + 0.02;
    const splash = g.context.createBufferSource();
    splash.buffer = g.pinkBuffer;
    splash.playbackRate.setValueAtTime(0.85, start);
    splash.playbackRate.exponentialRampToValueAtTime(1.25, start + 0.3 * durationScale);
    const sweep = g.context.createBiquadFilter();
    sweep.type = "highpass";
    sweep.Q.value = 0.7;
    sweep.frequency.setValueAtTime(200, start);
    sweep.frequency.exponentialRampToValueAtTime(5000, start + 0.35 * durationScale);
    const splashEnv = g.context.createGain();
    splashEnv.gain.setValueAtTime(0.0001, start);
    splashEnv.gain.linearRampToValueAtTime(0.17 * speedGain, start + 0.012);
    splashEnv.gain.exponentialRampToValueAtTime(0.0001, start + 0.5 * durationScale);
    splash.connect(sweep).connect(splashEnv).connect(g.transitionBus);
    splash.start(start, Math.random());
    splash.stop(start + 0.6 * durationScale);

    const whoop = g.context.createOscillator();
    whoop.type = "sine";
    whoop.frequency.setValueAtTime(110, start);
    whoop.frequency.exponentialRampToValueAtTime(700, start + 0.35 * durationScale);
    const whoopEnv = g.context.createGain();
    whoopEnv.gain.setValueAtTime(0.0001, start);
    whoopEnv.gain.linearRampToValueAtTime(0.11 * speedGain, start + 0.015);
    whoopEnv.gain.exponentialRampToValueAtTime(0.0001, start + 0.4 * durationScale);
    whoop.connect(whoopEnv).connect(g.transitionBus);
    whoop.start(start);
    whoop.stop(start + 0.5 * durationScale);

    let at = start + 0.35 * durationScale;
    for (const gap of [0.06, 0.08, 0.09, 0.11, 0.14, 0.18]) {
      at += gap + (Math.random() * 0.04 - 0.02);
      const decayS = 0.015 + Math.random() * 0.01;
      const tap = g.context.createBufferSource();
      tap.buffer = g.pinkBuffer;
      const tapFilter = bandpass(g.context, 1800 + Math.random() * 2400, 3);
      const tapEnv = g.context.createGain();
      tapEnv.gain.setValueAtTime(0.0001, at);
      tapEnv.gain.linearRampToValueAtTime((0.04 + Math.random() * 0.02) * speedGain, at + 0.002);
      tapEnv.gain.exponentialRampToValueAtTime(0.0001, at + decayS);
      tap.connect(tapFilter).connect(tapEnv).connect(g.transitionBus);
      tap.start(at, Math.random() * 1.5);
      tap.stop(at + decayS + 0.03);
    }
  }

  // One tick drives everything time-based: chord changes scheduled a beat
  // ahead (so a busy main thread never lands a retune late), sparse rain
  // plips, vinyl crackle, occasional octave-up plucks in the air, and rare
  // bells in the deep. While the context is suspended currentTime freezes,
  // so the chord clock holds alignment.
  function startTicking(g: Graph) {
    if (tickTimer !== null) return;
    tickTimer = window.setInterval(() => {
      const now = g.context.currentTime;
      while (nextChordTime < now + LOOKAHEAD_S) {
        scheduleChord(g, chordIndex, nextChordTime);
        chordIndex = (chordIndex + 1) % PROGRESSION.length;
        nextChordTime += CHORD_S;
      }
      if (g.context.state !== "running") return;
      if (Math.random() < 0.28) {
        const peak = (0.02 + Math.random() * 0.05) * airLevel;
        if (peak > 0.001) {
          g.patter.frequency.setValueAtTime(800 + Math.random() * 1000, now);
          const gain = g.patterGain.gain;
          gain.cancelScheduledValues(now);
          gain.setValueAtTime(0.0001, now);
          gain.linearRampToValueAtTime(peak, now + 0.006);
          gain.exponentialRampToValueAtTime(0.0001, now + 0.006 + 0.06 + Math.random() * 0.06);
        }
      }
      const roll = Math.random();
      const isTick = roll < 0.36;
      const isPop = !isTick && roll < 0.4;
      if (isTick || isPop) {
        // Unscaled by depth: the crackle belongs to the "record", not the air.
        const peak = isTick ? 0.004 + Math.random() * 0.003 : 0.012;
        const gain = g.crackleGain.gain;
        gain.cancelScheduledValues(now);
        gain.setValueAtTime(0.0001, now);
        gain.linearRampToValueAtTime(peak, now + 0.001);
        gain.exponentialRampToValueAtTime(0.0001, now + (isTick ? 0.003 + Math.random() * 0.004 : 0.016));
      }
      if (airLevel > 0.05 && Math.random() < PLUCK_CHANCE * airLevel) schedulePluck(g);
      // Abyssal bells keep a timed cadence (one every ~8–20 s) rather than a
      // per-tick dice roll — a bell is an event, and two in quick succession
      // reads as a glitch. While near the surface the next strike keeps
      // re-arming a few seconds out, so descending is followed by one soon.
      if (deepLevel <= DEEP_LEVEL * 0.4) {
        nextAbyssBellAt = now + 5 + Math.random() * 6;
      } else if (now >= nextAbyssBellAt) {
        scheduleAbyssBell(g);
        nextAbyssBellAt = now + 6 + Math.random() * 9;
      }
      // The drum cursor ALWAYS advances — gating lives inside scheduleDrumStep
      // — so resurfacing then diving again never triggers a catch-up burst.
      while (nextDrumEighth < now + LOOKAHEAD_S) {
        scheduleDrumStep(g, drumEighthIndex, nextDrumEighth);
        drumEighthIndex = (drumEighthIndex + 1) % 16;
        nextDrumEighth += DRUM_EIGHTH_S;
      }
    }, TICK_MS);
  }

  async function enable() {
    if (suspendTimer !== null) {
      clearTimeout(suspendTimer);
      suspendTimer = null;
    }
    // Must be called from a user gesture — Chrome's autoplay policy blocks
    // AudioContext.resume() otherwise.
    graph ??= buildGraph();
    const g = graph;
    await g.context.resume();
    startTicking(g);
    const now = g.context.currentTime;
    g.master.gain.cancelScheduledValues(now);
    g.master.gain.setValueAtTime(Math.max(g.master.gain.value, 0.0001), now);
    g.master.gain.linearRampToValueAtTime(MASTER_LEVEL, now + FADE_IN_S);
  }

  function disable() {
    const g = graph;
    if (!g) return;
    const now = g.context.currentTime;
    g.master.gain.cancelScheduledValues(now);
    g.master.gain.setValueAtTime(Math.max(g.master.gain.value, 0.0001), now);
    g.master.gain.exponentialRampToValueAtTime(0.0001, now + FADE_OUT_S);
    suspendTimer = window.setTimeout(() => {
      suspendTimer = null;
      void g.context.suspend();
    }, (FADE_OUT_S + 0.2) * 1000);
  }

  function isRunning() {
    return graph?.context.state === "running" && suspendTimer === null;
  }

  function setDepth(next: number) {
    depth = Math.min(1, Math.max(0, next));
    const g = graph;
    if (!g) return;
    applyDepth(g);
    // Waterline crossing detection with hysteresis: the dead band keeps
    // scroll-ease jitter at the line from double-firing, and bandEnteredAt —
    // reset whenever depth sits outside the band — approximates how fast the
    // listener crossed: fast flings hit harder, slow drifts announce softly.
    const now = g.context.currentTime;
    const newSide =
      depth > SUBMERGE_DEPTH + WATERLINE_HYST
        ? "below"
        : depth < SUBMERGE_DEPTH - WATERLINE_HYST
          ? "above"
          : waterlineSide;
    if (waterlineSide === null) {
      waterlineSide = newSide; // first call (e.g. reload mid-page): arm silently
    } else if (newSide !== waterlineSide && newSide !== null) {
      waterlineSide = newSide;
      if (g.context.state === "running" && now - lastWaterlineFireAt >= WATERLINE_COOLDOWN_S) {
        lastWaterlineFireAt = now;
        const crossing = Math.min(0.5, Math.max(0.08, now - bandEnteredAt));
        const t = (0.5 - crossing) / (0.5 - 0.08);
        const speedGain = 0.7 + (1.15 - 0.7) * t;
        const durationScale = 1.15 - (1.15 - 0.75) * t;
        if (newSide === "below") scheduleSubmergeSfx(g, speedGain, durationScale);
        else scheduleResurfaceSfx(g, speedGain, durationScale);
      }
    }
    if (depth <= SUBMERGE_DEPTH - WATERLINE_HYST || depth >= SUBMERGE_DEPTH + WATERLINE_HYST) {
      bandEnteredAt = now;
    }
  }

  function destroy() {
    if (tickTimer !== null) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
    if (suspendTimer !== null) {
      clearTimeout(suspendTimer);
      suspendTimer = null;
    }
    void graph?.context.close();
    graph = null;
  }

  return { enable, disable, isRunning, setDepth, destroy };
}
