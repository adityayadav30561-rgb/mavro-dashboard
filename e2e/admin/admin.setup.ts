import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Admin auth bootstrap. Logs in ONCE via the real login page and persists the
// authenticated storageState (cookies + localStorage, incl. the JWT) to
// e2e/.auth/admin.json. The admin test projects load that state so they don't
// re-login per test.
//
// Selectors are resilient (type/role/placeholder) but may need a tweak to match
// the live admin login form — adjust here if login fails.
const AUTH_FILE = path.join('e2e', '.auth', 'admin.json');

setup('authenticate admin', async ({ page }) => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL / ADMIN_PASSWORD env vars are required to run admin tests.');
  }

  await page.goto('/login');

  const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="mail" i]').first();
  const passField = page.locator('input[type="password"], input[name="password"]').first();
  await emailField.fill(email);
  await passField.fill(password);

  await page.getByRole('button', { name: /log\s?in|sign\s?in|login/i }).first().click();

  // Logged in when we leave /login (resilient — dashboard layout varies).
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
});
