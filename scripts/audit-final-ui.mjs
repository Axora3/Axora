import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const base = process.env.AXORA_QA_URL || "http://localhost:43114";
const phase = process.argv.includes("--final") ? "final" : "initial";
const output = `artifacts/final-qa/${phase}`;
await fs.mkdir(output, { recursive: true });
async function walk(dir) {
  return (
    await Promise.all(
      (await fs.readdir(dir, { withFileTypes: true })).map((e) =>
        e.isDirectory()
          ? walk(path.join(dir, e.name))
          : [path.join(dir, e.name)],
      ),
    )
  ).flat();
}
const files = await walk("src/app");
const pageFiles = files.filter(
  (p) =>
    p.replaceAll("\\", "/").endsWith("/page.tsx") &&
    !/[\\/](admin|dev|api)[\\/]/.test(p),
);
const routeOf = (p) =>
  "/" +
  path
    .dirname(path.relative("src/app", p))
    .replaceAll("\\", "/")
    .replace(/\([^/]+\)\/?/g, "")
    .replace(/^\.$/, "");
const routes = pageFiles.map(routeOf).filter((r) => !r.includes("["));
const dynamicPatterns = pageFiles.map(routeOf).filter((r) => r.includes("["));
const protectedFiles = [
  ...(await walk("public/images/cinematic")),
  ...(await walk("src/components/background")),
  "src/components/cinematic/GlobalBackground.tsx",
];
const checksums = [];
for (const file of protectedFiles) {
  const bytes = await fs.readFile(file),
    relative = file.replaceAll("\\", "/");
  let matchesGit = null;
  try {
    matchesGit =
      execFileSync("git", ["hash-object", file], {
        encoding: "utf8",
      }).trim() ===
      execFileSync("git", ["rev-parse", `HEAD:${relative}`], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
  } catch {}
  checksums.push({
    file: relative,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    matchesGit,
  });
}
const browser = await chromium.launch({ channel: "chrome" });
const rows = [],
  issues = [],
  consoleMessages = [],
  network = [],
  details = new Set();
try {
  for (const width of [320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    let route = "";
    page.on("pageerror", (e) =>
      issues.push({ width, route, type: "pageerror", message: e.message }),
    );
    page.on("console", (m) => {
      if (["error", "warning"].includes(m.type()))
        consoleMessages.push({
          width,
          route,
          type: m.type(),
          message: m.text(),
        });
      if (m.type() === "error" && /hydrat|WebGL/i.test(m.text()))
        issues.push({ width, route, type: "console", message: m.text() });
    });
    page.on("requestfailed", (r) => {
      if (!/ERR_ABORTED/.test(r.failure()?.errorText || ""))
        network.push({
          width,
          route,
          url: new URL(r.url()).pathname,
          error: r.failure()?.errorText,
        });
    });
    page.on("response", (r) => {
      if (r.status() >= 400)
        network.push({
          width,
          route,
          url: new URL(r.url()).pathname,
          status: r.status(),
        });
    });
    let canonical;
    for (route of routes) {
      await page.goto(base + route, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator(".ax-site-header")).toHaveCount(1);
      // Walk the entire page, triggering lazy content and checking geometry after each screen.
      const scrollErrors = [];
      for (
        let y = 0;
        y < (await page.evaluate(() => document.documentElement.scrollHeight));
        y += 800
      ) {
        await page.evaluate((y) => window.scrollTo(0, y), y);
        if (
          await page.evaluate(
            () =>
              document.documentElement.scrollWidth >
              document.documentElement.clientWidth + 1,
          )
        )
          scrollErrors.push(y);
      }
      await page.evaluate(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
        return new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        );
      });
      const metrics = await page.evaluate(() => {
        const h = document.querySelector(".ax-site-header"),
          r = h.getBoundingClientRect(),
          style = getComputedStyle(h);
        const sidebar = document.querySelector(".ax-builder-sidebar");
        const footer = document.querySelector("footer.ax-site-footer");
        const nested = [
          ...document.querySelectorAll(
            ".ax-builder-sidebar,.ax-builder-toolbar,.ax-builder-group,.ax-panel,.ax-surface",
          ),
        ]
          .filter(
            (e) =>
              e.getBoundingClientRect().height > 0 &&
              !e.closest(".ax-light") &&
              e.scrollWidth > e.clientWidth + 1,
          )
          .map((e) => ({
            class: e.className,
            client: e.clientWidth,
            scroll: e.scrollWidth,
          }));
        const sections = [
          ...document.querySelectorAll("main > section, main > div > section"),
        ]
          .filter((e) => e.getBoundingClientRect().width > innerWidth * 0.85)
          .map((e) => {
            const s = getComputedStyle(e);
            return {
              id: e.id || e.getAttribute("aria-labelledby"),
              class: e.className,
              background: s.backgroundColor,
              image: s.backgroundImage,
              blur: s.backdropFilter,
              borders: [s.borderTopWidth, s.borderBottomWidth],
              functional: !!e.querySelector("form"),
            };
          });
        const process = document.querySelector(
          'section[aria-labelledby="how-title"]',
        );
        const p = process ? getComputedStyle(process) : null;
        return {
          header: {
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height,
            radius: style.borderRadius,
            blur: style.backdropFilter,
          },
          nested,
          sections,
          process: p
            ? {
                background: p.backgroundColor,
                borderTop: p.borderTopWidth,
                borderBottom: p.borderBottomWidth,
                blur: p.backdropFilter,
              }
            : null,
          sidebar: sidebar
            ? {
                width: sidebar.clientWidth,
                scroll: sidebar.scrollWidth,
                background: getComputedStyle(sidebar).backgroundColor,
              }
            : null,
          footerGap: footer
            ? document.documentElement.scrollHeight -
              (footer.getBoundingClientRect().bottom + scrollY)
            : null,
          containerPadding: [...document.querySelectorAll(".ax-container")]
            .filter((e) => e.getBoundingClientRect().width > innerWidth * 0.7)
            .map((e) => parseFloat(getComputedStyle(e).paddingLeft)),
        };
      });
      canonical ??= metrics.header;
      const failures = [];
      if (scrollErrors.length)
        failures.push("horizontal overflow while scrolling");
      if (metrics.nested.length) failures.push("nested panel overflow");
      if (JSON.stringify(metrics.header) !== JSON.stringify(canonical))
        failures.push("header inconsistent");
      if (metrics.header.blur === "none") failures.push("header glass missing");
      if (metrics.header.top < 10 || metrics.header.left < 11)
        failures.push("header edge spacing");
      if (metrics.footerGap !== null && Math.abs(metrics.footerGap) > 1)
        failures.push("footer gap");
      if (metrics.containerPadding.some((p) => p < 15))
        failures.push("container padding");
      if (
        metrics.process &&
        (metrics.process.background !== "rgba(0, 0, 0, 0)" ||
          metrics.process.borderTop !== "0px" ||
          metrics.process.borderBottom !== "0px" ||
          metrics.process.blur !== "none")
      )
        failures.push("process surface");
      for (const s of metrics.sections)
        if (
          !s.functional &&
          (s.background !== "rgba(0, 0, 0, 0)" ||
            s.image !== "none" ||
            s.blur !== "none")
        )
          failures.push(`section surface: ${s.id || s.class}`);
      const row = { width, route, ...metrics, failures };
      rows.push(row);
      for (const message of failures) issues.push({ width, route, message });
      if (width === 1440)
        for (const href of await page
          .locator('a[href^="/"]')
          .evaluateAll((es) => es.map((e) => e.getAttribute("href"))))
          if (
            /^\/(templates|blog|learn|portfolio|bundles)\/[^/?#]+$/.test(href)
          )
            details.add(href);
      if ([390, 1440].includes(width)) {
        if (
          ["/", "/builder", "/templates", "/order", "/contact"].includes(route)
        )
          await page.screenshot({
            path: `${output}/${route === "/" ? "home" : route.slice(1)}-${width}.png`,
          });
        if (route === "/") {
          await page
            .locator('section[aria-labelledby="how-title"]')
            .screenshot({ path: `${output}/process-${width}.png` });
          await page.evaluate(() =>
            window.scrollTo(0, document.documentElement.scrollHeight),
          );
          await page.screenshot({ path: `${output}/footer-${width}.png` });
        }
      }
      if ([390, 1440].includes(width)) {
        await page.evaluate(() => window.scrollTo(0, 0));
        const brand = page.getByRole("link", {
          name: "AXORA — Нүүр хуудас",
          exact: true,
        });
        for (const svg of [0, 1]) {
          if (svg) await page.goto(base + route, { waitUntil: "load" });
          await brand.locator("svg").nth(svg).click();
          await expect(page).toHaveURL(base + "/", { timeout: 30000 });
        }
      }
    }
    await page.close();
    console.log(`Audited ${width}px: ${routes.length} routes`);
    await fs.writeFile(
      `${output}/progress.json`,
      JSON.stringify(
        {
          rows: rows.length,
          issues,
          latest: rows.slice(-routes.length),
          consoleMessages,
          network,
          checksums,
        },
        null,
        2,
      ),
    );
  }
  for (const route of details) {
    const p = await browser.newPage({ viewport: { width: 390, height: 1000 } });
    await p.goto(base + route, { waitUntil: "load" });
    await expect(p.locator(".ax-site-header")).toHaveCount(1);
    await p.close();
  }
} catch (e) {
  issues.push({ exception: e.stack });
} finally {
  await browser.close();
  for (const c of checksums) {
    c.unchangedDuringAudit =
      createHash("sha256")
        .update(await fs.readFile(c.file))
        .digest("hex") === c.sha256;
  }
  await fs.writeFile(
    `${output}/results.json`,
    JSON.stringify(
      {
        routes,
        dynamicPatterns,
        details: [...details],
        rows,
        issues,
        consoleMessages,
        network,
        checksums,
      },
      null,
      2,
    ),
  );
}
console.log(
  JSON.stringify(
    {
      phase,
      routes: routes.length,
      checks: rows.length,
      issues,
      console: consoleMessages.length,
      network: network.length,
    },
    null,
    2,
  ),
);
if (issues.length) process.exitCode = 1;
