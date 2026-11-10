// The rain engine reports one combined depth in [0, 1]: the first
// WATERLINE_DEPTH of it is the camera crossing the waterline (the first ~0.9
// viewport of scroll), the rest is the page sinking toward the footer. The
// engine, the score, and the depth readout all share this one split.
export const WATERLINE_DEPTH = 0.4;

type DepthListener = (depth: number) => void;

const listeners = new Set<DepthListener>();
let lastDepth = 0;

// Fan-out for the engine's depth callback. Subscribers write straight to the
// DOM (a readout's text) — routing this through React state would re-render
// on every scrolled frame.
export function emitDepth(depth: number) {
  lastDepth = depth;
  for (const listener of listeners) listener(depth);
}

export function subscribeDepth(listener: DepthListener): () => void {
  listeners.add(listener);
  listener(lastDepth);
  return () => {
    listeners.delete(listener);
  };
}

// Page depth → metres, pinned to the same stops as the engine's color ramp
// (docs/research/underwater-city/underwater-scroll.md): red light is gone by
// ~10 m, orange by ~45 m, the last usable light at 200 m, lightless by 1000 m.
// The readout is therefore true to what the water behind it is doing.
const METRE_STOPS: [depth: number, metres: number][] = [
  [0, 0],
  [0.15, 10],
  [0.35, 45],
  [0.55, 200],
  [0.75, 600],
  [1, 1000],
];

export function depthMetres(combined: number): number {
  const below = (combined - WATERLINE_DEPTH) / (1 - WATERLINE_DEPTH);
  if (!(below > 0)) return 0;
  const t = Math.min(1, below);
  for (let i = 1; i < METRE_STOPS.length; i++) {
    const [stopT, stopM] = METRE_STOPS[i];
    if (t <= stopT) {
      const [prevT, prevM] = METRE_STOPS[i - 1];
      return prevM + ((t - prevT) / (stopT - prevT)) * (stopM - prevM);
    }
  }
  return METRE_STOPS[METRE_STOPS.length - 1][1];
}

// Ocean light zones at their real boundaries.
export function depthZone(combined: number): string {
  if (combined < WATERLINE_DEPTH) return "surface";
  const metres = depthMetres(combined);
  if (metres < 200) return "sunlight zone";
  if (metres < 1000) return "twilight zone";
  return "midnight zone";
}
