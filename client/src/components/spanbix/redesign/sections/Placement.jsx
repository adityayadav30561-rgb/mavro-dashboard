// Placement — 3-step support on deep navy.

const STEPS = [
  {
    n: '01', t: 'Profile Building',
    b: 'Resume, LinkedIn, and portfolio reviewed by working consultants. Capstone artifacts recruiters can verify.',
    bullets: ['ATS-friendly resume', 'LinkedIn + portfolio', 'Verifiable capstone'],
    image: '/spanbix/profile-review.png',
  },
  {
    n: '02', t: 'Mentor & Alumni Referrals',
    b: 'Referrals from active SAP consultants + alumni network. Mock interviews tuned to SI hiring panels.',
    bullets: ['Consultant referrals', 'Alumni network', 'SI mock interviews'],
    image: '/spanbix/REFERRAL.png',
  },
  {
    n: '03', t: 'Hiring Partner Tie-Ups',
    b: 'Curated openings across IT, GCC, and manufacturing. Direct connects with hiring managers + offer review.',
    bullets: ['Curated real roles', 'Hiring-manager connects', 'Offer review'],
    image: '/spanbix/INTERVIEW.png',
  },
];

const PARTNERS = ['Tier-1 IT Services', 'GCC / Captive Centers', 'Global SI Partners', 'Manufacturing Majors', 'Banking & Financial', 'Pharma & Healthcare', 'FMCG & Retail', 'Mid-market ERP'];

export default function Placement() {
  return (
    <section className="sx-section sx-section-deep relative" id="placement">
      <div className="sx-grid-bg" />
      <div className="sx-container relative">
        <div className="sx-section-head">
          <div className="sx-stack-md">
            <span className="sx-eyebrow on-navy">Placement Support</span>
            <h2 className="sx-display sx-h2 on-navy sx-reveal" style={{ color: '#fff' }}>
              We don't hand you a certificate and{' '}
              <em style={{ color: 'var(--sx-citron)', fontStyle: 'normal', fontFamily: 'var(--sx-serif)' }}>disappear</em>.
              Three steps get you placed.
            </h2>
          </div>
          <p className="sx-lead on-navy sx-reveal">
            Placement layer turns on from week one — profile building, mentor referrals, and
            hiring-partner connects. Stays on until you sign your offer letter.
          </p>
        </div>

        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {STEPS.map((s, i) => (
            <article
              key={s.n}
              className="sx-reveal overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14,
                transitionDelay: `${i * 80}ms`,
              }}
            >
              <div className="relative overflow-hidden" style={{ aspectRatio: '4/3', background: 'rgba(255,255,255,0.04)' }}>
                <img
                  src={s.image}
                  alt={s.t}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  loading="lazy"
                />
                <div
                  className="absolute"
                  style={{
                    top: 14, left: 18,
                    fontFamily: 'var(--sx-serif)',
                    fontSize: 'clamp(40px, 8vw, 64px)',
                    color: 'rgba(255,255,255,0.95)',
                    textShadow: '0 4px 24px rgba(0,0,0,0.5)',
                    lineHeight: 1,
                    fontStyle: 'italic',
                    letterSpacing: '-0.04em',
                  }}
                >
                  {s.n}
                </div>
              </div>
              <div style={{ padding: 22 }}>
                <span className="sx-mono" style={{ color: 'var(--sx-citron)' }}>STEP {s.n}</span>
                <h3 style={{ fontFamily: 'var(--sx-serif)', fontSize: 26, color: '#fff', margin: '8px 0 10px', letterSpacing: '-0.01em' }}>{s.t}</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 16px' }}>{s.b}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                  {s.bullets.map((b, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'rgba(255,255,255,0.85)' }}>
                      <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--sx-citron)' }} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center" style={{ marginTop: 48 }}>
          <div className="sx-mono" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>HIRING PARTNERS ACROSS</div>
          <div className="sx-row" style={{ justifyContent: 'center', gap: 8 }}>
            {PARTNERS.map((p) => <span key={p} className="sx-chip on-navy">{p}</span>)}
          </div>
        </div>
      </div>
    </section>
  );
}
