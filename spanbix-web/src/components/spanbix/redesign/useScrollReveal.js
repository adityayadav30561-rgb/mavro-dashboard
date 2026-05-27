'use client';

import { useEffect } from 'react';

// useScrollReveal — IntersectionObserver-based reveal trigger for `.sx-reveal`.
// Elements already in / above the viewport are revealed immediately (no
// flash-of-hidden-content on initial paint). Anything still hidden 1.6s
// after mount gets force-revealed as a safety net (catches IO edge cases
// during HMR or aggressive scroll-restoration).
export default function useScrollReveal(deps = []) {
  useEffect(() => {
    const reveal = (el) => el.classList.add('in');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) reveal(e.target);
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -10% 0px' }
    );
    const els = document.querySelectorAll('.spanbix-scope .sx-reveal');
    els.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.95) reveal(el);
      else io.observe(el);
    });
    const fallback = setTimeout(() => {
      document.querySelectorAll('.spanbix-scope .sx-reveal:not(.in)').forEach(reveal);
    }, 1600);
    return () => {
      io.disconnect();
      clearTimeout(fallback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
