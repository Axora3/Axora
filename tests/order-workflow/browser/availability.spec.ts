import { test, expect } from "@playwright/test";
import { login } from "../../ecosystem/browser/fixture-auth";
test("missing workflow schema never silently hides admin actions", async ({
  context,
  page,
  request,
}) => {
  await login(context, "http://127.0.0.1:43434");
  const f = await (
    await request.get("http://127.0.0.1:43434/__fixture")
  ).json();
  await request.post("http://127.0.0.1:43434/__workflow_available", {
    data: { available: false },
  });
  try {
    await page.goto("/admin/orders/" + f.orderId);
    await page.screenshot({
      path: `qa-evidence/axora-upgrade/${process.env.AXORA_RECOVERY_BASELINE ? "before" : "after"}/admin-missing-workflow.png`,
      fullPage: true,
    });
    await expect(
      page.getByText("Үнийн саналын ажиллагаа одоогоор холбогдоогүй.", {
        exact: false,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Fixture website", exact: true }),
    ).toBeVisible();
  } finally {
    await request.post("http://127.0.0.1:43434/__workflow_available", {
      data: { available: true },
    });
  }
});
