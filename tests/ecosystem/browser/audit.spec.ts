import { test, expect } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";
import { login } from "./fixture-auth";
import { BUSINESS_TYPES, TYPES, BUILDER_STYLE_IDS, STYLES, PALETTES } from "../../../src/lib/builder/config";

test("damaged or blocked order draft storage never crashes the customer form", async ({ browser }) => {
  for (const blocked of [false, true]) {
    const context = await browser.newContext();
    await context.addInitScript(block => {
      if (block) Object.defineProperty(window, "sessionStorage", { get() { throw new DOMException("Storage blocked", "SecurityError"); } });
      else sessionStorage.setItem("axora-order-session-v1", JSON.stringify({ v: 1, answers: {} }));
    }, blocked);
    const page = await context.newPage();const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("http://localhost:43235/order");
    await expect(page.locator("#f-q1")).toBeVisible();
    await page.locator("#f-q1").fill("Бат");
    await expect(page.locator("#f-q1")).toHaveValue("Бат");
    expect(errors).toEqual([]);await context.close();
  }
});

test("Builder reset wins over a delayed stored-logo response", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("axora-builder-logo-v1", JSON.stringify({ name: "old-logo.svg", type: "image/svg+xml", data: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>' }));
    const original = window.fetch;
    let release: (() => void) | undefined;
    const pending = new Promise<void>(resolve => { release = resolve; });
    Object.assign(window, { releaseAuditLogo: () => release?.() });
    window.fetch = async (...args) => { if (String(args[0]).startsWith("data:")) await pending; return original(...args); };
  });
  await page.setViewportSize({ width: 1440, height: 900 });await page.goto("/builder");
  await page.getByRole("button", { name: "Анхны төлөвт буцаах", exact: true }).click();
  await page.getByRole("button", { name: "Буцаах", exact: true }).click();
  await page.evaluate(() => (window as unknown as { releaseAuditLogo: () => void }).releaseAuditLogo());
  await page.waitForTimeout(300);
  await expect(page.getByText("old-logo.svg", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Лого оруулаагүй — эхний үсгийг ашиглана", { exact: true })).toBeVisible();
});

test("all Builder choices persist and custom Cyrillic copy survives business changes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });await page.goto("/builder");
  await page.locator("#bx-name").fill("Миний бизнес — ӨҮ");
  for (const type of BUSINESS_TYPES) {
    await page.getByRole("button", { name: new RegExp(TYPES[type].label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).click();
    for (let i = 0; i < BUILDER_STYLE_IDS.length; i++) {
      const style = BUILDER_STYLE_IDS[i], palette = PALETTES[(BUSINESS_TYPES.indexOf(type) + i) % PALETTES.length];
      await page.getByRole("button", { name: new RegExp(STYLES[style].label) }).click();
      await page.getByRole("button", { name: palette.label, exact: true }).click();
      const stored = await page.evaluate(() => JSON.parse(sessionStorage.getItem("axora-builder-v1")!));
      expect(stored).toMatchObject({ type, style, palette: palette.id, name: "Миний бизнес — ӨҮ" });
      await expect(page.locator(".ax-builder-preview").getByText("Миний бизнес — ӨҮ", { exact: true }).first()).toBeVisible();
    }
  }
  for (const device of ["Mobile", "Tablet", "Desktop"]) {
    await page.getByRole("button", { name: device, exact: true }).click();
    await expect(page.locator(".bx-frame")).toHaveAttribute("data-device", device.toLowerCase());
  }
  await page.reload();await expect(page.locator("#bx-name")).toHaveValue("Миний бизнес — ӨҮ");
  await page.getByRole("link", { name: "Захиалга руу", exact: true }).click();
  await expect(page.locator("#f-q2")).toHaveValue("Миний бизнес — ӨҮ");
});

test("a stale logo failure cannot erase a newer uploaded logo", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("axora-builder-logo-v1", JSON.stringify({ name: "old.svg", type: "image/svg+xml", data: "data:image/svg+xml,old" }));
    const original = window.fetch;
    let rejectOld: ((reason: Error) => void) | undefined;
    const pending = new Promise<Response>((_, reject) => { rejectOld = reject; });
    Object.assign(window, { failAuditLogo: () => rejectOld?.(new Error("old fetch failed")) });
    window.fetch = (...args) => String(args[0]) === "data:image/svg+xml,old" ? pending : original(...args);
  });
  await page.setViewportSize({ width: 1440, height: 900 });await page.goto("/builder");
  await page.locator("#bx-logo").setInputFiles({ name: "new.svg", mimeType: "image/svg+xml", buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>') });
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem("axora-builder-logo-v1") ?? "null")?.name)).toBe("new.svg");
  await page.evaluate(() => (window as unknown as { failAuditLogo: () => void }).failAuditLogo());
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("axora-builder-logo-v1") ?? "null")?.name)).toBe("new.svg");
});

