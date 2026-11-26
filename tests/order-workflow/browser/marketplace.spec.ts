import { test, expect } from "@playwright/test";
test("marketplace categories, price, search, sorting, saved and combined selections change actual results", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/templates");
  await expect(
    page.getByText("6 загвар олдлоо", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Notion/ }).click();
  await expect(
    page.getByText("2 загвар олдлоо", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Үнэгүй/ }).click();
  await expect(
    page.getByText("1 загвар олдлоо", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Нэр, тайлбараар хайх").fill("Fixture template 0");
  await expect(page.locator("main article")).toHaveCount(1);
  await expect(page.locator("main article").getByRole("heading")).toHaveText(
    "Fixture template 0",
  );
  await page.screenshot({
    path: "qa-evidence/axora-upgrade/after/combined-filters.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Цэвэрлэх", exact: true }).click();
  await expect(
    page.getByText("6 загвар олдлоо", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Эрэмбэ", { exact: true }).selectOption("desc");
  await expect(
    page.locator("main article").first().getByRole("heading"),
  ).toHaveText("Fixture template 1");
  await page
    .getByRole("button", {
      name: "Fixture template 1 хадгалсан загварт нэмэх",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: /^Хадгалсан/ }).click();
  await expect(
    page.getByText("1 загвар олдлоо", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("main article").getByRole("heading")).toHaveText(
    "Fixture template 1",
  );
});
