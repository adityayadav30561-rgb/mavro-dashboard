import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import JsonLd from '@/components/JsonLd';
import PageHero from '@/components/spanbix/redesign/PageHero';
import Tracks from '@/components/spanbix/redesign/sections/Tracks';
import LearningExperience from '@/components/spanbix/redesign/sections/LearningExperience';
import Certification from '@/components/spanbix/redesign/sections/Certification';
import FinalCta from '@/components/spanbix/redesign/sections/FinalCta';
import { buildMetadata } from '@/lib/seoMeta';
import { SPANBIX_SITE, SPANBIX_CAREER_PATHS, breadcrumbLd, courseLd } from '@/lib/spanbixSeo';

export const metadata = buildMetadata({
  title: `Courses — ${SPANBIX_SITE.name}`,
  description:
    'Explore Spanbix SAP courses — FICO, MM, SD & ABAP. 3-month mentor-led tracks with capstone and placement support for graduates across India.',
  keywords: ['ERP courses', 'SAP training', 'SAP FICO course', 'SAP MM course', 'SAP ABAP', 'ERP careers'],
  canonical: `${SPANBIX_SITE.url}/courses`,
  ogImage: SPANBIX_SITE.logo,
});

export default function CoursesPage() {
  const ld = [
    breadcrumbLd([
      { name: 'Home', url: `${SPANBIX_SITE.url}/` },
      { name: 'Courses', url: `${SPANBIX_SITE.url}/courses` },
    ]),
    ...SPANBIX_CAREER_PATHS.map(courseLd),
  ];
  return (
    <>
      <JsonLd data={ld} />
      <SpanbixLayout>
        <PageHero
          eyebrow="The Spanbix Catalog"
          title={<>Five programs. Two ways to learn. <em>One outcome</em> — ahead.</>}
          subtitle="Four ERP tracks (SAP-led) — FICO, MM, SD, ABAP — plus a new AI Mastery program. Each runs as a self-paced individual program or as a campus cohort. Every course includes a complimentary personality development module."
          meta={[
            { value: '5', label: 'Programs' },
            { value: 'Live', label: 'Mentor-led + recorded' },
            { value: '2', label: 'Ways to learn' },
          ]}
        />
        <Tracks />
        <LearningExperience />
        <Certification />
        <FinalCta />
      </SpanbixLayout>
    </>
  );
}
