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
    },
  },
  test: {
    globals: true,
    include: [
      "packages/**/__tests__/**/*.test.ts",
      "packages/**/__tests__/**/*.test.tsx",
      "apps/**/__tests__/**/*.test.ts",
      "apps/**/__tests__/**/*.test.tsx",
    ],
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
      // ACH-014 testes-qualidade: escalonamento planejado de coverage.
      // Fase 4 (hoje): 20% — suíte mínima conforme CLAUDE.md "ZERO
      // testes até Fase 7". Fase 6: 40%. Fase 7: 70%. Estável: 80%.
      // O gate de CI falha se coverage cair abaixo deste threshold
      // (ACH-006: `pnpm test:coverage` no workflow).
      thresholds: {
        lines: 20,
        branches: 20,
        functions: 20,
        statements: 20,
      },
    },
  },
});
