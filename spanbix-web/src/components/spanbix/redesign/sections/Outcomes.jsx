'use client';

import { useRef } from 'react';
import { Arrow } from '../Arrow';

// Outcomes — before/after CTC jump cards. Horizontal-scroll carousel.

const ALUMNI = [
  {
    name: 'Tushar Aggarwal',
    track: 'SAP SD',
    before: { role: 'B.Com (Hons.) graduate', ctc: 'Fresher' },
    after: { role: 'SAP SD Consultant', ctc: '14.5L' },
    partner: 'EY',
    quote: 'I came in straight out of a B.Com with zero SAP background. The SD track + mock interviews got me an offer at EY.',
    image: '/spanbix/tushar.jpeg',
  },
  {
    name: 'Poonam Parihar',
    track: 'SAP FICO · Cohort 18',
    before: { role: 'Accounts executive', ctc: '3.4L' },
    after: { role: 'SAP FICO Associate Consultant', ctc: '9.2L' },
    growth: '2.7x',
    partner: 'Capgemini',
    quote: "Spanbix's structured FICO path got me into a consulting role with a real implementation team within five months.",
    image: '/spanbix/poonam-parihar.jpeg',
  },
  {
    name: 'Piyush Srivastava',
    track: 'SAP MM · Cohort 18',
    before: { role: 'Mechanical engineer', ctc: '4.1L' },
    after: { role: 'SAP MM Consultant', ctc: '11.8L' },
    growth: '2.9x',
    partner: 'Tech Mahindra',
    quote: 'The mentor reviews were the difference. Working consultants walked me through every realistic interview scenario.',
    image: '/spanbix/piyush-srivastava.jpeg',
  },
  {
    name: 'Ankur Srivastava',
    track: 'SAP ABAP · Cohort 18',
    before: { role: 'Frontend developer', ctc: '5.6L' },
    after: { role: 'SAP ABAP Developer', ctc: '14.4L' },
    growth: '2.6x',
    partner: 'HCL Technologies',
    quote: 'The capstone projects gave me a portfolio recruiters could verify — that closed the offer.',
    image: '/spanbix/ankur-srivastava.jpeg',
  },
];

// CTC values that start with a digit get a ₹ prefix; labels like "Fresher" render as-is.
const fmtCtc = (v) => (/^\d/.test(String(v)) ? `₹${v}` : v);

export default function Outcomes() {
  const trackRef = useRef(null);
  const scrollBy = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 400, behavior: 'smooth' });
  };

  return (
    <section className="sx-section sx-section-paper" id="outcomes">
      <div className="sx-container">
        <div className="sx-section-head">
          <div className="sx-stack-md">
            <span className="sx-eyebrow">Outcomes That Speak</span>
            <h2 className="sx-display sx-h2 sx-reveal">
              Real graduates. Real offers.<br />
              Real <em>salary jumps</em>.
            </h2>
          </div>
          <div>
            <p className="sx-lead sx-reveal">
              Every story below is from a recent Spanbix cohort — track, hiring partner, before-and-after
              CTC, and the work that made the offer possible.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => scrollBy(-1)}
                aria-label="Previous outcome"
                style={{
                  width: 42, height: 42, borderRadius: 999,
                  border: '1px solid var(--sx-hairline)',
                  background: 'transparent', color: 'var(--sx-navy)',
                  display: 'grid', placeItems: 'center', cursor: 'pointer',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16"><path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
              </button>
              <button
                onClick={() => scrollBy(1)}
                aria-label="Next outcome"
                style={{
                  width: 42, height: 42, borderRadius: 999,
                  border: '1px solid var(--sx-hairline)',
                  background: 'transparent', color: 'var(--sx-navy)',
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
          {ALUMNI.map((a, i) => (
            <article
              key={a.name}
              className="flex flex-col overflow-hidden"
              style={{
                flex: '0 0 clamp(280px, 85vw, 380px)',
                scrollSnapAlign: 'start',
                background: 'var(--sx-white)',
                border: '1px solid var(--sx-hairline)',
                borderRadius: 16,
              }}
            >
              <div className="relative overflow-hidden" style={{ aspectRatio: '16/10', background: 'var(--sx-cream-50)' }}>
                <img
                  src={a.image}
                  alt={a.name}
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                    objectPosition: '50% 15%',
                    display: 'block',
                  }}
                  loading="lazy"
                />
                {a.growth && (
                  <div
                    className="absolute flex items-center gap-1"
                    style={{
                      top: 14, right: 14,
                      background: 'rgba(212, 240, 74, 0.92)',
                      color: 'var(--sx-citron-ink)',
                      fontFamily: 'var(--sx-mono)',
                      fontSize: 11,
                      letterSpacing: '0.05em',
                      padding: '5px 10px',
                      borderRadius: 99,
                      fontWeight: 600,
                      zIndex: 2,
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16"><path d="M3 12l5-5 3 3 5-5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg>
                    {a.growth} growth
                  </div>
                )}
              </div>

              <div style={{ padding: 22, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="grid place-items-center"
                    style={{
                      width: 46, height: 46, borderRadius: 999,
                      background: 'var(--sx-navy)', color: '#fff',
                      fontFamily: 'var(--sx-serif)', fontSize: 17, fontStyle: 'italic',
                    }}
                  >
                    {a.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <div style={{ fontFamily: 'var(--sx-serif)', fontSize: 20, letterSpacing: '-0.01em' }}>{a.name}</div>
                    <div className="sx-mono" style={{ color: 'var(--sx-ink-3)' }}>{a.track.toUpperCase()}</div>
                  </div>
                </div>

                <div
                  className="grid items-center gap-3"
                  style={{
                    gridTemplateColumns: '1fr auto 1fr',
                    background: 'var(--sx-cream-50)',
                    borderRadius: 10,
                    padding: 14,
                  }}
                >
                  <div>
                    <div className="sx-mono" style={{ color: 'var(--sx-ink-4)' }}>BEFORE</div>
                    <div style={{ fontSize: 12.5, marginTop: 4 }}>{a.before.role}</div>
                    <div style={{ fontFamily: 'var(--sx-serif)', fontSize: 20, marginTop: 2 }}>{fmtCtc(a.before.ctc)}</div>
                  </div>
                  <Arrow size={18} />
                  <div
                    style={{
                      background: 'var(--sx-citron)',
                      borderRadius: 8,
                      padding: '8px 10px',
                      margin: '-6px -4px -6px 0',
                    }}
                  >
                    <div className="sx-mono" style={{ color: 'var(--sx-citron-ink)' }}>AFTER</div>
                    <div style={{ fontSize: 12.5, marginTop: 4, color: 'var(--sx-navy)' }}>{a.after.role}</div>
                    <div style={{ fontFamily: 'var(--sx-serif)', fontSize: 20, marginTop: 2, color: 'var(--sx-navy)' }}>{fmtCtc(a.after.ctc)}</div>
                  </div>
                </div>

                <div className="sx-row" style={{ marginTop: 14, gap: 8 }}>
                  <span className="sx-chip">{a.partner}</span>
                </div>

                {a.quote && (
                  <p
                    style={{
                      fontFamily: 'var(--sx-serif)',
                      fontSize: 17,
                      fontStyle: 'italic',
                      color: 'var(--sx-ink-2)',
                      margin: '18px 0 0',
                      lineHeight: 1.45,
                      textWrap: 'pretty',
                    }}
                  >
                    "{a.quote}"
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