test("public API boundaries reject malformed requests and unauthorized integration operations", async ({ request }) => {
  const results = [];
  for (const path of ["/api/contact", "/api/orders", "/api/template-requests", "/api/orders/attachments", "/api/english-words/orders"]) {
    const response = await request.post(path, { data: "{", headers: { "content-type": "application/json" } });
    expect(response.status(), path).toBe(400);results.push({ path, case: "malformed-json", status: response.status() });
    const invalid = await request.post(path, { data: {} });expect(invalid.status(), path).toBe(400);results.push({ path, case: "missing-fields", status: invalid.status() });
  }
  for (const path of ["/api/jobs/ecosystem", "/api/admin/ecosystem/process", "/api/admin/ecosystem/registry", "/api/admin/ecosystem", "/api/integrations/payments/custom/notice"]) {
    const response = await request.post(path, { data: {} });expect([401, 403]).toContain(response.status());results.push({ path, case: "unauthorized", status: response.status() });
  }
  const search = await request.get("/api/admin/search?q=test");expect(search.status()).toBe(401);
  results.push({ path: "/api/admin/search", case: "unauthorized", status: search.status() });
  for (const path of ["/api/admin/ecosystem", "/api/integrations/billing/sites/00000000-0000-4000-8000-000000000001/billing"]) {
    const response = await request.get(path);expect(response.status()).toBe(401);results.push({ path, case: "unauthorized", status: response.status() });
  }
  for (const method of ["GET", "POST"]) {
    const response = await request.fetch("/download/invalid", { method });expect(response.status()).toBe(404);results.push({ path: "/download/[token]", case: method + " invalid-token", status: response.status() });
  }
  mkdirSync("artifacts/full-audit", { recursive: true });writeFileSync("artifacts/full-audit/api-results.json", JSON.stringify(results, null, 2));
});

test("contact submission persists once, retries safely and rejects conflicting reuse", async ({ request }) => {
  const body = { idempotencyKey: crypto.randomUUID(), name: "Туршилтын Бат", contact: "+976 8800 1234", message: "Локал туршилтын зурвас — ӨҮ", meta: { website: "", startedAt: Date.now() - 10000 } };
  const first = await request.post("/api/contact", { data: body });expect(first.status()).toBe(201);
  const duplicate = await request.post("/api/contact", { data: body });expect(duplicate.status()).toBe(200);expect((await duplicate.json()).status).toBe("duplicate");
  const conflict = await request.post("/api/contact", { data: { ...body, message: "Өөр утга" } });expect(conflict.status()).toBe(409);
  const invalid = await request.post("/api/contact", { data: { ...body, contact: "abc88001234" } });expect(invalid.status()).toBe(422);
  const rows = await request.get(`http://127.0.0.1:43234/rest/v1/contact_messages?idempotency_key=eq.${body.idempotencyKey}`);
  expect(await rows.json()).toHaveLength(1);
});

