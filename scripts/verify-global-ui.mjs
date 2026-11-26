import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";

const base = "http://localhost:43113";
const dir = "artifacts/global-ui-fix";
await fs.mkdir(dir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const routes = [
  "/",
  "/templates",
  "/builder",
  "/order",
  "/services",
  "/contact",
  "/privacy",
  "/favorites",
  "/compare",
  "/bundles",
  "/portfolio",
  "/learn",
  "/blog",
  "/english-words",
];
const results = [];
const discovered = new Set();
const failures = [];
try {
  for (const width of [320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    let expectedHeader;
    for (const route of routes) {
      const response = await page.goto(base + route, { waitUntil: "domcontentloaded" });
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator(".ax-site-header")).toHaveCount(1);
      const metrics = await page.evaluate(() => {
        const h = document.querySelector(".ax-site-header"),
          r = h.getBoundingClientRect(),
          s = getComputedStyle(h);
        const a = document.querySelector("aside[aria-label='Тохиргоо']");
        return {
          overflow:
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth + 1,
          header: {
            width: r.width,
            height: r.height,
            left: r.left,
            top: r.top,
            radius: s.borderRadius,
          },
          sidebar: a ? { width: a.clientWidth, scroll: a.scrollWidth } : null,
        };
      });
      expectedHeader ??= metrics.header;
      const problems = [];
      if (response.status() >= 400) problems.push(`HTTP ${response.status()}`);
      if (metrics.overflow) problems.push("document overflow");
      if (JSON.stringify(metrics.header) !== JSON.stringify(expectedHeader))
        problems.push("header differs between routes");
      if (metrics.sidebar && metrics.sidebar.scroll > metrics.sidebar.width + 1)
        problems.push("sidebar overflow");
      if (errors.length) problems.push(...errors.splice(0));
      const row = { width, route, ...metrics, problems };
      results.push(row);
      if (problems.length) failures.push(row);
      if (width === 1440)
        for (const href of await page
          .locator('a[href^="/"]')
          .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("href"))))
          if (
            /^\/(blog|learn|portfolio|templates|bundles)\/[^/?#]+$/.test(href)
          )
            discovered.add(href);
      if (
        [390, 1440].includes(width) &&
        ["/", "/templates", "/builder", "/order"].includes(route)
      )
        await page.screenshot({
          path: `${dir}/${route === "/" ? "home" : route.slice(1)}-${width}.png`,
        });
      if (route === "/") {
        const process = page.locator("section[aria-labelledby='how-title']");
        const surface = await process.evaluate((e) => {
          const s = getComputedStyle(e);
          return {
            bg: s.backgroundColor,
            top: s.borderTopWidth,
            bottom: s.borderBottomWidth,
            blur: s.backdropFilter,
          };
        });
        if (
          surface.bg !== "rgba(0, 0, 0, 0)" ||
          surface.top !== "0px" ||
          surface.bottom !== "0px" ||
          surface.blur !== "none"
        )
          failures.push({ width, processSurface: surface });
        if ([390, 1440].includes(width)) {
          await process.scrollIntoViewIfNeeded();
          await process.screenshot({ path: `${dir}/process-${width}.png` });
          await process
            .getByRole("button", { name: "Бэлэн загвар", exact: true })
            .click();
          await expect(process.locator("li").first()).toContainText(
            "Загвараа сонгох",
          );
          await process
            .getByRole("button", { name: "Захиалгат веб", exact: true })
            .click();
          await expect(process.locator("li").first()).toContainText(
            "Вебээ загварчлах",
          );
        }
        await page.evaluate(() =>
          window.scrollTo(0, document.documentElement.scrollHeight),
        );
        const gap = await page.evaluate(
          () =>
            document.documentElement.scrollHeight -
            (document
              .querySelector("footer.ax-site-footer")
              .getBoundingClientRect().bottom +
              scrollY),
        );
        if (Math.abs(gap) > 1) failures.push({ width, footerGap: gap });
        if ([390, 1440].includes(width))
          await page.screenshot({ path: `${dir}/footer-${width}.png` });
      }
      // Exercise both parts of the canonical brand lockup, alternating by viewport.
      await page.evaluate(() => window.scrollTo(0, 0));
      const brand = page.getByRole("link", {
        name: "AXORA — Нүүр хуудас",
        exact: true,
      });
      await brand
        .locator("svg")
        .nth(width % 2 ? 0 : 1)
        .click();
      await expect(page).toHaveURL(base + "/");
    }
    await page.close();
  }
  // Real linked detail routes, where available, also share the canonical header.
  for (const route of discovered) for(const detailWidth of [320,360,375,390,430,768,1024,1280,1440,1920]) {
    const page = await browser.newPage({
      viewport: { width: detailWidth, height: 1000 },
      reducedMotion: "reduce",
    });
    const response = await page.goto(base + route, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".ax-site-header")).toHaveCount(1);
    results.push({ route, width: detailWidth, detailStatus: response.status() });
    if (response.status() >= 400)
      failures.push({ route, status: response.status() });
    await page.close();
  }
  // Builder state, live preview, collapse, reset, device controls and order handoff.
  const page = await browser.newPage({
    viewport: { width: 390, height: 1000 },
    reducedMotion: "reduce",
  });
  await page.goto(base + "/builder", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Гоо сайхан \/ Үйлчилгээ/ }).click();
  await page.getByRole("button", { name: /Elegant/ }).click();
  await page.getByRole("button", { name: "Ocean", exact: true }).click();
  await page.locator("#bx-name").fill("AXORA QA");
  const summary = page
    .locator("summary")
    .filter({ hasText: "Бизнесийн төрөл" });
  await summary.click();
  await expect(page.locator("details").first()).not.toHaveAttribute("open", "");
  await summary.click();
  await page.getByRole("button", { name: "Харах", exact: true }).click();
  await expect(page.locator(".ax-builder-preview")).toBeVisible();
  await expect(
    page
      .locator(".ax-builder-preview")
      .getByText("AXORA QA", { exact: true })
      .first(),
  ).toBeVisible();
  for (const device of ["Desktop", "Tablet", "Mobile"]) {
    await page.getByRole("button", { name: device, exact: true }).click();
  }
  await page.getByRole("button", { name: "Тохируулах", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Гоо сайхан \/ Үйлчилгээ/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("link", { name: "Захиалга руу", exact: true }).click();
  await expect(page).toHaveURL(base + "/order");
  await expect(page.locator(".ax-site-header")).toHaveCount(1);
  await page.goto(base + "/builder", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#bx-name")).toHaveValue(
    "AXORA QA",
  );
  await page
    .getByRole("button", { name: "Анхны төлөвт буцаах", exact: true })
    .click();
  await page.getByRole("button", { name: "Болих", exact: true }).click();
  await expect(page.locator("#bx-name")).toHaveValue(
    "AXORA QA",
  );
  await page
    .getByRole("button", { name: "Анхны төлөвт буцаах", exact: true })
    .click();
  await page.getByRole("button", { name: "Буцаах", exact: true }).click();
  await expect(
    page.locator("#bx-name"),
  ).not.toHaveValue("AXORA QA");
  await page.getByRole("button", { name: "Цэс нээх", exact: true }).click();
  await page.getByRole("dialog", { name: "Цэс", exact: true }).waitFor();
  await page
    .getByRole("dialog", { name: "Цэс", exact: true })
    .getByRole("link", { name: "AXORA нүүр", exact: true })
    .click();
  await expect(page).toHaveURL(base + "/");
  await expect(
    page.getByRole("dialog", { name: "Цэс", exact: true }),
  ).toHaveCount(0);
  await page.goto(base + "/services", { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: "AXORA — Нүүр хуудас", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(base + "/");
  await page.close();
} catch (error) {
  failures.push({ exception: error.stack });
} finally {
  await browser.close();
  await fs.writeFile(
    `${dir}/results.json`,
    JSON.stringify({ results, failures, discovered: [...discovered] }, null, 2),
  );
}
console.log(
  JSON.stringify(
    { checks: results.length, failures, detailRoutes: discovered.size },
    null,
    2,
  ),
);
if (failures.length) process.exitCode = 1;
