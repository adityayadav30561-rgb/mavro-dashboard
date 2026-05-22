import { useEffect } from 'react';

const MANAGED_ATTR = 'data-mavro-seo';

function upsertMeta({ name, property, content }) {
  if (!content) return;
  const selector = name
    ? `meta[name="${name}"]`
    : `meta[property="${property}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    if (name) el.setAttribute('name', name);
    if (property) el.setAttribute('property', property);
    el.setAttribute(MANAGED_ATTR, '');
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink({ rel, href }) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    el.setAttribute(MANAGED_ATTR, '');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(id, payload) {
  if (!payload) return;
  let el = document.head.querySelector(`script[data-jsonld-id="${id}"]`);
  if (!el) {
    el = document.createElement('script');
    el.setAttribute('type', 'application/ld+json');
    el.setAttribute('data-jsonld-id', id);
    el.setAttribute(MANAGED_ATTR, '');
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(payload);
}

/**
 * Imperative SEO manager — sets title, meta, OG, Twitter cards, canonical, JSON-LD.
 * Avoids react-helmet dependency. Cleans up any prior JSON-LD on re-render.
 */
export default function useSEO({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  jsonLd,
}) {
  useEffect(() => {
    if (title) document.title = title;
    upsertMeta({ name: 'description', content: description });
    upsertMeta({ name: 'keywords', content: Array.isArray(keywords) ? keywords.join(', ') : keywords });

    upsertMeta({ property: 'og:title', content: title });
    upsertMeta({ property: 'og:description', content: description });
    upsertMeta({ property: 'og:type', content: ogType });
    upsertMeta({ property: 'og:image', content: ogImage });
    upsertMeta({ property: 'og:url', content: canonical || (typeof window !== 'undefined' ? window.location.href : '') });

    upsertMeta({ name: 'twitter:card', content: twitterCard });
    upsertMeta({ name: 'twitter:title', content: title });
    upsertMeta({ name: 'twitter:description', content: description });
    upsertMeta({ name: 'twitter:image', content: ogImage });

    upsertLink({ rel: 'canonical', href: canonical || (typeof window !== 'undefined' ? window.location.href : undefined) });

    if (jsonLd) {
      const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      items.forEach((p, i) => upsertJsonLd(`mavro-${i}`, p));
    }

    return () => {
      // Remove all dynamic JSON-LD blocks on unmount so the next page starts clean
      document.head
        .querySelectorAll('script[data-jsonld-id^="mavro-"]')
        .forEach((s) => s.remove());
    };
  }, [title, description, keywords, canonical, ogImage, ogType, twitterCard, JSON.stringify(jsonLd)]);
}
