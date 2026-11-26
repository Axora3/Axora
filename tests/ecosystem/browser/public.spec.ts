import { test, expect } from "@playwright/test";

test("mobile menu, dock and keyboard brand navigation remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.goto("/builder");
  await page.getByRole("button", { name: "Цэс нээх", exact: true }).click();
  const menu = page.getByRole("dialog", { name: "Цэс", exact: true });
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: "AXORA нүүр", exact: true }).click();
  await expect(page).toHaveURL("http://localhost:43235/");
  await expect(menu).toHaveCount(0);
  const dock = page.getByRole("navigation", { name: "Доод цэс" });
  await dock.getByRole("link", { name: "Загварууд", exact: true }).click();
  await expect(page).toHaveURL(/\/templates$/);
  await expect(dock.locator('a[aria-current="page"]')).toHaveAttribute(
    "href",
    "/templates",
  );
  await page
    .getByRole("link", { name: "AXORA — Нүүр хуудас", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("http://localhost:43235/");
});

test("route changes preserve one header and the correct dock without hydration errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat/i.test(message.text()))
      errors.push(message.text());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 1000 });
  for (const route of [
    "/",
    "/order",
    "/builder",
    "/templates",
    "/services",
    "/compare",
    "/contact",
    "/order",
    "/",
  ]) {
    await page.goto(route);
    await expect(page.locator(".ax-site-header")).toHaveCount(1);
    const glass = await page
      .locator(".ax-site-header [data-ax-glass]")
      .first()
      .evaluate((element) => ({
        blur: getComputedStyle(element).backdropFilter,
        reduced: matchMedia("(prefers-reduced-transparency: reduce)").matches,
      }));
    if (!glass.reduced) expect(glass.blur).toContain("blur(");
    await expect(
      page.getByRole("navigation", { name: "Доод цэс" }),
    ).toHaveCount(["/order", "/builder"].includes(route) ? 0 : 1);
    for (const index of [0, 1]) {
      if (index) await page.goto(route);
      await page
        .getByRole("link", { name: "AXORA — Нүүр хуудас", exact: true })
        .locator("svg")
        .nth(index)
        .click();
      await expect(page).toHaveURL("http://localhost:43235/");
    }
  }
  expect(errors).toEqual([]);
});

test("builder selection, preview, dialog focus and reset remain functional", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.goto("/builder");
  await page.getByRole("button", { name: /Гоо сайхан \/ Үйлчилгээ/ }).click();
  await page.getByRole("button", { name: /Elegant/ }).click();
  await page.getByRole("button", { name: "Ocean", exact: true }).click();
  await page.locator("#bx-name").fill("QA studio");
  await page.getByRole("button", { name: "Харах", exact: true }).click();
  await expect(
    page
      .locator(".ax-builder-preview")
      .getByText("QA studio", { exact: true })
      .first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Тохируулах", exact: true }).click();
  await page
    .getByRole("button", { name: "Анхны төлөвт буцаах", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page.evaluate(
      () => !!document.activeElement?.closest('[role="dialog"]'),
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  // Instant navigation may retain a hidden cached Builder tree. Verify the
  // active control, preserving the same persisted-value assertion.
  await expect(page.locator("#bx-name:visible")).toHaveValue("QA studio");
  await page.getByRole("link", { name: "Захиалга руу", exact: true }).click();
  await expect(page).toHaveURL(/\/order$/);
  await page.goto("/builder");
  await expect(page.locator("#bx-name")).toHaveValue("QA studio");
  await page
    .getByRole("button", { name: "Анхны төлөвт буцаах", exact: true })
    .click();
  await page.getByRole("button", { name: "Буцаах", exact: true }).click();
  await expect(page.locator("#bx-name")).not.toHaveValue("QA studio");
});

test("contact and login validation expose field errors before any write", async ({
  page,
}) => {
  const writes: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST")
      writes.push(new URL(request.url()).pathname);
  });
  await page.goto("/contact");
  await page.locator("#ct-name").waitFor();
  await page
    .locator("#ct-name")
    .locator("xpath=ancestor::form")
    .getByRole("button", { name: /илгээх/i })
    .click();
  await expect(page.locator("#ct-name")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.locator("#ct-name")).toBeFocused();
  await page.goto("/admin/login");
  await page.getByRole("button", { name: "Нэвтрэх", exact: true }).click();
  await expect(page.locator("#lg-email")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.locator("#lg-email")).toBeFocused();
  expect(
    writes.filter((path) => path === "/api/contact" || path.includes("/auth/")),
  ).toEqual([]);
});
