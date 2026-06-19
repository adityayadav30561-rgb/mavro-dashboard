import { Page, Request } from '@playwright/test';

// Intercepts POST /api/leads/submit so tests NEVER write a real lead to the prod
// DB. Returns a controller exposing the captured request(s) + a "was it called"
// flag. The read-only website lookup is left to pass through so the form still
// resolves a real websiteId.
export type LeadMock = {
  calls: () => any[];
  lastBody: () => any | null;
  wasCalled: () => boolean;
};

export async function mockLeadSubmit(page: Page): Promise<LeadMock> {
  const bodies: any[] = [];

  await page.route('**/api/leads/submit', async (route, request: Request) => {
    let body: any = null;
    try {
      body = request.postDataJSON();
    } catch {
      body = request.postData();
    }
    bodies.push(body);
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { id: 'e2e-mock-lead', message: 'Thank you for your submission' },
        message: 'Lead submitted successfully',
      }),
    });
  });

  return {
    calls: () => bodies,
    lastBody: () => (bodies.length ? bodies[bodies.length - 1] : null),
    wasCalled: () => bodies.length > 0,
  };
}

// Closes any popup tab (target=_blank, e.g. WhatsApp wa.me) so external links
// don't leave stray pages open during tracking tests.
export function autoClosePopups(page: Page) {
  page.context().on('page', (p) => {
    p.close().catch(() => {});
  });
}

// Navigate and wait until the form is ready to submit. The forms fetch the
// websiteId via GET /api/websites/public/<slug> on mount; submitting before it
// resolves trips the "Still connecting" guard. Await that response first.
export async function gotoReady(page: Page, url: string) {
  const ws = page
    .waitForResponse((r) => r.url().includes('/api/websites/public/'), { timeout: 30_000 })
    .catch(() => null);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await ws;
  await page.waitForTimeout(300); // let React commit the websiteId state
}

// Snapshot of window.dataLayer events (the GTM/GA4/Ads pipe).
export async function dataLayerEvents(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const dl = (window as any).dataLayer || [];
    return dl.map((e: any) => (e && e.event) || '').filter(Boolean);
  });
}
