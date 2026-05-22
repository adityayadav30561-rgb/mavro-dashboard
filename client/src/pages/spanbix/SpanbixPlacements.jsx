import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import PageHero from '@/components/spanbix/PageHero';
import SuccessStories from '@/components/spanbix/SuccessStories';
import MarketValidation from '@/components/spanbix/MarketValidation';
import FinalCta from '@/components/spanbix/FinalCta';
import useSEO from '@/hooks/useSEO';
import { SPANBIX_SITE, breadcrumbLd } from '@/lib/spanbixSeo';

export default function SpanbixPlacements() {
  useSEO({
    title: `Placements & Success Stories — ${SPANBIX_SITE.name}`,
    description:
      'Verifiable placement outcomes from recent Spanbix cohorts — track, before/after CTC, hiring partner, and the work that made each offer possible.',
    keywords: ['SAP placement', 'SAP success stories', 'SAP career transformation', 'placement record'],
    canonical: `${SPANBIX_SITE.url}/placements`,
    ogImage: SPANBIX_SITE.logo,
    jsonLd: [
      breadcrumbLd([
        { name: 'Home', url: `${SPANBIX_SITE.url}/` },
        { name: 'Placements', url: `${SPANBIX_SITE.url}/placements` },
      ]),
    ],
  });

  return (
    <SpanbixLayout>
      <PageHero
        eyebrow="Placement Outcomes"
        title="Where Spanbix graduates actually end up working."
        subtitle="This page grows with every cohort that closes. Each entry below is a verified placement — track, hiring partner, before-and-after CTC. As we sign hiring-partner MoUs, partner names will start appearing alongside the stories. Until then, every detail is verifiable on request."
      />
      <SuccessStories />
      <MarketValidation />
      <FinalCta />
    </SpanbixLayout>
  );
}
