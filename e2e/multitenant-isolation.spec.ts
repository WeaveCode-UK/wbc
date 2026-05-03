import { test, expect } from "@playwright/test";
import { loginAs } from "./_helpers/auth";

// T8.1 — Multi-tenant isolation E2E.
//
// Two seeded tenants, two seeded users. After Alice creates a client,
// Bob must NOT see it — neither in the listing UI, nor by hitting the
// tRPC procedure with the cross-tenant id.
//
// Currently fixme'd: the seed in packages/db/prisma/seed.ts only ships a
// single tenant (Renata). When the seed gains a second tenant + member
// (tracked under T2-B / regression on tenant-isolation-guard), unfixme.
test.describe("multi-tenant isolation", () => {
  test.fixme("Bob does not see Alice's clients in /clients", async ({
    page,
    context,
  }) => {
    // 1. Alice logs in (seeded tenant T-A) and creates a client.
    await loginAs(page, "alice@tenant-a.test", "E2E-Teste-123!");
    await page.goto("/clients");
    await page.locator('button:has-text("Adicionar")').click();
    await page.locator('input[name="name"]').fill("CrossTenantProbe");
    await page.locator('input[name="phone"]').fill("+5511999999999");
    await page.locator('button[type="submit"]').click();
    await expect(page.locator("text=CrossTenantProbe")).toBeVisible();

    // Capture the client id from the URL or the row's data-id.
    const probeId = await page
      .locator('[data-testid="client-row"]:has-text("CrossTenantProbe")')
      .getAttribute("data-id");
    expect(probeId).toBeTruthy();

    // 2. Switch context to a fresh browser (new cookies) and log in as Bob.
    const bobPage = await context.newPage();
    await loginAs(bobPage, "bob@tenant-b.test", "E2E-Teste-123!");
    await bobPage.goto("/clients");
    await expect(bobPage.locator("text=CrossTenantProbe")).not.toBeVisible();

    // 3. Bob attempts a direct tRPC call with Alice's client id —
    // must return 404 / NOT_FOUND, not the row.
    const r = await bobPage.request.get(
      `/api/trpc/clients.getById?input=${encodeURIComponent(JSON.stringify({ json: { id: probeId } }))}`,
    );
    expect([400, 401, 403, 404]).toContain(r.status());
  });
});
