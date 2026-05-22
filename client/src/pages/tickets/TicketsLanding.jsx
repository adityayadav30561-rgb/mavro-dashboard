import TicketsLayout from '@/components/tickets/TicketsLayout';
import Hero from '@/components/tickets/Hero';
import TrustedBy from '@/components/tickets/TrustedBy';
import ProblemSolution from '@/components/tickets/ProblemSolution';
import WorkflowVisualizer from '@/components/tickets/WorkflowVisualizer';
import Modules from '@/components/tickets/Modules';
import SLASection from '@/components/tickets/SLASection';
import Automation from '@/components/tickets/Automation';
import Analytics from '@/components/tickets/Analytics';
import Collaboration from '@/components/tickets/Collaboration';
import Security from '@/components/tickets/Security';
import Testimonials from '@/components/tickets/Testimonials';
import FaqSection, { ticketsFaqs } from '@/components/tickets/FaqSection';
import BlogPreview from '@/components/tickets/BlogPreview';
import ContactForm from '@/components/tickets/ContactForm';
import useSEO from '@/hooks/useSEO';
import {
  TICKETS_SITE, organizationLd, softwareApplicationLd, faqLd,
} from '@/lib/ticketsSeo';

export default function TicketsLanding() {
  useSEO({
    title: `${TICKETS_SITE.name} — ${TICKETS_SITE.tagline}`,
    description: TICKETS_SITE.description,
    keywords: TICKETS_SITE.keywords,
    canonical: `${TICKETS_SITE.url}/tickets`,
    ogImage: TICKETS_SITE.logo,
    ogType: 'website',
    jsonLd: [organizationLd(), softwareApplicationLd(), faqLd(ticketsFaqs)],
  });

  return (
    <TicketsLayout>
      <Hero />
      <TrustedBy />
      <ProblemSolution />
      <WorkflowVisualizer />
      <Modules />
      <SLASection />
      <Automation />
      <Analytics />
      <Collaboration />
      <Security />
      <Testimonials />
      <BlogPreview />
      <FaqSection />
      <ContactForm />
    </TicketsLayout>
  );
}
