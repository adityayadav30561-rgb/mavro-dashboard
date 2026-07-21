import LegalPage from '@/components/spanbix/LegalPage';
import { buildMetadata } from '@/lib/seoMeta';
import { SPANBIX_SITE } from '@/lib/spanbixSeo';

export const metadata = buildMetadata({
  title: `Refund Policy — ${SPANBIX_SITE.name}`,
  description: 'Spanbix refund and cancellation policy for training programs and enrolments.',
  canonical: `${SPANBIX_SITE.url}/refund`,
  ogImage: SPANBIX_SITE.logo,
});

const SECTIONS = [
  {
    h: 'Overview',
    p: [
      'This Refund Policy explains how cancellations and refunds are handled for fees paid for Spanbix training programs. The specific terms applicable to your enrolment — including any program-specific conditions — are communicated to you at the time of enrolment, and those enrolment terms prevail in case of any inconsistency.',
    ],
  },
  {
    h: 'Enrolment and Fees',
    p: [
      'Program details, batch schedule, inclusions, and applicable fees are shared with you before enrolment. Completing payment confirms your enrolment and your acceptance of this Policy and the applicable enrolment terms.',
    ],
  },
  {
    h: 'Cancellation and Cooling-Off',
    p: [
      'If you wish to cancel, you may request a refund within the cancellation window communicated to you at the time of enrolment, provided the program or batch has not yet commenced and program access or materials have not been issued. Approved refunds in this window may be subject to deduction of applicable processing, onboarding, or transaction charges.',
    ],
  },
  {
    h: 'Non-Refundable Circumstances',
    p: ['Refunds are generally not available where:'],
    ul: [
      'The program or batch has commenced, or access to sessions, recordings, or materials has been provided.',
      'The request falls outside the cancellation window communicated at enrolment.',
      'The enrolment was made under a promotional, discounted, or expressly non-refundable offer.',
      'There has been a breach of our Terms of Service or misuse of the services.',
      'Sessions were missed or the program was not completed for reasons attributable to the participant.',
    ],
  },
  {
    h: 'How to Request a Refund',
    p: [
      <>To request a refund, email <a href="mailto:contact@spanbix.com" style={{ color: 'var(--sx-navy)', textDecoration: 'underline' }}>contact@spanbix.com</a> from your registered email with your enrolment details and the reason for your request. We will review each request in line with this Policy and your enrolment terms.</>,
    ],
  },
  {
    h: 'Processing of Refunds',
    p: [
      'Where a refund is approved, it will be processed to the original payment method within a reasonable period. The applicable timeline will be communicated to you and may vary depending on your payment provider.',
    ],
  },
  {
    h: 'Changes to This Policy',
    p: [
      'We may update this Policy from time to time. Changes are effective when posted on this page. The refund terms applicable to your enrolment are those in effect, together with the enrolment terms, at the time of your enrolment.',
    ],
  },
  {
    h: 'Contact',
    p: [
      <>For any refund-related questions, contact us at <a href="mailto:contact@spanbix.com" style={{ color: 'var(--sx-navy)', textDecoration: 'underline' }}>contact@spanbix.com</a> or {SPANBIX_SITE.phone}.</>,
    ],
  },
];

export default function RefundPage() {
  return <LegalPage title="Refund Policy" updated="19 June 2026" intro="This Policy describes how cancellations and refunds are handled for enrolments with Spanbix Technologies Private Limited (&quot;Spanbix&quot;)." sections={SECTIONS} />;
}
