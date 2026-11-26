import { test, expect } from "@playwright/test";
test("QA admin login uses the actual sign-in form and authenticated navigation", async ({
  page,
}) => {
  await page.goto("/admin/login");
  await page.getByLabel("Имэйл", { exact: true }).fill("admin@example.invalid");
  await page
    .getByLabel("Нууц үг", { exact: true })
    .fill("fixture-admin-only-2026");
  await page.getByRole("button", { name: "Нэвтрэх", exact: true }).click();
  await expect(page).toHaveURL("/admin");
  await expect(
    page.locator('nav a[href="/admin/orders"]').first(),
  ).toBeVisible();
});
