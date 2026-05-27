import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import JsonLd from '@/components/JsonLd';
import PageHero from '@/components/spanbix/redesign/PageHero';
import FinalCta from '@/components/spanbix/redesign/sections/FinalCta';
import { Arrow } from '@/components/spanbix/redesign/Arrow';
import { buildMetadata } from '@/lib/seoMeta';
import { SPANBIX_SITE, breadcrumbLd } from '@/lib/spanbixSeo';
import ContactForm from './ContactForm';

const LANES = [
  {
    t: "I'm a student / fresh grad",
    b: '30-minute career strategist call. We map the right ERP track, give you an honest placement timeline, and tell you straight if Spanbix is the wrong fit.',
    image: '/spanbix/STUDENT-CONSULTATION.png',
    eta: 'Response in 1 business day',
  },
  {
    t: "I'm a working professional",
    b: 'Career-switch consultation. Bring your background, target salary, and geography. We map your fastest path into ERP roles.',
    image: '/spanbix/PROFESSIONAL-PIVOT.png',
    eta: 'Response in 1 business day',
  },
  {
    t: "I'm a placement head / college",
    b: 'Institutional walkthrough with the Campus team. We align curriculum, cohort size, and placement strategy to your academic calendar.',
    image: '/spanbix/CAMPUS%20PARTNERSHIP.png',
    eta: 'Response within 24 hours',
  },
];

export const metadata = buildMetadata({
  title: `Contact — ${SPANBIX_SITE.name}`,
  description:
    'Talk to a Spanbix career strategist. 30-minute consultation for students, working professionals, or institutional partnerships.',
  keywords: ['contact Spanbix', 'ERP career consultation', 'campus partnership inquiry'],
  canonical: `${SPANBIX_SITE.url}/contact`,
  ogImage: SPANBIX_SITE.logo,
});

export default function ContactPage() {
  const ld = breadcrumbLd([
    { name: 'Home', url: `${SPANBIX_SITE.url}/` },
    { name: 'Contact', url: `${SPANBIX_SITE.url}/contact` },
  ]);
  return (
    <>
      <JsonLd data={ld} />
      <SpanbixLayout>
        <PageHero
          eyebrow="Talk To Spanbix"
          title={<>30 minutes with a strategist. <em>Then you decide.</em></>}
          subtitle="Share your background — degree, geography, current role, target salary. We'll map the right ERP track, give you an honest placement timeline, and tell you straight if Spanbix isn't the right fit."
        />

        <ContactForm />

        {/* Audience lanes */}
        <section
          className="sx-section sx-section-paper"
          style={{ paddingTop: 'clamp(32px, 4vw, 56px)', paddingBottom: 'clamp(40px, 5vw, 72px)' }}
        >
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
                right strategist faster.
              </p>
            </div>

            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {LANES.map((l, i) => (
                <article
                  key={l.t}
                  className="sx-reveal overflow-hidden flex flex-col"
                  style={{
                    background: 'var(--sx-white)',
                    border: '1px solid var(--sx-hairline)',
                    borderRadius: 14,
                    transitionDelay: `${i * 60}ms`,
                  }}
                >
                  <div className="relative overflow-hidden" style={{ aspectRatio: '16/9', background: 'var(--sx-cream-50)' }}>
                    <img
                      src={l.image}
                      alt={l.t}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      loading="lazy"
                    />
                  </div>
                  <div style={{ padding: 22, display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h4 style={{ fontFamily: 'var(--sx-serif)', fontSize: 22, color: 'var(--sx-navy)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>
                      {l.t}
                    </h4>
                    <p style={{ color: 'var(--sx-ink-3)', fontSize: 14.5, lineHeight: 1.55, margin: '0 0 14px' }}>{l.b}</p>
                    <div className="sx-mono" style={{ color: 'var(--sx-ink-4)' }}>{l.eta.toUpperCase()}</div>
                    <div style={{ marginTop: 'auto', paddingTop: 18 }}>
                      <a
                        href="#contact-form"
                        className="sx-btn sx-btn-dark"
                        style={{ justifyContent: 'center', width: '100%' }}
                      >
                        Start The Conversation <Arrow />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <FinalCta />
      </SpanbixLayout>
    </>
  );
}
