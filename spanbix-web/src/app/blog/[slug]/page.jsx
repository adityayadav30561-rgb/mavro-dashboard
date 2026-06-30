import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock } from 'lucide-react';

// LinkedIn brand glyph as inline SVG — lucide-react 1.16 in this project does
// not export a Linkedin icon, so we ship the official brand mark inline to
// keep the author byline's LinkedIn link visually obvious.
function LinkedInGlyph({ size = 14 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M19 0H5C2.24 0 0 2.24 0 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5V5c0-2.76-2.24-5-5-5zM8 19H5V8h3v11zM6.5 6.7C5.5 6.7 4.8 6 4.8 5s.7-1.7 1.7-1.7S8.2 4 8.2 5s-.7 1.7-1.7 1.7zM20 19h-3v-5.6c0-1.4-.5-2.2-1.6-2.2-1.2 0-1.9.8-1.9 2.2V19h-3V8h2.9v1.3c.4-.7 1.5-1.5 3-1.5 2 0 3.6 1.2 3.6 3.6V19z" />
    </svg>
  );
}
import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import FinalCta from '@/components/spanbix/redesign/sections/FinalCta';
import JsonLd from '@/components/JsonLd';
import { buildMetadata } from '@/lib/seoMeta';
import { fetchBlogDetail, fetchAllBlogSlugs } from '@/lib/blogApi';
import { SPANBIX_SITE, blogPostingLd, breadcrumbLd, faqPageLd } from '@/lib/spanbixSeo';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
}

