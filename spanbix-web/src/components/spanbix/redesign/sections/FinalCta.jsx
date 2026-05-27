import Link from 'next/link';
import { Arrow } from '../Arrow';

// FinalCta — navy section, copy + CTA buttons only. Form moved to /contact.

export default function FinalCta() {
  return (
    <section className="sx-section sx-section-navy relative" id="cta">
      <div className="sx-grid-bg" />
      <div className="sx-container relative">
        <div className="text-center mx-auto" style={{ maxWidth: 760 }}>
          <span className="sx-eyebrow on-navy" style={{ justifyContent: 'center' }}>Take The Next Step</span>
          <h2
            className="sx-display sx-h2 on-navy"
            style={{ textAlign: 'center', margin: '20px auto 0', color: '#fff' }}
          >
            30 minutes with a strategist.<br />
            <em>Then you decide.</em>
          </h2>
          <p className="sx-lead on-navy mx-auto" style={{ margin: '18px auto 0', textAlign: 'center' }}>
            Share your background — degree, geography, current role, target salary. We'll map the
            right ERP track, give you an honest placement timeline, and tell you straight if Spanbix
            isn't the right fit.
          </p>
          <div className="sx-row" style={{ justifyContent: 'center', marginTop: 28, gap: 12 }}>
            <Link href="/contact" className="sx-btn sx-btn-citron">
              Book Consultation <Arrow />
            </Link>
            <Link href="/career-paths" className="sx-btn sx-btn-ghost">
              Explore Programs
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
