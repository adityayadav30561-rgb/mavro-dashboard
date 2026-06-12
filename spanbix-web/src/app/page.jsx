import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import JsonLd from '@/components/JsonLd';
import Hero from '@/components/spanbix/redesign/Hero';
import HiringPartners from '@/components/spanbix/redesign/sections/HiringPartners';
import MarketValidation from '@/components/spanbix/redesign/sections/MarketValidation';
import WhySap from '@/components/spanbix/redesign/sections/WhySap';
import Tracks from '@/components/spanbix/redesign/sections/Tracks';
import LearningExperience from '@/components/spanbix/redesign/sections/LearningExperience';
import Placement from '@/components/spanbix/redesign/sections/Placement';
import Outcomes from '@/components/spanbix/redesign/sections/Outcomes';
import Campus from '@/components/spanbix/redesign/sections/Campus';
import FAQ from '@/components/spanbix/redesign/sections/FAQ';
import FinalCta from '@/components/spanbix/redesign/sections/FinalCta';
import { buildMetadata } from '@/lib/seoMeta';
import {
  SPANBIX_SITE,
  educationalOrganizationLd,
  websiteLd,
  faqLd,
} from '@/lib/spanbixSeo';

// landingFaqs feeds the FAQ JSON-LD. The on-page accordion in FAQ.jsx renders
// its own ordered set; keep both in lockstep when copy changes.
const landingFaqs = [
  { q: "I'm a commerce / MBA / engineering graduate. Which ERP track fits me?", a: 'Every background has a lane. Commerce, BBA, BCom, and MBA graduates own the functional tracks (FICO, MM, SD) — accounting, procurement, and sales sense matters more than coding. B.Tech, CS, and BCA graduates fit the technical and techno-functional tracks (ABAP, integrations). On the consultation call we map you to the track that matches your background and target salary.' },
  { q: 'How long does a track take to finish?', a: 'All four tracks run about 3 months end-to-end — curriculum, hands-on practice, capstone, and mock interview prep. Live mentor sessions are recorded and added to your library so you can revisit them anytime. Plan around 10–14 focused hours per week.' },
  { q: 'What does "placement support" actually mean?', a: 'Three things baked into the program: profile work (resume, LinkedIn, portfolio reviewed by working consultants), mock interviews tuned to real hiring-panel questions, and hiring partner connects when you finish. We also include a complimentary personality development module so the interview itself goes smoothly.' },
  { q: "What's the certification worth?", a: 'A Spanbix certificate is QR-verifiable, mentor-signed, and only issued after you actually finish — assessments, capstone, and mentor sign-off included. It signals that a working consultant validated your work, not that you sat through hours of video.' },
  { q: "I'm from a Tier-2 / Tier-3 city. Will this still work for me?", a: "Yes — that's precisely who Spanbix is built for. The whole program runs online: live mentor sessions, recorded library, and cloud-based hands-on practice. You don't need to relocate to a metro to start." },
  { q: 'I run a placement cell. How does the campus partnership work?', a: "Three steps. We do a free awareness workshop on your campus. Students who opt in roll into a structured cohort aligned to your academic calendar. You get a co-branded credential, regular T&P updates, and a cohort report at the end. Pricing follows the conversation with your team — every campus is different, and the personality development module is complimentary for campus cohorts." },
];

export const metadata = buildMetadata({
  title: `${SPANBIX_SITE.name} — ${SPANBIX_SITE.tagline}`,
  description: SPANBIX_SITE.metaDescription,
  keywords: SPANBIX_SITE.keywords,
  canonical: `${SPANBIX_SITE.url}/`,
  ogImage: SPANBIX_SITE.logo,
  ogType: 'website',
});

export default function HomePage() {
  return (
    <>
      <JsonLd data={[educationalOrganizationLd(), websiteLd(), faqLd(landingFaqs)]} />
      <SpanbixLayout>
        <Hero />
        <HiringPartners />
        <MarketValidation />
        <WhySap />
        <Tracks />
        <LearningExperience />
        <Placement />
        <Outcomes />
        <Campus />
        <FAQ />
        <FinalCta />
      </SpanbixLayout>
    </>
  );
}
