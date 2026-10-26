import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  timeout: 30_000,
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        baseURL: "http://localhost:3000",
        viewport: { width: 1280, height: 900 },
      },
    },
  ],
  retries: 0,
});
