const mongoose = require('mongoose');
const slugify = require('slugify');

/**
 * Website Model — Tenant Entity
 *
 * Each website represents an independent product/brand.
 * All content (blogs, leads, SEO) is scoped to a website.
 */
const websiteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Website name is required'],
      trim: true,
      unique: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    domain: {
      type: String,
      required: [true, 'Domain is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    logo: {
      type: String,
      default: '',
    },
    favicon: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active',
    },

    // ----- Branding & Theming -----
    branding: {
      primaryColor: { type: String, default: '#7c3aed' },
      secondaryColor: { type: String, default: '#4f46e5' },
      fontFamily: { type: String, default: 'Inter' },
    },

    // ----- SEO Defaults -----
    seoDefaults: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      keywords: [{ type: String }],
      ogImage: { type: String, default: '' },
      googleVerification: { type: String, default: '' },
      bingVerification: { type: String, default: '' },
    },

    // ----- AI Context (per-tenant prompt grounding for the AI layer) -----
    // Populated either manually by an admin or auto-derived from `name` +
    // `description` + `seoDefaults.keywords` when missing. Prompt builders
    // never reference a hardcoded tenant map — they read this block + fall
    // back to derived defaults. Adding a new website automatically gets a
    // reasonable AI brief without code changes.
    aiContext: {
      audience: { type: String, default: '', trim: true, maxlength: 300 },
      industry: { type: String, default: '', trim: true, maxlength: 150 },
      tone: { type: String, default: '', trim: true, maxlength: 80 },
      vocabulary: [{ type: String, trim: true }],
      avoid: [{ type: String, trim: true }],
    },

    // ----- Sitemap & Indexing -----
    sitemapUrl: {
      type: String,
      default: '',
    },
    indexNowKey: {
      type: String,
      default: '',
    },
    googleSearchConsoleConnected: {
      type: Boolean,
      default: false,
    },

    // ----- Configuration -----
    blogSlugPrefix: {
      type: String,
      default: 'blog',
      trim: true,
    },
    formWebhookUrl: {
      type: String,
      default: '',
    },
    notificationEmails: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // ----- Stats Cache (periodically updated) -----
    cachedStats: {
      blogCount: { type: Number, default: 0 },
      publishedBlogCount: { type: Number, default: 0 },
      leadCount: { type: Number, default: 0 },
      seoPageCount: { type: Number, default: 0 },
      lastUpdated: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

// ===================================
// Middleware
// ===================================

/**
 * Auto-generate slug from name before validation
 */
websiteSchema.pre('validate', function (next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// ===================================
// Instance Methods
// ===================================

/**
 * Get the base URL for this website
 */
websiteSchema.methods.getBaseUrl = function () {
  return `https://${this.domain}`;
};

/**
 * Get the full blog URL for a given blog slug
 */
websiteSchema.methods.getBlogUrl = function (blogSlug) {
  return `${this.getBaseUrl()}/${this.blogSlugPrefix}/${blogSlug}`;
};

// ===================================
// Statics
// ===================================

/**
 * Update cached stats for a website
 */
websiteSchema.statics.refreshStats = async function (websiteId) {
  const { Blog, Lead, SeoMetadata } = require('./index');
  const [blogCount, publishedBlogCount, leadCount, seoPageCount] = await Promise.all([
    Blog.countDocuments({ targetWebsite: websiteId }),
    Blog.countDocuments({ targetWebsite: websiteId, status: 'published' }),
    Lead.countDocuments({ website: websiteId, isSpam: { $ne: true } }),
    SeoMetadata.countDocuments({ website: websiteId, isActive: true }),
  ]);

  return this.findByIdAndUpdate(
    websiteId,
    {
      cachedStats: {
        blogCount,
        publishedBlogCount,
        leadCount,
        seoPageCount,
        lastUpdated: new Date(),
      },
    },
    { new: true }
  );
};

module.exports = mongoose.model('Website', websiteSchema);
