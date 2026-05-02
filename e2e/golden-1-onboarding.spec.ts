import { test, expect } from "@playwright/test";

// F11.E20 · Golden path 1: signup -> onboarding wizard -> first sale.
// Currently fixme'd because:
//  - /register has no E2E-friendly seam yet (pending in F11.E20.5)
//  - the wizard 5-step screen exists but the steps don't carry state
//    across submits in a way the test can assert
//  - the "first sale" step is a dead-end without /sales/new wired
//    to a real product seed visible to a freshly created tenant.
// The structure below documents the assertions to keep when the polish
// pass lands.

test.describe("golden path 1 · onboarding", () => {
  test.fixme("signup completes and lands on Meu Dia", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL(/\/register$/);
    // tenant slug + name + admin email + password (the form on
    // (auth)/register/page.tsx still needs an E2E-friendly form id).
    await page.locator('input[name="tenantSlug"]').fill("e2e-tenant");
    await page.locator('input[name="email"]').fill("e2e@example.com");
    await page.locator('input[name="password"]').fill("E2E-Teste-123!");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/onboarding|\/$/, { timeout: 15_000 });
  });
});
