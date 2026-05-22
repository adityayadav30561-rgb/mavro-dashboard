/**
 * Wraps async route handlers to catch errors
 * Eliminates need for try-catch in every controller
 *
 * @param {Function} fn - Async function to wrap
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
