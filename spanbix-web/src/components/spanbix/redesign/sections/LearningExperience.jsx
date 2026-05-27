// LearningExperience — features on left, dashboard mockup on right.

import { Users, Workflow, Radio, Terminal } from 'lucide-react';

const FEATURES = [
  { icon: Users,    t: 'Cohort learning, not solo grinding', b: 'Fixed batch, peer discussions, shared capstone reviews. Accountability built in.' },
  { icon: Workflow, t: 'Curriculum mirrors a real project',  b: 'Business process → configuration → integration → capstone. The way SAP is actually deployed.' },
  { icon: Radio,    t: 'Live first, then on-demand',         b: 'Classes run live with a working consultant leading. Recordings drop into your library so you can revisit anytime.' },
  { icon: Terminal, t: 'Hands-on configuration',             b: 'Work on an S/4HANA environment — configure GL, post documents, build pricing, run goods receipts.' },
];

const MOCKUP_ROWS = [
  { name: 'GL Account Master Data', meta: '24 min', state: 'done' },
  { name: 'Document Splitting Configuration', meta: '38 min · 62%', state: 'active' },
  { name: 'Asset Accounting Setup', meta: 'LIVE · Tomorrow 7 PM', state: 'live' },
  { name: 'Controlling Area & Cost Centers', meta: 'Unlocks after AA', state: 'locked' },
  { name: 'Capstone · Period-End Close', meta: 'Cohort capstone', state: 'locked' },
];

const STATE_DOT = {
  done:   '#4ade80',
  active: '#3b82f6',
  live:   '#ff6a4b',
  locked: 'rgba(255,255,255,0.15)',
};

export default function LearningExperience() {
  return (
    <section className="sx-section sx-section-paper" id="learning">
      <div className="sx-container">
        <div className="sx-section-head">
          <div className="sx-stack-md">
            <span className="sx-eyebrow">The Learning Experience</span>
            <h2 className="sx-display sx-h2 sx-reveal">
              Built like a <em>working consultant's</em> toolkit. Not a video library.
            </h2>
          </div>
          <p className="sx-lead sx-reveal">
            Structured curriculum, a sandbox you actually touch, weekly mentor reviews, and a
            capstone recruiters can verify. Not 80 hours of recorded video.
          </p>
        </div>

        <div
          className="grid items-start gap-8"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}
        >
          <div className="grid gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="sx-reveal grid"
                  style={{
                    gridTemplateColumns: '64px 1fr',
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
                      width: 56, height: 56,
                      borderRadius: 14,
                      background: 'linear-gradient(135deg, var(--sx-navy) 0%, var(--sx-navy-700) 100%)',
                      color: 'var(--sx-citron)',
                      boxShadow: '0 8px 22px -10px rgba(16,44,86,0.45), 0 0 0 1px rgba(255,255,255,0.06) inset',
                    }}
                  >
                    <Icon size={26} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="sx-mono" style={{ color: 'var(--sx-ink-4)', letterSpacing: '0.12em', marginBottom: 4 }}>0{i + 1}</div>
                    <h4 style={{ fontFamily: 'var(--sx-serif)', fontSize: 22, color: 'var(--sx-navy)', margin: 0, letterSpacing: '-0.01em' }}>{f.t}</h4>
                    <p style={{ color: 'var(--sx-ink-3)', fontSize: 14.5, lineHeight: 1.6, margin: '8px 0 0' }}>{f.b}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, var(--sx-navy) 0%, var(--sx-navy-700) 100%)',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 30px 80px rgba(16, 44, 86, 0.25)',
            }}
          >
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ background: 'rgba(0,0,0,0.18)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex gap-1.5">
                <span style={{ width: 10, height: 10, borderRadius: 99, background: '#ff6a4b' }} />
                <span style={{ width: 10, height: 10, borderRadius: 99, background: 'var(--sx-citron)' }} />
                <span style={{ width: 10, height: 10, borderRadius: 99, background: '#4ade80' }} />
              </div>
              <div className="sx-mono flex-1 text-center" style={{ color: 'rgba(255,255,255,0.55)' }}>
                SPANBIX · LEARNING WORKSPACE
              </div>
              <div className="sx-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>COHORT_18</div>
            </div>

            <div style={{ padding: 22 }}>
              <div
                className="flex justify-between items-center gap-4"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  padding: '16px 18px',
                }}
              >
                <div className="min-w-0">
                  <div className="sx-mono" style={{ color: 'rgba(255,255,255,0.55)' }}>CURRENT LESSON</div>
                  <div style={{ color: '#fff', fontFamily: 'var(--sx-serif)', fontSize: 22, marginTop: 6, letterSpacing: '-0.01em' }}>
                    Configuring Chart of Depreciation
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12.5, marginTop: 4 }}>
                    SAP FICO · Module 04 · Asset Accounting
                  </div>
                </div>
                <div
                  className="grid place-items-center shrink-0"
                  style={{
                    width: 48, height: 48, borderRadius: 999,
                    background: 'var(--sx-citron)', color: 'var(--sx-citron-ink)',
                    boxShadow: '0 0 0 6px rgba(212, 240, 74, 0.18)',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24"><path d="M8 5l10 7-10 7V5z" fill="currentColor" /></svg>
                </div>
              </div>

              <div className="grid gap-0.5 mt-4" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}>
                {MOCKUP_ROWS.map((row, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-3"
                    style={{
                      borderRadius: 8,
                      fontSize: 13.5,
                      background: row.state === 'active' ? 'rgba(255,255,255,0.06)' : 'transparent',
                      opacity: row.state === 'locked' ? 0.5 : 1,
                    }}
                  >
                    <span
                      className="shrink-0"
                      style={{
                        width: 8, height: 8, borderRadius: 99,
                        background: STATE_DOT[row.state] || 'rgba(255,255,255,0.2)',
                      }}
                    />
                    <span style={{ color: '#fff', flex: 1 }}>{row.name}</span>
                    <span className="sx-mono" style={{ color: 'rgba(255,255,255,0.45)' }}>{row.meta}</span>
                  </div>
                ))}
              </div>

              <div
                className="grid items-center gap-4 pt-4 mt-4"
                style={{ gridTemplateColumns: 'auto 1fr auto', borderTop: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div>
                  <div className="sx-mono" style={{ color: 'rgba(255,255,255,0.45)' }}>READINESS SCORE</div>
                  <div style={{ color: '#fff', fontFamily: 'var(--sx-serif)', fontSize: 22, marginTop: 4 }}>
                    78<span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>/100</span>
                  </div>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: '78%', height: '100%', background: 'linear-gradient(90deg, var(--sx-citron), #d4f04a)' }} />
                </div>
                <div className="sx-mono" style={{ color: 'var(--sx-citron)' }}>PLACEMENT READY →</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
