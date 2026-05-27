// Certification — left: certificate mockup; right: numbered talking points.

import { BadgeCheck, QrCode, Target } from 'lucide-react';

const POINTS = [
  { icon: BadgeCheck, t: 'A certificate that means you finished.',     b: 'Issued only after curriculum, assessments, capstone, and mentor sign-off — never on attendance alone.' },
  { icon: QrCode,     t: 'QR-verifiable and mentor-signed.',           b: 'Recruiters can confirm authenticity in one scan. The signing mentor is a working consultant, not a retired trainer.' },
  { icon: Target,     t: 'Built around what hiring panels ask.',       b: 'Mock interviews + case scenarios tuned to questions Tier-1 SIs, GCCs, and manufacturing majors actually use.' },
];

export default function Certification() {
  return (
    <section className="sx-section sx-section-cream" id="certification">
      <div className="sx-container">
        <div className="sx-section-head">
          <div className="sx-stack-md">
            <span className="sx-eyebrow">Certification That Earns Its Place</span>
            <h2 className="sx-display sx-h2 sx-reveal">
              A credential a <em>recruiter can verify</em><br />
              in 30 seconds.
            </h2>
          </div>
          <p className="sx-lead sx-reveal">
            QR-verifiable, mentor-signed, and only issued after curriculum + assessments + capstone +
            mentor sign-off. Never on attendance alone.
          </p>
        </div>

        <div className="grid items-start gap-12" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <div className="relative">
            <div
              style={{
                background: 'linear-gradient(135deg, var(--sx-navy) 0%, var(--sx-navy-900) 100%)',
                borderRadius: 14,
                padding: 32,
                color: '#fff',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 30px 80px rgba(16, 44, 86, 0.3)',
                border: '1px solid rgba(255,255,255,0.08)',
                isolation: 'isolate',
              }}
            >
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                  zIndex: -1,
                }}
              />
              <div className="flex justify-between items-center">
                <div className="sx-mono" style={{ color: 'rgba(255,255,255,0.6)' }}>SPANBIX CREDENTIAL · ISSUED 2026</div>
                <div
                  style={{
                    background: 'var(--sx-citron)',
                    color: 'var(--sx-citron-ink)',
                    fontFamily: 'var(--sx-mono)',
                    fontSize: 10,
                    letterSpacing: '0.1em',
                    padding: '5px 9px',
                    borderRadius: 4,
                    fontWeight: 700,
                  }}
                >
                  VERIFIED
                </div>
              </div>
              <div style={{ fontFamily: 'var(--sx-serif)', fontSize: 16, fontStyle: 'italic', color: 'rgba(255,255,255,0.75)', marginTop: 22 }}>
                This is to certify that
              </div>
              <div style={{ fontFamily: 'var(--sx-serif)', fontSize: 'clamp(24px, 5vw, 34px)', color: '#fff', marginTop: 4, letterSpacing: '-0.01em' }}>
                Priya Sharma
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14.5, marginTop: 4 }}>
                has completed the SAP FICO Consultant Track
              </div>

              <div
                className="grid"
                style={{
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 14,
                  marginTop: 24,
                  paddingTop: 22,
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  fontSize: 13,
                }}
              >
                <div>
                  <div className="sx-mono" style={{ color: 'rgba(255,255,255,0.45)' }}>COHORT</div>
                  <div style={{ color: '#fff', marginTop: 4 }}>FICO · 18 · 2026</div>
                </div>
                <div>
                  <div className="sx-mono" style={{ color: 'rgba(255,255,255,0.45)' }}>READINESS</div>
                  <div style={{ color: '#fff', marginTop: 4 }}>87 / 100</div>
                </div>
                <div>
                  <div className="sx-mono" style={{ color: 'rgba(255,255,255,0.45)' }}>MENTOR</div>
                  <div style={{ color: '#fff', marginTop: 4 }}>Aman Patil</div>
                </div>
              </div>

            </div>
          </div>

          <div className="grid gap-5">
            {POINTS.map((p, i) => {
              const Icon = p.icon;
              return (
                <div
                  key={i}
                  className="sx-reveal grid"
                  style={{
                    gridTemplateColumns: '56px 1fr',
                    gap: 20,
                    background: 'var(--sx-white)',
                    border: '1px solid var(--sx-hairline)',
                    borderRadius: 14,
                    padding: 22,
                    transitionDelay: `${i * 60}ms`,
                  }}
                >
                  <div
                    className="grid place-items-center"
                    style={{
                      width: 52, height: 52,
                      borderRadius: 13,
                      background: 'linear-gradient(135deg, var(--sx-navy) 0%, var(--sx-navy-700) 100%)',
                      color: 'var(--sx-citron)',
                      boxShadow: '0 8px 22px -10px rgba(16,44,86,0.45), 0 0 0 1px rgba(255,255,255,0.06) inset',
                    }}
                  >
                    <Icon size={24} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="sx-mono" style={{ color: 'var(--sx-ink-4)', letterSpacing: '0.12em', marginBottom: 4 }}>0{i + 1}</div>
                    <h4 style={{ fontFamily: 'var(--sx-serif)', fontSize: 22, color: 'var(--sx-navy)', margin: 0, letterSpacing: '-0.01em' }}>{p.t}</h4>
                    <p style={{ color: 'var(--sx-ink-3)', fontSize: 14.5, lineHeight: 1.6, margin: '8px 0 0' }}>{p.b}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
