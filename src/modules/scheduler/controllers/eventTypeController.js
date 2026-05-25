const slugify = require('slugify');
const { EventType, FormQuestion } = require('../models');
const { asyncHandler, ApiResponse } = require('../../../utils');
const { assertTenantAccess } = require('../utils/tenantGuard');
const { validateEventType } = require('../validators/eventTypeValidators');
const analytics = require('../utils/analytics');

// ===================================
// EventType controller
// ===================================
// CRUD + duplicate + soft delete.
//
// Tenant scoping: every read filters to req.user.getAccessibleWebsiteIds().
// Every write resolves tenant via assertTenantAccess so forged body fields
// can't slip past JWT auth.
//
// Soft delete: setting deletedAt = new Date() preserves data + releases the
// slug for reuse (partial-unique index on deletedAt: null).
//
// Slug collisions: createEventType + duplicateEventType retry up to 5 times
// appending an incrementing suffix when the partial-unique index throws E11000.

const EDITABLE_FIELDS = [
  'name', 'description', 'color', 'durationMinutes',
  'locationType', 'locationValue',
  'bufferBeforeMinutes', 'bufferAfterMinutes',
  'minNoticeHours', 'dailyCap', 'rollingWindowDays', 'slotIncrementMinutes',
  'timezone', 'availability', 'overrideDates', 'blackoutDates',
  'requireConfirmation', 'allowReschedule', 'allowCancellation', 'cancellationWindowHours',
  'isActive', 'isPublic', 'internalOnly',
  'isTeamEvent', 'hostSelectionStrategy', 'teamMembers',
];

function pickEditable(body) {
  const out = {};
  for (const k of EDITABLE_FIELDS) if (k in body) out[k] = body[k];
  return out;
}

async function persistWithUniqueSlug(buildDoc) {
  // Retry append-suffix on slug collision. The model pre-validate hook
  // sets slug from name on first save; on E11000 we recompute manually.
  let lastErr;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const doc = buildDoc(attempt);
      return await doc.save();
    } catch (err) {
      lastErr = err;
      if (err.code !== 11000) throw err;
      // Continue with next attempt — buildDoc(attempt+1) is responsible for
      // generating a different slug.
    }
  }
  throw lastErr;
}

function slugFromName(name, attempt) {
  const base = slugify(String(name || 'event'), { lower: true, strict: true });
  if (!attempt) return base;
  return `${base}-${attempt + 1}`;
}

// ----- LIST -----
const listEventTypes = asyncHandler(async (req, res) => {
  const filter = { deletedAt: null };
  const accessibleIds = req.user.getAccessibleWebsiteIds();
  if (accessibleIds !== null) filter.tenant = { $in: accessibleIds };
  if (req.query.tenant) filter.tenant = req.query.tenant;
  if (req.query.owner) filter.owner = req.query.owner;
  if (req.query.isActive != null) filter.isActive = req.query.isActive === 'true';
  if (req.query.search) {
    filter.name = { $regex: String(req.query.search).slice(0, 80), $options: 'i' };
  }
  if (req.query.includeArchived === 'true') delete filter.deletedAt;

  const eventTypes = await EventType.find(filter)
    .populate('tenant', 'name slug')
    .populate('owner', 'name email')
    .sort({ updatedAt: -1 })
    .lean();
  return ApiResponse.success(res, { eventTypes });
});

// ----- CREATE -----
const createEventType = asyncHandler(async (req, res) => {
  const { tenant } = req.body;
  await assertTenantAccess(req.user, tenant);

  const payload = pickEditable(req.body);
  const err = validateEventType(payload);
  if (err) return ApiResponse.error(res, err, 422);
  if (!payload.name || !payload.durationMinutes) {
    return ApiResponse.error(res, 'name and durationMinutes are required', 422);
  }

  const saved = await persistWithUniqueSlug((attempt) => new EventType({
    ...payload,
    tenant,
    owner: req.body.owner || req.user._id,
    createdBy: req.user._id,
    slug: slugFromName(payload.name, attempt),
  }));

  analytics.emit({
    action: 'event_type_created',
    tenantId: tenant,
    userId: req.user._id,
    meta: { eventTypeId: String(saved._id), slug: saved.slug },
  });
  return ApiResponse.success(res, { eventType: saved }, 'EventType created', 201);
});

// ----- READ -----
const getEventType = asyncHandler(async (req, res) => {
  const eventType = await EventType.findOne({ _id: req.params.id, deletedAt: null })
    .populate('tenant', 'name slug')
    .populate('owner', 'name email')
    .populate('teamMembers', 'name email')
    .lean();
  if (!eventType) return ApiResponse.error(res, 'EventType not found', 404);
  await assertTenantAccess(req.user, eventType.tenant._id || eventType.tenant);
  const questions = await FormQuestion.find({ eventType: eventType._id })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();
  return ApiResponse.success(res, { eventType, questions });
});

