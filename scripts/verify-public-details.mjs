import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";

const audit = JSON.parse(await fs.readFile("artifacts/final-qa/final/results.json", "utf8"));
const base = process.env.AXORA_QA_URL || "http://localhost:43114";
const browser = await chromium.launch({ channel: "chrome" });
const rows = [], failures = [];
try {
  for (const route of audit.details) for (const width of [320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
    page.on("pageerror", error => failures.push({ route, width, error: error.message }));
    const response = await page.goto(base + route, { waitUntil: "load" });
    expect(response.status()).toBe(200);
    await expect(page.locator(".ax-site-header")).toHaveCount(1);
    const measured = await page.evaluate(() => {
      const header = document.querySelector(".ax-site-header"), rect = header.getBoundingClientRect(), style = getComputedStyle(header);
      return { overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, top: rect.top, radius: style.borderRadius, blur: style.backdropFilter };
    });
    expect(measured.overflow).toBe(false);
    expect(measured.top).toBeGreaterThanOrEqual(10);
    expect(measured.radius).toBe("32px");
    expect(measured.blur).toContain("blur(");
    for (const index of [0, 1]) {
      if (index) await page.goto(base + route, { waitUntil: "load" });
      await page.getByRole("link", { name: "AXORA — Нүүр хуудас", exact: true }).locator("svg").nth(index).click();
      await expect(page).toHaveURL(base + "/", { timeout: 30000 });
    }
    rows.push({ route, width, status: response.status(), ...measured });
    await page.close();
  }
} catch (error) { failures.push({ error: error.stack }); }
finally { await browser.close(); await fs.writeFile("artifacts/final-qa/details.json", JSON.stringify({ rows, failures }, null, 2)); }
console.log(JSON.stringify({ checks: rows.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
