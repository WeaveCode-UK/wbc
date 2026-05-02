import { test, expect } from "@playwright/test";
import { loginAs } from "./_helpers/auth";

// F11.E20 · Golden path 4: import .xlsx -> bulk-edit selection.
// File upload via setInputFiles needs a fixture file; both halves are
// fixme'd because:
//   1. the xlsx parsing is client-side and Playwright can drive it,
//      but we don't have a fixture file in e2e/_fixtures yet (one of
//      the F11.E20.5 tasks is to commit a sample contacts.xlsx).
//   2. the bulk-edit checkbox is wired and the action bar appears,
//      but the spec asserts the toast feedback that F11.E20.5 will
//      add.

test.describe("golden path 4 · import + bulk", () => {
  test("/clients/import renders dropzone", async ({ page }) => {
    await loginAs(page);
    await page.goto("/clients/import");
    await expect(page.locator('input[type="file"]')).toBeVisible();
  });

  test.fixme("uploads a 50-row xlsx and reports the import", async ({
    page,
  }) => {
    await loginAs(page);
    await page.goto("/clients/import");
    // F11.E20.5 task: commit e2e/_fixtures/contacts-50.xlsx
    await page
      .locator('input[type="file"]')
      .setInputFiles("e2e/_fixtures/contacts-50.xlsx");
    await page.getByRole("button", { name: /Confirmar/i }).click();
    await expect(page.locator("text=imported")).toBeVisible();
  });

  test("bulk-action bar appears when at least one client is selected", async ({
    page,
  }) => {
    await loginAs(page);
    await page.goto("/clients");
    await page.locator("input[type='checkbox']").first().check();
    await expect(
      page.getByRole("button", { name: /Classificação A/i }),
    ).toBeVisible();
  });
});
