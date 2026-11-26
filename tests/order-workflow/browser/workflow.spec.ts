import { test, expect } from "@playwright/test";
import { login } from "../../ecosystem/browser/fixture-auth";
import { submitQuestionnaire } from "./questionnaire";
import { writeFileSync } from "node:fs";
test.use({ extraHTTPHeaders: { "x-forwarded-for": "192.0.2.32" } });
test("real admin/customer lifecycle, frozen quote, confirmed bank payment and SMTP outbox", async ({
  browser,
  request,
}) => {
  const fixture = await (
    await request.get("http://127.0.0.1:43434/__fixture")
  ).json();
  const admin = await browser.newContext(),
    customer = await browser.newContext({
      extraHTTPHeaders: { "x-forwarded-for": "192.0.2.34" },
      permissions: ["clipboard-read", "clipboard-write"],
    });
  await login(admin, "http://127.0.0.1:43434");
  const a = await admin.newPage(),
    c = await customer.newPage();
  const created = await submitQuestionnaire(c);
  fixture.orderId = created.orderId;
  fixture.token = created.trackingUrl.split("/").at(-1);
  const errors: string[] = [];
  a.on("pageerror", (e) => errors.push(e.message));
  c.on("pageerror", (e) => errors.push(e.message));
  await c.goto("/order/pay/" + fixture.token);
  await expect(c.getByText("Админ үнийн саналыг хянаж байна")).toBeVisible();
  await expect(c.getByText("TEST123456")).toHaveCount(0);
  await a.goto("/admin");
  await a.locator('nav a[href="/admin/orders"]').first().click();
  await expect(a).toHaveURL("/admin/orders");
  await a
    .locator(`tbody a[href="/admin/orders/${created.orderId}"]`)
    .filter({ hasText: "Recovery UI Studio" })
    .click();
  await expect(
    a.getByRole("heading", { name: "Үнийн санал, төлбөр, хөгжүүлэлт" }),
  ).toBeVisible();
  await a
    .getByRole("button", { name: "Үнийн саналын шинэ хувилбар", exact: true })
    .click();
  await a.getByLabel("Нэгж үнэ (₮)", { exact: true }).first().fill("210000");
  await a.getByLabel("Хөнгөлөлт (₮)", { exact: true }).fill("10000");
  await a
    .getByLabel("Өөрчилсөн шалтгаан (заавал)")
    .fill("Тестийн зөвшөөрсөн үнийн тохируулга");
  await a
    .getByRole("button", { name: "Шинэ хувилбарыг хадгалах", exact: true })
    .click();
  await expect(a.getByText("Хадгаллаа.", { exact: true })).toBeVisible();
  await a.screenshot({
    path: "qa-evidence/axora-upgrade/workflow/admin-quote-review.png",
    fullPage: true,
  });
  await a
    .getByLabel("Анкет, задаргаа, давхардал болон тусгай шаардлагыг хянасан")
    .check();
  await request.post("http://127.0.0.1:43434/__fail_email");
  await a
    .getByRole("button", { name: "Үнийн саналыг баталж илгээх", exact: true })
    .click();
  await expect(a.getByText("Хадгаллаа.", { exact: true })).toBeVisible();
  await a
    .getByText("Үнийн хувилбар, имэйлийн төлөв, түүх", { exact: true })
    .click();
  await expect(
    a.getByText("quote_sent · failed", { exact: false }),
  ).toBeVisible();
  await a
    .getByLabel("Дахин илгээх тайлбар")
    .fill("Local SMTP temporary error reviewed");
  await a
    .getByRole("button", { name: "Имэйл дахин илгээх", exact: true })
    .click();
  await expect(
    a.getByText("quote_sent · sent · оролдлого 2", { exact: false }),
  ).toBeVisible();
  await c.reload();
  await c.screenshot({
    path: "qa-evidence/axora-upgrade/workflow/customer-quote.png",
    fullPage: true,
  });
  await c
    .getByRole("button", { name: "Үнийн саналыг зөвшөөрөх", exact: true })
    .click();
  await c.getByRole("button", { name: "Батлах", exact: true }).click();
  await expect(c.getByText("TEST123456", { exact: false })).toBeVisible();
  await c.getByRole("button", { name: "Данс хуулах", exact: true }).click();
  expect(await c.evaluate(() => navigator.clipboard.readText())).toBe(
    "TEST123456",
  );
  await c.screenshot({
    path: "qa-evidence/axora-upgrade/workflow/customer-payment.png",
    fullPage: true,
  });
  await c
    .getByRole("button", { name: "Төлбөр шилжүүлснээ мэдэгдэх", exact: true })
    .click();
  await expect(
    c.getByRole("region", { name: "Үйлдлийг батлах" }),
  ).toContainText("TEST123456");
  await c.screenshot({
    path: "qa-evidence/axora-upgrade/workflow/customer-transfer-confirmation.png",
    fullPage: true,
  });
  await c
    .getByLabel("Гүйлгээний лавлах дугаар (сонголтоор)")
    .fill("TEST-TRANSFER");
  await c.getByRole("button", { name: "Батлах", exact: true }).click();
  await expect(
    c.getByText("Шилжүүлгийн мэдэгдлийг хүлээн авсан.", { exact: false }),
  ).toBeVisible();
  await a.reload();
  await c.screenshot({
    path: "qa-evidence/axora-upgrade/workflow/customer-payment-reported.png",
    fullPage: true,
  });
  await a.route(
    "**/admin/orders/**",
    async (route) => {
      if (route.request().method() === "POST") await route.abort();
      else await route.continue();
    },
    { times: 1 },
  );
  await a
    .getByRole("button", {
      name: "Төлбөр баталгаажуулах · хугацааны санал авах",
    })
    .click();
  await expect(
    a.getByText("Хугацааны санал ачаалагдсангүй. Дахин оролдоно уу.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    a.getByRole("button", {
      name: "Төлбөр баталгаажуулах · хугацааны санал авах",
    }),
  ).toBeEnabled();
  await a
    .getByRole("button", {
      name: "Төлбөр баталгаажуулах · хугацааны санал авах",
    })
    .click();
  await expect(
    a.getByRole("heading", { name: "Банкны хуулгатай тулгаж батална уу" }),
  ).toBeVisible();
  const dialog = a.getByRole("dialog", {
    name: "Төлбөр баталгаажуулах",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Болих", exact: true }),
  ).toBeVisible();
  await expect(dialog.locator('input[type="date"]')).toHaveCount(1);
  await dialog.getByRole("button", { name: "Болих", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await a
    .getByRole("button", {
      name: "Төлбөр баталгаажуулах · хугацааны санал авах",
    })
    .click();
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Батлах дуусах огноо").fill("2027-03-01");
  await dialog
    .getByLabel("Огноо өөрчилсөн / нягталсан шалтгаан")
    .fill("Тестийн хугацааны тохируулга");
  await dialog
    .getByLabel("Хэрэглэгчид харагдах тайлбар (сонголтоор)")
    .fill("Тестийн шилжүүлгийг шалгалаа.");
  await dialog.screenshot({
    path: "qa-evidence/axora-upgrade/workflow/admin-payment-dialog.png",
  });
  await a
    .getByRole("button", {
      name: "Төлбөр болон дуусах огноог батлах",
      exact: true,
    })
    .click();
  await expect(
    a.getByRole("button", {
      name: "Ажил эхлэх · бодит эхэлсэн огноог бүртгэх",
    }),
  ).toBeVisible();
  await c.reload();
  await expect(
    c.getByText("2027-03-01", { exact: false }).first(),
  ).toBeVisible();
  await expect(
    c.getByText("Админы тайлбар: Тестийн шилжүүлгийг шалгалаа.", {
      exact: true,
    }),
  ).toBeVisible();
  await c.screenshot({
    path: "qa-evidence/axora-upgrade/workflow/customer-tracking.png",
    fullPage: true,
  });
  await expect(
    c.getByText("Төлбөр баталгаажсан · ажлын дараалалд", { exact: true }),
  ).toBeVisible();
  await a
    .getByRole("button", { name: "Ажил эхлэх · бодит эхэлсэн огноог бүртгэх" })
    .click();
  await a
    .getByLabel("Веб сайтын HTTPS холбоос")
    .fill("https://example.invalid/fixture");
  await a.getByRole("button", { name: "Хөгжүүлэлт дууссаныг бүртгэх" }).click();
  await a
    .getByRole("button", { name: "Хэрэглэгчид хүлээлгэн өгөх", exact: true })
    .click();
  await expect(
    a.getByRole("button", { name: "Хэрэглэгчид хүлээлгэн өгөх", exact: true }),
  ).toHaveCount(0);
  await c.reload();
  await expect(
    c.getByRole("link", { name: "Веб сайтаа нээх" }),
  ).toHaveAttribute("href", "https://example.invalid/fixture");
  await expect(c.getByText("JSON", { exact: false })).toHaveCount(0);
  await expect(a.getByText(/^SMTP Message-ID:/)).toHaveCount(5);
  const after = await (
    await request.get("http://127.0.0.1:43434/__fixture")
  ).json();
  expect(after.messages).toHaveLength(fixture.messages.length + 5);
  const ownMessages = after.messages.slice(fixture.messages.length);
  const decoded = ownMessages.map((raw: string) => {
    const unfolded = raw.replace(/\r\n[ \t]+/g, " ");
    const subject = (unfolded.match(/^Subject: (.*)$/im)?.[1] ?? "")
      .replace(/\?=\s+=\?/g, "?==?")
      .replace(/=\?UTF-8\?B\?([^?]+)\?=/gi, (_: string, b: string) =>
        Buffer.from(b, "base64").toString("utf8"),
      );
    const body = raw
      .split("\r\n\r\n")
      .slice(1)
      .join("\r\n\r\n")
      .replace(/=\r\n/g, "");
    return {
      subject,
      text: /Content-Transfer-Encoding: base64/i.test(raw.split("\r\n\r\n")[0])
        ? Buffer.from(body, "base64").toString("utf8")
        : Buffer.from(
            body.replace(/=([0-9a-f]{2})/gi, (_: string, h: string) =>
              String.fromCharCode(parseInt(h, 16)),
            ),
            "latin1",
          ).toString("utf8"),
    };
  });
  const payment = decoded.find(
    (m: { subject: string }) =>
      m.subject === "AXORA — Таны төлбөр баталгаажлаа",
  );
  expect(payment).toBeTruthy();
  for (const value of [
    "Recovery test customer",
    "2027-03-01",
    "Хөгжүүлэлт эхлэхээр хүлээгдэж байна",
    "AXORA-г сонгосонд баярлалаа.",
    "Тестийн шилжүүлгийг шалгалаа.",
  ])
    expect(payment.text).toContain(value);
  writeFileSync(
    "qa-evidence/axora-upgrade/workflow/smtp-accepted.json",
    JSON.stringify(
      {
        transport: "local SMTP sandbox; inbox delivery not verified",
        messages: decoded,
      },
      null,
      2,
    ),
  );
  await c.screenshot({
    path: "qa-evidence/axora-upgrade/workflow/customer-delivered.png",
    fullPage: true,
  });
  expect(
    new Set(ownMessages.map((s: string) => s.match(/Message-ID: (.*)/i)?.[1]))
      .size,
  ).toBe(5);
  expect(errors).toEqual([]);
  writeFileSync(
    "qa-evidence/axora-upgrade/workflow/review-order.json",
    JSON.stringify(
      {
        environment:
          "Loopback QA; synthetic data; test payments and sandbox SMTP only",
        orderId: created.orderId,
        reference: created.reference,
        customerUrl: "http://localhost:43435" + created.trackingUrl,
        adminUrl: "http://localhost:43435/admin/orders/" + created.orderId,
        status: "delivered",
      },
      null,
      2,
    ),
  );
  await admin.close();
  await customer.close();
});
test("settings exposes owner policy as editable fields and preserves accepted snapshots", async ({
  context,
  page,
}) => {
  await login(context, "http://127.0.0.1:43434");
  await page.goto("/admin/settings");
  const starter = page.getByRole("group", { name: "Starter", exact: true });
  await expect(starter.getByLabel("Үнэ (₮)", { exact: true })).toHaveValue(
    "100000",
  );
  await starter.getByLabel("Үнэ (₮)", { exact: true }).fill("110000");
  await page
    .getByRole("button", { name: "Тохиргоо хадгалах", exact: true })
    .click();
  await expect(
    page.getByText("Тохиргоо хадгаллаа.", { exact: false }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page
      .getByRole("group", { name: "Starter", exact: true })
      .getByLabel("Үнэ (₮)", { exact: true }),
  ).toHaveValue("110000");
});
test("actual intake endpoint creates one reviewed quote and returns a private tracking link on retry", async ({
  request,
}) => {
  const fixture = await (
    await request.get("http://127.0.0.1:43434/__fixture")
  ).json();
  const body = {
    idempotencyKey: crypto.randomUUID(),
    answers: { ...fixture.answers, q21: "Байхгүй" },
    builder: null,
    attachments: [],
    meta: { website: "", startedAt: Date.now() - 15000 },
  };
  const first = await request.post("/api/orders", { data: body });
  expect(first.status(), await first.text()).toBe(201);
  const created = await first.json();
  expect(created.trackingUrl).toMatch(/^\/order\/pay\/[A-Za-z0-9_-]{32}$/);
  const second = await request.post("/api/orders", { data: body });
  expect(second.status()).toBe(200);
  expect((await second.json()).trackingUrl).toBe(created.trackingUrl);
  const view = await (
    await request.get(
      "/api/order-workflow/" + created.trackingUrl.split("/").at(-1),
    )
  ).json();
  expect(view.workflow.quote.version).toBe(1);
  expect(view.workflow.quote.status).toBe("draft");
  expect(view.workflow.bank).toBeNull();
  expect(view.workflow).not.toHaveProperty("customerEmail");
  const forbidden = await request.post(
    "/api/order-workflow/" + created.trackingUrl.split("/").at(-1),
    {
      headers: { Origin: "https://other.invalid" },
      data: { action: "accept", key: crypto.randomUUID(), version: 1 },
    },
  );
  expect(forbidden.status()).toBe(403);
});
