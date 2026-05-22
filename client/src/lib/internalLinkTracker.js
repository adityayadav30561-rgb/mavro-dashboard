// ===================================
// Internal Link Click Tracker
// ===================================
// Bridges public-site internal anchor clicks into the existing analytics
// pipeline without schema changes. Emits `cta_click` events with a
// structured `meta` payload — captured by the existing
// AnalyticsEvent.meta (Mixed) field. Future analytics surfaces can group
// by `meta.linkType === 'internal'`.
//
// Architecture hooks (no UI surface yet — Phase 2.x will graph click depth):
//
//   import { trackInternalLinkClick, attachInternalLinkClickListener }
//     from '@/lib/internalLinkTracker';
//
//   // explicit
//   trackInternalLinkClick({ href, anchor, sourceBlogSlug });
//
//   // automatic: attach once per page mount on the article container
//   useEffect(() => {
//     const detach = attachInternalLinkClickListener(articleRef.current, {
//       sourceBlogSlug: blog?.slug,
//     });
//     return detach;
//   }, [blog?.slug]);
//
// Multi-tenant: uses `currentTenant` from lib/analytics.js — already
// set by each public layout via `setAnalyticsTenant(slug)`.

import { trackEvent } from './analytics';

/**
 * Fire an internal-link click event.
 * @param {Object} arg
 * @param {string} arg.href           — destination URL (absolute or relative)
 * @param {string} arg.anchor         — anchor text content
 * @param {string} [arg.sourceBlogSlug] — slug of the article the click came from
 * @param {string} [arg.position]     — optional placement hint ('inline'|'related'|'footer')
 */
export function trackInternalLinkClick({ href, anchor, sourceBlogSlug, position = 'inline' } = {}) {
  if (!href) return;
  try {
    trackEvent({
      eventType: 'cta_click',
      meta: {
        ctaName: 'internal_link',
        linkType: 'internal',
        href,
        anchor: typeof anchor === 'string' ? anchor.slice(0, 200) : '',
        sourceBlogSlug: sourceBlogSlug || null,
        position,
      },
    });
  } catch { /* analytics must never throw */ }
}

/**
 * Attach a delegated click listener to a container that intercepts
 * internal-anchor clicks (`<a href="/...">`) and fires `trackInternalLinkClick`.
 *
 * Returns a detach function — call it in the cleanup of `useEffect`.
 *
 * Skipped automatically for:
 *   - hash-only links (#section)
 *   - external links (http* with different hostname)
 *   - links with `data-no-track` attribute
 *   - middle-click / ctrl-click navigations are still tracked (sendBeacon-safe)
 */
export function attachInternalLinkClickListener(container, { sourceBlogSlug } = {}) {
  if (!container || typeof container.addEventListener !== 'function') {
    return () => {};
  }

  const handler = (ev) => {
    const a = ev.target?.closest?.('a[href]');
    if (!a) return;
    if (a.hasAttribute('data-no-track')) return;
    const href = a.getAttribute('href') || '';
    if (!href || href.startsWith('#')) return;

    let isInternal = false;
    let resolvedHref = href;

    if (href.startsWith('/')) {
      isInternal = true;
    } else if (/^https?:\/\//i.test(href)) {
      try {
        const u = new URL(href);
        if (typeof window !== 'undefined' && u.hostname === window.location.hostname) {
          isInternal = true;
          resolvedHref = u.pathname + u.search + u.hash;
        }
      } catch { /* malformed url */ }
    } else {
      // relative
      isInternal = true;
    }

    if (!isInternal) return;

    const anchor = (a.textContent || '').trim();
    trackInternalLinkClick({ href: resolvedHref, anchor, sourceBlogSlug });
  };

  container.addEventListener('click', handler, { capture: true });
  return () => container.removeEventListener('click', handler, { capture: true });
}

// ===================================
// Editor-side: fire when author inserts a suggested link
// ===================================
/**
 * Track an Internal Linking Assistant insertion. Called from the blog editor
 * when an author one-clicks a suggested anchor into the draft. Lands in
 * AnalyticsEvent with meta.action='insert' for future CTR rollups.
 *
 * @param {Object} arg
 * @param {string} arg.websiteSlug      tenant slug of draft
 * @param {string} arg.href             target URL inserted
 * @param {string} arg.anchor           anchor text inserted
 * @param {string} [arg.sourceBlogId]   editor's blog _id when persisted
 * @param {string} [arg.suggestionType] exact|partial|semantic|cluster|orphan
 * @param {number} [arg.confidence]     relevance/confidence 0–100
 */
export function trackLinkInsert({ websiteSlug, href, anchor, sourceBlogId, suggestionType, confidence } = {}) {
  if (!href) return;
  try {
    trackEvent({
      eventType: 'cta_click',
      websiteSlug,
      meta: {
        ctaName: 'internal_link_insert',
        linkType: 'internal',
        action: 'insert',
        href,
        anchor: typeof anchor === 'string' ? anchor.slice(0, 200) : '',
        sourceBlogId: sourceBlogId || null,
        suggestionType: suggestionType || null,
        confidence: typeof confidence === 'number' ? Math.round(confidence) : null,
      },
    });
  } catch { /* never throw */ }
}

// ===================================
// Navigation-depth tracking
// ===================================
// Per-tab session counter. Bumped each time an internal anchor click is
// observed. Surfaces "internal navigation depth" for future Analytics rollups.
const DEPTH_KEY = 'mavro_link_depth';

function readDepth() {
  try {
    const raw = sessionStorage.getItem(DEPTH_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch { return 0; }
}
export function bumpInternalNavigationDepth() {
  try {
    const next = readDepth() + 1;
    sessionStorage.setItem(DEPTH_KEY, String(next));
    return next;
  } catch { return 0; }
}
export function getInternalNavigationDepth() {
  return readDepth();
}
