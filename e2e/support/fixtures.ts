import { test as base, expect } from '@playwright/test';

// Spanbix test fixture. The cohort-launch banner this used to suppress was
// removed in Aug 2026, so no page-load setup is needed today — the fixture
// stays as the shared import point for every Spanbix spec so a future
// site-wide interstitial only has to be handled here.
export const test = base;

export { expect };
