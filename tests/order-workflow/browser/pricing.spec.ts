import { test, expect } from "@playwright/test";
import { login } from "../../ecosystem/browser/fixture-auth";
import { submitQuestionnaire } from "./questionnaire";
test.use({ extraHTTPHeaders: { "x-forwarded-for": "192.0.2.39" } });
test("accepted quote remains frozen when admin changes prices and new orders use persisted policy", async ({
  browser,
  request,
}) => {
  test.setTimeout(90000);
  const admin = await browser.newContext(),
    customer = await browser.newContext({
      extraHTTPHeaders: { "x-forwarded-for": "192.0.2.38" },
    });
  await login(admin, "http://127.0.0.1:43434");
  const a = await admin.newPage(),
    c = await customer.newPage();
  const order = await submitQuestionnaire(c);
  await a.goto("/admin/orders/" + order.orderId);
  await a
    .getByLabel("Анкет, задаргаа, давхардал болон тусгай шаардлагыг хянасан")
    .check();
  await a
    .getByRole("button", { name: "Үнийн саналыг баталж илгээх", exact: true })
    .click();
  await expect(a.getByText("Хадгаллаа.", { exact: true })).toBeVisible();
  await c.goto(order.trackingUrl);
  await c
    .getByRole("button", { name: "Үнийн саналыг зөвшөөрөх", exact: true })
    .click();
  await c.getByRole("button", { name: "Батлах", exact: true }).click();
  await expect(c.getByText("TEST123456", { exact: false })).toBeVisible();
  try {
    await a.goto("/admin/settings");
    const business = a.getByRole("group", { name: "Business", exact: true });
    await business.getByLabel("Үнэ (₮)", { exact: true }).fill("220000");
    await a
      .getByRole("button", { name: "Тохиргоо хадгалах", exact: true })
      .click();
    await expect(
      a.getByText("Тохиргоо хадгаллаа.", { exact: false }),
    ).toBeVisible();
    await a.reload();
    await expect(
      a
        .getByRole("group", { name: "Business", exact: true })
        .getByLabel("Үнэ (₮)", { exact: true }),
    ).toHaveValue("220000");
    await c.reload();
    await expect(c.getByText("TEST123456", { exact: false })).toBeVisible();
    await expect(
      c.getByText("Нэг удаагийн хөгжүүлэлт: 200,000₮", { exact: true }),
    ).toBeVisible();
    const token = order.trackingUrl.split("/").at(-1);
    const old = await (
      await request.get("/api/order-workflow/" + token)
    ).json();
    expect(old.workflow.quote.total).toBe(200000);
    expect(old.workflow.quote.status).toBe("accepted");
    const f = await (
      await request.get("http://127.0.0.1:43434/__fixture")
    ).json();
    const r = await request.post("/api/orders", {
      data: {
        idempotencyKey: crypto.randomUUID(),
        answers: { ...f.answers, q21: "Байхгүй", qPages: "3" },
        builder: null,
        attachments: [],
        meta: { website: "", startedAt: Date.now() - 15000 },
      },
    });
    expect(r.status(), await r.text()).toBe(201);
    const next = await r.json();
    const fresh = await (
      await request.get(
        "/api/order-workflow/" + next.trackingUrl.split("/").at(-1),
      )
    ).json();
    expect(fresh.workflow.quote.total).toBe(220000);
    await c.screenshot({
      path: "qa-evidence/axora-upgrade/workflow/accepted-price-frozen.png",
      fullPage: true,
    });
  } finally {
    await a.goto("/admin/settings");
    await a
      .getByRole("group", { name: "Business", exact: true })
      .getByLabel("Үнэ (₮)", { exact: true })
      .fill("200000");
    await a
      .getByRole("button", { name: "Тохиргоо хадгалах", exact: true })
      .click();
    await expect(
      a.getByText("Тохиргоо хадгаллаа.", { exact: false }),
    ).toBeVisible();
    await admin.close();
    await customer.close();
  }
});
