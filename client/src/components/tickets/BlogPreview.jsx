import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, FileText } from 'lucide-react';
import EditorialSection from '@/components/hrms/EditorialSection';
import { getPublicBlogs } from '@/api/public';
import { TICKETS_SITE } from '@/lib/ticketsSeo';

const FALLBACK = [
  { _id: 'f1', slug: '#', title: 'How SLA-driven operations actually compound',            excerpt: 'Why SLA accountability matters more than ticket volume — and how to measure it.',     readingTime: 6, publishedAt: new Date().toISOString() },
  { _id: 'f2', slug: '#', title: 'Designing escalation chains that protect the operator',   excerpt: 'Patterns for multi-tier escalation that don\'t burn out the on-call rotation.',         readingTime: 5, publishedAt: new Date().toISOString() },
  { _id: 'f3', slug: '#', title: 'Incident response without the chaos',                     excerpt: 'Operational frameworks for high-velocity service desks managing real workloads.',     readingTime: 4, publishedAt: new Date().toISOString() },
];

function formatDate(iso) {
  try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return ''; }
}

export default function BlogPreview() {
  const [blogs, setBlogs] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getPublicBlogs(TICKETS_SITE.slug, { limit: 3 })
      .then((res) => {
        if (cancelled) return;
        const items = res?.data?.data?.blogs;
        setBlogs(items && items.length ? items : FALLBACK);
      })
      .catch(() => !cancelled && setBlogs(FALLBACK));
    return () => { cancelled = true; };
  }, []);

  const items = blogs || FALLBACK;
  const featured = items[0];
  const rest = items.slice(1, 3);

  return (
    <EditorialSection
      caption="Insights"
      title="Operations, Support & Incident Intelligence"
      subtitle="Operational frameworks, automation playbooks, and incident strategy from the Mavro Ticket Management team."
    >
      <div className="grid lg:grid-cols-12 gap-5">
        {featured && (
          <motion.article
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 group relative rounded-2xl overflow-hidden bg-card/70 backdrop-blur-xl border border-border/70 hover:border-border transition-all hover:-translate-y-1"
          >
            <div className="aspect-[16/9] relative overflow-hidden bg-gradient-to-br from-cyan-500/20 via-teal-500/10 to-emerald-500/15">
              {featured.featuredImage ? (
                <img src={featured.featuredImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText size={48} className="text-cyan-400/40" />
                </div>
              )}
              <div className="absolute top-4 left-4">
                <span className="px-2.5 py-1 rounded-full bg-background/85 backdrop-blur-md text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400 border border-border">Featured</span>
              </div>
            </div>
            <div className="p-7">
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
                <span>{formatDate(featured.publishedAt)}</span>
                {featured.readingTime && (<><span>·</span><span className="inline-flex items-center gap-1"><Clock size={11} /> {featured.readingTime} min read</span></>)}
              </div>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight leading-snug group-hover:text-cyan-400 transition-colors">
                {featured.title}
              </h3>
              {featured.excerpt && (
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-2">{featured.excerpt}</p>
              )}
              <Link
                to={featured.slug && featured.slug !== '#' ? `/tickets/blog/${featured.slug}` : '/tickets/blog'}
                className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Read article <ArrowRight size={13} />
              </Link>
            </div>
          </motion.article>
        )}

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
              <h3 className="text-base font-bold tracking-tight leading-snug group-hover:text-cyan-400 transition-colors">{b.title}</h3>
              {b.excerpt && (<p className="mt-2 text-[13px] text-muted-foreground leading-relaxed line-clamp-2">{b.excerpt}</p>)}
              <Link
                to={b.slug && b.slug !== '#' ? `/tickets/blog/${b.slug}` : '/tickets/blog'}
                className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-cyan-400"
              >
                Read <ArrowRight size={12} />
              </Link>
            </motion.article>
          ))}
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          to="/tickets/blog"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-card/70 backdrop-blur-xl border border-border hover:bg-card transition-all"
        >
          Explore All Articles <ArrowRight size={14} />
        </Link>
      </div>
    </EditorialSection>
  );
}
