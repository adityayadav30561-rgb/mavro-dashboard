const express = require('express');
const router = express.Router();
const {
  login,
  register,
  getMe,
  updatePassword,
  getAllUsers,
  updateUser,
  deleteUser,
} = require('../controllers/authController');
const { protect, authorize, loginRules, registerRules, mongoIdParam, validate } = require('../middleware');

// Public
router.post('/login', loginRules, validate, login);

// Protected
router.get('/me', protect, getMe);
router.put('/password', protect, updatePassword);

// Superadmin only — user management
router.post('/register', protect, authorize('superadmin'), registerRules, validate, register);
router.get('/users', protect, authorize('superadmin'), getAllUsers);
router.put('/users/:id', protect, authorize('superadmin'), mongoIdParam, validate, updateUser);
router.delete('/users/:id', protect, authorize('superadmin'), mongoIdParam, validate, deleteUser);

module.exports = router;
