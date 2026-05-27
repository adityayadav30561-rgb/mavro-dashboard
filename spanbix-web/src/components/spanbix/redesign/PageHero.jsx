// PageHero — magazine-style page header for non-homepage routes.
//
// Compact navy hero with eyebrow + serif headline + lead. Caller can pass an
// optional `meta` strip (3 stats) and an optional photo tone for the
// background tile on the right. Mobile collapses to single column.

export default function PageHero({
  eyebrow,
  title,
  subtitle,
  meta,
  photoTone,
  photoLabel,
  children,
}) {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: 'var(--sx-navy)',
        color: '#fff',
        paddingTop: 'clamp(120px, 14vw, 180px)',
        paddingBottom: 'clamp(56px, 8vw, 96px)',
      }}
    >
      <div className="sx-grid-bg" />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 12%, rgba(39,100,228,0.22), transparent 55%), radial-gradient(circle at 82% 88%, rgba(74,222,128,0.10), transparent 55%)',
        }}
      />

      <div className="sx-container relative" style={{ zIndex: 2 }}>
        <div
          className="grid items-center gap-10"
          style={{ gridTemplateColumns: photoTone ? 'minmax(0, 1.2fr) minmax(0, 0.8fr)' : '1fr' }}
        >
          <div>
            {eyebrow && <span className="sx-eyebrow on-navy">{eyebrow}</span>}
            {title && (
              <h1
                className="sx-display sx-h1 on-navy"
                style={{ color: '#fff', marginTop: 20, fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 1.05 }}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="sx-lead on-navy" style={{ marginTop: 18 }}>{subtitle}</p>
            )}
            {children && <div style={{ marginTop: 24 }}>{children}</div>}

            {meta && meta.length > 0 && (
              <div className="sx-hero-meta" style={{ marginTop: 36 }}>
                {meta.map((m, i) => (
                  <div key={m.label || i} className="min-w-0">
                    <div className="sx-hero-meta-num" style={{ fontSize: 'clamp(28px, 3vw, 36px)' }}>
                      {m.value}
                    </div>
                    <div className="sx-hero-meta-lbl">{m.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {photoTone && (
            <div
              className={`sx-photo sx-photo-${photoTone} hidden lg:block`}
              style={{ aspectRatio: '4/5', borderRadius: 14, minHeight: 360 }}
            >
              {photoLabel && <div className="sx-photo-label">{photoLabel}</div>}
              <div className="sx-photo-corner">FIG</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
