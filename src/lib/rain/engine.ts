export type RainEngine = {
  start(): void;
  stop(): void;
  renderStaticFrame(): void;
  destroy(): void;
};

type Drop = { x: number; y: number; vx: number; vy: number; layer: number };
type Splash = { x: number; y: number; vx: number; vy: number; life: number };
type Ring = { x: number; radius: number; life: number };

const LAYERS = [
  { speed: 700, drift: 90, length: 13, width: 1, alpha: 0.14, spawnPerSecondPer1000px: 34 },
  { speed: 1050, drift: 130, length: 21, width: 1.3, alpha: 0.26, spawnPerSecondPer1000px: 26 },
  { speed: 1500, drift: 190, length: 32, width: 1.7, alpha: 0.42, spawnPerSecondPer1000px: 17 },
];
const IMPACT_KICK = [0.7, 1.5, 3.0];

// Spring-column constants from docs/research/rain-atmosphere/findings.md;
// tension above ~0.03 destabilizes the explicit-Euler integration.
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
const WATER_DEEP = "#050a12";
const STREAK_COLOR = "168, 196, 224";
const SURFACE_GLOW = "103, 224, 255";

export function createRainEngine(canvas: HTMLCanvasElement): RainEngine {
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
  let waterGradient: CanvasGradient = ctx.createLinearGradient(0, 0, 0, 1);
  let fogSprite: HTMLCanvasElement | null = null;

  const drops: Drop[] = [];
  const splashes: Splash[] = [];
  const rings: Ring[] = [];
  const spawnDebt = [0, 0, 0];

  let running = false;
  let rafId = 0;
  let lastTime = 0;
  let accumulator = 0;
  let fogPhase = 0;

  function resize() {
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
    waterGradient = ctx.createLinearGradient(0, waterRest - 20, 0, height);
    waterGradient.addColorStop(0, WATER_SURFACE);
    waterGradient.addColorStop(1, WATER_DEEP);

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

    drops.length = 0;
    splashes.length = 0;
    rings.length = 0;
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

  function renderWater() {
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, waterRest + heights[0]);
    for (let i = 1; i < columnCount; i++) {
      ctx.lineTo(i * COLUMN_SPACING, waterRest + heights[i]);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = waterGradient;
    ctx.fill();

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

  function render() {
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);
    renderFog();
    renderDrops();
    renderWater();
    renderRings();
    renderSplashes();
  }

  function frame(now: number) {
    if (!running) return;
    accumulator += Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    let steps = 0;
    while (accumulator >= SIM_STEP && steps < 4) {
      spawnDrops(SIM_STEP);
      stepDrops();
      stepWater();
      stepSplashes();
      fogPhase += SIM_STEP;
      accumulator -= SIM_STEP;
      steps++;
    }
    if (steps === 4) accumulator = 0;
    render();
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    resize();
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
    heights.fill(0);
    drops.length = 0;
    splashes.length = 0;
    rings.length = 0;
    render();
  }

  function handleResize() {
    const wasRunning = running;
    resize();
    if (!wasRunning) renderStaticFrame();
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
  document.addEventListener("visibilitychange", handleVisibilityChange);

  function destroy() {
    stop();
    window.removeEventListener("resize", handleResize);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  }

  return { start, stop, renderStaticFrame, destroy };
}
