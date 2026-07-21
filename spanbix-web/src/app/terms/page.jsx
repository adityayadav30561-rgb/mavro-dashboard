import LegalPage from '@/components/spanbix/LegalPage';
import { buildMetadata } from '@/lib/seoMeta';
import { SPANBIX_SITE } from '@/lib/spanbixSeo';

export const metadata = buildMetadata({
  title: `Terms of Service — ${SPANBIX_SITE.name}`,
  description: 'The terms governing your use of the Spanbix website, training programs, and services.',
  canonical: `${SPANBIX_SITE.url}/terms`,
  ogImage: SPANBIX_SITE.logo,
});

const SECTIONS = [
  {
    h: 'Acceptance of Terms',
    p: [
      'These Terms of Service ("Terms") govern your access to and use of the Spanbix website, training programs, and related services. By using our website, submitting a form, or enrolling in a program, you agree to these Terms. If you do not agree, please do not use our services.',
    ],
  },
  {
    h: 'Our Services',
    p: [
      'Spanbix provides SAP and enterprise-technology training, mentorship, assessments, and career-readiness support, delivered primarily online. The scope, structure, and inclusions of each program are described at the time of enrolment.',
    ],
  },
  {
    h: 'Eligibility',
    p: [
      'You must be at least 18 years of age and capable of entering into a binding agreement to use our services. You agree to provide accurate, current, and complete information and to keep it updated.',
    ],
  },
  {
    h: 'Enrolment and Fees',
    p: [
      'Enrolment in a program is subject to confirmation by Spanbix and to the specific terms, schedule, and fees communicated to you at the time of enrolment. Those enrolment terms, together with these Terms, govern your participation.',
    ],
  },
  {
    h: 'Use of Services and User Conduct',
    p: ['You agree to use our services lawfully and for your own learning. In particular, you agree not to:'],
    ul: [
      'Share your account, access credentials, or course materials with any third party.',
      'Copy, record, redistribute, resell, or publicly share our content without written permission.',
      'Disrupt, misuse, or attempt to gain unauthorised access to our systems or services.',
      'Use our services for any unlawful, infringing, or harmful purpose.',
    ],
  },
  {
    h: 'Intellectual Property',
    p: [
      'All content, curriculum, materials, branding, and software made available through our services are owned by or licensed to Spanbix and are protected by applicable intellectual property laws. You receive a limited, personal, non-transferable right to access them for your own learning, and no other rights are granted.',
    ],
  },
  {
    h: 'No Guarantee of Outcomes',
    p: [
      'Our programs are educational. While we provide placement-readiness support, we do not guarantee any job, placement, internship, salary, or specific career outcome. Results depend on individual effort, ability, market conditions, and other factors outside our control.',
      'Any certificate issued by Spanbix is our own credential awarded on completion of our requirements. It is not a certification issued by, equivalent to, or endorsed by any third party.',
    ],
  },
  {
    h: 'Third-Party Trademarks',
    p: [
      'SAP and other product, company, and brand names referenced on our website or in our materials are the trademarks of their respective owners and are used for descriptive purposes only. Spanbix is an independent training provider and is not affiliated with, authorised by, or endorsed by any such third party unless expressly stated.',
    ],
  },
  {
    h: 'Information You Submit',
    p: [
      'You are responsible for the information you provide to us. By submitting content or information, you confirm it is accurate and that you have the right to share it, and you grant us permission to use it as needed to provide our services and respond to you.',
    ],
  },
  {
    h: 'Disclaimers',
    p: [
      'Our website and services are provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied, to the maximum extent permitted by law. We do not warrant that the services will be uninterrupted, error-free, or free of harmful components.',
    ],
  },
  {
    h: 'Limitation of Liability',
    p: [
      'To the maximum extent permitted by applicable law, Spanbix and its team shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits, data, or goodwill, arising from your use of (or inability to use) our services. To the extent any liability cannot be excluded, it shall be limited to the amount paid by you to Spanbix for the relevant service.',
    ],
  },
  {
    h: 'Indemnity',
    p: [
      'You agree to indemnify and hold Spanbix harmless from any claims, damages, or expenses arising out of your misuse of the services or your breach of these Terms or applicable law.',
    ],
  },
  {
    h: 'Refunds',
    p: [
      'Payments and refunds are governed by our Refund Policy and the enrolment terms communicated to you at the time of enrolment.',
    ],
  },
  {
    h: 'Changes to Terms and Services',
    p: [
      'We may modify these Terms or our services at any time. Updated Terms are effective when posted on this page. Your continued use of the services after changes are posted constitutes acceptance of the revised Terms.',
    ],
  },
  {
    h: 'Governing Law and Jurisdiction',
    p: [
      'These Terms are governed by the laws of India. Subject to applicable law, the courts at Gautam Buddh Nagar (Greater Noida), Uttar Pradesh, shall have exclusive jurisdiction over any dispute arising out of or relating to these Terms or our services.',
    ],
  },
  {
    h: 'Contact',
    p: [
      <>Questions about these Terms? Email <a href="mailto:contact@spanbix.com" style={{ color: 'var(--sx-navy)', textDecoration: 'underline' }}>contact@spanbix.com</a> or call {SPANBIX_SITE.phone}.</>,
    ],
  },
];

export default function TermsPage() {
  return <LegalPage title="Terms of Service" updated="19 June 2026" intro="These Terms govern your use of the website and services operated by Spanbix Technologies Private Limited (&quot;Spanbix&quot;). Please read them carefully." sections={SECTIONS} />;
}
