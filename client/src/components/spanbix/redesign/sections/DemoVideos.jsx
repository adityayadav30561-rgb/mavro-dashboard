import { Link } from 'react-router-dom';
import { withSpanbixBase } from '@/lib/routeBase';
import { Arrow } from '../Arrow';

const DEMOS = [
  { track: 'SAP FICO', t: 'How a real S/4HANA finance close actually runs', m: 'Aman Patil',   dur: '32 min', label: 'LIVE WORKSHOP RECORDING', tone: 'rose' },
  { track: 'SAP MM',   t: 'Inside the procure-to-pay cycle, end to end',     m: 'Neha Iyer',    dur: '27 min', label: 'MINI LECTURE',           tone: 'olive' },
  { track: 'SAP ABAP', t: 'Reading and extending a real RICEFW object',      m: 'Rohit Sharma', dur: '41 min', label: 'HANDS-ON WALKTHROUGH',   tone: 'slate' },
];

export default function DemoVideos() {
  return (
    <section className="sx-section sx-section-paper" id="demos">
      <div className="sx-container">
        <div className="sx-section-head">
          <div className="sx-stack-md">
            <span className="sx-eyebrow">Sample the Real Thing</span>
            <h2 className="sx-display sx-h2 sx-reveal">
              Watch a <em>full mentor session</em>.<br />
              Then decide.
            </h2>
          </div>
          <p className="sx-lead sx-reveal">
            Most platforms ship 30-second highlight reels. We ship full sample lessons from the actual
            track — same mentor, same sandbox, same depth a paid learner gets.
          </p>
        </div>

        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {DEMOS.map((d, i) => (
            <article
              key={d.track}
              className="sx-reveal overflow-hidden"
              style={{
                background: 'var(--sx-white)',
                border: '1px solid var(--sx-hairline)',
                borderRadius: 14,
                transitionDelay: `${i * 80}ms`,
              }}
            >
              <div className={`sx-photo sx-photo-${d.tone} relative`} style={{ aspectRatio: '16/10' }}>
                <span
                  className="absolute sx-mono"
                  style={{
                    top: 14, left: 14,
                    background: 'rgba(255,255,255,0.94)',
                    color: 'var(--sx-navy)',
                    padding: '6px 12px',
                    borderRadius: 99,
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    fontWeight: 700,
                  }}
                >
                  {d.track}
                </span>
                <span
                  className="absolute sx-mono"
                  style={{
                    top: 14, right: 14,
                    background: 'rgba(0,0,0,0.5)',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: 99,
                    fontSize: 10,
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  ⏱ {d.dur}
                </span>
                <button
                  aria-label="Play preview"
                  className="absolute grid place-items-center"
                  style={{
                    top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: 56, height: 56, borderRadius: 999,
                    background: 'var(--sx-navy)', color: '#fff', border: 0,
                    boxShadow: '0 0 0 8px rgba(255,255,255,0.18)',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24"><path d="M8 5l10 7-10 7V5z" fill="currentColor" /></svg>
                </button>
                <div className="sx-photo-label">{d.track.replace(/ /g, '_')}_DEMO_THUMB.JPG</div>
              </div>
              <div style={{ padding: 20 }}>
                <div className="sx-mono" style={{ color: 'var(--sx-ink-4)' }}>{d.label}</div>
                <h4 style={{ fontFamily: 'var(--sx-serif)', fontSize: 21, color: 'var(--sx-navy)', margin: '6px 0 10px', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                  {d.t}
                </h4>
                <div className="flex items-center gap-2" style={{ fontSize: 12.5, color: 'var(--sx-ink-3)' }}>
                  <span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--sx-navy)' }} />
                  Mentor · {d.m}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div
          className="flex flex-wrap items-center justify-between gap-6"
          style={{
            marginTop: 32,
            background: 'var(--sx-white)',
            border: '1px solid var(--sx-hairline)',
            borderRadius: 14,
            padding: '20px 26px',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="grid place-items-center"
              style={{
                width: 42, height: 42, borderRadius: 10,
                background: 'rgba(16,44,86,0.06)', color: 'var(--sx-navy)',
              }}
              aria-hidden
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 5h16v14H4z M4 9h16" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--sx-serif)', fontSize: 20, color: 'var(--sx-navy)', letterSpacing: '-0.01em' }}>
                Want the full demo library?
              </div>
              <div style={{ color: 'var(--sx-ink-3)', fontSize: 13.5, marginTop: 4 }}>
                Free access to a curated set of full-length sample lessons across every SAP module.
              </div>
            </div>
          </div>
          <Link to={withSpanbixBase('/demo-classes')} className="sx-btn sx-btn-dark">
            Access Free Demo Classes <Arrow />
          </Link>
        </div>
      </div>
    </section>
  );
}
