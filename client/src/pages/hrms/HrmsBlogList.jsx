import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, FileText, Search, Loader2 } from 'lucide-react';
import HrmsLayout from '@/components/hrms/HrmsLayout';
import AnimatedGridBackground from '@/components/hrms/AnimatedGridBackground';
import { getPublicBlogs } from '@/api/public';
import useSEO from '@/hooks/useSEO';
import { HRMS_SITE, blogListLd, breadcrumbLd } from '@/lib/hrmsSeo';

const HRMS_SLUG = 'mavro-hrms';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
}

export default function HrmsBlogList() {
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
    getPublicBlogs(HRMS_SLUG, { page, limit: 9, search: query || undefined })
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
      ? `Search: ${query} — Mavro HRMS Insights`
      : `Workforce Insights & HR Intelligence — ${HRMS_SITE.name}`,
    description:
      'Operational reads on workforce, HR automation, attendance optimization, employee productivity, and HR compliance from the Mavro HRMS team.',
    keywords: ['HR blog', 'workforce insights', 'HR automation', 'HRMS insights', 'employee productivity'],
    canonical: `${HRMS_SITE.url}/hrms/blog${query ? `?q=${encodeURIComponent(query)}` : ''}`,
    ogImage: HRMS_SITE.logo,
    jsonLd: [
      breadcrumbLd([
        { name: 'Home', url: `${HRMS_SITE.url}/hrms` },
        { name: 'Blog', url: `${HRMS_SITE.url}/hrms/blog` },
      ]),
      blogs.length ? blogListLd(blogs, `${HRMS_SITE.url}/hrms/blog`) : null,
    ].filter(Boolean),
  });

  const onSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (search.trim()) next.set('q', search.trim()); else next.delete('q');
    next.delete('page');
    setSearchParams(next);
  };

  const goPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
  };

  return (
    <HrmsLayout>
      {/* Hero */}
      <section className="relative pt-32 md:pt-40 pb-16 md:pb-20 overflow-hidden">
        <AnimatedGridBackground />
        <div className="relative max-w-7xl mx-auto px-6 md:px-8">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-400"
          >
            Workforce Intelligence
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-3 text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.025em] leading-[1.05] max-w-3xl"
          >
            Operational reads on workforce, HR, and modern operations
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl"
          >
            Strategy notes, automation playbooks, and operational frameworks from the Mavro HRMS team.
          </motion.p>

          <form onSubmit={onSearch} className="mt-8 max-w-xl">
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 focus-within:border-border">
              <Search size={16} className="ml-3 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles…"
                className="flex-1 bg-transparent outline-none text-sm py-2 placeholder:text-muted-foreground/60"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-[13px] font-semibold bg-foreground text-background hover:opacity-90 transition-opacity"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* List */}
      <section className="relative pb-24 md:pb-32">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 size={28} className="animate-spin text-violet-400" />
            </div>
          ) : blogs.length === 0 ? (
            <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-border/70 p-16 text-center">
              <FileText size={32} className="mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-base font-semibold">No articles found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try a different search term.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {blogs.map((b, i) => (
                <motion.article
                  key={b._id || b.slug}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.55, delay: (i % 3) * 0.06 }}
                  className="group rounded-2xl overflow-hidden bg-card/70 backdrop-blur-xl border border-border/70 hover:border-border transition-all hover:-translate-y-1"
                >
                  <Link to={`/hrms/blog/${b.slug}`}>
                    <div className="aspect-[16/9] relative overflow-hidden bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-cyan-500/15">
                      {b.featuredImage ? (
                        <img src={b.featuredImage} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FileText size={36} className="text-violet-400/40" />
                        </div>
                      )}
                      {b.category && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-background/85 backdrop-blur-md text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400 border border-border">
                          {b.category}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
                        <span>{formatDate(b.publishedAt)}</span>
                        {b.readingTime && <><span>·</span><span className="inline-flex items-center gap-1"><Clock size={11} /> {b.readingTime} min</span></>}
                      </div>
                      <h3 className="text-base font-bold tracking-tight leading-snug group-hover:text-violet-400 transition-colors line-clamp-2">{b.title}</h3>
                      {b.excerpt && (
                        <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed line-clamp-2">{b.excerpt}</p>
                      )}
                      <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-violet-400">
                        Read <ArrowRight size={12} />
                      </span>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <button
                onClick={() => goPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded-lg bg-card/60 border border-border/70 text-sm font-medium disabled:opacity-40 hover:bg-card/80 transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-muted-foreground font-mono">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => goPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page >= pagination.totalPages}
                className="px-4 py-2 rounded-lg bg-card/60 border border-border/70 text-sm font-medium disabled:opacity-40 hover:bg-card/80 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>
    </HrmsLayout>
  );
}
