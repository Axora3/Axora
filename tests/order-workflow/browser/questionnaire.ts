import { expect, type Page } from "@playwright/test";
export async function submitQuestionnaire(page: Page, options: {allowPending?:boolean} = {}) {
  await page.goto("/");
  await page.locator('a[href="/order"]').first().click();
  await page.locator("#f-q1").waitFor();
  const formReadyAt = Date.now();
  const next = () =>
    page.getByRole("button", { name: "Үргэлжлүүлэх", exact: true }).click();
  for (const [id, value] of Object.entries({
    q1: "Recovery test customer",
    q2: "Recovery UI Studio",
    q3: "Studio",
    q4: "88000000",
    q5: "fixture@example.invalid",
  }))
    await page.locator("#f-" + id).fill(value);
  await next();
  await page.locator("#f-q12-0").check();
  await page.locator("#f-q13-0").check();
  await next();
  await page.getByLabel("Өнгөө мэдэхгүй, санал авъя").check();
  await page.locator("#f-q19-0").check();
  await page.locator("#f-q21-2").check();
  await next();
  await page.locator("#f-q23-0").check();
  await page
    .locator("#f-q25")
    .fill("Authorized local test website questionnaire.");
  await page.locator("#f-q28-0").check();
  await next();
  await page.locator("#f-q30-0").check();
  await next();
  await page.locator("#f-q32-2").check();
  await page.locator("#f-q34-4").check();
  await page.locator("#f-qPages").fill("3");
  await page.locator("#f-qPackage-2").check();
  await next();
  await page.locator("#f-q38-3").check();
  await page.locator("#f-q39").check();
  await page.getByRole("button", { name: "Шалгах", exact: true }).click();
  await page.locator("#ox-confirm").check();
  await page.screenshot({
    path: "qa-evidence/axora-upgrade/workflow/questionnaire-review.png",
    fullPage: true,
  });
  const response = page.waitForResponse(
    (r) => r.url().endsWith("/api/orders") && r.request().method() === "POST",
  );
  // Respect the actual anti-bot minimum fill time, including reduced-motion runs.
  const remainingFillTime = 5200 - (Date.now() - formReadyAt);
  if (remainingFillTime > 0) await page.waitForTimeout(remainingFillTime);
  await page
    .getByRole("button", {
      name: /Илгээгээд төлбөр рүү үргэлжлүүлэх|Анкет илгээх/,
    })
    .click();
  const r = await response;
  expect(r.status(), await r.text()).toBe(201);
  const body = await r.json();
  if (options.allowPending) expect(body.quotationStatus).toBe("pending");
  else expect(body.trackingUrl).toMatch(/^\/order\/pay\//);
  return body;
}
