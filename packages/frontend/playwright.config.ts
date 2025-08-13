import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  use: { headless: true, baseURL: "http://localhost:3000", actionTimeout: 0, navigationTimeout: 30000, trace: "retain-on-failure" },
  webServer: {
    command: "npm run start",
    cwd: ".",
    port: 3000,
    reuseExistingServer: true,
    timeout: 120000
  }
});


