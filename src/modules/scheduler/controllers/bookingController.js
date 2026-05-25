const { Booking } = require('../models');
const { asyncHandler, ApiResponse } = require('../../../utils');
const { assertTenantAccess } = require('../utils/tenantGuard');

// ===================================
// Booking controller — admin list / detail / manual ops
// ===================================
// Public booking creation lives in publicBookingController. This controller
// is for authenticated admin/host operations only.

const listBookings = asyncHandler(async (req, res) => {
  const filter = {};
  const accessibleIds = req.user.getAccessibleWebsiteIds();
  if (accessibleIds !== null) filter.tenant = { $in: accessibleIds };
  if (req.query.tenant) filter.tenant = req.query.tenant;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.hostUser) filter.hostUser = req.query.hostUser;
  if (req.query.eventType) filter.eventType = req.query.eventType;
  if (req.query.from) filter.startTimeUtc = { ...filter.startTimeUtc, $gte: new Date(req.query.from) };
  if (req.query.to) filter.startTimeUtc = { ...filter.startTimeUtc, $lt: new Date(req.query.to) };
  const bookings = await Booking.find(filter)
    .populate('eventType', 'name slug durationMinutes')
    .populate('hostUser', 'name email')
    .populate('tenant', 'name slug')
    .sort({ startTimeUtc: -1 })
    .limit(Math.min(parseInt(req.query.limit, 10) || 100, 500))
    .lean();
  return ApiResponse.success(res, { bookings });
});

const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('eventType', 'name slug durationMinutes locationType locationValue')
    .populate('hostUser', 'name email')
    .populate('tenant', 'name slug')
    .lean();
  if (!booking) return ApiResponse.error(res, 'Booking not found', 404);
  await assertTenantAccess(req.user, booking.tenant._id || booking.tenant);
  return ApiResponse.success(res, { booking });
});

// Admin-side manual cancel (host cancels for invitee). Public cancel goes
// through publicBookingController via cancelToken.
const cancelBookingAdmin = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return ApiResponse.error(res, 'Booking not found', 404);
  await assertTenantAccess(req.user, booking.tenant);
  if (booking.status === 'cancelled') {
    return ApiResponse.error(res, 'Booking already cancelled', 400);
  }
  // TODO Phase 2: delegate to bookingService.cancelBooking so external calendar
  // sync + workflow dispatch run.
  booking.status = 'cancelled';
  booking.cancellationReason = req.body.reason || 'Cancelled by host';
  booking.cancelledAt = new Date();
  await booking.save();
  return ApiResponse.success(res, { booking }, 'Booking cancelled');
});

module.exports = {
  listBookings,
  getBooking,
  cancelBookingAdmin,
};
