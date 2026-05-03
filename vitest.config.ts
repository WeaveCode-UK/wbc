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
      // T12.1 + T12.2 — ramped 2026-05-03 from 20% → 35% after the full
      // multi-agent push (T0–T9 + T11–T12) landed. Actual: statements
      // 42%, branches 41%, functions 34%, lines 43%. Gate set just below
      // the lowest dimension so a regression breaks CI but legitimate
      // flux doesn't. Next ramps toward CHECAGEM thresholds:
      //   - 60% after deeper UI/RTL coverage (apps/web component layer)
      //   - 70% after T5 integration tests run with Docker in CI
      //   - 80% stable target
      thresholds: {
        lines: 35,
        branches: 35,
        functions: 30,
        statements: 35,
      },
    },
  },
});
