import Link from 'next/link';
import { ArrowRight, Clock, Search } from 'lucide-react';
import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import PageHero from '@/components/spanbix/redesign/PageHero';
import FinalCta from '@/components/spanbix/redesign/sections/FinalCta';
import JsonLd from '@/components/JsonLd';
import { buildMetadata } from '@/lib/seoMeta';
import { fetchBlogList } from '@/lib/blogApi';
import { SPANBIX_SITE, blogListLd, breadcrumbLd } from '@/lib/spanbixSeo';

const TONE_CYCLE = ['rose', 'olive', 'cream', 'slate'];

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
}

export async function generateMetadata({ searchParams }) {
  const sp = (await searchParams) || {};
  const query = (sp.q || '').trim();
  return buildMetadata({
    title: query
      ? `Search: ${query} — ${SPANBIX_SITE.name} Blog`
      : `Career Insights & SAP Intelligence — ${SPANBIX_SITE.name}`,
    description:
      'SAP career guides from Spanbix — salaries, track comparisons and job advice for commerce, MBA and engineering graduates in India.',
    keywords: ['SAP blog', 'SAP career guide', 'enterprise technology insights', 'placement strategy'],
    canonical: `${SPANBIX_SITE.url}/blog${query ? `?q=${encodeURIComponent(query)}` : ''}`,
    ogImage: SPANBIX_SITE.logo,
  });
}

export default async function BlogListPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const page = parseInt(sp.page, 10) || 1;
  const query = (sp.q || '').trim();

  const { blogs, pagination } = await fetchBlogList({ page, query });

  const ld = [
    breadcrumbLd([
      { name: 'Home', url: `${SPANBIX_SITE.url}/` },
      { name: 'Blog', url: `${SPANBIX_SITE.url}/blog` },
    ]),
    blogs.length ? blogListLd(blogs, `${SPANBIX_SITE.url}/blog`) : null,
  ].filter(Boolean);

  const pageHref = (p) => {
    const q = new URLSearchParams();
    if (query) q.set('q', query);
    q.set('page', String(p));
    return `/blog?${q.toString()}`;
  };

  return (
    <>
      <JsonLd data={ld} />
      <SpanbixLayout>
        <PageHero
          eyebrow="Career Insights · SAP Intelligence"
          title={<>Field notes from the <em>SAP economy</em>.</>}
          subtitle="Career guides, module deep-dives, placement strategy, and enterprise technology insights from working consultants on the Spanbix bench. Updated weekly."
        >
          {/* Plain GET form → navigates to /blog?q=… without client JS. */}
          <form action="/blog" method="get" className="relative" style={{ maxWidth: 460 }}>
            <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)' }} />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search articles…"
              style={{
                width: '100%', paddingLeft: 38, paddingRight: 16, height: 44,
                borderRadius: 10, background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.18)', color: '#fff',
                fontFamily: 'var(--sx-sans)', fontSize: 14, outline: 'none',
              }}
            />
          </form>
        </PageHero>

        <section className="sx-section sx-section-paper">
          <div className="sx-container">
            {blogs.length === 0 ? (
              <div className="text-center py-16">
                <p style={{ fontFamily: 'var(--sx-serif)', fontSize: 26, color: 'var(--sx-navy)' }}>
                  {query ? 'Nothing matches that search yet.' : 'No articles published yet.'}
                </p>
                <p className="sx-lead mx-auto" style={{ marginTop: 12 }}>
                  {query
                    ? 'Try a broader keyword, or browse the full archive by clearing the search.'
                    : 'New field notes from the Spanbix bench are on the way — check back soon.'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                  {blogs.map((b, i) => {
                    const tone = TONE_CYCLE[i % TONE_CYCLE.length];
                    const cover = b.featuredImage;
                    return (
                      <Link
                        key={b._id || b.slug}
                        href={`/blog/${b.slug}`}
                        className="block overflow-hidden group"
                        style={{
                          background: 'var(--sx-white)',
                          border: '1px solid var(--sx-hairline)',
                          borderRadius: 14,
                        }}
                      >
                        <div className={`sx-photo sx-photo-${tone}`} style={{ aspectRatio: '16/10' }}>
                          {cover && (
                            <img
                              src={cover}
                              alt={b.title}
                              className="absolute inset-0 w-full h-full object-cover"
                              style={{ zIndex: 1 }}
                              loading="lazy"
                            />
                          )}
                          <div className="sx-photo-label" style={{ zIndex: 2 }}>
                            {(b.category || 'INSIGHT').toString().toUpperCase().slice(0, 24)}
                          </div>
                        </div>
                        <div style={{ padding: 22 }}>
                          <div className="sx-row" style={{ gap: 10, color: 'var(--sx-ink-4)', fontSize: 12 }}>
                            <span className="sx-mono">{formatDate(b.publishedAt)}</span>
                            {b.readingTime && (
                              <span className="inline-flex items-center gap-1">
                                <Clock size={11} /> {b.readingTime} min read
                              </span>
                            )}
                          </div>
                          <h3
                            style={{
                              fontFamily: 'var(--sx-serif)', fontSize: 22, color: 'var(--sx-navy)',
                              margin: '8px 0', letterSpacing: '-0.01em', lineHeight: 1.2,
                            }}
                          >
                            {b.title}
                          </h3>
                          {b.excerpt && (
                            <p style={{ color: 'var(--sx-ink-3)', fontSize: 14, lineHeight: 1.55, margin: '0 0 14px' }}>
                              {b.excerpt}
                            </p>
                          )}
                          <span
                            className="inline-flex items-center gap-1.5"
                            style={{ color: 'var(--sx-navy)', fontSize: 13, fontWeight: 500 }}
                          >
                            Read article <ArrowRight size={13} />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-10">
                    {page > 1 ? (
                      <Link href={pageHref(page - 1)} className="sx-btn sx-btn-outline">Previous</Link>
                    ) : (
                      <span className="sx-btn sx-btn-outline" style={{ opacity: 0.4, cursor: 'not-allowed' }}>Previous</span>
                    )}
                    <span className="sx-mono" style={{ color: 'var(--sx-ink-3)', margin: '0 14px' }}>
                      PAGE {page} OF {pagination.totalPages}
                    </span>
                    {page < pagination.totalPages ? (
                      <Link href={pageHref(page + 1)} className="sx-btn sx-btn-outline">Next</Link>
                    ) : (
                      <span className="sx-btn sx-btn-outline" style={{ opacity: 0.4, cursor: 'not-allowed' }}>Next</span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <FinalCta />
      </SpanbixLayout>
    </>
  );
}
