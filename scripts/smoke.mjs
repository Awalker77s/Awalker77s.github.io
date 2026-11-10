// Behavioural smoke test for the exported site. Serves out/ itself, drives it
// in headless Chromium, and exits non-zero if any promise the page makes is
// broken. The checks are the EP-* expectations from .trust/verify/features/.
//
//   npm run build && npm run smoke
//
// Needs a Playwright Chromium (`npx playwright install chromium`), or point
// CHROMIUM_PATH at an existing Chrome/Chromium binary.
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const out = fileURLToPath(new URL("../out", import.meta.url));
if (!existsSync(join(out, "index.html"))) {
  console.error("smoke: out/index.html is missing — run `npm run build` first.");
  process.exit(2);
}
const { projects, sections } = await import("../src/lib/content.ts");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

// A static host with GitHub Pages' two relevant behaviours: directory index
// and 404.html for unknown paths.
const server = createServer((request, response) => {
  const path = normalize(decodeURIComponent(new URL(request.url, "http://x").pathname));
  let file = join(out, path);
  if (!file.startsWith(out)) file = join(out, "404.html");
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  const found = existsSync(file);
  if (!found) file = join(out, "404.html");
  response.writeHead(found ? 200 : 404, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
  response.end(readFileSync(file));
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  // Software GL so the canvases rasterize on GPU-less machines.
  args: ["--disable-gpu", "--use-angle=swiftshader"],
});

let passed = 0;
const failures = [];
const consoleErrors = [];

async function check(name, run) {
  try {
    await run();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures.push(name);
    console.log(`  ✗ ${name}\n      ${String(error.message ?? error).split("\n")[0]}`);
  }
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

async function open(contextOptions = {}, { initScript, path = "" } = {}) {
  const context = await browser.newContext(contextOptions);
  if (initScript) await context.addInitScript(initScript);
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(String(error)));
  await page.goto(base + path, { waitUntil: "domcontentloaded" });
  return { context, page };
}

// Programmatic scrolls must land instantly: CSS smooth-scroll would animate them.
const instantScroll = (page) =>
  page.evaluate(() => (document.documentElement.style.scrollBehavior = "auto"));
const sceneFrame = (page) =>
  page.evaluate(() => document.querySelector("canvas.scene-doc-canvas").toDataURL("image/png"));
const depthToken = (page) =>
  page.evaluate(() => Number(getComputedStyle(document.documentElement).getPropertyValue("--depth")));
const wheelPrevented = (page, init, selector = "body") =>
  page.evaluate(
    ([eventInit, target]) => {
      const event = new WheelEvent("wheel", { bubbles: true, cancelable: true, ...eventInit });
      document.querySelector(target).dispatchEvent(event);
      return event.defaultPrevented;
    },
    [init, selector],
  );
const silent = () => localStorage.setItem("rain-sound", "off");
const desktop = { viewport: { width: 1440, height: 900 } };
const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

console.log("desktop");
{
  const { context, page } = await open(desktop, { initScript: silent });
  await page.waitForSelector("canvas.scene-doc-canvas");
  await page.waitForTimeout(1200);

  await check("EP-HOME hero, nav and both canvases render", async () => {
    expect((await page.title()).includes("Alexander Walker"), "unexpected <title>");
    expect(await page.locator("h1").isVisible(), "h1 not visible");
    expect((await page.locator("canvas").count()) === 2, "expected scene + depth canvases");
    expect(await page.locator("header nav").isVisible(), "nav not visible");
  });

  await check("EP-CARDS one card and one rendered image per project", async () => {
    expect((await page.locator("article.project-card").count()) === projects.length, "card count mismatch");
    expect((await page.locator("#projects img").count()) === projects.length, "one <img> per card expected");
    const names = await page.locator("article.project-card h3").allTextContents();
    expect(names.join("|") === projects.map((project) => project.name).join("|"), "card order differs from content.ts");
  });

  await check("EP-RAIN scene animates by default", async () => {
    expect((await page.getAttribute('[aria-label="Toggle rain animation"]', "aria-pressed")) === "true", "rain pill not on");
    const first = await sceneFrame(page);
    await page.waitForTimeout(1100);
    expect(first !== (await sceneFrame(page)), "scene canvas did not change in 1.1s");
  });

  await check("EP-DESCENT depth token rises monotonically to 1, readout follows", async () => {
    await instantScroll(page);
    const height = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const depths = [];
    for (const y of [0, 450, 1350, height / 2, height]) {
      await page.evaluate((top) => scrollTo(0, top), y);
      await page.waitForTimeout(350);
      depths.push(await depthToken(page));
    }
    expect(depths[0] === 0, `depth at top is ${depths[0]}`);
    expect(depths.every((depth, i) => i === 0 || depth > depths[i - 1]), `not monotonic: ${depths}`);
    expect(depths.at(-1) > 0.99, `depth at bottom is ${depths.at(-1)}`);
    const readout = await page.locator("[data-depth-readout]").first().textContent();
    expect(/1000\s*m/.test(readout) && readout.includes("midnight zone"), `bottom readout was "${readout}"`);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(350);
    const top = await page.locator("[data-depth-readout]").first().textContent();
    expect(/0000\s*m/.test(top) && top.includes("surface"), `top readout was "${top}"`);
  });

  await check("EP-ANCHORS scrollspy marks the section in view", async () => {
    for (const { id } of sections) {
      await page.evaluate((target) => document.getElementById(target).scrollIntoView(), id);
      await page.waitForTimeout(250);
      const current = await page.locator('a.nav-link[aria-current="location"]').getAttribute("href");
      expect(current === `#${id}`, `at #${id} the nav marked ${current}`);
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(250);
    expect((await page.locator("a.nav-link[aria-current]").count()) === 0, "a section is marked while in the hero");
  });

  const gallery = page.locator("article.project-card", { hasText: "Document Intelligence" });
  const stage = gallery.locator('[aria-label^="Expand"]');

  await check("EP-GALLERY arrows and keys page the images without moving the layout", async () => {
    await gallery.scrollIntoViewIfNeeded();
    const before = await gallery.boundingBox();
    expect((await gallery.locator("img").getAttribute("src")).endsWith("rag-detail.webp"), "lead image is not rag-detail");
    await gallery.locator('[aria-label="Next image"]').click();
    expect((await gallery.locator("img").getAttribute("src")).endsWith("rag.webp"), "Next did not advance");
    await stage.focus();
    await page.keyboard.press("ArrowRight");
    expect((await gallery.locator("img").getAttribute("src")).endsWith("rag-detail.webp"), "ArrowRight did not wrap");
    const after = await gallery.boundingBox();
    expect(Math.abs(after.height - before.height) < 0.5, `card height changed ${before.height} → ${after.height}`);
    const single = page.locator("article.project-card", { hasText: "The vault every agent reads first" });
    expect((await single.locator('[aria-label="Next image"]').count()) === 0, "single-image card shows arrows");
  });

  await check("EP-GALLERY lightbox opens modal, locks scroll, restores everything on Escape", async () => {
    await stage.click();
    await page.waitForSelector("dialog[open]");
    expect(await page.evaluate(() => document.documentElement.style.overflow === "hidden"), "scroll not locked");
    expect(await page.evaluate(() => document.querySelector("dialog[open]").contains(document.activeElement)), "focus not inside dialog");
    expect(!(await wheelPrevented(page, { deltaY: 120 }, "dialog[open]")), "wheel smoother acted inside the dialog");
    const caption = await page.locator("dialog[open] figcaption").textContent();
    expect(caption.length > 20, "caption missing");
    await page.keyboard.press("ArrowRight");
    expect((await page.locator("dialog[open] img").getAttribute("src")).endsWith("rag.webp"), "ArrowRight did not page the lightbox");
    await page.keyboard.press("Escape");
    await page.waitForSelector("dialog[open]", { state: "detached" }).catch(() => {});
    expect((await page.locator("dialog[open]").count()) === 0, "dialog still open after Escape");
    expect(await page.evaluate(() => document.documentElement.style.overflow === ""), "overflow lock leaked");
    expect(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")?.startsWith("Expand")), "focus did not return to the image button");
    await stage.click();
    await page.waitForSelector("dialog[open]");
    await page.mouse.click(8, 450);
    expect((await page.locator("dialog[open]").count()) === 0, "backdrop click did not close");
  });

  await check("EP-SCROLL wheel glides through the single ease; sideways wheels are left alone", async () => {
    await page.evaluate(() => {
      document.activeElement?.blur();
      scrollTo(0, 200);
    });
    await page.waitForTimeout(300);
    expect(await wheelPrevented(page, { deltaY: 100 }), "vertical wheel not intercepted");
    await page.waitForTimeout(1400);
    expect(!(await wheelPrevented(page, { deltaX: 100, deltaY: 0 })), "horizontal wheel was swallowed");
    const start = await page.evaluate(() => scrollY);
    await page.mouse.move(700, 450);
    const trace = page.evaluate(
      () =>
        new Promise((resolve) => {
          const ys = [];
          const begin = performance.now();
          const tick = () => {
            ys.push(scrollY);
            if (performance.now() - begin < 1600) requestAnimationFrame(tick);
            else resolve(ys);
          };
          requestAnimationFrame(tick);
        }),
    );
    for (let i = 0; i < 3; i++) await page.mouse.wheel(0, 120);
    const ys = await trace;
    expect(ys.every((y, i) => i === 0 || y >= ys[i - 1] - 0.01), "glide moved backward");
    expect(Math.abs(ys.at(-1) - start - 360) < 3, `glide travelled ${ys.at(-1) - start}, expected 360`);
    expect(new Set(ys.map(Math.round)).size > 12, "glide was not dense small steps");
  });

  await check("EP-SCROLL the scene is fully repainted when the reader returns from the deep", async () => {
    // Only rows near the viewport are painted per frame; coming back up from
    // the page bottom must never expose a row that was left unpainted.
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(900);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(200);
    const unpainted = await page.evaluate(() => {
      const canvas = document.querySelector("canvas.scene-doc-canvas");
      const context = canvas.getContext("2d");
      let rows = 0;
      for (let y = 0; y < canvas.height / 2; y += 6) {
        if (context.getImageData(canvas.width >> 1, y, 1, 1).data[3] === 0) rows++;
      }
      return rows;
    });
    expect(unpainted === 0, `${unpainted} sampled rows of the scene were never painted`);
  });

  await check("EP-PRINT paper palette, no weather, no half-faded blocks", async () => {
    await page.evaluate(() => document.getElementById("projects").scrollIntoView());
    await page.emulateMedia({ media: "print" });
    const printed = await page.evaluate(() => {
      const style = (selector) => getComputedStyle(document.querySelector(selector));
      return {
        page: getComputedStyle(document.documentElement).backgroundColor,
        text: style("h1").color,
        canvas: style("canvas.scene-doc-canvas").display,
        nav: style("header.site-nav").display,
        controls: style(".screen-only").display,
        faded: [...document.querySelectorAll(".reveal")].filter((element) => getComputedStyle(element).opacity !== "1").length,
      };
    });
    await page.emulateMedia({ media: "screen" });
    expect(printed.page === "rgb(255, 255, 255)", `page background prints as ${printed.page}`);
    expect(printed.text === "rgb(11, 18, 32)", `heading prints as ${printed.text}`);
    expect(printed.canvas === "none" && printed.nav === "none", "canvas or nav still printed");
    expect(printed.controls === "none", "gallery controls still printed");
    expect(printed.faded === 0, `${printed.faded} blocks would print partly transparent`);
  });

  await check("EP-PERSIST rain choice survives a reload and freezes the scene", async () => {
    await page.evaluate(() => scrollTo(0, 0));
    await page.click('[aria-label="Toggle rain animation"]');
    expect((await page.getAttribute('[aria-label="Toggle rain animation"]', "aria-pressed")) === "false", "pill did not turn off");
    expect((await page.evaluate(() => localStorage.getItem("rain-motion-v2"))) === "off", "choice not stored");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector("canvas.scene-doc-canvas");
    await page.waitForTimeout(900);
    expect((await page.getAttribute('[aria-label="Toggle rain animation"]', "aria-pressed")) === "false", "choice lost on reload");
    const first = await sceneFrame(page);
    await page.waitForTimeout(900);
    expect(first === (await sceneFrame(page)), "scene still animating with rain off");
    await page.click('[aria-label="Toggle rain animation"]');
    await page.waitForTimeout(600);
    expect(first !== (await sceneFrame(page)), "scene did not resume");
  });

  await context.close();
}

console.log("audio");
{
  const trackContexts = () => {
    const Real = window.AudioContext;
    window.__ac = [];
    window.AudioContext = class extends Real {
      constructor(...args) {
        super(...args);
        window.__ac.push(this);
      }
    };
  };
  const { context, page } = await open(desktop, { initScript: trackContexts });
  const pill = '[aria-label="Toggle background music"]';
  const state = () => page.evaluate(() => window.__ac[0]?.state ?? "none");
  const setHidden = (hidden) =>
    page.evaluate((value) => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => value });
      document.dispatchEvent(new Event("visibilitychange"));
    }, hidden);

  await check("EP-SOUND default on: pill lit, score starts where autoplay is granted", async () => {
    expect((await page.getAttribute(pill, "aria-pressed")) === "true", "pill not lit before any gesture");
    await page.waitForTimeout(1500);
    // Playwright's Chromium grants autoplay, i.e. the optimistic zero-gesture path.
    expect((await state()) === "running", `context is ${await state()}`);
  });

  await check("EP-SOUND tab hidden pauses the score, tab shown resumes it, preference untouched", async () => {
    await setHidden(true);
    await page.waitForTimeout(1300);
    expect((await state()) === "suspended", `hidden tab left the context ${await state()}`);
    expect((await page.getAttribute(pill, "aria-pressed")) === "true", "hiding the tab changed the pill");
    expect((await page.evaluate(() => localStorage.getItem("rain-sound"))) !== "off", "hiding the tab stored an opt-out");
    await setHidden(false);
    await page.waitForTimeout(600);
    expect((await state()) === "running", `shown tab left the context ${await state()}`);
  });

  await check("EP-SOUND pill toggles off (suspends) and back on, and persists", async () => {
    await page.click(pill);
    expect((await page.getAttribute(pill, "aria-pressed")) === "false", "pill did not turn off");
    await page.waitForTimeout(1300);
    expect((await state()) === "suspended", `context is ${await state()} after toggle-off`);
    expect((await page.evaluate(() => localStorage.getItem("rain-sound"))) === "off", "opt-out not stored");
    await page.click(pill);
    await page.waitForTimeout(400);
    expect((await state()) === "running", `context is ${await state()} after toggle-on`);
    expect((await page.evaluate(() => localStorage.getItem("rain-sound"))) === "on", "opt-in not stored");
  });

  await check("EP-SOUND arming at depth schedules without errors", async () => {
    await instantScroll(page);
    await page.evaluate(() => scrollTo(0, innerHeight * 2.2));
    await page.waitForTimeout(2500);
    expect((await state()) === "running", "context stopped while submerged");
  });

  await context.close();
}

