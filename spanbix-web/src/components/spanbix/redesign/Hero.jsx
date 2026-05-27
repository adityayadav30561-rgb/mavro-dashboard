'use client';

import Link from 'next/link';
import { trackCtaClick } from '@/lib/analytics';
import { Arrow, PlayIcon } from './Arrow';
import CohortCard from './CohortCard';

// ════════════════════════════════════════════════════════════════════════════
// Hero — fullbleed editorial layout w/ background video
// ════════════════════════════════════════════════════════════════════════════
// Background: looping muted .mp4 from /spanbix/herosection-video.mp4.
// Gradient stack tints the video so headline + paragraph + CTAs stay readable
// across whatever frame is on screen. Cohort card backdrop bumped a touch
// darker to keep it legible when the video punches bright at the right edge.
// ════════════════════════════════════════════════════════════════════════════

export default function Hero() {
  return (
    <header className="sx-hero">
      {/* Background video — muted + autoplay + loop + playsInline so iOS Safari
          honors autoplay. preload="auto" lets the browser start fetching as
          soon as the document parses. The navy hero bg fills the frame while
          the video buffers (no poster jank). */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
        style={{ zIndex: 0 }}
      >
        <source src="/spanbix/herosection-video.mp4" type="video/mp4" />
      </video>

      {/* Gradient stack:
          1. Left-weighted darkness for the headline column (legibility).
          2. Top-to-bottom navy tint so brand stays on tone across bright frames.
          3. Soft fade-to-navy at the bottom edge for clean handoff to the next section. */}
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          zIndex: 1,
          background: [
            'linear-gradient(90deg, rgba(5,13,31,0.86) 0%, rgba(16,44,86,0.72) 40%, rgba(16,44,86,0.32) 100%)',
            'linear-gradient(180deg, rgba(16,44,86,0.42) 0%, rgba(16,44,86,0.55) 60%, rgba(5,13,31,0.9) 100%)',
          ].join(', '),
        }}
      />
      <div className="sx-grid-bg" style={{ zIndex: 2 }} />

      <div className="sx-container sx-hero-content" style={{ position: 'relative', zIndex: 3 }}>
        <div className="min-w-0">
          {/* Chip — slightly more opaque so it pops over the video */}
          <div
            className="sx-hero-chip"
            style={{ background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.22)' }}
          >
            <span className="sx-hero-chip-dot" />
            <span>SAP CAREERS · COMMERCE + ENGINEERING GRADUATES</span>
          </div>

          <h1
            className="sx-display sx-h1 on-navy"
            style={{
              color: '#fff',
              textShadow: '0 2px 24px rgba(5,13,31,0.45)',
            }}
          >
            There are 50,000+ ERP jobs<br />
            waiting.
          </h1>

          <p
            className="sx-lead on-navy"
            style={{
              marginTop: 24,
              color: 'rgba(255,255,255,0.86)',
              textShadow: '0 1px 12px rgba(5,13,31,0.35)',
            }}
          >
            Spanbix trains BBA, BCom, MBA, and engineering graduates for the SAP and ERP roles
            that actually pay — through mentorship, live college cohorts, hands-on practice, and
            direct placement support.
          </p>

          <div className="sx-row" style={{ marginTop: 28, gap: 14 }}>
            <Link
              href="/career-paths"
              onClick={() => trackCtaClick('Explore Career Paths', { location: 'hero' })}
              className="sx-btn sx-btn-citron"
              style={{ boxShadow: '0 10px 30px -10px rgba(212,240,74,0.45)' }}
            >
              Explore Career Paths <Arrow />
            </Link>
            <Link
              href="/contact"
              onClick={() => trackCtaClick('Book Consultation', { location: 'hero' })}
              className="sx-btn sx-btn-ghost"
              style={{
                background: 'rgba(255,255,255,0.08)',
                borderColor: 'rgba(255,255,255,0.32)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              Book Consultation
            </Link>
          </div>

          <div className="sx-hero-meta">
            <div className="min-w-0">
              <div className="sx-hero-meta-num" style={{ textShadow: '0 2px 12px rgba(5,13,31,0.4)' }}>50,000+</div>
              <div className="sx-hero-meta-lbl">ERP roles unfilled / year</div>
            </div>
            <div className="sx-hero-meta-divider" />
            <div className="min-w-0">
              <div className="sx-hero-meta-num" style={{ textShadow: '0 2px 12px rgba(5,13,31,0.4)' }}>₹4.7L+</div>
              <div className="sx-hero-meta-lbl">Starting CTC, certified</div>
            </div>
            <div className="sx-hero-meta-divider" />
            <div className="min-w-0">
              <div className="sx-hero-meta-num" style={{ textShadow: '0 2px 12px rgba(5,13,31,0.4)' }}>&lt;2%</div>
              <div className="sx-hero-meta-lbl">Of grads know these exist</div>
            </div>
          </div>
        </div>

        {/* Cohort card — darker backdrop + stronger shadow so it reads cleanly
            on the right side of the gradient where the video shows through more. */}
        <div className="min-w-0" style={{ position: 'relative' }}>
          <div
            style={{
              borderRadius: 18,
              background: 'rgba(10, 20, 40, 0.55)',
              backdropFilter: 'blur(22px) saturate(140%)',
              WebkitBackdropFilter: 'blur(22px) saturate(140%)',
              boxShadow: '0 40px 100px -20px rgba(0,0,0,0.55)',
            }}
          >
            <CohortCard />
          </div>
        </div>
      </div>
    </header>
  );
}
