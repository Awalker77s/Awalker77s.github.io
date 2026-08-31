export type AtmosphereAudio = {
  enable: () => Promise<void>;
  disable: () => void;
  setDepth: (depth: number) => void;
  destroy: () => void;
};

const MASTER_LEVEL = 1.1;
const FADE_IN_S = 1.2;
const FADE_OUT_S = 0.6;

// Voicing and underwater values from docs/research/underwater-city/audio-lofi.md:
// two cascaded master lowpasses sweep 3000 Hz (surface, tape-soft top end) down
// to 300 Hz along an exponential curve — brightness perception is logarithmic,
// so a linear sweep would bunch all the change at the deep end. The full sweep
// lands by SUBMERGE_DEPTH — the engine's combined depth once the camera is
// fully underwater (it emits 0.4·submersion + 0.6·page depth) — because the
// muffle belongs to crossing the waterline; below it the cutoff holds and only
// depthTrim keeps sinking.
const MUFFLE_SURFACE_HZ = 3000;
const MUFFLE_DEEP_HZ = 300;
const SUBMERGE_DEPTH = 0.4;
const DEPTH_SMOOTH_S = 0.12;

// Rain sits far behind the music now: a light bed, not the subject.
const RAIN_BODY_LEVEL = 0.15;
const SPARKLE_LEVEL = 0.035;
const RUMBLE_LEVEL = 0.03;

const KEYS_LEVEL = 0.32;
const BASS_LEVEL = 0.25;
const PLUCK_PEAK = 0.09;
const CHORD_S = 8;
const GLIDE_S = 0.12;
const LOOKAHEAD_S = 1.2;
const TICK_MS = 125;

// Dm9 → Bbmaj9 → Gm11 → Am7 in D natural minor, beatless — voice-led so each
// of the four key voices moves at most one scale step between chords.
const PROGRESSION = [
  { bass: 73.42, keys: [174.61, 220.0, 261.63, 329.63] },
  { bass: 116.54, keys: [174.61, 220.0, 261.63, 293.66] },
  { bass: 98.0, keys: [174.61, 220.0, 261.63, 293.66] },
  { bass: 110.0, keys: [196.0, 220.0, 261.63, 329.63] },
];
// Higher voices read louder at equal gain, so the stack tapers upward.
const VOICE_LEVELS = [0.24, 0.22, 0.2, 0.17];

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
  depthTrim: GainNode;
  master: GainNode;
  keysOscs: OscillatorNode[];
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
  let chordIndex = 1;
  let nextChordTime = 0;

  function buildGraph(): Graph {
    const context = new AudioContext();

    const noise = context.createBufferSource();
    noise.buffer = pinkNoiseBuffer(context);
    noise.loop = true;

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
    // MASTER_LEVEL sits above unity, so stacked chord + gust + pluck peaks
    // could clip the destination; the limiter shaves only those rare peaks.
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
    // the detune beat plus the wow LFO below is what reads as "tape".
    const keysFilter = lowpass(context, 1800, 0.5);
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
    tremolo.frequency.value = 4.5;
    const tremoloDepth = context.createGain();
    tremoloDepth.gain.value = KEYS_LEVEL * 0.25;
    tremolo.connect(tremoloDepth).connect(keysGain.gain);

    const bassOsc = context.createOscillator();
    bassOsc.type = "sine";
    bassOsc.frequency.value = PROGRESSION[0].bass;
    const bassGain = context.createGain();
    bassGain.gain.value = BASS_LEVEL;
    bassOsc.connect(bassGain).connect(muffleA);

    noise.start();
    gust.start();
    breathLfo.start();
    wow.start();
    tremolo.start();
    bassOsc.start();
    for (const osc of keysOscs) osc.start();

    chordIndex = 1;
    nextChordTime = context.currentTime + CHORD_S;

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
      depthTrim,
      master,
      keysOscs,
      bassOsc,
    };
    applyDepth(built);
    return built;
  }

  function applyDepth(g: Graph) {
    const now = g.context.currentTime;
    const submerge = Math.min(1, depth / SUBMERGE_DEPTH);
    const eased = submerge * submerge * (3 - 2 * submerge);
    const abyss = Math.max(0, (depth - SUBMERGE_DEPTH) / (1 - SUBMERGE_DEPTH));
    airLevel = (1 - eased) * (1 - eased);
    const cutoff = MUFFLE_SURFACE_HZ * Math.pow(MUFFLE_DEEP_HZ / MUFFLE_SURFACE_HZ, eased);
    g.muffleA.frequency.setTargetAtTime(cutoff, now, DEPTH_SMOOTH_S);
    g.muffleB.frequency.setTargetAtTime(cutoff, now, DEPTH_SMOOTH_S);
    g.sparkleGain.gain.setTargetAtTime(SPARKLE_LEVEL * airLevel, now, DEPTH_SMOOTH_S);
    g.rumbleGain.gain.setTargetAtTime(RUMBLE_LEVEL * eased, now, DEPTH_SMOOTH_S);
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
    if (chord.bass !== previous.bass) {
      g.bassOsc.frequency.setValueAtTime(previous.bass, when);
      g.bassOsc.frequency.linearRampToValueAtTime(chord.bass, when + GLIDE_S);
    }
  }

  function schedulePluck(g: Graph) {
    const start = g.context.currentTime + 0.02;
    const sounding = PROGRESSION[(chordIndex + PROGRESSION.length - 1) % PROGRESSION.length];
    const frequency = sounding.keys[Math.floor(Math.random() * sounding.keys.length)] * 2;
    const osc = g.context.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = frequency;
    const envelope = g.context.createGain();
    envelope.gain.value = 0;
    osc.connect(envelope).connect(g.muffleA);
    const peak = PLUCK_PEAK * (0.25 + 0.75 * airLevel);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.linearRampToValueAtTime(peak, start + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + 1.2);
    osc.start(start);
    osc.stop(start + 1.3);
  }

  // One tick drives everything time-based: chord changes scheduled a beat
  // ahead (so a busy main thread never lands a retune late), sparse rain
  // plips, vinyl crackle, and occasional octave-up plucks. While the context
  // is suspended currentTime freezes, so the chord clock holds alignment.
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
      if (Math.random() < 0.025) schedulePluck(g);
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

  function setDepth(next: number) {
    depth = Math.min(1, Math.max(0, next));
    if (graph) applyDepth(graph);
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

  return { enable, disable, setDepth, destroy };
}
