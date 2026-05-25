const { EventType, FormQuestion } = require('../models');
const { asyncHandler, ApiResponse } = require('../../../utils');
const { assertTenantAccess } = require('../utils/tenantGuard');

// ===================================
// FormQuestion controller — intake form builder
// ===================================
// All endpoints are nested under an event-type:
//   GET    /api/scheduler/event-types/:eventTypeId/questions
//   POST   /api/scheduler/event-types/:eventTypeId/questions
//   PUT    /api/scheduler/event-types/:eventTypeId/questions/:id
//   DELETE /api/scheduler/event-types/:eventTypeId/questions/:id
//   PUT    /api/scheduler/event-types/:eventTypeId/questions/reorder
//
// Tenant scoping flows through the parent EventType — we resolve the event
// type once, check tenant access, then operate within that scope.

const ALLOWED_TYPES = ['short_text', 'long_text', 'email', 'phone', 'select', 'multi_select', 'checkbox', 'number', 'url'];

async function loadEventTypeOrThrow(eventTypeId, user) {
  const ev = await EventType.findOne({ _id: eventTypeId, deletedAt: null });
  if (!ev) {
    const err = new Error('EventType not found');
    err.statusCode = 404;
    throw err;
  }
  await assertTenantAccess(user, ev.tenant);
  return ev;
}

const listQuestions = asyncHandler(async (req, res) => {
  const ev = await loadEventTypeOrThrow(req.params.eventTypeId, req.user);
  const questions = await FormQuestion.find({ eventType: ev._id })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();
  return ApiResponse.success(res, { questions });
});

function validateQuestionBody(body) {
  if (!body.label || typeof body.label !== 'string' || !body.label.trim()) {
    return 'label is required';
  }
  if (body.type && !ALLOWED_TYPES.includes(body.type)) return `invalid type: ${body.type}`;
  if (['select', 'multi_select'].includes(body.type)) {
    if (!Array.isArray(body.options) || body.options.length === 0) {
      return 'select/multi_select require at least one option';
    }
  }
  return null;
}

const createQuestion = asyncHandler(async (req, res) => {
  const ev = await loadEventTypeOrThrow(req.params.eventTypeId, req.user);
  const err = validateQuestionBody(req.body);
  if (err) return ApiResponse.error(res, err, 422);
  const last = await FormQuestion.findOne({ eventType: ev._id })
    .sort({ sortOrder: -1 })
    .select('sortOrder')
    .lean();
  const sortOrder = req.body.sortOrder != null ? req.body.sortOrder : (last ? last.sortOrder + 1 : 0);
  const question = await FormQuestion.create({
    tenant: ev.tenant,
    eventType: ev._id,
    label: req.body.label.trim(),
    placeholder: req.body.placeholder || '',
    helpText: req.body.helpText || '',
    type: req.body.type || 'short_text',
    options: Array.isArray(req.body.options) ? req.body.options : [],
    isRequired: !!req.body.isRequired,
    sortOrder,
    validationRules: req.body.validationRules || {},
  });
  return ApiResponse.success(res, { question }, 'Question created', 201);
});

const updateQuestion = asyncHandler(async (req, res) => {
  const ev = await loadEventTypeOrThrow(req.params.eventTypeId, req.user);
  const question = await FormQuestion.findOne({ _id: req.params.id, eventType: ev._id });
  if (!question) return ApiResponse.error(res, 'Question not found', 404);
  const err = validateQuestionBody({ ...question.toObject(), ...req.body });
  if (err) return ApiResponse.error(res, err, 422);

  const editable = ['label', 'placeholder', 'helpText', 'type', 'options', 'isRequired', 'sortOrder', 'validationRules'];
  for (const k of editable) if (k in req.body) question[k] = req.body[k];
  await question.save();
  return ApiResponse.success(res, { question }, 'Question updated');
});

const deleteQuestion = asyncHandler(async (req, res) => {
  const ev = await loadEventTypeOrThrow(req.params.eventTypeId, req.user);
  const result = await FormQuestion.deleteOne({ _id: req.params.id, eventType: ev._id });
  if (!result.deletedCount) return ApiResponse.error(res, 'Question not found', 404);
  return ApiResponse.success(res, null, 'Question deleted');
});

// Bulk reorder — body: { order: [questionId, questionId, ...] }
const reorderQuestions = asyncHandler(async (req, res) => {
  const ev = await loadEventTypeOrThrow(req.params.eventTypeId, req.user);
  const order = Array.isArray(req.body.order) ? req.body.order : [];
  if (!order.length) return ApiResponse.error(res, 'order array required', 422);
  // Tenant-scoped bulk update — we only touch questions belonging to this event type.
  const ops = order.map((id, idx) => ({
    updateOne: {
      filter: { _id: id, eventType: ev._id },
      update: { $set: { sortOrder: idx } },
    },
  }));
  await FormQuestion.bulkWrite(ops);
  const questions = await FormQuestion.find({ eventType: ev._id }).sort({ sortOrder: 1 }).lean();
  return ApiResponse.success(res, { questions }, 'Order updated');
});

module.exports = {
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
};
