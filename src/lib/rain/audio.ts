export type RainAudio = {
  enable: () => Promise<void>;
  disable: () => void;
  setDepth: (depth: number) => void;
  destroy: () => void;
};

const MASTER_LEVEL = 0.32;
const FADE_IN_S = 1.2;
const FADE_OUT_S = 0.6;

// Voicing and underwater values from docs/research/underwater-city/audio-lofi.md:
// two cascaded master lowpasses sweep 3000 Hz (surface, tape-soft top end) down
// to 300 Hz (submerged) along an exponential curve — brightness perception is
// logarithmic, so a linear sweep would bunch all the change at the deep end.
const MUFFLE_SURFACE_HZ = 3000;
const MUFFLE_DEEP_HZ = 300;
const SPARKLE_LEVEL = 0.1;
const RUMBLE_LEVEL = 0.05;
const DEPTH_SMOOTH_S = 0.12;

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

export function createRainAudio(): RainAudio {
  let graph: Graph | null = null;
  let textureTimer: number | null = null;
  let suspendTimer: number | null = null;
  let depth = 0;
  let airLevel = 1;

  function buildGraph(): Graph {
    const context = new AudioContext();

    const noise = context.createBufferSource();
    noise.buffer = pinkNoiseBuffer(context);
    noise.loop = true;

    const body = lowpass(context, 1400, 0.6);
    const bodyGain = context.createGain();
    bodyGain.gain.value = 0.55;

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

    noise.connect(body).connect(bodyGain).connect(muffleA);
    noise.connect(sparkle).connect(sparkleGain).connect(muffleA);
    noise.connect(patter).connect(patterGain).connect(muffleA);
    noise.connect(crackle).connect(crackleGain).connect(muffleA);
    noise.connect(rumble).connect(rumbleGain).connect(muffleA);
    muffleA.connect(muffleB).connect(breath).connect(depthTrim).connect(master).connect(context.destination);

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

    noise.start();
    gust.start();
    breathLfo.start();

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
    };
    applyDepth(built);
    return built;
  }

  function applyDepth(g: Graph) {
    const now = g.context.currentTime;
    const eased = depth * depth * (3 - 2 * depth);
    airLevel = (1 - eased) * (1 - eased);
    const cutoff = MUFFLE_SURFACE_HZ * Math.pow(MUFFLE_DEEP_HZ / MUFFLE_SURFACE_HZ, eased);
    g.muffleA.frequency.setTargetAtTime(cutoff, now, DEPTH_SMOOTH_S);
    g.muffleB.frequency.setTargetAtTime(cutoff, now, DEPTH_SMOOTH_S);
    g.sparkleGain.gain.setTargetAtTime(SPARKLE_LEVEL * airLevel, now, DEPTH_SMOOTH_S);
    g.rumbleGain.gain.setTargetAtTime(RUMBLE_LEVEL * eased, now, DEPTH_SMOOTH_S);
    g.depthTrim.gain.setTargetAtTime(1 - 0.35 * eased, now, DEPTH_SMOOTH_S);
    g.noise.playbackRate.setTargetAtTime(1 - 0.07 * eased, now, DEPTH_SMOOTH_S);
  }

  // Sparse texture events: mid-frequency droplet "plips" plus vinyl-style
  // crackle ticks and pops at subliminal level.
  function startTexture(g: Graph) {
    if (textureTimer !== null) return;
    textureTimer = window.setInterval(() => {
      const now = g.context.currentTime;
      if (Math.random() <= 0.65) {
        const peak = (0.04 + Math.random() * 0.1) * airLevel;
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
        const peak = (isTick ? 0.004 + Math.random() * 0.003 : 0.012) * airLevel;
        if (peak > 0.0005) {
          const gain = g.crackleGain.gain;
          gain.cancelScheduledValues(now);
          gain.setValueAtTime(0.0001, now);
          gain.linearRampToValueAtTime(peak, now + 0.001);
          gain.exponentialRampToValueAtTime(0.0001, now + (isTick ? 0.003 + Math.random() * 0.004 : 0.016));
        }
      }
    }, 110);
  }

  function stopTexture() {
    if (textureTimer !== null) {
      clearInterval(textureTimer);
      textureTimer = null;
    }
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
    startTexture(g);
    const now = g.context.currentTime;
    g.master.gain.cancelScheduledValues(now);
    g.master.gain.setValueAtTime(Math.max(g.master.gain.value, 0.0001), now);
    g.master.gain.linearRampToValueAtTime(MASTER_LEVEL, now + FADE_IN_S);
  }

  function disable() {
    const g = graph;
    if (!g) return;
    stopTexture();
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
    stopTexture();
    if (suspendTimer !== null) {
      clearTimeout(suspendTimer);
      suspendTimer = null;
    }
    void graph?.context.close();
    graph = null;
  }

  return { enable, disable, setDepth, destroy };
}
