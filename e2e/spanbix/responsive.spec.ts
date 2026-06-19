import { test, expect } from '../support/fixtures';

// No horizontal overflow on key pages. Runs across all projects (incl. mobile),
// so this is the responsive guard for the smallest viewports.
const PAGES = ['/', '/sap-course', '/contact'];

for (const path of PAGES) {
  test(`no horizontal overflow: ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle' });
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      // small tolerance for sub-pixel rounding
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(2);
  });
}
