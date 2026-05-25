import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import Hero from '@/components/spanbix/redesign/Hero';
import HiringPartners from '@/components/spanbix/redesign/sections/HiringPartners';
import MarketValidation from '@/components/spanbix/redesign/sections/MarketValidation';
import WhySap from '@/components/spanbix/redesign/sections/WhySap';
import Tracks from '@/components/spanbix/redesign/sections/Tracks';
import Mentors from '@/components/spanbix/redesign/sections/Mentors';
import LearningExperience from '@/components/spanbix/redesign/sections/LearningExperience';
import Placement from '@/components/spanbix/redesign/sections/Placement';
import Outcomes from '@/components/spanbix/redesign/sections/Outcomes';
import Campus from '@/components/spanbix/redesign/sections/Campus';
import Certification from '@/components/spanbix/redesign/sections/Certification';
import FAQ from '@/components/spanbix/redesign/sections/FAQ';
import FinalCta from '@/components/spanbix/redesign/sections/FinalCta';
import useScrollReveal from '@/components/spanbix/redesign/useScrollReveal';
import useSEO from '@/hooks/useSEO';
import {
  SPANBIX_SITE,
  organizationLd,
  educationalOrganizationLd,
  faqLd,
} from '@/lib/spanbixSeo';

// landingFaqs kept here for FAQ JSON-LD. The on-page accordion in FAQ.jsx
// renders its own ordered set; keep both in lockstep when copy changes.
const landingFaqs = [
  { q: "I'm a BCom / BBA / MBA graduate. Can I really become an SAP consultant?", a: "Yes — and not just \"can\". You're actually the preferred profile for functional SAP roles (FICO, MM, SD). Companies need people who understand accounting, procurement, and sales — not people who can code. The \"SAP needs engineers\" myth is just that, a myth." },
  { q: 'How long does a track take to finish?', a: 'Functional tracks (FICO, MM, SD) run about 3.5 to 4 months end-to-end — curriculum, sandbox practice, capstone, mock interviews, and placement prep. The ABAP technical track runs 5 months because of the development depth. Plan around 10–14 focused hours per week.' },
  { q: 'What does "placement support" actually mean?', a: "Three concrete things, baked into the program from week one: profile building (resume + LinkedIn + portfolio rewrite reviewed by your mentor), referrals (your mentor introduces you to their hiring panel network), and hiring partner connects (direct interviews with employers we work with). Not a \"we'll add your name to a job board\" line item." },
  { q: "What's the certification worth?", a: 'A Spanbix certificate is QR-verifiable, mentor-signed, and only issued after you actually finish — assessments, capstone, and mentor sign-off included. It signals that a working consultant validated your work, not that you sat through hours of video.' },
  { q: "I'm from a Tier-2 / Tier-3 city. Will this still work for me?", a: "Yes — that's precisely who Spanbix is built for. The whole program runs online; mentor sessions are live, sandbox access is cloud-based, and our hiring partner network spans GCCs and SIs that hire remote or relocate candidates. You don't have to move to Bengaluru first." },
  { q: 'I run a placement cell. How does the campus partnership work?', a: 'Three steps. We do a free awareness workshop on your campus. Your students who opt in roll into a structured cohort (200–2,000 learners, 6 months). You get a T&P dashboard, attendance-linked progression, monthly cohort reports, and a co-branded certificate. Pricing follows the conversation with your team — every campus is different.' },
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

  useScrollReveal();

  return (
    <SpanbixLayout>
      <Hero />
      <HiringPartners />
      <MarketValidation />
      <WhySap />
      <Tracks />
      <Mentors />
      <LearningExperience />
      <Placement />
      <Outcomes />
      <Campus />
      <Certification />
      <FAQ />
      <FinalCta />
    </SpanbixLayout>
  );
}
