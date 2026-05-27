// WhySap — 6-reason card grid. Mixed photo aspect-ratios for editorial rhythm.

const reasons = [
  {
    n: '01',
    title: 'ERP runs every big company.',
    body: 'Books, procurement, payroll, invoicing — all flow through an ERP. Learn it, and you understand how enterprises actually work.',
    image: '/spanbix/f500-boardroom.jpg',
  },
  {
    n: '02',
    title: 'Every background fits somewhere.',
    body: 'B.Com and MBA grads own functional tracks (FICO, MM, SD). B.Tech and CS grads run technical and techno-functional roles (ABAP, BASIS, integrations). ERP needs both.',
    image: '/spanbix/BCOM_BTECH_COHORT.png',
  },
  {
    n: '03',
    title: '50,000+ open roles. No trained pipeline.',
    body: 'India posts 50K+ ERP roles a year. Most go unfilled. Trained candidates skip the queue.',
    image: '/spanbix/erp-dashboard.png',
  },
  {
    n: '04',
    title: 'India delivers ERP for the world.',
    body: 'Every SI, GCC, and manufacturing major runs ERP from here. Migrations through 2028 mean the bench is being rebuilt now.',
    image: '/spanbix/HYDERABAD_GCC_FLOOR.png',
  },
  {
    n: '05',
    title: 'Experience compounds.',
    body: 'ERP skill ages well. A 10-year consultant out-earns a 1-year one — every project deepens the knowledge.',
    image: '/spanbix/CONSULTANT_15YR.png',
  },
  {
    n: '06',
    title: 'No metro tax anymore.',
    body: 'ERP training used to live in Tier-1 cities. Online-first and mentor-led — Tier-2 and Tier-3 are in.',
    image: '/spanbix/pune.jpg',
  },
];

export default function WhySap() {
  return (
    <section className="sx-section sx-section-paper" id="why">
      <div className="sx-container">
        <div className="sx-section-head">
          <div className="sx-stack-md">
            <span className="sx-eyebrow">Why ERP Careers</span>
            <h2 className="sx-display sx-h2 sx-reveal">
              Everything you were <em>never told</em> about ERP careers.
            </h2>
          </div>
          <p className="sx-lead sx-reveal">
            ERP — SAP, Oracle, Microsoft Dynamics — runs every large enterprise. Hiring is huge,
            the trained pipeline is thin, and nobody points graduates at it.
          </p>
        </div>

        {/* Locked at 3 cols on desktop (lg ≥1024px), 2 cols on md (≥768px), 1 on mobile.
            Avoids auto-fit drift to 4 cols on wide viewports — keeps the 3×2 editorial grid intact. */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r, i) => (
            <article
              key={i}
              className="sx-reveal flex flex-col overflow-hidden"
              style={{
                background: 'var(--sx-white)',
                border: '1px solid var(--sx-hairline)',
                borderRadius: 14,
                transitionDelay: `${i * 50}ms`,
              }}
            >
              <div
                className="relative overflow-hidden"
                style={{ aspectRatio: i % 3 === 1 ? '3/4' : '4/3', background: 'var(--sx-cream-50)' }}
              >
                <img
                  src={r.image}
                  alt={r.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  loading="lazy"
                />
                <div className="sx-photo-corner">{r.n}</div>
              </div>
              <div style={{ padding: 22 }}>
                <h3
                  style={{
                    fontFamily: 'var(--sx-serif)',
                    fontSize: 24,
                    lineHeight: 1.15,
                    margin: '8px 0 10px',
                    letterSpacing: '-0.01em',
                    color: 'var(--sx-navy)',
                  }}
                >
                  {r.title}
                </h3>
                <p style={{ color: 'var(--sx-ink-3)', fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{r.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
