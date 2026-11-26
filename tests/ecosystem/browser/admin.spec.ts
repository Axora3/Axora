import { test, expect, type BrowserContext } from "@playwright/test";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
const admin = "00000000-0000-4000-8000-000000000001";

test("notification entries open their detail and preferences open the real settings panel", async ({ page, context }) => {
  await login(context);
  await page.goto("/admin/settings");
  await page.getByRole("button", { name: /^Мэдэгдэл/ }).first().click();
  await page.getByRole("link", { name: /QA notification/ }).click();
  await expect(page).toHaveURL(/\/admin\/notifications\/00000000-0000-4000-8000-000000000099$/);
  await expect(page.getByRole("heading", { name: "QA notification", exact: true })).toBeVisible();
  await expect(page.getByText("QA notification detail", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /^Мэдэгдэл/ }).first().click();
  await page.getByRole("link", { name: "Мэдэгдлийн тохиргоо", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/settings#notification-preferences$/);
  await expect(page.getByRole("checkbox", { name: /Товч жагсаалтад зөвхөн уншаагүй/ })).toBeVisible();
});

test("notification preferences persist and authenticated admin chrome fits phone widths", async ({ page, context }) => {
  await login(context);
  await page.goto("/admin/settings#notification-preferences");
  const preference = page.getByRole("checkbox", { name: /Товч жагсаалтад зөвхөн уншаагүй/ });
  await expect(preference).not.toBeChecked();
  await preference.check();
  await page.reload();
  await expect(preference).toBeChecked();
  for (const width of [320, 360, 375, 390, 430, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 960 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: `artifacts/axora-upgrade/admin-settings-${width}.png`, fullPage: true });
  }
});
async function login(context: BrowserContext, id = admin) {
  const jwt =
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
      "base64url",
    ) +
    "." +
    Buffer.from(
      JSON.stringify({
        sub: id,
        aud: "authenticated",
        role: "authenticated",
        exp: Math.floor(Date.now() / 1000) + 7200,
      }),
    ).toString("base64url") +
    "." +
    Buffer.from("fixture-only-signature").toString("base64url");
  let values: Array<{ name: string; value: string; options?: CookieOptions }> =
    [];
  const client = createServerClient(
    "http://127.0.0.1:43234",
    "fixture-anon-key",
    {
      cookies: {
        getAll: () => [],
        setAll: (
          cookies: Array<{
            name: string;
            value: string;
            options?: CookieOptions;
          }>,
        ) => {
          values = cookies;
        },
      },
    },
  );
  const session = await client.auth.setSession({
    access_token: jwt,
    refresh_token: "fixture-refresh",
  });
  expect(session.error).toBeNull();
  expect(values.length).toBeGreaterThan(0);
  await context.addCookies(
    values.map((c) => ({
      name: c.name,
      value: c.value,
      domain: "localhost",
      path: "/",
      sameSite: "Lax" as const,
    })),
  );
}
test("existing Axora admin shell and all ecosystem sections render responsively without server credentials", async ({
  page,
  context,
}) => {
  await login(context);
  await page.goto("/admin/ecosystem");
  await expect(
    page.getByRole("heading", { name: "AXORA экосистем" }),
  ).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Экосистемийн хэсгүүд" });
  for (const button of await nav.getByRole("button").all()) {
    await button.click();
    await expect(page.locator("main#main")).not.toBeEmpty();
  }
  await nav.getByRole("button", { name: "Тойм", exact: true }).click();
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({
    path: "test-results/axora-ecosystem-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.screenshot({
    path: "test-results/axora-ecosystem-mobile.png",
    fullPage: true,
  });
  const html = await page.content();
  expect(html).not.toContain("fixture-service-role-key");
  expect(html).not.toContain("fixture-ecosystem-service-");
});
test("actual admin registration and Factory intake persist, while unavailable dashboard provisioning stays blocked", async ({
  page,
  context,
}) => {
  await login(context);
  await page.goto("/admin/ecosystem");
  await page
    .getByRole("navigation", { name: "Экосистемийн хэсгүүд" })
    .getByRole("button", { name: "Захиалга ба шаардлага", exact: true })
    .click();
  await page.getByRole("button", { name: "Холбох", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Factory шаардлагыг хянах" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Factory шаардлагыг хянах" }).click();
  const textarea = page.locator("textarea").first();
  const value = JSON.parse(await textarea.inputValue());
  value.answers.businessType = "online_store";
  value.answers.dataBackend = "google_sheets";
  value.enabledModules = ["products", "categories"];
  await textarea.fill(JSON.stringify(value));
  await page.getByRole("button", { name: "Хадгалах", exact: true }).click();
  await page.getByRole("button", { name: "Хаах", exact: true }).click();
  await page
    .getByRole("button", { name: "Factory-д илгээх", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Нэг ажил боловсруулах", exact: true })
    .click();
  await expect(page.locator("main#main")).toContainText("Илгээсэн");
  await page
    .getByRole("button", { name: "Backend / Sheets бэлтгэх", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Нэг ажил боловсруулах", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "dashboard_contract_unavailable" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Экосистемийн хэсгүүд" })
    .getByRole("button", { name: "Захиалгын эрх", exact: true })
    .click();
  await expect(page.locator("main#main")).toContainText(
    "Хүргэлт баталгаажаагүй",
  );
});
test("anonymous and cross-origin admin operations are denied", async ({
  page,
  context,
  browser,
}) => {
  const anonymous = await browser.newContext();
  const r = await anonymous.request.get(
    "http://localhost:43235/api/admin/ecosystem",
  );
  expect([401, 403]).toContain(r.status());
  await anonymous.close();
  await login(context);
  await page.goto("/admin/ecosystem");
  const result = await page.request.post("/api/admin/ecosystem", {
    headers: { Origin: "https://attacker.example.invalid" },
    data: {
      action: "register",
      key: "00000000-0000-4000-8000-000000000099",
      data: {},
    },
  });
  expect(result.status()).toBe(403);
});
