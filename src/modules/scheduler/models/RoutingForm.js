const mongoose = require('mongoose');
const slugify = require('slugify');

// ===================================
// RoutingForm — pre-booking conditional flow
// ===================================
// Public URL: /route/:slug → renders questions → POST answers →
// rule engine evaluates → redirects to EventType slug OR external URL.
//
// rules:
//   Ordered array. First matching rule wins. Each rule is an array of
//   conditions (AND'd) over `answers[questionKey]`.
//
//   conditions[].op:
//     equals | not_equals | contains | greater_than | less_than | includes_any
//
//   target:
//     { type: 'event_type', eventTypeSlug }  → /book/<eventTypeSlug>
//     { type: 'url', url }                    → external redirect
//
// fallback:
//   Target used when no rule matches. Same shape as `rules[].target`.

const conditionSchema = new mongoose.Schema(
  {
    questionKey: { type: String, required: true, maxlength: 80 },
    op: {
      type: String,
      enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'includes_any'],
      required: true,
    },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const targetSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['event_type', 'url'], required: true },
    eventTypeSlug: { type: String, default: null },
    url: { type: String, default: null, maxlength: 2048 },
  },
  { _id: false }
);

const ruleSchema = new mongoose.Schema(
  {
    label: { type: String, default: '', maxlength: 200 },
    conditions: { type: [conditionSchema], default: [] },
    target: { type: targetSchema, required: true },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, maxlength: 80 }, // stable identifier — rules reference this
    label: { type: String, required: true, maxlength: 240 },
    type: {
      type: String,
      enum: ['short_text', 'long_text', 'select', 'multi_select', 'number', 'boolean'],
      default: 'short_text',
    },
    options: { type: [String], default: [] },
    isRequired: { type: Boolean, default: false },
    placeholder: { type: String, default: '' },
    helpText: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const routingFormSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Website', required: true, index: true },
    name: { type: String, required: true, maxlength: 240, trim: true },
    slug: { type: String, required: true, lowercase: true, index: true },
    description: { type: String, default: '', maxlength: 2000 },
    questions: { type: [questionSchema], default: [] },
    rules: { type: [ruleSchema], default: [] },
    fallback: { type: targetSchema, default: null },
    isActive: { type: Boolean, default: true, index: true },
    deletedAt: { type: Date, default: null, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  },
  { timestamps: true }
);

// Unique slug per tenant — partial on deletedAt:null (slug released on archive)
routingFormSchema.index(
  { tenant: 1, slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

routingFormSchema.pre('validate', function (next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('RoutingForm', routingFormSchema);
