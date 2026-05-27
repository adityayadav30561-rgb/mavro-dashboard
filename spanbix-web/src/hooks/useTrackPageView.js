'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView, trackEvent } from '@/lib/analytics';

/**
 * Fires a page_view (or override eventType) every time the route changes.
 * Pass `meta` for extra context (e.g. blog slug). `meta` is stringified for
 * dependency tracking.
 *
 * Reads the query string from `window.location.search` inside the effect
 * (client-only) rather than `useSearchParams()` — the latter forces a
 * client-side rendering bailout / Suspense boundary at static prerender, which
 * we don't want for an analytics-only side effect.
 */
export default function useTrackPageView(eventType = 'page_view', meta) {
  const pathname = usePathname();
  const metaKey = JSON.stringify(meta || {});

  useEffect(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const page = pathname + (search || '');
    if (eventType === 'page_view') {
      trackPageView(page, meta);
    } else {
      trackEvent({ eventType, page, meta });
    }
  }, [pathname, eventType, metaKey]); // eslint-disable-line
}
