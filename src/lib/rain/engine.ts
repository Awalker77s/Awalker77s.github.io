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
type Billboard = { x: number; y: number; w: number; h: number; rgb: string; on: number; flickerIn: number };
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
const WATER_SURFACE = "#0c1a2b";
const WATER_DEEP_RGB: Rgb = [5, 10, 18];
const STREAK_COLOR = "168, 196, 224";
const SURFACE_GLOW = "103, 224, 255";
const UNDER_LIGHT = "176, 208, 244";
const WINDOW_ALPHAS = [0.2, 0.35, 0.5];

// Neon palette per the cyberpunk-skyline research pass: cyan + magenta is the
// signature tension pair, sodium amber is the warm third note, violet carries
// the haze. Cyan stays dominant so the city still belongs to the site accent.
const NEON_CYAN = "103, 224, 255"; // #67e0ff
const NEON_MAGENTA = "255, 46, 154"; // #ff2e9a
const NEON_AMBER = "255, 157, 61"; // #ff9d3d
const NEON_VIOLET = "180, 107, 255"; // #b46bff
const NEON_CORE = "216, 250, 255"; // #d8faff — hottest inner glow
const HAZE_VIOLET = "47, 27, 77"; // #2f1b4d — atmospheric bands between layers

// The city stands on a shore strip above the waterline — a dark embankment
// mass separating the neon from the sea, so the skyline never reads as
// wading in the water. Kept slim (was 0.1): a tall shore pushed the towers
// up into the hero text, which mattered more than the extra elevation.
const SHORE_FRACTION = 0.035;

// City parameters from docs/research/underwater-city/city-canvas.md, fills
// re-tuned to the indigo silhouettes the cyberpunk pass calls for.
const CITY_BANDS = [
  { heightFrac: 0.3, fill: "#0d1830", widthMin: 24, widthMax: 56, gapMin: 2, gapMax: 8, heightPow: 4 },
  { heightFrac: 0.22, fill: "#131c33", widthMin: 18, widthMax: 44, gapMin: 2, gapMax: 12, heightPow: 5 },
  { heightFrac: 0.15, fill: "#1b2947", widthMin: 30, widthMax: 80, gapMin: 10, gapMax: 26, heightPow: 6 },
];
const MID_CELL_W = 3;
const MID_CELL_H = 4;
const NEAR_CELL_W = 4;
const NEAR_CELL_H = 5;

// Window light distribution (cool megacity: cyan dominant, warm sodium pockets,
// rare magenta) — picked per lit-run, weights cumulative.
const WINDOW_PALETTE: { rgb: string; upTo: number }[] = [
  { rgb: NEON_CYAN, upTo: 0.7 },
  { rgb: NEON_AMBER, upTo: 0.9 },
  { rgb: NEON_MAGENTA, upTo: 1 },
];
const BILLBOARD_COLORS = [NEON_MAGENTA, NEON_VIOLET, NEON_AMBER, NEON_CYAN];

// Ambient swell (render-only, never enters the spring integrator): three
// superposed traveling sines — long swell, cross-swell, fine chop — with
// deep-water-ish speed ordering. Amplitudes stay conservative so the sea reads
// "calm night with life" and raindrop ripples keep their own visual band.
const SWELL = [
  { ampFrac: 0.07, wavelenFrac: 1.3, speed: 10, seed: 0 },
  { ampFrac: 0.035, wavelenFrac: 0.55, speed: 22, seed: 1.7 },
  { ampFrac: 0.015, wavelenFrac: 0.14, speed: 38, seed: 3.4 },
];

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

