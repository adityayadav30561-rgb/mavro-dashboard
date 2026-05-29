import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import EnquireForm from './EnquireForm';
import JsonLd from '@/components/JsonLd';
import { buildMetadata } from '@/lib/seoMeta';
import { SPANBIX_SITE, breadcrumbLd } from '@/lib/spanbixSeo';

// `/enquire` — dedicated lead-capture page intended for direct WhatsApp /
// 1-to-1 outreach scenarios. The team shares this URL when chatting with a
// prospect; submissions land in the admin Leads inbox tagged with
// `formId: 'spanbix-whatsapp'`, separating them cleanly from the organic
// `/contact` submissions. Distinct visual identity (cream card, centered
// single column, no contact-coordinates aside) so it reads as a focused
// follow-up form rather than a marketing CTA.
//
// SEO posture: marketing-noindex'd via `robots: { index: false, follow: false }`.
// Search engines don't need this URL; people receive it by direct share. Keeps
// the search-indexed surface focused on /contact for organic queries.

export async function generateMetadata() {
  return {
    ...buildMetadata({
      title: `Quick Enquiry — ${SPANBIX_SITE.name}`,
      description: 'Share a few details and a Spanbix career strategist will reach out within one business day.',
      canonical: `${SPANBIX_SITE.url}/enquire`,
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

export default function EnquirePage() {
  const url = `${SPANBIX_SITE.url}/enquire`;
  const ld = [
    breadcrumbLd([
      { name: 'Home', url: `${SPANBIX_SITE.url}/` },
      { name: 'Quick Enquiry', url },
    ]),
  ];

  return (
    <>
      <JsonLd data={ld} />
      <SpanbixLayout>
        <EnquireForm />
      </SpanbixLayout>
    </>
  );
}
