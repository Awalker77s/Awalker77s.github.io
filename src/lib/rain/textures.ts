// Procedural textures for the rain engine. Every function here runs ONCE (at
// engine start or on a width change) and returns a small offscreen canvas the
// engine then draws with plain drawImage — so the per-pixel work below never
// touches the per-frame budget, and nothing needs a library or an image file.

type Rand = () => number;

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2d context unavailable for texture bake");
  return { canvas, context };
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// Fractal gradient noise that TILES horizontally (u wraps at 1) so a texture
// can drift sideways forever without a seam. v runs 0..1 and does not wrap.
// Gradient noise, not value noise: thresholded into clouds, value noise shows
// its lattice as axis-aligned blocks the size of a cell.
function tileableFbm(rand: Rand, cellsX: number, cellsY: number, octaves: number) {
  const grids: { angles: Float32Array; periodX: number; rows: number }[] = [];
  for (let octave = 0; octave < octaves; octave++) {
    const periodX = cellsX << octave;
    const rows = (cellsY << octave) + 1;
    const angles = new Float32Array(periodX * rows);
    for (let i = 0; i < angles.length; i++) angles[i] = rand() * Math.PI * 2;
    grids.push({ angles, periodX, rows });
  }
  return (u: number, v: number) => {
    let sum = 0;
    let amplitude = 0.5;
    let total = 0;
    for (const { angles, periodX, rows } of grids) {
      const x = u * periodX;
      const y = Math.min(0.9999, Math.max(0, v)) * (rows - 1);
      const x0 = Math.floor(x);
      const y0 = Math.floor(y);
      const fx = x - x0;
      const fy = y - y0;
      // Quintic fade: no creases where cells meet.
      const sx = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
      const sy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
      const xa = ((x0 % periodX) + periodX) % periodX;
      const xb = (xa + 1) % periodX;
      const dot = (column: number, row: number, dx: number, dy: number) => {
        const angle = angles[row * periodX + column];
        return Math.cos(angle) * dx + Math.sin(angle) * dy;
      };
      const top = dot(xa, y0, fx, fy) + (dot(xb, y0, fx - 1, fy) - dot(xa, y0, fx, fy)) * sx;
      const bottom =
        dot(xa, y0 + 1, fx, fy - 1) + (dot(xb, y0 + 1, fx - 1, fy - 1) - dot(xa, y0 + 1, fx, fy - 1)) * sx;
      sum += (top + (bottom - top) * sy) * amplitude;
      total += amplitude;
      amplitude *= 0.5;
    }
    // Gradient noise is centred on 0 and rarely leaves ±0.7.
    return Math.min(1, Math.max(0, 0.5 + (sum / total) * 0.95));
  };
}

