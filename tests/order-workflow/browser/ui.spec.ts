import { test, expect, webkit } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
test("responsive dropdown, Builder overflow, catalog filters, neutral skeleton and native scrollbars", async ({
  browser,
}) => {
  test.setTimeout(180000);
  mkdirSync("artifacts/order-workflow/after", { recursive: true });
  const results: unknown[] = [];
  const wk = await webkit.launch({ channel: "" });
  for (const [engine, b] of [
    ["chromium", browser],
    ["webkit", wk],
  ] as const) {
    for (const width of engine === "chromium"
      ? [320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920]
      : [390, 1024, 1440]) {
      const page = await b.newPage({
        viewport: { width, height: 1000 },
        reducedMotion: "reduce",
      });
      await page.goto("/builder");
      await expect(page.locator(".ax-builder-grid")).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        width: innerWidth,
        height: document.documentElement.scrollHeight,
        workspace: document
          .querySelector(".ax-builder-grid")!
          .getBoundingClientRect()
          .toJSON(),
        scrollbar: getComputedStyle(document.documentElement).scrollbarWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(width + 1);
      if (width >= 1024) {
        expect(dimensions.height).toBeLessThanOrEqual(1040);
        expect(dimensions.workspace.bottom).toBeLessThanOrEqual(1000);
      }
      expect(dimensions.scrollbar).toBe("thin");
      results.push({ engine, ...dimensions });
      if ([390, 1440].includes(width))
        await page.screenshot({
          path: `artifacts/order-workflow/after/builder-${engine}-${width}.png`,
          fullPage: true,
        });
      await page.goto("/templates");
      await expect(
        page.getByText("6 загвар олдлоо", { exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width + 1);
      if (width < 1024) {
        await page
          .getByRole("button", { name: "Шүүлтүүр", exact: true })
          .click();
        const sheet = page.getByRole("dialog", {
          name: "Загвар шүүх",
          exact: true,
        });
        await expect(sheet).toBeVisible();
        await sheet.getByRole("button", { name: /Үнэгүй/ }).click();
        await sheet.getByRole("button", { name: "3 загвар харах" }).click();
        await expect(
          page.getByText("3 загвар олдлоо", { exact: true }),
        ).toBeVisible();
      } else {
        await page.getByRole("button", { name: /Үнэгүй/ }).click();
        await expect(
          page.getByText("3 загвар олдлоо", { exact: true }),
        ).toBeVisible();
      }
      if (width >= 1100) {
        await page.goto("/");
        const trigger = page.getByRole("button", {
          name: "Бусад хуудас",
          exact: true,
        });
        await trigger.click();
        const menu = page.getByRole("menu", {
          name: "Бусад хуудас",
          exact: true,
        });
        await expect(menu).toBeVisible();
        const t = (await trigger.boundingBox())!,
          m = (await menu.boundingBox())!;
        expect(Math.abs(m.x + m.width - t.x - t.width)).toBeLessThanOrEqual(2);
        expect(m.y).toBeGreaterThanOrEqual(t.y + t.height + 8);
        expect(m.x).toBeGreaterThanOrEqual(12);
        expect(m.y + m.height).toBeLessThanOrEqual(1000);
        await page.keyboard.press("End");
        await page.keyboard.press("Escape");
        await expect(trigger).toBeFocused();
        if (width === 1440) {
          await trigger.click();
          await page.screenshot({
            path: `artifacts/order-workflow/after/dropdown-${engine}.png`,
          });
        }
      }
      await page.close();
    }
  }
  await wk.close();
  writeFileSync(
    "artifacts/order-workflow/after-ui.json",
    JSON.stringify(results, null, 2),
  );
});
