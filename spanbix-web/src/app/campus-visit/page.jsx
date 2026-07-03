import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import CampusVisitForm from './CampusVisitForm';
import JsonLd from '@/components/JsonLd';
import { buildMetadata } from '@/lib/seoMeta';
import { SPANBIX_SITE, breadcrumbLd } from '@/lib/spanbixSeo';

// `/campus-visit` — dedicated lead-capture page shared with college campuses
// (T&P offices, student groups). Mirrors the `/enquire` WhatsApp-share pattern:
// submissions land in the admin Leads inbox tagged `formId: 'spanbix-campus'`,
// keeping them separate from `/contact` and `/enquire` traffic. The form asks
// for a preferred date + time so the team can schedule the campus session
// around the attendee's availability.
//
// SEO posture: marketing-noindex'd — people receive this URL by direct share,
// search engines don't need it. Same as /enquire.

export async function generateMetadata() {
  return {
    ...buildMetadata({
      title: `Campus Session Booking — ${SPANBIX_SITE.name}`,
      description: 'Register for a Spanbix campus session — share your details and pick a date and time that works for you.',
      canonical: `${SPANBIX_SITE.url}/campus-visit`,
      ogImage: SPANBIX_SITE.logo,
      ogType: 'website',
    }),
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    },
  };
}

export default function CampusVisitPage() {
  const url = `${SPANBIX_SITE.url}/campus-visit`;
  const ld = [
    breadcrumbLd([
      { name: 'Home', url: `${SPANBIX_SITE.url}/` },
      { name: 'Campus Session Booking', url },
    ]),
  ];

  return (
    <>
      <JsonLd data={ld} />
      <SpanbixLayout>
        <CampusVisitForm />
      </SpanbixLayout>
    </>
  );
}
