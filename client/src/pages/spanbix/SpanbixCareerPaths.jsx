import { Link } from 'react-router-dom';
import { Star, Clock, TrendingUp } from 'lucide-react';
import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import PageHero from '@/components/spanbix/redesign/PageHero';
import Tracks from '@/components/spanbix/redesign/sections/Tracks';
import Mentors from '@/components/spanbix/redesign/sections/Mentors';
import FinalCta from '@/components/spanbix/redesign/sections/FinalCta';
import { Arrow } from '@/components/spanbix/redesign/Arrow';
import useScrollReveal from '@/components/spanbix/redesign/useScrollReveal';
import useSEO from '@/hooks/useSEO';
import {
  SPANBIX_CAREER_PATHS,
  SPANBIX_SITE,
  breadcrumbLd,
  courseLd,
} from '@/lib/spanbixSeo';
import { withSpanbixBase } from '@/lib/routeBase';

// Career-paths page — magazine catalog. Hero + Tracks tab section + a flat
// catalog table of every track (functional + technical) + Mentors + FinalCta.

const TONE_BY_CATEGORY = {
  functional: 'rose',
  technical: 'slate',
};

export default function SpanbixCareerPaths() {
  useSEO({
    title: `Career Paths — ${SPANBIX_SITE.name}`,
    description:
      'Structured ERP career paths (SAP-led) for commerce, MBA, and engineering graduates — FICO, MM, SD, ABAP. Live mentorship, hands-on configuration, and a complimentary personality development module with every track.',
    keywords: ['ERP career paths', 'SAP FICO career', 'SAP MM career', 'SAP ABAP career', 'ERP career India'],
    canonical: `${SPANBIX_SITE.url}/career-paths`,
    ogImage: SPANBIX_SITE.logo,
    jsonLd: [
      breadcrumbLd([
        { name: 'Home', url: `${SPANBIX_SITE.url}/` },
        { name: 'Career Paths', url: `${SPANBIX_SITE.url}/career-paths` },
      ]),
      ...SPANBIX_CAREER_PATHS.map(courseLd),
    ],
  });
  useScrollReveal();

  return (
    <SpanbixLayout>
      <PageHero
        eyebrow="Career Paths"
        title={<>Pick the ERP track that fits <em>your background</em>.</>}
        subtitle="Four ERP tracks (SAP-led) — FICO, MM, SD, ABAP. Each path is a self-contained career layer with curriculum, mentor reviews, sandbox practice, and a capstone. Functional tracks for commerce + MBA grads, technical for engineering."
        meta={[
          { value: '4', label: 'Active ERP tracks' },
          { value: '3 mo', label: 'Course duration' },
          { value: '2', label: 'Categories — Functional + Technical' },
        ]}
      />

      <Tracks />

      <Mentors />
      <FinalCta />
    </SpanbixLayout>
  );
}
