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

const AUTH = 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64');

async function wp(pathname, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}/wp-json/wp/v2${pathname}`, {
    method,
    headers: {
      Authorization: AUTH,
      // The LiteSpeed host strips `Authorization` before PHP sees it; the
      // .htaccess carries a SetEnvIf that maps this header back onto
      // HTTP_AUTHORIZATION, which WordPress reads. Belt and braces.
      'X-WP-Authorization': AUTH,
      'User-Agent': 'MavroPublisher/1.0',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
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

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== '--');
  const publish = args.includes('--publish');
  const slug = args.find((a) => !a.startsWith('--'));

  if (!slug) {
    console.error('Usage: npm run create:saisatwik-blog -- <slug> [--publish]');
    process.exit(1);
  }
  if (!USER || !PASS) {
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

  // 2. Resolve categories / tags
  const categories = await resolveTerms('categories', data.categories);
  const tags = await resolveTerms('tags', data.tags);

  // 3. Upsert by slug
  const wanted = {
    title: data.title,
    slug: data.slug || slug,
    content: data.content,
    excerpt: data.excerpt || '',
    status: publish ? 'publish' : 'draft',
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
