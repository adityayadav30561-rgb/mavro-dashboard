import { test, expect } from '../support/fixtures';
import { SPANBIX_ROUTES, TEXT_ROUTES } from '../support/data';

// Smoke: every public route loads (200) and renders a primary heading; the XML
// /text endpoints respond.
test.describe('Spanbix smoke / routing', () => {
  for (const route of SPANBIX_ROUTES) {
    test(`loads ${route.path}`, async ({ page }) => {
      const res = await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      expect(res, `no response for ${route.path}`).toBeTruthy();
      expect(res!.status(), `bad status for ${route.path}`).toBeLessThan(400);

      await expect(page).toHaveTitle(new RegExp(route.titleIncludes, 'i'));
      // A primary landmark/heading should exist.
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });
  }

  for (const path of TEXT_ROUTES) {
    test(`serves ${path}`, async ({ request, baseURL }) => {
      const res = await request.get(`${baseURL}${path}`);
      expect(res.status()).toBe(200);
      const body = await res.text();
      expect(body.length).toBeGreaterThan(10);
    });
  }
});
