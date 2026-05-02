import { test, expect } from "@playwright/test";
import { loginAs } from "./_helpers/auth";

// F11.E20 · Golden path 5: export CSV -> theme + locale toggle ->
// suspend/reactivate. The suspend/reactivate half is fixme'd because
// the procedure does not exist as a UI surface today (the
// suspended-account screen is wired but only the platform admin can
// flip the flag).

test.describe("golden path 5 · settings", () => {
  test("login -> /settings tabs render", async ({ page }) => {
    await loginAs(page);
    await page.goto("/settings");
    await expect(page.getByRole("tab", { name: /Perfil/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Plano/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Tema/i })).toBeVisible();
  });

  test("/settings/theme switches dark mode", async ({ page }) => {
    await loginAs(page);
    await page.goto("/settings/theme");
    const html = page.locator("html");
    const initialMode = await html.getAttribute("data-mode");
    await page.locator('[role="switch"]').first().click();
    // The ThemeProvider writes data-mode synchronously on toggle.
    await expect(html).not.toHaveAttribute("data-mode", initialMode ?? "light");
  });

  test.fixme("export tab triggers a download (needs Playwright download capture)", async ({
    page,
  }) => {
    await loginAs(page);
    await page.goto("/settings");
    await page.getByRole("tab", { name: /Exportar/i }).click();
    const downloadPromise = page.waitForEvent("download");
    await page
      .getByRole("button", { name: /Exportar/i })
      .nth(1)
      .click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/wbc-export-/);
  });

  test.fixme("logout button (needs F11.E20.5 to add it to the topbar)", async ({
    page,
  }) => {
    await loginAs(page);
    await page.goto("/");
    await page.getByRole("button", { name: /Sair|Logout/i }).click();
    await page.waitForURL(/\/login/);
  });
});
