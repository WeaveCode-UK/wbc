import { test, expect } from '@playwright/test';

test('health endpoint returns 200', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBeDefined();
  expect(body.timestamp).toBeDefined();
});

test('login page loads', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveTitle(/WBC|Wave/i);
});
