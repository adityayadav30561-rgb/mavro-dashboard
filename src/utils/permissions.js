// ===================================
// Editorial Permissions Scaffold
// ===================================
// Single source of truth for role → capability mapping. Used by new
// editorial endpoints (assign, approve, request-revision, reject) without
// hardcoding role checks at each callsite. Older endpoints still use the
// `authorize()` middleware; this is the path forward for richer RBAC.
//
// Design: pure data + a `can(user, action, ctx)` helper. Tenant scoping
// can be layered later by extending `ctx` with `tenantId`.

const CAPABILITIES = {
  superadmin: ['*'],
  admin: [
    'blog.create', 'blog.update', 'blog.delete', 'blog.publish',
    'blog.assign', 'blog.approve', 'blog.request-revision', 'blog.reject',
    'campaign.create', 'campaign.update', 'campaign.delete',
    'workflow.transition.*',
  ],
  seo_manager: [
    'blog.update', 'blog.approve', 'blog.request-revision',
    'workflow.transition.review', 'workflow.transition.scheduled',
    'campaign.update',
  ],
  reviewer: [
    'blog.update', 'blog.approve', 'blog.request-revision', 'blog.reject',
    'workflow.transition.review', 'workflow.transition.scheduled',
  ],
  writer: [
    'blog.create', 'blog.update.own',
    'workflow.transition.drafting', 'workflow.transition.review',
  ],
  editor: [
    'blog.create', 'blog.update', 'blog.publish',
    'workflow.transition.*',
  ],
};

function can(user, action) {
  if (!user || !action) return false;
  const caps = CAPABILITIES[user.role] || [];
  if (caps.includes('*')) return true;
  if (caps.includes(action)) return true;
  // wildcard prefix match (e.g. 'workflow.transition.*' covers 'workflow.transition.review')
  for (const c of caps) {
    if (c.endsWith('.*') && action.startsWith(c.slice(0, -1))) return true;
  }
  return false;
}

// Express middleware variant
function requireCapability(action) {
  return (req, res, next) => {
    if (can(req.user, action)) return next();
    return res.status(403).json({ success: false, message: `Forbidden — requires ${action}` });
  };
}

module.exports = { CAPABILITIES, can, requireCapability };
