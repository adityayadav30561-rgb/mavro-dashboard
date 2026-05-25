import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Loader2, ArrowRight } from 'lucide-react';
import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import FinalCta from '@/components/spanbix/redesign/sections/FinalCta';
import useScrollReveal from '@/components/spanbix/redesign/useScrollReveal';
import { getPublicBlogDetail } from '@/api/public';
import useSEO from '@/hooks/useSEO';
import { SPANBIX_SITE, blogPostingLd, breadcrumbLd } from '@/lib/spanbixSeo';
import { withSpanbixBase } from '@/lib/routeBase';
import { trackBlogView } from '@/lib/analytics';
import { attachInternalLinkClickListener } from '@/lib/internalLinkTracker';

// Blog detail — editorial article layout.
//   Navy header band with breadcrumb + serif title + meta.
//   Cream prose section using the @tailwindcss/typography `prose` baseline,
//   re-toned in spanbix-redesign.css equivalents via inline overrides.

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
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
    return () => { cancelled = true; };
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

  useScrollReveal([slug, state.loading]);

  if (state.loading) {
    return (
      <SpanbixLayout>
        <div className="min-h-[60vh] grid place-items-center">
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--sx-navy)' }} />
        </div>
      </SpanbixLayout>
    );
  }
  if (state.error || !blog) {
    return (
      <SpanbixLayout>
        <section
          className="relative"
          style={{ background: 'var(--sx-navy)', color: '#fff', padding: '160px 0 96px' }}
        >
          <div className="sx-grid-bg" />
          <div className="sx-container relative text-center">
            <span className="sx-eyebrow on-navy" style={{ justifyContent: 'center' }}>404 · Article</span>
            <h1 className="sx-display sx-h2 on-navy" style={{ color: '#fff', marginTop: 18 }}>
              That article isn't here.
            </h1>
            <p className="sx-lead on-navy mx-auto" style={{ marginTop: 16 }}>
              The page you're looking for has been moved, retired, or never existed. Browse the
              archive to find what you were after.
            </p>
            <Link to={withSpanbixBase('/blog')} className="sx-btn sx-btn-citron mt-7 inline-flex">
              Back to all articles <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </SpanbixLayout>
    );
  }

  return (
    <SpanbixLayout>
      {/* Article header band */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'var(--sx-navy)',
          color: '#fff',
          paddingTop: 'clamp(120px, 14vw, 180px)',
          paddingBottom: 'clamp(48px, 6vw, 80px)',
        }}
      >
        <div className="sx-grid-bg" />
        <div className="sx-container relative" style={{ zIndex: 2, maxWidth: 900 }}>
          <Link
            to={withSpanbixBase('/blog')}
            className="inline-flex items-center gap-1.5"
            style={{ color: 'rgba(255,255,255,0.78)', fontSize: 13, fontFamily: 'var(--sx-sans)' }}
          >
            <ArrowLeft size={13} /> All articles
          </Link>

          {blog.category && (
            <span className="sx-eyebrow on-navy" style={{ marginTop: 22, display: 'inline-flex' }}>
              {String(blog.category).toUpperCase()}
            </span>
          )}
          <h1
            className="sx-display on-navy"
            style={{
              color: '#fff', marginTop: 18,
              fontSize: 'clamp(36px, 5vw, 60px)', lineHeight: 1.05, letterSpacing: '-0.02em',
            }}
          >
            {blog.title}
          </h1>
          {blog.excerpt && (
            <p className="sx-lead on-navy" style={{ marginTop: 16 }}>{blog.excerpt}</p>
          )}

          <div
            className="flex flex-wrap items-center gap-4 mt-7"
            style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontFamily: 'var(--sx-sans)' }}
          >
            {blog.author?.name && <span>{blog.author.name}</span>}
            {blog.publishedAt && <span>· {formatDate(blog.publishedAt)}</span>}
            {blog.readingTimeMinutes && (
              <span className="inline-flex items-center gap-1.5">
                <Clock size={12} /> {blog.readingTimeMinutes} min read
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Cover image */}
      {(blog.featuredImage || blog.coverImage) && (
        <div style={{ background: 'var(--sx-paper)', paddingTop: 40 }}>
          <div className="sx-container">
            <img
              src={blog.featuredImage || blog.coverImage}
              alt={blog.title}
              style={{ width: '100%', maxWidth: 1080, margin: '0 auto', borderRadius: 16, display: 'block' }}
            />
          </div>
        </div>
      )}

      {/* Article body — prose with editorial overrides */}
      <section className="sx-section sx-section-paper" style={{ paddingTop: 'clamp(40px, 5vw, 64px)' }}>
        <div className="sx-container">
          <article
            ref={articleRef}
            className="mx-auto"
            style={{
              maxWidth: 760,
              fontFamily: 'var(--sx-sans)',
              fontSize: 17,
              lineHeight: 1.7,
              color: 'var(--sx-ink-2)',
            }}
            // Headings + paragraphs + lists styled via the prose-like CSS in
            // dangerouslySetInnerHTML output — server returns sanitized HTML.
            dangerouslySetInnerHTML={{ __html: blog.bodyHtml || blog.content || '' }}
          />
        </div>
      </section>

      <FinalCta />
    </SpanbixLayout>
  );
}
