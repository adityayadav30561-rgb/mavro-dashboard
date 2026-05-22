import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, FileText, Search, Loader2 } from 'lucide-react';
import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import PageHero from '@/components/spanbix/PageHero';
import { getPublicBlogs } from '@/api/public';
import useSEO from '@/hooks/useSEO';
import { SPANBIX_SITE, SPANBIX_BRAND, blogListLd, breadcrumbLd } from '@/lib/spanbixSeo';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
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
    return () => {
      cancelled = true;
    };
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
        eyebrow="Career Intelligence"
        title="Career guides, SAP deep-dives, and placement strategy."
        subtitle="Operational reads from the Spanbix team — written for learners, working consultants, and T&P offices."
      >
        <form onSubmit={onSearch} className="mt-2 max-w-xl">
          <div
            className="flex items-center gap-2 p-1.5 rounded-xl"
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Search size={16} className="ml-3 text-white/60" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles…"
              className="flex-1 bg-transparent outline-none text-[14px] font-sora text-white placeholder:text-white/55 py-2"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-md text-[13px] font-semibold font-sora text-white"
              style={{ backgroundColor: SPANBIX_BRAND.accent }}
            >
              Search
            </button>
          </div>
        </form>
      </PageHero>

      <section className="relative pb-24 md:pb-32" style={{ paddingTop: '4rem' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 size={28} className="animate-spin" style={{ color: SPANBIX_BRAND.accent }} />
            </div>
          ) : blogs.length === 0 ? (
            <div
              className="rounded-2xl p-16 text-center"
              style={{ backgroundColor: '#ffffff', border: `1px solid ${SPANBIX_BRAND.border}` }}
            >
              <FileText size={32} className="mx-auto" style={{ color: SPANBIX_BRAND.textMuted }} />
              <p className="mt-4 font-serif text-[20px]" style={{ color: SPANBIX_BRAND.navy }}>
                No articles found
              </p>
              <p className="mt-1 text-[13px] font-sora" style={{ color: SPANBIX_BRAND.textMuted }}>
                Try a different search term.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {blogs.map((b, i) => (
                <motion.article
                  key={b._id || b.slug}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.05 }}
                  className="group rounded-2xl overflow-hidden bg-white transition-all hover:-translate-y-1"
                  style={{
                    border: `1px solid ${SPANBIX_BRAND.border}`,
                    boxShadow: '0 1px 2px rgba(16,44,86,0.04), 0 10px 28px -16px rgba(16,44,86,0.10)',
                  }}
                >
                  <Link to={`/spanbix/blog/${b.slug}`}>
                    <div
                      className="aspect-[16/9] relative overflow-hidden"
                      style={{ backgroundColor: 'rgba(39,100,228,0.08)' }}
                    >
                      {b.featuredImage ? (
                        <img
                          src={b.featuredImage}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FileText size={36} style={{ color: SPANBIX_BRAND.accent, opacity: 0.45 }} />
                        </div>
                      )}
                      {b.category && (
                        <span
                          className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.18em] font-sora"
                          style={{
                            backgroundColor: '#ffffff',
                            color: SPANBIX_BRAND.accent,
                            border: `1px solid ${SPANBIX_BRAND.border}`,
                          }}
                        >
                          {b.category}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-3 text-[11.5px] font-sora mb-2" style={{ color: SPANBIX_BRAND.textMuted }}>
                        <span>{formatDate(b.publishedAt)}</span>
                        {b.readingTime && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock size={11} /> {b.readingTime} min
                            </span>
                          </>
                        )}
                      </div>
                      <h3
                        className="font-serif text-[19px] tracking-tight leading-snug line-clamp-2 transition-colors"
                        style={{ color: SPANBIX_BRAND.navy }}
                      >
                        {b.title}
                      </h3>
                      {b.excerpt && (
                        <p
                          className="mt-2 text-[13px] font-sora leading-relaxed line-clamp-2"
                          style={{ color: SPANBIX_BRAND.textMuted }}
                        >
                          {b.excerpt}
                        </p>
                      )}
                      <span
                        className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold font-sora"
                        style={{ color: SPANBIX_BRAND.accent }}
                      >
                        Read <ArrowRight size={12} />
                      </span>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2 font-sora">
              <button
                onClick={() => goPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded-md text-[13px] font-medium disabled:opacity-40 transition-colors"
                style={{
                  backgroundColor: '#ffffff',
                  border: `1px solid ${SPANBIX_BRAND.border}`,
                  color: SPANBIX_BRAND.navy,
                }}
              >
                Previous
              </button>
              <span className="px-4 py-2 text-[13px] font-mono" style={{ color: SPANBIX_BRAND.textMuted }}>
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => goPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page >= pagination.totalPages}
                className="px-4 py-2 rounded-md text-[13px] font-medium disabled:opacity-40 transition-colors"
                style={{
                  backgroundColor: '#ffffff',
                  border: `1px solid ${SPANBIX_BRAND.border}`,
                  color: SPANBIX_BRAND.navy,
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>
    </SpanbixLayout>
  );
}
