const { WorkflowExecution, WebhookDelivery, Booking } = require('../models');
const { asyncHandler, ApiResponse } = require('../../../utils');
const { assertTenantAccess } = require('../utils/tenantGuard');
const { enqueue, JOB_NAMES } = require('../queue');
const analytics = require('../utils/analytics');

// ===================================
// Workflow operations — execution history, webhook delivery, replay
// ===================================

const listExecutions = asyncHandler(async (req, res) => {
  const filter = {};
  const accessibleIds = req.user.getAccessibleWebsiteIds();
  if (accessibleIds !== null) filter.tenant = { $in: accessibleIds };
  if (req.query.tenant) filter.tenant = req.query.tenant;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.workflow) filter.workflow = req.query.workflow;
  if (req.query.booking) filter.booking = req.query.booking;
  if (req.query.actionType) filter.actionType = req.query.actionType;
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
  const executions = await WorkflowExecution.find(filter)
    .populate('workflow', 'name trigger')
    .populate('booking', 'inviteeName inviteeEmail startTimeUtc status')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return ApiResponse.success(res, { executions });
});

const listWebhookDeliveries = asyncHandler(async (req, res) => {
  const filter = {};
  const accessibleIds = req.user.getAccessibleWebsiteIds();
  if (accessibleIds !== null) filter.tenant = { $in: accessibleIds };
  if (req.query.tenant) filter.tenant = req.query.tenant;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.workflow) filter.workflow = req.query.workflow;
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
  const deliveries = await WebhookDelivery.find(filter)
    .populate('workflow', 'name trigger')
    .populate('booking', 'inviteeName inviteeEmail')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return ApiResponse.success(res, { deliveries });
});

// Replay a workflow execution. Loads the original row + the parent Workflow
// step, re-enqueues a fresh `workflow_action` job with a NEW jobId so the
// idempotency dedup doesn't reject the replay.
const replayExecution = asyncHandler(async (req, res) => {
  const execution = await WorkflowExecution.findById(req.params.id);
  if (!execution) return ApiResponse.error(res, 'Execution not found', 404);
  await assertTenantAccess(req.user, execution.tenant);
  if (!execution.booking || !execution.workflow) {
    return ApiResponse.error(res, 'Execution missing booking/workflow link — cannot replay', 422);
  }
  const { Workflow } = require('../models');
  const wf = await Workflow.findById(execution.workflow).lean();
  if (!wf) return ApiResponse.error(res, 'Parent workflow no longer exists', 410);
  const step = (wf.actions || [])[execution.stepIndex];
  if (!step) return ApiResponse.error(res, 'Step no longer exists in workflow', 410);

  const replayId = `replay:${execution._id}:${Date.now()}`;
  const result = await enqueue(JOB_NAMES.WORKFLOW_ACTION, {
    workflowId: String(wf._id),
    stepIndex: execution.stepIndex,
    step,
    bookingId: String(execution.booking),
    trigger: execution.trigger || null,
  }, { jobId: replayId, attempts: 3 });

  analytics.emit({
    action: 'workflow_replayed',
    tenantId: execution.tenant,
    userId: req.user._id,
    meta: { executionId: String(execution._id), replayJobId: replayId, queued: result.queued },
  });

  return ApiResponse.success(res, { replay: result, jobId: replayId }, 'Replay queued');
});

// Provider retry — admin button for "Sync to Google now"
const retryProvider = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return ApiResponse.error(res, 'Booking not found', 404);
  await assertTenantAccess(req.user, booking.tenant);
  const result = await enqueue(JOB_NAMES.PROVIDER_RETRY, { bookingId: String(booking._id) }, {
    jobId: `provider_retry_manual:${booking._id}:${Date.now()}`,
    attempts: 3,
  });
  analytics.emit({
    action: 'provider_retry_manual',
    tenantId: booking.tenant,
    userId: req.user._id,
    meta: { bookingId: String(booking._id) },
  });
  return ApiResponse.success(res, { queued: result }, 'Provider retry queued');
});

// Retry a failed webhook delivery — re-enqueues the webhook_delivery job
const retryWebhookDelivery = asyncHandler(async (req, res) => {
  const delivery = await WebhookDelivery.findById(req.params.id);
  if (!delivery) return ApiResponse.error(res, 'Delivery not found', 404);
  await assertTenantAccess(req.user, delivery.tenant);
  const result = await enqueue(JOB_NAMES.WEBHOOK_DELIVERY, {
    url: delivery.url,
    payload: { event: delivery.trigger || 'manual_retry', tenantId: String(delivery.tenant), retriedAt: new Date().toISOString() },
    meta: {
      tenantId: delivery.tenant,
      workflowId: delivery.workflow || null,
      bookingId: delivery.booking || null,
      trigger: delivery.trigger || null,
    },
  }, { jobId: `webhook_retry:${delivery._id}:${Date.now()}` });
  return ApiResponse.success(res, { queued: result }, 'Webhook retry queued');
});

module.exports = {
  listExecutions,
  listWebhookDeliveries,
  replayExecution,
  retryProvider,
  retryWebhookDelivery,
};
