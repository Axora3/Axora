import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { login } from "../../ecosystem/browser/fixture-auth";
test("dropdown destinations, outside, escape, resize and public headers", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const results = [];
  for (const route of [
    "/",
    "/templates",
    "/services",
    "/builder",
    "/contact",
    "/order",
    "/privacy",
  ]) {
    await page.goto(route);
    await expect(page.locator(".ax-site-header")).toHaveCount(1);
    const header = (await page.locator(".ax-header-inner").boundingBox())!;
    expect(header.x).toBeGreaterThan(0);
    const trigger = page.getByRole("button", {
      name: "Бусад хуудас",
      exact: true,
    });
    await trigger.click();
    const menu = page.getByRole("menu", { name: "Бусад хуудас", exact: true });
    await expect(menu).toBeVisible();
    const t = (await trigger.boundingBox())!,
      m = (await menu.boundingBox())!;
    expect(m.y - (t.y + t.height)).toBeGreaterThanOrEqual(8);
    expect(m.y - (t.y + t.height)).toBeLessThanOrEqual(12);
    results.push({ route, trigger: t, menu: m });
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await trigger.click();
    await page.mouse.click(5, 200);
    await expect(menu).toHaveCount(0);
  }
  const destinations = [
    "/english-words",
    "/bundles",
    "/portfolio",
    "/learn",
    "/blog",
    "/favorites",
    "/compare",
  ];
  for (const destination of destinations) {
    await page
      .getByRole("button", { name: "Бусад хуудас", exact: true })
      .click();
    await page
      .getByRole("menu", { name: "Бусад хуудас", exact: true })
      .locator(`a[href="${destination}"]`)
      .click();
    await expect(page).toHaveURL(new RegExp(destination + "$"));
    await expect(page.locator("main").first()).toBeVisible();
  }
  await page
    .getByRole("link", { name: "AXORA — Нүүр хуудас", exact: true })
    .click();
  await expect(page).toHaveURL("/");
  writeFileSync(
    "qa-evidence/axora-upgrade/dropdown-routes.json",
    JSON.stringify(results, null, 2),
  );
});
test("actual nested scrolling remains functional in Builder and admin panels", async ({
  context,
  page,
}) => {
  await login(context, "http://127.0.0.1:43434");
  await page.setViewportSize({ width: 1440, height: 600 });
  const result = [];
  for (const route of [
    "/builder",
    "/admin",
    "/admin/settings",
    "/admin/orders",
    "/admin/notifications",
  ]) {
    await page.goto(route);
    await expect(page.locator("main").first()).toBeVisible();
    const rows = await page.evaluate(() =>
      [
        document.documentElement,
        ...document.querySelectorAll<HTMLElement>("body *"),
      ]
        .filter((e) => {
          const s = getComputedStyle(e);
          return (
            (s.overflowY === "auto" ||
              s.overflowY === "scroll" ||
              e === document.documentElement) &&
            e.scrollHeight > e.clientHeight + 2 &&
            e.clientHeight > 0
          );
        })
        .map((e) => {
          const style = getComputedStyle(e),
            old = e.scrollTop;
          e.scrollTop = Math.min(60, e.scrollHeight - e.clientHeight);
          const moved = e.scrollTop > 0;
          e.scrollTop = old;
          return {
            tag: e.tagName,
            className: e.className,
            width: style.scrollbarWidth,
            scrollHeight: e.scrollHeight,
            clientHeight: e.clientHeight,
            moved,
          };
        }),
    );
    for (const row of rows) {
      expect(row.width).toBe("thin");
      expect(row.moved).toBe(true);
    }
    result.push({ route, rows });
  }
  writeFileSync(
    "qa-evidence/axora-upgrade/nested-scrollbars.json",
    JSON.stringify(result, null, 2),
  );
});
