const mongoose = require('mongoose');
const slugify = require('slugify');

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
      maxlength: [250, 'Title cannot exceed 250 characters'],
    },
    slug: {
      type: String,
      lowercase: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Blog content is required'],
    },
    contentPlainText: {
      type: String,
      select: false, // Only fetch when explicitly needed (search indexing)
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    },
    featuredImage: {
      type: String,
      default: '',
    },
    readingTime: {
      type: Number, // in minutes
      default: 0,
    },

    // ----- Taxonomy / Tags -----
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    category: {
      type: String,
      trim: true,
      default: '',
    },

    // ----- SEO Fields -----
    seoTitle: {
      type: String,
      trim: true,
      maxlength: [70, 'SEO title should not exceed 70 characters'],
    },
    seoDescription: {
      type: String,
      trim: true,
      maxlength: [160, 'SEO description should not exceed 160 characters'],
    },
    keywords: [
      {
        type: String,
        trim: true,
      },
    ],
    canonicalUrl: {
      type: String,
      default: '',
    },
    ogImage: {
      type: String,
      default: '',
    },

    // ----- Relationships -----
    targetWebsite: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Website',
      required: [true, 'Target website is required'],
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
    },

    // ----- Status & Publishing -----
    status: {
      type: String,
      enum: ['draft', 'published', 'scheduled', 'archived'],
      default: 'draft',
      index: true,
    },
    publishedAt: {
      type: Date,
    },
    scheduledAt: {
      type: Date,
    },

    // ----- Google Indexing -----
    indexingStatus: {
      type: String,
      enum: ['not_submitted', 'submitted', 'indexed', 'error'],
      default: 'not_submitted',
    },
    lastIndexedAt: {
      type: Date,
    },

    // ----- Version Tracking -----
    version: {
      type: Number,
      default: 1,
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
    },

    // ----- Editorial pipeline (decoupled from publish lifecycle) -----
    // `status` controls publish state (draft / scheduled / published / archived).
    // `editorialStatus` is the operational Kanban state — 5 column workflow
    // used by /calendar Pipeline. `workflowStatus` (legacy 8-state field) is
    // retained for backward compat with prior data; controllers map between
    // the two when needed.
    editorialStatus: {
      type: String,
      enum: ['ideas', 'drafting', 'review', 'scheduled', 'published'],
      default: 'drafting',
      index: true,
    },
    // Optional flag — set when a published blog is actively being revised.
    // Public site continues to serve the previous version. Cleared on save
    // by the workflow controller when revisions land.
    isUpdating: {
      type: Boolean,
      default: false,
    },
    workflowStatus: {
      type: String,
      enum: ['idea', 'outline', 'draft', 'review', 'scheduled', 'published', 'updating', 'archived'],
      default: 'draft',
      index: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      default: null,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      default: null,
      index: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      default: null,
    },
    seoReviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      default: null,
    },
    editorialNotes: {
      type: String,
      trim: true,
      maxlength: [4000, 'Editorial notes cannot exceed 4000 characters'],
      default: '',
    },
    // Editorial deadline (separate from scheduledAt — drafts can have a
    // due date well before any publish target).
    dueAt: {
      type: Date,
      default: null,
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    lastReviewedAt: { type: Date, default: null },
    approvedAt:     { type: Date, default: null },
    approvedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
    reviewNotes: [
      {
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
        action: { type: String, enum: ['comment', 'approve', 'request-revision', 'reject'] },
        note: String,
      },
    ],
    activityLog: [
      {
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
        type: String,
        message: String,
        meta: { type: mongoose.Schema.Types.Mixed, default: {} },
      },
    ],
    workflowHistory: [
      {
        from: String,
        to: String,
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
      },
    ],
    publishHistory: [
      {
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
        action: { type: String, enum: ['publish', 'unpublish', 'schedule', 'reschedule', 'auto-publish'] },
        note: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ===================================
// Indexes
// ===================================

// Unique slug per website
blogSchema.index({ slug: 1, targetWebsite: 1 }, { unique: true });

// Full-text search index on title, excerpt, keywords
blogSchema.index({ title: 'text', excerpt: 'text', 'keywords': 'text' });

// Compound query indexes for common filters
blogSchema.index({ targetWebsite: 1, status: 1, publishedAt: -1 });
blogSchema.index({ status: 1, createdAt: -1 });
blogSchema.index({ tags: 1 });

// Calendar + workflow indexes
blogSchema.index({ targetWebsite: 1, scheduledAt: 1 });
blogSchema.index({ targetWebsite: 1, workflowStatus: 1, updatedAt: -1 });
blogSchema.index({ targetWebsite: 1, editorialStatus: 1, updatedAt: -1 });
// Worker: due-to-publish scan
blogSchema.index({ status: 1, scheduledAt: 1 });

// ===================================
// Virtuals
// ===================================

/**
 * Build the full public URL for this blog
 */
blogSchema.virtual('publicUrl').get(function () {
  if (this.populated('targetWebsite') && this.targetWebsite && this.targetWebsite.domain) {
    return `https://${this.targetWebsite.domain}/blog/${this.slug}`;
  }
  return null;
});

// ===================================
// Static Methods
// ===================================

/**
 * Calculate reading time from HTML content
 * Average adult reads ~200 words/minute
 */
blogSchema.statics.calculateReadingTime = function (htmlContent) {
  if (!htmlContent) return 0;
  const plainText = htmlContent.replace(/<[^>]*>/g, '').trim();
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
};

/**
 * Strip HTML tags to produce plain text
 */
blogSchema.statics.stripHtml = function (html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Auto-generate excerpt from content (first 160 chars of plain text)
 */
blogSchema.statics.generateExcerpt = function (htmlContent, maxLength = 160) {
  const plain = this.stripHtml(htmlContent);
  if (plain.length <= maxLength) return plain;
  return plain.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
};

/**
 * Generate a unique slug, appending -2, -3, etc. on collision
 */
blogSchema.statics.generateUniqueSlug = async function (title, websiteId, excludeBlogId = null) {
  const baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug, targetWebsite: websiteId };
    if (excludeBlogId) {
      query._id = { $ne: excludeBlogId };
    }
    const existing = await this.findOne(query);
    if (!existing) return slug;
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
};

// ===================================
// Middleware
// ===================================

/**
 * Pre-validate: generate slug, reading time, excerpt, plain text
 */
blogSchema.pre('validate', async function (next) {
  // Auto-generate slug if not set or title changed
  if (this.title && (!this.slug || this.isModified('title'))) {
    try {
      this.slug = await this.constructor.generateUniqueSlug(
        this.title,
        this.targetWebsite,
        this._id
      );
    } catch (err) {
      // Fallback to basic slug
      this.slug = slugify(this.title, { lower: true, strict: true });
    }
  }

  // Calculate reading time from content
  if (this.content && this.isModified('content')) {
    this.readingTime = this.constructor.calculateReadingTime(this.content);
    this.contentPlainText = this.constructor.stripHtml(this.content);

    // Auto-generate excerpt if not manually set
    if (!this.excerpt || this.excerpt === '') {
      this.excerpt = this.constructor.generateExcerpt(this.content);
    }
  }

  next();
});

/**
 * Pre-save: publishing & scheduling logic
 */
blogSchema.pre('save', function (next) {
  // Set publishedAt when status → published (first time only)
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  // Clear publishedAt when reverting to draft
  if (this.isModified('status') && this.status === 'draft') {
    this.publishedAt = null;
  }

  // Increment version on content update
  if (this.isModified('content') && !this.isNew) {
    this.version += 1;
  }

  // Mirror publish-state changes into workflowStatus when caller did not set
  // an explicit editorial workflow. Keeps the two columns roughly in sync
  // without forcing every legacy update path to opt in.
  if (this.isModified('status') && !this.isModified('workflowStatus')) {
    if (this.status === 'published')      this.workflowStatus = 'published';
    else if (this.status === 'scheduled') this.workflowStatus = 'scheduled';
    else if (this.status === 'archived')  this.workflowStatus = 'archived';
    else if (this.status === 'draft' && !['idea','outline','draft','review'].includes(this.workflowStatus)) {
      this.workflowStatus = 'draft';
    }
  }

  // Mirror to editorialStatus (5-col) when caller didn't set explicitly
  if (this.isModified('status') && !this.isModified('editorialStatus')) {
    if (this.status === 'published')      this.editorialStatus = 'published';
    else if (this.status === 'scheduled') this.editorialStatus = 'scheduled';
    else if (this.status === 'archived')  { /* keep current editorialStatus, archived is hidden */ }
    else if (this.status === 'draft' && !['ideas','drafting','review'].includes(this.editorialStatus)) {
      this.editorialStatus = 'drafting';
    }
  }

  next();
});

module.exports = mongoose.model('Blog', blogSchema);
