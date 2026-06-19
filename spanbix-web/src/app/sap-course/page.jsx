import SapCourseLanding from './SapCourseLanding';
import WhatsAppFloater from '@/components/spanbix/WhatsAppFloater';
import CallFloater from '@/components/spanbix/lp/CallFloater';
import { getGoogleReviews } from '@/lib/googleReviews';

// Dedicated Google Ads landing page for SAP training lead-gen.
//
// noindex: this is a paid-traffic landing page, intentionally kept out of the
// organic index so it doesn't compete with / duplicate the main /courses +
// /career-paths pages. `follow` so any links still pass equity. Flip to
// index:true only if you decide to also rank this page organically.
export const metadata = {
  title: 'SAP Training in India — Become a Job-Ready SAP Professional | Spanbix',
  description:
    'Live, mentor-led SAP training with hands-on practice and placement support. For graduates & professionals. Book a free callback — limited seats.',
  robots: { index: false, follow: true },
};

export default async function SapCoursePage() {
  const { reviews, rating, total } = await getGoogleReviews();
  return (
    <>
      <SapCourseLanding googleReviews={reviews} googleRating={rating} googleTotal={total} />
      {/* Floating click-to-call (navy) stacked above floating WhatsApp (green).
          Both fixed bottom-right; both fire attribution events. */}
      <CallFloater />
      <WhatsAppFloater />
    </>
  );
}
