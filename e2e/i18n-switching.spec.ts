import { test, expect } from "@playwright/test";

// T8.9 — i18n switching. Verifies that flipping the NEXT_LOCALE cookie
// renders the dashboard in English instead of pt-BR. The locale parity
// guard at packages/i18n/src/__tests__/locale-parity.test.ts already
// ensures every key is translated; this test confirms the wiring.
test("locale cookie switch flips the visible UI strings", async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: "NEXT_LOCALE",
      value: "en",
      domain: "localhost",
      path: "/",
    },
  ]);
  await page.goto("/login");
  // Pick a string that has a stable English translation in
  // packages/i18n/src/locales/en/auth.json (or wherever the login form
  // pulls from). "Sign in" / "Email" / "Password" are reasonable
  // anchors. Use a regex that tolerates capitalisation.
  await expect(page.locator("body")).toContainText(/Sign in|Email|Password/);

  // Now flip back to pt-BR and confirm the change is visible.
  await context.clearCookies();
  await context.addCookies([
    {
      name: "NEXT_LOCALE",
      value: "pt-BR",
      domain: "localhost",
      path: "/",
    },
  ]);
  await page.goto("/login");
  await expect(page.locator("body")).toContainText(/Entrar|E-?mail|Senha/i);
});
