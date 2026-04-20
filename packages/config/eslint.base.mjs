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
  {
    // ACH-004 codigo-manutenibilidade: tRPC routers must pull Zod schemas
    // from @wbc/validators instead of redeclaring them inline. Inline
    // schemas drift from the validator package (Prisma, domain, UI all
    // need the same shape). Starts as warn so the 13 routers still using
    // inline `z.object(...)` surface without breaking CI; flip to error
    // after the remaining routers are normalised (follow-up to ACH-004).
    files: ["apps/api/src/routers/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: "CallExpression[callee.object.name='z'][callee.property.name='object']",
          message: "Import the schema from @wbc/validators instead of redeclaring `z.object(...)` inline in a router (ACH-004).",
        },
      ],
    },
  },
  { ignores: ["node_modules/", "dist/", ".next/", "coverage/"] },
];
