import { test, expect } from '../support/fixtures';
import { mockLeadSubmit, autoClosePopups, dataLayerEvents, gotoReady } from '../support/mock';
import { FORMS } from '../support/data';

// Verifies events reach window.dataLayer (the GTM/GA4/Ads pipe). Works even
// before GTM is installed — track.js pushes to dataLayer regardless.
test.describe('Spanbix tracking (dataLayer)', () => {
  test.beforeEach(async ({ page }) => {
    autoClosePopups(page);
    await page.addInitScript(() => {
      (window as any).dataLayer = [];
    });
  });

  test('CTA / Call / WhatsApp clicks push their events', async ({ page }) => {
    await page.goto('/sap-course');

    await page.getByRole('link', { name: /Enroll Now/i }).first().click({ noWaitAfter: true });
    await expect.poll(() => dataLayerEvents(page)).toContain('cta_click');

    await page.getByRole('link', { name: /^Call/i }).first().click({ noWaitAfter: true });
    await expect.poll(() => dataLayerEvents(page)).toContain('call_click');

    await page.getByRole('link', { name: /WhatsApp/i }).first().click({ noWaitAfter: true });
    await expect.poll(() => dataLayerEvents(page)).toContain('whatsapp_click');
  });

  test('successful lead pushes generate_lead', async ({ page }) => {
    const mock = await mockLeadSubmit(page);
    await gotoReady(page, '/sap-course');

    const scope = page.locator('#lead');
    await scope.getByPlaceholder(/Your name/i).fill('Priya Sharma');
    await scope.getByPlaceholder(/\+91 98/i).fill('+91 98XXXXXXXX');
    await scope.getByRole('checkbox').first().check();
    await scope.getByRole('button', { name: FORMS.sapCourse.submitLabel }).click();

    await expect(page.getByText(FORMS.sapCourse.successText)).toBeVisible();
    expect(mock.wasCalled()).toBe(true);
    await expect.poll(() => dataLayerEvents(page)).toContain('generate_lead');
  });
});
