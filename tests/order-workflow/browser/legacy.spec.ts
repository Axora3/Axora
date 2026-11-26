import { test, expect } from "@playwright/test";
for (const paid of [false, true])
  test(`legacy ${paid ? "paid" : "unpaid"} order renders without inventing accepted quotes or changing history`, async ({
    page,
    request,
  }) => {
    const f = await (
      await request.post("http://127.0.0.1:43434/__legacy", { data: { paid } })
    ).json();
    await page.goto("/order/pay/" + f.token);
    await expect(
      page.getByRole("heading", {
        name: paid ? "Төлбөр баталгаажсан" : "Үнийн саналтай танилцана уу",
        exact: true,
      }),
    ).toBeVisible();
    if (!paid) {
      await expect(
        page.getByText("Өмнөх бүртгэл дэх админы үнийн санал.", {
          exact: true,
        }),
      ).toBeVisible();
      await expect(page.getByText("TEST123456", { exact: false })).toHaveCount(
        0,
      );
    }
    await page.reload();
    const state = await (
      await request.get("http://127.0.0.1:43434/__order_state?id=" + f.orderId)
    ).json();
    expect(state.order.payment_status).toBe(paid ? "paid" : "unpaid");
    expect(state.order.quote_amount).toBe(555000);
    expect(state.order.workflow_managed).toBe(false);
    expect(state.quotes).toBe(0);
    await expect(
      page.getByText("Хариултаа JSON-оор татах", { exact: true }),
    ).toHaveCount(0);
    await page.screenshot({
      path: `qa-evidence/axora-upgrade/workflow/legacy-${paid ? "paid" : "unpaid"}.png`,
      fullPage: true,
    });
  });