export function createRainEngine(
  canvas: HTMLCanvasElement,
  onDepth?: (depth: number) => void,
  blimpSkills: string[] = [],
): RainEngine {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("rain engine requires a 2d canvas context");
  const ctx = context;
  const coarsePointer = typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;

  let width = 0;
  let height = 0;
  let isMobile = false;
  let bakeDpr = 1;
  let builtCityWidth = -1;
  let builtCityDpr = -1;
  let waterRest = 0;
  let groundY = 0;
  let columnCount = 0;
  let heights = new Float32Array(0);
  let velocities = new Float32Array(0);
  let leftDeltas = new Float32Array(0);
  let rightDeltas = new Float32Array(0);
  let skyGradient: CanvasGradient = ctx.createLinearGradient(0, 0, 0, 1);
  let hazeGradient: CanvasGradient = ctx.createLinearGradient(0, 0, 0, 1);
  // City light-pollution bouncing off the low cloud deck: two radial washes
  // biased right-of-center, where the hero text isn't. This is what keeps the
  // sky from cutting hard from skyline to flat black.
  let cityGlowViolet: CanvasGradient = ctx.createLinearGradient(0, 0, 0, 1);
  let cityGlowCyan: CanvasGradient = ctx.createLinearGradient(0, 0, 0, 1);
  let spire: { x: number; topY: number; tipY: number } | null = null;
  let fogSprite: HTMLCanvasElement | null = null;

  const drops: Drop[] = [];
  const splashes: Splash[] = [];
  const rings: Ring[] = [];
  const spawnDebt = [0, 0, 0];

  const citySeed = Math.floor(Math.random() * 0xffffffff);
  let cityFar: CityBand | null = null;
  let cityMid: CityBand | null = null;
  let cityNear: CityBand | null = null;
  let shoreBand: CityBand | null = null;
  let reflectionSprite: HTMLCanvasElement | null = null;
  let surfaceYs = new Float32Array(0);
  const billboards: Billboard[] = [];
  const mutableWindows: MutableWindow[] = [];
  const beacons: Beacon[] = [];
  const glintXs: number[] = [];
  // Colored light sources whose glow lies on the water as shimmering streaks —
  // baked positions (billboards, promenade lamps); live sources (hero signs,
  // beacons, spire tip) are read from their own arrays at draw time.
  const waterLights: { x: number; rgb: string; strength: number; phase: number }[] = [];
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

  // One skill blimp crosses the top band at a time, cycling the skill list.
  type SkillBlimp = {
    x: number;
    dir: 1 | -1;
    speed: number;
    sprite: HTMLCanvasElement;
    w: number;
    h: number;
    bobPhase: number;
  };
  const BLIMP_ACCENTS = [NEON_CYAN, NEON_MAGENTA, NEON_AMBER, NEON_VIOLET];
  let blimp: SkillBlimp | null = null;
  let blimpGapIn = 4;
  let blimpSkillIndex = 0;
  let blimpSpawnDir: 1 | -1 = 1;

  let scrollYCached = 0;
  let scrollRange = 1;
  let submerge = 0;
  let depth = 0;
  let cameraY = 0;
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
    const prevGroundY = groundY;
    const prevWaterRest = waterRest;
    const prevColumnCount = columnCount;
    width = rect.width;
    height = rect.height;
    isMobile = width < 768;
    // Mobile GPUs pay per pixel: cap DPR at 1.5 on small/touch screens —
    // visually indistinguishable at phone sizes, ~44% fewer pixels than 2.
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile || coarsePointer ? 1.5 : MAX_DPR);
    bakeDpr = dpr;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    waterRest = height * (1 - WATER_FRACTION);
    groundY = waterRest - height * SHORE_FRACTION;
    columnCount = Math.ceil(width / COLUMN_SPACING) + 1;
    // Ripple state survives any resize that keeps the column count (all
    // height-only changes): reallocating here flattened the surface on every
    // browser-chrome resize, a visible pop mid-scroll.
    if (columnCount !== prevColumnCount) {
      heights = new Float32Array(columnCount);
      surfaceYs = new Float32Array(columnCount);
      velocities = new Float32Array(columnCount);
      leftDeltas = new Float32Array(columnCount);
      rightDeltas = new Float32Array(columnCount);
    }

    skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, SKY_TOP);
    skyGradient.addColorStop(1, SKY_BOTTOM);
    cityGlowViolet = ctx.createRadialGradient(width * 0.68, groundY + 10, 0, width * 0.68, groundY + 10, height * 0.55);
    cityGlowViolet.addColorStop(0, `rgba(${HAZE_VIOLET}, 0.34)`);
    cityGlowViolet.addColorStop(0.55, `rgba(${HAZE_VIOLET}, 0.12)`);
    cityGlowViolet.addColorStop(1, `rgba(${HAZE_VIOLET}, 0)`);
    cityGlowCyan = ctx.createRadialGradient(width * 0.82, groundY, 0, width * 0.82, groundY, height * 0.3);
    cityGlowCyan.addColorStop(0, `rgba(${NEON_CYAN}, 0.05)`);
    cityGlowCyan.addColorStop(1, `rgba(${NEON_CYAN}, 0)`);
    // Violet atmosphere pooling between the parallax layers — the haze is what
    // makes the depth read (and half the cyberpunk look).
    const farTop = groundY - height * CITY_BANDS[0].heightFrac;
    hazeGradient = ctx.createLinearGradient(0, farTop, 0, groundY);
    hazeGradient.addColorStop(0, `rgba(${HAZE_VIOLET}, 0)`);
    hazeGradient.addColorStop(0.65, `rgba(${HAZE_VIOLET}, 0.16)`);
    hazeGradient.addColorStop(1, `rgba(${NEON_CYAN}, 0.05)`);
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

    // iOS Safari's toolbar collapse fires height-only resizes constantly
    // while scrolling; rebaking the whole city for those wastes real CPU on
    // exactly the frames that can least afford it. Bands keep their old
    // pixel heights on a height-only change (they're bottom-anchored at the
    // new groundY, so the few-percent drift is invisible); everything
    // height-derived above was just rebuilt regardless.
    if (width !== builtCityWidth || dpr !== builtCityDpr) {
      buildCity(dpr);
      builtCityWidth = width;
      builtCityDpr = dpr;
      drops.length = 0;
      splashes.length = 0;
      rings.length = 0;
    } else {
      // Height-only change (a phone's browser chrome collapsing mid-scroll):
      // the band sprites are bottom-anchored, so drawCityBands slides them to
      // the new groundY — but the live overlays (hero signs, beacons, mutable
      // windows, the spire) were baked with absolute scene-space y. They must
      // slide the same distance or they detach and float in the sky (seen on
      // a real phone 2026-08-31: an orange sign hovering over the hero
      // buttons). Splashes ride the water surface, whose rest line moves by
      // its own delta; rings/drops/waterLights carry no baked y.
      const bandShift = groundY - prevGroundY;
      const surfaceShift = waterRest - prevWaterRest;
      if (bandShift !== 0) {
        for (const sign of billboards) sign.y += bandShift;
        for (const beacon of beacons) beacon.y += bandShift;
        for (const window_ of mutableWindows) window_.y += bandShift;
        if (spire) {
          spire.topY += bandShift;
          spire.tipY += bandShift;
        }
      }
      if (surfaceShift !== 0) {
        for (const splash of splashes) splash.y += surfaceShift;
      }
    }
  }

  function makeSpriteCanvas(w: number, h: number, dpr: number) {
    const sprite = document.createElement("canvas");
    sprite.width = Math.max(1, Math.round(w * dpr));
    sprite.height = Math.max(1, Math.round(h * dpr));
    const spriteCtx = sprite.getContext("2d");
    if (!spriteCtx) throw new Error("2d context unavailable for sprite");
    spriteCtx.scale(dpr, dpr);
    return { canvas: sprite, ctx: spriteCtx };
  }

  // Bakes one complete blimp (hull + fins + pods + lit skill screen) into a
  // sprite. One bake per spawn (~every 20-40s), one canvas alive at a time —
  // so per-skill sprite caches and their memory cost are unnecessary, and the
  // screen's glow is baked here rather than spending runtime shadowBlur.
  function bakeBlimpSprite(skill: string, dir: 1 | -1, accent: string) {
    const scale = isMobile ? 0.75 : 1;
    const font = `600 ${Math.round(13 * scale)}px ui-monospace, "Cascadia Code", Consolas, monospace`;
    const probe = makeSpriteCanvas(8, 8, 1).ctx;
    probe.font = font;
    const screenW = probe.measureText(skill).width + 26 * scale;
    const hullL = Math.min(210 * scale, Math.max(132 * scale, screenW / 0.7));
    const hullH = hullL * 0.16;
    const pad = 14 * scale;
    const w = hullL + pad * 2;
    const h = hullH * 2.4;
    const { canvas: spriteCanvas, ctx: c } = makeSpriteCanvas(w, h, bakeDpr);
    const cx = w / 2;
    const cy = h / 2;

    // Hull, fins, pods, and lights face the travel direction (mirrored for
    // leftward flights); the screen is drawn after the restore so its text
    // never mirrors.
    c.save();
    if (dir < 0) {
      c.translate(w, 0);
      c.scale(-1, 1);
    }
    const hullGrad = c.createLinearGradient(0, cy - hullH / 2, 0, cy + hullH / 2);
    hullGrad.addColorStop(0, "#16233c");
    hullGrad.addColorStop(0.45, "#0d1626");
    hullGrad.addColorStop(1, "#080d17");
    c.fillStyle = hullGrad;
    c.beginPath();
    c.ellipse(cx, cy, hullL / 2, hullH / 2, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = `rgba(${accent}, 0.4)`;
    c.lineWidth = 1;
    c.stroke();
    // Twin canted tail fins.
    c.fillStyle = "#101b30";
    c.strokeStyle = `rgba(${NEON_CYAN}, 0.25)`;
    for (const flip of [-1, 1]) {
      c.beginPath();
      c.moveTo(cx - hullL * 0.34, cy + flip * hullH * 0.2);
      c.lineTo(cx - hullL * 0.52 - 4 * scale, cy + flip * hullH * 1.05);
      c.lineTo(cx - hullL * 0.44, cy + flip * hullH * 0.1);
      c.closePath();
      c.fill();
      c.stroke();
    }
    // Engine pods slung under the hull, amber exhaust dots trailing.
    for (const px of [cx - hullL * 0.16, cx + hullL * 0.14]) {
      c.fillStyle = "#0b1120";
      c.beginPath();
      c.ellipse(px, cy + hullH * 0.62, 7 * scale, 3 * scale, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = `rgba(${NEON_AMBER}, 0.7)`;
      c.fillRect(px - 9 * scale, cy + hullH * 0.62 - 0.75, 1.5, 1.5);
    }
    // Nose light (cyan, baked halo) and tail-fin light (magenta).
    c.fillStyle = `rgba(${NEON_CYAN}, 0.25)`;
    c.beginPath();
    c.arc(cx + hullL * 0.48, cy, 3, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = `rgba(${NEON_CYAN}, 0.8)`;
    c.beginPath();
    c.arc(cx + hullL * 0.48, cy, 1.3, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = `rgba(${NEON_MAGENTA}, 0.6)`;
    c.fillRect(cx - hullL * 0.51, cy - hullH * 1.02, 1.4, 1.4);
    c.restore();

    // The skill screen: dark glass, scanlines, accent frame, glowing label.
    const sh = hullH * 0.85;
    const sx = cx - screenW / 2;
    const sy = cy - sh / 2;
    const screenBg = c.createLinearGradient(0, sy, 0, sy + sh);
    screenBg.addColorStop(0, "#050a14");
    screenBg.addColorStop(1, "#0a1626");
    c.fillStyle = screenBg;
    c.fillRect(sx, sy, screenW, sh);
    c.fillStyle = `rgba(${NEON_CYAN}, 0.05)`;
    for (let ly = sy + 1.5; ly < sy + sh; ly += 3) c.fillRect(sx, ly, screenW, 1);
    c.strokeStyle = `rgba(${accent}, 0.55)`;
    c.lineWidth = 1;
    c.strokeRect(sx + 0.5, sy + 0.5, screenW - 1, sh - 1);
    c.font = font;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.shadowColor = `rgba(${accent}, 0.8)`;
    c.shadowBlur = 4;
    c.fillStyle = `rgba(${NEON_CORE}, 0.88)`;
    c.fillText(skill, cx, cy + 0.5);
    c.shadowBlur = 0;

    return { canvas: spriteCanvas, w, h };
  }

  function blimpLaneY() {
    // Between the nav bar and the hero eyebrow on every viewport.
    return Math.max(74, height * 0.095);
  }

  function spawnBlimp() {
    const skill = blimpSkills[blimpSkillIndex % blimpSkills.length];
    const accent = BLIMP_ACCENTS[blimpSkillIndex % BLIMP_ACCENTS.length];
    blimpSkillIndex++;
    const dir = blimpSpawnDir;
    blimpSpawnDir = dir === 1 ? -1 : 1;
    const baked = bakeBlimpSprite(skill, dir, accent);
    blimp = {
      x: dir > 0 ? -baked.w - 10 : width + 10,
      dir,
      speed: (isMobile ? 12 : 16) + Math.random() * (isMobile ? 3 : 6),
      sprite: baked.canvas,
      w: baked.w,
      h: baked.h,
      bobPhase: Math.random() * Math.PI * 2,
    };
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
            // Whole runs share one neon hue — a floor of offices, not confetti.
            const roll = rand();
            const rgb = (WINDOW_PALETTE.find((p) => roll < p.upTo) ?? WINDOW_PALETTE[0]).rgb;
            bandCtx.fillStyle = `rgba(${rgb}, ${alpha})`;
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
    waterLights.length = 0;
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
    const midTopWorld = groundY - mid.height;
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
      // Rim light: a thin cyan edge on each tier's lit side, baked once.
      mid.ctx.strokeStyle = `rgba(${NEON_CYAN}, 0.32)`;
      mid.ctx.lineWidth = 1;
      for (const rect of rects) {
        mid.ctx.beginPath();
        mid.ctx.moveTo(rect.x + 0.5, rect.y + rect.h);
        mid.ctx.lineTo(rect.x + 0.5, rect.y + 0.5);
        mid.ctx.lineTo(rect.x + rect.w, rect.y + 0.5);
        mid.ctx.stroke();
      }
      bakeWindows(mid.ctx, rand, rects, MID_CELL_W, MID_CELL_H, mid.height, midTopWorld, false);
      mid.ctx.fillStyle = midSpec.fill;
    }
    // Holo-billboards: saturated color blocks with baked glow — at this scale a
    // flat rect plus bloom reads as a distant ad without needing glyphs.
    const midBillboardCount = 3 + Math.floor(rand() * 2);
    for (let i = 0; i < midBillboardCount; i++) {
      const b = midBuildings[Math.floor(rand() * midBuildings.length)];
      if (b.h < mid.height * 0.35) continue;
      const bw = 6 + rand() * 10;
      const bh = 3 + rand() * 5;
      const bx = b.x + 2 + rand() * Math.max(1, b.w - bw - 4);
      const by = mid.height - b.h + 4 + rand() * (b.h * 0.5);
      const rgb = BILLBOARD_COLORS[Math.floor(rand() * BILLBOARD_COLORS.length)];
      mid.ctx.save();
      mid.ctx.shadowColor = `rgba(${rgb}, 0.9)`;
      mid.ctx.shadowBlur = 14;
      mid.ctx.fillStyle = `rgba(${rgb}, 0.85)`;
      mid.ctx.fillRect(bx, by, bw, bh);
      mid.ctx.restore();
      mid.ctx.fillStyle = `rgba(${NEON_CORE}, 0.5)`;
      mid.ctx.fillRect(bx + 1, by + 1, bw - 2, 1);
      waterLights.push({ x: bx + bw / 2, rgb, strength: 0.5, phase: rand() * Math.PI * 2 });
    }
    const byHeight = [...midBuildings].sort((a, b) => b.h - a.h);
    const antennaCount = Math.max(1, Math.floor(byHeight.length * 0.15));
    const beaconTarget = 2 + Math.floor(rand() * 3);
    for (let i = 0; i < antennaCount; i++) {
      const b = byHeight[i];
      const len = 6 + rand() * 8;
      const cx = b.x + b.w / 2;
      mid.ctx.fillRect(cx - 0.5, mid.height - b.h - len, 1, len);
      mid.ctx.save();
      mid.ctx.shadowColor = `rgba(${NEON_CYAN}, 0.8)`;
      mid.ctx.shadowBlur = 8;
      mid.ctx.fillStyle = `rgba(${NEON_CYAN}, 0.7)`;
      mid.ctx.fillRect(cx - 1, mid.height - b.h - len - 1, 2, 2);
      mid.ctx.restore();
      const farEnough = beacons.every((beacon) => Math.abs(beacon.x - cx) > width * 0.12);
      if (beacons.length < beaconTarget && farEnough) {
        beacons.push({ x: cx, y: groundY - b.h - len, period: 3 + rand() * 2, phase: rand() * Math.PI * 2 });
      }
    }
    cityMid = { canvas: mid.canvas, height: mid.height };

    const nearSpec = CITY_BANDS[2];
    const near = makeBandCanvas(height * nearSpec.heightFrac, dpr);
    const nearTopWorld = groundY - near.height;
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
      near.ctx.strokeStyle =
        rand() < 0.25 ? `rgba(${NEON_MAGENTA}, 0.22)` : `rgba(${NEON_CYAN}, 0.4)`;
      near.ctx.lineWidth = 1;
      near.ctx.beginPath();
      near.ctx.moveTo(b.x + 0.5, near.height);
      near.ctx.lineTo(b.x + 0.5, near.height - b.h + 0.5);
      near.ctx.lineTo(b.x + b.w, near.height - b.h + 0.5);
      near.ctx.stroke();
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
    // Signal spire: one near-band tower right-of-center gets a thin antenna
    // reaching into the empty upper-right sky. Drawn live in the overlays —
    // it pokes far above this band's canvas, so it can't be baked here.
    let mast: { x: number; w: number; h: number } | null = null;
    for (const b of nearBuildings) {
      const cx = b.x + b.w / 2;
      if (cx < width * 0.7 || cx > width * 0.88) continue;
      if (!mast || b.h > mast.h) mast = b;
    }
    spire = mast
      ? {
          x: Math.round(mast.x + mast.w / 2) + 0.5,
          topY: groundY - mast.h,
          tipY: Math.max(height * 0.14, groundY - mast.h - height * 0.26),
        }
      : null;

    // Street-level neon bounce pooling at the base of the near band.
    const wash = near.ctx.createLinearGradient(0, near.height * 0.85, 0, near.height);
    wash.addColorStop(0, `rgba(${NEON_CYAN}, 0)`);
    wash.addColorStop(1, `rgba(${NEON_CYAN}, 0.08)`);
    near.ctx.fillStyle = wash;
    near.ctx.fillRect(0, near.height * 0.85, width, near.height * 0.15);
    cityNear = { canvas: near.canvas, height: near.height };

    // Hero billboards live outside the bake: they flicker at runtime (the one
    // capped use of live glow the performance budget allows).
    billboards.length = 0;
    const heroSorted = [...nearBuildings].sort((a, b) => b.h - a.h);
    for (let i = 0; i < Math.min(2, heroSorted.length); i++) {
      const b = heroSorted[i];
      const bw = Math.min(26, b.w * 0.55);
      const bh = 8 + rand() * 6;
      billboards.push({
        x: b.x + (b.w - bw) / 2,
        y: groundY - b.h + 6 + rand() * (b.h * 0.3),
        w: bw,
        h: bh,
        rgb: rand() < 0.55 ? NEON_MAGENTA : NEON_AMBER,
        on: 1,
        flickerIn: 3 + rand() * 3,
      });
    }

    // The shore the city stands on: a near-black embankment mass between the
    // ground line and the water, with a sparse row of tiny quay lights — this
    // strip is what keeps the skyline visibly ABOVE the sea.
    const shoreH = waterRest - groundY;
    const shore = makeBandCanvas(shoreH, dpr);
    const shoreFill = shore.ctx.createLinearGradient(0, 0, 0, shoreH);
    shoreFill.addColorStop(0, "#101b30");
    shoreFill.addColorStop(0.45, "#0b1322");
    shoreFill.addColorStop(1, "#070c16");
    shore.ctx.fillStyle = shoreFill;
    shore.ctx.fillRect(0, 0, width, shoreH);
    // Street-level promenade edge where the city meets the embankment.
    shore.ctx.fillStyle = `rgba(${NEON_CYAN}, 0.16)`;
    shore.ctx.fillRect(0, 0, width, 1.5);
    shore.ctx.fillStyle = "#0d1626";
    let sx = -10;
    while (sx < width + 10) {
      const sw = 26 + rand() * 60;
      const sh = 4 + rand() * Math.min(12, shoreH * 0.26);
      shore.ctx.fillRect(sx, 2, sw, sh);
      sx += sw + rand() * 18;
    }
    // Promenade lamps: an amber dot at street level with a faint pool of
    // light beneath — plus scattered cyan quay lights lower down.
    let px = 20 + rand() * 40;
    while (px < width) {
      const pool = shore.ctx.createRadialGradient(px, 4, 0, px, 4, 10);
      pool.addColorStop(0, `rgba(${NEON_AMBER}, 0.5)`);
      pool.addColorStop(1, `rgba(${NEON_AMBER}, 0)`);
      shore.ctx.fillStyle = pool;
      shore.ctx.fillRect(px - 10, 0, 20, 14);
      shore.ctx.fillStyle = `rgba(${NEON_AMBER}, 0.9)`;
      shore.ctx.fillRect(px - 0.8, 2.5, 1.6, 1.6);
      // Street lamps sit right over the quay, so they throw the strongest
      // color onto the water below.
      waterLights.push({ x: px, rgb: NEON_AMBER, strength: 0.7, phase: rand() * Math.PI * 2 });
      px += 70 + rand() * 110;
    }
    shore.ctx.fillStyle = `rgba(${NEON_CYAN}, 0.5)`;
    let lx = 14 + rand() * 30;
    while (lx < width) {
      shore.ctx.fillRect(lx, shoreH * 0.3 + rand() * shoreH * 0.35, 1.6, 1.6);
      lx += 40 + rand() * 80;
    }
    const quayEdge = shore.ctx.createLinearGradient(0, shoreH - 5, 0, shoreH);
    quayEdge.addColorStop(0, `rgba(${NEON_CYAN}, 0)`);
    quayEdge.addColorStop(1, `rgba(${NEON_CYAN}, 0.24)`);
    shore.ctx.fillStyle = quayEdge;
    shore.ctx.fillRect(0, shoreH - 5, width, 5);
    shoreBand = { canvas: shore.canvas, height: shoreH };

    // Reflection sprite: the lit lower stretch of the skyline, flipped and
    // pre-faded, so the water can carry the neon. The dark embankment is
    // deliberately skipped — mirroring it drowned the signs in black; the
    // stylized "city on the water" reads better than optical truth here.
    const reflectSrcH = Math.min(180, near.height);
    const reflect = makeBandCanvas(reflectSrcH, dpr);
    reflect.ctx.save();
    reflect.ctx.translate(0, reflectSrcH);
    reflect.ctx.scale(1, -1);
    // Band bottoms (street level) land at the sprite top after the flip.
    reflect.ctx.drawImage(mid.canvas, 0, 0, width * dpr, mid.height * dpr, 0, reflectSrcH - mid.height, width, mid.height);
    reflect.ctx.drawImage(near.canvas, 0, 0, width * dpr, near.height * dpr, 0, reflectSrcH - near.height, width, near.height);
    reflect.ctx.restore();
    const fade = reflect.ctx.createLinearGradient(0, 0, 0, reflectSrcH);
    fade.addColorStop(0, "rgba(0, 0, 0, 0.5)");
    fade.addColorStop(0.55, "rgba(0, 0, 0, 0.16)");
    fade.addColorStop(1, "rgba(0, 0, 0, 0)");
    reflect.ctx.globalCompositeOperation = "destination-in";
    reflect.ctx.fillStyle = fade;
    reflect.ctx.fillRect(0, 0, width, reflectSrcH);
    reflect.ctx.globalCompositeOperation = "source-over";
    reflectionSprite = reflect.canvas;

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

    // Phones get a thinned, evenly spread light set — the streak pass is the
    // whole reflection story there (the column-blit sprite is desktop-only).
    const maxLights = isMobile ? 9 : 24;
    if (waterLights.length > maxLights) {
      const stride = waterLights.length / maxLights;
      for (let i = 0; i < maxLights; i++) waterLights[i] = waterLights[Math.floor(i * stride)];
      waterLights.length = maxLights;
    }

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

  // Ambient swell — a pure function of (x, sceneTime) ADDED at draw/collision
  // time, never fed into the spring integrator, so the ripple physics can't
  // be destabilized and the two motions just sum (GPU Gems sum-of-sines).
  function swellAt(x: number, timeScale = 1, ampScale = 1) {
    const bandH = height * WATER_FRACTION;
    const t = sceneTime * timeScale;
    let y = 0;
    for (const w of SWELL) {
      const k = (2 * Math.PI) / (w.wavelenFrac * width);
      const drift = 0.03 * Math.sin(t * 0.03 + w.seed);
      y += w.ampFrac * ampScale * bandH * Math.sin(k * x - k * w.speed * t + w.seed + drift);
    }
    return y;
  }

  function surfaceYAt(x: number) {
    return waterRest + heights[columnAt(x)] + swellAt(x);
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

    for (const sign of billboards) {
      sign.flickerIn -= SIM_STEP;
      if (sign.flickerIn <= 0) {
        sign.on = sign.on < 1 ? 1 : 0.4;
        sign.flickerIn = sign.on < 1 ? 0.05 + Math.random() * 0.08 : 3 + Math.random() * 3;
      }
    }

    // One blimp at a time crossing the top band; the sky pauses (not
    // despawns) while the camera is underwater.
    if (blimpSkills.length > 0 && submerge < 0.98) {
      if (blimp) {
        blimp.x += blimp.dir * blimp.speed * SIM_STEP;
        if (blimp.x > width + 20 || blimp.x + blimp.w < -20) {
          blimp = null;
          blimpGapIn = 10 + Math.random() * 12;
        }
      } else {
        blimpGapIn -= SIM_STEP;
        if (blimpGapIn <= 0) spawnBlimp();
      }
    }

    carSpawnIn -= SIM_STEP;
    if (carSpawnIn <= 0) {
      carSpawnIn = 6 + Math.random() * 8;
      if (Math.random() >= 0.2 && cars.length < (isMobile ? 1 : MAX_CARS)) {
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
  // No easing here of ANY kind — wheel smoothing already lives in
  // src/lib/scroll.ts, and the mapping must stay LINEAR in scrollY: the total
  // camera travel (~0.88·h + 26px) over 0.9·h of scroll is ~1:1 with the page,
  // so the surface rides with the text. A smoothstep here (tried) makes the
  // water sit still near the top while the text moves, then outrun it 1.5×
  // mid-dip — the "doesn't flow with the words" complaint.
  function updateDepth() {
    const submergeRange = Math.max(height * 0.9, 1);
    submerge = clamp01(scrollYCached / submergeRange);
    depth = clamp01((scrollYCached - submergeRange) / Math.max(scrollRange - submergeRange, 1));
    // Margin covers physics chop + the additive swell so no crest peeks back
    // into frame at full submerge. Scale-invariant: max swell amplitude is
    // 0.12 of the water band, which grows with viewport height (a fixed
    // margin was mathematically exceeded above ~1310px-tall viewports).
    cameraY = submerge * (waterRest + MAX_WAVE_HEIGHT + height * WATER_FRACTION * 0.12 + 8);
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
    if (!cityFar || !cityMid || !cityNear || !shoreBand) return;
    ctx.fillStyle = cityGlowViolet;
    ctx.fillRect(0, 0, width, groundY);
    ctx.fillStyle = cityGlowCyan;
    ctx.fillRect(0, 0, width, groundY);
    ctx.drawImage(cityFar.canvas, 0, Math.floor(groundY - cityFar.height), width, cityFar.height);
    ctx.drawImage(cityMid.canvas, 0, Math.floor(groundY - cityMid.height), width, cityMid.height);
    ctx.fillStyle = hazeGradient;
    ctx.fillRect(0, groundY - cityFar.height, width, cityFar.height);
    ctx.drawImage(cityNear.canvas, 0, Math.floor(groundY - cityNear.height), width, cityNear.height);
    ctx.drawImage(shoreBand.canvas, 0, Math.floor(groundY), width, shoreBand.height);
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
    if (blimp) {
      const bobAmp = isMobile ? 3 : 5;
      const y = blimpLaneY() + Math.sin((Math.PI * 2 * sceneTime) / 7 + blimp.bobPhase) * bobAmp - blimp.h / 2;
      ctx.drawImage(blimp.sprite, blimp.x, y, blimp.w, blimp.h);
    }
    if (spire) {
      ctx.strokeStyle = `rgba(${STREAK_COLOR}, 0.16)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(spire.x, spire.topY);
      ctx.lineTo(spire.x, spire.tipY);
      ctx.stroke();
      const midY = spire.tipY + (spire.topY - spire.tipY) * 0.45;
      ctx.fillStyle = `rgba(${NEON_CYAN}, 0.35)`;
      ctx.fillRect(spire.x - 0.7, midY, 1.4, 1.4);
      const pulse = staticMode ? 0.4 : 0.22 + 0.4 * (0.5 + 0.5 * Math.sin((Math.PI * 2 * sceneTime) / 6));
      ctx.fillStyle = `rgba(${NEON_AMBER}, ${pulse * 0.3})`;
      ctx.beginPath();
      ctx.arc(spire.x, spire.tipY, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${NEON_AMBER}, ${pulse})`;
      ctx.beginPath();
      ctx.arc(spire.x, spire.tipY, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    // The two hero signs are the only live glow in the scene — everything else
    // is baked. Flicker drops them to 40% for a few frames every few seconds.
    for (const sign of billboards) {
      const level = staticMode ? 1 : sign.on;
      ctx.save();
      ctx.shadowColor = `rgba(${sign.rgb}, ${0.85 * level})`;
      ctx.shadowBlur = 12;
      ctx.fillStyle = `rgba(${sign.rgb}, ${0.85 * level})`;
      ctx.fillRect(sign.x, sign.y, sign.w, sign.h);
      ctx.restore();
      ctx.fillStyle = `rgba(${NEON_CORE}, ${0.55 * level})`;
      ctx.fillRect(sign.x + 2, sign.y + 2, sign.w - 4, 1.5);
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

    // Back swell layer: slower, smaller, a touch higher — parallax makes the
    // main surface read as the near edge of a body of water, not a line.
    // Skipped on mobile: at phone widths the parallax sliver is ~2px of
    // barely-visible fill that still costs a per-column sine pass.
    if (!isMobile) {
      ctx.beginPath();
      ctx.moveTo(0, waterRest + 30);
      for (let i = 0; i < columnCount; i++) {
        const x = i * COLUMN_SPACING;
        ctx.lineTo(x, waterRest - 5 + heights[i] * 0.5 + swellAt(x, 0.5, 0.6));
      }
      ctx.lineTo(width, waterRest + 30);
      ctx.closePath();
      ctx.fillStyle = "rgba(9, 16, 30, 0.9)";
      ctx.fill();
    }

    // Main surface polyline (physics heights + visual swell), cached for the
    // stroke/foam passes below.
    for (let i = 0; i < columnCount; i++) {
      surfaceYs[i] = waterRest + heights[i] + swellAt(i * COLUMN_SPACING);
    }
    ctx.beginPath();
    ctx.moveTo(0, floor);
    ctx.lineTo(0, surfaceYs[0]);
    for (let i = 1; i < columnCount; i++) {
      ctx.lineTo(i * COLUMN_SPACING, surfaceYs[i]);
    }
    ctx.lineTo(width, floor);
    ctx.closePath();
    ctx.fillStyle = waterGradient;
    ctx.fill();

    // Neon skyline reflection: narrow columns of the baked flipped sprite,
    // each riding its own column's surface so the image shimmers with the
    // waves. Skipped once mostly submerged — the surface has left the frame.
    if (reflectionSprite && !isMobile && submerge < 0.6) {
      const colW = 7;
      const scale = reflectionSprite.width / width;
      const srcH = reflectionSprite.height / scale;
      ctx.save();
      ctx.globalAlpha = 0.35 * (1 - submerge / 0.6);
      for (let x = 0; x < width; x += colW) {
        const i = columnAt(x + colW * 0.5);
        const top = surfaceYs[i] + (heights[i] + swellAt(x, 1, 0.4)) * 0.6;
        ctx.drawImage(reflectionSprite, x * scale, 0, colW * scale, reflectionSprite.height, x, top, colW, srcH);
      }
      ctx.restore();
    }

    // Neon bleed: every bright source lays a shimmering colored streak on the
    // water — the reflection of the LIGHTS, where the sprite above mirrors the
    // architecture. Additive blend so overlapping colors bloom; each streak
    // rides its column's surface and sways/breathes on its own phase. Runs on
    // mobile too (cheap), where it is the only reflection layer.
    if (submerge < 0.6) {
      const fade = 1 - submerge / 0.6;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const drawStreak = (x: number, rgb: string, strength: number, phase: number) => {
        if (strength < 0.03 || x < 2 || x > width - 2) return;
        const i = columnAt(x);
        const displacement = surfaceYs[i] - waterRest;
        const sway = Math.sin(sceneTime * 1.7 + phase);
        const top = surfaceYs[i] + 1.5;
        const len =
          (22 + strength * 60) * (1 + 0.25 * Math.sin(sceneTime * 0.9 + phase * 1.7)) +
          Math.abs(displacement) * 0.8;
        const alpha = strength * fade * (0.26 + 0.14 * (0.5 + 0.5 * sway));
        const streak = ctx.createLinearGradient(0, top, 0, top + len);
        streak.addColorStop(0, `rgba(${rgb}, ${alpha})`);
        streak.addColorStop(1, `rgba(${rgb}, 0)`);
        ctx.fillStyle = streak;
        const streakW = 2 + strength * 2.4;
        ctx.fillRect(x - streakW / 2 + sway * 1.2, top, streakW, len);
      };
      for (const light of waterLights) drawStreak(light.x, light.rgb, light.strength, light.phase);
      for (const sign of billboards) drawStreak(sign.x + sign.w / 2, sign.rgb, 0.9 * sign.on, sign.x * 0.1);
      for (const beacon of beacons) {
        const pulse = 0.15 + 0.35 * (0.5 + 0.5 * Math.sin((Math.PI * 2 * sceneTime) / beacon.period + beacon.phase));
        drawStreak(beacon.x, SURFACE_GLOW, pulse * 1.2, beacon.phase);
      }
      if (spire) {
        const pulse = 0.22 + 0.4 * (0.5 + 0.5 * Math.sin((Math.PI * 2 * sceneTime) / 6));
        drawStreak(spire.x, NEON_AMBER, pulse, 1.3);
      }
      ctx.restore();
    }

    if (submerge > 0.05) {
      const ceiling = ctx.createLinearGradient(0, waterRest, 0, waterRest + 70);
      ceiling.addColorStop(0, `rgba(${UNDER_LIGHT}, ${0.1 * submerge})`);
      ceiling.addColorStop(1, `rgba(${UNDER_LIGHT}, 0)`);
      ctx.fillStyle = ceiling;
      ctx.fillRect(0, waterRest, width, 70);
    }

    ctx.beginPath();
    ctx.moveTo(0, surfaceYs[0]);
    for (let i = 1; i < columnCount; i++) {
      ctx.lineTo(i * COLUMN_SPACING, surfaceYs[i]);
    }
    ctx.strokeStyle = `rgba(${SURFACE_GLOW}, 0.08)`;
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.strokeStyle = `rgba(${SURFACE_GLOW}, 0.28)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Crest foam: a brighter dash wherever the surface tops out (slope flips
    // rising -> falling in screen space) with enough prominence to matter.
    ctx.strokeStyle = `rgba(${SURFACE_GLOW}, 0.4)`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 1; i < columnCount - 1; i++) {
      const y = surfaceYs[i];
      if (y >= surfaceYs[i - 1] || y > surfaceYs[i + 1]) continue;
      if ((surfaceYs[i - 1] + surfaceYs[i + 1]) / 2 - y < 0.55) continue;
      const x = i * COLUMN_SPACING;
      ctx.moveTo(x - COLUMN_SPACING * 0.8, y + 0.5);
      ctx.lineTo(x + COLUMN_SPACING * 0.8, y + 0.5);
    }
    ctx.stroke();

    ctx.lineWidth = 1;
    for (const x of glintXs) {
      const i = columnAt(x);
      const displacement = surfaceYs[i] - waterRest;
      const alpha = 0.06 + 0.1 * clamp01(0.5 + displacement / MAX_WAVE_HEIGHT);
      const top = surfaceYs[i] + 2;
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
    updateDepth();
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
    updateDepth();
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
      updateDepth();
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
  // iOS Safari's dynamic toolbar is inconsistent about firing plain resize;
  // visualViewport is the reliable signal for that class of height change.
  window.visualViewport?.addEventListener("resize", handleResize);
  window.addEventListener("scroll", handleScroll, { passive: true });
  document.addEventListener("visibilitychange", handleVisibilityChange);

  function destroy() {
    stop();
    window.clearTimeout(resizeTimer);
    cancelAnimationFrame(staticRafId);
    window.removeEventListener("resize", handleResize);
    window.visualViewport?.removeEventListener("resize", handleResize);
    window.removeEventListener("scroll", handleScroll);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  }

  return { start, stop, renderStaticFrame, destroy };
}
