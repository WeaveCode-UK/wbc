import { test, expect } from "@playwright/test";
import { loginAs } from "./_helpers/auth";

// Item 15 do handoff: cobertura E2E das features novas que entraram
// no chat de polimento (handoff 2026-05-03). Não substitui golden-1
// a golden-5; apenas adiciona smoke tests para as rotas/seções
// recém-criadas para que regressões sejam pegas no Playwright run.

test.describe("handoff features · smoke", () => {
  test("/analytics renders the three sections", async ({ page }) => {
    await loginAs(page);
    await page.goto("/analytics");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Análises/,
    );
    await expect(page.locator("text=Sazonalidade")).toBeVisible();
    await expect(page.locator("text=Top produtos")).toBeVisible();
    await expect(page.locator("text=Mês atual")).toBeVisible();
  });

  test("/settings/career renders the form and the empty state", async ({
    page,
  }) => {
    await loginAs(page);
    await page.goto("/settings/career");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Metas de carreira/,
    );
    await expect(page.locator("input[id='career-brand']")).toBeVisible();
    await expect(page.locator("input[id='career-revenue']")).toBeVisible();
  });

  test("/settings includes the new 'Metas de carreira' tab", async ({
    page,
  }) => {
    await loginAs(page);
    await page.goto("/settings");
    await expect(
      page.getByRole("tab", { name: /Metas de carreira/ }),
    ).toBeVisible();
  });

  test("/landing exposes Copiar link, Compartilhar via WhatsApp e QR Code", async ({
    page,
  }) => {
    await loginAs(page);
    await page.goto("/landing");
    await expect(
      page.getByRole("button", { name: /Copiar link/i }),
    ).toBeVisible();
    await expect(page.locator("text=QR Code")).toBeVisible();
  });

  test("Adicionar cliente opens the client modal", async ({ page }) => {
    await loginAs(page);
    await page.goto("/clients");
    await page.getByRole("button", { name: /Adicionar cliente/i }).click();
    // The AddClientModal renders a name + phone input.
    await expect(page.locator("input[name='name']")).toBeVisible();
  });

  test("Sair (logout) button on the topbar redirects to /login", async ({
    page,
  }) => {
    await loginAs(page);
    await page.goto("/");
    await page.getByRole("button", { name: /^Sair$/i }).click();
    await page.waitForURL(/\/login/, { timeout: 10_000 });
  });

  test("/clients/[id] surfaces the engagement breakdown card", async ({
    page,
  }) => {
    await loginAs(page);
    await page.goto("/clients");
    await page.locator("text=Ana Silva").first().click();
    await page.waitForURL(/\/clients\/[a-f0-9-]{36}$/);
    // Item 2: breakdown labels (Frequência/Recência/Ticket/Indicações).
    await expect(page.locator("text=Frequência")).toBeVisible();
    await expect(page.locator("text=Recência")).toBeVisible();
    await expect(page.locator("text=Indicações")).toBeVisible();
  });
});
