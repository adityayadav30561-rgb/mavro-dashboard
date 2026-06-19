import { test, expect } from '../support/fixtures';

// SEO / meta / structured-data assertions against the live site.
test.describe('Spanbix SEO + structured data', () => {
  test('homepage: canonical (www), hreflang, Org + WebSite JSON-LD', async ({ page }) => {
    await page.goto('/');

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', /^https:\/\/www\.spanbix\.com\/?$/);

    await expect(page.locator('link[rel="alternate"][hreflang="en-IN"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);

    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    const blob = ld.join('\n');
    expect(blob).toContain('EducationalOrganization');
    expect(blob).toContain('WebSite');
    expect(blob).toContain('SearchAction');
  });

  test('/sap-course is noindex', async ({ page }) => {
    await page.goto('/sap-course');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
  });

  test('course page: Course JSON-LD has hasCourseInstance + offers, NO price', async ({ page }) => {
    await page.goto('/career-paths/fico');
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    const course = ld.find((t) => t.includes('"Course"'));
    expect(course, 'no Course JSON-LD found').toBeTruthy();

    const parsed = JSON.parse(course!);
    const node = Array.isArray(parsed) ? parsed.find((n) => n['@type'] === 'Course') : parsed;
    expect(node.hasCourseInstance).toBeTruthy();
    expect(node.offers).toBeTruthy();
    // Pricing policy: offers must NOT expose a numeric price.
    expect(node.offers.price).toBeUndefined();
  });

  test('legal pages have canonical + content', async ({ page }) => {
    for (const p of ['/privacy', '/terms', '/refund']) {
      await page.goto(p);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`https://www\\.spanbix\\.com${p}$`));
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });
});
