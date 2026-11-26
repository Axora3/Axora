import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "no-preference",
});
const errors = [],
  messages = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (["error", "warning"].includes(m.type()))
    messages.push({ type: m.type(), message: m.text() });
});
const evidence = [];
try {
  await page.goto(process.env.AXORA_QA_URL || "http://localhost:43114", {
    waitUntil: "domcontentloaded",
  });
  const studio = page.locator(".ax-studio-section"),
    canvas = page.locator(".ax-liquid-logo canvas");
  await studio.scrollIntoViewIfNeeded();
  await expect(canvas).toHaveCount(1);
  evidence.push({ state: "desktop in view", canvas: await canvas.count() });
  await page.screenshot({ path: "artifacts/final-qa/material-live.png" });
  await page.setViewportSize({ width: 390, height: 1000 });
  await expect(canvas).toHaveCount(0);
  await expect(page.locator(".ax-liquid-logo-static")).toBeVisible();
  evidence.push({ state: "mobile", canvas: 0, static: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await studio.scrollIntoViewIfNeeded();
  await expect(canvas).toHaveCount(1);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(canvas).toHaveCount(0);
  evidence.push({ state: "offscreen", canvas: 0 });
  await studio.scrollIntoViewIfNeeded();
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toHaveAttribute("data-engine", /three/);
  await page.evaluate(
    () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
  await canvas.evaluate((e) =>
    e.dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
  );
  await expect(canvas).toHaveCount(0);
  await expect(page.locator(".ax-liquid-logo-static")).toBeVisible();
  evidence.push({ state: "context lost", canvas: 0, static: true });
  expect(errors).toEqual([]);
} catch (error) {
  errors.push(error.stack);
} finally {
  await browser.close();
  await fs.writeFile(
    "artifacts/final-qa/visual-lifecycle.json",
    JSON.stringify({ evidence, errors, messages }, null, 2),
  );
}
console.log(JSON.stringify({ evidence, errors, messages }, null, 2));
if (errors.length) process.exitCode = 1;
