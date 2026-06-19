import { test, expect } from '../support/fixtures';
import type { Locator, Page } from '@playwright/test';
import { mockLeadSubmit, gotoReady } from '../support/mock';
import { FORMS, ATTRIBUTION_QS, HONEYPOT_SELECTOR } from '../support/data';

type FormKey = keyof typeof FORMS;

// Placeholder map per form (mirrors the live inputs).
const PLACEHOLDERS: Record<FormKey, { name: RegExp; email: RegExp; phone: RegExp; education?: RegExp }> = {
  contact: { name: /Priya Sharma/i, email: /priya@example/i, phone: /\+91 98/i, education: /B\.Com/i },
  enquire: { name: /Priya Sharma/i, email: /priya@example/i, phone: /\+91 98/i, education: /B\.Com/i },
  sapCourse: { name: /Your name/i, email: /you@example/i, phone: /\+91 98/i },
};

function scopeOf(page: Page, key: FormKey): Locator {
  const s = FORMS[key].scope;
  return s === 'form' ? page.locator('form').first() : page.locator(s);
}

async function fillRequired(scope: Locator, key: FormKey) {
  const p = PLACEHOLDERS[key];
  const f = FORMS[key].fill as any;
  await scope.getByPlaceholder(p.name).fill(f.name);
  await scope.getByPlaceholder(p.phone).fill(f.phone);
  if (f.email) await scope.getByPlaceholder(p.email).fill(f.email);
  if (p.education && f.education) await scope.getByPlaceholder(p.education).fill(f.education);
}

async function checkConsent(scope: Locator) {
  await scope.getByRole('checkbox').first().check();
}

async function setHoneypot(scope: Locator, value: string) {
  // Honeypot is off-screen; set value via the DOM so React's onChange fires.
  await scope.locator(HONEYPOT_SELECTOR).evaluate((el, v) => {
    const input = el as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
    setter.call(input, v);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

for (const key of Object.keys(FORMS) as FormKey[]) {
  const cfg = FORMS[key];

  test.describe(`Form: ${key} (${cfg.formId})`, () => {
    test('submits with consent + records attribution (mocked, no real lead)', async ({ page }) => {
      const mock = await mockLeadSubmit(page);
      await gotoReady(page, `${cfg.path}${ATTRIBUTION_QS}`);
      const scope = scopeOf(page, key);

      await fillRequired(scope, key);
      await checkConsent(scope);
      await scope.getByRole('button', { name: cfg.submitLabel }).click();

      // Success UI + the lead POST was intercepted (never hit the real backend).
      await expect(page.getByText(cfg.successText)).toBeVisible();
      expect(mock.wasCalled()).toBe(true);

      const body = mock.lastBody();
      expect(body.formId).toBe(cfg.formId);
      expect(body.customFields.consent).toMatch(/Agreed/i);
      expect(body.customFields.gclid).toBe('TEST123');
      expect(body.customFields.utm_source).toBe('google');
      expect(body.customFields.utm_campaign).toBe('sap');
    });

    test('blocks submit when consent is unchecked', async ({ page }) => {
      const mock = await mockLeadSubmit(page);
      await page.goto(cfg.path);
      const scope = scopeOf(page, key);

      await fillRequired(scope, key);
      // Do NOT check consent.
      await scope.getByRole('button', { name: cfg.submitLabel }).click();

      await expect(page.getByText(cfg.successText)).toHaveCount(0);
      expect(mock.wasCalled()).toBe(false);
    });

    test('honeypot drops bot submissions (no POST)', async ({ page }) => {
      const mock = await mockLeadSubmit(page);
      await gotoReady(page, cfg.path);
      const scope = scopeOf(page, key);

      await fillRequired(scope, key);
      await checkConsent(scope);
      await setHoneypot(scope, 'bot-filled-this');
      await scope.getByRole('button', { name: cfg.submitLabel }).click();

      // UI shows success but the lead is never posted.
      await expect(page.getByText(cfg.successText)).toBeVisible();
      expect(mock.wasCalled()).toBe(false);
    });
  });
}
