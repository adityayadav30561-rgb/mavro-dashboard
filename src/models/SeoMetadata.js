const mongoose = require('mongoose');

/**
 * SEO Metadata Model
 *
 * Stores page-level SEO configuration for any page on any website.
 * Each record represents a single URL's SEO settings.
 */
const seoMetadataSchema = new mongoose.Schema(
  {
    // ----- Page Identification -----
    website: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Website',
      required: [true, 'Website reference is required'],
      index: true,
    },
    pagePath: {
      type: String,
      required: [true, 'Page path is required (e.g. "/" or "/pricing")'],
      trim: true,
    },
    pageType: {
      type: String,
      enum: ['homepage', 'landing', 'service', 'product', 'blog_index', 'contact', 'about', 'pricing', 'custom'],
      default: 'custom',
    },

    // ----- Basic SEO -----
    title: {
      type: String,
      trim: true,
      maxlength: [70, 'Title should not exceed 70 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [160, 'Description should not exceed 160 characters'],
    },
    keywords: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    canonicalUrl: {
      type: String,
      trim: true,
    },

    // ----- Open Graph -----
    ogTitle: {
      type: String,
      trim: true,
      maxlength: [95, 'OG title should not exceed 95 characters'],
    },
    ogDescription: {
      type: String,
      trim: true,
      maxlength: [200, 'OG description should not exceed 200 characters'],
    },
    ogImage: {
      type: String,
      trim: true,
    },
    ogType: {
      type: String,
      enum: ['website', 'article', 'product', 'profile'],
      default: 'website',
    },

    // ----- Twitter Card -----
    twitterCard: {
      type: String,
      enum: ['summary', 'summary_large_image', 'app', 'player'],
      default: 'summary_large_image',
    },
    twitterTitle: { type: String, trim: true },
    twitterDescription: { type: String, trim: true },
    twitterImage: { type: String, trim: true },

    // ----- Structured Data (JSON-LD) -----
    schemaMarkup: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // ----- Robots Directives -----
    robotsIndex: { type: Boolean, default: true },
    robotsFollow: { type: Boolean, default: true },
    robotsDirectives: { type: String, default: '' },

    // ----- Sitemap Settings -----
    includeInSitemap: { type: Boolean, default: true },
    sitemapPriority: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    },
    sitemapChangefreq: {
      type: String,
      enum: ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'],
      default: 'weekly',
    },

    // ----- Status -----
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// ===================================
// Indexes
// ===================================
// Unique: one SEO record per page per website
seoMetadataSchema.index({ website: 1, pagePath: 1 }, { unique: true });
seoMetadataSchema.index({ website: 1, pageType: 1 });
seoMetadataSchema.index({ website: 1, includeInSitemap: 1 });

// ===================================
// Virtuals
// ===================================

/**
 * Generate computed robots meta tag content
 */
seoMetadataSchema.virtual('robotsMeta').get(function () {
  const directives = [];
  directives.push(this.robotsIndex ? 'index' : 'noindex');
  directives.push(this.robotsFollow ? 'follow' : 'nofollow');
  if (this.robotsDirectives) directives.push(this.robotsDirectives);
  return directives.join(', ');
});

/**
 * Generate full meta tags object for rendering
 */
seoMetadataSchema.methods.toMetaTags = function (websiteDomain) {
  const base = `https://${websiteDomain}`;
  const url = `${base}${this.pagePath}`;

  return {
    title: this.title,
    description: this.description,
    canonical: this.canonicalUrl || url,
    robots: this.robotsMeta,
    openGraph: {
      title: this.ogTitle || this.title,
      description: this.ogDescription || this.description,
      image: this.ogImage,
      url,
      type: this.ogType,
    },
    twitter: {
      card: this.twitterCard,
      title: this.twitterTitle || this.ogTitle || this.title,
      description: this.twitterDescription || this.ogDescription || this.description,
      image: this.twitterImage || this.ogImage,
    },
    schema: this.schemaMarkup,
    keywords: this.keywords,
  };
};

seoMetadataSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('SeoMetadata', seoMetadataSchema);
