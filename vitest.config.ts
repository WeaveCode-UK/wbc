import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['packages/**/__tests__/**/*.test.ts', 'apps/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'packages/shared/src/**/*.ts',
        'packages/business/**/domain/**/*.ts',
        'packages/business/**/guards/**/*.ts',
        'packages/business/**/use-cases/**/*.ts',
      ],
      exclude: ['**/__tests__/**', '**/index.ts'],
      thresholds: {
        lines: 30,
        branches: 30,
        functions: 30,
        statements: 30,
      },
    },
  },
});
