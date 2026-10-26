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
        // This project's preview port (3096); PORT lets a run override it.
        // 3000 was hardcoded before and is now occupied by another project.
        baseURL: `http://localhost:${process.env.PORT ?? "3096"}`,
        viewport: { width: 1280, height: 900 },
      },
    },
  ],
  retries: 0,
});
