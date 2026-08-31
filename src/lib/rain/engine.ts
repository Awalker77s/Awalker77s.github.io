export type RainEngine = {
  start(): void;
  stop(): void;
  renderStaticFrame(): void;
  destroy(): void;
};

type Drop = { x: number; y: number; vx: number; vy: number; layer: number };
type Splash = { x: number; y: number; vx: number; vy: number; life: number };
type Ring = { x: number; radius: number; life: number };
type CityBand = { canvas: HTMLCanvasElement; height: number };
type MutableWindow = { x: number; y: number; w: number; h: number; alpha: number; target: number };
type Beacon = { x: number; y: number; period: number; phase: number };
type Car = { x: number; lane: number; speed: number; size: number; phase: number };
type Flake = { x0: number; y: number; r: number; vy: number; phase: number; drift: number; front: boolean };
type Bubble = { x: number; y: number; vy: number; r: number; phase: number };
type AbyssGlint = { x: number; y: number; period: number; phase: number };

const LAYERS = [
  { speed: 700, drift: 90, length: 13, width: 1, alpha: 0.14, spawnPerSecondPer1000px: 34 },
  { speed: 1050, drift: 130, length: 21, width: 1.3, alpha: 0.26, spawnPerSecondPer1000px: 26 },
  { speed: 1500, drift: 190, length: 32, width: 1.7, alpha: 0.42, spawnPerSecondPer1000px: 17 },
];
const IMPACT_KICK = [0.7, 1.5, 3.0];

// Tension above ~0.03 destabilizes the explicit-Euler water integration.
const TENSION = 0.022;
const DAMPENING = 0.025;
const SPREAD = 0.2;
const SPREAD_PASSES = 6;
const COLUMN_SPACING = 4;
const WATER_FRACTION = 0.14;
const MAX_WAVE_HEIGHT = 18;
const SIM_STEP = 1 / 60;
const SPLASH_GRAVITY = 1100;
const MAX_DPR = 2;

const SKY_TOP = "#060b14";
const SKY_BOTTOM = "#0a1322";
const SKY_BOTTOM_RGB = "10, 19, 34";
const WATER_SURFACE = "#0c1a2b";
const WATER_DEEP_RGB: Rgb = [5, 10, 18];
const STREAK_COLOR = "168, 196, 224";
const SURFACE_GLOW = "103, 224, 255";
const UNDER_LIGHT = "176, 208, 244";
const WINDOW_ALPHAS = [0.2, 0.35, 0.5];

// City parameters from docs/research/underwater-city/city-canvas.md.
const CITY_BANDS = [
  { heightFrac: 0.3, fill: "#0a1220", widthMin: 24, widthMax: 56, gapMin: 2, gapMax: 8, heightPow: 4 },
  { heightFrac: 0.22, fill: "#091020", widthMin: 18, widthMax: 44, gapMin: 2, gapMax: 12, heightPow: 5 },
  { heightFrac: 0.15, fill: "#070d18", widthMin: 30, widthMax: 80, gapMin: 10, gapMax: 26, heightPow: 6 },
];
const MID_CELL_W = 3;
const MID_CELL_H = 4;
const NEAR_CELL_W = 4;
const NEAR_CELL_H = 5;

const CAR_LANES = [
  { y: 0.42, dir: 1, alpha: 0.3, sizeMin: 1.5, sizeMax: 1.5, speedMin: 18, speedMax: 30 },
  { y: 0.55, dir: -1, alpha: 0.4, sizeMin: 2, sizeMax: 2.5, speedMin: 30, speedMax: 55 },
];
const MAX_CARS = 3;

// Depth ramp hexes follow underwater light absorption — red dies first, then
// orange, blue survives longest (docs/research/underwater-city/underwater-scroll.md).
type Rgb = [number, number, number];
const DEPTH_RAMP: { t: number; rgb: Rgb }[] = [
  { t: 0, rgb: [12, 26, 43] },
  { t: 0.15, rgb: [11, 29, 48] },
  { t: 0.35, rgb: [8, 22, 39] },
  { t: 0.55, rgb: [6, 15, 30] },
  { t: 0.75, rgb: [4, 9, 20] },
  { t: 1, rgb: [2, 5, 11] },
];

const GOD_RAYS = [
  { x: 0.09, tilt: 0.1, width: 0.05, peak: 0.05, period: 26, phase: 0 },
  { x: 0.17, tilt: -0.08, width: 0.034, peak: 0.038, period: 34, phase: 2.1 },
  { x: 0.88, tilt: -0.1, width: 0.055, peak: 0.05, period: 30, phase: 4.2 },
];

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function rgbString(rgb: Rgb) {
  return `rgb(${Math.round(rgb[0])}, ${Math.round(rgb[1])}, ${Math.round(rgb[2])})`;
}

function rampRgb(t: number): Rgb {
  const clamped = clamp01(t);
  for (let i = 1; i < DEPTH_RAMP.length; i++) {
    if (clamped <= DEPTH_RAMP[i].t) {
      const a = DEPTH_RAMP[i - 1];
      const b = DEPTH_RAMP[i];
      return mixRgb(a.rgb, b.rgb, (clamped - a.t) / (b.t - a.t));
    }
  }
  return DEPTH_RAMP[DEPTH_RAMP.length - 1].rgb;
}

