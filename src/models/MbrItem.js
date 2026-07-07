const mongoose = require('mongoose');

/**
 * Manual MBR workstream rows — the parts of the monthly report that can't be
 * auto-pulled (PPTs/videos made, SEO/dev task logs, other projects, manual/
 * LinkedIn leads). One document per row; `data` shape is defined per section
 * in src/config/mbrSections.js and rendered dynamically by the admin UI +
 * the Excel export.
 *
 * `period` is the report month key 'YYYY-MM'. Rows belong to the month they
 * were delivered in and appear in that month's dashboard view + export.
 */
const mbrItemSchema = new mongoose.Schema(
  {
    section: { type: String, required: true, index: true, trim: true, maxlength: 50 },
    period: {
      type: String,
      required: true,
      index: true,
      match: /^\d{4}-\d{2}$/,
    },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    order: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
  },
  { timestamps: true, versionKey: false }
);

mbrItemSchema.index({ section: 1, period: 1, order: 1 });

module.exports = mongoose.model('MbrItem', mbrItemSchema);
