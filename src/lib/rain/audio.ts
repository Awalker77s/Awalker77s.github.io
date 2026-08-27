export type RainAudio = {
  enable(): Promise<void>;
  disable(): void;
  destroy(): void;
};

type Graph = {
  context: AudioContext;
  master: GainNode;
  patterGain: GainNode;
};

const MASTER_LEVEL = 0.32;
const FADE_IN_SECONDS = 1.2;
const FADE_OUT_SECONDS = 0.6;

function buildGraph(): Graph {
  const context = new AudioContext();

  const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const samples = noiseBuffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  const noise = context.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;

  const body = context.createBiquadFilter();
  body.type = "lowpass";
  body.frequency.value = 1300;
  body.Q.value = 0.4;
  const bodyGain = context.createGain();
  bodyGain.gain.value = 0.5;

  const hiss = context.createBiquadFilter();
  hiss.type = "bandpass";
  hiss.frequency.value = 5200;
  hiss.Q.value = 0.5;
  const hissGain = context.createGain();
  hissGain.gain.value = 0.14;

  const patter = context.createBiquadFilter();
  patter.type = "highpass";
  patter.frequency.value = 3800;
  const patterGain = context.createGain();
  patterGain.gain.value = 0;

  const gust = context.createOscillator();
  gust.type = "sine";
  gust.frequency.value = 0.11;
  const gustDepth = context.createGain();
  gustDepth.gain.value = 320;
  gust.connect(gustDepth).connect(body.frequency);

  const master = context.createGain();
  master.gain.value = 0;

  noise.connect(body).connect(bodyGain).connect(master);
  noise.connect(hiss).connect(hissGain).connect(master);
  noise.connect(patter).connect(patterGain).connect(master);
  master.connect(context.destination);

  noise.start();
  gust.start();

  return { context, master, patterGain };
}

export function createRainAudio(): RainAudio {
  let graph: Graph | null = null;
  let patterTimer: ReturnType<typeof setInterval> | undefined;
  let suspendTimer: ReturnType<typeof setTimeout> | undefined;

  function scheduleDropletBursts({ context, patterGain }: Graph) {
    patterTimer = setInterval(() => {
      if (Math.random() > 0.65) return;
      const now = context.currentTime;
      const peak = 0.04 + Math.random() * 0.1;
      patterGain.gain.cancelScheduledValues(now);
      patterGain.gain.setValueAtTime(patterGain.gain.value, now);
      patterGain.gain.linearRampToValueAtTime(peak, now + 0.006);
      patterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05 + Math.random() * 0.09);
    }, 110);
  }

  // Audible playback requires a user gesture (Chrome autoplay policy):
  // only call enable() from inside a click/pointer handler.
  async function enable() {
    clearTimeout(suspendTimer);
    if (!graph) graph = buildGraph();
    const { context, master } = graph;
    await context.resume();
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(MASTER_LEVEL, now + FADE_IN_SECONDS);
    if (!patterTimer) scheduleDropletBursts(graph);
  }

  function disable() {
    if (!graph) return;
    const { context, master } = graph;
    clearInterval(patterTimer);
    patterTimer = undefined;
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0.0001, now + FADE_OUT_SECONDS);
    suspendTimer = setTimeout(() => void graph?.context.suspend(), (FADE_OUT_SECONDS + 0.2) * 1000);
  }

  function destroy() {
    clearInterval(patterTimer);
    clearTimeout(suspendTimer);
    void graph?.context.close();
    graph = null;
  }

  return { enable, disable, destroy };
}
