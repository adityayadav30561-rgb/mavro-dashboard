const mongoose = require('mongoose');

// ===================================
// WebhookDelivery — outbound HTTP delivery audit
// ===================================
// One row per attempted webhook POST. Worker handler writes the row after
// every attempt — successful + failed alike — so admins can see exactly which
// receivers got the payload + which timed out.
//
// `deliveryId` is the same UUID we send in `X-Mavro-Delivery` so receivers
// can correlate their inbound log against this row when debugging.

const webhookDeliverySchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Website', required: true, index: true },
    workflow: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', default: null, index: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null, index: true },
    trigger: { type: String, default: null },
    url: { type: String, required: true, maxlength: 2048 },
    deliveryId: { type: String, default: null, index: true },
    status: {
      type: String,
      enum: ['pending', 'delivered', 'failed', 'invalid_url'],
      default: 'pending',
      index: true,
    },
    httpStatus: { type: Number, default: null },
    attempts: { type: Number, default: 1 },
    lastError: { type: String, default: null, maxlength: 500 },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

webhookDeliverySchema.index({ tenant: 1, createdAt: -1 });
webhookDeliverySchema.index({ tenant: 1, status: 1, createdAt: -1 });
webhookDeliverySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model('WebhookDelivery', webhookDeliverySchema);