console.log("audio, autoplay blocked");
{
  // Playwright's Chromium always grants autoplay, so blocking is emulated the
  // way real engines behave: contexts are born suspended and resume() stays
  // pending until a qualifying gesture (pointer, key, touch — never scroll).
  const blockAutoplay = () => {
    const Real = window.AudioContext;
    window.__ac = [];
    let activated = false;
    for (const type of ["pointerdown", "keydown", "touchend"]) {
      window.addEventListener(type, () => (activated = true), { capture: true });
    }
    window.AudioContext = class extends Real {
      constructor(...args) {
        super(...args);
        window.__ac.push(this);
        if (!activated) void super.suspend();
      }
      resume() {
        return activated ? super.resume() : new Promise(() => {});
      }
    };
  };
  const pill = '[aria-label="Toggle background music"]';

  await check("EP-SOUND blocked: pill lit but silent; scrolling cannot start it; a click on the page does", async () => {
    const { context, page } = await open(desktop, { initScript: blockAutoplay });
    const state = () => page.evaluate(() => window.__ac[0]?.state ?? "none");
    await page.waitForTimeout(1500);
    expect((await page.getAttribute(pill, "aria-pressed")) === "true", "pill not lit");
    expect((await state()) !== "running", "context running before any gesture");
    await page.mouse.move(700, 450);
    await page.mouse.wheel(0, 240);
    await page.waitForTimeout(900);
    expect((await state()) !== "running", "a wheel scroll unlocked audio");
    await page.mouse.click(700, 300);
    await page.waitForTimeout(500);
    expect((await state()) === "running", `first click left the context ${await state()}`);
    expect((await page.getAttribute(pill, "aria-pressed")) === "true", "first click turned the pill off");
    await context.close();
  });

  await check("EP-SOUND blocked: a first click on the pill itself starts the music, never toggles it off", async () => {
    const { context, page } = await open(desktop, { initScript: blockAutoplay });
    await page.waitForTimeout(1500);
    await page.click(pill);
    await page.waitForTimeout(500);
    expect((await page.evaluate(() => window.__ac[0]?.state)) === "running", "pill click did not start the music");
    expect((await page.getAttribute(pill, "aria-pressed")) === "true", "pill click toggled the music off");
    expect((await page.evaluate(() => localStorage.getItem("rain-sound"))) === "on", "preference not stored as on");
    await context.close();
  });
}

