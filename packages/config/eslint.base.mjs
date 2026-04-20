import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: true },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // ACH-021 codigo-manutenibilidade: block deep-relative imports that
      // walk out of the current package. Workspace code must use `@wbc/*`
      // aliases so moves/renames don't break every caller.
      // Starts as warn so existing deep-relative imports across routers
      // surface as lint output without blocking builds; tighten to "error"
      // after the routers are normalised (tracked as follow-up to ACH-021).
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["../../../*", "../../../../*"],
              message: "Use the @wbc/* workspace alias instead of deep-relative imports.",
            },
          ],
        },
      ],
    },
  },
  { ignores: ["node_modules/", "dist/", ".next/", "coverage/"] },
];
