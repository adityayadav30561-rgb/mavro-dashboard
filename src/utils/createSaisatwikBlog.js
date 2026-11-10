/**
 * Publish a SaiSatwik blog post to WordPress via the REST API.
 *
 *   npm run create:saisatwik-blog -- <slug>            → upsert as DRAFT
 *   npm run create:saisatwik-blog -- <slug> --publish  → upsert as PUBLISHED
 *
 * Data modules live in src/utils/saisatwik-blogs/<slug>.js (copy _TEMPLATE.js).
 * Idempotent: posts are matched by slug — re-running updates the same post.
 * Categories/tags are resolved by name and created when missing.
 *
 * Auth: WordPress Application Password (wp-admin → Users → Profile).
 *   SAISATWIK_WP_URL / SAISATWIK_WP_USER / SAISATWIK_WP_APP_PASSWORD in .env.
 * This is a local CLI — the credentials are never needed on Render.
 *
 * NOTE (hosting): saisatwik.com runs LiteSpeed, which strips the
 * Authorization header unless .htaccess forwards it. If auth fails with
 * `rest_not_logged_in`, add to the TOP of the WordPress .htaccess:
 *
 *   <IfModule mod_rewrite.c>
 *   RewriteEngine On
 *   RewriteCond %{HTTP:Authorization} .
 *   RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
 *   </IfModule>
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');

const BASE = (process.env.SAISATWIK_WP_URL || 'https://saisatwik.com').replace(/\/$/, '');
const USER = process.env.SAISATWIK_WP_USER || '';
const PASS = process.env.SAISATWIK_WP_APP_PASSWORD || '';

// SAISATWIK_WP_PROXY_AUTH=1 → credentials are injected by an egress proxy
// (cloud sessions). Send no auth headers of our own: a placeholder in
// X-WP-Authorization would be mapped onto HTTP_AUTHORIZATION by .htaccess and
// override the real header.
const PROXY_AUTH = process.env.SAISATWIK_WP_PROXY_AUTH === '1';
const AUTH = 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64');
const AUTH_HEADERS = PROXY_AUTH
  ? {}
  : {
      Authorization: AUTH,
      // The LiteSpeed host strips `Authorization` before PHP sees it; the
      // .htaccess carries a SetEnvIf that maps this header back onto
      // HTTP_AUTHORIZATION, which WordPress reads. Belt and braces.
      'X-WP-Authorization': AUTH,
    };

const COVER_DIR = path.join(__dirname, 'saisatwik-blogs', 'covers');
const COVER_TYPES = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

async function wp(pathname, { method = 'GET', body, raw, headers = {} } = {}) {
  const res = await fetch(`${BASE}/wp-json/wp/v2${pathname}`, {
    method,
    headers: {
      ...AUTH_HEADERS,
      'User-Agent': 'MavroPublisher/1.0',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: raw || (body ? JSON.stringify(body) : undefined),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`WP ${method} ${pathname} → ${res.status} ${json.code || ''}: ${json.message || ''}`);
    err.code = json.code;
    err.status = res.status;
    throw err;
  }
  return json;
}

/** Resolve taxonomy term names → IDs, creating missing terms. */
async function resolveTerms(taxonomy, names) {
  const ids = [];
  for (const name of names || []) {
    const found = await wp(`/${taxonomy}?search=${encodeURIComponent(name)}&per_page=20`);
    const exact = found.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (exact) {
      ids.push(exact.id);
    } else {
      const created = await wp(`/${taxonomy}`, { method: 'POST', body: { name } });
      ids.push(created.id);
      console.log(`   + created ${taxonomy.slice(0, -1)} "${name}" (#${created.id})`);
    }
  }
  return ids;
}

/**
 * FAQPage JSON-LD from the post's own FAQ section (the h2 starting "FAQs"
 * followed by h3 question / p answer pairs). AIOSEO on saisatwik.com emits
 * BlogPosting but not FAQPage, so the post carries it in a Custom HTML block.
 * One source: the visible FAQ. Returns '' when there is no FAQ section.
 */
function faqJsonLd(content) {
  const start = content.search(/<h2[^>]*>\s*FAQs?\b/i);
  if (start < 0) return '';
  const section = content.slice(start);
  const strip = (h) =>
    h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  const pairs = [];
  const re = /<h3[^>]*>([\s\S]*?)<\/h3>[\s\S]*?<p>([\s\S]*?)<\/p>/g;
  let m;
  while ((m = re.exec(section))) pairs.push({ q: strip(m[1]), a: strip(m[2]) });
  if (!pairs.length) return '';
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pairs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
  return (
    '\n\n<!-- wp:html -->\n<script type="application/ld+json">' +
    JSON.stringify(ld).replace(/</g, '\\u003c') +
    '</script>\n<!-- /wp:html -->'
  );
}

/** Find covers/<slug>.(webp|jpg|jpeg|png), or null. */
function findCover(slug) {
  for (const ext of Object.keys(COVER_TYPES)) {
    const f = path.join(COVER_DIR, `${slug}${ext}`);
    if (fs.existsSync(f)) return f;
  }
  return null;
}

/**
 * Upload the cover and set it as the featured image. Idempotent: the
 * uploaded filename carries a content hash, so an unchanged file whose
 * upload is already the featured image is skipped.
 */
