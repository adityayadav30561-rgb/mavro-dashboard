# E2E tests (Playwright)

End-to-end suite for the **deployed** Spanbix site + Mavro admin dashboard, with
full recording (video + screenshot + trace) of every test.

## Golden rule
**Lead submits are ALWAYS mocked.** Even against prod, `**/api/leads/submit` is
intercepted (`e2e/support/mock.ts`) so tests never write a real lead to the live
DB. Admin tests are read-only — they never create/edit/delete data.

## Setup (once)
```
npm install                 # installs @playwright/test (devDependency)
npx playwright install      # downloads the browsers
```

## Environment
| Var | Default | Needed for |
|-----|---------|-----------|
| `SPANBIX_BASE_URL` | `https://www.spanbix.com` | Spanbix tests |
| `ADMIN_BASE_URL`   | _(unset)_ | Admin tests — set to the deployed admin URL or the admin projects don't run |
| `ADMIN_EMAIL`      | _(unset)_ | Admin login |
| `ADMIN_PASSWORD`   | _(unset)_ | Admin login |

Set them inline (PowerShell): `$env:ADMIN_BASE_URL="https://your-admin.vercel.app"`
then run a script. Or export in bash. Never commit credentials.

## Run
```
npm run test:e2e            # everything (admin only if ADMIN_BASE_URL is set)
npm run test:e2e:spanbix    # Spanbix only
npm run test:e2e:admin      # admin only
npm run test:e2e:ui         # headed/interactive UI mode
```

## Recordings & report
- Per-test **videos + screenshots + traces** → `e2e/recordings/`
- Browsable **HTML report** (plays videos, opens traces) → `e2e/report/`
  - `npm run test:e2e:report` opens it.
- A single trace: `npm run test:e2e:trace -- e2e/recordings/<test>/trace.zip`

Playwright records ONE video per test (not one file for the whole run). The HTML
report stitches them into a browsable view. The **trace** is the richest artifact
— step-by-step replay with DOM snapshots, console, and network.

## Coverage
- `e2e/spanbix/` — smoke/routing, SEO + JSON-LD, forms (consent gate, mocked
  submit payload incl. gclid/utm, honeypot), tracking (dataLayer), `/sap-course`
  UX (no nav, floaters, CTA strips, no pricing), responsive overflow.
- `e2e/admin/` — auth (storageState), leads list + lead detail (read-only),
  core pages load. `admin.setup.ts` logs in once and saves `e2e/.auth/admin.json`.

## Notes
- Browsers/viewports: Chromium + WebKit, desktop + mobile (Pixel 5, iPhone 13).
- Admin selectors are resilient but may need tuning to the live admin UI.
- Recordings, the report, and `e2e/.auth/` are git-ignored (local artifacts).
