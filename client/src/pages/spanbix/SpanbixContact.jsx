import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import PageHero from '@/components/spanbix/PageHero';
import ContactForm from '@/components/spanbix/ContactForm';
import useSEO from '@/hooks/useSEO';
import { SPANBIX_SITE, breadcrumbLd } from '@/lib/spanbixSeo';

export default function SpanbixContact() {
  useSEO({
    title: `Contact — ${SPANBIX_SITE.name}`,
    description:
      'Book a free career consultation with a Spanbix strategist. Plan the right SAP track and placement path for your background.',
    keywords: ['contact Spanbix', 'career consultation', 'SAP training contact', 'book consultation'],
    canonical: `${SPANBIX_SITE.url}/contact`,
    ogImage: SPANBIX_SITE.logo,
    jsonLd: [
      breadcrumbLd([
        { name: 'Home', url: `${SPANBIX_SITE.url}/` },
        { name: 'Contact', url: `${SPANBIX_SITE.url}/contact` },
      ]),
    ],
  });

  return (
    <SpanbixLayout>
      <PageHero
        eyebrow="Talk To Us"
        title="One conversation. Then you decide."
        subtitle="Career consultation, campus partnership enquiry, or a hiring-partner conversation — pick your lane below. A Spanbix team member reaches back within a working day. No automated chatbots, no scripted scripts, no upselling."
      />
      <ContactForm />
    </SpanbixLayout>
  );
}
