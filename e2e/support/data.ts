// Shared constants + selectors for the Spanbix E2E tests. Centralised so a copy
// change on prod only needs one edit here. Strings mirror the live site
// (spanbix-web/) as of Phase 7.

export const SPANBIX_ROUTES = [
  { path: '/', titleIncludes: 'Spanbix' },
  { path: '/about', titleIncludes: 'About' },
  { path: '/courses', titleIncludes: 'Courses' },
  { path: '/career-paths', titleIncludes: 'Career Paths' },
  { path: '/career-paths/fico', titleIncludes: 'FICO' },
  { path: '/career-paths/mm', titleIncludes: 'MM' },
  { path: '/career-paths/sd', titleIncludes: 'SD' },
  { path: '/career-paths/abap', titleIncludes: 'ABAP' },
  { path: '/campus-programs', titleIncludes: 'Campus' },
  { path: '/contact', titleIncludes: 'Contact' },
  { path: '/enquire', titleIncludes: 'Spanbix' },
  { path: '/blog', titleIncludes: 'Spanbix' },
  { path: '/sap-course', titleIncludes: 'SAP' },
  { path: '/privacy', titleIncludes: 'Privacy' },
  { path: '/terms', titleIncludes: 'Terms' },
  { path: '/refund', titleIncludes: 'Refund' },
] as const;

export const TEXT_ROUTES = ['/sitemap.xml', '/robots.txt'] as const;

// Per-form contract: where the form lives, its formId, submit-button label,
// success text, and the placeholders to fill the required fields.
export const FORMS = {
  contact: {
    path: '/contact',
    formId: 'spanbix-contact',
    scope: 'form',
    submitLabel: /Book Career Consultation/i,
    successText: /Thanks — we got it/i,
    fill: { name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 98XXXXXXXX', education: 'B.Com (Hons)' },
  },
  enquire: {
    path: '/enquire',
    formId: 'spanbix-whatsapp',
    scope: 'form',
    submitLabel: /Send Enquiry/i,
    successText: /Thanks — we got it/i,
    fill: { name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 98XXXXXXXX', education: 'B.Com (Hons)' },
  },
  sapCourse: {
    // Two LpLeadForm instances on the page; tests scope to the hero form (#lead).
    path: '/sap-course',
    formId: 'spanbix-sap-lp',
    scope: '#lead',
    submitLabel: /Enroll Now — Get a Callback/i,
    successText: /Thanks — request received/i,
    fill: { name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 98XXXXXXXX' },
  },
} as const;

export const CONSENT_ERROR = /agree to the Privacy Policy/i;
export const ATTRIBUTION_QS = '?gclid=TEST123&utm_source=google&utm_medium=cpc&utm_campaign=sap';
export const HONEYPOT_SELECTOR = 'input[name="company_website"]';
