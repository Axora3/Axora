import { chromium } from "@playwright/test";
import fs from "node:fs/promises";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const output = "artifacts/axora-upgrade";
await fs.mkdir(output, { recursive: true });
const results = [];
for (const width of [320, 360, 375, 390, 430, 768, 1024, 1440, 1920]) {
  const page = await browser.newPage({
    viewport: { width, height: 960 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const route of [
    "/",
    "/services",
    "/templates",
    "/builder",
    "/contact",
    "/admin/login",
    "/admin",
  ]) {
    const response = await page.goto(`http://localhost:43110${route}`, {
      waitUntil: "load",
    });
    const dimensions = await page.evaluate(() => ({
      viewport: innerWidth,
      content: document.documentElement.scrollWidth,
    }));
    results.push({
      width,
      route,
      status: response.status(),
      ...dimensions,
      errors: [...errors],
    });
    if (
      [320, 390, 768, 1440].includes(width) &&
      ["/", "/admin"].includes(route)
    )
      await page.screenshot({
        path: `${output}/${route === "/" ? "home" : "login"}-${width}.png`,
        fullPage: true,
      });
  }
  await page.close();
}
// Exercise the live desktop material separately from the reduced-motion matrix.
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto("http://localhost:43110", { waitUntil: "networkidle" });
await page.locator(".ax-studio-section").scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${output}/studio-material.png` });
const canvasCount = await page.locator(".ax-liquid-logo canvas").count();
results.push({ materialCanvas: canvasCount, errors });
await fs.writeFile(
  `${output}/responsive-results.json`,
  JSON.stringify(results, null, 2),
);
await browser.close();
const failures = results.filter(
  (row) => row.content > row.viewport || row.status >= 400 || row.errors.length,
);
console.log(
  JSON.stringify(
    { checks: results.length, failures, materialCanvas: canvasCount },
    null,
    2,
  ),
);
if (failures.length) process.exitCode = 1;