export function createRainEngine(canvas: HTMLCanvasElement, onDepth?: (depth: number) => void): RainEngine {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("rain engine requires a 2d canvas context");
  const ctx = context;

  let width = 0;
  let height = 0;
  let waterRest = 0;
  let columnCount = 0;
  let heights = new Float32Array(0);
  let velocities = new Float32Array(0);
  let leftDeltas = new Float32Array(0);
  let rightDeltas = new Float32Array(0);
  let skyGradient: CanvasGradient = ctx.createLinearGradient(0, 0, 0, 1);
  let hazeGradient: CanvasGradient = ctx.createLinearGradient(0, 0, 0, 1);
  let fogSprite: HTMLCanvasElement | null = null;

  const drops: Drop[] = [];
  const splashes: Splash[] = [];
  const rings: Ring[] = [];
  const spawnDebt = [0, 0, 0];

  const citySeed = Math.floor(Math.random() * 0xffffffff);
  let cityFar: CityBand | null = null;
  let cityMid: CityBand | null = null;
  let cityNear: CityBand | null = null;
  const mutableWindows: MutableWindow[] = [];
  const beacons: Beacon[] = [];
  const glintXs: number[] = [];
  const cars: Car[] = [];
  const flakes: Flake[] = [];
  const bubbles: Bubble[] = [];
  const abyssGlints: AbyssGlint[] = [];

  let running = false;
  let rafId = 0;
  let staticRafId = 0;
  let resizeTimer = 0;
  let lastTime = 0;
  let accumulator = 0;
  let fogPhase = 0;
  let sceneTime = 0;
  let frameTick = 0;
  let windowToggleIn = 3;
  let carSpawnIn = 4;
  let bubbleIn = 3;

  let scrollYCached = 0;
  let scrollRange = 1;
  let submerge = 0;
  let depth = 0;
  let cameraY = 0;
  let depthSettled = false;
  let lastEmittedDepth = -1;
  let staticRenderedSubmerge = -1;
  let staticRenderedDepth = -1;

  let waterGradient: CanvasGradient = ctx.createLinearGradient(0, 0, 0, 1);
  let waterGradientCameraY = -1;
  let waterGradientSubmerge = -1;
  let abyssGradient: CanvasGradient = ctx.createLinearGradient(0, 0, 0, 1);
  let abyssGradientDepth = -1;

  function refreshScrollRange() {
    scrollRange = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  }

  function resize() {
    refreshScrollRange();
    const rect = canvas.getBoundingClientRect();
    if (rect.width === width && rect.height === height) return;
    width = rect.width;
    height = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    waterRest = height * (1 - WATER_FRACTION);
    columnCount = Math.ceil(width / COLUMN_SPACING) + 1;
    heights = new Float32Array(columnCount);
    velocities = new Float32Array(columnCount);
    leftDeltas = new Float32Array(columnCount);
    rightDeltas = new Float32Array(columnCount);

    skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, SKY_TOP);
    skyGradient.addColorStop(1, SKY_BOTTOM);
    const farTop = waterRest - height * CITY_BANDS[0].heightFrac;
    hazeGradient = ctx.createLinearGradient(0, farTop, 0, waterRest);
    hazeGradient.addColorStop(0, `rgba(${SKY_BOTTOM_RGB}, 0)`);
    hazeGradient.addColorStop(1, `rgba(${SKY_BOTTOM_RGB}, 0.15)`);
    waterGradientCameraY = -1;
    abyssGradientDepth = -1;

    const fogRadius = Math.max(200, Math.round(width * 0.3));
    fogSprite = document.createElement("canvas");
    fogSprite.width = fogRadius * 2;
    fogSprite.height = fogRadius * 2;
    const fogCtx = fogSprite.getContext("2d");
    if (fogCtx) {
      const gradient = fogCtx.createRadialGradient(fogRadius, fogRadius, 0, fogRadius, fogRadius, fogRadius);
      gradient.addColorStop(0, "rgba(120, 150, 190, 0.05)");
      gradient.addColorStop(1, "rgba(120, 150, 190, 0)");
      fogCtx.fillStyle = gradient;
      fogCtx.fillRect(0, 0, fogRadius * 2, fogRadius * 2);
    }

    buildCity(dpr);

    drops.length = 0;
    splashes.length = 0;
    rings.length = 0;
  }

  function makeBandCanvas(bandHeight: number, dpr: number) {
    const band = document.createElement("canvas");
    band.width = Math.max(1, Math.round(width * dpr));
    band.height = Math.max(1, Math.round(bandHeight * dpr));
    const bandCtx = band.getContext("2d");
    if (!bandCtx) throw new Error("rain engine requires 2d contexts for city layers");
    bandCtx.scale(dpr, dpr);
    return { canvas: band, ctx: bandCtx, height: bandHeight };
  }

  function walkBuildings(
    rand: () => number,
    bandHeight: number,
    spec: (typeof CITY_BANDS)[number],
    clusterX: number | null,
  ) {
    const list: { x: number; w: number; h: number }[] = [];
    const minH = Math.max(10, bandHeight * 0.12);
    let x = -20;
    while (x < width + 20) {
      const w = spec.widthMin + rand() * (spec.widthMax - spec.widthMin);
      let h = Math.pow(rand(), spec.heightPow) * (bandHeight - minH) + minH;
      if (clusterX !== null) {
        const d = (x + w / 2 - clusterX) / (width * 0.18);
        h *= 0.6 + 0.7 * Math.exp(-d * d);
      }
      h = Math.min(bandHeight - 8, h);
      list.push({ x, w, h });
      x += w + spec.gapMin + rand() * (spec.gapMax - spec.gapMin);
    }
    return list;
  }

  function bakeWindows(
    bandCtx: CanvasRenderingContext2D,
    rand: () => number,
    rects: { x: number; y: number; w: number; h: number }[],
    cellW: number,
    cellH: number,
    bandHeight: number,
    bandTopWorld: number,
    collectGlints: boolean,
  ) {
    const litRatio = 0.04 + rand() * 0.14;
    for (const rect of rects) {
      const cols = Math.floor((rect.w - 2) / cellW);
      const rows = Math.floor((rect.h - 3) / cellH);
      for (let row = 0; row < rows; row++) {
        let col = 0;
        while (col < cols) {
          if (rand() < litRatio * 0.6) {
            const run = 1 + Math.floor(rand() * 4);
            const alpha = WINDOW_ALPHAS[Math.floor(rand() * WINDOW_ALPHAS.length)];
            bandCtx.fillStyle = `rgba(${STREAK_COLOR}, ${alpha})`;
            for (let k = 0; k < run && col < cols; k++, col++) {
              const wx = rect.x + 1 + col * cellW;
              const wy = rect.y + 2 + row * cellH;
              bandCtx.fillRect(wx, wy, cellW - 1, cellH - 1.5);
              if (collectGlints && alpha >= 0.35 && wy > bandHeight - cellH * 3) glintXs.push(wx);
            }
          } else {
            col++;
          }
        }
      }
      if (mutableWindows.length < 40 && rand() < 0.35 && cols > 0 && rows > 0) {
        const col = Math.floor(rand() * cols);
        const row = Math.floor(rand() * rows);
        mutableWindows.push({
          x: rect.x + 1 + col * cellW,
          y: bandTopWorld + rect.y + 2 + row * cellH,
          w: cellW - 1,
          h: cellH - 1.5,
          alpha: 0,
          target: 0,
        });
      }
    }
  }

  function buildCity(dpr: number) {
    const rand = mulberry32(citySeed);
    mutableWindows.length = 0;
    beacons.length = 0;
    glintXs.length = 0;
    cars.length = 0;
    const clusterX = width * (0.25 + rand() * 0.5);

    const farSpec = CITY_BANDS[0];
    const far = makeBandCanvas(height * farSpec.heightFrac, dpr);
    const farBuildings = walkBuildings(rand, far.height, farSpec, null);
    far.ctx.fillStyle = farSpec.fill;
    for (const b of farBuildings) far.ctx.fillRect(b.x, far.height - b.h, b.w, b.h);
    const pyramidCount = 1 + Math.floor(rand() * 2);
    for (let i = 0; i < pyramidCount; i++) {
      const cx = width * (0.18 + rand() * 0.64);
      const baseHalf = 45 + rand() * 25;
      const apexHalf = 4 + rand() * 4;
      const peak = far.height * (0.75 + rand() * 0.2);
      far.ctx.beginPath();
      far.ctx.moveTo(cx - baseHalf, far.height);
      far.ctx.lineTo(cx - apexHalf, far.height - peak);
      far.ctx.lineTo(cx + apexHalf, far.height - peak);
      far.ctx.lineTo(cx + baseHalf, far.height);
      far.ctx.closePath();
      far.ctx.fill();
    }
    const pinpricks = 3 + Math.floor(rand() * 3);
    far.ctx.fillStyle = `rgba(${STREAK_COLOR}, 0.3)`;
    for (let i = 0; i < pinpricks; i++) {
      const b = farBuildings[Math.floor(rand() * farBuildings.length)];
      far.ctx.fillRect(b.x + rand() * b.w, far.height - b.h + rand() * b.h * 0.7, 1, 1);
    }
    cityFar = { canvas: far.canvas, height: far.height };

    const midSpec = CITY_BANDS[1];
    const mid = makeBandCanvas(height * midSpec.heightFrac, dpr);
    const midTopWorld = waterRest - mid.height;
    const midBuildings = walkBuildings(rand, mid.height, midSpec, clusterX);
    mid.ctx.fillStyle = midSpec.fill;
    for (const b of midBuildings) {
      b.h = Math.max(MID_CELL_H * 3, Math.round(b.h / MID_CELL_H) * MID_CELL_H);
      const rects: { x: number; y: number; w: number; h: number }[] = [];
      if (b.h > mid.height * 0.5 && rand() < 0.75) {
        const baseH = b.h * 0.62;
        const tierH = b.h * 0.24;
        const tierW = b.w * 0.66;
        const capW = b.w * 0.38;
        rects.push({ x: b.x, y: mid.height - baseH, w: b.w, h: baseH });
        rects.push({ x: b.x + (b.w - tierW) / 2, y: mid.height - baseH - tierH, w: tierW, h: tierH });
        rects.push({ x: b.x + (b.w - capW) / 2, y: mid.height - b.h, w: capW, h: b.h - baseH - tierH });
      } else {
        rects.push({ x: b.x, y: mid.height - b.h, w: b.w, h: b.h });
      }
      for (const rect of rects) mid.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      bakeWindows(mid.ctx, rand, rects, MID_CELL_W, MID_CELL_H, mid.height, midTopWorld, false);
      mid.ctx.fillStyle = midSpec.fill;
    }
    const byHeight = [...midBuildings].sort((a, b) => b.h - a.h);
    const antennaCount = Math.max(1, Math.floor(byHeight.length * 0.15));
    const beaconTarget = 2 + Math.floor(rand() * 3);
    for (let i = 0; i < antennaCount; i++) {
      const b = byHeight[i];
      const len = 6 + rand() * 8;
      const cx = b.x + b.w / 2;
      mid.ctx.fillRect(cx - 0.5, mid.height - b.h - len, 1, len);
      const farEnough = beacons.every((beacon) => Math.abs(beacon.x - cx) > width * 0.12);
      if (beacons.length < beaconTarget && farEnough) {
        beacons.push({ x: cx, y: waterRest - b.h - len, period: 3 + rand() * 2, phase: rand() * Math.PI * 2 });
      }
    }
    cityMid = { canvas: mid.canvas, height: mid.height };

    const nearSpec = CITY_BANDS[2];
    const near = makeBandCanvas(height * nearSpec.heightFrac, dpr);
    const nearTopWorld = waterRest - near.height;
    const nearBuildings = walkBuildings(rand, near.height, nearSpec, null);
    near.ctx.fillStyle = nearSpec.fill;
    for (const b of nearBuildings) {
      b.h = Math.max(NEAR_CELL_H * 3, Math.round(b.h / NEAR_CELL_H) * NEAR_CELL_H);
      near.ctx.fillRect(b.x, near.height - b.h, b.w, b.h);
      const clutterCount = 1 + Math.floor(rand() * 3);
      for (let i = 0; i < clutterCount; i++) {
        const cw = 2 + rand() * 4;
        const ch = 2 + rand() * 3;
        near.ctx.fillRect(b.x + rand() * Math.max(1, b.w - cw), near.height - b.h - ch, cw, ch);
      }
      bakeWindows(
        near.ctx,
        rand,
        [{ x: b.x, y: near.height - b.h, w: b.w, h: b.h }],
        NEAR_CELL_W,
        NEAR_CELL_H,
        near.height,
        nearTopWorld,
        true,
      );
      near.ctx.fillStyle = nearSpec.fill;
    }
    cityNear = { canvas: near.canvas, height: near.height };

    glintXs.sort((a, b) => a - b);
    let write = 0;
    let lastX = -Infinity;
    for (const x of glintXs) {
      if (write >= 12) break;
      if (x - lastX < 36) continue;
      glintXs[write++] = x;
      lastX = x;
    }
    glintXs.length = write;

    const flakeCount = Math.round(Math.min(90, Math.max(28, (width / 1440) * 70)));
    flakes.length = 0;
    for (let i = 0; i < flakeCount; i++) {
      const front = i >= flakeCount * 0.6;
      flakes.push({
        x0: rand() * width,
        y: rand() * height,
        r: front ? 1.4 + rand() * 1.1 : 0.7 + rand() * 0.7,
        vy: front ? 9 + rand() * 6 : 5 + rand() * 4,
        phase: rand() * Math.PI * 2,
        drift: 3 + rand() * 3,
        front,
      });
    }

    abyssGlints.length = 0;
    for (let i = 0; i < 6; i++) {
      abyssGlints.push({
        x: rand() * width,
        y: height * (0.12 + rand() * 0.75),
        period: 4 + rand() * 5,
        phase: rand() * Math.PI * 2,
      });
    }
  }

  function columnAt(x: number) {
    const column = Math.round(x / COLUMN_SPACING);
    return Math.max(0, Math.min(columnCount - 1, column));
  }

  function surfaceYAt(x: number) {
    return waterRest + heights[columnAt(x)];
  }

  function spawnDrops(dt: number) {
    for (let layer = 0; layer < LAYERS.length; layer++) {
      const spec = LAYERS[layer];
      spawnDebt[layer] += spec.spawnPerSecondPer1000px * (width / 1000) * dt;
      while (spawnDebt[layer] >= 1) {
        spawnDebt[layer] -= 1;
        drops.push({
          x: Math.random() * (width + 200) - 100,
          y: -40 - Math.random() * height * 0.3,
          vx: spec.drift * (0.8 + Math.random() * 0.4),
          vy: spec.speed * (0.85 + Math.random() * 0.3),
          layer,
        });
      }
    }
  }

  function splashAt(drop: Drop, surface: number) {
    const column = columnAt(drop.x);
    const kick = IMPACT_KICK[drop.layer];
    velocities[column] += kick;
    if (column > 0) velocities[column - 1] += kick * 0.5;
    if (column < columnCount - 1) velocities[column + 1] += kick * 0.5;

    if (drop.layer >= 1) rings.push({ x: drop.x, radius: 2, life: 1 });
    if (drop.layer === 2) {
      const count = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const angle = ((-150 + Math.random() * 120) * Math.PI) / 180;
        const magnitude = 90 + Math.random() * 160;
        splashes.push({
          x: drop.x,
          y: surface - 1,
          vx: Math.cos(angle) * magnitude + drop.vx * 0.1,
          vy: Math.sin(angle) * magnitude,
          life: 0.55,
        });
      }
    }
  }

  function stepDrops() {
    let write = 0;
    for (let read = 0; read < drops.length; read++) {
      const drop = drops[read];
      drop.x += drop.vx * SIM_STEP;
      drop.y += drop.vy * SIM_STEP;
      const surface = surfaceYAt(drop.x);
      if (drop.y >= surface) {
        splashAt(drop, surface);
      } else {
        drops[write++] = drop;
      }
    }
    drops.length = write;
  }

  function stepWater() {
    for (let i = 0; i < columnCount; i++) {
      velocities[i] += -TENSION * heights[i] - velocities[i] * DAMPENING;
      heights[i] += velocities[i];
      if (heights[i] > MAX_WAVE_HEIGHT) heights[i] = MAX_WAVE_HEIGHT;
      else if (heights[i] < -MAX_WAVE_HEIGHT) heights[i] = -MAX_WAVE_HEIGHT;
    }
    for (let pass = 0; pass < SPREAD_PASSES; pass++) {
      for (let i = 0; i < columnCount; i++) {
        if (i > 0) {
          leftDeltas[i] = SPREAD * (heights[i] - heights[i - 1]);
          velocities[i - 1] += leftDeltas[i];
        }
        if (i < columnCount - 1) {
          rightDeltas[i] = SPREAD * (heights[i] - heights[i + 1]);
          velocities[i + 1] += rightDeltas[i];
        }
      }
      for (let i = 0; i < columnCount; i++) {
        if (i > 0) heights[i - 1] += leftDeltas[i];
        if (i < columnCount - 1) heights[i + 1] += rightDeltas[i];
      }
    }
  }

  function stepSplashes() {
    let write = 0;
    for (let read = 0; read < splashes.length; read++) {
      const splash = splashes[read];
      splash.vy += SPLASH_GRAVITY * SIM_STEP;
      splash.x += splash.vx * SIM_STEP;
      splash.y += splash.vy * SIM_STEP;
      splash.life -= SIM_STEP;
      if (splash.life > 0 && splash.y < surfaceYAt(splash.x) + 4) {
        splashes[write++] = splash;
      }
    }
    splashes.length = write;

    write = 0;
    for (let read = 0; read < rings.length; read++) {
      const ring = rings[read];
      ring.radius += 40 * SIM_STEP;
      ring.life -= 1.4 * SIM_STEP;
      if (ring.life > 0) rings[write++] = ring;
    }
    rings.length = write;
  }

  function stepScene() {
    sceneTime += SIM_STEP;

    windowToggleIn -= SIM_STEP;
    if (windowToggleIn <= 0 && mutableWindows.length > 0) {
      windowToggleIn = 2 + Math.random() * 4;
      const pick = mutableWindows[Math.floor(Math.random() * mutableWindows.length)];
      pick.target = pick.target > 0 ? 0 : WINDOW_ALPHAS[Math.floor(Math.random() * WINDOW_ALPHAS.length)];
    }
    for (const window_ of mutableWindows) {
      window_.alpha += (window_.target - window_.alpha) * Math.min(1, SIM_STEP / 0.35);
    }

    carSpawnIn -= SIM_STEP;
    if (carSpawnIn <= 0) {
      carSpawnIn = 6 + Math.random() * 8;
      if (Math.random() >= 0.2 && cars.length < MAX_CARS) {
        const laneIndex = Math.random() < 0.5 ? 0 : 1;
        const lane = CAR_LANES[laneIndex];
        cars.push({
          x: lane.dir > 0 ? -40 : width + 40,
          lane: laneIndex,
          speed: lane.speedMin + Math.random() * (lane.speedMax - lane.speedMin),
          size: lane.sizeMin + Math.random() * (lane.sizeMax - lane.sizeMin),
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
    let write = 0;
    for (const car of cars) {
      car.x += CAR_LANES[car.lane].dir * car.speed * SIM_STEP;
      const margin = 80 + car.speed * 0.35;
      if (car.x > -margin && car.x < width + margin) cars[write++] = car;
    }
    cars.length = write;

    if (submerge > 0.6) {
      const sinkScale = 1 - 0.35 * depth;
      for (const flake of flakes) {
        flake.y += flake.vy * sinkScale * SIM_STEP;
        if (flake.y > height + 4) {
          flake.y = -4;
          flake.x0 = Math.random() * width;
        }
      }
    }

    const surfaceScreenY = waterRest - cameraY;
    if (submerge > 0.95 && depth < 0.2) {
      bubbleIn -= SIM_STEP;
      if (bubbleIn <= 0) {
        bubbleIn = 2.5 + Math.random() * 3;
        if (bubbles.length < 2) {
          bubbles.push({
            x: Math.random() * width,
            y: height + 8,
            vy: 30 + Math.random() * 30,
            r: 1.3 + Math.random(),
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    }
    write = 0;
    for (const bubble of bubbles) {
      bubble.y -= bubble.vy * SIM_STEP;
      if (bubble.y > surfaceScreenY + 6 && bubble.y > -8) bubbles[write++] = bubble;
    }
    bubbles.length = write;
  }

  // Camera model: the first ~0.9 viewport of scroll dips the eye below the
  // surface; the rest of the page maps to depth 0 -> 1 (abyss at the footer).
  function updateDepth(dt: number) {
    const submergeRange = Math.max(height * 0.9, 1);
    const targetSubmerge = clamp01(scrollYCached / submergeRange);
    const targetDepth = clamp01((scrollYCached - submergeRange) / Math.max(scrollRange - submergeRange, 1));
    if (!depthSettled) {
      submerge = targetSubmerge;
      depth = targetDepth;
      depthSettled = true;
    } else {
      const blend = 1 - Math.exp(-dt * 8);
      submerge += (targetSubmerge - submerge) * blend;
      depth += (targetDepth - depth) * blend;
    }
    const eased = submerge * submerge * (3 - 2 * submerge);
    cameraY = eased * (waterRest + MAX_WAVE_HEIGHT + 24);
    if (onDepth) {
      const combined = clamp01(submerge * 0.4 + depth * 0.6);
      if (lastEmittedDepth < 0 || Math.abs(combined - lastEmittedDepth) > 0.003) {
        lastEmittedDepth = combined;
        onDepth(combined);
      }
    }
  }

  function renderFog() {
    if (!fogSprite) return;
    const size = fogSprite.width;
    const driftX = Math.sin(fogPhase * 0.05) * width * 0.1;
    const driftX2 = Math.cos(fogPhase * 0.037) * width * 0.12;
    ctx.drawImage(fogSprite, width * 0.15 + driftX - size / 2, height * 0.35 - size / 2);
    ctx.drawImage(fogSprite, width * 0.7 + driftX2 - size / 2, height * 0.6 - size / 2);
  }

  function renderDrops() {
    ctx.lineCap = "round";
    for (let layer = 0; layer < LAYERS.length; layer++) {
      const spec = LAYERS[layer];
      ctx.strokeStyle = `rgba(${STREAK_COLOR}, ${spec.alpha})`;
      ctx.lineWidth = spec.width;
      ctx.beginPath();
      for (const drop of drops) {
        if (drop.layer !== layer) continue;
        const trailScale = spec.length / drop.vy;
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.vx * trailScale, drop.y - spec.length);
      }
      ctx.stroke();
    }
  }

  function drawCityBands() {
    if (!cityFar || !cityMid || !cityNear) return;
    ctx.drawImage(cityFar.canvas, 0, Math.floor(waterRest - cityFar.height), width, cityFar.height);
    ctx.drawImage(cityMid.canvas, 0, Math.floor(waterRest - cityMid.height), width, cityMid.height);
    ctx.fillStyle = hazeGradient;
    ctx.fillRect(0, waterRest - cityFar.height, width, cityFar.height);
    ctx.drawImage(cityNear.canvas, 0, Math.floor(waterRest - cityNear.height), width, cityNear.height);
  }

  function renderCityOverlays(staticMode: boolean) {
    for (const window_ of mutableWindows) {
      if (window_.alpha < 0.01) continue;
      ctx.fillStyle = `rgba(${STREAK_COLOR}, ${window_.alpha})`;
      ctx.fillRect(window_.x, window_.y, window_.w, window_.h);
    }
    for (const beacon of beacons) {
      const pulse = staticMode
        ? 0.32
        : 0.15 + 0.35 * (0.5 + 0.5 * Math.sin((Math.PI * 2 * sceneTime) / beacon.period + beacon.phase));
      ctx.fillStyle = `rgba(${SURFACE_GLOW}, ${pulse * 0.25})`;
      ctx.beginPath();
      ctx.arc(beacon.x, beacon.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${SURFACE_GLOW}, ${pulse})`;
      ctx.beginPath();
      ctx.arc(beacon.x, beacon.y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!staticMode) renderCars();
  }

  function renderCars() {
    ctx.lineCap = "round";
    for (const car of cars) {
      const lane = CAR_LANES[car.lane];
      const y = height * lane.y + Math.sin((Math.PI * 2 * sceneTime) / 5 + car.phase) * 2;
      const tailX = car.x - lane.dir * car.speed * 0.35;
      const trail = ctx.createLinearGradient(tailX, y, car.x, y);
      trail.addColorStop(0, `rgba(${STREAK_COLOR}, 0)`);
      trail.addColorStop(1, `rgba(${STREAK_COLOR}, ${lane.alpha})`);
      ctx.strokeStyle = trail;
      ctx.lineWidth = car.size;
      ctx.beginPath();
      ctx.moveTo(tailX, y);
      ctx.lineTo(car.x, y);
      ctx.stroke();
      ctx.fillStyle = `rgba(${STREAK_COLOR}, 0.15)`;
      ctx.beginPath();
      ctx.arc(car.x, y, car.size * 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${STREAK_COLOR}, ${Math.min(1, lane.alpha + 0.25)})`;
      ctx.beginPath();
      ctx.arc(car.x, y, car.size * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function ensureWaterGradient() {
    if (Math.abs(cameraY - waterGradientCameraY) < 0.5 && Math.abs(submerge - waterGradientSubmerge) < 0.004) return;
    waterGradientCameraY = cameraY;
    waterGradientSubmerge = submerge;
    waterGradient = ctx.createLinearGradient(0, waterRest - 20, 0, height + cameraY + 20);
    waterGradient.addColorStop(0, WATER_SURFACE);
    waterGradient.addColorStop(1, rgbString(mixRgb(WATER_DEEP_RGB, rampRgb(0.2), submerge)));
  }

  function renderWater() {
    ensureWaterGradient();
    const floor = height + cameraY;
    ctx.beginPath();
    ctx.moveTo(0, floor);
    ctx.lineTo(0, waterRest + heights[0]);
    for (let i = 1; i < columnCount; i++) {
      ctx.lineTo(i * COLUMN_SPACING, waterRest + heights[i]);
    }
    ctx.lineTo(width, floor);
    ctx.closePath();
    ctx.fillStyle = waterGradient;
    ctx.fill();

    if (submerge > 0.05) {
      const ceiling = ctx.createLinearGradient(0, waterRest, 0, waterRest + 70);
      ceiling.addColorStop(0, `rgba(${UNDER_LIGHT}, ${0.1 * submerge})`);
      ceiling.addColorStop(1, `rgba(${UNDER_LIGHT}, 0)`);
      ctx.fillStyle = ceiling;
      ctx.fillRect(0, waterRest, width, 70);
    }

    ctx.beginPath();
    ctx.moveTo(0, waterRest + heights[0]);
    for (let i = 1; i < columnCount; i++) {
      ctx.lineTo(i * COLUMN_SPACING, waterRest + heights[i]);
    }
    ctx.strokeStyle = `rgba(${SURFACE_GLOW}, 0.08)`;
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.strokeStyle = `rgba(${SURFACE_GLOW}, 0.28)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.lineWidth = 1;
    for (const x of glintXs) {
      const displacement = heights[columnAt(x)];
      const alpha = 0.06 + 0.1 * clamp01(0.5 + displacement / MAX_WAVE_HEIGHT);
      const top = waterRest + displacement + 2;
      ctx.strokeStyle = `rgba(${STREAK_COLOR}, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, top + 9 + Math.abs(displacement) * 0.5);
      ctx.stroke();
    }
  }

  function renderRings() {
    ctx.lineWidth = 1;
    for (const ring of rings) {
      ctx.strokeStyle = `rgba(140, 180, 215, ${0.2 * ring.life})`;
      ctx.beginPath();
      ctx.ellipse(ring.x, surfaceYAt(ring.x), ring.radius, ring.radius * 0.28, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function renderSplashes() {
    for (const splash of splashes) {
      ctx.fillStyle = `rgba(190, 215, 240, ${splash.life})`;
      ctx.beginPath();
      ctx.arc(splash.x, splash.y, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function ensureAbyssGradient() {
    if (Math.abs(depth - abyssGradientDepth) < 0.004) return;
    abyssGradientDepth = depth;
    abyssGradient = ctx.createLinearGradient(0, 0, 0, height);
    abyssGradient.addColorStop(0, rgbString(rampRgb(depth)));
    abyssGradient.addColorStop(1, rgbString(rampRgb(Math.min(1, depth + 0.2))));
  }

  function renderAbyss() {
    ensureAbyssGradient();
    ctx.fillStyle = abyssGradient;
    ctx.fillRect(0, 0, width, height);
    const glow = 0.1 * Math.max(0, 1 - depth / 0.55);
    if (glow > 0.005) {
      const ceiling = ctx.createLinearGradient(0, 0, 0, 90);
      ceiling.addColorStop(0, `rgba(${UNDER_LIGHT}, ${glow})`);
      ceiling.addColorStop(1, `rgba(${UNDER_LIGHT}, 0)`);
      ctx.fillStyle = ceiling;
      ctx.fillRect(0, 0, width, 90);
    }
  }

  function renderUnderwater(staticMode: boolean, surfaceScreenY: number) {
    const rayLevel = clamp01((submerge - 0.55) / 0.45) * Math.max(0, 1 - depth / 0.55);
    const snowLevel = clamp01((submerge - 0.75) / 0.25);
    const glintLevel = clamp01((depth - 0.72) / 0.14);
    if (rayLevel < 0.01 && snowLevel < 0.01 && glintLevel < 0.01 && bubbles.length === 0) return;

    const clipTop = Math.max(0, surfaceScreenY);
    ctx.save();
    if (clipTop > 0) {
      ctx.beginPath();
      ctx.rect(0, clipTop, width, height - clipTop);
      ctx.clip();
    }

    if (rayLevel > 0.01) {
      ctx.globalCompositeOperation = "lighter";
      for (const ray of GOD_RAYS) {
        const sway = staticMode ? 0 : Math.sin((Math.PI * 2 * sceneTime) / ray.period + ray.phase) * 0.045;
        const topX = ray.x * width;
        const bottomX = topX + (ray.tilt + sway) * height;
        const topHalf = ray.width * width * 0.5;
        const bottomHalf = topHalf * 2.6;
        const rayTop = Math.max(surfaceScreenY, -12);
        const beam = ctx.createLinearGradient(0, rayTop, 0, height * 0.9);
        beam.addColorStop(0, `rgba(${UNDER_LIGHT}, ${ray.peak * rayLevel})`);
        beam.addColorStop(1, `rgba(${UNDER_LIGHT}, 0)`);
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(topX - topHalf, rayTop);
        ctx.lineTo(topX + topHalf, rayTop);
        ctx.lineTo(bottomX + bottomHalf, height);
        ctx.lineTo(bottomX - bottomHalf, height);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    }

    if (snowLevel > 0.01) {
      const alphaScale = snowLevel * (0.85 + 0.3 * depth);
      for (const front of [false, true]) {
        ctx.fillStyle = `rgba(190, 212, 235, ${(front ? 0.26 : 0.14) * alphaScale})`;
        ctx.beginPath();
        for (const flake of flakes) {
          if (flake.front !== front) continue;
          const x = flake.x0 + Math.sin(sceneTime * 0.35 + flake.phase) * flake.drift;
          ctx.moveTo(x + flake.r, flake.y);
          ctx.arc(x, flake.y, flake.r, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    }

    if (!staticMode && bubbles.length > 0) {
      ctx.strokeStyle = `rgba(190, 215, 240, ${0.3 * clamp01(1 - depth / 0.25)})`;
      ctx.lineWidth = 1;
      for (const bubble of bubbles) {
        ctx.beginPath();
        ctx.arc(bubble.x + Math.sin(sceneTime * 2.2 + bubble.phase) * 2.5, bubble.y, bubble.r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (glintLevel > 0.01) {
      for (const glint of abyssGlints) {
        const wave = staticMode ? 0.5 : Math.sin((Math.PI * 2 * sceneTime) / glint.period + glint.phase);
        const alpha = Math.pow(Math.max(0, wave), 3) * 0.5 * glintLevel;
        if (alpha < 0.02) continue;
        ctx.fillStyle = `rgba(${SURFACE_GLOW}, ${alpha})`;
        ctx.fillRect(glint.x, glint.y, 1.4, 1.4);
      }
    }

    ctx.restore();
  }

  function render(staticMode: boolean) {
    const surfaceScreenY = waterRest - cameraY;
    if (surfaceScreenY >= -(MAX_WAVE_HEIGHT + 10)) {
      ctx.save();
      ctx.translate(0, -cameraY);
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, width, height);
      drawCityBands();
      renderCityOverlays(staticMode);
      renderFog();
      renderDrops();
      renderWater();
      renderRings();
      renderSplashes();
      ctx.restore();
    } else {
      renderAbyss();
    }
    renderUnderwater(staticMode, surfaceScreenY);
  }

  function frame(now: number) {
    if (!running) return;
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    accumulator += dt;
    let steps = 0;
    while (accumulator >= SIM_STEP && steps < 4) {
      spawnDrops(SIM_STEP);
      stepDrops();
      stepWater();
      stepSplashes();
      stepScene();
      fogPhase += SIM_STEP;
      accumulator -= SIM_STEP;
      steps++;
    }
    if (steps === 4) accumulator = 0;
    if ((frameTick++ & 127) === 0) refreshScrollRange();
    updateDepth(dt);
    render(false);
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    resize();
    scrollYCached = window.scrollY;
    running = true;
    lastTime = performance.now();
    accumulator = 0;
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  function renderStaticFrame() {
    resize();
    scrollYCached = window.scrollY;
    depthSettled = false;
    updateDepth(0);
    heights.fill(0);
    drops.length = 0;
    splashes.length = 0;
    rings.length = 0;
    staticRenderedSubmerge = submerge;
    staticRenderedDepth = depth;
    render(true);
  }

  function handleScroll() {
    scrollYCached = window.scrollY;
    if (running || staticRafId !== 0) return;
    staticRafId = requestAnimationFrame(() => {
      staticRafId = 0;
      depthSettled = false;
      updateDepth(0);
      if (
        Math.abs(submerge - staticRenderedSubmerge) > 0.008 ||
        Math.abs(depth - staticRenderedDepth) > 0.008
      ) {
        staticRenderedSubmerge = submerge;
        staticRenderedDepth = depth;
        heights.fill(0);
        render(true);
      }
    });
  }

  function handleResize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resize();
      if (!running) renderStaticFrame();
    }, 150);
  }

  function handleVisibilityChange() {
    if (!running) return;
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      lastTime = performance.now();
      accumulator = 0;
      rafId = requestAnimationFrame(frame);
    }
  }

  window.addEventListener("resize", handleResize);
  window.addEventListener("scroll", handleScroll, { passive: true });
  document.addEventListener("visibilitychange", handleVisibilityChange);

  function destroy() {
    stop();
    window.clearTimeout(resizeTimer);
    cancelAnimationFrame(staticRafId);
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("scroll", handleScroll);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  }

  return { start, stop, renderStaticFrame, destroy };
}
