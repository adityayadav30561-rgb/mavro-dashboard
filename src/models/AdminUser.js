const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * AdminUser Model — Multi-Tenant Role-Based Access Control
 *
 * Roles:
 *   - superadmin: Full access to ALL websites. Can manage users, settings, everything.
 *   - admin: Full access to ASSIGNED websites only. Can create/edit/delete content.
 *   - editor: Can create/edit blogs and manage content on ASSIGNED websites. Cannot delete.
 *   - seo_manager: Can manage SEO metadata, sitemaps, and indexing for ASSIGNED websites.
 *
 * Website Assignments:
 *   - superadmin: No assignment needed (access to all)
 *   - Other roles: Must have websites listed in `assignedWebsites`
 */
const adminUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never return password by default
    },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'editor', 'seo_manager', 'writer', 'reviewer'],
      default: 'editor',
    },

    // ----- Multi-Tenant Website Assignments -----
    assignedWebsites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Website',
      },
    ],

    // ----- Profile -----
    avatar: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },

    // ----- Status & Tracking -----
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    loginCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ===================================
// Indexes
// ===================================
adminUserSchema.index({ role: 1, isActive: 1 });
adminUserSchema.index({ assignedWebsites: 1 });

// ===================================
// Middleware
// ===================================

/**
 * Hash password before saving
 */
adminUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ===================================
// Instance Methods
// ===================================

/**
 * Compare entered password with hashed password
 */
adminUserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Check if user has access to a specific website
 * superadmin always has access to all websites
 *
 * @param {string|ObjectId} websiteId
 * @returns {boolean}
 */
adminUserSchema.methods.hasWebsiteAccess = function (websiteId) {
  if (this.role === 'superadmin') return true;
  if (!websiteId) return false;
  return this.assignedWebsites.some(
    (id) => id.toString() === websiteId.toString()
  );
};

/**
 * Check if user can perform a specific action
 *
 * Permission matrix:
 *   superadmin → everything
 *   admin → CRUD on assigned websites, manage leads
 *   editor → create/edit blogs, view leads on assigned websites
 *   seo_manager → manage SEO/sitemaps on assigned websites, view blogs
 */
adminUserSchema.methods.can = function (action) {
  const permissions = {
    superadmin: [
      'manage_users', 'manage_websites', 'manage_settings',
      'create_blog', 'edit_blog', 'delete_blog', 'publish_blog',
      'manage_leads', 'delete_leads', 'export_leads',
      'manage_seo', 'manage_sitemap', 'ping_engines',
      'view_analytics', 'bulk_operations',
    ],
    admin: [
      'create_blog', 'edit_blog', 'delete_blog', 'publish_blog',
      'manage_leads', 'delete_leads', 'export_leads',
      'manage_seo', 'manage_sitemap', 'ping_engines',
      'view_analytics', 'bulk_operations',
    ],
    editor: [
      'create_blog', 'edit_blog', 'publish_blog',
      'view_leads',
      'view_analytics',
    ],
    seo_manager: [
      'view_blog',
      'manage_seo', 'manage_sitemap', 'ping_engines',
      'view_leads',
      'view_analytics',
    ],
  };

  const allowed = permissions[this.role] || [];
  return allowed.includes(action);
};

/**
 * Get the list of website IDs this user can access
 * Returns null for superadmin (meaning "all")
 *
 * @returns {ObjectId[]|null}
 */
adminUserSchema.methods.getAccessibleWebsiteIds = function () {
  if (this.role === 'superadmin') return null; // null = all
  return this.assignedWebsites.map((id) => id.toString());
};

/**
 * Strip sensitive fields from JSON output
 */
adminUserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('AdminUser', adminUserSchema);
