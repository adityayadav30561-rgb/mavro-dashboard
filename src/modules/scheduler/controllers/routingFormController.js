const { RoutingForm, EventType } = require('../models');
const { Website } = require('../../../models');
const { asyncHandler, ApiResponse } = require('../../../utils');
const { assertTenantAccess } = require('../utils/tenantGuard');
const { evaluateRouting, RoutingRuleError } = require('../services/routingRuleEvaluator');
const analytics = require('../utils/analytics');

// ===================================
// RoutingForm controller — admin CRUD + public evaluate
// ===================================

const EDITABLE = ['name', 'description', 'questions', 'rules', 'fallback', 'isActive'];

const listForms = asyncHandler(async (req, res) => {
  const filter = { deletedAt: null };
  const accessibleIds = req.user.getAccessibleWebsiteIds();
  if (accessibleIds !== null) filter.tenant = { $in: accessibleIds };
  if (req.query.tenant) filter.tenant = req.query.tenant;
  const forms = await RoutingForm.find(filter)
    .populate('tenant', 'name slug').sort({ updatedAt: -1 }).lean();
  return ApiResponse.success(res, { forms });
});

const createForm = asyncHandler(async (req, res) => {
  const { tenant } = req.body;
  await assertTenantAccess(req.user, tenant);
  if (!req.body.name) return ApiResponse.error(res, 'name is required', 422);
  const form = await RoutingForm.create({
    tenant,
    name: req.body.name,
    description: req.body.description || '',
    questions: req.body.questions || [],
    rules: req.body.rules || [],
    fallback: req.body.fallback || null,
    isActive: req.body.isActive !== false,
    createdBy: req.user._id,
  });
  return ApiResponse.success(res, { form }, 'Routing form created', 201);
});

const getForm = asyncHandler(async (req, res) => {
  const form = await RoutingForm.findOne({ _id: req.params.id, deletedAt: null })
    .populate('tenant', 'name slug').lean();
  if (!form) return ApiResponse.error(res, 'Routing form not found', 404);
  await assertTenantAccess(req.user, form.tenant._id || form.tenant);
  return ApiResponse.success(res, { form });
});

const updateForm = asyncHandler(async (req, res) => {
  const form = await RoutingForm.findOne({ _id: req.params.id, deletedAt: null });
  if (!form) return ApiResponse.error(res, 'Routing form not found', 404);
  await assertTenantAccess(req.user, form.tenant);
  for (const k of EDITABLE) if (k in req.body) form[k] = req.body[k];
  try {
    await form.save();
  } catch (e) {
    if (e.code === 11000) return ApiResponse.error(res, 'Slug collision', 409);
    throw e;
  }
  return ApiResponse.success(res, { form }, 'Updated');
});

const deleteForm = asyncHandler(async (req, res) => {
  const form = await RoutingForm.findOne({ _id: req.params.id, deletedAt: null });
  if (!form) return ApiResponse.error(res, 'Routing form not found', 404);
  await assertTenantAccess(req.user, form.tenant);
  form.deletedAt = new Date();
  form.isActive = false;
  await form.save();
  return ApiResponse.success(res, null, 'Archived');
});

// ----- Public surface -----

const getPublicForm = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  // Lookup ALL active forms by slug across tenants — slug+tenant pair is unique.
  // Public URL `/route/:slug` is only useful when the slug is globally unique,
  // OR when the standalone tenant frontend supplies tenant context. We honor
  // `?tenant=<slug>` for disambiguation.
  const tenantSlug = req.query.tenant || null;
  let filter = { slug, isActive: true, deletedAt: null };
  if (tenantSlug) {
    const tenant = await Website.findOne({ slug: tenantSlug, status: 'active' }).select('_id name slug').lean();
    if (!tenant) return ApiResponse.error(res, 'Tenant not found', 404);
    filter.tenant = tenant._id;
  }
  const form = await RoutingForm.findOne(filter).populate('tenant', 'name slug').lean();
  if (!form) return ApiResponse.error(res, 'Routing form not found', 404);
  // Strip rules from public surface — only questions go to invitee. Server
  // evaluates the rules during /evaluate.
  return ApiResponse.success(res, {
    form: {
      slug: form.slug,
      name: form.name,
      description: form.description,
      tenant: form.tenant ? { name: form.tenant.name, slug: form.tenant.slug } : null,
      questions: (form.questions || []).slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    },
  });
});

const evaluatePublicForm = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const tenantSlug = req.query.tenant || null;
  const filter = { slug, isActive: true, deletedAt: null };
  if (tenantSlug) {
    const tenant = await Website.findOne({ slug: tenantSlug, status: 'active' }).select('_id').lean();
    if (!tenant) return ApiResponse.error(res, 'Tenant not found', 404);
    filter.tenant = tenant._id;
  }
  const form = await RoutingForm.findOne(filter).lean();
  if (!form) return ApiResponse.error(res, 'Routing form not found', 404);

  let result;
  try {
    result = evaluateRouting(form, req.body && req.body.answers);
  } catch (err) {
    if (err instanceof RoutingRuleError) return ApiResponse.error(res, err.message, err.statusCode || 422);
    throw err;
  }

  // Resolve event_type targets to a bookable URL form `/book/<slug>` so the
  // client doesn't have to know the URL shape.
  let resolvedTarget = result.target;
  if (resolvedTarget && resolvedTarget.type === 'event_type') {
    const ev = await EventType.findOne({
      tenant: form.tenant,
      slug: resolvedTarget.eventTypeSlug,
      isActive: true,
      isPublic: true,
      deletedAt: null,
    }).select('slug').lean();
    if (!ev) {
      // Fall through silently; client shows generic "no route" message
      resolvedTarget = null;
    }
  }

  analytics.emit({
    action: 'routing_form_completed',
    tenantId: form.tenant,
    userId: null,
    meta: { formSlug: form.slug, matched: !!result.matched, target: resolvedTarget ? resolvedTarget.type : null },
  });

  return ApiResponse.success(res, {
    target: resolvedTarget,
    matched: !!result.matched,
    ruleLabel: result.matched ? result.matched.label : null,
  });
});

module.exports = {
  listForms,
  createForm,
  getForm,
  updateForm,
  deleteForm,
  getPublicForm,
  evaluatePublicForm,
};
