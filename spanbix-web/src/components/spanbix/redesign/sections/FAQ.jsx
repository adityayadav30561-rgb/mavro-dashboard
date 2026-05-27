'use client';

import { useState } from 'react';

// FAQ — single-open accordion. Copy matches the existing landingFaqs to stay
// in lockstep with the page-level FAQ JSON-LD emitted from SpanbixLanding.

const ITEMS = [
  {
    q: "I'm a commerce / MBA / engineering graduate. Which ERP track fits me?",
    a: 'Every background has a lane. Commerce, BBA, BCom, and MBA graduates own the functional tracks (FICO, MM, SD) — accounting, procurement, and sales sense matters more than coding. B.Tech, CS, and BCA graduates fit the technical and techno-functional tracks (ABAP, integrations). On the consultation call we map you to the track that matches your background and target salary.',
  },
  {
    q: 'How long does a track take to finish?',
    a: 'All four tracks run about 3 months end-to-end — curriculum, hands-on practice, capstone, and mock interview prep. Live mentor sessions are recorded and added to your library so you can revisit them anytime. Plan around 10–14 focused hours per week.',
  },
  {
    q: 'What does "placement support" actually mean?',
    a: 'Three things baked into the program: profile work (resume, LinkedIn, portfolio reviewed by working consultants), mock interviews tuned to real hiring-panel questions, and hiring partner connects when you finish. We also include a complimentary personality development module so the interview itself goes smoothly.',
  },
  {
    q: "What's the certification worth?",
    a: 'A Spanbix certificate is QR-verifiable, mentor-signed, and only issued after you actually finish — assessments, capstone, and mentor sign-off included. It signals that a working consultant validated your work, not that you sat through hours of video.',
  },
  {
    q: "I'm from a Tier-2 / Tier-3 city. Will this still work for me?",
    a: "Yes — that's precisely who Spanbix is built for. The whole program runs online: live mentor sessions, recorded library, and cloud-based hands-on practice. You don't need to relocate to a metro to start.",
  },
  {
    q: 'I run a placement cell. How does the campus partnership work?',
    a: "Three steps. We do a free awareness workshop on your campus. Students who opt in roll into a structured cohort aligned to your academic calendar. You get a co-branded credential, regular T&P updates, and a cohort report at the end. Pricing follows the conversation with your team — every campus is different, and the personality development module is complimentary for campus cohorts.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section className="sx-section sx-section-cream" id="faq">
      <div className="sx-container">
        <div className="sx-section-head">
          <div className="sx-stack-md">
            <span className="sx-eyebrow">Questions Answered</span>
            <h2 className="sx-display sx-h2 sx-reveal">
              Everything you wanted to ask <em>before booking the call</em>.
            </h2>
          </div>
          <p className="sx-lead sx-reveal">
            The questions almost every applicant asks. If yours isn't here, book a quick consultation
            and a strategist will walk you through it.
          </p>
        </div>

        <div className="max-w-[920px] mx-auto grid gap-2">
          {ITEMS.map((it, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                style={{
                  background: 'var(--sx-white)',
                  border: `1px solid ${isOpen ? 'var(--sx-navy)' : 'var(--sx-hairline)'}`,
                  borderRadius: 12,
                  overflow: 'hidden',
                  transition: 'border-color 0.2s ease',
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full flex items-center gap-4 px-6 py-5 text-left"
                  style={{
                    background: 'transparent', border: 0, cursor: 'pointer',
                    fontFamily: 'var(--sx-serif)',
                    fontSize: 19, color: 'var(--sx-navy)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  <span className="sx-mono shrink-0 w-8" style={{ color: 'var(--sx-ink-4)' }}>
                    0{i + 1}
                  </span>
                  <span className="flex-1">{it.q}</span>
                  <span
                    style={{
                      fontFamily: 'var(--sx-sans)', fontSize: 26, fontWeight: 300,
                      color: 'var(--sx-ink-3)', width: 28, textAlign: 'center',
                    }}
                  >
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                <div
                  style={{
                    maxHeight: isOpen ? 400 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >
                  <div className="flex gap-4 px-6 pb-5">
                    <span className="shrink-0 w-8" />
                    <p style={{ margin: 0, color: 'var(--sx-ink-3)', fontSize: 15, lineHeight: 1.65, maxWidth: '72ch' }}>
                      {it.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
