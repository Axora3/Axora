import { chromium, webkit, firefox } from "@playwright/test";
import sharp from "sharp";
import fs from "node:fs";
import assert from "node:assert/strict";
const root = "qa-evidence/real-liquid-glass",
  base = process.env.AXORA_GLASS_URL || "http://localhost:3000";
fs.mkdirSync(root + "/browsers", { recursive: true });
const records = [];
for (const [name, engine] of [
  ["chrome", chromium],
  ["webkit", webkit],
  ["firefox", firefox],
]) {
  let browser;
  try {
    browser = await engine.launch(
      name === "chrome" ? { channel: "chrome" } : {},
    );
  } catch (error) {
    records.push({ name, unavailable: String(error) });
    continue;
  }
  try {
    const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
        reducedMotion: "reduce",
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base, {waitUntil:"domcontentloaded",timeout:60000});
    await page
      .locator(
        '.ax-site-header [data-ax-glass-mode]:not([data-ax-glass-mode="pending"])',
      )
      .first()
      .waitFor();
    await page.waitForTimeout(700);
    const mode = await page
      .locator(".ax-site-header [data-ax-glass]")
      .first()
      .getAttribute("data-ax-glass-mode");
    assert.equal(
      await page
        .locator(".ax-site-header")
        .evaluate((e) => getComputedStyle(e).backdropFilter),
      "none",
      "Old host blur blocks external refraction",
    );
    if (name === "chrome") {
      await page.waitForFunction(() =>
        document.querySelector(
          '.ax-site-header [data-liquid-glass="material"] feDisplacementMap',
        ),
      );
      // Controlled diagnostic backdrop lives only in this browser session, never in production code.
      await page.evaluate(() => {
        const grid = document.createElement("div");
        grid.id = "qa-optical-grid";
        Object.assign(grid.style, {
          position: "absolute",
          inset: "0",
          zIndex: "0",
          background:
            "repeating-conic-gradient(#eee 0% 25%,#162642 0% 50%) 0 0 / 18px 18px",
          pointerEvents: "none",
        });
        document.querySelector(".ax-site-header").before(grid);
      });
      const header = page.locator(".ax-site-header");
      await header.screenshot({
        path: root + "/browsers/refraction-enabled.png",
      });
      const scales = await page.evaluate(() =>
        [...document.querySelectorAll(".ax-site-header feDisplacementMap")].map(
          (e) => {
            const n = e.getAttribute("scale");
            e.setAttribute("scale", "0");
            return n;
          },
        ),
      );
      await page.waitForTimeout(100);
      await header.screenshot({
        path: root + "/browsers/refraction-zero-displacement.png",
      });
      const a = await sharp(root + "/browsers/refraction-enabled.png")
          .ensureAlpha()
          .raw()
          .toBuffer(),
        b = await sharp(root + "/browsers/refraction-zero-displacement.png")
          .ensureAlpha()
          .raw()
          .toBuffer();
      let changed = 0,
        total = 0;
      for (let i = 0; i < a.length; i += 4) {
        const d =
          Math.abs(a[i] - b[i]) +
          Math.abs(a[i + 1] - b[i + 1]) +
          Math.abs(a[i + 2] - b[i + 2]);
        if (d > 9) changed++;
        total += d;
      }
      assert(
        changed > 100,
        "SVG exists but refraction did not change rendered pixels",
      );
      records.push({
        name,
        mode,
        opticalPixelProof: {
          changedPixels: changed,
          totalRgbDifference: total,
          scales,
        },
      });
      await page.evaluate(() =>
        document.querySelector("#qa-optical-grid").remove(),
      );
      await page.reload();
    } else {
      assert.notEqual(mode, "live-backdrop");
      records.push({ name, mode });
    }
    await page
      .getByRole("button", { name: "Бусад хуудас", exact: true })
      .click();
    const menu = page.getByRole("menu");
    await menu.waitFor();
    const menuBox = await menu.boundingBox(),
      trigger = await page
        .getByRole("button", { name: "Бусад хуудас", exact: true })
        .boundingBox();
    assert(menuBox.y >= trigger.y + trigger.height - 1);
    await page.screenshot({ path: `${root}/browsers/${name}-desktop.png` });
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    const dock = await page.locator(".ax-mobile-dock").boundingBox();
    assert(dock.width <= 340 && dock.height >= 60 && dock.height <= 68);
    assert(dock.x >= 0 && dock.x + dock.width <= 390);
    await page.screenshot({ path: `${root}/browsers/${name}-mobile.png` });
    const selected = await page
        .locator('.ax-mobile-dock [aria-current="page"]')
        .boundingBox(),
      lens = await page
        .locator(".ax-mobile-dock .ax-active-lens")
        .boundingBox();
    assert(
      Math.abs(selected.x - lens.x) < 2 &&
        Math.abs(selected.y - lens.y) < 2 &&
        Math.abs(selected.width - lens.width) < 2,
      "Dock indicator must align with active item",
    );
    records.push({ name, dock, errors });
    assert.deepEqual(errors, []);
    if (name === "chrome") {
      await page.emulateMedia({ forcedColors: "active" });
      await page.waitForFunction(
        () =>
          document.querySelector(".ax-mobile-dock [data-ax-glass]")?.dataset
            .axGlassMode === "static-fallback",
      );
      assert.equal(
        await page
          .locator(".ax-mobile-dock [data-ax-glass]")
          .first()
          .getAttribute("data-ax-glass-mode"),
        "static-fallback",
      );
      await page.emulateMedia({ forcedColors: "none" });
      const withoutObserver = await browser.newPage();
      await withoutObserver.addInitScript(() => {
        window.ResizeObserver = undefined;
      });
      const fallbackErrors = [];
      withoutObserver.on("pageerror", (e) => fallbackErrors.push(e.stack || e.message));
      await withoutObserver.goto(base, {waitUntil:"domcontentloaded",timeout:60000});
      await withoutObserver.waitForTimeout(1000);
      console.log('Missing ResizeObserver diagnostic',fallbackErrors,await withoutObserver.locator('[data-ax-glass]').evaluateAll(es=>es.map(e=>e.getAttribute('data-ax-glass-mode'))));
      await withoutObserver
        .locator('[data-ax-glass-mode="static-fallback"]')
        .first()
        .waitFor({ state: "attached" });
      assert.deepEqual(fallbackErrors, []);
      await withoutObserver.close();
    }
  } finally {
    await browser.close();
    fs.writeFileSync(
      root + "/browsers/results.json",
      JSON.stringify(records, null, 2),
    );
  }
}
console.log(JSON.stringify(records, null, 2));
