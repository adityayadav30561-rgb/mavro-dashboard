const mongoose = require('mongoose');

// ===================================
// FormQuestion — per-event-type intake question
// ===================================
// Booking flow shows these in addition to fixed name/email/timezone fields.
// Answers land on Booking.formAnswers keyed by question _id.
//
// `validationRules` is a free-form sub-object the booking submit validator
// reads — e.g. { minLength: 4, maxLength: 200, pattern: '^[A-Z]{3}-\\d{4}$' }.
// Phase 3 doesn't enforce these end-to-end; the editor saves them so the
// Phase 4 booking endpoint can pick them up without a migration.

const formQuestionSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Website',
      required: true,
      index: true,
    },
    eventType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EventType',
      required: true,
      index: true,
    },
    label: { type: String, required: true, trim: true, maxlength: 240 },
    placeholder: { type: String, default: '', maxlength: 240 },
    helpText: { type: String, default: '', maxlength: 500 },
    type: {
      type: String,
      enum: ['short_text', 'long_text', 'email', 'phone', 'select', 'multi_select', 'checkbox', 'number', 'url'],
      default: 'short_text',
    },
    options: { type: [String], default: [] }, // for select / multi_select
    isRequired: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0, index: true },
    validationRules: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

formQuestionSchema.index({ tenant: 1, eventType: 1, sortOrder: 1 });

module.exports = mongoose.model('FormQuestion', formQuestionSchema);
