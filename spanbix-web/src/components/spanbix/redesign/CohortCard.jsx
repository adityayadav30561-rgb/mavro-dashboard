// ════════════════════════════════════════════════════════════════════════════
// CohortCard — glassmorphic live-cohort snapshot
// ════════════════════════════════════════════════════════════════════════════
// Floating card overlapping the hero. Renders the current cohort's curriculum
// progress, mentor + module counts, next live session, and median placement
// CTC. Static demo data — wire to API in Phase 2.

export default function CohortCard() {
  return (
    <div className="sx-cohort">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <div className="sx-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>ACTIVE COHORT</div>
          <div className="sx-cohort-title truncate">SAP FICO · Consultant Track</div>
        </div>
        <span className="sx-cohort-badge">
          <span style={{ width: 6, height: 6, borderRadius: 99, background: '#4ade80' }} />
          IN PROGRESS
        </span>
      </div>

      <div style={{ marginTop: 22 }}>
        <div className="flex justify-between text-[13px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
          <span>Curriculum progress</span>
          <span style={{ color: '#fff' }}>68%</span>
        </div>
        <div className="sx-cohort-progress-bar">
          <div className="sx-cohort-progress-fill" style={{ width: '68%' }} />
        </div>
      </div>

      <div className="sx-cohort-stats">
        {[
          { num: '24', lbl: 'MODULES' },
          { num: '4', lbl: 'MENTORS' },
          { num: '3 mo', lbl: 'DURATION' },
        ].map((s) => (
          <div key={s.lbl} className="sx-cohort-stat">
            <div className="sx-cohort-stat-num">{s.num}</div>
            <div className="sx-mono" style={{ color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>{s.lbl}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
