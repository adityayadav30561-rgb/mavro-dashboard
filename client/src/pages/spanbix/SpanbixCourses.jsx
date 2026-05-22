import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import CareerPaths from '@/components/spanbix/CareerPaths';
import Certifications from '@/components/spanbix/Certifications';
import LearningExperience from '@/components/spanbix/LearningExperience';
import FinalCta from '@/components/spanbix/FinalCta';
import PageHero from '@/components/spanbix/PageHero';
import useSEO from '@/hooks/useSEO';
import { SPANBIX_SITE, SPANBIX_CAREER_PATHS, breadcrumbLd, courseLd } from '@/lib/spanbixSeo';

export default function SpanbixCourses() {
  useSEO({
    title: `Courses — ${SPANBIX_SITE.name}`,
    description:
      'Explore Spanbix\'s SAP and enterprise technology course catalog — structured tracks across FICO, MM, SD, ABAP, HCM, BASIS, Analytics, and SuccessFactors.',
    keywords: ['SAP courses', 'SAP training', 'SAP FICO course', 'SAP MM course', 'SAP ABAP', 'enterprise technology courses'],
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

  return (
    <SpanbixLayout>
      <PageHero
        eyebrow="Course Catalog"
        title="Built to be the fastest path from 'I don't know SAP' to 'I'm placed'."
        subtitle="Every track is engineered for placement, not engagement metrics. Structured curriculum, working consultant mentorship, a live sandbox you actually configure, and a recruiter-verifiable capstone — in a timeline that respects your job, your college, and your life."
      />
      <CareerPaths />
      <LearningExperience />
      <Certifications />
      <FinalCta />
    </SpanbixLayout>
  );
}
