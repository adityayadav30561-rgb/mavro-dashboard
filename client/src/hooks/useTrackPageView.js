import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, trackEvent } from '@/lib/analytics';

/**
 * Fires a page_view (or override eventType) every time the React Router pathname changes.
 * Pass `meta` for extra context (e.g. blog slug). `meta` is stringified for dependency tracking.
 */
export default function useTrackPageView(eventType = 'page_view', meta) {
  const { pathname, search } = useLocation();
  const metaKey = JSON.stringify(meta || {});

  useEffect(() => {
    if (eventType === 'page_view') {
      trackPageView(pathname + (search || ''), meta);
    } else {
      trackEvent({ eventType, page: pathname + (search || ''), meta });
    }
  }, [pathname, search, eventType, metaKey]); // eslint-disable-line
}
