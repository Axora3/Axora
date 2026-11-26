import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/order-workflow/browser",
  outputDir: "artifacts/order-workflow/test-results",
  workers: 1,
  timeout: 60000,
  reporter: "list",
  use: {
    baseURL: "http://localhost:43435",
    channel: "chrome",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node --import tsx tests/order-workflow/fixture.mts",
      url: "http://127.0.0.1:43434/__fixture",
      reuseExistingServer: process.env.AXORA_QA_REVIEW === "1",
    },
    {
      command: "npm run build && npm run start -- --port 43435",
      url: "http://localhost:43435/admin/login",
      timeout: 240000,
      reuseExistingServer: process.env.AXORA_QA_REVIEW === "1",
      env: {
        ...process.env,
        AXORA_DIST_DIR: ".next-orders-qa",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:43434",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-anon-key",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "fixture-anon-key",
        SUPABASE_SERVICE_ROLE_KEY: "fixture-service-role-key",
        NEXT_PUBLIC_SITE_URL: "http://localhost:43435",
        SMTP_HOST: "127.0.0.1",
        SMTP_PORT: "43436",
        SMTP_SECURE: "false",
        SMTP_USER: "fixture@example.invalid",
        SMTP_PASSWORD: "fixture-only-password",
        AXORA_ECOSYSTEM_JOB_SECRET:
          "fixture-order-job-secret-xxxxxxxxxxxxxxxxxxxxxxxx",
      },
    },
  ],
});
