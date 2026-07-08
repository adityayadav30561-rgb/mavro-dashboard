const mongoose = require('mongoose');
const slugify = require('slugify');

// ===================================
// Campaign — editorial campaign grouping
// ===================================
// Groups blogs under an editorial campaign (e.g. "Spanbix Launch", "SEO Growth
// Sprint"). Scoped to a single tenant by `targetWebsite`. Blogs reference a
// campaign via Blog.campaign (ObjectId → Campaign).
//
// Multi-tenant invariant: a campaign belongs to exactly one tenant. Cross-
// tenant campaign aggregation is intentionally not modeled — campaign queries
// always pass through `targetWebsite`.

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
      maxlength: [120, 'Campaign name cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [600, 'Campaign description cannot exceed 600 characters'],
      default: '',
    },
    targetWebsite: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Website',
      required: [true, 'Target website is required'],
      index: true,
    },
    color: {
      type: String,
      // Hex or one of curated palette names — UI maps to actual color.
      default: 'violet',
    },
    startDate: { type: Date, default: null },
    endDate:   { type: Date, default: null },
    targetKeywords: [{ type: String, trim: true, lowercase: true }],
    targetBlogCount: { type: Number, default: null }, // optional goal
    targetSeoScore: { type: Number, min: 0, max: 100, default: null },
    assignedTeam: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' }],
    status: {
      type: String,
      enum: ['planned', 'active', 'completed', 'paused'],
      default: 'planned',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
    },
  },
  { timestamps: true }
);

// Unique campaign slug per tenant
campaignSchema.index({ targetWebsite: 1, slug: 1 }, { unique: true });
campaignSchema.index({ targetWebsite: 1, status: 1, startDate: 1 });

campaignSchema.pre('validate', function (next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Campaign', campaignSchema);
