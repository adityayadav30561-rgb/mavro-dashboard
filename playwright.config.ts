import { defineConfig, devices } from '@playwright/test';

// E2E suite for the DEPLOYED Spanbix site + Mavro admin dashboard.
// See e2e/README.md. Lead submits are ALWAYS mocked (never write real prod leads).
//
// Env:
//   SPANBIX_BASE_URL  default https://www.spanbix.com
//   ADMIN_BASE_URL    deployed admin URL — admin projects only run when set
//   ADMIN_EMAIL / ADMIN_PASSWORD  admin login (used by the auth setup project)

const SPANBIX = process.env.SPANBIX_BASE_URL || 'https://www.spanbix.com';
const ADMIN = process.env.ADMIN_BASE_URL || '';
const ADMIN_STATE = 'e2e/.auth/admin.json';

const spanbixProjects = [
  { name: 'spanbix-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
  { name: 'spanbix-webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 800 } } },
  { name: 'spanbix-mobile-chromium', use: { ...devices['Pixel 5'] } },
  { name: 'spanbix-mobile-webkit', use: { ...devices['iPhone 13'] } },
].map((p) => ({ ...p, testDir: './e2e/spanbix', use: { ...p.use, baseURL: SPANBIX } }));

// Admin projects only exist when ADMIN_BASE_URL is provided. A "setup" project
// logs in once and persists storageState; the admin test projects depend on it.
const adminProjects = ADMIN
  ? [
      { name: 'admin-setup', testDir: './e2e/admin', testMatch: /.*\.setup\.ts/, use: { baseURL: ADMIN } },
      {
        name: 'admin-chromium',
        testDir: './e2e/admin',
        testMatch: /.*\.spec\.ts/,
        dependencies: ['admin-setup'],
        use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, baseURL: ADMIN, storageState: ADMIN_STATE },
      },
      {
        name: 'admin-webkit',
        testDir: './e2e/admin',
        testMatch: /.*\.spec\.ts/,
        dependencies: ['admin-setup'],
        use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 }, baseURL: ADMIN, storageState: ADMIN_STATE },
      },
    ]
  : [];

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/recordings',
  fullyParallel: true,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: 1,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { outputFolder: 'e2e/report', open: 'never' }]],
  use: {
    // Record EVERYTHING, ALWAYS (video + screenshot + trace) per project decision.
    video: 'on',
    screenshot: 'on',
    trace: 'on',
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
  },
  projects: [...spanbixProjects, ...adminProjects],
});
