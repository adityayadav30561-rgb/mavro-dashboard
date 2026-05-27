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
    "Explore Spanbix's ERP course catalog — four SAP-led tracks (FICO, MM, SD, ABAP) with live mentorship, hands-on configuration, and a complimentary personality development module.",
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
          title={<>Four programs. Two ways to learn. <em>One outcome</em> — placed.</>}
          subtitle="Four ERP tracks (SAP-led) — FICO, MM, SD, ABAP. Each runs as a self-paced individual program or as a campus cohort. Every course includes a complimentary personality development module."
          meta={[
            { value: '4', label: 'Active ERP tracks' },
            { value: '3 mo', label: 'Course duration' },
            { value: 'Live', label: 'Mentor-led + recorded' },
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
