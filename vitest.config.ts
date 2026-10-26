import { defineConfig } from "vitest/config";

/* Vitest reads this file INSTEAD of vite.config.ts (it prefers
 * vitest.config.*), so the runtime's vite 6 and vitest's own vite 5
 * never have to agree on one config object's types. */
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "tests/**/*.test.ts"],
  },
});
