/**
 * Spanbix blog TEMPLATE — copy this file to publish a new post.
 *
 *   1. Copy to:  src/utils/blogs/<your-clean-slug>.js
 *   2. Fill in the fields below (keep the h2 `id="..."` convention — it powers
 *      the auto Table of Contents + in-page anchors).
 *   3. Publish:  npm run create:spanbix-blog -- <your-clean-slug>
 *
 * What you get automatically (do NOT hand-build these):
 *   - schema.org BlogPosting + Person author  (blogPostingLd)
 *   - schema.org FAQPage from the `faq` array  (faqPageLd)   ← needs `faq` filled
 *   - schema.org BreadcrumbList                 (breadcrumbLd)
 *   - Table of Contents from your <h2 id> headings
 *   - Prose styling (headings, tables, lists, links) via .sx-blog-content
 *   - Sitemap entry, canonical, OG/Twitter meta, ISR revalidate on publish
 *
 * See BLOG_PUBLISHING.md (repo root) for the full process + checklist.
 */

const content = `
<h2 id="quick-answer">Quick Answer</h2>
<p>Lead with a 2-3 sentence direct answer — this is what Google AI Overviews and
LLMs extract first. Put the core takeaway here, no preamble.</p>

<h2 id="section-two">Section Heading</h2>
<p>Body copy. Use <strong>strong</strong> for key terms, <a href="/career-paths/fico">internal links</a>
to relevant Spanbix pages, and <a href="https://authoritative-source.example" target="_blank" rel="noopener">external links</a>
to authoritative sources.</p>
<ul>
  <li>Bullet for scannability</li>
  <li>Another point</li>
</ul>

<h2 id="a-table">A Comparison Table</h2>
<div class="sx-table-wrap">
<table>
  <thead><tr><th>Factor</th><th>Option A</th><th>Option B</th></tr></thead>
  <tbody>
    <tr><td>Row label</td><td>value</td><td>value</td></tr>
  </tbody>
</table>
</div>

<h2 id="faq">Frequently Asked Questions</h2>
<h3>First question here?</h3>
<p>Answer in plain prose. Mirror this exactly in the faq[] array below so the
visible FAQ and the FAQPage schema match (Google requirement).</p>

<h2 id="next-steps">Your Next Steps</h2>
<ol>
  <li>Step one</li>
  <li>Step two</li>
</ol>

<hr />
<p><em>Closing attribution line. State the experience / data behind the post —
this is a citable E-E-A-T signal (e.g. "prepared by the Spanbix team using …").</em></p>
`;

// MUST mirror the visible FAQ <h3>/<p> pairs above. Drives schema.org/FAQPage.
const faq = [
  { question: 'First question here?', answer: 'Answer in plain prose. Mirror this exactly in the visible FAQ section.' },
];

module.exports = {
  slug: 'your-clean-slug',                          // clean, keyword-rich, hyphenated. THIS is the URL.
  title: 'Full Article Title (used as the H1)',
  seoTitle: 'SERP Title ≤ 70 chars',                // shown in Google results
  seoDescription: 'Meta description ≤ 160 chars, lead with the key takeaway.',
  excerpt: 'One-sentence summary. Also used as the OG/social description fallback.',
  category: 'Category Label',                        // eyebrow above the H1
  tags: ['tag-one', 'tag-two'],
  keywords: ['primary keyword', 'secondary keyword', 'long-tail variant'],
  readingTime: 8,                                    // minutes (approx)
  featuredImage: '',                                 // e.g. '/blog-images/<slug>.jpg' — fills BlogPosting.image + cover
  ogImage: '',                                       // defaults to featuredImage when blank
  content: content.trim(),
  faq,
};
