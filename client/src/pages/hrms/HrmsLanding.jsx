import HrmsLayout from '@/components/hrms/HrmsLayout';
import Hero from '@/components/hrms/Hero';
import TrustedBy from '@/components/hrms/TrustedBy';
import ProblemSolution from '@/components/hrms/ProblemSolution';
import Modules from '@/components/hrms/Modules';
import Automation from '@/components/hrms/Automation';
import Analytics from '@/components/hrms/Analytics';
import Mobile from '@/components/hrms/Mobile';
import WhyMavro from '@/components/hrms/WhyMavro';
import Testimonials from '@/components/hrms/Testimonials';
import FaqSection from '@/components/hrms/FaqSection';
import BlogPreview from '@/components/hrms/BlogPreview';
import ContactForm from '@/components/hrms/ContactForm';
import useSEO from '@/hooks/useSEO';
import {
  HRMS_SITE,
  organizationLd,
  softwareApplicationLd,
  faqLd,
} from '@/lib/hrmsSeo';

const landingFaqs = [
  { q: 'Can Mavro HRMS support large organizations?', a: 'Yes. The platform is designed for scalable multi-department workforce operations with role-based access, audit trails, and tenant-aware architecture.' },
  { q: 'Does the platform support role-based access?', a: 'Yes. Permissions and access levels can be configured by role and department with granular policy controls.' },
  { q: 'Can employees access the system themselves?',  a: 'Yes. Mavro HRMS includes a full employee self-service experience for documents, leaves, attendance, and profile management.' },
  { q: 'Does it support payroll workflows?',           a: 'Yes. Payroll management, salary structures, statutory compliance, and reimbursements are integrated end-to-end.' },
  { q: 'Is the platform mobile friendly?',             a: 'Yes. The experience is optimized for responsive and mobile usage, with native-feeling employee and manager interfaces.' },
];

export default function HrmsLanding() {
  useSEO({
    title: `${HRMS_SITE.name} — ${HRMS_SITE.tagline}`,
    description: HRMS_SITE.description,
    keywords: HRMS_SITE.keywords,
    canonical: `${HRMS_SITE.url}/hrms`,
    ogImage: HRMS_SITE.logo,
    ogType: 'website',
    jsonLd: [organizationLd(), softwareApplicationLd(), faqLd(landingFaqs)],
  });

  return (
    <HrmsLayout>
      <Hero />
      <TrustedBy />
      <ProblemSolution />
      <Modules />
      <Automation />
      <Analytics />
      <Mobile />
      <WhyMavro />
      <Testimonials />
      <BlogPreview />
      <FaqSection />
      <ContactForm />
    </HrmsLayout>
  );
}
