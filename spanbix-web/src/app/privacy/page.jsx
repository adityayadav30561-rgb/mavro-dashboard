import LegalPage from '@/components/spanbix/LegalPage';
import { buildMetadata } from '@/lib/seoMeta';
import { SPANBIX_SITE } from '@/lib/spanbixSeo';

export const metadata = buildMetadata({
  title: `Privacy Policy — ${SPANBIX_SITE.name}`,
  description: 'How Spanbix collects, uses, protects, and shares your personal data, and your rights under India\'s Digital Personal Data Protection Act, 2023.',
  canonical: `${SPANBIX_SITE.url}/privacy`,
  ogImage: SPANBIX_SITE.logo,
});

const SECTIONS = [
  {
    h: 'Introduction',
    p: [
      'Spanbix ("Spanbix", "we", "us", or "our") provides SAP and enterprise-technology training, mentorship, and career services. This Privacy Policy explains how we collect, use, disclose, and safeguard personal data when you visit our website or interact with our forms and services.',
      'By using our website or submitting any form, you confirm that you have read and understood this Policy. We process personal data in accordance with applicable Indian law, including the Digital Personal Data Protection Act, 2023 (DPDP Act).',
    ],
  },
  {
    h: 'Information We Collect',
    p: ['We collect only the information needed to respond to your enquiry and provide our services:'],
    ul: [
      'Information you provide: name, email address, phone number, educational background, area of interest, and any message or details you choose to share through our forms.',
      'Information collected automatically: basic device, browser, and usage data, and information collected through cookies and analytics tools to understand how our website is used.',
      'We do not intentionally collect sensitive personal data, and we ask that you do not submit such information through our forms.',
    ],
  },
  {
    h: 'How We Use Your Information',
    p: ['We use your personal data to:'],
    ul: [
      'Respond to your enquiries and provide career counselling and information about our programs.',
      'Deliver, operate, maintain, and improve our services and website.',
      'Communicate with you about courses, schedules, and updates you have requested.',
      'Analyse usage to improve content and user experience.',
      'Comply with legal obligations and protect our rights.',
    ],
  },
  {
    h: 'Consent and Legal Basis',
    p: [
      'We process your personal data on the basis of the consent you provide when you submit a form, along with other lawful bases permitted under applicable law. Your consent is sought in a clear and specific manner before collection.',
      'You may withdraw your consent at any time by contacting us using the details below. Withdrawing consent will not affect the lawfulness of processing carried out before withdrawal, and may limit our ability to provide certain services.',
    ],
  },
  {
    h: 'How We Share Information',
    p: ['We do not sell your personal data. We may share it only as follows:'],
    ul: [
      'With trusted service providers (such as hosting, communication, and analytics providers) who process data on our behalf under appropriate confidentiality obligations.',
      'Where required by law, regulation, legal process, or a governmental authority.',
      'In connection with a business transfer, merger, or reorganisation, subject to this Policy.',
    ],
  },
  {
    h: 'Cookies and Analytics',
    p: [
      'We use cookies and similar technologies, including third-party analytics, to operate the website, remember preferences, and understand usage. You can control or disable cookies through your browser settings, though some features may not function as intended.',
    ],
  },
  {
    h: 'Data Retention',
    p: [
      'We retain personal data only for as long as necessary to fulfil the purposes described in this Policy, or as required to comply with legal, accounting, or reporting obligations. When no longer required, data is deleted or anonymised.',
    ],
  },
  {
    h: 'Data Security',
    p: [
      'We maintain reasonable technical and organisational measures designed to protect personal data against unauthorised access, alteration, disclosure, or destruction. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.',
    ],
  },
  {
    h: 'Your Rights',
    p: ['Subject to applicable law, you may have the right to:'],
    ul: [
      'Access the personal data we hold about you and request information about its processing.',
      'Request correction of inaccurate or incomplete data.',
      'Request erasure of your personal data, subject to legal retention requirements.',
      'Withdraw consent previously given.',
      'Raise a grievance regarding the handling of your personal data.',
    ],
  },
  {
    h: 'Children',
    p: [
      'Our services are intended for individuals aged 18 and above. We do not knowingly collect personal data from minors. If you believe a minor has provided us data, please contact us so we can address it.',
    ],
  },
  {
    h: 'Third-Party Links',
    p: [
      'Our website may contain links to third-party websites or services. We are not responsible for the privacy practices of those third parties, and we encourage you to review their policies.',
    ],
  },
  {
    h: 'Changes to This Policy',
    p: [
      'We may update this Policy from time to time. Changes are effective when posted on this page with a revised "Last updated" date. We encourage you to review this page periodically.',
    ],
  },
  {
    h: 'Grievance Officer and Contact',
    p: [
      'For any questions, requests, or grievances relating to your personal data or this Policy, you may contact our Grievance Officer:',
      <>Email: <a href="mailto:contact@spanbix.com" style={{ color: 'var(--sx-navy)', textDecoration: 'underline' }}>contact@spanbix.com</a> &nbsp;·&nbsp; Phone: {SPANBIX_SITE.phone}</>,
      `Address: ${SPANBIX_SITE.address.street}, ${SPANBIX_SITE.address.locality}, ${SPANBIX_SITE.address.region} ${SPANBIX_SITE.address.postalCode}, India.`,
      'We will acknowledge and address grievances within a reasonable time in accordance with applicable law.',
    ],
  },
];

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" updated="19 June 2026" intro="Your privacy matters to us. This Policy describes how Spanbix handles your personal data." sections={SECTIONS} />;
}
