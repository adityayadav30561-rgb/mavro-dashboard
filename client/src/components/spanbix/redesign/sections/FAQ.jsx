import { useState } from 'react';

// FAQ — single-open accordion. Copy matches the existing landingFaqs to stay
// in lockstep with the page-level FAQ JSON-LD emitted from SpanbixLanding.

const ITEMS = [
  {
    q: "I'm a BCom / BBA / MBA graduate. Can I really become an SAP consultant?",
    a: "Yes — and not just \"can\". You're actually the preferred profile for functional SAP roles (FICO, MM, SD). Companies need people who understand accounting, procurement, and sales — not people who can code. The \"SAP needs engineers\" myth is just that, a myth.",
  },
  {
    q: 'How long does a track take to finish?',
    a: 'Functional tracks (FICO, MM, SD) run about 3.5 to 4 months end-to-end — curriculum, sandbox practice, capstone, mock interviews, and placement prep. The ABAP technical track runs 5 months because of the development depth. Plan around 10–14 focused hours per week.',
  },
  {
    q: 'What does "placement support" actually mean?',
    a: "Three concrete things, baked into the program from week one: profile building (resume + LinkedIn + portfolio rewrite reviewed by your mentor), referrals (your mentor introduces you to their hiring panel network), and hiring partner connects (direct interviews with employers we work with). Not a \"we'll add your name to a job board\" line item.",
  },
  {
    q: "What's the certification worth?",
    a: 'A Spanbix certificate is QR-verifiable, mentor-signed, and only issued after you actually finish — assessments, capstone, and mentor sign-off included. It signals that a working consultant validated your work, not that you sat through hours of video.',
  },
  {
    q: "I'm from a Tier-2 / Tier-3 city. Will this still work for me?",
    a: "Yes — that's precisely who Spanbix is built for. The whole program runs online; mentor sessions are live, sandbox access is cloud-based, and our hiring partner network spans GCCs and SIs that hire remote or relocate candidates. You don't have to move to Bengaluru first.",
  },
  {
    q: 'I run a placement cell. How does the campus partnership work?',
    a: 'Three steps. We do a free awareness workshop on your campus. Your students who opt in roll into a structured cohort (200–2,000 learners, 6 months). You get a T&P dashboard, attendance-linked progression, monthly cohort reports, and a co-branded certificate. Pricing follows the conversation with your team — every campus is different.',
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
            If you're considering Spanbix, these are the questions almost every applicant asks. If
            yours isn't here, the strategist call at the bottom of this page is the right place.
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
