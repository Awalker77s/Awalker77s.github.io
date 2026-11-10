// Static guards over the exported site in out/ — no browser, runs in about a
// second, and gates every deploy (see .github/workflows/deploy.yml).
//
//   npm run build && npm run check
//
// Each guard pins an invariant that has already been broken once in this
// project's history (see .trust/verify/features/*.md for the stories).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = join(root, "out");

// content.ts is plain data plus types, so Node's built-in type stripping can
// load it directly (Node >= 22.18; CI runs Node 22).
let content;
try {
  content = await import("../src/lib/content.ts");
} catch (error) {
  console.error("check-build: could not load src/lib/content.ts — this script needs Node >= 22.18.");
  console.error(String(error));
  process.exit(2);
}
const { projects, sections, site } = content;

const failures = [];
const fail = (message) => failures.push(message);

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files;
}

// Width/height straight from the WebP container (lossy, lossless, extended).
function webpSize(buffer) {
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") return null;
  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8 ") {
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === "VP8L") {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8X") {
    return { width: buffer.readUIntLE(24, 3) + 1, height: buffer.readUIntLE(27, 3) + 1 };
  }
  return null;
}

if (!existsSync(join(out, "index.html"))) {
  console.error("check-build: out/index.html is missing — run `npm run build` first.");
  process.exit(2);
}

const files = walk(out);
const html = readFileSync(join(out, "index.html"), "utf8");

// 1. Dynamic-viewport units are banned page-wide: they change size as phone
//    browser chrome collapses, which re-lays-out the document mid-scroll and
//    drags the sections against the scene. Tailwind emits a utility for any
//    class-shaped token it finds in ANY scanned file, docs included — so the
//    only reliable guard is the built CSS itself.
const bannedUnit = /\d(?:dvh|svh|dvw|svw|dvb|svb|dvi|svi)\b/;
for (const file of files.filter((path) => path.endsWith(".css"))) {
  const match = readFileSync(file, "utf8").match(bannedUnit);
  if (match) fail(`${relative(root, file)}: banned dynamic-viewport unit near "${match[0]}"`);
}

// 2. Every gallery image ships as a WebP pair, and the dimensions declared in
//    content.ts are the real ones (wrong numbers reserve the wrong box and the
//    cards jump as images arrive).
let imageCount = 0;
for (const project of projects) {
  if (project.images.length === 0) fail(`${project.name}: has no images`);
  for (const image of project.images) {
    imageCount++;
    const full = join(out, image.src);
    const small = join(out, image.src.replace(/\.webp$/, "-sm.webp"));
    if (!image.alt.trim()) fail(`${image.src}: empty alt text`);
    if (!existsSync(full)) {
      fail(`${image.src}: file missing from out/`);
      continue;
    }
    const size = webpSize(readFileSync(full));
    if (!size) fail(`${image.src}: not a readable WebP`);
    else if (size.width !== image.width || size.height !== image.height) {
      fail(`${image.src}: content.ts declares ${image.width}x${image.height}, file is ${size.width}x${size.height}`);
    }
    if (!existsSync(small)) {
      fail(`${image.src}: 800w "-sm" variant missing`);
      continue;
    }
    const smallSize = webpSize(readFileSync(small));
    if (!smallSize) fail(`${relative(out, small)}: not a readable WebP`);
    else if (smallSize.width !== 800) fail(`${relative(out, small)}: expected 800w, is ${smallSize.width}w`);
  }
}

// 3. The prerendered page carries what crawlers and no-JS readers get.
const cardCount = (html.match(/<article[^>]*class="[^"]*project-card/g) ?? []).length;
if (cardCount !== projects.length) fail(`index.html renders ${cardCount} project cards, content.ts has ${projects.length}`);
for (const section of sections) {
  if (!html.includes(`id="${section.id}"`)) fail(`index.html is missing section #${section.id}`);
}
if (!html.includes(`<title>${site.metaTitle.replace(/&/g, "&amp;")}</title>`)) fail("index.html <title> does not match site.metaTitle");
if (!/<meta property="og:image" content="[^"]*\/og\.jpg"/.test(html)) fail("index.html has no og:image pointing at og.jpg");
const jsonLd = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
if (!jsonLd) fail("index.html has no JSON-LD block");
else {
  try {
    if (JSON.parse(jsonLd[1])["@type"] !== "Person") fail("JSON-LD is not a Person");
  } catch {
    fail("JSON-LD does not parse");
  }
}

// 4. Every root-relative asset the page references exists in the export.
const referenced = new Set();
for (const match of html.matchAll(/(?:src|href|content)="(\/[^"#?]+)/g)) referenced.add(match[1]);
for (const match of html.matchAll(/srcSet="([^"]+)"/gi)) {
  for (const candidate of match[1].split(",")) referenced.add(candidate.trim().split(/\s+/)[0]);
}
for (const path of referenced) {
  if (!path.startsWith("/") || path.startsWith("//") || path === "/") continue;
  if (!existsSync(join(out, decodeURIComponent(path)))) fail(`index.html references ${path}, which is not in out/`);
}
for (const required of ["404.html", "og.jpg", "robots.txt", "sitemap.xml", "favicon.ico"]) {
  if (!existsSync(join(out, required))) fail(`out/${required} is missing`);
}

// 5. Real-phone weight budget. The site once shipped 13.5 MB of PNGs and took
//    27 s to load on throttled 4G; the budget keeps that from creeping back.
const BUDGET_BYTES = 5 * 1024 * 1024;
const totalBytes = files.reduce((sum, file) => sum + statSync(file).size, 0);
if (totalBytes > BUDGET_BYTES) {
  fail(`out/ is ${(totalBytes / 1048576).toFixed(2)} MB, over the ${BUDGET_BYTES / 1048576} MB budget`);
}

if (failures.length > 0) {
  console.error(`check-build: ${failures.length} problem${failures.length === 1 ? "" : "s"}`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}
console.log(
  `check-build: ok — ${projects.length} cards, ${imageCount} image pairs, ${(totalBytes / 1048576).toFixed(2)} MB exported`,
);
