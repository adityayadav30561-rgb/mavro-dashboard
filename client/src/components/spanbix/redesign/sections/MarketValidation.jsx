// MarketValidation — left photo, right 2x2 stat grid.

const DEFAULT_STATS = [
  { num: '₹4.7L+', label: 'STARTING', text: 'Avg certified ERP consultant CTC, India' },
  { num: '38M+', label: 'GRADUATES', text: 'Commerce grads entering the workforce yearly' },
  { num: '<2%', label: 'AWARENESS', text: 'Of grads aware of ERP careers' },
  { num: '1,000+', label: 'EMPLOYERS', text: 'Big 4, IBM, Accenture, TCS, Infosys, Wipro — all hire ERP talent in volume' },
];

const DEFAULT_TITLE = (
  <>The numbers <em>nobody</em><br />is talking about.</>
);

const DEFAULT_LEAD = "Millions of commerce and management grads enter the workforce yearly. India also runs the global ERP delivery economy. Nothing connects the two — that's the gap Spanbix closes.";

const DEFAULT_SOURCES = 'SOURCES · NASSCOM · NAUKRI JOBSPEAK · AISHE 2023-24 · LINKEDIN TALENT INSIGHTS';

export default function MarketValidation({
  eyebrow = 'Market Validation',
  title = DEFAULT_TITLE,
  lead = DEFAULT_LEAD,
  stats = DEFAULT_STATS,
  sources = DEFAULT_SOURCES,
  image = '/spanbix/campus%20placement.png',
  imageAlt = 'Campus placement day',
  imageCorner = 'FIG. 01',
}) {
  return (
    <section className="sx-section sx-section-cream" id="market">
      <div className="sx-container">
        <div className="sx-section-head">
          <div className="sx-stack-md">
            <span className="sx-eyebrow">{eyebrow}</span>
            <h2 className="sx-display sx-h2 sx-reveal">{title}</h2>
          </div>
          <p className="sx-lead sx-reveal">{lead}</p>
        </div>

        <div className="grid gap-7 grid-cols-1 md:[grid-template-columns:minmax(0,_0.85fr)_minmax(0,_1.15fr)]">
          <div className="relative overflow-hidden hidden md:block" style={{ minHeight: 460, borderRadius: 10, background: 'var(--sx-navy)' }}>
            <img
              src={image}
              alt={imageAlt}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
                objectPosition: 'center top',
                transform: 'scale(1.18)',
                transformOrigin: 'center 30%',
                display: 'block',
              }}
              loading="lazy"
            />
            {imageCorner && <div className="sx-photo-corner" style={{ zIndex: 2 }}>{imageCorner}</div>}
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 1,
              background: 'var(--sx-hairline)',
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            {stats.map((s, i) => (
              <div
                key={i}
                className="sx-reveal relative"
                style={{
                  background: 'var(--sx-cream-50)',
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  transitionDelay: `${i * 80}ms`,
                }}
              >
                <span className="sx-mono absolute" style={{ top: 16, right: 18, color: 'var(--sx-ink-4)' }}>
                  0{i + 1}
                </span>
                <div className="sx-stat-num" style={{ color: 'var(--sx-navy)' }}>{s.num}</div>
                <div className="sx-mono" style={{ color: 'var(--sx-navy)', letterSpacing: '0.1em', marginTop: 4 }}>{s.label}</div>
                <p style={{ margin: '4px 0 0', color: 'var(--sx-ink-3)', fontSize: 14, lineHeight: 1.5 }}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {sources && (
          <div className="sx-mono text-center" style={{ marginTop: 32, color: 'var(--sx-ink-4)', letterSpacing: '0.08em' }}>
            {sources}
          </div>
        )}
      </div>
    </section>
  );
}
