import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// T8.8 — Accessibility (axe-core). Hard-fails on any "serious" or
// "critical" violation. Pages we hit are public — no login required —
// so this works even on a fresh CI runner with the dev server up.
//
// To extend: log in via _helpers/auth.ts, navigate to /, /clients,
// /sales/new, /campaigns/new, /settings, /analytics, run axe on each.
// Skipped here until F11.E20 ships a deterministic seed.

const PUBLIC_ROUTES = ["/login", "/register", "/privacy-policy"];

for (const route of PUBLIC_ROUTES) {
  test(`a11y · ${route} has no serious or critical violations`, async ({
    page,
  }) => {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const blocking = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    );
    if (blocking.length > 0) {
      console.error(
        "axe violations:",
        JSON.stringify(blocking, null, 2).slice(0, 4000),
      );
    }
    expect(blocking).toEqual([]);
  });
}
