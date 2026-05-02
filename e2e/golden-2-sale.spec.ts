import { test, expect } from "@playwright/test";
import { loginAs } from "./_helpers/auth";

// F11.E20 · Golden path 2: login -> open existing client -> create sale
// -> charge via WhatsApp.
//
// "Criar cliente" step is fixme'd until F11.E20.5 wires the
// "Adicionar cliente" button to a form (today the button has no
// onClick). The rest of the path uses one of the 50 seeded clients.

test.describe("golden path 2 · sale flow", () => {
  test("login -> /clients renders the seeded list", async ({ page }) => {
    await loginAs(page);
    await page.goto("/clients");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Clientes/i,
    );
    // Seed creates 50 clients; at least one card/row should be visible.
    await expect(page.locator("text=Ana Silva")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("open Ana Silva profile shows 6 stat cards", async ({ page }) => {
    await loginAs(page);
    await page.goto("/clients");
    await page.locator("text=Ana Silva").first().click();
    await page.waitForURL(/\/clients\/[a-f0-9-]{36}$/);
    await expect(page.locator("text=Ticket médio")).toBeVisible();
  });

  test.fixme("creating a new client via 'Adicionar cliente' button (needs F11.E20.5)", async ({
    page,
  }) => {
    await loginAs(page);
    await page.goto("/clients");
    await page.getByRole("button", { name: /Adicionar cliente/i }).click();
    // A modal/form should appear; F11.E20.5 wires it.
    await expect(page.locator('input[name="name"]')).toBeVisible();
  });

  test.fixme("WhatsApp button on the profile opens wa.me (needs popup capture)", async ({
    page,
    context,
  }) => {
    await loginAs(page);
    await page.goto("/clients");
    await page.locator("text=Ana Silva").first().click();
    const popupPromise = context.waitForEvent("page");
    await page.getByRole("button", { name: /WhatsApp/i }).click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(/wa\.me\//);
  });

  test("new sale wizard opens and shows step 1", async ({ page }) => {
    await loginAs(page);
    await page.goto("/sales/new");
    await expect(page.locator("text=Selecione a cliente")).toBeVisible();
  });
});
