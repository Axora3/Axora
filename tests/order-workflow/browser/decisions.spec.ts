import { test, expect } from "@playwright/test";
import { login } from "../../ecosystem/browser/fixture-auth";
import { submitQuestionnaire } from "./questionnaire";
for (const action of ["revision", "reject"] as const)
  test(`customer ${action} through actual questionnaire and persistent browser actions`, async ({
    browser,
  }) => {
    test.setTimeout(90000);
    const customer = await browser.newContext({
        viewport: { width: 390, height: 1000 },
        extraHTTPHeaders: {
          "x-forwarded-for":
            action === "revision" ? "192.0.2.35" : "192.0.2.36",
        },
      }),
      admin = await browser.newContext();
    await login(admin, "http://127.0.0.1:43434");
    const c = await customer.newPage(),
      a = await admin.newPage();
    const created = await submitQuestionnaire(c);
    await a.goto("/admin/orders/" + created.orderId);
    await a
      .getByLabel("Анкет, задаргаа, давхардал болон тусгай шаардлагыг хянасан")
      .check();
    await a
      .getByRole("button", { name: "Үнийн саналыг баталж илгээх", exact: true })
      .click();
    await expect(a.getByText("Хадгаллаа.", { exact: true })).toBeVisible();
    await c.goto(created.trackingUrl);
    await c
      .getByRole("button", {
        name: action === "revision" ? "Өөрчлөлт хүсэх" : "Татгалзах",
        exact: true,
      })
      .click();
    if (action === "revision")
      await c
        .getByLabel("Тайлбар (заавал)")
        .fill("Нэмэлт хуудасны хүсэлтийг хянана уу.");
    await c.getByRole("button", { name: "Батлах", exact: true }).click();
    await c.reload();
    await expect(
      c.getByRole("heading", {
        name:
          action === "revision"
            ? "Засварын хүсэлтийг хянаж байна"
            : "Үнийн саналаас татгалзсан",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      c.getByRole("button", {
        name: "Төлбөр шилжүүлснээ мэдэгдэх",
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(
      c.getByText("Хариултаа JSON-оор татах", { exact: true }),
    ).toHaveCount(0);
    await c.screenshot({
      path: `qa-evidence/axora-upgrade/mobile/customer-${action}.png`,
      fullPage: true,
    });
    await a.reload();
    if (action === "revision")
      await expect(
        a.getByText(
          "Хэрэглэгчийн засварын хүсэлт: Нэмэлт хуудасны хүсэлтийг хянана уу.",
          { exact: true },
        ),
      ).toBeVisible();
    await customer.close();
    await admin.close();
  });
