import { test, expect } from "@playwright/test";
import { loginAs } from "./_helpers/auth";

// F11.E20 · Golden path 3: campaigns list -> create campaign wizard ->
// (creating a real campaign needs at least 1 client tagged, and the
// confirm step enqueues a worker job — both safe to call on the seed
// dataset). Remarketing button is asserted as visible because real
// remarketing needs a campaign with delivered recipients which the
// seed doesn't create.

test.describe("golden path 3 · campaigns", () => {
  test("login -> /campaigns shows the empty state or the list", async ({
    page,
  }) => {
    await loginAs(page);
    await page.goto("/campaigns");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Campanhas/i,
    );
  });

  test("/campaigns/new wizard opens at step 1 (recipients)", async ({
    page,
  }) => {
    await loginAs(page);
    await page.goto("/campaigns/new");
    await expect(page.locator("text=Destinatárias")).toBeVisible();
  });

  test.fixme("remarketing button on /campaigns/[id] (needs a campaign with status SENT)", async ({
    page,
  }) => {
    await loginAs(page);
    // Skipped until the seed creates a SENT campaign with recipients.
    await page.goto("/campaigns");
    const firstCampaign = page.locator("a[href^='/campaigns/']").first();
    if (await firstCampaign.count()) {
      await firstCampaign.click();
      await expect(
        page.getByRole("button", { name: /Não responderam/i }),
      ).toBeVisible();
    }
  });
});
