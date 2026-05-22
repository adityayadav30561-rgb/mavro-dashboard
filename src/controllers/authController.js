const { AdminUser } = require('../models');
const { asyncHandler, generateToken, ApiResponse } = require('../utils');

/**
 * @desc    Login admin user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await AdminUser.findOne({ email })
    .select('+password')
    .populate('assignedWebsites', 'name slug domain status');

  if (!user) return ApiResponse.error(res, 'Invalid credentials', 401);
  if (!user.isActive) return ApiResponse.error(res, 'Account is deactivated', 403);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return ApiResponse.error(res, 'Invalid credentials', 401);

  // Update login tracking
  user.lastLogin = new Date();
  user.loginCount = (user.loginCount || 0) + 1;
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user);

  ApiResponse.success(res, {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      assignedWebsites: user.assignedWebsites,
    },
  }, 'Login successful');
});

/**
 * @desc    Register new admin user (with website assignments)
 * @route   POST /api/auth/register
 * @access  Private (superadmin only)
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, assignedWebsites } = req.body;

  const existingUser = await AdminUser.findOne({ email });
  if (existingUser) return ApiResponse.error(res, 'Email already registered', 400);

  // For non-superadmin roles, assignedWebsites should be provided
  if (role !== 'superadmin' && (!assignedWebsites || assignedWebsites.length === 0)) {
    return ApiResponse.error(res, 'Non-superadmin users must be assigned to at least one website', 400);
  }

  const user = await AdminUser.create({
    name,
    email,
    password,
    role: role || 'editor',
    assignedWebsites: role === 'superadmin' ? [] : (assignedWebsites || []),
  });

  const populated = await AdminUser.findById(user._id).populate('assignedWebsites', 'name slug domain');

  ApiResponse.created(res, {
    user: populated,
  }, 'Admin user created successfully');
});

/**
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await AdminUser.findById(req.user._id)
    .populate('assignedWebsites', 'name slug domain status');
  ApiResponse.success(res, { user });
});

/**
 * @desc    Update password
 * @route   PUT /api/auth/password
 * @access  Private
 */
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await AdminUser.findById(req.user._id).select('+password');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) return ApiResponse.error(res, 'Current password is incorrect', 400);

  user.password = newPassword;
  await user.save();

  const token = generateToken(user);
  ApiResponse.success(res, { token }, 'Password updated successfully');
});

/**
 * @desc    Get all admin users
 * @route   GET /api/auth/users
 * @access  Private (superadmin only)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await AdminUser.find()
    .populate('assignedWebsites', 'name slug domain')
    .sort({ createdAt: -1 });
  ApiResponse.success(res, { users, count: users.length });
});

/**
 * @desc    Update user (role, assignments, status)
 * @route   PUT /api/auth/users/:id
 * @access  Private (superadmin only)
 */
const updateUser = asyncHandler(async (req, res) => {
  const user = await AdminUser.findById(req.params.id);
  if (!user) return ApiResponse.notFound(res, 'User');

  // Prevent deactivating yourself
  if (req.params.id === req.user._id.toString() && req.body.isActive === false) {
    return ApiResponse.error(res, 'Cannot deactivate your own account', 400);
  }

  const { name, role, assignedWebsites, isActive } = req.body;
  if (name) user.name = name;
  if (role) user.role = role;
  if (assignedWebsites !== undefined) user.assignedWebsites = assignedWebsites;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save({ validateBeforeSave: false });

  const populated = await AdminUser.findById(user._id).populate('assignedWebsites', 'name slug domain');
  ApiResponse.success(res, { user: populated }, 'User updated');
});

/**
 * @desc    Delete user
 * @route   DELETE /api/auth/users/:id
 * @access  Private (superadmin only)
 */
const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return ApiResponse.error(res, 'Cannot delete your own account', 400);
  }
  const user = await AdminUser.findByIdAndDelete(req.params.id);
  if (!user) return ApiResponse.notFound(res, 'User');
  ApiResponse.success(res, null, 'User deleted');
});

module.exports = {
  login,
  register,
  getMe,
  updatePassword,
  getAllUsers,
  updateUser,
  deleteUser,
};
