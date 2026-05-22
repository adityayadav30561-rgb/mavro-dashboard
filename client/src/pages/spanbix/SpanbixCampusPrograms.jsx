import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import CampusPrograms from '@/components/spanbix/CampusPrograms';
import Certifications from '@/components/spanbix/Certifications';
import CampusCoursesCatalog from '@/components/spanbix/CampusCoursesCatalog';
import ContactForm from '@/components/spanbix/ContactForm';
import useSEO from '@/hooks/useSEO';
import { SPANBIX_SITE, breadcrumbLd } from '@/lib/spanbixSeo';

export default function SpanbixCampusPrograms() {
  useSEO({
    title: `Campus Programs — ${SPANBIX_SITE.name}`,
    description:
      'Spanbix Campus brings enterprise technology readiness into engineering and management colleges — operated by your T&P office, powered by Spanbix.',
    keywords: ['campus partnership', 'T&P program', 'engineering college SAP', 'university SAP training', 'placement program'],
    canonical: `${SPANBIX_SITE.url}/campus-programs`,
    ogImage: SPANBIX_SITE.logo,
    jsonLd: [
      breadcrumbLd([
        { name: 'Home', url: `${SPANBIX_SITE.url}/` },
        { name: 'Campus Programs', url: `${SPANBIX_SITE.url}/campus-programs` },
      ]),
    ],
  });

  // Note: no PageHero on this subpage. The CampusPrograms section is itself a
  // full navy hero unit — stacking PageHero on top produces two navy blocks
  // back-to-back with redundant "Campus Programs" eyebrows. CampusPrograms
  // already carries the canonical headline + subtitle for this surface.

  return (
    <SpanbixLayout>
      <CampusPrograms />
      <Certifications />
      <CampusCoursesCatalog />
      <ContactForm />
    </SpanbixLayout>
  );
}
