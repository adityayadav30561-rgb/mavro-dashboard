import { useRef } from 'react';

// Mentors — horizontal-scrolling faculty carousel on navy background.

const MENTORS = [
  {
    name: 'LalitMohan Parihar',
    role: 'Senior SAP Consultant',
    exp: '15+',
    tag: 'SAP MM · SD',
    image: '/spanbix/lalit.png',
    currently: 'Highly experienced in SAP MM and SD. Multiple MNC implementations, supervised large cross-functional rollouts.',
  },
  {
    name: 'Abhishek Singh',
    role: 'Senior SAP Consultant',
    exp: '15+',
    tag: 'SAP SD · ABAP',
    image: '/spanbix/abhishek.png',
    currently: 'Highly experienced in SAP SD and ABAP. Worked across multiple MNCs on full-cycle implementations.',
  },
  {
    name: 'Aman Verma',
    role: 'SAP Consultant',
    exp: '5+',
    tag: 'SAP MM',
    image: '/spanbix/aman%20verma.png',
    currently: 'Strong delivery experience in SAP MM. Multiple implementation projects across MNC clients.',
  },
  {
    name: 'Mayank Rastogi',
    role: 'SAP Consultant',
    exp: '5+',
    tag: 'SAP ABAP',
    image: '/spanbix/mayank%20rastogi.png',
    currently: 'Hands-on SAP ABAP developer. Multiple implementation projects with global delivery teams.',
  },
];

export default function Mentors() {
  const trackRef = useRef(null);
  const scrollBy = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 400, behavior: 'smooth' });
  };

  return (
    <section className="sx-section sx-section-navy relative" id="mentors">
      <div className="sx-grid-bg" />
      <div className="sx-container relative">
        <div className="sx-section-head">
          <div className="sx-stack-md">
            <span className="sx-eyebrow on-navy">Instructors, Founders & Mentors</span>
            <h2 className="sx-display sx-h2 on-navy sx-reveal" style={{ color: '#fff' }}>
              Taught by the people<br />
              you'll be <em>working alongside</em>.
            </h2>
          </div>
          <div>
            <p className="sx-lead on-navy sx-reveal">
              Faculty drawn from working SAP consultants with delivery experience across multiple MNCs
              and implementation projects.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => scrollBy(-1)}
                aria-label="Previous mentor"
                style={{
                  width: 42, height: 42, borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'transparent', color: '#fff',
                  display: 'grid', placeItems: 'center', cursor: 'pointer',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16"><path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
              </button>
              <button
                onClick={() => scrollBy(1)}
                aria-label="Next mentor"
                style={{
                  width: 42, height: 42, borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'transparent', color: '#fff',
                  display: 'grid', placeItems: 'center', cursor: 'pointer',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
              </button>
            </div>
          </div>
        </div>

        <div
          ref={trackRef}
          className="flex gap-5 overflow-x-auto pb-4 pr-6"
          style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'thin' }}
        >
          {MENTORS.map((m) => (
            <article
              key={m.name}
              className="group"
              style={{
                flex: '0 0 clamp(280px, 85vw, 380px)',
                scrollSnapAlign: 'start',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                overflow: 'hidden',
              }}
            >
              <div className="relative overflow-hidden" style={{ aspectRatio: 1, background: 'rgba(255,255,255,0.04)' }}>
                <img
                  src={m.image}
                  alt={m.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  loading="lazy"
                />
                <span
                  className="sx-mono absolute"
                  style={{
                    top: 12, left: 12, padding: '4px 8px', borderRadius: 99,
                    background: 'var(--sx-navy)', color: '#fff', letterSpacing: '0.08em',
                    zIndex: 2,
                  }}
                >
                  FACULTY
                </span>
                <div
                  className="absolute grid place-items-center"
                  style={{
                    top: 14, right: 14,
                    minWidth: 64, height: 64, padding: '0 10px',
                    borderRadius: 999,
                    background: 'var(--sx-citron)',
                    color: 'var(--sx-citron-ink)',
                    fontFamily: 'var(--sx-serif)',
                    boxShadow: '0 10px 28px rgba(0,0,0,0.35), 0 0 0 4px rgba(212,240,74,0.18)',
                    zIndex: 2,
                    textAlign: 'center',
                    lineHeight: 1,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>{m.exp}</div>
                    <div className="sx-mono" style={{ fontSize: 9, marginTop: 2, letterSpacing: '0.08em' }}>YOE</div>
                  </div>
                </div>

                {/* Hover overlay — fades in over the initials avatar with the
                    consultant's current real-world delivery context. Tap-friendly
                    on touch via `group-focus-within` so keyboard users get it too. */}
                <div
                  className="absolute inset-0 flex flex-col justify-end opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'rgba(10, 20, 40, 0.92)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    padding: 20,
                    zIndex: 2,
                  }}
                >
                  <div className="sx-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    BACKGROUND
                  </div>
                  <div style={{ color: '#fff', fontSize: 13.5, lineHeight: 1.55, marginTop: 8 }}>
                    {m.currently}
                  </div>
                </div>
              </div>
              <div style={{ padding: 24 }}>
                <div style={{ fontFamily: 'var(--sx-serif)', fontSize: 'clamp(20px, 3.2vw, 26px)', color: '#fff', letterSpacing: '-0.01em' }}>
                  {m.name}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14.5, marginTop: 5 }}>{m.role}</div>
                <div className="sx-row" style={{ marginTop: 14, gap: 8 }}>
                  <span className="sx-chip on-navy">{m.tag}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}
