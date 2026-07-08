// ===================================
// Lightweight frontend analytics client
// ===================================
// - Persists sessionId in sessionStorage (per-tab)
// - Uses navigator.sendBeacon when available so events flush even on unload
// - Dedupes rapid duplicate events (same eventType+page+meta within DEDUPE_MS)
// - Fails silently — analytics must never break the UI
// - Routes through `apiPath()` so a Vercel-hosted public frontend posts to the
//   correct backend host (VITE_API_BASE_URL) without rewriting call sites.

import { apiPath } from './apiBase';

const SESSION_KEY = 'mavro_analytics_session';
const DEDUPE_MS = 1500;
// No default tenant — public marketing sites no longer live on this bundle
// (Spanbix is on spanbix-web, SaiSatwik is on WordPress). Any tracker call
// without an explicit slug (and without a layout having set one) is dropped
// rather than mis-attributed.
const DEFAULT_TENANT = null;

let lastKey = null;
let lastSentAt = 0;
let currentTenant = DEFAULT_TENANT;

// Layouts call this on mount so all subsequent tracking is scoped to the
// correct tenant without each call site having to pass the slug explicitly.
export function setAnalyticsTenant(slug) {
  if (slug && typeof slug === 'string') currentTenant = slug;
}
export function getAnalyticsTenant() {
  return currentTenant;
}

export function getOrCreateSession() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // sessionStorage unavailable (Safari private mode etc.) — fall back to ephemeral id
    return `eph_${Math.random().toString(36).slice(2, 12)}`;
  }
}

function detectDevice() {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent || '';
  if (/bot|crawler|spider/i.test(ua)) return 'bot';
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobi|Android|iPhone|iPod|webOS|BlackBerry|Opera Mini|IEMobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

export function trackEvent({ eventType, page, websiteSlug, meta }) {
  const slug = websiteSlug || currentTenant;
  if (!slug) return; // no tenant context — drop instead of mis-attributing
  if (typeof window === 'undefined') return;
  try {
    const path = page || window.location.pathname;
    const key = `${eventType}|${path}|${JSON.stringify(meta || {})}`;
    const now = Date.now();
    if (key === lastKey && now - lastSentAt < DEDUPE_MS) return;
    lastKey = key;
    lastSentAt = now;

    const payload = JSON.stringify({
      websiteSlug: slug,
      eventType,
      page: path,
      sessionId: getOrCreateSession(),
      referrer: document.referrer || undefined,
      deviceType: detectDevice(),
      meta: meta || {},
    });

    const url = apiPath('/api/analytics/track');

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' });
      const ok = navigator.sendBeacon(url, blob);
      if (ok) return;
    }

    // Fallback — keepalive fetch so the request survives page unload
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // never throw from tracking
  }
}

export const trackPageView = (page, meta) =>
  trackEvent({ eventType: 'page_view', page, meta });

export const trackBlogView = (slug, page) =>
  trackEvent({ eventType: 'blog_view', page, meta: { blogSlug: slug } });

export const trackCtaClick = (ctaName, meta) =>
  trackEvent({ eventType: 'cta_click', meta: { ctaName, ...(meta || {}) } });

export const trackFormSubmit = (formId, meta) =>
  trackEvent({ eventType: 'form_submit', meta: { formId, ...(meta || {}) } });
