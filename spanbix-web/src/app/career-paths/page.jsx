import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import JsonLd from '@/components/JsonLd';
import PageHero from '@/components/spanbix/redesign/PageHero';
import Tracks from '@/components/spanbix/redesign/sections/Tracks';
import FinalCta from '@/components/spanbix/redesign/sections/FinalCta';
import { buildMetadata } from '@/lib/seoMeta';
import { SPANBIX_SITE, SPANBIX_CAREER_PATHS, breadcrumbLd, courseLd } from '@/lib/spanbixSeo';

export const metadata = buildMetadata({
  title: `Career Paths — ${SPANBIX_SITE.name}`,
  description:
    'Pick your SAP career track — FICO, MM, SD or ABAP. Mentor-led 3-month programs with capstone and placement support for graduates in India.',
  keywords: ['ERP career paths', 'SAP FICO career', 'SAP MM career', 'SAP ABAP career', 'ERP career India'],
  canonical: `${SPANBIX_SITE.url}/career-paths`,
  ogImage: SPANBIX_SITE.logo,
});

export default function CareerPathsPage() {
  const ld = [
    breadcrumbLd([
      { name: 'Home', url: `${SPANBIX_SITE.url}/` },
      { name: 'Career Paths', url: `${SPANBIX_SITE.url}/career-paths` },
    ]),
    ...SPANBIX_CAREER_PATHS.map(courseLd),
  ];
  return (
    <>
      <JsonLd data={ld} />
      <SpanbixLayout>
        <PageHero
          eyebrow="Career Paths"
          title={<>Pick the track that fits <em>your future</em>.</>}
          subtitle="Four ERP tracks (SAP-led) — FICO, MM, SD, ABAP — plus a new AI Mastery program for the age of AI. Each path is a self-contained career layer with curriculum, mentor reviews, hands-on practice, and a capstone. Functional tracks for commerce + MBA grads, technical for engineering, and AI for everyone."
          meta={[
            { value: '5', label: 'Programs' },
            { value: 'Live', label: 'Mentor-led + recorded' },
            { value: '3', label: 'Categories — Functional, Technical, AI' },
          ]}
        />
        <Tracks />
        <FinalCta />
      </SpanbixLayout>
    </>
  );
}
