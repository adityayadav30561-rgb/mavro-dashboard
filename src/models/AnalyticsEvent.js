const mongoose = require('mongoose');

// call_click / whatsapp_click / generate_lead mirror the GTM dataLayer events
// from spanbix-web's track.js — without them here, the backend mirror of those
// clicks was silently rejected by the enum (they existed only in GA4).
const ALLOWED_EVENTS = ['page_view', 'blog_view', 'form_submit', 'cta_click', 'call_click', 'whatsapp_click', 'generate_lead'];

const analyticsEventSchema = new mongoose.Schema(
  {
    websiteSlug: { type: String, required: true, index: true, lowercase: true, trim: true },
    eventType:   { type: String, required: true, enum: ALLOWED_EVENTS, index: true },
    page:        { type: String, required: true, trim: true, maxlength: 500 },
    sessionId:   { type: String, required: true, trim: true, maxlength: 64, index: true },
    ipAddress:   { type: String, default: null },
    referrer:    { type: String, default: null, maxlength: 1000 },
    deviceType:  { type: String, enum: ['desktop', 'tablet', 'mobile', 'bot', 'unknown'], default: 'unknown' },
    browser:     { type: String, default: null, maxlength: 100 },
    os:          { type: String, default: null, maxlength: 100 },
    userAgent:   { type: String, default: null, maxlength: 1000 },
    country:     { type: String, default: null, maxlength: 100 },
    // Flexible per-event payload: { ctaName, blogSlug, formId, leadId, ... }
    meta:        { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp:   { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// Compound indexes optimized for the dashboard aggregation queries
analyticsEventSchema.index({ websiteSlug: 1, timestamp: -1 });
analyticsEventSchema.index({ websiteSlug: 1, eventType: 1, timestamp: -1 });
analyticsEventSchema.index({ websiteSlug: 1, page: 1, timestamp: -1 });

// Optional TTL for raw events — 18 months. Aggregations can run before expiry.
analyticsEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 540 });

analyticsEventSchema.statics.ALLOWED_EVENTS = ALLOWED_EVENTS;

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);