async function attachCover(post, data, slug) {
  const file = findCover(slug);
  if (!file) return;
  const buf = fs.readFileSync(file);
  const ext = path.extname(file).toLowerCase();
  const hash = require('crypto').createHash('sha1').update(buf).digest('hex').slice(0, 8);
  const name = `${slug}-cover-${hash}${ext}`;
  const alt = data.coverAlt || data.title;

  if (post.featured_media) {
    try {
      const cur = await wp(`/media/${post.featured_media}?_fields=source_url`);
      if ((cur.source_url || '').includes(`${slug}-cover-${hash}`)) {
        console.log('   Cover:  unchanged, already attached');
        return;
      }
    } catch (_) { /* missing media → re-upload */ }
  }

  const media = await wp('/media', {
    method: 'POST',
    raw: buf,
    headers: {
      'Content-Type': COVER_TYPES[ext],
      'Content-Disposition': `attachment; filename="${name}"`,
    },
  });
  await wp(`/media/${media.id}`, {
    method: 'POST',
    body: { alt_text: alt, title: data.title, caption: '', post: post.id },
  });
  await wp(`/posts/${post.id}`, { method: 'POST', body: { featured_media: media.id } });
  console.log(`   Cover:  uploaded #${media.id} → ${media.source_url}`);
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== '--');
  const publish = args.includes('--publish');
  // --cover-only: attach/refresh the featured image without touching the
  // post's content, date or status.
  const coverOnly = args.includes('--cover-only');
  const slug = args.find((a) => !a.startsWith('--'));

  if (!slug) {
    console.error('Usage: npm run create:saisatwik-blog -- <slug> [--publish]');
    process.exit(1);
  }
  if (!PROXY_AUTH && (!USER || !PASS)) {
    console.error('❌ SAISATWIK_WP_USER / SAISATWIK_WP_APP_PASSWORD missing in .env');
    process.exit(1);
  }

  const file = path.join(__dirname, 'saisatwik-blogs', `${slug}.js`);
  if (!fs.existsSync(file)) {
    console.error(`❌ Data module not found: src/utils/saisatwik-blogs/${slug}.js`);
    console.error('   Copy _TEMPLATE.js and fill it in.');
    process.exit(1);
  }
  const data = require(file);
  if (!data.title || !data.content) {
    console.error('❌ Data module must export at least { title, content }');
    process.exit(1);
  }

  // 1. Auth sanity — clearest possible errors before touching content
  try {
    const me = await wp('/users/me?context=edit');
    console.log(`🔑 Authenticated as "${me.name}" (roles: ${(me.roles || []).join(', ')})`);
  } catch (err) {
    if (err.code === 'rest_not_logged_in') {
      console.error('❌ WordPress never received the credentials — the LiteSpeed host is');
      console.error('   stripping the Authorization header. Add the .htaccess rule from the');
      console.error('   header of this file (src/utils/createSaisatwikBlog.js), then retry.');
    } else if (err.code === 'invalid_username') {
      console.error(`❌ WordPress rejected the username "${USER}" — use the wp-admin LOGIN name.`);
    } else if (err.code === 'incorrect_password') {
      console.error('❌ Application Password rejected — regenerate it in wp-admin → Users → Profile.');
    } else {
      console.error('❌ Auth check failed:', err.message);
    }
    process.exit(1);
  }

  const postSlug = data.slug || slug;
  if (coverOnly) {
    const found = await wp(`/posts?slug=${encodeURIComponent(postSlug)}&status=any&per_page=1`);
    if (!found.length) {
      console.error(`❌ No post with slug "${postSlug}" to attach a cover to`);
      process.exit(1);
    }
    if (!findCover(slug)) {
      console.error(`❌ No cover at src/utils/saisatwik-blogs/covers/${slug}.(webp|jpg|png)`);
      process.exit(1);
    }
    await attachCover(found[0], data, slug);
    return;
  }

  // 2. Resolve categories / tags
  const categories = await resolveTerms('categories', data.categories);
  const tags = await resolveTerms('tags', data.tags);

  // 3. Upsert by slug
  const wanted = {
    title: data.title,
    slug: data.slug || slug,
    content: data.content + (data.faqSchema === false ? '' : faqJsonLd(data.content)),
    excerpt: data.excerpt || '',
    status: publish ? 'publish' : 'draft',
    // Optional backdate/schedule. Site timezone is UTC, so date === date_gmt.
    // Omitted → WordPress keeps the post's existing date (or uses "now").
    ...(data.date ? { date: data.date, date_gmt: data.date } : {}),
    ...(categories.length ? { categories } : {}),
    ...(tags.length ? { tags } : {}),
  };

  const existing = await wp(`/posts?slug=${encodeURIComponent(wanted.slug)}&status=any&per_page=1`);
  let post;
  if (existing.length > 0) {
    post = await wp(`/posts/${existing[0].id}`, { method: 'POST', body: wanted });
    console.log(`♻️  Updated existing post #${post.id}`);
  } else {
    post = await wp('/posts', { method: 'POST', body: wanted });
    console.log(`✨ Created post #${post.id}`);
  }

  await attachCover(post, data, slug);

  console.log(`   Status: ${post.status.toUpperCase()}`);
  console.log(`   Edit:   ${BASE}/wp-admin/post.php?post=${post.id}&action=edit`);
  if (post.status === 'publish') {
    console.log(`   Live:   ${post.link}`);
  } else {
    console.log(`   Review it in wp-admin, then either hit Publish there or re-run with --publish.`);
  }
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
