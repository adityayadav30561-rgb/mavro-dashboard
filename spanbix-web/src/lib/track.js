'use client';

// ───────────────────────────────────────────────────────────────────────────
// Unified event dispatch for the Spanbix Ads landing page.
// ───────────────────────────────────────────────────────────────────────────
// Every tracked interaction fans out to two destinations:
//
//   1. window.dataLayer  — the Google Tag Manager / GA4 / Google Ads pipe.
//      GTM listens on dataLayer; you create the GA4 + Ads conversion tags in
//      the GTM UI (no code change needed to add/replace destinations later).
//
//   2. The existing Mavro backend analytics (lib/analytics.trackEvent) — so the
//      admin dashboard's own analytics still sees landing-page activity.
//
// NOTE on form submissions: the lead controller emits a server-authoritative
// `form_submit` when the lead row is saved (see CLAUDE.md invariant). So for a
// successful lead we push `generate_lead` to dataLayer (for GA4 + Ads) but do
// NOT re-emit `form_submit` to the backend from here — that would double-count.
//
// Safe no-op on the server. Never throws.

import { trackEvent } from './analytics';

export function track(event, params = {}) {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...params });
  }
  try {
    trackEvent({ eventType: event, meta: params });
  } catch {
    // analytics must never break the UI
  }
}

// Convenience wrappers — keep event names stable; GTM triggers match on them.
export const trackCta = (label, extra = {}) => track('cta_click', { cta: label, ...extra });
export const trackWhatsApp = (location) => track('whatsapp_click', { location });
export const trackCall = (location) => track('call_click', { location });

// Fired only on a confirmed lead. `value` lets you assign a conversion value in
// GA4 / Google Ads if you want ROAS reporting later.
//
// Called from EVERY lead form: /sap-course (ads landing), /contact and
// /enquire. Scoping it to the ads page alone made Meta blind to enquiries that
// came through the main contact form, so the pixel never saw a Lead and Meta's
// automatic event detection invented a `Subscribe` instead (Aug 2026).
//
// Both platforms attribute by click id (gclid / fbclid), so a lead arriving
// with neither is recorded but is not credited to a campaign. Reporting every
// real lead therefore gives the optimisers more signal without inflating
// campaign performance.
//
// ALWAYS call this AFTER the submit API resolves. Never on a click, a
// validation failure, or the honeypot branch — those would be phantom
// conversions that both ad platforms would then optimise towards.
//
// /campus-visit deliberately does NOT call this: it books an institutional
// session with a college T&P cell, which is a different thing from an
// individual enquiry and is not what the ad campaigns are buying.
export const trackLead = (extra = {}) => {
  if (typeof window === 'undefined') return;

  // Google: GTM listens for `generate_lead` and fires the Ads conversion tag.
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'generate_lead', ...extra });

  // Meta: the standard `Lead` event Meta Ads optimises and reports against.
  // Guarded because the pixel is env-gated (absent in local dev / previews).
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Lead', {
      content_name: extra.interest || undefined,
      content_category: extra.form || undefined,
    });
  }
};
