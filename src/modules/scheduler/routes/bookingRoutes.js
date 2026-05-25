const express = require('express');
const router = express.Router();
const {
  listBookings,
  getBooking,
  cancelBookingAdmin,
} = require('../controllers/bookingController');
const { protect } = require('../../../middleware');
const { validate, mongoIdParam } = require('../validators');

router.use(protect);

router.get('/', listBookings);
router.get('/:id', mongoIdParam, validate, getBooking);
router.post('/:id/cancel', mongoIdParam, validate, cancelBookingAdmin);

module.exports = router;