// Build an anchor-linked Table of Contents AND inject a slug `id` onto every
// <h2> at render time. Deriving ids from the heading text (rather than trusting
// ids stored in the content) keeps the TOC working even when the admin Quill
// editor strips id attributes on save — which it does. Returns the rewritten
// HTML (with ids) plus the TOC entries. See BLOG_PUBLISHING.md.
function tocText(inner) {
  return inner
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&rarr;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugifyHeading(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function buildTocAndInjectIds(html) {
  if (!html) return { html: '', toc: [] };
  const toc = [];
  const used = new Set();
  const rewritten = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/g, (full, attrs, inner) => {
    const text = tocText(inner);
    if (!text) return full;
    let id = slugifyHeading(text);
    if (!id) return full;
    let unique = id;
    let n = 2;
    while (used.has(unique)) unique = `${id}-${n++}`;
    used.add(unique);
    toc.push({ id: unique, text });
    const cleanedAttrs = attrs.replace(/\s*\bid="[^"]*"/i, '');
    return `<h2${cleanedAttrs} id="${unique}">${inner}</h2>`;
  });
  return { html: rewritten, toc };
}

/**
 * Public author bio block. Renders below the article body when the populated
 * author doc has at minimum a `name`. Each optional field (avatar, jobTitle,
 * bio, linkedinUrl) renders conditionally so a partially-filled profile still
 * looks intentional. This must stay visually consistent with the JSON-LD
 * Person schema emitted in blogPostingLd — same fields, same source of truth.
 */
function AuthorByline({ author }) {
  return (
    <section className="sx-section sx-section-paper" style={{ paddingTop: 'clamp(24px, 4vw, 48px)', paddingBottom: 'clamp(40px, 5vw, 64px)' }}>
      <div className="sx-container">
        <div
          className="mx-auto"
          style={{
            maxWidth: 760,
            display: 'flex',
            gap: 20,
            alignItems: 'flex-start',
            padding: '28px',
            borderRadius: 18,
            background: 'rgba(16, 44, 86, 0.05)',
            border: '1px solid rgba(16, 44, 86, 0.10)',
          }}
        >
          {author.avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={author.avatar}
              alt={author.name}
              width={80}
              height={80}
              style={{ width: 80, height: 80, borderRadius: 999, objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(255,255,255,0.6)' }}
            />
          )}
          <div style={{ minWidth: 0 }}>
            <div className="sx-eyebrow" style={{ marginBottom: 6 }}>Written by</div>
            <div style={{ fontFamily: 'var(--sx-serif)', fontSize: 22, lineHeight: 1.2, color: 'var(--sx-ink-1)' }}>
              {author.name}
            </div>
            {author.jobTitle && (
              <div style={{ fontFamily: 'var(--sx-mono)', fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--sx-ink-3)', marginTop: 4 }}>
                {author.jobTitle}
              </div>
            )}
            {author.bio && (
              <p style={{ fontFamily: 'var(--sx-sans)', fontSize: 15, lineHeight: 1.6, color: 'var(--sx-ink-2)', marginTop: 12 }}>
                {author.bio}
              </p>
            )}
            {author.linkedinUrl && (
              <a
                href={author.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer me"
                className="inline-flex items-center gap-1.5"
                style={{ marginTop: 14, fontFamily: 'var(--sx-sans)', fontSize: 13, color: 'var(--sx-navy)', textDecoration: 'underline', textUnderlineOffset: 3 }}
              >
                <LinkedInGlyph size={14} /> Connect on LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
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
  const { html: articleHtml, toc: contentToc } = buildTocAndInjectIds(blog.content);
  // FAQ renders as accordions from the structured faq[] (same source as the
  // FAQPage schema), appended after the article. Add it to the TOC so the
  // jump-link still works even though it's no longer inside the content HTML.
  const faqEntries = Array.isArray(blog.faq)
    ? blog.faq.filter((f) => f && f.question && f.answer)
    : [];
  const toc = faqEntries.length
    ? [...contentToc, { id: 'frequently-asked-questions', text: 'Frequently Asked Questions' }]
    : contentToc;
  const ld = [
    breadcrumbLd([
      { name: 'Home', url: `${SPANBIX_SITE.url}/` },
      { name: 'Blog', url: `${SPANBIX_SITE.url}/blog` },
      { name: blog.title, url },
    ]),
    blogPostingLd(blog, url),
    faqPageLd(blog.faq),
  ].filter(Boolean);

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
            {toc.length >= 3 && (
              <nav className="sx-blog-toc mx-auto" aria-label="Table of contents">
                <div className="sx-blog-toc-title">On this page</div>
                <ol>
                  {toc.map((t) => (
                    <li key={t.id}>
                      <a href={`#${t.id}`}>{t.text}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
            <article
              className="mx-auto sx-blog-content"
              style={{
                maxWidth: 760,
                fontFamily: 'var(--sx-sans)',
                fontSize: 17,
                lineHeight: 1.7,
                color: 'var(--sx-ink-2)',
              }}
              dangerouslySetInnerHTML={{ __html: articleHtml }}
            />
          </div>
        </section>

        {/* FAQ accordions — rendered from the structured faq[] (same source as
            the FAQPage JSON-LD). Native <details> so it works without client JS;
            each question is its own collapsible dropdown. */}
        {faqEntries.length > 0 && (
          <section className="sx-section sx-section-paper" style={{ paddingTop: 0 }}>
            <div className="sx-container">
              <div className="mx-auto" style={{ maxWidth: 760 }}>
                <h2 id="frequently-asked-questions" className="sx-faq-heading">
                  Frequently Asked Questions
                </h2>
                {faqEntries.map((f, i) => (
                  <details key={i} className="sx-faq">
                    <summary>{f.question}</summary>
                    <div className="sx-faq-answer">
                      <p>{f.answer}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Author byline block — establishes the Person entity behind the post
            (avatar + jobTitle + bio + LinkedIn). Mirrors the schema.org/Person
            fields emitted in blogPostingLd so Google's E-E-A-T signal matches
            what readers see. Renders nothing when author has no name. */}
        {blog.author?.name && (
          <AuthorByline author={blog.author} />
        )}

        <FinalCta />
      </SpanbixLayout>
    </>
  );
}
