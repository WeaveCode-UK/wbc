import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@wbc/shared": path.resolve(__dirname, "packages/shared/src"),
      "@wbc/ui": path.resolve(__dirname, "packages/ui/src"),
      "@wbc/validators": path.resolve(__dirname, "packages/validators/src"),
      "@wbc/db": path.resolve(__dirname, "packages/db/src"),
      "@wbc/business": path.resolve(__dirname, "packages/business"),
      "@wbc/i18n": path.resolve(__dirname, "packages/i18n"),
      "@": path.resolve(__dirname, "apps/web/src"),
    },
  },
  test: {
    globals: true,
    include: [
      "packages/**/__tests__/**/*.test.ts",
      "packages/**/__tests__/**/*.test.tsx",
      "apps/**/__tests__/**/*.test.ts",
      "apps/**/__tests__/**/*.test.tsx",
      // T5 — testcontainers integration tests. Each file gates itself on
      // `process.env.RUN_INTEGRATION` (or CI) via `it.skipIf(...)`, so
      // bringing them into the default include set does not slow down
      // `pnpm test` when Docker isn't available.
      "packages/**/__tests__/integration/**/*.integration.test.ts",
    ],
    // T5: starting a Postgres container, running `prisma migrate deploy`
    // and tearing down can blow past the default 5s timeout — bump to 60s
    // for the whole run; the unit tests are unaffected.
    testTimeout: 60_000,
    hookTimeout: 60_000,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: [
        "packages/shared/src/**/*.ts",
        "packages/ui/src/**/*.tsx",
        "packages/business/**/domain/**/*.ts",
        "packages/business/**/guards/**/*.ts",
        "packages/business/**/use-cases/**/*.ts",
      ],
      exclude: ["**/__tests__/**", "**/index.ts"],
      reporter: ["text", "html", "lcov"],
      // T12.1 — ramped 2026-05-03 from 20% → 30% after T0+T1+T2-A/B/C/D+T6+T7+T9
      // landed (statements actually hit 38%, branches 32%, functions 29%,
      // lines 39%). Set the gate just below the lowest dimension so a
      // regression breaks CI but legitimate flux doesn't. Next steps
      // toward CHECAGEM thresholds:
      //   - 50% after T2-E + T3 + T4 land (sub-agents finishing)
      //   - 70% after T5 (testcontainers — running)
      //   - 80% stable target
      thresholds: {
        lines: 30,
        branches: 30,
        functions: 25,
        statements: 30,
      },
    },
  },
});
