import { test, expect } from '@playwright/test';

// READ-ONLY admin tests. They never create/edit/delete data. Selectors are
// resilient but may need tuning to the live admin UI — adjust if they miss.
// These run only when ADMIN_BASE_URL is set (see playwright.config.ts).

test.describe('Mavro admin — authenticated', () => {
  test('leads list loads', async ({ page }) => {
    await page.goto('/leads');
    await expect(page).not.toHaveURL(/\/login/);
    // Search box from the leads toolbar.
    await expect(
      page.getByPlaceholder(/search by name/i).or(page.getByRole('heading', { name: /leads/i })).first()
    ).toBeVisible();
  });

  test('opening a lead shows its details + custom fields', async ({ page }) => {
    await page.goto('/leads');
    // Click the first lead row/entry (resilient: first table row or list item that
    // isn't a header). Skip gracefully if there are no leads.
    const firstRow = page.locator('table tbody tr, [role="row"]').first();
    if ((await firstRow.count()) === 0) test.skip(true, 'no leads to open');
    await firstRow.click();
    await expect(page.getByText(/lead details/i)).toBeVisible();
    // Custom fields block (consent/gclid/utm render here for new leads).
    await expect(page.getByText(/form responses|consent|custom/i).first()).toBeVisible();
  });

  for (const path of ['/seo', '/analytics', '/websites', '/blogs']) {
    test(`core page loads: ${path}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator('h1, h2, main').first()).toBeVisible();
      expect(errors, `uncaught errors on ${path}: ${errors.join('; ')}`).toHaveLength(0);
    });
  }
});

test.describe('Mavro admin — unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('protected route redirects to /login', async ({ page }) => {
    await page.goto('/leads');
    await expect(page).toHaveURL(/\/login/);
  });
});
