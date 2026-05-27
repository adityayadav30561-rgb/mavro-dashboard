import Link from 'next/link';
import { Megaphone, CalendarCheck, Wallet, Award } from 'lucide-react';
import { Arrow } from '../Arrow';

const FEATURES = [
  { icon: Megaphone,     t: 'Awareness workshops, then the program.', b: 'Free on-campus session for interested students. Opt-ins flow into the structured cohort.' },
  { icon: CalendarCheck, t: 'Aligned to your academic calendar.',     b: 'Classes scheduled around your semester so the cohort doesn\'t collide with exams or placements.' },
  { icon: Wallet,        t: 'Competitively priced.',                  b: 'Per-batch pricing scales with cohort size and modules enabled. Transparent, negotiated with your T&P team.' },
  { icon: Award,         t: 'Co-branded credential.',                 b: "Certificates issued in your college's name alongside the Spanbix credential. A line on your placement report." },
];

export default function Campus({ tone = 'navy', showCtaStrip = true }) {
  const paper = tone === 'paper';

  const sectionCls = paper ? 'sx-section sx-section-paper relative' : 'sx-section sx-section-navy relative';
  const eyebrowCls = paper ? 'sx-eyebrow' : 'sx-eyebrow on-navy';
  const h2Cls = paper ? 'sx-display sx-h2 sx-reveal' : 'sx-display sx-h2 on-navy sx-reveal';
  const leadCls = paper ? 'sx-lead sx-reveal' : 'sx-lead on-navy sx-reveal';
  const h2Color = paper ? undefined : '#fff';

  const cardBg = paper ? 'var(--sx-white)' : 'rgba(255,255,255,0.04)';
  const cardBorder = paper ? '1px solid var(--sx-hairline)' : '1px solid rgba(255,255,255,0.08)';
  const iconBg = paper ? 'var(--sx-navy)' : 'var(--sx-citron)';
  const iconColor = paper ? 'var(--sx-citron)' : 'var(--sx-citron-ink)';
  const iconShadow = paper
    ? '0 8px 22px -10px rgba(16,44,86,0.45)'
    : '0 8px 22px -10px rgba(212,240,74,0.45)';
  const stepMono = paper ? 'var(--sx-ink-4)' : 'var(--sx-citron)';
  const headingColor = paper ? 'var(--sx-navy)' : '#fff';
  const bodyColor = paper ? 'var(--sx-ink-3)' : 'rgba(255,255,255,0.65)';
  const photoBg = paper ? 'var(--sx-cream-50)' : 'rgba(255,255,255,0.04)';

  return (
    <section className={sectionCls} id="campus">
      {!paper && <div className="sx-grid-bg" />}
      <div className="sx-container relative">
        <div className="sx-section-head">
          <div className="sx-stack-md">
            <span className={eyebrowCls}>For Colleges + Placement Cells</span>
            <h2 className={h2Cls} style={h2Color ? { color: h2Color } : undefined}>
              Turn your placement record into your strongest <em>admissions pitch</em>.
            </h2>
          </div>
          <p className={leadCls}>
            ERP-readiness cohorts inside your college — structured curriculum, live mentor sessions,
            recorded library, and a co-branded credential. A real career layer for your placement
            office.
          </p>
        </div>

        <div className="grid items-start gap-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <div className="relative overflow-hidden" style={{ minHeight: 520, borderRadius: 14, background: photoBg }}>
            <img
              src="/spanbix/campus%20placement.png"
              alt="Campus placement cohort"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              loading="lazy"
            />
            <div className="sx-photo-corner" style={{ zIndex: 2 }}>CAMPUS</div>
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="sx-reveal"
                  style={{
                    background: cardBg,
                    border: cardBorder,
                    borderRadius: 14,
                    padding: 22,
                    transitionDelay: `${i * 50}ms`,
                  }}
                >
                  <div
                    className="grid place-items-center"
                    style={{
                      width: 48, height: 48,
                      borderRadius: 12,
                      background: iconBg,
                      color: iconColor,
                      boxShadow: iconShadow,
                      marginBottom: 14,
                    }}
                  >
                    <Icon size={22} strokeWidth={1.9} />
                  </div>
                  <div className="sx-mono" style={{ color: stepMono, marginBottom: 6, letterSpacing: '0.12em' }}>0{i + 1}</div>
                  <h4 style={{ fontFamily: 'var(--sx-serif)', fontSize: 19, color: headingColor, margin: 0, letterSpacing: '-0.01em' }}>{f.t}</h4>
                  <p style={{ color: bodyColor, fontSize: 13.5, lineHeight: 1.55, margin: '6px 0 0' }}>{f.b}</p>
                </div>
              );
            })}
          </div>
        </div>

        {showCtaStrip && (
          <div
            className="sx-reveal flex flex-wrap items-center justify-between gap-6"
            style={{
              marginTop: 48,
              background: cardBg,
              border: cardBorder,
              borderRadius: 14,
              padding: '26px 30px',
            }}
          >
            <div>
              <span className="sx-mono" style={{ color: paper ? 'var(--sx-ink-4)' : 'var(--sx-citron)' }}>
                FOR PLACEMENT HEADS + ACADEMIC LEADERSHIP
              </span>
              <div style={{ fontFamily: 'var(--sx-serif)', fontSize: 28, color: headingColor, marginTop: 8, letterSpacing: '-0.01em' }}>
                Make "placed in ERP roles" a line in your prospectus.
              </div>
              <div style={{ color: bodyColor, fontSize: 14.5, lineHeight: 1.55, marginTop: 8, maxWidth: 560 }}>
                30-minute walkthrough with the institutional team — we'll align curriculum, cohort size,
                and the placement strategy to your academic calendar. Pricing follows the conversation.
              </div>
            </div>
            <Link href="/contact" className={paper ? 'sx-btn sx-btn-dark' : 'sx-btn sx-btn-citron'}>
              Partner With Spanbix <Arrow />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