console.log("phone");
{
  const { context, page } = await open(phone, { initScript: silent });
  await page.waitForSelector("canvas.scene-doc-canvas");
  await page.waitForTimeout(800);
  await instantScroll(page);

  await check("EP-MOBILE no sideways scroll, 44px controls, layout guard holds", async () => {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow <= 0, `page is ${overflow}px wider than the viewport`);
    for (const label of ["Toggle background music", "Toggle rain animation", "Open menu"]) {
      const box = await page.locator(`[aria-label="${label}"]`).boundingBox();
      expect(box.width >= 44 && box.height >= 44, `"${label}" is ${box.width}x${box.height}`);
    }
    // The projects must start a clear water column below the waterline (86% of
    // the large viewport), or the hero was sized with an unstable unit.
    const projectsTop = await page.evaluate(() => document.getElementById("projects").getBoundingClientRect().top + scrollY);
    expect(projectsTop >= 844 * 0.86 + 90, `#projects starts at ${projectsTop}`);
  });

  await check("EP-MOBILE floating pills clear the footer text at rest", async () => {
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(400);
    const overlaps = await page.evaluate(() => {
      const pills = document.querySelector(".atmosphere-controls").getBoundingClientRect();
      return [...document.querySelectorAll("footer p, footer a")]
        .map((element) => element.getBoundingClientRect())
        .filter((box) => box.bottom > pills.top && box.top < pills.bottom && box.right > pills.left && box.left < pills.right).length;
    });
    expect(overlaps === 0, `${overlaps} footer line(s) sit under the pills`);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(300);
  });

  await check("EP-MOBILE menu opens, navigates, and closes", async () => {
    expect(!(await page.locator("#site-menu").isVisible()), "menu open on load");
    await page.tap('[aria-label="Open menu"]');
    expect(await page.locator("#site-menu").isVisible(), "menu did not open");
    await page.locator("#site-menu a", { hasText: "Skills" }).tap();
    await page.waitForTimeout(500);
    expect(!(await page.locator("#site-menu").isVisible()), "menu stayed open after navigating");
    const top = await page.evaluate(() => document.getElementById("skills").getBoundingClientRect().top);
    expect(Math.abs(top - 80) < 4, `#skills landed at ${top}, expected to clear the nav at 80`);
    await page.tap('[aria-label="Open menu"]');
    await page.keyboard.press("Escape");
    expect(!(await page.locator("#site-menu").isVisible()), "Escape did not close the menu");
  });

  await check("EP-MOBILE card details collapse and expand", async () => {
    const card = page.locator("article.project-card").first();
    await card.scrollIntoViewIfNeeded();
    const description = card.locator("p", { hasText: projects[0].description.slice(0, 40) });
    const toggle = card.locator("button[aria-expanded]");
    expect(!(await description.isVisible()), "details visible before expanding");
    await toggle.tap();
    expect(await description.isVisible(), "details did not expand");
    expect(await card.locator("li", { hasText: projects[0].stack[0] }).first().isVisible(), "stack chips did not expand");
    expect((await toggle.getAttribute("aria-expanded")) === "true", "aria-expanded not updated");
    await toggle.tap();
    expect(!(await description.isVisible()), "details did not collapse");
  });

  await check("EP-GALLERY swipe pages the gallery; a tap still opens the lightbox", async () => {
    const card = page.locator("article.project-card").first();
    const stage = card.locator('[aria-label^="Expand"]');
    await stage.scrollIntoViewIfNeeded();
    const box = await stage.boundingBox();
    const y = box.y + box.height / 2;
    const swipe = (from, to) =>
      stage.evaluate(
        (element, [startX, endX, atY]) => {
          const fire = (type, x) =>
            element.dispatchEvent(
              new PointerEvent(type, { bubbles: true, pointerType: "touch", pointerId: 7, clientX: x, clientY: atY }),
            );
          fire("pointerdown", startX);
          fire("pointerup", endX);
          // Browsers follow a touch pointerup with a click on the same target.
          element.click();
        },
        [from, to, y],
      );
    const counter = card.locator("span", { hasText: /^\d+ \/ \d+$/ });
    expect((await counter.textContent()) === `1 / ${projects[0].images.length}`, "unexpected starting image");
    await swipe(box.x + box.width * 0.8, box.x + box.width * 0.2);
    expect((await counter.textContent()) === `2 / ${projects[0].images.length}`, "swipe left did not advance");
    expect((await page.locator("dialog[open]").count()) === 0, "swipe also opened the lightbox");
    await swipe(box.x + box.width * 0.2, box.x + box.width * 0.8);
    expect((await counter.textContent()) === `1 / ${projects[0].images.length}`, "swipe right did not go back");
    await stage.tap();
    await page.waitForSelector("dialog[open]");
    await page.locator('[aria-label="Close image viewer"]').tap();
    expect((await page.locator("dialog[open]").count()) === 0, "close button did not close the lightbox");
  });

  await context.close();
}

