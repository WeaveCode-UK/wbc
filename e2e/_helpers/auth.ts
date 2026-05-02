import type { Page } from "@playwright/test";

// F11.E20: shared login helper. Uses the seed credentials from
// packages/db/prisma/seed.ts (Renata, the only seeded account with a
// password). Tests rely on the dev server being up — playwright.config.ts
// already starts apps/web before the run.

export const SEED_EMAIL = "renata@teste.com";
export const SEED_PASSWORD = "Teste@123";

export async function loginAs(
  page: Page,
  email = SEED_EMAIL,
  password = SEED_PASSWORD,
): Promise<void> {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  // The login form pushes to "/" on success (F11.E03 fix).
  await page.waitForURL("/", { timeout: 10_000 });
}
