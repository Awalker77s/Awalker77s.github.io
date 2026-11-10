// Re-captures project-card screenshots from the live sites and writes them the
// way the cards consume them: a WebP PAIR per image — `name.webp` at capture
// width plus `name-sm.webp` at 800w (see ProjectCard's srcset).
//
//   node scripts/shoot.mjs                 every shot below
//   node scripts/shoot.mjs mivora pizza    only the named ones
//
// This OVERWRITES files in public/projects. Several card images are curated
// captures from inside the apps (see .trust/verify/features/sections.md) —
// only the public home pages listed here are safe to regenerate. After a run,
// update width/height in src/lib/content.ts if a capture's size changed, and
// let `npm run build && npm run check` confirm the declared sizes.
//
// Encoding happens in the browser that took the screenshot (canvas → WebP),
// so the script needs nothing beyond the repo's Playwright.
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";

const VIEWPORT = { width: 1600, height: 1000 };
const SMALL_WIDTH = 800;
const QUALITY = 0.85;

const shots = [
  { name: "mivora", url: "https://mivoralearn.com" },
  { name: "echinoid", url: "https://echinoid-ui.vercel.app" },
  { name: "pizza", url: "https://mother-truckin-pizza.vercel.app/menu" },
];

const only = process.argv.slice(2);
const selected = only.length > 0 ? shots.filter((shot) => only.includes(shot.name)) : shots;
if (selected.length === 0) {
  console.error(`No shot named ${only.join(", ")}. Known: ${shots.map((shot) => shot.name).join(", ")}`);
  process.exit(1);
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
// A blank page that only ever runs our own encoder — site pages can carry a
// CSP or tainted canvases, so the PNG is carried over and encoded here.
const encoder = await browser.newPage();

async function encodeWebp(png, width) {
  const base64 = await encoder.evaluate(
    async ({ source, targetWidth, quality }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${source}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = Math.round((image.naturalHeight * targetWidth) / image.naturalWidth);
      const context = canvas.getContext("2d");
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return { data: canvas.toDataURL("image/webp", quality).split(",")[1], height: canvas.height };
    },
    { source: png.toString("base64"), targetWidth: width, quality: QUALITY },
  );
  return { buffer: Buffer.from(base64.data, "base64"), height: base64.height };
}

for (const shot of selected) {
  await page.goto(shot.url, { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(3000);
  const png = await page.screenshot();
  const full = await encodeWebp(png, VIEWPORT.width);
  const small = await encodeWebp(png, SMALL_WIDTH);
  writeFileSync(`public/projects/${shot.name}.webp`, full.buffer);
  writeFileSync(`public/projects/${shot.name}-sm.webp`, small.buffer);
  console.log(
    `${shot.name}: ${VIEWPORT.width}x${full.height} (${Math.round(full.buffer.length / 1024)} kB) + ${SMALL_WIDTH}w (${Math.round(small.buffer.length / 1024)} kB)`,
  );
}
await browser.close();