console.log("reduced motion");
{
  const { context, page } = await open({ ...desktop, reducedMotion: "reduce" }, {
    initScript: () => {
      localStorage.setItem("rain-sound", "off");
      // Legacy key from the old reduced-motion scheme: must be ignored and removed.
      localStorage.setItem("rain-motion", "off");
    },
  });
  await page.waitForSelector("canvas.scene-doc-canvas");
  await page.waitForTimeout(900);

  await check("EP-MOTION-PREF native scrolling kept, rain still starts on, legacy key cleared", async () => {
    expect(!(await wheelPrevented(page, { deltaY: 100 })), "wheel smoother attached under reduced motion");
    expect((await page.getAttribute('[aria-label="Toggle rain animation"]', "aria-pressed")) === "true", "rain did not start on");
    expect((await page.evaluate(() => localStorage.getItem("rain-motion"))) === null, "legacy rain-motion key still present");
    const first = await sceneFrame(page);
    await page.waitForTimeout(1000);
    expect(first !== (await sceneFrame(page)), "scene is frozen under reduced motion");
  });

  await context.close();
}

console.log("seeded skyline");
{
  // `?seed=` pins the city and its weather; with the rain off the scene is a
  // pure function of the seed, so two loads must paint identical pixels.
  const stillFrame = async (seed) => {
    const { context, page } = await open(desktop, {
      path: `?seed=${seed}`,
      initScript: () => {
        localStorage.setItem("rain-sound", "off");
        localStorage.setItem("rain-motion-v2", "off");
      },
    });
    await page.waitForSelector("canvas.scene-doc-canvas");
    await page.waitForTimeout(900);
    const frame = await sceneFrame(page);
    await context.close();
    return frame;
  };
  await check("EP-CITY ?seed= reproduces the skyline exactly; another seed builds another city", async () => {
    const first = await stillFrame(7);
    expect(first === (await stillFrame(7)), "same seed painted different pixels");
    expect(first !== (await stillFrame(8)), "different seeds painted the same city");
  });
}

console.log("not found");
{
  const { context, page } = await open(desktop, { path: "no/such/page" });
  await check("404 page is branded and links home", async () => {
    expect((await page.locator("h1").textContent()).includes("Nothing at this depth"), "unexpected 404 heading");
    expect((await page.locator('a[href="/"]').count()) === 1, "no link back home");
  });
  await context.close();
}

// The 404 probe above is a deliberate failed request; nothing else may log.
const unexpected = consoleErrors.filter((text) => !/404 \(Not Found\)/.test(text));
await check("console stayed clean across every run", async () => {
  expect(unexpected.length === 0, unexpected.join(" | "));
});

await browser.close();
server.close();

console.log(`\nsmoke: ${passed} passed, ${failures.length} failed`);
process.exit(failures.length === 0 ? 0 : 1);
