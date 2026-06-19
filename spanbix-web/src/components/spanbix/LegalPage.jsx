import SpanbixLayout from '@/components/spanbix/SpanbixLayout';

// Shared renderer for the legal pages (Privacy / Terms / Refund). Content is
// data-driven: each page passes `sections` = [{ h, p?: [], ul?: [] }] so styling
// stays consistent and the pages read as plain content. Paragraphs may be
// strings or JSX (e.g. a mailto link).
export default function LegalPage({ title, updated, intro, sections }) {
  return (
    <SpanbixLayout>
      <section style={{ background: '#fff', padding: 'clamp(40px, 7vw, 96px) 0' }}>
        <div className="sx-container" style={{ maxWidth: 820 }}>
          <span className="sx-mono" style={{ color: 'var(--sx-ink-4)', fontSize: 12, letterSpacing: '0.1em' }}>LEGAL</span>
          <h1 className="sx-display" style={{ fontSize: 'clamp(32px, 5vw, 52px)', color: 'var(--sx-navy)', margin: '10px 0 8px', fontWeight: 400, lineHeight: 1.05 }}>
            {title}
          </h1>
          <p className="sx-mono" style={{ color: 'var(--sx-ink-4)', fontSize: 12 }}>LAST UPDATED: {updated}</p>
          {intro && (
            <p style={{ marginTop: 22, color: 'var(--sx-ink-2)', fontSize: 16, lineHeight: 1.7 }}>{intro}</p>
          )}
          <div style={{ marginTop: 26 }}>
            {sections.map((s, i) => (
              <section key={i} style={{ marginTop: 34 }}>
                <h2 style={{ fontFamily: 'var(--sx-serif)', fontSize: 'clamp(20px, 2.4vw, 26px)', color: 'var(--sx-navy)', fontWeight: 400, marginBottom: 12, lineHeight: 1.2 }}>
                  {i + 1}. {s.h}
                </h2>
                {s.p?.map((para, j) => (
                  <p key={j} style={{ color: 'var(--sx-ink-2)', fontSize: 15.5, lineHeight: 1.72, marginBottom: 12 }}>{para}</p>
                ))}
                {s.ul && (
                  <ul style={{ margin: '4px 0 12px', paddingLeft: 22 }}>
                    {s.ul.map((li, j) => (
                      <li key={j} style={{ color: 'var(--sx-ink-2)', fontSize: 15.5, lineHeight: 1.65, marginBottom: 7, listStyle: 'disc' }}>{li}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </section>
    </SpanbixLayout>
  );
}
