import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import PageHero from '@/components/spanbix/redesign/PageHero';
import FinalCta from '@/components/spanbix/redesign/sections/FinalCta';
import useScrollReveal from '@/components/spanbix/redesign/useScrollReveal';
import useSEO from '@/hooks/useSEO';
import { SPANBIX_SITE, breadcrumbLd } from '@/lib/spanbixSeo';

const LANES = [
  {
    t: "I'm a student / fresh grad",
    b: '30-minute career strategist call. We map the right SAP track, give you an honest placement timeline, and tell you straight if Spanbix is the wrong fit.',
    tone: 'rose', label: 'STUDENT_CONSULTATION.JPG',
    eta: 'Response in 1 business day',
  },
  {
    t: "I'm a working professional",
    b: 'Career-switch consultation. Bring your background, target salary, and geography. We map your fastest path into SAP roles that compound.',
    tone: 'olive', label: 'PROFESSIONAL_PIVOT.JPG',
    eta: 'Response in 1 business day',
  },
  {
    t: "I'm a placement head / college",
    b: 'Institutional walkthrough with our Campus team. We align curriculum, cohort size, and placement strategy to your academic calendar.',
    tone: 'slate', label: 'CAMPUS_PARTNERSHIP.JPG',
    eta: 'Response within 24 hours',
  },
];

const COORDINATES = [
  { icon: Mail,    label: 'Email',     value: 'hello@spanbix.com' },
  { icon: Phone,   label: 'Phone',     value: '+91 80XXXX XXXX' },
  { icon: MapPin,  label: 'Locations', value: 'Bengaluru · Hyderabad · Pune' },
  { icon: Clock,   label: 'Hours',     value: 'Mon–Sat · 10AM – 7PM IST' },
];

export default function SpanbixContact() {
  useSEO({
    title: `Contact — ${SPANBIX_SITE.name}`,
    description:
      'Talk to a Spanbix career strategist. 30-minute consultation for students, working professionals, or institutional partnerships — no sales pressure, just honest mapping.',
    keywords: ['contact Spanbix', 'SAP career consultation', 'campus partnership inquiry'],
    canonical: `${SPANBIX_SITE.url}/contact`,
    ogImage: SPANBIX_SITE.logo,
    jsonLd: [
      breadcrumbLd([
        { name: 'Home', url: `${SPANBIX_SITE.url}/` },
        { name: 'Contact', url: `${SPANBIX_SITE.url}/contact` },
      ]),
    ],
  });
  useScrollReveal();

  return (
    <SpanbixLayout>
      <PageHero
        eyebrow="Talk To Spanbix"
        title={<>30 minutes with a strategist. <em>Then you decide.</em></>}
        subtitle="Tell us your background — degree, geography, current role, target salary. We'll map the right SAP track, give you an honest placement timeline, and if Spanbix isn't the right fit, we'll say so. No sales pressure. No upselling. No scripted scripts."
      />

      {/* Audience lanes */}
      <section className="sx-section sx-section-paper">
        <div className="sx-container">
          <div className="sx-section-head">
            <div className="sx-stack-md">
              <span className="sx-eyebrow">Who Should I Be Talking To?</span>
              <h2 className="sx-display sx-h2 sx-reveal">
                Three doors. Pick the one that <em>fits your stage</em>.
              </h2>
            </div>
            <p className="sx-lead sx-reveal">
              Different inquiries route to different teams. Picking the right lane gets you the
              right strategist faster — and a more useful conversation when the call lands.
            </p>
          </div>

          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {LANES.map((l, i) => (
              <article
                key={l.t}
                className="sx-reveal overflow-hidden"
                style={{
                  background: 'var(--sx-white)',
                  border: '1px solid var(--sx-hairline)',
                  borderRadius: 14,
                  transitionDelay: `${i * 60}ms`,
                }}
              >
                <div className={`sx-photo sx-photo-${l.tone}`} style={{ aspectRatio: '16/9' }}>
                  <div className="sx-photo-label">{l.label}</div>
                </div>
                <div style={{ padding: 22 }}>
                  <h4 style={{ fontFamily: 'var(--sx-serif)', fontSize: 22, color: 'var(--sx-navy)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>
                    {l.t}
                  </h4>
                  <p style={{ color: 'var(--sx-ink-3)', fontSize: 14.5, lineHeight: 1.55, margin: '0 0 14px' }}>{l.b}</p>
                  <div className="sx-mono" style={{ color: 'var(--sx-ink-4)' }}>{l.eta.toUpperCase()}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Coordinates strip */}
      <section className="sx-section sx-section-cream" style={{ paddingTop: 'clamp(40px, 5vw, 64px)', paddingBottom: 'clamp(40px, 5vw, 64px)' }}>
        <div className="sx-container">
          <div className="sx-mono" style={{ color: 'var(--sx-ink-4)', marginBottom: 18 }}>DIRECT COORDINATES</div>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {COORDINATES.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.label}
                  className="flex items-center gap-3"
                  style={{
                    background: 'var(--sx-white)',
                    border: '1px solid var(--sx-hairline)',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}
                >
                  <span
                    className="grid place-items-center shrink-0"
                    style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: 'rgba(16,44,86,0.06)', color: 'var(--sx-navy)',
                    }}
                  >
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0">
                    <div className="sx-mono" style={{ color: 'var(--sx-ink-4)' }}>{c.label.toUpperCase()}</div>
                    <div style={{ fontSize: 14, color: 'var(--sx-ink), fontWeight: 500', marginTop: 2 }}>
                      {c.value}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <FinalCta />
    </SpanbixLayout>
  );
}
