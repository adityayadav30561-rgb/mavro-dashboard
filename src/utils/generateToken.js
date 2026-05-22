const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generate JWT token for a user
 * @param {Object} user - User object with _id and role
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expire,
    }
  );
};

module.exports = generateToken;
