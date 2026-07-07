/**
 * Mavro Admin — Spanbix Blog Creator CLI
 *
 * Upserts a single blog post (from a data module under ./blogs/) into the
 * Spanbix tenant and publishes it. Idempotent: keyed on { slug, targetWebsite },
 * so re-running updates the existing post instead of duplicating it.
 *
 * Usage:
 *   npm run create:spanbix-blog -- <blog-module-name> [--draft]
 *   npm run create:spanbix-blog -- which-sap-module-to-choose-fico-mm-sd-abap-2026
 *
 *   <blog-module-name> is the filename (no .js) under src/utils/blogs/.
 *   Defaults to the SAP module-comparison post when omitted.
 *
 *   --draft  Create/update as a draft (status='draft') for review in the admin
 *            Blog Editor instead of publishing immediately.
 *
 * Author byline: resolved by email (SPANBIX_AUTHOR_EMAIL → ADMIN_EMAIL →
 * admin@mavro.com). Run `npm run set:spanbix-author` first to fill the
 * Person-schema fields (jobTitle / bio / linkedinUrl / avatar).
 *
 * On publish this calls revalidateService.revalidateBlog(slug) directly —
 * the publish path here bypasses blogController, so we trigger the Next.js
 * ISR cache-bust ourselves (no-op if SPANBIX_WEB_URL / REVALIDATE_SECRET unset).
 *
 * Exits 0 on success, 1 on failure.
 */
require('dotenv').config();
const path = require('path');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const mongoose = require('mongoose');
const { Blog, Website, AdminUser } = require('../models');
const config = require('../config');
const revalidateService = require('../services/revalidateService');

const DEFAULT_BLOG = 'sap-module-comparison-fico-mm-sd-abap-2026';

(async () => {
  const args = process.argv.slice(2).filter((a) => a !== '--');
  const isDraft = args.includes('--draft');
  const moduleName = args.find((a) => !a.startsWith('--')) || DEFAULT_BLOG;

  let data;
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    data = require(path.join(__dirname, 'blogs', moduleName));
  } catch (e) {
    console.error(`❌ Could not load blog module "blogs/${moduleName}.js" — ${e.message}`);
    process.exit(1);
  }

  if (!data.title || !data.content || !data.slug) {
    console.error('❌ Blog module is missing one of: title, content, slug.');
    process.exit(1);
  }

  const authorEmail = (process.env.SPANBIX_AUTHOR_EMAIL || process.env.ADMIN_EMAIL || 'admin@mavro.com').toLowerCase();

  try {
    await mongoose.connect(config.mongo.uri);
    console.log('📦 Connected to MongoDB.\n');

    const website = await Website.findOne({
      $or: [{ slug: 'spanbix' }, { name: 'Spanbix' }, { domain: 'www.spanbix.com' }],
    });
    if (!website) {
      console.error('❌ Spanbix Website not found. Boot the backend once (auto-seeds) or run `npm run seed:spanbix`.');
      process.exit(1);
    }

    const author = await AdminUser.findOne({ email: authorEmail });
    if (!author) {
      console.error(`❌ No AdminUser found with email "${authorEmail}". Set SPANBIX_AUTHOR_EMAIL.`);
      process.exit(1);
    }

    const status = isDraft ? 'draft' : 'published';
    // Match on slug OR title so a re-run finds the post even if a previous run's
    // slug got rewritten by the model's pre-validate hook — keeps this idempotent
    // and lets a re-run correct a mangled slug instead of creating a duplicate.
    let blog = await Blog.findOne({
      targetWebsite: website._id,
      $or: [{ slug: data.slug }, { title: data.title }],
    });
    const isNew = !blog;
    if (!blog) blog = new Blog();

    // Content + SEO/AEO fields — overwrite from the source-of-truth module.
    blog.title = data.title;
    blog.slug = data.slug;
    blog.content = data.content;
    blog.excerpt = data.excerpt || '';
    blog.seoTitle = data.seoTitle || '';
    blog.seoDescription = data.seoDescription || '';
    blog.category = data.category || '';
    blog.tags = data.tags || [];
    blog.keywords = data.keywords || [];
    blog.faq = data.faq || [];
    if (typeof data.readingTime === 'number') blog.readingTime = data.readingTime;
    if (data.featuredImage) blog.featuredImage = data.featuredImage;
    if (data.ogImage) blog.ogImage = data.ogImage;

    blog.targetWebsite = website._id;
    blog.author = author._id;
    blog.lastEditedBy = author._id;

    blog.status = status;
    blog.editorialStatus = isDraft ? 'review' : 'published';
    // Honor an explicit editorial-calendar date (data.publishedAt) when set;
    // otherwise stamp now on first publish. Lets a post carry its planned date.
    if (!isDraft) {
      if (data.publishedAt) blog.publishedAt = new Date(data.publishedAt);
      else if (!blog.publishedAt) blog.publishedAt = new Date();
    }

    await blog.save();

    // The Blog pre-validate hook regenerates the slug from the title whenever the
    // title is modified (always true on create), which clobbers an explicit slug.
    // Re-assert the desired slug once the title is no longer dirty so the clean,
    // hand-picked URL wins. Title is unchanged here, so the hook stays out of it.
    if (data.slug && blog.slug !== data.slug) {
      blog.slug = data.slug;
      await blog.save();
    }

    console.log(`${isNew ? '✨ Created' : '♻️  Updated'} blog [${status}]:`);
    console.log(`   title: ${blog.title}`);
    console.log(`   slug:  ${blog.slug}`);
    console.log(`   author: ${author.name || author.email}`);
    console.log(`   url:   https://www.spanbix.com/blog/${blog.slug}`);
    console.log(`   faq entries: ${blog.faq.length}  ·  keywords: ${blog.keywords.length}`);

    if (!isDraft) {
      const r = await revalidateService.revalidateBlog(blog.slug);
      console.log(`\n🔄 ISR revalidate: ${JSON.stringify(r)}`);
      if (r && r.reason === 'not-configured') {
        console.log('   (SPANBIX_WEB_URL / REVALIDATE_SECRET unset — page refreshes on next ISR window or redeploy.)');
      }
    } else {
      console.log('\n📝 Saved as draft — open the admin Blog Editor to review, then publish.');
    }

    console.log('\n🎉 Done.');
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Failed — ${err.message}`);
    if (err.errors) {
      for (const [field, e] of Object.entries(err.errors)) {
        console.error(`   ${field}: ${e.message}`);
      }
    }
    process.exit(1);
  }
})();
