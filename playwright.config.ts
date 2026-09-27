import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  use: { baseURL: `http://localhost:${PORT}`, ...devices["iPhone 13"], browserName: "chromium" },
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : { command: `npm run start -- -p ${PORT}`, port: PORT, reuseExistingServer: true, timeout: 120_000 },
});
