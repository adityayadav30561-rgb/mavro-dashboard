import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import Hero from '@/components/spanbix/Hero';
import MarketValidation from '@/components/spanbix/MarketValidation';
import WhySap from '@/components/spanbix/WhySap';
import CareerPaths from '@/components/spanbix/CareerPaths';
import IndustryExperts from '@/components/spanbix/IndustryExperts';
import LearningExperience from '@/components/spanbix/LearningExperience';
import DemoClasses from '@/components/spanbix/DemoClasses';
import CampusPrograms from '@/components/spanbix/CampusPrograms';
import SuccessStories from '@/components/spanbix/SuccessStories';
import Certifications from '@/components/spanbix/Certifications';
import PlacementSupport from '@/components/spanbix/PlacementSupport';
import FinalCta from '@/components/spanbix/FinalCta';
import ContactForm from '@/components/spanbix/ContactForm';
import useSEO from '@/hooks/useSEO';
import {
  SPANBIX_SITE,
  organizationLd,
  educationalOrganizationLd,
  faqLd,
} from '@/lib/spanbixSeo';

const landingFaqs = [
  {
    q: 'I\'m a BCom / BBA / MBA graduate. Can I really become an SAP consultant?',
    a: 'Yes — and not just "can". You\'re actually the preferred profile for functional SAP roles (FICO, MM, SD). Companies need people who understand accounting, procurement, and sales — not people who can code. The "SAP needs engineers" myth is just that, a myth.',
  },
  {
    q: 'How long does a track take to finish?',
    a: 'Functional tracks (FICO, MM, SD) run about 3.5 to 4 months end-to-end — curriculum, sandbox practice, capstone, mock interviews, and placement prep. The ABAP technical track runs 5 months because of the development depth. Plan around 10–14 focused hours per week.',
  },
  {
    q: 'What does "placement support" actually mean?',
    a: 'Three concrete things, baked into the program from week one: profile building (resume + LinkedIn + portfolio rewrite reviewed by your mentor), referrals (your mentor introduces you to their hiring panel network), and hiring partner connects (direct interviews with employers we work with). Not a "we\'ll add your name to a job board" line item.',
  },
  {
    q: 'What\'s the certification worth?',
    a: 'A Spanbix certificate is QR-verifiable and only issued after you actually finish — assessments, capstone, and mentor sign-off included. The curriculum maps to SAP\'s official C_TS associate / specialist exam blueprints, so the same prep lets you sit the global exam confidently.',
  },
  {
    q: 'I\'m from a Tier-2 / Tier-3 city. Will this still work for me?',
    a: 'Yes — that\'s precisely who Spanbix is built for. The whole program runs online; mentor sessions are live, sandbox access is cloud-based, and our hiring partner network spans GCCs and SIs that hire remote or relocate candidates. You don\'t have to move to Bengaluru first.',
  },
  {
    q: 'I run a placement cell. How does the campus partnership work?',
    a: 'Three steps. We do a free awareness workshop on your campus. Your students who opt in roll into a structured cohort (200–2,000 learners, 6 months, AICTE / NAAC-aligned). You get a T&P dashboard, attendance-linked progression, monthly cohort reports, and a co-branded certificate. Pricing follows the conversation with your team — every campus is different.',
  },
];

export default function SpanbixLanding() {
  useSEO({
    title: `${SPANBIX_SITE.name} — ${SPANBIX_SITE.tagline}`,
    description: SPANBIX_SITE.description,
    keywords: SPANBIX_SITE.keywords,
    canonical: `${SPANBIX_SITE.url}/`,
    ogImage: SPANBIX_SITE.logo,
    ogType: 'website',
    jsonLd: [organizationLd(), educationalOrganizationLd(), faqLd(landingFaqs)],
  });

  return (
    <SpanbixLayout>
      <Hero />
      <MarketValidation />
      <WhySap />
      <CareerPaths />
      <IndustryExperts />
      <LearningExperience />
      <PlacementSupport />
      <CampusPrograms />
      <SuccessStories />
      <Certifications />
      <DemoClasses />
      <FinalCta />
      <ContactForm />
    </SpanbixLayout>
  );
}
