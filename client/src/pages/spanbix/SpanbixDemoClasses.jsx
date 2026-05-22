import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import PageHero from '@/components/spanbix/PageHero';
import DemoClasses from '@/components/spanbix/DemoClasses';
import IndustryExperts from '@/components/spanbix/IndustryExperts';
import ContactForm from '@/components/spanbix/ContactForm';
import useSEO from '@/hooks/useSEO';
import { SPANBIX_SITE, breadcrumbLd } from '@/lib/spanbixSeo';

export default function SpanbixDemoClasses() {
  useSEO({
    title: `Free Demo Classes — ${SPANBIX_SITE.name}`,
    description:
      'Full-length sample SAP sessions from working consultants. Watch real teaching depth before booking a career consultation.',
    keywords: ['SAP demo class', 'SAP free training', 'SAP preview', 'free SAP workshop'],
    canonical: `${SPANBIX_SITE.url}/demo-classes`,
    ogImage: SPANBIX_SITE.logo,
    jsonLd: [
      breadcrumbLd([
        { name: 'Home', url: `${SPANBIX_SITE.url}/` },
        { name: 'Demo Classes', url: `${SPANBIX_SITE.url}/demo-classes` },
      ]),
    ],
  });

  return (
    <SpanbixLayout>
      <PageHero
        eyebrow="Free Demo Classes"
        title="Sample the real teaching. Then decide if it's for you."
        subtitle="Most platforms hide their actual instructors behind 30-second highlight reels. Spanbix shows you a full session — same mentor, same sandbox, same depth a paid learner gets. Watch, judge the teaching against your standard, then talk to us."
      />
      <DemoClasses />
      <IndustryExperts />
      <ContactForm />
    </SpanbixLayout>
  );
}
