const { Workflow } = require('../models');
const { asyncHandler, ApiResponse } = require('../../../utils');
const { assertTenantAccess } = require('../utils/tenantGuard');

// ===================================
// Workflow controller — admin CRUD (foundation only)
// ===================================
// Phase 1 lets admins define workflows. Execution (BullMQ) lands Phase 3 —
// see services/workflowService.js for the runtime design notes.

const listWorkflows = asyncHandler(async (req, res) => {
  const filter = {};
  const accessibleIds = req.user.getAccessibleWebsiteIds();
  if (accessibleIds !== null) filter.tenant = { $in: accessibleIds };
  if (req.query.tenant) filter.tenant = req.query.tenant;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.trigger) filter.trigger = req.query.trigger;
  const workflows = await Workflow.find(filter)
    .populate('tenant', 'name slug')
    .populate('eventType', 'name slug')
    .sort({ createdAt: -1 })
    .lean();
  return ApiResponse.success(res, { workflows });
});

const createWorkflow = asyncHandler(async (req, res) => {
  await assertTenantAccess(req.user, req.body.tenant);
  const workflow = await Workflow.create({
    ...req.body,
    createdBy: req.user._id,
  });
  return ApiResponse.success(res, { workflow }, 'Workflow created', 201);
});

const getWorkflow = asyncHandler(async (req, res) => {
  const workflow = await Workflow.findById(req.params.id)
    .populate('tenant', 'name slug')
    .populate('eventType', 'name slug')
    .lean();
  if (!workflow) return ApiResponse.error(res, 'Workflow not found', 404);
  await assertTenantAccess(req.user, workflow.tenant._id || workflow.tenant);
  return ApiResponse.success(res, { workflow });
});

const updateWorkflow = asyncHandler(async (req, res) => {
  const workflow = await Workflow.findById(req.params.id);
  if (!workflow) return ApiResponse.error(res, 'Workflow not found', 404);
  await assertTenantAccess(req.user, workflow.tenant);
  delete req.body.tenant;
  Object.assign(workflow, req.body);
  await workflow.save();
  return ApiResponse.success(res, { workflow }, 'Workflow updated');
});

const deleteWorkflow = asyncHandler(async (req, res) => {
  const workflow = await Workflow.findById(req.params.id);
  if (!workflow) return ApiResponse.error(res, 'Workflow not found', 404);
  await assertTenantAccess(req.user, workflow.tenant);
  await Workflow.deleteOne({ _id: workflow._id });
  return ApiResponse.success(res, null, 'Workflow deleted');
});

module.exports = {
  listWorkflows,
  createWorkflow,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
};
