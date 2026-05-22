import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, FileText } from 'lucide-react';
import EditorialSection from './EditorialSection';
import { getPublicBlogs } from '@/api/public';

const HRMS_SLUG = 'mavro-hrms';

const FALLBACK = [
  { _id: 'f1', slug: '#', title: 'Modern workforce management strategies for 2026', excerpt: 'How operational HR teams are rebuilding their workforce stack around real-time visibility.', readingTime: 5, publishedAt: new Date().toISOString() },
  { _id: 'f2', slug: '#', title: 'HR automation trends that actually move the needle', excerpt: 'A pragmatic look at automation wins in approvals, attendance, and payroll cycles.', readingTime: 6, publishedAt: new Date().toISOString() },
  { _id: 'f3', slug: '#', title: 'Attendance optimization without micromanagement', excerpt: 'Designing attendance systems that trust people and produce reliable workforce data.', readingTime: 4, publishedAt: new Date().toISOString() },
];

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
}

export default function BlogPreview() {
  const [blogs, setBlogs] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getPublicBlogs(HRMS_SLUG, { limit: 3 })
      .then((res) => {
        if (cancelled) return;
        const items = res?.data?.data?.blogs;
        setBlogs(items && items.length ? items : FALLBACK);
      })
      .catch(() => {
        if (!cancelled) setBlogs(FALLBACK);
      });
    return () => { cancelled = true; };
  }, []);

  const items = blogs || FALLBACK;
  const featured = items[0];
  const rest = items.slice(1, 3);

  return (
    <EditorialSection
      caption="Insights"
      title="Workforce Insights & HR Intelligence"
      subtitle="Operational reads, automation playbooks, and workforce strategy from the Mavro HRMS team."
    >
      <div className="grid lg:grid-cols-12 gap-5">
        {/* Featured */}
        {featured && (
          <motion.article
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 group relative rounded-2xl overflow-hidden bg-card/70 backdrop-blur-xl border border-border/70 hover:border-border transition-all hover:-translate-y-1"
          >
            <div className="aspect-[16/9] relative overflow-hidden bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-cyan-500/15">
              {featured.featuredImage ? (
                <img src={featured.featuredImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText size={48} className="text-violet-400/40" />
                </div>
              )}
              <div className="absolute top-4 left-4">
                <span className="px-2.5 py-1 rounded-full bg-background/85 backdrop-blur-md text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400 border border-border">
                  Featured
                </span>
              </div>
            </div>
            <div className="p-7">
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
                <span>{formatDate(featured.publishedAt)}</span>
                {featured.readingTime && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1"><Clock size={11} /> {featured.readingTime} min read</span>
                  </>
                )}
              </div>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight leading-snug group-hover:text-violet-400 transition-colors">
                {featured.title}
              </h3>
              {featured.excerpt && (
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-2">{featured.excerpt}</p>
              )}
              <Link
                to={featured.slug && featured.slug !== '#' ? `/hrms/blog/${featured.slug}` : '/hrms/blog'}
                className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-violet-400 hover:text-violet-300 transition-colors"
              >
                Read article <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.article>
        )}

        {/* Rest */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {rest.map((b, i) => (
            <motion.article
              key={b._id}
              initial={{ opacity: 0, x: 14 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 + i * 0.08 }}
              className="group flex-1 p-6 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 hover:border-border transition-all hover:-translate-y-1"
            >
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2.5">
                <span>{formatDate(b.publishedAt)}</span>
                {b.readingTime && <><span>·</span><span>{b.readingTime} min read</span></>}
              </div>
              <h3 className="text-base font-bold tracking-tight leading-snug group-hover:text-violet-400 transition-colors">{b.title}</h3>
              {b.excerpt && (
                <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed line-clamp-2">{b.excerpt}</p>
              )}
              <Link
                to={b.slug && b.slug !== '#' ? `/hrms/blog/${b.slug}` : '/hrms/blog'}
                className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-violet-400"
              >
                Read <ArrowRight size={12} />
              </Link>
            </motion.article>
          ))}
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          to="/hrms/blog"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-card/70 backdrop-blur-xl border border-border hover:bg-card transition-all"
        >
          Explore All Articles <ArrowRight size={14} />
        </Link>
      </div>
    </EditorialSection>
  );
}