test("notification read status and unread header badge stay synchronized", async ({ page, context }) => {
  await login(context);await page.goto("/admin/notifications/00000000-0000-4000-8000-000000000099");
  await page.getByRole("button", { name: "Уншсанд тэмдэглэх", exact: true }).click();
  await expect(page.getByRole("button", { name: "Уншаагүй болгох", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Мэдэгдэл", exact: true }).first()).toBeVisible();
  await page.reload();await expect(page.getByRole("button", { name: "Уншаагүй болгох", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Уншаагүй болгох", exact: true }).click();
  await expect(page.getByRole("button", { name: "Мэдэгдэл, 1 уншаагүй", exact: true }).first()).toBeVisible();
});

test("authenticated admin routes fit all requested responsive widths", async ({ page, context }) => {
  test.setTimeout(180000);await login(context);await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];page.on("pageerror", e => errors.push(e.message));const results = [];
  for (const route of ["/admin", "/admin/orders", "/admin/template-requests", "/admin/templates", "/admin/templates/new", "/admin/projects", "/admin/payments", "/admin/support", "/admin/activity", "/admin/content", "/admin/library", "/admin/marketing", "/admin/english-words", "/admin/settings", "/admin/notifications", "/admin/ecosystem"]) {
    await page.goto(route);
    // Next can temporarily retain a hidden streamed fallback. Assert the live
    // accessibility landmark rather than matching hidden placeholder IDs.
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("main")).toBeVisible();
    for (const width of [320,360,375,390,414,430,640,768,820,1024,1280,1440,1536,1920,2560]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      if (overflow) {
        await page.screenshot({ path: `artifacts/full-audit/overflow-${route.replaceAll("/", "_")}-${width}.png`, fullPage: true });
        const elements = await page.evaluate(() => [...document.querySelectorAll("main *")].map(el => ({ tag: el.tagName, className: el.getAttribute("class"), right: el.getBoundingClientRect().right, width: el.getBoundingClientRect().width })).filter(r => r.width > 0 && r.right > innerWidth + 1).slice(0,40));
        writeFileSync(`artifacts/full-audit/overflow-${route.replaceAll("/", "_")}-${width}.json`, JSON.stringify(elements, null, 2));
      }
      results.push({ route, width, overflow });expect.soft(overflow, `${route} ${width}`).toBe(false);
    }
  }
  writeFileSync("artifacts/full-audit/admin-layouts.json", JSON.stringify({ results, errors }, null, 2));expect(errors).toEqual([]);
});

test("core pages retain accessible link names and contrast", async ({ page }) => {
  test.setTimeout(120000);
  for (const width of [390,1440]) for (const route of ["/", "/builder", "/order", "/templates", "/contact", "/admin/login"]) {
    await page.setViewportSize({ width, height: 900 });await page.goto(route);
    await page.addScriptTag({ path: require.resolve("axe-core") });
    const violations = await page.evaluate(async () => {
      const axe = (window as unknown as { axe: { run: (node: Document, options: object) => Promise<{ violations: { id: string; nodes: { target: string[] }[] }[] }> } }).axe;
      return (await axe.run(document, { runOnly: { type: "rule", values: ["link-name", "color-contrast", "label", "button-name"] } })).violations;
    });
    expect.soft(violations, `${route} at ${width}`).toEqual([]);
  }
});

test("every private dynamic route rejects invalid identifiers without crashing", async ({ page, context }) => {
  await login(context);const errors: string[] = [];page.on("pageerror", e => errors.push(e.message));
  const routes = ["/admin/orders/invalid", "/admin/template-requests/invalid", "/admin/projects/invalid", "/admin/support/invalid", "/admin/templates/invalid/edit", "/admin/notifications/invalid"];
  for (const route of routes) {
    await page.goto(route);await expect(page.getByRole("heading", { name: "Хуудас олдсонгүй", exact: true })).toBeVisible();
    await expect(page.getByRole("main")).toHaveAttribute("id", "main");
  }
  writeFileSync("artifacts/full-audit/admin-dynamic-routes.json", JSON.stringify({ routes, errors }, null, 2));expect(errors).toEqual([]);
});
