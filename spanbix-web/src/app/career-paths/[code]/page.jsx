import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import { buildMetadata } from '@/lib/seoMeta';
import {
  SPANBIX_SITE,
  SPANBIX_CAREER_PATHS,
  getCareerPath,
  breadcrumbLd,
  courseLd,
} from '@/lib/spanbixSeo';
import CourseDetailView from './CourseDetailView';
import { fetchRelatedBlogs, MODULE_BLOG_MATCH } from '@/lib/blogApi';

// Prerender one static page per active track (fico / mm / sd / abap).
export function generateStaticParams() {
  return SPANBIX_CAREER_PATHS.map((p) => ({ code: p.code }));
}

export async function generateMetadata({ params }) {
  const { code } = await params;
  const track = getCareerPath(code);
  const url = track
    ? `${SPANBIX_SITE.url}/career-paths/${track.code}`
    : `${SPANBIX_SITE.url}/career-paths`;
  return buildMetadata({
    title: track
      ? `${track.name} · ${track.fullName} — ${SPANBIX_SITE.name}`
      : `SAP Career Paths — ${SPANBIX_SITE.name}`,
    description: track
      ? `${track.name} training in India — mentor-led ${track.duration} program with capstone, certification and placement support. ${track.summary}`.slice(0, 300)
      : SPANBIX_SITE.metaDescription,
    keywords: track
      ? [`${track.name} course`, `${track.name} training`, `${track.name} certification`, `learn ${track.name}`]
      : SPANBIX_SITE.keywords,
    canonical: url,
    ogImage: SPANBIX_SITE.logo,
  });
}

export default async function CourseDetailPage({ params }) {
  const { code } = await params;
  const track = getCareerPath(code);
  if (!track) notFound();

  const url = `${SPANBIX_SITE.url}/career-paths/${track.code}`;
  const ld = [
    breadcrumbLd([
      { name: 'Home', url: `${SPANBIX_SITE.url}/` },
      { name: 'Career Paths', url: `${SPANBIX_SITE.url}/career-paths` },
      { name: track.name, url },
    ]),
    courseLd(track),
  ];

  // Surface blogs relevant to this module (e.g. all FICO articles on the FICO
  // page). Fetched server-side + passed into the client view so it renders
  // inside the page layout.
  const relatedBlogs = await fetchRelatedBlogs({
    matchWords: MODULE_BLOG_MATCH[track.code] || [track.code],
    limit: 6,
  });

  return (
    <>
      <JsonLd data={ld} />
      <CourseDetailView track={track} relatedBlogs={relatedBlogs} />
    </>
  );
}