// Low overcast lit from underneath by the city: billows whose undersides
// catch violet light, thinning to nothing toward the top of the sky (behind
// the nav and the hero copy). Drawn stretched ~4x, which is what turns 320
// noisy pixels into soft cloud.
export function bakeCloudTile(rand: Rand): HTMLCanvasElement {
  const width = 320;
  const height = 128;
  const { canvas, context } = createCanvas(width, height);
  const noise = tileableFbm(rand, 5, 3, 5);
  const warp = tileableFbm(rand, 3, 2, 3);
  const image = context.createImageData(width, height);
  const wrap = (u: number) => ((u % 1) + 1) % 1;
  for (let y = 0; y < height; y++) {
    const v = y / height;
    // Nothing at the very top; thickest in the lower sky above the skyline.
    const profile = smoothstep(0.12, 0.78, v);
    for (let x = 0; x < width; x++) {
      const u = x / width;
      // Domain warp: bends the billows into wisps and hides the noise grid.
      const bendU = warp(u, v) - 0.5;
      const bendV = warp(wrap(u + 0.37), v) - 0.5;
      const su = wrap(u + bendU * 0.22);
      const sv = v + bendV * 0.3;
      const here = noise(su, sv);
      const density = smoothstep(0.44, 0.7, here);
      // Underside lighting: where the cloud ends just below this pixel, the
      // city's glow reaches it — brighter and warmer.
      const below = noise(su, sv + 0.06);
      const underlit = Math.min(1, Math.max(0, (here - below) * 6));
      const warmth = Math.min(1, v * v * 0.55 + underlit * 0.5);
      const offset = (y * width + x) * 4;
      image.data[offset] = lerp(62, 132, warmth);
      image.data[offset + 1] = lerp(80, 100, warmth);
      image.data[offset + 2] = lerp(126, 178, warmth);
      image.data[offset + 3] = 255 * density * profile * (0.45 + 0.55 * underlit);
    }
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

// Ground mist that pools between the skyline's parallax bands: dense at
// street level, torn into wisps above.
export function bakeMistTile(rand: Rand): HTMLCanvasElement {
  const width = 256;
  const height = 64;
  const { canvas, context } = createCanvas(width, height);
  const noise = tileableFbm(rand, 3, 2, 4);
  const image = context.createImageData(width, height);
  for (let y = 0; y < height; y++) {
    const v = y / height;
    const settle = Math.pow(v, 1.7);
    for (let x = 0; x < width; x++) {
      const wisp = smoothstep(0.36, 0.68, noise(x / width, v));
      const offset = (y * width + x) * 4;
      image.data[offset] = 128;
      image.data[offset + 1] = 146;
      image.data[offset + 2] = 204;
      image.data[offset + 3] = 255 * settle * (0.3 + 0.7 * wisp);
    }
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

// One light shaft seen underwater: narrow at the surface, widening as it
// falls, soft at both edges, fading with depth. The taper is baked because a
// canvas transform can skew and scale a sprite but cannot widen it.
export const RAY_TOP_WIDTH_RATIO = 1 / 2.6;

export function bakeRaySprite(): HTMLCanvasElement {
  const width = 160;
  const height = 320;
  const { canvas, context } = createCanvas(width, height);
  const image = context.createImageData(width, height);
  for (let y = 0; y < height; y++) {
    const t = y / height;
    const half = lerp(RAY_TOP_WIDTH_RATIO, 1, t) * (width / 2);
    const fade = Math.pow(1 - t, 1.35);
    for (let x = 0; x < width; x++) {
      const distance = Math.abs(x + 0.5 - width / 2) / half;
      const edge = distance >= 1 ? 0 : Math.pow(1 - distance * distance, 2);
      const offset = (y * width + x) * 4;
      image.data[offset] = 176;
      image.data[offset + 1] = 208;
      image.data[offset + 2] = 244;
      image.data[offset + 3] = 255 * edge * fade;
    }
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

// The bright net that sunlight (here: city light) draws under a rippled
// surface. Three warped wave trains; the net is where their sum crosses
// zero. Every horizontal frequency is a whole number of cycles, so the tile
// repeats seamlessly, and two copies sliding past each other shimmer.
export function bakeCausticTile(): HTMLCanvasElement {
  const width = 384;
  const height = 128;
  const { canvas, context } = createCanvas(width, height);
  const image = context.createImageData(width, height);
  for (let y = 0; y < height; y++) {
    const v = y / height;
    const fade = Math.pow(1 - v, 1.8) * smoothstep(0, 0.12, v);
    for (let x = 0; x < width; x++) {
      const u = (x / width) * Math.PI * 2;
      const a = Math.sin(u * 5 + v * 9.3 + 1.6 * Math.sin(u * 3 + v * 6.1));
      const b = Math.sin(u * 8 - v * 7.9 + 1.9 * Math.sin(u * 2 - v * 4.7 + 1));
      const c = Math.sin(u * 3 + v * 13.1 + 2 + 1.2 * Math.sin(u * 4 + 0.6));
      const net = Math.pow(1 - Math.abs(a + b + c) / 3, 13);
      const offset = (y * width + x) * 4;
      image.data[offset] = 170;
      image.data[offset + 1] = 214;
      image.data[offset + 2] = 250;
      image.data[offset + 3] = 255 * net * fade;
    }
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

// Blur by shrinking: halve until the layer is `targetWidth` wide. Each halving
// averages 2x2 pixels, so the chain approximates a gaussian without relying
// on canvas `filter` (unsupported in Safari).
function shrink(source: HTMLCanvasElement, targetWidth: number): HTMLCanvasElement {
  let current = source;
  while (current.width > targetWidth * 2) {
    const { canvas, context } = createCanvas(current.width / 2, current.height / 2);
    context.imageSmoothingQuality = "high";
    context.drawImage(current, 0, 0, canvas.width, canvas.height);
    current = canvas;
  }
  const ratio = targetWidth / current.width;
  const { canvas, context } = createCanvas(targetWidth, current.height * ratio);
  context.imageSmoothingQuality = "high";
  context.drawImage(current, 0, 0, canvas.width, canvas.height);
  return canvas;
}

// Bloom for a baked city band: every lit window, sign and beacon tip gets a
// tight halo and a wide haze, added on top of the band. `lights` holds ONLY
// the light sources (same size as the band). Baked once — the wet-air glow
// that used to need live shadowBlur costs nothing per frame.
export function addBloom(
  band: CanvasRenderingContext2D,
  lights: HTMLCanvasElement,
  cssWidth: number,
  cssHeight: number,
  strength: number,
) {
  band.save();
  band.globalCompositeOperation = "lighter";
  band.imageSmoothingQuality = "high";
  for (const [divisor, alpha] of [
    [3, 0.55],
    [12, 0.5],
  ]) {
    const soft = shrink(lights, Math.max(8, cssWidth / divisor));
    band.globalAlpha = alpha * strength;
    band.drawImage(soft, 0, 0, cssWidth, cssHeight);
  }
  band.restore();
}
