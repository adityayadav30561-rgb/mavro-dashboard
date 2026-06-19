import { test, expect } from '../support/fixtures';

// /sap-course is a dedicated Ads landing page with its own stripped chrome.
test.describe('SAP landing page UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sap-course');
  });

  test('has its own header with no main-site nav links', async ({ page }) => {
    // Stripped LP chrome: no escape links to the main site sections.
    await expect(page.getByRole('link', { name: 'Career Paths', exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Campus Programs', exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Blog', exact: true })).toHaveCount(0);
    // ...but the Enroll CTA is present.
    await expect(page.getByRole('link', { name: /Enroll Now/i }).first()).toBeVisible();
  });

  test('Call + WhatsApp floaters are present', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Call Spanbix now/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Chat with Spanbix on WhatsApp/i })).toBeVisible();
  });

  test('CTA strips + reviews carousel render', async ({ page }) => {
    await expect(page.getByText(/Talk to a counsellor|Join students already working/i).first()).toBeVisible();
    // A real review surfaces in the carousel.
    await expect(page.getByText(/Tushar Aggarwal|Aditya Yadav/i).first()).toBeVisible();
  });

  test('shows NO pricing (no ₹ anywhere)', async ({ page }) => {
    const text = await page.locator('body').innerText();
    expect(text).not.toContain('₹');
  });
});
