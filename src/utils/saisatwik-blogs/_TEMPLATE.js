/**
 * SaiSatwik blog post template — copy to <slug>.js in this folder, fill in,
 * then publish with:
 *
 *   npm run create:saisatwik-blog -- <slug>            → draft (review in wp-admin)
 *   npm run create:saisatwik-blog -- <slug> --publish  → straight to live
 *
 * The runner upserts by slug: re-running updates the same WordPress post
 * (fixing content/typos) instead of creating a duplicate.
 *
 * Content conventions (same discipline as Spanbix — see BLOG_PUBLISHING.md):
 *  - Open with a "Quick Answer" <h2> that answers the title's question in
 *    2-3 sentences (AEO/GEO: this is the passage AI assistants cite).
 *  - <h2> for sections, <h3> for subsections. No <h1> — WordPress renders
 *    the title as the h1.
 *  - Hyperlink every named source; verify each URL resolves.
 *  - Tables/wide content: plain <table> is fine — the WP theme styles it.
 *  - No inline styles; the theme owns typography.
 */

module.exports = {
  title: 'REPLACE — Post Title (55-60 chars, keyword near the front)',
  slug: 'replace-post-slug',

  // Meta/excerpt — WordPress uses this for the post excerpt (and most SEO
  // plugins pick it up as the default meta description). 150-160 chars.
  excerpt: 'REPLACE — one-sentence summary with the focus keyword.',

  // Category + tag NAMES — resolved to IDs at publish time, created if they
  // don't exist yet. Check wp-admin for the existing category tree first.
  categories: ['SAP'],
  tags: [],

  content: `
<h2>Quick Answer</h2>
<p>REPLACE — direct 2-3 sentence answer to the question the title asks.</p>

<h2>First Section</h2>
<p>…</p>
`,
};