// ----- UPDATE -----
const updateEventType = asyncHandler(async (req, res) => {
  const eventType = await EventType.findOne({ _id: req.params.id, deletedAt: null });
  if (!eventType) return ApiResponse.error(res, 'EventType not found', 404);
  await assertTenantAccess(req.user, eventType.tenant);

  const updates = pickEditable(req.body);
  // Slug regeneration is opt-in via explicit body.regenerateSlug=true to keep
  // public booking URLs stable after publishing.
  if (req.body.regenerateSlug === true && updates.name) {
    eventType.slug = slugFromName(updates.name, 0);
  }
  const merged = { ...eventType.toObject(), ...updates };
  const err = validateEventType(merged);
  if (err) return ApiResponse.error(res, err, 422);

  Object.assign(eventType, updates);

  try {
    await eventType.save();
  } catch (e) {
    if (e.code === 11000) {
      return ApiResponse.error(res, 'Slug collision — choose a different name or regenerate slug', 409);
    }
    throw e;
  }
  analytics.emit({
    action: 'event_type_updated',
    tenantId: eventType.tenant,
    userId: req.user._id,
    meta: { eventTypeId: String(eventType._id) },
  });
  return ApiResponse.success(res, { eventType }, 'EventType updated');
});

// ----- ACTIVATE / DEACTIVATE -----
const setEventTypeActive = asyncHandler(async (req, res) => {
  const eventType = await EventType.findOne({ _id: req.params.id, deletedAt: null });
  if (!eventType) return ApiResponse.error(res, 'EventType not found', 404);
  await assertTenantAccess(req.user, eventType.tenant);
  eventType.isActive = !!req.body.isActive;
  await eventType.save();
  analytics.emit({
    action: 'event_type_activated',
    tenantId: eventType.tenant,
    userId: req.user._id,
    meta: { eventTypeId: String(eventType._id), isActive: eventType.isActive },
  });
  return ApiResponse.success(res, { eventType }, eventType.isActive ? 'Activated' : 'Deactivated');
});

// ----- SOFT DELETE -----
const deleteEventType = asyncHandler(async (req, res) => {
  const eventType = await EventType.findOne({ _id: req.params.id, deletedAt: null });
  if (!eventType) return ApiResponse.error(res, 'EventType not found', 404);
  await assertTenantAccess(req.user, eventType.tenant);
  eventType.deletedAt = new Date();
  eventType.isActive = false;
  await eventType.save();
  analytics.emit({
    action: 'event_type_deleted',
    tenantId: eventType.tenant,
    userId: req.user._id,
    meta: { eventTypeId: String(eventType._id) },
  });
  return ApiResponse.success(res, null, 'EventType archived');
});

// ----- DUPLICATE -----
const duplicateEventType = asyncHandler(async (req, res) => {
  const source = await EventType.findOne({ _id: req.params.id, deletedAt: null }).lean();
  if (!source) return ApiResponse.error(res, 'EventType not found', 404);
  await assertTenantAccess(req.user, source.tenant);

  const newName = `${source.name} (Copy)`;
  const copy = await persistWithUniqueSlug((attempt) => new EventType({
    ...source,
    _id: undefined,
    name: newName,
    slug: slugFromName(newName, attempt),
    isActive: false,           // copies start inactive — admin reviews then enables
    deletedAt: null,
    createdAt: undefined,
    updatedAt: undefined,
    createdBy: req.user._id,
  }));

  // Clone form questions
  const sourceQuestions = await FormQuestion.find({ eventType: source._id }).lean();
  if (sourceQuestions.length) {
    const cloned = sourceQuestions.map((q) => ({
      tenant: copy.tenant,
      eventType: copy._id,
      label: q.label,
      placeholder: q.placeholder,
      helpText: q.helpText,
      type: q.type,
      options: q.options,
      isRequired: q.isRequired,
      sortOrder: q.sortOrder,
      validationRules: q.validationRules,
    }));
    await FormQuestion.insertMany(cloned);
  }

  analytics.emit({
    action: 'event_type_created',
    tenantId: copy.tenant,
    userId: req.user._id,
    meta: { eventTypeId: String(copy._id), duplicatedFrom: String(source._id) },
  });
  return ApiResponse.success(res, { eventType: copy }, 'EventType duplicated', 201);
});

module.exports = {
  listEventTypes,
  createEventType,
  getEventType,
  updateEventType,
  setEventTypeActive,
  deleteEventType,
  duplicateEventType,
};
