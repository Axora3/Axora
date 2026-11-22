import { defineConfig } from "@playwright/test";
const token = "fixture-ecosystem-service-" + "x".repeat(40);
export default defineConfig({
  testDir: "./tests/ecosystem/browser",
  workers: 1,
  timeout: 60000,
  reporter: "list",
  use: {
    baseURL: "http://localhost:43235",
    channel: "chrome",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node --import tsx tests/ecosystem/fixture-server.ts",
      url: "http://127.0.0.1:43234/rest/v1/templates",
      reuseExistingServer: false,
    },
    {
      command: "npm run build && npm run start -- --port 43235",
      url: "http://localhost:43235/admin/login",
      timeout: 240000,
      reuseExistingServer: false,
      env: {
        ...process.env,
        AXORA_DIST_DIR: ".next-ecosystem-qa",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:43234",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-anon-key",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "fixture-anon-key",
        SUPABASE_SERVICE_ROLE_KEY: "fixture-service-role-key",
        AXORA_INTEGRATION_LOCAL_TEST: "1",
        AXORA_FACTORY_URL: "http://127.0.0.1:43234/factory",
        AXORA_FACTORY_ADMIN_TOKEN: token,
        AXORA_DASHBOARD_URL: "http://127.0.0.1:43234/dashboard",
        AXORA_DASHBOARD_SERVICE_TOKEN: token,
        AXORA_PAYMENT_API_URL: "http://127.0.0.1:43234/provider",
        AXORA_PAYMENT_API_TOKEN: token,
        AXORA_PAYMENT_MERCHANT_ID: "fixture-merchant",
        AXORA_PAYMENT_WEBHOOK_SECRET: token,
        AXORA_DASHBOARD_BILLING_TOKEN: token,
        AXORA_ECOSYSTEM_JOB_SECRET: token,
      },
    },
  ],
});
