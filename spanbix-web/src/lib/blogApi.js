import { apiPath } from '@/lib/apiBase';
import { SPANBIX_SITE } from '@/lib/spanbixSeo';

// Server-side blog data access for the App Router blog routes. Native fetch with
// ISR (`next.revalidate`) so published-after-build content refreshes without a
// redeploy. Backend response shapes (blogController.js):
//   list   → { data: { blogs, website }, pagination }
//   detail → { data: { blog, website } }
// List blog fields: title slug excerpt featuredImage seoTitle seoDescription
//   keywords tags category readingTime publishedAt.
// Detail blog also carries `content` (sanitized HTML), canonicalUrl, ogImage,
// author.name, publishedAt, updatedAt.

const REVALIDATE = 300;

export async function fetchBlogList({ page = 1, query = '', limit = 9 } = {}) {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (query) qs.set('search', query);
  const url = apiPath(`/api/blogs/website/${SPANBIX_SITE.slug}?${qs.toString()}`);
  // Tagged 'blog' so api/revalidate can bust list + detail bodies on publish
  // (revalidatePath alone re-renders the route but reuses the cached fetch).
  const res = await fetch(url, { next: { revalidate: REVALIDATE, tags: ['blog'] } });
  if (!res.ok) return { blogs: [], pagination: { page, totalPages: 1, total: 0 } };
  const json = await res.json().catch(() => null);
  return {
    blogs: json?.data?.blogs || [],
    pagination: json?.pagination || { page, totalPages: 1, total: 0 },
  };
}

// Returns { blog } — blog is null when the API 404s (unpublished / missing slug).
// Any other non-OK status throws so it surfaces as a 500 rather than a silent 404.
export async function fetchBlogDetail(slug) {
  const url = apiPath(`/api/blogs/website/${SPANBIX_SITE.slug}/${encodeURIComponent(slug)}`);
  const res = await fetch(url, { next: { revalidate: REVALIDATE, tags: ['blog', `blog:${slug}`] } });
  if (res.status === 404) return { blog: null };
  if (!res.ok) throw new Error(`Blog fetch failed (${res.status})`);
  const json = await res.json().catch(() => null);
  return { blog: json?.data?.blog || null };
}

// Walk all paginated pages to collect every published slug for generateStaticParams.
export async function fetchAllBlogSlugs() {
  const slugs = [];
  let page = 1;
  let totalPages = 1;
  do {
    const url = apiPath(`/api/blogs/website/${SPANBIX_SITE.slug}?page=${page}&limit=100`);
    const res = await fetch(url);
    if (!res.ok) break;
    const json = await res.json().catch(() => null);
    (json?.data?.blogs || []).forEach((b) => b?.slug && slugs.push(b.slug));
    totalPages = json?.pagination?.totalPages || 1;
    page += 1;
  } while (page <= totalPages);
  return slugs;
}
