import { Link } from 'react-router-dom';
import { Megaphone, CalendarCheck, Wallet, Award } from 'lucide-react';
import { withSpanbixBase } from '@/lib/routeBase';
import { Arrow } from '../Arrow';

const FEATURES = [
  { icon: Megaphone,     t: 'Awareness workshops, then the program.', b: 'Free on-campus session for interested students. Opt-ins flow into the structured cohort.' },
  { icon: CalendarCheck, t: 'Aligned to your academic calendar.',     b: 'Classes scheduled around your semester so the cohort doesn\'t collide with exams or placements.' },
  { icon: Wallet,        t: 'Competitively priced.',                  b: 'Per-batch pricing scales with cohort size and modules enabled. Transparent, negotiated with your T&P team.' },
  { icon: Award,         t: 'Co-branded credential.',                 b: "Certificates issued in your college's name alongside the Spanbix credential. A line on your placement report." },
];

export default function Campus() {
  return (
    <section className="sx-section sx-section-navy relative" id="campus">
      <div className="sx-grid-bg" />
      <div className="sx-container relative">
        <div className="sx-section-head">
          <div className="sx-stack-md">
            <span className="sx-eyebrow on-navy">For Colleges + Placement Cells</span>
            <h2 className="sx-display sx-h2 on-navy sx-reveal" style={{ color: '#fff' }}>
              Turn your placement record into your strongest <em>admissions pitch</em>.
            </h2>
          </div>
          <p className="sx-lead on-navy sx-reveal">
            SAP-readiness cohorts inside your college — structured curriculum, attendance-linked
            progression, T&P dashboards, co-branded credential. A real career layer for your
            placement office.
          </p>
        </div>

        <div className="grid items-start gap-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <div className="relative overflow-hidden" style={{ minHeight: 520, borderRadius: 14, background: 'rgba(255,255,255,0.04)' }}>
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
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
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
                      background: 'var(--sx-citron)',
                      color: 'var(--sx-citron-ink)',
                      boxShadow: '0 8px 22px -10px rgba(212,240,74,0.45)',
                      marginBottom: 14,
                    }}
                  >
                    <Icon size={22} strokeWidth={1.9} />
                  </div>
                  <div className="sx-mono" style={{ color: 'var(--sx-citron)', marginBottom: 6, letterSpacing: '0.12em' }}>0{i + 1}</div>
                  <h4 style={{ fontFamily: 'var(--sx-serif)', fontSize: 19, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>{f.t}</h4>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13.5, lineHeight: 1.55, margin: '6px 0 0' }}>{f.b}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="sx-reveal flex flex-wrap items-center justify-between gap-6"
          style={{
            marginTop: 48,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: '26px 30px',
          }}
        >
          <div>
            <span className="sx-mono" style={{ color: 'var(--sx-citron)' }}>FOR PLACEMENT HEADS + ACADEMIC LEADERSHIP</span>
            <div style={{ fontFamily: 'var(--sx-serif)', fontSize: 28, color: '#fff', marginTop: 8, letterSpacing: '-0.01em' }}>
              Make "placed in SAP roles" a line in your prospectus.
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14.5, lineHeight: 1.55, marginTop: 8, maxWidth: 560 }}>
              30-minute walkthrough with our institutional team — we'll align curriculum, cohort size,
              and the placement strategy to your academic calendar. Pricing follows the conversation.
            </div>
          </div>
          <Link to={withSpanbixBase('/contact')} className="sx-btn sx-btn-citron">
            Partner With Spanbix <Arrow />
          </Link>
        </div>
      </div>
    </section>
  );
}
