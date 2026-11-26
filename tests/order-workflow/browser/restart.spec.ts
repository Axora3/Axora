import { test, expect } from "@playwright/test";
import { spawn, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { writeFileSync } from "node:fs";
import { submitQuestionnaire } from "./questionnaire";
test("new questionnaire survives a production application server restart and new browser session", async ({
  browser,
}) => {
  test.setTimeout(120000);
  const context = await browser.newContext({
      extraHTTPHeaders: { "x-forwarded-for": "192.0.2.37" },
    }),
    page = await context.newPage();
  const created = await submitQuestionnaire(page);
  await context.close();
  let child: ChildProcess | undefined;
  let logs = "";
  const stop = async () => {
    if (!child || child.exitCode !== null || child.signalCode !== null) return;
    const target = child;
    child = undefined;
    await new Promise<void>((resolve) => {
      target.once("exit", () => resolve());
      target.kill();
    });
  };
  const start = async () => {
    child = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "--port",
        "43437",
        "--hostname",
        "127.0.0.1",
      ],
      {
        cwd: process.cwd(),
        windowsHide: true,
        env: {
          ...process.env,
          AXORA_DIST_DIR: ".next-orders-qa",
          NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:43434",
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "fixture-anon-key",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-anon-key",
          SUPABASE_SERVICE_ROLE_KEY: "fixture-service-role-key",
          NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:43437",
          SMTP_HOST: "127.0.0.1",
          SMTP_PORT: "43436",
          SMTP_SECURE: "false",
          SMTP_USER: "fixture@example.invalid",
          SMTP_PASSWORD: "fixture-only-password",
        },
      },
    );
    child.stdout?.on("data", (d) => (logs += d));
    child.stderr?.on("data", (d) => (logs += d));
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch("http://127.0.0.1:43437/admin/login")).ok) return;
      } catch {}
      await delay(100);
    }
    throw Error("Owned QA production server did not start");
  };
  try {
    for (let iteration = 0; iteration < 2; iteration++) {
      await start();
      const fresh = await browser.newContext(),
        p = await fresh.newPage();
      await p.goto("http://127.0.0.1:43437" + created.trackingUrl);
      await expect(
        p.getByRole("heading", { name: "Recovery UI Studio", exact: true }),
      ).toBeVisible();
      await expect(
        p.getByText("Админ үнийн саналыг хянаж байна", { exact: true }),
      ).toBeVisible();
      await p.reload();
      await expect(
        p.getByRole("heading", { name: "Recovery UI Studio", exact: true }),
      ).toBeVisible();
      await fresh.close();
      await stop();
    }
    writeFileSync(
      "qa-evidence/axora-upgrade/workflow/server-restart.json",
      JSON.stringify(
        {
          orderId: created.orderId,
          result:
            "Two owned production-server starts; same disposable PostgreSQL; fresh browser contexts and refresh retained saved new UI application",
        },
        null,
        2,
      ),
    );
  } finally {
    await stop();
    writeFileSync(
      "qa-evidence/axora-upgrade/workflow/server-restart.log",
      logs,
    );
  }
});
