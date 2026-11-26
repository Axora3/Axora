import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
test.afterEach(async ({ request }) => {
  await request.post("http://127.0.0.1:43434/__catalog", { data: {} });
});
test("real streamed loading colors in both themes, loaded, empty and recoverable error states", async ({
  browser,
  request,
}) => {
  const styles = [];
  for (const theme of ["light", "dark"]) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    await page.addInitScript(
      (t) => localStorage.setItem("axora-theme", t),
      theme,
    );
    await request.post("http://127.0.0.1:43434/__catalog", {
      data: { hold: true },
    });
    await page.goto("/templates", { waitUntil: "commit" });
    await expect(
      page.getByText("Загваруудыг ачаалж байна…", { exact: true }),
    ).toBeVisible();
    const colors = await page
      .locator("main .ax-sk")
      .evaluateAll((els) =>
        els.map((e) => getComputedStyle(e).backgroundImage),
      );
    expect(colors.length).toBeGreaterThan(0);
    for (const color of colors) {
      expect(color).toContain("linear-gradient");
      const stops = [...color.matchAll(/rgb\((\d+), (\d+), (\d+)\)/g)];
      expect(stops.length).toBeGreaterThan(0);
      for (const stop of stops) {
        expect(Number(stop[2])).toBeLessThanOrEqual(Number(stop[3]));
        expect(Number(stop[3])).toBeGreaterThan(0);
      }
    }
    styles.push({ theme, colors });
    await page.screenshot({
      path: `qa-evidence/axora-upgrade/after/loading-${theme}.png`,
    });
    await request.post("http://127.0.0.1:43434/__catalog", { data: {} });
    await expect(
      page.getByText("6 загвар олдлоо", { exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: `qa-evidence/axora-upgrade/after/catalog-${theme}.png`,
    });
    await page.close();
  }
  const page = await browser.newPage();
  try {
    await request.post("http://127.0.0.1:43434/__catalog", {
      data: { empty: true },
    });
    await page.goto("/templates");
    await expect(
      page.getByRole("heading", { name: "Одоогоор нийтлэгдсэн загвар алга" }),
    ).toBeVisible();
    await request.post("http://127.0.0.1:43434/__catalog", {
      data: { error: true },
    });
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Загваруудыг ачаалж чадсангүй" }),
    ).toBeVisible();
    await request.post("http://127.0.0.1:43434/__catalog", { data: {} });
    await page
      .getByRole("button", { name: "Дахин оролдох", exact: true })
      .click();
    await expect(
      page.getByText("6 загвар олдлоо", { exact: true }),
    ).toBeVisible();
  } finally {
    await request.post("http://127.0.0.1:43434/__catalog", { data: {} });
    await page.close();
  }
  writeFileSync(
    "qa-evidence/axora-upgrade/loading-colors.json",
    JSON.stringify(styles, null, 2),
  );
});
