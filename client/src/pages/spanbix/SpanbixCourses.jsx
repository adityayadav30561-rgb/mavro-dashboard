import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import PageHero from '@/components/spanbix/redesign/PageHero';
import Tracks from '@/components/spanbix/redesign/sections/Tracks';
import LearningExperience from '@/components/spanbix/redesign/sections/LearningExperience';
import Certification from '@/components/spanbix/redesign/sections/Certification';
import FinalCta from '@/components/spanbix/redesign/sections/FinalCta';
import useScrollReveal from '@/components/spanbix/redesign/useScrollReveal';
import useSEO from '@/hooks/useSEO';
import { SPANBIX_SITE, SPANBIX_CAREER_PATHS, breadcrumbLd, courseLd } from '@/lib/spanbixSeo';

export default function SpanbixCourses() {
  useSEO({
    title: `Courses — ${SPANBIX_SITE.name}`,
    description:
      "Explore Spanbix's SAP and ERP course catalog — structured functional + technical tracks built around the modules with the deepest hiring pipelines in India.",
    keywords: ['SAP courses', 'SAP training', 'SAP FICO course', 'SAP MM course', 'SAP ABAP', 'ERP careers'],
    canonical: `${SPANBIX_SITE.url}/courses`,
    ogImage: SPANBIX_SITE.logo,
    jsonLd: [
      breadcrumbLd([
        { name: 'Home', url: `${SPANBIX_SITE.url}/` },
        { name: 'Courses', url: `${SPANBIX_SITE.url}/courses` },
      ]),
      ...SPANBIX_CAREER_PATHS.map(courseLd),
    ],
  });
  useScrollReveal();

  return (
    <SpanbixLayout>
      <PageHero
        eyebrow="The Spanbix Catalog"
        title={<>Four SAP tracks. <em>One outcome</em> — placed.</>}
        subtitle="We don't run a 47-course catalog. We run the SAP modules with the deepest hiring pipelines in India — each track works as a self-paced individual program for solo learners, or as a campus cohort tied to your college's placement calendar."
        meta={[
          { value: '4', label: 'Active SAP tracks' },
          { value: '₹14.2L', label: 'Median placed CTC' },
          { value: '142+', label: 'Placements last 12 months' },
        ]}
      />
      <Tracks />
      <LearningExperience />
      <Certification />
      <FinalCta />
    </SpanbixLayout>
  );
}
