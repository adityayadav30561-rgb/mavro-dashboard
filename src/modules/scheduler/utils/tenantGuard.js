const { Website } = require('../../../models');

// ===================================
// Tenant ownership enforcement helpers
// ===================================
// Scheduler entities are tenant-scoped via the `tenant` ObjectId FK (→ Website).
// Two enforcement points:
//
//   1. INBOUND — when a route accepts a `tenant` ID from the request body /
//      query, never trust it. Resolve the user's accessible website IDs from
//      JWT-attached user (req.user.getAccessibleWebsiteIds()) and reject
//      anything outside that set. See assertTenantAccess.
//
//   2. OUTBOUND — when serializing entities, ensure the `tenant` field
//      hasn't been mutated to point at a tenant the caller doesn't own.
//      Mongoose validation alone isn't enough; controllers must call
//      assertEntityTenant before any sensitive operation.
//
// Both helpers throw on violation — controllers wrap with asyncHandler so the
// error bubbles to the global error handler with a structured 403 response.

class TenantAccessError extends Error {
  constructor(message = 'Tenant access denied') {
    super(message);
    this.statusCode = 403;
    this.name = 'TenantAccessError';
  }
}

async function assertTenantAccess(user, tenantId) {
  if (!user) throw new TenantAccessError('Authentication required');
  if (!tenantId) throw new TenantAccessError('tenant is required');
  const accessibleIds = user.getAccessibleWebsiteIds();
  // null = superadmin (full access)
  if (accessibleIds === null) {
    // Still verify the tenant exists so we don't write orphan rows.
    const exists = await Website.exists({ _id: tenantId });
    if (!exists) throw new TenantAccessError('Tenant not found');
    return;
  }
  const allowed = accessibleIds.some((id) => String(id) === String(tenantId));
  if (!allowed) throw new TenantAccessError('You do not have access to this tenant');
}

function assertEntityTenant(entity, expectedTenantId) {
  if (!entity) throw new TenantAccessError('Entity not found');
  if (String(entity.tenant) !== String(expectedTenantId)) {
    throw new TenantAccessError('Entity does not belong to this tenant');
  }
}

module.exports = {
  assertTenantAccess,
  assertEntityTenant,
  TenantAccessError,
};
