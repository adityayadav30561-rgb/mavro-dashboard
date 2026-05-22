import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Loader2, FileText, ArrowRight } from 'lucide-react';
import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import { getPublicBlogDetail } from '@/api/public';
import useSEO from '@/hooks/useSEO';
import { SPANBIX_SITE, SPANBIX_BRAND, blogPostingLd, breadcrumbLd } from '@/lib/spanbixSeo';
import { withSpanbixBase } from '@/lib/routeBase';
import { trackBlogView } from '@/lib/analytics';
import { attachInternalLinkClickListener } from '@/lib/internalLinkTracker';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function SpanbixBlogDetail() {
  const { slug } = useParams();
  const [state, setState] = useState({ loading: true, blog: null, error: null });
  const articleRef = useRef(null);

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
    getPublicBlogDetail(SPANBIX_SITE.slug, slug)
      .then((res) => {
        if (cancelled) return;
        const blog = res?.data?.data?.blog || null;
        setState({ loading: false, blog, error: null });
        if (blog) trackBlogView(slug, withSpanbixBase(`/blog/${slug}`));
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          loading: false,
          blog: null,
          error: err?.response?.status === 404 ? 'not-found' : 'error',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const blog = state.blog;
  const blogUrl = `${SPANBIX_SITE.url}/blog/${slug}`;
  useSEO({
    title: blog ? `${blog.seoTitle || blog.title} — ${SPANBIX_SITE.name}` : `Article — ${SPANBIX_SITE.name}`,
    description: blog?.seoDescription || blog?.excerpt || SPANBIX_SITE.description,
    keywords: blog?.keywords || blog?.tags || SPANBIX_SITE.keywords,
    canonical: blog?.canonicalUrl || blogUrl,
    ogImage: blog?.ogImage || blog?.featuredImage || SPANBIX_SITE.logo,
    ogType: 'article',
    jsonLd: blog
      ? [
          breadcrumbLd([
            { name: 'Home', url: `${SPANBIX_SITE.url}/` },
            { name: 'Blog', url: `${SPANBIX_SITE.url}/blog` },
            { name: blog.title, url: blogUrl },
          ]),
          blogPostingLd(blog, blogUrl),
        ]
      : null,
  });

  return (
    <SpanbixLayout>
      <section className="relative pt-20 md:pt-28 pb-24 md:pb-32 overflow-hidden">
        <div className="relative max-w-3xl mx-auto px-6 md:px-8">
          <Link
            to={withSpanbixBase('/blog')}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold font-sora transition-colors"
            style={{ color: SPANBIX_BRAND.textMuted }}
          >
            <ArrowLeft size={13} /> All articles
          </Link>

          {state.loading && (
            <div className="flex items-center justify-center py-32">
              <Loader2 size={28} className="animate-spin" style={{ color: SPANBIX_BRAND.accent }} />
            </div>
          )}

          {!state.loading && state.error && (
            <div
              className="mt-12 rounded-2xl p-16 text-center"
              style={{ backgroundColor: '#ffffff', border: `1px solid ${SPANBIX_BRAND.border}` }}
            >
              <FileText size={32} className="mx-auto" style={{ color: SPANBIX_BRAND.textMuted }} />
              <h2 className="mt-4 font-serif text-[22px] tracking-tight" style={{ color: SPANBIX_BRAND.navy }}>
                {state.error === 'not-found' ? 'Article not found' : 'Something went wrong'}
              </h2>
              <p className="mt-2 text-[13.5px] font-sora" style={{ color: SPANBIX_BRAND.textMuted }}>
                {state.error === 'not-found'
                  ? 'This article may have been moved or unpublished.'
                  : 'We could not load this article right now.'}
              </p>
              <Link
                to={withSpanbixBase('/blog')}
                className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-semibold font-sora text-white"
                style={{ backgroundColor: SPANBIX_BRAND.navy }}
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
              transition={{ duration: 0.55 }}
              className="mt-8"
            >
              {state.blog.category && (
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.26em] font-sora"
                  style={{ color: SPANBIX_BRAND.accent }}
                >
                  {state.blog.category}
                </p>
              )}
              <h1
                className="mt-3 font-serif text-[2rem] md:text-[2.8rem] tracking-[-0.012em] leading-[1.1]"
                style={{ color: SPANBIX_BRAND.navy }}
              >
                {state.blog.title}
              </h1>

              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] font-sora" style={{ color: SPANBIX_BRAND.textMuted }}>
                {state.blog.author?.name && <span>By {state.blog.author.name}</span>}
                <span>{formatDate(state.blog.publishedAt)}</span>
                {state.blog.readingTime && (
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} /> {state.blog.readingTime} min read
                  </span>
                )}
              </div>

              {state.blog.featuredImage && (
                <div
                  className="mt-10 aspect-[16/9] rounded-2xl overflow-hidden"
                  style={{ border: `1px solid ${SPANBIX_BRAND.border}` }}
                >
                  <img src={state.blog.featuredImage} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              {state.blog.excerpt && (
                <p
                  className="mt-10 text-[17.5px] leading-relaxed font-sora"
                  style={{ color: SPANBIX_BRAND.textDark }}
                >
                  {state.blog.excerpt}
                </p>
              )}

              <div
                className="mt-10 prose max-w-none prose-headings:font-serif prose-headings:tracking-tight prose-img:rounded-xl"
                style={{ color: SPANBIX_BRAND.textDark }}
                dangerouslySetInnerHTML={{ __html: state.blog.content || '' }}
              />

              {state.blog.tags?.length > 0 && (
                <div
                  className="mt-12 pt-8 flex flex-wrap gap-2"
                  style={{ borderTop: `1px solid ${SPANBIX_BRAND.border}` }}
                >
                  {state.blog.tags.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-full text-[11px] font-sora"
                      style={{
                        backgroundColor: '#ffffff',
                        border: `1px solid ${SPANBIX_BRAND.border}`,
                        color: SPANBIX_BRAND.textMuted,
                      }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              <div
                className="mt-14 p-8 rounded-2xl"
                style={{
                  backgroundColor: SPANBIX_BRAND.navy,
                  color: '#fff',
                  backgroundImage:
                    'radial-gradient(circle at 80% 20%, rgba(39,100,228,0.25), transparent 55%)',
                }}
              >
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.24em] font-sora"
                  style={{ color: '#9bb6ea' }}
                >
                  Take The Next Step
                </p>
                <h3 className="mt-2 font-serif text-[24px] tracking-tight">
                  Map your next decade with a Spanbix strategist.
                </h3>
                <p className="mt-2 text-[14px] font-sora text-white/75">
                  30-minute career consultation. No sales pressure.
                </p>
                <Link
                  to={withSpanbixBase('/contact')}
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-[13px] font-semibold font-sora text-white transition-all hover:brightness-110 shadow-[0_18px_40px_-12px_rgba(39,100,228,0.6)]"
                  style={{ backgroundColor: SPANBIX_BRAND.accent }}
                >
                  Book Career Consultation
                  <ArrowRight size={13} />
                </Link>
              </div>
            </motion.article>
          )}
        </div>
      </section>
    </SpanbixLayout>
  );
}
