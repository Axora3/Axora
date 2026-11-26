import { chromium } from "@playwright/test";
import fs from "node:fs";
(async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  const evidence = "qa-evidence/axora-upgrade",
    stage = process.argv[2] === "after" ? "after" : "before";
  for (const dir of ["before", "after", "mobile", "workflow"])
    fs.mkdirSync(`${evidence}/${dir}`, { recursive: true });
  const results = [];
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({
        viewport: { width, height: 1000 },
        reducedMotion: "reduce",
      });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      for (const route of [
        "/",
        "/templates",
        "/builder",
        "/order",
        "/admin/login",
      ]) {
        const response = await page.goto("http://localhost:3000" + route, {
          waitUntil: "domcontentloaded",
        });
        await page.locator("main").first().waitFor();
        await page.screenshot({
          path: `${evidence}/${stage}/${route.replaceAll("/", "_") || "home"}-${width}.png`,
          fullPage: true,
        });
        results.push({
          url: page.url(),
          width,
          status: response.status(),
          geometry: await page.evaluate(() => ({
            width: innerWidth,
            scrollWidth: document.documentElement.scrollWidth,
            height: innerHeight,
            scrollHeight: document.documentElement.scrollHeight,
            headerCount: document.querySelectorAll(".ax-site-header").length,
            builder: document
              .querySelector(".ax-builder-grid")
              ?.getBoundingClientRect()
              .toJSON(),
            styles: [...document.querySelectorAll("main section")].map((e) => ({
              className: e.className,
              background: getComputedStyle(e).backgroundColor,
              border: getComputedStyle(e).borderTopWidth,
              filter: getComputedStyle(e).backdropFilter,
            })),
          })),
          errors: [...errors],
        });
        if (route === "/" && width === 1440) {
          const trigger = page.getByRole("button", {
            name: "Бусад хуудас",
            exact: true,
          });
          await trigger.click();
          const menu = page.getByRole("menu", {
            name: "Бусад хуудас",
            exact: true,
          });
          results.push({
            dropdown: {
              trigger: await trigger.boundingBox(),
              menu: await menu.boundingBox(),
            },
          });
          await page.screenshot({
            path: `${evidence}/before/dropdown-1440.png`,
          });
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
    fs.writeFileSync(
      `${evidence}/runtime-${stage}.json`,
      JSON.stringify(results, null, 2),
    );
  }
  console.log(
    results.map((r) => ({
      url: r.url,
      width: r.width,
      status: r.status,
      geometry: r.geometry && {
        height: r.geometry.scrollHeight,
        width: r.geometry.scrollWidth,
      },
      errors: r.errors,
      dropdown: r.dropdown,
    })),
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
