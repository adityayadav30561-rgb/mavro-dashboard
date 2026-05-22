import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Loader2, FileText } from 'lucide-react';
import HrmsLayout from '@/components/hrms/HrmsLayout';
import AnimatedGridBackground from '@/components/hrms/AnimatedGridBackground';
import { getPublicBlogDetail } from '@/api/public';
import useSEO from '@/hooks/useSEO';
import { HRMS_SITE, blogPostingLd, breadcrumbLd } from '@/lib/hrmsSeo';
import { trackBlogView } from '@/lib/analytics';
import { attachInternalLinkClickListener } from '@/lib/internalLinkTracker';

const HRMS_SLUG = 'mavro-hrms';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
}

export default function HrmsBlogDetail() {
  const { slug } = useParams();
  const [state, setState] = useState({ loading: true, blog: null, error: null });
  const articleRef = useRef(null);

  // Attach internal-link click tracker once the article is rendered
  useEffect(() => {
    if (!state.blog || !articleRef.current) return;
    const detach = attachInternalLinkClickListener(articleRef.current, {
      sourceBlogSlug: state.blog.slug,
    });
    return detach;
  }, [state.blog]);

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, blog: null, error: null });
    getPublicBlogDetail(HRMS_SLUG, slug)
      .then((res) => {
        if (cancelled) return;
        const blog = res?.data?.data?.blog || null;
        setState({ loading: false, blog, error: null });
        if (blog) trackBlogView(slug, `/hrms/blog/${slug}`);
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({ loading: false, blog: null, error: err?.response?.status === 404 ? 'not-found' : 'error' });
      });
    return () => { cancelled = true; };
  }, [slug]);

  const blog = state.blog;
  const blogUrl = `${HRMS_SITE.url}/hrms/blog/${slug}`;
  useSEO({
    title: blog
      ? `${blog.seoTitle || blog.title} — ${HRMS_SITE.name}`
      : `Article — ${HRMS_SITE.name}`,
    description: blog?.seoDescription || blog?.excerpt || HRMS_SITE.description,
    keywords: blog?.keywords || blog?.tags || HRMS_SITE.keywords,
    canonical: blog?.canonicalUrl || blogUrl,
    ogImage: blog?.ogImage || blog?.featuredImage || HRMS_SITE.logo,
    ogType: 'article',
    jsonLd: blog
      ? [
          breadcrumbLd([
            { name: 'Home', url: `${HRMS_SITE.url}/hrms` },
            { name: 'Blog', url: `${HRMS_SITE.url}/hrms/blog` },
            { name: blog.title, url: blogUrl },
          ]),
          blogPostingLd(blog, blogUrl),
        ]
      : null,
  });

  return (
    <HrmsLayout>
      <section className="relative pt-32 md:pt-40 pb-24 md:pb-32 overflow-hidden">
        <AnimatedGridBackground />
        <div className="relative max-w-3xl mx-auto px-6 md:px-8">
          <Link
            to="/hrms/blog"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={13} /> All articles
          </Link>

          {state.loading && (
            <div className="flex items-center justify-center py-32">
              <Loader2 size={28} className="animate-spin text-violet-400" />
            </div>
          )}

          {!state.loading && state.error && (
            <div className="mt-12 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/70 p-16 text-center">
              <FileText size={32} className="mx-auto text-muted-foreground/50" />
              <h2 className="mt-4 text-xl font-bold">
                {state.error === 'not-found' ? 'Article not found' : 'Something went wrong'}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {state.error === 'not-found'
                  ? 'This article may have been moved or unpublished.'
                  : 'We could not load this article right now.'}
              </p>
              <Link
                to="/hrms/blog"
                className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold bg-foreground text-background hover:opacity-90 transition-opacity"
              >
                Back to blog
              </Link>
            </div>
          )}

          {!state.loading && state.blog && (
            <motion.article
              ref={articleRef}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mt-8"
            >
              {state.blog.category && (
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-400">{state.blog.category}</p>
              )}
              <h1 className="mt-3 text-3xl md:text-5xl font-bold tracking-[-0.025em] leading-[1.08]">
                {state.blog.title}
              </h1>

              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-muted-foreground">
                {state.blog.author?.name && <span>By {state.blog.author.name}</span>}
                <span>{formatDate(state.blog.publishedAt)}</span>
                {state.blog.readingTime && (
                  <span className="inline-flex items-center gap-1"><Clock size={11} /> {state.blog.readingTime} min read</span>
                )}
              </div>

              {state.blog.featuredImage && (
                <div className="mt-10 aspect-[16/9] rounded-2xl overflow-hidden bg-card border border-border/70">
                  <img src={state.blog.featuredImage} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              {state.blog.excerpt && (
                <p className="mt-10 text-lg md:text-xl text-foreground/85 leading-relaxed font-light">
                  {state.blog.excerpt}
                </p>
              )}

              <div
                className="mt-10 prose dark:prose-invert max-w-none prose-headings:tracking-tight prose-headings:font-bold prose-a:text-violet-400 hover:prose-a:text-violet-300 prose-img:rounded-xl prose-img:border prose-img:border-border prose-strong:text-foreground prose-blockquote:border-l-violet-500"
                dangerouslySetInnerHTML={{ __html: state.blog.content || '' }}
              />

              {state.blog.tags?.length > 0 && (
                <div className="mt-12 pt-8 border-t border-border/60 flex flex-wrap gap-2">
                  {state.blog.tags.map((t) => (
                    <span key={t} className="px-3 py-1 rounded-full bg-card/60 border border-border/70 text-[11px] text-muted-foreground">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-14 p-8 rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/5 border border-violet-500/30">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-400">Take Action</p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight">See Mavro HRMS in operation</h3>
                <p className="mt-2 text-sm text-muted-foreground">Schedule a 30-minute walkthrough mapped to your workforce structure.</p>
                <Link
                  to="/hrms#contact"
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-[0_18px_40px_-12px_hsl(263_70%_50%/0.6)] hover:shadow-[0_22px_50px_-12px_hsl(263_70%_50%/0.8)] transition-all"
                >
                  Book Live Demo
                </Link>
              </div>
            </motion.article>
          )}
        </div>
      </section>
    </HrmsLayout>
  );
}
