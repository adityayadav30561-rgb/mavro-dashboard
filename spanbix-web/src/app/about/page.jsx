import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import JsonLd from '@/components/JsonLd';
import PageHero from '@/components/spanbix/redesign/PageHero';
import MarketValidation from '@/components/spanbix/redesign/sections/MarketValidation';
import WhySap from '@/components/spanbix/redesign/sections/WhySap';
import FinalCta from '@/components/spanbix/redesign/sections/FinalCta';
import { buildMetadata } from '@/lib/seoMeta';
import { SPANBIX_SITE, breadcrumbLd } from '@/lib/spanbixSeo';

export const metadata = buildMetadata({
  title: `About — ${SPANBIX_SITE.name}`,
  description:
    'Spanbix is career transformation infrastructure for the SAP and ERP economy — built by working consultants, for commerce, MBA, and engineering graduates who deserve a real shot at the country\'s highest-paying enterprise careers.',
  keywords: ['about Spanbix', 'Spanbix mission', 'SAP training company India', 'enterprise career platform'],
  canonical: `${SPANBIX_SITE.url}/about`,
  ogImage: SPANBIX_SITE.logo,
});

export default function AboutPage() {
  const ld = breadcrumbLd([
    { name: 'Home', url: `${SPANBIX_SITE.url}/` },
    { name: 'About', url: `${SPANBIX_SITE.url}/about` },
  ]);
  return (
    <>
      <JsonLd data={ld} />
      <SpanbixLayout>
        <PageHero
          eyebrow="About Spanbix"
          title={<>Career transformation infrastructure for the <em>SAP economy</em>.</>}
          subtitle="India ships millions of commerce, management, and engineering graduates into the job market every year. The country also runs the global SAP delivery economy. Almost nothing connects the two — which is exactly why we built Spanbix."
          meta={[
            { value: '4', label: 'Active tracks' },
            { value: '12', label: 'Campus cohorts' },
            { value: '2,400+', label: 'Learners enrolled' },
          ]}
        />
        <MarketValidation
          eyebrow="Founder Story"
          title={<>Led by startup founders who lived the <em>gap</em>.</>}
          lead="Spanbix was started by a founder with 15+ years inside the SAP industry — after watching thousands of open roles go unfilled while skilled candidates stayed invisible. We built it from inside the gap, not from the outside."
          stats={[
            { num: '15+ yrs', label: 'FOUNDER', text: 'Hands-on SAP delivery experience before starting Spanbix' },
            { num: '50K+', label: 'OPEN ROLES', text: 'ERP jobs posted yearly in India — pipeline can\'t fill them' },
            { num: '3 mo', label: 'TO READY', text: 'Structured path from beginner to placement-ready' },
            { num: '₹4.7L+', label: 'STARTING CTC', text: 'Avg first-year package for a certified ERP consultant' },
          ]}
          image="/spanbix/lalit.png"
          imageAlt="LalitMohan Parihar — Spanbix founder"
          imageCorner="FOUNDER"
          sources={null}
        />
        <WhySap />
        <FinalCta />
      </SpanbixLayout>
    </>
  );
}
