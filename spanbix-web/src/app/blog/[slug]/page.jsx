import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock } from 'lucide-react';
import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import FinalCta from '@/components/spanbix/redesign/sections/FinalCta';
import JsonLd from '@/components/JsonLd';
import { buildMetadata } from '@/lib/seoMeta';
import { fetchBlogDetail, fetchAllBlogSlugs } from '@/lib/blogApi';
import { SPANBIX_SITE, blogPostingLd, breadcrumbLd } from '@/lib/spanbixSeo';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
}

// Prerender one static page per published slug at build time; ISR keeps each
// fresh (revalidate: 300) and on-demand revalidation regenerates on publish.
export async function generateStaticParams() {
  try {
    const slugs = await fetchAllBlogSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  let blog = null;
  try {
    ({ blog } = await fetchBlogDetail(slug));
  } catch {
    blog = null;
  }
  if (!blog) return { title: `Article — ${SPANBIX_SITE.name}` };

  const url = `${SPANBIX_SITE.url}/blog/${slug}`;
  return buildMetadata({
    title: `${blog.seoTitle || blog.title} — ${SPANBIX_SITE.name}`,
    description: blog.seoDescription || blog.excerpt || SPANBIX_SITE.description,
    keywords: blog.keywords?.length
      ? blog.keywords
      : (blog.tags?.length ? blog.tags : SPANBIX_SITE.keywords),
    canonical: blog.canonicalUrl || url,
    ogImage: blog.ogImage || blog.featuredImage || SPANBIX_SITE.logo,
    ogType: 'article',
  });
}

export default async function BlogDetailPage({ params }) {
  const { slug } = await params;
  const { blog } = await fetchBlogDetail(slug);
  if (!blog) notFound();

  const url = `${SPANBIX_SITE.url}/blog/${slug}`;
  const ld = [
    breadcrumbLd([
      { name: 'Home', url: `${SPANBIX_SITE.url}/` },
      { name: 'Blog', url: `${SPANBIX_SITE.url}/blog` },
      { name: blog.title, url },
    ]),
    blogPostingLd(blog, url),
  ];

  return (
    <>
      <JsonLd data={ld} />
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
              href="/blog"
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
              {blog.readingTime && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={12} /> {blog.readingTime} min read
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Cover image */}
        {blog.featuredImage && (
          <div style={{ background: 'var(--sx-paper)', paddingTop: 40 }}>
            <div className="sx-container">
              <img
                src={blog.featuredImage}
                alt={blog.title}
                style={{ width: '100%', maxWidth: 1080, margin: '0 auto', borderRadius: 16, display: 'block' }}
              />
            </div>
          </div>
        )}

        {/* Article body — backend returns sanitized HTML; render verbatim. */}
        <section className="sx-section sx-section-paper" style={{ paddingTop: 'clamp(40px, 5vw, 64px)' }}>
          <div className="sx-container">
            <article
              className="mx-auto"
              style={{
                maxWidth: 760,
                fontFamily: 'var(--sx-sans)',
                fontSize: 17,
                lineHeight: 1.7,
                color: 'var(--sx-ink-2)',
              }}
              dangerouslySetInnerHTML={{ __html: blog.content || '' }}
            />
          </div>
        </section>

        <FinalCta />
      </SpanbixLayout>
    </>
  );
}
