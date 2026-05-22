const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    // ----- Source Website -----
    website: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Website',
      required: [true, 'Website reference is required'],
      index: true,
    },

    // ----- Contact Information -----
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    company: {
      type: String,
      trim: true,
      default: '',
      maxlength: [200, 'Company name cannot exceed 200 characters'],
    },
    message: {
      type: String,
      trim: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },

    // ----- Tracking -----
    sourcePage: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Source page URL cannot exceed 500 characters'],
    },
    ipAddress: {
      type: String,
      default: '',
      index: true,
    },
    userAgent: {
      type: String,
      default: '',
    },
    referrer: {
      type: String,
      trim: true,
      default: '',
    },
    utmSource: {
      type: String,
      trim: true,
      default: '',
    },
    utmMedium: {
      type: String,
      trim: true,
      default: '',
    },
    utmCampaign: {
      type: String,
      trim: true,
      default: '',
    },

    // ----- Lead Management -----
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'converted', 'closed', 'spam'],
      default: 'new',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
    },
    notes: {
      type: String,
      default: '',
      maxlength: [5000, 'Notes cannot exceed 5000 characters'],
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // ----- Spam Detection -----
    isSpam: {
      type: Boolean,
      default: false,
      index: true,
    },
    spamScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    spamReasons: [
      {
        type: String,
      },
    ],

    // ----- Activity Log -----
    statusHistory: [
      {
        status: {
          type: String,
          enum: ['new', 'contacted', 'qualified', 'converted', 'closed', 'spam'],
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'AdminUser',
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        note: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ===================================
// Indexes
// ===================================

// Time-sorted listing (admin panel default view)
leadSchema.index({ createdAt: -1 });

// Compound: filter by website + status (most common admin query)
leadSchema.index({ website: 1, status: 1, createdAt: -1 });

// Search on name and email
leadSchema.index({ name: 'text', email: 'text', company: 'text' });

// Duplicate detection
leadSchema.index({ email: 1, website: 1, createdAt: -1 });

// Spam filtering
leadSchema.index({ isSpam: 1, createdAt: -1 });

// IP-based rate tracking
leadSchema.index({ ipAddress: 1, createdAt: -1 });

// ===================================
// Static Methods
// ===================================

/**
 * Check for duplicate submission (same email + website within a time window)
 * @param {string} email
 * @param {string} websiteId
 * @param {number} windowMinutes - Dedup window in minutes (default 10)
 * @returns {boolean} true if duplicate exists
 */
leadSchema.statics.isDuplicate = async function (email, websiteId, windowMinutes = 10) {
  const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000);
  const existing = await this.findOne({
    email: email.toLowerCase(),
    website: websiteId,
    createdAt: { $gte: cutoff },
  });
  return !!existing;
};

/**
 * Count submissions from an IP within a time window
 * @param {string} ip
 * @param {number} windowMinutes
 * @returns {number} submission count
 */
leadSchema.statics.countByIP = async function (ip, windowMinutes = 60) {
  const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000);
  return this.countDocuments({
    ipAddress: ip,
    createdAt: { $gte: cutoff },
  });
};

/**
 * Run spam scoring on a lead document
 * Returns a score 0-100 and reasons array
 */
leadSchema.statics.calculateSpamScore = function (leadData) {
  let score = 0;
  const reasons = [];

  // Check for URLs in name
  if (/https?:\/\/|www\./i.test(leadData.name || '')) {
    score += 30;
    reasons.push('URL detected in name');
  }

  // Check for excessive URLs in message
  const urlCount = ((leadData.message || '').match(/https?:\/\//gi) || []).length;
  if (urlCount > 2) {
    score += 25;
    reasons.push(`Excessive URLs in message (${urlCount})`);
  }

  // Check for common spam patterns
  const spamPatterns = [
    /\b(viagra|cialis|casino|lottery|winner|prince|crypto\s*invest|earn\s*\$|click\s*here|act\s*now|limited\s*time)\b/i,
  ];
  const combinedText = `${leadData.name} ${leadData.message} ${leadData.company}`;
  for (const pattern of spamPatterns) {
    if (pattern.test(combinedText)) {
      score += 30;
      reasons.push('Spam keywords detected');
      break;
    }
  }

  // Suspicious email patterns (temp mail domains)
  const tempDomains = [
    'tempmail.com', 'throwaway.email', 'guerrillamail.com',
    'mailinator.com', 'yopmail.com', 'trashmail.com',
    'sharklasers.com', 'guerrillamailblock.com',
  ];
  const emailDomain = (leadData.email || '').split('@')[1] || '';
  if (tempDomains.includes(emailDomain.toLowerCase())) {
    score += 25;
    reasons.push('Temporary email domain');
  }

  // Very short message (potential bot)
  if (leadData.message && leadData.message.length < 5 && leadData.message.length > 0) {
    score += 10;
    reasons.push('Suspiciously short message');
  }

  // All caps name or message
  if (leadData.name && leadData.name === leadData.name.toUpperCase() && leadData.name.length > 3) {
    score += 10;
    reasons.push('Name is all uppercase');
  }

  // Phone number in name/message (potential spam)
  if (/\+?\d{10,}/.test(leadData.name || '')) {
    score += 15;
    reasons.push('Phone number in name field');
  }

  return { score: Math.min(score, 100), reasons };
};

// ===================================
// Instance Methods
// ===================================

/**
 * Add a status history entry
 */
leadSchema.methods.addStatusChange = function (newStatus, userId, note = '') {
  this.statusHistory.push({
    status: newStatus,
    changedBy: userId,
    changedAt: new Date(),
    note,
  });
  this.status = newStatus;
};

/**
 * Mark as spam
 */
leadSchema.methods.markAsSpam = function (userId) {
  this.isSpam = true;
  this.status = 'spam';
  this.addStatusChange('spam', userId, 'Marked as spam by admin');
};

module.exports = mongoose.model('Lead', leadSchema);
