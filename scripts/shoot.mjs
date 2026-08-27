import { chromium } from "playwright";

const shots = [
  { url: "https://mivoralearn.com", file: "public/projects/mivora.png" },
  { url: "https://echinoid-ui.vercel.app", file: "public/projects/echinoid.png" },
  { url: "https://mother-truckin-pizza.vercel.app/menu", file: "public/projects/pizza.png" },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
for (const shot of shots) {
  await page.goto(shot.url, { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: shot.file });
  console.log(`saved ${shot.file}`);
}
await browser.close();
