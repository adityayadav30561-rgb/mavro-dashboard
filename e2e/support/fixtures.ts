import { test as base, expect } from '@playwright/test';

// Spanbix test fixture: suppress the first-visit cohort banner before every page
// load. The banner is a modal that intercepts pointer events and blocks form
// clicks. Writing a recent dismissal timestamp to its localStorage key keeps it
// closed (re-shows only after 24h from last dismissal). Key mirrors
// spanbix-web/src/components/spanbix/CohortBanner.jsx → DISMISS_KEY.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('spanbix-cohort-banner-dismissed-2', String(Date.now()));
      } catch {
        /* sessionStorage/localStorage blocked — ignore */
      }
    });
    await use(page);
  },
});

export { expect };
