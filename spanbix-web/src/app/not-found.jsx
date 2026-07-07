import Link from 'next/link';
import SpanbixLayout from '@/components/spanbix/SpanbixLayout';

// Branded 404. The explicit "404" title also lets analytics identify and
// exclude not-found hits (stale backlinks / bots probing old URLs) — the
// MBR's GA4 layer filters page titles containing "404" out of every report.
export const metadata = {
  title: '404 — Page Not Found | Spanbix',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <SpanbixLayout>
      <section
        className="flex flex-col items-center justify-center text-center px-6"
        style={{ minHeight: '70vh', background: 'var(--sx-cream)' }}
      >
        <p className="sx-eyebrow" style={{ color: 'var(--sx-navy)' }}>Error 404</p>
        <h1 className="sx-display" style={{ fontSize: 'clamp(2.2rem, 6vw, 4rem)', color: 'var(--sx-navy)', marginTop: 12 }}>
          This page doesn&apos;t exist.
        </h1>
        <p className="sx-lead" style={{ maxWidth: 520, marginTop: 16, color: 'var(--sx-navy)', opacity: 0.75 }}>
          The link you followed may be old, or the page has moved. Everything
          we teach still lives here:
        </p>
        <div className="flex flex-wrap gap-3 justify-center" style={{ marginTop: 28 }}>
          <Link href="/" className="sx-btn sx-btn-dark">Go to homepage</Link>
          <Link href="/courses" className="sx-btn" style={{ border: '1.5px solid var(--sx-navy)', color: 'var(--sx-navy)' }}>
            Browse courses
          </Link>
        </div>
      </section>
    </SpanbixLayout>
  );
}
