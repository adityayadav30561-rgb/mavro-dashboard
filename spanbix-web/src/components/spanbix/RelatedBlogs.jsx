import BlogStrip from './BlogStrip';
import { fetchRelatedBlogs } from '@/lib/blogApi';

// Async server component: fetches the relevant published blogs and renders the
// BlogStrip. Used on the homepage (no filter → recent posts) and anywhere a
// server component can await. Renders nothing if there are no matching blogs.
export default async function RelatedBlogs({
  heading = 'From the SAP career blog',
  eyebrow = 'SAP CAREER BLOG',
  matchWords = null,
  excludeSlug = null,
  limit = 6,
  tone = 'paper',
}) {
  const blogs = await fetchRelatedBlogs({ matchWords, limit, excludeSlug });
  return <BlogStrip blogs={blogs} heading={heading} eyebrow={eyebrow} tone={tone} />;
}
