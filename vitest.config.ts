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
    // Coverage push: isolate each test file in its own worker. Without
    // this, agent-written suites that stub process.env or vi.mock at
    // module scope leak across the run and one file's setup poisons
    // another's. Cost is ~25% slower runs — acceptable trade-off for
    // green CI.
    isolate: true,
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
      // T12 — ramped 2026-05-03 to 75% after the third coverage push
      // (auth use-cases agent + main-thread fills on shared utilities,
      // events, optimistic-update, sentry-noise-filter, client domain
      // edge cases). Actual at gate raise: statements 80.13%,
      // branches 78.05%, functions 79.43%, lines 80.14%. We crossed
      // the CHECAGEM "80% stable" target. Gate held ~5pp below to
      // tolerate small regressions while still blocking large drops.
      thresholds: {
        lines: 75,
        branches: 70,
        functions: 75,
        statements: 75,
      },
    },
  },
});
