import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Clock, Search, Loader2 } from 'lucide-react';
import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import PageHero from '@/components/spanbix/redesign/PageHero';
import FinalCta from '@/components/spanbix/redesign/sections/FinalCta';
import useScrollReveal from '@/components/spanbix/redesign/useScrollReveal';
import { getPublicBlogs } from '@/api/public';
import useSEO from '@/hooks/useSEO';
import { SPANBIX_SITE, blogListLd, breadcrumbLd } from '@/lib/spanbixSeo';
import { withSpanbixBase } from '@/lib/routeBase';

const TONE_CYCLE = ['rose', 'olive', 'cream', 'slate'];

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
}

export default function SpanbixBlogList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const page = parseInt(searchParams.get('page'), 10) || 1;
  const query = searchParams.get('q') || '';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPublicBlogs(SPANBIX_SITE.slug, { page, limit: 9, search: query || undefined })
      .then((res) => {
        if (cancelled) return;
        setBlogs(res?.data?.data?.blogs || []);
        setPagination(res?.data?.pagination || { page, totalPages: 1, total: 0 });
      })
      .catch(() => !cancelled && setBlogs([]))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [page, query]);

  useSEO({
    title: query
      ? `Search: ${query} — ${SPANBIX_SITE.name} Blog`
      : `Career Insights & SAP Intelligence — ${SPANBIX_SITE.name}`,
    description:
      'Career guides, SAP module deep-dives, placement strategy, and enterprise technology insights from the Spanbix team.',
    keywords: ['SAP blog', 'SAP career guide', 'enterprise technology insights', 'placement strategy'],
    canonical: `${SPANBIX_SITE.url}/blog${query ? `?q=${encodeURIComponent(query)}` : ''}`,
    ogImage: SPANBIX_SITE.logo,
    jsonLd: [
      breadcrumbLd([
        { name: 'Home', url: `${SPANBIX_SITE.url}/` },
        { name: 'Blog', url: `${SPANBIX_SITE.url}/blog` },
      ]),
      blogs.length ? blogListLd(blogs, `${SPANBIX_SITE.url}/blog`) : null,
    ].filter(Boolean),
  });

  useScrollReveal([page, query, loading]);

  const onSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (search.trim()) next.set('q', search.trim());
    else next.delete('q');
    next.delete('page');
    setSearchParams(next);
  };
  const goPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
  };

  return (
    <SpanbixLayout>
      <PageHero
        eyebrow="Career Insights · SAP Intelligence"
        title={<>Field notes from the <em>SAP economy</em>.</>}
        subtitle="Career guides, module deep-dives, placement strategy, and enterprise technology insights from working consultants on the Spanbix bench. Updated weekly."
      >
        <form onSubmit={onSearch} className="relative" style={{ maxWidth: 460 }}>
          <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="animate-spin mx-auto" size={28} style={{ color: 'var(--sx-navy)' }} />
              <p className="sx-mono mt-3" style={{ color: 'var(--sx-ink-4)' }}>LOADING ARTICLES</p>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-16">
              <p style={{ fontFamily: 'var(--sx-serif)', fontSize: 26, color: 'var(--sx-navy)' }}>
                Nothing matches that search yet.
              </p>
              <p className="sx-lead mx-auto" style={{ marginTop: 12 }}>
                Try a broader keyword, or browse the full archive by clearing the search.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                {blogs.map((b, i) => {
                  const tone = TONE_CYCLE[i % TONE_CYCLE.length];
                  return (
                    <Link
                      key={b._id || b.slug}
                      to={withSpanbixBase(`/blog/${b.slug}`)}
                      className="sx-reveal block overflow-hidden group"
                      style={{
                        background: 'var(--sx-white)',
                        border: '1px solid var(--sx-hairline)',
                        borderRadius: 14,
                        transitionDelay: `${(i % 6) * 50}ms`,
                      }}
                    >
                      <div className={`sx-photo sx-photo-${tone}`} style={{ aspectRatio: '16/10' }}>
                        {b.coverImage && (
                          <img
                            src={b.coverImage}
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
                          <span className="sx-mono">{formatDate(b.publishedAt || b.createdAt)}</span>
                          {b.readingTimeMinutes && (
                            <span className="inline-flex items-center gap-1">
                              <Clock size={11} /> {b.readingTimeMinutes} min read
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
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => goPage(page - 1)}
                    className="sx-btn sx-btn-outline"
                    style={{ opacity: page <= 1 ? 0.4 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
                  >
                    Previous
                  </button>
                  <span className="sx-mono" style={{ color: 'var(--sx-ink-3)', margin: '0 14px' }}>
                    PAGE {page} OF {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= pagination.totalPages}
                    onClick={() => goPage(page + 1)}
                    className="sx-btn sx-btn-outline"
                    style={{ opacity: page >= pagination.totalPages ? 0.4 : 1, cursor: page >= pagination.totalPages ? 'not-allowed' : 'pointer' }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <FinalCta />
    </SpanbixLayout>
  );
}
