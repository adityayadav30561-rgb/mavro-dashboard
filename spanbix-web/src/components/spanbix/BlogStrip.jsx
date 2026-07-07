import Link from 'next/link';

// Presentational horizontal-scroll strip of blog cards. Plain component (no
// hooks) so it renders in both server components (RelatedBlogs, homepage) and
// client components (CourseDetailView). Renders nothing when `blogs` is empty,
// so callers can drop it in unconditionally. Per the Spanbix carousel invariant,
// cards carry NO sx-reveal (mount-only observer misses horizontally-scrolled
// items) — the strip is plain CSS overflow, no JS.

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

const COVER_TONES = ['rose', 'olive', 'sand', 'sky', 'cream'];

export default function BlogStrip({
  blogs,
  heading = 'From the SAP career blog',
  eyebrow = 'SAP CAREER BLOG',
  tone = 'paper', // 'paper' | 'cream'
}) {
  if (!Array.isArray(blogs) || blogs.length === 0) return null;
  return (
    <section
      className={`sx-section ${tone === 'cream' ? 'sx-section-cream' : 'sx-section-paper'}`}
    >
      <div className="sx-container">
        <div className="sx-eyebrow" style={{ marginBottom: 10 }}>{eyebrow}</div>
        <h2
          className="sx-display"
          style={{ fontSize: 'clamp(26px, 3.6vw, 40px)', lineHeight: 1.1, marginBottom: 'clamp(20px, 3vw, 32px)', color: 'var(--sx-ink-1)' }}
        >
          {heading}
        </h2>

        <div className="sx-blog-strip">
          {blogs.map((b, i) => (
            <Link key={b.slug} href={`/blog/${b.slug}`} className="sx-blog-strip-card">
              <div className={`sx-blog-strip-cover sx-blog-strip-cover-${COVER_TONES[i % COVER_TONES.length]}`}>
                {b.featuredImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.featuredImage} alt={b.title} loading="lazy" />
                )}
              </div>
              <div className="sx-blog-strip-body">
                <div className="sx-blog-strip-meta">
                  {b.category && <span>{String(b.category).toUpperCase()}</span>}
                  {b.publishedAt && <span>· {fmtDate(b.publishedAt)}</span>}
                  {b.readingTime ? <span>· {b.readingTime} min</span> : null}
                </div>
                <h3>{b.title}</h3>
                {b.excerpt && <p>{b.excerpt}</p>}
                <span className="sx-blog-strip-more">Read article →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
